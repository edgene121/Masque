"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  displayDash,
  membershipStatusBadgeClass,
  onboardingBadgeClass,
} from "@/lib/admin/concierge-display";
import type { IncompleteMember } from "@/types/admin-incomplete-members";

interface IncompleteMembersListProps {
  title: string;
  description: string;
  members?: IncompleteMember[];
  loadError?: string | null;
  loading?: boolean;
}

const PAGE_SIZE = 10;
const ALL_STATUS = "";

function getPageItems(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: Array<number | "ellipsis"> = [];
  const pushUnique = (value: number | "ellipsis") => {
    if (items[items.length - 1] !== value) items.push(value);
  };

  pushUnique(1);

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pushUnique("ellipsis");
  for (let page = start; page <= end; page += 1) pushUnique(page);
  if (end < total - 1) pushUnique("ellipsis");

  pushUnique(total);
  return items;
}

export default function IncompleteMembersList({
  title,
  description,
  members = [],
  loadError = null,
  loading = false,
}: IncompleteMembersListProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [page, setPage] = useState(1);
  const [queuedIds, setQueuedIds] = useState<string[]>([]);
  const [banner, setBanner] = useState<string | null>(null);

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

  const statusOptions = useMemo(() => {
    const values = new Set<string>();
    for (const row of members) {
      const status = row.onboardingState.trim();
      if (status) values.add(status);
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return members.filter((row) => {
      if (q) {
        const haystack = [row.name, row.email, row.phone]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (statusFilter && row.onboardingState.trim() !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [members, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageStartIndex = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE;
  const pageEndIndex = Math.min(pageStartIndex + PAGE_SIZE, filtered.length);
  const pageRows = filtered.slice(pageStartIndex, pageEndIndex);
  const pageItems = getPageItems(safePage, totalPages);
  const colCount = 9;

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateStatus = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const queueReminder = (id: string) => {
    setQueuedIds([id]);
    setBanner("Reminder queued");
  };

  const emptyMessage = loadError
    ? loadError
    : loading
      ? "Loading incomplete members..."
      : "No Members match your current filters.";

  return (
    <section className="admin-card" aria-label={title}>
      <p className="admin-sr-only">{description}</p>
      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <Link href="/admin/dashboard" className="admin-btn admin-btn--secondary">
            Back to Dashboard
          </Link>
          <span className="admin-dash-result-count">
            {loading || loadError
              ? "—"
              : `${members.length.toLocaleString("en-US")} Members`}
          </span>
          {statusOptions.length > 0 ? (
            <label className="admin-filter">
              <span className="admin-sr-only">Status</span>
              <select
                className="admin-select"
                value={statusFilter}
                onChange={(event) => updateStatus(event.target.value)}
                aria-label="Status"
                disabled={loading || Boolean(loadError)}
              >
                <option value={ALL_STATUS}>All Statuses</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <input
          type="search"
          className="admin-search"
          placeholder="Search Members"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          aria-label="Search Members"
          disabled={loading || Boolean(loadError)}
        />
      </div>

      {banner ? (
        <p className="admin-dash-banner" role="status">
          {banner}
        </p>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table admin-table--segment admin-table--segment-incomplete">
          <thead>
            <tr>
              <th>Member</th>
              <th>Phone Number</th>
              <th>Email Address</th>
              <th>Membership Approval Date</th>
              <th>Status</th>
              <th>Onboarding Status</th>
              <th>Missing Step</th>
              <th>Action</th>
              <th>Reminder Action</th>
            </tr>
          </thead>
          <tbody>
            {loading || loadError || pageRows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="admin-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const reminderQueued = queuedIds.includes(row.id);
                return (
                  <tr key={row.id}>
                    <td>
                      <span className="admin-member-name">
                        {displayDash(row.name)}
                      </span>
                    </td>
                    <td>{displayDash(row.phone)}</td>
                    <td>{displayDash(row.email)}</td>
                    <td>{displayDash(row.approvalDate)}</td>
                    <td>
                      {row.membershipStatus.trim() ? (
                        <span
                          className={`admin-status-badge ${membershipStatusBadgeClass(row.membershipStatus)}`}
                        >
                          {row.membershipStatus}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {row.onboardingState.trim() ? (
                        <span
                          className={`admin-status-badge ${onboardingBadgeClass(row.onboardingState)}`}
                        >
                          {row.onboardingState}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{displayDash(row.missingStep)}</td>
                    <td>
                      <Link
                        href={`/admin/dashboard/incomplete/${encodeURIComponent(row.id)}`}
                        className="admin-table-action"
                      >
                        View
                      </Link>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-table-action"
                        disabled={reminderQueued}
                        onClick={() => queueReminder(row.id)}
                      >
                        {reminderQueued ? "Reminder queued" : "Send Reminder"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && !loadError && filtered.length > 0 ? (
        <div className="admin-pagination">
          <p className="admin-pagination__summary">
            Showing {pageStartIndex + 1}–{pageEndIndex} of {filtered.length}{" "}
            Members
          </p>
          <div className="admin-pagination__controls">
            <button
              type="button"
              className="admin-page-btn"
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            {pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="admin-page-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`admin-page-btn${item === safePage ? " is-active" : ""}`}
                  onClick={() => setPage(item)}
                  aria-current={item === safePage ? "page" : undefined}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              className="admin-page-btn"
              disabled={safePage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
