"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import type { DashboardSegmentId } from "@/types/admin-dashboard";

interface DashboardMetricCardProps {
  segmentId: DashboardSegmentId;
  icon: LucideIcon;
  label: string;
  value: number;
  supportingText: string;
  selected: boolean;
  onSelect: (segmentId: DashboardSegmentId) => void;
}

function formatMetric(value: number): string {
  return value.toLocaleString("en-US");
}

export default function DashboardMetricCard({
  segmentId,
  icon: Icon,
  label,
  value,
  supportingText,
  selected,
  onSelect,
}: DashboardMetricCardProps) {
  return (
    <button
      type="button"
      className={`admin-dash-kpi${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      onClick={() => onSelect(segmentId)}
    >
      <div className="admin-dash-kpi__body">
        <span className="admin-dash-kpi__icon" aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        <span className="admin-dash-kpi__label">{label}</span>
        <span className="admin-dash-kpi__value">{formatMetric(value)}</span>
        <span className="admin-dash-kpi__hint">{supportingText}</span>
      </div>
      <ChevronRight className="admin-dash-kpi__chevron" aria-hidden="true" />
    </button>
  );
}
