import { useNavigate } from "react-router-dom";
import { Lightbulb, ClipboardCheck, TrendingUp, CheckCircle, Archive, Hand, ArrowUpRight, ArrowDownRight, Rocket, Search, FileText, BookmarkPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getMyGeneratorRuns, getMyValidationReports, getMyBacklog } from "@/lib/db";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState({ ideasGenerated: 0, ideasValidated: 0, ideasInBacklog: 0 });

  useEffect(() => {
    Promise.all([getMyGeneratorRuns(), getMyValidationReports(), getMyBacklog()]).then(
      ([runs, reports, backlog]) => {
        setStats({
          ideasGenerated: runs.reduce((s, r) => s + (Array.isArray(r.idea_suggestions) ? (r.idea_suggestions as any[]).length : 0), 0),
          ideasValidated: reports.length,
          ideasInBacklog: backlog.length,
        });
      }
    );
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-nunito">
          Hello, {profile?.display_name || "there"}
        </h1>
        <p className="text-muted-foreground mt-1 text-base">What are you working on?</p>
      </div>

      {/* Stat Cards — 2x2 grid like template */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4">Overview</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Ideas Generated", value: stats.ideasGenerated, icon: TrendingUp, trend: "+16.4%", up: true },
            { label: "Ideas Validated", value: stats.ideasValidated, icon: CheckCircle, trend: "+8.2%", up: true },
            { label: "Saved Ideas", value: stats.ideasInBacklog, icon: Archive, trend: "+12.8%", up: true },
            { label: "Research Sessions", value: stats.ideasGenerated + stats.ideasValidated, icon: Rocket, trend: "Active", up: true },
          ].map((stat) => (
            <Card key={stat.label} className="rounded-2xl bg-secondary/60 border-0 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-card flex items-center justify-center shadow-sm">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{stat.label}</span>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-extrabold font-nunito tracking-tight">{stat.value}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.up ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'}`}>
                    {stat.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Action Cards — 2-col grid, centered icon + label like template */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: Lightbulb, label: "Generate Ideas", desc: "Find real problems to solve", url: "/generate" },
            { icon: ClipboardCheck, label: "Validate Idea", desc: "Test if it's worth building", url: "/validate" },
            { icon: BookmarkPlus, label: "My Ideas", desc: "Manage your pipeline", url: "/ideas" },
            { icon: FileText, label: "History", desc: "Past research sessions", url: "/history" },
            { icon: Search, label: "Explore", desc: "Discover opportunities", url: "/generate" },
            { icon: Rocket, label: "Start Building", desc: "Launch your next product", url: "/validate" },
          ].map((action) => (
            <Card
              key={action.label}
              className="cursor-pointer group rounded-2xl border border-border/40 bg-card/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              onClick={() => navigate(action.url)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold font-nunito">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
