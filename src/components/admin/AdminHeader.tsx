"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import type { AdminSessionPayload } from "@/types/admin";

interface AdminHeaderProps {
  title: string;
  description?: string;
  admin: AdminSessionPayload;
  onMenuClick: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function AdminHeader({
  title,
  description,
  admin,
  onMenuClick,
}: AdminHeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (error) {
      console.error("Admin logout error:", error);
    }
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <button
          type="button"
          className="admin-header__menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="admin-header__title">{title}</h1>
          {description ? (
            <p className="admin-header__description">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="admin-header__account" ref={menuRef}>
        <button
          type="button"
          className="admin-account-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="admin-account-avatar" aria-hidden="true">
            {getInitials(admin.name)}
          </span>
          <span className="admin-account-copy">
            <span className="admin-account-name">{admin.name}</span>
            <span className="admin-account-role">{admin.role}</span>
          </span>
          <ChevronDown className="h-4 w-4 admin-account-chevron" />
        </button>

        {open ? (
          <div className="admin-account-menu" role="menu">
            <div className="admin-account-menu__info" role="presentation">
              <p>{admin.email}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              className="admin-account-menu__item"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
