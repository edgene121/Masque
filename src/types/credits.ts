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
