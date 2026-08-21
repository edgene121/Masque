export type AnalyticsEventName =
  | "black_swan_share_clicked"
  | "black_swan_share_completed"
  | "black_swan_link_copied"
  | "black_swan_save_film_clicked"
  | "black_swan_save_film_started";

type AnalyticsPayload = Record<string, unknown>;

type AnalyticsProvider = {
  track: (name: AnalyticsEventName, payload?: AnalyticsPayload) => void;
};

let provider: AnalyticsProvider | null = null;

/** Connect a real analytics vendor later without changing call sites. */
export function setAnalyticsProvider(next: AnalyticsProvider | null) {
  provider = next;
}

export function trackEvent(
  name: AnalyticsEventName,
  payload?: AnalyticsPayload,
) {
  try {
    provider?.track(name, payload);

    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics]", name, payload ?? {});
    }
  } catch {
    // Never interrupt CTA behavior if analytics is unavailable.
  }
}
