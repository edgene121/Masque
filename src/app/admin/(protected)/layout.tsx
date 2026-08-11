import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * Server-side protection for all /admin/* routes except /admin/login.
 * Login lives outside this route group.
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  return children;
}
