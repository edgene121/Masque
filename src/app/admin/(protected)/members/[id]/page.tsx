import type { Metadata } from "next";
import Link from "next/link";
import AdminMockMemberDetail from "@/components/admin/AdminMockMemberDetail";
import AdminShell from "@/components/admin/AdminShell";
import { isDashboardSegmentPath } from "@/lib/admin/dashboard-segments";
import { getMockDashboardMemberById } from "@/lib/admin/mock-dashboard-members";
import { requireAdmin } from "@/lib/admin/auth";

interface AdminMockMemberDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export async function generateMetadata({
  params,
}: AdminMockMemberDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const member = getMockDashboardMemberById(id);

  return {
    title: member
      ? `${member.name} | Masqué Admin`
      : "Member Detail | Masqué Admin",
    description: "Mock member detail for Admin Dashboard segments.",
  };
}

export default async function AdminMockMemberDetailPage({
  params,
  searchParams,
}: AdminMockMemberDetailPageProps) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { from } = await searchParams;
  const member = getMockDashboardMemberById(id);
  const backHref =
    from && isDashboardSegmentPath(from) ? from : "/admin/dashboard";
  const backLabel =
    backHref === "/admin/dashboard" ? "Back to Dashboard" : "Back to List";

  if (!member) {
    return (
      <AdminShell
        admin={admin}
        title="Member Detail"
        description="Member record detail."
      >
        <section className="admin-card admin-detail-missing">
          <p className="admin-card__body">Member Not Found</p>
          <p style={{ marginTop: "20px" }}>
            <Link href={backHref} className="admin-table-action">
              {backLabel}
            </Link>
          </p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      admin={admin}
      title={member.name}
      description="Member details for this dashboard segment."
    >
      <AdminMockMemberDetail
        member={member}
        backHref={backHref}
        backLabel={backLabel}
      />
    </AdminShell>
  );
}
