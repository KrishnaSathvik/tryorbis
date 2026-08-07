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

  it("appends the stamp to a base landmark label", () => {
    const label = withHistoryInstance(
      "Recommended next step for validation report Park Trip Planner",
      "2026-08-06T16:00:00.000Z",
    );
    expect(
      label.startsWith(
        "Recommended next step for validation report Park Trip Planner — ",
      ),
    ).toBe(true);
    expect(label).toContain("Aug");
  });

  it("keeps two same-name bases unique when timestamps differ", () => {
    const a = withHistoryInstance(
      "Follow-up chat for validation report Park Trip Planner",
      "2026-08-06T16:00:00.000Z",
    );
    const b = withHistoryInstance(
      "Follow-up chat for validation report Park Trip Planner",
      "2026-08-06T19:00:00.000Z",
    );
    expect(a).not.toBe(b);
  });
});
