import "server-only";

import {
  fetchAttendanceByPersonIds,
  type AttendanceByPersonResult,
} from "@/lib/admin/airtable-attendance";
import { getAirtableConfig } from "@/lib/admin/config";
import { VETTING_STATUS_APPROVED } from "@/lib/admin/government-id";
import { getPeopleTableName } from "@/lib/portal/airtable-people-referral";
import type { ConciergeMember } from "@/types/admin-concierge";

const APPLICATIONS_TABLE =
  process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";

const NAME_FIELD = "Name";
const VETTING_STATUS_FIELD = "Vetting Status";
const LAST_MODIFIED_FIELD = "Last Modified";
const LINKED_PERSON_FIELD = "Linked Person";

const APPLICATION_FIELDS = [
  NAME_FIELD,
  VETTING_STATUS_FIELD,
  LAST_MODIFIED_FIELD,
  LINKED_PERSON_FIELD,
] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 60;

interface AirtableRecord {
  id: string;
  fields?: Record<string, unknown>;
}

interface AirtableListResponse {
  records?: AirtableRecord[];
  offset?: string;
  error?: { type?: string; message?: string };
}

export type ListRecentlyApprovedResult =
  | { ok: true; members: ConciergeMember[] }
  | { ok: false; error: string; status: number };

type AirtableQueryResult =
  | { ok: true; records: AirtableRecord[] }
  | {
      ok: false;
      status: number;
      type: string | null;
      message: string;
    };

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
  if (!Array.isArray(value)) {
    const single = asTrimmedString(value);
    return isRecordId(single) ? [single] : [];
  }
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const record = item as { id?: unknown; recordId?: unknown };
        return asTrimmedString(record.id) || asTrimmedString(record.recordId);
      }
      return "";
    })
    .filter((id) => isRecordId(id));
}

function parseDateOnlyMs(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [year, month, day] = trimmed.slice(0, 10).split("-").map(Number);
    if (!year || !month || !day) return null;
    return Date.UTC(year, month - 1, day);
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return Date.UTC(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
  );
}

function formatApprovalDate(raw: string): string {
  const ms = parseDateOnlyMs(raw);
  if (ms == null) return "";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function displayOrDash(value: string): string {
  return value.trim() || "—";
}

function utcDateLabel(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function todayUtcMs(now = new Date()): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function peopleContactFromFields(fields: Record<string, unknown> | undefined): {
  email: string;
  phone: string;
} {
  if (!fields) return { email: "", phone: "" };
  const email = asTrimmedString(fields.Email);
  const keys = Object.keys(fields);
  const phoneKey =
    keys.find((key) => key === "Phone") ||
    keys.find((key) => key.toLowerCase() === "phone");
  const phone = phoneKey ? asTrimmedString(fields[phoneKey]) : "";
  return { email, phone };
}

function logAirtableError(
  label: string,
  details: {
    status: number | null;
    type: string | null;
    message: string;
    table: string;
    fields: string[];
    filterByFormula: string | null;
  },
) {
  console.error("Recently Approved Airtable error", {
    label,
    status: details.status,
    type: details.type,
    message: details.message,
    table: details.table,
    fields: details.fields,
    filterByFormula: details.filterByFormula,
  });
}

async function queryTable(options: {
  table: string;
  maxRecords?: number;
  fields?: string[];
  filterByFormula?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  paginate?: boolean;
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
      const params = new URLSearchParams({
        pageSize: String(Math.min(options.maxRecords ?? 100, 100)),
      });
      if (options.maxRecords && options.paginate === false) {
        params.set("maxRecords", String(options.maxRecords));
      }
      if (options.filterByFormula) {
        params.set("filterByFormula", options.filterByFormula);
      }
      for (const field of options.fields ?? []) {
        params.append("fields[]", field);
      }
      if (options.sortField) {
        params.append("sort[0][field]", options.sortField);
        params.append("sort[0][direction]", options.sortDirection ?? "desc");
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
        let message = "";
        try {
          const raw = await response.text();
          try {
            const payload = JSON.parse(raw) as AirtableListResponse;
            type = payload.error?.type ?? null;
            message = payload.error?.message ?? raw.slice(0, 300);
          } catch {
            message = raw.slice(0, 300);
          }
        } catch {
          message = "[unreadable]";
        }

        return { ok: false, status: response.status, type, message };
      }

      const data = (await response.json()) as AirtableListResponse;
      records.push(...(data.records ?? []));
      offset = options.paginate === false ? undefined : data.offset;
      if (options.maxRecords && records.length >= options.maxRecords) {
        return { ok: true, records: records.slice(0, options.maxRecords) };
      }
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

function escapeAirtableFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function fetchPeopleContactsByIds(
  ids: string[],
): Promise<{
  contacts: Map<string, { email: string; phone: string }>;
  failed: boolean;
}> {
  const unique = [...new Set(ids.filter((id) => isRecordId(id)))];
  const contacts = new Map<string, { email: string; phone: string }>();
  if (unique.length === 0) return { contacts, failed: false };

  const peopleTable = getPeopleTableName();
  let failed = false;

  for (let index = 0; index < unique.length; index += 20) {
    const chunk = unique.slice(index, index + 20);
    const formula =
      chunk.length === 1
        ? `RECORD_ID()='${escapeAirtableFormulaString(chunk[0])}'`
        : `OR(${chunk
            .map((id) => `RECORD_ID()='${escapeAirtableFormulaString(id)}'`)
            .join(",")})`;

    const result = await queryTable({
      table: peopleTable,
      filterByFormula: formula,
      paginate: true,
    });

    if (!result.ok) {
      failed = true;
      logAirtableError("People enrichment", {
        status: result.status,
        type: result.type,
        message: result.message,
        table: peopleTable,
        fields: [],
        filterByFormula: formula,
      });
      continue;
    }

    for (const record of result.records) {
      if (!record.id) continue;
      contacts.set(record.id, peopleContactFromFields(record.fields));
    }
  }

  return { contacts, failed };
}

/** Shape placeholders only. Do not display these as business statuses. */
function unresolvedConciergeFields(): Pick<
  ConciergeMember,
  | "attendance"
  | "berthaTicketPurchased"
  | "onboarding"
  | "concierge"
  | "outstandingItems"
  | "dataQualityIssues"
  | "fieldAvailability"
> {
  return {
    attendance: {
      hasEverAttended: false,
      lastEventAttended: "",
    },
    berthaTicketPurchased: false,
    onboarding: {
      verificationMethod: "Not Verified",
      memberAgreement: "Missing",
      portalAccountCreated: false,
      portalLoginCompleted: false,
    },
    concierge: {
      status: "Not Contacted",
      welcomeDate: "",
      lastContact: "",
      notes: "",
      escalation: "None",
    },
    outstandingItems: [],
    dataQualityIssues: [],
    fieldAvailability: {
      attendance: false,
      bertha: false,
      onboarding: false,
      conciergeStatus: false,
      outstandingItems: false,
    },
  };
}

function applyAttendance(
  member: ConciergeMember,
  personId: string | undefined,
  attendanceResult: AttendanceByPersonResult,
): ConciergeMember {
  if (!attendanceResult.ok || !personId) return member;
  const attendance = attendanceResult.byPerson.get(personId);
  if (!attendance) return member;
  return {
    ...member,
    attendance,
    fieldAvailability: {
      attendance: true,
      bertha: member.fieldAvailability?.bertha ?? false,
      onboarding: member.fieldAvailability?.onboarding ?? false,
      conciergeStatus: member.fieldAvailability?.conciergeStatus ?? false,
      outstandingItems: member.fieldAvailability?.outstandingItems ?? false,
    },
  };
}

/**
 * Applications with Vetting Status = approved whose Last Modified
 * (Vetting Status last-modified time) falls within the last 60 days.
 */
export async function listRecentlyApprovedMembers(): Promise<ListRecentlyApprovedResult> {
  const filterByFormula = `LOWER({${VETTING_STATUS_FIELD}})='${VETTING_STATUS_APPROVED}'`;

  try {
    let result = await queryTable({
      table: APPLICATIONS_TABLE,
      fields: [...APPLICATION_FIELDS],
      filterByFormula,
      sortField: LAST_MODIFIED_FIELD,
      sortDirection: "desc",
      paginate: true,
    });

    if (!result.ok) {
      logAirtableError("listRecentlyApprovedMembers sorted", {
        status: result.status,
        type: result.type,
        message: result.message,
        table: APPLICATIONS_TABLE,
        fields: [...APPLICATION_FIELDS],
        filterByFormula,
      });
      result = await queryTable({
        table: APPLICATIONS_TABLE,
        fields: [...APPLICATION_FIELDS],
        filterByFormula,
        paginate: true,
      });
    }

    if (!result.ok) {
      logAirtableError("listRecentlyApprovedMembers", {
        status: result.status,
        type: result.type,
        message: result.message,
        table: APPLICATIONS_TABLE,
        fields: [...APPLICATION_FIELDS],
        filterByFormula,
      });
      return {
        ok: false,
        error: "Unable to load recently approved members right now.",
        status: result.status === 429 ? 429 : result.status === 404 ? 404 : 503,
      };
    }

    const todayMs = todayUtcMs();
    const cutoffMs = todayMs - LOOKBACK_DAYS * MS_PER_DAY;
    const approvedCount = result.records.length;

    const recent = result.records
      .map((record) => {
        if (!record?.id) return null;
        const fields = record.fields ?? {};
        const lastModifiedRaw = asTrimmedString(fields[LAST_MODIFIED_FIELD]);
        const approvalMs = parseDateOnlyMs(lastModifiedRaw);
        if (approvalMs == null) return null;
        if (approvalMs < cutoffMs || approvalMs > todayMs) return null;
        return { record, fields, lastModifiedRaw, approvalMs };
      })
      .filter(
        (
          row,
        ): row is {
          record: AirtableRecord;
          fields: Record<string, unknown>;
          lastModifiedRaw: string;
          approvalMs: number;
        } => row != null,
      )
      .sort((left, right) => right.approvalMs - left.approvalMs);

    const peopleIds = [
      ...new Set(
        recent.flatMap((row) => recordIds(row.fields[LINKED_PERSON_FIELD])),
      ),
    ];
    const [enrichment, attendanceResult] = await Promise.all([
      fetchPeopleContactsByIds(peopleIds),
      fetchAttendanceByPersonIds(peopleIds),
    ]);

    console.error("[Recently Approved]", {
      approvedApplicationsRetrieved: approvedCount,
      cutoffDate: utcDateLabel(cutoffMs),
      remainingAfter60DayFilter: recent.length,
      peopleEnrichmentFailed: enrichment.failed,
      attendanceLookupFailed: !attendanceResult.ok,
    });

    const members = recent.map((row) => {
      const personId = recordIds(row.fields[LINKED_PERSON_FIELD])[0];
      const contact = personId ? enrichment.contacts.get(personId) : undefined;
      return applyAttendance(
        {
          id: row.record.id,
          name: displayOrDash(asTrimmedString(row.fields[NAME_FIELD])),
          phone: displayOrDash(contact?.phone ?? ""),
          email: displayOrDash(contact?.email ?? ""),
          approvalDate: formatApprovalDate(row.lastModifiedRaw),
          ...unresolvedConciergeFields(),
        },
        personId,
        attendanceResult,
      );
    });

    return { ok: true, members };
  } catch (error) {
    logAirtableError("listRecentlyApprovedMembers", {
      status: 503,
      type: "NETWORK",
      message: error instanceof Error ? error.message : String(error),
      table: APPLICATIONS_TABLE,
      fields: [...APPLICATION_FIELDS],
      filterByFormula,
    });
    return {
      ok: false,
      error: "Unable to load recently approved members right now.",
      status: 503,
    };
  }
}

async function fetchApplicationById(
  recordId: string,
): Promise<AirtableQueryResult> {
  if (!isRecordId(recordId)) {
    return {
      ok: false,
      status: 404,
      type: "NOT_FOUND",
      message: "Invalid application record ID",
    };
  }

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

  const params = new URLSearchParams();
  for (const field of APPLICATION_FIELDS) {
    params.append("fields[]", field);
  }

  const encodedTable = encodeURIComponent(APPLICATIONS_TABLE);
  const encodedId = encodeURIComponent(recordId);
  const requestUrl = `https://api.airtable.com/v0/${baseId}/${encodedTable}/${encodedId}?${params.toString()}`;

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let type: string | null = null;
      let message = "";
      try {
        const raw = await response.text();
        try {
          const payload = JSON.parse(raw) as AirtableListResponse;
          type = payload.error?.type ?? null;
          message = payload.error?.message ?? raw.slice(0, 300);
        } catch {
          message = raw.slice(0, 300);
        }
      } catch {
        message = "[unreadable]";
      }
      return { ok: false, status: response.status, type, message };
    }

    const record = (await response.json()) as AirtableRecord;
    if (!record?.id) {
      return {
        ok: false,
        status: 404,
        type: "NOT_FOUND",
        message: "Application record missing",
      };
    }
    return { ok: true, records: [record] };
  } catch (error) {
    return {
      ok: false,
      status: 503,
      type: "NETWORK",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getConciergeMemberByApplicationId(
  recordId: string,
): Promise<ConciergeMember | null> {
  const result = await fetchApplicationById(recordId);
  if (!result.ok) {
    logAirtableError("getConciergeMemberByApplicationId", {
      status: result.status,
      type: result.type,
      message: result.message,
      table: APPLICATIONS_TABLE,
      fields: [...APPLICATION_FIELDS],
      filterByFormula: null,
    });
    return null;
  }

  const record = result.records[0];
  if (!record?.id) return null;
  const fields = record.fields ?? {};
  const personId = recordIds(fields[LINKED_PERSON_FIELD])[0];
  const peopleIds = personId ? [personId] : [];

  const [enrichment, attendanceResult] = await Promise.all([
    fetchPeopleContactsByIds(peopleIds),
    fetchAttendanceByPersonIds(peopleIds),
  ]);

  const contact = personId ? enrichment.contacts.get(personId) : undefined;
  return applyAttendance(
    {
      id: record.id,
      name: displayOrDash(asTrimmedString(fields[NAME_FIELD])),
      phone: displayOrDash(contact?.phone ?? ""),
      email: displayOrDash(contact?.email ?? ""),
      approvalDate: formatApprovalDate(
        asTrimmedString(fields[LAST_MODIFIED_FIELD]),
      ),
      ...unresolvedConciergeFields(),
    },
    personId,
    attendanceResult,
  );
}
