import type { NavSectionData } from "@/types/dashboard";
import NavItem from "./NavItem";

interface NavSectionProps {
  section: NavSectionData;
  showDivider?: boolean;
  onNavigate?: () => void;
}

export default function NavSection({
  section,
  showDivider = false,
  onNavigate,
}: NavSectionProps) {
  return (
    <>
      {showDivider ? <div className="dashboard-sidebar__divider" /> : null}
      {section.label ? (
        <div className="dashboard-sidebar__heading">{section.label}</div>
      ) : null}
      <div className="dashboard-sidebar__group">
        {section.items.map((item) => (
          <NavItem key={item.id} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </>
  );
}
