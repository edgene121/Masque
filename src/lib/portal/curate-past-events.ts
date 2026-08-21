import type { PortalEvent } from "@/data/events";

function fold(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function eventHaystack(event: PortalEvent): string {
  return fold(
    [event.brandTitle, event.name, event.series, event.date].join(" "),
  );
}

function hasArtwork(event: PortalEvent): boolean {
  return Boolean(event.artworkUrl?.trim());
}

/** Generic Nocturne rows that are not Le Rêve Noir. Never shown in Past Events. */
export function isExcludedPastEvent(event: PortalEvent): boolean {
  const hay = eventHaystack(event);
  if (hay.includes("reve noir") || hay.includes("reves noir")) return false;
  if (isMasqueraveII(event) || isBound(event)) return false;
  if (hay.includes("nocturne new")) return true;
  if (hay.includes("nocturne") && !hay.includes("atelier") && !hay.includes("chambre")) {
    return true;
  }
  return false;
}

function isLeReveNoir(event: PortalEvent): boolean {
  const hay = eventHaystack(event);
  return hay.includes("reve noir") || hay.includes("reves noir");
}

function isMasqueraveII(event: PortalEvent): boolean {
  const hay = eventHaystack(event);
  return /\bmasquerave ii\b/.test(hay) || hay.includes("masquerave 2");
}

function isBound(event: PortalEvent): boolean {
  const hay = eventHaystack(event);
  return /\bbound\b/.test(hay);
}

function isComplicit(event: PortalEvent): boolean {
  return eventHaystack(event).includes("complicit");
}

function isBeautifulThingsHurt(event: PortalEvent): boolean {
  return eventHaystack(event).includes("beautiful things hurt");
}

function isMidnightMasque(event: PortalEvent): boolean {
  const hay = eventHaystack(event);
  return hay.includes("undisclosed") || hay.includes("midnight masque");
}

function isMasqueraveOriginal(event: PortalEvent): boolean {
  const hay = eventHaystack(event);
  return /\bmasquerave\b/.test(hay) && !isMasqueraveII(event);
}

/**
 * Fallback order for the curated Past Events reference set.
 * Airtable "Portal Display Order" is ignored for excluded Nocturne drafts.
 */
export function fallbackPastDisplayOrder(event: PortalEvent): number | null {
  if (isLeReveNoir(event)) return 1;
  if (isMasqueraveII(event)) return 2;
  if (isBound(event)) return 3;
  if (isComplicit(event)) return 4;
  if (isBeautifulThingsHurt(event)) return 5;
  if (isMidnightMasque(event)) return 6;
  if (isMasqueraveOriginal(event)) return 7;
  return null;
}

export function effectivePastDisplayOrder(event: PortalEvent): number {
  if (isExcludedPastEvent(event)) return Number.MAX_SAFE_INTEGER;
  if (event.displayOrder != null && Number.isFinite(event.displayOrder)) {
    return event.displayOrder;
  }
  return fallbackPastDisplayOrder(event) ?? Number.MAX_SAFE_INTEGER;
}

function preferCanonical(a: PortalEvent, b: PortalEvent): PortalEvent {
  const score = (event: PortalEvent): number => {
    const hay = eventHaystack(event);
    let value = 0;
    if (hasArtwork(event)) value += 20;
    if (isMasqueraveII(event)) {
      if (event.date === "2026-07-25") value += 16;
      if (hay.includes("july 25")) value += 12;
      if (hay.includes("yacht")) value += 6;
    }
    if (isBound(event)) {
      if (event.date === "2026-06-27") value += 16;
      if (hay.includes("june 27")) value += 12;
      if (hay.includes("atelier")) value += 6;
    }
    if (isLeReveNoir(event) && hay.includes("nocturne")) value += 6;
    return value;
  };

  const aScore = score(a);
  const bScore = score(b);
  if (aScore !== bScore) return aScore > bScore ? a : b;
  return a.name.length >= b.name.length ? a : b;
}

export function sortPastEventsForDisplay(events: PortalEvent[]): PortalEvent[] {
  return [...events].sort((a, b) => {
    const aOrder = effectivePastDisplayOrder(a);
    const bOrder = effectivePastDisplayOrder(b);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (b.date || "").localeCompare(a.date || "");
  });
}

/**
 * Build the Past Events array that the grid should render:
 * curated reference events first (deduped), drafts excluded.
 */
export function curatePastEvents(events: PortalEvent[]): PortalEvent[] {
  const eligible = events.filter((event) => !isExcludedPastEvent(event));
  const byOrder = new Map<number, PortalEvent>();
  const remainder: PortalEvent[] = [];

  for (const event of eligible) {
    const fallback = fallbackPastDisplayOrder(event);
    if (fallback != null) {
      const existing = byOrder.get(fallback);
      byOrder.set(fallback, existing ? preferCanonical(event, existing) : event);
      continue;
    }
    remainder.push(event);
  }

  const curated = [...byOrder.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, event]) => event);

  remainder.sort((a, b) => {
    const aOrder = effectivePastDisplayOrder(a);
    const bOrder = effectivePastDisplayOrder(b);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (b.date || "").localeCompare(a.date || "");
  });

  return [...curated, ...remainder];
}

export function pastEventOrderLog(events: PortalEvent[]) {
  return events.map((event) => ({
    name: [event.brandTitle, event.name].filter(Boolean).join(" "),
    date: event.date,
    displayOrder: event.displayOrder,
    effectiveOrder: effectivePastDisplayOrder(event),
    excluded: isExcludedPastEvent(event),
  }));
}
