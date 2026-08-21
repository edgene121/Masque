import "server-only";

import { getAirtableConfig } from "@/lib/admin/config";
import type { PortalEvent } from "@/data/events";
import { toFeaturedEventData } from "@/data/events";
import type { FeaturedEventData } from "@/types/dashboard";
import { curatePastEvents } from "@/lib/portal/curate-past-events";

const EVENTS_TABLE =
  process.env.AIRTABLE_EVENTS_TABLE?.trim() || "Events";

interface AirtableEventFields {
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

const TITLE_FIELD_NAMES = [
  "Name",
  "Title",
  "Event Name",
  "Event Title",
  "Event",
];

const DATE_FIELD_NAMES = [
  "Date",
  "Event Date",
  "Start Date",
  "Starts",
  "When",
];

const LOCATION_FIELD_NAMES = [
  "Location",
  "Venue",
  "Venue Name",
  "Event Location",
  "City",
  "Address",
  "Place",
  "Where",
];

const DESCRIPTION_FIELD_NAMES = [
  "Description",
  "Event Description",
  "Long Description",
  "Short Description",
  "Full Description",
  "About",
  "Details",
  "Event Details",
  "Event Info",
  "Info",
  "Summary",
  "Event Summary",
  "Body",
  "Notes",
  "Copy",
  "Blurb",
  "Overview",
  "Intro",
  "Synopsis",
  "Content",
  "Event Content",
  "Narrative",
  "Writeup",
  "Caption",
];

const SERIES_FIELD_NAMES = [
  "Eyebrow",
  "Series Line",
  "Event Series",
  "Series",
  "Category",
  "Event Category",
  "Collection",
  "Theme",
  "Season",
  "Subtitle",
];

const BRAND_FIELD_NAMES = ["Brand", "Brand Name"];

const IMAGE_FIELD_NAMES = [
  "Event Artwork",
  "Featured Image",
  "Poster",
  "Flyer",
  "Event Flyer",
  "Event Poster",
  "Event Image",
  "Cover Image",
  "Cover",
  "Image",
  "Photo",
  "Photos",
  "Artwork",
  "Thumbnail",
  "Hero",
  "Banner",
  "Graphic",
  "Attachments",
  "Attachment",
  "Media",
  "Visual",
];

const URL_FIELD_NAMES = [
  "Event URL",
  "Event Link",
  "General Link",
  "URL",
  "Link",
  "Website",
  "RSVP",
  "RSVP Link",
  "Ticket URL",
  "Tickets",
];

const STATUS_FIELD_NAMES = ["Status", "Event Status", "State"];

const DISPLAY_ORDER_FIELD_NAMES = [
  "Portal Display Order",
  "Display Order",
  "Portal Order",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecordId(value: string): boolean {
  return /^rec[a-zA-Z0-9]{10,}$/.test(value);
}

function asOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return null;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (Array.isArray(value) && value.length > 0) {
    return asOptionalNumber(value[0]);
  }
  return null;
}

function asTrimmedString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

/** Display text from strings, selects, lookups, and linked-record name arrays. */
function asDisplayString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => asDisplayString(item))
      .filter((part) => part && !isRecordId(part))
      .join(", ");
  }
  if (isPlainObject(value)) {
    return (
      asTrimmedString(value.name) ||
      asTrimmedString(value.label) ||
      asTrimmedString(value.text) ||
      asTrimmedString(value.value) ||
      ""
    );
  }
  return "";
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function thumbnailUrl(value: unknown): string {
  if (!isPlainObject(value)) return "";
  for (const size of ["full", "large", "small"] as const) {
    const thumb = value[size];
    if (isPlainObject(thumb)) {
      const url = asTrimmedString(thumb.url);
      if (isHttpUrl(url)) return url;
    }
  }
  return "";
}

/**
 * Pull the first usable HTTP URL from an attachment array, nested lookup,
 * button field, or plain URL string.
 */
function extractHttpUrl(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    return isHttpUrl(trimmed) ? trimmed : "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractHttpUrl(item);
      if (found) return found;
    }
    return "";
  }
  if (isPlainObject(value)) {
    const direct = asTrimmedString(value.url);
    if (isHttpUrl(direct)) return direct;
    const fromThumbs = thumbnailUrl(value.thumbnails);
    if (fromThumbs) return fromThumbs;
  }
  return "";
}

function looksLikeAttachmentValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    return value.some((item) => looksLikeAttachmentValue(item));
  }
  if (!isPlainObject(value)) return false;
  if (typeof value.url === "string" && isHttpUrl(value.url)) return true;
  if (typeof value.filename === "string" && value.filename.trim()) return true;
  return Boolean(thumbnailUrl(value.thumbnails));
}

function getFieldByNames(
  fields: AirtableEventFields,
  names: string[],
): unknown {
  for (const name of names) {
    if (!Object.prototype.hasOwnProperty.call(fields, name)) continue;
    const value = fields[name];
    if (value != null && value !== "") return value;
  }

  const lowerToKey = new Map(
    Object.keys(fields).map((key) => [key.toLowerCase(), key]),
  );
  for (const name of names) {
    const key = lowerToKey.get(name.toLowerCase());
    if (!key) continue;
    const value = fields[key];
    if (value != null && value !== "") return value;
  }

  return undefined;
}

function describeFieldKind(value: unknown): string {
  if (value == null) return "empty";
  if (typeof value === "string") return "string";
  if (typeof value === "number" || typeof value === "boolean") {
    return typeof value;
  }
  if (Array.isArray(value)) {
    if (looksLikeAttachmentValue(value)) return "attachment[]";
    if (value.length === 0) return "array(empty)";
    if (typeof value[0] === "string") return "string[]";
    if (Array.isArray(value[0])) return "nested-array";
    if (isPlainObject(value[0])) return "object[]";
    return "array";
  }
  if (isPlainObject(value)) {
    if (looksLikeAttachmentValue(value)) return "attachment";
    return "object";
  }
  return typeof value;
}

function logEventFieldInventory(records: AirtableEventRecord[]): void {
  if (process.env.NODE_ENV !== "development" || records.length === 0) return;

  const kinds: Record<string, string> = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record.fields ?? {})) {
      if (!kinds[key]) kinds[key] = describeFieldKind(value);
    }
  }

  console.info("[Events Airtable] field names:", Object.keys(kinds));
  console.info("[Events Airtable] field kinds:", kinds);
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

function resolveSlug(
  fields: AirtableEventFields,
  recordId: string,
  fullName: string,
): string {
  const eventId = asDisplayString(getFieldByNames(fields, ["Event ID", "Slug"]));
  if (eventId && !isHttpUrl(eventId)) return eventId;

  const eventUrl = extractHttpUrl(getFieldByNames(fields, URL_FIELD_NAMES));
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

  const fromName = slugify(fullName);
  if (fromName) return fromName;

  return recordId;
}

function resolveByNamesOrPattern(
  fields: AirtableEventFields,
  names: string[],
  pattern: RegExp,
): string {
  const fromNames = asDisplayString(getFieldByNames(fields, names));
  if (fromNames) return fromNames;

  for (const [key, value] of Object.entries(fields)) {
    if (!pattern.test(key)) continue;
    const text = asDisplayString(value);
    if (text) return text;
  }

  return "";
}

function resolveLocation(fields: AirtableEventFields): string {
  return resolveByNamesOrPattern(
    fields,
    LOCATION_FIELD_NAMES,
    /location|venue|city|address|place/i,
  );
}

function resolveDisplayOrder(fields: AirtableEventFields): number | null {
  return asOptionalNumber(getFieldByNames(fields, DISPLAY_ORDER_FIELD_NAMES));
}

function resolveDescription(fields: AirtableEventFields): string {
  const named = resolveByNamesOrPattern(
    fields,
    DESCRIPTION_FIELD_NAMES,
    /description|about|details|summary|blurb|overview|copy|info|intro|synopsis|narrative|writeup/i,
  );
  if (named) return named;

  let longest = "";
  for (const [key, value] of Object.entries(fields)) {
    if (
      /email|url|link|id|status|date|image|photo|poster|flyer|attachment/i.test(
        key,
      )
    ) {
      continue;
    }
    if (looksLikeAttachmentValue(value)) continue;
    const text = asDisplayString(value);
    if (isHttpUrl(text)) continue;
    if (text.length >= 80 && text.length > longest.length) {
      longest = text;
    }
  }

  return longest;
}

function resolveSeries(fields: AirtableEventFields, nameSplitBrand: string): string {
  const dedicatedLine = asDisplayString(
    getFieldByNames(fields, ["Eyebrow", "Series Line"]),
  );
  if (dedicatedLine) return dedicatedLine;

  const brand =
    asDisplayString(getFieldByNames(fields, BRAND_FIELD_NAMES)) ||
    nameSplitBrand;
  const series = resolveByNamesOrPattern(
    fields,
    SERIES_FIELD_NAMES,
    /series|category|collection|theme|season|subtitle/i,
  );

  if (brand && series && brand.toLowerCase() !== series.toLowerCase()) {
    if (series.includes("·") || series.includes("•")) return series;
    if (brand.includes("·") || brand.includes("•")) return brand;
    return `${brand} · ${series}`;
  }

  return series || brand || "";
}

function isProbablyImageUrl(url: string): boolean {
  if (!isHttpUrl(url)) return false;
  if (/\.(avif|gif|jpe?g|png|svg|webp)(\?|$)/i.test(url)) return true;
  return /airtableusercontent\.com|dl\.airtable\.com/i.test(url);
}

function resolveArtworkUrl(fields: AirtableEventFields): string | null {
  try {
    const attachments =
      fields["Event Artwork"] ?? getFieldByNames(fields, ["Event Artwork"]);

    if (!Array.isArray(attachments) || attachments.length === 0) {
      return null;
    }

    const first = attachments[0];
    if (
      isPlainObject(first) &&
      typeof first.url === "string" &&
      isHttpUrl(first.url.trim())
    ) {
      return first.url.trim();
    }

    return null;
  } catch {
    return null;
  }
}

function resolveImage(fields: AirtableEventFields): string {
  for (const name of IMAGE_FIELD_NAMES) {
    const value = getFieldByNames(fields, [name]);
    if (value == null) continue;
    const url = extractHttpUrl(value);
    if (url && (looksLikeAttachmentValue(value) || isProbablyImageUrl(url))) {
      return url;
    }
  }

  for (const value of Object.values(fields)) {
    if (!looksLikeAttachmentValue(value)) continue;
    const url = extractHttpUrl(value);
    if (url) return url;
  }

  for (const [key, value] of Object.entries(fields)) {
    if (!/image|photo|poster|flyer|cover|art|thumb|media|graphic|banner|hero/i.test(key)) {
      continue;
    }
    const url = extractHttpUrl(value);
    if (url && isProbablyImageUrl(url)) return url;
  }

  return "";
}

function resolveHref(
  fields: AirtableEventFields,
  slug: string,
): string {
  const external = extractHttpUrl(getFieldByNames(fields, URL_FIELD_NAMES));
  if (external) return external;
  return `/events/${encodeURIComponent(slug)}`;
}

function mapEventRecord(record: AirtableEventRecord): PortalEvent | null {
  if (!record?.id) return null;
  const fields = record.fields ?? {};
  const fullName = asDisplayString(getFieldByNames(fields, TITLE_FIELD_NAMES));
  const date = normalizeEventDate(
    asDisplayString(getFieldByNames(fields, DATE_FIELD_NAMES)),
  );
  if (!fullName && !date) return null;

  const { brandTitle, name } = splitEventName(fullName);
  const series = resolveSeries(fields, brandTitle);
  const slug = resolveSlug(fields, record.id, fullName);
  const today = todayIsoDate();
  const status = asDisplayString(getFieldByNames(fields, STATUS_FIELD_NAMES));
  const statusLower = status.toLowerCase();
  const kind: "upcoming" | "past" =
    date && date < today ? "past" : "upcoming";

  // Events without a usable date are treated as upcoming only if Status is Open;
  // otherwise skip undated closed rows from featured/past grids.
  if (!date) {
    if (
      statusLower === "closed" ||
      statusLower === "past" ||
      statusLower === "completed" ||
      statusLower === "ended"
    ) {
      return null;
    }
  }

  const artworkUrl = resolveArtworkUrl(fields);

  return {
    id: record.id,
    brandTitle,
    series,
    name: name || fullName || "Event",
    location: resolveLocation(fields),
    date,
    description: resolveDescription(fields),
    href: resolveHref(fields, slug),
    imageSrc: resolveImage(fields) || undefined,
    artworkUrl,
    status,
    displayOrder: resolveDisplayOrder(fields),
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

/**
 * Load Member Portal events from Airtable "Events" table.
 * Upcoming: Date >= today (ascending).
 * Past: curated Portal Display Order / reference order (see curatePastEvents).
 */
export async function listPortalEvents(): Promise<PortalEventsResult> {
  const fetched = await fetchAllEventRecords();
  if (!fetched.ok) return fetched;

  logEventFieldInventory(fetched.records);

  const mapped = fetched.records
    .map(mapEventRecord)
    .filter((event): event is PortalEvent => Boolean(event));

  if (process.env.NODE_ENV === "development") {
    console.info("[Events Airtable] mapped coverage", {
      total: mapped.length,
      withImage: mapped.filter((event) => Boolean(event.imageSrc)).length,
      withLocation: mapped.filter((event) => Boolean(event.location)).length,
      withDescription: mapped.filter((event) => Boolean(event.description)).length,
    });
  }

  const upcoming = mapped
    .filter((event) => event.kind === "upcoming")
    .sort(sortByDateAsc);

  const past = curatePastEvents(mapped.filter((event) => event.kind === "past"));

  if (process.env.NODE_ENV === "development") {
    console.info(
      "FINAL PAST EVENT ORDER",
      past.map((event) => ({
        name: [event.brandTitle, event.name].filter(Boolean).join(" "),
        date: event.date,
        displayOrder: event.displayOrder,
      })),
    );
  }

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

function decodePathSegment(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function portalEventHrefSegment(event: PortalEvent): string {
  if (isHttpUrl(event.href)) return "";
  const last = event.href.split("/").filter(Boolean).pop() ?? "";
  return decodePathSegment(last);
}

/**
 * Resolve a Member Portal event by the same identifier already used in
 * `event.href` (`/events/{slug}`) or by Airtable record ID.
 */
export async function getPortalEventBySlug(
  slug: string,
): Promise<PortalEvent | null> {
  const requested = decodePathSegment(slug);
  if (!requested) return null;

  const result = await listPortalEvents();
  if (!result.ok) return null;

  const all = [...result.upcoming, ...result.past];
  return (
    all.find((event) => {
      if (event.id === requested || event.id === slug.trim()) return true;
      const segment = portalEventHrefSegment(event);
      return Boolean(segment) && (segment === requested || segment === slug.trim());
    }) ?? null
  );
}

export function getEventsTableName(): string {
  return EVENTS_TABLE;
}
