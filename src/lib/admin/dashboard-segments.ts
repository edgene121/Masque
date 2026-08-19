import type { DashboardSegmentId } from "@/types/admin-dashboard";

export type DashboardSegmentSlug =
  | "registered"
  | "onboarded"
  | "incomplete"
  | "approved-last-60-days"
  | "never-attended"
  | "remaining";

export type SegmentExtraColumn =
  | "onboardingStatus"
  | "missingStep"
  | "reminderAction"
  | "eventsAttended"
  | "lastEventAttended";

export type SegmentStatusFilter = "membership" | "onboarding";

export interface DashboardSegmentConfig {
  slug: DashboardSegmentSlug;
  segment: DashboardSegmentId;
  href: string;
  title: string;
  description: string;
  extraColumns: SegmentExtraColumn[];
  statusFilter: SegmentStatusFilter;
}

export const DASHBOARD_SEGMENT_CONFIG: Record<
  DashboardSegmentId,
  DashboardSegmentConfig
> = {
  registered: {
    slug: "registered",
    segment: "registered",
    href: "/admin/dashboard/registered",
    title: "Registered Members",
    description:
      "All portal members with an active MemberStack-linked People record.",
    extraColumns: [],
    statusFilter: "membership",
  },
  onboarded: {
    slug: "onboarded",
    segment: "onboarded",
    href: "/admin/dashboard/onboarded",
    title: "Onboarded Members",
    description: "People whose Onboarding State is Completed.",
    extraColumns: [],
    statusFilter: "membership",
  },
  incomplete: {
    slug: "incomplete",
    segment: "incomplete",
    href: "/admin/dashboard/incomplete",
    title: "Incomplete Members",
    description: "Members who have outstanding onboarding requirements.",
    extraColumns: ["onboardingStatus", "missingStep", "reminderAction"],
    statusFilter: "onboarding",
  },
  approvedLast60Days: {
    slug: "approved-last-60-days",
    segment: "approvedLast60Days",
    href: "/admin/dashboard/approved-last-60-days",
    title: "Approved Last 60 Days",
    description: "Members approved within the last 60 days.",
    extraColumns: [],
    statusFilter: "membership",
  },
  neverAttended: {
    slug: "never-attended",
    segment: "neverAttended",
    href: "/admin/dashboard/never-attended",
    title: "Never Attended",
    description: "Approved members with no event attendance.",
    extraColumns: ["eventsAttended"],
    statusFilter: "membership",
  },
  remaining: {
    slug: "remaining",
    segment: "remaining",
    href: "/admin/dashboard/remaining",
    title: "Remaining Members",
    description: "Existing active member segment.",
    extraColumns: ["eventsAttended", "lastEventAttended"],
    statusFilter: "membership",
  },
};

const CONFIG_BY_SLUG = new Map(
  Object.values(DASHBOARD_SEGMENT_CONFIG).map((config) => [config.slug, config]),
);

export function getDashboardSegmentConfig(
  slug: string,
): DashboardSegmentConfig | null {
  return CONFIG_BY_SLUG.get(slug as DashboardSegmentSlug) ?? null;
}

export function isDashboardSegmentPath(path: string): boolean {
  if (path === "/admin/dashboard") return true;
  const slug = path.replace(/^\/admin\/dashboard\//, "");
  return slug !== path && CONFIG_BY_SLUG.has(slug as DashboardSegmentSlug);
}

export const DASHBOARD_SEGMENT_SLUGS = Object.values(
  DASHBOARD_SEGMENT_CONFIG,
).map((config) => config.slug);
