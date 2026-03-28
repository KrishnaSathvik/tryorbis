import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingComparison } from "@/components/landing/LandingComparison";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import {
  ArrowRight,
  Search,
  Layers,
  Lightbulb,
  Target,
  ClipboardCheck,
  Sparkles,
  MessageSquareText,
  Mic,
  Upload,
  Brain,
  Bookmark,
  BarChart3,
  Clock,
  Moon,
  Shield,
  Smartphone,
} from "lucide-react";

export default function Features() {
  usePageTitle("Features");
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleCta = () => navigate(user ? "/dashboard" : "/try");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06)_0%,transparent_60%)]" />
        <div className="max-w-3xl mx-auto text-center py-16 sm:py-20 px-6 space-y-4 relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.08] font-nunito">
            Everything inside <span className="text-gradient-primary">Orbis</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From pain point discovery to a full validation report with market intelligence — here's what powers your research.
          </p>
        </div>
      </section>

      {/* ── CORE FEATURES ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16 space-y-10">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Core</p>
          <h2 className="text-2xl sm:text-3xl font-bold font-nunito">Research Engine</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Search, title: "Problem Discovery", desc: "Automatically mine real complaints from forums, reviews, and social media to find genuine frustrations worth solving." },
            { icon: Layers, title: "Pain Point Clustering", desc: "AI groups raw complaints into thematic clusters so you can spot patterns and high-frequency pain points instantly." },
            { icon: Lightbulb, title: "Idea Generation", desc: "Get actionable product ideas ranked by opportunity score, each backed by evidence. Toggle Deep Research for thorough analysis." },
            { icon: Target, title: "10-Dimension Intelligence", desc: "Every run scores WTP, competition density, market timing, ICP, feature gaps, platform risk, GTM strategy, pricing, and defensibility." },
            { icon: ClipboardCheck, title: "Full Validation Report", desc: "Competitor analysis, pros & cons, evidence links, market sizing, and a clear Build / Pivot / Skip verdict." },
            { icon: BarChart3, title: "Validation Scorecard", desc: "7-dimension visual scorecard — market size, competition, differentiation, defensibility, unit economics, execution, and solo founder viability.", highlight: true },
          ].map((f: any) => (
            <Card key={f.title} className={`group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-2xl ${f.highlight ? 'ring-1 ring-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent' : ''}`}>
              <CardContent className="p-6 space-y-3">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${f.highlight ? 'bg-gradient-to-br from-primary/20 to-primary/5' : 'bg-secondary'}`}>
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm font-nunito">{f.title}</h3>
                  {f.highlight && <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">New</span>}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── AI ADVISOR ── */}
      <section className="border-y border-border/50 bg-secondary/30 py-16">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">AI Advisor</p>
            <h2 className="text-2xl sm:text-3xl font-bold font-nunito">Orbis AI — Your <span className="text-gradient-primary">Strategic Copilot</span></h2>
            <p className="text-muted-foreground max-w-lg mx-auto">An always-on advisor that knows your usage, saved ideas, and research history.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: Sparkles, title: "Context-Aware", desc: "Adapts advice based on your account, usage, and research progress." },
              { icon: MessageSquareText, title: "AI Handoff", desc: "Export context to ChatGPT, Claude, Gemini, Cursor, or Codex with one click." },
              { icon: Upload, title: "Image & File Input", desc: "Attach up to 10 images or files per message — screenshots, mockups, PDFs, text." },
              { icon: Mic, title: "Voice Input", desc: "Speak your questions using built-in voice. Works in Chrome, Edge, Safari, and PWA." },
              { icon: Brain, title: "Smart Model Routing", desc: "Auto-selects the right AI model — fast for simple questions, deep for analysis." },
              { icon: Shield, title: "Platform-Aware", desc: "Explains features, guides you to the right tool, suggests next steps." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold font-nunito">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10-DIMENSION TABLE ── */}
      <section className="max-w-5xl mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Intelligence Layers</p>
          <h2 className="text-2xl sm:text-3xl font-bold font-nunito">10-Dimension <span className="text-gradient-primary">Market Intelligence</span></h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Every validation report includes up to 10 research layers.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Layer</th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">What It Tells You</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {[
                ["Willingness-to-Pay", "Direct pricing signals and budget intent from real conversations"],
                ["Competition Density", "Blue Ocean to Winner-Take-Most classification with funding estimates"],
                ["Market Timing", "Emerging / Growing / Saturated / Declining phase detection"],
                ["ICP Precision", "Business type, industry, buying triggers, and tech stack targeting"],
                ["Workaround Detection", "How people currently solve the problem (and how much they invest)"],
                ["Feature Gap Map", "Competitor coverage gaps ranked by opportunity"],
                ["Platform Risk", "Bundling, API limitation, and roadmap overlap signals"],
                ["GTM Strategy", "Channel viability, SEO potential, and founder-led sales assessment"],
                ["Pricing Benchmarks", "Competitor pricing data with suggested range"],
                ["Defensibility & Moat", "Data network, lock-in, community, and technical moat analysis"],
              ].map(([layer, desc]) => (
                <tr key={layer} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{layer}</td>
                  <td className="py-3 px-4 text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── PLATFORM FEATURES ── */}
      <section className="border-y border-border/50 bg-secondary/30 py-16">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Platform</p>
            <h2 className="text-2xl sm:text-3xl font-bold font-nunito">Built for Founders</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Bookmark, title: "Idea Backlog", desc: "Save ideas with status tracking: New → Exploring → Testing → Validated → Archived." },
              { icon: Clock, title: "Research History", desc: "Dual archive for research runs and AI conversations with deletion." },
              { icon: BarChart3, title: "Analytics", desc: "Verdict distribution, average scores, category trends, and build rate." },
              { icon: Moon, title: "Dark / Light", desc: "Full theme support with system preference detection." },
              { icon: Smartphone, title: "PWA", desc: "Install to home screen for a native app experience with voice input." },
              { icon: Shield, title: "Security", desc: "Row-level security, rate limiting, and service role isolation." },
              { icon: Target, title: "Feedback", desc: "In-app feedback submission — bug reports, feature requests, general." },
              { icon: Sparkles, title: "Deep Research", desc: "Toggle between regular and deep research mode for thorough analysis." },
            ].map((f) => (
              <Card key={f.title} className="rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="p-5 space-y-2">
                  <f.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold font-nunito">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPETITIVE COMPARISON ── */}
      <LandingComparison />

      {/* ── CTA ── */}
      <section className="relative py-16 text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.04)_0%,transparent_60%)]" />
        <div className="relative space-y-5 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-nunito">Ready to validate your idea?</h2>
          <Button size="lg" onClick={handleCta} className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 text-base px-8 shadow-lg hover:-translate-y-0.5 transition-all">
            Try Orbis Free <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
