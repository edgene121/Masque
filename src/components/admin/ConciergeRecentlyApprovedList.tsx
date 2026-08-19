"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type {
  ConciergeAttendance,
  ConciergeBertha,
  ConciergeEscalation,
  ConciergeMember,
  ConciergeStatus,
  PeopleOnboardingState,
} from "@/types/admin-concierge";
import {
  conciergeAttendanceLabel,
  conciergeBerthaLabel,
  getConciergePriority,
  isConciergeFieldResolved,
} from "@/lib/admin/mock-concierge-members";
import {
  attendanceBadgeClass,
  berthaBadgeClass,
  conciergeStatusBadgeClass,
  memberAttendanceLabel,
  memberBerthaLabel,
  onboardingBadgeClass,
  outstandingItemClass,
  peopleConciergeStatus,
  peopleEscalation,
  peopleOnboardingState,
} from "@/lib/admin/concierge-display";

const PAGE_SIZE = 10;
const ALL_FILTER = "__all__";

function isAirtablePeopleRecordId(value: string): boolean {
  return /^rec[a-zA-Z0-9]{10,}$/.test(value);
}

const CONCIERGE_STATUS_OPTIONS: ConciergeStatus[] = [
  "Not Contacted",
  "Welcome Completed",
  "Conversation Active",
  "Follow-up Needed",
  "Deferred",
  "Do Not Contact",
];

const ONBOARDING_OPTIONS: PeopleOnboardingState[] = [
  "Completed",
  "In Progress",
  "Not Started",
];
const ATTENDANCE_OPTIONS: ConciergeAttendance[] = [
  "Never Attended",
  "Attended",
];
const BERTHA_OPTIONS: ConciergeBertha[] = ["Purchased", "No Ticket"];
const ESCALATION_OPTIONS: ConciergeEscalation[] = [
  "None",
  "Concierge Follow-up",
  "Operations Follow-up",
  "Founder Follow-up",
];
const NONE_OUTSTANDING_FILTER = "__none__";
const OUTSTANDING_ITEM_OPTIONS = [
  "Follow-Up Required",
  "ID Pending Review",
  "ID Review",
  "Agreement Pending",
  "Review Required",
  "Restriction Hold",
  "Onboarding Not Started",
  "Onboarding In Progress",
  "Onboarding Submitted",
  "Concierge Follow-up",
  "Operations Follow-up",
  "Founder Follow-up",
  "Verification",
  "Member Agreement",
  "Portal Login",
  "Bertha",
  "Data Quality Issue",
] as const;

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

export default function ConciergeRecentlyApprovedList({
  members,
  loadError = null,
}: {
  members: ConciergeMember[];
  loadError?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [conciergeStatus, setConciergeStatus] = useState(ALL_FILTER);
  const [onboarding, setOnboarding] = useState(ALL_FILTER);
  const [attendance, setAttendance] = useState(ALL_FILTER);
  const [bertha, setBertha] = useState(ALL_FILTER);
  const [escalation, setEscalation] = useState(ALL_FILTER);
  const [outstanding, setOutstanding] = useState(ALL_FILTER);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return members.filter((row) => {
      if (q) {
        const haystack = `${row.name} ${row.phone} ${row.email}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (
        conciergeStatus !== ALL_FILTER &&
        peopleConciergeStatus(row) !== conciergeStatus
      ) {
        return false;
      }
      if (
        onboarding !== ALL_FILTER &&
        peopleOnboardingState(row) !== onboarding
      ) {
        return false;
      }
      if (
        attendance !== ALL_FILTER &&
        (!isConciergeFieldResolved(row, "attendance") ||
          conciergeAttendanceLabel(row) !== attendance)
      ) {
        return false;
      }
      if (
        bertha !== ALL_FILTER &&
        (!isConciergeFieldResolved(row, "bertha") ||
          conciergeBerthaLabel(row) !== bertha)
      ) {
        return false;
      }
      if (escalation !== ALL_FILTER) {
        const rowEscalation = peopleEscalation(row);
        if (escalation === "None") {
          if (rowEscalation && rowEscalation !== "None") return false;
        } else if (rowEscalation !== escalation) {
          return false;
        }
      }
      if (outstanding === NONE_OUTSTANDING_FILTER) {
        if (row.outstandingItems.length !== 0) return false;
      } else if (
        outstanding !== ALL_FILTER &&
        !row.outstandingItems.includes(outstanding)
      ) {
        return false;
      }
      return true;
    });
  }, [
    members,
    query,
    conciergeStatus,
    onboarding,
    attendance,
    bertha,
    escalation,
    outstanding,
  ]);

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
              <option value={ALL_FILTER}>All Concierge Statuses</option>
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
              <option value={ALL_FILTER}>All Onboarding Statuses</option>
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
              <option value={ALL_FILTER}>All Attendance</option>
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
              <option value={ALL_FILTER}>All Bertha Status</option>
              {BERTHA_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-filter">
            <span className="admin-sr-only">Escalation</span>
            <select
              className="admin-select"
              value={escalation}
              onChange={(event) => {
                setEscalation(event.target.value);
                resetPage();
              }}
              aria-label="All Escalations"
            >
              <option value={ALL_FILTER}>All Escalations</option>
              {ESCALATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-filter">
            <span className="admin-sr-only">Outstanding Items</span>
            <select
              className="admin-select"
              value={outstanding}
              onChange={(event) => {
                setOutstanding(event.target.value);
                resetPage();
              }}
              aria-label="All Outstanding Items"
            >
              <option value={ALL_FILTER}>All Outstanding Items</option>
              {OUTSTANDING_ITEM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={NONE_OUTSTANDING_FILTER}>
                No Outstanding Items
              </option>
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
          <colgroup>
            <col className="admin-col-member" />
            <col className="admin-col-phone" />
            <col className="admin-col-email" />
            <col className="admin-col-approval" />
            <col className="admin-col-attendance" />
            <col className="admin-col-bertha" />
            <col className="admin-col-onboarding" />
            <col className="admin-col-concierge-status" />
            <col className="admin-col-outstanding" />
            <col className="admin-col-action" />
          </colgroup>
          <thead>
            <tr>
              <th className="admin-col-member">Member</th>
              <th className="admin-col-phone">Phone</th>
              <th className="admin-col-email">Email</th>
              <th className="admin-col-approval">Approval Date</th>
              <th className="admin-col-attendance">Attendance</th>
              <th className="admin-col-bertha">Bertha</th>
              <th className="admin-col-onboarding">Onboarding</th>
              <th className="admin-col-concierge-status">Concierge Status</th>
              <th className="admin-col-outstanding">Outstanding Items</th>
              <th className="admin-col-action">Action</th>
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
                <ConciergeMemberRow
                  key={row.applicationId || row.id}
                  row={row}
                />
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
  const attendance = memberAttendanceLabel(row);
  const bertha = memberBerthaLabel(row);
  const onboarding = peopleOnboardingState(row);
  const conciergeStatusValue = peopleConciergeStatus(row);

  return (
    <tr>
      <td className="admin-col-member">
        <div className="admin-concierge-member">
          <span className="admin-member-name" title={row.name}>
            {row.name}
          </span>
          <span
            className={`admin-status-badge admin-concierge-priority ${
              priority === "High" ? "is-vetting-amber" : "is-member-subtle"
            }`}
          >
            {priority}
          </span>
        </div>
      </td>
      <td className="admin-col-phone">{row.phone}</td>
      <td className="admin-col-email">
        <span className="admin-concierge-email" title={row.email}>
          {row.email}
        </span>
      </td>
      <td className="admin-col-approval">{row.approvalDate}</td>
      <td className="admin-col-attendance">
        {attendance ? (
          <span className={`admin-status-badge ${attendanceBadgeClass(attendance)}`}>
            {attendance}
          </span>
        ) : (
          <UnresolvedValue />
        )}
      </td>
      <td className="admin-col-bertha">
        {bertha ? (
          <span className={`admin-status-badge ${berthaBadgeClass(bertha)}`}>
            {bertha}
          </span>
        ) : (
          <UnresolvedValue />
        )}
      </td>
      <td className="admin-col-onboarding">
        {onboarding ? (
          <span className={`admin-status-badge ${onboardingBadgeClass(onboarding)}`}>
            {onboarding}
          </span>
        ) : (
          <UnresolvedValue />
        )}
      </td>
      <td className="admin-col-concierge-status">
        {conciergeStatusValue ? (
          <span
            className={`admin-status-badge ${conciergeStatusBadgeClass(conciergeStatusValue)}`}
          >
            {conciergeStatusValue}
          </span>
        ) : (
          <UnresolvedValue />
        )}
      </td>
      <td className="admin-col-outstanding">
        <OutstandingItems items={row.outstandingItems} />
      </td>
      <td className="admin-col-action">
        {isAirtablePeopleRecordId(row.id) ? (
          <Link
            href={`/admin/concierge/members/${encodeURIComponent(row.id)}`}
            className="admin-table-action"
          >
            View
          </Link>
        ) : (
          <UnresolvedValue />
        )}
      </td>
    </tr>
  );
}

function UnresolvedValue() {
  return <span>—</span>;
}

function OutstandingItems({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <UnresolvedValue />;
  }

  return (
    <div className="admin-concierge-tags">
      {items.map((item) => (
        <span
          key={item}
          className={`admin-concierge-tag ${outstandingItemClass(item)}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
