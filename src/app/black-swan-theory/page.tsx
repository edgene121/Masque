import type { Metadata } from "next";
import BlackSwanTheoryPage from "@/components/public/BlackSwanTheoryPage";

export const metadata: Metadata = {
  title: "MASQUÉ : ATELIER — Black Swan Theory",
  description: "Public event landing page for MASQUÉ : ATELIER — Black Swan Theory.",
};

export default function BlackSwanTheoryRoutePage() {
  return <BlackSwanTheoryPage />;
}
