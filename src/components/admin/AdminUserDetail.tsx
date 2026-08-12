"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  AdminApplicationDetail,
  AdminDetailField,
} from "@/types/admin-users";
import { toTitleCaseLabel } from "@/lib/admin/format-label";
import {
  getReviewActionsForStatus,
  isFinalVettingStatus,
  type ReviewActionStatus,
} from "@/lib/admin/vetting-transitions";

interface AdminUserDetailProps {
  detail: AdminApplicationDetail;
}

function displayOrDash(value: string): string {
  const trimmed = value.trim();
  return trimmed || "—";
}

function displayStatusLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "—";
  return toTitleCaseLabel(trimmed);
}

function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
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
    case "banned":
      return "is-banned";
    case "hold":
    case "duplicate submission":
    case "referral concern":
      return "is-vetting-amber";
    default:
      return key ? "is-neutral" : "";
  }
}

function actionButtonClass(
  variant: "approve" | "reject" | "ban" | "secondary",
): string {
  switch (variant) {
    case "approve":
      return "admin-btn admin-btn--approve";
    case "reject":
      return "admin-btn admin-btn--reject";
    case "ban":
      return "admin-btn admin-btn--ban";
    default:
      return "admin-btn admin-btn--secondary";
  }
}

function FieldGrid({ fields }: { fields: AdminDetailField[] }) {
  if (fields.length === 0) {
    return <p className="admin-detail-empty">No Data In This Section.</p>;
  }

  return (
    <dl className="admin-detail-grid">
      {fields.map((field) => (
        <div key={`${field.label}:${field.value}`} className="admin-detail-field">
          <dt>{field.label}</dt>
          <dd>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AdminUserDetail({ detail }: AdminUserDetailProps) {
  const router = useRouter();
  const [vettingStatus, setVettingStatus] = useState(detail.vettingStatus);
  const [hasGovernmentId, setHasGovernmentId] = useState(
    Boolean(detail.governmentId),
  );
  const [governmentId, setGovernmentId] = useState(detail.governmentId);
  const [savingAction, setSavingAction] = useState<ReviewActionStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);

  useEffect(() => {
    setVettingStatus(detail.vettingStatus);
    setHasGovernmentId(Boolean(detail.governmentId));
    setGovernmentId(detail.governmentId);
    setConfirmApprove(false);
  }, [detail]);

  const govIdSrc = useMemo(
    () => `/api/admin/users/${encodeURIComponent(detail.id)}/government-id`,
    [detail.id],
  );

  const allowedActions = useMemo(
    () => getReviewActionsForStatus(vettingStatus),
    [vettingStatus],
  );
  const primaryActions = allowedActions.filter(
    (action) => action.variant !== "secondary",
  );
  const secondaryActions = allowedActions.filter(
    (action) => action.variant === "secondary",
  );
  const statusIsFinal = isFinalVettingStatus(vettingStatus);
  const isSaving = savingAction !== null;

  const runStatusUpdate = async (status: ReviewActionStatus) => {
    if (isSaving) return;

    setSavingAction(status);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(detail.id)}/vetting-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );

      const data = (await response.json().catch(() => null)) as {
        record?: { vettingStatus?: string };
        error?: string;
      } | null;

      if (!response.ok || !data?.record) {
        setError(
          data?.error ||
            "Unable to update this application. Please try again.",
        );
        return;
      }

      const nextStatus = data.record.vettingStatus || status;
      setVettingStatus(nextStatus);

      if (status === "approved") {
        setHasGovernmentId(false);
        setGovernmentId(null);
      }

      setConfirmApprove(false);
      router.refresh();
    } catch {
      setError("Unable to update this application. Please try again.");
    } finally {
      setSavingAction(null);
    }
  };

  const savingLabel = (status: ReviewActionStatus, idle: string) => {
    if (savingAction !== status) return idle;
    if (status === "approved") return "Approving…";
    if (status === "rejected") return "Rejecting…";
    if (status === "banned") return "Banning…";
    return "Saving…";
  };

  return (
    <div className="admin-detail">
      <div className="admin-detail__top">
        <Link href="/admin/users" className="admin-table-action">
          Back to Members
        </Link>
      </div>

      <section className="admin-detail-card">
        <div className="admin-detail-card__header">
          <div>
            <h2 className="admin-detail-card__title">Member Information</h2>
            <p className="admin-detail-card__subtitle">
              Application ID: {detail.id}
            </p>
          </div>
          {vettingStatus ? (
            <span
              className={`admin-status-badge ${vettingBadgeClass(vettingStatus)}`}
            >
              {displayStatusLabel(vettingStatus)}
            </span>
          ) : null}
        </div>

        <div className="admin-detail-summary">
          <div>
            <span className="admin-detail-label">Name</span>
            <strong>{displayOrDash(detail.name)}</strong>
          </div>
          <div>
            <span className="admin-detail-label">Email</span>
            <strong>{displayOrDash(detail.email)}</strong>
          </div>
          <div>
            <span className="admin-detail-label">Phone</span>
            <strong>{displayOrDash(detail.phone)}</strong>
          </div>
          <div>
            <span className="admin-detail-label">Current Status</span>
            <strong>{displayStatusLabel(vettingStatus)}</strong>
          </div>
          <div>
            <span className="admin-detail-label">Member Status</span>
            <strong>{displayStatusLabel(detail.memberStatus)}</strong>
          </div>
          <div>
            <span className="admin-detail-label">Submitted</span>
            <strong>{displayOrDash(detail.submittedDisplay)}</strong>
          </div>
        </div>
      </section>

      <div className="admin-detail-columns">
        <section className="admin-detail-card">
          <h2 className="admin-detail-card__title">Personal Details</h2>
          <FieldGrid fields={detail.personal} />
        </section>

        <section className="admin-detail-card">
          <h2 className="admin-detail-card__title">Referral Information</h2>
          <FieldGrid fields={detail.referral} />
        </section>
      </div>

      <section className="admin-detail-card">
        <h2 className="admin-detail-card__title">Member Application</h2>
        <FieldGrid fields={detail.application} />
      </section>

      {detail.internal.length > 0 ? (
        <section className="admin-detail-card">
          <h2 className="admin-detail-card__title">Internal Notes</h2>
          <FieldGrid fields={detail.internal} />
        </section>
      ) : null}

      <section className="admin-detail-card">
        <h2 className="admin-detail-card__title">Government ID</h2>
        <p className="admin-detail-card__hint">
          Temporary document for review only. Cleared automatically on Approval.
        </p>

        {hasGovernmentId && governmentId ? (
          <div className="admin-gov-id">
            <div className="admin-gov-id__meta">
              <p>
                <span className="admin-detail-label">Filename</span>
                <strong>{governmentId.filename}</strong>
              </p>
              <p>
                <span className="admin-detail-label">Type</span>
                <strong>{governmentId.contentType || "—"}</strong>
              </p>
              {governmentId.size > 0 ? (
                <p>
                  <span className="admin-detail-label">Size</span>
                  <strong>{formatBytes(governmentId.size)}</strong>
                </p>
              ) : null}
            </div>

            {governmentId.isImage ? (
              // Preview via authenticated proxy (no Airtable URL in markup).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="admin-gov-id__preview"
                src={govIdSrc}
                alt="Government ID Preview"
              />
            ) : null}

            <div className="admin-gov-id__actions">
              <a
                className="admin-btn admin-btn--secondary"
                href={govIdSrc}
                target="_blank"
                rel="noreferrer"
              >
                {governmentId.isPdf ? "Open PDF" : "View Document"}
              </a>
            </div>
          </div>
        ) : (
          <p className="admin-detail-empty">No ID Document Uploaded</p>
        )}
      </section>

      <section className="admin-detail-card">
        <h2 className="admin-detail-card__title">Admin Review</h2>
        <p className="admin-detail-card__hint">
          Current Vetting Status:{" "}
          <strong>{displayStatusLabel(vettingStatus)}</strong>
        </p>

        {error ? <p className="admin-detail-error">{error}</p> : null}

        {confirmApprove ? (
          <div className="admin-confirm">
            <p className="admin-confirm__title">Approve This Member?</p>
            <p className="admin-confirm__body">
              Approval will set Vetting Status to Approved and permanently clear
              the temporary Government ID attachment from Airtable. The Member
              Application record will not be deleted.
            </p>
            <div className="admin-detail-actions">
              <button
                type="button"
                className="admin-btn admin-btn--approve"
                disabled={isSaving}
                onClick={() => void runStatusUpdate("approved")}
              >
                {savingLabel("approved", "Confirm Approve")}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                disabled={isSaving}
                onClick={() => setConfirmApprove(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : allowedActions.length === 0 ? (
          <p className="admin-detail-empty">
            {statusIsFinal
              ? "This status is final. No further review actions are available."
              : "No review actions are available for this status."}
          </p>
        ) : (
          <>
            {primaryActions.length > 0 ? (
              <div className="admin-detail-actions">
                {primaryActions.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    className={actionButtonClass(action.variant)}
                    disabled={isSaving}
                    onClick={() => {
                      setError(null);
                      if (action.requiresConfirm) {
                        setConfirmApprove(true);
                        return;
                      }
                      void runStatusUpdate(action.status);
                    }}
                  >
                    {savingLabel(action.status, action.label)}
                  </button>
                ))}
              </div>
            ) : null}

            {secondaryActions.length > 0 ? (
              <div
                className={`admin-detail-actions${primaryActions.length > 0 ? " admin-detail-actions--secondary" : ""}`}
              >
                {secondaryActions.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    className={actionButtonClass(action.variant)}
                    disabled={isSaving}
                    onClick={() => void runStatusUpdate(action.status)}
                  >
                    {savingLabel(action.status, action.label)}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
