import type { Metadata } from "next";
import DashboardPage from "@/components/dashboard/DashboardPage";

export const metadata: Metadata = {
  title: "Home | Masqué Member Portal",
  description: "Masqué Member Portal dashboard.",
};

export default function DashboardRoutePage() {
  return <DashboardPage />;
}
