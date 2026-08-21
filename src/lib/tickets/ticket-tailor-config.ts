/**
 * Ticket Tailor box-office custom domain (configuration/readiness only).
 *
 * This is public widget configuration, not a secret.
 *
 * Future production value example:
 * https://tickets.masque.co
 *
 * Do not hardcode a live Ticket Tailor or Masqué tickets domain until the
 * Ticket Tailor box office custom domain and DNS have been configured.
 *
 * Future setup (do not run until Ticket Tailor provides official values):
 * 1. Configure the custom domain in Ticket Tailor.
 * 2. Add the DNS record for the approved Masqué subdomain.
 * 3. Wait for TLS/domain verification.
 * 4. Set:
 *    NEXT_PUBLIC_TICKET_TAILOR_CUSTOM_DOMAIN=https://tickets.masque.co
 * 5. Redeploy.
 * 6. Verify widget checkout and customer prefill.
 *
 * Customer checkout prefill may depend on this custom-domain setup.
 * Prefill remains inactive until the official single-event embed HTML and
 * domain configuration are available.
 */

const ENV_CUSTOM_DOMAIN =
  process.env.NEXT_PUBLIC_TICKET_TAILOR_CUSTOM_DOMAIN ?? "";

/**
 * Accepts only an HTTPS origin.
 * Invalid, empty, http, protocol-relative, and non-URL values return null.
 */
export function parseTicketTailorCustomDomain(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;

  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  if (!trimmed.toLowerCase().startsWith("https://")) {
    return null;
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (!url.hostname) return null;

    return url.origin;
  } catch {
    return null;
  }
}

export const TICKET_TAILOR_CUSTOM_DOMAIN: string | null =
  parseTicketTailorCustomDomain(ENV_CUSTOM_DOMAIN);

export const TICKET_TAILOR_PUBLIC_HOST =
  TICKET_TAILOR_CUSTOM_DOMAIN || null;
