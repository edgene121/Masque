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

export interface CreditsInvitedBy {
  name: string;
  email: string;
  phone: string;
  referralCode: string;
}

export interface PortalCreditsData {
  referralCode: string;
  creditsAvailable: number | null;
  qualifiedReferrals: number | null;
  creditsRedeemed: number | null;
  invitedFriends: CreditsInvitedFriend[];
  invitedBy: CreditsInvitedBy | null;
  creditHistory: CreditsHistoryRow[];
}

export const EMPTY_PORTAL_CREDITS: PortalCreditsData = {
  referralCode: "",
  creditsAvailable: null,
  qualifiedReferrals: null,
  creditsRedeemed: null,
  invitedFriends: [],
  invitedBy: null,
  creditHistory: [],
};

/**
 * Remaining mock values are unused on Home; live Credits & Referrals data
 * comes from People/Applications/Rewards via /api/portal/credits.
 * Do not write this data to Airtable.
 */
export const MOCK_CREDITS_DATA: PortalCreditsData = {
  referralCode: "EDGENE2862",
  creditsAvailable: 250,
  qualifiedReferrals: 3,
  creditsRedeemed: 100,
  invitedBy: null,
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
  creditHistory: [],
};
