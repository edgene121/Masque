"use client";

import Image from "next/image";
import Link from "next/link";
import type { PortalEvent } from "@/data/events";
import { formatPortalEventDate } from "@/data/events";

interface UpcomingEventFeatureProps {
  event: PortalEvent;
}

/** Local posters in /public/events — keyed by slug, used before Airtable. */
const localEventImages: Record<string, string> = {
  "le-reve-noir": "/events/le-reve-noir.png",
};

function slugifyKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function eventImageKeys(event: PortalEvent): string[] {
  const keys: string[] = [];
  const push = (value: string) => {
    const slug = slugifyKey(value);
    if (slug) keys.push(slug);
  };

  push(event.name);
  push(event.brandTitle);
  push([event.brandTitle, event.name].filter(Boolean).join(" "));

  try {
    const path = /^https?:\/\//i.test(event.href)
      ? new URL(event.href).pathname
      : event.href;
    const last = path.split("/").filter(Boolean).pop();
    if (last) push(decodeURIComponent(last));
  } catch {
    // ignore malformed href
  }

  return keys;
}

function resolveFeaturedImageSrc(event: PortalEvent): string {
  const keys = eventImageKeys(event);
  for (const [id, src] of Object.entries(localEventImages)) {
    if (keys.some((key) => key === id || key.includes(id))) {
      return src;
    }
  }
  return event.imageSrc?.trim() ?? "";
}

/** Display-only split so eyebrow/title match the reference without altering Airtable fetch. */
function resolveFeaturedCopy(event: PortalEvent): {
  eyebrow: string;
  title: string;
} {
  const brand = event.brandTitle.trim();
  const name = event.name.trim();

  if (brand && name) {
    const words = name.split(/\s+/).filter(Boolean);
    // e.g. brand "Masqué" + "Nocturne Le Rêve Noir" → "MASQUÉ · NOCTURNE" / "LE RÊVE NOIR"
    if (words.length >= 2) {
      return {
        eyebrow: `${brand} · ${words[0]}`,
        title: words.slice(1).join(" "),
      };
    }
    return { eyebrow: brand, title: name };
  }

  if (name.includes(":")) {
    const [left, ...rightParts] = name.split(":");
    const right = rightParts.join(":").trim();
    const words = right.split(/\s+/).filter(Boolean);
    if (left.trim() && words.length >= 2) {
      return {
        eyebrow: `${left.trim()} · ${words[0]}`,
        title: words.slice(1).join(" "),
      };
    }
    return { eyebrow: left.trim(), title: right };
  }

  return { eyebrow: brand, title: name || brand };
}

export default function UpcomingEventFeature({
  event,
}: UpcomingEventFeatureProps) {
  const imageSrc = resolveFeaturedImageSrc(event);
  const isLocalImage = imageSrc.startsWith("/events/");
  const hasImage = Boolean(imageSrc);
  const { eyebrow, title } = resolveFeaturedCopy(event);
  const location = event.location.trim();
  const dateLabel = event.date ? formatPortalEventDate(event.date) : "";
  const metaParts = [location, dateLabel].filter(Boolean);
  const altText = [eyebrow, title].filter(Boolean).join(" ") || "Event";

  return (
    <article className="events-feature-card">
      <div
        className={`events-feature-card__media${hasImage ? "" : " is-fallback"}`}
      >
        {isLocalImage ? (
          <Image
            src={imageSrc}
            alt={
              imageSrc.endsWith("le-reve-noir.png")
                ? "Le Rêve Noir event poster"
                : altText
            }
            width={600}
            height={900}
            className="featured-event-poster"
            style={{ width: "100%", height: "auto" }}
          />
        ) : hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={altText}
            className="featured-event-poster"
            referrerPolicy="no-referrer"
          />
        ) : null}
      </div>

      <div className="events-feature-card__body">
        {eyebrow ? (
          <p className="events-feature-card__brand">{eyebrow}</p>
        ) : null}

        {title ? <h2 className="events-feature-card__name">{title}</h2> : null}

        {metaParts.length > 0 ? (
          <p className="events-feature-card__meta-line">
            {location ? <span>{location}</span> : null}
            {location && dateLabel ? (
              <span className="events-feature-card__meta-dot" aria-hidden="true">
                •
              </span>
            ) : null}
            {dateLabel ? <span>{dateLabel}</span> : null}
          </p>
        ) : null}

        {event.description.trim() ? (
          <p className="events-feature-card__desc">{event.description}</p>
        ) : null}

        {/^https?:\/\//i.test(event.href) ? (
          <a
            href={event.href}
            className="events-feature-card__cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Event
          </a>
        ) : (
          <Link href={event.href} className="events-feature-card__cta">
            View Event
          </Link>
        )}
      </div>
    </article>
  );
}
