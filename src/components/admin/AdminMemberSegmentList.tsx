"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  DashboardSegmentId,
  MembershipStatus,
  MockDashboardMember,
  OnboardingStatus,
} from "@/types/admin-dashboard";
import {
  DASHBOARD_SEGMENT_CONFIG,
  type SegmentExtraColumn,
} from "@/lib/admin/dashboard-segments";
import { getMockMembersForSegment } from "@/lib/admin/mock-dashboard-members";

interface AdminMemberSegmentListProps {
  segment: DashboardSegmentId;
  title: string;
  description: string;
}

const PAGE_SIZE = 10;
const ALL_STATUS = "";

const MEMBERSHIP_STATUS_OPTIONS: MembershipStatus[] = [
  "Approved",
  "Incomplete",
];

const ONBOARDING_STATUS_OPTIONS: OnboardingStatus[] = [
  "Profile Incomplete",
  "ID Required",
  "Not Started",
];

function membershipBadgeClass(status: string): string {
  return status === "Approved" ? "is-approved" : "is-vetting-amber";
}

function onboardingBadgeClass(status: string): string {
  switch (status) {
    case "Completed":
      return "is-approved";
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

function extraLabel(column: SegmentExtraColumn): string {
  switch (column) {
    case "onboardingStatus":
      return "Onboarding Status";
    case "missingStep":
      return "Missing Step";
    case "reminderAction":
      return "Reminder Action";
    case "eventsAttended":
      return "Events Attended";
    case "lastEventAttended":
      return "Last Event Attended";
    default:
      return column;
  }
}

export default function AdminMemberSegmentList({
  segment,
  title,
  description,
}: AdminMemberSegmentListProps) {
  const config = DASHBOARD_SEGMENT_CONFIG[segment];
  const rows = useMemo(() => getMockMembersForSegment(segment), [segment]);
  const extraColumns = config.extraColumns;
  const showReminder = extraColumns.includes("reminderAction");
  const tableColumns = extraColumns.filter(
    (column) => column !== "reminderAction",
  );

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

  const statusOptions =
    config.statusFilter === "onboarding"
      ? ONBOARDING_STATUS_OPTIONS
      : MEMBERSHIP_STATUS_OPTIONS.filter((option) =>
          rows.some((row) => row.membershipStatus === option),
        );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((row) => {
      if (q) {
        const haystack = [row.name, row.email, row.phone]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (statusFilter) {
        const value =
          config.statusFilter === "onboarding"
            ? row.onboardingStatus
            : row.membershipStatus;
        if (value !== statusFilter) return false;
      }

      return true;
    });
  }, [rows, query, statusFilter, config.statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageStartIndex = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE;
  const pageEndIndex = Math.min(pageStartIndex + PAGE_SIZE, filtered.length);
  const pageRows = filtered.slice(pageStartIndex, pageEndIndex);
  const pageItems = getPageItems(safePage, totalPages);
  const colCount = 6 + tableColumns.length + (showReminder ? 1 : 0);

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

  const memberDetailHref = (id: string) =>
    `/admin/members/${encodeURIComponent(id)}?from=${encodeURIComponent(config.href)}`;

  return (
    <section className="admin-card" aria-label={title}>
      <p className="admin-sr-only">{description}</p>
      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <Link href="/admin/dashboard" className="admin-btn admin-btn--secondary">
            Back to Dashboard
          </Link>
          <span className="admin-dash-result-count">
            {filtered.length.toLocaleString("en-US")} Members
          </span>
          {statusOptions.length > 0 ? (
            <label className="admin-filter">
              <span className="admin-sr-only">Status</span>
              <select
                className="admin-select"
                value={statusFilter}
                onChange={(event) => updateStatus(event.target.value)}
                aria-label="Status"
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
        />
      </div>

      {banner ? (
        <p className="admin-dash-banner" role="status">
          {banner}
        </p>
      ) : null}

      <div className="admin-table-wrap">
        <table
          className={`admin-table admin-table--segment${showReminder ? " admin-table--segment-incomplete" : ""}`}
        >
          <thead>
            <tr>
              <th>Member</th>
              <th>Phone Number</th>
              <th>Email Address</th>
              <th>Membership Approval Date</th>
              <th>Status</th>
              {tableColumns.map((column) => (
                <th key={column}>{extraLabel(column)}</th>
              ))}
              <th>Action</th>
              {showReminder ? <th>Reminder Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="admin-table-empty">
                  No Members match your current filters.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <SegmentMemberRow
                  key={row.id}
                  row={row}
                  tableColumns={tableColumns}
                  showReminder={showReminder}
                  reminderQueued={queuedIds.includes(row.id)}
                  detailHref={memberDetailHref(row.id)}
                  onRemind={() => queueReminder(row.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 ? (
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

function SegmentMemberRow({
  row,
  tableColumns,
  showReminder,
  reminderQueued,
  detailHref,
  onRemind,
}: {
  row: MockDashboardMember;
  tableColumns: SegmentExtraColumn[];
  showReminder: boolean;
  reminderQueued: boolean;
  detailHref: string;
  onRemind: () => void;
}) {
  return (
    <tr>
      <td>
        <span className="admin-member-name">{row.name}</span>
      </td>
      <td>{row.phone}</td>
      <td>{row.email}</td>
      <td>{row.approvalDate}</td>
      <td>
        <span
          className={`admin-status-badge ${membershipBadgeClass(row.membershipStatus)}`}
        >
          {row.membershipStatus}
        </span>
      </td>
      {tableColumns.map((column) => (
        <td key={column}>
          {column === "onboardingStatus" ? (
            <span
              className={`admin-status-badge ${onboardingBadgeClass(row.onboardingStatus)}`}
            >
              {row.onboardingStatus}
            </span>
          ) : column === "missingStep" ? (
            row.missingStep
          ) : column === "eventsAttended" ? (
            row.eventsAttended
          ) : column === "lastEventAttended" ? (
            row.lastEventAttended
          ) : null}
        </td>
      ))}
      <td>
        <Link href={detailHref} className="admin-table-action">
          View
        </Link>
      </td>
      {showReminder ? (
        <td>
          <button
            type="button"
            className="admin-table-action"
            disabled={reminderQueued}
            onClick={onRemind}
          >
            {reminderQueued ? "Reminder queued" : "Send Reminder"}
          </button>
        </td>
      ) : null}
    </tr>
  );
}
