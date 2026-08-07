import { describe, expect, it } from "vitest";
import {
  buildValidationMarkdown,
  normalizeFreshValidationReport,
  normalizeHistoryValidationReport,
  validationMarkdownFilename,
  type ValidationMarkdownReport,
} from "./validationMarkdown";

const coreReport: ValidationMarkdownReport = {
  ideaText: "Park Trip Planner for first-time national park visitors",
  verdict: "Build",
  scores: {
    demand: 78,
    pain: 72,
    competition: 45,
    mvpFeasibility: 84,
  },
  pros: ["Strong recurring planning pain", "Existing workarounds are fragmented"],
  cons: ["Crowded travel-planning market", "Seasonal acquisition patterns"],
  gapOpportunities: ["First-time visitor planning", "Real-time park logistics"],
  mvpWedge: "Start with itinerary builder for first-time visitors.",
  killTest: "If fewer than 20 users pay for trip planning help, kill it.",
  competitors: [
    {
      name: "AllTrails",
      weakness: "Weak first-time itinerary support",
      pricing: "$36/year",
    },
  ],
  evidenceLinks: [
    "https://example.com/source-a",
    "https://example.com/source-b",
  ],
};

const fullIntelligence: ValidationMarkdownReport = {
  ...coreReport,
  marketSizing: {
    tam: "$12B travel software",
    sam: "$2B park planning",
    som: "$80M first-time visitors",
    methodology: "Bottom-up from visitor counts",
  },
  wtpSignals: {
    strength: "strong",
    summary: "Travelers already pay for planning tools.",
    priceRange: { low: 9, mid: 19, high: 49, currency: "USD" },
    signals: [
      {
        quote: "I'd pay for a park itinerary app",
        source: "Reddit",
        context: "r/NationalPark",
      },
    ],
  },
  competitionDensity: {
    level: "crowded",
    competitorCount: 14,
    totalFundingEstimate: "$400M",
    keyIncumbents: ["AllTrails", "Recreation.gov"],
    switchingCosts: "Medium",
    summary: "Crowded consumer travel tools.",
  },
  marketTiming: {
    phase: "growing",
    summary: "Outdoor travel demand is rising.",
    signals: ["Post-pandemic park visitation growth"],
  },
  icp: {
    businessType: "Consumer",
    companySize: "1-10",
    revenueRange: "Pre-revenue",
    industry: "Travel",
    techStack: ["React Native", "Maps API"],
    buyingTriggers: ["First park trip planned"],
    budgetRange: "$10-30/mo",
    summary: "First-time national park visitors.",
  },
  workaroundDetection: {
    severity: "strong",
    summary: "People stitch together blogs and spreadsheets.",
    workarounds: [
      {
        description: "Spreadsheet workflow",
        source: "Forum thread",
        investmentLevel: "high",
      },
    ],
  },
  featureGapMap: {
    summary: "Weak first-timer logistics coverage.",
    topWedge: "Day-by-day park logistics",
    gaps: [
      {
        feature: "Permit timing alerts",
        competitorCoverage: "weak",
        opportunity: "high",
      },
      {
        feature: "Pipe | escape",
        competitorCoverage: "none",
        opportunity: "medium",
      },
    ],
  },
  platformRisk: {
    level: "medium",
    summary: "Some dependency on park agency APIs.",
    signals: [
      {
        signal: "API rate limits could constrain alerts",
        riskType: "api_limitation",
      },
    ],
  },
  gtmStrategy: {
    primaryChannel: "Founder-led outbound",
    summary: "Start in park Facebook groups.",
    founderLedSales: true,
    seoViability: "strong",
    channels: [
      {
        channel: "Reddit communities",
        viability: "high",
        reasoning: "High intent trip planning questions",
      },
    ],
  },
  pricingBenchmarks: {
    summary: "Consumer travel tools cluster around subscription.",
    pricingModel: "Subscription",
    suggestedRange: { low: "$9", mid: "$19", high: "$39" },
    benchmarks: [
      {
        tool: "AllTrails",
        price: "$36/yr",
        model: "Subscription",
        notes: "Pro tier",
      },
      {
        tool: "Pipe | Product",
        price: "$10",
        model: "One-time",
      },
    ],
  },
  defensibility: {
    overallStrength: "moderate",
    summary: "Data network effects are possible.",
    timeToMoat: "12–18 months",
    signals: [
      {
        type: "data_network",
        strength: "strong",
        description: "User trip data improves recommendations",
      },
    ],
  },
};

describe("buildValidationMarkdown", () => {
  it("renders core sections in order", () => {
    const markdown = buildValidationMarkdown(coreReport);
    const ideaIdx = markdown.indexOf("## Idea");
    const verdictIdx = markdown.indexOf("## Verdict");
    const scoreIdx = markdown.indexOf("## Scorecard");
    const prosIdx = markdown.indexOf("## Pros");
    const consIdx = markdown.indexOf("## Cons");
    const gapsIdx = markdown.indexOf("## Gap Opportunities");
    const mvpIdx = markdown.indexOf("## MVP Wedge");
    const killIdx = markdown.indexOf("## Kill Test");
    const competitorsIdx = markdown.indexOf("## Competitors");
    const evidenceIdx = markdown.indexOf("## Evidence");

    expect(markdown.startsWith("# Orbis Validation Report\n")).toBe(true);
    expect(ideaIdx).toBeGreaterThan(-1);
    expect(verdictIdx).toBeGreaterThan(ideaIdx);
    expect(scoreIdx).toBeGreaterThan(verdictIdx);
    expect(prosIdx).toBeGreaterThan(scoreIdx);
    expect(consIdx).toBeGreaterThan(prosIdx);
    expect(gapsIdx).toBeGreaterThan(consIdx);
    expect(mvpIdx).toBeGreaterThan(gapsIdx);
    expect(killIdx).toBeGreaterThan(mvpIdx);
    expect(competitorsIdx).toBeGreaterThan(killIdx);
    expect(evidenceIdx).toBeGreaterThan(competitorsIdx);

    expect(markdown).toContain("**Build**");
    expect(markdown).toContain("| Demand | 78/100 |");
    expect(markdown).toContain("- Strong recurring planning pain");
    expect(markdown).toContain("### AllTrails");
    expect(markdown).toContain("- https://example.com/source-a");
  });

  it("omits empty optional sections", () => {
    const markdown = buildValidationMarkdown({
      ideaText: "Minimal idea",
      verdict: "Skip",
      pros: [],
      cons: [],
      gapOpportunities: [],
      competitors: [],
      evidenceLinks: [],
    });
    expect(markdown).not.toContain("## Pros");
    expect(markdown).not.toContain("## Cons");
    expect(markdown).not.toContain("## Gap Opportunities");
    expect(markdown).not.toContain("## Competitors");
    expect(markdown).not.toContain("## Evidence");
    expect(markdown).not.toContain("## Scorecard");
  });

  it("keeps zero scores", () => {
    const markdown = buildValidationMarkdown({
      ideaText: "Zero score idea",
      scores: { demand: 0, pain: 0, competition: 0, mvpFeasibility: 0 },
    });
    expect(markdown).toContain("| Demand | 0/100 |");
    expect(markdown).toContain("| Pain | 0/100 |");
  });

  it("exports full intelligence sections without object leakage", () => {
    const markdown = buildValidationMarkdown(fullIntelligence);
    expect(markdown).toContain("## Market Sizing");
    expect(markdown).toContain("## Willingness to Pay");
    expect(markdown).toContain("## Competition Density");
    expect(markdown).toContain("## Market Timing");
    expect(markdown).toContain("## Ideal Customer Profile");
    expect(markdown).toContain("## Workarounds");
    expect(markdown).toContain("## Feature Gaps");
    expect(markdown).toContain("## Platform Risk");
    expect(markdown).toContain("## Go-to-Market");
    expect(markdown).toContain("## Pricing Benchmarks");
    expect(markdown).toContain("## Defensibility");
    expect(markdown).toContain("**Top wedge:** Day-by-day park logistics");
    expect(markdown).toContain("### Key Incumbents");
    expect(markdown).toContain("**Time to moat:** 12–18 months");
    expect(markdown).not.toContain("undefined");
    expect(markdown).not.toContain("null");
    expect(markdown).not.toContain("[object Object]");
  });

  it("escapes pipe characters in tables", () => {
    const markdown = buildValidationMarkdown(fullIntelligence);
    expect(markdown).toContain("Pipe \\| escape");
    expect(markdown).toContain("Pipe \\| Product");
  });

  it("prefixes every idea line with a blockquote marker", () => {
    const markdown = buildValidationMarkdown({
      ideaText: "AI tool\nfor #freelancers",
    });
    expect(markdown).toContain("## Idea\n\n> AI tool\n> for #freelancers\n");
  });

  it("dedupes evidence links while preserving first occurrence order", () => {
    const markdown = buildValidationMarkdown({
      ideaText: "Idea",
      evidenceLinks: [
        "https://a.example",
        "https://b.example",
        "https://a.example",
        "  https://c.example  ",
      ],
    });
    const evidence = markdown.slice(markdown.indexOf("## Evidence"));
    expect(evidence.match(/https:\/\/a\.example/g)).toHaveLength(1);
    expect(evidence.indexOf("https://a.example")).toBeLessThan(
      evidence.indexOf("https://b.example"),
    );
    expect(evidence.indexOf("https://b.example")).toBeLessThan(
      evidence.indexOf("https://c.example"),
    );
  });

  it("is deterministic and ends with exactly one newline", () => {
    const a = buildValidationMarkdown(fullIntelligence);
    const b = buildValidationMarkdown(fullIntelligence);
    expect(a).toBe(b);
    expect(a.endsWith("\n")).toBe(true);
    expect(a.endsWith("\n\n")).toBe(false);
  });
});

describe("validationMarkdownFilename", () => {
  it("slugifies a normal idea title", () => {
    expect(validationMarkdownFilename("Park Trip Planner")).toBe(
      "orbis-park-trip-planner-validation.md",
    );
  });

  it("trims whitespace", () => {
    expect(validationMarkdownFilename("  AI Budget Tool  ")).toBe(
      "orbis-ai-budget-tool-validation.md",
    );
  });

  it("collapses punctuation into single hyphens", () => {
    expect(validationMarkdownFilename("AI / SaaS: Founder Tool!")).toBe(
      "orbis-ai-saas-founder-tool-validation.md",
    );
    expect(validationMarkdownFilename("AI///SaaS")).not.toContain("---");
  });

  it("normalizes unicode accents", () => {
    expect(validationMarkdownFilename("Café Planner")).toBe(
      "orbis-cafe-planner-validation.md",
    );
  });

  it("falls back for blank or emoji-only titles", () => {
    expect(validationMarkdownFilename("")).toBe("orbis-validation-report.md");
    expect(validationMarkdownFilename("   ")).toBe("orbis-validation-report.md");
    expect(validationMarkdownFilename("🚀🔥")).toBe("orbis-validation-report.md");
  });

  it("bounds long idea slugs without trailing hyphen", () => {
    const long =
      "A very long idea title that should be truncated carefully so the filename stays reasonable and readable for founders everywhere";
    const filename = validationMarkdownFilename(long);
    expect(filename.startsWith("orbis-")).toBe(true);
    expect(filename.endsWith("-validation.md")).toBe(true);
    expect(filename).not.toMatch(/--/);
    const slug = filename.replace(/^orbis-/, "").replace(/-validation\.md$/, "");
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("fresh/history normalization parity", () => {
  it("produces identical Markdown for equivalent fresh and History fixtures", () => {
    const fresh = normalizeFreshValidationReport({
      ideaText: "Park Trip Planner",
      verdict: "Build",
      scores: { demand: 70, pain: 60, competition: 40, mvpFeasibility: 50 },
      pros: ["a"],
      cons: ["b"],
      gapOpportunities: ["gap-one"],
      mvpWedge: "wedge text",
      killTest: "kill text",
      competitors: [{ name: "Comp", weakness: "weak", pricing: "$1" }],
      evidenceLinks: ["https://example.com"],
      marketSizing: { tam: "TAM", sam: "SAM", som: "SOM" },
      wtpSignals: {
        strength: "moderate",
        summary: "Some pay signals",
        priceRange: { low: 5, mid: 10, high: 20, currency: "USD" },
        signals: [],
      },
    });

    const history = normalizeHistoryValidationReport({
      idea_text: "Park Trip Planner",
      verdict: "Build",
      scores: { demand: 70, pain: 60, competition: 40, mvpFeasibility: 50 },
      pros: ["a"],
      cons: ["b"],
      gap_opportunities: ["gap-one"],
      mvp_wedge: "wedge text",
      kill_test: "kill text",
      competitors: [{ name: "Comp", weakness: "weak", pricing: "$1" }],
      evidence_links: ["https://example.com"],
      market_sizing: { tam: "TAM", sam: "SAM", som: "SOM" },
      wtp_signals: {
        strength: "moderate",
        summary: "Some pay signals",
        priceRange: { low: 5, mid: 10, high: 20, currency: "USD" },
        signals: [],
      },
    });

    expect(fresh).toEqual(history);
    expect(buildValidationMarkdown(fresh)).toBe(buildValidationMarkdown(history));
  });
});
