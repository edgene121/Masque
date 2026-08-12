import "server-only";

import type { FeaturedEventData, MemberStatusData } from "@/types/dashboard";
import { getFeaturedEventForDashboard } from "@/lib/portal/airtable-events";

const FALLBACK_MEMBER_STATUS: MemberStatusData = {
  variant: "active",
  label: "Membership Active",
  welcomeHeading: "Welcome to Masqué",
  welcomeText:
    "Welcome to the MASQUÉ Member Portal. This platform provides everything you need to manage your membership and stay connected with the community.",
};

/**
 * TODO: Integrate Airtable API for portal copy.
 */
export async function fetchMemberStatus(
  _memberId?: string,
): Promise<MemberStatusData> {
  return FALLBACK_MEMBER_STATUS;
}

/** Next upcoming event from Airtable Events (server-only). */
export async function fetchFeaturedEvent(): Promise<FeaturedEventData | null> {
  return getFeaturedEventForDashboard();
}
