export type ConciergeAttendance = "Never Attended" | "Attended";
export type ConciergeBertha = "Purchased" | "No Ticket";
export type ConciergeOnboarding = "Completed" | "Incomplete";
export type PeopleOnboardingState =
  | "Completed"
  | "In Progress"
  | "Not Started";

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
  lastEventName?: string;
  lastEventDate?: string;
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

export type ConciergeListField =
  | "attendance"
  | "bertha"
  | "onboarding"
  | "conciergeStatus"
  | "outstandingItems";

/** When omitted, every list field is treated as a confirmed value (mock/detail). */
export type ConciergeFieldAvailability = Record<ConciergeListField, boolean>;

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
  /** Exact People "Onboarding State" value. Blank/missing is omitted or "". */
  onboardingState?: string;
  /** Exact People "Concierge Status" value. Blank/missing is omitted or "". */
  peopleConciergeStatus?: string;
  fieldAvailability?: ConciergeFieldAvailability;
}
