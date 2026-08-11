import { NextResponse } from "next/server";
import {
  isCloudinaryConfigured,
  uploadGovIdToCloudinary,
  validateGovIdFile,
} from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            "Document upload is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the server.",
        },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

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

    const url = await uploadGovIdToCloudinary(file);

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to upload government ID. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
