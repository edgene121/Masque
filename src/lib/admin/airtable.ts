import "server-only";

import { getAirtableConfig } from "./config";

export type AdminRole = "Admin" | "Super Admin" | string;
export type AdminStatus = "Active" | "Disabled" | string;

export interface AdminRecord {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: AdminStatus;
  /** TEMPORARY: plain-text Password field from Airtable (dev only). */
  password: string;
  passwordFieldPresent: boolean;
}

interface AirtableAdminFields {
  Email?: string;
  Password?: string;
  Name?: string;
  Role?: string;
  Status?: string;
  "Last Login"?: string;
}

interface AirtableRecord {
  id: string;
  fields: AirtableAdminFields;
}

interface AirtableListResponse {
  records?: AirtableRecord[];
  error?: { type?: string; message?: string };
}

function escapeFormulaString(value: string): string {
  return value.replace(/'/g, "''");
}

function mapAdminRecord(record: AirtableRecord): AdminRecord | null {
  const email = record.fields.Email?.trim();
  if (!email) {
    return null;
  }

  const passwordFieldPresent = Object.prototype.hasOwnProperty.call(
    record.fields,
    "Password",
  );
  const password = String(record.fields.Password ?? "").trim();

  return {
    id: record.id,
    email,
    name: record.fields.Name?.trim() || email,
    role: record.fields.Role?.trim() || "Admin",
    status: record.fields.Status?.trim() || "Disabled",
    password,
    passwordFieldPresent,
  };
}

/** Logs Airtable HTTP failures without exposing tokens or secrets. */
async function logAirtableHttpError(
  context: string,
  response: Response,
  requestUrl: string,
): Promise<void> {
  let responseBody = "";
  try {
    responseBody = await response.text();
  } catch {
    responseBody = "[unreadable response body]";
  }

  console.error(`[Airtable] ${context}`, {
    status: response.status,
    statusText: response.statusText,
    requestUrl,
    responseBody,
  });
}

function buildAirtableUrl(baseId: string, path: string): string {
  return `https://api.airtable.com/v0/${baseId}/${path}`;
}

async function airtableFetch(
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; requestUrl: string }> {
  const { accessToken, baseId } = getAirtableConfig();
  const requestUrl = buildAirtableUrl(baseId, path);

  const response = await fetch(requestUrl, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  return { response, requestUrl };
}

/**
 * Find an admin by email (case-insensitive via Airtable LOWER()).
 * Returns null when no matching record exists.
 */
export async function findAdminByEmail(
  email: string,
): Promise<AdminRecord | null> {
  const { baseId, adminsTable } = getAirtableConfig();
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const formula = `LOWER({Email})='${escapeFormulaString(normalized)}'`;
  const query = new URLSearchParams({
    filterByFormula: formula,
    maxRecords: "1",
  });

  // Table names with spaces (e.g. "Admin Users") must be URL-encoded.
  const encodedTable = encodeURIComponent(adminsTable);
  const path = `${encodedTable}?${query.toString()}`;

  const { response, requestUrl } = await airtableFetch(path);

  if (!response.ok) {
    await logAirtableHttpError("Admin lookup failed", response, requestUrl);
    throw new Error("Airtable admin lookup failed.");
  }

  const data = (await response.json()) as AirtableListResponse;
  const record = data.records?.[0];

  if (!record) {
    // TEMPORARY debug — remove once admin auth is confirmed
    console.error("[AdminAuth Debug] Airtable returned a record: false");
    return null;
  }

  const admin = mapAdminRecord(record);

  // TEMPORARY debug — never log password or access token
  console.error("[AdminAuth Debug] Airtable returned a record: true", {
    recordId: record.id,
    email: admin?.email ?? record.fields.Email ?? null,
    status: admin?.status ?? record.fields.Status ?? null,
    role: admin?.role ?? record.fields.Role ?? null,
    passwordFieldExists: Object.prototype.hasOwnProperty.call(
      record.fields,
      "Password",
    ),
    mappedSuccessfully: Boolean(admin),
  });

  return admin;
}

/** Updates Last Login timestamp for an admin record. Best-effort. */
export async function updateAdminLastLogin(adminId: string): Promise<void> {
  const { adminsTable } = getAirtableConfig();
  const encodedTable = encodeURIComponent(adminsTable);
  const path = `${encodedTable}/${encodeURIComponent(adminId)}`;

  const { response, requestUrl } = await airtableFetch(path, {
    method: "PATCH",
    body: JSON.stringify({
      fields: {
        "Last Login": new Date().toISOString(),
      },
    }),
  });

  if (!response.ok) {
    await logAirtableHttpError(
      "Failed to update admin Last Login",
      response,
      requestUrl,
    );
  }
}

/** Public admin profile shape — never includes password. */
export function toPublicAdmin(admin: AdminRecord) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    status: admin.status,
  };
}
