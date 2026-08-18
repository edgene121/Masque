import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ConciergeMember } from "@/types/admin-concierge";
import OutstandingItemBadges from "@/components/admin/OutstandingItemBadges";
import {
  attendanceBadgeClass,
  berthaBadgeClass,
  complianceStateBadgeClass,
  conciergeStatusBadgeClass,
  displayDash,
  memberAttendanceLabel,
  memberBerthaLabel,
  onboardingBadgeClass,
  peopleComplianceState,
  peopleConciergeStatus,
  peopleOnboardingState,
} from "@/lib/admin/concierge-display";
import { isConciergeFieldResolved } from "@/lib/admin/mock-concierge-members";

export default function ConciergeMemberWorkspace({
  member,
}: {
  member: ConciergeMember;
}) {
  const attendance = memberAttendanceLabel(member);
  const bertha = memberBerthaLabel(member);
  const onboarding = peopleOnboardingState(member);
  const conciergeStatus = peopleConciergeStatus(member);
  const compliance = peopleComplianceState(member);
  const attendanceResolved = isConciergeFieldResolved(member, "attendance");

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
            <h2 className="admin-concierge-workspace__title">
              Concierge Member Detail
            </h2>
            <p className="admin-concierge-workspace__name">{member.name}</p>
            <p className="admin-concierge-workspace__since">
              Member since {displayDash(member.approvalDate)}
            </p>
          </div>
          <StatusBadge
            value={conciergeStatus}
            className={
              conciergeStatus
                ? conciergeStatusBadgeClass(conciergeStatus)
                : undefined
            }
          />
        </div>
      </section>

      <div className="admin-concierge-workspace__grid">
        <div className="admin-concierge-workspace__main">
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
            </dl>
          </section>

          <section className="admin-detail-card">
            <h3 className="admin-detail-card__title">Member Status</h3>
            <dl className="admin-detail-summary">
              <div>
                <dt className="admin-detail-label">Attendance</dt>
                <dd>
                  <StatusBadge
                    value={attendance}
                    className={
                      attendance ? attendanceBadgeClass(attendance) : undefined
                    }
                  />
                  {attendanceResolved && member.attendance.hasEverAttended ? (
                    <div className="admin-concierge-status-extra">
                      <LastEventAttended
                        name={member.attendance.lastEventName}
                        date={member.attendance.lastEventDate}
                        fallback={member.attendance.lastEventAttended}
                      />
                    </div>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="admin-detail-label">Bertha / Ticket Status</dt>
                <dd>
                  <StatusBadge
                    value={bertha}
                    className={bertha ? berthaBadgeClass(bertha) : undefined}
                  />
                </dd>
              </div>
              <div>
                <dt className="admin-detail-label">Onboarding State</dt>
                <dd>
                  <StatusBadge
                    value={onboarding}
                    className={
                      onboarding ? onboardingBadgeClass(onboarding) : undefined
                    }
                  />
                </dd>
              </div>
              <div>
                <dt className="admin-detail-label">Concierge Status</dt>
                <dd>
                  <StatusBadge
                    value={conciergeStatus}
                    className={
                      conciergeStatus
                        ? conciergeStatusBadgeClass(conciergeStatus)
                        : undefined
                    }
                  />
                </dd>
              </div>
              <div>
                <dt className="admin-detail-label">Compliance State</dt>
                <dd>
                  <StatusBadge
                    value={compliance}
                    className={
                      compliance
                        ? complianceStateBadgeClass(compliance)
                        : undefined
                    }
                  />
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="admin-concierge-workspace__side">
          <section className="admin-detail-card admin-concierge-outstanding-card">
            <h3 className="admin-detail-card__title">Outstanding Items</h3>
            <OutstandingItemBadges
              items={member.outstandingItems}
              emptyLabel="No Outstanding Items"
              large
            />
          </section>

          <section className="admin-detail-card">
            <h3 className="admin-detail-card__title">Concierge Information</h3>
            <dl className="admin-detail-summary">
              <div>
                <dt className="admin-detail-label">Concierge Status</dt>
                <dd>
                  <StatusBadge
                    value={conciergeStatus}
                    className={
                      conciergeStatus
                        ? conciergeStatusBadgeClass(conciergeStatus)
                        : undefined
                    }
                  />
                </dd>
              </div>
              <div>
                <dt className="admin-detail-label">Concierge Welcome Date</dt>
                <dd>{displayDash(member.conciergeWelcomeDate)}</dd>
              </div>
              <div>
                <dt className="admin-detail-label">Last Concierge Contact</dt>
                <dd>{displayDash(member.lastConciergeContact)}</dd>
              </div>
              <div>
                <dt className="admin-detail-label">Concierge Notes</dt>
                <dd>
                  {member.conciergeNotes?.trim() ? (
                    <p className="admin-concierge-notes">{member.conciergeNotes}</p>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

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
  if (!fallback || fallback === "—") return null;
  return (
    <>
      {fallback.split("\n").map((line) => (
        <div key={line}>{line}</div>
      ))}
    </>
  );
}
