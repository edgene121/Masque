import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";
import { countOnboardedMembers } from "@/lib/admin/onboarded-members";
import { countRegisteredMembers } from "@/lib/admin/registered-members";
import { listRecentlyApprovedMembers } from "@/lib/admin/recently-approved";

export const metadata: Metadata = {
  title: "Dashboard | Masqué Admin",
  description: "Masqué Admin Portal dashboard.",
};

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const [recentlyApproved, registeredMembers, onboardedMembers] =
    await Promise.all([
      listRecentlyApprovedMembers(),
      countRegisteredMembers(),
      countOnboardedMembers(),
    ]);

  return (
    <AdminShell
      admin={admin}
      title="Dashboard"
      description="Overview Of Administrative Operations."
    >
      <AdminDashboard
        registeredMembersCount={
          registeredMembers.ok ? registeredMembers.count : null
        }
        onboardedMembersCount={
          onboardedMembers.ok ? onboardedMembers.count : null
        }
        approvedLast60DaysCount={
          recentlyApproved.ok ? recentlyApproved.members.length : null
        }
      />
    </AdminShell>
  );
}
