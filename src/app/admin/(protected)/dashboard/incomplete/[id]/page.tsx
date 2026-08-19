import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AdminPageLoader from "@/components/admin/AdminPageLoader";
import AdminShell from "@/components/admin/AdminShell";
import IncompleteMemberWorkspace from "@/components/admin/IncompleteMemberWorkspace";
import { requireAdmin } from "@/lib/admin/auth";
import { getIncompleteMemberByPeopleRecordId } from "@/lib/admin/incomplete-members";
import type { AdminSessionPayload } from "@/types/admin";

interface IncompleteMemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: IncompleteMemberDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const member = await getIncompleteMemberByPeopleRecordId(id);

  return {
    title: member
      ? `${member.name} | Incomplete Members | Masqué Admin`
      : "Incomplete Member Detail | Masqué Admin",
    description: member
      ? `Incomplete member detail for ${member.name}.`
      : "Incomplete member detail.",
  };
}

export default async function IncompleteMemberDetailPage({
  params,
}: IncompleteMemberDetailPageProps) {
  const admin = await requireAdmin();
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <AdminShell
          admin={admin}
          title="Incomplete Member Detail"
          description="Member record detail."
        >
          <AdminPageLoader />
        </AdminShell>
      }
    >
      <IncompleteMemberDetailLoaded admin={admin} id={id} />
    </Suspense>
  );
}

async function IncompleteMemberDetailLoaded({
  admin,
  id,
}: {
  admin: AdminSessionPayload;
  id: string;
}) {
  const member = await getIncompleteMemberByPeopleRecordId(id);

  if (!member) {
    return (
      <AdminShell
        admin={admin}
        title="Incomplete Member Detail"
        description="Member record not found."
      >
        <section className="admin-card admin-detail-missing">
          <p className="admin-card__body">Member Not Found</p>
          <p style={{ marginTop: "20px" }}>
            <Link
              href="/admin/dashboard/incomplete"
              className="admin-table-action"
            >
              Back to Incomplete Members
            </Link>
          </p>
        </section>
      </AdminShell>
    );
  }

  const onboardingState = member.onboardingState?.trim() || "Incomplete";

  return (
    <AdminShell
      admin={admin}
      title="Incomplete Member Detail"
      description={`${member.name} · ${onboardingState}`}
    >
      <IncompleteMemberWorkspace member={member} />
    </AdminShell>
  );
}
