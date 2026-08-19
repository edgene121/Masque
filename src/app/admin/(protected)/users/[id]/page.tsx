import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AdminPageLoader from "@/components/admin/AdminPageLoader";
import AdminShell from "@/components/admin/AdminShell";
import AdminUserDetail from "@/components/admin/AdminUserDetail";
import { requireAdmin } from "@/lib/admin/auth";
import { getApplicationDetailById } from "@/lib/admin/applications";
import type { AdminSessionPayload } from "@/types/admin";

export const metadata: Metadata = {
  title: "Member Detail | Masqué Admin",
  description: "Member Application detail and Admin review.",
};

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const admin = await requireAdmin();
  const { id } = await params;

  if (!id || !/^rec[a-zA-Z0-9]+$/.test(id)) {
    return (
      <AdminShell
        admin={admin}
        title="Member Detail"
        description="Member Application record detail."
      >
        <section className="admin-card admin-detail-missing">
          <p className="admin-card__body">Application Not Found</p>
          <p style={{ marginTop: "20px" }}>
            <Link href="/admin/users" className="admin-table-action">
              Back to Members
            </Link>
          </p>
        </section>
      </AdminShell>
    );
  }

  return (
    <Suspense
      fallback={
        <AdminShell
          admin={admin}
          title="Member Detail"
          description="Member Application record detail."
        >
          <AdminPageLoader />
        </AdminShell>
      }
    >
      <AdminUserDetailLoaded admin={admin} id={id} />
    </Suspense>
  );
}

async function AdminUserDetailLoaded({
  admin,
  id,
}: {
  admin: AdminSessionPayload;
  id: string;
}) {
  const result = await getApplicationDetailById(id);

  if (!result.ok) {
    return (
      <AdminShell
        admin={admin}
        title="Member Detail"
        description="Member Application record detail."
      >
        <section className="admin-card admin-detail-missing">
          <p className="admin-card__body">
            {result.status === 404 ? "Application Not Found" : result.error}
          </p>
          <p style={{ marginTop: "20px" }}>
            <Link href="/admin/users" className="admin-table-action">
              Back to Members
            </Link>
          </p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      admin={admin}
      title="Member Detail"
      description="Review Member details, Government ID, and Vetting Status."
    >
      <AdminUserDetail detail={result.detail} />
    </AdminShell>
  );
}
