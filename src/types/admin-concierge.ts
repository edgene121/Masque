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

export interface ConciergeMember {
  id: string;
  name: string;
  phone: string;
  approvalDate: string;
  attendance: ConciergeAttendance;
  bertha: ConciergeBertha;
  onboarding: ConciergeOnboarding;
  conciergeStatus: ConciergeStatus;
  outstandingItems: ConciergeOutstandingItem[];
}
