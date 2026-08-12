import { NextResponse } from "next/server";
import {
  getFeaturedEventForDashboard,
  listPortalEvents,
} from "@/lib/portal/airtable-events";

export const runtime = "nodejs";

/**
 * Read-only Member Portal events from Airtable (server-side).
 * Query: ?scope=featured | upcoming | past | all (default all)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = (searchParams.get("scope") ?? "all").trim().toLowerCase();

  if (scope === "featured") {
    const event = await getFeaturedEventForDashboard();
    return NextResponse.json({ ok: true, event });
  }

  const result = await listPortalEvents();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 503 },
    );
  }

  if (scope === "upcoming") {
    return NextResponse.json({ ok: true, events: result.upcoming });
  }

  if (scope === "past") {
    return NextResponse.json({ ok: true, events: result.past });
  }

  return NextResponse.json({
    ok: true,
    upcoming: result.upcoming,
    past: result.past,
  });
}
