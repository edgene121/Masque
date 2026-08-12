import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import { listApplications } from "@/lib/admin/applications";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Members | Masqué Admin",
  description: "Manage Masqué Members and Review Account Information.",
};

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const result = await listApplications();

  return (
    <AdminShell
      admin={admin}
      title="Members"
      description="Manage Masqué Members and Review Account Information."
    >
      <AdminUsersTable
        rows={result.ok ? result.records : []}
        loadError={result.ok ? null : result.error}
      />
    </AdminShell>
  );
}
