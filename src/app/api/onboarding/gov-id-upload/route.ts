import { NextResponse } from "next/server";
import {
  uploadGovernmentIdFileByEmail,
  validateGovIdFile,
} from "@/lib/admin/government-id";

export const runtime = "nodejs";

const GENERIC_UPLOAD_ERROR =
  "Unable to upload your ID document. Please try again.";

/**
 * Upload government ID file bytes directly to Airtable
 * Applications "Government ID" attachment field.
 * Does NOT use Cloudinary or Memberstack for file storage.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const emailRaw = formData.get("email");
    const email =
      typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to save your government ID." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a government-issued ID file." },
        { status: 400 },
      );
    }

    const validationError = validateGovIdFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await uploadGovernmentIdFileByEmail(email, file);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json({ ok: true, uploaded: true });
  } catch (error) {
    console.error("[Gov ID Upload] unexpected error:", error);
    return NextResponse.json({ error: GENERIC_UPLOAD_ERROR }, { status: 500 });
  }
}
