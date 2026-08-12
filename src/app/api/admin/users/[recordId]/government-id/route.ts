import { getApplicationRawFieldsById } from "@/lib/admin/applications";
import { getGovernmentIdAttachment } from "@/lib/admin/application-detail";
import { getAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ recordId: string }>;
}

/**
 * Authenticated proxy for Government ID attachment bytes.
 * Keeps Airtable attachment URLs out of the admin HTML.
 */
export async function GET(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { recordId } = await context.params;
  if (!recordId || !/^rec[a-zA-Z0-9]+$/.test(recordId)) {
    return new Response("Not found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const disposition =
    searchParams.get("download") === "1" ? "attachment" : "inline";

  const result = await getApplicationRawFieldsById(recordId);
  if (!result.ok) {
    return new Response(
      result.status === 404 ? "Not found" : "Unable to load document",
      { status: result.status },
    );
  }

  const attachment = getGovernmentIdAttachment(result.fields);
  if (!attachment || typeof attachment.url !== "string" || !attachment.url.trim()) {
    return new Response("No ID document uploaded", { status: 404 });
  }

  const fileUrl = attachment.url.trim();

  try {
    const upstream = await fetch(fileUrl, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      console.error("[Admin Gov ID proxy] upstream fetch failed", {
        status: upstream.status,
        recordId,
      });
      return new Response("Unable to load document", { status: 502 });
    }

    const contentType =
      attachment.type ||
      upstream.headers.get("content-type") ||
      "application/octet-stream";
    const filename = attachment.filename || "government-id";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `${disposition}; filename="${filename.replace(/"/g, "")}"`,
    );
    headers.set("Cache-Control", "private, no-store");

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[Admin Gov ID proxy] network error:", error);
    return new Response("Unable to load document", { status: 503 });
  }
}
