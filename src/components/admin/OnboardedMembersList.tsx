"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  displayDash,
  membershipStatusBadgeClass,
} from "@/lib/admin/concierge-display";
import type { OnboardedMember } from "@/types/admin-onboarded-members";

interface OnboardedMembersListProps {
  title: string;
  description: string;
  members?: OnboardedMember[];
  loadError?: string | null;
  loading?: boolean;
}

const PAGE_SIZE = 10;

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

export default function OnboardedMembersList({
  title,
  description,
  members = [],
  loadError = null,
  loading = false,
}: OnboardedMembersListProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;

    return members.filter((row) => {
      const haystack = [row.name, row.email, row.phone].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [members, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageStartIndex = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE;
  const pageEndIndex = Math.min(pageStartIndex + PAGE_SIZE, filtered.length);
  const pageRows = filtered.slice(pageStartIndex, pageEndIndex);
  const pageItems = getPageItems(safePage, totalPages);

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const emptyMessage = loadError
    ? loadError
    : loading
      ? "Loading onboarded members..."
      : "No onboarded members match your current search.";

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

      <div className="admin-table-wrap">
        <table className="admin-table admin-table--segment">
          <thead>
            <tr>
              <th>Member</th>
              <th>Phone Number</th>
              <th>Email Address</th>
              <th>Membership Approval Date</th>
              <th>Onboarding State</th>
              <th>Membership Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading || loadError || pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="admin-member-name">{displayDash(row.name)}</span>
                  </td>
                  <td>{displayDash(row.phone)}</td>
                  <td>{displayDash(row.email)}</td>
                  <td>{displayDash(row.approvalDate)}</td>
                  <td>
                    <span className="admin-status-badge is-approved">
                      {row.onboardingState}
                    </span>
                  </td>
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
                    <Link
                      href={`/admin/dashboard/registered/${encodeURIComponent(row.id)}`}
                      className="admin-table-action"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
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
              onClick={() =>
                setPage((prev) => Math.min(totalPages, prev + 1))
              }
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
