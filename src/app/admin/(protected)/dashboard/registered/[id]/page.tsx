import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AdminPageLoader from "@/components/admin/AdminPageLoader";
import AdminShell from "@/components/admin/AdminShell";
import RegisteredMemberWorkspace from "@/components/admin/RegisteredMemberWorkspace";
import { requireAdmin } from "@/lib/admin/auth";
import { getMemberByPeopleRecordId } from "@/lib/admin/recently-approved";
import type { AdminSessionPayload } from "@/types/admin";

interface RegisteredMemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: RegisteredMemberDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const member = await getMemberByPeopleRecordId(id);

  return {
    title: member
      ? `${member.name} | Registered Members | Masqué Admin`
      : "Registered Member Detail | Masqué Admin",
    description: member
      ? `Registered member detail for ${member.name}.`
      : "Registered member detail.",
  };
}

export default async function RegisteredMemberDetailPage({
  params,
}: RegisteredMemberDetailPageProps) {
  const admin = await requireAdmin();
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <AdminShell
          admin={admin}
          title="Registered Member Detail"
          description="Member record detail."
        >
          <AdminPageLoader />
        </AdminShell>
      }
    >
      <RegisteredMemberDetailLoaded admin={admin} id={id} />
    </Suspense>
  );
}

async function RegisteredMemberDetailLoaded({
  admin,
  id,
}: {
  admin: AdminSessionPayload;
  id: string;
}) {
  const member = await getMemberByPeopleRecordId(id);

  if (!member) {
    return (
      <AdminShell
        admin={admin}
        title="Registered Member Detail"
        description="Member record not found."
      >
        <section className="admin-card admin-detail-missing">
          <p className="admin-card__body">Member record not found.</p>
          <p style={{ marginTop: "20px" }}>
            <Link
              href="/admin/dashboard/registered"
              className="admin-table-action"
            >
              Back to Registered Members
            </Link>
          </p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      admin={admin}
      title="Registered Member Detail"
      description={`${member.name} · Member since ${member.approvalDate || "—"}`}
    >
      <RegisteredMemberWorkspace member={member} />
    </AdminShell>
  );
}
