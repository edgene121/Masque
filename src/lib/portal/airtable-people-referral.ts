import "server-only";

import { getAirtableConfig } from "@/lib/admin/config";

const PEOPLE_TABLE =
  process.env.AIRTABLE_PEOPLE_TABLE?.trim() || "People";

const REFERRAL_CODE_FIELD = "Referral Code";

interface AirtablePeopleFields {
  Email?: unknown;
  "Referral Code"?: unknown;
  [key: string]: unknown;
}

interface AirtablePeopleRecord {
  id: string;
  fields?: AirtablePeopleFields;
}

interface AirtableListResponse {
  records?: AirtablePeopleRecord[];
  error?: { type?: string; message?: string };
}

export type PeopleReferralResult =
  | { ok: true; referralCode: string }
  | { ok: false; error: string; status: number };

function escapeAirtableFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function asTrimmedString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

/**
 * Look up Airtable People by email (case-insensitive) and return Referral Code.
 * Does not create or modify People records.
 */
export async function getReferralCodeByEmail(
  email: string,
): Promise<PeopleReferralResult> {
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
      error: "Unable to load referral details right now.",
      status: 503,
    };
  }

  const formula = `LOWER({Email})='${escapeAirtableFormulaString(trimmed)}'`;
  const params = new URLSearchParams({
    filterByFormula: formula,
    maxRecords: "1",
  });
  // Request only the fields we need; Email helps confirm the match.
  params.append("fields[]", "Email");
  params.append("fields[]", REFERRAL_CODE_FIELD);

  const encodedTable = encodeURIComponent(PEOPLE_TABLE);
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

      if (process.env.NODE_ENV === "development") {
        console.error("[People Referral Airtable Error]", {
          status: response.status,
          errorType,
          message,
          table: PEOPLE_TABLE,
          field: REFERRAL_CODE_FIELD,
        });
      }

      return {
        ok: false,
        error: "Unable to load referral details right now.",
        status: response.status === 429 ? 429 : 503,
      };
    }

    const data = (await response.json()) as AirtableListResponse;
    const record = data.records?.[0];
    if (!record?.id) {
      return { ok: true, referralCode: "" };
    }

    const referralCode = asTrimmedString(record.fields?.[REFERRAL_CODE_FIELD]);
    return { ok: true, referralCode };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[People Referral Airtable Error]", {
        status: null,
        errorType: "NETWORK",
        message: error instanceof Error ? error.message : String(error),
        table: PEOPLE_TABLE,
        field: REFERRAL_CODE_FIELD,
      });
    }
    return {
      ok: false,
      error: "Unable to load referral details right now.",
      status: 503,
    };
  }
}

export function getPeopleTableName(): string {
  return PEOPLE_TABLE;
}
