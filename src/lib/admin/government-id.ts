import "server-only";

import { getAirtableConfig } from "./config";

const APPLICATIONS_TABLE =
  process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";

/** Airtable Attachment field for government-issued ID (pending review only). */
export const GOVERNMENT_ID_FIELD = "Government ID";

export const VETTING_STATUS_APPROVED = "approved";

const GOV_ID_MAX_BYTES = 2 * 1024 * 1024;

const GOV_ID_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

const GOV_ID_ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf",
]);

const GENERIC_UPLOAD_ERROR =
  "Unable to upload your ID document. Please try again.";

interface AirtableAttachment {
  id?: string;
  url?: string;
  filename?: string;
}

interface AirtableApplicationFields {
  Name?: unknown;
  Email?: unknown;
  "Vetting Status"?: unknown;
  "Government ID"?: AirtableAttachment[] | unknown;
}

interface AirtableApplicationRecord {
  id: string;
  fields?: AirtableApplicationFields;
}

interface AirtableListResponse {
  records?: AirtableApplicationRecord[];
  error?: { type?: string; message?: string };
}

export type GovIdAirtableResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

function escapeAirtableFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function extensionOf(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0) return "";
  return fileName.slice(idx).toLowerCase();
}

export function validateGovIdFile(file: File): string | null {
  if (!file || file.size <= 0) {
    return "Please select a government-issued ID file.";
  }

  if (file.size >= GOV_ID_MAX_BYTES) {
    return "File size must be less than 2MB.";
  }

  const ext = extensionOf(file.name);
  const mimeOk = GOV_ID_ALLOWED_MIME.has(file.type);
  const extOk = GOV_ID_ALLOWED_EXTENSIONS.has(ext);

  if (!mimeOk && !extOk) {
    return "Please upload a JPG, JPEG, PNG, or PDF file.";
  }

  return null;
}

function resolveContentType(file: File): string {
  if (file.type && GOV_ID_ALLOWED_MIME.has(file.type)) {
    return file.type;
  }

  const ext = extensionOf(file.name);
  if (ext === ".png") return "image/png";
  if (ext === ".pdf") return "application/pdf";
  return "image/jpeg";
}

async function getCredentials(): Promise<
  | { ok: true; accessToken: string; baseId: string }
  | { ok: false; error: string; status: number }
> {
  try {
    const { accessToken, baseId } = getAirtableConfig();
    return { ok: true, accessToken, baseId };
  } catch {
    return {
      ok: false,
      error: GENERIC_UPLOAD_ERROR,
      status: 503,
    };
  }
}

function hasAttachments(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Find the Applications record matching member email (case-insensitive).
 * Does not create records.
 */
export async function findApplicationByEmail(
  email: string,
): Promise<
  | { ok: true; recordId: string; hasGovernmentId: boolean }
  | { ok: false; error: string; status: number }
> {
  const trimmed = email.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: "Email is required to save your government ID.",
      status: 400,
    };
  }

  const creds = await getCredentials();
  if (!creds.ok) return creds;

  const formula = `LOWER({Email})='${escapeAirtableFormulaString(trimmed.toLowerCase())}'`;
  const params = new URLSearchParams({
    filterByFormula: formula,
    maxRecords: "1",
  });
  const encodedTable = encodeURIComponent(APPLICATIONS_TABLE);
  const requestUrl = `https://api.airtable.com/v0/${creds.baseId}/${encodedTable}?${params.toString()}`;

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[Airtable Gov ID] findApplicationByEmail failed", {
        status: response.status,
      });
      return {
        ok: false,
        error: GENERIC_UPLOAD_ERROR,
        status: response.status === 429 ? 429 : 503,
      };
    }

    const data = (await response.json()) as AirtableListResponse;
    const record = data.records?.[0];
    if (!record?.id) {
      return {
        ok: false,
        error:
          "No matching application was found for this email. Please contact support.",
        status: 404,
      };
    }

    return {
      ok: true,
      recordId: record.id,
      hasGovernmentId: hasAttachments(record.fields?.[GOVERNMENT_ID_FIELD]),
    };
  } catch (error) {
    console.error("[Airtable Gov ID] findApplicationByEmail network error:", error);
    return {
      ok: false,
      error: GENERIC_UPLOAD_ERROR,
      status: 503,
    };
  }
}

export async function applicationHasGovernmentIdByEmail(
  email: string,
): Promise<
  | { ok: true; hasGovernmentId: boolean }
  | { ok: false; error: string; status: number }
> {
  const found = await findApplicationByEmail(email);
  if (!found.ok) {
    if (found.status === 404) {
      return { ok: true, hasGovernmentId: false };
    }
    return found;
  }
  return { ok: true, hasGovernmentId: found.hasGovernmentId };
}

/**
 * Clear only the Government ID attachment field on an Applications record.
 * Does not delete the record or other fields.
 */
export async function clearGovernmentIdAttachment(
  recordId: string,
): Promise<GovIdAirtableResult> {
  const creds = await getCredentials();
  if (!creds.ok) return creds;

  const encodedTable = encodeURIComponent(APPLICATIONS_TABLE);
  const encodedId = encodeURIComponent(recordId);
  const requestUrl = `https://api.airtable.com/v0/${creds.baseId}/${encodedTable}/${encodedId}`;

  try {
    const response = await fetch(requestUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          [GOVERNMENT_ID_FIELD]: [],
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[Airtable Gov ID] clearGovernmentIdAttachment failed", {
        status: response.status,
        recordId,
      });
      return {
        ok: false,
        error: "Unable to clear government ID attachment.",
        status: response.status === 429 ? 429 : 503,
      };
    }

    return { ok: true };
  } catch (error) {
    console.error(
      "[Airtable Gov ID] clearGovernmentIdAttachment network error:",
      error,
    );
    return {
      ok: false,
      error: "Unable to clear government ID attachment.",
      status: 503,
    };
  }
}

/**
 * Upload file bytes directly to Airtable "Government ID" via uploadAttachment.
 * Replaces any existing attachment. Does not use third-party file hosting.
 */
export async function uploadGovernmentIdFileByEmail(
  email: string,
  file: File,
): Promise<GovIdAirtableResult> {
  const validationError = validateGovIdFile(file);
  if (validationError) {
    return { ok: false, error: validationError, status: 400 };
  }

  const found = await findApplicationByEmail(email);
  if (!found.ok) return found;

  // Keep a single ID document: clear any existing attachment first.
  if (found.hasGovernmentId) {
    const cleared = await clearGovernmentIdAttachment(found.recordId);
    if (!cleared.ok) {
      return {
        ok: false,
        error: GENERIC_UPLOAD_ERROR,
        status: cleared.status,
      };
    }
  }

  const creds = await getCredentials();
  if (!creds.ok) return creds;

  let base64: string;
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    base64 = bytes.toString("base64");
  } catch (error) {
    console.error("[Airtable Gov ID] failed to read uploaded file:", error);
    return { ok: false, error: GENERIC_UPLOAD_ERROR, status: 500 };
  }

  const filename = file.name.trim() || "government-id";
  const contentType = resolveContentType(file);
  const encodedRecordId = encodeURIComponent(found.recordId);
  const encodedField = encodeURIComponent(GOVERNMENT_ID_FIELD);
  // Airtable's content upload host (api.airtable.com returns 404 for this path).
  const requestUrl = `https://content.airtable.com/v0/${creds.baseId}/${encodedRecordId}/${encodedField}/uploadAttachment`;

  const logDevUploadContext = (extra: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "development") return;
    console.error("[Airtable Gov ID] uploadAttachment debug", {
      baseId: creds.baseId,
      tableName: APPLICATIONS_TABLE,
      matchedRecordId: found.recordId,
      governmentIdFieldName: GOVERNMENT_ID_FIELD,
      encodedFieldPathSegment: encodedField,
      contentType,
      filename,
      // Never log token, file bytes/base64, or attachment URLs.
      ...extra,
    });
  };

  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contentType,
        file: base64,
        filename,
      }),
      cache: "no-store",
    });

    const responseText = await response.text();
    let responseBody: unknown = null;
    try {
      responseBody = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseBody = { raw: responseText.slice(0, 500) };
    }

    if (!response.ok) {
      const airtableError =
        responseBody &&
        typeof responseBody === "object" &&
        "error" in responseBody
          ? (responseBody as { error?: unknown }).error
          : responseBody;

      logDevUploadContext({
        httpStatus: response.status,
        airtableError,
        responseBody,
      });

      return {
        ok: false,
        error: GENERIC_UPLOAD_ERROR,
        status: response.status === 429 ? 429 : 503,
      };
    }

    if (process.env.NODE_ENV === "development") {
      logDevUploadContext({
        httpStatus: response.status,
        uploadSucceeded: true,
      });
    }

    return { ok: true };
  } catch (error) {
    logDevUploadContext({
      networkError:
        error instanceof Error ? error.message : "unknown network error",
    });
    console.error("[Airtable Gov ID] uploadAttachment network error:", error);
    return {
      ok: false,
      error: GENERIC_UPLOAD_ERROR,
      status: 503,
    };
  }
}

/**
 * Build Airtable fields for a vetting-status update.
 * When status is approved, also clear Government ID in the same payload.
 */
export function vettingStatusUpdateFields(status: string): Record<string, unknown> {
  const normalized = status.trim().toLowerCase();
  const fields: Record<string, unknown> = {
    "Vetting Status": status.trim(),
  };

  if (normalized === VETTING_STATUS_APPROVED) {
    fields[GOVERNMENT_ID_FIELD] = [];
  }

  return fields;
}
