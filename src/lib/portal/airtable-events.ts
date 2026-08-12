import "server-only";

import { getAirtableConfig } from "@/lib/admin/config";
import type { PortalEvent } from "@/data/events";
import { toFeaturedEventData } from "@/data/events";
import type { FeaturedEventData } from "@/types/dashboard";

const EVENTS_TABLE =
  process.env.AIRTABLE_EVENTS_TABLE?.trim() || "Events";

interface AirtableAttachment {
  url?: string;
  filename?: string;
  type?: string;
}

interface AirtableEventFields {
  Name?: unknown;
  Date?: unknown;
  DateFormatted?: unknown;
  Status?: unknown;
  Location?: unknown;
  Venue?: unknown;
  Description?: unknown;
  "Event ID"?: unknown;
  "Event URL"?: unknown;
  "Event Link"?: unknown;
  "General Link"?: unknown;
  "Featured Image"?: unknown;
  Poster?: unknown;
  Image?: unknown;
  Photos?: unknown;
  [key: string]: unknown;
}

interface AirtableEventRecord {
  id: string;
  createdTime?: string;
  fields?: AirtableEventFields;
}

interface AirtableListResponse {
  records?: AirtableEventRecord[];
  offset?: string;
  error?: { type?: string; message?: string };
}

export type PortalEventsResult =
  | { ok: true; upcoming: PortalEvent[]; past: PortalEvent[] }
  | { ok: false; error: string };

function asTrimmedString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

function firstAttachmentUrl(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "";
  const first = value[0] as AirtableAttachment;
  if (!first || typeof first !== "object") return "";
  return asTrimmedString(first.url);
}

function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeEventDate(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  // Airtable date fields are typically YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function splitEventName(fullName: string): { brandTitle: string; name: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { brandTitle: "", name: "" };

  const colonIndex = trimmed.indexOf(":");
  if (colonIndex > 0 && colonIndex < trimmed.length - 1) {
    return {
      brandTitle: trimmed.slice(0, colonIndex).trim(),
      name: trimmed.slice(colonIndex + 1).trim(),
    };
  }

  return { brandTitle: "", name: trimmed };
}

function resolveSlug(fields: AirtableEventFields, recordId: string): string {
  const eventId = asTrimmedString(fields["Event ID"]);
  if (eventId) return eventId;

  const eventUrl = asTrimmedString(fields["Event URL"]);
  if (eventUrl) {
    try {
      const url = new URL(eventUrl);
      const parts = url.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last) return decodeURIComponent(last);
    } catch {
      const parts = eventUrl.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last) return last;
    }
  }

  const fromName = slugify(asTrimmedString(fields.Name));
  if (fromName) return fromName;

  return recordId;
}

function resolveLocation(fields: AirtableEventFields): string {
  return (
    asTrimmedString(fields.Location) ||
    asTrimmedString(fields.Venue) ||
    asTrimmedString(fields["Venue Name"]) ||
    ""
  );
}

function resolveDescription(fields: AirtableEventFields): string {
  return (
    asTrimmedString(fields.Description) ||
    asTrimmedString(fields["Event Description"]) ||
    asTrimmedString(fields.About) ||
    ""
  );
}

function resolveImage(fields: AirtableEventFields): string {
  return (
    firstAttachmentUrl(fields["Featured Image"]) ||
    firstAttachmentUrl(fields.Poster) ||
    firstAttachmentUrl(fields.Image) ||
    firstAttachmentUrl(fields.Photos) ||
    ""
  );
}

function mapEventRecord(record: AirtableEventRecord): PortalEvent | null {
  if (!record?.id) return null;
  const fields = record.fields ?? {};
  const fullName = asTrimmedString(fields.Name);
  const date = normalizeEventDate(asTrimmedString(fields.Date));
  if (!fullName && !date) return null;

  const { brandTitle, name } = splitEventName(fullName);
  const slug = resolveSlug(fields, record.id);
  const today = todayIsoDate();
  const kind: "upcoming" | "past" =
    date && date < today ? "past" : "upcoming";

  // Events without a usable date are treated as upcoming only if Status is Open;
  // otherwise skip undated closed rows from featured/past grids.
  if (!date) {
    const status = asTrimmedString(fields.Status).toLowerCase();
    if (status === "closed") return null;
  }

  return {
    id: record.id,
    brandTitle,
    name: name || fullName || "Event",
    location: resolveLocation(fields),
    date,
    description: resolveDescription(fields),
    href: `/events/${encodeURIComponent(slug)}`,
    imageSrc: resolveImage(fields) || undefined,
    status: asTrimmedString(fields.Status),
    kind: date ? kind : "upcoming",
  };
}

async function fetchAllEventRecords(): Promise<
  | { ok: true; records: AirtableEventRecord[] }
  | { ok: false; error: string }
> {
  let accessToken: string;
  let baseId: string;

  try {
    ({ accessToken, baseId } = getAirtableConfig());
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Events Airtable Error]", {
        status: null,
        errorType: "CONFIG",
        message:
          error instanceof Error ? error.message : "Missing Airtable configuration",
        table: EVENTS_TABLE,
        baseId: process.env.AIRTABLE_BASE_ID
          ? "[set]"
          : "[missing]",
        filterFormula: null,
        sortField: null,
      });
    }
    return { ok: false, error: "Unable to load events right now." };
  }

  const encodedTable = encodeURIComponent(EVENTS_TABLE);
  const records: AirtableEventRecord[] = [];
  let offset: string | undefined;
  // Upcoming/Past split happens in app code — no Airtable filter/sort on list.
  const filterFormula: string | null = null;
  const sortField: string | null = null;

  try {
    do {
      const params = new URLSearchParams({ pageSize: "100" });
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
        let errorType: string | null = null;
        let message = "";
        try {
          const raw = await response.text();
          try {
            const payload = JSON.parse(raw) as AirtableListResponse;
            errorType = payload.error?.type ?? null;
            message = payload.error?.message ?? raw.slice(0, 500);
          } catch {
            message = raw.slice(0, 500) || "[empty response body]";
          }
        } catch {
          message = "[unreadable response body]";
        }

        if (process.env.NODE_ENV === "development") {
          console.error("[Events Airtable Error]", {
            status: response.status,
            errorType,
            message,
            table: EVENTS_TABLE,
            baseId,
            filterFormula,
            sortField,
          });
        }
        return { ok: false, error: "Unable to load events right now." };
      }

      const data = (await response.json()) as AirtableListResponse;
      if (!Array.isArray(data.records)) {
        if (process.env.NODE_ENV === "development") {
          console.error("[Events Airtable Error]", {
            status: response.status,
            errorType: data.error?.type ?? "INVALID_RESPONSE",
            message:
              data.error?.message ?? "Airtable response missing records array",
            table: EVENTS_TABLE,
            baseId,
            filterFormula,
            sortField,
          });
        }
        return { ok: false, error: "Unable to load events right now." };
      }

      records.push(...data.records);
      offset = data.offset;
    } while (offset);

    return { ok: true, records };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Events Airtable Error]", {
        status: null,
        errorType: "NETWORK",
        message: error instanceof Error ? error.message : String(error),
        table: EVENTS_TABLE,
        baseId,
        filterFormula,
        sortField,
      });
    }
    return { ok: false, error: "Unable to load events right now." };
  }
}

function sortByDateAsc(a: PortalEvent, b: PortalEvent): number {
  return (a.date || "").localeCompare(b.date || "");
}

function sortByDateDesc(a: PortalEvent, b: PortalEvent): number {
  return (b.date || "").localeCompare(a.date || "");
}

/**
 * Load Member Portal events from Airtable "Events" table.
 * Upcoming: Date >= today (ascending). Past: Date < today (descending).
 */
export async function listPortalEvents(): Promise<PortalEventsResult> {
  const fetched = await fetchAllEventRecords();
  if (!fetched.ok) return fetched;

  const mapped = fetched.records
    .map(mapEventRecord)
    .filter((event): event is PortalEvent => Boolean(event));

  const upcoming = mapped
    .filter((event) => event.kind === "upcoming")
    .sort(sortByDateAsc);

  const past = mapped
    .filter((event) => event.kind === "past")
    .sort(sortByDateDesc);

  return { ok: true, upcoming, past };
}

export async function getFeaturedPortalEvent(): Promise<PortalEvent | null> {
  const result = await listPortalEvents();
  if (!result.ok) return null;
  return result.upcoming[0] ?? null;
}

export async function getFeaturedEventForDashboard(): Promise<FeaturedEventData | null> {
  const event = await getFeaturedPortalEvent();
  if (!event) return null;
  return toFeaturedEventData(event);
}

export function getEventsTableName(): string {
  return EVENTS_TABLE;
}
