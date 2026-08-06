import { describe, it, expect } from "vitest";
import {
  buildValidatePrefillText,
  historyItemQuery,
  isRouterStateRecord,
  parseDashboardValidatePrefill,
  parseHistoryItemQuery,
} from "./dashboardValidatePrefill";

describe("dashboardValidatePrefill helpers", () => {
  it("parses valid prefill and rejects malformed", () => {
    expect(
      parseDashboardValidatePrefill({
        text: "  Hello  ",
        sourceRunId: " run-1 ",
        sourceIdeaName: " Hello ",
      }),
    ).toEqual({
      text: "Hello",
      sourceRunId: "run-1",
      sourceIdeaName: "Hello",
    });
    expect(parseDashboardValidatePrefill(null)).toBeNull();
    expect(parseDashboardValidatePrefill({ text: "x" })).toBeNull();
    expect(parseDashboardValidatePrefill({ sourceRunId: "r" })).toBeNull();
  });

  it("builds prefill text", () => {
    expect(buildValidatePrefillText({ name: "A", description: "B" })).toBe("A: B");
    expect(buildValidatePrefillText({ name: "A" })).toBe("A");
  });

  it("builds and parses history item query", () => {
    expect(historyItemQuery("generator", "abc")).toBe("item=generator%3Aabc");
    expect(parseHistoryItemQuery("generator:abc")).toEqual({
      kind: "generator",
      id: "abc",
    });
    expect(parseHistoryItemQuery("validation:xyz")).toEqual({
      kind: "validation",
      id: "xyz",
    });
    expect(parseHistoryItemQuery("nope")).toBeNull();
    expect(parseHistoryItemQuery("generator:")).toBeNull();
  });

  it("guards router state records", () => {
    expect(isRouterStateRecord({ keep: true })).toBe(true);
    expect(isRouterStateRecord(null)).toBe(false);
    expect(isRouterStateRecord(undefined)).toBe(false);
    expect(isRouterStateRecord("unexpected")).toBe(false);
    expect(isRouterStateRecord(42)).toBe(false);
    expect(isRouterStateRecord(true)).toBe(false);
    expect(isRouterStateRecord([])).toBe(false);
    expect(isRouterStateRecord(new Date("2026-08-06"))).toBe(true);
  });
});
