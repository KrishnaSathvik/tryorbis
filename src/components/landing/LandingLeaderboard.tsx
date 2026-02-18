import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface Props {
  stats: {
    leaderboard: { name: string; score: number; source: string; verdict?: string; description?: string }[];
  };
}

export function LandingLeaderboard({ stats }: Props) {
  const { leaderboard } = stats;
  if (!leaderboard || leaderboard.length === 0) return null;

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
                {item.description && (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                )}
              </div>
              <span className="text-sm font-semibold tabular-nums">{item.score}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
