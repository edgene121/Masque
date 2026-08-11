import "server-only";

import { getAirtableConfig } from "./config";
import type { AdminApplicationRow } from "@/types/admin-users";

const APPLICATIONS_TABLE =
  process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";

interface AirtableApplicationFields {
  Name?: unknown;
  Email?: unknown;
  "Vetting Status"?: unknown;
  "Member Status"?: unknown;
  "Created Time"?: unknown;
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
      error: "Unable to load users right now.",
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
            error: "Unable to load users right now.",
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
          error: "Unable to load users right now.",
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
          error: "Unable to load users right now.",
          status: 502,
        };
      }

      if (!Array.isArray(data.records)) {
        console.error("[Airtable Users] unexpected response shape");
        return {
          ok: false,
          error: "Unable to load users right now.",
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
      error: "Unable to load users right now.",
      status: 503,
    };
  }
}

export const VETTING_STATUS_APPLICATION_RECEIVED = "application received";
export const VETTING_STATUS_PENDING = "pending";

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

/** Fetch a single Application record by Airtable record ID. */
export async function getApplicationById(
  recordId: string,
): Promise<
  | { ok: true; record: AdminApplicationRow; rawStatus: string }
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
        error: "Unable to update this application. Please try again.",
        status: 404,
      };
    }

    if (!response.ok) {
      let responseBody = "";
      try {
        responseBody = await response.text();
      } catch {
        responseBody = "[unreadable]";
      }
      console.error("[Airtable Users] getApplicationById failed", {
        status: response.status,
        statusText: response.statusText,
        recordId,
        responseBody,
      });

      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          error: "Unable to update this application. Please try again.",
          status: response.status,
        };
      }
      if (response.status === 429) {
        return {
          ok: false,
          error: "Unable to update this application. Please try again.",
          status: 429,
        };
      }

      return {
        ok: false,
        error: "Unable to update this application. Please try again.",
        status: 503,
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

    const mapped = mapApplicationRecord(data);
    return {
      ok: true,
      record: mapped,
      rawStatus: asTrimmedString(data.fields?.["Vetting Status"]),
    };
  } catch (error) {
    console.error("[Airtable Users] getApplicationById network error:", error);
    return {
      ok: false,
      error: "Unable to update this application. Please try again.",
      status: 503,
    };
  }
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
      let responseBody = "";
      try {
        responseBody = await response.text();
      } catch {
        responseBody = "[unreadable]";
      }
      console.error("[Airtable Users] markApplicationPending failed", {
        status: response.status,
        statusText: response.statusText,
        recordId,
        responseBody,
      });

      if (response.status === 404) {
        return {
          ok: false,
          error: "Unable to update this application. Please try again.",
          status: 404,
        };
      }
      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          error: "Unable to update this application. Please try again.",
          status: response.status,
        };
      }
      if (response.status === 429) {
        return {
          ok: false,
          error: "Unable to update this application. Please try again.",
          status: 429,
        };
      }

      return {
        ok: false,
        error: "Unable to update this application. Please try again.",
        status: 503,
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
