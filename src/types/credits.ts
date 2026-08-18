export interface CreditsInvitedFriend {
  id: string;
  name: string;
  status: string;
  applicationDate: string;
  creditStatus: string;
}

export interface CreditsHistoryRow {
  id: string;
  date: string;
  activity: string;
  details: string;
  credits: number | null;
}

export interface PortalCreditsData {
  referralCode: string;
  creditsAvailable: number | null;
  qualifiedReferrals: number | null;
  creditsRedeemed: number | null;
  invitedFriends: CreditsInvitedFriend[];
  invitedBy: string;
  /** Present when a referrer referral code is available. */
  invitedByReferralCode?: string;
  creditHistory: CreditsHistoryRow[];
}

export const EMPTY_PORTAL_CREDITS: PortalCreditsData = {
  referralCode: "",
  creditsAvailable: null,
  qualifiedReferrals: null,
  creditsRedeemed: null,
  invitedFriends: [],
  invitedBy: "",
  creditHistory: [],
};

/**
 * UI-only mock for Invited Friends, Invited By, and Credit History.
 * Home summary cards (Available Credits, Qualified Referrals, Credits Redeemed)
 * are loaded from People via /api/portal/credits.
 * Do not write this data to Airtable.
 */
export const MOCK_CREDITS_DATA: PortalCreditsData = {
  referralCode: "EDGENE2862",
  creditsAvailable: 250,
  qualifiedReferrals: 3,
  creditsRedeemed: 100,
  invitedBy: "Alexander Morgan",
  invitedByReferralCode: "ALEXANDER4821",
  invitedFriends: [
    {
      id: "mock-friend-1",
      name: "Sophia Martinez",
      status: "Qualified",
      applicationDate: "August 10, 2026",
      creditStatus: "+100",
    },
    {
      id: "mock-friend-2",
      name: "Daniel Carter",
      status: "Qualified",
      applicationDate: "August 5, 2026",
      creditStatus: "+100",
    },
    {
      id: "mock-friend-3",
      name: "Olivia Bennett",
      status: "Pending",
      applicationDate: "August 16, 2026",
      creditStatus: "Pending",
    },
  ],
  creditHistory: [
    {
      id: "mock-history-1",
      date: "August 10, 2026",
      activity: "Referral Reward",
      details: "Sophia Martinez",
      credits: 100,
    },
    {
      id: "mock-history-2",
      date: "August 5, 2026",
      activity: "Referral Reward",
      details: "Daniel Carter",
      credits: 100,
    },
    {
      id: "mock-history-3",
      date: "July 28, 2026",
      activity: "Event Credit Redemption",
      details: "",
      credits: -100,
    },
    {
      id: "mock-history-4",
      date: "July 15, 2026",
      activity: "Welcome Credit",
      details: "",
      credits: 50,
    },
  ],
};
