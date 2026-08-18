import Link from "next/link";
import type { MockDashboardMember } from "@/types/admin-dashboard";

interface AdminMockMemberDetailProps {
  member: MockDashboardMember;
  backHref: string;
  backLabel: string;
}

function membershipBadgeClass(status: string): string {
  return status === "Approved" ? "is-approved" : "is-vetting-amber";
}

export default function AdminMockMemberDetail({
  member,
  backHref,
  backLabel,
}: AdminMockMemberDetailProps) {
  return (
    <div className="admin-detail">
      <div className="admin-detail__top">
        <Link href={backHref} className="admin-table-action">
          {backLabel}
        </Link>
      </div>

      <section className="admin-detail-card">
        <div className="admin-detail-card__header">
          <div>
            <h2 className="admin-detail-card__title">Member Details</h2>
            <p className="admin-detail-card__subtitle">{member.name}</p>
          </div>
        </div>

        <dl className="admin-detail-summary">
          <div>
            <span className="admin-detail-label">Member Name</span>
            <strong>{member.name}</strong>
          </div>
          <div>
            <span className="admin-detail-label">Phone Number</span>
            <strong>{member.phone}</strong>
          </div>
          <div>
            <span className="admin-detail-label">Email Address</span>
            <strong>{member.email}</strong>
          </div>
          <div>
            <span className="admin-detail-label">Membership Approval Date</span>
            <strong>{member.approvalDate}</strong>
          </div>
          <div>
            <span className="admin-detail-label">Membership Status</span>
            <strong>
              <span
                className={`admin-status-badge ${membershipBadgeClass(member.membershipStatus)}`}
              >
                {member.membershipStatus}
              </span>
            </strong>
          </div>
          <div>
            <span className="admin-detail-label">Onboarding Status</span>
            <strong>{member.onboardingStatus}</strong>
          </div>
          <div>
            <span className="admin-detail-label">Events Attended</span>
            <strong>{member.eventsAttended}</strong>
          </div>
          <div>
            <span className="admin-detail-label">Last Event Attended</span>
            <strong>{member.lastEventAttended}</strong>
          </div>
        </dl>
      </section>
    </div>
  );
}
