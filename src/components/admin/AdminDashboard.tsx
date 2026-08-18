"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CalendarOff,
  ClipboardList,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import {
  MOCK_ADMIN_DASHBOARD_DATA,
  type RecentlyApprovedMember,
} from "@/types/admin-dashboard";
import { DASHBOARD_SEGMENT_CONFIG } from "@/lib/admin/dashboard-segments";
import DashboardMetricCard from "./DashboardMetricCard";
import IncompleteMembersTable from "./IncompleteMembersTable";
import MemberDetailDrawer from "./MemberDetailDrawer";
import MemberSegmentCard from "./MemberSegmentCard";
import RecentlyApprovedTable from "./RecentlyApprovedTable";

const METRICS = [
  {
    segmentId: "registered" as const,
    icon: Users,
    label: "Registered Members",
    supportingText: "Portal members",
    valueKey: "registered" as const,
  },
  {
    segmentId: "onboarded" as const,
    icon: UserCheck,
    label: "Onboarded",
    supportingText: "Completed onboarding",
    valueKey: "onboarded" as const,
  },
  {
    segmentId: "incomplete" as const,
    icon: ClipboardList,
    label: "Incomplete",
    supportingText: "Outstanding requirements",
    valueKey: "incomplete" as const,
  },
  {
    segmentId: "approvedLast60Days" as const,
    icon: BadgeCheck,
    label: "Approved Last 60 Days",
    supportingText: "Recently approved",
    valueKey: "approvedLast60Days" as const,
  },
  {
    segmentId: "neverAttended" as const,
    icon: CalendarOff,
    label: "Never Attended",
    supportingText: "No event attendance",
    valueKey: "neverAttended" as const,
  },
  {
    segmentId: "remaining" as const,
    icon: UsersRound,
    label: "Remaining Members",
    supportingText: "Existing active members",
    valueKey: "remaining" as const,
  },
];

const SEGMENTS = [
  {
    segmentId: "approvedLast60Days" as const,
    title: "Recently Approved",
    valueKey: "approvedLast60Days" as const,
    description: "Approved within the last 60 days",
  },
  {
    segmentId: "neverAttended" as const,
    title: "Never Attended",
    valueKey: "neverAttended" as const,
    description: "Approved members with no event attendance",
  },
  {
    segmentId: "remaining" as const,
    title: "Remaining Members",
    valueKey: "remaining" as const,
    description: "Existing active member segment",
  },
];

export default function AdminDashboard() {
  const data = MOCK_ADMIN_DASHBOARD_DATA;
  const [detailMember, setDetailMember] =
    useState<RecentlyApprovedMember | null>(null);

  return (
    <div className="admin-dashboard">
      {/* Future: Admin ↔ Member Messages — do not build chat UI yet. */}
      <div className="admin-dashboard__content">
        <div className="admin-dash-kpi-grid">
          {METRICS.map((metric) => (
            <DashboardMetricCard
              key={metric.segmentId}
              href={DASHBOARD_SEGMENT_CONFIG[metric.segmentId].href}
              icon={metric.icon}
              label={metric.label}
              value={data[metric.valueKey]}
              supportingText={metric.supportingText}
            />
          ))}
        </div>

        <IncompleteMembersTable members={data.incompleteMembers} />

        <section className="admin-dash-segments-section">
          <div className="admin-dash-section-intro">
            <h2 className="admin-dash-section-title">Member Segments</h2>
          </div>
          <div className="admin-dash-segments">
            {SEGMENTS.map((segment) => (
              <MemberSegmentCard
                key={segment.segmentId}
                href={DASHBOARD_SEGMENT_CONFIG[segment.segmentId].href}
                title={segment.title}
                count={data[segment.valueKey]}
                description={segment.description}
              />
            ))}
          </div>
        </section>

        <RecentlyApprovedTable
          members={data.recentlyApprovedMembers}
          onView={setDetailMember}
        />
      </div>

      <MemberDetailDrawer
        member={detailMember}
        onClose={() => setDetailMember(null)}
      />
    </div>
  );
}
