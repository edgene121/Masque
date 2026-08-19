import type { Metadata } from "next";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import ConciergeMemberWorkspace from "@/components/admin/ConciergeMemberWorkspace";
import { getConciergeMemberByPeopleId } from "@/lib/admin/recently-approved";
import { requireAdmin } from "@/lib/admin/auth";

interface ConciergeMemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ConciergeMemberDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const member = await getConciergeMemberByPeopleId(id);

  return {
    title: member
      ? `${member.name} | Concierge | Masqué Admin`
      : "Concierge Member Detail | Masqué Admin",
    description: member
      ? `Concierge workspace for ${member.name}.`
      : "Concierge member detail workspace.",
  };
}

export default async function ConciergeMemberDetailPage({
  params,
}: ConciergeMemberDetailPageProps) {
  const admin = await requireAdmin();
  const { id } = await params;
  const member = await getConciergeMemberByPeopleId(id);

  if (!member) {
    return (
      <AdminShell
        admin={admin}
        title="Concierge Member Detail"
        description="Member record not found."
      >
        <section className="admin-card admin-detail-missing">
          <p className="admin-card__body">Member Not Found</p>
          <p style={{ marginTop: "20px" }}>
            <Link
              href="/admin/concierge/recently-approved"
              className="admin-table-action"
            >
              Back to Recently Approved
            </Link>
          </p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      admin={admin}
      title="Concierge Member Detail"
      description={`${member.name} · Member since ${member.approvalDate}`}
    >
      <ConciergeMemberWorkspace member={member} />
    </AdminShell>
  );
}
