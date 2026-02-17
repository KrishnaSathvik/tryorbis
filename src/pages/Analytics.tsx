import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getMyValidationReports, getMyGeneratorRuns, getMyBacklog } from "@/lib/db";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, Target, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { VerdictBadge } from "@/components/VerdictBadge";

const COLORS = ['hsl(220, 70%, 50%)', 'hsl(142, 72%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(262, 60%, 55%)'];

export default function Analytics() {
  const [reports, setReports] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [backlog, setBacklog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyValidationReports(), getMyGeneratorRuns(), getMyBacklog()]).then(([r, g, b]) => {
      setReports(r); setRuns(g); setBacklog(b); setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center text-muted-foreground py-20">Loading...</div>;

  // Verdict distribution
  const verdictCounts = reports.reduce((acc: any, r: any) => {
    acc[r.verdict] = (acc[r.verdict] || 0) + 1; return acc;
  }, {});
  const verdictData = Object.entries(verdictCounts).map(([name, value]) => ({ name, value }));
  const verdictColors: Record<string, string> = { Build: 'hsl(142, 72%, 40%)', Pivot: 'hsl(38, 92%, 50%)', Skip: 'hsl(0, 72%, 51%)' };

  // Scores over time
  const scoresOverTime = reports
    .slice()
    .reverse()
    .map((r: any, i: number) => ({
      label: `#${i + 1}`,
      demand: (r.scores as any)?.demand || 0,
      pain: (r.scores as any)?.pain || 0,
      competition: (r.scores as any)?.competition || 0,
      feasibility: (r.scores as any)?.mvpFeasibility || 0,
    }));

  // Category breakdown from generator runs
  const categoryCounts = runs.reduce((acc: any, r: any) => {
    acc[r.category] = (acc[r.category] || 0) + 1; return acc;
  }, {});
  const categoryData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 18) + '...' : name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 8);

  // Average scores
  const avgScores = reports.length > 0 ? {
    demand: Math.round(reports.reduce((s, r) => s + ((r.scores as any)?.demand || 0), 0) / reports.length),
    pain: Math.round(reports.reduce((s, r) => s + ((r.scores as any)?.pain || 0), 0) / reports.length),
    competition: Math.round(reports.reduce((s, r) => s + ((r.scores as any)?.competition || 0), 0) / reports.length),
    feasibility: Math.round(reports.reduce((s, r) => s + ((r.scores as any)?.mvpFeasibility || 0), 0) / reports.length),
  } : null;

  // Backlog status distribution
  const statusCounts = backlog.reduce((acc: any, b: any) => {
    acc[b.status] = (acc[b.status] || 0) + 1; return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const hasData = reports.length > 0 || runs.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-nunito">Analytics</h1>
        <p className="text-muted-foreground mt-1">Your validation trends, scores, and category insights.</p>
      </div>

      {!hasData ? (
        <Card className="rounded-2xl border-0 bg-secondary">
          <CardContent className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-card flex items-center justify-center mx-auto shadow-sm">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No data yet. Generate ideas or validate an idea to see your analytics.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Validations", value: reports.length, icon: Target },
              { label: "Ideas Generated", value: runs.reduce((s: number, r: any) => s + (Array.isArray(r.idea_suggestions) ? (r.idea_suggestions as any[]).length : 0), 0), icon: TrendingUp },
              { label: "Saved Ideas", value: backlog.length, icon: BarChart3 },
              { label: "Build Rate", value: reports.length > 0 ? `${Math.round((verdictCounts['Build'] || 0) / reports.length * 100)}%` : '—', icon: PieChartIcon },
            ].map(s => (
              <Card key={s.label} className="rounded-xl bg-secondary border-0">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-card flex items-center justify-center shadow-sm">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xl font-bold font-nunito">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Verdict Distribution */}
            {verdictData.length > 0 && (
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold font-nunito mb-4">Verdict Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={verdictData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                        {verdictData.map((entry: any, i: number) => (
                          <Cell key={i} fill={verdictColors[entry.name] || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Avg Scores */}
            {avgScores && (
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold font-nunito mb-4">Average Scores</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[
                      { name: 'Demand', score: avgScores.demand },
                      { name: 'Pain', score: avgScores.pain },
                      { name: 'Competition', score: avgScores.competition },
                      { name: 'Feasibility', score: avgScores.feasibility },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Scores over time */}
          {scoresOverTime.length > 1 && (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold font-nunito mb-4">Scores Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={scoresOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="demand" stroke="hsl(220, 70%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="pain" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="competition" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="feasibility" stroke="hsl(142, 72%, 40%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            {categoryData.length > 0 && (
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold font-nunito mb-4">Categories Explored</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Pipeline Status */}
            {statusData.length > 0 && (
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold font-nunito mb-4">Idea Pipeline</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                        {statusData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent validations */}
          {reports.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold font-nunito mb-3">Recent Validations</h3>
              <div className="space-y-2">
                {reports.slice(0, 5).map((r: any) => (
                  <Card key={r.id} className="rounded-xl border-border/50">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{r.idea_text?.slice(0, 60)}{r.idea_text?.length > 60 ? '...' : ''}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground font-medium">
                          D:{(r.scores as any)?.demand} P:{(r.scores as any)?.pain} C:{(r.scores as any)?.competition} F:{(r.scores as any)?.mvpFeasibility}
                        </span>
                        <VerdictBadge verdict={r.verdict} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
