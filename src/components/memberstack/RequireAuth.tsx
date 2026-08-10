"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getMemberstack } from "@/lib/memberstack";

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Client-side Memberstack auth guard for protected portal routes.
 * Renders children only after getCurrentMember() confirms a logged-in member.
 */
export default function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        const memberstack = getMemberstack();
        const { data: member } = await memberstack.getCurrentMember();

        if (cancelled) return;

        if (!member) {
          router.replace("/login");
          return;
        }

        setIsAuthorized(true);
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-sm text-[#A8A29A]">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
