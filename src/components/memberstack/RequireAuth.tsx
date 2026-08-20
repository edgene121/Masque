"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getMemberstack } from "@/lib/memberstack";
import { buildLoginRedirect } from "@/lib/login/safe-next-path";

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Client-side Memberstack auth guard for protected portal routes.
 * Renders children only after getCurrentMember() confirms a logged-in member.
 */
export default function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        const memberstack = getMemberstack();
        const { data: member } = await memberstack.getCurrentMember();

        if (cancelled) return;

        if (!member) {
          router.replace(buildLoginRedirect(pathname));
          return;
        }

        setIsAuthorized(true);
      } catch {
        if (!cancelled) {
          router.replace(buildLoginRedirect(pathname));
        }
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-sm text-[#A8A29A]">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
