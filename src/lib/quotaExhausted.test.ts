import { describe, it, expect } from "vitest";
import { isQuotaExhausted } from "./quotaExhausted";

describe("isQuotaExhausted", () => {
  it("is true only when remaining is confirmed zero", () => {
    expect(
      isQuotaExhausted({ remaining: 0, loading: false, unavailable: false }),
    ).toBe(true);
  });

  it("is false while loading", () => {
    expect(
      isQuotaExhausted({ remaining: 0, loading: true, unavailable: false }),
    ).toBe(false);
    expect(
      isQuotaExhausted({ remaining: null, loading: true, unavailable: false }),
    ).toBe(false);
  });

  it("is false when unavailable", () => {
    expect(
      isQuotaExhausted({ remaining: null, loading: false, unavailable: true }),
    ).toBe(false);
  });

  it("is false when reports remain", () => {
    expect(
      isQuotaExhausted({ remaining: 1, loading: false, unavailable: false }),
    ).toBe(false);
  });
});
