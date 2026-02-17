import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResearchTrace } from "@/components/ResearchTrace";
import { ScoreBar } from "@/components/ScoreBar";
import { AIHandoff } from "@/components/AIHandoff";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Bookmark, ClipboardCheck, Copy, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveGeneratorRunDb, addToBacklogDb } from "@/lib/db";
import { toast } from "sonner";

const personas = ["Remote Workers", "Parents", "Students", "Founders", "ADHD", "Freelancers", "Seniors", "Gamers"];
const categories = ["Finance", "Productivity", "Health", "Education", "Social", "E-commerce", "Entertainment", "Developer Tools"];
const platforms = ["Web App", "Mobile App", "Browser Extension", "API/SaaS", "Desktop App", "Skip"];
const regions = ["US", "Europe", "Asia", "Global", "Skip"];

type ChatStep = 'initial' | 'persona' | 'category' | 'region' | 'platform' | 'ready';

interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  text: string;
  options?: string[];
  step?: ChatStep;
}

const researchSteps = [
  "Searching for complaints and frustrations...",
  "Analyzing pain points and patterns...",
  "Clustering problem themes...",
  "Generating product ideas...",
  "Scoring opportunities...",
];

interface GeneratorResult {
  persona: string;
  category: string;
  region?: string;
  platform?: string;
  problemClusters: any[];
  ideaSuggestions: any[];
}

export default function GenerateIdeas() {
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'system', text: "What kind of product or problem area are you interested in? Tell me what's on your mind." },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [currentStep, setCurrentStep] = useState<ChatStep>('initial');
  const [ideaContext, setIdeaContext] = useState("");
  const [persona, setPersona] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [platform, setPlatform] = useState("");
  const [phase, setPhase] = useState<'chat' | 'researching' | 'results'>('chat');
  const [researchStep, setResearchStep] = useState(0);
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (msg: Omit<ChatMessage, 'id'>) => {
    setIsTyping(false);
    setMessages(prev => [...prev, { ...msg, id: crypto.randomUUID() }]);
  };

  const showTypingThenMessage = (msg: Omit<ChatMessage, 'id'>, delay = 800) => {
    setIsTyping(true);
    setTimeout(() => addMessage(msg), delay);
  };

  const handleUserInput = () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    addMessage({ role: 'user', text });
    if (currentStep === 'initial') {
      setIdeaContext(text);
      setCurrentStep('persona');
      showTypingThenMessage({ role: 'system', text: "Great! Who are you building this for?", options: personas, step: 'persona' });
    }
  };

  const handleOptionSelect = (option: string, step: ChatStep) => {
    addMessage({ role: 'user', text: option });
    if (step === 'persona') {
      setPersona(option);
      setCurrentStep('category');
      showTypingThenMessage({ role: 'system', text: "What industry or domain should I focus on?", options: categories, step: 'category' });
    } else if (step === 'category') {
      setCategory(option);
      setCurrentStep('region');
      showTypingThenMessage({ role: 'system', text: "Any specific region to focus on?", options: regions, step: 'region' });
    } else if (step === 'region') {
      setRegion(option === 'Skip' ? '' : option);
      setCurrentStep('platform');
      showTypingThenMessage({ role: 'system', text: "What platform do you prefer?", options: platforms, step: 'platform' });
    } else if (step === 'platform') {
      setPlatform(option === 'Skip' ? '' : option);
      setCurrentStep('ready');
      showTypingThenMessage({
        role: 'system',
        text: `Got it! I'll research opportunities for **${option === 'Skip' ? 'any platform' : option}** products targeting **${persona || 'your audience'}** in **${category || 'your domain'}**. Ready to go?`,
        options: ['Generate Ideas ✨'],
        step: 'ready',
      });
    } else if (step === 'ready') {
      triggerGenerate();
    }
  };

  const triggerGenerate = useCallback(async () => {
    setPhase('researching');
    setResearchStep(0);
    try {
      const stepInterval = setInterval(() => {
        setResearchStep(prev => {
          if (prev >= researchSteps.length - 1) { clearInterval(stepInterval); return prev; }
          return prev + 1;
        });
      }, 2000);

      const { data, error } = await supabase.functions.invoke('perplexity-generate', {
        body: { persona, category, region: region || undefined, platform: platform || undefined, context: ideaContext || undefined },
      });

      clearInterval(stepInterval);
      setResearchStep(researchSteps.length);
      if (error) throw error;

      const run: GeneratorResult = {
        persona,
        category,
        region: region || undefined,
        platform: platform || undefined,
        problemClusters: data.problemClusters || [],
        ideaSuggestions: data.ideaSuggestions || [],
      };

      // Save to DB
      try {
        await saveGeneratorRunDb(run);
      } catch (e) {
        console.error("Failed to save to DB:", e);
      }

      setResult(run);
      setPhase('results');
    } catch (err: any) {
      toast.error("Generation failed: " + (err.message || "Unknown error"));
      setPhase('chat');
    }
  }, [persona, category, region, platform, ideaContext]);

  const handleAddToBacklog = async (idea: any) => {
    try {
      await addToBacklogDb({
        ideaName: idea.name,
        source: 'Generated',
        demandScore: idea.demandScore,
        status: 'New',
      });
      toast.success(`"${idea.name}" saved to My Ideas`);
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleValidate = (idea: any) => {
    navigate(`/validate?idea=${encodeURIComponent(idea.name + ': ' + idea.description)}`);
  };

  const resetChat = () => {
    setMessages([{ id: '1', role: 'system', text: "What kind of product or problem area are you interested in? Tell me what's on your mind." }]);
    setInputValue(""); setCurrentStep('initial'); setIdeaContext(""); setPersona(""); setCategory(""); setRegion(""); setPlatform(""); setPhase('chat'); setResult(null);
  };

  if (phase === 'chat') {
    return (
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Generate Ideas</h1>
          <p className="text-muted-foreground mt-1">Tell me what you're thinking — I'll find real problems and opportunities.</p>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                <p>{msg.text}</p>
                {msg.options && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.options.map((opt) => (
                      <button key={opt} onClick={() => handleOptionSelect(opt, msg.step!)} className="px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">{opt}</button>
                    ))}
                  </div>
                )}
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
        {currentStep === 'initial' && (
          <div className="border-t pt-3 pb-2">
            <div className="flex gap-2">
              <Input ref={inputRef} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUserInput()} placeholder="e.g. I want to build something for freelancers who struggle with invoicing..." className="flex-1" autoFocus />
              <Button size="icon" onClick={handleUserInput} disabled={!inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'researching') {
    return (
      <div className="max-w-lg mx-auto mt-20">
        <Card><CardContent className="p-8">
          <h2 className="text-xl font-semibold mb-2">Researching...</h2>
          <p className="text-sm text-muted-foreground mb-4">Mining real complaints and opportunities for {persona} in {category}.</p>
          <ResearchTrace steps={researchSteps} currentStep={researchStep} isComplete={false} />
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results</h1>
          <p className="text-muted-foreground mt-1">{persona} × {category} — {result?.ideaSuggestions.length} ideas found</p>
        </div>
        <Button variant="outline" onClick={resetChat}>New Search</Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Problem Themes</h2>
        <div className="space-y-3">
          {result?.problemClusters.map((cluster: any) => (
            <Collapsible key={cluster.id}>
              <Card className="border">
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="text-left">
                      <p className="font-medium text-sm">{cluster.theme}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cluster.painSummary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{cluster.complaintCount} signals</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-2 border-t pt-3">
                    {cluster.complaints?.map((c: string, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground italic">"{c}"</p>
                    ))}
                    {cluster.evidenceLinks?.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {cluster.evidenceLinks.map((link: string, i: number) => (
                          <a key={i} href={link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Source {i + 1}</a>
                        ))}
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
        <h2 className="text-lg font-semibold mb-4">Idea Suggestions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {result?.ideaSuggestions.map((idea: any) => (
            <Card key={idea.id} className="border">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold">{idea.name}</h3>
                <p className="text-sm text-muted-foreground">{idea.description}</p>
                <ScoreBar label="Opportunity Score" value={idea.demandScore} />
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p><span className="font-medium text-foreground">MVP:</span> {idea.mvpScope}</p>
                  <p><span className="font-medium text-foreground">Monetization:</span> {idea.monetization}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleValidate(idea)}>
                    <ClipboardCheck className="h-3 w-3 mr-1" /> Validate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAddToBacklog(idea)}>
                    <Bookmark className="h-3 w-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    navigator.clipboard.writeText(`Build a ${idea.name}: ${idea.description}\nMVP: ${idea.mvpScope}`);
                    toast.success("Copied PRD prompt");
                  }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {result && (
        <AIHandoff context={`I discovered these product opportunities for ${persona} in ${category}:\n\n${result.ideaSuggestions.map((i: any) => `- ${i.name}: ${i.description} (Score: ${i.demandScore}/100)`).join('\n')}\n\nHelp me build an MVP for the top opportunity.`} />
      )}
    </div>
  );
}
