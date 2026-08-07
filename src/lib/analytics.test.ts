import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetAnalyticsForTests,
  classifyResearchFailure,
  monotonicNow,
  normalizeCreditsLeft,
  normalizeDurationMs,
  setAnalyticsSink,
  track,
  type AnalyticsEnvelope,
  type AnalyticsEnvelopeFor,
  type AnalyticsEventProperties,
  type AnalyticsSink,
} from "./analytics";
import { InvalidResearchResponseError } from "./researchResponseValidation";

describe("analytics", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetAnalyticsForTests();
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    __resetAnalyticsForTests();
    infoSpy.mockRestore();
  });

  it("logs one structured event in development", () => {
    track("landing_cta_click", { placement: "hero" });
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(
      "[orbis:analytics]",
      expect.objectContaining({
        event: "landing_cta_click",
        properties: { placement: "hero" },
      }),
    );
  });

  it("includes an ISO-8601 occurredAt timestamp", () => {
    track("onboarding_skip");
    const envelope = infoSpy.mock.calls[0][1] as AnalyticsEnvelope;
    expect(envelope.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Number.isNaN(Date.parse(envelope.occurredAt))).toBe(false);
  });

  it("preserves the event name", () => {
    track("research_started", {
      type: "generate",
      mode: "regular",
      credits_left: 2,
    });
    const envelope = infoSpy.mock.calls[0][1] as AnalyticsEnvelope;
    expect(envelope.event).toBe("research_started");
  });

  it("preserves typed properties", () => {
    track("quota_hit", { surface: "validate" });
    const envelope = infoSpy.mock.calls[0][1] as AnalyticsEnvelopeFor<"quota_hit">;
    expect(envelope.properties).toEqual({ surface: "validate" });
  });

  it("produces empty properties for no-property events", () => {
    track("post_quota_chat_click");
    const envelope = infoSpy.mock.calls[0][1] as AnalyticsEnvelope;
    expect(envelope.properties).toEqual({});
  });

  it("accepts extended next_step_click actions with action-only properties", () => {
    const actions: AnalyticsEventProperties["next_step_click"]["action"][] = [
      "validate_idea",
      "save_idea",
      "ask_orbis",
      "view_history",
      "export",
      "view_saved_ideas",
      "back_to_all_reports",
    ];
    for (const action of actions) {
      track("next_step_click", { action });
    }
    expect(infoSpy).toHaveBeenCalledTimes(actions.length);
    for (let i = 0; i < actions.length; i++) {
      const envelope = infoSpy.mock.calls[i][1] as AnalyticsEnvelopeFor<"next_step_click">;
      expect(envelope.event).toBe("next_step_click");
      expect(envelope.properties).toEqual({ action: actions[i] });
      expect(Object.keys(envelope.properties)).toEqual(["action"]);
    }
  });

  it("replaces the sink", () => {
    const first = vi.fn();
    const second = vi.fn();
    setAnalyticsSink(first);
    track("onboarding_skip");
    setAnalyticsSink(second);
    track("report_opened_from_dashboard");
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second.mock.calls[0][0].event).toBe("report_opened_from_dashboard");
  });

  it("clears the sink", () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    setAnalyticsSink(null);
    track("onboarding_skip");
    expect(sink).not.toHaveBeenCalled();
  });

  it("does not throw when the sink throws synchronously", () => {
    setAnalyticsSink(() => {
      throw new Error("sink boom");
    });
    expect(() => track("onboarding_skip")).not.toThrow();
  });

  it("catches rejected sink promises", async () => {
    const sink: AnalyticsSink = () => Promise.reject(new Error("async boom"));
    setAnalyticsSink(sink);
    expect(() => track("onboarding_skip")).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
  });

  it("returns immediately without a blocking Promise", () => {
    let resolveSink!: () => void;
    setAnalyticsSink(
      () =>
        new Promise<void>((resolve) => {
          resolveSink = resolve;
        }),
    );
    const result = track("onboarding_skip");
    expect(result).toBeUndefined();
    resolveSink();
  });

  it("normalizes duration_ms to a non-negative finite integer", () => {
    expect(normalizeDurationMs(12.9)).toBe(12);
    expect(normalizeDurationMs(-1)).toBe(0);
    expect(normalizeDurationMs(Number.NaN)).toBe(0);
    expect(normalizeDurationMs(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeDurationMs("10")).toBe(0);

    track("research_succeeded", {
      type: "generate",
      mode: "deep",
      duration_ms: Number.NaN,
    });
    const envelope = infoSpy.mock.calls[0][1] as AnalyticsEnvelopeFor<"research_succeeded">;
    expect(envelope.properties.duration_ms).toBe(0);
  });

  it("normalizes credits_left to a non-negative integer or null", () => {
    expect(normalizeCreditsLeft(2.8)).toBe(2);
    expect(normalizeCreditsLeft(0)).toBe(0);
    expect(normalizeCreditsLeft(null)).toBe(null);
    expect(normalizeCreditsLeft(undefined)).toBe(null);
    expect(normalizeCreditsLeft(-3)).toBe(null);
    expect(normalizeCreditsLeft(Number.NaN)).toBe(null);
    expect(normalizeCreditsLeft(Number.POSITIVE_INFINITY)).toBe(null);

    track("research_started", {
      type: "validate",
      mode: "regular",
      credits_left: Number.POSITIVE_INFINITY,
    });
    const envelope = infoSpy.mock.calls[0][1] as AnalyticsEnvelopeFor<"research_started">;
    expect(envelope.properties.credits_left).toBe(null);
  });

  it("does not add automatic user, session, or browser fields", () => {
    track("auth_guest_start", { from: "try_route" });
    const envelope = infoSpy.mock.calls[0][1] as AnalyticsEnvelope;
    expect(Object.keys(envelope).sort()).toEqual(["event", "occurredAt", "properties"]);
    expect(envelope).not.toHaveProperty("user");
    expect(envelope).not.toHaveProperty("user_id");
    expect(envelope).not.toHaveProperty("email");
    expect(envelope).not.toHaveProperty("session");
    expect(envelope).not.toHaveProperty("anonymousId");
    expect(envelope).not.toHaveProperty("fingerprint");
    expect(envelope).not.toHaveProperty("url");
    expect(envelope.properties).toEqual({ from: "try_route" });
  });

  it("classifies research failures into coarse codes", () => {
    expect(classifyResearchFailure(new Error("429 rate limit"))).toBe("rate_limited");
    expect(classifyResearchFailure(new Error("402 usage limit"))).toBe("usage_limited");
    expect(classifyResearchFailure(new Error("401 Unauthorized"))).toBe("authentication");
    expect(classifyResearchFailure(new Error("Failed to fetch"))).toBe("network");
    expect(classifyResearchFailure(new Error("500 Internal Server Error"))).toBe("server");
    expect(classifyResearchFailure(new Error("malformed JSON"))).toBe("invalid_response");
    expect(classifyResearchFailure(new Error("something odd"))).toBe("unknown");
    expect(
      classifyResearchFailure(new InvalidResearchResponseError("generate.regular")),
    ).toBe("invalid_response");
  });

  it("narrows sink envelope properties by event discriminant", () => {
    const sink: AnalyticsSink = (envelope) => {
      if (envelope.event === "quota_hit") {
        const surface: AnalyticsEventProperties["quota_hit"]["surface"] =
          envelope.properties.surface;
        expect(surface).toBe("validate");
      }
      if (envelope.event === "research_succeeded") {
        const duration: number = envelope.properties.duration_ms;
        expect(duration).toBeGreaterThanOrEqual(0);
      }
    };
    setAnalyticsSink(sink);
    track("quota_hit", { surface: "validate" });
    track("research_succeeded", {
      type: "generate",
      mode: "regular",
      duration_ms: 12,
    });
  });

  it("exposes a monotonic clock helper", () => {
    const a = monotonicNow();
    const b = monotonicNow();
    expect(typeof a).toBe("number");
    expect(b).toBeGreaterThanOrEqual(a);
  });
});
