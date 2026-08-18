/**
 * Concierge Welcome Initiative mock data.
 * Replace MOCK_CONCIERGE_MEMBERS with Airtable/API results later.
 */

import type {
  ConciergeAttendance,
  ConciergeBertha,
  ConciergeMember,
  ConciergeOnboarding,
  ConciergeOutstandingItem,
  ConciergePriority,
  ConciergeStatus,
} from "@/types/admin-concierge";

const TARGET_COUNT = 84;

const CONCIERGE_STATUSES: ConciergeStatus[] = [
  "Not Contacted",
  "Welcome Completed",
  "Conversation Active",
  "Follow-up Needed",
  "Deferred",
  "Do Not Contact",
];

const ATTENDANCE: ConciergeAttendance[] = ["Never Attended", "Attended"];
const BERTHA: ConciergeBertha[] = ["No Ticket", "Purchased"];
const ONBOARDING: ConciergeOnboarding[] = ["Completed", "Incomplete"];

const OUTSTANDING_POOL: ConciergeOutstandingItem[] = [
  "Verification",
  "Member Agreement",
  "Portal Login",
  "Dispatches",
  "Bertha",
  "Data Quality",
];

const FIRST_NAMES = [
  "Ava",
  "Noah",
  "Mia",
  "Liam",
  "Chloe",
  "Ethan",
  "Zoe",
  "Henry",
  "Grace",
  "Jack",
  "Lily",
  "Owen",
  "Nora",
  "Caleb",
  "Hazel",
  "Leo",
  "Stella",
  "Isaac",
  "Violet",
  "Ryan",
];

const LAST_NAMES = [
  "Brooks",
  "Reed",
  "Hayes",
  "Foster",
  "Bennett",
  "Cole",
  "Morgan",
  "Price",
  "Hughes",
  "Ward",
  "Powell",
  "Jenkins",
  "West",
  "Sutton",
  "Hart",
  "Bishop",
  "Grant",
  "Palmer",
  "Blake",
  "Warren",
];

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

function outstandingFor(index: number, bertha: ConciergeBertha, onboarding: ConciergeOnboarding): ConciergeOutstandingItem[] {
  if (index % 7 === 0) return [];

  const items: ConciergeOutstandingItem[] = [];
  if (bertha === "No Ticket") items.push("Bertha");
  if (onboarding === "Incomplete") {
    items.push("Verification", "Member Agreement", "Portal Login");
  }
  if (index % 11 === 0) items.push("Dispatches");
  if (index % 13 === 0) items.push("Data Quality");

  return [...new Set(items)];
}

export function getConciergePriority(member: ConciergeMember): ConciergePriority {
  return member.conciergeStatus === "Not Contacted" &&
    member.onboarding === "Incomplete"
    ? "High"
    : "Normal";
}

const FEATURED_CONCIERGE_MEMBERS: ConciergeMember[] = [
  {
    id: "apr-1",
    name: "Emily Carter",
    phone: "+1 202-555-0132",
    approvalDate: "July 20, 2026",
    attendance: "Never Attended",
    bertha: "No Ticket",
    onboarding: "Completed",
    conciergeStatus: "Not Contacted",
    outstandingItems: ["Bertha"],
  },
  {
    id: "apr-2",
    name: "Sophia Martinez",
    phone: "+1 202-555-0145",
    approvalDate: "July 28, 2026",
    attendance: "Attended",
    bertha: "Purchased",
    onboarding: "Completed",
    conciergeStatus: "Welcome Completed",
    outstandingItems: [],
  },
  {
    id: "apr-3",
    name: "Daniel Carter",
    phone: "+1 202-555-0178",
    approvalDate: "August 5, 2026",
    attendance: "Never Attended",
    bertha: "No Ticket",
    onboarding: "Incomplete",
    conciergeStatus: "Follow-up Needed",
    outstandingItems: [
      "Verification",
      "Member Agreement",
      "Portal Login",
      "Bertha",
    ],
  },
  {
    id: "apr-4",
    name: "Olivia Bennett",
    phone: "+1 202-555-0191",
    approvalDate: "August 10, 2026",
    attendance: "Attended",
    bertha: "No Ticket",
    onboarding: "Completed",
    conciergeStatus: "Conversation Active",
    outstandingItems: ["Bertha"],
  },
];

function createMockConciergeMembers(): ConciergeMember[] {
  const members = [...FEATURED_CONCIERGE_MEMBERS];

  for (let i = members.length; i < TARGET_COUNT; i += 1) {
    const attendance = ATTENDANCE[i % ATTENDANCE.length];
    const bertha = BERTHA[i % BERTHA.length];
    const forceHighPriority = i % 10 === 0;
    const onboarding = forceHighPriority
      ? "Incomplete"
      : i % 9 === 0
        ? "Incomplete"
        : ONBOARDING[i % ONBOARDING.length];
    const conciergeStatus = forceHighPriority
      ? "Not Contacted"
      : CONCIERGE_STATUSES[i % CONCIERGE_STATUSES.length];
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];

    members.push({
      id: `conc-${i + 1}`,
      name: `${first} ${last}`,
      phone: `+1 202-555-${pad4(1200 + i)}`,
      approvalDate: formatLongDate(2026, 5 + (i % 3), 1 + (i % 27)),
      attendance,
      bertha,
      onboarding,
      conciergeStatus,
      outstandingItems: outstandingFor(i, bertha, onboarding),
    });
  }

  return members;
}

export const MOCK_CONCIERGE_MEMBERS = createMockConciergeMembers();

const MEMBERS_BY_ID = new Map(
  MOCK_CONCIERGE_MEMBERS.map((member) => [member.id, member]),
);

export function getConciergeMemberById(id: string): ConciergeMember | null {
  return MEMBERS_BY_ID.get(id) ?? null;
}
