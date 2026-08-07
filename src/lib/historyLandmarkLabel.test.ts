import { describe, expect, it } from "vitest";
import {
  formatHistoryInstanceStamp,
  withHistoryInstance,
} from "./historyLandmarkLabel";

describe("historyLandmarkLabel", () => {
  it("formats a stable human-readable date/time stamp", () => {
    const stamp = formatHistoryInstanceStamp("2026-08-06T16:00:00.000Z");
    expect(stamp).toMatch(/Aug/);
    expect(stamp).toMatch(/6/);
    expect(stamp).toMatch(/\d/);
  });

  it("appends stamp and history ordinal to a base landmark label", () => {
    const label = withHistoryInstance(
      "Recommended next step for validation report Park Trip Planner",
      "2026-08-06T16:00:00.000Z",
      2,
    );
    expect(
      label.startsWith(
        "Recommended next step for validation report Park Trip Planner — ",
      ),
    ).toBe(true);
    expect(label).toContain("Aug");
    expect(label).toMatch(/history item 2$/);
  });

  it("keeps two same-name bases unique when timestamps fall in the same minute", () => {
    const a = withHistoryInstance(
      "Follow-up chat for validation report Park Trip Planner",
      "2026-08-06T16:00:00.000Z",
      1,
    );
    const b = withHistoryInstance(
      "Follow-up chat for validation report Park Trip Planner",
      "2026-08-06T16:00:45.000Z",
      2,
    );
    expect(a).not.toBe(b);
    expect(a).toContain("history item 1");
    expect(b).toContain("history item 2");
  });
});
