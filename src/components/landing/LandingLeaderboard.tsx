import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface Props {
  stats: { runs: any[]; reports: any[] };
}

export function LandingLeaderboard({ stats }: Props) {
  const leaderboard = (() => {
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
      score: r.scores
        ? Math.round(
            ((r.scores as any).demand +
              (r.scores as any).pain +
              (r.scores as any).mvpFeasibility) /
              3
          )
        : 0,
      source: "Validated",
      verdict: r.verdict,
    }));
    return [...ideas, ...validated].sort((a, b) => b.score - a.score).slice(0, 10);
  })();

  if (leaderboard.length === 0) return null;

  return (
    <Card className="border">
      <CardContent className="p-5">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Top Ideas Leaderboard
        </h4>
        <div className="space-y-2">
          {leaderboard.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
              <span className="text-lg font-bold text-muted-foreground w-6 text-right shrink-0">
                {i + 1}
              </span>
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
  );
}
