"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { RegisteredMember } from "@/types/admin-registered-members";

interface RegisteredMembersListProps {
  title: string;
  description: string;
  members?: RegisteredMember[];
  loadError?: string | null;
  loading?: boolean;
}

const PAGE_SIZE = 10;
const ALL_STATUS = "";

function displayDash(value: string): string {
  return value.trim() || "—";
}

function membershipStatusBadgeClass(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "approved" || normalized === "approved member") {
    return "is-approved";
  }
  if (normalized === "rejected") return "is-rejected";
  if (normalized === "hold") return "is-vetting-amber";
  if (normalized === "prospect") return "is-vetting-blue";
  return "is-neutral";
}

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

export default function RegisteredMembersList({
  title,
  description,
  members = [],
  loadError = null,
  loading = false,
}: RegisteredMembersListProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [page, setPage] = useState(1);

  const statusOptions = useMemo(() => {
    const values = new Set<string>();
    for (const row of members) {
      const status = row.membershipStatus.trim();
      if (status) values.add(status);
    }
    return [...values].sort((left, right) => left.localeCompare(right));
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

      if (statusFilter && row.membershipStatus !== statusFilter) {
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

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateStatus = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const emptyMessage = loadError
    ? loadError
    : loading
      ? "Loading registered members..."
      : "No registered members match your current filters.";

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
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading || loadError || pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-table-empty">
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
                      href={`/admin/concierge/members/${encodeURIComponent(row.id)}`}
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
