import "server-only";

import { getAirtableConfig } from "@/lib/admin/config";
import { getEventsTableName } from "@/lib/portal/airtable-events";
import type { ConciergeAttendanceDetail } from "@/types/admin-concierge";

const ATTENDANCE_TABLE =
  process.env.AIRTABLE_ATTENDANCE_TABLE?.trim() || "Attendance";

const LINKED_PERSON_FIELD = "Linked Person";
const LINKED_EVENT_FIELD = "Linked Event";
const ATTENDANCE_STATUS_FIELD = "Attendance Status";
const EVENT_NAME_FIELD = "Name";
const EVENT_DATE_FIELD = "Date";

const CHECKED_IN_STATUS = "checked in";
const PERSON_CHUNK_SIZE = 20;

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

export type PersonAttendanceDebug = {
  matchingCount: number;
  statuses: string[];
};

export type AttendanceByPersonResult =
  | {
      ok: true;
      byPerson: Map<string, ConciergeAttendanceDetail>;
      debugByPerson: Map<string, PersonAttendanceDebug>;
    }
  | { ok: false };

interface EventInfo {
  name: string;
  dateMs: number | null;
  dateLabel: string;
}

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

function escapeAirtableFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function isCheckedInStatus(value: unknown): boolean {
  const normalized = asTrimmedString(value).toLowerCase().replace(/\s+/g, " ");
  return normalized === CHECKED_IN_STATUS;
}

function parseDateOnlyMs(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [year, month, day] = trimmed.slice(0, 10).split("-").map(Number);
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

function formatEventDate(raw: string): string {
  const ms = parseDateOnlyMs(raw);
  if (ms == null) return "";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function emptyAttendance(): ConciergeAttendanceDetail {
  return {
    hasEverAttended: false,
    lastEventAttended: "—",
  };
}

function formatLastEventAttended(event: EventInfo): string {
  const lines = [event.name, event.dateLabel].filter(Boolean);
  return lines.length > 0 ? lines.join("\n") : "—";
}

function pickLatestEvent(events: EventInfo[]): EventInfo | null {
  const dated = events.filter((event) => event.dateMs != null);
  if (dated.length === 0) return null;
  return dated.sort((left, right) => (right.dateMs ?? 0) - (left.dateMs ?? 0))[0];
}

function logAttendanceError(
  label: string,
  details: {
    status: number | null;
    type: string | null;
    message: string;
    table: string;
    fields: string[];
    filterByFormula: string | null;
  },
) {
  console.error("Concierge Attendance Airtable error", {
    label,
    status: details.status,
    type: details.type,
    message: details.message,
    table: details.table,
    fields: details.fields,
    filterByFormula: details.filterByFormula,
  });
}

async function queryTable(options: {
  table: string;
  fields?: string[];
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

function personFilterFormula(personIds: string[]): string {
  const clauses = personIds.map((id) => {
    const escaped = escapeAirtableFormulaString(id);
    return `{${LINKED_PERSON_FIELD}}='${escaped}'`;
  });
  return clauses.length === 1 ? clauses[0] : `OR(${clauses.join(",")})`;
}

function recordIdFilterFormula(ids: string[]): string {
  if (ids.length === 1) {
    return `RECORD_ID()='${escapeAirtableFormulaString(ids[0])}'`;
  }
  return `OR(${ids
    .map((id) => `RECORD_ID()='${escapeAirtableFormulaString(id)}'`)
    .join(",")})`;
}

async function fetchEventsByIds(
  ids: string[],
): Promise<{ events: Map<string, EventInfo>; failed: boolean }> {
  const unique = [...new Set(ids.filter((id) => isRecordId(id)))];
  const events = new Map<string, EventInfo>();
  if (unique.length === 0) return { events, failed: false };

  const eventsTable = getEventsTableName();
  const fields = [EVENT_NAME_FIELD, EVENT_DATE_FIELD];
  let failed = false;

  for (let index = 0; index < unique.length; index += PERSON_CHUNK_SIZE) {
    const chunk = unique.slice(index, index + PERSON_CHUNK_SIZE);
    const formula = recordIdFilterFormula(chunk);
    const result = await queryTable({
      table: eventsTable,
      fields,
      filterByFormula: formula,
    });

    if (!result.ok) {
      failed = true;
      logAttendanceError("Events for attendance", {
        status: result.status,
        type: result.type,
        message: result.message,
        table: eventsTable,
        fields,
        filterByFormula: formula,
      });
      continue;
    }

    for (const record of result.records) {
      if (!record.id) continue;
      const name = asTrimmedString(record.fields?.[EVENT_NAME_FIELD]);
      const dateRaw = asTrimmedString(record.fields?.[EVENT_DATE_FIELD]);
      events.set(record.id, {
        name,
        dateMs: parseDateOnlyMs(dateRaw),
        dateLabel: formatEventDate(dateRaw),
      });
    }
  }

  return { events, failed };
}

/**
 * Batch-load Attendance + Events for People record IDs.
 * Application record IDs are never used here — only People IDs from
 * Applications.Linked Person / Attendance.Linked Person.
 * Only Attendance Status = "Checked In" counts as attended.
 */
export async function fetchAttendanceByPersonIds(
  personIds: string[],
): Promise<AttendanceByPersonResult> {
  const unique = [...new Set(personIds.filter((id) => isRecordId(id)))];
  const byPerson = new Map<string, ConciergeAttendanceDetail>();
  const debugByPerson = new Map<string, PersonAttendanceDebug>();
  for (const id of unique) {
    byPerson.set(id, emptyAttendance());
    debugByPerson.set(id, { matchingCount: 0, statuses: [] });
  }

  if (unique.length === 0) return { ok: true, byPerson, debugByPerson };

  const attendanceFields = [
    LINKED_PERSON_FIELD,
    LINKED_EVENT_FIELD,
    ATTENDANCE_STATUS_FIELD,
  ];
  const attendanceRecords: AirtableRecord[] = [];

  for (let index = 0; index < unique.length; index += PERSON_CHUNK_SIZE) {
    const chunk = unique.slice(index, index + PERSON_CHUNK_SIZE);
    const formula = personFilterFormula(chunk);
    const result = await queryTable({
      table: ATTENDANCE_TABLE,
      fields: attendanceFields,
      filterByFormula: formula,
    });

    if (!result.ok) {
      logAttendanceError("Attendance by Linked Person", {
        status: result.status,
        type: result.type,
        message: result.message,
        table: ATTENDANCE_TABLE,
        fields: attendanceFields,
        filterByFormula: formula,
      });
      return { ok: false };
    }

    attendanceRecords.push(...result.records);
  }

  if (attendanceRecords.length === 0) {
    const checkedInFormula = `LOWER({${ATTENDANCE_STATUS_FIELD}})='${CHECKED_IN_STATUS}'`;
    const fallback = await queryTable({
      table: ATTENDANCE_TABLE,
      fields: attendanceFields,
      filterByFormula: checkedInFormula,
    });
    if (!fallback.ok) {
      logAttendanceError("Attendance Checked In fallback", {
        status: fallback.status,
        type: fallback.type,
        message: fallback.message,
        table: ATTENDANCE_TABLE,
        fields: attendanceFields,
        filterByFormula: checkedInFormula,
      });
    } else {
      attendanceRecords.push(...fallback.records);
    }
  }

  const checkedInEventIdsByPerson = new Map<string, Set<string>>();
  let checkedInCount = 0;

  for (const record of attendanceRecords) {
    const fields = record.fields ?? {};
    const people = recordIds(fields[LINKED_PERSON_FIELD]).filter((id) =>
      byPerson.has(id),
    );
    if (people.length === 0) continue;

    const statusRaw = asTrimmedString(fields[ATTENDANCE_STATUS_FIELD]);
    const checkedIn = isCheckedInStatus(statusRaw);
    const eventIds = recordIds(fields[LINKED_EVENT_FIELD]);

    if (checkedIn) checkedInCount += 1;

    for (const personId of people) {
      const debug = debugByPerson.get(personId) ?? {
        matchingCount: 0,
        statuses: [],
      };
      debug.matchingCount += 1;
      debug.statuses.push(statusRaw || "(blank)");
      debugByPerson.set(personId, debug);

      if (!checkedIn) continue;

      const current = byPerson.get(personId) ?? emptyAttendance();
      current.hasEverAttended = true;
      byPerson.set(personId, current);

      if (eventIds.length === 0) continue;
      const existing = checkedInEventIdsByPerson.get(personId) ?? new Set();
      for (const eventId of eventIds) existing.add(eventId);
      checkedInEventIdsByPerson.set(personId, existing);
    }
  }

  const allEventIds = [
    ...new Set(
      [...checkedInEventIdsByPerson.values()].flatMap((ids) => [...ids]),
    ),
  ];
  const eventLookup = await fetchEventsByIds(allEventIds);

  for (const [personId, eventIds] of checkedInEventIdsByPerson) {
    const current = byPerson.get(personId);
    if (!current) continue;
    const events = [...eventIds]
      .map((id) => eventLookup.events.get(id))
      .filter((event): event is EventInfo => event != null);
    const latest = pickLatestEvent(events);
    if (!latest) continue;
    current.lastEventName = latest.name || undefined;
    current.lastEventDate = latest.dateLabel || undefined;
    current.lastEventAttended = formatLastEventAttended(latest);
    byPerson.set(personId, current);
  }

  console.error("[Concierge Attendance]", {
    peopleRequested: unique.length,
    attendanceRecordsRetrieved: attendanceRecords.length,
    checkedInRecords: checkedInCount,
    eventsRequested: allEventIds.length,
    eventsRetrieved: eventLookup.events.size,
    eventsLookupFailed: eventLookup.failed,
  });

  return { ok: true, byPerson, debugByPerson };
}
