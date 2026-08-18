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
import { MOCK_CREDITS_DATA, type CreditsInvitedFriend } from "@/types/credits";
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

const ZERO_CREDIT_SUMMARY = {
  creditsAvailable: 0,
  qualifiedReferrals: 0,
  creditsRedeemed: 0,
  referralCode: "",
  invitedFriends: [] as CreditsInvitedFriend[],
};

export default function DashboardPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [memberReady, setMemberReady] = useState(false);
  const [headerUser, setHeaderUser] =
    useState<MemberstackUser>(EMPTY_HEADER_USER);
  const [featuredEvent, setFeaturedEvent] = useState<FeaturedEventData | null>(
    null,
  );
  const [creditSummary, setCreditSummary] = useState(ZERO_CREDIT_SUMMARY);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const memberstack = getMemberstack();
        const { data: currentMember } = await memberstack.getCurrentMember();

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
      } finally {
        if (mounted) {
          setMemberReady(true);
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!memberReady) return;

    const email = member?.auth?.email?.trim().toLowerCase() ?? "";
    if (!email) {
      setCreditSummary(ZERO_CREDIT_SUMMARY);
      setStatsLoading(false);
      return;
    }

    let mounted = true;
    setStatsLoading(true);

    async function loadCreditSummary() {
      try {
        const response = await fetch(
          `/api/portal/credits?email=${encodeURIComponent(email)}${
            member?.id
              ? `&memberstackId=${encodeURIComponent(member.id)}`
              : ""
          }`,
          { cache: "no-store" },
        );
        const payload = (await response.json().catch(() => null)) as {
          creditsAvailable?: number;
          qualifiedReferrals?: number;
          creditsRedeemed?: number;
          referralCode?: string;
          invitedFriends?: CreditsInvitedFriend[];
        } | null;

        if (!mounted) return;

        const invitedFriends = Array.isArray(payload?.invitedFriends)
          ? payload.invitedFriends.filter(
              (friend): friend is CreditsInvitedFriend =>
                Boolean(
                  friend &&
                    typeof friend.id === "string" &&
                    typeof friend.name === "string" &&
                    typeof friend.status === "string" &&
                    typeof friend.applicationDate === "string" &&
                    typeof friend.creditStatus === "string",
                ),
            )
          : [];

        setCreditSummary({
          creditsAvailable:
            typeof payload?.creditsAvailable === "number"
              ? payload.creditsAvailable
              : 0,
          qualifiedReferrals:
            typeof payload?.qualifiedReferrals === "number"
              ? payload.qualifiedReferrals
              : 0,
          creditsRedeemed:
            typeof payload?.creditsRedeemed === "number"
              ? payload.creditsRedeemed
              : 0,
          referralCode:
            typeof payload?.referralCode === "string"
              ? payload.referralCode.trim()
              : "",
          invitedFriends,
        });
      } catch (error) {
        console.error("[Home] Failed to load credit summary:", error);
        if (!mounted) return;
        setCreditSummary(ZERO_CREDIT_SUMMARY);
      } finally {
        if (mounted) setStatsLoading(false);
      }
    }

    void loadCreditSummary();
    return () => {
      mounted = false;
    };
  }, [memberReady, member]);

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

          <CreditsReferralsSection
            data={{
              ...MOCK_CREDITS_DATA,
              creditsAvailable: creditSummary.creditsAvailable,
              qualifiedReferrals: creditSummary.qualifiedReferrals,
              creditsRedeemed: creditSummary.creditsRedeemed,
              referralCode: creditSummary.referralCode,
              invitedFriends: creditSummary.invitedFriends,
            }}
            statsLoading={statsLoading}
          />

          <CommunityFooterCard />
        </>
      )}
    </DashboardLayout>
  );
}
