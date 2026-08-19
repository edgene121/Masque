import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ConciergeMember } from "@/types/admin-concierge";
import { MemberInformationCard } from "@/components/admin/MemberDetailCards";
import OutstandingItemBadges from "@/components/admin/OutstandingItemBadges";
import {
  complianceStateBadgeClass,
  displayDash,
  membershipStatusBadgeClass,
  onboardingBadgeClass,
  yesNoBadgeClass,
} from "@/lib/admin/concierge-display";

const INCOMPLETE_MEMBERS_HREF = "/admin/dashboard/incomplete";

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

function yesIfTrue(value: boolean | undefined): string {
  return value === true ? "Yes" : "";
}

function OnboardingInformationCard({ member }: { member: ConciergeMember }) {
  const onboardingState = member.onboardingState?.trim() ?? "";
  const complianceState = member.complianceState?.trim() ?? "";
  const idVerified = yesIfTrue(member.idVerified);
  const portalAccountCreated = yesIfTrue(member.portalAccountCreated);

  return (
    <section className="admin-detail-card">
      <h3 className="admin-detail-card__title">Onboarding Information</h3>
      <dl className="admin-detail-summary">
        <div>
          <dt className="admin-detail-label">Onboarding State</dt>
          <dd>
            {onboardingState ? (
              <span
                className={`admin-status-badge ${onboardingBadgeClass(onboardingState)}`}
              >
                {onboardingState}
              </span>
            ) : (
              "—"
            )}
          </dd>
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
              value={idVerified || null}
              className={idVerified ? yesNoBadgeClass("Yes") : undefined}
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
              value={portalAccountCreated || null}
              className={
                portalAccountCreated ? yesNoBadgeClass("Yes") : undefined
              }
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

function OutstandingRequirementsCard({ member }: { member: ConciergeMember }) {
  return (
    <section className="admin-detail-card admin-concierge-outstanding-card">
      <h3 className="admin-detail-card__title">
        Outstanding / Missing Requirements
      </h3>
      <OutstandingItemBadges
        items={member.outstandingItems}
        emptyLabel="No outstanding requirements"
        large
      />
    </section>
  );
}

export default function IncompleteMemberWorkspace({
  member,
}: {
  member: ConciergeMember;
}) {
  const membershipStatus = member.membershipStatus?.trim() ?? "";
  const onboardingState = member.onboardingState?.trim() ?? "";

  return (
    <div className="admin-onboarded-detail">
      <section className="admin-onboarded-detail__header">
        <Link
          href={INCOMPLETE_MEMBERS_HREF}
          className="admin-btn admin-btn--secondary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to Incomplete Members
        </Link>

        <div className="admin-onboarded-detail__title-row">
          <div>
            <p className="admin-detail-label">Member Name</p>
            <p className="admin-onboarded-detail__name">{member.name}</p>
            <p className="admin-onboarded-detail__since">
              Onboarding State {displayDash(onboardingState)}
            </p>
          </div>
          <div className="admin-onboarded-detail__title-badges">
            {onboardingState ? (
              <span
                className={`admin-status-badge ${onboardingBadgeClass(onboardingState)}`}
              >
                {onboardingState}
              </span>
            ) : null}
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
        <div className="admin-onboarded-detail__columns">
          <div className="admin-onboarded-detail__column">
            <MemberInformationCard member={member} />
            <OnboardingInformationCard member={member} />
          </div>
          <div className="admin-onboarded-detail__column">
            <OutstandingRequirementsCard member={member} />
          </div>
        </div>
      </div>
    </div>
  );
}
