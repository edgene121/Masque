export interface PeopleOutstandingSource {
  membershipStatus: string;
  onboardingState: string;
  complianceState: string;
  followUpRequired: boolean;
  hasGovId: boolean;
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

/**
 * Derives outstanding-item labels from People fields.
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

  return items;
}
