import "server-only";

import { redirect } from "next/navigation";
import {
  findAdminByEmail,
  toPublicAdmin,
  updateAdminLastLogin,
  type AdminRecord,
} from "./airtable";
import { createAdminSessionToken, getAdminSession } from "./session";
import type { AdminSessionPayload } from "@/types/admin";

export type AdminAuthResult =
  | { ok: true; admin: ReturnType<typeof toPublicAdmin>; token: string }
  | { ok: false; error: string; status: number };

const GENERIC_INVALID = "Invalid email or password.";
const GENERIC_DISABLED = "Invalid email or password.";
const GENERIC_UNAVAILABLE = "Unable to sign in right now. Please try again.";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * TEMPORARY development password check against Airtable "Password" (plain text).
 * Do not log either value.
 */
function passwordsMatch(
  submittedPassword: string,
  storedPassword: string,
): boolean {
  const left = String(submittedPassword ?? "").trim();
  const right = String(storedPassword ?? "").trim();
  return left.length > 0 && left === right;
}

function isActiveStatus(status: string): boolean {
  return status.trim().toLowerCase() === "active";
}

/**
 * Authenticate an admin against Airtable.
 * Never returns password values to the browser.
 */
export async function authenticateAdmin(
  emailInput: string,
  password: string,
): Promise<AdminAuthResult> {
  const email = normalizeEmail(emailInput);
  const submittedPassword = String(password ?? "").trim();

  if (!email || !submittedPassword) {
    return { ok: false, error: GENERIC_INVALID, status: 400 };
  }

  let admin: AdminRecord | null;

  try {
    admin = await findAdminByEmail(email);
  } catch (error) {
    console.error("Admin Airtable lookup error:", error);
    return { ok: false, error: GENERIC_UNAVAILABLE, status: 503 };
  }

  if (!admin) {
    // TEMPORARY debug
    console.error("[AdminAuth Debug] No matching admin email record.");
    return { ok: false, error: GENERIC_INVALID, status: 401 };
  }

  const passwordMatches = passwordsMatch(submittedPassword, admin.password);

  // TEMPORARY debug — never log the actual password
  console.error("[AdminAuth Debug] Password check", {
    recordId: admin.id,
    email: admin.email,
    status: admin.status,
    role: admin.role,
    passwordFieldExists: admin.passwordFieldPresent,
    passwordComparisonSucceeded: passwordMatches,
  });

  if (!passwordMatches) {
    return { ok: false, error: GENERIC_INVALID, status: 401 };
  }

  if (!isActiveStatus(admin.status)) {
    console.error("[AdminAuth Debug] Admin status is not Active", {
      recordId: admin.id,
      status: admin.status,
    });
    return { ok: false, error: GENERIC_DISABLED, status: 403 };
  }

  let token: string;
  try {
    token = await createAdminSessionToken({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  } catch (error) {
    console.error("Admin session creation error:", error);
    return { ok: false, error: GENERIC_UNAVAILABLE, status: 503 };
  }

  try {
    await updateAdminLastLogin(admin.id);
  } catch {
    // Best-effort only — table may not have Last Login yet
  }

  console.error("[AdminAuth Debug] Login succeeded", {
    recordId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  return {
    ok: true,
    admin: toPublicAdmin(admin),
    token,
  };
}

export async function requireAdmin(): Promise<AdminSessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
