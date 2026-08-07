import { describe, expect, it } from "vitest";
import {
  consumeValidatePrefillState,
  hasValidatePrefillKey,
  parseLegacyDashboardValidatePrefill,
  parseValidatePrefill,
} from "./validatePrefill";

describe("validatePrefill", () => {
  it("parses landing, dashboard, and generate_result discriminated variants", () => {
    expect(parseValidatePrefill({ source: "landing", text: "  idea  " })).toEqual({
      source: "landing",
      text: "idea",
    });
    expect(
      parseValidatePrefill({
        source: "dashboard",
        text: "x",
        sourceRunId: "r1",
        sourceIdeaName: "Name",
      }),
    ).toEqual({
      source: "dashboard",
      text: "x",
      sourceRunId: "r1",
      sourceIdeaName: "Name",
    });
    expect(
      parseValidatePrefill({
        source: "generate_result",
        text: "  Top idea: desc  ",
        sourceIdeaName: "Top idea",
      }),
    ).toEqual({
      source: "generate_result",
      text: "Top idea: desc",
      sourceIdeaName: "Top idea",
    });
  });

  it("rejects invalid combinations", () => {
    expect(parseValidatePrefill({ source: "landing", text: "" })).toBeNull();
    expect(
      parseValidatePrefill({ source: "dashboard", text: "x" }),
    ).toBeNull();
    expect(parseValidatePrefill({ text: "x", sourceRunId: "r" })).toBeNull();
    expect(
      parseValidatePrefill({ source: "generate_result", text: "   " }),
    ).toBeNull();
  });

  it("canonicalizes legacy dashboardValidatePrefill", () => {
    expect(
      parseLegacyDashboardValidatePrefill({
        text: "Hello",
        sourceRunId: "run-1",
      }),
    ).toEqual({
      source: "dashboard",
      text: "Hello",
      sourceRunId: "run-1",
    });
  });

  it("consumes validatePrefill and preserves unrelated state", () => {
    const { prefill, nextState } = consumeValidatePrefillState({
      validatePrefill: { source: "landing", text: "idea" },
      keepMe: true,
    });
    expect(prefill).toEqual({ source: "landing", text: "idea" });
    expect(nextState).toEqual({ keepMe: true });
  });

  it("consumes legacy dashboardValidatePrefill key", () => {
    const { prefill, nextState } = consumeValidatePrefillState({
      dashboardValidatePrefill: {
        text: "legacy",
        sourceRunId: "g1",
        sourceIdeaName: "Legacy",
      },
      other: 1,
    });
    expect(prefill).toEqual({
      source: "dashboard",
      text: "legacy",
      sourceRunId: "g1",
      sourceIdeaName: "Legacy",
    });
    expect(nextState).toEqual({ other: 1 });
    expect(hasValidatePrefillKey({ dashboardValidatePrefill: {} })).toBe(true);
  });

  it("prefers canonical validatePrefill over legacy when both present", () => {
    const { prefill } = consumeValidatePrefillState({
      validatePrefill: { source: "landing", text: "new" },
      dashboardValidatePrefill: {
        text: "old",
        sourceRunId: "g1",
      },
    });
    expect(prefill).toEqual({ source: "landing", text: "new" });
  });
});
