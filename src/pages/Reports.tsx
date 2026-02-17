import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getMyGeneratorRuns, getMyValidationReports } from "@/lib/db";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ScoreBar } from "@/components/ScoreBar";
import { ChevronDown, Lightbulb, ClipboardCheck } from "lucide-react";

export default function Reports() {
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyGeneratorRuns(), getMyValidationReports()]).then(([runs, reports]) => {
      const items = [
        ...runs.map((r: any) => ({ type: 'run', date: r.created_at, data: r })),
        ...reports.map((r: any) => ({ type: 'report', date: r.created_at, data: r })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllItems(items);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center text-muted-foreground py-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground mt-1">History of all your research runs.</p>
      </div>

      {allItems.length === 0 ? (
        <Card className="border"><CardContent className="p-10 text-center text-muted-foreground">No reports yet. Generate ideas or validate an idea to see results here.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {allItems.map((item, idx) => (
            <Collapsible key={idx}>
              <Card className="border">
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.type === 'run' ? <Lightbulb className="h-4 w-4 text-primary" /> : <ClipboardCheck className="h-4 w-4 text-primary" />}
                      <div className="text-left">
                        <p className="text-sm font-medium">
                          {item.type === 'run'
                            ? `${item.data.persona} × ${item.data.category}`
                            : (item.data.idea_text || "").slice(0, 60) + '...'}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.type === 'run' && <span className="text-xs text-muted-foreground">{Array.isArray(item.data.idea_suggestions) ? (item.data.idea_suggestions as any[]).length : 0} ideas</span>}
                      {item.type === 'report' && <VerdictBadge verdict={item.data.verdict} />}
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t pt-3 space-y-3">
                    {item.type === 'run' && (
                      <>
                        <p className="text-xs font-medium text-muted-foreground">
                          {Array.isArray(item.data.problem_clusters) ? (item.data.problem_clusters as any[]).length : 0} problem themes, {Array.isArray(item.data.idea_suggestions) ? (item.data.idea_suggestions as any[]).length : 0} ideas
                        </p>
                        {(Array.isArray(item.data.idea_suggestions) ? item.data.idea_suggestions as any[] : []).map((idea: any, i: number) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium">{idea.name}</span>
                            <span className="text-muted-foreground"> — Score: {idea.demandScore}/100</span>
                          </div>
                        ))}
                      </>
                    )}
                    {item.type === 'report' && (
                      <div className="space-y-3">
                        <ScoreBar label="Demand" value={(item.data.scores as any)?.demand || 0} />
                        <ScoreBar label="Pain" value={(item.data.scores as any)?.pain || 0} />
                        <ScoreBar label="Competition" value={(item.data.scores as any)?.competition || 0} />
                        <ScoreBar label="MVP Feasibility" value={(item.data.scores as any)?.mvpFeasibility || 0} />
                        {item.data.mvp_wedge && (
                          <div>
                            <p className="text-xs font-medium">MVP Wedge:</p>
                            <p className="text-xs text-muted-foreground">{item.data.mvp_wedge}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
