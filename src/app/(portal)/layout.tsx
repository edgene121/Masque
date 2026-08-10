import type { ReactNode } from "react";
import RequireAuth from "@/components/memberstack/RequireAuth";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
