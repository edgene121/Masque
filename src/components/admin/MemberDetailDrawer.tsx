"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { RecentlyApprovedMember } from "@/types/admin-dashboard";

interface MemberDetailDrawerProps {
  member: RecentlyApprovedMember | null;
  onClose: () => void;
}

export default function MemberDetailDrawer({
  member,
  onClose,
}: MemberDetailDrawerProps) {
  useEffect(() => {
    if (!member) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [member, onClose]);

  if (!member) return null;

  return (
    <div className="admin-drawer-backdrop" onClick={onClose}>
      <aside
        className="admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-drawer__header">
          <h2 id="admin-drawer-title" className="admin-drawer__title">
            Member Details
          </h2>
          <button
            type="button"
            className="admin-drawer__close-icon"
            onClick={onClose}
            aria-label="Close member details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="admin-drawer__fields">
          <div className="admin-drawer__field">
            <dt>Member Name</dt>
            <dd>{member.name}</dd>
          </div>
          <div className="admin-drawer__field">
            <dt>Phone Number</dt>
            <dd>{member.phone}</dd>
          </div>
          <div className="admin-drawer__field">
            <dt>Email Address</dt>
            <dd>{member.email}</dd>
          </div>
          <div className="admin-drawer__field">
            <dt>Membership Approval Date</dt>
            <dd>{member.approvalDate}</dd>
          </div>
          <div className="admin-drawer__field">
            <dt>Membership Status</dt>
            <dd>
              <span className="admin-status-badge is-approved">
                {member.status}
              </span>
            </dd>
          </div>
          <div className="admin-drawer__field">
            <dt>Onboarding Status</dt>
            <dd>{member.onboardingStatus}</dd>
          </div>
          <div className="admin-drawer__field">
            <dt>Events Attended</dt>
            <dd>{member.eventsAttended}</dd>
          </div>
          <div className="admin-drawer__field">
            <dt>Last Event Attended</dt>
            <dd>{member.lastEventAttended}</dd>
          </div>
        </dl>

        <div className="admin-drawer__footer">
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
