"use client";

import type { DashboardSegmentId } from "@/types/admin-dashboard";

interface MemberSegmentCardProps {
  segmentId: DashboardSegmentId;
  title: string;
  count: number;
  description: string;
  selected: boolean;
  onSelect: (segmentId: DashboardSegmentId) => void;
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export default function MemberSegmentCard({
  segmentId,
  title,
  count,
  description,
  selected,
  onSelect,
}: MemberSegmentCardProps) {
  return (
    <button
      type="button"
      className={`admin-dash-segment${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      onClick={() => onSelect(segmentId)}
    >
      <span className="admin-dash-segment__title">{title}</span>
      <span className="admin-dash-segment__count">
        {formatCount(count)} Members
      </span>
      <span className="admin-dash-segment__hint">{description}</span>
    </button>
  );
}
