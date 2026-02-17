import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResearchTrace } from "@/components/ResearchTrace";
import { ScoreBar } from "@/components/ScoreBar";
import { VerdictBadge } from "@/components/VerdictBadge";
import { AIHandoff } from "@/components/AIHandoff";
import { supabase } from "@/integrations/supabase/client";
import { saveValidationReportDb, addToBacklogDb } from "@/lib/db";
import { toast } from "sonner";
import { Bookmark, Lightbulb, ThumbsUp, ThumbsDown, Target, AlertTriangle, Send } from "lucide-react";

const researchSteps = [
  "Analyzing demand signals...",
  "Scanning for competitors...",
  "Extracting pain indicators...",
  "Evaluating MVP feasibility...",
  "Generating verdict...",
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface Report {
  ideaText: string;
  scores: { demand: number; pain: number; competition: number; mvpFeasibility: number };
  verdict: 'Build' | 'Pivot' | 'Skip';
  pros: string[];
  cons: string[];
  gapOpportunities: string[];
  mvpWedge: string;
  killTest: string;
  competitors: { name: string; weakness: string; pricing?: string }[];
  evidenceLinks: string[];
}

export default function ValidateIdea() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prefilled = searchParams.get('idea') || "";
  const [inputValue, setInputValue] = useState(prefilled);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', text: "Describe your idea and I'll validate it — checking demand, competition, and feasibility." },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState<'chat' | 'researching' | 'results'>('chat');
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-send prefilled idea
  useEffect(() => {
    if (prefilled && messages.length === 1) {
      setTimeout(() => handleUserInput(prefilled), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendToAI = useCallback(async (allMessages: ChatMessage[]) => {
    setIsTyping(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-validate', {
        body: {
          messages: allMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.text,
          })),
        },
      });
      if (error) throw error;

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: data.reply || "I'll validate this for you!",
      };
      setIsTyping(false);
      setMessages(prev => [...prev, aiMsg]);

      if (data.ready && data.params?.ideaText) {
        setTimeout(() => triggerValidation(data.params.ideaText), 1200);
      }
    } catch (err: any) {
      setIsTyping(false);
      toast.error("AI error: " + (err.message || "Unknown error"));
    }
  }, []);

  const handleUserInput = (overrideText?: string) => {
    const text = (overrideText || inputValue).trim();
    if (!text || isTyping) return;
    if (!overrideText) setInputValue("");
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    sendToAI(updated);
  };

  const triggerValidation = useCallback(async (ideaText: string) => {
    setPhase('researching');
    setCurrentStep(0);
    try {
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= researchSteps.length - 1) { clearInterval(stepInterval); return prev; }
          return prev + 1;
        });
      }, 2000);

      const { data, error } = await supabase.functions.invoke('perplexity-validate', { body: { ideaText } });
      clearInterval(stepInterval);
      setCurrentStep(researchSteps.length);
      if (error) throw error;

      const r: Report = {
        ideaText,
        scores: data.scores || { demand: 0, pain: 0, competition: 0, mvpFeasibility: 0 },
        verdict: data.verdict || 'Skip',
        pros: data.pros || [],
        cons: data.cons || [],
        gapOpportunities: data.gapOpportunities || [],
        mvpWedge: data.mvpWedge || '',
        killTest: data.killTest || '',
        competitors: data.competitors || [],
        evidenceLinks: data.evidenceLinks || [],
      };

      try { await saveValidationReportDb(r); } catch (e) { console.error("Failed to save to DB:", e); }

      setReport(r);
      setPhase('results');
    } catch (err: any) {
      toast.error("Validation failed: " + (err.message || "Unknown error"));
      setPhase('chat');
    }
  }, []);

  const handleAddToBacklog = async () => {
    if (!report) return;
    try {
      await addToBacklogDb({
        ideaName: report.ideaText.slice(0, 80),
        source: 'Validated',
        overallScore: Math.round((report.scores.demand + report.scores.pain + report.scores.mvpFeasibility - report.scores.competition) / 3),
        status: report.verdict === 'Build' ? 'Validated' : 'Exploring',
      });
      toast.success("Saved to My Ideas");
    } catch { toast.error("Failed to save"); }
  };

  const resetChat = () => {
    setMessages([{ id: '1', role: 'assistant', text: "Describe your idea and I'll validate it — checking demand, competition, and feasibility." }]);
    setInputValue(""); setPhase('chat'); setReport(null); setIsTyping(false);
  };

  if (phase === 'chat') {
    return (
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Validate an Idea</h1>
          <p className="text-muted-foreground mt-1">Tell me your idea — I'll research if it's worth building.</p>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="border-t pt-3 pb-2">
          <div className="flex gap-2">
            <Input ref={inputRef} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUserInput()} placeholder="e.g. AI tool that tracks subscriptions and suggests ways to save money..." className="flex-1" autoFocus disabled={isTyping} />
            <Button size="icon" onClick={() => handleUserInput()} disabled={!inputValue.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'researching') {
    return (
      <div className="max-w-lg mx-auto mt-20">
        <Card><CardContent className="p-8">
          <h2 className="text-xl font-semibold mb-2">Validating...</h2>
          <p className="text-sm text-muted-foreground mb-4">Researching demand, competition, and feasibility.</p>
          <ResearchTrace steps={researchSteps} currentStep={currentStep} isComplete={false} />
        </CardContent></Card>
      </div>
    );
  }

  // Results phase - same as before
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validation Report</h1>
          <p className="text-muted-foreground mt-1 max-w-lg truncate">{report?.ideaText}</p>
        </div>
        <Button variant="outline" onClick={resetChat}>New Validation</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1 border">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Verdict</p>
            <VerdictBadge verdict={report!.verdict} size="lg" />
          </CardContent>
        </Card>
        <Card className="md:col-span-2 border">
          <CardContent className="p-5 space-y-3">
            <ScoreBar label="Demand" value={report!.scores.demand} />
            <ScoreBar label="Pain" value={report!.scores.pain} />
            <ScoreBar label="Competition" value={report!.scores.competition} />
            <ScoreBar label="MVP Feasibility" value={report!.scores.mvpFeasibility} />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Strategy</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border"><CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-green-600 shrink-0" /><h3 className="font-semibold text-sm">Pros</h3></div>
            <ul className="space-y-1.5">{report!.pros.map((p, i) => <li key={i} className="text-sm text-muted-foreground">• {p}</li>)}</ul>
          </CardContent></Card>
          <Card className="border"><CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2"><ThumbsDown className="h-4 w-4 text-red-600 shrink-0" /><h3 className="font-semibold text-sm">Cons</h3></div>
            <ul className="space-y-1.5">{report!.cons.map((c, i) => <li key={i} className="text-sm text-muted-foreground">• {c}</li>)}</ul>
          </CardContent></Card>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border"><CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2"><Target className="h-4 w-4 text-primary shrink-0" /><h3 className="font-semibold text-sm">Gap Opportunities</h3></div>
          <ul className="space-y-1.5">{report!.gapOpportunities.map((g, i) => <li key={i} className="text-sm text-muted-foreground">• {g}</li>)}</ul>
        </CardContent></Card>
        <Card className="border"><CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" /><h3 className="font-semibold text-sm">Kill Test</h3></div>
          <p className="text-sm text-muted-foreground">{report!.killTest}</p>
        </CardContent></Card>
      </div>

      {report!.mvpWedge && (
        <Card className="border"><CardContent className="p-5 space-y-2">
          <h3 className="font-semibold text-sm">Suggested MVP Wedge</h3>
          <p className="text-sm text-muted-foreground">{report!.mvpWedge}</p>
        </CardContent></Card>
      )}

      {report!.competitors.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Competitors</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {report!.competitors.map((c, i) => (
              <Card key={i} className="border"><CardContent className="p-5 space-y-1">
                <p className="font-medium text-sm">{c.name}</p>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p><span className="font-medium text-foreground">Weakness:</span> {c.weakness}</p>
                  {c.pricing && <p><span className="font-medium text-foreground">Pricing:</span> {c.pricing}</p>}
                </div>
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}

      {report!.evidenceLinks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Sources</h2>
          <div className="flex flex-wrap gap-2">
            {report!.evidenceLinks.map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Source {i + 1}</a>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button size="sm" variant="outline" onClick={handleAddToBacklog}><Bookmark className="h-3 w-3 mr-1" /> Save to My Ideas</Button>
        {report!.verdict !== 'Build' && (
          <Button size="sm" variant="outline" onClick={() => navigate('/generate')}><Lightbulb className="h-3 w-3 mr-1" /> Explore Adjacent Ideas</Button>
        )}
      </div>

      {report && (
        <AIHandoff context={`Validation Report for: "${report.ideaText}"\n\nVerdict: ${report.verdict}\nDemand: ${report.scores.demand}/100, Pain: ${report.scores.pain}/100, Competition: ${report.scores.competition}/100, Feasibility: ${report.scores.mvpFeasibility}/100\n\nPros: ${report.pros.join(', ')}\nCons: ${report.cons.join(', ')}\nMVP Wedge: ${report.mvpWedge}\n\nHelp me build this product.`} />
      )}
    </div>
  );
}
