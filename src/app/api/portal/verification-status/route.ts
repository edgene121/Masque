import { NextResponse } from "next/server";
import { getPeopleVerificationStatusByEmail } from "@/lib/portal/airtable-people-verification";

export const runtime = "nodejs";

/**
 * Read-only People "Verification Status" for a member email.
 * Does not write to Airtable.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: "Email is required.", verificationStatus: null },
      { status: 400 },
    );
  }

  const result = await getPeopleVerificationStatusByEmail(email);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        verificationStatus: null,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    verificationStatus: result.verificationStatus,
  });
}
