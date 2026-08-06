/**
 * Vendor-neutral product analytics for Orbis.
 * Development logs structured events; an optional sink can forward them later.
 * Never throws from track(); never includes PII or user-generated content.
 */

export interface AnalyticsEventProperties {
  landing_cta_click: {
    placement: "hero" | "navigation" | "footer" | "other";
  };

  landing_prompt_submit: {
    has_text: boolean;
  };

  auth_guest_start: {
    from: "landing" | "try_route" | "auth" | "other";
  };

  onboarding_goal_select: {
    goal: "generate" | "validate" | "chat";
  };

  onboarding_skip: Record<string, never>;

  research_started: {
    type: "generate" | "validate";
    mode: "regular" | "deep";
    credits_left: number | null;
  };

  research_succeeded: {
    type: "generate" | "validate";
    mode: "regular" | "deep";
    duration_ms: number;
  };

  research_failed: {
    type: "generate" | "validate";
    code:
      | "rate_limited"
      | "usage_limited"
      | "authentication"
      | "network"
      | "server"
      | "invalid_response"
      | "unknown";
  };

  quota_hit: {
    surface:
      | "generate"
      | "validate"
      | "reports_meter"
      | "dashboard"
      | "profile";
  };

  waitlist_join: {
    source:
      | "upgrade_general"
      | "upgrade_exhausted"
      | "profile"
      | "dashboard"
      | "other";
  };

  post_quota_chat_click: Record<string, never>;

  idea_saved: {
    from:
      | "generator_result"
      | "validation_result"
      | "history_generator"
      | "history_validation";
  };

  report_opened_from_dashboard: Record<string, never>;

  next_step_click: {
    action:
      | "validate_idea"
      | "save_idea"
      | "ask_orbis"
      | "view_history"
      | "export";
  };

  export_markdown: {
    type: "generator" | "validation";
  };
}

export type AnalyticsEventName = keyof AnalyticsEventProperties;

/** Empty-property events use `Record<string, never>`; keyof that is not `never` in TS. */
export type AnalyticsTrackArgs<K extends AnalyticsEventName> =
  AnalyticsEventProperties[K] extends Record<string, never>
    ? []
    : [properties: AnalyticsEventProperties[K]];

export interface AnalyticsEnvelope<
  K extends AnalyticsEventName = AnalyticsEventName,
> {
  event: K;
  properties: AnalyticsEventProperties[K];
  occurredAt: string;
}

export type AnalyticsSink = (
  envelope: AnalyticsEnvelope,
) => void | Promise<void>;

export type ResearchFailureCode = AnalyticsEventProperties["research_failed"]["code"];

export type WaitlistJoinSource = AnalyticsEventProperties["waitlist_join"]["source"];

export type UpgradeModalModeForAnalytics = "general" | "quota_exhausted";

export type UpgradeModalSourceForAnalytics =
  | "meter"
  | "generate"
  | "validate"
  | "dashboard"
  | "profile"
  | undefined;

let sink: AnalyticsSink | null = null;

/** Reset sink between tests. Prefer setAnalyticsSink(null) in production. */
export function __resetAnalyticsForTests(): void {
  sink = null;
}

export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
}

export function normalizeCreditsLeft(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

export function normalizeDurationMs(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

export function monotonicNow(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

export function classifyResearchFailure(err: unknown): ResearchFailureCode {
  const text = extractErrorText(err).toLowerCase();

  if (
    text.includes("429") ||
    text.includes("rate limit") ||
    text.includes("too many requests")
  ) {
    return "rate_limited";
  }
  if (
    text.includes("402") ||
    text.includes("usage limit") ||
    text.includes("payment required")
  ) {
    return "usage_limited";
  }
  if (
    text.includes("401") ||
    text.includes("403") ||
    text.includes("unauthorized") ||
    text.includes("unauthenticated") ||
    text.includes("not authenticated") ||
    text.includes("jwt") ||
    text.includes("session")
  ) {
    return "authentication";
  }
  if (
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("network error") ||
    text.includes("network request failed") ||
    text.includes("err_network") ||
    text.includes("econnreset") ||
    text.includes("enotfound")
  ) {
    return "network";
  }
  if (
    text.includes("invalid") ||
    text.includes("malformed") ||
    text.includes("missing") ||
    text.includes("unexpected token") ||
    text.includes("parse")
  ) {
    return "invalid_response";
  }
  if (
    text.includes("500") ||
    text.includes("502") ||
    text.includes("503") ||
    text.includes("504") ||
    text.includes("internal server") ||
    text.includes("function_invocation") ||
    text.includes("unable_to_fulfill") ||
    text.includes("timed out") ||
    text.includes("deadline") ||
    text.includes("timeout")
  ) {
    return "server";
  }
  return "unknown";
}

function extractErrorText(err: unknown): string {
  if (err == null) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || "";
  if (typeof err === "object") {
    const o = err as { message?: unknown; error?: unknown; status?: unknown; code?: unknown };
    const parts = [o.message, o.error, o.status, o.code]
      .filter((v) => v != null && v !== "")
      .map(String);
    return parts.join(" ");
  }
  return String(err);
}

export function resolveWaitlistJoinSource(
  mode: UpgradeModalModeForAnalytics,
  source: UpgradeModalSourceForAnalytics,
): WaitlistJoinSource {
  if (source === "profile") return "profile";
  if (source === "dashboard") return "dashboard";
  if (mode === "quota_exhausted") return "upgrade_exhausted";
  if (mode === "general") return "upgrade_general";
  return "other";
}

function isDev(): boolean {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
}

function normalizeProperties<K extends AnalyticsEventName>(
  event: K,
  properties: AnalyticsEventProperties[K],
): AnalyticsEventProperties[K] {
  if (event === "research_started") {
    const p = properties as AnalyticsEventProperties["research_started"];
    return {
      ...p,
      credits_left: normalizeCreditsLeft(p.credits_left),
    } as AnalyticsEventProperties[K];
  }
  if (event === "research_succeeded") {
    const p = properties as AnalyticsEventProperties["research_succeeded"];
    return {
      ...p,
      duration_ms: normalizeDurationMs(p.duration_ms),
    } as AnalyticsEventProperties[K];
  }
  return properties;
}

function dispatchSink(envelope: AnalyticsEnvelope): void {
  if (!sink) return;
  try {
    const result = sink(envelope);
    if (result != null && typeof (result as Promise<void>).then === "function") {
      void Promise.resolve(result).catch(() => {
        /* sink failures must never break product actions */
      });
    }
  } catch {
    /* synchronous sink exceptions are swallowed */
  }
}

export function track<K extends AnalyticsEventName>(
  event: K,
  ...args: AnalyticsTrackArgs<K>
): void {
  const rawProperties = (args[0] ?? {}) as AnalyticsEventProperties[K];
  const properties = normalizeProperties(event, rawProperties);
  const envelope: AnalyticsEnvelope<K> = {
    event,
    properties,
    occurredAt: new Date().toISOString(),
  };

  if (isDev()) {
    console.info("[orbis:analytics]", envelope);
  }

  dispatchSink(envelope as AnalyticsEnvelope);
}
