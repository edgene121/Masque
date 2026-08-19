import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AdminMemberSegmentList from "@/components/admin/AdminMemberSegmentList";
import AdminPageLoader from "@/components/admin/AdminPageLoader";
import AdminShell from "@/components/admin/AdminShell";
import RegisteredMembersList from "@/components/admin/RegisteredMembersList";
import OnboardedMembersList from "@/components/admin/OnboardedMembersList";
import {
  DASHBOARD_SEGMENT_SLUGS,
  getDashboardSegmentConfig,
} from "@/lib/admin/dashboard-segments";
import { requireAdmin } from "@/lib/admin/auth";
import { listOnboardedMembers } from "@/lib/admin/onboarded-members";
import { listRegisteredMembers } from "@/lib/admin/registered-members";

interface DashboardSegmentPageProps {
  params: Promise<{ segment: string }>;
}

export const dynamic = "force-dynamic";

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
      {config.segment === "registered" ? (
        <Suspense fallback={<AdminPageLoader />}>
          <RegisteredMembersFromAirtable
            title={config.title}
            description={config.description}
          />
        </Suspense>
      ) : config.segment === "onboarded" ? (
        <Suspense fallback={<AdminPageLoader />}>
          <OnboardedMembersFromAirtable
            title={config.title}
            description={config.description}
          />
        </Suspense>
      ) : (
        <AdminMemberSegmentList
          segment={config.segment}
          title={config.title}
          description={config.description}
        />
      )}
    </AdminShell>
  );
}

async function RegisteredMembersFromAirtable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const result = await listRegisteredMembers();

  return (
    <RegisteredMembersList
      title={title}
      description={description}
      members={result.ok ? result.members : []}
      loadError={result.ok ? null : result.error}
    />
  );
}

async function OnboardedMembersFromAirtable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const result = await listOnboardedMembers();

  return (
    <OnboardedMembersList
      title={title}
      description={description}
      members={result.ok ? result.members : []}
      loadError={result.ok ? null : result.error}
    />
  );
}
