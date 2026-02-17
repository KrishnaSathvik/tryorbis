import { Card, CardContent } from "@/components/ui/card";
import { Rocket, ArrowRight } from "lucide-react";

interface FunnelStep {
  status: string;
  count: number;
  pct: number;
}

interface FounderSuccess {
  totalSaved: number;
  progressionRate: number;
  buildRate: number;
  activeBuilders: number;
  funnelData: FunnelStep[];
}

interface Props {
  founderSuccess: FounderSuccess;
}

const STATUS_COLORS: Record<string, string> = {
  New: "hsl(220, 70%, 50%)",
  Exploring: "hsl(262, 60%, 55%)",
  Validated: "hsl(38, 92%, 50%)",
  Building: "hsl(142, 72%, 40%)",
  Archived: "hsl(220, 10%, 60%)",
};

export function LandingSuccessTracking({ founderSuccess }: Props) {
  const { totalSaved, progressionRate, buildRate, activeBuilders, funnelData } = founderSuccess;

  if (totalSaved === 0) return null;

  const activeFunnel = funnelData.filter(f => f.count > 0);

  return (
    <Card className="border border-border/50 bg-background/60 backdrop-blur-sm">
      <CardContent className="p-5 space-y-5">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" />
          Founder Success Tracking
        </h4>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Progression Rate", value: `${progressionRate}%`, desc: "Ideas moved beyond 'New'" },
            { label: "Build Rate", value: `${buildRate}%`, desc: "Validations → Build verdict" },
            { label: "Active Builders", value: activeBuilders, desc: "Ideas in Building stage" },
          ].map(m => (
            <div key={m.label} className="text-center">
              <p className="text-2xl font-bold font-nunito tracking-tight">{m.value}</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Funnel visualization */}
        <div>
          <p className="text-xs text-muted-foreground mb-3 font-medium">Idea Pipeline Funnel</p>
          <div className="flex items-center gap-1">
            {activeFunnel.map((step, i) => (
              <div key={step.status} className="flex items-center gap-1 flex-1">
                <div className="flex-1">
                  <div
                    className="h-8 rounded-md flex items-center justify-center transition-all"
                    style={{
                      background: STATUS_COLORS[step.status] || "hsl(220, 10%, 70%)",
                      opacity: 0.85,
                    }}
                  >
                    <span className="text-[11px] font-semibold text-white drop-shadow-sm">
                      {step.count}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-1 font-medium">{step.status}</p>
                </div>
                {i < activeFunnel.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
