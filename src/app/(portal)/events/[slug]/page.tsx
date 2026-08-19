import type { Metadata } from "next";
import EventDetailPage from "@/components/events/EventDetailPage";
import { getPortalEventBySlug } from "@/lib/portal/airtable-events";

interface EventDetailRouteProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: EventDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPortalEventBySlug(slug);
  const title = event
    ? [event.brandTitle, event.name].filter(Boolean).join(" ")
    : "Event";

  return {
    title: `${title} | Masqué Member Portal`,
    description: event?.description || "Masqué member event.",
  };
}

export default async function EventDetailRoutePage({
  params,
}: EventDetailRouteProps) {
  const { slug } = await params;
  const event = await getPortalEventBySlug(slug);

  return <EventDetailPage event={event} />;
}
