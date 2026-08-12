import { NextResponse } from "next/server";
import { applicationHasGovernmentIdByEmail } from "@/lib/admin/government-id";

export const runtime = "nodejs";

/**
 * Returns whether the matched Airtable application has a Government ID attachment.
 * Does not expose attachment URLs.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 },
    );
  }

  const result = await applicationHasGovernmentIdByEmail(email);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({
    hasGovernmentId: result.hasGovernmentId,
  });
}
