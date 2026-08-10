"use client";

import { useEffect, useState } from "react";
import { dispatch, foundationCards, navSections } from "@/data/dashboard";
import { fetchFeaturedEvent, fetchMemberStatus } from "@/lib/airtable";
import { useMemberstackUser } from "@/lib/memberstack";
import type { FeaturedEventData, MemberStatusData } from "@/types/dashboard";
import DashboardLayout from "./DashboardLayout";
import MemberStatusCard from "./MemberStatusCard";
import SectionHeading from "./SectionHeading";
import FeaturedEventCard from "./FeaturedEventCard";
import FeaturedDispatch from "./FeaturedDispatch";
import FoundationCard from "./FoundationCard";
import CommunityFooterCard from "./CommunityFooterCard";

export default function DashboardPage() {
  const user = useMemberstackUser();
  const [memberStatus, setMemberStatus] = useState<MemberStatusData | null>(
    null
  );
  const [featuredEvent, setFeaturedEvent] = useState<FeaturedEventData | null>(
    null
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [status, event] = await Promise.all([
        fetchMemberStatus(),
        fetchFeaturedEvent(),
      ]);
      if (!mounted) return;
      setMemberStatus(status);
      setFeaturedEvent(event);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout user={user} navSections={navSections}>
      {memberStatus ? <MemberStatusCard status={memberStatus} /> : null}

      {featuredEvent ? (
        <>
          <SectionHeading variant="featured-event">Featured Event</SectionHeading>
          <FeaturedEventCard event={featuredEvent} />
        </>
      ) : null}

      <FeaturedDispatch dispatch={dispatch} />

      <SectionHeading>Community Foundation</SectionHeading>
      <div className="foundation-grid">
        {foundationCards.map((card) => (
          <FoundationCard key={card.id} card={card} />
        ))}
      </div>

      <CommunityFooterCard />
    </DashboardLayout>
  );
}
