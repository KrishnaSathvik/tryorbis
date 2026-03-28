import { useEffect, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/ScoreBar";
import { VerdictBadge } from "@/components/VerdictBadge";
import { fetchShowcaseReports, type ShowcaseReport } from "@/lib/showcase";

import { ArrowRight, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

/* ─────────────────────────────────────────────
   FALLBACK — used when no showcase reports exist
   ───────────────────────────────────────────── */
const fallbackReports = [
  {
    id: "build",
    idea: "AI-powered subscription tracker that analyzes spending patterns and auto-negotiates better rates",
    verdict: "Build" as const,
    scores: { demand: 82, pain: 78, competition: 45, mvpFeasibility: 85 },
    pros: ["High search volume for 'cancel subscriptions' and 'reduce bills'", "People actively complain about forgotten subscriptions on Reddit/Twitter", "Clear monetization: savings-based fee or freemium"],
    cons: ["Rocket Money / Trim already exist in this space", "Requires bank integrations (Plaid) which adds complexity", "User trust barrier for financial data access"],
    tam: "$4.2B",
    sam: "$850M",
    som: "$12M",
  },
  {
    id: "pivot",
    idea: "Social platform for pet owners to find and review local veterinarians",
    verdict: "Pivot" as const,
    scores: { demand: 55, pain: 42, competition: 70, mvpFeasibility: 65 },
    pros: ["Pet spending is growing year-over-year", "Emotional connection to pets drives engagement", "Review content creates SEO moat"],
    cons: ["Google Maps/Yelp already dominate local reviews", "Low switching cost — users won't abandon Google", "Niche too narrow for standalone platform"],
    tam: "$1.8B",
    sam: "$200M",
    som: "$3M",
  },
  {
    id: "skip",
    idea: "Blockchain-based resume verification for job applicants",
    verdict: "Skip" as const,
    scores: { demand: 25, pain: 18, competition: 60, mvpFeasibility: 30 },
    pros: ["Resume fraud is a real problem (estimated 40% embellish)", "Enterprise buyers have budget for HR tech"],
    cons: ["No one is searching for blockchain resumes", "Existing background check services are entrenched", "Blockchain adds complexity without clear user benefit", "Long enterprise sales cycles drain runway"],
    tam: "$900M",
    sam: "$120M",
    som: "$1M",
  },
];

function mapDbReport(r: ShowcaseReport) {
  const ms = r.market_sizing as Record<string, string> | null;
  return {
    id: r.id,
    idea: r.idea_text,
    verdict: r.verdict as "Build" | "Pivot" | "Skip",
    scores: {
      demand: r.scores?.demand ?? 0,
      pain: r.scores?.pain ?? 0,
      competition: r.scores?.competition ?? 0,
      mvpFeasibility: r.scores?.mvpFeasibility ?? 0,
    },
    pros: Array.isArray(r.pros) ? r.pros as string[] : [],
    cons: Array.isArray(r.cons) ? r.cons as string[] : [],
    tam: ms?.tam || "N/A",
    sam: ms?.sam || "N/A",
    som: ms?.som || "N/A",
  };
}

export default function Examples() {
  usePageTitle("Examples");
  const navigate = useNavigate();
  const [reports, setReports] = useState(fallbackReports);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    fetchShowcaseReports().then((data) => {
      if (data.length > 0) {
        setReports(data.slice(0, 3).map(mapDbReport));
      }
      setReportsLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16 sm:space-y-20">
        {/* Example Reports */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Sample Output
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-nunito">Example Reports</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">See the kind of insights Orbis delivers — free to browse.</p>
          </div>

          <div className={`space-y-8 transition-opacity duration-500 ${reportsLoading ? "opacity-60 animate-pulse" : "opacity-100"}`}>
            {reports.map((r) => (
              <Card key={r.id} className="rounded-2xl border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="p-4 sm:p-6 border-b border-border/50 bg-secondary/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Idea</p>
                        <p className="text-sm sm:text-base font-semibold font-nunito leading-snug">{r.idea}</p>
                      </div>
                      <VerdictBadge verdict={r.verdict} size="lg" />
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                    {/* Scores */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                      <ScoreBar label="Demand" value={r.scores.demand} />
                      <ScoreBar label="Pain" value={r.scores.pain} />
                      <ScoreBar label="Competition" value={r.scores.competition} />
                      <ScoreBar label="MVP Feasibility" value={r.scores.mvpFeasibility} />
                    </div>

                    {/* Pros & Cons */}
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Pros
                        </h4>
                        <ul className="space-y-1">
                          {r.pros.map((p, i) => (
                            <li key={i} className="text-xs text-muted-foreground">• {p}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-rose-600" /> Cons
                        </h4>
                        <ul className="space-y-1">
                          {r.cons.map((c, i) => (
                            <li key={i} className="text-xs text-muted-foreground">• {c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Market Sizing */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {[
                        { label: "TAM", value: r.tam },
                        { label: "SAM", value: r.sam },
                        { label: "SOM", value: r.som },
                      ].map((m) => (
                        <div key={m.label} className="flex items-center gap-1.5 sm:gap-2 bg-secondary/60 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5">
                          <span className="text-[10px] font-bold text-primary">{m.label}</span>
                          <span className="text-xs font-medium">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center pt-4">
            <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2" onClick={() => navigate("/auth")}>
              Try It Yourself — Free <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

      </div>

      <PublicFooter />
    </div>
  );
}
