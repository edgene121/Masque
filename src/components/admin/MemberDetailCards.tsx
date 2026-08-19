import type { ConciergeMember } from "@/types/admin-concierge";
import OutstandingItemBadges from "@/components/admin/OutstandingItemBadges";
import {
  displayDash,
  displayYesNo,
  membershipStatusBadgeClass,
  yesNoBadgeClass,
} from "@/lib/admin/concierge-display";
import { isConciergeFieldResolved } from "@/lib/admin/mock-concierge-members";

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

export function MemberInformationCard({ member }: { member: ConciergeMember }) {
  const membershipStatus = member.membershipStatus?.trim() ?? "";

  return (
    <section className="admin-detail-card">
      <h3 className="admin-detail-card__title">Member Information</h3>
      <dl className="admin-detail-summary">
        <div>
          <dt className="admin-detail-label">Member Name</dt>
          <dd>{displayDash(member.name)}</dd>
        </div>
        <div>
          <dt className="admin-detail-label">Phone Number</dt>
          <dd>{displayDash(member.phone)}</dd>
        </div>
        <div>
          <dt className="admin-detail-label">Email Address</dt>
          <dd>{displayDash(member.email)}</dd>
        </div>
        <div>
          <dt className="admin-detail-label">Membership Approval Date</dt>
          <dd>{displayDash(member.approvalDate)}</dd>
        </div>
        <div>
          <dt className="admin-detail-label">Membership Status</dt>
          <dd>
            {membershipStatus ? (
              <span
                className={`admin-status-badge ${membershipStatusBadgeClass(membershipStatus)}`}
              >
                {membershipStatus}
              </span>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function EventStatusCard({ member }: { member: ConciergeMember }) {
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
      <h3 className="admin-detail-card__title">Event Status</h3>
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

export function OnboardingCard({
  member,
  layout = "stacked",
}: {
  member: ConciergeMember;
  layout?: "stacked" | "wide";
}) {
  const body = (
    <>
      <div className="admin-concierge-subsection">
        <h4 className="admin-concierge-subsection__title">Verification</h4>
        <dl className="admin-detail-summary">
          <div>
            <dt className="admin-detail-label">Verification Method</dt>
            <dd>{displayDash(member.verificationMethod)}</dd>
          </div>
          <div>
            <dt className="admin-detail-label">ID Verified</dt>
            <dd>
              <StatusBadge
                value={displayYesNo(Boolean(member.idVerified))}
                className={yesNoBadgeClass(
                  displayYesNo(Boolean(member.idVerified)),
                )}
              />
            </dd>
          </div>
          <div>
            <dt className="admin-detail-label">ID Verification Date</dt>
            <dd>{displayDash(member.idVerificationDate)}</dd>
          </div>
        </dl>
      </div>

      <div className="admin-concierge-subsection">
        <h4 className="admin-concierge-subsection__title">Member Agreement</h4>
        <dl className="admin-detail-summary">
          <div>
            <dt className="admin-detail-label">Member Agreement Status</dt>
            <dd>{displayDash(member.memberAgreementStatus)}</dd>
          </div>
        </dl>
      </div>

      <div className="admin-concierge-subsection">
        <h4 className="admin-concierge-subsection__title">Portal</h4>
        <dl className="admin-detail-summary">
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
      </div>
    </>
  );

  return (
    <section className="admin-detail-card">
      <h3 className="admin-detail-card__title">Onboarding</h3>
      {layout === "wide" ? (
        <div className="admin-registered-detail__onboarding-grid">{body}</div>
      ) : (
        body
      )}
    </section>
  );
}

export function OutstandingItemsCard({ member }: { member: ConciergeMember }) {
  return (
    <section className="admin-detail-card admin-concierge-outstanding-card">
      <h3 className="admin-detail-card__title">Outstanding Items</h3>
      <OutstandingItemBadges
        items={member.outstandingItems}
        emptyLabel="No Outstanding Items"
        large
      />
    </section>
  );
}

export function DataQualityCard({ member }: { member: ConciergeMember }) {
  return (
    <section className="admin-detail-card">
      <h3 className="admin-detail-card__title">Data Quality</h3>
      <OutstandingItemBadges
        items={member.dataQualityIssues}
        emptyLabel="No Known Data Quality Issues"
        large
      />
    </section>
  );
}
