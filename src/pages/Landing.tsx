import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCommunityStats } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import {
  Lightbulb,
  ClipboardCheck,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  Trophy,
  ArrowRight,
  Search,
  Target,
  ShieldCheck,
  Layers,
  Globe,
  Sparkles,
  CheckCircle2,
  MessageSquareText,
  LineChart,
} from "lucide-react";
import { LandingCharts } from "@/components/landing/LandingCharts";
import { LandingLeaderboard } from "@/components/landing/LandingLeaderboard";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    runs: any[];
    reports: any[];
    totalUsers: number;
  } | null>(null);

  useEffect(() => {
    getCommunityStats().then(setStats);
  }, []);

  const handleCta = () => {
    navigate(user ? "/dashboard" : "/auth");
  };

  const totalIdeas =
    stats?.runs.reduce((s, r) => {
      const suggestions = Array.isArray(r.idea_suggestions)
        ? r.idea_suggestions
        : [];
      return s + suggestions.length;
    }, 0) ?? 0;

  const hasData =
    (stats?.runs.length ?? 0) > 0 || (stats?.reports.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold tracking-tight text-gradient-primary">
            Orbis
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              Features
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
              How It Works
            </Button>
            <Button onClick={handleCta} size="sm" className="gradient-primary text-primary-foreground border-0">
              {user ? "Dashboard" : "Get Started"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08)_0%,transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center py-24 sm:py-32 px-6 space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Product Research
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Stop Guessing.
            <br />
            <span className="text-gradient-primary">Start Validating.</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Orbis mines real complaints, clusters pain points, and validates
            product ideas with AI-powered research — so you build what people
            actually need.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              onClick={handleCta}
              className="gradient-primary text-primary-foreground border-0 gap-2 shadow-glow text-base px-8"
            >
              Try Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="text-base"
            >
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Trusted stats strip */}
      {stats && (
        <section className="border-y border-border bg-muted/40">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { label: "Researchers", value: stats.totalUsers, icon: Users },
                { label: "Ideas Generated", value: totalIdeas, icon: Zap },
                { label: "Validations", value: stats.reports.length, icon: BarChart3 },
                { label: "Research Runs", value: stats.runs.length, icon: Trophy },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-3">
          <h3 className="text-3xl font-bold">
            Everything You Need to{" "}
            <span className="text-gradient-primary">Validate Ideas</span>
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From discovering real pain points to getting a clear build-or-skip
            verdict, Orbis covers the full research pipeline.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Search,
              title: "Problem Discovery",
              desc: "Automatically mine real complaints from forums, reviews, and social media to find genuine frustrations worth solving.",
            },
            {
              icon: Layers,
              title: "Pain Point Clustering",
              desc: "AI groups raw complaints into thematic clusters so you can spot patterns and high-frequency pain points instantly.",
            },
            {
              icon: Lightbulb,
              title: "Idea Generation",
              desc: "Get actionable product ideas ranked by demand score, each backed by evidence from real user complaints.",
            },
            {
              icon: Target,
              title: "Demand Scoring",
              desc: "Every idea is scored across demand, pain intensity, and MVP feasibility — no subjective guesswork.",
            },
            {
              icon: ClipboardCheck,
              title: "Full Validation Report",
              desc: "Competitor analysis, pros & cons, evidence links, and a clear Build / Pivot / Skip verdict in one report.",
            },
            {
              icon: MessageSquareText,
              title: "AI Follow-Up Chat",
              desc: "Ask follow-up questions about any report — dive deeper into competitors, pricing strategy, or go-to-market.",
            },
          ].map((f) => (
            <Card
              key={f.title}
              className="group border hover:border-primary/30 transition-colors hover:shadow-glow/30"
            >
              <CardContent className="p-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:gradient-primary group-hover:text-primary-foreground transition-colors">
                  <f.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                </div>
                <h4 className="font-semibold text-base">{f.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="bg-muted/30 border-y border-border py-20"
      >
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-bold">
              How <span className="text-gradient-primary">Orbis</span> Works
            </h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Three steps from zero to validated product idea.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Globe,
                title: "Choose Your Persona",
                desc: "Pick a target persona and category — freelancers, teachers, developers, you name it. Orbis scans real complaints across the web.",
              },
              {
                step: "02",
                icon: LineChart,
                title: "Generate & Score Ideas",
                desc: "AI clusters pain points and generates product ideas with demand scores. Save favorites to your backlog for later.",
              },
              {
                step: "03",
                icon: ShieldCheck,
                title: "Validate with Confidence",
                desc: "Run a full validation: competitors, evidence links, risk factors, and a definitive Build / Pivot / Skip verdict.",
              },
            ].map((s) => (
              <div key={s.step} className="relative space-y-4">
                <span className="text-5xl font-bold text-primary/10">
                  {s.step}
                </span>
                <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h4 className="font-semibold text-lg">{s.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-3">
          <h3 className="text-3xl font-bold">Why Founders Choose Orbis</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {[
            "Evidence-backed ideas, not shower thoughts",
            "Save weeks of manual market research",
            "Clear Build / Pivot / Skip verdicts",
            "Real complaint data, not survey bias",
            "AI follow-up chat for deeper insights",
            "Track trends across the community",
          ].map((b) => (
            <div key={b} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Community trends */}
      {hasData && stats && (
        <section className="bg-muted/30 border-y border-border py-20">
          <div className="max-w-5xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-bold">
                <TrendingUp className="inline h-7 w-7 text-primary mr-2 -mt-1" />
                Community Trends
              </h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                See what the community is researching right now.
              </p>
            </div>
            <LandingCharts stats={stats} />
            <LandingLeaderboard stats={stats} />
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="relative py-24 text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.06)_0%,transparent_60%)]" />
        <div className="relative space-y-6 max-w-xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold">
            Ready to Find Your Next
            <br />
            <span className="text-gradient-primary">Winning Idea?</span>
          </h3>
          <p className="text-muted-foreground">
            No credit card. No email required. Jump in and start discovering.
          </p>
          <Button
            size="lg"
            onClick={handleCta}
            className="gradient-primary text-primary-foreground border-0 gap-2 shadow-glow text-base px-8"
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground/60">Orbis</p>
        <p>From problem discovery to product validation.</p>
      </footer>
    </div>
  );
}
