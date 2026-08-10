import type { Metadata } from "next";
import CodeOfConductPage from "@/components/community/CodeOfConductPage";

export const metadata: Metadata = {
  title: "Code Of Conduct | Masqué Member Portal",
  description: "Masqué Member Code Of Conduct.",
};

export default function CodeOfConductRoutePage() {
  return <CodeOfConductPage />;
}
