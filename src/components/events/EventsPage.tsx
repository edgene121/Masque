"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SectionHeading from "@/components/dashboard/SectionHeading";
import FeaturedEventCard from "@/components/dashboard/FeaturedEventCard";
import FoundationCard from "@/components/dashboard/FoundationCard";
import CommunityFooterCard from "@/components/dashboard/CommunityFooterCard";
import { foundationCards, navSections } from "@/data/dashboard";
import { fetchFeaturedEvent } from "@/lib/airtable";
import { useMemberstackUser } from "@/lib/memberstack";
import type { FeaturedEventData } from "@/types/dashboard";
import heroBanner from "../../assets/featured-event.png";

export default function EventsPage() {
  const user = useMemberstackUser();
  const [featuredEvent, setFeaturedEvent] = useState<FeaturedEventData | null>(
    null
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      const event = await fetchFeaturedEvent();
      if (!mounted || !event) return;
      setFeaturedEvent({
        ...event,
        accessLabel: "MEMBERS ONLY",
      });
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout user={user} navSections={navSections}>
      <div className="events-main">
        <section
          className="events-hero"
          style={{ backgroundImage: `url(${heroBanner.src})` }}
        >
          <div className="events-hero__overlay">
            <h1 className="events-hero__title">Featured Events</h1>
          </div>
        </section>

        {featuredEvent ? (
          <div className="events-featured">
            <FeaturedEventCard event={featuredEvent} />
          </div>
        ) : null}

        <SectionHeading>Community Foundation</SectionHeading>
        <div className="foundation-grid">
          {foundationCards.map((card) => (
            <FoundationCard key={card.id} card={card} />
          ))}
        </div>

        <div className="events-footer-wrap">
          <CommunityFooterCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
