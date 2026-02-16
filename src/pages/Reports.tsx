import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getGeneratorRuns, getValidationReports } from "@/lib/storage";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ScoreBar } from "@/components/ScoreBar";
import { ChevronDown, Lightbulb, ClipboardCheck } from "lucide-react";

export default function Reports() {
  const runs = useMemo(() => getGeneratorRuns(), []);
  const reports = useMemo(() => getValidationReports(), []);

  const allItems = useMemo(() => {
    const items: Array<{ type: 'run' | 'report'; date: string; data: any }> = [
      ...runs.map(r => ({ type: 'run' as const, date: r.createdAt, data: r })),
      ...reports.map(r => ({ type: 'report' as const, date: r.createdAt, data: r })),
    ];
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [runs, reports]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
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
                            : item.data.ideaText.slice(0, 60) + '...'}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.type === 'run' && <span className="text-xs text-muted-foreground">{item.data.ideaSuggestions.length} ideas</span>}
                      {item.type === 'report' && <VerdictBadge verdict={item.data.verdict} />}
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t pt-3 space-y-3">
                    {item.type === 'run' && (
                      <>
                        <p className="text-xs font-medium text-muted-foreground">{item.data.problemClusters.length} problem themes, {item.data.ideaSuggestions.length} ideas</p>
                        {item.data.ideaSuggestions.map((idea: any) => (
                          <div key={idea.id} className="text-sm">
                            <span className="font-medium">{idea.name}</span>
                            <span className="text-muted-foreground"> — Score: {idea.demandScore}/100</span>
                          </div>
                        ))}
                      </>
                    )}
                    {item.type === 'report' && (
                      <div className="space-y-3">
                        <ScoreBar label="Demand" value={item.data.scores.demand} />
                        <ScoreBar label="Pain" value={item.data.scores.pain} />
                        <ScoreBar label="Competition" value={item.data.scores.competition} />
                        <ScoreBar label="MVP Feasibility" value={item.data.scores.mvpFeasibility} />
                        {item.data.mvpWedge && (
                          <div>
                            <p className="text-xs font-medium">MVP Wedge:</p>
                            <p className="text-xs text-muted-foreground">{item.data.mvpWedge}</p>
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
