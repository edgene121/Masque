import { NextResponse } from "next/server";
import { getPeopleCreditSummaryByEmail } from "@/lib/portal/airtable-credits";

export const runtime = "nodejs";

const ZERO_SUMMARY = {
  creditsAvailable: 0,
  qualifiedReferrals: 0,
  creditsRedeemed: 0,
  referralCode: "",
  invitedFriends: [],
  invitedBy: "",
  creditHistory: [],
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

  const result = await getPeopleCreditSummaryByEmail(email, {
    memberstackId: (searchParams.get("memberstackId") ?? "").trim() || undefined,
  });
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
    referralCode: result.referralCode,
    invitedFriends: result.invitedFriends,
    invitedBy: result.invitedBy,
    creditHistory: result.creditHistory.map((row) => ({
      date: row.date,
      activity: row.activity,
      credits: row.credits,
    })),
  });
}
