import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ScoreBar";
import { VerdictBadge } from "@/components/VerdictBadge";

import { ArrowLeft, Sparkles, Zap, Clock, CheckCircle2 } from "lucide-react";
import orbisLogo from "@/assets/orbis-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FeedbackDrawer } from "@/components/FeedbackDrawer";

const exampleReports = [
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

const changelog = [
  { date: "Feb 2026", title: "Sourced vs Estimated labels", desc: "Every metric now shows whether it's backed by research or AI-estimated." },
  { date: "Feb 2026", title: "Observability logging", desc: "All AI functions now track latency, error rates, and provider performance." },
  { date: "Feb 2026", title: "Phase 3 Intelligence Layers", desc: "Added GTM Strategy, Pricing Benchmarks, and Defensibility & Moat analysis." },
  { date: "Jan 2026", title: "Orbis AI Chat", desc: "Dedicated AI advisor for brainstorming, strategy, and go-to-market planning." },
  { date: "Jan 2026", title: "Market Intelligence v1", desc: "WTP signals, Competition Density, Market Timing, and ICP Precision." },
];

const verdictColors = {
  Build: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Pivot: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Skip: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export default function Examples() {
  usePageTitle("Examples & Changelog");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={orbisLogo} alt="Orbis" className="h-6 w-6 sm:h-7 sm:w-7 dark-invert" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight font-nunito text-gradient-primary">Orbis</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => navigate("/")}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">
        {/* Changelog */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium">
              <Zap className="h-3.5 w-3.5" />
              What's New
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-nunito">Changelog</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Recent updates and improvements to Orbis.</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-0">
            {changelog.map((entry, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-primary/20 border-2 border-primary shrink-0 mt-1.5 group-hover:scale-125 transition-transform" />
                  {i < changelog.length - 1 && <div className="w-px flex-1 bg-border/50" />}
                </div>
                <div className="pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{entry.date}</span>
                  </div>
                  <h4 className="font-semibold text-sm font-nunito">{entry.title}</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">{entry.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Example Reports */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Sample Output
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-nunito">Example Reports</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">See the kind of insights Orbis delivers — no credits needed.</p>
          </div>

          <div className="space-y-8">
            {exampleReports.map((r) => (
              <Card key={r.id} className="rounded-2xl border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="p-6 border-b border-border/50 bg-secondary/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Idea</p>
                        <p className="text-base font-semibold font-nunito leading-snug">{r.idea}</p>
                      </div>
                      <VerdictBadge verdict={r.verdict} size="lg" />
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Scores */}
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
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
                    <div className="flex gap-3">
                      {[
                        { label: "TAM", value: r.tam },
                        { label: "SAM", value: r.sam },
                        { label: "SOM", value: r.som },
                      ].map((m) => (
                        <div key={m.label} className="flex items-center gap-2 bg-secondary/60 rounded-full px-3 py-1.5">
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
              Try It Yourself — Free <ArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2">
            <img src={orbisLogo} alt="Orbis" className="h-6 w-6 dark-invert" />
            <span className="font-bold font-nunito text-gradient-primary">Orbis</span>
          </a>
          <div className="flex items-center gap-4">
            <FeedbackDrawer />
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} Orbis</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
