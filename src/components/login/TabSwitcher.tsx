"use client";

import type { TabSwitcherProps, LoginTab } from "@/types/login";

const TABS: { id: LoginTab; label: string }[] = [
  { id: "signin", label: "Sign in" },
  { id: "howitworks", label: "How It Works" },
];

export default function TabSwitcher({
  activeTab,
  onTabChange,
}: TabSwitcherProps) {
  return (
    <div className="login-tabs" role="tablist" aria-label="Login views">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? "active" : undefined}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
