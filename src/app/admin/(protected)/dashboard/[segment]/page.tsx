import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminMemberSegmentList from "@/components/admin/AdminMemberSegmentList";
import AdminShell from "@/components/admin/AdminShell";
import {
  DASHBOARD_SEGMENT_SLUGS,
  getDashboardSegmentConfig,
} from "@/lib/admin/dashboard-segments";
import { requireAdmin } from "@/lib/admin/auth";

interface DashboardSegmentPageProps {
  params: Promise<{ segment: string }>;
}

export function generateStaticParams() {
  return DASHBOARD_SEGMENT_SLUGS.map((segment) => ({ segment }));
}

export async function generateMetadata({
  params,
}: DashboardSegmentPageProps): Promise<Metadata> {
  const { segment } = await params;
  const config = getDashboardSegmentConfig(segment);

  if (!config) {
    return { title: "Dashboard | Masqué Admin" };
  }

  return {
    title: `${config.title} | Masqué Admin`,
    description: config.description,
  };
}

export default async function DashboardSegmentPage({
  params,
}: DashboardSegmentPageProps) {
  const admin = await requireAdmin();
  const { segment } = await params;
  const config = getDashboardSegmentConfig(segment);

  if (!config) {
    notFound();
  }

  return (
    <AdminShell
      admin={admin}
      title={config.title}
      description={config.description}
    >
      <AdminMemberSegmentList
        segment={config.segment}
        title={config.title}
        description={config.description}
      />
    </AdminShell>
  );
}
