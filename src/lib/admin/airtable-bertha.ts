import "server-only";

import { getAirtableConfig } from "@/lib/admin/config";

const TICKET_BUYERS_TABLE =
  process.env.AIRTABLE_TICKET_BUYERS_TABLE?.trim() || "Ticket Buyers + Guest";
const NOCTURNE_TICKET_BUYERS_VIEW =
  process.env.AIRTABLE_NOCTURNE_TICKET_BUYERS_VIEW?.trim() ||
  "Nocturne Ticket Buyers";

const LINKED_PERSON_FIELD = "Linked Person";
const EVENT_NAME_FIELD = "Event Name";
const TICKET_TYPE_FIELD = "Ticket Type";

interface AirtableRecord {
  id: string;
  fields?: Record<string, unknown>;
}

interface AirtableListResponse {
  records?: AirtableRecord[];
  offset?: string;
  error?: { type?: string; message?: string };
}

type AirtableQueryResult =
  | { ok: true; records: AirtableRecord[] }
  | {
      ok: false;
      status: number;
      type: string | null;
      message: string;
    };

export type BerthaTicketMatch = {
  recordId: string;
  eventName: string;
  ticketType: string;
};

export type PersonBerthaDebug = {
  matchingRecords: BerthaTicketMatch[];
};

export type PersonBerthaStatus = {
  purchased: boolean;
  matches: BerthaTicketMatch[];
};

export type BerthaByPersonResult =
  | {
      ok: true;
      byPerson: Map<string, PersonBerthaStatus>;
      debugByPerson: Map<string, PersonBerthaDebug>;
    }
  | { ok: false };

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

function asDisplayValue(value: unknown): string {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) {
    return value.map(asDisplayValue).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    const record = value as { name?: unknown; label?: unknown; id?: unknown };
    return (
      asTrimmedString(record.name) ||
      asTrimmedString(record.label) ||
      asTrimmedString(record.id)
    );
  }
  return asTrimmedString(value);
}

function isRecordId(value: string): boolean {
  return /^rec[a-zA-Z0-9]{10,}$/.test(value);
}

function recordIds(value: unknown): string[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => recordIds(item)))];
  }
  if (typeof value === "object") {
    const record = value as { id?: unknown; recordId?: unknown };
    return recordIds(record.id ?? record.recordId);
  }
  const single = asTrimmedString(value);
  if (isRecordId(single)) return [single];
  if (single.includes(",")) {
    return [
      ...new Set(
        single
          .split(",")
          .flatMap((part) => recordIds(part.trim()))
          .filter((id) => isRecordId(id)),
      ),
    ];
  }
  return [];
}

function logBerthaError(
  label: string,
  details: {
    status: number | null;
    type: string | null;
    message: string;
    table: string;
    fields: string[];
    view: string | null;
    filterByFormula: string | null;
  },
) {
  console.error("Concierge Bertha Airtable error", {
    label,
    status: details.status,
    type: details.type,
    message: details.message,
    table: details.table,
    fields: details.fields,
    view: details.view,
    filterByFormula: details.filterByFormula,
  });
}

async function queryTable(options: {
  table: string;
  fields?: string[];
  view?: string;
  filterByFormula?: string;
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
      const params = new URLSearchParams({ pageSize: "100" });
      if (options.view) params.set("view", options.view);
      if (options.filterByFormula) {
        params.set("filterByFormula", options.filterByFormula);
      }
      for (const field of options.fields ?? []) {
        params.append("fields[]", field);
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
      offset = data.offset;
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

function isNocturneEventName(value: unknown): boolean {
  return asDisplayValue(value).toLowerCase().includes("nocturne");
}

async function fetchCurrentNocturneTicketRecords(): Promise<AirtableQueryResult> {
  const preferredFields = [
    LINKED_PERSON_FIELD,
    EVENT_NAME_FIELD,
    TICKET_TYPE_FIELD,
  ];
  const linkedPersonOnly = [LINKED_PERSON_FIELD];

  const viewResult = await queryTable({
    table: TICKET_BUYERS_TABLE,
    fields: preferredFields,
    view: NOCTURNE_TICKET_BUYERS_VIEW,
  });
  if (viewResult.ok) return viewResult;

  logBerthaError("Nocturne Ticket Buyers view", {
    status: viewResult.status,
    type: viewResult.type,
    message: viewResult.message,
    table: TICKET_BUYERS_TABLE,
    fields: preferredFields,
    view: NOCTURNE_TICKET_BUYERS_VIEW,
    filterByFormula: null,
  });

  const viewLinkedOnly = await queryTable({
    table: TICKET_BUYERS_TABLE,
    fields: linkedPersonOnly,
    view: NOCTURNE_TICKET_BUYERS_VIEW,
  });
  if (viewLinkedOnly.ok) return viewLinkedOnly;

  logBerthaError("Nocturne Ticket Buyers view Linked Person only", {
    status: viewLinkedOnly.status,
    type: viewLinkedOnly.type,
    message: viewLinkedOnly.message,
    table: TICKET_BUYERS_TABLE,
    fields: linkedPersonOnly,
    view: NOCTURNE_TICKET_BUYERS_VIEW,
    filterByFormula: null,
  });

  const nocturneFormula = `FIND('nocturne', LOWER({${EVENT_NAME_FIELD}}&''))`;
  const formulaResult = await queryTable({
    table: TICKET_BUYERS_TABLE,
    fields: preferredFields,
    filterByFormula: nocturneFormula,
  });
  if (formulaResult.ok) {
    return {
      ok: true,
      records: formulaResult.records.filter((record) =>
        isNocturneEventName(record.fields?.[EVENT_NAME_FIELD]),
      ),
    };
  }

  logBerthaError("Nocturne Event Name filter", {
    status: formulaResult.status,
    type: formulaResult.type,
    message: formulaResult.message,
    table: TICKET_BUYERS_TABLE,
    fields: preferredFields,
    view: null,
    filterByFormula: nocturneFormula,
  });
  return formulaResult;
}

/**
 * Current-Nocturne ticket purchases keyed by People record ID.
 * Uses Ticket Buyers + Guest, preferring the Nocturne Ticket Buyers view.
 * Never matches by name and never uses Attendance.
 */
export async function fetchBerthaByPersonIds(
  personIds: string[],
): Promise<BerthaByPersonResult> {
  const unique = [...new Set(personIds.filter((id) => isRecordId(id)))];
  const byPerson = new Map<string, PersonBerthaStatus>();
  const debugByPerson = new Map<string, PersonBerthaDebug>();
  for (const id of unique) {
    byPerson.set(id, { purchased: false, matches: [] });
    debugByPerson.set(id, { matchingRecords: [] });
  }

  if (unique.length === 0) return { ok: true, byPerson, debugByPerson };

  const result = await fetchCurrentNocturneTicketRecords();
  if (!result.ok) return { ok: false };

  let matchedTicketRows = 0;

  for (const record of result.records) {
    const fields = record.fields ?? {};
    const people = recordIds(fields[LINKED_PERSON_FIELD]).filter((id) =>
      byPerson.has(id),
    );
    if (people.length === 0) continue;

    const match: BerthaTicketMatch = {
      recordId: record.id,
      eventName: asDisplayValue(fields[EVENT_NAME_FIELD]),
      ticketType: asDisplayValue(fields[TICKET_TYPE_FIELD]),
    };
    matchedTicketRows += 1;

    for (const personId of people) {
      const current = byPerson.get(personId) ?? {
        purchased: false,
        matches: [],
      };
      current.purchased = true;
      current.matches.push(match);
      byPerson.set(personId, current);
      debugByPerson.set(personId, { matchingRecords: current.matches });
    }
  }

  console.error("[Concierge Bertha]", {
    peopleRequested: unique.length,
    nocturneTicketRecordsRetrieved: result.records.length,
    matchingTicketRowsForRequestedPeople: matchedTicketRows,
    peopleWithPurchased: [...byPerson.values()].filter((row) => row.purchased)
      .length,
    view: NOCTURNE_TICKET_BUYERS_VIEW,
    table: TICKET_BUYERS_TABLE,
  });

  return { ok: true, byPerson, debugByPerson };
}
