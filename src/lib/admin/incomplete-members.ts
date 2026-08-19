import "server-only";

import { cache } from "react";
import { formatApprovalDate, parseDateOnlyMs } from "@/lib/admin/airtable-dates";
import { getAirtableConfig } from "@/lib/admin/config";
import { VETTING_STATUS_APPROVED } from "@/lib/admin/government-id";
import {
  ONBOARDED_STATE_VALUE,
  ONBOARDING_STATE_FIELD,
} from "@/lib/admin/onboarded-members";
import { getPeopleTableName } from "@/lib/portal/airtable-people-referral";
import type { IncompleteMember } from "@/types/admin-incomplete-members";

export const INCOMPLETE_MEMBERS_LOAD_ERROR =
  "Unable to load incomplete members right now.";

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

export type IncompleteMembersListResult =
  | { ok: true; members: IncompleteMember[] }
  | { ok: false; error: string };

export type IncompleteMembersCountResult =
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
 * Inverse of Onboarded: not exactly "Completed".
 * Blank, missing, and any other value are Incomplete, matching Airtable
 * "Onboarding State is not Completed".
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

export function isIncompleteOnboardingState(value: unknown): boolean {
  return !isExactCompleted(value);
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

  try {
    while (pageCount < AIRTABLE_MAX_PAGES) {
      const params = new URLSearchParams({
        pageSize: String(AIRTABLE_PAGE_SIZE),
      });
      const query = params.toString();
      const offsetQuery = offset ? `&offset=${encodeURIComponent(offset)}` : "";
      const requestUrl = `https://api.airtable.com/v0/${baseId}/${encodedTable}?${query}${offsetQuery}`;

      let response: Response | undefined;
      for (let attempt = 0; attempt <= AIRTABLE_MAX_RETRIES; attempt += 1) {
        response = await fetch(requestUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
      for (const record of data.records) {
        if (record?.id) allRecords.push(record);
      }

      offset = data.offset;
      if (!offset) break;
    }

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

const loadIncompletePeople = cache(async function loadIncompletePeople(): Promise<
  AirtableQueryResult
> {
  const result = await queryAllPeopleRecords();
  if (!result.ok) {
    console.error("[Dashboard] Incomplete members Airtable error", {
      status: result.status,
      type: result.type,
      message: result.message,
      table: getPeopleTableName(),
    });
    return result;
  }

  return {
    ok: true,
    records: result.records.filter((record) =>
      isIncompleteOnboardingState(rawOnboardingState(record.fields)),
    ),
  };
});

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
  let pageCount = 0;

  try {
    while (pageCount < AIRTABLE_MAX_PAGES) {
      const params = new URLSearchParams({
        pageSize: String(AIRTABLE_PAGE_SIZE),
        filterByFormula: options.filterByFormula,
      });
      for (const field of options.fields ?? []) {
        params.append("fields[]", field);
      }
      const query = params.toString();
      const offsetQuery = offset ? `&offset=${encodeURIComponent(offset)}` : "";
      const requestUrl = `https://api.airtable.com/v0/${baseId}/${encodedTable}?${query}${offsetQuery}`;

      let response: Response | undefined;
      for (let attempt = 0; attempt <= AIRTABLE_MAX_RETRIES; attempt += 1) {
        response = await fetch(requestUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
      for (const record of data.records) {
        if (record?.id) records.push(record);
      }

      offset = data.offset;
      if (!offset) break;
    }

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
    console.error("[Dashboard] Incomplete members approval-date lookup failed", {
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

function mapIncompleteMember(
  record: AirtableRecord,
  approvalDates: Map<string, string>,
): IncompleteMember {
  const fields = record.fields ?? {};
  return {
    id: record.id,
    name: asSelectValue(fieldValue(fields, FULL_NAME_FIELD, NAME_FIELD)),
    phone: asTrimmedString(fieldValue(fields, PHONE_FIELD, "Phone Number")),
    email: asTrimmedString(fieldValue(fields, EMAIL_FIELD)),
    approvalDate: approvalDates.get(record.id) ?? "",
    membershipStatus: asSelectValue(fieldValue(fields, MEMBERSHIP_STATUS_FIELD)),
    onboardingState: asSelectValue(rawOnboardingState(fields)),
    missingStep: "",
  };
}

export async function listIncompleteMembers(): Promise<IncompleteMembersListResult> {
  const [peopleResult, approvalDates] = await Promise.all([
    loadIncompletePeople(),
    fetchApprovalDatesByPeopleId(),
  ]);

  if (!peopleResult.ok) {
    return { ok: false, error: INCOMPLETE_MEMBERS_LOAD_ERROR };
  }

  return {
    ok: true,
    members: peopleResult.records.map((record) =>
      mapIncompleteMember(record, approvalDates),
    ),
  };
}

export async function countIncompleteMembers(): Promise<IncompleteMembersCountResult> {
  const result = await loadIncompletePeople();
  if (!result.ok) {
    return { ok: false, error: INCOMPLETE_MEMBERS_LOAD_ERROR };
  }

  return {
    ok: true,
    count: result.records.length,
  };
}
