"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import UpcomingEventFeature from "@/components/events/UpcomingEventFeature";
import BlackSwanUpcomingCard from "@/components/events/BlackSwanUpcomingCard";
import PastEventCard from "@/components/events/PastEventCard";
import EventsFooter from "@/components/events/EventsFooter";
import { navSections } from "@/data/dashboard";
import {
  formatGatheringTeaser,
  type PortalEvent,
} from "@/data/events";
import { isBlackSwanPortalEvent } from "@/lib/portal/black-swan-events";
import {
  pastEventOrderLog,
  sortPastEventsForDisplay,
} from "@/lib/portal/curate-past-events";
import { useMemberstackUser } from "@/lib/memberstack";

type EventsTab = "upcoming" | "past";

interface EventsPageProps {
  upcoming: PortalEvent[];
  past: PortalEvent[];
  loadError?: string | null;
}

export default function EventsPage({
  upcoming,
  past,
  loadError = null,
}: EventsPageProps) {
  const user = useMemberstackUser();
  const [tab, setTab] = useState<EventsTab>("upcoming");

  const featured = upcoming[0] ?? null;
  const gatheringLine = useMemo(
    () => (featured?.date ? formatGatheringTeaser(featured.date) : ""),
    [featured],
  );
  const pastEvents = useMemo(() => sortPastEventsForDisplay(past), [past]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("FINAL PAST EVENT ORDER", pastEventOrderLog(pastEvents));
    }
  }, [pastEvents]);

  return (
    <DashboardLayout user={user} navSections={navSections}>
      <div className="events-page">
        <header className="events-page__header">
          <h1 className="events-page__title">Featured Events</h1>
          {gatheringLine ? (
            <p className="events-page__gathering">{gatheringLine}</p>
          ) : null}
        </header>

        <div className="events-tabs" role="tablist" aria-label="Events">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "upcoming"}
            className={`events-tabs__btn${tab === "upcoming" ? " is-active" : ""}`}
            onClick={() => setTab("upcoming")}
          >
            Upcoming Events
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "past"}
            className={`events-tabs__btn${tab === "past" ? " is-active" : ""}`}
            onClick={() => setTab("past")}
          >
            Past Events
          </button>
        </div>

        {loadError ? (
          <p className="events-page__empty">{loadError}</p>
        ) : null}

        {!loadError && tab === "upcoming" ? (
          <section
            className="events-upcoming"
            role="tabpanel"
            aria-label="Upcoming Events"
          >
            {upcoming.length > 0 ? (
              upcoming.map((event) =>
                isBlackSwanPortalEvent(event) ? (
                  <BlackSwanUpcomingCard key={event.id} event={event} />
                ) : (
                  <UpcomingEventFeature key={event.id} event={event} />
                ),
              )
            ) : (
              <p className="events-page__empty">No Upcoming Events</p>
            )}
          </section>
        ) : null}

        {!loadError && tab === "past" ? (
          <section
            className="events-past"
            role="tabpanel"
            aria-label="Past Events"
          >
            <h2 className="events-past__heading">Past Events</h2>

            {pastEvents.length > 0 ? (
              <div className="events-past__grid">
                {pastEvents.map((event) => (
                  <PastEventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="events-page__empty">No Past Events</p>
            )}
          </section>
        ) : null}

        {!loadError && tab === "upcoming" && pastEvents.length > 0 ? (
          <section
            className="events-past events-past--below"
            aria-label="Past Events"
          >
            <h2 className="events-past__heading">Past Events</h2>
            <div className="events-past__grid">
              {pastEvents.map((event) => (
                <PastEventCard key={`below-${event.id}`} event={event} />
              ))}
            </div>
          </section>
        ) : null}

        <EventsFooter />
      </div>
    </DashboardLayout>
  );
}
