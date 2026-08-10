import type { Metadata } from "next";
import ContactSupportPage from "@/components/support/ContactSupportPage";

export const metadata: Metadata = {
  title: "Contact Support | Masqué Member Portal",
  description: "Speak with Masqué Concierge for membership and event support.",
};

export default function ContactSupportRoutePage() {
  return <ContactSupportPage />;
}
