"use client";

import Link from "next/link";
import type { PortalEvent } from "@/data/events";
import { formatPortalEventDate } from "@/data/events";

interface PastEventCardProps {
  event: PortalEvent;
}

function resolveTitleParts(event: PortalEvent): {
  title: string;
  subtitle: string;
} {
  const brand = event.brandTitle.trim();
  const name = event.name.trim();

  if (brand && name) {
    return { title: brand, subtitle: name };
  }

  return { title: name || brand || "Event", subtitle: "" };
}

export default function PastEventCard({ event }: PastEventCardProps) {
  const { title, subtitle } = resolveTitleParts(event);
  const location = event.location.trim();
  const dateLabel = event.date ? formatPortalEventDate(event.date) : "";
  const hasImage = Boolean(event.imageSrc?.trim());
  const showMeta = Boolean(location || dateLabel);

  return (
    <article className="events-past-card">
      <div
        className={`events-past-card__media${hasImage ? "" : " events-past-card__media--empty"}`}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageSrc}
            alt={title}
            referrerPolicy="no-referrer"
          />
        ) : null}
      </div>

      <div className="events-past-card__body">
        <div className="events-past-card__copy">
          <h3 className="events-past-card__title">{title}</h3>
          {subtitle ? (
            <p className="events-past-card__subtitle">{subtitle}</p>
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
