import type { ConciergeAttendance, ConciergeBertha, ConciergeMember } from "@/types/admin-concierge";
import {
  conciergeAttendanceLabel,
  conciergeBerthaLabel,
  isConciergeFieldResolved,
} from "@/lib/admin/mock-concierge-members";

export function peopleOnboardingState(member: ConciergeMember): string | null {
  const value = member.onboardingState?.trim() ?? "";
  return value || null;
}

export function peopleConciergeStatus(member: ConciergeMember): string | null {
  const value = member.peopleConciergeStatus?.trim() ?? "";
  return value || null;
}

export function peopleComplianceState(member: ConciergeMember): string | null {
  const value = member.complianceState?.trim() ?? "";
  return value || null;
}

export function peopleEscalation(member: ConciergeMember): string | null {
  const value = member.peopleEscalation?.trim() ?? "";
  return value || null;
}

export function memberAttendanceLabel(member: ConciergeMember): string | null {
  if (!isConciergeFieldResolved(member, "attendance")) return null;
  return conciergeAttendanceLabel(member);
}

export function memberBerthaLabel(member: ConciergeMember): string | null {
  if (!isConciergeFieldResolved(member, "bertha")) return null;
  return conciergeBerthaLabel(member);
}

export function attendanceBadgeClass(value: ConciergeAttendance | string): string {
  return value === "Attended" ? "is-approved" : "is-vetting-amber";
}

export function berthaBadgeClass(value: ConciergeBertha | string): string {
  return value === "Purchased" ? "is-approved" : "is-neutral";
}

export function onboardingBadgeClass(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "completed" || normalized === "complete") {
    return "is-approved";
  }
  if (normalized === "in progress") return "is-vetting-amber";
  if (normalized === "not started") return "is-neutral";
  return "is-member-subtle";
}

export function conciergeStatusBadgeClass(value: string): string {
  switch (value) {
    case "Welcome Completed":
      return "is-approved";
    case "Conversation Active":
      return "is-vetting-blue";
    case "Follow-up Needed":
      return "is-vetting-amber";
    case "Do Not Contact":
      return "is-rejected";
    case "Deferred":
      return "is-member-subtle";
    default:
      return "is-neutral";
  }
}

export function complianceStateBadgeClass(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "complete" || normalized === "completed") {
    return "is-approved";
  }
  if (normalized === "pending" || normalized === "id submitted") {
    return "is-vetting-blue";
  }
  if (normalized === "agreement pending") return "is-vetting-amber";
  if (normalized === "review required") return "is-vetting-amber";
  if (normalized === "restriction hold") return "is-rejected";
  return "is-neutral";
}

export function outstandingItemClass(item: string): string {
  const normalized = item.trim().toLowerCase();
  if (normalized === "follow-up required") return "admin-concierge-tag--warning";
  if (normalized === "id pending review" || normalized === "id review") {
    return "admin-concierge-tag--info";
  }
  if (normalized === "agreement pending") return "admin-concierge-tag--amber";
  if (normalized === "review required") return "admin-concierge-tag--warning";
  if (normalized === "restriction hold") return "admin-concierge-tag--danger";
  if (normalized.startsWith("onboarding")) return "admin-concierge-tag--info";
  if (normalized === "concierge follow-up") return "admin-concierge-tag--warning";
  if (normalized === "operations follow-up") return "admin-concierge-tag--amber";
  if (normalized === "founder follow-up") return "admin-concierge-tag--danger";
  if (normalized === "verification") return "admin-concierge-tag--info";
  if (normalized === "member agreement") return "admin-concierge-tag--amber";
  if (normalized === "portal login") return "admin-concierge-tag--warning";
  if (normalized === "bertha") return "admin-concierge-tag--amber";
  if (normalized === "data quality issue") return "admin-concierge-tag--warning";
  if (
    normalized === "duplicate record" ||
    normalized === "missing email" ||
    normalized === "missing phone" ||
    normalized === "missing instagram"
  ) {
    return "admin-concierge-tag--warning";
  }
  return "";
}

export function displayDash(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed || "—";
}

export function displayYesNo(value: boolean): "Yes" | "No" {
  return value ? "Yes" : "No";
}

export function yesNoBadgeClass(value: "Yes" | "No" | string): string {
  return value === "Yes" ? "is-approved" : "is-neutral";
}
