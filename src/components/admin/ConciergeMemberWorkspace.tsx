import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ConciergeMember } from "@/types/admin-concierge";
import ConciergeInformationForm from "@/components/admin/ConciergeInformationForm";
import {
  DataQualityCard,
  EventStatusCard,
  MemberInformationCard,
  OnboardingCard,
  OutstandingItemsCard,
} from "@/components/admin/MemberDetailCards";
import {
  conciergeStatusBadgeClass,
  displayDash,
  peopleConciergeStatus,
} from "@/lib/admin/concierge-display";

export default function ConciergeMemberWorkspace({
  member,
}: {
  member: ConciergeMember;
}) {
  const conciergeStatus = peopleConciergeStatus(member);

  return (
    <div className="admin-concierge-workspace">
      <section className="admin-concierge-workspace__header">
        <Link
          href="/admin/concierge/recently-approved"
          className="admin-btn admin-btn--secondary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to Recently Approved
        </Link>

        <div className="admin-concierge-workspace__title-row">
          <div>
            <p className="admin-detail-label">Member Name</p>
            <p className="admin-concierge-workspace__name">{member.name}</p>
            <p className="admin-concierge-workspace__since">
              Member since {displayDash(member.approvalDate)}
            </p>
          </div>
          {conciergeStatus ? (
            <span
              className={`admin-status-badge ${conciergeStatusBadgeClass(conciergeStatus)}`}
            >
              {conciergeStatus}
            </span>
          ) : null}
        </div>
      </section>

      <div className="admin-concierge-workspace__grid">
        <div className="admin-concierge-workspace__column">
          <MemberInformationCard member={member} />
          <EventStatusCard member={member} />
          <OnboardingCard member={member} layout="stacked" />
        </div>
        <div className="admin-concierge-workspace__column">
          <OutstandingItemsCard member={member} />
          <section className="admin-detail-card">
            <h3 className="admin-detail-card__title">Concierge Information</h3>
            <ConciergeInformationForm member={member} />
          </section>
          <DataQualityCard member={member} />
        </div>
      </div>
    </div>
  );
}
