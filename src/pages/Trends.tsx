import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getGeneratorRuns, getValidationReports } from "@/lib/storage";
import { ScoreBar } from "@/components/ScoreBar";
import { VerdictBadge } from "@/components/VerdictBadge";
import { TrendingUp, BarChart3, Trophy, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from "recharts";

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

export default function Trends() {
  const runs = useMemo(() => getGeneratorRuns(), []);
  const reports = useMemo(() => getValidationReports(), []);

  // Persona frequency
  const personaData = useMemo(() => {
    const counts: Record<string, number> = {};
    runs.forEach(r => { counts[r.persona] = (counts[r.persona] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [runs]);

  // Category frequency
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    runs.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [runs]);

  // Verdict distribution
  const verdictData = useMemo(() => {
    const counts = { Build: 0, Pivot: 0, Skip: 0 };
    reports.forEach(r => { counts[r.verdict] = (counts[r.verdict] || 0) + 1; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [reports]);

  const verdictColors: Record<string, string> = {
    Build: "hsl(142, 72%, 40%)",
    Pivot: "hsl(38, 92%, 50%)",
    Skip: "hsl(0, 72%, 51%)",
  };

  // Average validation scores
  const avgScores = useMemo(() => {
    if (reports.length === 0) return null;
    const totals = { demand: 0, pain: 0, competition: 0, mvpFeasibility: 0 };
    reports.forEach(r => {
      totals.demand += r.scores.demand;
      totals.pain += r.scores.pain;
      totals.competition += r.scores.competition;
      totals.mvpFeasibility += r.scores.mvpFeasibility;
    });
    const n = reports.length;
    return {
      demand: Math.round(totals.demand / n),
      pain: Math.round(totals.pain / n),
      competition: Math.round(totals.competition / n),
      mvpFeasibility: Math.round(totals.mvpFeasibility / n),
    };
  }, [reports]);

  // Top ideas leaderboard
  const leaderboard = useMemo(() => {
    const generated = runs.flatMap(r =>
      r.ideaSuggestions.map(idea => ({
        name: idea.name,
        score: idea.demandScore,
        source: "Generated" as const,
        date: r.createdAt,
      }))
    );
    const validated = reports.map(r => ({
      name: r.ideaText.length > 60 ? r.ideaText.slice(0, 57) + "..." : r.ideaText,
      score: Math.round((r.scores.demand + r.scores.pain + r.scores.mvpFeasibility) / 3),
      source: "Validated" as const,
      verdict: r.verdict,
      date: r.createdAt,
    }));
    return [...generated, ...validated].sort((a, b) => b.score - a.score).slice(0, 10);
  }, [runs, reports]);

  const hasData = runs.length > 0 || reports.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trends</h1>
        <p className="text-muted-foreground mt-1">Analytics across all your research runs.</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Research Runs", value: runs.length, icon: BarChart3 },
              { label: "Validations", value: reports.length, icon: TrendingUp },
              { label: "Ideas Found", value: runs.reduce((s, r) => s + r.ideaSuggestions.length, 0), icon: Trophy },
              { label: "Build Rate", value: reports.length > 0 ? Math.round((reports.filter(r => r.verdict === "Build").length / reports.length) * 100) + "%" : "—", icon: PieChart },
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

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Persona chart */}
            {personaData.length > 0 && (
              <Card className="border">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-4">Top Personas</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={personaData.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(220, 70%, 50%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Verdict pie chart */}
            {verdictData.length > 0 && (
              <Card className="border">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-4">Verdict Distribution</h3>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <RePieChart>
                        <Pie data={verdictData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {verdictData.map((entry) => (
                            <Cell key={entry.name} fill={verdictColors[entry.name] || CHART_COLORS[0]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
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
                  <BarChart data={categoryData.slice(0, 8)} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
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
                <h3 className="text-sm font-semibold mb-2">Average Validation Scores</h3>
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
                <h3 className="text-sm font-semibold mb-4">Top Ideas Leaderboard</h3>
                <div className="space-y-2">
                  {leaderboard.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <span className="text-lg font-bold text-muted-foreground w-6 text-right shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.source} · {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {"verdict" in item && item.verdict && (
                          <VerdictBadge verdict={item.verdict as any} />
                        )}
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
