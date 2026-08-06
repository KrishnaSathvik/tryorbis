import { describe, expect, it } from "vitest";
import {
  InvalidResearchResponseError,
  assertGenerateIdeasStage,
  assertGenerateIntelligenceStage,
  assertGenerateProblemsStage,
  assertGenerateRegularResponse,
  assertValidateCompetitorsStage,
  assertValidateCoreResponse,
  assertValidateIntelligenceStage,
  assertValidateRegularResponse,
  isFiniteNumber,
  isRecord,
  isStringArray,
} from "./researchResponseValidation";

describe("researchResponseValidation primitives", () => {
  it("isRecord rejects null, arrays, and primitives", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord("x")).toBe(false);
  });

  it("isFiniteNumber rejects NaN and Infinity", () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isFiniteNumber(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("isStringArray requires every element to be a string", () => {
    expect(isStringArray([])).toBe(true);
    expect(isStringArray(["a"])).toBe(true);
    expect(isStringArray([1])).toBe(false);
  });
});

describe("Generate regular response", () => {
  it("accepts empty arrays as structurally valid", () => {
    expect(
      assertGenerateRegularResponse({
        problemClusters: [],
        ideaSuggestions: [],
      }),
    ).toEqual({ problemClusters: [], ideaSuggestions: [] });
  });

  it("rejects {} and missing arrays", () => {
    expect(() => assertGenerateRegularResponse({})).toThrow(
      InvalidResearchResponseError,
    );
    expect(() => assertGenerateRegularResponse(null)).toThrow(
      InvalidResearchResponseError,
    );
    expect(() =>
      assertGenerateRegularResponse({
        problemClusters: {},
        ideaSuggestions: "bad",
      }),
    ).toThrow(InvalidResearchResponseError);
  });
});

describe("Generate deep stages", () => {
  it("requires problemClusters array for stage 1", () => {
    expect(assertGenerateProblemsStage({ problemClusters: [] })).toEqual({
      problemClusters: [],
    });
    expect(() => assertGenerateProblemsStage({})).toThrow(
      InvalidResearchResponseError,
    );
  });

  it("requires ideaSuggestions array for stage 2", () => {
    expect(assertGenerateIdeasStage({ ideaSuggestions: [] })).toEqual({
      ideaSuggestions: [],
    });
    expect(() => assertGenerateIdeasStage({})).toThrow(
      InvalidResearchResponseError,
    );
  });

  it("requires at least one intelligence field for stage 3", () => {
    expect(
      assertGenerateIntelligenceStage({ wtpSignals: { summary: "ok" } }),
    ).toMatchObject({ wtpSignals: { summary: "ok" } });
    expect(() => assertGenerateIntelligenceStage({})).toThrow(
      InvalidResearchResponseError,
    );
  });
});

describe("Validate regular response", () => {
  const valid = {
    scores: { demand: 1, pain: 2, competition: 3, mvpFeasibility: 4 },
    verdict: "Build",
  };

  it("accepts valid scores and verdict and defaults omitted arrays", () => {
    const result = assertValidateRegularResponse(valid);
    expect(result.verdict).toBe("Build");
    expect(result.scores.demand).toBe(1);
    expect(result.pros).toEqual([]);
    expect(result.competitors).toEqual([]);
  });

  it("rejects {} and missing verdict/scores without defaulting", () => {
    expect(() => assertValidateRegularResponse({})).toThrow(
      InvalidResearchResponseError,
    );
    expect(() =>
      assertValidateRegularResponse({
        scores: { demand: 0, pain: 0, competition: 0, mvpFeasibility: 0 },
      }),
    ).toThrow(InvalidResearchResponseError);
    expect(() =>
      assertValidateRegularResponse({ verdict: "Skip" }),
    ).toThrow(InvalidResearchResponseError);
  });

  it("rejects non-finite scores and unknown verdicts", () => {
    expect(() =>
      assertValidateRegularResponse({
        ...valid,
        scores: { demand: Number.NaN, pain: 1, competition: 1, mvpFeasibility: 1 },
      }),
    ).toThrow(InvalidResearchResponseError);
    expect(() =>
      assertValidateRegularResponse({ ...valid, verdict: "Maybe" }),
    ).toThrow(InvalidResearchResponseError);
  });
});

describe("Validate deep stages", () => {
  it("requires scores and verdict for core", () => {
    expect(() => assertValidateCoreResponse({})).toThrow(
      InvalidResearchResponseError,
    );
    expect(
      assertValidateCoreResponse({
        scores: { demand: 8, pain: 7, competition: 3, mvpFeasibility: 8 },
        verdict: "Pivot",
      }).verdict,
    ).toBe("Pivot");
  });

  it("requires competitors array for competitors stage", () => {
    expect(assertValidateCompetitorsStage({ competitors: [] })).toEqual({
      competitors: [],
      marketSizing: undefined,
    });
    expect(() => assertValidateCompetitorsStage({})).toThrow(
      InvalidResearchResponseError,
    );
  });

  it("requires at least one intelligence field", () => {
    expect(() => assertValidateIntelligenceStage({})).toThrow(
      InvalidResearchResponseError,
    );
    expect(
      assertValidateIntelligenceStage({ icp: { summary: "x" } }),
    ).toMatchObject({ icp: { summary: "x" } });
  });
});

describe("InvalidResearchResponseError privacy", () => {
  it("uses a fixed message and never embeds payloads", () => {
    const err = new InvalidResearchResponseError("generate.regular");
    expect(err.message).toBe("INVALID_RESEARCH_RESPONSE");
    expect(err.stage).toBe("generate.regular");
    expect(err.message).not.toMatch(/problemClusters|idea|prompt/i);
  });
});
