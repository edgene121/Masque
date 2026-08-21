export type AnalyticsEventName =
  | "black_swan_public_page_view"
  | "black_swan_film_play_clicked"
  | "black_swan_film_started"
  | "black_swan_film_completed"
  | "black_swan_member_access_clicked"
  | "black_swan_request_membership_clicked"
  | "black_swan_member_event_view"
  | "black_swan_event_access_viewed"
  | "black_swan_ticket_section_viewed"
  | "black_swan_ticket_widget_loading"
  | "black_swan_ticket_widget_loaded"
  | "black_swan_ticket_widget_error"
  | "black_swan_share_clicked"
  | "black_swan_share_completed"
  | "black_swan_link_copied"
  | "black_swan_save_film_clicked"
  | "black_swan_save_film_started";

export type BlackSwanAnalyticsPage = "public" | "member";
export type BlackSwanVideoProvider = "cloudflare" | "vimeo" | "unknown";

export type BlackSwanAnalyticsProps = {
  page?: BlackSwanAnalyticsPage;
  event?: "black-swan-theory";
  route?: string;
  provider?: BlackSwanVideoProvider;
  ticketWidgetConfigured?: boolean;
};

type AnalyticsPayload = Record<string, unknown>;

type AnalyticsProvider = {
  track: (name: AnalyticsEventName, payload?: AnalyticsPayload) => void;
};

const SENSITIVE_KEY =
  /email|firstname|lastname|fullname|phone|memberstack|airtable|recordid|referral|membershipstatus|idverified|memberid|userid/i;

const onceKeys = new Set<string>();

let provider: AnalyticsProvider | null = null;

/** Connect a real analytics vendor later without changing call sites. */
export function setAnalyticsProvider(next: AnalyticsProvider | null) {
  provider = next;
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key.replace(/[_-\s]/g, ""));
}

function looksLikeEmail(value: unknown): boolean {
  return typeof value === "string" && value.includes("@");
}

function sanitizePayload(
  payload?: AnalyticsPayload,
): AnalyticsPayload | undefined {
  if (!payload) return undefined;

  const next: AnalyticsPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (isSensitiveKey(key) || looksLikeEmail(value)) {
      continue;
    }
    next[key] = value;
  }
  return next;
}

export function blackSwanAnalyticsProps(
  page: BlackSwanAnalyticsPage,
  extra?: Omit<BlackSwanAnalyticsProps, "page" | "event">,
): BlackSwanAnalyticsProps {
  return {
    page,
    event: "black-swan-theory",
    route: page === "member" ? "/events/black-swan-theory" : "/black-swan-theory",
    ...extra,
  };
}

export function trackEvent(
  name: AnalyticsEventName,
  payload?: AnalyticsPayload,
) {
  try {
    const safe = sanitizePayload(payload);
    provider?.track(name, safe);

    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics]", name, safe ?? {});
    }
  } catch {
    // Never interrupt CTA behavior if analytics is unavailable.
  }
}

/** Fire once per browser session for a given event+key (survives Strict Mode remounts). */
export function trackEventOnce(
  name: AnalyticsEventName,
  onceKey: string,
  payload?: AnalyticsPayload,
) {
  const key = `${name}:${onceKey}`;
  if (onceKeys.has(key)) {
    return;
  }
  onceKeys.add(key);
  trackEvent(name, payload);
}
