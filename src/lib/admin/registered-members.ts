import "server-only";

import { formatApprovalDate, parseDateOnlyMs } from "@/lib/admin/airtable-dates";
import { getAirtableConfig } from "@/lib/admin/config";
import { VETTING_STATUS_APPROVED } from "@/lib/admin/government-id";
import { getPeopleTableName } from "@/lib/portal/airtable-people-referral";
import type { RegisteredMember } from "@/types/admin-registered-members";

export const MEMBERSTACK_ID_FIELD = "MemberStack ID";
export const REGISTERED_MEMBERS_LOAD_ERROR =
  "Unable to load registered members right now.";

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

const PEOPLE_LIST_FIELDS = [
  MEMBERSTACK_ID_FIELD,
  FULL_NAME_FIELD,
  PHONE_FIELD,
  EMAIL_FIELD,
  MEMBERSHIP_STATUS_FIELD,
] as const;

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

export type RegisteredMembersListResult =
  | { ok: true; members: RegisteredMember[] }
  | { ok: false; error: string };

export type RegisteredMembersCountResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

export function registeredMemberFilterFormula(): string {
  return `NOT({${MEMBERSTACK_ID_FIELD}} = '')`;
}

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

export function hasMemberStackId(value: unknown): boolean {
  return asTrimmedString(value) !== "";
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
  fields: Record<string, unknown>,
  ...names: string[]
): unknown {
  const keys = Object.keys(fields);
  for (const name of names) {
    const key = findFieldKey(keys, name);
    if (key) return fields[key];
  }
  return undefined;
}

async function queryTable(options: {
  table: string;
  fields?: string[];
  filterByFormula?: string;
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

  const encodedTable = encodeURIComponent(options.table);
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  try {
    do {
      const params = new URLSearchParams({ pageSize: "100" });
      if (options.filterByFormula) {
        params.set("filterByFormula", options.filterByFormula);
      }
      for (const field of options.fields ?? []) {
        params.append("fields[]", field);
      }
      if (offset) params.set("offset", offset);

      const requestUrl = `https://api.airtable.com/v0/${baseId}/${encodedTable}?${params.toString()}`;
      const response = await fetch(requestUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
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

async function fetchRegisteredPeopleRecords(
  fields?: string[],
): Promise<AirtableQueryResult> {
  const peopleTable = getPeopleTableName();
  const filterByFormula = registeredMemberFilterFormula();
  let result = await queryTable({
    table: peopleTable,
    fields,
    filterByFormula,
  });

  if (
    !result.ok &&
    fields &&
    fields.length > 0 &&
    (result.type === "UNKNOWN_FIELD_NAME" || result.status === 422)
  ) {
    result = await queryTable({
      table: peopleTable,
      filterByFormula,
    });
  }

  if (!result.ok) {
    console.error("[Dashboard] Registered members Airtable error", {
      status: result.status,
      type: result.type,
      message: result.message,
      table: peopleTable,
      field: MEMBERSTACK_ID_FIELD,
    });
  }

  return result;
}

function isRegisteredPeopleRecord(record: AirtableRecord): boolean {
  const fields = record.fields ?? {};
  return hasMemberStackId(fieldValue(fields, MEMBERSTACK_ID_FIELD));
}

async function fetchApprovalDatesByPeopleId(): Promise<Map<string, string>> {
  const dates = new Map<string, string>();
  const filterByFormula = `LOWER({${VETTING_STATUS_FIELD}})='${VETTING_STATUS_APPROVED}'`;
  const applicationFields = [
    LAST_MODIFIED_FIELD,
    LINKED_PERSON_FIELD,
    VETTING_STATUS_FIELD,
  ];

  let result = await queryTable({
    table: APPLICATIONS_TABLE,
    fields: applicationFields,
    filterByFormula,
  });

  if (
    !result.ok &&
    (result.type === "UNKNOWN_FIELD_NAME" || result.status === 422)
  ) {
    result = await queryTable({
      table: APPLICATIONS_TABLE,
      filterByFormula,
    });
  }

  if (!result.ok) {
    console.error("[Dashboard] Registered members approval-date lookup failed", {
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

function mapRegisteredMember(
  record: AirtableRecord,
  approvalDates: Map<string, string>,
): RegisteredMember {
  const fields = record.fields ?? {};
  const fullName = asSelectValue(fieldValue(fields, FULL_NAME_FIELD, NAME_FIELD));

  return {
    id: record.id,
    name: fullName,
    phone: asTrimmedString(fieldValue(fields, PHONE_FIELD)),
    email: asTrimmedString(fieldValue(fields, EMAIL_FIELD)),
    approvalDate: approvalDates.get(record.id) ?? "",
    membershipStatus: asSelectValue(fieldValue(fields, MEMBERSHIP_STATUS_FIELD)),
  };
}

export async function listRegisteredMembers(): Promise<RegisteredMembersListResult> {
  const [peopleResult, approvalDates] = await Promise.all([
    fetchRegisteredPeopleRecords([...PEOPLE_LIST_FIELDS]),
    fetchApprovalDatesByPeopleId(),
  ]);

  if (!peopleResult.ok) {
    return { ok: false, error: REGISTERED_MEMBERS_LOAD_ERROR };
  }

  const members = peopleResult.records
    .filter(isRegisteredPeopleRecord)
    .map((record) => mapRegisteredMember(record, approvalDates));

  return { ok: true, members };
}

export async function countRegisteredMembers(): Promise<RegisteredMembersCountResult> {
  const result = await fetchRegisteredPeopleRecords([MEMBERSTACK_ID_FIELD]);
  if (!result.ok) {
    return { ok: false, error: REGISTERED_MEMBERS_LOAD_ERROR };
  }

  return {
    ok: true,
    count: result.records.filter(isRegisteredPeopleRecord).length,
  };
}
