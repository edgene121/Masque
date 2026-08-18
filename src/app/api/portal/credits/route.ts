import { NextResponse } from "next/server";
import { getPortalCreditsByEmail } from "@/lib/portal/airtable-credits";

export const runtime = "nodejs";

/**
 * Read-only Credits & Referrals for a member email.
 * Does not award credits or expose Airtable credentials.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const result = await getPortalCreditsByEmail(email);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true, ...result.data });
}
