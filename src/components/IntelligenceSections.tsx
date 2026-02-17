import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Shield, Clock, Users, TrendingUp, TrendingDown, Minus, Quote } from "lucide-react";
import type { WtpSignals, CompetitionDensity, MarketTiming, ICP } from "@/lib/types";

const wtpColors: Record<string, string> = {
  strong: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  moderate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  weak: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  none: "bg-muted text-muted-foreground border-border",
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
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary shrink-0" />
            <h3 className="font-semibold text-sm">Willingness to Pay</h3>
          </div>
          <Badge variant="outline" className={`text-xs capitalize ${wtpColors[data.strength] || wtpColors.none}`}>
            {data.strength}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{data.summary}</p>
        {data.priceRange && (
          <div className="flex gap-3 text-xs">
            <span className="bg-secondary px-2.5 py-1 rounded-full font-medium">Low: ${data.priceRange.low}</span>
            <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">Mid: ${data.priceRange.mid}</span>
            <span className="bg-secondary px-2.5 py-1 rounded-full font-medium">High: ${data.priceRange.high}</span>
          </div>
        )}
        {data.signals?.length > 0 && (
          <div className="space-y-2 pt-1">
            {data.signals.slice(0, 3).map((s, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <Quote className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-muted-foreground italic">"{s.quote}"</p>
                  <p className="text-muted-foreground/60 mt-0.5">— {s.source}</p>
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
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <h3 className="font-semibold text-sm">Competition Density</h3>
          </div>
          <Badge variant="outline" className={`text-xs ${competitionColors[data.level] || ''}`}>
            {competitionLabels[data.level] || data.level}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{data.summary}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="bg-secondary px-2.5 py-1 rounded-full">{data.competitorCount} competitors</span>
          {data.totalFundingEstimate && <span className="bg-secondary px-2.5 py-1 rounded-full">~{data.totalFundingEstimate} funded</span>}
          <span className="bg-secondary px-2.5 py-1 rounded-full">Switching: {data.switchingCosts}</span>
        </div>
        {data.keyIncumbents?.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Key players:</span> {data.keyIncumbents.join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MarketTimingSection({ data }: { data: MarketTiming }) {
  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <h3 className="font-semibold text-sm">Market Timing</h3>
          </div>
          <Badge variant="outline" className={`text-xs capitalize flex items-center gap-1 ${timingColors[data.phase] || ''}`}>
            <TimingIcon phase={data.phase} />
            {data.phase}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{data.summary}</p>
        {data.signals?.length > 0 && (
          <ul className="space-y-1">
            {data.signals.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {s}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function IcpSection({ data }: { data: ICP }) {
  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary shrink-0" />
          <h3 className="font-semibold text-sm">Ideal Customer Profile</h3>
        </div>
        <p className="text-sm text-muted-foreground">{data.summary}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div><span className="font-medium text-foreground">Type:</span> <span className="text-muted-foreground">{data.businessType}</span></div>
          <div><span className="font-medium text-foreground">Size:</span> <span className="text-muted-foreground">{data.companySize}</span></div>
          <div><span className="font-medium text-foreground">Revenue:</span> <span className="text-muted-foreground">{data.revenueRange}</span></div>
          <div><span className="font-medium text-foreground">Budget:</span> <span className="text-muted-foreground">{data.budgetRange}</span></div>
          <div className="col-span-2"><span className="font-medium text-foreground">Industry:</span> <span className="text-muted-foreground">{data.industry}</span></div>
        </div>
        {data.buyingTriggers?.length > 0 && (
          <div className="text-xs">
            <span className="font-medium text-foreground">Buying triggers:</span>
            <ul className="mt-1 space-y-0.5">
              {data.buyingTriggers.map((t, i) => (
                <li key={i} className="text-muted-foreground">• {t}</li>
              ))}
            </ul>
          </div>
        )}
        {data.techStack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {data.techStack.map((t, i) => (
              <span key={i} className="bg-secondary text-xs px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
