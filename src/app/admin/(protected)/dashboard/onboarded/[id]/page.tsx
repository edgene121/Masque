import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AdminPageLoader from "@/components/admin/AdminPageLoader";
import AdminShell from "@/components/admin/AdminShell";
import OnboardedMemberWorkspace from "@/components/admin/OnboardedMemberWorkspace";
import { requireAdmin } from "@/lib/admin/auth";
import { getOnboardedMemberByPeopleRecordId } from "@/lib/admin/onboarded-members";
import type { AdminSessionPayload } from "@/types/admin";

interface OnboardedMemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: OnboardedMemberDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const member = await getOnboardedMemberByPeopleRecordId(id);

  return {
    title: member
      ? `${member.name} | Onboarded Members | Masqué Admin`
      : "Onboarded Member Detail | Masqué Admin",
    description: member
      ? `Onboarded member detail for ${member.name}.`
      : "Onboarded member detail.",
  };
}

export default async function OnboardedMemberDetailPage({
  params,
}: OnboardedMemberDetailPageProps) {
  const admin = await requireAdmin();
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <AdminShell
          admin={admin}
          title="Onboarded Member Detail"
          description="Member record detail."
        >
          <AdminPageLoader />
        </AdminShell>
      }
    >
      <OnboardedMemberDetailLoaded admin={admin} id={id} />
    </Suspense>
  );
}

async function OnboardedMemberDetailLoaded({
  admin,
  id,
}: {
  admin: AdminSessionPayload;
  id: string;
}) {
  const member = await getOnboardedMemberByPeopleRecordId(id);

  if (!member) {
    return (
      <AdminShell
        admin={admin}
        title="Onboarded Member Detail"
        description="Member record not found."
      >
        <section className="admin-card admin-detail-missing">
          <p className="admin-card__body">Member record not found.</p>
          <p style={{ marginTop: "20px" }}>
            <Link
              href="/admin/dashboard/onboarded"
              className="admin-table-action"
            >
              Back to Onboarded Members
            </Link>
          </p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      admin={admin}
      title="Onboarded Member Detail"
      description={`${member.name} · Onboarding Completed`}
    >
      <OnboardedMemberWorkspace member={member} />
    </AdminShell>
  );
}
