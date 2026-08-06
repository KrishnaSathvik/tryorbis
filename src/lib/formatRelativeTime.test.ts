import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "./formatRelativeTime";

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-06T12:00:00.000Z");

  it("handles invalid timestamps", () => {
    expect(formatRelativeTime("not-a-date", now)).toEqual({
      label: "Unknown time",
      dateTime: "",
      valid: false,
    });
  });

  it("formats recent, hourly, daily, and older timestamps", () => {
    expect(formatRelativeTime("2026-08-06T11:59:30.000Z", now).label).toBe("Just now");
    expect(formatRelativeTime("2026-08-06T11:30:00.000Z", now).label).toBe("30m ago");
    expect(formatRelativeTime("2026-08-06T09:00:00.000Z", now).label).toBe("3h ago");
    expect(formatRelativeTime("2026-08-04T12:00:00.000Z", now).label).toBe("2d ago");
    const older = formatRelativeTime("2026-07-01T12:00:00.000Z", now);
    expect(older.valid).toBe(true);
    expect(older.dateTime).toBe("2026-07-01T12:00:00.000Z");
    expect(older.label).toMatch(/Jul/);
  });

  it("treats near-future skew as just now", () => {
    expect(formatRelativeTime("2026-08-06T12:00:30.000Z", now).label).toBe("Just now");
  });
});
