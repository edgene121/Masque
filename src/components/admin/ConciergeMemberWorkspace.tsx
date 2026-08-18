"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type {
  ConciergeAttendance,
  ConciergeBertha,
  ConciergeEscalation,
  ConciergeMember,
  ConciergeMemberAgreement,
  ConciergeOnboarding,
  ConciergeStatus,
  ConciergeVerificationMethod,
  ConciergeWorkflow,
} from "@/types/admin-concierge";
import {
  conciergeAttendanceLabel,
  conciergeBerthaLabel,
  conciergeOnboardingLabel,
  isConciergeFieldResolved,
} from "@/lib/admin/mock-concierge-members";

const CONCIERGE_STATUS_OPTIONS: ConciergeStatus[] = [
  "Not Contacted",
  "Welcome Completed",
  "Conversation Active",
  "Follow-up Needed",
  "Deferred",
  "Do Not Contact",
];

const ESCALATION_OPTIONS: ConciergeEscalation[] = [
  "None",
  "Concierge Follow-up",
  "Operations Follow-up",
  "Founder Follow-up",
];

interface ConciergeMemberWorkspaceProps {
  member: ConciergeMember;
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
    case "Deferred":
      return "is-member-subtle";
    default:
      return "is-neutral";
  }
}

function verificationBadgeClass(value: ConciergeVerificationMethod): string {
  switch (value) {
    case "Not Verified":
      return "is-vetting-amber";
    case "Verified Online":
      return "is-vetting-blue";
    default:
      return "is-approved";
  }
}

function agreementBadgeClass(value: ConciergeMemberAgreement): string {
  switch (value) {
    case "Signed in Portal":
      return "is-approved";
    case "Signed at Pierce (Legacy)":
      return "is-legacy";
    default:
      return "is-vetting-amber";
  }
}

function yesNoBadgeClass(value: boolean): string {
  return value ? "is-approved" : "is-neutral";
}

export default function ConciergeMemberWorkspace({
  member,
}: ConciergeMemberWorkspaceProps) {
  const [workflow, setWorkflow] = useState<ConciergeWorkflow>(member.concierge);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setWorkflow(member.concierge);
    setSaved(false);
  }, [member]);

  const attendanceResolved = isConciergeFieldResolved(member, "attendance");
  const attendance = attendanceResolved
    ? conciergeAttendanceLabel(member)
    : null;
  const bertha = conciergeBerthaLabel(member);
  const onboarding = conciergeOnboardingLabel(member);

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <div className="admin-concierge-workspace">
      <section className="admin-concierge-workspace__header">
        <Link
          href="/admin/concierge/recently-approved"
          className="admin-btn admin-btn--secondary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to Recently Approved
        </Link>

        <div className="admin-concierge-workspace__title-row">
          <div>
            <h2 className="admin-concierge-workspace__title">
              Concierge Member Detail
            </h2>
            <p className="admin-concierge-workspace__name">{member.name}</p>
            <p className="admin-concierge-workspace__since">
              Member since {member.approvalDate}
            </p>
          </div>
          <span
            className={`admin-status-badge ${conciergeStatusBadgeClass(workflow.status)}`}
          >
            {workflow.status}
          </span>
        </div>
      </section>

      <section className="admin-concierge-summary" aria-label="Quick summary">
        <SummaryCard
          label="Membership"
          value={
            <span className="admin-status-badge is-approved">Approved</span>
          }
          hint={member.approvalDate}
        />
        <SummaryCard
          label="Attendance"
          value={
            attendance ? (
              <span
                className={`admin-status-badge ${attendanceBadgeClass(attendance)}`}
              >
                {attendance}
              </span>
            ) : (
              "—"
            )
          }
        />
        <SummaryCard
          label="Bertha"
          value={
            <span className={`admin-status-badge ${berthaBadgeClass(bertha)}`}>
              {bertha}
            </span>
          }
        />
        <SummaryCard
          label="Onboarding"
          value={
            <span className={`admin-status-badge ${onboardingBadgeClass(onboarding)}`}>
              {onboarding}
            </span>
          }
        />
      </section>

      <div className="admin-concierge-workspace__grid">
        <div className="admin-concierge-workspace__main">
          <section className="admin-detail-card">
            <h3 className="admin-detail-card__title">Member Information</h3>
            <dl className="admin-detail-summary">
              <div>
                <dt className="admin-detail-label">Member Name</dt>
                <dd>{member.name}</dd>
              </div>
              <div>
                <dt className="admin-detail-label">Phone Number</dt>
                <dd>{member.phone}</dd>
              </div>
              <div>
                <dt className="admin-detail-label">Email Address</dt>
                <dd>{member.email}</dd>
              </div>
              <div>
                <dt className="admin-detail-label">Membership Approval Date</dt>
                <dd>{member.approvalDate}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-detail-card">
            <h3 className="admin-detail-card__title">Event Status</h3>
            <dl className="admin-detail-summary">
              <div>
                <dt className="admin-detail-label">Has Ever Attended</dt>
                <dd>
                  {attendanceResolved ? (
                    <span
                      className={`admin-status-badge ${yesNoBadgeClass(member.attendance.hasEverAttended)}`}
                    >
                      {member.attendance.hasEverAttended ? "Yes" : "No"}
                    </span>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="admin-detail-label">Last Event Attended</dt>
                <dd>
                  <LastEventAttended
                    resolved={attendanceResolved}
                    hasEverAttended={member.attendance.hasEverAttended}
                    name={member.attendance.lastEventName}
                    date={member.attendance.lastEventDate}
                    fallback={member.attendance.lastEventAttended}
                  />
                </dd>
              </div>
              <div>
                <dt className="admin-detail-label">Bertha Ticket Purchased</dt>
                <dd>
                  <span
                    className={`admin-status-badge ${yesNoBadgeClass(member.berthaTicketPurchased)}`}
                  >
                    {member.berthaTicketPurchased ? "Yes" : "No"}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="admin-detail-card">
            <h3 className="admin-detail-card__title">Onboarding</h3>
            <dl className="admin-detail-summary">
              <div>
                <dt className="admin-detail-label">Verification Method</dt>
                <dd>
                  <span
                    className={`admin-status-badge ${verificationBadgeClass(member.onboarding.verificationMethod)}`}
                  >
                    {member.onboarding.verificationMethod}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="admin-detail-label">Member Agreement</dt>
                <dd>
                  <span
                    className={`admin-status-badge ${agreementBadgeClass(member.onboarding.memberAgreement)}`}
                  >
                    {member.onboarding.memberAgreement}
                  </span>
                  {member.onboarding.memberAgreement ===
                  "Signed at Pierce (Legacy)" ? (
                    <p className="admin-concierge-legacy-note">
                      Legacy Pierce signature. This is not the current Portal
                      agreement.
                    </p>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="admin-detail-label">Portal Account Created</dt>
                <dd>
                  <span
                    className={`admin-status-badge ${yesNoBadgeClass(member.onboarding.portalAccountCreated)}`}
                  >
                    {member.onboarding.portalAccountCreated ? "Yes" : "No"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="admin-detail-label">Portal Login Completed</dt>
                <dd>
                  <span
                    className={`admin-status-badge ${yesNoBadgeClass(member.onboarding.portalLoginCompleted)}`}
                  >
                    {member.onboarding.portalLoginCompleted ? "Yes" : "No"}
                  </span>
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="admin-concierge-workspace__side">
          <section className="admin-detail-card admin-concierge-outstanding-card">
            <h3 className="admin-detail-card__title">Outstanding Items</h3>
            <p className="admin-detail-card__hint">
              Conversation guidance based on this member&apos;s current status.
            </p>
            {member.outstandingItems.length === 0 ? (
              <p className="admin-concierge-empty">No outstanding items</p>
            ) : (
              <div className="admin-concierge-tags admin-concierge-tags--large">
                {member.outstandingItems.map((item) => (
                  <span key={item} className="admin-concierge-tag">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="admin-detail-card admin-concierge-form-card">
            <h3 className="admin-detail-card__title">Concierge</h3>

            <div className="admin-concierge-form">
              <label className="admin-concierge-form__field">
                <span>Concierge Status</span>
                <select
                  className="admin-select"
                  value={workflow.status}
                  onChange={(event) => {
                    setSaved(false);
                    setWorkflow((prev) => ({
                      ...prev,
                      status: event.target.value as ConciergeStatus,
                    }));
                  }}
                >
                  {CONCIERGE_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-concierge-form__row">
                <label className="admin-concierge-form__field">
                  <span>Concierge Welcome Date</span>
                  <input
                    type="date"
                    className="admin-concierge-input"
                    value={workflow.welcomeDate}
                    onChange={(event) => {
                      setSaved(false);
                      setWorkflow((prev) => ({
                        ...prev,
                        welcomeDate: event.target.value,
                      }));
                    }}
                  />
                </label>
                <label className="admin-concierge-form__field">
                  <span>Last Concierge Contact</span>
                  <input
                    type="date"
                    className="admin-concierge-input"
                    value={workflow.lastContact}
                    onChange={(event) => {
                      setSaved(false);
                      setWorkflow((prev) => ({
                        ...prev,
                        lastContact: event.target.value,
                      }));
                    }}
                  />
                </label>
              </div>

              <label className="admin-concierge-form__field">
                <span>Concierge Notes</span>
                <textarea
                  className="admin-concierge-textarea"
                  rows={6}
                  placeholder="Add notes from the member conversation..."
                  value={workflow.notes}
                  onChange={(event) => {
                    setSaved(false);
                    setWorkflow((prev) => ({
                      ...prev,
                      notes: event.target.value,
                    }));
                  }}
                />
              </label>

              <div
                className={`admin-concierge-escalation${
                  workflow.escalation !== "None" ? " is-assigned" : ""
                }`}
              >
                <label className="admin-concierge-form__field">
                  <span>Escalation</span>
                  <select
                    className="admin-select"
                    value={workflow.escalation}
                    onChange={(event) => {
                      setSaved(false);
                      setWorkflow((prev) => ({
                        ...prev,
                        escalation: event.target.value as ConciergeEscalation,
                      }));
                    }}
                  >
                    {ESCALATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                {workflow.escalation !== "None" ? (
                  <p className="admin-concierge-escalation__note">
                    {workflow.escalation} is assigned for this member.
                  </p>
                ) : null}
              </div>

              <div className="admin-concierge-form__actions">
                <button
                  type="button"
                  className="admin-btn admin-dash-btn"
                  onClick={handleSave}
                >
                  Save Concierge Update
                </button>
                {saved ? (
                  <p className="admin-concierge-saved" role="status">
                    Concierge information updated.
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="admin-detail-card">
            <h3 className="admin-detail-card__title">Data Quality</h3>
            {member.dataQualityIssues.length === 0 ? (
              <p className="admin-concierge-empty">No known data quality issues</p>
            ) : (
              <div className="admin-concierge-tags">
                {member.dataQualityIssues.map((issue) => (
                  <span
                    key={issue}
                    className="admin-concierge-tag admin-concierge-tag--issue"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="admin-concierge-summary-card">
      <span className="admin-detail-label">{label}</span>
      <div className="admin-concierge-summary-card__value">{value}</div>
      {hint ? <p className="admin-concierge-summary-card__hint">{hint}</p> : null}
    </div>
  );
}

function LastEventAttended({
  resolved,
  hasEverAttended,
  name,
  date,
  fallback,
}: {
  resolved: boolean;
  hasEverAttended: boolean;
  name?: string;
  date?: string;
  fallback: string;
}) {
  if (!resolved || !hasEverAttended) return "—";
  if (name || date) {
    return (
      <>
        {name ? <div>{name}</div> : null}
        {date ? <div>{date}</div> : null}
      </>
    );
  }
  if (!fallback || fallback === "—") return "—";
  return (
    <>
      {fallback.split("\n").map((line) => (
        <div key={line}>{line}</div>
      ))}
    </>
  );
}
