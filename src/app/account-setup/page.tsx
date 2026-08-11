import type { Metadata } from "next";
import AccountSetupPage from "@/components/login/AccountSetupPage";

export const metadata: Metadata = {
  title: "Account Setup | Masqué Member Portal",
  description: "Set your Masqué member portal password to complete account setup.",
};

export default function AccountSetupRoutePage() {
  return <AccountSetupPage />;
}
