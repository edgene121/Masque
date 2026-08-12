/**
 * Forward-only Vetting Status transitions for Admin review.
 * Values match Airtable "Vetting Status" (lowercase for comparison).
 */

export const VETTING_STATUS_APPLICATION_RECEIVED = "application received";
export const VETTING_STATUS_PENDING = "pending";
export const VETTING_STATUS_UNDER_REVIEW = "under review";
export const VETTING_STATUS_HOLD = "hold";
export const VETTING_STATUS_APPROVED = "approved";
export const VETTING_STATUS_REJECTED = "rejected";
export const VETTING_STATUS_BANNED = "banned";

/** Final statuses — no further review transitions. */
export const FINAL_VETTING_STATUSES = [
  VETTING_STATUS_APPROVED,
  VETTING_STATUS_REJECTED,
  VETTING_STATUS_BANNED,
] as const;

/**
 * Allowed next statuses from each current status.
 * Application Received → Pending → Under Review → Hold / Approved / Rejected / Banned
 * Hold may resume to Under Review.
 */
export const VETTING_TRANSITIONS: Record<string, readonly string[]> = {
  [VETTING_STATUS_APPLICATION_RECEIVED]: [VETTING_STATUS_PENDING],
  [VETTING_STATUS_PENDING]: [
    VETTING_STATUS_UNDER_REVIEW,
    VETTING_STATUS_HOLD,
    VETTING_STATUS_APPROVED,
    VETTING_STATUS_REJECTED,
    VETTING_STATUS_BANNED,
  ],
  [VETTING_STATUS_UNDER_REVIEW]: [
    VETTING_STATUS_HOLD,
    VETTING_STATUS_APPROVED,
    VETTING_STATUS_REJECTED,
    VETTING_STATUS_BANNED,
  ],
  [VETTING_STATUS_HOLD]: [
    VETTING_STATUS_UNDER_REVIEW,
    VETTING_STATUS_APPROVED,
    VETTING_STATUS_REJECTED,
    VETTING_STATUS_BANNED,
  ],
  [VETTING_STATUS_APPROVED]: [],
  [VETTING_STATUS_REJECTED]: [],
  [VETTING_STATUS_BANNED]: [],
  "duplicate submission": [],
  "referral concern": [],
};

export type ReviewActionStatus =
  | typeof VETTING_STATUS_PENDING
  | typeof VETTING_STATUS_UNDER_REVIEW
  | typeof VETTING_STATUS_HOLD
  | typeof VETTING_STATUS_APPROVED
  | typeof VETTING_STATUS_REJECTED
  | typeof VETTING_STATUS_BANNED;

export function normalizeVettingStatus(status: string): string {
  return status.trim().toLowerCase();
}

export function isFinalVettingStatus(status: string): boolean {
  const key = normalizeVettingStatus(status);
  return (FINAL_VETTING_STATUSES as readonly string[]).includes(key);
}

export function getAllowedNextVettingStatuses(
  currentStatus: string,
): readonly string[] {
  const key = normalizeVettingStatus(currentStatus);
  return VETTING_TRANSITIONS[key] ?? [];
}

export function isValidVettingTransition(
  currentStatus: string,
  nextStatus: string,
): boolean {
  const from = normalizeVettingStatus(currentStatus);
  const to = normalizeVettingStatus(nextStatus);
  if (!from || !to || from === to) return false;
  return getAllowedNextVettingStatuses(from).includes(to);
}

export interface ReviewActionConfig {
  status: ReviewActionStatus;
  label: string;
  variant: "approve" | "reject" | "ban" | "secondary";
  requiresConfirm?: boolean;
}

const REVIEW_ACTION_CONFIG: ReviewActionConfig[] = [
  {
    status: VETTING_STATUS_APPROVED,
    label: "Approve",
    variant: "approve",
    requiresConfirm: true,
  },
  {
    status: VETTING_STATUS_REJECTED,
    label: "Reject",
    variant: "reject",
  },
  {
    status: VETTING_STATUS_BANNED,
    label: "Ban",
    variant: "ban",
  },
  {
    status: VETTING_STATUS_PENDING,
    label: "Set As Pending",
    variant: "secondary",
  },
  {
    status: VETTING_STATUS_UNDER_REVIEW,
    label: "Under Review",
    variant: "secondary",
  },
  {
    status: VETTING_STATUS_HOLD,
    label: "Hold",
    variant: "secondary",
  },
];

/** Actions valid for the current status, primary first then secondary. */
export function getReviewActionsForStatus(
  currentStatus: string,
): ReviewActionConfig[] {
  const allowed = new Set(getAllowedNextVettingStatuses(currentStatus));
  return REVIEW_ACTION_CONFIG.filter((action) => allowed.has(action.status));
}
