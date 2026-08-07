import type {
  CompetitionDensity,
  Competitor,
  DefensibilityAnalysis,
  FeatureGapMap,
  GtmStrategy,
  ICP,
  MarketTiming,
  PlatformRisk,
  PricingBenchmarks,
  WorkaroundDetection,
  WtpSignals,
} from "@/lib/types";

export interface ValidationMarkdownMarketSizing {
  tam?: string;
  sam?: string;
  som?: string;
  methodology?: string;
}

export interface ValidationMarkdownReport {
  ideaText: string;
  verdict?: "Build" | "Pivot" | "Skip" | string;
  scores?: {
    demand?: number;
    pain?: number;
    competition?: number;
    mvpFeasibility?: number;
  };
  pros?: string[];
  cons?: string[];
  gapOpportunities?: string[];
  mvpWedge?: string;
  killTest?: string;
  competitors?: Competitor[];
  evidenceLinks?: string[];
  marketSizing?: ValidationMarkdownMarketSizing;
  wtpSignals?: WtpSignals;
  competitionDensity?: CompetitionDensity;
  marketTiming?: MarketTiming;
  icp?: ICP;
  workaroundDetection?: WorkaroundDetection;
  featureGapMap?: FeatureGapMap;
  platformRisk?: PlatformRisk;
  gtmStrategy?: GtmStrategy;
  pricingBenchmarks?: PricingBenchmarks;
  defensibility?: DefensibilityAnalysis;
}

/** Fresh Validate result shape (camelCase). */
export type FreshValidationExportInput = {
  ideaText: string;
  verdict?: string;
  scores?: ValidationMarkdownReport["scores"];
  pros?: string[];
  cons?: string[];
  gapOpportunities?: string[];
  mvpWedge?: string;
  killTest?: string;
  competitors?: Competitor[];
  evidenceLinks?: string[];
  marketSizing?: ValidationMarkdownMarketSizing;
  wtpSignals?: WtpSignals;
  competitionDensity?: CompetitionDensity;
  marketTiming?: MarketTiming;
  icp?: ICP;
  workaroundDetection?: WorkaroundDetection;
  featureGapMap?: FeatureGapMap;
  platformRisk?: PlatformRisk;
  gtmStrategy?: GtmStrategy;
  pricingBenchmarks?: PricingBenchmarks;
  defensibility?: DefensibilityAnalysis;
};

/** Persisted History validation row (snake_case top-level keys). */
export type HistoryValidationExportInput = {
  idea_text?: string;
  verdict?: string;
  scores?: ValidationMarkdownReport["scores"];
  pros?: string[];
  cons?: string[];
  gap_opportunities?: string[];
  mvp_wedge?: string;
  kill_test?: string;
  competitors?: Competitor[];
  evidence_links?: string[];
  market_sizing?: ValidationMarkdownMarketSizing;
  wtp_signals?: WtpSignals;
  competition_density?: CompetitionDensity;
  market_timing?: MarketTiming;
  icp?: ICP;
  workaround_detection?: WorkaroundDetection;
  feature_gap_map?: FeatureGapMap;
  platform_risk?: PlatformRisk;
  gtm_strategy?: GtmStrategy;
  pricing_benchmarks?: PricingBenchmarks;
  defensibility?: DefensibilityAnalysis;
};

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function nonEmptyStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((v) => nonEmptyString(v))
    .filter((v): v is string => v !== undefined);
}

function isMeaningfulNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function formatLabel(key: string): string {
  return key
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeMultilineForList(value: string): string {
  return value.replace(/\r?\n+/g, " ").trim();
}

function headingSafeTitle(value: string): string {
  const flat = value.replace(/\r?\n+/g, " ").trim();
  return flat.replace(/^#{1,6}\s+/, "");
}

function bulletList(items: string[]): string {
  return items.map((item) => `- ${normalizeMultilineForList(item)}`).join("\n");
}

function section(title: string, body: string | undefined): string | undefined {
  const content = body?.trim();
  if (!content) return undefined;
  return `## ${title}\n\n${content}`;
}

function formatIdeaBlockquote(ideaText: string): string {
  const lines = ideaText.replace(/\r\n/g, "\n").split("\n");
  return lines.map((line) => `> ${line}`).join("\n");
}

function formatScorecard(
  scores: NonNullable<ValidationMarkdownReport["scores"]>,
): string | undefined {
  const rows: Array<[string, number]> = [];
  const order: Array<[keyof typeof scores, string]> = [
    ["demand", "Demand"],
    ["pain", "Pain"],
    ["competition", "Competition"],
    ["mvpFeasibility", "MVP Feasibility"],
  ];
  for (const [key, label] of order) {
    const value = scores[key];
    if (isMeaningfulNumber(value)) {
      rows.push([label, value]);
    }
  }
  if (rows.length === 0) return undefined;
  const lines = [
    "| Metric | Score |",
    "| --- | ---: |",
    ...rows.map(([label, value]) => `| ${label} | ${value}/100 |`),
  ];
  return lines.join("\n");
}

function formatCompetitors(
  competitors: Competitor[] | undefined,
): string | undefined {
  if (!competitors?.length) return undefined;
  const blocks: string[] = [];
  for (const competitor of competitors) {
    const name = nonEmptyString(competitor.name);
    const weakness = nonEmptyString(competitor.weakness);
    const pricing = nonEmptyString(competitor.pricing);
    if (!name && !weakness && !pricing) continue;
    const title = headingSafeTitle(name || "Competitor");
    const lines = [`### ${title}`];
    if (weakness) lines.push(`- **Weakness:** ${normalizeMultilineForList(weakness)}`);
    if (pricing) lines.push(`- **Pricing:** ${normalizeMultilineForList(pricing)}`);
    blocks.push(lines.join("\n"));
  }
  return blocks.length > 0 ? blocks.join("\n\n") : undefined;
}

function formatMarketSizing(
  sizing: ValidationMarkdownMarketSizing | undefined,
): string | undefined {
  if (!sizing) return undefined;
  const lines: string[] = [];
  const tam = nonEmptyString(sizing.tam);
  const sam = nonEmptyString(sizing.sam);
  const som = nonEmptyString(sizing.som);
  const methodology = nonEmptyString(sizing.methodology);
  if (tam) lines.push(`- **TAM:** ${normalizeMultilineForList(tam)}`);
  if (sam) lines.push(`- **SAM:** ${normalizeMultilineForList(sam)}`);
  if (som) lines.push(`- **SOM:** ${normalizeMultilineForList(som)}`);
  if (methodology) lines.push(`- **Methodology:** ${normalizeMultilineForList(methodology)}`);
  return lines.length > 0 ? lines.join("\n") : undefined;
}

function formatWtp(data: WtpSignals | undefined): string | undefined {
  if (!data) return undefined;
  const parts: string[] = [];
  if (nonEmptyString(data.strength)) {
    parts.push(`**Strength:** ${formatLabel(data.strength)}`);
  }
  const summary = nonEmptyString(data.summary);
  if (summary) parts.push(summary);

  if (data.priceRange) {
    const pr = data.priceRange;
    const rangeLines: string[] = [];
    if (isMeaningfulNumber(pr.low)) rangeLines.push(`- **Low:** ${pr.low}`);
    if (isMeaningfulNumber(pr.mid)) rangeLines.push(`- **Mid:** ${pr.mid}`);
    if (isMeaningfulNumber(pr.high)) rangeLines.push(`- **High:** ${pr.high}`);
    if (nonEmptyString(pr.currency)) {
      rangeLines.push(`- **Currency:** ${pr.currency.trim()}`);
    }
    if (rangeLines.length > 0) {
      parts.push(`### Price Range\n\n${rangeLines.join("\n")}`);
    }
  }

  if (Array.isArray(data.signals) && data.signals.length > 0) {
    const signalLines = data.signals
      .map((s) => {
        const quote = nonEmptyString(s.quote);
        if (!quote) return undefined;
        const source = nonEmptyString(s.source);
        const context = nonEmptyString(s.context);
        const attribution = [source, context].filter(Boolean).join(" — ");
        const body = attribution
          ? `"${normalizeMultilineForList(quote)}" — ${normalizeMultilineForList(attribution)}`
          : `"${normalizeMultilineForList(quote)}"`;
        return `- ${body}`;
      })
      .filter((line): line is string => line !== undefined);
    if (signalLines.length > 0) {
      parts.push(`### Signals\n\n${signalLines.join("\n")}`);
    }
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

function formatCompetitionDensity(
  data: CompetitionDensity | undefined,
): string | undefined {
  if (!data) return undefined;
  const parts: string[] = [];
  if (nonEmptyString(data.level)) {
    parts.push(`**Level:** ${formatLabel(data.level)}`);
  }
  const summary = nonEmptyString(data.summary);
  if (summary) parts.push(summary);

  const meta: string[] = [];
  if (isMeaningfulNumber(data.competitorCount)) {
    meta.push(`- **Competitors identified:** ${data.competitorCount}`);
  }
  const funding = nonEmptyString(data.totalFundingEstimate);
  if (funding) meta.push(`- **Estimated funding:** ${funding}`);
  const switching = nonEmptyString(data.switchingCosts);
  if (switching) meta.push(`- **Switching costs:** ${switching}`);
  if (meta.length > 0) parts.push(meta.join("\n"));

  const incumbents = nonEmptyStrings(data.keyIncumbents);
  if (incumbents.length > 0) {
    parts.push(`### Key Incumbents\n\n${bulletList(incumbents)}`);
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

function formatMarketTiming(data: MarketTiming | undefined): string | undefined {
  if (!data) return undefined;
  const parts: string[] = [];
  if (nonEmptyString(data.phase)) {
    parts.push(`**Phase:** ${formatLabel(data.phase)}`);
  }
  const summary = nonEmptyString(data.summary);
  if (summary) parts.push(summary);
  const signals = nonEmptyStrings(data.signals);
  if (signals.length > 0) {
    parts.push(`### Signals\n\n${bulletList(signals)}`);
  }
  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

function formatIcp(data: ICP | undefined): string | undefined {
  if (!data) return undefined;
  const parts: string[] = [];
  const summary = nonEmptyString(data.summary);
  if (summary) parts.push(summary);

  const fields: Array<[string, string | undefined]> = [
    ["Business type", nonEmptyString(data.businessType)],
    ["Company size", nonEmptyString(data.companySize)],
    ["Revenue range", nonEmptyString(data.revenueRange)],
    ["Industry", nonEmptyString(data.industry)],
    ["Budget range", nonEmptyString(data.budgetRange)],
  ];
  const fieldLines = fields
    .filter(([, v]) => v)
    .map(([label, v]) => `- **${label}:** ${normalizeMultilineForList(v!)}`);
  if (fieldLines.length > 0) parts.push(fieldLines.join("\n"));

  const tech = nonEmptyStrings(data.techStack);
  if (tech.length > 0) {
    parts.push(`### Tech Stack\n\n${bulletList(tech)}`);
  }
  const triggers = nonEmptyStrings(data.buyingTriggers);
  if (triggers.length > 0) {
    parts.push(`### Buying Triggers\n\n${bulletList(triggers)}`);
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

function formatWorkarounds(
  data: WorkaroundDetection | undefined,
): string | undefined {
  if (!data) return undefined;
  const parts: string[] = [];
  if (nonEmptyString(data.severity)) {
    parts.push(`**Severity:** ${formatLabel(data.severity)}`);
  }
  const summary = nonEmptyString(data.summary);
  if (summary) parts.push(summary);

  if (Array.isArray(data.workarounds) && data.workarounds.length > 0) {
    const blocks: string[] = [];
    for (const item of data.workarounds) {
      const description = nonEmptyString(item.description);
      const source = nonEmptyString(item.source);
      const investment = nonEmptyString(item.investmentLevel);
      if (!description && !source && !investment) continue;
      const title = headingSafeTitle(description || "Workaround");
      const lines = [`#### ${title}`];
      if (investment) {
        lines.push(`- **Investment level:** ${formatLabel(investment)}`);
      }
      if (source) lines.push(`- **Source:** ${normalizeMultilineForList(source)}`);
      blocks.push(lines.join("\n"));
    }
    if (blocks.length > 0) {
      parts.push(`### Existing Workarounds\n\n${blocks.join("\n\n")}`);
    }
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

function formatFeatureGaps(data: FeatureGapMap | undefined): string | undefined {
  if (!data) return undefined;
  const parts: string[] = [];
  const summary = nonEmptyString(data.summary);
  if (summary) parts.push(summary);
  const topWedge = nonEmptyString(data.topWedge);
  if (topWedge) {
    parts.push(`**Top wedge:** ${normalizeMultilineForList(topWedge)}`);
  }

  if (Array.isArray(data.gaps) && data.gaps.length > 0) {
    const rows = data.gaps
      .map((gap) => {
        const feature = nonEmptyString(gap.feature);
        if (!feature) return undefined;
        const coverage = nonEmptyString(gap.competitorCoverage) || "—";
        const opportunity = nonEmptyString(gap.opportunity) || "—";
        return `| ${escapeTableCell(feature)} | ${escapeTableCell(formatLabel(coverage))} | ${escapeTableCell(formatLabel(opportunity))} |`;
      })
      .filter((row): row is string => row !== undefined);
    if (rows.length > 0) {
      parts.push(
        [
          "| Feature | Competitor Coverage | Opportunity |",
          "| --- | --- | --- |",
          ...rows,
        ].join("\n"),
      );
    }
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

function formatPlatformRisk(data: PlatformRisk | undefined): string | undefined {
  if (!data) return undefined;
  const parts: string[] = [];
  if (nonEmptyString(data.level)) {
    parts.push(`**Level:** ${formatLabel(data.level)}`);
  }
  const summary = nonEmptyString(data.summary);
  if (summary) parts.push(summary);

  if (Array.isArray(data.signals) && data.signals.length > 0) {
    const lines = data.signals
      .map((s) => {
        const signal = nonEmptyString(s.signal);
        if (!signal) return undefined;
        const riskType = nonEmptyString(s.riskType);
        if (riskType) {
          return `- **${formatLabel(riskType)}:** ${normalizeMultilineForList(signal)}`;
        }
        return `- ${normalizeMultilineForList(signal)}`;
      })
      .filter((line): line is string => line !== undefined);
    if (lines.length > 0) {
      parts.push(`### Risk Signals\n\n${lines.join("\n")}`);
    }
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

function formatGtm(data: GtmStrategy | undefined): string | undefined {
  if (!data) return undefined;
  const parts: string[] = [];
  const primary = nonEmptyString(data.primaryChannel);
  if (primary) {
    parts.push(`**Primary channel:** ${normalizeMultilineForList(primary)}`);
  }
  const summary = nonEmptyString(data.summary);
  if (summary) parts.push(summary);

  const meta: string[] = [];
  if (typeof data.founderLedSales === "boolean") {
    meta.push(`- **Founder-led sales:** ${data.founderLedSales ? "Yes" : "No"}`);
  }
  if (nonEmptyString(data.seoViability)) {
    meta.push(`- **SEO viability:** ${formatLabel(data.seoViability)}`);
  }
  if (meta.length > 0) parts.push(meta.join("\n"));

  if (Array.isArray(data.channels) && data.channels.length > 0) {
    const blocks: string[] = [];
    for (const ch of data.channels) {
      const channel = nonEmptyString(ch.channel);
      const viability = nonEmptyString(ch.viability);
      const reasoning = nonEmptyString(ch.reasoning);
      if (!channel && !viability && !reasoning) continue;
      const title = headingSafeTitle(channel || "Channel");
      const lines = [`#### ${title}`];
      if (viability) lines.push(`- **Viability:** ${formatLabel(viability)}`);
      if (reasoning) lines.push(`- ${normalizeMultilineForList(reasoning)}`);
      blocks.push(lines.join("\n"));
    }
    if (blocks.length > 0) {
      parts.push(`### Channels\n\n${blocks.join("\n\n")}`);
    }
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

function formatPricingBenchmarks(
  data: PricingBenchmarks | undefined,
): string | undefined {
  if (!data) return undefined;
  const parts: string[] = [];
  const summary = nonEmptyString(data.summary);
  if (summary) parts.push(summary);
  const model = nonEmptyString(data.pricingModel);
  if (model) {
    parts.push(`**Pricing model:** ${normalizeMultilineForList(model)}`);
  }

  if (data.suggestedRange) {
    const rangeLines: string[] = [];
    const low = nonEmptyString(data.suggestedRange.low);
    const mid = nonEmptyString(data.suggestedRange.mid);
    const high = nonEmptyString(data.suggestedRange.high);
    if (low) rangeLines.push(`- **Low:** ${low}`);
    if (mid) rangeLines.push(`- **Mid:** ${mid}`);
    if (high) rangeLines.push(`- **High:** ${high}`);
    if (rangeLines.length > 0) {
      parts.push(`### Suggested Range\n\n${rangeLines.join("\n")}`);
    }
  }

  if (Array.isArray(data.benchmarks) && data.benchmarks.length > 0) {
    const rows = data.benchmarks
      .map((b) => {
        const tool = nonEmptyString(b.tool);
        const price = nonEmptyString(b.price);
        const bModel = nonEmptyString(b.model);
        const notes = nonEmptyString(b.notes);
        if (!tool && !price && !bModel && !notes) return undefined;
        return `| ${escapeTableCell(tool || "—")} | ${escapeTableCell(price || "—")} | ${escapeTableCell(bModel || "—")} | ${escapeTableCell(notes || "—")} |`;
      })
      .filter((row): row is string => row !== undefined);
    if (rows.length > 0) {
      parts.push(
        [
          "| Product | Price | Model | Notes |",
          "| --- | --- | --- | --- |",
          ...rows,
        ].join("\n"),
      );
    }
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

function formatDefensibility(
  data: DefensibilityAnalysis | undefined,
): string | undefined {
  if (!data) return undefined;
  const parts: string[] = [];
  if (nonEmptyString(data.overallStrength)) {
    parts.push(`**Overall strength:** ${formatLabel(data.overallStrength)}`);
  }
  const summary = nonEmptyString(data.summary);
  if (summary) parts.push(summary);
  const timeToMoat = nonEmptyString(data.timeToMoat);
  if (timeToMoat) {
    parts.push(`**Time to moat:** ${normalizeMultilineForList(timeToMoat)}`);
  }

  if (Array.isArray(data.signals) && data.signals.length > 0) {
    const lines = data.signals
      .map((s) => {
        const description = nonEmptyString(s.description);
        if (!description) return undefined;
        const type = nonEmptyString(s.type);
        const strength = nonEmptyString(s.strength);
        const label = [type ? formatLabel(type) : undefined, strength ? formatLabel(strength) : undefined]
          .filter(Boolean)
          .join(" — ");
        if (label) {
          return `- **${label}:** ${normalizeMultilineForList(description)}`;
        }
        return `- ${normalizeMultilineForList(description)}`;
      })
      .filter((line): line is string => line !== undefined);
    if (lines.length > 0) {
      parts.push(`### Moat Signals\n\n${lines.join("\n")}`);
    }
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

function formatEvidence(links: string[] | undefined): string | undefined {
  const cleaned = nonEmptyStrings(links);
  if (cleaned.length === 0) return undefined;
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const link of cleaned) {
    if (seen.has(link)) continue;
    seen.add(link);
    unique.push(link);
  }
  return bulletList(unique);
}

export function normalizeFreshValidationReport(
  input: FreshValidationExportInput,
): ValidationMarkdownReport {
  return {
    ideaText: typeof input.ideaText === "string" ? input.ideaText : "",
    verdict: input.verdict,
    scores: input.scores,
    pros: input.pros,
    cons: input.cons,
    gapOpportunities: input.gapOpportunities,
    mvpWedge: input.mvpWedge,
    killTest: input.killTest,
    competitors: input.competitors,
    evidenceLinks: input.evidenceLinks,
    marketSizing: input.marketSizing,
    wtpSignals: input.wtpSignals,
    competitionDensity: input.competitionDensity,
    marketTiming: input.marketTiming,
    icp: input.icp,
    workaroundDetection: input.workaroundDetection,
    featureGapMap: input.featureGapMap,
    platformRisk: input.platformRisk,
    gtmStrategy: input.gtmStrategy,
    pricingBenchmarks: input.pricingBenchmarks,
    defensibility: input.defensibility,
  };
}

export function normalizeHistoryValidationReport(
  input: HistoryValidationExportInput,
): ValidationMarkdownReport {
  return {
    ideaText: typeof input.idea_text === "string" ? input.idea_text : "",
    verdict: input.verdict,
    scores: input.scores,
    pros: input.pros,
    cons: input.cons,
    gapOpportunities: input.gap_opportunities,
    mvpWedge: input.mvp_wedge,
    killTest: input.kill_test,
    competitors: input.competitors,
    evidenceLinks: input.evidence_links,
    marketSizing: input.market_sizing,
    wtpSignals: input.wtp_signals,
    competitionDensity: input.competition_density,
    marketTiming: input.market_timing,
    icp: input.icp,
    workaroundDetection: input.workaround_detection,
    featureGapMap: input.feature_gap_map,
    platformRisk: input.platform_risk,
    gtmStrategy: input.gtm_strategy,
    pricingBenchmarks: input.pricing_benchmarks,
    defensibility: input.defensibility,
  };
}

export function buildValidationMarkdown(report: ValidationMarkdownReport): string {
  const parts: string[] = ["# Orbis Validation Report"];

  const idea = formatIdeaBlockquote(report.ideaText ?? "");
  parts.push(`## Idea\n\n${idea}`);

  const verdict = nonEmptyString(report.verdict);
  if (verdict) {
    parts.push(`## Verdict\n\n**${verdict}**`);
  }

  const scorecard = report.scores ? formatScorecard(report.scores) : undefined;
  if (scorecard) parts.push(`## Scorecard\n\n${scorecard}`);

  const pros = nonEmptyStrings(report.pros);
  if (pros.length > 0) parts.push(`## Pros\n\n${bulletList(pros)}`);

  const cons = nonEmptyStrings(report.cons);
  if (cons.length > 0) parts.push(`## Cons\n\n${bulletList(cons)}`);

  const gaps = nonEmptyStrings(report.gapOpportunities);
  if (gaps.length > 0) parts.push(`## Gap Opportunities\n\n${bulletList(gaps)}`);

  const mvp = section("MVP Wedge", nonEmptyString(report.mvpWedge));
  if (mvp) parts.push(mvp);

  const kill = section("Kill Test", nonEmptyString(report.killTest));
  if (kill) parts.push(kill);

  const competitors = formatCompetitors(report.competitors);
  if (competitors) parts.push(`## Competitors\n\n${competitors}`);

  const marketSizing = formatMarketSizing(report.marketSizing);
  if (marketSizing) parts.push(`## Market Sizing\n\n${marketSizing}`);

  const wtp = formatWtp(report.wtpSignals);
  if (wtp) parts.push(`## Willingness to Pay\n\n${wtp}`);

  const density = formatCompetitionDensity(report.competitionDensity);
  if (density) parts.push(`## Competition Density\n\n${density}`);

  const timing = formatMarketTiming(report.marketTiming);
  if (timing) parts.push(`## Market Timing\n\n${timing}`);

  const icp = formatIcp(report.icp);
  if (icp) parts.push(`## Ideal Customer Profile\n\n${icp}`);

  const workarounds = formatWorkarounds(report.workaroundDetection);
  if (workarounds) parts.push(`## Workarounds\n\n${workarounds}`);

  const featureGaps = formatFeatureGaps(report.featureGapMap);
  if (featureGaps) parts.push(`## Feature Gaps\n\n${featureGaps}`);

  const platformRisk = formatPlatformRisk(report.platformRisk);
  if (platformRisk) parts.push(`## Platform Risk\n\n${platformRisk}`);

  const gtm = formatGtm(report.gtmStrategy);
  if (gtm) parts.push(`## Go-to-Market\n\n${gtm}`);

  const pricing = formatPricingBenchmarks(report.pricingBenchmarks);
  if (pricing) parts.push(`## Pricing Benchmarks\n\n${pricing}`);

  const defensibility = formatDefensibility(report.defensibility);
  if (defensibility) parts.push(`## Defensibility\n\n${defensibility}`);

  const evidence = formatEvidence(report.evidenceLinks);
  if (evidence) parts.push(`## Evidence\n\n${evidence}`);

  return `${parts.join("\n\n")}\n`;
}

const FILENAME_SLUG_MAX = 60;

export function validationMarkdownFilename(ideaText: string): string {
  const raw = typeof ideaText === "string" ? ideaText.trim() : "";
  if (!raw) return "orbis-validation-report.md";

  let slug = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) return "orbis-validation-report.md";

  if (slug.length > FILENAME_SLUG_MAX) {
    slug = slug.slice(0, FILENAME_SLUG_MAX).replace(/-+$/g, "");
  }
  if (!slug) return "orbis-validation-report.md";

  return `orbis-${slug}-validation.md`;
}
