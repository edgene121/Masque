"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type {
  ConciergeAttendance,
  ConciergeBertha,
  ConciergeMember,
  ConciergeOnboarding,
  ConciergeOutstandingItem,
  ConciergeStatus,
} from "@/types/admin-concierge";
import {
  conciergeAttendanceLabel,
  conciergeBerthaLabel,
  conciergeOnboardingLabel,
  getConciergePriority,
} from "@/lib/admin/mock-concierge-members";

const PAGE_SIZE = 10;
const ALL = "";

const CONCIERGE_STATUS_OPTIONS: ConciergeStatus[] = [
  "Not Contacted",
  "Welcome Completed",
  "Conversation Active",
  "Follow-up Needed",
  "Deferred",
  "Do Not Contact",
];

const ONBOARDING_OPTIONS: ConciergeOnboarding[] = ["Completed", "Incomplete"];
const ATTENDANCE_OPTIONS: ConciergeAttendance[] = [
  "Never Attended",
  "Attended",
];
const BERTHA_OPTIONS: ConciergeBertha[] = ["Purchased", "No Ticket"];

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

function attendanceBadgeClass(value: ConciergeAttendance): string {
  return value === "Attended" ? "is-approved" : "is-vetting-amber";
}

function berthaBadgeClass(value: ConciergeBertha): string {
  return value === "Purchased" ? "is-approved" : "is-neutral";
}

function onboardingBadgeClass(value: ConciergeOnboarding): string {
  return value === "Completed" ? "is-approved" : "is-vetting-amber";
}

function conciergeStatusBadgeClass(value: ConciergeStatus): string {
  switch (value) {
    case "Welcome Completed":
      return "is-approved";
    case "Conversation Active":
      return "is-vetting-blue";
    case "Follow-up Needed":
      return "is-vetting-amber";
    case "Do Not Contact":
      return "is-member-subtle";
    case "Deferred":
      return "is-member-subtle";
    default:
      return "is-neutral";
  }
}

export default function ConciergeRecentlyApprovedList({
  members,
  loadError = null,
}: {
  members: ConciergeMember[];
  loadError?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [conciergeStatus, setConciergeStatus] = useState(ALL);
  const [onboarding, setOnboarding] = useState(ALL);
  const [attendance, setAttendance] = useState(ALL);
  const [bertha, setBertha] = useState(ALL);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return members.filter((row) => {
      if (q) {
        const haystack = `${row.name} ${row.phone} ${row.email}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (conciergeStatus && row.concierge.status !== conciergeStatus) {
        return false;
      }
      if (onboarding && conciergeOnboardingLabel(row) !== onboarding) {
        return false;
      }
      if (attendance && conciergeAttendanceLabel(row) !== attendance) {
        return false;
      }
      if (bertha && conciergeBerthaLabel(row) !== bertha) return false;
      return true;
    });
  }, [members, query, conciergeStatus, onboarding, attendance, bertha]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageStartIndex = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE;
  const pageEndIndex = Math.min(pageStartIndex + PAGE_SIZE, filtered.length);
  const pageRows = filtered.slice(pageStartIndex, pageEndIndex);
  const pageItems = getPageItems(safePage, totalPages);

  const resetPage = () => setPage(1);

  return (
    <section className="admin-card" aria-label="Recently Approved Members">
      <div className="admin-dash-section-header">
        <Link href="/admin/dashboard" className="admin-btn admin-btn--secondary">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
        <span className="admin-dash-result-count">
          {loadError
            ? "—"
            : `${filtered.length.toLocaleString("en-US")} Members`}
        </span>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <label className="admin-filter">
            <span className="admin-sr-only">Concierge Status</span>
            <select
              className="admin-select"
              value={conciergeStatus}
              onChange={(event) => {
                setConciergeStatus(event.target.value);
                resetPage();
              }}
              aria-label="All Concierge Statuses"
            >
              <option value={ALL}>All Concierge Statuses</option>
              {CONCIERGE_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-filter">
            <span className="admin-sr-only">Onboarding Status</span>
            <select
              className="admin-select"
              value={onboarding}
              onChange={(event) => {
                setOnboarding(event.target.value);
                resetPage();
              }}
              aria-label="All Onboarding Statuses"
            >
              <option value={ALL}>All Onboarding Statuses</option>
              {ONBOARDING_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-filter">
            <span className="admin-sr-only">Attendance</span>
            <select
              className="admin-select"
              value={attendance}
              onChange={(event) => {
                setAttendance(event.target.value);
                resetPage();
              }}
              aria-label="All Attendance"
            >
              <option value={ALL}>All Attendance</option>
              {ATTENDANCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-filter">
            <span className="admin-sr-only">Bertha Status</span>
            <select
              className="admin-select"
              value={bertha}
              onChange={(event) => {
                setBertha(event.target.value);
                resetPage();
              }}
              aria-label="All Bertha Status"
            >
              <option value={ALL}>All Bertha Status</option>
              {BERTHA_OPTIONS.map((option) => (
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
          onChange={(event) => {
            setQuery(event.target.value);
            resetPage();
          }}
          aria-label="Search Members"
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table--concierge">
          <thead>
            <tr>
              <th>Member</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Approval Date</th>
              <th>Attendance</th>
              <th>Bertha</th>
              <th>Onboarding</th>
              <th>Concierge Status</th>
              <th>Outstanding Items</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loadError ? (
              <tr>
                <td colSpan={10} className="admin-table-empty">
                  {loadError}
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="admin-table-empty">
                  {members.length === 0
                    ? "No recently approved members found."
                    : "No Members match your current filters."}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <ConciergeMemberRow key={row.id} row={row} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loadError && filtered.length > 0 ? (
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

function ConciergeMemberRow({ row }: { row: ConciergeMember }) {
  const priority = getConciergePriority(row);
  const attendance = conciergeAttendanceLabel(row);
  const bertha = conciergeBerthaLabel(row);
  const onboarding = conciergeOnboardingLabel(row);

  return (
    <tr>
      <td>
        <div className="admin-concierge-member">
          <span className="admin-member-name">{row.name}</span>
          <span
            className={`admin-status-badge admin-concierge-priority ${
              priority === "High" ? "is-vetting-amber" : "is-member-subtle"
            }`}
          >
            {priority}
          </span>
        </div>
      </td>
      <td>{row.phone}</td>
      <td>{row.email}</td>
      <td>{row.approvalDate}</td>
      <td>
        <span className={`admin-status-badge ${attendanceBadgeClass(attendance)}`}>
          {attendance}
        </span>
      </td>
      <td>
        <span className={`admin-status-badge ${berthaBadgeClass(bertha)}`}>
          {bertha}
        </span>
      </td>
      <td>
        <span className={`admin-status-badge ${onboardingBadgeClass(onboarding)}`}>
          {onboarding}
        </span>
      </td>
      <td>
        <span
          className={`admin-status-badge ${conciergeStatusBadgeClass(row.concierge.status)}`}
        >
          {row.concierge.status}
        </span>
      </td>
      <td className="admin-col-outstanding">
        <OutstandingItems items={row.outstandingItems} />
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
  );
}

function OutstandingItems({ items }: { items: ConciergeOutstandingItem[] }) {
  if (items.length === 0) {
    return <span className="admin-concierge-tag admin-concierge-tag--none">None</span>;
  }

  return (
    <div className="admin-concierge-tags">
      {items.map((item) => (
        <span key={item} className="admin-concierge-tag">
          {item}
        </span>
      ))}
    </div>
  );
}
