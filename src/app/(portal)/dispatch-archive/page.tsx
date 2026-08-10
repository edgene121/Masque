import type { Metadata } from "next";
import DispatchArchivePage from "@/components/community/DispatchArchivePage";

export const metadata: Metadata = {
  title: "Dispatch Archive | Masqué Member Portal",
  description: "Masqué Dispatch Archive.",
};

export default function DispatchArchiveRoutePage() {
  return <DispatchArchivePage />;
}
