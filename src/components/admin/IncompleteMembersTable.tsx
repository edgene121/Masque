"use client";

import { useEffect, useRef, useState } from "react";
import type {
  IncompleteMember,
  IncompleteOnboardingStatus,
} from "@/types/admin-dashboard";

interface IncompleteMembersTableProps {
  members: IncompleteMember[];
}

function statusBadgeClass(status: IncompleteOnboardingStatus): string {
  switch (status) {
    case "Profile Incomplete":
      return "is-vetting-amber";
    case "ID Required":
      return "is-vetting-blue";
    case "Not Started":
      return "is-neutral";
    default:
      return "is-neutral";
  }
}

export default function IncompleteMembersTable({
  members,
}: IncompleteMembersTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [queuedIds, setQueuedIds] = useState<string[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 2500);
    return () => window.clearTimeout(timer);
  }, [banner]);

  useEffect(() => {
    if (queuedIds.length === 0) return;
    const timer = window.setTimeout(() => setQueuedIds([]), 2500);
    return () => window.clearTimeout(timer);
  }, [queuedIds]);

  const allSelected =
    members.length > 0 && selectedIds.length === members.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : members.map((member) => member.id));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const queueReminders = (ids: string[]) => {
    if (ids.length === 0) return;
    setQueuedIds(ids);
    setBanner(
      ids.length === 1
        ? "Reminder queued"
        : `Reminder queued for ${ids.length} members`,
    );
  };

  return (
    <section className="admin-card">
      <div className="admin-dash-section-header">
        <div>
          <h2 className="admin-dash-section-title">Incomplete Members</h2>
          <p className="admin-dash-section-subtitle">
            Members who have outstanding onboarding requirements.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-dash-btn"
          disabled={selectedIds.length === 0}
          onClick={() => queueReminders(selectedIds)}
        >
          Send Reminder to Selected
        </button>
      </div>

      {banner ? (
        <p className="admin-dash-banner" role="status">
          {banner}
        </p>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table admin-table--incomplete">
          <thead>
            <tr>
              <th className="admin-col-check">
                <label className="admin-dash-check">
                  <span className="admin-sr-only">Select all incomplete members</span>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </label>
              </th>
              <th>Member</th>
              <th>Email</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const selected = selectedIds.includes(member.id);
              const queued = queuedIds.includes(member.id);

              return (
                <tr key={member.id}>
                  <td className="admin-col-check">
                    <label className="admin-dash-check">
                      <span className="admin-sr-only">
                        Select {member.name}
                      </span>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleOne(member.id)}
                      />
                    </label>
                  </td>
                  <td>
                    <span className="admin-member-name">{member.name}</span>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    <span
                      className={`admin-status-badge ${statusBadgeClass(member.status)}`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td>{member.registered}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-table-action"
                      disabled={queued}
                      onClick={() => queueReminders([member.id])}
                    >
                      {queued ? "Reminder queued" : "Send Reminder"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
