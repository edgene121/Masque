"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SectionHeading from "@/components/dashboard/SectionHeading";
import CommunityFooterCard from "@/components/dashboard/CommunityFooterCard";
import { navSections } from "@/data/dashboard";
import { prospectStats } from "@/data/prospects";
import { useMemberstackUser } from "@/lib/memberstack";
import ProspectStatCard from "./ProspectStatCard";

export default function GrowthContributorsPage() {
  const user = useMemberstackUser();

  const handleAddNew = () => {
    // TODO: Open add-prospect flow / modal
    console.log("Add New prospect clicked");
  };

  return (
    <DashboardLayout user={user} navSections={navSections}>
      <div className="prospects-header">
        <SectionHeading>Masqué Prospects</SectionHeading>
        <button
          type="button"
          className="prospects-add-btn"
          onClick={handleAddNew}
        >
          Add New
        </button>
      </div>

      <div className="prospects-stats-grid">
        {prospectStats.map((stat) => (
          <ProspectStatCard key={stat.id} stat={stat} />
        ))}
      </div>

      <CommunityFooterCard />
    </DashboardLayout>
  );
}
