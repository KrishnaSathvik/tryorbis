import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, CartesianGrid,
  Treemap,
} from "recharts";
import { Users, PieChart, FolderOpen } from "lucide-react";

const VERDICT_COLORS: Record<string, string> = {
  Build: "hsl(142, 72%, 40%)",
  Pivot: "hsl(38, 92%, 50%)",
  Skip: "hsl(0, 72%, 51%)",
};

const CHART_COLORS = [
  "hsl(220, 70%, 50%)", "hsl(262, 60%, 55%)", "hsl(142, 72%, 40%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(180, 60%, 40%)",
];

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

function TreemapCell(props: any) {
  const { x, y, width, height, name, fill, categoryData } = props;
  if (!width || !height || width < 2 || height < 2) return null;
  const showLabel = width > 30 && height > 24;
  const fontSize = Math.max(10, Math.min(14, width / 7));
  const words = String(name).split(/\s+/);
  const lines: string[] = [];
  if (width < 80) {
    words.forEach(w => lines.push(w));
  } else {
    let cur = words[0];
    for (let i = 1; i < words.length; i++) {
      if ((cur + " " + words[i]).length * fontSize * 0.55 < width - 12) {
        cur += " " + words[i];
      } else {
        lines.push(cur);
        cur = words[i];
      }
    }
    lines.push(cur);
  }
  const lineHeight = fontSize + 4;
  const totalTextHeight = lines.length * lineHeight + 16;
  const startY = y + height / 2 - totalTextHeight / 2 + lineHeight / 2;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={fill} fillOpacity={0.85} stroke="hsl(0 0% 100%)" strokeWidth={2} />
      {showLabel && (
        <>
          {lines.map((line, i) => (
            <text key={i} x={x + width / 2} y={startY + i * lineHeight} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={fontSize} fontWeight={600}>
              {line}
            </text>
          ))}
          <text x={x + width / 2} y={startY + lines.length * lineHeight} textAnchor="middle" dominantBaseline="central" fill="hsl(0 0% 100% / 0.8)" fontSize={11}>
            {categoryData?.find((c: any) => c.name === name)?.count ?? ""}
          </text>
        </>
      )}
    </g>
  );
}

interface Props {
  stats: {
    personaData: { name: string; count: number }[];
    categoryData: { name: string; count: number }[];
    verdictData: { name: string; value: number }[];
  };
}

export function LandingCharts({ stats }: Props) {
  const { personaData, categoryData, verdictData } = stats;
  const verdictTotal = verdictData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {personaData.length > 0 && (
          <Card className="border border-border/50 bg-background/60 backdrop-blur-sm">
            <CardContent className="p-5">
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Top Personas Explored
              </h4>
              <ResponsiveContainer width="100%" height={Math.max(260, personaData.length * 48)}>
                <BarChart data={personaData} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 12, fill: "hsl(220 10% 46%)" }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(220 70% 50% / 0.06)" }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                    {personaData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {verdictData.length > 0 && (
          <Card className="border border-border/50 bg-background/60 backdrop-blur-sm">
            <CardContent className="p-5">
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                Verdict Distribution
              </h4>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={160}>
                  <RePieChart>
                    <Pie data={verdictData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3}>
                      {verdictData.map((entry) => (
                        <Cell key={entry.name} fill={VERDICT_COLORS[entry.name] || CHART_COLORS[0]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2.5">
                  {verdictData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: VERDICT_COLORS[entry.name] || CHART_COLORS[0] }} />
                      <span className="text-sm text-muted-foreground">
                        {entry.name}{" "}
                        <span className="font-semibold text-foreground">
                          {verdictTotal > 0 ? Math.round((entry.value / verdictTotal) * 100) : 0}%
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {categoryData.length > 0 && (
        <Card className="border border-border/50 bg-background/60 backdrop-blur-sm">
          <CardContent className="p-5">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Categories Explored
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <Treemap
                data={categoryData.map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }))}
                dataKey="count"
                nameKey="name"
                stroke="hsl(0 0% 100%)"
                content={<TreemapCell categoryData={categoryData} />}
              >
                <Tooltip {...tooltipStyle} />
              </Treemap>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
