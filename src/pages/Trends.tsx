import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getCommunityStats } from "@/lib/db";
import { ScoreBar } from "@/components/ScoreBar";
import { VerdictBadge } from "@/components/VerdictBadge";
import { TrendingUp, BarChart3, Trophy, PieChart, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line } from "recharts";

const CHART_COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(142, 72%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 50%)",
  "hsl(180, 60%, 40%)",
  "hsl(320, 60%, 50%)",
  "hsl(60, 70%, 45%)",
];

const VERDICT_COLORS: Record<string, string> = {
  Build: "hsl(142, 72%, 40%)",
  Pivot: "hsl(38, 92%, 50%)",
  Skip: "hsl(0, 72%, 51%)",
};

export default function Trends() {
  const [runs, setRuns] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommunityStats().then(({ runs, reports, totalUsers }) => {
      setRuns(runs);
      setReports(reports);
      setTotalUsers(totalUsers);
      setLoading(false);
    });
  }, []);

  // Persona frequency
  const personaData = (() => {
    const counts: Record<string, number> = {};
    runs.forEach((r: any) => { counts[r.persona] = (counts[r.persona] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  })();

  // Category frequency
  const categoryData = (() => {
    const counts: Record<string, number> = {};
    runs.forEach((r: any) => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  })();

  // Verdict distribution
  const verdictData = (() => {
    const counts: Record<string, number> = { Build: 0, Pivot: 0, Skip: 0 };
    reports.forEach((r: any) => { counts[r.verdict] = (counts[r.verdict] || 0) + 1; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  })();

  // Activity timeline (by week)
  const activityData = (() => {
    const weeks: Record<string, { runs: number; validations: number }> = {};
    const getWeek = (d: string) => {
      const date = new Date(d);
      const start = new Date(date);
      start.setDate(start.getDate() - start.getDay());
      return start.toISOString().slice(0, 10);
    };
    runs.forEach((r: any) => {
      const w = getWeek(r.created_at);
      if (!weeks[w]) weeks[w] = { runs: 0, validations: 0 };
      weeks[w].runs++;
    });
    reports.forEach((r: any) => {
      const w = getWeek(r.created_at);
      if (!weeks[w]) weeks[w] = { runs: 0, validations: 0 };
      weeks[w].validations++;
    });
    return Object.entries(weeks)
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12);
  })();

  // Average validation scores
  const avgScores = (() => {
    if (reports.length === 0) return null;
    const totals = { demand: 0, pain: 0, competition: 0, mvpFeasibility: 0 };
    reports.forEach((r: any) => {
      const s = r.scores as any;
      totals.demand += s?.demand || 0;
      totals.pain += s?.pain || 0;
      totals.competition += s?.competition || 0;
      totals.mvpFeasibility += s?.mvpFeasibility || 0;
    });
    const n = reports.length;
    return {
      demand: Math.round(totals.demand / n),
      pain: Math.round(totals.pain / n),
      competition: Math.round(totals.competition / n),
      mvpFeasibility: Math.round(totals.mvpFeasibility / n),
    };
  })();

  // Top ideas leaderboard
  const leaderboard = (() => {
    const generated = runs.flatMap((r: any) => {
      const suggestions = Array.isArray(r.idea_suggestions) ? r.idea_suggestions : [];
      return suggestions.map((idea: any) => ({
        name: idea.name,
        score: idea.demandScore || 0,
        source: "Generated",
      }));
    });
    const validated = reports.map((r: any) => ({
      name: (r.idea_text || "").slice(0, 60),
      score: r.scores ? Math.round(((r.scores as any).demand + (r.scores as any).pain + (r.scores as any).mvpFeasibility) / 3) : 0,
      source: "Validated",
      verdict: r.verdict,
    }));
    return [...generated, ...validated].sort((a, b) => b.score - a.score).slice(0, 10);
  })();

  const totalIdeas = runs.reduce((s: number, r: any) => s + (Array.isArray(r.idea_suggestions) ? (r.idea_suggestions as any[]).length : 0), 0);
  const hasData = runs.length > 0 || reports.length > 0;

  if (loading) return <div className="text-center text-muted-foreground py-20">Loading trends...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Trends</h1>
        <p className="text-muted-foreground mt-1">Analytics across all users' research runs.</p>
      </div>

      {!hasData ? (
        <Card className="border">
          <CardContent className="p-10 text-center text-muted-foreground">
            No data yet. Generate ideas or validate an idea to see trends here.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "Researchers", value: totalUsers, icon: Users },
              { label: "Research Runs", value: runs.length, icon: BarChart3 },
              { label: "Validations", value: reports.length, icon: TrendingUp },
              { label: "Ideas Found", value: totalIdeas, icon: Trophy },
              { label: "Build Rate", value: reports.length > 0 ? Math.round((reports.filter((r: any) => r.verdict === "Build").length / reports.length) * 100) + "%" : "—", icon: PieChart },
            ].map(stat => (
              <Card key={stat.label} className="border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold truncate">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Activity Timeline */}
          {activityData.length > 1 && (
            <Card className="border">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-4">Activity Timeline (Weekly)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={activityData}>
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="runs" stroke="hsl(220, 70%, 50%)" strokeWidth={2} name="Research Runs" />
                    <Line type="monotone" dataKey="validations" stroke="hsl(142, 72%, 40%)" strokeWidth={2} name="Validations" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-6">
            {personaData.length > 0 && (
              <Card className="border">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-4">Top Personas</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={personaData.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 16 }}>
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
                  <h3 className="text-sm font-semibold mb-4">Verdict Distribution</h3>
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

          {/* Category chart */}
          {categoryData.length > 0 && (
            <Card className="border">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-4">Categories Explored</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData.slice(0, 8)} margin={{ left: 0, right: 16 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} hide />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {categoryData.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Average scores */}
          {avgScores && (
            <Card className="border">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-semibold mb-2">Average Validation Scores (All Users)</h3>
                <ScoreBar label="Demand" value={avgScores.demand} />
                <ScoreBar label="Pain" value={avgScores.pain} />
                <ScoreBar label="Competition" value={avgScores.competition} />
                <ScoreBar label="MVP Feasibility" value={avgScores.mvpFeasibility} />
              </CardContent>
            </Card>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <Card className="border">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-4">🏆 Top Ideas Leaderboard</h3>
                <div className="space-y-2">
                  {leaderboard.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <span className="text-lg font-bold text-muted-foreground w-6 text-right shrink-0">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.source}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {"verdict" in item && item.verdict && <VerdictBadge verdict={item.verdict as any} />}
                        <span className="text-sm font-semibold tabular-nums">{item.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
