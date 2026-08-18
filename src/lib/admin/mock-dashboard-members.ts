/**
 * Centralized Admin Dashboard member mock data.
 * Replace this module with Airtable/API results later.
 */

import type {
  DashboardSegmentId,
  IncompleteOnboardingStatus,
  MockDashboardMember,
  OnboardingStatus,
} from "@/types/admin-dashboard";
import { MOCK_ADMIN_DASHBOARD_DATA } from "@/types/admin-dashboard";

const INCOMPLETE_STATUSES: IncompleteOnboardingStatus[] = [
  "Profile Incomplete",
  "ID Required",
  "Not Started",
];

const FIRST_NAMES = [
  "James",
  "Maria",
  "Robert",
  "Jennifer",
  "Michael",
  "Linda",
  "William",
  "Elizabeth",
  "David",
  "Barbara",
  "Richard",
  "Susan",
  "Joseph",
  "Jessica",
  "Thomas",
  "Sarah",
  "Charles",
  "Karen",
  "Christopher",
  "Nancy",
  "Daniel",
  "Lisa",
  "Matthew",
  "Betty",
  "Anthony",
  "Margaret",
  "Mark",
  "Sandra",
  "Donald",
  "Ashley",
  "Steven",
  "Kimberly",
  "Paul",
  "Emily",
  "Andrew",
  "Donna",
  "Joshua",
  "Michelle",
  "Kenneth",
  "Dorothy",
  "Kevin",
  "Carol",
  "Brian",
  "Amanda",
  "George",
  "Melissa",
  "Timothy",
  "Deborah",
  "Ronald",
  "Stephanie",
];

const LAST_NAMES = [
  "Wilson",
  "Garcia",
  "Anderson",
  "Taylor",
  "Thomas",
  "Hernandez",
  "Moore",
  "Martin",
  "Jackson",
  "Thompson",
  "White",
  "Lopez",
  "Lee",
  "Gonzalez",
  "Harris",
  "Clark",
  "Lewis",
  "Robinson",
  "Walker",
  "Perez",
  "Hall",
  "Young",
  "Allen",
  "Sanchez",
  "Wright",
  "King",
  "Scott",
  "Green",
  "Baker",
  "Adams",
  "Nelson",
  "Hill",
  "Ramirez",
  "Campbell",
  "Mitchell",
  "Roberts",
  "Carter",
  "Phillips",
  "Evans",
  "Turner",
  "Torres",
  "Parker",
  "Collins",
  "Edwards",
  "Stewart",
  "Flores",
  "Morris",
  "Nguyen",
  "Murphy",
  "Rivera",
];

function missingStepFor(status: OnboardingStatus): string {
  switch (status) {
    case "Profile Incomplete":
      return "Profile";
    case "ID Required":
      return "ID Verification";
    case "Not Started":
      return "Onboarding";
    default:
      return "—";
  }
}

function pad4(value: number): string {
  return String(value).padStart(4, "0");
}

function formatLongDate(year: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex, day)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function generatedName(index: number): { name: string; email: string } {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last =
    LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  const name = `${first} ${last}`;
  const email = `${first}.${last}${index}@example.com`.toLowerCase();
  return { name, email };
}

function memberOf(partial: MockDashboardMember): MockDashboardMember {
  return partial;
}

function createMockDashboardMembers(): MockDashboardMember[] {
  const registered = MOCK_ADMIN_DASHBOARD_DATA.registered;
  const onboarded = MOCK_ADMIN_DASHBOARD_DATA.onboarded;
  const approvedLast60Days = MOCK_ADMIN_DASHBOARD_DATA.approvedLast60Days;
  const neverAttended = MOCK_ADMIN_DASHBOARD_DATA.neverAttended;

  const approvedEnd = approvedLast60Days;
  const neverAttendedEnd = approvedEnd + neverAttended;
  const remainingEnd = onboarded;
  const featuredIncompleteStart = remainingEnd;

  const featuredApproved: MockDashboardMember[] =
    MOCK_ADMIN_DASHBOARD_DATA.recentlyApprovedMembers.map((row) =>
      memberOf({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        approvalDate: row.approvalDate,
        membershipStatus: "Approved",
        onboardingStatus: "Completed",
        missingStep: "—",
        eventsAttended: row.eventsAttended,
        lastEventAttended: row.lastEventAttended,
        segments: ["registered", "onboarded", "approvedLast60Days"],
      }),
    );

  const featuredIncomplete: MockDashboardMember[] =
    MOCK_ADMIN_DASHBOARD_DATA.incompleteMembers.map((row) =>
      memberOf({
        id: row.id,
        name: row.name,
        phone: `+1 202-555-${pad4(2000 + Number(row.id.replace(/\D/g, "") || "1"))}`,
        email: row.email,
        approvalDate: "—",
        membershipStatus: "Incomplete",
        onboardingStatus: row.status,
        missingStep: missingStepFor(row.status),
        eventsAttended: 0,
        lastEventAttended: "—",
        segments: ["registered", "incomplete"],
      }),
    );

  const members: MockDashboardMember[] = [];

  for (let i = 0; i < registered; i += 1) {
    if (i < featuredApproved.length) {
      members.push(featuredApproved[i]);
      continue;
    }

    if (
      i >= featuredIncompleteStart &&
      i < featuredIncompleteStart + featuredIncomplete.length
    ) {
      members.push(featuredIncomplete[i - featuredIncompleteStart]);
      continue;
    }

    const { name, email } = generatedName(i);
    const phone = `+1 202-555-${pad4(1000 + (i % 9000))}`;

    if (i < approvedEnd) {
      members.push(
        memberOf({
          id: `dmem-${i + 1}`,
          name,
          phone,
          email,
          approvalDate: formatLongDate(2026, 6, 1 + (i % 28)),
          membershipStatus: "Approved",
          onboardingStatus: "Completed",
          missingStep: "—",
          eventsAttended: 0,
          lastEventAttended: "—",
          segments: ["registered", "onboarded", "approvedLast60Days"],
        }),
      );
      continue;
    }

    if (i < neverAttendedEnd) {
      members.push(
        memberOf({
          id: `dmem-${i + 1}`,
          name,
          phone,
          email,
          approvalDate: formatLongDate(2025, i % 12, 1 + (i % 27)),
          membershipStatus: "Approved",
          onboardingStatus: "Completed",
          missingStep: "—",
          eventsAttended: 0,
          lastEventAttended: "—",
          segments: ["registered", "onboarded", "neverAttended"],
        }),
      );
      continue;
    }

    if (i < remainingEnd) {
      const eventsAttended = 1 + (i % 6);
      members.push(
        memberOf({
          id: `dmem-${i + 1}`,
          name,
          phone,
          email,
          approvalDate: formatLongDate(2024, i % 12, 1 + (i % 27)),
          membershipStatus: "Approved",
          onboardingStatus: "Completed",
          missingStep: "—",
          eventsAttended,
          lastEventAttended: formatLongDate(2026, i % 7, 2 + (i % 26)),
          segments: ["registered", "onboarded", "remaining"],
        }),
      );
      continue;
    }

    const onboardingStatus = INCOMPLETE_STATUSES[i % INCOMPLETE_STATUSES.length];
    members.push(
      memberOf({
        id: `dmem-${i + 1}`,
        name,
        phone,
        email,
        approvalDate: "—",
        membershipStatus: "Incomplete",
        onboardingStatus,
        missingStep: missingStepFor(onboardingStatus),
        eventsAttended: 0,
        lastEventAttended: "—",
        segments: ["registered", "incomplete"],
      }),
    );
  }

  return members;
}

export const MOCK_DASHBOARD_MEMBERS = createMockDashboardMembers();

const MEMBERS_BY_ID = new Map(
  MOCK_DASHBOARD_MEMBERS.map((member) => [member.id, member]),
);

export function getMockMembersForSegment(
  segment: DashboardSegmentId,
): MockDashboardMember[] {
  return MOCK_DASHBOARD_MEMBERS.filter((member) =>
    member.segments.includes(segment),
  );
}

export function getMockDashboardMemberById(
  id: string,
): MockDashboardMember | null {
  return MEMBERS_BY_ID.get(id) ?? null;
}
