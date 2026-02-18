import { useEffect, useState, useCallback } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  Lightbulb, ClipboardCheck, TrendingUp, Users, Zap, BarChart3, Trophy, ArrowRight,
  Search, Target, ShieldCheck, Layers, Globe, Sparkles, CheckCircle2, MessageSquareText, LineChart,
} from "lucide-react";
import { LandingCharts } from "@/components/landing/LandingCharts";
import { LandingLeaderboard } from "@/components/landing/LandingLeaderboard";
import { LandingTrends } from "@/components/landing/LandingTrends";
import { LandingSuccessTracking } from "@/components/landing/LandingSuccessTracking";
import { LandingComparison } from "@/components/landing/LandingComparison";
import { LandingTicker } from "@/components/landing/LandingTicker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FeedbackDrawer } from "@/components/FeedbackDrawer";
import orbisLogo from "@/assets/orbis-logo.png";

export default function Landing() {
  usePageTitle();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  const refreshStats = useCallback(async () => {
    try {
      const res = await supabase.functions.invoke("community-stats");
      if (res.data) setStats(res.data);
    } catch (e) {
      console.error("Failed to fetch community stats:", e);
    }
  }, []);

  useEffect(() => {
    refreshStats();

    // Subscribe to realtime changes on tables that feed community stats
    const channel = supabase
      .channel("community-stats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "generator_runs" }, () => refreshStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "validation_reports" }, () => refreshStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "backlog_items" }, () => refreshStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => refreshStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshStats]);

  const hasData = (stats?.totalRuns ?? 0) > 0 || (stats?.totalValidations ?? 0) > 0;

  const handleCta = () => navigate(user ? "/dashboard" : "/try");

  const totalIdeas = stats?.totalIdeas ?? 0;

  return (
    <div className="min-h-screen bg-background">
    <main>
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2 cursor-pointer">
            <img src={orbisLogo} alt="Orbis" className="h-6 w-6 sm:h-7 sm:w-7 dark-invert" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight font-nunito text-gradient-primary">Orbis</h1>
          </a>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Features</Button>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>How It Works</Button>
            <ThemeToggle />
            <Button onClick={handleCta} size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              {user ? "Dashboard" : "Get Started"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06)_0%,transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center py-24 sm:py-32 px-6 space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Product Research
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] font-nunito animate-slide-up">
            Stop Guessing.
            <br />
            <span className="text-gradient-primary">Start Validating.</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Orbis mines real complaints, clusters pain points, and validates product ideas with AI-powered research — so you build what people actually need.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Button size="lg" onClick={handleCta} className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 text-base px-8 hover:-translate-y-0.5 transition-all shadow-lg">
              Try Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full text-base bg-card/40 backdrop-blur-md border-border/50 hover:-translate-y-0.5 transition-all">
              See How It Works
            </Button>
          </div>
          <p className="text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: "0.6s" }}>Start instantly. No signup required.</p>
        </div>
      </section>

      {/* Problem / Solution / Who */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-destructive">The Problem</p>
            <h3 className="text-xl font-bold font-nunito">Most startups fail because they build something nobody wants.</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Founders waste months building products based on assumptions, gut feelings, or biased surveys — only to discover there's no real demand.</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-primary">The Solution</p>
            <h3 className="text-xl font-bold font-nunito">Orbis finds real pain points and validates ideas with AI research.</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">It mines actual complaints from forums and reviews, clusters them into patterns, generates product ideas with demand scores, and delivers a clear Build / Pivot / Skip verdict.</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Who It's For</p>
            <h3 className="text-xl font-bold font-nunito">Solo founders, indie hackers, and early-stage teams.</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Anyone who wants to validate a product idea before writing a single line of code — without spending weeks on manual market research.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Features</p>
          <h3 className="text-3xl font-bold font-nunito">
            Everything You Need to <span className="text-gradient-primary">Validate Ideas</span>
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">From discovering real pain points to getting a clear build-or-skip verdict, Orbis covers the full research pipeline.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Search, title: "Problem Discovery", desc: "Automatically mine real complaints from forums, reviews, and social media to find genuine frustrations worth solving." },
            { icon: Layers, title: "Pain Point Clustering", desc: "AI groups raw complaints into thematic clusters so you can spot patterns and high-frequency pain points instantly." },
            { icon: Lightbulb, title: "Idea Generation", desc: "Get actionable product ideas ranked by opportunity score, each backed by evidence. Toggle Deep Research for thorough analysis." },
            { icon: Target, title: "10-Dimension Intelligence", desc: "Every run scores WTP, competition density, market timing, ICP, feature gaps, platform risk, GTM strategy, pricing, and defensibility." },
            { icon: ClipboardCheck, title: "Full Validation Report", desc: "Competitor analysis, pros & cons, evidence links, and a clear Build / Pivot / Skip verdict in one report." },
            { icon: Sparkles, title: "Personalized AI Advisor", desc: "Orbis AI knows your credits, saved ideas, and research history — giving you tailored strategic advice, not generic tips.", highlight: true },
          ].map((f: any) => (
            <Card key={f.title} className={`group card-warm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${f.highlight ? 'ring-1 ring-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent' : ''}`}>
              <CardContent className="p-8 space-y-4">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow ${f.highlight ? 'bg-gradient-to-br from-primary/20 to-primary/5' : 'bg-secondary'}`}>
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base font-nunito">{f.title}</h3>
                  {f.highlight && <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Smart</span>}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-secondary/40 border-y border-border/50 py-20">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Process</p>
            <h3 className="text-3xl font-bold font-nunito">How <span className="text-gradient-primary">Orbis</span> Works</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">Four steps from zero to validated product idea.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", icon: Globe, title: "Describe Your Idea", desc: "Tell Orbis what you're thinking — a target audience, a problem space, or a rough idea. AI extracts the context automatically." },
              { step: "02", icon: LineChart, title: "Generate & Score", desc: "AI clusters pain points and generates product ideas with demand scores. Save favorites to your backlog." },
              { step: "03", icon: ShieldCheck, title: "Validate", desc: "Run a full validation: competitors, evidence links, risk factors, and a Build / Pivot / Skip verdict." },
              { step: "04", icon: Sparkles, title: "Chat with Orbis AI", desc: "Discuss findings, explore pivots, refine strategy — your AI advisor is always ready to help you think deeper." },
            ].map((s) => (
              <div key={s.step} className="relative space-y-4">
                <span className="text-5xl font-bold text-primary/25 font-nunito">{s.step}</span>
                <div className="h-11 w-11 rounded-2xl gradient-primary flex items-center justify-center shadow-md">
                  <s.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg font-nunito">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-3">
          <h3 className="text-3xl font-bold font-nunito">Why Founders Choose Orbis</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {[
            "Evidence-backed ideas, not shower thoughts",
            "Save weeks of manual market research",
            "Clear Build / Pivot / Skip verdicts",
            "10-dimension market intelligence per run",
            "Personalized AI advisor that knows your progress",
            "Free to start — no signup required",
          ].map((b) => (
            <div key={b} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Competitive Comparison */}
      <LandingComparison />

      {/* Community trends */}
      {stats && (
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.04)_0%,transparent_70%)]" />
          <div className="max-w-5xl mx-auto px-6 space-y-14 relative">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium mb-2">
                <TrendingUp className="h-3.5 w-3.5" />Live Stats
              </div>
              <h3 className="text-3xl font-bold font-nunito">Community <span className="text-gradient-primary">Trends</span></h3>
              <p className="text-muted-foreground max-w-lg mx-auto">See what the community is researching right now.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {[
                { label: "Users", value: stats.totalUsers, icon: Users },
                { label: "Ideas Generated", value: totalIdeas, icon: Zap },
                { label: "Validations", value: stats.totalValidations, icon: BarChart3 },
                { label: "Research Runs", value: stats.totalRuns, icon: Trophy },
              ].map((s) => (
                <Card key={s.label} className="group rounded-2xl bg-secondary border-0 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-5 sm:p-6 flex flex-col items-center gap-3 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-card flex items-center justify-center shadow-sm">
                      <s.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-3xl sm:text-4xl font-bold tracking-tight font-nunito">{s.value}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1 font-semibold uppercase tracking-wider">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {stats.trendingNow && <LandingTicker trendingNow={stats.trendingNow} />}
            {hasData && (
              <div className="space-y-6">
                <LandingCharts stats={stats} />
                {stats.trendData && <LandingTrends trendData={stats.trendData} />}
                {stats.founderSuccess && <LandingSuccessTracking founderSuccess={stats.founderSuccess} />}
                <LandingLeaderboard stats={stats} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="relative py-24 text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.04)_0%,transparent_60%)]" />
        <div className="relative space-y-6 max-w-xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold font-nunito">
            Ready to Find Your Next<br /><span className="text-gradient-primary">Winning Idea?</span>
          </h3>
          <p className="text-muted-foreground">Sign up in seconds and start discovering.</p>
          <Button size="lg" onClick={handleCta} className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 text-base px-8 shadow-lg hover:-translate-y-0.5 transition-all">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2">
            <img src={orbisLogo} alt="Orbis" className="h-6 w-6 dark-invert" />
            <span className="font-bold font-nunito text-gradient-primary">Orbis</span>
            <span className="text-xs text-muted-foreground ml-1">From problem discovery to product validation.</span>
          </a>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/examples")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Examples & Changelog
            </button>
            <FeedbackDrawer />
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} Orbis</span>
          </div>
        </div>
      </footer>
    </main>
    </div>
  );
}
