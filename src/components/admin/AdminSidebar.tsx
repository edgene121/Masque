"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Users,
  X,
} from "lucide-react";
import type { AdminSessionPayload } from "@/types/admin";

interface AdminSidebarProps {
  admin: AdminSessionPayload;
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
] as const;

export default function AdminSidebar({
  admin,
  open,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (error) {
      console.error("Admin logout error:", error);
    }
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <>
      <div
        className={`admin-sidebar-backdrop${open ? " is-open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside className={`admin-sidebar${open ? " is-open" : ""}`}>
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__brand-row">
            <div>
              <p className="admin-sidebar__brand-title">MASQUÉ</p>
              <p className="admin-sidebar__brand-sub">ADMIN</p>
            </div>
            <button
              type="button"
              className="admin-sidebar__close"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Admin">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`admin-nav-item${active ? " is-active" : ""}`}
                onClick={onClose}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__admin-meta">
            <p className="admin-sidebar__admin-name">{admin.name}</p>
            <p className="admin-sidebar__admin-role">{admin.role}</p>
          </div>
          <button
            type="button"
            className="admin-sidebar__logout"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
