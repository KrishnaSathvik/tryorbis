import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LANDING_VALIDATE_PREFILL_KEY,
  LANDING_VALIDATE_PREFILL_TTL_MS,
  LandingPrefillWriteError,
  clearLandingValidatePrefill,
  readLandingValidatePrefill,
  writeLandingValidatePrefill,
} from "./landingValidatePrefill";

describe("landingValidatePrefill", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("writes trimmed text with createdAt", () => {
    const before = Date.now();
    writeLandingValidatePrefill("  AI meal planner  ");
    const after = Date.now();
    const raw = JSON.parse(sessionStorage.getItem(LANDING_VALIDATE_PREFILL_KEY)!);
    expect(raw.text).toBe("AI meal planner");
    expect(raw.createdAt).toBeGreaterThanOrEqual(before);
    expect(raw.createdAt).toBeLessThanOrEqual(after);
  });

  it("reads an unexpired record", () => {
    writeLandingValidatePrefill("idea");
    expect(readLandingValidatePrefill()?.text).toBe("idea");
  });

  it("expires silently after TTL and deletes the key", () => {
    writeLandingValidatePrefill("stale");
    const createdAt = JSON.parse(
      sessionStorage.getItem(LANDING_VALIDATE_PREFILL_KEY)!,
    ).createdAt as number;
    expect(
      readLandingValidatePrefill(createdAt + LANDING_VALIDATE_PREFILL_TTL_MS + 1),
    ).toBeNull();
    expect(sessionStorage.getItem(LANDING_VALIDATE_PREFILL_KEY)).toBeNull();
  });

  it("clears corrupt JSON", () => {
    sessionStorage.setItem(LANDING_VALIDATE_PREFILL_KEY, "{not-json");
    expect(readLandingValidatePrefill()).toBeNull();
    expect(sessionStorage.getItem(LANDING_VALIDATE_PREFILL_KEY)).toBeNull();
  });

  it("rejects empty/whitespace writes", () => {
    expect(() => writeLandingValidatePrefill("   ")).toThrow(LandingPrefillWriteError);
    expect(sessionStorage.getItem(LANDING_VALIDATE_PREFILL_KEY)).toBeNull();
  });

  it("clearLandingValidatePrefill removes the key", () => {
    writeLandingValidatePrefill("x");
    clearLandingValidatePrefill();
    expect(sessionStorage.getItem(LANDING_VALIDATE_PREFILL_KEY)).toBeNull();
  });

  it("throws LandingPrefillWriteError when sessionStorage.setItem fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => writeLandingValidatePrefill("idea")).toThrow(LandingPrefillWriteError);
  });
});
