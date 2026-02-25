import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, Shield, Clock, Users, TrendingUp, TrendingDown, Minus, Quote, Wrench, Layers, AlertOctagon, Megaphone, Tag, Castle } from "lucide-react";

import type { WtpSignals, CompetitionDensity, MarketTiming, ICP, WorkaroundDetection, FeatureGapMap, PlatformRisk, GtmStrategy, PricingBenchmarks, DefensibilityAnalysis } from "@/lib/types";

/** Converts snake_case or camelCase keys into readable labels */
const formatLabel = (key: string): string =>
  key.replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());

const CARD_CLASS = "rounded-2xl border-border/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden";
const CONTENT_CLASS = "p-4 sm:p-6 space-y-3 sm:space-y-4";
const HEADER_CLASS = "flex items-start sm:items-center justify-between gap-2";
const TITLE_ROW_CLASS = "flex items-center gap-2 min-w-0";
const TITLE_CLASS = "font-semibold font-nunito text-sm sm:text-base";
const SUMMARY_CLASS = "text-xs sm:text-sm text-muted-foreground leading-relaxed";
const DETAIL_LABEL_CLASS = "font-medium text-foreground text-xs sm:text-sm";
const DETAIL_VALUE_CLASS = "text-muted-foreground text-xs sm:text-sm";
const PILL_CLASS = "bg-secondary px-3 py-1 rounded-full text-xs font-medium";
const PILL_PRIMARY_CLASS = "bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium";

const wtpColors: Record<string, string> = {
  strong: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  moderate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  weak: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  none: "bg-muted text-muted-foreground border-border",
};

const wtpTooltips: Record<string, string> = {
  strong: "Users are actively paying for similar solutions — high willingness to pay",
  moderate: "Some payment signals exist but price sensitivity is notable",
  weak: "Little evidence of users paying for this type of solution",
  none: "No willingness-to-pay signals detected",
};

const timingTooltips: Record<string, string> = {
  emerging: "Market is just forming — early mover advantage possible but demand is unproven",
  growing: "Demand is accelerating — good time to enter with a differentiated product",
  saturated: "Market is mature with established players — harder to break in",
  declining: "Demand is shrinking — risky to enter unless you have a contrarian thesis",
};

const workaroundTooltips: Record<string, string> = {
  strong: "People are building elaborate DIY fixes — strong signal for a dedicated product",
  moderate: "Some workarounds exist but they're manageable for most users",
  weak: "Few workarounds found — the pain may not be severe enough",
  none: "No workaround signals detected",
};

const platformRiskTooltips: Record<string, string> = {
  low: "Minimal dependency on any single platform — safe to build",
  medium: "Some platform dependency exists — monitor for changes",
  high: "Significant risk from platform changes or competition",
  critical: "Heavily dependent on a platform that could shut you down",
};

const moatTooltips: Record<string, string> = {
  strong: "Multiple defensibility layers — hard for competitors to replicate",
  moderate: "Some defensibility but competitors could catch up with effort",
  weak: "Easy to copy — limited barriers to entry",
  none: "No meaningful moat detected",
};

const competitionColors: Record<string, string> = {
  blue_ocean: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  fragmented: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  crowded: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  winner_take_most: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const competitionLabels: Record<string, string> = {
  blue_ocean: "Blue Ocean",
  fragmented: "Fragmented",
  crowded: "Crowded",
  winner_take_most: "Winner-Take-Most",
};

const competitionTooltips: Record<string, string> = {
  blue_ocean: "Very few or no direct competitors — wide open opportunity",
  fragmented: "Many small players, no clear leader — room to differentiate",
  crowded: "Established competitors with significant market share",
  winner_take_most: "One or two dominant players control the market",
};

const timingColors: Record<string, string> = {
  emerging: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  growing: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  saturated: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  declining: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const TimingIcon = ({ phase }: { phase: string }) => {
  if (phase === 'growing' || phase === 'emerging') return <TrendingUp className="h-4 w-4" />;
  if (phase === 'declining') return <TrendingDown className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
};

export function WtpSection({ data }: { data: WtpSignals }) {
  return (
    <Card className={CARD_CLASS}>
      <CardContent className={CONTENT_CLASS}>
        <div className={HEADER_CLASS}>
          <div className={TITLE_ROW_CLASS}>
            <DollarSign className="h-4 w-4 text-primary shrink-0" />
            <h3 className={TITLE_CLASS}>Willingness to Pay</h3>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Badge variant="outline" className={`text-xs capitalize cursor-help ${wtpColors[data.strength] || wtpColors.none}`}>
                {data.strength}
              </Badge>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="max-w-[220px] text-xs p-2">
              {wtpTooltips[data.strength] || `WTP strength: ${data.strength}`}
            </PopoverContent>
          </Popover>
        </div>
        <p className={SUMMARY_CLASS}>{data.summary}</p>
        {data.priceRange && (
          <div className="flex flex-wrap gap-2">
            <span className={PILL_CLASS}>Low: ${data.priceRange.low}</span>
            <span className={PILL_PRIMARY_CLASS}>Mid: ${data.priceRange.mid}</span>
            <span className={PILL_CLASS}>High: ${data.priceRange.high}</span>
          </div>
        )}
        {data.signals?.length > 0 && (
          <div className="space-y-3 pt-1">
            {data.signals.slice(0, 2).map((s, i) => (
              <div key={i} className="flex gap-2.5 text-sm">
                <Quote className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                <div>
                  <p className="text-muted-foreground italic leading-relaxed">"{s.quote}"</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">— {s.source}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CompetitionDensitySection({ data }: { data: CompetitionDensity }) {
  return (
    <Card className={CARD_CLASS}>
      <CardContent className={CONTENT_CLASS}>
        <div className={HEADER_CLASS}>
          <div className={TITLE_ROW_CLASS}>
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <h3 className={TITLE_CLASS}>Competition Density</h3>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Badge variant="outline" className={`text-xs cursor-help ${competitionColors[data.level] || ''}`}>
                {competitionLabels[data.level] || formatLabel(data.level)}
              </Badge>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="max-w-[220px] text-xs p-2">
              {competitionTooltips[data.level] || formatLabel(data.level)}
            </PopoverContent>
          </Popover>
        </div>
        <p className={SUMMARY_CLASS}>{data.summary}</p>
        <div className="flex flex-wrap gap-2">
          <span className={PILL_CLASS}>{data.competitorCount} competitors</span>
          {data.totalFundingEstimate && <span className={PILL_CLASS}>~{data.totalFundingEstimate} funded</span>}
          <span className={PILL_CLASS}>Switching: {data.switchingCosts}</span>
        </div>
        {data.keyIncumbents?.length > 0 && (
          <div className="text-sm">
            <span className={DETAIL_LABEL_CLASS}>Key players:</span>{' '}
            <span className={DETAIL_VALUE_CLASS}>{data.keyIncumbents.join(', ')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MarketTimingSection({ data }: { data: MarketTiming }) {
  return (
    <Card className={CARD_CLASS}>
      <CardContent className={CONTENT_CLASS}>
        <div className={HEADER_CLASS}>
          <div className={TITLE_ROW_CLASS}>
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <h3 className={TITLE_CLASS}>Market Timing</h3>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Badge variant="outline" className={`text-xs capitalize flex items-center gap-1 cursor-help ${timingColors[data.phase] || ''}`}>
                <TimingIcon phase={data.phase} />
                {data.phase}
              </Badge>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="max-w-[220px] text-xs p-2">
              {timingTooltips[data.phase] || `Market phase: ${data.phase}`}
            </PopoverContent>
          </Popover>
        </div>
        <p className={SUMMARY_CLASS}>{data.summary}</p>
        {data.signals?.length > 0 && (
          <ul className="space-y-1.5">
            {data.signals.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {s}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function IcpSection({ data }: { data: ICP }) {
  return (
    <Card className={CARD_CLASS}>
      <CardContent className={CONTENT_CLASS}>
        <div className={TITLE_ROW_CLASS}>
          <Users className="h-4 w-4 text-primary shrink-0" />
          <h3 className={TITLE_CLASS}>Ideal Customer Profile</h3>
        </div>
        <p className={SUMMARY_CLASS}>{data.summary}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div><span className={DETAIL_LABEL_CLASS}>Type:</span> <span className={DETAIL_VALUE_CLASS}>{data.businessType}</span></div>
          <div><span className={DETAIL_LABEL_CLASS}>Size:</span> <span className={DETAIL_VALUE_CLASS}>{data.companySize}</span></div>
          <div><span className={DETAIL_LABEL_CLASS}>Revenue:</span> <span className={DETAIL_VALUE_CLASS}>{data.revenueRange}</span></div>
          <div><span className={DETAIL_LABEL_CLASS}>Budget:</span> <span className={DETAIL_VALUE_CLASS}>{data.budgetRange}</span></div>
          <div className="col-span-2"><span className={DETAIL_LABEL_CLASS}>Industry:</span> <span className={DETAIL_VALUE_CLASS}>{data.industry}</span></div>
        </div>
        {data.buyingTriggers?.length > 0 && (
          <div className="text-sm">
            <span className={DETAIL_LABEL_CLASS}>Buying triggers:</span>
            <ul className="mt-1.5 space-y-1">
              {data.buyingTriggers.map((t, i) => (
                <li key={i} className={DETAIL_VALUE_CLASS}>• {t}</li>
              ))}
            </ul>
          </div>
        )}
        {data.techStack?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {data.techStack.map((t, i) => (
              <span key={i} className={PILL_CLASS}>{t}</span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const investmentColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  low: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
};

const severityColors: Record<string, string> = {
  strong: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  moderate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  weak: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  none: "bg-muted text-muted-foreground border-border",
};

const platformRiskColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const opportunityColors: Record<string, string> = {
  high: "text-green-700 dark:text-green-400",
  medium: "text-yellow-700 dark:text-yellow-400",
  low: "text-muted-foreground",
};

const coverageLabels: Record<string, string> = {
  none: "No coverage",
  weak: "Weak",
  strong: "Strong",
  commodity: "Commodity",
};

const riskTypeLabels: Record<string, string> = {
  bundling: "Bundling",
  api_limitation: "API Limit",
  roadmap_overlap: "Roadmap",
  regulation: "Regulation",
  dependency: "Dependency",
  incumbent_improvement: "Incumbent",
  platform_consolidation: "Consolidation",
  pricing_pressure: "Pricing",
  talent_acquisition: "Talent",
  data_advantage: "Data Edge",
};

export function WorkaroundSection({ data }: { data: WorkaroundDetection }) {
  return (
    <Card className={CARD_CLASS}>
      <CardContent className={CONTENT_CLASS}>
        <div className={HEADER_CLASS}>
          <div className={TITLE_ROW_CLASS}>
            <Wrench className="h-4 w-4 text-primary shrink-0" />
            <h3 className={TITLE_CLASS}>Workaround Detection</h3>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Badge variant="outline" className={`text-xs capitalize cursor-help ${severityColors[data.severity] || severityColors.none}`}>
                {data.severity} signal
              </Badge>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="max-w-[220px] text-xs p-2">
              {workaroundTooltips[data.severity] || `Workaround severity: ${data.severity}`}
            </PopoverContent>
          </Popover>
        </div>
        <p className={SUMMARY_CLASS}>{data.summary}</p>
        {data.workarounds?.length > 0 && (
          <div className="space-y-4 pt-1">
            {data.workarounds.slice(0, 3).map((w, i) => (
              <div key={i} className="space-y-1.5">
                <Badge variant="outline" className={`text-xs capitalize ${investmentColors[w.investmentLevel] || ''}`}>
                  {w.investmentLevel}
                </Badge>
                <p className="text-sm text-muted-foreground leading-relaxed">{w.description}</p>
                <p className="text-xs text-muted-foreground/60">— {w.source}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FeatureGapSection({ data }: { data: FeatureGapMap }) {
  return (
    <Card className={CARD_CLASS}>
      <CardContent className={CONTENT_CLASS}>
        <div className={TITLE_ROW_CLASS}>
          <Layers className="h-4 w-4 text-primary shrink-0" />
          <h3 className={TITLE_CLASS}>Feature Gap Map</h3>
        </div>
        <p className={SUMMARY_CLASS}>{data.summary}</p>
        {data.gaps?.length > 0 && (
          <div className="space-y-2 pt-1">
            {data.gaps.slice(0, 5).map((g, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1 sm:gap-0">
                <span className={`${DETAIL_LABEL_CLASS} truncate`}>{g.feature}</span>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className={DETAIL_VALUE_CLASS}>{coverageLabels[g.competitorCoverage] || formatLabel(g.competitorCoverage)}</span>
                  <span className={`font-medium capitalize text-xs ${opportunityColors[g.opportunity] || ''}`}>
                    {g.opportunity === 'high' ? '★ High' : g.opportunity === 'medium' ? '◆ Med' : '○ Low'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {data.topWedge && (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-sm">
            <span className="font-medium text-primary">Top wedge:</span>{' '}
            <span className={DETAIL_VALUE_CLASS}>{data.topWedge}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PlatformRiskSection({ data }: { data: PlatformRisk }) {
  return (
    <Card className={CARD_CLASS}>
      <CardContent className={CONTENT_CLASS}>
        <div className={HEADER_CLASS}>
          <div className={TITLE_ROW_CLASS}>
            <AlertOctagon className="h-4 w-4 text-primary shrink-0" />
            <h3 className={TITLE_CLASS}>Platform Risk</h3>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Badge variant="outline" className={`text-xs capitalize cursor-help ${platformRiskColors[data.level] || ''}`}>
                {data.level}
              </Badge>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="max-w-[220px] text-xs p-2">
              {platformRiskTooltips[data.level] || `Platform risk: ${data.level}`}
            </PopoverContent>
          </Popover>
        </div>
        <p className={SUMMARY_CLASS}>{data.summary}</p>
        {data.signals?.length > 0 && (
          <div className="space-y-4 pt-1">
            {data.signals.map((s, i) => (
              <div key={i} className="space-y-1.5">
                <Badge variant="outline" className="text-xs">
                  {riskTypeLabels[s.riskType] || formatLabel(s.riskType)}
                </Badge>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.signal}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const channelViabilityColors: Record<string, string> = {
  high: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  low: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
};

const moatStrengthColors: Record<string, string> = {
  strong: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  moderate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  weak: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  none: "bg-muted text-muted-foreground border-border",
};

const moatTypeLabels: Record<string, string> = {
  data_network: "Data Network",
  integrations: "Integrations",
  lock_in: "Lock-in",
  community: "Community",
  brand: "Brand",
  technical: "Technical",
  regulatory: "Regulatory",
  switching_costs: "Switching Costs",
  brand_trust: "Brand Trust",
  data_moat: "Data Moat",
  integration_ecosystem: "Integrations",
  network_effects: "Network Effects",
  ip_patents: "IP / Patents",
};

export function GtmStrategySection({ data }: { data: GtmStrategy }) {
  return (
    <Card className={CARD_CLASS}>
      <CardContent className={CONTENT_CLASS}>
        <div className={TITLE_ROW_CLASS}>
          <Megaphone className="h-4 w-4 text-primary shrink-0" />
          <h3 className={TITLE_CLASS}>Go-To-Market Strategy</h3>
        </div>
        <p className={SUMMARY_CLASS}>{data.summary}</p>
        <div className="flex flex-wrap gap-2">
          <span className={PILL_PRIMARY_CLASS}>Primary: {data.primaryChannel}</span>
          {data.founderLedSales && <span className={PILL_CLASS}>Founder-led sales ✓</span>}
          <span className={PILL_CLASS}>SEO: {data.seoViability}</span>
        </div>
        {data.channels?.length > 0 && (
          <div className="space-y-2 pt-1">
            {data.channels.slice(0, 4).map((ch, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className={DETAIL_LABEL_CLASS}>{ch.channel}</span>
                <Badge variant="outline" className={`text-[10px] capitalize ${channelViabilityColors[ch.viability] || ''}`}>
                  {ch.viability}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PricingBenchmarkSection({ data }: { data: PricingBenchmarks }) {
  return (
    <Card className={CARD_CLASS}>
      <CardContent className={CONTENT_CLASS}>
        <div className={TITLE_ROW_CLASS}>
          <Tag className="h-4 w-4 text-primary shrink-0" />
          <h3 className={TITLE_CLASS}>Pricing Benchmarks</h3>
        </div>
        <p className={SUMMARY_CLASS}>{data.summary}</p>
        {data.suggestedRange && (
          <div className="flex flex-wrap gap-2">
            <span className={PILL_CLASS}>Low: {data.suggestedRange.low}</span>
            <span className={PILL_PRIMARY_CLASS}>Mid: {data.suggestedRange.mid}</span>
            <span className={PILL_CLASS}>High: {data.suggestedRange.high}</span>
          </div>
        )}
        {data.pricingModel && (
          <div className="text-sm">
            <span className={DETAIL_LABEL_CLASS}>Model:</span>{' '}
            <span className={DETAIL_VALUE_CLASS}>{data.pricingModel}</span>
          </div>
        )}
        {data.benchmarks?.length > 0 && (
          <div className="space-y-2 pt-1">
            {data.benchmarks.slice(0, 4).map((b, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1 sm:gap-0">
                <span className={`${DETAIL_LABEL_CLASS} truncate`}>{b.tool}</span>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className={DETAIL_VALUE_CLASS}>{b.price}</span>
                  <span className="text-muted-foreground/60 text-xs">{b.model}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DefensibilitySection({ data }: { data: DefensibilityAnalysis }) {
  return (
    <Card className={CARD_CLASS}>
      <CardContent className={CONTENT_CLASS}>
        <div className={HEADER_CLASS}>
          <div className={TITLE_ROW_CLASS}>
            <Castle className="h-4 w-4 text-primary shrink-0" />
            <h3 className={TITLE_CLASS}>Defensibility & Moat</h3>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Badge variant="outline" className={`text-xs capitalize cursor-help ${moatStrengthColors[data.overallStrength] || moatStrengthColors.none}`}>
                {data.overallStrength}
              </Badge>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="max-w-[220px] text-xs p-2">
              {moatTooltips[data.overallStrength] || `Defensibility: ${data.overallStrength}`}
            </PopoverContent>
          </Popover>
        </div>
        <p className={SUMMARY_CLASS}>{data.summary}</p>
        {data.timeToMoat && (
          <div className="text-sm">
            <span className={DETAIL_LABEL_CLASS}>Time to moat:</span>{' '}
            <span className={DETAIL_VALUE_CLASS}>{data.timeToMoat}</span>
          </div>
        )}
        {data.signals?.length > 0 && (
          <div className="space-y-4 pt-1">
            {data.signals.map((s, i) => (
              <div key={i} className="space-y-1.5">
                <Badge variant="outline" className={`text-xs capitalize ${moatStrengthColors[s.strength] || ''}`}>
                  {moatTypeLabels[s.type] || formatLabel(s.type)}
                </Badge>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
