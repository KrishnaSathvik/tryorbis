import { describe, expect, it } from "vitest";
import { pickTopIdea } from "./pickTopIdea";

describe("pickTopIdea", () => {
  it("returns null for empty input", () => {
    expect(pickTopIdea([])).toBeNull();
    expect(pickTopIdea(null)).toBeNull();
    expect(pickTopIdea(undefined)).toBeNull();
  });

  it("picks the highest demandScore", () => {
    expect(
      pickTopIdea([
        { name: "A", demandScore: 40 },
        { name: "B", demandScore: 90 },
        { name: "C", demandScore: 70 },
      ])?.name,
    ).toBe("B");
  });
});
