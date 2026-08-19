import Link from "next/link";
import { Calendar } from "lucide-react";
import type { FeaturedEventData } from "@/types/dashboard";

interface FeaturedEventCardProps {
  event: FeaturedEventData;
}

function formatEventDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate.toUpperCase();

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
    .format(date)
    .toUpperCase();
}

export default function FeaturedEventCard({ event }: FeaturedEventCardProps) {
  const formattedDate = formatEventDate(event.date);

  return (
    <Link href={event.href} className="featured-event-card featured-event-card--link">
      <div className="featured-event-card__body">
        <div className="featured-event-card__badges">
          <span className="featured-event-card__badge featured-event-card__badge--date">
            <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
            {formattedDate}
          </span>
          <span className="featured-event-card__badge featured-event-card__badge--access">
            {event.accessLabel}
          </span>
        </div>

        <h3 className="featured-event-card__title">{event.title}</h3>
        <p className="featured-event-card__desc">{event.description}</p>
      </div>
    </Link>
  );
}
