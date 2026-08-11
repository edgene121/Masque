import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import { listApplications } from "@/lib/admin/applications";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Users | Masqué Admin",
  description: "Manage Masqué members and review account information.",
};

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const result = await listApplications();

  return (
    <AdminShell
      admin={admin}
      title="Users"
      description="Manage Masqué members and review account information."
    >
      <AdminUsersTable
        rows={result.ok ? result.records : []}
        loadError={result.ok ? null : result.error}
      />
    </AdminShell>
  );
}
