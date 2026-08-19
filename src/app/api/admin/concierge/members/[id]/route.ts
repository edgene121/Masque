import { NextResponse } from "next/server";
import { updatePeopleConciergeFields } from "@/lib/admin/concierge-update";
import { getAdminSession } from "@/lib/admin/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const GENERIC_ERROR = "Unable to save Concierge information. Please try again.";

function readString(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  if (!(key in body)) return "";
  const value = (body as Record<string, unknown>)[key];
  if (value == null) return "";
  if (typeof value !== "string") return null;
  return value;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id || !/^rec[a-zA-Z0-9]{10,}$/.test(id)) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const conciergeStatus = readString(body, "conciergeStatus");
  const conciergeWelcomeDate = readString(body, "conciergeWelcomeDate");
  const lastConciergeContact = readString(body, "lastConciergeContact");
  const conciergeNotes = readString(body, "conciergeNotes");
  const escalation = readString(body, "escalation");

  if (
    conciergeStatus == null ||
    conciergeWelcomeDate == null ||
    lastConciergeContact == null ||
    conciergeNotes == null ||
    escalation == null
  ) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const result = await updatePeopleConciergeFields(id, {
    conciergeStatus,
    conciergeWelcomeDate,
    lastConciergeContact,
    conciergeNotes,
    escalation,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true, values: result.values });
}
