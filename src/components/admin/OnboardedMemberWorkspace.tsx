import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { OnboardedMemberDetail } from "@/types/admin-onboarded-members";
import { MemberInformationCard } from "@/components/admin/MemberDetailCards";
import OutstandingItemBadges from "@/components/admin/OutstandingItemBadges";
import {
  complianceStateBadgeClass,
  displayDash,
  displayYesNo,
  membershipStatusBadgeClass,
  yesNoBadgeClass,
} from "@/lib/admin/concierge-display";
import { isConciergeFieldResolved } from "@/lib/admin/mock-concierge-members";

const ONBOARDED_MEMBERS_HREF = "/admin/dashboard/onboarded";

function StatusBadge({
  value,
  className,
}: {
  value: string | null;
  className?: string;
}) {
  if (!value) return "—";
  return <span className={`admin-status-badge ${className ?? ""}`}>{value}</span>;
}

function LastEventAttended({
  name,
  date,
  fallback,
}: {
  name?: string;
  date?: string;
  fallback: string;
}) {
  if (name || date) {
    return (
      <>
        {name ? <div>{name}</div> : null}
        {date ? <div>{date}</div> : null}
      </>
    );
  }
  if (!fallback || fallback === "—") return "—";
  return (
    <>
      {fallback.split("\n").map((line) => (
        <div key={line}>{line}</div>
      ))}
    </>
  );
}

function OnboardingStatusCard({ member }: { member: OnboardedMemberDetail }) {
  const complianceState = member.complianceState?.trim() ?? "";

  return (
    <section className="admin-detail-card admin-onboarded-detail__onboarding-card">
      <div className="admin-onboarded-detail__onboarding-heading">
        <h3 className="admin-detail-card__title">Onboarding Status</h3>
        <span className="admin-status-badge is-approved admin-onboarded-detail__completed-badge">
          Completed
        </span>
      </div>
      <dl className="admin-detail-summary admin-onboarded-detail__onboarding-fields">
        <div>
          <dt className="admin-detail-label">Onboarding State</dt>
          <dd>
            <span className="admin-status-badge is-approved">Completed</span>
          </dd>
        </div>
        <div>
          <dt className="admin-detail-label">Onboarding Completed Date</dt>
          <dd>{displayDash(member.onboardingCompletedDate)}</dd>
        </div>
        <div>
          <dt className="admin-detail-label">Compliance State</dt>
          <dd>
            {complianceState ? (
              <span
                className={`admin-status-badge ${complianceStateBadgeClass(complianceState)}`}
              >
                {complianceState}
              </span>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="admin-detail-label">Verification Method</dt>
          <dd>{displayDash(member.verificationMethod)}</dd>
        </div>
        <div>
          <dt className="admin-detail-label">ID Verified</dt>
          <dd>
            <StatusBadge
              value={displayYesNo(Boolean(member.idVerified))}
              className={yesNoBadgeClass(displayYesNo(Boolean(member.idVerified)))}
            />
          </dd>
        </div>
        <div>
          <dt className="admin-detail-label">ID Verification Date</dt>
          <dd>{displayDash(member.idVerificationDate)}</dd>
        </div>
        <div>
          <dt className="admin-detail-label">Member Agreement Status</dt>
          <dd>{displayDash(member.memberAgreementStatus)}</dd>
        </div>
        <div>
          <dt className="admin-detail-label">Portal Access State</dt>
          <dd>{displayDash(member.portalAccessState)}</dd>
        </div>
        <div>
          <dt className="admin-detail-label">Portal Account Created</dt>
          <dd>
            <StatusBadge
              value={displayYesNo(Boolean(member.portalAccountCreated))}
              className={yesNoBadgeClass(
                displayYesNo(Boolean(member.portalAccountCreated)),
              )}
            />
          </dd>
        </div>
        <div>
          <dt className="admin-detail-label">Last Portal Login</dt>
          <dd>{displayDash(member.lastPortalLogin)}</dd>
        </div>
        <div>
          <dt className="admin-detail-label">Portal Invitation Sent Date</dt>
          <dd>{displayDash(member.portalInvitationSentDate)}</dd>
        </div>
      </dl>
    </section>
  );
}

function EventContextCard({ member }: { member: OnboardedMemberDetail }) {
  const attendanceResolved = isConciergeFieldResolved(member, "attendance");
  const berthaResolved = isConciergeFieldResolved(member, "bertha");
  const hasEverAttended = attendanceResolved
    ? displayYesNo(member.attendance.hasEverAttended)
    : null;
  const berthaPurchased = berthaResolved
    ? displayYesNo(member.berthaTicketPurchased)
    : null;

  return (
    <section className="admin-detail-card">
      <h3 className="admin-detail-card__title">Event Context</h3>
      <dl className="admin-detail-summary">
        <div>
          <dt className="admin-detail-label">Has Ever Attended</dt>
          <dd>
            <StatusBadge
              value={hasEverAttended}
              className={
                hasEverAttended === "Yes"
                  ? "is-approved"
                  : hasEverAttended === "No"
                    ? "is-vetting-amber"
                    : undefined
              }
            />
          </dd>
        </div>
        <div>
          <dt className="admin-detail-label">Last Event Attended</dt>
          <dd>
            {attendanceResolved && member.attendance.hasEverAttended ? (
              <LastEventAttended
                name={member.attendance.lastEventName}
                date={member.attendance.lastEventDate}
                fallback={member.attendance.lastEventAttended}
              />
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="admin-detail-label">Bertha Ticket Purchased</dt>
          <dd>
            <StatusBadge
              value={berthaPurchased}
              className={
                berthaPurchased ? yesNoBadgeClass(berthaPurchased) : undefined
              }
            />
          </dd>
        </div>
      </dl>
    </section>
  );
}

function OutstandingDataQualityCard({
  member,
}: {
  member: OnboardedMemberDetail;
}) {
  return (
    <section className="admin-detail-card">
      <h3 className="admin-detail-card__title">Outstanding / Data Quality</h3>
      <div className="admin-onboarded-detail__issues">
        <div>
          <h4 className="admin-concierge-subsection__title">Outstanding Items</h4>
          <OutstandingItemBadges
            items={member.outstandingItems}
            emptyLabel="No outstanding onboarding items"
            large
          />
        </div>
        <div>
          <h4 className="admin-concierge-subsection__title">Data Quality</h4>
          <OutstandingItemBadges
            items={member.dataQualityIssues}
            emptyLabel="No known data quality issues"
            large
          />
        </div>
      </div>
    </section>
  );
}

export default function OnboardedMemberWorkspace({
  member,
}: {
  member: OnboardedMemberDetail;
}) {
  const membershipStatus = member.membershipStatus?.trim() ?? "";

  return (
    <div className="admin-onboarded-detail">
      <section className="admin-onboarded-detail__header">
        <Link
          href={ONBOARDED_MEMBERS_HREF}
          className="admin-btn admin-btn--secondary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to Onboarded Members
        </Link>

        <div className="admin-onboarded-detail__title-row">
          <div>
            <p className="admin-detail-label">Member Name</p>
            <p className="admin-onboarded-detail__name">{member.name}</p>
            <p className="admin-onboarded-detail__since">
              Member since {displayDash(member.approvalDate)}
            </p>
          </div>
          <div className="admin-onboarded-detail__title-badges">
            <span className="admin-status-badge is-approved">Completed</span>
            {membershipStatus ? (
              <span
                className={`admin-status-badge ${membershipStatusBadgeClass(membershipStatus)}`}
              >
                {membershipStatus}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="admin-onboarded-detail__body">
        <OnboardingStatusCard member={member} />
        <div className="admin-onboarded-detail__columns">
          <div className="admin-onboarded-detail__column">
            <MemberInformationCard member={member} />
            <EventContextCard member={member} />
          </div>
          <div className="admin-onboarded-detail__column">
            <OutstandingDataQualityCard member={member} />
          </div>
        </div>
      </div>
    </div>
  );
}
