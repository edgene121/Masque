"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AdminApplicationRow } from "@/types/admin-users";

interface AdminUsersTableProps {
  rows: AdminApplicationRow[];
  loadError?: string | null;
}

const PAGE_SIZE = 10;
const ALL_VETTING = "";
const ALL_MEMBER = "";
const STATUS_APPLICATION_RECEIVED = "application received";

const VETTING_OPTIONS = [
  "application received",
  "pending",
  "under review",
  "approved",
  "rejected",
  "hold",
  "Duplicate Submission",
  "Referral Concern",
] as const;

const MEMBER_OPTIONS = [
  "active member",
  "inner circle",
  "team",
  "1 time guest",
] as const;

function displayOrDash(value: string): string {
  const trimmed = value.trim();
  return trimmed || "—";
}

function vettingBadgeClass(status: string): string {
  const key = status.trim().toLowerCase();
  switch (key) {
    case "application received":
    case "pending":
    case "under review":
      return "is-vetting-blue";
    case "approved":
      return "is-approved";
    case "rejected":
      return "is-rejected";
    case "hold":
    case "duplicate submission":
    case "referral concern":
      return "is-vetting-amber";
    default:
      return key ? "is-neutral" : "";
  }
}

function memberBadgeClass(status: string): string {
  return status.trim() ? "is-member-subtle" : "";
}

function equalsIgnoreCase(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function createdTimeMs(value: string): number {
  if (!value.trim()) return Number.NEGATIVE_INFINITY;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms;
}

/** Compact page list: 1 2 3 ... n-1 n */
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

export default function AdminUsersTable({
  rows,
  loadError = null,
}: AdminUsersTableProps) {
  const [localRows, setLocalRows] = useState(rows);
  const [query, setQuery] = useState("");
  const [vettingFilter, setVettingFilter] = useState(ALL_VETTING);
  const [memberFilter, setMemberFilter] = useState(ALL_MEMBER);
  const [page, setPage] = useState(1);
  const [pendingRecordId, setPendingRecordId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const sortedRows = useMemo(() => {
    return [...localRows].sort(
      (a, b) => createdTimeMs(b.createdTime) - createdTimeMs(a.createdTime),
    );
  }, [localRows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return sortedRows.filter((row) => {
      if (q) {
        const haystack = [
          row.name,
          row.email,
          row.vettingStatus,
          row.memberStatus,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (
        vettingFilter &&
        !equalsIgnoreCase(row.vettingStatus, vettingFilter)
      ) {
        return false;
      }

      if (
        memberFilter &&
        !equalsIgnoreCase(row.memberStatus, memberFilter)
      ) {
        return false;
      }

      return true;
    });
  }, [sortedRows, query, vettingFilter, memberFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageStartIndex = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE;
  const pageEndIndex = Math.min(pageStartIndex + PAGE_SIZE, filtered.length);
  const pageRows = filtered.slice(pageStartIndex, pageEndIndex);

  const filtersActive =
    query.trim().length > 0 ||
    vettingFilter !== ALL_VETTING ||
    memberFilter !== ALL_MEMBER;

  const clearFilters = () => {
    setQuery("");
    setVettingFilter(ALL_VETTING);
    setMemberFilter(ALL_MEMBER);
    setPage(1);
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateVetting = (value: string) => {
    setVettingFilter(value);
    setPage(1);
  };

  const updateMember = (value: string) => {
    setMemberFilter(value);
    setPage(1);
  };

  const emptyMessage =
    localRows.length === 0
      ? "No users found."
      : "No users match your current filters.";

  const pageItems = getPageItems(safePage, totalPages);
  const confirmRow = pendingRecordId
    ? localRows.find((row) => row.id === pendingRecordId) ?? null
    : null;

  const confirmMarkPending = async () => {
    if (!pendingRecordId || updatingId) return;

    const recordId = pendingRecordId;
    setUpdatingId(recordId);
    setActionError(null);

    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(recordId)}/vetting-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "pending" }),
        },
      );

      const data = (await response.json().catch(() => null)) as {
        record?: AdminApplicationRow;
        error?: string;
      } | null;

      if (!response.ok || !data?.record) {
        setActionError(
          data?.error ||
            "Unable to update this application. Please try again.",
        );
        return;
      }

      setLocalRows((prev) =>
        prev.map((row) => (row.id === recordId ? data.record! : row)),
      );
      setPendingRecordId(null);
    } catch {
      setActionError("Unable to update this application. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="admin-card">
      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <label className="admin-filter">
            <span className="admin-sr-only">Vetting Status</span>
            <select
              className="admin-select"
              value={vettingFilter}
              onChange={(e) => updateVetting(e.target.value)}
              aria-label="Vetting Status"
            >
              <option value={ALL_VETTING}>All Vetting Statuses</option>
              {VETTING_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-filter">
            <span className="admin-sr-only">Member Status</span>
            <select
              className="admin-select"
              value={memberFilter}
              onChange={(e) => updateMember(e.target.value)}
              aria-label="Member Status"
            >
              <option value={ALL_MEMBER}>All Member Statuses</option>
              {MEMBER_OPTIONS.map((option) => (
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
          placeholder="Search members…"
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          aria-label="Search members"
        />
      </div>

      {filtersActive ? (
        <div className="admin-filter-summary">
          <span>
            Vetting: {vettingFilter || "All"} · Member:{" "}
            {memberFilter || "All"}
            {query.trim() ? ` · Search: “${query.trim()}”` : ""}
          </span>
          <button
            type="button"
            className="admin-clear-filters"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="admin-action-error" role="alert">
          {actionError}
        </div>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Email</th>
              <th>Vetting Status</th>
              <th>Member Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadError ? (
              <tr>
                <td colSpan={6} className="admin-table-empty">
                  {loadError}
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-table-empty">
                  <div className="admin-empty-state">
                    <p>{emptyMessage}</p>
                    {filtersActive && localRows.length > 0 ? (
                      <button
                        type="button"
                        className="admin-clear-filters"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const vetting = displayOrDash(row.vettingStatus);
                const member = displayOrDash(row.memberStatus);
                const email = displayOrDash(row.email);
                const name = displayOrDash(row.name);
                const canMarkPending =
                  row.vettingStatus === STATUS_APPLICATION_RECEIVED;
                const isUpdating = updatingId === row.id;

                return (
                  <tr key={row.id}>
                    <td>
                      <span className="admin-member-name">{name}</span>
                    </td>
                    <td>{email}</td>
                    <td>
                      {row.vettingStatus.trim() ? (
                        <span
                          className={`admin-status-badge ${vettingBadgeClass(row.vettingStatus)}`}
                        >
                          {vetting}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {row.memberStatus.trim() ? (
                        <span
                          className={`admin-status-badge ${memberBadgeClass(row.memberStatus)}`}
                        >
                          {member}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{row.joinedDisplay}</td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          href={`/admin/users/${row.id}`}
                          className="admin-table-action"
                        >
                          View
                        </Link>
                        {canMarkPending ? (
                          <button
                            type="button"
                            className="admin-mark-pending-btn"
                            disabled={Boolean(updatingId)}
                            onClick={() => {
                              setActionError(null);
                              setPendingRecordId(row.id);
                            }}
                          >
                            {isUpdating ? "Updating..." : "Mark Pending"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loadError && filtered.length > 0 ? (
        <div className="admin-pagination">
          <p className="admin-pagination__summary">
            Showing {pageStartIndex + 1}–{pageEndIndex} of {filtered.length}{" "}
            users
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
                <span
                  key={`ellipsis-${index}`}
                  className="admin-page-ellipsis"
                >
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

      {confirmRow ? (
        <div className="admin-confirm-backdrop" role="presentation">
          <div
            className="admin-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
          >
            <h2 id="admin-confirm-title">Move this application to Pending?</h2>
            <p>
              {displayOrDash(confirmRow.name)}
              {confirmRow.email.trim()
                ? ` (${confirmRow.email.trim()})`
                : ""}
            </p>
            <div className="admin-confirm-actions">
              <button
                type="button"
                className="admin-confirm-cancel"
                disabled={Boolean(updatingId)}
                onClick={() => setPendingRecordId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-confirm-ok"
                disabled={Boolean(updatingId)}
                onClick={() => void confirmMarkPending()}
              >
                {updatingId === confirmRow.id ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
