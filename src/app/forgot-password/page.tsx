import type { Metadata } from "next";
import ForgotPasswordPage from "@/components/login/ForgotPasswordPage";

export const metadata: Metadata = {
  title: "Forgot Password | Masqué Member Portal",
  description: "Reset your Masqué member portal password.",
};

export default function ForgotPasswordRoutePage() {
  return <ForgotPasswordPage />;
}
