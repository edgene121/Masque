"use client";

import { useEffect, useState } from "react";
import type { Member } from "@memberstack/dom";
import { dispatch, foundationCards, navSections } from "@/data/dashboard";
import { getMemberstack } from "@/lib/memberstack";
import {
  getOnboardingStatus,
  isProfileComplete,
  mapMemberToHeaderUser,
} from "@/lib/profile-memberstack";
import type {
  FeaturedEventData,
  MemberstackUser,
  MemberStatusData,
} from "@/types/dashboard";
import type { PortalCreditsData } from "@/types/credits";
import { EMPTY_PORTAL_CREDITS } from "@/types/credits";
import DashboardLayout from "./DashboardLayout";
import MemberStatusCard from "./MemberStatusCard";
import SectionHeading from "./SectionHeading";
import FeaturedEventCard from "./FeaturedEventCard";
import FeaturedDispatch from "./FeaturedDispatch";
import FoundationCard from "./FoundationCard";
import CreditsReferralsSection from "./CreditsReferralsSection";
import CommunityFooterCard from "./CommunityFooterCard";

const COMPLETED_STATUS: MemberStatusData = {
  variant: "active",
  label: "Membership Active",
  welcomeHeading: "Welcome to Masqué",
  welcomeText:
    "Welcome to the MASQUÉ Member Portal. This platform provides everything you need to manage your membership and stay connected with the community.",
};

const INCOMPLETE_STATUS: MemberStatusData = {
  variant: "pending",
  label: "Onboarding",
  welcomeHeading: "Welcome to Masqué",
  welcomeText: "",
};

const EMPTY_HEADER_USER: MemberstackUser = {
  name: "",
  initials: "",
  email: "",
};

export default function DashboardPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [memberReady, setMemberReady] = useState(false);
  const [headerUser, setHeaderUser] =
    useState<MemberstackUser>(EMPTY_HEADER_USER);
  const [featuredEvent, setFeaturedEvent] = useState<FeaturedEventData | null>(
    null,
  );
  const [credits, setCredits] = useState<PortalCreditsData>(EMPTY_PORTAL_CREDITS);
  const [creditsLoading, setCreditsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const memberstack = getMemberstack();
        const { data: currentMember } = await memberstack.getCurrentMember();
        const email = currentMember?.auth?.email?.trim() ?? "";

        const creditsPromise = email
          ? fetch(
              `/api/portal/credits?email=${encodeURIComponent(email)}`,
              { cache: "no-store" },
            )
          : null;

        const eventResponse = await fetch("/api/portal/events?scope=featured");

        if (!mounted) return;

        const eventPayload = (await eventResponse.json().catch(() => null)) as {
          event?: FeaturedEventData | null;
        } | null;

        setMember(currentMember);
        setHeaderUser(
          currentMember
            ? mapMemberToHeaderUser(currentMember)
            : EMPTY_HEADER_USER,
        );
        setFeaturedEvent(eventPayload?.event ?? null);
        setMemberReady(true);

        if (creditsPromise) {
          const creditsResponse = await creditsPromise;
          if (!mounted) return;
          const creditsPayload = (await creditsResponse
            .json()
            .catch(() => null)) as (PortalCreditsData & { ok?: boolean }) | null;
          if (creditsPayload?.ok) {
            setCredits({
              referralCode: String(creditsPayload.referralCode ?? "").trim(),
              creditsAvailable:
                typeof creditsPayload.creditsAvailable === "number"
                  ? creditsPayload.creditsAvailable
                  : null,
              qualifiedReferrals:
                typeof creditsPayload.qualifiedReferrals === "number"
                  ? creditsPayload.qualifiedReferrals
                  : null,
              creditsRedeemed:
                typeof creditsPayload.creditsRedeemed === "number"
                  ? creditsPayload.creditsRedeemed
                  : null,
              invitedFriends: Array.isArray(creditsPayload.invitedFriends)
                ? creditsPayload.invitedFriends
                : [],
              invitedBy: String(creditsPayload.invitedBy ?? "").trim(),
              creditHistory: Array.isArray(creditsPayload.creditHistory)
                ? creditsPayload.creditHistory
                : [],
            });
          } else {
            setCredits(EMPTY_PORTAL_CREDITS);
          }
        } else {
          setCredits(EMPTY_PORTAL_CREDITS);
        }

        if (process.env.NODE_ENV === "development") {
          const status = getOnboardingStatus(currentMember);
          console.log("[Home] Onboarding Status:", status || "(empty)");
          console.log(
            "[Home] Profile complete:",
            isProfileComplete(currentMember),
          );
        }
      } catch (error) {
        console.error("[Home] Failed to load member home state:", error);
        if (!mounted) return;
        setMember(null);
        setHeaderUser(EMPTY_HEADER_USER);
        setCredits(EMPTY_PORTAL_CREDITS);
      } finally {
        if (mounted) {
          setMemberReady(true);
          setCreditsLoading(false);
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const profileComplete = isProfileComplete(member);

  return (
    <DashboardLayout user={headerUser} navSections={navSections}>
      {!memberReady ? (
        <p className="dashboard-home-loading">Loading…</p>
      ) : (
        <>
          {profileComplete ? (
            <MemberStatusCard status={COMPLETED_STATUS} />
          ) : (
            <MemberStatusCard
              status={INCOMPLETE_STATUS}
              showProfileCompletion
            />
          )}

          {featuredEvent ? (
            <>
              <SectionHeading variant="featured-event">
                Featured Event
              </SectionHeading>
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

          <CreditsReferralsSection data={credits} loading={creditsLoading} />

          <CommunityFooterCard />
        </>
      )}
    </DashboardLayout>
  );
}
