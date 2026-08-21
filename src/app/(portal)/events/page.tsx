import type { Metadata } from "next";
import EventsPage from "@/components/events/EventsPage";
import { listPortalEvents } from "@/lib/portal/airtable-events";
import {
  mergeBlackSwanIntoUpcoming,
  remapBlackSwanHref,
} from "@/lib/portal/black-swan-events";

export const metadata: Metadata = {
  title: "Events | Masqué Member Portal",
  description: "Featured Masqué member events.",
};

export const dynamic = "force-dynamic";

export default async function EventsRoutePage() {
  const result = await listPortalEvents();

  if (!result.ok) {
    return (
      <EventsPage
        upcoming={[]}
        past={[]}
        loadError="Unable to load events right now. Please try again later."
      />
    );
  }

  return (
    <EventsPage
      upcoming={mergeBlackSwanIntoUpcoming(result.upcoming)}
      past={remapBlackSwanHref(result.past)}
      loadError={null}
    />
  );
}
