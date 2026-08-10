"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Authenticated entry alias — RequireAuth already verified the session. */
export default function PortalPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-sm text-[#A8A29A]">
      Loading…
    </div>
  );
}
