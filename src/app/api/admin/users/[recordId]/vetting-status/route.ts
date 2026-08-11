import { NextResponse } from "next/server";
import {
  markApplicationPending,
  VETTING_STATUS_PENDING,
} from "@/lib/admin/applications";
import { getAdminSession } from "@/lib/admin/session";

interface RouteContext {
  params: Promise<{ recordId: string }>;
}

const GENERIC_ERROR = "Unable to update this application. Please try again.";

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const { recordId } = await context.params;
  if (!recordId || !/^rec[a-zA-Z0-9]+$/.test(recordId)) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const status =
    typeof body === "object" &&
    body !== null &&
    "status" in body &&
    typeof (body as { status: unknown }).status === "string"
      ? (body as { status: string }).status.trim()
      : "";

  // Only the controlled transition target is accepted from the client.
  if (status !== VETTING_STATUS_PENDING) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const result = await markApplicationPending(recordId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    record: {
      id: result.record.id,
      name: result.record.name,
      email: result.record.email,
      vettingStatus: result.record.vettingStatus,
      memberStatus: result.record.memberStatus,
      createdTime: result.record.createdTime,
      joinedDisplay: result.record.joinedDisplay,
    },
  });
}
