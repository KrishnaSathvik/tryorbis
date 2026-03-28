import { useState, useCallback, useRef, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResearchTrace } from "@/components/ResearchTrace";
import { ScoreBar } from "@/components/ScoreBar";
import { AIHandoff } from "@/components/AIHandoff";
import { FollowUpChat } from "@/components/FollowUpChat";
import { UpgradeModal } from "@/components/UpgradeModal";
import { WtpSection, CompetitionDensitySection, MarketTimingSection, IcpSection, WorkaroundSection, FeatureGapSection, PlatformRiskSection, GtmStrategySection, PricingBenchmarkSection, DefensibilitySection } from "@/components/IntelligenceSections";
import { useCredits } from "@/hooks/useCredits";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Bookmark, ClipboardCheck, Copy, Send, User, FolderOpen, Monitor, Globe, Rocket, Search, Loader2 } from "lucide-react";
import { ResearchModeToggle } from "@/components/ResearchModeToggle";
import { supabase } from "@/integrations/supabase/client";
import { saveGeneratorRunDb, addToBacklogDb } from "@/lib/db";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import type { WtpSignals, CompetitionDensity, MarketTiming, ICP, WorkaroundDetection, FeatureGapMap, PlatformRisk, GtmStrategy, PricingBenchmarks, DefensibilityAnalysis } from "@/lib/types";
import { FileUpload } from "@/components/FileUpload";
import { AttachmentPreview } from "@/components/AttachmentPreview";
import { Attachment, validateFile, getAttachmentType, imageToBase64, readTextFile, extractPdfText } from "@/lib/attachments";
import { useDropZone } from "@/hooks/useDropZone";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { VoiceButton } from "@/components/VoiceButton";

const researchSteps = [
  "Mining complaints from Reddit, forums & reviews...",
  "Cross-referencing across multiple sources...",
  "Clustering pain points by theme...",
  "Analyzing with AI strategist...",
  "Scoring opportunities & generating ideas...",
  "Finalizing research report...",
];

interface ChatMessage { id: string; role: 'user' | 'assistant'; text: string; }
interface GeneratorResult {
  persona: string; category: string; region?: string; platform?: string;
  problemClusters: any[]; ideaSuggestions: any[];
  wtpSignals?: WtpSignals; competitionDensity?: CompetitionDensity;
  marketTiming?: MarketTiming; icp?: ICP;
  workaroundDetection?: WorkaroundDetection; featureGapMap?: FeatureGapMap; platformRisk?: PlatformRisk;
  gtmStrategy?: GtmStrategy; pricingBenchmarks?: PricingBenchmarks; defensibility?: DefensibilityAnalysis;
}

export default function GenerateIdeas() {
  usePageTitle("Generate Ideas");
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { hasCredits, refreshCredits } = useCredits();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', text: "What kind of product or problem are you thinking about? You can also attach screenshots or files for context." },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [phase, setPhase] = useState<'chat' | 'researching' | 'results'>('chat');
  const [researchStep, setResearchStep] = useState(0);
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [generatingParams, setGeneratingParams] = useState<any>(null);
  const [researchMode, setResearchMode] = useState<'regular' | 'deep'>('regular');
  const [deepStage, setDeepStage] = useState<'problems' | 'ideas' | 'intelligence' | null>(null);

  const processDroppedFiles = async (files: File[]) => {
    const remaining = 10 - attachments.length;
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
  const voice = useVoiceInput({
    onResult: (transcript) => {
      setInputValue("");
      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: transcript };
      const updated = [...messages, userMsg];
      setMessages(updated);
      sendToAI(updated);
    },
  });

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const sendToAI = useCallback(async (allMessages: ChatMessage[]) => {
    setIsTyping(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-generate', {
        body: { messages: allMessages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })) },
      });
      if (error) {
        if (error.message?.includes('429') || (data as any)?.error?.includes('rate limit')) {
          toast.error("Rate limit reached — please wait a moment and try again.");
        } else if (error.message?.includes('402') || (data as any)?.error?.includes('usage limit')) {
          toast.error("AI usage limit reached. Please try again later.");
        } else {
          throw error;
        }
        setIsTyping(false);
        return;
      }
      if (data?.error) { toast.error(data.error); setIsTyping(false); return; }
      const aiMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', text: data.reply || "I'm ready to research this for you!" };
      setIsTyping(false);
      setMessages(prev => [...prev, aiMsg]);
      if (data.ready && data.params) setGeneratingParams(data.params);
    } catch (err: any) { setIsTyping(false); toast.error("AI error: " + (err.message || "Unknown error")); }
  }, []);

  const handleUserInput = () => {
    const text = inputValue.trim(); if (!text || isTyping) return;
    setInputValue("");
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    const updated = [...messages, userMsg]; setMessages(updated); sendToAI(updated);
  };

  const getImageContext = useCallback(async (params: any) => {
    let imageContext = "";
    const imageAttachments = attachments.filter(a => a.type === "image" && a.base64);
    if (imageAttachments.length > 0) {
      try {
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-images', {
          body: { images: imageAttachments.map(a => a.base64), context: `Generating ideas for: ${params.persona} in ${params.category}` },
        });
        if (!analysisError && analysisData?.analysis) imageContext = analysisData.analysis;
      } catch (e) { console.error("Image analysis failed:", e); }
    }
    const textAttachments = attachments.filter(a => a.type === "text" && a.base64);
    textAttachments.forEach(a => { imageContext += `\n\nAttached file (${a.file.name}):\n${a.base64!.slice(0, 5000)}`; });
    return imageContext;
  }, [attachments]);

  const triggerGenerate = useCallback(async (params: any) => {
    if (!hasCredits) { setUpgradeOpen(true); return; }
    setPhase('researching'); setResearchStep(0); setDeepStage(null);
    try {
      const imageContext = await getImageContext(params);
      const baseBody = { persona: params.persona, category: params.category, region: params.region || undefined, platform: params.platform || undefined };

      if (researchMode === 'deep') {
        // ── Multi-stage deep research (3 x sonar-pro, ~15s each) ──
        setDeepStage('problems');

        // Stage 1: Mine complaints
        const { data: s1, error: e1 } = await supabase.functions.invoke('perplexity-generate', {
          body: { ...baseBody, context: (params.context || "") + (imageContext ? `\n\nVisual/file context:\n${imageContext}` : ""), mode: 'deep', stage: 'problems' },
        });
        if (e1) throw e1;
        if (s1?.error) throw new Error(s1.error);

        // Show problems immediately → switch to results
        const partialResult: GeneratorResult = { ...baseBody, problemClusters: s1.problemClusters || [], ideaSuggestions: [] };
        setResult(partialResult); setPhase('results'); setDeepStage('ideas');
        refreshCredits();

        const problemsSummary = (s1.problemClusters || []).map((c: any) => `- ${c.theme}: ${c.painSummary} (${c.complaintCount} complaints)`).join('\n');

        // Stage 2: Generate ideas
        const { data: s2, error: e2 } = await supabase.functions.invoke('perplexity-generate', {
          body: { ...baseBody, mode: 'deep', stage: 'ideas', previousContext: problemsSummary },
        });
        if (e2) throw e2;
        if (s2?.error) throw new Error(s2.error);

        setResult(prev => prev ? { ...prev, ideaSuggestions: s2.ideaSuggestions || [] } : prev);
        setDeepStage('intelligence');

        const ideasSummary = (s2.ideaSuggestions || []).map((i: any) => `- ${i.name}: ${i.description} (Score: ${i.demandScore})`).join('\n');

        // Stage 3: Market intelligence
        const { data: s3, error: e3 } = await supabase.functions.invoke('perplexity-generate', {
          body: { ...baseBody, mode: 'deep', stage: 'intelligence', previousContext: `Problems:\n${problemsSummary}\n\nIdeas:\n${ideasSummary}` },
        });
        if (e3) throw e3;
        if (s3?.error) throw new Error(s3.error);

        const finalResult: GeneratorResult = {
          ...baseBody,
          problemClusters: s1.problemClusters || [], ideaSuggestions: s2.ideaSuggestions || [],
          wtpSignals: s3.wtpSignals, competitionDensity: s3.competitionDensity, marketTiming: s3.marketTiming,
          icp: s3.icp, workaroundDetection: s3.workaroundDetection, featureGapMap: s3.featureGapMap,
          platformRisk: s3.platformRisk, gtmStrategy: s3.gtmStrategy, pricingBenchmarks: s3.pricingBenchmarks,
          defensibility: s3.defensibility,
        };
        setResult(finalResult); setDeepStage(null);
        try { await saveGeneratorRunDb(finalResult); } catch (e) { console.error("Failed to save:", e); }

      } else {
        // ── Regular mode (single call) ──
        const stepInterval = setInterval(() => { setResearchStep(prev => { if (prev >= researchSteps.length - 1) { clearInterval(stepInterval); return prev; } return prev + 1; }); }, 3500);
        const { data, error } = await supabase.functions.invoke('perplexity-generate', {
          body: { ...baseBody, context: (params.context || "") + (imageContext ? `\n\nVisual/file context:\n${imageContext}` : ""), mode: researchMode },
        });
        clearInterval(stepInterval); setResearchStep(researchSteps.length);
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        refreshCredits();
        const run: GeneratorResult = {
          ...baseBody,
          problemClusters: data.problemClusters || [], ideaSuggestions: data.ideaSuggestions || [],
          wtpSignals: data.wtpSignals || undefined, competitionDensity: data.competitionDensity || undefined,
          marketTiming: data.marketTiming || undefined, icp: data.icp || undefined,
          workaroundDetection: data.workaroundDetection || undefined, featureGapMap: data.featureGapMap || undefined,
          platformRisk: data.platformRisk || undefined, gtmStrategy: data.gtmStrategy || undefined,
          pricingBenchmarks: data.pricingBenchmarks || undefined, defensibility: data.defensibility || undefined,
        };
        try { await saveGeneratorRunDb(run); } catch (e) { console.error("Failed to save:", e); }
        setResult(run); setPhase('results');
      }
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      if (msg.includes("unable_to_fulfill") || msg.includes("timed out") || msg.includes("deadline") || msg.includes("FUNCTION_INVOCATION_TIMEOUT")) {
        toast.error("Deep research timed out — this model needs more time than the server allows. Try Regular mode instead.", { duration: 6000 });
      } else {
        toast.error("Generation failed: " + msg);
      }
      setDeepStage(null);
      setPhase('chat');
    }
  }, [hasCredits, refreshCredits, researchMode, getImageContext]);

  const handleAddToBacklog = async (idea: any) => {
    try { await addToBacklogDb({ ideaName: idea.name, source: 'Generated', demandScore: idea.demandScore, status: 'New', description: idea.description, mvpScope: idea.mvpScope, monetization: idea.monetization }); toast.success(`"${idea.name}" saved to My Ideas`); } catch { toast.error("Failed to save"); }
  };

  const handleValidate = (idea: any) => { navigate(`/validate?idea=${encodeURIComponent(idea.name + ': ' + idea.description)}`); };

  const resetChat = () => {
    setMessages([{ id: '1', role: 'assistant', text: "What kind of product or problem are you thinking about? You can also attach screenshots or files for context." }]);
    setInputValue(""); setPhase('chat'); setResult(null); setGeneratingParams(null); setAttachments([]); setDeepStage(null);
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
          <h1 className="text-3xl font-bold tracking-tight font-nunito">Generate Ideas</h1>
          <p className="text-muted-foreground mt-1">Tell me what you're thinking — I'll find real problems and opportunities.</p>
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
          {generatingParams && (
            <div className="bg-secondary/60 border border-border/50 rounded-2xl p-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">I understood this from your idea:</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium"><User className="h-3 w-3" /> {generatingParams.persona}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium"><FolderOpen className="h-3 w-3" /> {generatingParams.category}</span>
                {generatingParams.platform && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium"><Monitor className="h-3 w-3" /> {generatingParams.platform}</span>}
                {generatingParams.region && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium"><Globe className="h-3 w-3" /> {generatingParams.region}</span>}
              </div>
              <ResearchModeToggle mode={researchMode} onChange={setResearchMode} />
              <Button className="w-full rounded-full" size="sm" onClick={() => triggerGenerate(generatingParams)}>
                <Rocket className="h-3.5 w-3.5 mr-1" /> Start Research
              </Button>
            </div>
          )}
          {/* Attachment previews */}
          {attachments.length > 0 && (
            <AttachmentPreview attachments={attachments} onRemove={(id) => setAttachments(attachments.filter(a => a.id !== id))} />
          )}
          <div className="flex gap-2">
            <FileUpload attachments={attachments} onAttachmentsChange={setAttachments} disabled={isTyping} />
            <Input ref={inputRef} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUserInput()} placeholder={voice.isListening ? "Listening..." : generatingParams ? "Add more context or hit Start Research..." : "e.g. I want to build a SQL prompt buddy for devs..."} className="flex-1 rounded-xl" autoFocus disabled={isTyping} />
            <VoiceButton isListening={voice.isListening} isSupported={voice.isSupported} onStart={() => voice.startListening()} onStop={() => voice.stopListening()} disabled={isTyping} />
            <Button size="icon" className="rounded-xl" onClick={handleUserInput} disabled={!inputValue.trim() || isTyping}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'researching') {
    return (
      <div className="max-w-lg mx-auto mt-20 animate-fade-in">
        <Card className="rounded-[32px] shadow-lg"><CardContent className="p-8">
          <h2 className="text-xl font-semibold font-nunito mb-2">
            {deepStage === 'problems' ? 'Stage 1/3 — Mining Complaints...' : 'Researching...'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {deepStage === 'problems'
              ? 'Searching Reddit, forums & reviews for real pain points. Results will appear progressively.'
              : `Mining real complaints and opportunities${generatingParams ? ` for ${generatingParams.persona} in ${generatingParams.category}` : ''}.`}
          </p>
          {deepStage ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <span className="text-xs font-semibold text-primary">Deep Research — 3 Stages</span>
                <span className="text-xs text-muted-foreground ml-auto">~45s total</span>
              </div>
              {['problems', 'ideas', 'intelligence'].map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  {deepStage === s ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                  ) : i < ['problems', 'ideas', 'intelligence'].indexOf(deepStage) ? (
                    <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-accent shrink-0" />
                  )}
                  <span className={`text-sm ${deepStage === s ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {s === 'problems' && 'Mining complaints & pain points'}
                    {s === 'ideas' && 'Generating product ideas'}
                    {s === 'intelligence' && 'Analyzing market intelligence'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <ResearchTrace steps={researchSteps} currentStep={researchStep} isComplete={false} mode={researchMode} />
          )}
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-nunito">Research Results</h1>
          <p className="text-muted-foreground mt-1 text-sm truncate">{result?.persona} × {result?.category}</p>
        </div>
        <Button variant="outline" className="rounded-full shrink-0" onClick={resetChat}>New Search</Button>
      </div>

      {/* ─── Quick Summary ─── */}
      <Card className="rounded-2xl border-border/50 bg-secondary/30">
        <CardContent className="p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold font-nunito">{result?.problemClusters.length || 0}</p>
              <p className="text-xs text-muted-foreground">Problems Found</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-nunito">{result?.ideaSuggestions.length || 0}</p>
              <p className="text-xs text-muted-foreground">Ideas Generated</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-nunito">{result?.ideaSuggestions.length ? Math.max(...result.ideaSuggestions.map((i: any) => i.demandScore || 0)) : 0}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
              <p className="text-xs text-muted-foreground">Top Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold font-nunito">Real Problems Found</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </PopoverTrigger>
            <PopoverContent side="top" className="max-w-[260px] p-2">
              <p className="text-xs">These are real complaints and frustrations mined from Reddit, forums, and reviews — grouped by theme. Click to see the actual quotes.</p>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-3">
          {result?.problemClusters.map((cluster: any) => (
            <Collapsible key={cluster.id}>
              <Card className="rounded-2xl border-border/50">
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-medium text-sm">{cluster.theme}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{cluster.painSummary}</p>
                        {/* Show first complaint as preview */}
                        {cluster.complaints?.[0] && (
                          <p className="text-xs text-muted-foreground/60 italic mt-2 truncate">"{cluster.complaints[0]}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {cluster.complaintCount} complaints
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Real quotes found online</p>
                    {cluster.complaints?.map((c: string, i: number) => (<p key={i} className="text-xs text-muted-foreground italic">"{c}"</p>))}
                    {cluster.evidenceLinks?.length > 0 && (
                      <div className="space-y-1 mt-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Sources</p>
                        {cluster.evidenceLinks.map((link: string, i: number) => {
                          let displayUrl = link;
                          let hostname = '';
                          try { const u = new URL(link); hostname = u.hostname; displayUrl = hostname.replace('www.', '') + (u.pathname !== '/' ? u.pathname : ''); if (displayUrl.length > 60) displayUrl = displayUrl.slice(0, 57) + '...'; } catch { return null; }
                          return (
                            <div key={i} className="flex items-center gap-1.5">
                              <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`} alt="" className="h-3.5 w-3.5 rounded-sm shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              <a href={link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">{displayUrl}</a>
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

      <div>
        <h2 className="text-lg font-semibold font-nunito mb-4">Product Ideas</h2>
        {deepStage === 'ideas' && (!result?.ideaSuggestions || result.ideaSuggestions.length === 0) && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/40 border border-border/50 animate-pulse">
            <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
            <div>
              <p className="text-sm font-medium">Generating product ideas...</p>
              <p className="text-xs text-muted-foreground">Creating brandable names and MVP scopes based on discovered problems.</p>
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          {result?.ideaSuggestions
            .sort((a: any, b: any) => (b.demandScore || 0) - (a.demandScore || 0))
            .map((idea: any, idx: number) => (
            <Card key={idea.id} className="rounded-2xl border-border/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                {/* Score header bar */}
                <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground/50">#{idx + 1}</span>
                    <h3 className="font-semibold font-nunito text-sm">{idea.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-lg font-bold tabular-nums ${idea.demandScore >= 80 ? 'text-emerald-600' : idea.demandScore >= 60 ? 'text-primary' : 'text-amber-600'}`}>{idea.demandScore}</span>
                    <span className="text-[10px] text-muted-foreground">/100</span>
                  </div>
                </div>
                {/* Score bar full width */}
                <div className="h-1 bg-secondary">
                  <div
                    className={`h-full transition-all duration-500 ${idea.demandScore >= 80 ? 'bg-emerald-500' : idea.demandScore >= 60 ? 'bg-primary' : 'bg-amber-500'}`}
                    style={{ width: `${idea.demandScore}%` }}
                  />
                </div>
                {/* Content */}
                <div className="px-5 pt-3 pb-4 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{idea.description}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 mt-0.5 w-20">MVP</span>
                      <p className="text-xs text-muted-foreground">{idea.mvpScope}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 mt-0.5 w-20">Revenue</span>
                      <p className="text-xs text-muted-foreground">{idea.monetization}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="default" className="rounded-full text-xs h-7" onClick={() => handleValidate(idea)}><ClipboardCheck className="h-3 w-3 mr-1" /> Validate</Button>
                    <Button size="sm" variant="outline" className="rounded-full text-xs h-7" onClick={() => handleAddToBacklog(idea)}><Bookmark className="h-3 w-3 mr-1" /> Save</Button>
                    <Button size="sm" variant="ghost" className="rounded-full text-xs h-7" onClick={() => { navigator.clipboard.writeText(`Build a ${idea.name}: ${idea.description}\nMVP: ${idea.mvpScope}`); toast.success("Copied PRD prompt"); }}><Copy className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ─── Intelligence loading indicator ─── */}
      {deepStage === 'intelligence' && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/40 border border-border/50 animate-pulse">
          <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium">Analyzing market intelligence...</p>
            <p className="text-xs text-muted-foreground">Researching WTP signals, competition, timing, ICP, pricing, and defensibility.</p>
          </div>
        </div>
      )}

      {/* ─── Intelligence Layers (Phase 1 + 2 + 3) ─── */}
      {result && (result.wtpSignals || result.competitionDensity || result.marketTiming || result.icp || result.workaroundDetection || result.featureGapMap || result.platformRisk || result.gtmStrategy || result.pricingBenchmarks || result.defensibility) && (
        <div>
          <h2 className="text-lg font-semibold font-nunito mb-1">Market Intelligence</h2>
          <p className="text-xs text-muted-foreground mb-4">Deep research for the <span className="font-medium text-foreground">{result.category}</span> market targeting <span className="font-medium text-foreground">{result.persona}</span>.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.wtpSignals && <WtpSection data={result.wtpSignals} />}
            {result.competitionDensity && <CompetitionDensitySection data={result.competitionDensity} />}
            {result.marketTiming && <MarketTimingSection data={result.marketTiming} />}
            {result.icp && <IcpSection data={result.icp} />}
            {result.workaroundDetection && <WorkaroundSection data={result.workaroundDetection} />}
            {result.featureGapMap && <FeatureGapSection data={result.featureGapMap} />}
            {result.platformRisk && <PlatformRiskSection data={result.platformRisk} />}
            {result.gtmStrategy && <GtmStrategySection data={result.gtmStrategy} />}
            {result.pricingBenchmarks && <PricingBenchmarkSection data={result.pricingBenchmarks} />}
            {result.defensibility && <DefensibilitySection data={result.defensibility} />}
          </div>
        </div>
      )}

      {result && (
        <FollowUpChat
          reportContext={`Generated ideas for ${result.persona} in ${result.category}:\n\nProblem Clusters:\n${result.problemClusters.map((c: any) => `- ${c.theme}: ${c.painSummary}`).join('\n')}\n\nIdeas:\n${result.ideaSuggestions.map((i: any) => `- ${i.name}: ${i.description} (Score: ${i.demandScore}/100, MVP: ${i.mvpScope})`).join('\n')}${result.wtpSignals ? `\n\nWillingness to Pay: ${result.wtpSignals.strength} — ${result.wtpSignals.summary}` : ''}${result.competitionDensity ? `\n\nCompetition: ${result.competitionDensity.level} — ${result.competitionDensity.summary}` : ''}${result.marketTiming ? `\n\nMarket Timing: ${result.marketTiming.phase} — ${result.marketTiming.summary}` : ''}${result.icp ? `\n\nICP: ${result.icp.summary}` : ''}${result.workaroundDetection ? `\n\nWorkarounds: ${result.workaroundDetection.severity} — ${result.workaroundDetection.summary}` : ''}${result.featureGapMap ? `\n\nFeature Gaps: ${result.featureGapMap.summary}\nTop Wedge: ${result.featureGapMap.topWedge}` : ''}${result.platformRisk ? `\n\nPlatform Risk: ${result.platformRisk.level} — ${result.platformRisk.summary}` : ''}${result.gtmStrategy ? `\n\nGTM Strategy: ${result.gtmStrategy.primaryChannel} — ${result.gtmStrategy.summary}` : ''}${result.pricingBenchmarks ? `\n\nPricing Benchmarks: ${result.pricingBenchmarks.summary}\nSuggested: ${result.pricingBenchmarks.suggestedRange?.low}-${result.pricingBenchmarks.suggestedRange?.high}` : ''}${result.defensibility ? `\n\nDefensibility: ${result.defensibility.overallStrength} — ${result.defensibility.summary}\nTime to moat: ${result.defensibility.timeToMoat}` : ''}`}
          onRevalidate={(ideaText) => navigate(`/validate?idea=${encodeURIComponent(ideaText)}`)}
        />
      )}

      {result && (
        <AIHandoff context={`I discovered these product opportunities for ${result.persona} in ${result.category}:\n\n${result.ideaSuggestions.map((i: any) => `- ${i.name}: ${i.description} (Score: ${i.demandScore}/100)`).join('\n')}\n\nHelp me build an MVP for the top opportunity.`} />
      )}

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
