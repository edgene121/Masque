import type { Metadata } from "next";
import { Suspense } from "react";
import ConciergeRecentlyApprovedList from "@/components/admin/ConciergeRecentlyApprovedList";
import AdminPageLoader from "@/components/admin/AdminPageLoader";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";
import { listRecentlyApprovedMembers } from "@/lib/admin/recently-approved";

export const metadata: Metadata = {
  title: "Recently Approved Members | Masqué Admin",
  description:
    "Members approved within the last 60 days and prioritized for Concierge welcome outreach.",
};

export default async function ConciergeRecentlyApprovedPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell
      admin={admin}
      title="Recently Approved Members"
      description="Members approved within the last 60 days and prioritized for Concierge welcome outreach."
    >
      <Suspense fallback={<AdminPageLoader />}>
        <RecentlyApprovedFromAirtable />
      </Suspense>
    </AdminShell>
  );
}

async function RecentlyApprovedFromAirtable() {
  const result = await listRecentlyApprovedMembers();

  return (
    <ConciergeRecentlyApprovedList
      members={result.ok ? result.members : []}
      loadError={result.ok ? null : result.error}
    />
  );
}
