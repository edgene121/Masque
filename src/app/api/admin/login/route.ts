import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin/auth";
import { setAdminSessionCookie } from "@/lib/admin/session";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 400 },
    );
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email
      : "";

  const password =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  const result = await authenticateAdmin(email, password);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  const response = NextResponse.json({
    ok: true,
    admin: {
      id: result.admin.id,
      email: result.admin.email,
      name: result.admin.name,
      role: result.admin.role,
    },
  });

  setAdminSessionCookie(response, result.token);
  return response;
}
