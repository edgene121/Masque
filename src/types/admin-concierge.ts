export type ConciergeAttendance = "Never Attended" | "Attended";
export type ConciergeBertha = "Purchased" | "No Ticket";
export type ConciergeOnboarding = "Completed" | "Incomplete";

export type ConciergeStatus =
  | "Not Contacted"
  | "Welcome Completed"
  | "Conversation Active"
  | "Follow-up Needed"
  | "Deferred"
  | "Do Not Contact";

export type ConciergeOutstandingItem =
  | "Verification"
  | "Member Agreement"
  | "Portal Login"
  | "Dispatches"
  | "Bertha"
  | "Data Quality";

export type ConciergePriority = "High" | "Normal";

export type ConciergeVerificationMethod =
  | "Not Verified"
  | "Verified Online"
  | "Verified In Person (Pierce)"
  | "Verified In Person (Door)";

export type ConciergeMemberAgreement =
  | "Signed in Portal"
  | "Signed at Pierce (Legacy)"
  | "Missing";

export type ConciergeEscalation =
  | "None"
  | "Concierge Follow-up"
  | "Operations Follow-up"
  | "Founder Follow-up";

export type ConciergeDataQualityIssue =
  | "Duplicate Phone Number"
  | "Duplicate Email Address"
  | "Missing Phone Number"
  | "Missing Email Address"
  | "Missing Profile Information"
  | "Incorrect Contact Information";

export interface ConciergeAttendanceDetail {
  hasEverAttended: boolean;
  lastEventAttended: string;
}

export interface ConciergeOnboardingDetail {
  verificationMethod: ConciergeVerificationMethod;
  memberAgreement: ConciergeMemberAgreement;
  portalAccountCreated: boolean;
  portalLoginCompleted: boolean;
}

export interface ConciergeWorkflow {
  status: ConciergeStatus;
  welcomeDate: string;
  lastContact: string;
  notes: string;
  escalation: ConciergeEscalation;
}

export interface ConciergeMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  approvalDate: string;
  attendance: ConciergeAttendanceDetail;
  berthaTicketPurchased: boolean;
  onboarding: ConciergeOnboardingDetail;
  concierge: ConciergeWorkflow;
  outstandingItems: ConciergeOutstandingItem[];
  dataQualityIssues: ConciergeDataQualityIssue[];
}
