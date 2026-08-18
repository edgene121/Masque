import type { Metadata } from "next";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { getConciergeMemberById } from "@/lib/admin/mock-concierge-members";
import { requireAdmin } from "@/lib/admin/auth";

interface ConciergeMemberPlaceholderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ConciergeMemberPlaceholderPageProps): Promise<Metadata> {
  const { id } = await params;
  const member = getConciergeMemberById(id);

  return {
    title: member
      ? `${member.name} | Concierge | Masqué Admin`
      : "Concierge Member Detail | Masqué Admin",
    description: "Member detail workspace will be implemented next.",
  };
}

export default async function ConciergeMemberPlaceholderPage({
  params,
}: ConciergeMemberPlaceholderPageProps) {
  const admin = await requireAdmin();
  const { id } = await params;
  const member = getConciergeMemberById(id);

  return (
    <AdminShell
      admin={admin}
      title="Concierge Member Detail"
      description="Member detail workspace will be implemented next."
    >
      <section className="admin-card admin-detail-missing">
        <p className="admin-card__body">
          Member detail workspace will be implemented next.
        </p>
        {member ? (
          <p className="admin-card__body" style={{ marginTop: "10px" }}>
            {member.name}
          </p>
        ) : (
          <p className="admin-card__body" style={{ marginTop: "10px" }}>
            Member Not Found
          </p>
        )}
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
