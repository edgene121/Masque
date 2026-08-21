import { NextResponse } from "next/server";
import { getPeopleEventAccessByEmail } from "@/lib/portal/airtable-people-event-access";

export const runtime = "nodejs";

/**
 * Read-only People Membership Status and ID Verified for a member email.
 * Does not expose Airtable credentials.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: "Email is required.", membershipStatus: null, idVerified: null },
      { status: 400 },
    );
  }

  const result = await getPeopleEventAccessByEmail(email);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        membershipStatus: null,
        idVerified: null,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    membershipStatus: result.membershipStatus,
    idVerified: result.idVerified,
  });
}
