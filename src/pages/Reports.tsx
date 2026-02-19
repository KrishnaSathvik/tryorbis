import { useEffect, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getMyGeneratorRuns, getMyValidationReports } from "@/lib/db";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ScoreBar } from "@/components/ScoreBar";
import { WtpSection, CompetitionDensitySection, MarketTimingSection, IcpSection, WorkaroundSection, FeatureGapSection, PlatformRiskSection, GtmStrategySection, PricingBenchmarkSection, DefensibilitySection } from "@/components/IntelligenceSections";
import { ChevronDown, Lightbulb, ClipboardCheck, FileText, Bookmark, MessageSquare, Sparkles, ArrowRight, ThumbsUp, ThumbsDown, Target, AlertTriangle, Globe, Rocket, RefreshCw, XOctagon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addToBacklogDb } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export default function Reports() {
  usePageTitle("History");
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"research" | "chats">("research");

  useEffect(() => {
    Promise.all([
      getMyGeneratorRuns(),
      getMyValidationReports(),
      supabase
        .from("conversations")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false }),
    ]).then(([runs, reports, { data: convos }]) => {
      const items = [
        ...runs.map((r: any) => ({ type: "run", date: r.created_at, data: r })),
        ...reports.map((r: any) => ({ type: "report", date: r.created_at, data: r })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllItems(items);
      setConversations((convos as Conversation[]) || []);
      setLoading(false);
    });
  }, []);

  const handleSaveIdea = async (name: string, source: string, score?: number, overallScore?: number) => {
    try {
      await addToBacklogDb({ ideaName: name, source, demandScore: score, overallScore, status: "New" });
      toast.success(`"${name}" saved to My Ideas`);
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    toast.success("Conversation deleted");
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Skeleton className="h-10 w-56 rounded-xl" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-2xl border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-nunito">History</h1>
        <p className="text-muted-foreground mt-1">All your past sessions — revisit results anytime.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/60 w-fit">
        <button
          onClick={() => setActiveTab("research")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "research"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Research
          </div>
        </button>
        <button
          onClick={() => setActiveTab("chats")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "chats"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Orbis AI Chats
            {conversations.length > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                {conversations.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Research tab */}
      {activeTab === "research" && (
        <>
          {allItems.length === 0 ? (
            <Card className="rounded-2xl border-0 bg-secondary">
              <CardContent className="p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-card flex items-center justify-center mx-auto shadow-sm">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">No sessions yet. Generate ideas or validate an idea to see results here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {allItems.map((item, idx) => (
                <Collapsible key={idx}>
                  <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 shadow-sm">
                            {item.type === "run" ? <Lightbulb className="h-4 w-4 text-primary" /> : <ClipboardCheck className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {item.type === "run"
                                ? `${item.data.persona} × ${item.data.category}`
                                : (item.data.idea_text || "").slice(0, 60) + ((item.data.idea_text || "").length > 60 ? "..." : "")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{new Date(item.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider rounded-full">
                            {item.type === "run" ? "Generator" : "Validation"}
                          </Badge>
                          {item.type === "run" && (
                            <span className="text-xs text-muted-foreground font-medium">
                              {Array.isArray(item.data.idea_suggestions) ? (item.data.idea_suggestions as any[]).length : 0} ideas
                            </span>
                          )}
                          {item.type === "report" && <VerdictBadge verdict={item.data.verdict} />}
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-6">
                        {item.type === "run" && <GeneratorRunDetails data={item.data} onSaveIdea={handleSaveIdea} navigate={navigate} />}
                        {item.type === "report" && <ValidationReportDetails data={item.data} onSaveIdea={handleSaveIdea} />}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </>
      )}

      {/* Chats tab */}
      {activeTab === "chats" && (
        <>
          {conversations.length === 0 ? (
            <Card className="rounded-2xl border-0 bg-secondary">
              <CardContent className="p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-card flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">No chats yet. Start a conversation with Orbis AI.</p>
                <Button onClick={() => navigate("/chat")} variant="outline" size="sm" className="rounded-full gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Start Chatting
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <Card
                  key={c.id}
                  className="rounded-2xl border-border/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/chat?c=${c.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(c.updated_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(c.id);
                        }}
                      >
                        Delete
                      </Button>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium">
                        Continue <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Full Generator Run Details ───
function GeneratorRunDetails({ data, onSaveIdea, navigate }: { data: any; onSaveIdea: (name: string, source: string, score?: number) => void; navigate: (path: string) => void }) {
  const problemClusters = Array.isArray(data.problem_clusters) ? data.problem_clusters : [];
  const ideaSuggestions = Array.isArray(data.idea_suggestions) ? data.idea_suggestions : [];

  return (
    <>
      {/* Problem Themes */}
      {problemClusters.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold font-nunito mb-3">Problem Themes</h3>
          <div className="space-y-2">
            {problemClusters.map((cluster: any, i: number) => (
              <Collapsible key={i}>
                <Card className="rounded-xl border-border/50">
                  <CollapsibleTrigger className="w-full">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-medium text-xs">{cluster.theme}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{cluster.painSummary}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">{cluster.complaintCount} signals</span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-1.5 border-t border-border/50 pt-2">
                      {cluster.complaints?.map((c: string, j: number) => (
                        <p key={j} className="text-[11px] text-muted-foreground italic">"{c}"</p>
                      ))}
                      {cluster.evidenceLinks?.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {cluster.evidenceLinks.map((link: string, j: number) => {
                            let displayUrl = link;
                            let hostname = '';
                            try { const u = new URL(link); hostname = u.hostname; displayUrl = hostname.replace('www.', '') + (u.pathname !== '/' ? u.pathname : ''); if (displayUrl.length > 50) displayUrl = displayUrl.slice(0, 47) + '...'; } catch { return null; }
                            return (
                              <div key={j} className="flex items-center gap-1.5">
                                <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`} alt="" className="h-3 w-3 rounded-sm shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                <a href={link} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline truncate">{displayUrl}</a>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      )}

      {/* Idea Suggestions */}
      {ideaSuggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold font-nunito mb-3">Idea Suggestions</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {ideaSuggestions.map((idea: any, i: number) => (
              <Card key={i} className="rounded-xl bg-secondary/60 border-0">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{idea.name}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); onSaveIdea(idea.name, "Generated", idea.demandScore); }}>
                      <Bookmark className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {idea.description && <p className="text-xs text-muted-foreground leading-relaxed">{idea.description}</p>}
                  <ScoreBar label="Opportunity" value={idea.demandScore} />
                  <div className="text-xs space-y-1 text-muted-foreground">
                    {idea.mvpScope && <p><span className="font-medium text-foreground">MVP:</span> {idea.mvpScope}</p>}
                    {idea.monetization && <p><span className="font-medium text-foreground">Monetization:</span> {idea.monetization}</p>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="rounded-full text-[11px] h-7" onClick={(e) => { e.stopPropagation(); navigate(`/validate?idea=${encodeURIComponent(idea.name + ': ' + idea.description)}`); }}>
                      <ClipboardCheck className="h-3 w-3 mr-1" /> Validate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Intelligence Layers */}
      <IntelligenceLayers data={data} />
    </>
  );
}

// ─── Full Validation Report Details ───
function ValidationReportDetails({ data, onSaveIdea }: { data: any; onSaveIdea: (name: string, source: string, score?: number, overallScore?: number) => void }) {
  const scores = data.scores as any || {};
  const pros = Array.isArray(data.pros) ? data.pros : [];
  const cons = Array.isArray(data.cons) ? data.cons : [];
  const gapOpportunities = Array.isArray(data.gap_opportunities) ? data.gap_opportunities : [];
  const competitors = Array.isArray(data.competitors) ? data.competitors : [];
  const evidenceLinks = Array.isArray(data.evidence_links) ? data.evidence_links : [];

  return (
    <>
      {/* Verdict + Scores */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className={cn(
          "sm:col-span-1 rounded-xl border-0 overflow-hidden",
          data.verdict === 'Build' && "bg-gradient-to-br from-emerald-500/15 via-emerald-400/5 to-transparent",
          data.verdict === 'Pivot' && "bg-gradient-to-br from-amber-500/15 via-amber-400/5 to-transparent",
          data.verdict === 'Skip' && "bg-gradient-to-br from-rose-500/15 via-rose-400/5 to-transparent",
        )}>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center",
              data.verdict === 'Build' && "bg-emerald-500/15 text-emerald-600",
              data.verdict === 'Pivot' && "bg-amber-500/15 text-amber-600",
              data.verdict === 'Skip' && "bg-rose-500/15 text-rose-600",
            )}>
              {data.verdict === 'Build' && <Rocket className="h-5 w-5" />}
              {data.verdict === 'Pivot' && <RefreshCw className="h-5 w-5" />}
              {data.verdict === 'Skip' && <XOctagon className="h-5 w-5" />}
            </div>
            <p className={cn(
              "text-lg font-bold",
              data.verdict === 'Build' && "text-emerald-700 dark:text-emerald-400",
              data.verdict === 'Pivot' && "text-amber-700 dark:text-amber-400",
              data.verdict === 'Skip' && "text-rose-700 dark:text-rose-400",
            )}>{data.verdict}</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 rounded-xl border-border/50">
          <CardContent className="p-4 space-y-2">
            <ScoreBar label="Demand" value={scores.demand || 0} />
            <ScoreBar label="Pain" value={scores.pain || 0} />
            <ScoreBar label="Competition" value={scores.competition || 0} />
            <ScoreBar label="MVP Feasibility" value={scores.mvpFeasibility || 0} />
          </CardContent>
        </Card>
      </div>

      {/* Pros / Cons */}
      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {pros.length > 0 && (
            <Card className="rounded-xl border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2"><ThumbsUp className="h-3.5 w-3.5 text-green-600" /><h4 className="font-semibold text-xs">Pros</h4></div>
                <ul className="space-y-1">{pros.map((p: string, i: number) => <li key={i} className="text-xs text-muted-foreground">• {p}</li>)}</ul>
              </CardContent>
            </Card>
          )}
          {cons.length > 0 && (
            <Card className="rounded-xl border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2"><ThumbsDown className="h-3.5 w-3.5 text-red-600" /><h4 className="font-semibold text-xs">Cons</h4></div>
                <ul className="space-y-1">{cons.map((c: string, i: number) => <li key={i} className="text-xs text-muted-foreground">• {c}</li>)}</ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Gap Opportunities + Kill Test */}
      <div className="grid sm:grid-cols-2 gap-3">
        {gapOpportunities.length > 0 && (
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2"><Target className="h-3.5 w-3.5 text-primary" /><h4 className="font-semibold text-xs">Gap Opportunities</h4></div>
              <ul className="space-y-1">{gapOpportunities.map((g: string, i: number) => <li key={i} className="text-xs text-muted-foreground">• {g}</li>)}</ul>
            </CardContent>
          </Card>
        )}
        {data.kill_test && (
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-yellow-600" /><h4 className="font-semibold text-xs">Kill Test</h4></div>
              <p className="text-xs text-muted-foreground">{data.kill_test}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* MVP Wedge */}
      {data.mvp_wedge && (
        <Card className="rounded-xl bg-secondary/60 border-0">
          <CardContent className="p-4 space-y-1">
            <h4 className="font-semibold text-xs">Suggested MVP Wedge</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{data.mvp_wedge}</p>
          </CardContent>
        </Card>
      )}

      {/* Market Sizing */}
      {data.market_sizing && (
        <div>
          <h3 className="text-sm font-semibold font-nunito mb-2 flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Market Sizing</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'TAM', value: data.market_sizing.tam },
              { label: 'SAM', value: data.market_sizing.sam },
              { label: 'SOM', value: data.market_sizing.som },
            ].map(m => (
              <Card key={m.label} className="rounded-xl border-border/50">
                <CardContent className="p-3 space-y-1">
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{m.label}</span>
                  <p className="text-xs text-foreground">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Competitors */}
      {competitors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold font-nunito mb-2">Competitors</h3>
          <div className="grid sm:grid-cols-3 gap-2">
            {competitors.map((c: any, i: number) => (
              <Card key={i} className="rounded-xl bg-secondary border-0">
                <CardContent className="p-3 space-y-1">
                  <p className="font-medium text-xs">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground"><span className="font-medium text-foreground">Weakness:</span> {c.weakness}</p>
                  {c.pricing && <p className="text-[11px] text-muted-foreground"><span className="font-medium text-foreground">Pricing:</span> {c.pricing}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Evidence Links */}
      {evidenceLinks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold font-nunito mb-2">Sources</h3>
          <div className="space-y-1">
            {evidenceLinks.map((link: string, i: number) => {
              let displayUrl = link;
              let hostname = '';
              try { const u = new URL(link); hostname = u.hostname; displayUrl = hostname.replace('www.', '') + (u.pathname !== '/' ? u.pathname : ''); if (displayUrl.length > 60) displayUrl = displayUrl.slice(0, 57) + '...'; } catch { return null; }
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`} alt="" className="h-3 w-3 rounded-sm shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <a href={link} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline truncate">{displayUrl}</a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Intelligence Layers */}
      <IntelligenceLayers data={data} />

      {/* Save button */}
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={(e) => {
          e.stopPropagation();
          const overall = Math.round(((scores.demand || 0) + (scores.pain || 0) + (scores.mvpFeasibility || 0) - (scores.competition || 0)) / 3);
          handleSaveValidation(data.idea_text, overall);
        }}
      >
        <Bookmark className="h-3 w-3 mr-1" /> Save to My Ideas
      </Button>
    </>
  );

  function handleSaveValidation(ideaText: string, overallScore: number) {
    onSaveIdea(ideaText?.slice(0, 80) || "Validated Idea", "Validated", undefined, overallScore);
  }
}

// ─── Shared Intelligence Layers Component ───
function IntelligenceLayers({ data }: { data: any }) {
  const hasAny = data.wtp_signals || data.competition_density || data.market_timing || data.icp || data.workaround_detection || data.feature_gap_map || data.platform_risk || data.gtm_strategy || data.pricing_benchmarks || data.defensibility;
  if (!hasAny) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold font-nunito mb-3">Market Intelligence</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {data.wtp_signals && <WtpSection data={data.wtp_signals} />}
        {data.competition_density && <CompetitionDensitySection data={data.competition_density} />}
        {data.market_timing && <MarketTimingSection data={data.market_timing} />}
        {data.icp && <IcpSection data={data.icp} />}
        {data.workaround_detection && <WorkaroundSection data={data.workaround_detection} />}
        {data.feature_gap_map && <FeatureGapSection data={data.feature_gap_map} />}
        {data.platform_risk && <PlatformRiskSection data={data.platform_risk} />}
        {data.gtm_strategy && <GtmStrategySection data={data.gtm_strategy} />}
        {data.pricing_benchmarks && <PricingBenchmarkSection data={data.pricing_benchmarks} />}
        {data.defensibility && <DefensibilitySection data={data.defensibility} />}
      </div>
    </div>
  );
}
