import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ConciergeMember } from "@/types/admin-concierge";
import MemberProfileSections from "@/components/admin/MemberProfileSections";
import {
  displayDash,
  membershipStatusBadgeClass,
} from "@/lib/admin/concierge-display";

const REGISTERED_MEMBERS_HREF = "/admin/dashboard/registered";

export default function RegisteredMemberWorkspace({
  member,
}: {
  member: ConciergeMember;
}) {
  const membershipStatus = member.membershipStatus?.trim() ?? "";

  return (
    <div className="admin-concierge-workspace">
      <section className="admin-concierge-workspace__header">
        <Link
          href={REGISTERED_MEMBERS_HREF}
          className="admin-btn admin-btn--secondary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to Registered Members
        </Link>

        <div className="admin-concierge-workspace__title-row">
          <div>
            <p className="admin-detail-label">Member Name</p>
            <p className="admin-concierge-workspace__name">{member.name}</p>
            <p className="admin-concierge-workspace__since">
              Member since {displayDash(member.approvalDate)}
            </p>
          </div>
          {membershipStatus ? (
            <span
              className={`admin-status-badge ${membershipStatusBadgeClass(membershipStatus)}`}
            >
              {membershipStatus}
            </span>
          ) : null}
        </div>
      </section>

      <div className="admin-concierge-workspace__grid">
        <MemberProfileSections member={member} />
      </div>
    </div>
  );
}
