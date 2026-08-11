import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";

export default async function AdminIndexPage() {
  const session = await getAdminSession();
  redirect(session ? "/admin/users" : "/admin/login");
}
