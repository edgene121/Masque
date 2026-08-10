import type { Metadata } from "next";
import CulturalFrameworkPage from "@/components/community/CulturalFrameworkPage";

export const metadata: Metadata = {
  title: "Cultural Framework | Masqué Member Portal",
  description: "Masqué Cultural Framework principles and community values.",
};

export default function CulturalFrameworkRoutePage() {
  return <CulturalFrameworkPage />;
}
