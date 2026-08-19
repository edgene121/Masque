"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface DashboardMetricCardProps {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number | null;
  supportingText: string;
}

function formatMetric(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

export default function DashboardMetricCard({
  href,
  icon: Icon,
  label,
  value,
  supportingText,
}: DashboardMetricCardProps) {
  return (
    <Link href={href} className="admin-dash-kpi">
      <div className="admin-dash-kpi__body">
        <span className="admin-dash-kpi__icon" aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        <span className="admin-dash-kpi__label">{label}</span>
        <span className="admin-dash-kpi__value">{formatMetric(value)}</span>
        <span className="admin-dash-kpi__hint">{supportingText}</span>
      </div>
      <ChevronRight className="admin-dash-kpi__chevron" aria-hidden="true" />
    </Link>
  );
}
