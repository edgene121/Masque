import type { Metadata } from "next";
import LoginPage from "@/components/login/LoginPage";

export const metadata: Metadata = {
  title: "Sign In | Masqué Bridge Member Portal",
  description:
    "Sign in to the Masqué Bridge Member Portal for events, Dispatches, and exclusive member content.",
};

export default function LoginRoutePage() {
  return <LoginPage />;
}
