import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Request Access | Masqué Bridge",
  description: "Request access to the Masqué Bridge Member Portal.",
};

export default function RequestAccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
      <h1 className="font-serif text-3xl font-bold text-white">
        Request an Access
      </h1>
      <p className="mt-3 max-w-md text-sm text-[#A8A29A]">
        This page is a placeholder. Connect your invitation / request-access
        flow here.
      </p>
      <Link
        href="/login"
        className="mt-8 rounded-lg bg-[#B8925A] px-6 py-3 text-sm font-bold text-[#1a1410] hover:bg-[#C9A063]"
      >
        Back to Sign In
      </Link>
    </div>
  );
}
