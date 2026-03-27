import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import type { WtpSignals, CompetitionDensity, FeatureGapMap, PricingBenchmarks, DefensibilityAnalysis } from "@/lib/types";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface Report {
  scores: { demand: number; pain: number; competition: number; mvpFeasibility: number };
  gapOpportunities: string[];
  mvpWedge: string;
  wtpSignals?: WtpSignals;
  competitionDensity?: CompetitionDensity;
  featureGapMap?: FeatureGapMap;
  pricingBenchmarks?: PricingBenchmarks;
  defensibility?: DefensibilityAnalysis;
}

interface Dimension {
  key: string;
  label: string;
  desc: string;
  compute: (r: Report) => number;
}

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

/** Clamp a value to 0–10 */
const clamp = (v: number) => Math.max(0, Math.min(10, v));

/** Map a 0-100 score to 0-10 */
const to10 = (v: number) => v / 10;

/** Map WTP / defensibility strength strings to a numeric score */
const strengthScore: Record<string, number> = {
  strong: 8.5,
  moderate: 6.0,
  weak: 3.5,
  none: 1.5,
};

/* ────────────────────────────────────────────
   Seven dimensions — all derived from Report
   ──────────────────────────────────────────── */

const dimensions: Dimension[] = [
  {
    key: "marketSize",
    label: "Market Size",
    desc: "How large, growing, and accessible the addressable market is. Averaged from demand + pain signals.",
    compute: (r) => clamp((r.scores.demand + r.scores.pain) / 20),
  },
  {
    key: "competitionIntensity",
    label: "Competition Intensity",
    desc: "How manageable the competitive landscape is. Lower competition = higher score.",
    compute: (r) => clamp(to10(100 - r.scores.competition)),
  },
  {
    key: "differentiationClarity",
    label: "Differentiation Clarity",
    desc: "How clearly the idea stands apart — from gap opportunities, MVP wedge, and feature gap analysis.",
    compute: (r) => {
      // Base: inverse of competition (less crowded → easier to differentiate)
      let base = (100 - r.scores.competition) / 20; // 0–5
      // Gap opportunities bonus
      base += Math.min(r.gapOpportunities.length * 0.8, 2.5);
      // MVP wedge bonus
      if (r.mvpWedge && r.mvpWedge.length > 10) base += 1;
      // Feature gap data bonus
      if (r.featureGapMap?.gaps?.length) {
        base += Math.min(r.featureGapMap.gaps.length * 0.4, 1.5);
      }
      return clamp(base);
    },
  },
  {
    key: "defensibilityMoat",
    label: "Defensibility / Moat",
    desc: "How defensible the business can become over time — network effects, data, switching costs.",
    compute: (r) => {
      if (r.defensibility) {
        const base = strengthScore[r.defensibility.overallStrength] ?? 5;
        const signalBonus = Math.min((r.defensibility.signals?.length ?? 0) * 0.4, 1.5);
        return clamp(base + signalBonus);
      }
      // Fallback: derive from competition + gap opportunities
      const competitionFactor = (100 - r.scores.competition) / 20; // 0–5
      const gapFactor = Math.min(r.gapOpportunities.length * 0.6, 2.5);
      const feasFactor = r.scores.mvpFeasibility / 50; // 0–2 (higher feasibility → can iterate to moat faster)
      return clamp(competitionFactor + gapFactor + feasFactor);
    },
  },
  {
    key: "unitEconomics",
    label: "Unit Economics",
    desc: "Likelihood of sustainable unit economics (LTV > CAC). Derived from WTP signals and pricing benchmarks.",
    compute: (r) => {
      let score = 0;
      let signals = 0;

      if (r.wtpSignals) {
        score += strengthScore[r.wtpSignals.strength] ?? 5;
        signals++;
      }
      if (r.pricingBenchmarks) {
        // If pricing benchmarks exist with a suggested range, that's a positive signal
        const hasSuggested = r.pricingBenchmarks.suggestedRange?.mid;
        score += hasSuggested ? 7.5 : 5.5;
        signals++;
      }

      if (signals > 0) return clamp(score / signals);

      // Fallback: demand + pain proxy (high demand+pain = people will pay)
      return clamp((r.scores.demand * 0.6 + r.scores.pain * 0.4) / 10);
    },
  },
  {
    key: "executionComplexity",
    label: "Execution Complexity",
    desc: "How manageable the build and go-to-market is. Higher = easier to execute. Derived from MVP feasibility.",
    compute: (r) => clamp(to10(r.scores.mvpFeasibility)),
  },
  {
    key: "soloFounderViability",
    label: "Solo Founder Viability",
    desc: "How feasible for a solo founder or tiny team. Feasibility-weighted, penalized by competition.",
    compute: (r) => {
      const feasWeight = r.scores.mvpFeasibility * 0.7;
      const compPenalty = (100 - r.scores.competition) * 0.3;
      return clamp((feasWeight + compPenalty) / 10);
    },
  },
];

/* ────────────────────────────────────────────
   Color logic — Green ≥8, Blue ≥6, Amber ≥4.5, Red <4.5
   ──────────────────────────────────────────── */

function getBarColor(v: number): string {
  if (v >= 8) return "bg-emerald-500";
  if (v >= 6) return "bg-sky-500";
  if (v >= 4.5) return "bg-amber-500";
  return "bg-rose-500";
}

function getTextColor(v: number): string {
  if (v >= 8) return "text-emerald-600 dark:text-emerald-400";
  if (v >= 6) return "text-sky-600 dark:text-sky-400";
  if (v >= 4.5) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

interface ValidationScorecardProps {
  report: Report;
  className?: string;
}

export function ValidationScorecard({ report, className }: ValidationScorecardProps) {
  const computed = dimensions.map((d) => ({
    ...d,
    value: Number(d.compute(report).toFixed(1)),
  }));

  return (
    <Card className={cn("rounded-2xl border-border/50", className)}>
      <CardContent className="p-5 space-y-4">
        <h3 className="text-lg font-semibold font-nunito">Should you build this?</h3>
        <div className="space-y-3">
          {computed.map((d) => (
            <div key={d.key} className="space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{d.label}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </PopoverTrigger>
                    <PopoverContent side="top" className="max-w-[240px] p-2">
                      <p className="text-xs">{d.desc}</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <span className={cn("text-sm font-semibold tabular-nums", getTextColor(d.value))}>
                  {d.value.toFixed(1)}
                </span>
              </div>
              <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", getBarColor(d.value))}
                  style={{ width: `${(d.value / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
