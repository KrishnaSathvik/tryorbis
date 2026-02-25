import { useState, useCallback, useRef, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResearchTrace } from "@/components/ResearchTrace";
import { ScoreBar } from "@/components/ScoreBar";
import { VerdictBadge } from "@/components/VerdictBadge";
import { AIHandoff } from "@/components/AIHandoff";
import { FollowUpChat } from "@/components/FollowUpChat";
import { WtpSection, CompetitionDensitySection, MarketTimingSection, IcpSection, WorkaroundSection, FeatureGapSection, PlatformRiskSection, GtmStrategySection, PricingBenchmarkSection, DefensibilitySection } from "@/components/IntelligenceSections";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { saveValidationReportDb, addToBacklogDb } from "@/lib/db";
import { toast } from "sonner";
import { Bookmark, Lightbulb, ThumbsUp, ThumbsDown, Target, AlertTriangle, Send, Search, Globe, Rocket, RefreshCw, XOctagon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileUpload } from "@/components/FileUpload";
import { AttachmentPreview } from "@/components/AttachmentPreview";
import { Attachment, imageToBase64, validateFile, getAttachmentType, readTextFile, extractPdfText } from "@/lib/attachments";
import { useDropZone } from "@/hooks/useDropZone";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { VoiceButton } from "@/components/VoiceButton";

const sectionTooltips: Record<string, string> = {
  verdict: "Overall recommendation based on market research, demand signals, and competitive analysis.",
  pros: "Key advantages and positive signals found during research.",
  cons: "Risks, challenges, and negative signals to watch out for.",
  gapOpportunities: "Underserved needs or missing features that competitors haven't addressed yet.",
  killTest: "The single biggest risk that could make this idea fail — test this assumption first.",
  mvpWedge: "The smallest, most focused version you could launch to gain early traction.",
  competitors: "Existing players in this space, their weaknesses, and pricing.",
  sources: "References and data sources used to support the analysis.",
  marketIntelligence: "Deep-dive research layers covering pricing, timing, ICP, risk, and more.",
  marketSizing: "Estimated market size broken into TAM, SAM, and SOM.",
};

function SectionTooltip({ id }: { id: string }) {
  const tip = sectionTooltips[id];
  if (!tip) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-[240px] p-2">
        <p className="text-xs">{tip}</p>
      </PopoverContent>
    </Popover>
  );
}
import { ResearchModeToggle } from "@/components/ResearchModeToggle";

import type { WtpSignals, CompetitionDensity, MarketTiming, ICP, WorkaroundDetection, FeatureGapMap, PlatformRisk, GtmStrategy, PricingBenchmarks, DefensibilityAnalysis } from "@/lib/types";

const researchSteps = ["Deep-diving demand signals & market data...", "Scanning competitors, pricing & reviews...", "Analyzing pain severity & workarounds...", "AI strategist scoring & verdict...", "Cross-checking verdict consistency...", "Finalizing validation report..."];

interface ChatMessage { id: string; role: 'user' | 'assistant'; text: string; }
interface Report {
  ideaText: string;
  scores: { demand: number; pain: number; competition: number; mvpFeasibility: number };
  verdict: 'Build' | 'Pivot' | 'Skip';
  pros: string[]; cons: string[]; gapOpportunities: string[];
  mvpWedge: string; killTest: string;
  competitors: { name: string; weakness: string; pricing?: string }[];
  evidenceLinks: string[];
  marketSizing?: { tam: string; sam: string; som: string; methodology?: string };
  wtpSignals?: WtpSignals;
  competitionDensity?: CompetitionDensity;
  marketTiming?: MarketTiming;
  icp?: ICP;
  workaroundDetection?: WorkaroundDetection;
  featureGapMap?: FeatureGapMap;
  platformRisk?: PlatformRisk;
  gtmStrategy?: GtmStrategy;
  pricingBenchmarks?: PricingBenchmarks;
  defensibility?: DefensibilityAnalysis;
}

export default function ValidateIdea() {
  usePageTitle("Validate Idea");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { hasCredits, deductCredit } = useCredits();

  const prefilled = searchParams.get('idea') || "";
  const [inputValue, setInputValue] = useState(prefilled);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', text: "Describe your idea and I'll validate it — checking demand, competition, and feasibility. You can also attach competitor screenshots or market data." },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState<'chat' | 'researching' | 'results'>('chat');
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [validatingParams, setValidatingParams] = useState<{ ideaText: string } | null>(null);
  const [researchMode, setResearchMode] = useState<'regular' | 'deep'>('regular');

  const processDroppedFiles = async (files: File[]) => {
    const remaining = 3 - attachments.length;
    if (remaining <= 0) return;
    const results: Attachment[] = [];
    for (const file of files.slice(0, remaining)) {
      const error = validateFile(file);
      if (error) continue;
      const type = getAttachmentType(file);
      if (!type) continue;
      const att: Attachment = { id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), type };
      try {
        if (type === "image") att.base64 = await imageToBase64(file);
        else if (type === "text") att.base64 = await readTextFile(file);
        else if (type === "pdf") att.base64 = await extractPdfText(file);
      } catch { continue; }
      results.push(att);
    }
    if (results.length) setAttachments(prev => [...prev, ...results]);
  };
  const { isDragging, dropZoneProps } = useDropZone({ onFiles: processDroppedFiles, disabled: isTyping });
  const voice = useVoiceInput({ onResult: (transcript) => handleUserInput(transcript) });

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => {
    if (prefilled && messages.length === 1) {
      // Skip chat step — go directly to confirmation
      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: prefilled };
      const aiMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', text: "I'll validate this idea for you. Hit Start Validation when ready!" };
      setMessages(prev => [...prev, userMsg, aiMsg]);
      setValidatingParams({ ideaText: prefilled });
      setInputValue("");
    }
  }, []);

  const sendToAI = useCallback(async (allMessages: ChatMessage[]) => {
    setIsTyping(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-validate', { body: { messages: allMessages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })) } });
      if (error) {
        if (error.message?.includes('429') || (data as any)?.error?.includes('rate limit')) {
          toast.error("Rate limit reached — please wait a moment and try again.");
        } else if (error.message?.includes('402') || (data as any)?.error?.includes('usage limit')) {
          toast.error("AI usage limit reached. Please add credits to continue.");
        } else {
          throw error;
        }
        setIsTyping(false);
        return;
      }
      if (data?.error) { toast.error(data.error); setIsTyping(false); return; }
      const aiMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', text: data.reply || "I'll validate this for you!" };
      setIsTyping(false); setMessages(prev => [...prev, aiMsg]);
      if (data.ready && data.params?.ideaText) setValidatingParams(data.params);
    } catch (err: any) { setIsTyping(false); toast.error("AI error: " + (err.message || "Unknown error")); }
  }, []);

  const handleUserInput = (overrideText?: string) => {
    const text = (overrideText || inputValue).trim(); if (!text || isTyping) return;
    if (!overrideText) setInputValue("");
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    const updated = [...messages, userMsg]; setMessages(updated); sendToAI(updated);
  };

  const triggerValidation = useCallback(async (ideaText: string) => {
    if (!hasCredits) { toast.error("You're out of credits. Contact support to get more."); return; }
    setPhase('researching'); setCurrentStep(0);
    try {
      // If there are image attachments, analyze them first via Gemini
      let imageContext = "";
      const imageAttachments = attachments.filter(a => a.type === "image" && a.base64);
      if (imageAttachments.length > 0) {
        try {
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-images', {
            body: { images: imageAttachments.map(a => a.base64), context: `Validating startup idea: "${ideaText}"` },
          });
          if (!analysisError && analysisData?.analysis) {
            imageContext = `\n\nVisual context from user-provided images:\n${analysisData.analysis}`;
          }
        } catch (e) { console.error("Image analysis failed:", e); }
      }
      // Include text file content
      const textAttachments = attachments.filter(a => a.type === "text" && a.base64);
      textAttachments.forEach(a => {
        imageContext += `\n\nAttached file (${a.file.name}):\n${a.base64!.slice(0, 5000)}`;
      });

      const stepInterval = setInterval(() => { setCurrentStep(prev => { if (prev >= researchSteps.length - 1) { clearInterval(stepInterval); return prev; } return prev + 1; }); }, 3500);
      const { data, error } = await supabase.functions.invoke('perplexity-validate', { body: { ideaText: ideaText + imageContext, mode: researchMode } });
      clearInterval(stepInterval); setCurrentStep(researchSteps.length);
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await deductCredit(); // refresh client-side credit count
      const r: Report = {
        ideaText, scores: data.scores || { demand: 0, pain: 0, competition: 0, mvpFeasibility: 0 },
        verdict: data.verdict || 'Skip', pros: data.pros || [], cons: data.cons || [],
        gapOpportunities: data.gapOpportunities || [], mvpWedge: data.mvpWedge || '', killTest: data.killTest || '',
        competitors: data.competitors || [], evidenceLinks: data.evidenceLinks || [],
        marketSizing: data.marketSizing || undefined,
        wtpSignals: data.wtpSignals || undefined,
        competitionDensity: data.competitionDensity || undefined,
        marketTiming: data.marketTiming || undefined,
        icp: data.icp || undefined,
        workaroundDetection: data.workaroundDetection || undefined,
        featureGapMap: data.featureGapMap || undefined,
        platformRisk: data.platformRisk || undefined,
        gtmStrategy: data.gtmStrategy || undefined,
        pricingBenchmarks: data.pricingBenchmarks || undefined,
        defensibility: data.defensibility || undefined,
      };
      try { await saveValidationReportDb(r); } catch (e) { console.error("Failed to save to DB:", e); }
      setReport(r); setPhase('results');
    } catch (err: any) { toast.error("Validation failed: " + (err.message || "Unknown error")); setPhase('chat'); }
  }, [hasCredits, deductCredit]);

  const handleAddToBacklog = async () => {
    if (!report) return;
    try {
      await addToBacklogDb({ ideaName: report.ideaText.slice(0, 80), source: 'Validated', overallScore: Math.round((report.scores.demand + report.scores.pain + report.scores.mvpFeasibility - report.scores.competition) / 3), status: report.verdict === 'Build' ? 'Validated' : 'Exploring' });
      toast.success("Saved to My Ideas");
    } catch { toast.error("Failed to save"); }
  };

  const resetChat = () => {
    setMessages([{ id: '1', role: 'assistant', text: "Describe your idea and I'll validate it — checking demand, competition, and feasibility. You can also attach competitor screenshots or market data." }]);
    setInputValue(""); setPhase('chat'); setReport(null); setIsTyping(false); setValidatingParams(null); setAttachments([]);
  };

  if (phase === 'chat') {
    return (
      <div className={`max-w-2xl mx-auto flex flex-col h-[calc(100vh-6rem)] animate-fade-in relative ${isDragging ? 'ring-2 ring-primary/40 ring-inset rounded-2xl' : ''}`} {...dropZoneProps}>
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-primary/5 backdrop-blur-sm flex items-center justify-center rounded-2xl pointer-events-none">
            <p className="text-sm font-medium text-primary">Drop files here</p>
          </div>
        )}
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight font-nunito">Validate an Idea</h1>
          <p className="text-muted-foreground mt-1">Tell me your idea — I'll research if it's worth building.</p>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pb-4 no-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-foreground text-background rounded-br-md' : 'bg-secondary text-foreground rounded-bl-md'}`}>
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="border-t border-border/50 pt-3 pb-2 space-y-2">
          {validatingParams && (
            <div className="bg-secondary/60 border border-border/50 rounded-2xl p-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">I'll validate this idea:</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium"><Lightbulb className="h-3 w-3 shrink-0" /> {validatingParams.ideaText.length > 80 ? validatingParams.ideaText.slice(0, 80) + '...' : validatingParams.ideaText}</span>
              </div>
              <ResearchModeToggle mode={researchMode} onChange={setResearchMode} />
              <Button className="w-full rounded-full" size="sm" onClick={() => triggerValidation(validatingParams.ideaText)}>
                <Search className="h-3.5 w-3.5 mr-1" /> Start Validation {researchMode === 'deep' ? '(3 credits)' : '(1 credit)'}
              </Button>
            </div>
          )}
          {/* Attachment previews */}
          {attachments.length > 0 && (
            <AttachmentPreview attachments={attachments} onRemove={(id) => setAttachments(attachments.filter(a => a.id !== id))} />
          )}
          <div className="flex gap-2">
            <FileUpload attachments={attachments} onAttachmentsChange={setAttachments} disabled={isTyping} />
            <Input ref={inputRef} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUserInput()} placeholder={voice.isListening ? "Listening..." : validatingParams ? "Add more context or hit Start Validation..." : "e.g. AI tool that tracks subscriptions..."} className="flex-1 rounded-xl" autoFocus disabled={isTyping} />
            <VoiceButton isListening={voice.isListening} isSupported={voice.isSupported} onStart={() => voice.startListening()} onStop={() => voice.stopListening()} disabled={isTyping} />
            <Button size="icon" className="rounded-xl" onClick={() => handleUserInput()} disabled={!inputValue.trim() || isTyping}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'researching') {
    return (
      <div className="max-w-lg mx-auto mt-20 animate-fade-in">
        <Card className="rounded-[32px] shadow-lg"><CardContent className="p-8">
          <h2 className="text-xl font-semibold font-nunito mb-2">Validating...</h2>
          <p className="text-sm text-muted-foreground mb-4">Researching demand, competition, and feasibility.</p>
          <ResearchTrace steps={researchSteps} currentStep={currentStep} isComplete={false} />
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-nunito">Validation Report</h1>
          <p className="text-muted-foreground mt-1 text-sm truncate">{report?.ideaText}</p>
        </div>
        <Button variant="outline" className="rounded-full shrink-0" onClick={resetChat}>New Validation</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className={cn(
          "md:col-span-1 rounded-2xl border-0 overflow-hidden relative",
          report!.verdict === 'Build' && "bg-gradient-to-br from-emerald-500/15 via-emerald-400/5 to-transparent border border-emerald-200/30",
          report!.verdict === 'Pivot' && "bg-gradient-to-br from-amber-500/15 via-amber-400/5 to-transparent border border-amber-200/30",
          report!.verdict === 'Skip' && "bg-gradient-to-br from-rose-500/15 via-rose-400/5 to-transparent border border-rose-200/30",
        )}>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3 relative z-10">
            <div className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center",
              report!.verdict === 'Build' && "bg-emerald-500/15 text-emerald-600",
              report!.verdict === 'Pivot' && "bg-amber-500/15 text-amber-600",
              report!.verdict === 'Skip' && "bg-rose-500/15 text-rose-600",
            )}>
              {report!.verdict === 'Build' && <Rocket className="h-7 w-7" />}
              {report!.verdict === 'Pivot' && <RefreshCw className="h-7 w-7" />}
              {report!.verdict === 'Skip' && <XOctagon className="h-7 w-7" />}
            </div>
            <div>
              <p className={cn(
                "text-2xl font-bold tracking-tight",
                report!.verdict === 'Build' && "text-emerald-700 dark:text-emerald-400",
                report!.verdict === 'Pivot' && "text-amber-700 dark:text-amber-400",
                report!.verdict === 'Skip' && "text-rose-700 dark:text-rose-400",
              )}>{report!.verdict}</p>
              <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                {report!.verdict === 'Build' && "Strong signals — worth pursuing"}
                {report!.verdict === 'Pivot' && "Potential exists — rethink approach"}
                {report!.verdict === 'Skip' && "Weak signals — move on"}
                <SectionTooltip id="verdict" />
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 rounded-2xl border-border/50">
          <CardContent className="p-5 space-y-3">
            <ScoreBar label="Demand" value={report!.scores.demand} />
            <ScoreBar label="Pain" value={report!.scores.pain} />
            <ScoreBar label="Competition" value={report!.scores.competition} />
            <ScoreBar label="MVP Feasibility" value={report!.scores.mvpFeasibility} />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold font-nunito mb-4">Strategy</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="rounded-2xl border-border/50"><CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-green-600 shrink-0" /><h3 className="font-semibold text-sm">Pros</h3><SectionTooltip id="pros" /></div>
            <ul className="space-y-1.5">{report!.pros.map((p, i) => <li key={i} className="text-sm text-muted-foreground">• {p}</li>)}</ul>
          </CardContent></Card>
          <Card className="rounded-2xl border-border/50"><CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2"><ThumbsDown className="h-4 w-4 text-red-600 shrink-0" /><h3 className="font-semibold text-sm">Cons</h3><SectionTooltip id="cons" /></div>
            <ul className="space-y-1.5">{report!.cons.map((c, i) => <li key={i} className="text-sm text-muted-foreground">• {c}</li>)}</ul>
          </CardContent></Card>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-border/50"><CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2"><Target className="h-4 w-4 text-primary shrink-0" /><h3 className="font-semibold text-sm">Gap Opportunities</h3><SectionTooltip id="gapOpportunities" /></div>
          <ul className="space-y-1.5">{report!.gapOpportunities.map((g, i) => <li key={i} className="text-sm text-muted-foreground">• {g}</li>)}</ul>
        </CardContent></Card>
        <Card className="rounded-2xl border-border/50"><CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" /><h3 className="font-semibold text-sm">Kill Test</h3><SectionTooltip id="killTest" /></div>
          <p className="text-sm text-muted-foreground">{report!.killTest}</p>
        </CardContent></Card>
      </div>

      {report!.mvpWedge && (
        <Card className="rounded-2xl border-border/50"><CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2"><h3 className="font-semibold text-sm">Suggested MVP Wedge</h3><SectionTooltip id="mvpWedge" /></div>
          <p className="text-sm text-muted-foreground">{report!.mvpWedge}</p>
        </CardContent></Card>
      )}

      {/* ─── Intelligence Layers (Phase 1 + 2 + 3) ─── */}
      {(report!.wtpSignals || report!.competitionDensity || report!.marketTiming || report!.icp || report!.workaroundDetection || report!.featureGapMap || report!.platformRisk || report!.gtmStrategy || report!.pricingBenchmarks || report!.defensibility) && (
        <div>
          <h2 className="text-lg font-semibold font-nunito mb-4 flex items-center gap-2">Market Intelligence <SectionTooltip id="marketIntelligence" /></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report!.wtpSignals && <WtpSection data={report!.wtpSignals} />}
            {report!.competitionDensity && <CompetitionDensitySection data={report!.competitionDensity} />}
            {report!.marketTiming && <MarketTimingSection data={report!.marketTiming} />}
            {report!.icp && <IcpSection data={report!.icp} />}
            {report!.workaroundDetection && <WorkaroundSection data={report!.workaroundDetection} />}
            {report!.featureGapMap && <FeatureGapSection data={report!.featureGapMap} />}
            {report!.platformRisk && <PlatformRiskSection data={report!.platformRisk} />}
            {report!.gtmStrategy && <GtmStrategySection data={report!.gtmStrategy} />}
            {report!.pricingBenchmarks && <PricingBenchmarkSection data={report!.pricingBenchmarks} />}
            {report!.defensibility && <DefensibilitySection data={report!.defensibility} />}
          </div>
        </div>
      )}

      {report!.marketSizing && (
        <div>
          <h2 className="text-lg font-semibold font-nunito mb-4 flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Market Sizing <SectionTooltip id="marketSizing" /></h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'TAM', sublabel: 'Total Addressable Market', value: report!.marketSizing.tam },
              { label: 'SAM', sublabel: 'Serviceable Addressable Market', value: report!.marketSizing.sam },
              { label: 'SOM', sublabel: 'Serviceable Obtainable Market', value: report!.marketSizing.som },
            ].map(m => (
              <Card key={m.label} className="rounded-2xl border-border/50">
                <CardContent className="p-5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{m.label}</span>
                    <span className="text-[10px] text-muted-foreground">{m.sublabel}</span>
                    
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {report!.marketSizing.methodology && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed italic">{report!.marketSizing.methodology}</p>
          )}
        </div>
      )}

      {report!.competitors.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold font-nunito mb-4 flex items-center gap-2">Competitors <SectionTooltip id="competitors" /></h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {report!.competitors.map((c, i) => (
              <Card key={i} className="rounded-2xl bg-secondary border-0"><CardContent className="p-5 space-y-1">
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
          <h2 className="text-lg font-semibold font-nunito mb-4 flex items-center gap-2">Sources <SectionTooltip id="sources" /></h2>
          <div className="space-y-1.5">
            {report!.evidenceLinks.map((link, i) => {
              let displayUrl = link;
              try { const u = new URL(link); displayUrl = u.hostname.replace('www.', '') + (u.pathname !== '/' ? u.pathname : ''); if (displayUrl.length > 70) displayUrl = displayUrl.slice(0, 67) + '...'; } catch {}
              return (
                <div key={i} className="flex items-center gap-2">
                  <img src={`https://www.google.com/s2/favicons?domain=${new URL(link).hostname}&sz=16`} alt="" className="h-4 w-4 rounded-sm shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <a href={link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">{displayUrl}</a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button size="sm" variant="outline" className="rounded-full" onClick={handleAddToBacklog}><Bookmark className="h-3 w-3 mr-1" /> Save to My Ideas</Button>
        {report!.verdict !== 'Build' && (
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate('/generate')}><Lightbulb className="h-3 w-3 mr-1" /> Explore Adjacent Ideas</Button>
        )}
      </div>

      {report && (
        <FollowUpChat
          reportContext={`Idea: "${report.ideaText}"\nVerdict: ${report.verdict}\nDemand: ${report.scores.demand}/100, Pain: ${report.scores.pain}/100, Competition: ${report.scores.competition}/100, Feasibility: ${report.scores.mvpFeasibility}/100\nPros: ${report.pros.join(', ')}\nCons: ${report.cons.join(', ')}\nGap Opportunities: ${report.gapOpportunities.join(', ')}\nMVP Wedge: ${report.mvpWedge}\nKill Test: ${report.killTest}\nCompetitors: ${report.competitors.map(c => c.name).join(', ')}${report.wtpSignals ? `\n\nWTP: ${report.wtpSignals.strength} — ${report.wtpSignals.summary}` : ''}${report.competitionDensity ? `\nCompetition: ${report.competitionDensity.level} — ${report.competitionDensity.summary}` : ''}${report.marketTiming ? `\nTiming: ${report.marketTiming.phase} — ${report.marketTiming.summary}` : ''}${report.icp ? `\nICP: ${report.icp.summary}` : ''}${report.workaroundDetection ? `\nWorkarounds: ${report.workaroundDetection.severity} — ${report.workaroundDetection.summary}` : ''}${report.featureGapMap ? `\nFeature Gaps: ${report.featureGapMap.summary}` : ''}${report.platformRisk ? `\nPlatform Risk: ${report.platformRisk.level} — ${report.platformRisk.summary}` : ''}${report.gtmStrategy ? `\n\nGTM: ${report.gtmStrategy.primaryChannel} — ${report.gtmStrategy.summary}` : ''}${report.pricingBenchmarks ? `\nPricing: ${report.pricingBenchmarks.summary}` : ''}${report.defensibility ? `\nDefensibility: ${report.defensibility.overallStrength} — ${report.defensibility.summary} (Time to moat: ${report.defensibility.timeToMoat})` : ''}`}
          onRevalidate={(ideaText) => triggerValidation(ideaText)}
        />
      )}

      {report && (
        <AIHandoff context={`Validation Report for: "${report.ideaText}"\n\nVerdict: ${report.verdict}\nDemand: ${report.scores.demand}/100, Pain: ${report.scores.pain}/100, Competition: ${report.scores.competition}/100, Feasibility: ${report.scores.mvpFeasibility}/100\n\nPros: ${report.pros.join(', ')}\nCons: ${report.cons.join(', ')}\nMVP Wedge: ${report.mvpWedge}\n\nHelp me build this product.`} />
      )}
    </div>
  );
}
