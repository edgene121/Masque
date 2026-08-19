import "server-only";

import { revalidatePath } from "next/cache";
import { getAirtableConfig } from "@/lib/admin/config";
import { getPeopleTableName } from "@/lib/portal/airtable-people-referral";
import {
  PEOPLE_CONCIERGE_STATUS_OPTIONS,
  type ConciergeStatus,
} from "@/types/admin-concierge";

const CONCIERGE_STATUS_FIELD = "Concierge Status";
const CONCIERGE_WELCOME_DATE_FIELD = "Concierge Welcome Date";
const LAST_CONCIERGE_CONTACT_FIELD = "Last Concierge Contact";
const CONCIERGE_NOTES_FIELD = "Concierge Notes";

const GENERIC_ERROR = "Unable to save Concierge information. Please try again.";

export type ConciergeUpdateInput = {
  conciergeStatus: string;
  conciergeWelcomeDate: string;
  lastConciergeContact: string;
  conciergeNotes: string;
};

export type ConciergeUpdateResult =
  | {
      ok: true;
      values: {
        conciergeStatus: string;
        conciergeWelcomeDate: string;
        lastConciergeContact: string;
        conciergeNotes: string;
      };
    }
  | { ok: false; error: string; status: number };

function isRecordId(value: string): boolean {
  return /^rec[a-zA-Z0-9]{10,}$/.test(value);
}

function isAllowedStatus(value: string): value is ConciergeStatus {
  return (PEOPLE_CONCIERGE_STATUS_OPTIONS as readonly string[]).includes(value);
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function asTrimmedString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

function toDateInputValue(value: unknown): string {
  const raw = asTrimmedString(value);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return "";
}

export async function updatePeopleConciergeFields(
  peopleRecordId: string,
  input: ConciergeUpdateInput,
): Promise<ConciergeUpdateResult> {
  if (!isRecordId(peopleRecordId)) {
    return { ok: false, error: GENERIC_ERROR, status: 400 };
  }

  const conciergeStatus = input.conciergeStatus.trim();
  const conciergeWelcomeDate = input.conciergeWelcomeDate.trim();
  const lastConciergeContact = input.lastConciergeContact.trim();
  const conciergeNotes = input.conciergeNotes;

  if (conciergeStatus && !isAllowedStatus(conciergeStatus)) {
    return { ok: false, error: GENERIC_ERROR, status: 400 };
  }
  if (conciergeWelcomeDate && !isIsoDate(conciergeWelcomeDate)) {
    return { ok: false, error: GENERIC_ERROR, status: 400 };
  }
  if (lastConciergeContact && !isIsoDate(lastConciergeContact)) {
    return { ok: false, error: GENERIC_ERROR, status: 400 };
  }

  let accessToken: string;
  let baseId: string;
  try {
    ({ accessToken, baseId } = getAirtableConfig());
  } catch {
    return { ok: false, error: GENERIC_ERROR, status: 503 };
  }

  const peopleTable = getPeopleTableName();
  const requestUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(peopleTable)}/${encodeURIComponent(peopleRecordId)}`;

  try {
    const response = await fetch(requestUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          [CONCIERGE_STATUS_FIELD]: conciergeStatus || null,
          [CONCIERGE_WELCOME_DATE_FIELD]: conciergeWelcomeDate || null,
          [LAST_CONCIERGE_CONTACT_FIELD]: lastConciergeContact || null,
          [CONCIERGE_NOTES_FIELD]: conciergeNotes,
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      let type: string | null = null;
      let message = "";
      try {
        const raw = await response.text();
        try {
          const payload = JSON.parse(raw) as {
            error?: { type?: string; message?: string };
          };
          type = payload.error?.type ?? null;
          message = payload.error?.message ?? raw.slice(0, 300);
        } catch {
          message = raw.slice(0, 300);
        }
      } catch {
        message = "[unreadable]";
      }

      console.error("[Concierge] People update failed", {
        status: response.status,
        type,
        message,
        table: peopleTable,
        recordId: peopleRecordId,
        fields: [
          CONCIERGE_STATUS_FIELD,
          CONCIERGE_WELCOME_DATE_FIELD,
          LAST_CONCIERGE_CONTACT_FIELD,
          CONCIERGE_NOTES_FIELD,
        ],
      });

      return {
        ok: false,
        error: GENERIC_ERROR,
        status:
          response.status === 404
            ? 404
            : response.status === 429
              ? 429
              : 503,
      };
    }

    const record = (await response.json()) as {
      id?: string;
      fields?: Record<string, unknown>;
    };
    const fields = record.fields ?? {};

    revalidatePath(`/admin/concierge/members/${peopleRecordId}`);
    revalidatePath("/admin/concierge/recently-approved");

    return {
      ok: true,
      values: {
        conciergeStatus: asTrimmedString(fields[CONCIERGE_STATUS_FIELD]),
        conciergeWelcomeDate: toDateInputValue(
          fields[CONCIERGE_WELCOME_DATE_FIELD],
        ),
        lastConciergeContact: toDateInputValue(
          fields[LAST_CONCIERGE_CONTACT_FIELD],
        ),
        conciergeNotes: asTrimmedString(fields[CONCIERGE_NOTES_FIELD]),
      },
    };
  } catch (error) {
    console.error("[Concierge] People update network error", {
      recordId: peopleRecordId,
      table: peopleTable,
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: GENERIC_ERROR, status: 503 };
  }
}
