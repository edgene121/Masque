import type { Metadata } from "next";
import ConciergeRecentlyApprovedList from "@/components/admin/ConciergeRecentlyApprovedList";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";

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
      <ConciergeRecentlyApprovedList />
    </AdminShell>
  );
}
