import type { Metadata } from "next";
import ProfilePage from "@/components/profile/ProfilePage";

export const metadata: Metadata = {
  title: "Profile | Masqué Member Portal",
  description: "Manage your Masqué member profile.",
};

export default function ProfileRoutePage() {
  return <ProfilePage />;
}
