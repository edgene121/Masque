"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { ChecklistItem, LoginTab } from "@/types/login";
import LogoLockup from "./LogoLockup";
import TabSwitcher from "./TabSwitcher";
import SignInForm from "./SignInForm";
import HowItWorksPanel from "./HowItWorksPanel";
import AssistanceFooter from "./AssistanceFooter";

const CHECKLIST: ChecklistItem[] = [
  { id: "events", label: "Access member-only events" },
  { id: "tickets", label: "Purchase member tickets" },
  { id: "dispatches", label: "Read Dispatches and event briefings" },
  { id: "membership", label: "Manage your membership" },
  { id: "archives", label: "Access exclusive event archives" },
];

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<LoginTab>("signin");

  const handleForgotPassword = () => {
    // TODO: Wire Memberstack password reset flow
    console.log("Forgot password clicked");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#090806]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 70% 40%, rgba(68, 53, 31, 0.55), transparent 65%), radial-gradient(ellipse 50% 40% at 30% 70%, rgba(42, 33, 21, 0.35), transparent 60%), linear-gradient(180deg, #0c0a07 0%, #090806 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-0 py-8 md:py-10">
        <div className="login-container flex w-full flex-col gap-4 md:gap-5">
          <div className="login-card overflow-hidden rounded-[18px] border border-white/30 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="flex h-full flex-col md:flex-row md:min-h-[760px]">
              {/* Left panel */}
              <aside className="login-left-panel flex w-full flex-col justify-between gap-10 bg-[#020202]">
                <LogoLockup />

                <ul className="flex flex-col gap-3.5">
                  {CHECKLIST.map((item) => (
                    <li key={item.id} className="flex items-start gap-2.5">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#b9965b]"
                        strokeWidth={2.75}
                        aria-hidden="true"
                      />
                      <span className="text-[14px] leading-snug text-white">
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </aside>

              {/* Right panel */}
              <section
                className="login-right-panel w-full"
                style={{
                  background:
                    "linear-gradient(165deg, #44351f 0%, #2a2115 55%, #241c12 100%)",
                }}
              >
                <div className="login-right-panel-inner">
                  <TabSwitcher
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />

                  {activeTab === "signin" ? (
                    <SignInForm onForgotPassword={handleForgotPassword} />
                  ) : (
                    <HowItWorksPanel />
                  )}
                </div>
              </section>
            </div>
          </div>

          <AssistanceFooter />
        </div>
      </div>
    </div>
  );
}
