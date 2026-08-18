/**
 * Concierge Welcome Initiative mock data.
 * Replace MOCK_CONCIERGE_MEMBERS with Airtable/API results later.
 */

import type {
  ConciergeAttendance,
  ConciergeBertha,
  ConciergeDataQualityIssue,
  ConciergeMember,
  ConciergeOnboarding,
  ConciergeOnboardingDetail,
  ConciergeOutstandingItem,
  ConciergePriority,
  ConciergeStatus,
  ConciergeVerificationMethod,
  ConciergeWorkflow,
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

const VERIFIED_METHODS: ConciergeVerificationMethod[] = [
  "Verified Online",
  "Verified In Person (Pierce)",
  "Verified In Person (Door)",
];

const EVENT_NAMES = [
  "Masqué Atelier — June 27, 2026",
  "Masqué Salon — July 11, 2026",
  "Le Rêve Noir — July 25, 2026",
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

export function conciergeAttendanceLabel(
  member: ConciergeMember,
): ConciergeAttendance {
  return member.attendance.hasEverAttended ? "Attended" : "Never Attended";
}

export function conciergeBerthaLabel(member: ConciergeMember): ConciergeBertha {
  return member.berthaTicketPurchased ? "Purchased" : "No Ticket";
}

export function conciergeOnboardingLabel(
  member: ConciergeMember,
): ConciergeOnboarding {
  const {
    verificationMethod,
    memberAgreement,
    portalAccountCreated,
    portalLoginCompleted,
  } = member.onboarding;

  if (
    verificationMethod === "Not Verified" ||
    memberAgreement === "Missing" ||
    !portalAccountCreated ||
    !portalLoginCompleted
  ) {
    return "Incomplete";
  }

  return "Completed";
}

export function getConciergePriority(member: ConciergeMember): ConciergePriority {
  return member.concierge.status === "Not Contacted" &&
    conciergeOnboardingLabel(member) === "Incomplete"
    ? "High"
    : "Normal";
}

function emptyWorkflow(status: ConciergeStatus): ConciergeWorkflow {
  return {
    status,
    welcomeDate: "",
    lastContact: "",
    notes: "",
    escalation: "None",
  };
}

function completedOnboarding(
  index: number,
  useLegacyAgreement = false,
): ConciergeOnboardingDetail {
  return {
    verificationMethod: VERIFIED_METHODS[index % VERIFIED_METHODS.length],
    memberAgreement: useLegacyAgreement
      ? "Signed at Pierce (Legacy)"
      : "Signed in Portal",
    portalAccountCreated: true,
    portalLoginCompleted: true,
  };
}

function incompleteOnboarding(index: number): ConciergeOnboardingDetail {
  return {
    verificationMethod: "Not Verified",
    memberAgreement: "Missing",
    portalAccountCreated: index % 2 === 0,
    portalLoginCompleted: false,
  };
}

function outstandingFor(options: {
  berthaPurchased: boolean;
  onboarding: ConciergeOnboardingDetail;
  dataQualityIssues: ConciergeDataQualityIssue[];
  extra?: ConciergeOutstandingItem[];
}): ConciergeOutstandingItem[] {
  const items: ConciergeOutstandingItem[] = [...(options.extra ?? [])];

  if (options.onboarding.verificationMethod === "Not Verified") {
    items.push("Verification");
  }
  if (
    options.onboarding.memberAgreement === "Missing" ||
    options.onboarding.memberAgreement === "Signed at Pierce (Legacy)"
  ) {
    items.push("Member Agreement");
  }
  if (!options.onboarding.portalLoginCompleted) {
    items.push("Portal Login");
  }
  if (!options.berthaPurchased) items.push("Bertha");
  if (options.dataQualityIssues.length > 0) items.push("Data Quality");

  return [...new Set(items)];
}

const FEATURED_CONCIERGE_MEMBERS: ConciergeMember[] = [
  {
    id: "apr-1",
    name: "Emily Carter",
    phone: "+1 202-555-0132",
    email: "emily@example.com",
    approvalDate: "July 20, 2026",
    attendance: {
      hasEverAttended: false,
      lastEventAttended: "—",
    },
    berthaTicketPurchased: false,
    onboarding: {
      verificationMethod: "Verified Online",
      memberAgreement: "Signed in Portal",
      portalAccountCreated: true,
      portalLoginCompleted: true,
    },
    concierge: emptyWorkflow("Not Contacted"),
    outstandingItems: ["Bertha"],
    dataQualityIssues: [],
  },
  {
    id: "apr-2",
    name: "Sophia Martinez",
    phone: "+1 202-555-0145",
    email: "sophia@example.com",
    approvalDate: "July 28, 2026",
    attendance: {
      hasEverAttended: true,
      lastEventAttended: "Masqué Atelier — June 27, 2026",
    },
    berthaTicketPurchased: true,
    onboarding: {
      verificationMethod: "Verified In Person (Pierce)",
      memberAgreement: "Signed in Portal",
      portalAccountCreated: true,
      portalLoginCompleted: true,
    },
    concierge: {
      status: "Welcome Completed",
      welcomeDate: "2026-07-30",
      lastContact: "2026-07-30",
      notes:
        "Welcome call completed. Confirmed she already has her Bertha ticket and attended Atelier.",
      escalation: "None",
    },
    outstandingItems: [],
    dataQualityIssues: [],
  },
  {
    id: "apr-3",
    name: "Daniel Carter",
    phone: "+1 202-555-0178",
    email: "daniel@example.com",
    approvalDate: "August 5, 2026",
    attendance: {
      hasEverAttended: false,
      lastEventAttended: "—",
    },
    berthaTicketPurchased: false,
    onboarding: {
      verificationMethod: "Not Verified",
      memberAgreement: "Missing",
      portalAccountCreated: false,
      portalLoginCompleted: false,
    },
    concierge: {
      status: "Follow-up Needed",
      welcomeDate: "",
      lastContact: "2026-08-08",
      notes:
        "Reached out regarding outstanding onboarding. Follow-up needed on verification and portal login.",
      escalation: "Concierge Follow-up",
    },
    outstandingItems: [
      "Verification",
      "Member Agreement",
      "Portal Login",
      "Bertha",
    ],
    dataQualityIssues: ["Missing Profile Information"],
  },
  {
    id: "apr-4",
    name: "Olivia Bennett",
    phone: "+1 202-555-0191",
    email: "olivia@example.com",
    approvalDate: "August 10, 2026",
    attendance: {
      hasEverAttended: true,
      lastEventAttended: "Masqué Salon — July 11, 2026",
    },
    berthaTicketPurchased: false,
    onboarding: {
      verificationMethod: "Verified Online",
      memberAgreement: "Signed in Portal",
      portalAccountCreated: true,
      portalLoginCompleted: true,
    },
    concierge: {
      status: "Conversation Active",
      welcomeDate: "2026-08-12",
      lastContact: "2026-08-14",
      notes:
        "Conversation in progress about upcoming events and purchasing a Bertha ticket.",
      escalation: "None",
    },
    outstandingItems: ["Bertha"],
    dataQualityIssues: [],
  },
];

function workflowForStatus(
  status: ConciergeStatus,
  index: number,
): ConciergeWorkflow {
  if (status === "Not Contacted") return emptyWorkflow(status);

  const month = index % 2 === 0 ? "07" : "08";
  const day = pad4(10 + (index % 18)).slice(-2);

  return {
    status,
    welcomeDate: status === "Deferred" || status === "Do Not Contact" ? "" : `2026-${month}-${day}`,
    lastContact: `2026-${month}-${day}`,
    notes:
      status === "Do Not Contact"
        ? "Member requested no further outreach."
        : status === "Follow-up Needed"
          ? "Needs a second touch on outstanding items."
          : status === "Conversation Active"
            ? "Open conversation about events and next steps."
            : status === "Deferred"
              ? "Deferred until the member is available next month."
              : "Welcome outreach completed.",
    escalation:
      status === "Follow-up Needed" && index % 12 === 0
        ? "Operations Follow-up"
        : status === "Do Not Contact"
          ? "None"
          : "None",
  };
}

function createMockConciergeMembers(): ConciergeMember[] {
  const members = [...FEATURED_CONCIERGE_MEMBERS];

  for (let i = members.length; i < TARGET_COUNT; i += 1) {
    const forceHighPriority = i % 10 === 0;
    const onboardingIncomplete = forceHighPriority || i % 9 === 0;
    const useLegacyAgreement = !onboardingIncomplete && i % 17 === 0;
    const hasAttended = i % 2 === 1;
    const berthaPurchased = i % 3 === 0;
    const conciergeStatus = forceHighPriority
      ? "Not Contacted"
      : CONCIERGE_STATUSES[i % CONCIERGE_STATUSES.length];
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last =
      LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const onboarding = onboardingIncomplete
      ? incompleteOnboarding(i)
      : completedOnboarding(i, useLegacyAgreement);
    const dataQualityIssues: ConciergeDataQualityIssue[] =
      i % 15 === 0
        ? ["Duplicate Phone Number"]
        : i % 21 === 0
          ? ["Missing Profile Information"]
          : [];
    const extraOutstanding: ConciergeOutstandingItem[] = [];
    if (i % 11 === 0) extraOutstanding.push("Dispatches");

    members.push({
      id: `conc-${i + 1}`,
      name: `${first} ${last}`,
      phone: `+1 202-555-${pad4(1200 + i)}`,
      email: `${first}.${last}${i}@example.com`.toLowerCase(),
      approvalDate: formatLongDate(2026, 5 + (i % 3), 1 + (i % 27)),
      attendance: {
        hasEverAttended: hasAttended,
        lastEventAttended: hasAttended
          ? EVENT_NAMES[i % EVENT_NAMES.length]
          : "—",
      },
      berthaTicketPurchased: berthaPurchased,
      onboarding,
      concierge: workflowForStatus(conciergeStatus, i),
      outstandingItems: outstandingFor({
        berthaPurchased,
        onboarding,
        dataQualityIssues,
        extra: extraOutstanding,
      }),
      dataQualityIssues,
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
