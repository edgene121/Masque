"use client";

import Link from "next/link";
import type { PortalEvent } from "@/data/events";
import { formatPortalEventDate } from "@/data/events";
import { BLACK_SWAN_EVENT_PATH } from "@/lib/portal/black-swan-events";

interface BlackSwanUpcomingCardProps {
  event: PortalEvent;
}

export default function BlackSwanUpcomingCard({
  event,
}: BlackSwanUpcomingCardProps) {
  const href = event.href.trim() || BLACK_SWAN_EVENT_PATH;
  const series = event.series.trim() || event.brandTitle.trim();
  const title = event.name.trim();
  const location = event.location.trim();
  const dateLabel = event.date ? formatPortalEventDate(event.date) : "";

  return (
    <Link
      href={href}
      className="events-feature-card events-feature-card--member"
    >
      <p className="events-feature-card__kicker">Upcoming Member Event</p>

      {series ? <p className="events-feature-card__brand">{series}</p> : null}

      {title ? (
        <h2 className="events-feature-card__name featured-event-title">
          {title}
        </h2>
      ) : null}

      {location || dateLabel ? (
        <p className="events-feature-card__meta-stack">
          {location ? <span>{location}</span> : null}
          {dateLabel ? <span>{dateLabel}</span> : null}
        </p>
      ) : null}

      <span className="events-feature-card__cta">Access Event</span>
    </Link>
  );
}
