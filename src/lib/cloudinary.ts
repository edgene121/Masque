import "server-only";
import { createHash } from "crypto";

const MAX_GOV_ID_BYTES = 2 * 1024 * 1024; // strictly less than 2MB enforced by callers as size < MAX

export const GOV_ID_MAX_BYTES = MAX_GOV_ID_BYTES;

export const GOV_ID_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

export const GOV_ID_ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf",
]);

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
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

function signParams(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

/**
 * Upload a government ID to Cloudinary (server-side signed upload).
 * Returns the secure hosted URL.
 */
export async function uploadGovIdToCloudinary(file: File): Promise<string> {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error(
      "Document upload is not configured. Missing Cloudinary server credentials.",
    );
  }

  const validationError = validateGovIdFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = "masque/gov-ids";
  const paramsToSign: Record<string, string> = {
    folder,
    timestamp,
  };
  const signature = signParams(paramsToSign, config.apiSecret);

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", config.apiKey);
  body.append("timestamp", timestamp);
  body.append("folder", folder);
  body.append("signature", signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`;
  const response = await fetch(endpoint, {
    method: "POST",
    body,
  });

  const payload = (await response.json()) as {
    secure_url?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(
      payload.error?.message || "Unable to upload government ID. Please try again.",
    );
  }

  const url = (payload.secure_url || payload.url || "").trim();
  if (!url) {
    throw new Error("Upload succeeded but no file URL was returned.");
  }

  return url;
}
