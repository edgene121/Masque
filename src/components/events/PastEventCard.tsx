"use client";

import { useState } from "react";
import Link from "next/link";
import type { PortalEvent } from "@/data/events";
import { formatPortalEventDate } from "@/data/events";

interface PastEventCardProps {
  event: PortalEvent;
}

function foldKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isMasqueBrand(value: string): boolean {
  return foldKey(value) === "masque";
}

function isStandaloneBrand(value: string): boolean {
  const key = foldKey(value);
  return (
    key === "masquerave" ||
    key === "masquerave ii" ||
    key === "masquerave 2" ||
    key === "midnight masque"
  );
}

const STANDALONE_PREFIXES = [
  "midnight masque",
  "masquerave ii",
  "masquerave 2",
  "masquerave",
];

function formatColonLine(left: string, right: string): string {
  return `${left.trim()} : ${right.trim()}`.replace(/\s+/g, " ").trim();
}

function normalizeCombinedLine(value: string): string {
  return value
    .replace(/\s*[·•|]\s*/g, " : ")
    .replace(/\s*:\s*/g, " : ")
    .replace(/\s+/g, " ")
    .trim();
}

function typeFromCombinedLine(value: string): string {
  const parts = value.split(/\s*[:·•|]\s*/).map((part) => part.trim());
  return parts.length >= 2 ? parts[parts.length - 1] : "";
}

function stripLeadingType(name: string, type: string): string {
  const trimmedName = name.trim();
  const trimmedType = type.trim();
  if (!trimmedName || !trimmedType) return trimmedName;

  const typeKey = foldKey(trimmedType);
  const words = trimmedName.split(/\s+/).filter(Boolean);
  if (words.length && foldKey(words[0]) === typeKey) {
    return words.slice(1).join(" ").replace(/^[\s|–—:-]+/, "").trim();
  }

  const foldedName = foldKey(trimmedName);
  if (foldedName.startsWith(typeKey)) {
    return trimmedName
      .slice(trimmedType.length)
      .replace(/^[\s|–—:-]+/, "")
      .trim();
  }

  return trimmedName;
}

function matchStandalonePrefix(
  value: string,
): { brand: string; rest: string } | null {
  const folded = foldKey(value);
  for (const prefix of STANDALONE_PREFIXES) {
    if (folded === prefix) {
      return { brand: value.trim(), rest: "" };
    }
    if (folded.startsWith(`${prefix} `)) {
      const words = value.trim().split(/\s+/).filter(Boolean);
      const prefixWordCount = prefix.split(" ").length;
      return {
        brand: words.slice(0, prefixWordCount).join(" "),
        rest: words.slice(prefixWordCount).join(" "),
      };
    }
  }
  return null;
}

const MASQUE_TYPES = new Set(["nocturne", "atelier", "chambre"]);

function isMasqueType(value: string): boolean {
  return MASQUE_TYPES.has(foldKey(value));
}

function splitTypeFromEventName(name: string): {
  type: string;
  eventName: string;
} {
  const trimmed = name.trim();
  if (!trimmed) return { type: "", eventName: "" };

  const pipeParts = trimmed.split("|").map((part) => part.trim()).filter(Boolean);
  if (pipeParts.length >= 2) {
    return { type: pipeParts[0], eventName: pipeParts.slice(1).join(" | ") };
  }

  const dashParts = trimmed.split(/\s+[–—]\s+/).map((part) => part.trim());
  if (dashParts.length >= 2) {
    return { type: dashParts[0], eventName: dashParts.slice(1).join(" — ") };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return { type: words[0], eventName: words.slice(1).join(" ") };
  }

  return { type: "", eventName: trimmed };
}

function seriesTypeCandidate(series: string, brand: string): string {
  if (/[:·•]/.test(series)) return typeFromCombinedLine(series);
  if (series && foldKey(series) !== foldKey(brand) && !isMasqueBrand(series)) {
    return series;
  }
  return "";
}

function resolveMasqueCopy(
  brand: string,
  series: string,
  name: string,
): { seriesLine: string; eventName: string } {
  const split = splitTypeFromEventName(name);
  if (
    split.type &&
    split.eventName &&
    foldKey(split.eventName) !== foldKey(split.type) &&
    isMasqueType(split.type)
  ) {
    return {
      seriesLine: formatColonLine(brand, split.type),
      eventName: split.eventName,
    };
  }

  const fromSeries = seriesTypeCandidate(series, brand);
  if (fromSeries && isMasqueType(fromSeries)) {
    return {
      seriesLine: formatColonLine(brand, fromSeries),
      eventName: stripLeadingType(name, fromSeries) || name,
    };
  }

  if (
    split.type &&
    split.eventName &&
    foldKey(split.eventName) !== foldKey(split.type)
  ) {
    return {
      seriesLine: formatColonLine(brand, split.type),
      eventName: split.eventName,
    };
  }

  if (fromSeries) {
    return {
      seriesLine: formatColonLine(brand, fromSeries),
      eventName: stripLeadingType(name, fromSeries) || name,
    };
  }

  return { seriesLine: brand, eventName: name };
}

function resolvePastEventCopy(event: PortalEvent): {
  seriesLine: string;
  eventName: string;
} {
  const brand = event.brandTitle.trim();
  const series = event.series.trim();
  const name = event.name.trim();

  const standaloneSource = [brand, series].find(isStandaloneBrand);
  if (standaloneSource) {
    return { seriesLine: standaloneSource, eventName: name };
  }

  if (!brand) {
    const fromName = matchStandalonePrefix(name);
    if (fromName) {
      return { seriesLine: fromName.brand, eventName: fromName.rest };
    }
  }

  if (/[:·•]/.test(brand) && !isMasqueBrand(brand)) {
    const seriesLine = normalizeCombinedLine(brand);
    const type = typeFromCombinedLine(seriesLine);
    return {
      seriesLine,
      eventName: stripLeadingType(name, type),
    };
  }

  if (isMasqueBrand(brand)) {
    return resolveMasqueCopy(brand, series, name);
  }

  if (/[:·•]/.test(series)) {
    const seriesLine = normalizeCombinedLine(series);
    const type = typeFromCombinedLine(seriesLine);
    return {
      seriesLine,
      eventName: stripLeadingType(name, type),
    };
  }

  if (
    series &&
    brand &&
    foldKey(series) !== foldKey(brand) &&
    !isMasqueBrand(series)
  ) {
    return {
      seriesLine: formatColonLine(brand, series),
      eventName: stripLeadingType(name, series),
    };
  }

  if (brand && name) {
    return { seriesLine: brand, eventName: name };
  }

  return { seriesLine: name || brand || "Event", eventName: "" };
}

export default function PastEventCard({ event }: PastEventCardProps) {
  const { seriesLine, eventName } = resolvePastEventCopy(event);
  const artworkAlt = [seriesLine, eventName].filter(Boolean).join(" ") || "Event";
  const location = event.location.trim();
  const dateLabel = event.date ? formatPortalEventDate(event.date) : "";
  const artworkUrl = event.artworkUrl?.trim() || "";
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(artworkUrl) && !imageFailed;
  const showMeta = Boolean(location || dateLabel);

  return (
    <article className="events-past-card">
      <div
        className={`events-past-card__media${hasImage ? "" : " events-past-card__media--empty"}`}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artworkUrl}
            alt={artworkAlt}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : null}
      </div>

      <div className="events-past-card__body">
        <div className="events-past-card__copy">
          <h3 className="events-past-card__title">{seriesLine}</h3>
          {eventName ? (
            <p className="events-past-card__subtitle">{eventName}</p>
          ) : null}
          {showMeta ? (
            <p className="events-past-card__meta">
              {location ? <span>{location}</span> : null}
              {location && dateLabel ? (
                <span className="events-past-card__dot" aria-hidden="true">
                  •
                </span>
              ) : null}
              {dateLabel ? <span>{dateLabel}</span> : null}
            </p>
          ) : null}
        </div>

        {/^https?:\/\//i.test(event.href) ? (
          <a
            href={event.href}
            className="events-past-card__cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Event
          </a>
        ) : (
          <Link href={event.href} className="events-past-card__cta">
            View Event
          </Link>
        )}
      </div>
    </article>
  );
}
