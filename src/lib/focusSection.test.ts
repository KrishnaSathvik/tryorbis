import { describe, expect, it } from "vitest";
import { consumeFocusSectionState, parseFocusSection } from "./focusSection";

describe("focusSection", () => {
  it("parses my-ideas and rejects malformed values", () => {
    expect(parseFocusSection("my-ideas")).toBe("my-ideas");
    expect(parseFocusSection("other")).toBeNull();
    expect(parseFocusSection(1)).toBeNull();
    expect(parseFocusSection(null)).toBeNull();
  });

  it("consumes focusSection once and preserves unrelated state", () => {
    const { focusSection, nextState } = consumeFocusSectionState({
      focusSection: "my-ideas",
      keepMe: true,
    });
    expect(focusSection).toBe("my-ideas");
    expect(nextState).toEqual({ keepMe: true });
  });

  it("ignores missing focusSection", () => {
    const { focusSection, nextState } = consumeFocusSectionState({ keepMe: true });
    expect(focusSection).toBeNull();
    expect(nextState).toEqual({ keepMe: true });
  });
});
