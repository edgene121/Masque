import type { Metadata } from "next";
import EventsPage from "@/components/events/EventsPage";

export const metadata: Metadata = {
  title: "Events | Masqué Member Portal",
  description: "Featured Masqué member events.",
};

export default function EventsRoutePage() {
  return <EventsPage />;
}
