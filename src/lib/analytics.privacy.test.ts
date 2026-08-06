import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetAnalyticsForTests,
  setAnalyticsSink,
  track,
  type AnalyticsEnvelope,
} from "./analytics";

const FORBIDDEN_KEYS = [
  "user",
  "user_id",
  "email",
  "name",
  "display_name",
  "prompt",
  "text",
  "idea",
  "title",
  "description",
  "content",
  "file",
  "filename",
  "url",
  "path",
  "query",
  "error",
  "message",
  "record_id",
] as const;

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (value == null || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    keys.add(k);
    collectKeys(v, keys);
  }
  return keys;
}

describe("analytics privacy regression", () => {
  const envelopes: AnalyticsEnvelope[] = [];
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetAnalyticsForTests();
    envelopes.length = 0;
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    setAnalyticsSink((envelope) => {
      envelopes.push(envelope);
    });
  });

  afterEach(() => {
    __resetAnalyticsForTests();
    infoSpy.mockRestore();
  });

  it("representative instrumented events never include forbidden property keys", () => {
    track("landing_cta_click", { placement: "hero" });
    track("auth_guest_start", { from: "try_route" });
    track("onboarding_goal_select", { goal: "generate" });
    track("onboarding_skip");
    track("research_started", {
      type: "generate",
      mode: "regular",
      credits_left: 2,
    });
    track("research_succeeded", {
      type: "validate",
      mode: "deep",
      duration_ms: 1200,
    });
    track("research_failed", { type: "generate", code: "network" });
    track("quota_hit", { surface: "reports_meter" });
    track("waitlist_join", { source: "upgrade_exhausted" });
    track("post_quota_chat_click");
    track("idea_saved", { from: "history_generator" });
    track("report_opened_from_dashboard");

    expect(envelopes.length).toBeGreaterThanOrEqual(12);

    for (const envelope of envelopes) {
      const keys = collectKeys(envelope.properties);
      for (const forbidden of FORBIDDEN_KEYS) {
        expect(keys.has(forbidden)).toBe(false);
      }
      expect(envelope).not.toHaveProperty("user");
      expect(envelope).not.toHaveProperty("user_id");
      expect(envelope).not.toHaveProperty("email");
    }
  });
});
