import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getMyGeneratorRuns, getMyValidationReports } from "@/lib/db";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ScoreBar } from "@/components/ScoreBar";
import { ChevronDown, Lightbulb, ClipboardCheck, FileText, Bookmark, MessageSquare, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addToBacklogDb } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export default function Reports() {
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

  const handleSaveIdea = async (name: string, source: string, score?: number) => {
    try {
      await addToBacklogDb({ ideaName: name, source, demandScore: score, status: "New" });
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

  if (loading) return <div className="text-center text-muted-foreground py-20">Loading...</div>;

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
                      <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
                        {item.type === "run" && (
                          <>
                            <p className="text-xs font-medium text-muted-foreground">
                              {Array.isArray(item.data.problem_clusters) ? (item.data.problem_clusters as any[]).length : 0} problem themes discovered
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {(Array.isArray(item.data.idea_suggestions) ? (item.data.idea_suggestions as any[]) : []).map((idea: any, i: number) => (
                                <Card key={i} className="rounded-xl bg-secondary/60 border-0">
                                  <CardContent className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm font-semibold">{idea.name}</p>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSaveIdea(idea.name, "Generated", idea.demandScore);
                                        }}
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
                        {item.type === "report" && (
                          <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-3">
                              <ScoreBar label="Demand" value={(item.data.scores as any)?.demand || 0} />
                              <ScoreBar label="Pain" value={(item.data.scores as any)?.pain || 0} />
                              <ScoreBar label="Competition" value={(item.data.scores as any)?.competition || 0} />
                              <ScoreBar label="MVP Feasibility" value={(item.data.scores as any)?.mvpFeasibility || 0} />
                            </div>
                            {item.data.mvp_wedge && (
                              <Card className="rounded-xl bg-secondary/60 border-0">
                                <CardContent className="p-4">
                                  <p className="text-xs font-semibold text-foreground mb-1">MVP Wedge</p>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{item.data.mvp_wedge}</p>
                                </CardContent>
                              </Card>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveIdea(item.data.idea_text?.slice(0, 80), "Validated");
                              }}
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
