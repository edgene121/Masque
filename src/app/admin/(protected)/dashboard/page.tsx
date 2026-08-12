import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Dashboard | Masqué Admin",
  description: "Masqué Admin Portal dashboard.",
};

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell
      admin={admin}
      title="Dashboard"
      description="Overview Of Administrative Operations."
    >
      <section className="admin-card">
        <h2 className="admin-card__heading">Welcome, {admin.name}</h2>
        <p className="admin-card__body">
          Use the Members section to review Member accounts. Additional Admin
          tools will appear here as the onboarding workflow is finalized.
        </p>
      </section>
    </AdminShell>
  );
}
