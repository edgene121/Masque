import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getAdminSession } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: "Admin Sign In | Masqué",
  description: "Sign in to the Masqué Admin Portal.",
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/users");
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <p className="admin-login-brand__title">MASQUÉ</p>
          <p className="admin-login-brand__sub">ADMIN PORTAL</p>
        </div>

        <div className="admin-login-copy">
          <h1>Welcome Back</h1>
          <p>Sign In To Manage Members And Administrative Operations.</p>
        </div>

        <AdminLoginForm />
      </div>
    </div>
  );
}
