import { useEffect, useState, useCallback } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LandingCharts } from "@/components/landing/LandingCharts";
import { LandingLeaderboard } from "@/components/landing/LandingLeaderboard";
import { LandingTrends } from "@/components/landing/LandingTrends";
import { LandingTicker } from "@/components/landing/LandingTicker";
import orbisLogo from "@/assets/orbis-logo.png";
import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";

export default function Community() {
  usePageTitle("Community");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleCta = () => navigate(user ? "/dashboard" : "/try");

  const refreshStats = useCallback(async () => {
    try {
      const res = await supabase.functions.invoke("community-stats");
      if (res.data) setStats(res.data);
    } catch (e) {
      console.error("Failed to fetch community stats:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
    const channel = supabase
      .channel("community-stats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "generator_runs" }, () => refreshStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "validation_reports" }, () => refreshStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "backlog_items" }, () => refreshStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refreshStats]);

  const hasData = (stats?.totalRuns ?? 0) > 0 || (stats?.totalValidations ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <img src={orbisLogo} alt="Orbis" className="h-6 w-6 sm:h-7 sm:w-7 dark-invert" />
            <span className="text-lg sm:text-xl font-bold tracking-tight font-nunito text-gradient-primary">Orbis</span>
          </a>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full" onClick={() => navigate("/")}>Home</Button>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full" onClick={() => navigate("/features")}>Features</Button>
            <ThemeToggle />
            <Button onClick={handleCta} size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              {user ? "Dashboard" : "Try Free"}
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06)_0%,transparent_60%)]" />
        <div className="max-w-3xl mx-auto text-center py-16 sm:py-20 px-6 space-y-4 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium">
            <TrendingUp className="h-3.5 w-3.5" /> Live Data
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.08] font-nunito">
            Community <span className="text-gradient-primary">Trends</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See what ideas are being researched, which categories are trending, and the top-scoring validated ideas — all in real time.
          </p>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20 space-y-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="text-sm">Loading community data...</span>
            </div>
          </div>
        ) : !hasData ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-muted-foreground">Community data is building up. Be one of the first to contribute!</p>
            <Button onClick={handleCta} className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2">
              Run Your First Validation <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            {/* Trending ticker */}
            {stats?.trendingNow && (
              <div>
                <h2 className="text-lg font-semibold font-nunito mb-4">Trending Now</h2>
                <LandingTicker trendingNow={stats.trendingNow} />
              </div>
            )}

            {/* Charts — verdict distribution, category breakdown, etc. */}
            <div>
              <h2 className="text-lg font-semibold font-nunito mb-4">Research Insights</h2>
              <LandingCharts stats={stats} />
            </div>

            {/* Trend lines */}
            {stats?.trendData && (
              <div>
                <h2 className="text-lg font-semibold font-nunito mb-4">Category Trends</h2>
                <LandingTrends trendData={stats.trendData} />
              </div>
            )}

            {/* Leaderboard — top ideas by score */}
            <div>
              <h2 className="text-lg font-semibold font-nunito mb-4">Top Validated Ideas</h2>
              <LandingLeaderboard stats={stats} />
            </div>
          </>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="relative py-16 text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.04)_0%,transparent_60%)]" />
        <div className="relative space-y-5 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-nunito">Add your idea to the mix.</h2>
          <Button size="lg" onClick={handleCta} className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 text-base px-8 shadow-lg hover:-translate-y-0.5 transition-all">
            Try Orbis Free <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2">
            <img src={orbisLogo} alt="Orbis" className="h-5 w-5 dark-invert" />
            <span className="font-bold font-nunito text-gradient-primary text-sm">Orbis</span>
          </a>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Home</button>
            <button onClick={() => navigate("/features")} className="hover:text-foreground transition-colors">Features</button>
            <button onClick={() => navigate("/examples")} className="hover:text-foreground transition-colors">Examples</button>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Orbis</p>
        </div>
      </footer>
    </div>
  );
}
