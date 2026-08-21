import "server-only";

import { getAirtableConfig } from "@/lib/admin/config";
import { getPeopleTableName } from "@/lib/portal/airtable-people-referral";

const EMAIL_FIELD = "Email";
const VERIFICATION_STATUS_FIELD = "Verification Status";

interface AirtablePeopleRecord {
  id: string;
  fields?: Record<string, unknown>;
}

interface AirtableListResponse {
  records?: AirtablePeopleRecord[];
  error?: { type?: string; message?: string };
}

export type PeopleVerificationStatusResult =
  | { ok: true; verificationStatus: string | null }
  | { ok: false; error: string; status: number };

function escapeAirtableFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/** Preserve the Airtable formula/select string; do not invent a status. */
function asVerificationStatus(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (Array.isArray(value) && value.length === 1) {
    return asVerificationStatus(value[0]);
  }
  if (typeof value === "object") {
    const record = value as { name?: unknown; label?: unknown };
    const fromName = typeof record.name === "string" ? record.name.trim() : "";
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
 * Look up Airtable People by email and return "Verification Status".
 * Read-only — does not create or modify People records.
 */
export async function getPeopleVerificationStatusByEmail(
  email: string,
): Promise<PeopleVerificationStatusResult> {
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
      error: "Unable to load verification status right now.",
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
  params.append("fields[]", VERIFICATION_STATUS_FIELD);

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

        console.error("[People Verification Status Airtable Error]", {
          status: response.status,
          errorType,
          message,
          table: peopleTable,
          field: VERIFICATION_STATUS_FIELD,
        });
      }

      return {
        ok: false,
        error: "Unable to load verification status right now.",
        status: response.status === 429 ? 429 : 503,
      };
    }

    const data = (await response.json()) as AirtableListResponse;
    const record = data.records?.[0];
    if (!record?.id) {
      return { ok: true, verificationStatus: null };
    }

    return {
      ok: true,
      verificationStatus: asVerificationStatus(
        record.fields?.[VERIFICATION_STATUS_FIELD],
      ),
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[People Verification Status Airtable Error]", {
        status: null,
        errorType: "NETWORK",
        message: error instanceof Error ? error.message : String(error),
        table: peopleTable,
        field: VERIFICATION_STATUS_FIELD,
      });
    }
    return {
      ok: false,
      error: "Unable to load verification status right now.",
      status: 503,
    };
  }
}
