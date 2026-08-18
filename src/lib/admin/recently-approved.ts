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

function recentlyApprovedFormula(): string {
  return [
    `LOWER({${VETTING_STATUS_FIELD}})='${VETTING_STATUS_APPROVED}'`,
    `NOT({${MEMBERSHIP_APPROVAL_DATE_FIELD}}=BLANK())`,
    `DATETIME_DIFF(TODAY(),{${MEMBERSHIP_APPROVAL_DATE_FIELD}},'days')>=0`,
    `DATETIME_DIFF(TODAY(),{${MEMBERSHIP_APPROVAL_DATE_FIELD}},'days')<=60`,
  ].join(",");
}

/**
 * Applications approved in the last 60 days, newest approval first.
 * Identity fields only. Concierge workflow fields stay on defaults.
 */
export async function listRecentlyApprovedMembers(): Promise<ListRecentlyApprovedResult> {
  let accessToken: string;
  let baseId: string;
  try {
    ({ accessToken, baseId } = getAirtableConfig());
  } catch (error) {
    console.error("[Recently Approved] Missing configuration:", error);
    return {
      ok: false,
      error: "Unable to load recently approved members right now.",
      status: 503,
    };
  }

  const encodedTable = encodeURIComponent(APPLICATIONS_TABLE);
  const rows: Array<{ member: ConciergeMember; approvalDateMs: number }> = [];
  let offset: string | undefined;

  try {
    do {
      const params = new URLSearchParams({
        pageSize: "100",
        filterByFormula: `AND(${recentlyApprovedFormula()})`,
      });
      params.append("fields[]", NAME_FIELD);
      params.append("fields[]", PHONE_FIELD);
      params.append("fields[]", EMAIL_FIELD);
      params.append("fields[]", VETTING_STATUS_FIELD);
      params.append("fields[]", MEMBERSHIP_APPROVAL_DATE_FIELD);
      params.append("sort[0][field]", MEMBERSHIP_APPROVAL_DATE_FIELD);
      params.append("sort[0][direction]", "desc");
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
        let message = "";
        try {
          const raw = await response.text();
          try {
            const payload = JSON.parse(raw) as AirtableListResponse;
            message = payload.error?.message ?? raw.slice(0, 300);
          } catch {
            message = raw.slice(0, 300);
          }
        } catch {
          message = "[unreadable]";
        }

        console.error("[Recently Approved] request failed", {
          status: response.status,
          errorType: "AIRTABLE",
          message,
          table: APPLICATIONS_TABLE,
        });

        return {
          ok: false,
          error: "Unable to load recently approved members right now.",
          status:
            response.status === 429
              ? 429
              : response.status === 404
                ? 404
                : 503,
        };
      }

      const data = (await response.json()) as AirtableListResponse;
      for (const record of data.records ?? []) {
        if (!record?.id) continue;
        const mapped = toConciergeMember(record);
        if (mapped) rows.push(mapped);
      }
      offset = data.offset;
    } while (offset);
  } catch (error) {
    console.error("[Recently Approved] network error:", error);
    return {
      ok: false,
      error: "Unable to load recently approved members right now.",
      status: 503,
    };
  }

  rows.sort((left, right) => right.approvalDateMs - left.approvalDateMs);

  return { ok: true, members: rows.map((row) => row.member) };
}
