"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { MemberstackUser, NavSectionData } from "@/types/dashboard";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface DashboardLayoutProps {
  user: MemberstackUser;
  navSections: NavSectionData[];
  children: ReactNode;
}

export default function DashboardLayout({
  user,
  navSections,
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isEventsPage = pathname === "/events";

  return (
    <div className="dashboard-page">
      <Sidebar
        sections={navSections}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={`dashboard-main${isEventsPage ? " dashboard-main--no-topbar" : ""}`}
      >
        {!isEventsPage ? (
          <TopBar user={user} onMenuClick={() => setSidebarOpen(true)} />
        ) : (
          // Mobile/tablet only: open sidebar without the white profile header.
          <button
            type="button"
            className="dashboard-events-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="dashboard-main__content dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}
