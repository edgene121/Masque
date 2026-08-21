import type { PortalEvent } from "@/data/events";

export const BLACK_SWAN_EVENT_PATH = "/events/black-swan-theory";
export const BLACK_SWAN_EVENT_SLUG = "black-swan-theory";

const TEMPORARY_BLACK_SWAN_EVENT_ID = "temporary-black-swan-theory";

export function isBlackSwanPortalEvent(event: PortalEvent): boolean {
  const slug = event.href.split("/").filter(Boolean).pop()?.toLowerCase() ?? "";
  const haystack = [event.name, event.brandTitle, event.series, slug, event.href]
    .join(" ")
    .toLowerCase();

  return (
    slug === BLACK_SWAN_EVENT_SLUG ||
    haystack.includes("black-swan-theory") ||
    haystack.includes("black swan theory")
  );
}

function createTemporaryBlackSwanEvent(): PortalEvent {
  return {
    id: TEMPORARY_BLACK_SWAN_EVENT_ID,
    brandTitle: "MASQUÉ : ATELIER",
    series: "MASQUÉ : ATELIER",
    name: "BLACK SWAN THEORY",
    location: "Washington, DC",
    date: "2026-09-26",
    description: "",
    href: BLACK_SWAN_EVENT_PATH,
    artworkUrl: null,
    status: "",
    kind: "upcoming",
  };
}

/**
 * Temporary Events-page merge until Airtable includes Black Swan Theory.
 * Remove this helper once the Airtable Events record exists.
 */
export function mergeBlackSwanIntoUpcoming(
  upcoming: PortalEvent[],
): PortalEvent[] {
  const withProtectedHref = upcoming.map((event) =>
    isBlackSwanPortalEvent(event)
      ? { ...event, href: BLACK_SWAN_EVENT_PATH }
      : event,
  );

  if (withProtectedHref.some(isBlackSwanPortalEvent)) {
    return withProtectedHref;
  }

  return [createTemporaryBlackSwanEvent(), ...withProtectedHref];
}

export function remapBlackSwanHref(events: PortalEvent[]): PortalEvent[] {
  return events.map((event) =>
    isBlackSwanPortalEvent(event)
      ? { ...event, href: BLACK_SWAN_EVENT_PATH }
      : event,
  );
}

function normalizeEventKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Hide only Le Rêve Noir from the Member Portal Upcoming Events UI.
 * Does not delete the Airtable record or affect Past Events / Home featured.
 */
export function isLeReveNoirPortalEvent(event: PortalEvent): boolean {
  const slug = event.href.split("/").filter(Boolean).pop() ?? "";
  const haystack = normalizeEventKey(
    [event.name, event.brandTitle, event.series, slug].join(" "),
  );

  return (
    normalizeEventKey(slug) === "le-reve-noir" ||
    haystack.includes("le reve noir")
  );
}

export function hideLeReveNoirFromUpcoming(
  upcoming: PortalEvent[],
): PortalEvent[] {
  return upcoming.filter((event) => !isLeReveNoirPortalEvent(event));
}
