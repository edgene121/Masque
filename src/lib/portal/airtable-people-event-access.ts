import "server-only";

import { getAirtableConfig } from "@/lib/admin/config";
import { getPeopleTableName } from "@/lib/portal/airtable-people-referral";

const MEMBERSHIP_STATUS_FIELD = "Membership Status";
const ID_VERIFIED_FIELD = "ID Verified";
const EMAIL_FIELD = "Email";

interface AirtablePeopleRecord {
  id: string;
  fields?: Record<string, unknown>;
}

interface AirtableListResponse {
  records?: AirtablePeopleRecord[];
  error?: { type?: string; message?: string };
}

export type PeopleEventAccessResult =
  | {
      ok: true;
      membershipStatus: string | null;
      idVerified: boolean | null;
    }
  | { ok: false; error: string; status: number };

function escapeAirtableFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function asMembershipStatus(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (Array.isArray(value) && value.length === 1) {
    return asMembershipStatus(value[0]);
  }
  if (typeof value === "object") {
    const record = value as { name?: unknown; label?: unknown };
    const fromName =
      typeof record.name === "string" ? record.name.trim() : "";
    const fromLabel =
      typeof record.label === "string" ? record.label.trim() : "";
    return fromName || fromLabel || null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  return null;
}

/**
 * Resolve People "ID Verified" checkbox.
 * Record found + checked → true
 * Record found + unchecked/omitted → false
 * Record not resolved → null
 */
function asIdVerified(
  fields: Record<string, unknown> | undefined,
): boolean | null {
  if (!fields) return null;

  const value = fields[ID_VERIFIED_FIELD];
  if (value === true) return true;
  if (value === false) return false;
  if (value === 1) return true;
  if (value === 0) return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "checked" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "unchecked" || normalized === "no") {
      return false;
    }
  }

  // Airtable omits unchecked checkboxes from the fields object.
  return false;
}

/**
 * Look up Airtable People by email and return Membership Status + ID Verified.
 * Does not create or modify People records.
 */
export async function getPeopleEventAccessByEmail(
  email: string,
): Promise<PeopleEventAccessResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, error: "Email is required.", status: 400 };
  }

  let accessToken: string;
  let baseId: string;
  try {
    ({ accessToken, baseId } = getAirtableConfig());
  } catch {
    return {
      ok: false,
      error: "Unable to load event access right now.",
      status: 503,
    };
  }

  const peopleTable = getPeopleTableName();
  const formula = `LOWER({Email})='${escapeAirtableFormulaString(trimmed)}'`;
  const params = new URLSearchParams({
    filterByFormula: formula,
    maxRecords: "1",
  });
  params.append("fields[]", EMAIL_FIELD);
  params.append("fields[]", MEMBERSHIP_STATUS_FIELD);
  params.append("fields[]", ID_VERIFIED_FIELD);

  const encodedTable = encodeURIComponent(peopleTable);
  const requestUrl = `https://api.airtable.com/v0/${baseId}/${encodedTable}?${params.toString()}`;

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (process.env.NODE_ENV === "development") {
        let errorType: string | null = null;
        let message = "";
        try {
          const raw = await response.text();
          try {
            const payload = JSON.parse(raw) as AirtableListResponse;
            errorType = payload.error?.type ?? null;
            message = payload.error?.message ?? raw.slice(0, 300);
          } catch {
            message = raw.slice(0, 300);
          }
        } catch {
          message = "[unreadable]";
        }

        console.error("[People Event Access Airtable Error]", {
          status: response.status,
          errorType,
          message,
          table: peopleTable,
          fields: [MEMBERSHIP_STATUS_FIELD, ID_VERIFIED_FIELD],
        });
      }

      return {
        ok: false,
        error: "Unable to load event access right now.",
        status: response.status === 429 ? 429 : 503,
      };
    }

    const data = (await response.json()) as AirtableListResponse;
    const record = data.records?.[0];
    if (!record?.id) {
      return { ok: true, membershipStatus: null, idVerified: null };
    }

    return {
      ok: true,
      membershipStatus: asMembershipStatus(record.fields?.[MEMBERSHIP_STATUS_FIELD]),
      idVerified: asIdVerified(record.fields),
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[People Event Access Airtable Error]", {
        status: null,
        errorType: "NETWORK",
        message: error instanceof Error ? error.message : String(error),
        table: peopleTable,
        fields: [MEMBERSHIP_STATUS_FIELD, ID_VERIFIED_FIELD],
      });
    }
    return {
      ok: false,
      error: "Unable to load event access right now.",
      status: 503,
    };
  }
}
