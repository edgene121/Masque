import type { Metadata } from "next";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "User Detail | Masqué Admin",
  description: "Application detail.",
};

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const admin = await requireAdmin();
  const { id } = await params;

  return (
    <AdminShell
      admin={admin}
      title="User Detail"
      description="Application record detail."
    >
      <section className="admin-card" style={{ padding: "20px" }}>
        <p className="admin-card__body">
          Application ID: <strong>{id}</strong>
        </p>
        <p className="admin-card__body" style={{ marginTop: "12px" }}>
          Full applicant detail will be connected in a later step.
        </p>
        <p style={{ marginTop: "20px" }}>
          <Link href="/admin/users" className="admin-table-action">
            Back to Users
          </Link>
        </p>
      </section>
    </AdminShell>
  );
}
