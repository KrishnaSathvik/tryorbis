import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCommunityStats } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Lightbulb, ClipboardCheck, TrendingUp, Users, Zap, BarChart3, Trophy, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from "recharts";

const VERDICT_COLORS: Record<string, string> = {
  Build: "hsl(142, 72%, 40%)",
  Pivot: "hsl(38, 92%, 50%)",
  Skip: "hsl(0, 72%, 51%)",
};

const CHART_COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(142, 72%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 50%)",
  "hsl(180, 60%, 40%)",
];

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

  // Compute public trend data
  const totalIdeas = stats?.runs.reduce((s, r) => {
    const suggestions = Array.isArray(r.idea_suggestions) ? r.idea_suggestions : [];
    return s + suggestions.length;
  }, 0) ?? 0;

  const personaData = (() => {
    if (!stats) return [];
    const counts: Record<string, number> = {};
    stats.runs.forEach((r: any) => { counts[r.persona] = (counts[r.persona] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  })();

  const categoryData = (() => {
    if (!stats) return [];
    const counts: Record<string, number> = {};
    stats.runs.forEach((r: any) => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  })();

  const verdictData = (() => {
    if (!stats) return [];
    const counts: Record<string, number> = { Build: 0, Pivot: 0, Skip: 0 };
    stats.reports.forEach((r: any) => { counts[r.verdict] = (counts[r.verdict] || 0) + 1; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  })();

  // Top ideas leaderboard from all users
  const leaderboard = (() => {
    if (!stats) return [];
    const ideas = stats.runs.flatMap((r: any) => {
      const suggestions = Array.isArray(r.idea_suggestions) ? r.idea_suggestions : [];
      return suggestions.map((idea: any) => ({
        name: idea.name,
        score: idea.demandScore || 0,
        source: "Generated",
      }));
    });
    const validated = stats.reports.map((r: any) => ({
      name: (r.idea_text || "").slice(0, 60),
      score: r.scores ? Math.round(((r.scores as any).demand + (r.scores as any).pain + (r.scores as any).mvpFeasibility) / 3) : 0,
      source: "Validated",
      verdict: r.verdict,
    }));
    return [...ideas, ...validated].sort((a, b) => b.score - a.score).slice(0, 10);
  })();

  const hasData = (stats?.runs.length ?? 0) > 0 || (stats?.reports.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Curo
          </h1>
          <Button onClick={handleCta} size="sm">
            {user ? "Go to Dashboard" : "Get Started"}
          </Button>
        </div>
      </header>

      <section className="max-w-4xl mx-auto text-center py-20 px-6 space-y-6">
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          From Problem Discovery<br />to Product Validation
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Curo mines real complaints, clusters pain points, and validates your product ideas with AI-powered research. Stop guessing — start building what people actually need.
        </p>
        <div className="flex gap-3 justify-center">
          <Button size="lg" onClick={handleCta} className="gap-2">
            Try Now <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Lightbulb, title: "Find Ideas", desc: "Mine real complaints and frustrations to discover product opportunities backed by evidence." },
            { icon: ClipboardCheck, title: "Validate Ideas", desc: "Get demand scores, competitor analysis, and a clear Build / Pivot / Skip verdict." },
            { icon: TrendingUp, title: "Track Trends", desc: "See what the community is researching — trending personas, hot categories, and top ideas." },
          ].map(f => (
            <Card key={f.title} className="border">
              <CardContent className="p-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Community Stats */}
      {stats && (
        <section className="bg-secondary/30 border-y border-border py-12">
          <div className="max-w-5xl mx-auto px-6">
            <h3 className="text-xl font-bold text-center mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Community Stats
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Researchers", value: stats.totalUsers, icon: Users },
                { label: "Ideas Generated", value: totalIdeas, icon: Zap },
                { label: "Validations Run", value: stats.reports.length, icon: BarChart3 },
                { label: "Research Runs", value: stats.runs.length, icon: Trophy },
              ].map(s => (
                <Card key={s.label} className="border">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <s.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Public Trends */}
      {hasData && (
        <section className="max-w-5xl mx-auto px-6 py-16 space-y-8">
          <h3 className="text-xl font-bold text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            What the Community is Building
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {personaData.length > 0 && (
              <Card className="border">
                <CardContent className="p-5">
                  <h4 className="text-sm font-semibold mb-4">Top Personas</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={personaData} layout="vertical" margin={{ left: 0, right: 16 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(220, 70%, 50%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {verdictData.length > 0 && (
              <Card className="border">
                <CardContent className="p-5">
                  <h4 className="text-sm font-semibold mb-4">Verdict Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <RePieChart>
                      <Pie data={verdictData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {verdictData.map(entry => (
                          <Cell key={entry.name} fill={VERDICT_COLORS[entry.name] || CHART_COLORS[0]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {categoryData.length > 0 && (
            <Card className="border">
              <CardContent className="p-5">
                <h4 className="text-sm font-semibold mb-4">Categories Explored</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData} margin={{ left: 0, right: 16 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} hide />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Ideas Leaderboard */}
          {leaderboard.length > 0 && (
            <Card className="border">
              <CardContent className="p-5">
                <h4 className="text-sm font-semibold mb-4">🏆 Top Ideas Leaderboard</h4>
                <div className="space-y-2">
                  {leaderboard.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <span className="text-lg font-bold text-muted-foreground w-6 text-right shrink-0">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.source}</p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{item.score}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Final CTA */}
      <section className="border-t border-border py-16 text-center px-6">
        <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Ready to forge your next idea?
        </h3>
        <p className="text-muted-foreground mb-6">No email required. Jump in and start discovering.</p>
        <Button size="lg" onClick={handleCta} className="gap-2">
          Try Now <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Curo — From problem discovery to product validation.
      </footer>
    </div>
  );
}
