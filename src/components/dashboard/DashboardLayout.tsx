"use client";

import { useState, type ReactNode } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-page">
      <Sidebar
        sections={navSections}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-main">
        <TopBar user={user} onMenuClick={() => setSidebarOpen(true)} />
        <div className="dashboard-main__content dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}
