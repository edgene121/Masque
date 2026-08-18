/**
 * Admin Dashboard mock types and data.
 * Replace MOCK_ADMIN_DASHBOARD_DATA with Airtable/API results later.
 */

export type DashboardSegmentId =
  | "registered"
  | "onboarded"
  | "incomplete"
  | "approvedLast60Days"
  | "neverAttended"
  | "remaining";

export type IncompleteOnboardingStatus =
  | "Profile Incomplete"
  | "ID Required"
  | "Not Started";

export interface IncompleteMember {
  id: string;
  name: string;
  email: string;
  status: IncompleteOnboardingStatus;
  registered: string;
}

export interface RecentlyApprovedMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  approvalDate: string;
  status: "Approved";
  onboardingStatus: string;
  eventsAttended: number;
  lastEventAttended: string;
}

export interface AdminDashboardMockData {
  registered: number;
  onboarded: number;
  incomplete: number;
  approvedLast60Days: number;
  neverAttended: number;
  remaining: number;
  incompleteMembers: IncompleteMember[];
  recentlyApprovedMembers: RecentlyApprovedMember[];
}

export const MOCK_ADMIN_DASHBOARD_DATA: AdminDashboardMockData = {
  registered: 1481,
  onboarded: 1126,
  incomplete: 355,
  approvedLast60Days: 84,
  neverAttended: 327,
  remaining: 715,
  incompleteMembers: [
    {
      id: "inc-1",
      name: "John Smith",
      email: "john@example.com",
      status: "Profile Incomplete",
      registered: "Aug 10, 2026",
    },
    {
      id: "inc-2",
      name: "Sarah Jones",
      email: "sarah@example.com",
      status: "ID Required",
      registered: "Aug 12, 2026",
    },
    {
      id: "inc-3",
      name: "Emma Brown",
      email: "emma@example.com",
      status: "Not Started",
      registered: "Aug 14, 2026",
    },
    {
      id: "inc-4",
      name: "Michael Davis",
      email: "michael@example.com",
      status: "Profile Incomplete",
      registered: "Aug 15, 2026",
    },
  ],
  recentlyApprovedMembers: [
    {
      id: "apr-1",
      name: "Emily Carter",
      phone: "+1 202-555-0132",
      email: "emily@example.com",
      approvalDate: "July 20, 2026",
      status: "Approved",
      onboardingStatus: "Completed",
      eventsAttended: 0,
      lastEventAttended: "—",
    },
    {
      id: "apr-2",
      name: "Sophia Martinez",
      phone: "+1 202-555-0145",
      email: "sophia@example.com",
      approvalDate: "July 28, 2026",
      status: "Approved",
      onboardingStatus: "Completed",
      eventsAttended: 0,
      lastEventAttended: "—",
    },
    {
      id: "apr-3",
      name: "Daniel Carter",
      phone: "+1 202-555-0178",
      email: "daniel@example.com",
      approvalDate: "August 5, 2026",
      status: "Approved",
      onboardingStatus: "Completed",
      eventsAttended: 0,
      lastEventAttended: "—",
    },
    {
      id: "apr-4",
      name: "Olivia Bennett",
      phone: "+1 202-555-0191",
      email: "olivia@example.com",
      approvalDate: "August 10, 2026",
      status: "Approved",
      onboardingStatus: "Completed",
      eventsAttended: 0,
      lastEventAttended: "—",
    },
  ],
};
