"use client";

import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { PortalEvent } from "@/data/events";
import { formatPortalEventDate } from "@/data/events";
import { BLACK_SWAN_EVENT_PATH } from "@/lib/portal/black-swan-events";

interface BlackSwanUpcomingCardProps {
  event: PortalEvent;
}

export default function BlackSwanUpcomingCard({
  event,
}: BlackSwanUpcomingCardProps) {
  const href = BLACK_SWAN_EVENT_PATH;
  const series = event.series.trim() || event.brandTitle.trim();
  const title = event.name.trim();
  const location = event.location.trim();
  const dateLabel = event.date ? formatPortalEventDate(event.date) : "";

  return (
    <Link
      href={href}
      className="events-feature-card events-feature-card--member"
    >
      <div className="events-feature-card__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/black-swan-theory-event.jpg"
          alt="BLACK SWAN THEORY"
        />
      </div>

      <div className="events-feature-card__body">
        <p className="events-feature-card__kicker">MASQUÉ : ATELIER</p>

        {series ? <p className="events-feature-card__brand">{series}</p> : null}

        {title ? (
          <h2 className="events-feature-card__name featured-event-title">
            {title}
          </h2>
        ) : null}

        {location || dateLabel ? (
          <div className="events-feature-card__meta-stack">
            {location ? (
              <div className="events-feature-card__meta-row">
                <MapPin
                  className="events-feature-card__meta-icon"
                  aria-hidden="true"
                />
                <span>{location}</span>
              </div>
            ) : null}
            {dateLabel ? (
              <div className="events-feature-card__meta-row">
                <CalendarDays
                  className="events-feature-card__meta-icon"
                  aria-hidden="true"
                />
                <span>{dateLabel}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <span className="events-feature-card__cta">Access Event</span>
      </div>
    </Link>
  );
}
