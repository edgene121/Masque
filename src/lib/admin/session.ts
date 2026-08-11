import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AdminSessionPayload } from "@/types/admin";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  getAdminSessionSecret,
} from "./config";

export type { AdminSessionPayload };

function sessionCookieOptions(maxAge = ADMIN_SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createAdminSessionToken(
  payload: AdminSessionPayload,
): Promise<string> {
  const secret = getAdminSessionSecret();

  return new SignJWT({
    adminId: payload.adminId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret);
}

export async function verifyAdminSessionToken(
  token: string,
): Promise<AdminSessionPayload | null> {
  try {
    const secret = getAdminSessionSecret();
    const { payload } = await jwtVerify(token, secret);

    const adminId = typeof payload.adminId === "string" ? payload.adminId : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const name = typeof payload.name === "string" ? payload.name : "";
    const role = typeof payload.role === "string" ? payload.role : "";

    if (!adminId || !email) return null;

    return { adminId, email, name, role };
  } catch {
    return null;
  }
}

/** Attach signed admin session cookie to a Route Handler response. */
export function setAdminSessionCookie(
  response: NextResponse,
  token: string,
): void {
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    token,
    sessionCookieOptions(),
  );
}

/** Clear admin session cookie on a Route Handler response. */
export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...sessionCookieOptions(0),
    maxAge: 0,
  });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
