import { Card, CardContent } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface TrendPoint {
  week: string;
  label: string;
  generated: number;
  validated: number;
}

interface Props {
  trendData: TrendPoint[];
}

const tooltipStyle = {
  contentStyle: {
    background: "hsl(0 0% 100% / 0.95)",
    border: "1px solid hsl(220 13% 91%)",
    borderRadius: "8px",
    fontSize: "12px",
    boxShadow: "0 4px 12px hsl(0 0% 0% / 0.08)",
  },
  itemStyle: { color: "hsl(220 20% 10%)" },
};

export function LandingTrends({ trendData }: Props) {
  if (!trendData || trendData.length < 2) return null;

  return (
    <Card className="border border-border/50 bg-background/60 backdrop-blur-sm">
      <CardContent className="p-5">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Idea Trends (Weekly)
        </h4>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={trendData} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
            <defs>
              <linearGradient id="gradGenerated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradValidated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 72%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 72%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(220 10% 46%)" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} hide />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="generated" name="Generated" stroke="hsl(220, 70%, 50%)" fill="url(#gradGenerated)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="validated" name="Validated" stroke="hsl(142, 72%, 40%)" fill="url(#gradValidated)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-5 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(220, 70%, 50%)" }} />
            <span className="text-xs text-muted-foreground font-medium">Generated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(142, 72%, 40%)" }} />
            <span className="text-xs text-muted-foreground font-medium">Validated</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
