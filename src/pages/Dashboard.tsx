import { useNavigate } from "react-router-dom";
import { Lightbulb, ClipboardCheck, TrendingUp, CheckCircle, Archive, Hand } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getMyGeneratorRuns, getMyValidationReports, getMyBacklog } from "@/lib/db";
import { useEffect, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Dashboard() {
  usePageTitle("Dashboard");
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState({ ideasGenerated: 0, ideasValidated: 0, ideasInBacklog: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyGeneratorRuns(), getMyValidationReports(), getMyBacklog()]).then(
      ([runs, reports, backlog]) => {
        setStats({
          ideasGenerated: runs.reduce((s, r) => s + (Array.isArray(r.idea_suggestions) ? (r.idea_suggestions as any[]).length : 0), 0),
          ideasValidated: reports.length,
          ideasInBacklog: backlog.length,
        });
        setLoading(false);
      }
    ).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-nunito flex items-center gap-2">
          Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}
          <Hand className="h-7 w-7 text-primary" />
        </h1>
        <p className="text-muted-foreground mt-1">From problem discovery to product validation.</p>
      </div>

      {/* CTA Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer group card-warm hover:shadow-xl hover:-translate-y-1 transition-all duration-300" onClick={() => navigate("/generate")}>
          <CardContent className="p-8">
            <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-5 shadow-sm">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold font-nunito mb-2">Find Ideas to Build</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Discover real problems people are facing. Mine complaints, cluster pain points, and generate product ideas backed by evidence.</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer group card-warm hover:shadow-xl hover:-translate-y-1 transition-all duration-300" onClick={() => navigate("/validate")}>
          <CardContent className="p-8">
            <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-5 shadow-sm">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold font-nunito mb-2">Validate My Idea</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Test if your idea is worth building. Get demand scores, competitor analysis, and a clear Build / Pivot / Skip verdict.</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-xl bg-secondary border-0">
              <CardContent className="p-5 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          [{label: "Ideas Generated", value: stats.ideasGenerated, icon: TrendingUp},
           {label: "Ideas Validated", value: stats.ideasValidated, icon: CheckCircle},
           {label: "Saved Ideas", value: stats.ideasInBacklog, icon: Archive}
          ].map((stat) => (
            <Card key={stat.label} className="rounded-xl bg-secondary border-0">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-card flex items-center justify-center shadow-sm">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-nunito">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-semibold">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
