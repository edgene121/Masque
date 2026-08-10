import type { Metadata } from "next";
import GrowthContributorsPage from "@/components/prospects/GrowthContributorsPage";

export const metadata: Metadata = {
  title: "Growth Contributors | Masqué Member Portal",
  description: "Masqué Prospects dashboard.",
};

export default function GrowthContributorsRoutePage() {
  return <GrowthContributorsPage />;
}
