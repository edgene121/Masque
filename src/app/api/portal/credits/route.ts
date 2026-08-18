import { NextResponse } from "next/server";
import { getPeopleCreditSummaryByEmail } from "@/lib/portal/airtable-credits";

export const runtime = "nodejs";

const ZERO_SUMMARY = {
  creditsAvailable: 0,
  qualifiedReferrals: 0,
  creditsRedeemed: 0,
};

/**
 * Read-only People credit summary for a member email.
 * Does not expose Airtable credentials.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required.", ...ZERO_SUMMARY }, {
      status: 400,
    });
  }

  const result = await getPeopleCreditSummaryByEmail(email);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, ...ZERO_SUMMARY },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    creditsAvailable: result.creditsAvailable,
    qualifiedReferrals: result.qualifiedReferrals,
    creditsRedeemed: result.creditsRedeemed,
  });
}
