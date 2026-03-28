import { useEffect, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

/* ─────────────────────────────────────────────
   WAITLIST FORM
   ───────────────────────────────────────────── */
function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("loading");
    try {
      const { error } = await (supabase.from as any)("waitlist").insert({ email: email.trim().toLowerCase() });
      if (error) {
        if (error.code === "23505") {
          // unique constraint — already on list
          setStatus("success");
          setMsg("You're already on the list!");
        } else {
          throw error;
        }
      } else {
        setStatus("success");
        setMsg("You're in! We'll email you when unlimited launches.");
        setEmail("");
      }
    } catch {
      setStatus("error");
      setMsg("Something went wrong. Try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">{msg}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
          className="pl-9 rounded-full bg-secondary/50 border-border/50 h-10 text-sm"
          required
        />
      </div>
      <Button
        type="submit"
        disabled={status === "loading"}
        size="sm"
        className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-5 h-10 text-sm shrink-0"
      >
        {status === "loading" ? "Joining..." : "Join Waitlist"}
      </Button>
      {status === "error" && <p className="text-xs text-destructive mt-1">{msg}</p>}
    </form>
  );
}
import {
  ArrowRight,
  Search,
  Target,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Users,
  Layers,
  AlertTriangle,
  BarChart3,
  Globe,
  Crosshair,
  Wrench,
  Map,
  Rocket,
  Tag,
  Lock,
  Sparkles,
  Mail,
} from "lucide-react";

/* ─────────────────────────────────────────────
   EXAMPLE REPORT DATA
   Replace this with a real Orbis output later
   ───────────────────────────────────────────── */
const exampleReport = {
  idea: "AI-powered meal prep planner for busy parents",
  verdict: "Build",
  verdictColor: "text-emerald-400",
  verdictBg: "bg-emerald-400/10 border-emerald-400/20",
  overallScore: 82,
  dimensions: [
    { icon: DollarSign, label: "Willingness to Pay", score: "High", detail: "Parents actively paying $10–30/mo for meal planning apps", color: "text-emerald-400" },
    { icon: Users, label: "Competition Density", score: "Moderate", detail: "~12 direct competitors, none with AI personalization", color: "text-amber-400" },
    { icon: TrendingUp, label: "Market Timing", score: "Growing", detail: "Meal kit market $19B, shifting toward personalization", color: "text-emerald-400" },
    { icon: Crosshair, label: "ICP Precision", score: "Sharp", detail: "Dual-income parents, 28–42, suburban, health-conscious", color: "text-emerald-400" },
    { icon: Wrench, label: "Workarounds", score: "Manual", detail: "Spreadsheets, Pinterest boards, generic recipe apps", color: "text-amber-400" },
    { icon: Map, label: "Feature Gaps", score: "3 Found", detail: "No competitor offers kid-preference AI + grocery auto-order", color: "text-emerald-400" },
    { icon: AlertTriangle, label: "Platform Risk", score: "Low", detail: "No bundling threat from major platforms detected", color: "text-emerald-400" },
    { icon: Rocket, label: "GTM Strategy", score: "Strong", detail: "Parenting communities, SEO for meal prep keywords", color: "text-emerald-400" },
    { icon: Tag, label: "Pricing Benchmark", score: "$12–25/mo", detail: "Competitors range $8–30/mo, sweet spot at $15/mo", color: "text-blue-400" },
    { icon: Lock, label: "Defensibility", score: "Medium", detail: "Data moat from user taste profiles, moderate lock-in", color: "text-amber-400" },
  ],
  evidence: [
    { source: "r/MealPrepSunday", quote: "I spend 2 hours every Sunday planning meals for my kids and they still won't eat half of it" },
    { source: "r/Parenting", quote: "Would pay good money for something that learns what my picky eater actually likes" },
    { source: "Trustpilot — MealPlanPro", quote: "Great recipes but zero personalization. Keeps suggesting things my kids are allergic to" },
  ],
};

export default function Landing() {
  usePageTitle();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleCta = () => navigate(user ? "/dashboard" : "/try");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06)_0%,transparent_60%)]" />
        <div className="max-w-3xl mx-auto text-center py-20 sm:py-28 px-6 space-y-6 relative">
          <h1 className="text-[1.85rem] sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] font-nunito">
            Validate your startup idea
            <br />
            <span className="text-gradient-primary">before you write code.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Paste an idea. Get a 10-dimension market intelligence report with a clear
            <span className="font-semibold text-foreground"> Build / Pivot / Skip </span>
            verdict — in 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              onClick={handleCta}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 text-base px-8 hover:-translate-y-0.5 transition-all shadow-lg"
            >
              Try Free — 2 Reports <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">No credit card. 2 free validation reports to start.</p>
        </div>
      </section>

      {/* ── EXAMPLE REPORT ── */}
      <section id="example" className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center space-y-2 mb-8">
          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Real Output</p>
          <h2 className="text-2xl sm:text-3xl font-bold font-nunito">
            Here's what an Orbis report <span className="text-gradient-primary">actually looks like</span>
          </h2>
        </div>

        {/* Report Card */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xl">
          {/* Report Header */}
          <div className="px-6 py-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Validation Report</p>
              <h3 className="text-base sm:text-lg font-bold font-nunito">{exampleReport.idea}</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-3xl font-extrabold font-nunito">{exampleReport.overallScore}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</p>
              </div>
              <div className={`px-4 py-2 rounded-xl border font-bold text-sm ${exampleReport.verdictBg} ${exampleReport.verdictColor}`}>
                {exampleReport.verdict}
              </div>
            </div>
          </div>

          {/* 10 Dimensions Grid */}
          <div className="px-6 py-5 border-b border-border/40">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4">10-Dimension Intelligence</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exampleReport.dimensions.map((d) => (
                <div key={d.label} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center shrink-0 mt-0.5">
                    <d.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{d.label}</span>
                      <span className={`text-xs font-bold ${d.color}`}>{d.score}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">{d.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence */}
          <div className="px-6 py-5">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4">Real Evidence Found</p>
            <div className="space-y-3">
              {exampleReport.evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-primary text-xs font-bold mt-0.5 shrink-0 bg-primary/10 px-2 py-0.5 rounded-md">{e.source}</span>
                  <p className="text-muted-foreground italic leading-relaxed">"{e.quote}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Report CTA Bar */}
          <div className="px-6 py-4 bg-secondary/30 border-t border-border/40 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">This is a real Orbis validation report. Get yours in 60 seconds.</p>
            <Button onClick={handleCta} size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-1.5 text-xs">
              Try It Free <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION / WHO ── */}
      <section className="border-y border-border/50 bg-secondary/30 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-destructive">The Problem</p>
              <h3 className="text-xl font-bold font-nunito">Most startups fail because they build something nobody wants.</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Founders waste months building products based on assumptions and gut feelings — only to discover there's no real demand.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-primary">The Solution</p>
              <h3 className="text-xl font-bold font-nunito">Orbis validates ideas with 10 dimensions of market intelligence.</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                It mines real complaints, analyzes competition, scores willingness-to-pay, maps feature gaps, and gives you a clear Build / Pivot / Skip verdict.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Who It's For</p>
              <h3 className="text-xl font-bold font-nunito">Solo founders, indie hackers, and early-stage teams.</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Anyone who wants to validate a product idea before writing a single line of code — without spending weeks on manual research.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-16">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">How It Works</p>
            <h2 className="text-2xl sm:text-3xl font-bold font-nunito">
              Three steps. <span className="text-gradient-primary">60 seconds.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Search,
                title: "Paste Your Idea",
                desc: "Describe a problem, audience, or rough idea. Even one sentence works — Orbis extracts the context automatically.",
              },
              {
                step: "02",
                icon: Target,
                title: "Get Your Report",
                desc: "AI analyzes 10 dimensions: willingness-to-pay, competition, timing, ICP, feature gaps, GTM strategy, pricing, and more.",
              },
              {
                step: "03",
                icon: ShieldCheck,
                title: "Build or Skip",
                desc: "Get a clear verdict backed by real evidence — competitor data, user quotes, and market signals. No guessing.",
              },
            ].map((s) => (
              <div key={s.step} className="space-y-4">
                <span className="text-4xl font-bold text-primary/20 font-nunito">{s.step}</span>
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

      {/* ── SOCIAL PROOF / QUICK BENEFITS ── */}
      <section className="border-y border-border/50 bg-secondary/30 py-14">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "10-dimension market intelligence per report",
              "Real evidence from forums, reviews & communities",
              "Clear Build / Pivot / Skip verdict",
              "AI advisor that knows your research history",
              "Save ideas to backlog with status tracking",
              "Results in 60 seconds, not 60 hours",
            ].map((b) => (
              <div key={b} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING + WAITLIST ── */}
      <section className="py-16">
        <div className="max-w-lg mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold font-nunito">Try free. Upgrade when you're ready.</h2>
          <div className="rounded-2xl border border-border/60 bg-card p-8 space-y-5 shadow-lg">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-2">Now</p>
              <p className="text-3xl font-extrabold font-nunito">2 free validation reports</p>
              <p className="text-sm text-muted-foreground mt-1">No credit card. No signup required.</p>
            </div>
            <Button
              size="lg"
              onClick={handleCta}
              className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 text-base hover:-translate-y-0.5 transition-all shadow-lg"
            >
              Try It Free <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="h-px bg-border/50" />
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Coming Soon — Unlimited Plan</p>
              <p className="text-sm text-muted-foreground">Unlimited reports, AI advisor, idea backlog, and more. Join the waitlist to get early access and founding member pricing.</p>
              <WaitlistForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-20 text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.04)_0%,transparent_60%)]" />
        <div className="relative space-y-5 max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold font-nunito">
            Stop building what nobody wants.
          </h2>
          <p className="text-muted-foreground">Validate your next idea in 60 seconds.</p>
          <Button
            size="lg"
            onClick={handleCta}
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 text-base px-8 shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Try Orbis Free <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
