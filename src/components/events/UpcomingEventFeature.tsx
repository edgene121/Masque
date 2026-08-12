"use client";

import Link from "next/link";
import type { PortalEvent } from "@/data/events";
import { formatPortalEventDate } from "@/data/events";
import featuredEventImage from "../../assets/featured-event.png";

interface UpcomingEventFeatureProps {
  event: PortalEvent;
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
  const hasAirtableImage = Boolean(event.imageSrc?.trim());
  const imageSrc = event.imageSrc?.trim() || featuredEventImage.src;
  const { eyebrow, title } = resolveFeaturedCopy(event);
  const location = event.location.trim();
  const dateLabel = event.date ? formatPortalEventDate(event.date) : "";
  const metaParts = [location, dateLabel].filter(Boolean);
  const altText = [eyebrow, title].filter(Boolean).join(" ") || "Event";

  return (
    <article className="events-feature-card">
      <div
        className={`events-feature-card__media${hasAirtableImage ? "" : " is-fallback"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={altText} />
      </div>

      <div className="events-feature-card__body">
        {eyebrow ? (
          <p className="events-feature-card__brand">{eyebrow}</p>
        ) : null}

        {title ? <h2 className="events-feature-card__name">{title}</h2> : null}

        {metaParts.length > 0 ? (
          <p className="events-feature-card__meta-line">
            {metaParts.join("   •   ")}
          </p>
        ) : null}

        {event.description.trim() ? (
          <p className="events-feature-card__desc">{event.description}</p>
        ) : null}

        <Link href={event.href} className="events-feature-card__cta">
          View Event
        </Link>
      </div>
    </article>
  );
}
