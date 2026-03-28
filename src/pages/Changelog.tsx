import { usePageTitle } from "@/hooks/usePageTitle";
import { Zap } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

const changelog = [
  { date: "Mar 2026", title: "Multi-Stage Deep Research", desc: "Deep Research now runs 3 fast sequential stages instead of one slow call — results appear progressively in ~45s instead of timing out at 2-5 minutes." },
  { date: "Mar 2026", title: "Progressive Result Rendering", desc: "Deep mode shows results as each stage completes — no more waiting for the entire analysis to finish before seeing anything." },
  { date: "Mar 2026", title: "Free Reports + Waitlist", desc: "Replaced credit system with 2 free research reports and a $19/month unlimited plan waitlist." },
  { date: "Mar 2026", title: "Features & Community Pages", desc: "New /features page with interactive breakdown and /community page with live research trends and top ideas leaderboard." },
  { date: "Mar 2026", title: "Mobile Responsiveness", desc: "Improved mobile layouts across Landing, Examples, and report pages — responsive font sizes, padding, and wrapping." },
  { date: "Mar 2026", title: "Go Pro Upgrade Flow", desc: "New upgrade modal and Go Pro button accessible to all users (guest and registered) from the sidebar." },
  { date: "Feb 2026", title: "Deep Research Fix", desc: "Fixed stale closure bug that caused Deep Research mode to silently fall back to regular mode. Now correctly uses sonar-deep-research model (30-90s+ analysis)." },
  { date: "Feb 2026", title: "Voice Input", desc: "Added browser-native voice-to-text input across all chat interfaces — Orbis Chat, Generate Ideas, and Validate Idea. No API key needed." },
  { date: "Feb 2026", title: "Multi-File Upload (up to 10)", desc: "Increased attachment limit from 3 to 10 files per message. Supports images, PDFs, and text files." },
  { date: "Feb 2026", title: "Drag & Drop Uploads", desc: "Drag files directly into any chat input area with a visual drop zone overlay." },
  { date: "Feb 2026", title: "Image Support in Orbis AI", desc: "Orbis Chat now accepts and analyzes images alongside text — screenshots, mockups, competitor UIs, and data visualizations." },
  { date: "Feb 2026", title: "Smart Model Routing", desc: "Orbis AI automatically picks the optimal model based on query complexity — fast responses for simple questions, deep analysis for complex strategy queries." },
  { date: "Feb 2026", title: "RLS Policy Overhaul", desc: "Fixed all database security policies across every table — conversations, backlog, reports, profiles, and more now use permissive policies for reliable access." },
  { date: "Feb 2026", title: "Full Idea Details in Backlog", desc: "Saving ideas to My Ideas now preserves description, MVP scope, and monetization — not just the name and score." },
  { date: "Feb 2026", title: "AI Handoff to External Tools", desc: "Export your full research context to ChatGPT, Claude, Gemini, Cursor, or Codex with one click from any report." },
  { date: "Feb 2026", title: "Profile Sheet", desc: "New profile drawer accessible from sidebar — view report usage, account info, feedback, sign out, and delete account all in one place." },
  { date: "Feb 2026", title: "Delete Account", desc: "Full account deletion flow with typed confirmation. Permanently removes all data including ideas, reports, conversations, and profile." },
  { date: "Feb 2026", title: "Orbis AI Intelligence Upgrade", desc: "Smart routing between flash and pro models, Perplexity-powered research grounding, and context-aware responses with usage and history awareness." },
  { date: "Feb 2026", title: "Guest Upgrade Flow", desc: "Guest users can now upgrade to a full account from the profile sheet without errors or white screens." },
  { date: "Feb 2026", title: "Onboarding Tour Fix", desc: "Tour steps no longer trigger page loading — smooth overlay transitions between steps." },
  { date: "Feb 2026", title: "Mobile Sidebar Fix", desc: "Sidebar navigation on mobile now opens pages instantly without delay." },
  { date: "Feb 2026", title: "Dark Mode Logo Fix", desc: "Logo visibility improved in dark mode with adjusted brightness filters." },
  { date: "Feb 2026", title: "Sourced vs Estimated labels", desc: "Every metric now shows whether it's backed by research or AI-estimated." },
  { date: "Feb 2026", title: "Observability logging", desc: "All AI functions now track latency, error rates, and provider performance." },
  { date: "Feb 2026", title: "Phase 3 Intelligence Layers", desc: "Added GTM Strategy, Pricing Benchmarks, and Defensibility & Moat analysis." },
  { date: "Jan 2026", title: "Orbis AI Chat", desc: "Dedicated AI advisor for brainstorming, strategy, and go-to-market planning." },
  { date: "Jan 2026", title: "Market Intelligence v1", desc: "WTP signals, Competition Density, Market Timing, and ICP Precision." },
];

export default function Changelog() {
  usePageTitle("Changelog");

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
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
              <div key={i} className="flex gap-3 sm:gap-4 group">
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
      </div>

      <PublicFooter />
    </div>
  );
}
