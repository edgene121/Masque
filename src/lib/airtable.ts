import type { FeaturedEventData, MemberStatusData } from "@/types/dashboard";

const FALLBACK_MEMBER_STATUS: MemberStatusData = {
  variant: "active",
  label: "Membership Active",
  welcomeHeading: "Welcome to Masqué",
  welcomeText:
    "Welcome to the MASQUÉ Member Portal. This platform provides everything you need to manage your membership and stay connected with the community.",
};

const FALLBACK_FEATURED_EVENT: FeaturedEventData = {
  id: "masque-nocturne-le-reve-noir",
  title: "MASQUÉ NOCTURNE LE RÊVE NOIR",
  description:
    "For one night, an industrial warehouse is transformed into a living world of music, performance, art, and uninhibited discovery.",
  date: "2026-08-15",
  accessLabel: "Members Only",
  href: "/events/masque-nocturne-le-reve-noir",
};

/**
 * TODO: Integrate Airtable API
 * - Base: Member Portal CMS
 * - Table: Member Status / Portal Copy
 * - Fields: statusVariant, statusLabel, welcomeHeading, welcomeText
 */
export async function fetchMemberStatus(
  _memberId?: string
): Promise<MemberStatusData> {
  // TODO: const res = await fetch(`https://api.airtable.com/v0/${baseId}/...`)
  return FALLBACK_MEMBER_STATUS;
}

/**
 * TODO: Integrate Airtable API
 * - Table: Events
 * - Filter: featured = true AND upcoming
 * - Fields: title, description, date, image, access, slug
 */
export async function fetchFeaturedEvent(): Promise<FeaturedEventData | null> {
  // TODO: const res = await fetch(`https://api.airtable.com/v0/${baseId}/Events?...`)
  return FALLBACK_FEATURED_EVENT;
}
