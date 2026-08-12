import "server-only";

import { getAirtableConfig } from "./config";
import { mapApplicationDetail } from "./application-detail";
import {
  VETTING_STATUS_APPROVED,
  vettingStatusUpdateFields,
} from "./government-id";
import { isValidVettingTransition } from "./vetting-transitions";
import type {
  AdminApplicationDetail,
  AdminApplicationRow,
} from "@/types/admin-users";

const APPLICATIONS_TABLE =
  process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";

interface AirtableApplicationFields {
  Name?: unknown;
  Email?: unknown;
  Phone?: unknown;
  "Vetting Status"?: unknown;
  "Member Status"?: unknown;
  "Created Time"?: unknown;
  [key: string]: unknown;
}

interface AirtableApplicationRecord {
  id: string;
  createdTime?: string;
  fields?: AirtableApplicationFields;
}

interface AirtableListResponse {
  records?: AirtableApplicationRecord[];
  offset?: string;
  error?: { type?: string; message?: string };
}

export type ListApplicationsResult =
  | { ok: true; records: AdminApplicationRow[] }
  | { ok: false; error: string; status?: number };

function asTrimmedString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

function formatJoinedDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function mapApplicationRecord(
  record: AirtableApplicationRecord,
): AdminApplicationRow {
  const fields = record.fields ?? {};
  const createdFromField = asTrimmedString(fields["Created Time"]);
  const createdTime = createdFromField || record.createdTime || "";

  return {
    id: record.id,
    name: asTrimmedString(fields.Name),
    email: asTrimmedString(fields.Email),
    phone: asTrimmedString(fields.Phone),
    vettingStatus: asTrimmedString(fields["Vetting Status"]),
    memberStatus: asTrimmedString(fields["Member Status"]),
    createdTime,
    joinedDisplay: formatJoinedDate(createdTime),
  };
}

/**
 * Fetch all Applications records from Airtable (paginated).
 * Server-side only — never expose the access token.
 */
export async function listApplications(): Promise<ListApplicationsResult> {
  let accessToken: string;
  let baseId: string;

  try {
    ({ accessToken, baseId } = getAirtableConfig());
  } catch (error) {
    console.error("[Airtable Users] Missing configuration:", error);
    return {
      ok: false,
      error: "Unable to load Members right now.",
      status: 503,
    };
  }

  const encodedTable = encodeURIComponent(APPLICATIONS_TABLE);
  const records: AdminApplicationRow[] = [];
  let offset: string | undefined;

  try {
    do {
      const params = new URLSearchParams({ pageSize: "100" });
      if (offset) params.set("offset", offset);

      const requestUrl = `https://api.airtable.com/v0/${baseId}/${encodedTable}?${params.toString()}`;

      if (process.env.NODE_ENV === "development") {
        console.error("[Airtable Users] base ID", baseId);
        console.error("[Airtable Users] encoded table name", encodedTable);
      }

      const response = await fetch(requestUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (process.env.NODE_ENV === "development") {
        console.error("[Airtable Users] response status", response.status);
      }

      if (!response.ok) {
        let responseBody = "";
        try {
          responseBody = await response.text();
        } catch {
          responseBody = "[unreadable]";
        }

        console.error("[Airtable Users] request failed", {
          status: response.status,
          statusText: response.statusText,
          encodedTable,
          responseBody,
        });

        if (response.status === 401 || response.status === 403) {
          return {
            ok: false,
            error: "Unable to load Members right now.",
            status: response.status,
          };
        }
        if (response.status === 404) {
          return {
            ok: false,
            error: "Applications table was not found.",
            status: 404,
          };
        }
        if (response.status === 429) {
          return {
            ok: false,
            error: "Too many requests. Please try again shortly.",
            status: 429,
          };
        }

        return {
          ok: false,
          error: "Unable to load Members right now.",
          status: response.status,
        };
      }

      let data: AirtableListResponse;
      try {
        data = (await response.json()) as AirtableListResponse;
      } catch {
        console.error("[Airtable Users] malformed JSON response");
        return {
          ok: false,
          error: "Unable to load Members right now.",
          status: 502,
        };
      }

      if (!Array.isArray(data.records)) {
        console.error("[Airtable Users] unexpected response shape");
        return {
          ok: false,
          error: "Unable to load Members right now.",
          status: 502,
        };
      }

      for (const record of data.records) {
        if (!record?.id) continue;
        records.push(mapApplicationRecord(record));
      }

      offset = data.offset;
    } while (offset);

    if (process.env.NODE_ENV === "development") {
      console.error(
        "[Airtable Users] number of records returned",
        records.length,
      );
    }

    return { ok: true, records };
  } catch (error) {
    console.error("[Airtable Users] network error:", error);
    return {
      ok: false,
      error: "Unable to load Members right now.",
      status: 503,
    };
  }
}

export const VETTING_STATUS_APPLICATION_RECEIVED = "application received";
export const VETTING_STATUS_PENDING = "pending";
export const VETTING_STATUS_UNDER_REVIEW = "under review";
export const VETTING_STATUS_REJECTED = "rejected";
export const VETTING_STATUS_HOLD = "hold";
export const VETTING_STATUS_BANNED = "banned";
export { VETTING_STATUS_APPROVED };

export const ADMIN_REVIEW_STATUSES = [
  VETTING_STATUS_APPROVED,
  VETTING_STATUS_REJECTED,
  VETTING_STATUS_BANNED,
  VETTING_STATUS_PENDING,
  VETTING_STATUS_UNDER_REVIEW,
  VETTING_STATUS_HOLD,
] as const;

export {
  FINAL_VETTING_STATUSES,
  getAllowedNextVettingStatuses,
  getReviewActionsForStatus,
  isFinalVettingStatus,
  isValidVettingTransition,
  normalizeVettingStatus,
} from "./vetting-transitions";

export type MarkPendingResult =
  | { ok: true; record: AdminApplicationRow }
  | { ok: false; error: string; status: number };

async function getAirtableCredentials(): Promise<
  | { ok: true; accessToken: string; baseId: string }
  | { ok: false; error: string; status: number }
> {
  try {
    const { accessToken, baseId } = getAirtableConfig();
    return { ok: true, accessToken, baseId };
  } catch (error) {
    console.error("[Airtable Users] Missing configuration:", error);
    return {
      ok: false,
      error: "Unable to update this application. Please try again.",
      status: 503,
    };
  }
}

async function fetchApplicationRecord(
  recordId: string,
): Promise<
  | { ok: true; data: AirtableApplicationRecord }
  | { ok: false; error: string; status: number }
> {
  const creds = await getAirtableCredentials();
  if (!creds.ok) return creds;

  const encodedTable = encodeURIComponent(APPLICATIONS_TABLE);
  const encodedId = encodeURIComponent(recordId);
  const requestUrl = `https://api.airtable.com/v0/${creds.baseId}/${encodedTable}/${encodedId}`;

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.status === 404) {
      return {
        ok: false,
        error: "Application not found",
        status: 404,
      };
    }

    if (!response.ok) {
      console.error("[Airtable Users] fetchApplicationRecord failed", {
        status: response.status,
        recordId,
      });
      return {
        ok: false,
        error: "Unable to load this application. Please try again.",
        status: response.status === 429 ? 429 : 503,
      };
    }

    const data = (await response.json()) as AirtableApplicationRecord;
    if (!data?.id) {
      return {
        ok: false,
        error: "Unable to load this application. Please try again.",
        status: 502,
      };
    }

    return { ok: true, data };
  } catch (error) {
    console.error(
      "[Airtable Users] fetchApplicationRecord network error:",
      error,
    );
    return {
      ok: false,
      error: "Unable to load this application. Please try again.",
      status: 503,
    };
  }
}

/** Fetch a single Application record by Airtable record ID (list row shape). */
export async function getApplicationById(
  recordId: string,
): Promise<
  | { ok: true; record: AdminApplicationRow; rawStatus: string }
  | { ok: false; error: string; status: number }
> {
  const fetched = await fetchApplicationRecord(recordId);
  if (!fetched.ok) {
    return {
      ok: false,
      error:
        fetched.status === 404
          ? "Unable to update this application. Please try again."
          : fetched.error,
      status: fetched.status,
    };
  }

  const mapped = mapApplicationRecord(fetched.data);
  return {
    ok: true,
    record: mapped,
    rawStatus: asTrimmedString(fetched.data.fields?.["Vetting Status"]),
  };
}

/** Full admin review detail for /admin/users/[id]. */
export async function getApplicationDetailById(
  recordId: string,
): Promise<
  | { ok: true; detail: AdminApplicationDetail }
  | { ok: false; error: string; status: number }
> {
  const fetched = await fetchApplicationRecord(recordId);
  if (!fetched.ok) return fetched;

  return {
    ok: true,
    detail: mapApplicationDetail(
      fetched.data.id,
      (fetched.data.fields ?? {}) as Record<string, unknown>,
      fetched.data.createdTime || "",
    ),
  };
}

/** Raw fields for server-side attachment proxy (never send to client as-is). */
export async function getApplicationRawFieldsById(
  recordId: string,
): Promise<
  | { ok: true; fields: Record<string, unknown> }
  | { ok: false; error: string; status: number }
> {
  const fetched = await fetchApplicationRecord(recordId);
  if (!fetched.ok) return fetched;
  return {
    ok: true,
    fields: (fetched.data.fields ?? {}) as Record<string, unknown>,
  };
}

/**
 * Controlled transition only:
 * "application received" -> "pending"
 */
export async function markApplicationPending(
  recordId: string,
): Promise<MarkPendingResult> {
  const current = await getApplicationById(recordId);
  if (!current.ok) return current;

  if (current.rawStatus !== VETTING_STATUS_APPLICATION_RECEIVED) {
    console.error("[Airtable Users] invalid vetting transition", {
      recordId,
      currentStatus: current.rawStatus,
      requiredStatus: VETTING_STATUS_APPLICATION_RECEIVED,
    });
    return {
      ok: false,
      error: "Unable to update this application. Please try again.",
      status: 409,
    };
  }

  const creds = await getAirtableCredentials();
  if (!creds.ok) return creds;

  const encodedTable = encodeURIComponent(APPLICATIONS_TABLE);
  const encodedId = encodeURIComponent(recordId);
  const requestUrl = `https://api.airtable.com/v0/${creds.baseId}/${encodedTable}/${encodedId}`;

  try {
    const response = await fetch(requestUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "Vetting Status": VETTING_STATUS_PENDING,
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[Airtable Users] markApplicationPending failed", {
        status: response.status,
        recordId,
      });
      return {
        ok: false,
        error: "Unable to update this application. Please try again.",
        status:
          response.status === 404
            ? 404
            : response.status === 429
              ? 429
              : 503,
      };
    }

    const data = (await response.json()) as AirtableApplicationRecord;
    if (!data?.id) {
      return {
        ok: false,
        error: "Unable to update this application. Please try again.",
        status: 502,
      };
    }

    return { ok: true, record: mapApplicationRecord(data) };
  } catch (error) {
    console.error(
      "[Airtable Users] markApplicationPending network error:",
      error,
    );
    return {
      ok: false,
      error: "Unable to update this application. Please try again.",
      status: 503,
    };
  }
}

export type UpdateVettingStatusResult =
  | { ok: true; record: AdminApplicationRow }
  | { ok: false; error: string; status: number };

function isAllowedReviewStatus(normalized: string): boolean {
  return (ADMIN_REVIEW_STATUSES as readonly string[]).includes(normalized);
}

/**
 * Update Vetting Status (forward-only transitions).
 * When status is "approved", clears Government ID in the same PATCH.
 * Reject / ban / hold / etc. keep Government ID. Never deletes the record.
 */
export async function updateApplicationVettingStatus(
  recordId: string,
  status: string,
): Promise<UpdateVettingStatusResult> {
  const target = status.trim();
  const normalized = target.toLowerCase();

  if (!isAllowedReviewStatus(normalized)) {
    return {
      ok: false,
      error: "Unable to update this application. Please try again.",
      status: 400,
    };
  }

  const current = await getApplicationById(recordId);
  if (!current.ok) return current;

  if (!isValidVettingTransition(current.rawStatus, normalized)) {
    console.error("[Airtable Users] invalid vetting transition", {
      recordId,
      currentStatus: current.rawStatus,
      targetStatus: normalized,
    });
    return {
      ok: false,
      error: "Invalid status transition.",
      status: 409,
    };
  }

  // Controlled list/detail transition: application received → pending
  if (
    normalized === VETTING_STATUS_PENDING &&
    current.rawStatus.toLowerCase() === VETTING_STATUS_APPLICATION_RECEIVED
  ) {
    return markApplicationPending(recordId);
  }

  const creds = await getAirtableCredentials();
  if (!creds.ok) return creds;

  const encodedTable = encodeURIComponent(APPLICATIONS_TABLE);
  const encodedId = encodeURIComponent(recordId);
  const requestUrl = `https://api.airtable.com/v0/${creds.baseId}/${encodedTable}/${encodedId}`;

  const statusValue =
    normalized === VETTING_STATUS_APPROVED
      ? VETTING_STATUS_APPROVED
      : normalized === VETTING_STATUS_REJECTED
        ? VETTING_STATUS_REJECTED
        : normalized === VETTING_STATUS_BANNED
          ? VETTING_STATUS_BANNED
          : normalized === VETTING_STATUS_PENDING
            ? VETTING_STATUS_PENDING
            : normalized === VETTING_STATUS_UNDER_REVIEW
              ? VETTING_STATUS_UNDER_REVIEW
              : normalized === VETTING_STATUS_HOLD
                ? VETTING_STATUS_HOLD
                : target;

  try {
    const response = await fetch(requestUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: vettingStatusUpdateFields(statusValue),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[Airtable Users] updateApplicationVettingStatus failed", {
        status: response.status,
        recordId,
        targetStatus: statusValue,
      });

      return {
        ok: false,
        error: "Unable to update this application. Please try again.",
        status:
          response.status === 404
            ? 404
            : response.status === 429
              ? 429
              : 503,
      };
    }

    const data = (await response.json()) as AirtableApplicationRecord;
    if (!data?.id) {
      return {
        ok: false,
        error: "Unable to update this application. Please try again.",
        status: 502,
      };
    }

    return {
      ok: true,
      record: {
        id: data.id,
        name: asTrimmedString(data.fields?.Name) || current.record.name,
        email: asTrimmedString(data.fields?.Email) || current.record.email,
        phone: asTrimmedString(data.fields?.Phone) || current.record.phone,
        vettingStatus:
          asTrimmedString(data.fields?.["Vetting Status"]) || statusValue,
        memberStatus:
          asTrimmedString(data.fields?.["Member Status"]) ||
          current.record.memberStatus,
        createdTime:
          asTrimmedString(data.fields?.["Created Time"]) ||
          current.record.createdTime,
        joinedDisplay:
          formatJoinedDate(
            asTrimmedString(data.fields?.["Created Time"]) ||
              current.record.createdTime,
          ) || current.record.joinedDisplay,
      },
    };
  } catch (error) {
    console.error(
      "[Airtable Users] updateApplicationVettingStatus network error:",
      error,
    );
    return {
      ok: false,
      error: "Unable to update this application. Please try again.",
      status: 503,
    };
  }
}
