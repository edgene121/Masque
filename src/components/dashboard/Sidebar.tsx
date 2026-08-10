"use client";

import type { NavSectionData } from "@/types/dashboard";
import NavSection from "./NavSection";

interface SidebarProps {
  sections: NavSectionData[];
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ sections, open, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`dashboard-sidebar-backdrop${open ? " is-open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`dashboard-sidebar${open ? " is-open" : ""}`}
        aria-label="Member portal navigation"
      >
        <div className="dashboard-sidebar__brand">
          <div className="dashboard-sidebar__brand-title">Masqué</div>
          <div className="dashboard-sidebar__brand-sub">Member Portal</div>
        </div>

        <nav className="dashboard-sidebar__nav">
          {sections.map((section, index) => (
            <NavSection
              key={section.id}
              section={section}
              showDivider={index > 0}
              onNavigate={onClose}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
