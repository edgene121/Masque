import type { ConciergeDataQualityIssue } from "@/types/admin-concierge";

export interface PeopleOutstandingSource {
  membershipStatus: string;
  onboardingState: string;
  complianceState: string;
  followUpRequired: boolean;
  hasGovId: boolean;
  escalation?: string;
  verificationMethod?: string;
  idVerified?: boolean;
  memberAgreementStatus?: string;
  portalAccountCreated?: boolean;
  lastPortalLogin?: string;
  /** null when Bertha lookup is unresolved; do not invent a Bertha item. */
  berthaTicketPurchased?: boolean | null;
  hasDataQualityIssues?: boolean;
}

export interface PeopleDataQualitySource {
  email: string;
  phone: string;
  instagramHandle: string;
  duplicateFlag: boolean;
}

function normalizeStatus(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCompletedState(value: string): boolean {
  const normalized = normalizeStatus(value);
  return normalized === "complete" || normalized === "completed";
}

function isPendingState(value: string): boolean {
  return normalizeStatus(value) === "pending";
}

function isApprovedMember(value: string): boolean {
  return normalizeStatus(value) === "approved member";
}

function addUnique(items: string[], label: string) {
  if (!label || items.includes(label)) return;
  items.push(label);
}

function onboardingOutstandingLabel(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (isCompletedState(trimmed)) return null;

  const normalized = normalizeStatus(trimmed);
  if (normalized === "not started") return "Onboarding Not Started";
  if (normalized === "in progress") return "Onboarding In Progress";
  if (normalized === "submitted") return "Onboarding Submitted";
  return `Onboarding: ${trimmed}`;
}

function complianceOutstandingLabel(complianceState: string): string | null {
  const trimmed = complianceState.trim();
  if (!trimmed || isCompletedState(trimmed)) return null;

  const normalized = normalizeStatus(trimmed);
  if (normalized === "id submitted") return "ID Review";
  if (normalized === "agreement pending") return "Agreement Pending";
  if (normalized === "review required") return "Review Required";
  if (normalized === "restriction hold") return "Restriction Hold";
  return null;
}

function escalationOutstandingLabel(escalation: string): string | null {
  const trimmed = escalation.trim();
  if (!trimmed || normalizeStatus(trimmed) === "none") return null;
  if (trimmed === "Concierge Follow-up") return "Concierge Follow-up";
  if (trimmed === "Operations Follow-up") return "Operations Follow-up";
  if (trimmed === "Founder Follow-up") return "Founder Follow-up";
  return null;
}

function isVerificationComplete(source: PeopleOutstandingSource): boolean {
  if (source.idVerified) return true;
  return Boolean(source.verificationMethod?.trim());
}

/**
 * Known People data-quality issues from existing Airtable rules.
 * Does not invent hygiene checks beyond Duplicate Flag / Email / Phone / Instagram.
 */
export function deriveDataQualityIssues(
  source: PeopleDataQualitySource,
): ConciergeDataQualityIssue[] {
  const items: ConciergeDataQualityIssue[] = [];
  if (source.duplicateFlag) addUnique(items, "Duplicate Record");
  if (!source.email.trim()) addUnique(items, "Missing Email");
  if (!source.phone.trim()) addUnique(items, "Missing Phone");
  if (!source.instagramHandle.trim()) addUnique(items, "Missing Instagram");
  return items;
}

/**
 * Derives outstanding-item labels from People fields plus resolved Bertha.
 * Follow-Up Required is only added from the explicit checkbox.
 */
export function deriveOutstandingItems(
  source: PeopleOutstandingSource,
): string[] {
  const items: string[] = [];

  if (source.followUpRequired) {
    addUnique(items, "Follow-Up Required");
  }

  if (
    source.hasGovId &&
    isPendingState(source.complianceState) &&
    isApprovedMember(source.membershipStatus)
  ) {
    addUnique(items, "ID Pending Review");
  }

  const complianceItem = complianceOutstandingLabel(source.complianceState);
  if (complianceItem) addUnique(items, complianceItem);

  const onboardingItem = onboardingOutstandingLabel(source.onboardingState);
  if (onboardingItem) addUnique(items, onboardingItem);

  const escalationItem = escalationOutstandingLabel(source.escalation ?? "");
  if (escalationItem) addUnique(items, escalationItem);

  if (!isVerificationComplete(source)) {
    addUnique(items, "Verification");
  }

  if (normalizeStatus(source.memberAgreementStatus ?? "") === "missing") {
    addUnique(items, "Member Agreement");
  }

  if (source.portalAccountCreated && !source.lastPortalLogin?.trim()) {
    addUnique(items, "Portal Login");
  }

  if (source.berthaTicketPurchased === false) {
    addUnique(items, "Bertha");
  }

  if (source.hasDataQualityIssues) {
    addUnique(items, "Data Quality Issue");
  }

  return items;
}
