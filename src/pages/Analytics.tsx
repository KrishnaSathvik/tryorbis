import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getMyValidationReports, getMyGeneratorRuns, getMyBacklog } from "@/lib/db";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, Target, BarChart3, Activity } from "lucide-react";
import { VerdictBadge } from "@/components/VerdictBadge";

const CHART_COLORS = {
  primary: "hsl(220, 70%, 50%)",
  success: "hsl(142, 72%, 40%)",
  warning: "hsl(38, 92%, 50%)",
  destructive: "hsl(0, 72%, 51%)",
  accent: "hsl(262, 60%, 55%)",
};

const SCORE_COLORS = {
  demand: CHART_COLORS.primary,
  pain: CHART_COLORS.destructive,
  competition: CHART_COLORS.warning,
  feasibility: CHART_COLORS.success,
};

const VERDICT_COLORS: Record<string, string> = {
  Build: CHART_COLORS.success,
  Pivot: CHART_COLORS.warning,
  Skip: CHART_COLORS.destructive,
};

const PALETTE = [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.destructive, CHART_COLORS.accent];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-lg">
      {label && <p className="text-xs font-semibold text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="capitalize">{p.name || p.dataKey}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const axisStyle = { fontSize: 11, fill: "hsl(220, 10%, 46%)", fontFamily: "Inter" };
const gridStyle = { stroke: "hsl(30, 10%, 90%)", strokeDasharray: "4 4" };

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

  // Grouped bar data — each idea as a group of 4 scores
  const comparisonData = reports.slice().reverse().map((r: any, i: number) => ({
    name: `#${i + 1}`,
    demand: (r.scores as any)?.demand || 0,
    pain: (r.scores as any)?.pain || 0,
    competition: (r.scores as any)?.competition || 0,
    feasibility: (r.scores as any)?.mvpFeasibility || 0,
  }));

  // Category breakdown
  const categoryCounts = runs.reduce((acc: any, r: any) => {
    acc[r.category] = (acc[r.category] || 0) + 1; return acc;
  }, {});
  const categoryData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name: name.length > 24 ? name.slice(0, 22) + '…' : name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 8);

  // Average scores
  const avgScores = reports.length > 0 ? [
    { name: 'Demand', score: Math.round(reports.reduce((s, r) => s + ((r.scores as any)?.demand || 0), 0) / reports.length), fill: SCORE_COLORS.demand },
    { name: 'Pain', score: Math.round(reports.reduce((s, r) => s + ((r.scores as any)?.pain || 0), 0) / reports.length), fill: SCORE_COLORS.pain },
    { name: 'Competition', score: Math.round(reports.reduce((s, r) => s + ((r.scores as any)?.competition || 0), 0) / reports.length), fill: SCORE_COLORS.competition },
    { name: 'Feasibility', score: Math.round(reports.reduce((s, r) => s + ((r.scores as any)?.mvpFeasibility || 0), 0) / reports.length), fill: SCORE_COLORS.feasibility },
  ] : null;

  // Backlog status
  const statusCounts = backlog.reduce((acc: any, b: any) => {
    acc[b.status] = (acc[b.status] || 0) + 1; return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const hasData = reports.length > 0 || runs.length > 0;

  const totalIdeas = runs.reduce((s: number, r: any) => s + (Array.isArray(r.idea_suggestions) ? (r.idea_suggestions as any[]).length : 0), 0);
  const buildRate = reports.length > 0 ? `${Math.round((verdictCounts['Build'] || 0) / reports.length * 100)}%` : '—';

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
              { label: "Validations", value: reports.length, icon: Target, color: "text-primary" },
              { label: "Ideas Generated", value: totalIdeas, icon: TrendingUp, color: "text-success" },
              { label: "Saved Ideas", value: backlog.length, icon: BarChart3, color: "text-warning" },
              { label: "Build Rate", value: buildRate, icon: Activity, color: "text-primary" },
            ].map(s => (
              <Card key={s.label} className="rounded-xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-nunito tracking-tight">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Verdict Distribution */}
            {verdictData.length > 0 && (
              <Card className="rounded-2xl border border-border/40 bg-card shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold font-nunito mb-1">Verdict Distribution</h3>
                  <p className="text-xs text-muted-foreground mb-4">Breakdown of your validation outcomes</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={verdictData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {verdictData.map((entry: any, i: number) => (
                          <Cell key={i} fill={VERDICT_COLORS[entry.name] || PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    {verdictData.map((entry: any, i: number) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: VERDICT_COLORS[entry.name] || PALETTE[i] }} />
                        <span className="text-xs text-muted-foreground font-medium">{entry.name}</span>
                        <span className="text-xs font-semibold">{entry.value as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Avg Scores */}
            {avgScores && (
              <Card className="rounded-2xl border border-border/40 bg-card shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold font-nunito mb-1">Average Scores</h3>
                  <p className="text-xs text-muted-foreground mb-4">Mean scores across all validations</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={avgScores} barCategoryGap="20%">
                      <CartesianGrid vertical={false} {...gridStyle} />
                      <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} width={30} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(30, 15%, 94%)", radius: 6 }} />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {avgScores.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Scores Comparison - Grouped Bar */}
          {comparisonData.length > 1 && (
            <Card className="rounded-2xl border border-border/40 bg-card shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold font-nunito mb-1">Idea Score Comparison</h3>
                <p className="text-xs text-muted-foreground mb-4">Side-by-side scores for each validated idea</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={comparisonData} barCategoryGap="20%">
                    <CartesianGrid vertical={false} {...gridStyle} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(30, 15%, 94%)", radius: 4 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: "Inter", paddingTop: 8 }} />
                    <Bar dataKey="demand" name="Demand" fill={SCORE_COLORS.demand} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pain" name="Pain" fill={SCORE_COLORS.pain} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="competition" name="Competition" fill={SCORE_COLORS.competition} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="feasibility" name="Feasibility" fill={SCORE_COLORS.feasibility} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            {categoryData.length > 0 && (
              <Card className="rounded-2xl border border-border/40 bg-card shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold font-nunito mb-1">Categories Explored</h3>
                  <p className="text-xs text-muted-foreground mb-4">Market categories from your idea generations</p>
                  <div className="space-y-3">
                    {categoryData.map((cat: any, i: number) => {
                      const max = Math.max(...categoryData.map((c: any) => c.value as number));
                      const pct = ((cat.value as number) / max) * 100;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-foreground truncate max-w-[180px]">{cat.name}</span>
                            <span className="text-xs font-semibold text-muted-foreground">{cat.value as number}</span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PALETTE[i % PALETTE.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pipeline Status */}
            {statusData.length > 0 && (
              <Card className="rounded-2xl border border-border/40 bg-card shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold font-nunito mb-1">Idea Pipeline</h3>
                  <p className="text-xs text-muted-foreground mb-4">Status of your saved ideas</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {statusData.map((_: any, i: number) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    {statusData.map((entry: any, i: number) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="text-xs text-muted-foreground font-medium">{entry.name}</span>
                        <span className="text-xs font-semibold">{entry.value as number}</span>
                      </div>
                    ))}
                  </div>
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
                  <Card key={r.id} className="rounded-xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{r.idea_text?.slice(0, 60)}{r.idea_text?.length > 60 ? '…' : ''}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                          {[
                            { key: 'D', val: (r.scores as any)?.demand, color: SCORE_COLORS.demand },
                            { key: 'P', val: (r.scores as any)?.pain, color: SCORE_COLORS.pain },
                            { key: 'C', val: (r.scores as any)?.competition, color: SCORE_COLORS.competition },
                            { key: 'F', val: (r.scores as any)?.mvpFeasibility, color: SCORE_COLORS.feasibility },
                          ].map(s => (
                            <span key={s.key} className="flex items-center gap-0.5">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                              <span className="font-mono font-medium">{s.val}</span>
                            </span>
                          ))}
                        </div>
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
