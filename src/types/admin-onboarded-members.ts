import type { ConciergeMember } from "@/types/admin-concierge";

export type OnboardedMember = {
  id: string;
  name: string;
  phone: string;
  email: string;
  approvalDate: string;
  onboardingState: string;
  membershipStatus: string;
};

export type OnboardedMemberDetail = ConciergeMember & {
  onboardingCompletedDate: string;
};
