import "server-only";

import { getAirtableConfig } from "@/lib/admin/config";
import { VETTING_STATUS_APPROVED } from "@/lib/admin/government-id";
import type { ConciergeMember } from "@/types/admin-concierge";

const APPLICATIONS_TABLE =
  process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";

const NAME_FIELD = "Name";
const PHONE_FIELD = "Phone";
const EMAIL_FIELD = "Email";
const VETTING_STATUS_FIELD = "Vetting Status";
const MEMBERSHIP_APPROVAL_DATE_FIELD = "Membership Approval Date";

const IDENTITY_FIELDS = [
  NAME_FIELD,
  PHONE_FIELD,
  EMAIL_FIELD,
  VETTING_STATUS_FIELD,
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

function parseDateOnlyMs(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const iso = /^\d{4}-\d{2}-\d{2}/.test(trimmed)
    ? trimmed.slice(0, 10)
    : "";
  if (iso) {
    const [year, month, day] = iso.split("-").map(Number);
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

function approvedStatusFormula(): string {
  return `LOWER({${VETTING_STATUS_FIELD}})='${VETTING_STATUS_APPROVED}'`;
}

function recentlyApprovedFormula(): string {
  return [
    approvedStatusFormula(),
    `NOT({${MEMBERSHIP_APPROVAL_DATE_FIELD}}=BLANK())`,
    `DATETIME_DIFF(TODAY(),{${MEMBERSHIP_APPROVAL_DATE_FIELD}},'days')>=0`,
    `DATETIME_DIFF(TODAY(),{${MEMBERSHIP_APPROVAL_DATE_FIELD}},'days')<=60`,
  ].join(",");
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
    sortField?: string | null;
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
    sortField: details.sortField ?? null,
  });
}

async function queryApplications(options: {
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

  const encodedTable = encodeURIComponent(APPLICATIONS_TABLE);
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  try {
    do {
      const params = new URLSearchParams({
        pageSize: String(Math.min(options.maxRecords ?? 100, 100)),
      });
      if (options.maxRecords && !options.paginate) {
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

async function diagnoseRecentlyApprovedQuery() {
  const tests: Array<{
    id: "A" | "B" | "C" | "D";
    fields?: string[];
    filterByFormula?: string;
    sortField?: string;
  }> = [
    { id: "A", fields: undefined, filterByFormula: undefined },
    {
      id: "B",
      fields: [...IDENTITY_FIELDS, MEMBERSHIP_APPROVAL_DATE_FIELD],
    },
    {
      id: "C",
      fields: [...IDENTITY_FIELDS],
      filterByFormula: approvedStatusFormula(),
    },
    {
      id: "D",
      fields: [...IDENTITY_FIELDS, MEMBERSHIP_APPROVAL_DATE_FIELD],
      filterByFormula: `AND(${recentlyApprovedFormula()})`,
      sortField: MEMBERSHIP_APPROVAL_DATE_FIELD,
    },
  ];

  for (const test of tests) {
    const result = await queryApplications({
      maxRecords: 3,
      fields: test.fields,
      filterByFormula: test.filterByFormula,
      sortField: test.sortField,
      paginate: false,
    });

    if (!result.ok) {
      logAirtableError(`TEST ${test.id} failed`, {
        status: result.status,
        type: result.type,
        message: result.message,
        table: APPLICATIONS_TABLE,
        fields: test.fields ?? [],
        filterByFormula: test.filterByFormula ?? null,
        sortField: test.sortField ?? null,
      });
      continue;
    }

    const sampleFieldNames = [
      ...new Set(
        result.records.flatMap((record) => Object.keys(record.fields ?? {})),
      ),
    ].sort();

    console.error("Recently Approved Airtable probe", {
      test: test.id,
      ok: true,
      recordCount: result.records.length,
      table: APPLICATIONS_TABLE,
      fieldsRequested: test.fields ?? "(all returned fields)",
      filterByFormula: test.filterByFormula ?? null,
      sampleFieldNames,
    });
  }
}

function toConciergeMember(
  record: AirtableRecord,
): { member: ConciergeMember; approvalDateMs: number } | null {
  const fields = record.fields ?? {};
  const approvalRaw = asTrimmedString(fields[MEMBERSHIP_APPROVAL_DATE_FIELD]);
  const approvalMs = parseDateOnlyMs(approvalRaw);
  if (approvalMs == null) return null;

  return {
    approvalDateMs: approvalMs,
    member: {
      id: record.id,
      name: displayOrDash(asTrimmedString(fields[NAME_FIELD])),
      phone: displayOrDash(asTrimmedString(fields[PHONE_FIELD])),
      email: displayOrDash(asTrimmedString(fields[EMAIL_FIELD])),
      approvalDate: formatApprovalDate(approvalRaw),
      attendance: {
        hasEverAttended: false,
        lastEventAttended: "—",
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
    },
  };
}

/**
 * Applications approved in the last 60 days, newest approval first.
 * Identity fields only. Concierge workflow fields stay on defaults.
 */
export async function listRecentlyApprovedMembers(): Promise<ListRecentlyApprovedResult> {
  const fields = [...IDENTITY_FIELDS, MEMBERSHIP_APPROVAL_DATE_FIELD];
  const filterByFormula = `AND(${recentlyApprovedFormula()})`;

  try {
    const result = await queryApplications({
      fields,
      filterByFormula,
      sortField: MEMBERSHIP_APPROVAL_DATE_FIELD,
      sortDirection: "desc",
      paginate: true,
    });

    if (!result.ok) {
      logAirtableError("listRecentlyApprovedMembers", {
        status: result.status,
        type: result.type,
        message: result.message,
        table: APPLICATIONS_TABLE,
        fields,
        filterByFormula,
        sortField: MEMBERSHIP_APPROVAL_DATE_FIELD,
      });
      await diagnoseRecentlyApprovedQuery();
      return {
        ok: false,
        error: "Unable to load recently approved members right now.",
        status: result.status === 429 ? 429 : result.status === 404 ? 404 : 503,
      };
    }

    const rows = result.records
      .map((record) => (record?.id ? toConciergeMember(record) : null))
      .filter(
        (row): row is { member: ConciergeMember; approvalDateMs: number } =>
          row != null,
      )
      .sort((left, right) => right.approvalDateMs - left.approvalDateMs);

    return { ok: true, members: rows.map((row) => row.member) };
  } catch (error) {
    logAirtableError("listRecentlyApprovedMembers", {
      status: 503,
      type: "NETWORK",
      message: error instanceof Error ? error.message : String(error),
      table: APPLICATIONS_TABLE,
      fields,
      filterByFormula,
      sortField: MEMBERSHIP_APPROVAL_DATE_FIELD,
    });
    return {
      ok: false,
      error: "Unable to load recently approved members right now.",
      status: 503,
    };
  }
}
