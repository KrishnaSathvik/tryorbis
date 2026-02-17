import { useNavigate } from "react-router-dom";
import { Lightbulb, ClipboardCheck, TrendingUp, CheckCircle, Archive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getMyGeneratorRuns, getMyValidationReports, getMyBacklog } from "@/lib/db";
import { useEffect, useState } from "react";
import { VerdictBadge } from "@/components/VerdictBadge";

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState({ ideasGenerated: 0, ideasValidated: 0, ideasInBacklog: 0 });
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getMyGeneratorRuns(), getMyValidationReports(), getMyBacklog()]).then(
      ([runs, reports, backlog]) => {
        setStats({
          ideasGenerated: runs.reduce((s, r) => s + (Array.isArray(r.idea_suggestions) ? (r.idea_suggestions as any[]).length : 0), 0),
          ideasValidated: reports.length,
          ideasInBacklog: backlog.length,
        });
        setRecentRuns(runs.slice(0, 3));
        setRecentReports(reports.slice(0, 3));
      }
    );
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome{profile?.display_name ? `, ${profile.display_name}` : ""} 👋
        </h1>
        <p className="text-muted-foreground mt-1">From problem discovery to product validation.</p>
      </div>

      {/* CTA Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer group hover:shadow-lg hover:border-primary/30 transition-all duration-200 border-2 border-transparent" onClick={() => navigate("/generate")}>
          <CardContent className="p-8">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Find Ideas to Build</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Discover real problems people are facing. Mine complaints, cluster pain points, and generate product ideas backed by evidence.</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer group hover:shadow-lg hover:border-primary/30 transition-all duration-200 border-2 border-transparent" onClick={() => navigate("/validate")}>
          <CardContent className="p-8">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Validate My Idea</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Test if your idea is worth building. Get demand scores, competitor analysis, and a clear Build / Pivot / Skip verdict.</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ideas Generated", value: stats.ideasGenerated, icon: TrendingUp },
          { label: "Ideas Validated", value: stats.ideasValidated, icon: CheckCircle },
          { label: "Saved Ideas", value: stats.ideasInBacklog, icon: Archive },
        ].map((stat) => (
          <Card key={stat.label} className="border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(recentRuns.length > 0 || recentReports.length > 0) && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {recentRuns.map((run: any) => (
              <Card key={run.id} className="border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Generated ideas for {run.persona} × {run.category}</p>
                      <p className="text-xs text-muted-foreground">{new Date(run.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{Array.isArray(run.idea_suggestions) ? (run.idea_suggestions as any[]).length : 0} ideas</span>
                </CardContent>
              </Card>
            ))}
            {recentReports.map((report: any) => (
              <Card key={report.id} className="border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Validated: {(report.idea_text || "").slice(0, 60)}...</p>
                      <p className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    report.verdict === 'Build' ? 'bg-green-100 text-green-700' :
                    report.verdict === 'Pivot' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{report.verdict}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
