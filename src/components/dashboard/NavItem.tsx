"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Headphones,
  Home,
  List,
  Shield,
  Ticket,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { NavItemData } from "@/types/dashboard";

const ICONS: Record<NavItemData["icon"], LucideIcon> = {
  home: Home,
  user: User,
  userPlus: UserPlus,
  bookOpen: BookOpen,
  shield: Shield,
  list: List,
  ticket: Ticket,
  headphones: Headphones,
};

interface NavItemProps {
  item: NavItemData;
  onNavigate?: () => void;
}

export default function NavItem({ item, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href ||
    (item.href === "/home" &&
      (pathname === "/home" || pathname === "/dashboard"));

  const Icon = ICONS[item.icon];

  return (
    <Link
      href={item.href}
      className={`dashboard-menu-item${isActive ? " is-active" : ""}`}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="dashboard-menu-item__icon" strokeWidth={1.75} />
      <span className="dashboard-menu-item__label">{item.label}</span>
      {item.badge ? (
        <span className="dashboard-menu-item__badge">{item.badge}</span>
      ) : null}
    </Link>
  );
}
