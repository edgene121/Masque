import "server-only";

import { GOVERNMENT_ID_FIELD } from "./government-id";
import type {
  AdminApplicationDetail,
  AdminDetailField,
  AdminGovernmentIdInfo,
} from "@/types/admin-users";

type RawFields = Record<string, unknown>;

interface AirtableAttachment {
  id?: string;
  url?: string;
  filename?: string;
  type?: string;
  size?: number;
}

function asTrimmedString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function looksLikeAttachment(value: unknown): value is AirtableAttachment {
  return isPlainObject(value) && typeof value.url === "string";
}

function looksLikeButtonOrCollaborator(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  if ("email" in value && "id" in value) return true; // collaborator
  if ("label" in value || "url" in value) return true; // button
  return false;
}

function formatFieldValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    if (value.every(looksLikeAttachment)) {
      return value
        .map((att) => asTrimmedString(att.filename) || "Attachment")
        .filter(Boolean)
        .join(", ");
    }
    if (value.every((item) => typeof item === "string")) {
      // Linked record IDs look like rec...
      const strings = value.map((item) => String(item).trim()).filter(Boolean);
      if (strings.every((s) => /^rec[a-zA-Z0-9]+$/.test(s))) {
        return strings.length === 1
          ? "1 linked record"
          : `${strings.length} linked records`;
      }
      return strings.join(", ");
    }
    if (value.every((item) => typeof item === "number")) {
      return value.join(", ");
    }
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }
  if (looksLikeButtonOrCollaborator(value)) {
    const record = value as Record<string, unknown>;
    const name = asTrimmedString(record.name) || asTrimmedString(record.label);
    const email = asTrimmedString(record.email);
    if (name && email) return `${name} (${email})`;
    return name || email || "";
  }
  return "";
}

function pickField(fields: RawFields, key: string): string {
  if (!Object.prototype.hasOwnProperty.call(fields, key)) return "";
  return formatFieldValue(fields[key]);
}

function pushIfPresent(
  target: AdminDetailField[],
  fields: RawFields,
  key: string,
  label = key,
) {
  const value = pickField(fields, key);
  if (!value) return;
  target.push({ label, value });
}

function mapGovernmentId(fields: RawFields): AdminGovernmentIdInfo | null {
  const raw = fields[GOVERNMENT_ID_FIELD];
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const first = raw.find(looksLikeAttachment);
  if (!first) return null;

  const contentType = asTrimmedString(first.type).toLowerCase();
  const filename = asTrimmedString(first.filename) || "Government ID";
  const size = typeof first.size === "number" ? first.size : 0;
  const isImage = contentType.startsWith("image/");
  const isPdf =
    contentType === "application/pdf" ||
    filename.toLowerCase().endsWith(".pdf");

  return {
    filename,
    contentType: contentType || "application/octet-stream",
    size,
    isImage,
    isPdf,
  };
}

/**
 * Map raw Airtable Applications fields into admin review sections.
 * Omits empty values. Never includes attachment URLs.
 */
export function mapApplicationDetail(
  recordId: string,
  fields: RawFields,
  createdTimeFallback = "",
): AdminApplicationDetail {
  const name = pickField(fields, "Name");
  const email = pickField(fields, "Email");
  const phone =
    pickField(fields, "Phone") || pickField(fields, "Standardized Phone Number");
  const vettingStatus = pickField(fields, "Vetting Status");
  const memberStatus = pickField(fields, "Member Status");
  const createdFromField = pickField(fields, "Created Time");
  const createdTime = createdFromField || createdTimeFallback;
  const submittedDisplay = formatDisplayDate(createdTime);

  const summary: AdminDetailField[] = [];
  pushIfPresent(summary, fields, "Name");
  pushIfPresent(summary, fields, "Email");
  pushIfPresent(summary, fields, "Phone");
  pushIfPresent(summary, fields, "Standardized Phone Number", "Standardized Phone");
  pushIfPresent(summary, fields, "Vetting Status");
  pushIfPresent(summary, fields, "Member Status");
  if (submittedDisplay && submittedDisplay !== "—") {
    summary.push({ label: "Submitted", value: submittedDisplay });
  }
  pushIfPresent(summary, fields, "Date", "Application Date");

  const personal: AdminDetailField[] = [];
  pushIfPresent(personal, fields, "Birthday");
  pushIfPresent(personal, fields, "Age");
  pushIfPresent(personal, fields, "Gender");
  pushIfPresent(personal, fields, "Address");
  pushIfPresent(personal, fields, "City");
  pushIfPresent(personal, fields, "State");
  pushIfPresent(personal, fields, "Zip Code");
  pushIfPresent(personal, fields, "Zip");
  pushIfPresent(personal, fields, "Display Name");
  pushIfPresent(personal, fields, "Profile Name");
  pushIfPresent(personal, fields, "Masqué Profile Name");
  pushIfPresent(personal, fields, "Insta", "Instagram");
  pushIfPresent(personal, fields, "Facebook");
  pushIfPresent(personal, fields, "SDC Profile");
  pushIfPresent(personal, fields, "Fetlife Profile");
  pushIfPresent(personal, fields, "DJ Name");

  const application: AdminDetailField[] = [];
  pushIfPresent(application, fields, "About me", "About Me");
  pushIfPresent(application, fields, "How did you hear about Masqué?");
  pushIfPresent(application, fields, "How were you introduce to Masqué?");
  pushIfPresent(application, fields, "Attendance request", "Attendance Request");
  pushIfPresent(application, fields, "Will you attend with a guest?");
  pushIfPresent(application, fields, "Favorite DJs");
  pushIfPresent(application, fields, "mailing opt in", "Mailing Opt-In");
  pushIfPresent(application, fields, "Privacy and Concent", "Privacy and Consent");
  pushIfPresent(application, fields, "Disclaimer");
  pushIfPresent(application, fields, "Source");
  pushIfPresent(application, fields, "campaign_src", "Campaign Source");
  pushIfPresent(application, fields, "Group");
  pushIfPresent(application, fields, "Credit Tier");
  pushIfPresent(application, fields, "Roles");
  pushIfPresent(application, fields, "Guest's name", "Guest Name");
  pushIfPresent(application, fields, "Guest Email");
  pushIfPresent(application, fields, "Guest Phone");
  pushIfPresent(application, fields, "guest's insta", "Guest Instagram");
  pushIfPresent(application, fields, "Guest's Age");
  pushIfPresent(application, fields, "Guest's Birthday");

  const referral: AdminDetailField[] = [];
  pushIfPresent(referral, fields, "who invited", "Who Invited");
  pushIfPresent(referral, fields, "If someone referred you, who?");
  pushIfPresent(referral, fields, "Referrer Name");
  pushIfPresent(referral, fields, "Referrer Email");
  pushIfPresent(referral, fields, "Referrer Phone");
  pushIfPresent(referral, fields, "Referrer Instagram");
  pushIfPresent(referral, fields, "Referral Code Entered");
  pushIfPresent(referral, fields, "Referral Comments");
  pushIfPresent(referral, fields, "Referral Count");
  pushIfPresent(referral, fields, "Qualified Referrals");
  pushIfPresent(referral, fields, "Referral Community Fit Score");
  pushIfPresent(referral, fields, "Referral Recommendation Score");
  pushIfPresent(referral, fields, "Referred By");
  pushIfPresent(referral, fields, "My Referrals");
  pushIfPresent(referral, fields, "Referrer's Trust Score");
  pushIfPresent(referral, fields, "My Trust Score (as Referrer)");

  const internal: AdminDetailField[] = [];
  pushIfPresent(internal, fields, "Internal Notes");
  pushIfPresent(internal, fields, "Rejection Category");
  pushIfPresent(internal, fields, "Last Modified");

  const governmentId = mapGovernmentId(fields);

  return {
    id: recordId,
    name: name || "—",
    email: email || "—",
    phone: phone || "—",
    vettingStatus,
    memberStatus,
    createdTime,
    submittedDisplay,
    summary,
    personal,
    application,
    referral,
    internal,
    governmentId,
  };
}

export function formatAttachmentSize(size: number): string {
  return formatBytes(size);
}

/** Server-only: extract first Government ID attachment URL (never log). */
export function getGovernmentIdAttachment(
  fields: RawFields,
): AirtableAttachment | null {
  const raw = fields[GOVERNMENT_ID_FIELD];
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const first = raw.find(looksLikeAttachment);
  return first ?? null;
}
