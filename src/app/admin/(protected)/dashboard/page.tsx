import type { Metadata } from "next";
import { Suspense } from "react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminPageLoader from "@/components/admin/AdminPageLoader";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";
import { countOnboardedMembers } from "@/lib/admin/onboarded-members";
import { countIncompleteMembers } from "@/lib/admin/incomplete-members";
import { countRegisteredMembers } from "@/lib/admin/registered-members";
import { listRecentlyApprovedMembers } from "@/lib/admin/recently-approved";

export const dynamic = "force-dynamic";

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
      <Suspense fallback={<AdminPageLoader />}>
        <AdminDashboardFromAirtable />
      </Suspense>
    </AdminShell>
  );
}

async function AdminDashboardFromAirtable() {
  const [recentlyApproved, registeredMembers, onboardedMembers, incompleteMembers] =
    await Promise.all([
      listRecentlyApprovedMembers(),
      countRegisteredMembers(),
      countOnboardedMembers(),
      countIncompleteMembers(),
    ]);

  return (
    <AdminDashboard
      registeredMembersCount={
        registeredMembers.ok ? registeredMembers.count : null
      }
      onboardedMembersCount={
        onboardedMembers.ok ? onboardedMembers.count : null
      }
      incompleteMembersCount={
        incompleteMembers.ok ? incompleteMembers.count : null
      }
      approvedLast60DaysCount={
        recentlyApproved.ok ? recentlyApproved.members.length : null
      }
    />
  );
}
