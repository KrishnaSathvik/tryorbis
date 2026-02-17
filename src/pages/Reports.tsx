import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getMyGeneratorRuns, getMyValidationReports } from "@/lib/db";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ScoreBar } from "@/components/ScoreBar";
import { ChevronDown, Lightbulb, ClipboardCheck, FileText, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addToBacklogDb } from "@/lib/db";
import { toast } from "sonner";

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

  const handleSaveIdea = async (name: string, source: string, score?: number) => {
    try {
      await addToBacklogDb({ ideaName: name, source, demandScore: score, status: 'New' });
      toast.success(`"${name}" saved to My Ideas`);
    } catch { toast.error("Failed to save"); }
  };

  if (loading) return <div className="text-center text-muted-foreground py-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground mt-1">All your past research sessions — revisit results anytime.</p>
      </div>

      {allItems.length === 0 ? (
        <Card className="border">
          <CardContent className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No sessions yet. Generate ideas or validate an idea to see results here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {allItems.map((item, idx) => (
            <Collapsible key={idx}>
              <Card className="border hover:border-primary/20 transition-colors">
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {item.type === 'run'
                          ? <Lightbulb className="h-4 w-4 text-primary" />
                          : <ClipboardCheck className="h-4 w-4 text-primary" />
                        }
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {item.type === 'run'
                            ? `${item.data.persona} × ${item.data.category}`
                            : (item.data.idea_text || "").slice(0, 60) + ((item.data.idea_text || "").length > 60 ? '...' : '')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                        {item.type === 'run' ? 'Generator' : 'Validation'}
                      </Badge>
                      {item.type === 'run' && (
                        <span className="text-xs text-muted-foreground font-medium">
                          {Array.isArray(item.data.idea_suggestions) ? (item.data.idea_suggestions as any[]).length : 0} ideas
                        </span>
                      )}
                      {item.type === 'report' && <VerdictBadge verdict={item.data.verdict} />}
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-5 pb-5 border-t pt-4 space-y-4">
                    {item.type === 'run' && (
                      <>
                        <p className="text-xs font-medium text-muted-foreground">
                          {Array.isArray(item.data.problem_clusters) ? (item.data.problem_clusters as any[]).length : 0} problem themes discovered
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {(Array.isArray(item.data.idea_suggestions) ? item.data.idea_suggestions as any[] : []).map((idea: any, i: number) => (
                            <Card key={i} className="border bg-muted/30">
                              <CardContent className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold">{idea.name}</p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0"
                                    onClick={(e) => { e.stopPropagation(); handleSaveIdea(idea.name, 'Generated', idea.demandScore); }}
                                  >
                                    <Bookmark className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                {idea.description && <p className="text-xs text-muted-foreground leading-relaxed">{idea.description}</p>}
                                <ScoreBar label="Opportunity" value={idea.demandScore} />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                    {item.type === 'report' && (
                      <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <ScoreBar label="Demand" value={(item.data.scores as any)?.demand || 0} />
                          <ScoreBar label="Pain" value={(item.data.scores as any)?.pain || 0} />
                          <ScoreBar label="Competition" value={(item.data.scores as any)?.competition || 0} />
                          <ScoreBar label="MVP Feasibility" value={(item.data.scores as any)?.mvpFeasibility || 0} />
                        </div>
                        {item.data.mvp_wedge && (
                          <Card className="border bg-muted/30">
                            <CardContent className="p-4">
                              <p className="text-xs font-semibold text-foreground mb-1">MVP Wedge</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{item.data.mvp_wedge}</p>
                            </CardContent>
                          </Card>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleSaveIdea(item.data.idea_text?.slice(0, 80), 'Validated'); }}
                        >
                          <Bookmark className="h-3 w-3 mr-1" /> Save to My Ideas
                        </Button>
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
