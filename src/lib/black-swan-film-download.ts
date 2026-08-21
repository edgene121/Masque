// Add the final Black Swan Theory downloadable MP4 URL here once provided.
export const BLACK_SWAN_DOWNLOAD_URL: string | null = null;

/**
 * Accepts only an absolute HTTPS URL.
 * javascript:, data:, http:, relative, and malformed values return null.
 */
export function parseBlackSwanDownloadUrl(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.toLowerCase().startsWith("https://")) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (!url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getBlackSwanDownloadUrl(): string | null {
  return parseBlackSwanDownloadUrl(BLACK_SWAN_DOWNLOAD_URL);
}

function logDownloadDev(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (error === undefined) {
    console.warn("[Black Swan download]", message);
    return;
  }

  console.warn("[Black Swan download]", message, error);
}

/**
 * Starts a browser download via a temporary anchor. If the host ignores the
 * download attribute, the file opens in a new tab so the member can save it.
 * Does not navigate the current event page.
 */
export function startBlackSwanFilmDownload(url: string): boolean {
  try {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "black-swan-theory.mp4");
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } catch (error) {
    logDownloadDev("anchor download failed; opening in a new tab", error);

    try {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      return Boolean(opened);
    } catch (openError) {
      logDownloadDev("new-tab fallback failed", openError);
      return false;
    }
  }
}
