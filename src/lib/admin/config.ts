import "server-only";

export function getAirtableConfig() {
  const accessToken = process.env.AIRTABLE_ACCESS_TOKEN?.trim();
  // Guard against accidental trailing punctuation in .env (e.g. "appXXX.").
  const baseId = process.env.AIRTABLE_BASE_ID?.trim().replace(/\.+$/, "");
  const adminsTable = process.env.AIRTABLE_ADMINS_TABLE?.trim() || "Admins";

  if (!accessToken || !baseId) {
    throw new Error("Missing Airtable admin configuration.");
  }

  return { accessToken, baseId, adminsTable };
}

export function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set (min 32 characters).");
  }
  return new TextEncoder().encode(secret);
}

export const ADMIN_SESSION_COOKIE = "masque_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 10; // 10 hours
