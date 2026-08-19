import "server-only";

import { getAirtableConfig } from "@/lib/admin/config";
import { getPeopleTableName } from "@/lib/portal/airtable-people-referral";

const MEMBERSTACK_ID_FIELD = "MemberStack ID";

interface AirtableRecord {
  id: string;
  fields?: Record<string, unknown>;
}

interface AirtableListResponse {
  records?: AirtableRecord[];
  offset?: string;
  error?: { type?: string; message?: string };
}

export type RegisteredMembersCountResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

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

function hasMemberStackId(value: unknown): boolean {
  return asTrimmedString(value) !== "";
}

export async function countRegisteredMembers(): Promise<RegisteredMembersCountResult> {
  let accessToken: string;
  let baseId: string;
  try {
    ({ accessToken, baseId } = getAirtableConfig());
  } catch {
    return { ok: false, error: "Missing Airtable configuration" };
  }

  const peopleTable = getPeopleTableName();
  const encodedTable = encodeURIComponent(peopleTable);
  const filterByFormula = `NOT({${MEMBERSTACK_ID_FIELD}} = '')`;
  let count = 0;
  let offset: string | undefined;

  try {
    do {
      const params = new URLSearchParams({
        pageSize: "100",
        filterByFormula,
      });
      params.append("fields[]", MEMBERSTACK_ID_FIELD);
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
        let message = response.statusText;
        try {
          const body = (await response.json()) as AirtableListResponse;
          message = body.error?.message || message;
        } catch {
          /* keep statusText */
        }
        console.error("[Dashboard] Registered members Airtable error", {
          status: response.status,
          message,
          table: peopleTable,
          field: MEMBERSTACK_ID_FIELD,
        });
        return { ok: false, error: "Unable to load registered members." };
      }

      const data = (await response.json()) as AirtableListResponse;
      if (!Array.isArray(data.records)) {
        return { ok: false, error: "Unable to load registered members." };
      }

      for (const record of data.records) {
        if (!record?.id) continue;
        if (hasMemberStackId(record.fields?.[MEMBERSTACK_ID_FIELD])) {
          count += 1;
        }
      }

      offset = data.offset;
    } while (offset);

    return { ok: true, count };
  } catch {
    console.error("[Dashboard] Registered members network error", {
      table: peopleTable,
      field: MEMBERSTACK_ID_FIELD,
    });
    return { ok: false, error: "Unable to load registered members." };
  }
}
