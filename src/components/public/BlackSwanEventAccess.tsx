"use client";

import { useEffect, useState } from "react";
import type { Member } from "@memberstack/dom";
import { getMemberstack } from "@/lib/memberstack";
import {
  getAgreementSigned,
  getComplianceStatus,
  getOnboardingStatus,
  isProfileComplete,
} from "@/lib/profile-memberstack";

function displayDash(value: string): string {
  const trimmed = value.trim();
  return trimmed || "—";
}

export default function BlackSwanEventAccess() {
  const [member, setMember] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await getMemberstack().getCurrentMember();
        if (!cancelled) {
          setMember(data);
        }
      } catch {
        if (!cancelled) {
          setMember(null);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const accessActive = Boolean(member && isProfileComplete(member));
  const requirementsPending = ready && Boolean(member) && !accessActive;

  return (
    <section className="bst-section bst-access" aria-labelledby="bst-access-heading">
      <h2 id="bst-access-heading" className="bst-subheading">
        YOUR EVENT ACCESS
      </h2>

      <div className="bst-access__panel">
        <dl className="bst-access__grid">
          <div className="bst-access__item">
            <dt>MEMBERSHIP STATUS</dt>
            <dd>—</dd>
          </div>
          <div className="bst-access__item">
            <dt>ONBOARDING STATE</dt>
            <dd>{displayDash(getOnboardingStatus(member))}</dd>
          </div>
          <div className="bst-access__item">
            <dt>COMPLIANCE STATE</dt>
            <dd>{displayDash(getComplianceStatus(member))}</dd>
          </div>
          <div className="bst-access__item">
            <dt>ID VERIFIED</dt>
            <dd>—</dd>
          </div>
          <div className="bst-access__item">
            <dt>MEMBER AGREEMENT</dt>
            <dd>{displayDash(getAgreementSigned(member))}</dd>
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
