import "server-only";

import { cache } from "react";
import {
  fetchAttendanceByPersonIds,
  type AttendanceByPersonResult,
} from "@/lib/admin/airtable-attendance";
import {
  fetchBerthaByPersonIds,
  type BerthaByPersonResult,
} from "@/lib/admin/airtable-bertha";
import { formatApprovalDate, parseDateOnlyMs } from "@/lib/admin/airtable-dates";
import { getAirtableConfig } from "@/lib/admin/config";
import { VETTING_STATUS_APPROVED } from "@/lib/admin/government-id";
import { deriveOutstandingItems, deriveDataQualityIssues } from "@/lib/admin/outstanding-items";
import { getPeopleTableName } from "@/lib/portal/airtable-people-referral";
import type { ConciergeMember } from "@/types/admin-concierge";

const APPLICATIONS_TABLE =
  process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";

const NAME_FIELD = "Name";
const VETTING_STATUS_FIELD = "Vetting Status";
const LAST_MODIFIED_FIELD = "Last Modified";
const LINKED_PERSON_FIELD = "Linked Person";

const APPLICATION_FIELDS = [
  NAME_FIELD,
  VETTING_STATUS_FIELD,
  LAST_MODIFIED_FIELD,
  LINKED_PERSON_FIELD,
] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 60;

interface AirtableRecord {
  id: string;
  fields?: Record<string, unknown>;
}

interface AirtableListResponse {
  records?: AirtableRecord[];
  offset?: string;
  error?: { type?: string; message?: string };
}

export type ListRecentlyApprovedResult =
  | { ok: true; members: ConciergeMember[] }
  | { ok: false; error: string; status: number };

type AirtableQueryResult =
  | { ok: true; records: AirtableRecord[] }
  | {
      ok: false;
      status: number;
      type: string | null;
      message: string;
    };

function asTrimmedString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (Array.isArray(value) && value.length === 1) {
    return asTrimmedString(value[0]);
  }
  return "";
}

function isRecordId(value: string): boolean {
  return /^rec[a-zA-Z0-9]{10,}$/.test(value);
}

function recordIds(value: unknown): string[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => recordIds(item)))];
  }
  if (typeof value === "object") {
    const record = value as { id?: unknown; recordId?: unknown };
    return recordIds(record.id ?? record.recordId);
  }
  const single = asTrimmedString(value);
  if (isRecordId(single)) return [single];
  if (single.includes(",")) {
    return [
      ...new Set(
        single
          .split(",")
          .flatMap((part) => recordIds(part.trim()))
          .filter((id) => isRecordId(id)),
      ),
    ];
  }
  return [];
}

function toDateInputValue(value: unknown): string {
  const raw = asTrimmedString(value);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const ms = parseDateOnlyMs(raw);
  if (ms == null) return "";
  return utcDateLabel(ms);
}

function formatPeopleDateTime(value: unknown): string {
  const raw = asTrimmedString(value);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return formatApprovalDate(raw);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return formatApprovalDate(raw);
  return parsed.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function peopleDisplayFields(contact: PeopleContact | undefined): Pick<
  ConciergeMember,
  | "onboardingState"
  | "peopleConciergeStatus"
  | "complianceState"
  | "conciergeWelcomeDate"
  | "lastConciergeContact"
  | "conciergeNotes"
  | "peopleEscalation"
  | "verificationMethod"
  | "idVerified"
  | "idVerificationDate"
  | "memberAgreementStatus"
  | "portalAccessState"
  | "portalAccountCreated"
  | "lastPortalLogin"
  | "portalInvitationSentDate"
  | "instagramHandle"
  | "duplicateFlag"
  | "membershipStatus"
> {
  return {
    onboardingState: contact?.onboardingState ?? "",
    peopleConciergeStatus: contact?.conciergeStatus ?? "",
    complianceState: contact?.complianceState ?? "",
    conciergeWelcomeDate: contact?.conciergeWelcomeDate ?? "",
    lastConciergeContact: contact?.lastConciergeContact ?? "",
    conciergeNotes: contact?.conciergeNotes ?? "",
    peopleEscalation: contact?.escalation ?? "",
    verificationMethod: contact?.verificationMethod ?? "",
    idVerified: contact?.idVerified ?? false,
    idVerificationDate: contact?.idVerificationDate ?? "",
    memberAgreementStatus: contact?.memberAgreementStatus ?? "",
    portalAccessState: contact?.portalAccessState ?? "",
    portalAccountCreated: contact?.portalAccountCreated ?? false,
    lastPortalLogin: contact?.lastPortalLogin ?? "",
    portalInvitationSentDate: contact?.portalInvitationSentDate ?? "",
    instagramHandle: contact?.instagramHandle ?? "",
    duplicateFlag: contact?.duplicateFlag ?? false,
    membershipStatus: contact?.membershipStatus ?? "",
  };
}

function displayOrDash(value: string): string {
  return value.trim() || "—";
}

function utcDateLabel(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function todayUtcMs(now = new Date()): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

const ONBOARDING_STATE_FIELD = "Onboarding State";
const CONCIERGE_STATUS_FIELD = "Concierge Status";
const MEMBERSHIP_STATUS_FIELD = "Membership Status";
const COMPLIANCE_STATE_FIELD = "Compliance State";
const FOLLOW_UP_REQUIRED_FIELD = "Follow-Up Required";
const GOV_ID_FIELD = "Gov ID";
const CONCIERGE_WELCOME_DATE_FIELD = "Concierge Welcome Date";
const LAST_CONCIERGE_CONTACT_FIELD = "Last Concierge Contact";
const CONCIERGE_NOTES_FIELD = "Concierge Notes";
const ESCALATION_FIELD = "Escalation";
const VERIFICATION_METHOD_FIELD = "Verification Method";
const ID_VERIFIED_FIELD = "ID Verified";
const ID_VERIFICATION_DATE_FIELD = "ID Verification Date";
const MEMBER_AGREEMENT_STATUS_FIELD = "Member Agreement Status";
const PORTAL_ACCESS_STATE_FIELD = "Portal Access State";
const PORTAL_ACCOUNT_CREATED_FIELD = "Portal Account Created";
const LAST_PORTAL_LOGIN_FIELD = "Last Portal Login";
const PORTAL_INVITATION_SENT_DATE_FIELD = "Portal Invitation Sent Date";
const INSTAGRAM_HANDLE_FIELD = "Instagram Handle";
const DUPLICATE_FLAG_FIELD = "Duplicate Flag";

function findFieldKey(
  keys: string[],
  fieldName: string,
): string | undefined {
  return (
    keys.find((key) => key === fieldName) ||
    keys.find((key) => key.toLowerCase() === fieldName.toLowerCase())
  );
}

function isFollowUpRequiredCheckbox(value: unknown): boolean {
  if (value === true) return true;
  if (value === false || value == null || value === "") return false;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "true" ||
      normalized === "checked" ||
      normalized === "yes" ||
      normalized === "1"
    );
  }
  return false;
}

function hasGovIdAttachment(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) {
    return value.some((item) => looksLikeAttachment(item));
  }
  return looksLikeAttachment(value);
}

function looksLikeAttachment(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const record = value as { url?: unknown; filename?: unknown; id?: unknown };
  return (
    typeof record.url === "string" ||
    typeof record.filename === "string" ||
    typeof record.id === "string"
  );
}

type PeopleContact = {
  name: string;
  email: string;
  phone: string;
  onboardingState: string;
  conciergeStatus: string;
  membershipStatus: string;
  complianceState: string;
  followUpRequired: boolean;
  hasGovId: boolean;
  conciergeWelcomeDate: string;
  lastConciergeContact: string;
  conciergeNotes: string;
  escalation: string;
  verificationMethod: string;
  idVerified: boolean;
  idVerificationDate: string;
  memberAgreementStatus: string;
  portalAccessState: string;
  portalAccountCreated: boolean;
  lastPortalLogin: string;
  portalInvitationSentDate: string;
  instagramHandle: string;
  duplicateFlag: boolean;
};

function peopleContactFromFields(
  fields: Record<string, unknown> | undefined,
): PeopleContact {
  if (!fields) {
    return {
      name: "",
      email: "",
      phone: "",
      onboardingState: "",
      conciergeStatus: "",
      membershipStatus: "",
      complianceState: "",
      followUpRequired: false,
      hasGovId: false,
      conciergeWelcomeDate: "",
      lastConciergeContact: "",
      conciergeNotes: "",
      escalation: "",
      verificationMethod: "",
      idVerified: false,
      idVerificationDate: "",
      memberAgreementStatus: "",
      portalAccessState: "",
      portalAccountCreated: false,
      lastPortalLogin: "",
      portalInvitationSentDate: "",
      instagramHandle: "",
      duplicateFlag: false,
    };
  }
  const email = asTrimmedString(fields.Email);
  const keys = Object.keys(fields);
  const phoneKey =
    findFieldKey(keys, "Phone") ||
    keys.find((key) => key.toLowerCase() === "phone");
  const nameKey =
    findFieldKey(keys, "Full Name") || findFieldKey(keys, NAME_FIELD);
  const onboardingKey = findFieldKey(keys, ONBOARDING_STATE_FIELD);
  const conciergeKey = findFieldKey(keys, CONCIERGE_STATUS_FIELD);
  const membershipKey = findFieldKey(keys, MEMBERSHIP_STATUS_FIELD);
  const complianceKey = findFieldKey(keys, COMPLIANCE_STATE_FIELD);
  const followUpKey = findFieldKey(keys, FOLLOW_UP_REQUIRED_FIELD);
  const govIdKey = findFieldKey(keys, GOV_ID_FIELD);
  const welcomeDateKey = findFieldKey(keys, CONCIERGE_WELCOME_DATE_FIELD);
  const lastContactKey = findFieldKey(keys, LAST_CONCIERGE_CONTACT_FIELD);
  const notesKey = findFieldKey(keys, CONCIERGE_NOTES_FIELD);
  const escalationKey = findFieldKey(keys, ESCALATION_FIELD);
  const verificationMethodKey = findFieldKey(keys, VERIFICATION_METHOD_FIELD);
  const idVerifiedKey = findFieldKey(keys, ID_VERIFIED_FIELD);
  const idVerificationDateKey = findFieldKey(keys, ID_VERIFICATION_DATE_FIELD);
  const memberAgreementKey = findFieldKey(keys, MEMBER_AGREEMENT_STATUS_FIELD);
  const portalAccessKey = findFieldKey(keys, PORTAL_ACCESS_STATE_FIELD);
  const portalAccountKey = findFieldKey(keys, PORTAL_ACCOUNT_CREATED_FIELD);
  const lastPortalLoginKey = findFieldKey(keys, LAST_PORTAL_LOGIN_FIELD);
  const invitationSentKey = findFieldKey(keys, PORTAL_INVITATION_SENT_DATE_FIELD);
  const instagramKey = findFieldKey(keys, INSTAGRAM_HANDLE_FIELD);
  const duplicateFlagKey = findFieldKey(keys, DUPLICATE_FLAG_FIELD);

  return {
    name: nameKey ? asPeopleSelectValue(fields[nameKey]) : "",
    email,
    phone: phoneKey ? asTrimmedString(fields[phoneKey]) : "",
    onboardingState: onboardingKey
      ? asPeopleSelectValue(fields[onboardingKey])
      : "",
    conciergeStatus: conciergeKey
      ? asPeopleSelectValue(fields[conciergeKey])
      : "",
    membershipStatus: membershipKey
      ? asPeopleSelectValue(fields[membershipKey])
      : "",
    complianceState: complianceKey
      ? asPeopleSelectValue(fields[complianceKey])
      : "",
    followUpRequired: followUpKey
      ? isFollowUpRequiredCheckbox(fields[followUpKey])
      : false,
    hasGovId: govIdKey ? hasGovIdAttachment(fields[govIdKey]) : false,
    conciergeWelcomeDate: welcomeDateKey
      ? toDateInputValue(fields[welcomeDateKey])
      : "",
    lastConciergeContact: lastContactKey
      ? toDateInputValue(fields[lastContactKey])
      : "",
    conciergeNotes: notesKey ? asTrimmedString(fields[notesKey]) : "",
    escalation: escalationKey
      ? asPeopleSelectValue(fields[escalationKey])
      : "",
    verificationMethod: verificationMethodKey
      ? asPeopleSelectValue(fields[verificationMethodKey])
      : "",
    idVerified: idVerifiedKey
      ? isFollowUpRequiredCheckbox(fields[idVerifiedKey])
      : false,
    idVerificationDate: idVerificationDateKey
      ? formatApprovalDate(asTrimmedString(fields[idVerificationDateKey])) ||
        toDateInputValue(fields[idVerificationDateKey])
      : "",
    memberAgreementStatus: memberAgreementKey
      ? asPeopleSelectValue(fields[memberAgreementKey])
      : "",
    portalAccessState: portalAccessKey
      ? asPeopleSelectValue(fields[portalAccessKey])
      : "",
    portalAccountCreated: portalAccountKey
      ? isFollowUpRequiredCheckbox(fields[portalAccountKey])
      : false,
    lastPortalLogin: lastPortalLoginKey
      ? formatPeopleDateTime(fields[lastPortalLoginKey])
      : "",
    portalInvitationSentDate: invitationSentKey
      ? formatApprovalDate(asTrimmedString(fields[invitationSentKey])) ||
        toDateInputValue(fields[invitationSentKey])
      : "",
    instagramHandle: instagramKey
      ? asTrimmedString(fields[instagramKey])
      : "",
    duplicateFlag: duplicateFlagKey
      ? isFollowUpRequiredCheckbox(fields[duplicateFlagKey])
      : false,
  };
}

function asPeopleSelectValue(value: unknown): string {
  if (value == null || value === "") return "";
  if (Array.isArray(value) && value.length === 1) {
    return asPeopleSelectValue(value[0]);
  }
  if (typeof value === "object") {
    const record = value as { name?: unknown; label?: unknown };
    return asTrimmedString(record.name) || asTrimmedString(record.label);
  }
  return asTrimmedString(value);
}

function logAirtableError(
  label: string,
  details: {
    status: number | null;
    type: string | null;
    message: string;
    table: string;
    fields: string[];
    filterByFormula: string | null;
  },
) {
  console.error("Recently Approved Airtable error", {
    label,
    status: details.status,
    type: details.type,
    message: details.message,
    table: details.table,
    fields: details.fields,
    filterByFormula: details.filterByFormula,
  });
}

async function queryTable(options: {
  table: string;
  maxRecords?: number;
  fields?: string[];
  filterByFormula?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  paginate?: boolean;
}): Promise<AirtableQueryResult> {
  let accessToken: string;
  let baseId: string;
  try {
    ({ accessToken, baseId } = getAirtableConfig());
  } catch {
    return {
      ok: false,
      status: 503,
      type: "CONFIG",
      message: "Missing Airtable configuration",
    };
  }

  const encodedTable = encodeURIComponent(options.table);
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  try {
    do {
      const params = new URLSearchParams({
        pageSize: String(Math.min(options.maxRecords ?? 100, 100)),
      });
      if (options.maxRecords && options.paginate === false) {
        params.set("maxRecords", String(options.maxRecords));
      }
      if (options.filterByFormula) {
        params.set("filterByFormula", options.filterByFormula);
      }
      for (const field of options.fields ?? []) {
        params.append("fields[]", field);
      }
      if (options.sortField) {
        params.append("sort[0][field]", options.sortField);
        params.append("sort[0][direction]", options.sortDirection ?? "desc");
      }
      if (offset) params.set("offset", offset);

      const requestUrl = `https://api.airtable.com/v0/${baseId}/${encodedTable}?${params.toString()}`;
      const response = await fetch(requestUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        let type: string | null = null;
        let message = "";
        try {
          const raw = await response.text();
          try {
            const payload = JSON.parse(raw) as AirtableListResponse;
            type = payload.error?.type ?? null;
            message = payload.error?.message ?? raw.slice(0, 300);
          } catch {
            message = raw.slice(0, 300);
          }
        } catch {
          message = "[unreadable]";
        }

        return { ok: false, status: response.status, type, message };
      }

      const data = (await response.json()) as AirtableListResponse;
      records.push(...(data.records ?? []));
      offset = options.paginate === false ? undefined : data.offset;
      if (options.maxRecords && records.length >= options.maxRecords) {
        return { ok: true, records: records.slice(0, options.maxRecords) };
      }
    } while (offset);

    return { ok: true, records };
  } catch (error) {
    return {
      ok: false,
      status: 503,
      type: "NETWORK",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function escapeAirtableFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function fetchPeopleContactsByIds(
  ids: string[],
): Promise<{
  contacts: Map<string, PeopleContact>;
  failed: boolean;
}> {
  const unique = [...new Set(ids.filter((id) => isRecordId(id)))];
  const contacts = new Map<string, PeopleContact>();
  if (unique.length === 0) return { contacts, failed: false };

  const peopleTable = getPeopleTableName();
  let failed = false;

  for (let index = 0; index < unique.length; index += 20) {
    const chunk = unique.slice(index, index + 20);
    const formula =
      chunk.length === 1
        ? `RECORD_ID()='${escapeAirtableFormulaString(chunk[0])}'`
        : `OR(${chunk
            .map((id) => `RECORD_ID()='${escapeAirtableFormulaString(id)}'`)
            .join(",")})`;

    const result = await queryTable({
      table: peopleTable,
      filterByFormula: formula,
      paginate: true,
    });

    if (!result.ok) {
      failed = true;
      logAirtableError("People enrichment", {
        status: result.status,
        type: result.type,
        message: result.message,
        table: peopleTable,
        fields: [],
        filterByFormula: formula,
      });
      continue;
    }

    for (const record of result.records) {
      if (!record.id) continue;
      contacts.set(record.id, peopleContactFromFields(record.fields));
    }
  }

  return { contacts, failed };
}

/** Shape placeholders only. Do not display these as business statuses. */
function unresolvedConciergeFields(): Pick<
  ConciergeMember,
  | "attendance"
  | "berthaTicketPurchased"
  | "onboarding"
  | "concierge"
  | "outstandingItems"
  | "dataQualityIssues"
  | "fieldAvailability"
> {
  return {
    attendance: {
      hasEverAttended: false,
      lastEventAttended: "",
    },
    berthaTicketPurchased: false,
    onboarding: {
      verificationMethod: "Not Verified",
      memberAgreement: "Missing",
      portalAccountCreated: false,
      portalLoginCompleted: false,
    },
    concierge: {
      status: "Not Contacted",
      welcomeDate: "",
      lastContact: "",
      notes: "",
      escalation: "None",
    },
    outstandingItems: [],
    dataQualityIssues: [],
    fieldAvailability: {
      attendance: false,
      bertha: false,
      onboarding: false,
      conciergeStatus: false,
      outstandingItems: false,
    },
  };
}

function applyAttendance(
  member: ConciergeMember,
  personId: string | undefined,
  attendanceResult: AttendanceByPersonResult,
): ConciergeMember {
  if (!attendanceResult.ok || !personId) return member;
  const attendance = attendanceResult.byPerson.get(personId);
  if (!attendance) return member;
  return {
    ...member,
    attendance,
    fieldAvailability: {
      attendance: true,
      bertha: member.fieldAvailability?.bertha ?? false,
      onboarding: member.fieldAvailability?.onboarding ?? false,
      conciergeStatus: member.fieldAvailability?.conciergeStatus ?? false,
      outstandingItems: member.fieldAvailability?.outstandingItems ?? false,
    },
  };
}

function applyBertha(
  member: ConciergeMember,
  personId: string | undefined,
  berthaResult: BerthaByPersonResult,
): ConciergeMember {
  if (!berthaResult.ok || !personId) return member;
  const bertha = berthaResult.byPerson.get(personId);
  if (!bertha) return member;
  return {
    ...member,
    berthaTicketPurchased: bertha.purchased,
    fieldAvailability: {
      attendance: member.fieldAvailability?.attendance ?? false,
      bertha: true,
      onboarding: member.fieldAvailability?.onboarding ?? false,
      conciergeStatus: member.fieldAvailability?.conciergeStatus ?? false,
      outstandingItems: member.fieldAvailability?.outstandingItems ?? false,
    },
  };
}

function applyOutstanding(
  member: ConciergeMember,
  contact: PeopleContact | undefined,
): ConciergeMember {
  if (!contact) return member;
  const dataQualityIssues = deriveDataQualityIssues({
    email: contact.email,
    phone: contact.phone,
    instagramHandle: contact.instagramHandle,
    duplicateFlag: contact.duplicateFlag,
  });
  return {
    ...member,
    dataQualityIssues,
    outstandingItems: deriveOutstandingItems({
      membershipStatus: contact.membershipStatus,
      onboardingState: contact.onboardingState,
      complianceState: contact.complianceState,
      followUpRequired: contact.followUpRequired,
      hasGovId: contact.hasGovId,
      escalation: contact.escalation,
      verificationMethod: contact.verificationMethod,
      idVerified: contact.idVerified,
      memberAgreementStatus: contact.memberAgreementStatus,
      portalAccountCreated: contact.portalAccountCreated,
      lastPortalLogin: contact.lastPortalLogin,
      berthaTicketPurchased: member.fieldAvailability?.bertha
        ? member.berthaTicketPurchased
        : null,
      hasDataQualityIssues: dataQualityIssues.length > 0,
    }),
    fieldAvailability: {
      attendance: member.fieldAvailability?.attendance ?? false,
      bertha: member.fieldAvailability?.bertha ?? false,
      onboarding: member.fieldAvailability?.onboarding ?? false,
      conciergeStatus: member.fieldAvailability?.conciergeStatus ?? false,
      outstandingItems: true,
    },
  };
}

/**
 * Applications with Vetting Status = approved whose Last Modified
 * (Vetting Status last-modified time) falls within the last 60 days.
 */
export async function listRecentlyApprovedMembers(): Promise<ListRecentlyApprovedResult> {
  const filterByFormula = `LOWER({${VETTING_STATUS_FIELD}})='${VETTING_STATUS_APPROVED}'`;

  try {
    let result = await queryTable({
      table: APPLICATIONS_TABLE,
      fields: [...APPLICATION_FIELDS],
      filterByFormula,
      sortField: LAST_MODIFIED_FIELD,
      sortDirection: "desc",
      paginate: true,
    });

    if (!result.ok) {
      logAirtableError("listRecentlyApprovedMembers sorted", {
        status: result.status,
        type: result.type,
        message: result.message,
        table: APPLICATIONS_TABLE,
        fields: [...APPLICATION_FIELDS],
        filterByFormula,
      });
      result = await queryTable({
        table: APPLICATIONS_TABLE,
        fields: [...APPLICATION_FIELDS],
        filterByFormula,
        paginate: true,
      });
    }

    if (!result.ok) {
      logAirtableError("listRecentlyApprovedMembers", {
        status: result.status,
        type: result.type,
        message: result.message,
        table: APPLICATIONS_TABLE,
        fields: [...APPLICATION_FIELDS],
        filterByFormula,
      });
      return {
        ok: false,
        error: "Unable to load recently approved members right now.",
        status: result.status === 429 ? 429 : result.status === 404 ? 404 : 503,
      };
    }

    const todayMs = todayUtcMs();
    const cutoffMs = todayMs - LOOKBACK_DAYS * MS_PER_DAY;
    const approvedCount = result.records.length;

    const recent = result.records
      .map((record) => {
        if (!record?.id) return null;
        const fields = record.fields ?? {};
        const lastModifiedRaw = asTrimmedString(fields[LAST_MODIFIED_FIELD]);
        const approvalMs = parseDateOnlyMs(lastModifiedRaw);
        if (approvalMs == null) return null;
        if (approvalMs < cutoffMs || approvalMs > todayMs) return null;
        return { record, fields, lastModifiedRaw, approvalMs };
      })
      .filter(
        (
          row,
        ): row is {
          record: AirtableRecord;
          fields: Record<string, unknown>;
          lastModifiedRaw: string;
          approvalMs: number;
        } => row != null,
      )
      .sort((left, right) => right.approvalMs - left.approvalMs);

    const peopleIds = [
      ...new Set(
        recent.flatMap((row) => recordIds(row.fields[LINKED_PERSON_FIELD])),
      ),
    ];
    const [enrichment, attendanceResult, berthaResult] = await Promise.all([
      fetchPeopleContactsByIds(peopleIds),
      fetchAttendanceByPersonIds(peopleIds),
      fetchBerthaByPersonIds(peopleIds),
    ]);

    console.error("[Recently Approved]", {
      approvedApplicationsRetrieved: approvedCount,
      cutoffDate: utcDateLabel(cutoffMs),
      remainingAfter60DayFilter: recent.length,
      peopleEnrichmentFailed: enrichment.failed,
      attendanceLookupFailed: !attendanceResult.ok,
      berthaLookupFailed: !berthaResult.ok,
    });

    const members = recent.map((row) => {
      const personId = recordIds(row.fields[LINKED_PERSON_FIELD])[0];
      const contact = personId ? enrichment.contacts.get(personId) : undefined;
      return applyOutstanding(
        applyBertha(
          applyAttendance(
            {
              id: personId && isRecordId(personId) ? personId : "",
              applicationId: row.record.id,
              name: displayOrDash(asTrimmedString(row.fields[NAME_FIELD])),
              phone: displayOrDash(contact?.phone ?? ""),
              email: displayOrDash(contact?.email ?? ""),
              approvalDate: formatApprovalDate(row.lastModifiedRaw),
              ...unresolvedConciergeFields(),
              ...peopleDisplayFields(contact),
            },
            personId,
            attendanceResult,
          ),
          personId,
          berthaResult,
        ),
        contact,
      );
    });

    for (const row of recent.slice(0, 2)) {
      const linkedPersonValue = row.fields[LINKED_PERSON_FIELD];
      const peopleRecordId = recordIds(linkedPersonValue)[0];
      const debug =
        attendanceResult.ok && peopleRecordId
          ? attendanceResult.debugByPerson.get(peopleRecordId)
          : undefined;
      const attendance =
        attendanceResult.ok && peopleRecordId
          ? attendanceResult.byPerson.get(peopleRecordId)
          : undefined;
      const finalCalculatedAttendanceStatus = !attendanceResult.ok
        ? "unresolved"
        : !peopleRecordId
          ? "unresolved"
          : attendance?.hasEverAttended
            ? "Attended"
            : "Never Attended";

      console.error("[Recently Approved Attendance Debug]", {
        applicationName: asTrimmedString(row.fields[NAME_FIELD]),
        applicationRecordId: row.record.id,
        applicationLinkedPerson: linkedPersonValue ?? null,
        peopleRecordIdUsedForMatching: peopleRecordId ?? null,
        numberOfMatchingAttendanceRecords: debug?.matchingCount ?? 0,
        attendanceStatusValuesFound: debug?.statuses ?? [],
        finalCalculatedAttendanceStatus,
      });
    }

    for (const row of recent.slice(0, 3)) {
      const linkedPersonValue = row.fields[LINKED_PERSON_FIELD];
      const peopleRecordId = recordIds(linkedPersonValue)[0];
      const berthaDebug =
        berthaResult.ok && peopleRecordId
          ? berthaResult.debugByPerson.get(peopleRecordId)
          : undefined;
      const bertha =
        berthaResult.ok && peopleRecordId
          ? berthaResult.byPerson.get(peopleRecordId)
          : undefined;
      const finalBerthaStatus = !berthaResult.ok
        ? "unresolved"
        : !peopleRecordId
          ? "unresolved"
          : bertha?.purchased
            ? "Purchased"
            : "No Ticket";

      console.error("[Recently Approved Bertha Debug]", {
        memberName: asTrimmedString(row.fields[NAME_FIELD]),
        applicationRecordId: row.record.id,
        linkedPersonId: peopleRecordId ?? null,
        matchingTicketBuyersGuestRecords:
          berthaDebug?.matchingRecords.map((match) => ({
            recordId: match.recordId,
            eventName: match.eventName,
            ticketType: match.ticketType,
          })) ?? [],
        eventName:
          berthaDebug?.matchingRecords.map((match) => match.eventName) ?? [],
        ticketType:
          berthaDebug?.matchingRecords.map((match) => match.ticketType) ?? [],
        finalBerthaStatus,
      });
    }

    return { ok: true, members };
  } catch (error) {
    logAirtableError("listRecentlyApprovedMembers", {
      status: 503,
      type: "NETWORK",
      message: error instanceof Error ? error.message : String(error),
      table: APPLICATIONS_TABLE,
      fields: [...APPLICATION_FIELDS],
      filterByFormula,
    });
    return {
      ok: false,
      error: "Unable to load recently approved members right now.",
      status: 503,
    };
  }
}

async function fetchRecordById(
  table: string,
  recordId: string,
): Promise<AirtableQueryResult> {
  if (!isRecordId(recordId)) {
    return {
      ok: false,
      status: 404,
      type: "NOT_FOUND",
      message: "Invalid Airtable record ID",
    };
  }

  let accessToken: string;
  let baseId: string;
  try {
    ({ accessToken, baseId } = getAirtableConfig());
  } catch {
    return {
      ok: false,
      status: 503,
      type: "CONFIG",
      message: "Missing Airtable configuration",
    };
  }

  const encodedTable = encodeURIComponent(table);
  const encodedId = encodeURIComponent(recordId);
  const requestUrl = `https://api.airtable.com/v0/${baseId}/${encodedTable}/${encodedId}`;

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let type: string | null = null;
      let message = "";
      try {
        const raw = await response.text();
        try {
          const payload = JSON.parse(raw) as AirtableListResponse;
          type = payload.error?.type ?? null;
          message = payload.error?.message ?? raw.slice(0, 300);
        } catch {
          message = raw.slice(0, 300);
        }
      } catch {
        message = "[unreadable]";
      }
      return { ok: false, status: response.status, type, message };
    }

    const record = (await response.json()) as AirtableRecord;
    if (!record?.id) {
      return {
        ok: false,
        status: 404,
        type: "NOT_FOUND",
        message: "Record missing",
      };
    }
    return { ok: true, records: [record] };
  } catch (error) {
    return {
      ok: false,
      status: 503,
      type: "NETWORK",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function normalizeRecordIdParam(raw: string): string {
  const trimmed = raw.trim();
  try {
    return decodeURIComponent(trimmed).trim();
  } catch {
    return trimmed;
  }
}

async function fetchLatestApprovedApplicationForPerson(
  peopleId: string,
): Promise<{ name: string; approvalDate: string; applicationId: string } | null> {
  const filterByFormula = `LOWER({${VETTING_STATUS_FIELD}})='${VETTING_STATUS_APPROVED}'`;
  const result = await queryTable({
    table: APPLICATIONS_TABLE,
    fields: [...APPLICATION_FIELDS],
    filterByFormula,
    paginate: true,
  });
  if (!result.ok) return null;

  const todayMs = todayUtcMs();
  const cutoffMs = todayMs - LOOKBACK_DAYS * MS_PER_DAY;

  const ranked = result.records
    .map((record) => {
      if (!record?.id) return null;
      if (!recordIds(record.fields?.[LINKED_PERSON_FIELD]).includes(peopleId)) {
        return null;
      }
      const fields = record.fields ?? {};
      const lastModifiedRaw = asTrimmedString(fields[LAST_MODIFIED_FIELD]);
      const approvalMs = parseDateOnlyMs(lastModifiedRaw);
      return {
        id: record.id,
        name: asTrimmedString(fields[NAME_FIELD]),
        lastModifiedRaw,
        approvalMs,
      };
    })
    .filter(
      (
        row,
      ): row is {
        id: string;
        name: string;
        lastModifiedRaw: string;
        approvalMs: number | null;
      } => row != null,
    )
    .sort((left, right) => (right.approvalMs ?? 0) - (left.approvalMs ?? 0));

  const recent = ranked.find(
    (row) =>
      row.approvalMs != null &&
      row.approvalMs >= cutoffMs &&
      row.approvalMs <= todayMs,
  );
  const chosen = recent ?? ranked[0];
  if (!chosen) return null;
  return {
    applicationId: chosen.id,
    name: chosen.name,
    approvalDate: formatApprovalDate(chosen.lastModifiedRaw),
  };
}

async function fetchPeopleRecordForRoute(
  routeId: string,
): Promise<AirtableRecord | null> {
  const recordId = normalizeRecordIdParam(routeId);
  if (!isRecordId(recordId)) return null;

  const peopleTable = getPeopleTableName();
  const peopleResult = await fetchRecordById(peopleTable, recordId);
  if (peopleResult.ok && peopleResult.records[0]?.id) {
    return peopleResult.records[0];
  }

  const applicationResult = await fetchRecordById(APPLICATIONS_TABLE, recordId);
  const linkedPerson = recordIds(
    applicationResult.ok
      ? applicationResult.records[0]?.fields?.[LINKED_PERSON_FIELD]
      : undefined,
  )[0];
  if (!linkedPerson) return null;

  const linkedPeopleResult = await fetchRecordById(peopleTable, linkedPerson);
  if (!linkedPeopleResult.ok || !linkedPeopleResult.records[0]?.id) {
    return null;
  }
  return linkedPeopleResult.records[0];
}

export const getConciergeMemberByPeopleId = cache(
  async function getConciergeMemberByPeopleId(
    routeId: string,
  ): Promise<ConciergeMember | null> {
    const peopleRecord = await fetchPeopleRecordForRoute(routeId);
    if (!peopleRecord?.id) return null;
    return buildMemberFromPeopleRecord(peopleRecord, "application-first");
  },
);

export const getMemberByPeopleRecordId = cache(
  async function getMemberByPeopleRecordId(
    routeId: string,
  ): Promise<ConciergeMember | null> {
    const recordId = normalizeRecordIdParam(routeId);
    if (!isRecordId(recordId)) return null;

    const peopleTable = getPeopleTableName();
    const peopleResult = await fetchRecordById(peopleTable, recordId);
    if (!peopleResult.ok || !peopleResult.records[0]?.id) {
      return null;
    }

    return buildMemberFromPeopleRecord(
      peopleResult.records[0],
      "people-first",
    );
  },
);

async function buildMemberFromPeopleRecord(
  peopleRecord: AirtableRecord,
  nameSource: "application-first" | "people-first",
): Promise<ConciergeMember> {
  const peopleId = peopleRecord.id;
  const [attendanceResult, berthaResult, application] = await Promise.all([
    fetchAttendanceByPersonIds([peopleId]),
    fetchBerthaByPersonIds([peopleId]),
    fetchLatestApprovedApplicationForPerson(peopleId),
  ]);

  const contact = peopleContactFromFields(peopleRecord.fields);
  const peopleName = contact.name;
  const applicationName = application?.name ?? "";
  const name =
    nameSource === "people-first"
      ? peopleName || applicationName
      : applicationName || peopleName;

  return applyOutstanding(
    applyBertha(
      applyAttendance(
        {
          id: peopleRecord.id,
          applicationId: application?.applicationId,
          name: displayOrDash(name),
          phone: displayOrDash(contact.phone),
          email: displayOrDash(contact.email),
          approvalDate: application?.approvalDate || "",
          ...unresolvedConciergeFields(),
          ...peopleDisplayFields(contact),
        },
        peopleId,
        attendanceResult,
      ),
      peopleId,
      berthaResult,
    ),
    contact,
  );
}
