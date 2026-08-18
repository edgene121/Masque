import "server-only";

import { getAirtableConfig } from "@/lib/admin/config";
import { getEventsTableName } from "@/lib/portal/airtable-events";
import { getPeopleTableName } from "@/lib/portal/airtable-people-referral";
import type {
  CreditsHistoryRow,
  CreditsInvitedFriend,
  PortalCreditsData,
} from "@/types/credits";
import { EMPTY_PORTAL_CREDITS } from "@/types/credits";

const APPLICATIONS_TABLE =
  process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";
const REWARDS_TABLE =
  process.env.AIRTABLE_REWARDS_TABLE?.trim() || "Rewards";

interface AirtableRecord {
  id: string;
  createdTime?: string;
  fields?: Record<string, unknown>;
}

interface AirtableListResponse {
  records?: AirtableRecord[];
  offset?: string;
  error?: { type?: string; message?: string };
}

export type PortalCreditsResult =
  | { ok: true; data: PortalCreditsData }
  | { ok: false; error: string; status: number };

function escapeAirtableFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecordId(value: string): boolean {
  return /^rec[a-zA-Z0-9]{10,}$/.test(value);
}

function asTrimmedString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

function asDisplayString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => asDisplayString(item))
      .filter((part) => part && !isRecordId(part))
      .join(", ");
  }
  if (isPlainObject(value)) {
    return (
      asTrimmedString(value.name) ||
      asTrimmedString(value.label) ||
      asTrimmedString(value.text) ||
      asTrimmedString(value.value) ||
      ""
    );
  }
  return "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/,/g, "").trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  if (Array.isArray(value) && value.length === 1) {
    return asNumber(value[0]);
  }
  return null;
}

function recordIds(value: unknown): string[] {
  if (value == null || value === "") return [];
  if (!Array.isArray(value)) {
    const single = asTrimmedString(value);
    return isRecordId(single) ? [single] : [];
  }
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (isPlainObject(item)) {
        return asTrimmedString(item.id) || asTrimmedString(item.recordId);
      }
      return "";
    })
    .filter((id) => isRecordId(id));
}

function linkedFieldDebug(value: unknown): {
  jsType: string;
  isArray: boolean;
  recordIds: string[];
  sample: unknown;
} {
  return {
    jsType: value == null ? String(value) : Array.isArray(value) ? "array" : typeof value,
    isArray: Array.isArray(value),
    recordIds: recordIds(value),
    sample: Array.isArray(value) ? value.slice(0, 3) : value,
  };
}

function getField(
  fields: Record<string, unknown> | undefined,
  names: string[],
): unknown {
  if (!fields) return undefined;
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(fields, name)) {
      const value = fields[name];
      if (value != null && value !== "") return value;
    }
  }
  const lowerToKey = new Map(
    Object.keys(fields).map((key) => [key.toLowerCase(), key]),
  );
  for (const name of names) {
    const key = lowerToKey.get(name.toLowerCase());
    if (!key) continue;
    const value = fields[key];
    if (value != null && value !== "") return value;
  }
  return undefined;
}

function formatDisplayDate(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const iso = /^\d{4}-\d{2}-\d{2}/.test(trimmed)
    ? trimmed.slice(0, 10)
    : trimmed;
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso,
  );
  if (Number.isNaN(date.getTime())) return trimmed;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function personNameFromFields(
  fields: Record<string, unknown> | undefined,
): string {
  const full =
    asDisplayString(getField(fields, ["Name", "Full Name", "Person Name"])) ||
    [
      asDisplayString(getField(fields, ["First Name"])),
      asDisplayString(getField(fields, ["Last Name"])),
    ]
      .filter(Boolean)
      .join(" ");
  return full.trim();
}

async function airtableList(options: {
  table: string;
  params: URLSearchParams;
  context: string;
}): Promise<
  | { ok: true; records: AirtableRecord[] }
  | { ok: false; status: number; errorType: string | null; message: string }
> {
  let accessToken: string;
  let baseId: string;
  try {
    ({ accessToken, baseId } = getAirtableConfig());
  } catch {
    return {
      ok: false,
      status: 503,
      errorType: "CONFIG",
      message: "Missing Airtable configuration",
    };
  }

  const encodedTable = encodeURIComponent(options.table);
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  try {
    do {
      const params = new URLSearchParams(options.params);
      params.set("pageSize", params.get("pageSize") || "100");
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
        let errorType: string | null = null;
        let message = "";
        try {
          const raw = await response.text();
          try {
            const payload = JSON.parse(raw) as AirtableListResponse;
            errorType = payload.error?.type ?? null;
            message = payload.error?.message ?? raw.slice(0, 300);
          } catch {
            message = raw.slice(0, 300);
          }
        } catch {
          message = "[unreadable]";
        }

        if (process.env.NODE_ENV === "development") {
          console.error(`[Credits Airtable] ${options.context}`, {
            status: response.status,
            errorType,
            message,
            table: options.table,
          });
        }

        return { ok: false, status: response.status, errorType, message };
      }

      const data = (await response.json()) as AirtableListResponse;
      records.push(...(data.records ?? []));
      offset = data.offset;
    } while (offset);

    return { ok: true, records };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[Credits Airtable] ${options.context}`, {
        status: null,
        errorType: "NETWORK",
        message: error instanceof Error ? error.message : String(error),
        table: options.table,
      });
    }
    return {
      ok: false,
      status: 503,
      errorType: "NETWORK",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchPeopleByIds(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const names = new Map<string, string>();
  if (unique.length === 0) return names;

  const formula = `OR(${unique
    .map((id) => `RECORD_ID()='${escapeAirtableFormulaString(id)}'`)
    .join(",")})`;
  const params = new URLSearchParams({ filterByFormula: formula });
  const result = await airtableList({
    table: getPeopleTableName(),
    params,
    context: "People by id",
  });
  if (!result.ok) return names;

  for (const record of result.records) {
    const name = personNameFromFields(record.fields);
    if (name) names.set(record.id, name);
  }
  return names;
}

async function fetchApplicationNamesByIds(
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id) => isRecordId(id)))];
  const names = new Map<string, string>();
  if (unique.length === 0) return names;

  const formula =
    unique.length === 1
      ? `RECORD_ID()='${escapeAirtableFormulaString(unique[0])}'`
      : `OR(${unique
          .map((id) => `RECORD_ID()='${escapeAirtableFormulaString(id)}'`)
          .join(",")})`;
  const params = new URLSearchParams({ filterByFormula: formula });
  params.append("fields[]", "Name");

  const result = await airtableList({
    table: APPLICATIONS_TABLE,
    params,
    context: "Application names for Referred By",
  });
  if (!result.ok) return names;

  for (const record of result.records) {
    const name = personNameFromFields(record.fields);
    if (name) names.set(record.id, name);
  }
  return names;
}

function humanReadableReferredBy(value: unknown): string {
  const text = asDisplayString(value);
  if (!text || isRecordId(text)) return "";
  return text;
}

async function resolveInvitedByName(
  ownApplicationIds: string[],
): Promise<string> {
  const unique = [...new Set(ownApplicationIds.filter((id) => isRecordId(id)))];
  if (unique.length === 0) return "";

  const formula =
    unique.length === 1
      ? `RECORD_ID()='${escapeAirtableFormulaString(unique[0])}'`
      : `OR(${unique
          .map((id) => `RECORD_ID()='${escapeAirtableFormulaString(id)}'`)
          .join(",")})`;
  const params = new URLSearchParams({ filterByFormula: formula });
  params.append("fields[]", "Name");
  params.append("fields[]", "Referred By");

  const result = await airtableList({
    table: APPLICATIONS_TABLE,
    params,
    context: "Current member Application Referred By",
  });

  if (!result.ok) return "";

  const ownIdSet = new Set(unique);

  for (const record of result.records) {
    const referredByRaw = getField(record.fields, ["Referred By"]);
    const direct = humanReadableReferredBy(referredByRaw);
    if (direct) return direct;

    const referrerIds = recordIds(referredByRaw).filter(
      (id) => !ownIdSet.has(id),
    );
    if (referrerIds.length === 0) continue;

    const names = await fetchApplicationNamesByIds(referrerIds);
    const name = referrerIds
      .map((id) => names.get(id) ?? "")
      .find((part) => part.trim());
    if (name) return name;
  }

  return "";
}

function toPortalFriendStatus(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (!key) return "";

  if (key === "approved") return "Qualified";

  if (
    key === "pending" ||
    key === "under review" ||
    key === "application received" ||
    key === "hold" ||
    key.includes("incomplete")
  ) {
    return "Pending";
  }

  if (
    key === "rejected" ||
    key === "denied" ||
    key === "banned" ||
    key === "duplicate submission" ||
    key === "referral concern" ||
    key === "not qualified"
  ) {
    return "Not Qualified";
  }

  return "Pending";
}

function toPortalFriendCreditColumn(
  memberFacingStatus: string,
  explicitCredits: number | null,
): string {
  if (explicitCredits != null) {
    return explicitCredits > 0 ? `+${explicitCredits}` : String(explicitCredits);
  }
  if (memberFacingStatus === "Qualified") return "Qualified";
  if (memberFacingStatus === "Pending") return "Pending";
  return "—";
}

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function mapInvitedFriend(record: AirtableRecord): {
  id: string;
  name: string;
  status: string;
  applicationDate: string;
  creditStatus: string;
} {
  const fields = record.fields ?? {};
  const rawName = personNameFromFields(fields);
  const name = rawName && !isEmailLike(rawName) ? rawName : "Member";
  const status = toPortalFriendStatus(
    asDisplayString(getField(fields, ["Vetting Status"])),
  );
  const applicationDate = formatDisplayDate(
    asDisplayString(getField(fields, ["Created Time"])) ||
      record.createdTime ||
      "",
  );
  const explicitCredits = asNumber(
    getField(fields, ["Referral Credits", "Credits Earned"]),
  );

  return {
    id: record.id,
    name,
    status,
    applicationDate,
    creditStatus: toPortalFriendCreditColumn(status, explicitCredits),
  };
}

async function fetchInvitedFriendsByReferrerApplications(
  applicationIds: string[],
  debug: {
    memberstackId?: string;
    peopleRecordId: string;
    peopleFullName: string;
    peopleApplicationsRaw: unknown;
  },
): Promise<{ ok: true; friends: CreditsInvitedFriend[] } | { ok: false }> {
  const unique = [...new Set(applicationIds.filter((id) => isRecordId(id)))];
  if (unique.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Invited Friends debug]", {
        memberstackId: debug.memberstackId || "(not provided)",
        peopleRecordId: debug.peopleRecordId,
        peopleFullName: debug.peopleFullName,
        peopleApplications: linkedFieldDebug(debug.peopleApplicationsRaw),
        currentApplicationIds: unique,
        applicationsChecked: 0,
        matchingApplicationIds: [],
        matchingNames: [],
        matchingReferredBy: [],
        note: "No Application record IDs on the current People record.",
      });
    }
    return { ok: true, friends: [] };
  }

  const ownIds = new Set(unique);
  const params = new URLSearchParams();
  params.append("fields[]", "Name");
  params.append("fields[]", "Vetting Status");
  params.append("fields[]", "Referred By");

  const result = await airtableList({
    table: APPLICATIONS_TABLE,
    params,
    context: "Applications reverse Referred By lookup",
  });

  if (!result.ok) {
    console.error("[Credits] Unable to load invited friends", {
      status: result.status,
      errorType: result.errorType,
      message: result.message,
      table: APPLICATIONS_TABLE,
    });
    return { ok: false };
  }

  const referredBySamples: Array<{
    name: string;
    referredBy: ReturnType<typeof linkedFieldDebug>;
  }> = [];
  const matches: AirtableRecord[] = [];

  for (const record of result.records) {
    if (!record.id || ownIds.has(record.id)) continue;
    const referredByRaw = getField(record.fields, ["Referred By"]);
    const referredByIds = recordIds(referredByRaw);
    if (referredBySamples.length < 8) {
      referredBySamples.push({
        name: personNameFromFields(record.fields) || record.id,
        referredBy: linkedFieldDebug(referredByRaw),
      });
    }
    if (referredByIds.some((id) => ownIds.has(id))) {
      matches.push(record);
    }
  }

  const friends = matches.map(mapInvitedFriend);

  if (process.env.NODE_ENV === "development") {
    console.log("[Invited Friends debug]", {
      memberstackId: debug.memberstackId || "(not provided)",
      peopleRecordId: debug.peopleRecordId,
      peopleFullName: debug.peopleFullName,
      peopleApplications: linkedFieldDebug(debug.peopleApplicationsRaw),
      currentApplicationIds: unique,
      applicationsChecked: result.records.length,
      matchingApplicationIds: matches.map((record) => record.id),
      matchingNames: friends.map((friend) => friend.name),
      matchingReferredBy: matches.map((record) =>
        linkedFieldDebug(getField(record.fields, ["Referred By"])),
      ),
      referredByFieldSample: referredBySamples,
    });
  }

  return { ok: true, friends };
}

async function resolveOwnApplicationIds(
  personFields: Record<string, unknown>,
  email: string,
): Promise<{ ids: string[]; source: "people.applications" | "applications.email" | "none" }> {
  const fromPeople = recordIds(
    getField(personFields, ["Applications", "Application"]),
  );
  if (fromPeople.length > 0) {
    return { ids: fromPeople, source: "people.applications" };
  }

  const params = new URLSearchParams({
    filterByFormula: `LOWER({Email})='${escapeAirtableFormulaString(email)}'`,
    maxRecords: "5",
  });
  params.append("fields[]", "Name");
  params.append("fields[]", "Email");

  const ownApps = await airtableList({
    table: APPLICATIONS_TABLE,
    params,
    context: "Current member Applications by email fallback",
  });

  if (!ownApps.ok) {
    return { ids: [], source: "none" };
  }

  const ids = ownApps.records.map((record) => record.id).filter(isRecordId);
  return {
    ids,
    source: ids.length > 0 ? "applications.email" : "none",
  };
}

function isUsableDateValue(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return false;
  if (Array.isArray(value)) return value.some((item) => isUsableDateValue(item));
  if (isPlainObject(value)) {
    return (
      isUsableDateValue(value.iso) ||
      isUsableDateValue(value.date) ||
      isUsableDateValue(value.value)
    );
  }
  const text = asTrimmedString(value);
  if (!text || isRecordId(text)) return false;
  if (/^(true|false|yes|no|checked|unchecked)$/i.test(text)) return false;
  const iso = /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text;
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : text,
  );
  return !Number.isNaN(date.getTime());
}

function dateSortTime(value: unknown): number {
  if (!isUsableDateValue(value)) return 0;
  const text = asDisplayString(value);
  const iso = /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text;
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : text,
  );
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function extractRewardDate(fields: Record<string, unknown>): string {
  const issued = getField(fields, ["Issued"]);
  if (isUsableDateValue(issued)) {
    return formatDisplayDate(asDisplayString(issued));
  }

  const fallback = getField(fields, [
    "Issued Date",
    "Redeemed Date",
    "Date Issued",
    "Date",
    "Created Time",
    "Created",
  ]);
  if (isUsableDateValue(fallback)) {
    return formatDisplayDate(asDisplayString(fallback));
  }

  return "";
}

function extractRewardDateRaw(fields: Record<string, unknown>): unknown {
  const issued = getField(fields, ["Issued"]);
  if (isUsableDateValue(issued)) return issued;
  const fallback = getField(fields, [
    "Issued Date",
    "Redeemed Date",
    "Date Issued",
    "Date",
    "Created Time",
    "Created",
  ]);
  if (isUsableDateValue(fallback)) return fallback;
  return undefined;
}

function isUnissuedCheckbox(value: unknown): boolean {
  if (value === false) return true;
  if (typeof value === "string") {
    const key = value.trim().toLowerCase();
    return key === "false" || key === "unchecked" || key === "no";
  }
  return false;
}

async function fetchEventNamesByIds(
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id) => isRecordId(id)))];
  const names = new Map<string, string>();
  if (unique.length === 0) return names;

  const formula =
    unique.length === 1
      ? `RECORD_ID()='${escapeAirtableFormulaString(unique[0])}'`
      : `OR(${unique
          .map((id) => `RECORD_ID()='${escapeAirtableFormulaString(id)}'`)
          .join(",")})`;
  const params = new URLSearchParams({ filterByFormula: formula });
  params.append("fields[]", "Name");

  const result = await airtableList({
    table: getEventsTableName(),
    params,
    context: "Event names for Rewards",
  });
  if (!result.ok) return names;

  for (const record of result.records) {
    const name =
      asDisplayString(
        getField(record.fields, [
          "Name",
          "Title",
          "Event Name",
          "Event Title",
          "Event",
        ]),
      ) || personNameFromFields(record.fields);
    if (name) names.set(record.id, name);
  }
  return names;
}

function rewardActivityDescription(
  ticketType: string,
  eventName: string,
): string {
  if (eventName) {
    return ticketType ? `${ticketType} — ${eventName}` : eventName;
  }
  if (ticketType) return `${ticketType} Redemption`;
  return "Credit Redemption";
}

async function fetchCreditHistoryForPerson(
  peopleRecordId: string,
): Promise<CreditsHistoryRow[]> {
  if (!isRecordId(peopleRecordId)) return [];

  const params = new URLSearchParams();
  params.append("fields[]", "Person");
  params.append("fields[]", "Event Redeemed For");
  params.append("fields[]", "Ticket Type");
  params.append("fields[]", "Credits Used");
  params.append("fields[]", "Status");
  params.append("fields[]", "Issued");

  const result = await airtableList({
    table: REWARDS_TABLE,
    params,
    context: "Rewards credit history by Person",
  });

  if (!result.ok) {
    console.error("[Credits] Unable to load Rewards credit history", {
      status: result.status,
      errorType: result.errorType,
      message: result.message,
      table: REWARDS_TABLE,
    });
    return [];
  }

  const matches = result.records.filter((record) =>
    recordIds(getField(record.fields, ["Person"])).includes(peopleRecordId),
  );

  const eventIds = new Set<string>();
  for (const record of matches) {
    const eventRaw = getField(record.fields, ["Event Redeemed For"]);
    if (humanReadableReferredBy(eventRaw)) continue;
    for (const id of recordIds(eventRaw)) eventIds.add(id);
  }
  const eventNames = await fetchEventNamesByIds([...eventIds]);

  const rows = matches
    .map((record) => {
      const fields = record.fields ?? {};
      const issuedRaw = getField(fields, ["Issued"]);
      if (isUnissuedCheckbox(issuedRaw)) return null;

      const status = asDisplayString(getField(fields, ["Status"])).toLowerCase();
      if (
        status.includes("cancel") ||
        status.includes("void") ||
        status.includes("refund")
      ) {
        return null;
      }

      const creditsUsed = asNumber(getField(fields, ["Credits Used"]));
      if (creditsUsed == null || creditsUsed === 0) return null;

      const ticketType = humanReadableReferredBy(
        getField(fields, ["Ticket Type"]),
      );
      const eventRaw = getField(fields, ["Event Redeemed For"]);
      const eventName =
        humanReadableReferredBy(eventRaw) ||
        recordIds(eventRaw)
          .map((id) => eventNames.get(id) ?? "")
          .find((part) => part.trim()) ||
        "";

      return {
        id: `history-${record.createdTime ?? ""}-${creditsUsed}`,
        date: extractRewardDate(fields),
        activity: rewardActivityDescription(ticketType, eventName),
        details: "",
        credits: -Math.abs(creditsUsed),
        sortTime: dateSortTime(extractRewardDateRaw(fields)),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => b.sortTime - a.sortTime);

  return rows.map((row, index) => ({
    id: `history-${index}`,
    date: row.date,
    activity: row.activity,
    details: row.details,
    credits: row.credits,
  }));
}

function asCreditCount(value: unknown): number {
  return asNumber(value) ?? 0;
}

/**
 * Load People credit summary, Referral Code, and Invited Friends for a member email.
 * Read-only. Blank/null credit values become 0. Blank Referral Code stays empty.
 */
export async function getPeopleCreditSummaryByEmail(
  email: string,
  options?: { memberstackId?: string },
): Promise<
  | {
      ok: true;
      creditsAvailable: number;
      qualifiedReferrals: number;
      creditsRedeemed: number;
      referralCode: string;
      invitedFriends: CreditsInvitedFriend[];
      invitedBy: string;
      creditHistory: CreditsHistoryRow[];
    }
  | { ok: false; error: string; status: number }
> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, error: "Email is required.", status: 400 };
  }

  const peopleTable = getPeopleTableName();
  const params = new URLSearchParams({
    filterByFormula: `LOWER({Email})='${escapeAirtableFormulaString(trimmed)}'`,
    maxRecords: "1",
  });
  params.append("fields[]", "Email");
  params.append("fields[]", "Credits Available");
  params.append("fields[]", "Qualified Referrals");
  params.append("fields[]", "Credits Redeemed");
  params.append("fields[]", "Referral Code");
  params.append("fields[]", "Applications");

  const personResult = await airtableList({
    table: peopleTable,
    params,
    context: "People credit summary by email",
  });

  if (!personResult.ok) {
    console.error("[Credits] Unable to load People credit summary", {
      status: personResult.status,
      errorType: personResult.errorType,
      message: personResult.message,
      table: peopleTable,
    });
    return {
      ok: false,
      error: "Unable to load credits right now.",
      status: personResult.status === 429 ? 429 : 503,
    };
  }

  const person = personResult.records[0];
  if (!person?.id) {
    return {
      ok: true,
      creditsAvailable: 0,
      qualifiedReferrals: 0,
      creditsRedeemed: 0,
      referralCode: "",
      invitedFriends: [],
      invitedBy: "",
      creditHistory: [],
    };
  }

  const fields = person.fields ?? {};
  const peopleApplicationsRaw = getField(fields, ["Applications", "Application"]);
  const ownApps = await resolveOwnApplicationIds(fields, trimmed);
  const [invitedResult, invitedBy, creditHistory] = await Promise.all([
    fetchInvitedFriendsByReferrerApplications(ownApps.ids, {
      memberstackId: options?.memberstackId,
      peopleRecordId: person.id,
      peopleFullName: personNameFromFields(fields),
      peopleApplicationsRaw,
    }),
    resolveInvitedByName(ownApps.ids),
    fetchCreditHistoryForPerson(person.id),
  ]);

  if (process.env.NODE_ENV === "development") {
    console.log("[Invited Friends debug] application resolution", {
      memberstackId: options?.memberstackId || "(not provided)",
      peopleRecordId: person.id,
      peopleFullName: personNameFromFields(fields),
      applicationIdSource: ownApps.source,
      currentApplicationIds: ownApps.ids,
    });
  }

  return {
    ok: true,
    creditsAvailable: asCreditCount(getField(fields, ["Credits Available"])),
    qualifiedReferrals: asCreditCount(getField(fields, ["Qualified Referrals"])),
    creditsRedeemed: asCreditCount(getField(fields, ["Credits Redeemed"])),
    referralCode: asDisplayString(getField(fields, ["Referral Code"])),
    invitedFriends: invitedResult.ok ? invitedResult.friends : [],
    invitedBy,
    creditHistory,
  };
}

/**
 * Load Credits & Referrals for a member email from People, Applications, Rewards.
 * Read-only — does not award credits or write records.
 */
export async function getPortalCreditsByEmail(
  email: string,
): Promise<PortalCreditsResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, error: "Email is required.", status: 400 };
  }

  const peopleTable = getPeopleTableName();
  const personParams = new URLSearchParams({
    filterByFormula: `LOWER({Email})='${escapeAirtableFormulaString(trimmed)}'`,
    maxRecords: "1",
  });
  const personResult = await airtableList({
    table: peopleTable,
    params: personParams,
    context: "People by email",
  });

  if (!personResult.ok) {
    return {
      ok: false,
      error: "Unable to load credits right now.",
      status: personResult.status === 429 ? 429 : 503,
    };
  }

  const person = personResult.records[0];
  if (!person?.id) {
    return { ok: true, data: { ...EMPTY_PORTAL_CREDITS } };
  }

  const personFields = person.fields ?? {};
  const referralCode = asDisplayString(
    getField(personFields, ["Referral Code"]),
  );
  const creditsAvailable = asNumber(
    getField(personFields, [
      "Credits Available",
      "Available Credits",
      "Credits",
    ]),
  );
  const qualifiedReferrals = asNumber(
    getField(personFields, ["Qualified Referrals"]),
  );
  const creditsRedeemed = asNumber(
    getField(personFields, ["Credits Redeemed", "Redeemed Credits"]),
  );

  const referredByFormula = `FIND('${escapeAirtableFormulaString(person.id)}', ARRAYJOIN({Referred By}))`;
  const ownAppFormula = `LOWER({Email})='${escapeAirtableFormulaString(trimmed)}'`;

  const [invitedResult, ownAppResult, creditHistory] = await Promise.all([
    airtableList({
      table: APPLICATIONS_TABLE,
      params: new URLSearchParams({ filterByFormula: referredByFormula }),
      context: "Applications referred by member",
    }),
    airtableList({
      table: APPLICATIONS_TABLE,
      params: new URLSearchParams({
        filterByFormula: ownAppFormula,
        maxRecords: "1",
      }),
      context: "Member application",
    }),
    fetchCreditHistoryForPerson(person.id),
  ]);

  const invitedFriends = invitedResult.ok
    ? invitedResult.records
        .filter((record) => record.id)
        .map(mapInvitedFriend)
    : [];

  let invitedBy = "";
  if (ownAppResult.ok) {
    const ownApp = ownAppResult.records[0];
    const ownFields = ownApp?.fields ?? {};
    invitedBy =
      asDisplayString(
        getField(ownFields, [
          "Referrer Name",
          "who invited",
          "If someone referred you, who?",
        ]),
      ) || "";

    if (!invitedBy) {
      const referrerIds = recordIds(
        getField(ownFields, ["Referred By"]),
      ).filter((id) => id !== person.id);
      if (referrerIds.length > 0) {
        const names = await fetchPeopleByIds(referrerIds);
        invitedBy = referrerIds.map((id) => names.get(id) ?? "").find(Boolean) ?? "";
      }
    }
  }

  return {
    ok: true,
    data: {
      referralCode,
      creditsAvailable,
      qualifiedReferrals,
      creditsRedeemed,
      invitedFriends,
      invitedBy,
      creditHistory,
    },
  };
}
