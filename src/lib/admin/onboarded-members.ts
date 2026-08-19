import "server-only";

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { formatApprovalDate, parseDateOnlyMs } from "@/lib/admin/airtable-dates";
import { getAirtableConfig } from "@/lib/admin/config";
import { VETTING_STATUS_APPROVED } from "@/lib/admin/government-id";
import { getPeopleTableName } from "@/lib/portal/airtable-people-referral";
import { getMemberByPeopleRecordId } from "@/lib/admin/recently-approved";
import type {
  OnboardedMember,
  OnboardedMemberDetail,
} from "@/types/admin-onboarded-members";

export const ONBOARDING_STATE_FIELD = "Onboarding State";
export const ONBOARDED_STATE_VALUE = "Completed";
export const ONBOARDED_MEMBERS_LOAD_ERROR =
  "Unable to load onboarded members right now.";

const APPLICATIONS_TABLE =
  process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";

const FULL_NAME_FIELD = "Full Name";
const NAME_FIELD = "Name";
const PHONE_FIELD = "Phone";
const EMAIL_FIELD = "Email";
const MEMBERSHIP_STATUS_FIELD = "Membership Status";
const VETTING_STATUS_FIELD = "Vetting Status";
const LAST_MODIFIED_FIELD = "Last Modified";
const LINKED_PERSON_FIELD = "Linked Person";

const AIRTABLE_PAGE_SIZE = 100;
const AIRTABLE_MAX_PAGES = 100;
const AIRTABLE_MAX_RETRIES = 5;

interface AirtableRecord {
  id: string;
  fields?: Record<string, unknown>;
}

interface AirtableListResponse {
  records?: AirtableRecord[];
  offset?: string;
  error?: { type?: string; message?: string };
}

type AirtableQueryResult =
  | { ok: true; records: AirtableRecord[] }
  | { ok: false; status: number; type: string | null; message: string };

export type OnboardedMembersListResult =
  | { ok: true; members: OnboardedMember[] }
  | { ok: false; error: string };

export type OnboardedMembersCountResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

function asTrimmedString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (Array.isArray(value) && value.length === 1) {
    return asTrimmedString(value[0]);
  }
  return "";
}

function isRecordId(value: string): boolean {
  return /^rec[a-zA-Z0-9]{10,}$/.test(value);
}

function recordIds(value: unknown): string[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => recordIds(item)))];
  }
  if (typeof value === "object") {
    const record = value as { id?: unknown; recordId?: unknown };
    return recordIds(record.id ?? record.recordId);
  }
  const single = asTrimmedString(value);
  if (isRecordId(single)) return [single];
  if (single.includes(",")) {
    return [
      ...new Set(
        single
          .split(",")
          .flatMap((part) => recordIds(part.trim()))
          .filter((id) => isRecordId(id)),
      ),
    ];
  }
  return [];
}

function findFieldKey(keys: string[], fieldName: string): string | undefined {
  return (
    keys.find((key) => key === fieldName) ||
    keys.find((key) => key.toLowerCase() === fieldName.toLowerCase())
  );
}

function asSelectValue(value: unknown): string {
  if (value == null || value === "") return "";
  if (Array.isArray(value) && value.length === 1) {
    return asSelectValue(value[0]);
  }
  if (typeof value === "object") {
    const record = value as { name?: unknown; label?: unknown };
    return asTrimmedString(record.name) || asTrimmedString(record.label);
  }
  return asTrimmedString(value);
}

function fieldValue(
  fields: Record<string, unknown> | undefined,
  ...names: string[]
): unknown {
  if (!fields) return undefined;
  const keys = Object.keys(fields);
  for (const name of names) {
    const key = findFieldKey(keys, name);
    if (key) return fields[key];
  }
  return undefined;
}

function rawOnboardingState(fields: Record<string, unknown> | undefined): unknown {
  if (!fields) return undefined;
  if (Object.prototype.hasOwnProperty.call(fields, ONBOARDING_STATE_FIELD)) {
    return fields[ONBOARDING_STATE_FIELD];
  }
  const key = findFieldKey(Object.keys(fields), ONBOARDING_STATE_FIELD);
  return key ? fields[key] : undefined;
}

/**
 * Count the same bucket as the un-normalized diagnostic:
 * String(value) === "Completed"
 *
 * Airtable returns a single-select as "Completed" and a lookup of that select
 * as ["Completed"]. Both stringify to "Completed". Do not lowercase or trim.
 */
function isExactCompleted(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (value === ONBOARDED_STATE_VALUE) return true;
  if (Array.isArray(value)) {
    return value.length === 1 && isExactCompleted(value[0]);
  }
  if (typeof value === "object") {
    const record = value as { name?: unknown; label?: unknown };
    return (
      record.name === ONBOARDED_STATE_VALUE ||
      record.label === ONBOARDED_STATE_VALUE
    );
  }
  return String(value) === ONBOARDED_STATE_VALUE;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryAllPeopleRecords(): Promise<AirtableQueryResult> {
  let accessToken: string;
  let baseId: string;
  try {
    ({ accessToken, baseId } = getAirtableConfig());
  } catch {
    return {
      ok: false,
      status: 503,
      type: "CONFIG",
      message: "Missing Airtable configuration",
    };
  }

  const table = getPeopleTableName();
  const encodedTable = encodeURIComponent(table);
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;
  let pageCount = 0;

  console.log("Airtable Base ID:", baseId);
  console.log("Airtable Table Name:", table);
  console.log("[Onboarded] People query", {
    table,
    view: null,
    filterByFormula: null,
    fieldsWhitelist: null,
    pageSize: AIRTABLE_PAGE_SIZE,
  });

  try {
    while (pageCount < AIRTABLE_MAX_PAGES) {
      const params = new URLSearchParams({
        pageSize: String(AIRTABLE_PAGE_SIZE),
      });
      const query = params.toString();
      const offsetQuery = offset ? `&offset=${offset}` : "";
      const requestUrl = `https://api.airtable.com/v0/${baseId}/${encodedTable}?${query}${offsetQuery}`;

      let response: Response | undefined;
      for (let attempt = 0; attempt <= AIRTABLE_MAX_RETRIES; attempt += 1) {
        response = await fetch(requestUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Masque-Airtable-Page": String(pageCount + 1),
          },
          cache: "no-store",
        });

        if (response.status !== 429) break;
        if (attempt === AIRTABLE_MAX_RETRIES) break;
        await sleep(500 * 2 ** attempt);
      }

      if (!response) {
        return {
          ok: false,
          status: 503,
          type: "NETWORK",
          message: "Missing Airtable response",
        };
      }

      if (!response.ok) {
        let type: string | null = null;
        let message = response.statusText;
        try {
          const body = (await response.json()) as AirtableListResponse;
          type = body.error?.type ?? null;
          message = body.error?.message || message;
        } catch {
          /* keep statusText */
        }
        return { ok: false, status: response.status, type, message };
      }

      const data = (await response.json()) as AirtableListResponse;
      if (!Array.isArray(data.records)) {
        return {
          ok: false,
          status: 502,
          type: "SHAPE",
          message: "Unexpected Airtable response",
        };
      }

      pageCount += 1;
      console.log(`Page ${pageCount} records:`, data.records.length);
      console.log("Onboarded Airtable offset:", data.offset ?? null);

      for (const record of data.records) {
        if (record?.id) allRecords.push(record);
      }

      offset = data.offset;
      if (!offset) break;
    }

    console.log("Total People fetched:", allRecords.length);
    console.log("Number of People records fetched:", allRecords.length);

    if (offset) {
      return {
        ok: false,
        status: 502,
        type: "PAGINATION",
        message: "Airtable pagination exceeded the page safety limit",
      };
    }

    return { ok: true, records: allRecords };
  } catch (error) {
    return {
      ok: false,
      status: 503,
      type: "NETWORK",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function resolveOnboardingFieldName(allPeople: AirtableRecord[]): string {
  let exactHits = 0;
  const onboardNames = new Map<string, number>();

  for (const record of allPeople) {
    const fields = record.fields ?? {};
    if (Object.prototype.hasOwnProperty.call(fields, ONBOARDING_STATE_FIELD)) {
      exactHits += 1;
    }
    for (const name of Object.keys(fields)) {
      if (/onboard/i.test(name)) {
        onboardNames.set(name, (onboardNames.get(name) || 0) + 1);
      }
    }
  }

  console.log("Field names containing onboard:", Object.fromEntries(onboardNames));

  if (exactHits > 0) return ONBOARDING_STATE_FIELD;
  if (onboardNames.size === 1) {
    const actual = [...onboardNames.keys()][0];
    console.log(
      '[Onboarded] Exact key "Onboarding State" was absent; using raw field name:',
      actual,
    );
    return actual;
  }

  return ONBOARDING_STATE_FIELD;
}

function logRawOnboardingDiagnostics(allPeople: AirtableRecord[]): {
  fieldName: string;
  counts: Record<string, number>;
  jsonCounts: Record<string, number>;
  exactCompleted: number;
} {
  const fieldName = resolveOnboardingFieldName(allPeople);

  console.log(
    allPeople.slice(0, 10).map((record) => ({
      id: record.id,
      name: record.fields?.[FULL_NAME_FIELD],
      onboardingState: record.fields?.[fieldName],
      allFieldNames: record.fields ? Object.keys(record.fields) : [],
    })),
  );

  const counts: Record<string, number> = {};
  const jsonCounts: Record<string, number> = {};

  for (const record of allPeople) {
    const value = record.fields?.[fieldName];
    const key = value == null ? "(blank)" : String(value);
    counts[key] = (counts[key] || 0) + 1;
    const jsonKey = value == null ? "(blank)" : JSON.stringify(value);
    jsonCounts[jsonKey] = (jsonCounts[jsonKey] || 0) + 1;
  }

  console.log("Onboarding State distribution:", counts);
  console.log("Onboarding State JSON distribution:", jsonCounts);

  const exactCompleted = allPeople.filter((record) =>
    isExactCompleted(record.fields?.[fieldName]),
  ).length;
  console.log("Exact Completed count:", exactCompleted);

  const sample = allPeople.slice(0, 10).map((record) => ({
    id: record.id,
    name: record.fields?.[FULL_NAME_FIELD],
    onboardingState: record.fields?.[fieldName],
    allFieldNames: record.fields ? Object.keys(record.fields) : [],
  }));

  void writeFile(
    path.join(process.cwd(), "onboarded-diagnostic-output.json"),
    JSON.stringify(
      {
        table: getPeopleTableName(),
        fieldName,
        totalPeople: allPeople.length,
        sample,
        counts,
        jsonCounts,
        exactCompleted,
      },
      null,
      2,
    ),
  ).catch(() => {
    /* diagnostics are also in console.log */
  });

  return { fieldName, counts, jsonCounts, exactCompleted };
}

const loadOnboardedPeople = cache(async function loadOnboardedPeople(): Promise<
  AirtableQueryResult
> {
  const result = await queryAllPeopleRecords();
  if (!result.ok) {
    console.error("[Dashboard] Onboarded members Airtable error", {
      status: result.status,
      type: result.type,
      message: result.message,
      table: getPeopleTableName(),
      view: null,
      filterByFormula: null,
      fieldsWhitelist: null,
    });
    return result;
  }

  const diagnostics = logRawOnboardingDiagnostics(result.records);

  return {
    ok: true,
    records: result.records.filter((record) =>
      isExactCompleted(record.fields?.[diagnostics.fieldName]),
    ),
  };
});

async function fetchApprovalDatesByPeopleId(): Promise<Map<string, string>> {
  const dates = new Map<string, string>();
  const filterByFormula = `LOWER({${VETTING_STATUS_FIELD}})='${VETTING_STATUS_APPROVED}'`;
  const applicationFields = [
    LAST_MODIFIED_FIELD,
    LINKED_PERSON_FIELD,
    VETTING_STATUS_FIELD,
  ];

  let result = await queryApplicationsForDates({
    fields: applicationFields,
    filterByFormula,
  });

  if (
    !result.ok &&
    (result.type === "UNKNOWN_FIELD_NAME" || result.status === 422)
  ) {
    result = await queryApplicationsForDates({ filterByFormula });
  }

  if (!result.ok) {
    console.error("[Dashboard] Onboarded members approval-date lookup failed", {
      status: result.status,
      type: result.type,
      message: result.message,
      table: APPLICATIONS_TABLE,
    });
    return dates;
  }

  const newestMs = new Map<string, number>();
  for (const record of result.records) {
    const fields = record.fields ?? {};
    const lastModifiedRaw = asTrimmedString(
      fieldValue(fields, LAST_MODIFIED_FIELD),
    );
    const approvalMs = parseDateOnlyMs(lastModifiedRaw);
    if (approvalMs == null) continue;
    const formatted = formatApprovalDate(lastModifiedRaw);
    if (!formatted) continue;

    for (const peopleId of recordIds(fieldValue(fields, LINKED_PERSON_FIELD))) {
      const previous = newestMs.get(peopleId);
      if (previous == null || approvalMs > previous) {
        newestMs.set(peopleId, approvalMs);
        dates.set(peopleId, formatted);
      }
    }
  }

  return dates;
}

async function queryApplicationsForDates(options: {
  fields?: string[];
  filterByFormula: string;
}): Promise<AirtableQueryResult> {
  let accessToken: string;
  let baseId: string;
  try {
    ({ accessToken, baseId } = getAirtableConfig());
  } catch {
    return {
      ok: false,
      status: 503,
      type: "CONFIG",
      message: "Missing Airtable configuration",
    };
  }

  const encodedTable = encodeURIComponent(APPLICATIONS_TABLE);
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  try {
    do {
      const params = new URLSearchParams({
        pageSize: String(AIRTABLE_PAGE_SIZE),
        filterByFormula: options.filterByFormula,
      });
      for (const field of options.fields ?? []) {
        params.append("fields[]", field);
      }
      const query = params.toString();
      const offsetQuery = offset ? `&offset=${offset}` : "";
      const requestUrl = `https://api.airtable.com/v0/${baseId}/${encodedTable}?${query}${offsetQuery}`;
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        let type: string | null = null;
        let message = response.statusText;
        try {
          const body = (await response.json()) as AirtableListResponse;
          type = body.error?.type ?? null;
          message = body.error?.message || message;
        } catch {
          /* keep statusText */
        }
        return { ok: false, status: response.status, type, message };
      }

      const data = (await response.json()) as AirtableListResponse;
      if (!Array.isArray(data.records)) {
        return {
          ok: false,
          status: 502,
          type: "SHAPE",
          message: "Unexpected Airtable response",
        };
      }

      for (const record of data.records) {
        if (record?.id) records.push(record);
      }

      offset = data.offset;
    } while (offset);

    return { ok: true, records };
  } catch (error) {
    return {
      ok: false,
      status: 503,
      type: "NETWORK",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function mapOnboardedMember(
  record: AirtableRecord,
  approvalDates: Map<string, string>,
): OnboardedMember {
  const fields = record.fields ?? {};
  const rawState = asSelectValue(rawOnboardingState(fields));
  return {
    id: record.id,
    name: asSelectValue(fieldValue(fields, FULL_NAME_FIELD, NAME_FIELD)),
    phone: asTrimmedString(fieldValue(fields, PHONE_FIELD)),
    email: asTrimmedString(fieldValue(fields, EMAIL_FIELD)),
    approvalDate: approvalDates.get(record.id) ?? "",
    onboardingState: rawState || ONBOARDED_STATE_VALUE,
    membershipStatus: asSelectValue(fieldValue(fields, MEMBERSHIP_STATUS_FIELD)),
  };
}

export async function listOnboardedMembers(): Promise<OnboardedMembersListResult> {
  const [peopleResult, approvalDates] = await Promise.all([
    loadOnboardedPeople(),
    fetchApprovalDatesByPeopleId(),
  ]);

  if (!peopleResult.ok) {
    return { ok: false, error: ONBOARDED_MEMBERS_LOAD_ERROR };
  }

  return {
    ok: true,
    members: peopleResult.records.map((record) =>
      mapOnboardedMember(record, approvalDates),
    ),
  };
}

export async function countOnboardedMembers(): Promise<OnboardedMembersCountResult> {
  const result = await loadOnboardedPeople();
  if (!result.ok) {
    return { ok: false, error: ONBOARDED_MEMBERS_LOAD_ERROR };
  }

  return {
    ok: true,
    count: result.records.length,
  };
}

const ONBOARDING_OUTSTANDING_LABELS = new Set([
  "Verification",
  "Member Agreement",
  "Portal Login",
  "ID Review",
  "ID Pending Review",
  "Agreement Pending",
  "Review Required",
  "Restriction Hold",
  "Data Quality Issue",
]);

function isOnboardingOrDataQualityOutstanding(item: string): boolean {
  const trimmed = item.trim();
  if (ONBOARDING_OUTSTANDING_LABELS.has(trimmed)) return true;
  return trimmed.toLowerCase().startsWith("onboarding");
}

function onboardingCompletedDateFromFields(
  fields: Record<string, unknown> | undefined,
): string {
  if (!fields) return "";
  const keys = Object.keys(fields);
  const exact =
    findFieldKey(keys, "Onboarding Completed Date") ||
    keys.find((key) => {
      const lower = key.toLowerCase();
      return (
        lower.includes("onboard") &&
        lower.includes("complet") &&
        lower.includes("date")
      );
    });
  if (!exact) return "";
  const raw = asTrimmedString(fields[exact]);
  return formatApprovalDate(raw) || raw;
}

async function fetchPeopleRecordById(
  recordId: string,
): Promise<AirtableRecord | null> {
  if (!isRecordId(recordId)) return null;

  let accessToken: string;
  let baseId: string;
  try {
    ({ accessToken, baseId } = getAirtableConfig());
  } catch {
    return null;
  }

  const table = getPeopleTableName();
  const requestUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`;

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as AirtableRecord & {
      error?: { type?: string; message?: string };
    };
    if (!data?.id) return null;
    return { id: data.id, fields: data.fields };
  } catch {
    return null;
  }
}

export const getOnboardedMemberByPeopleRecordId = cache(
  async function getOnboardedMemberByPeopleRecordId(
    routeId: string,
  ): Promise<OnboardedMemberDetail | null> {
    const member = await getMemberByPeopleRecordId(routeId);
    if (!member) return null;

    const peopleRecord = await fetchPeopleRecordById(member.id);
    const onboardingCompletedDate = onboardingCompletedDateFromFields(
      peopleRecord?.fields,
    );

    return {
      ...member,
      onboardingState: member.onboardingState?.trim() || ONBOARDED_STATE_VALUE,
      onboardingCompletedDate,
      outstandingItems: member.outstandingItems.filter(
        isOnboardingOrDataQualityOutstanding,
      ),
    };
  },
);
