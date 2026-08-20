export const DEFAULT_POST_LOGIN_PATH = "/dashboard";

function decodePathCandidate(value: string): string | null {
  let decoded = value;

  for (let i = 0; i < 5; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) {
        return decoded;
      }
      decoded = next;
    } catch {
      return null;
    }
  }

  return decoded;
}

/**
 * Accepts only same-origin application paths.
 * Rejects protocol-relative URLs, external origins, and dangerous schemes.
 */
export function getSafeInternalPath(
  candidate: string | null | undefined,
): string | null {
  if (typeof candidate !== "string") {
    return null;
  }

  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }

  const decoded = decodePathCandidate(trimmed);
  if (!decoded) {
    return null;
  }

  const value = decoded.trim();

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (value.includes("\\") || value.includes("://")) {
    return null;
  }

  if (/[\u0000-\u001F\u007F]/.test(value)) {
    return null;
  }

  const lower = value.toLowerCase();
  if (
    lower.includes("javascript:") ||
    lower.includes("data:") ||
    lower.includes("vbscript:")
  ) {
    return null;
  }

  const pathOnly = value.split(/[?#]/, 1)[0];
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//")) {
    return null;
  }

  if (pathOnly === "/" || pathOnly === "/login" || pathOnly.startsWith("/login/")) {
    return null;
  }

  return value;
}

export function getPostLoginPath(candidate: string | null | undefined): string {
  return getSafeInternalPath(candidate) ?? DEFAULT_POST_LOGIN_PATH;
}

export function buildLoginRedirect(pathname: string): string {
  const safePath = getSafeInternalPath(pathname);

  if (!safePath) {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(safePath)}`;
}
