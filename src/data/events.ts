/** Shared portal event types + display helpers (no hardcoded event records). */

import type { FeaturedEventData } from "@/types/dashboard";

export interface PortalEvent {
  id: string;
  /** Optional eyebrow / series line from Airtable Name split */
  brandTitle: string;
  /**
   * Dedicated Airtable series/category/brand line for the featured eyebrow.
   * Independent of Name-colon splitting so Past Event cards stay unchanged.
   */
  series: string;
  /** Primary event title */
  name: string;
  location: string;
  /** ISO date YYYY-MM-DD when available */
  date: string;
  description: string;
  href: string;
  imageSrc?: string;
  /** First Airtable Event Artwork (or equivalent image) attachment URL */
  artworkUrl: string | null;
  /** Airtable Status when present (e.g. Open / Closed) */
  status: string;
  kind: "upcoming" | "past";
}

export function toFeaturedEventData(
  event: PortalEvent,
  accessLabel = "Members Only",
): FeaturedEventData {
  const title = [event.brandTitle, event.name]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  return {
    id: event.id,
    title: title || "Event",
    description: event.description,
    date: event.date,
    accessLabel,
    href: event.href,
    imageSrc: event.imageSrc,
  };
}

export function formatPortalEventDate(isoDate: string): string {
  const trimmed = isoDate.trim();
  if (!trimmed) return "—";

  const date = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(date.getTime())) return trimmed;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatGatheringTeaser(isoDate: string): string {
  const trimmed = isoDate.trim();
  if (!trimmed) return "";

  const date = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  const monthDay = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(date);

  return `The Next Gathering Begins ${monthDay}`;
}
