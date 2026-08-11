"use client";

import { useState, type ReactNode } from "react";
import type { AdminSessionPayload } from "@/types/admin";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

interface AdminShellProps {
  admin: AdminSessionPayload;
  title: string;
  description?: string;
  children: ReactNode;
}

export default function AdminShell({
  admin,
  title,
  description,
  children,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-portal">
      <AdminSidebar
        admin={admin}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="admin-main">
        <AdminHeader
          title={title}
          description={description}
          admin={admin}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div className="admin-main__content">{children}</div>
      </div>
    </div>
  );
}
