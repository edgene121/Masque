import { NextResponse } from "next/server";
import { getReferralCodeByEmail } from "@/lib/portal/airtable-people-referral";

export const runtime = "nodejs";

/**
 * Returns the Airtable People "Referral Code" for a member email.
 * Does not expose Airtable credentials or create records.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const result = await getReferralCodeByEmail(email);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, referralCode: "" },
      { status: result.status },
    );
  }

  return NextResponse.json({
    referralCode: result.referralCode,
  });
}
