import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

const VERDICT_COLORS: Record<string, string> = {
  Build: "hsl(142, 72%, 40%)",
  Pivot: "hsl(38, 92%, 50%)",
  Skip: "hsl(0, 72%, 51%)",
};

const CHART_COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(142, 72%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 50%)",
  "hsl(180, 60%, 40%)",
];

interface Props {
  stats: { runs: any[]; reports: any[] };
}

export function LandingCharts({ stats }: Props) {
  const personaData = (() => {
    const counts: Record<string, number> = {};
    stats.runs.forEach((r: any) => {
      counts[r.persona] = (counts[r.persona] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  })();

  const categoryData = (() => {
    const counts: Record<string, number> = {};
    stats.runs.forEach((r: any) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  })();

  const verdictData = (() => {
    const counts: Record<string, number> = { Build: 0, Pivot: 0, Skip: 0 };
    stats.reports.forEach((r: any) => {
      counts[r.verdict] = (counts[r.verdict] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  })();

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {personaData.length > 0 && (
          <Card className="border">
            <CardContent className="p-5">
              <h4 className="text-sm font-semibold mb-4">Top Personas</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={personaData} layout="vertical" margin={{ left: 0, right: 16 }}>
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
              <h4 className="text-sm font-semibold mb-4">Verdict Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie
                    data={verdictData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {verdictData.map((entry) => (
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

      {categoryData.length > 0 && (
        <Card className="border">
          <CardContent className="p-5">
            <h4 className="text-sm font-semibold mb-4">Categories Explored</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} margin={{ left: 0, right: 16 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} hide />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
