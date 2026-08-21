"use client";

import { useEffect, useState } from "react";
import type { Member } from "@memberstack/dom";
import { getMemberstack } from "@/lib/memberstack";
import { blackSwanAnalyticsProps, trackEventOnce } from "@/lib/analytics";
import {
  getAgreementSigned,
  getComplianceStatus,
  getOnboardingStatus,
  isAgreementSigned,
} from "@/lib/profile-memberstack";

function displayDash(value: string): string {
  const trimmed = value.trim();
  return trimmed || "—";
}

function formatIdVerified(value: boolean | null): string {
  if (value === true) return "Verified";
  if (value === false) return "Not Verified";
  return "—";
}

function normalizeStatus(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isMissing(value: string): boolean {
  return !value.trim() || value.trim() === "—";
}

/** Existing completed values used elsewhere in the project. */
function isCompletedState(value: string): boolean {
  const normalized = normalizeStatus(value);
  return normalized === "complete" || normalized === "completed";
}

function isApprovedMember(value: string): boolean {
  return normalizeStatus(value) === "approved member";
}

export default function BlackSwanEventAccess() {
  const [member, setMember] = useState<Member | null>(null);
  const [memberReady, setMemberReady] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [idVerified, setIdVerified] = useState<boolean | null>(null);
  const [peopleReady, setPeopleReady] = useState(false);

  useEffect(() => {
    trackEventOnce(
      "black_swan_event_access_viewed",
      "/events/black-swan-theory",
      blackSwanAnalyticsProps("member"),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await getMemberstack().getCurrentMember();
        if (cancelled) return;

        setMember(data);
        setMemberReady(true);

        const email = data?.auth?.email?.trim().toLowerCase() ?? "";
        if (!email) {
          setMembershipStatus(null);
          setIdVerified(null);
          setPeopleReady(true);
          return;
        }

        try {
          const response = await fetch(
            `/api/portal/event-access?email=${encodeURIComponent(email)}`,
            { cache: "no-store" },
          );
          const payload = (await response.json().catch(() => null)) as {
            membershipStatus?: string | null;
            idVerified?: boolean | null;
          } | null;

          if (cancelled) return;

          if (!response.ok || !payload) {
            setMembershipStatus(null);
            setIdVerified(null);
          } else {
            setMembershipStatus(
              typeof payload.membershipStatus === "string"
                ? payload.membershipStatus
                : payload.membershipStatus ?? null,
            );
            setIdVerified(
              payload.idVerified === true
                ? true
                : payload.idVerified === false
                  ? false
                  : null,
            );
          }
        } catch {
          if (!cancelled) {
            setMembershipStatus(null);
            setIdVerified(null);
          }
        } finally {
          if (!cancelled) {
            setPeopleReady(true);
          }
        }
      } catch {
        if (!cancelled) {
          setMember(null);
          setMembershipStatus(null);
          setIdVerified(null);
          setMemberReady(true);
          setPeopleReady(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const onboardingState = getOnboardingStatus(member);
  const complianceState = getComplianceStatus(member);
  const memberAgreement = getAgreementSigned(member);
  const membershipStatusValue = membershipStatus?.trim() ?? "";
  const statusReady = memberReady && peopleReady;

  const requiredStatusMissing =
    isMissing(membershipStatusValue) ||
    isMissing(onboardingState) ||
    isMissing(complianceState) ||
    idVerified === null ||
    isMissing(memberAgreement);

  const accessActive =
    statusReady &&
    Boolean(member) &&
    !requiredStatusMissing &&
    isApprovedMember(membershipStatusValue) &&
    isCompletedState(onboardingState) &&
    isCompletedState(complianceState) &&
    idVerified === true &&
    isAgreementSigned(member);

  const requirementsPending = statusReady && !accessActive;

  return (
    <section className="bst-section bst-access" aria-labelledby="bst-access-heading">
      <h2 id="bst-access-heading" className="bst-subheading">
        YOUR EVENT ACCESS
      </h2>

      <div className="bst-access__panel">
        <dl className="bst-access__grid">
          <div className="bst-access__item">
            <dt>MEMBERSHIP STATUS</dt>
            <dd aria-busy={!peopleReady}>
              {peopleReady ? displayDash(membershipStatusValue) : ""}
            </dd>
          </div>
          <div className="bst-access__item">
            <dt>ONBOARDING STATE</dt>
            <dd>{displayDash(onboardingState)}</dd>
          </div>
          <div className="bst-access__item">
            <dt>COMPLIANCE STATE</dt>
            <dd>{displayDash(complianceState)}</dd>
          </div>
          <div className="bst-access__item">
            <dt>ID VERIFIED</dt>
            <dd aria-busy={!peopleReady}>
              {peopleReady ? formatIdVerified(idVerified) : ""}
            </dd>
          </div>
          <div className="bst-access__item">
            <dt>MEMBER AGREEMENT</dt>
            <dd>{displayDash(memberAgreement)}</dd>
          </div>
        </dl>

        {accessActive ? (
          <p className="bst-access__banner" role="status">
            MEMBER ACCESS ACTIVE
          </p>
        ) : null}

        {requirementsPending ? (
          <p className="bst-access__banner bst-access__banner--pending" role="status">
            ADMISSION REQUIREMENTS PENDING
          </p>
        ) : null}

        <p className="bst-access__notice">
          Ticket purchase does not override Masqué membership, verification,
          consent, or admission requirements.
        </p>
      </div>
    </section>
  );
}
