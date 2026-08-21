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
  return fold([event.brandTitle, event.name, event.series].join(" "));
}

/**
 * Fallback order for the curated Past Events reference set.
 * Airtable "Portal Display Order" overrides this when present.
 */
export function fallbackPastDisplayOrder(event: PortalEvent): number | null {
  const hay = eventHaystack(event);

  if (hay.includes("reve noir") || hay.includes("reves noir")) return 1;
  if (/\bmasquerave ii\b/.test(hay) || hay.includes("masquerave 2")) return 2;
  if (/\bbound\b/.test(hay)) return 3;
  if (hay.includes("complicit")) return 4;
  if (hay.includes("beautiful things hurt")) return 5;
  if (hay.includes("undisclosed") || hay.includes("midnight masque")) return 6;
  if (/\bmasquerave\b/.test(hay)) return 7;

  return null;
}

export function effectivePastDisplayOrder(event: PortalEvent): number {
  if (event.displayOrder != null && Number.isFinite(event.displayOrder)) {
    return event.displayOrder;
  }
  return fallbackPastDisplayOrder(event) ?? Number.MAX_SAFE_INTEGER;
}

function isInterferingNocturneDraft(event: PortalEvent): boolean {
  if (event.displayOrder != null && Number.isFinite(event.displayOrder)) {
    return false;
  }
  const hay = eventHaystack(event);
  if (!hay.includes("nocturne")) return false;
  return !hay.includes("reve noir") && !hay.includes("reves noir");
}

function preferCanonical(a: PortalEvent, b: PortalEvent): PortalEvent {
  const score = (event: PortalEvent): number => {
    const hay = eventHaystack(event);
    let value = 0;
    if (event.displayOrder != null && Number.isFinite(event.displayOrder)) {
      value += 20;
    }
    if (event.artworkUrl) value += 8;
    if (hay.includes("yacht")) value += 4;
    if (hay.includes("nocturne") && hay.includes("reve noir")) value += 3;
    if (hay.includes("atelier") && hay.includes("bound")) value += 3;
    if (
      !/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/.test(
        hay,
      )
    ) {
      value += 2;
    }
    if (!/\b20\d{2}\b/.test(hay)) value += 1;
    return value;
  };

  const aScore = score(a);
  const bScore = score(b);
  if (aScore !== bScore) return aScore > bScore ? a : b;
  return a.name.length <= b.name.length ? a : b;
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
 * curated reference events first (deduped), then any remaining events.
 */
export function curatePastEvents(events: PortalEvent[]): PortalEvent[] {
  const eligible = events.filter((event) => !isInterferingNocturneDraft(event));
  const byOrder = new Map<number, PortalEvent>();
  const remainder: PortalEvent[] = [];

  for (const event of eligible) {
    const order = effectivePastDisplayOrder(event);
    if (order !== Number.MAX_SAFE_INTEGER) {
      const existing = byOrder.get(order);
      byOrder.set(order, existing ? preferCanonical(event, existing) : event);
      continue;
    }
    remainder.push(event);
  }

  const curated = [...byOrder.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, event]) => event);

  remainder.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return [...curated, ...remainder];
}

export function pastEventOrderLog(events: PortalEvent[]) {
  return events.map((event) => ({
    name: [event.brandTitle, event.name].filter(Boolean).join(" "),
    date: event.date,
    displayOrder: event.displayOrder,
    effectiveOrder: effectivePastDisplayOrder(event),
  }));
}
