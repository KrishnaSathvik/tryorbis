import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, X, Minus } from "lucide-react";

type Support = "yes" | "no" | "partial";

interface Tool {
  name: string;
  features: Support[];
}

const FEATURES = [
  "Real complaint mining (Reddit, forums)",
  "Pain point clustering",
  "AI idea generation with demand scores",
  "Full validation report with verdict",
  "Deep research mode (multi-query)",
  "AI advisor chat",
  "Backlog & idea pipeline tracking",
  "Community trends & leaderboard",
  "Free tier available",
];

const TOOLS: Tool[] = [
  { name: "Orbis", features: ["yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes"] },
  { name: "IdeaBuddy", features: ["no", "no", "partial", "partial", "no", "no", "yes", "no", "partial"] },
  { name: "Validator AI", features: ["no", "no", "no", "yes", "no", "partial", "no", "no", "yes"] },
  { name: "DimeADozen", features: ["no", "no", "partial", "yes", "no", "no", "no", "no", "no"] },
  { name: "Informly", features: ["no", "no", "no", "yes", "no", "no", "no", "no", "partial"] },
  { name: "IdeaProof", features: ["no", "no", "partial", "yes", "no", "no", "no", "no", "yes"] },
];

function StatusIcon({ status }: { status: Support }) {
  if (status === "yes") return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (status === "partial") return <Minus className="h-4 w-4 text-muted-foreground" />;
  return <X className="h-4 w-4 text-muted-foreground/40" />;
}

export function LandingComparison() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20 space-y-10">
      <div className="text-center space-y-3">
        <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Comparison</p>
        <h3 className="text-3xl font-bold font-nunito">
          How Orbis <span className="text-gradient-primary">Stacks Up</span>
        </h3>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Most tools only validate — Orbis discovers, generates, validates, and advises.
        </p>
      </div>

      <Card className="overflow-hidden border border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/40">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground min-w-[200px]">Feature</th>
                  {TOOLS.map((tool) => (
                    <th
                      key={tool.name}
                      className={`py-3 px-3 font-semibold text-center min-w-[90px] ${
                        tool.name === "Orbis"
                          ? "text-primary bg-primary/5"
                          : "text-muted-foreground"
                      }`}
                    >
                      {tool.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, fi) => (
                  <tr key={feature} className="border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="py-2.5 px-4 text-xs sm:text-sm font-medium">{feature}</td>
                    {TOOLS.map((tool) => (
                      <td
                        key={tool.name}
                        className={`py-2.5 px-3 text-center ${
                          tool.name === "Orbis" ? "bg-primary/[0.03]" : ""
                        }`}
                      >
                        <div className="flex justify-center">
                          <StatusIcon status={tool.features[fi]} />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center">
        Based on publicly available feature lists as of 2026. <Minus className="inline h-3 w-3 mb-0.5" /> = limited or partial support.
      </p>
    </section>
  );
}
