"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { getMemberstack } from "@/lib/memberstack";
import type { MemberstackUser } from "@/types/dashboard";

interface TopBarProps {
  user: MemberstackUser;
  onMenuClick: () => void;
}

export default function TopBar({ user, onMenuClick }: TopBarProps) {
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

  return (
    <header className="dashboard-header">
      <button
        type="button"
        className="dashboard-header__menu-btn"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="account-trigger-wrap" ref={menuRef}>
        <button
          type="button"
          className="account-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="dashboard-header__avatar" aria-hidden="true">
            {user.initials}
          </span>
          <span className="dashboard-header__name">{user.name}</span>
          <ChevronDown className="dashboard-header__chevron" strokeWidth={2} />
        </button>

        {open ? (
          <div className="account-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              className="account-menu-item"
              onClick={() => {
                setOpen(false);
                router.push("/profile");
              }}
            >
              My Profile
            </button>
            <button
              type="button"
              role="menuitem"
              className="account-menu-item"
              onClick={async () => {
                setOpen(false);
                try {
                  await getMemberstack().logout();
                } catch (error) {
                  console.error("Memberstack logout error:", error);
                }
                router.replace("/login");
              }}
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
