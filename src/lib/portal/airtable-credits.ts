import "server-only";

import { getAirtableConfig } from "@/lib/admin/config";
import { getPeopleTableName } from "@/lib/portal/airtable-people-referral";
import type { CreditsInvitedFriend, PortalCreditsData } from "@/types/credits";
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
  if (!Array.isArray(value)) {
    const single = asTrimmedString(value);
    return isRecordId(single) ? [single] : [];
  }
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (isPlainObject(item)) return asTrimmedString(item.id);
      return "";
    })
    .filter((id) => isRecordId(id));
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

function formatStatusLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      if (/^\d+$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
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
): Promise<{ ok: true; friends: CreditsInvitedFriend[] } | { ok: false }> {
  const unique = [...new Set(applicationIds.filter((id) => isRecordId(id)))];
  if (unique.length === 0) {
    return { ok: true, friends: [] };
  }

  const formula =
    unique.length === 1
      ? `FIND('${escapeAirtableFormulaString(unique[0])}', ARRAYJOIN({Referred By}))`
      : `OR(${unique
          .map(
            (id) =>
              `FIND('${escapeAirtableFormulaString(id)}', ARRAYJOIN({Referred By}))`,
          )
          .join(",")})`;

  const params = new URLSearchParams({ filterByFormula: formula });
  params.append("fields[]", "Name");
  params.append("fields[]", "Vetting Status");
  params.append("fields[]", "Referred By");

  const result = await airtableList({
    table: APPLICATIONS_TABLE,
    params,
    context: "Applications referred by member application",
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

  const ownIds = new Set(unique);
  const friends = result.records
    .filter((record) => record.id && !ownIds.has(record.id))
    .map(mapInvitedFriend);

  return { ok: true, friends };
}

function mapRewardRow(record: AirtableRecord): {
  id: string;
  date: string;
  activity: string;
  details: string;
  credits: number | null;
} {
  const fields = record.fields ?? {};
  const issued = asDisplayString(
    getField(fields, ["Issued", "Date", "Created Time", "Redeemed Date"]),
  );
  const creditsUsed = asNumber(
    getField(fields, ["Credits Used", "Credits", "Amount"]),
  );
  const status = asDisplayString(getField(fields, ["Status"]));
  const ticketType = asDisplayString(
    getField(fields, ["Ticket Type", "Reward", "Item"]),
  );
  const eventName = asDisplayString(
    getField(fields, [
      "Event Redeemed For",
      "Event",
      "Event Name",
      "Redeemed For",
    ]),
  );

  const statusLower = status.toLowerCase();
  const isRedeemed =
    statusLower.includes("redeem") ||
    ((creditsUsed != null && creditsUsed !== 0) &&
      Boolean(ticketType || eventName));

  const activity =
    formatStatusLabel(status) || (isRedeemed ? "Redeemed" : "");

  let credits = creditsUsed;
  if (credits != null && isRedeemed && credits > 0) {
    credits = -Math.abs(credits);
  }

  return {
    id: record.id,
    date: formatDisplayDate(issued || record.createdTime || ""),
    activity,
    details: eventName || ticketType,
    credits,
  };
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
): Promise<
  | {
      ok: true;
      creditsAvailable: number;
      qualifiedReferrals: number;
      creditsRedeemed: number;
      referralCode: string;
      invitedFriends: CreditsInvitedFriend[];
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
    };
  }

  const fields = person.fields ?? {};
  const ownApplicationIds = recordIds(getField(fields, ["Applications"]));
  const invitedResult =
    await fetchInvitedFriendsByReferrerApplications(ownApplicationIds);

  return {
    ok: true,
    creditsAvailable: asCreditCount(getField(fields, ["Credits Available"])),
    qualifiedReferrals: asCreditCount(getField(fields, ["Qualified Referrals"])),
    creditsRedeemed: asCreditCount(getField(fields, ["Credits Redeemed"])),
    referralCode: asDisplayString(getField(fields, ["Referral Code"])),
    invitedFriends: invitedResult.ok ? invitedResult.friends : [],
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
  const rewardsFormula = `FIND('${escapeAirtableFormulaString(person.id)}', ARRAYJOIN({Person}))`;

  const [invitedResult, ownAppResult, rewardsResult] = await Promise.all([
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
    airtableList({
      table: REWARDS_TABLE,
      params: new URLSearchParams({ filterByFormula: rewardsFormula }),
      context: "Rewards for member",
    }),
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

  const creditHistory = rewardsResult.ok
    ? rewardsResult.records.map(mapRewardRow)
    : [];

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
