"use client";

import type { RecentlyApprovedMember } from "@/types/admin-dashboard";

interface RecentlyApprovedTableProps {
  members: RecentlyApprovedMember[];
  onView: (member: RecentlyApprovedMember) => void;
}

export default function RecentlyApprovedTable({
  members,
  onView,
}: RecentlyApprovedTableProps) {
  return (
    <section className="admin-card">
      <div className="admin-dash-section-header">
        <div>
          <h2 className="admin-dash-section-title">Recently Approved Members</h2>
          <p className="admin-dash-section-subtitle">
            Members approved within the last 60 days.
          </p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table--approved">
          <thead>
            <tr>
              <th>Member</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Approval Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>
                  <span className="admin-member-name">{member.name}</span>
                </td>
                <td>{member.phone}</td>
                <td>{member.email}</td>
                <td>{member.approvalDate}</td>
                <td>
                  <span className="admin-status-badge is-approved">
                    {member.status}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-table-action"
                    onClick={() => onView(member)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
