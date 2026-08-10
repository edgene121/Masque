"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CommunityFooterCard from "@/components/dashboard/CommunityFooterCard";
import { navSections } from "@/data/dashboard";
import { archiveDispatches } from "@/data/dispatch-archive";
import { useMemberstackUser } from "@/lib/memberstack";
import heroBanner from "../../assets/featured-dispatch.png";
import DispatchArchiveCard from "./DispatchArchiveCard";

export default function DispatchArchivePage() {
  const user = useMemberstackUser();

  return (
    <DashboardLayout user={user} navSections={navSections}>
      <section
        className="framework-hero"
        style={{ backgroundImage: `url(${heroBanner.src})` }}
      >
        <div className="framework-hero__overlay">
          <h1 className="framework-hero__title">OUR DISPATCHES</h1>
        </div>
      </section>

      <div className="dispatch-archive-grid">
        {archiveDispatches.map((dispatch) => (
          <DispatchArchiveCard key={dispatch.id} dispatch={dispatch} />
        ))}
      </div>

      <CommunityFooterCard />
    </DashboardLayout>
  );
}
