import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPage from "@/components/login/LoginPage";

export const metadata: Metadata = {
  title: "Sign In | Masqué Bridge Member Portal",
  description:
    "Sign in to the Masqué Bridge Member Portal for events, Dispatches, and exclusive member content.",
};

export default function LoginRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#090806] text-sm text-[#A8A29A]">
          Loading…
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
