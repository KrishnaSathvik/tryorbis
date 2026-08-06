/**
 * Runtime structural validation for Generate/Validate research responses.
 * Rejects incomplete payloads before they are treated as usable reports.
 * Errors never include prompts, idea text, or raw backend payloads.
 */

export class InvalidResearchResponseError extends Error {
  readonly stage: string;

  constructor(stage: string) {
    super("INVALID_RESEARCH_RESPONSE");
    this.name = "InvalidResearchResponseError";
    this.stage = stage;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

const VERDICTS = new Set(["Build", "Pivot", "Skip"]);

const GENERATE_INTELLIGENCE_KEYS = [
  "wtpSignals",
  "competitionDensity",
  "marketTiming",
  "icp",
  "workaroundDetection",
  "featureGapMap",
  "platformRisk",
  "gtmStrategy",
  "pricingBenchmarks",
  "defensibility",
] as const;

const VALIDATE_INTELLIGENCE_KEYS = GENERATE_INTELLIGENCE_KEYS;

function hasAtLeastOneNonNullField(
  record: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return keys.some((key) => record[key] != null);
}

function assertOptionalArray(
  record: Record<string, unknown>,
  key: string,
  stage: string,
): void {
  if (!(key in record)) return;
  if (!Array.isArray(record[key])) {
    throw new InvalidResearchResponseError(stage);
  }
}

export function assertGenerateProblemsStage(data: unknown): {
  problemClusters: unknown[];
} {
  if (!isRecord(data) || !Array.isArray(data.problemClusters)) {
    throw new InvalidResearchResponseError("generate.problems");
  }
  return { problemClusters: data.problemClusters };
}

export function assertGenerateIdeasStage(data: unknown): {
  ideaSuggestions: unknown[];
} {
  if (!isRecord(data) || !Array.isArray(data.ideaSuggestions)) {
    throw new InvalidResearchResponseError("generate.ideas");
  }
  return { ideaSuggestions: data.ideaSuggestions };
}

export function assertGenerateIntelligenceStage(
  data: unknown,
): Record<string, unknown> {
  if (!isRecord(data) || !hasAtLeastOneNonNullField(data, GENERATE_INTELLIGENCE_KEYS)) {
    throw new InvalidResearchResponseError("generate.intelligence");
  }
  return data;
}

/** Regular Generate: both core arrays must be present (may be empty). */
export function assertGenerateRegularResponse(data: unknown): {
  problemClusters: unknown[];
  ideaSuggestions: unknown[];
} {
  if (!isRecord(data)) {
    throw new InvalidResearchResponseError("generate.regular");
  }
  if (!Array.isArray(data.problemClusters) || !Array.isArray(data.ideaSuggestions)) {
    throw new InvalidResearchResponseError("generate.regular");
  }
  return {
    problemClusters: data.problemClusters,
    ideaSuggestions: data.ideaSuggestions,
  };
}

export function assertValidationScores(value: unknown, stage: string): {
  demand: number;
  pain: number;
  competition: number;
  mvpFeasibility: number;
} {
  if (!isRecord(value)) {
    throw new InvalidResearchResponseError(stage);
  }
  const { demand, pain, competition, mvpFeasibility } = value;
  if (
    !isFiniteNumber(demand) ||
    !isFiniteNumber(pain) ||
    !isFiniteNumber(competition) ||
    !isFiniteNumber(mvpFeasibility)
  ) {
    throw new InvalidResearchResponseError(stage);
  }
  return { demand, pain, competition, mvpFeasibility };
}

export function assertValidationVerdict(
  value: unknown,
  stage: string,
): "Build" | "Pivot" | "Skip" {
  if (typeof value !== "string" || !VERDICTS.has(value)) {
    throw new InvalidResearchResponseError(stage);
  }
  return value as "Build" | "Pivot" | "Skip";
}

export function assertValidateCoreResponse(data: unknown): {
  scores: {
    demand: number;
    pain: number;
    competition: number;
    mvpFeasibility: number;
  };
  verdict: "Build" | "Pivot" | "Skip";
  pros: string[];
  cons: string[];
  gapOpportunities: string[];
  evidenceLinks: string[];
  mvpWedge: string;
  killTest: string;
} {
  const stage = "validate.core";
  if (!isRecord(data)) {
    throw new InvalidResearchResponseError(stage);
  }
  const scores = assertValidationScores(data.scores, stage);
  const verdict = assertValidationVerdict(data.verdict, stage);

  for (const key of [
    "pros",
    "cons",
    "gapOpportunities",
    "competitors",
    "evidenceLinks",
  ] as const) {
    assertOptionalArray(data, key, stage);
  }

  return {
    scores,
    verdict,
    pros: Array.isArray(data.pros) ? (data.pros as string[]) : [],
    cons: Array.isArray(data.cons) ? (data.cons as string[]) : [],
    gapOpportunities: Array.isArray(data.gapOpportunities)
      ? (data.gapOpportunities as string[])
      : [],
    evidenceLinks: Array.isArray(data.evidenceLinks)
      ? (data.evidenceLinks as string[])
      : [],
    mvpWedge: typeof data.mvpWedge === "string" ? data.mvpWedge : "",
    killTest: typeof data.killTest === "string" ? data.killTest : "",
  };
}

export function assertValidateCompetitorsStage(data: unknown): {
  competitors: unknown[];
  marketSizing: unknown;
} {
  if (!isRecord(data) || !Array.isArray(data.competitors)) {
    throw new InvalidResearchResponseError("validate.competitors");
  }
  return {
    competitors: data.competitors,
    marketSizing: data.marketSizing,
  };
}

export function assertValidateIntelligenceStage(
  data: unknown,
): Record<string, unknown> {
  if (
    !isRecord(data) ||
    !hasAtLeastOneNonNullField(data, VALIDATE_INTELLIGENCE_KEYS)
  ) {
    throw new InvalidResearchResponseError("validate.intelligence");
  }
  return data;
}

/** Regular Validate: scores + verdict required; optional arrays default only after that. */
export function assertValidateRegularResponse(data: unknown): {
  scores: {
    demand: number;
    pain: number;
    competition: number;
    mvpFeasibility: number;
  };
  verdict: "Build" | "Pivot" | "Skip";
  pros: string[];
  cons: string[];
  gapOpportunities: string[];
  competitors: unknown[];
  evidenceLinks: string[];
  mvpWedge: string;
  killTest: string;
  marketSizing: unknown;
  intelligence: Record<string, unknown>;
} {
  const stage = "validate.regular";
  if (!isRecord(data)) {
    throw new InvalidResearchResponseError(stage);
  }
  const core = assertValidateCoreResponse(data);
  if ("competitors" in data && !Array.isArray(data.competitors)) {
    throw new InvalidResearchResponseError(stage);
  }
  return {
    ...core,
    competitors: Array.isArray(data.competitors) ? data.competitors : [],
    marketSizing: data.marketSizing,
    intelligence: data,
  };
}

export const INCOMPLETE_RESEARCH_TOAST =
  "Research returned an incomplete response. Please try again.";
