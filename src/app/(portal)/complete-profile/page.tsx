import type { Metadata } from "next";
import CompleteProfilePage from "@/components/onboarding/CompleteProfilePage";

export const metadata: Metadata = {
  title: "Complete Your Profile | Masqué Member Portal",
  description: "Complete your Masqué member profile onboarding.",
};

export default function CompleteProfileRoutePage() {
  return <CompleteProfilePage />;
}
