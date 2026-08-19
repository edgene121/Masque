"use client";

import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import UpcomingEventFeature from "@/components/events/UpcomingEventFeature";
import { navSections } from "@/data/dashboard";
import type { PortalEvent } from "@/data/events";
import { useMemberstackUser } from "@/lib/memberstack";

interface EventDetailPageProps {
  event: PortalEvent | null;
}

export default function EventDetailPage({ event }: EventDetailPageProps) {
  const user = useMemberstackUser();

  return (
    <DashboardLayout user={user} navSections={navSections}>
      <div className="events-page">
        <header className="events-page__header">
          <h1 className="events-page__title">Event</h1>
          <p className="events-page__gathering">
            <Link href="/events" className="events-footer__link">
              Back to Events
            </Link>
          </p>
        </header>

        {event ? (
          <UpcomingEventFeature event={event} showCta={false} />
        ) : (
          <p className="events-page__empty">
            This event could not be found.{" "}
            <Link href="/events" className="events-footer__link">
              Return to Events
            </Link>
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
