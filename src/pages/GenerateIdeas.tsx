import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResearchTrace } from "@/components/ResearchTrace";
import { ScoreBar } from "@/components/ScoreBar";
import { AIHandoff } from "@/components/AIHandoff";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Bookmark, ClipboardCheck, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveGeneratorRun, addToBacklog } from "@/lib/storage";
import { GeneratorRun, ProblemCluster, IdeaSuggestion } from "@/lib/types";
import { toast } from "sonner";

const personas = ["Remote Workers", "Parents", "Students", "Founders", "ADHD", "Freelancers", "Seniors", "Gamers"];
const categories = ["Finance", "Productivity", "Health", "Education", "Social", "E-commerce", "Entertainment", "Developer Tools"];
const platforms = ["Web App", "Mobile App", "Browser Extension", "API/SaaS", "Desktop App"];

const researchSteps = [
  "Searching for complaints and frustrations...",
  "Analyzing pain points and patterns...",
  "Clustering problem themes...",
  "Generating product ideas...",
  "Scoring opportunities...",
];

export default function GenerateIdeas() {
  const navigate = useNavigate();
  const [persona, setPersona] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [platform, setPlatform] = useState("");

  const [phase, setPhase] = useState<'input' | 'researching' | 'results'>('input');
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<GeneratorRun | null>(null);

  const generate = useCallback(async () => {
    if (!persona || !category) { toast.error("Select a persona and category"); return; }

    setPhase('researching');
    setCurrentStep(0);

    try {
      // Animate steps
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= researchSteps.length - 1) { clearInterval(stepInterval); return prev; }
          return prev + 1;
        });
      }, 2000);

      const { data, error } = await supabase.functions.invoke('perplexity-generate', {
        body: { persona, category, region: region || undefined, platform: platform || undefined },
      });

      clearInterval(stepInterval);
      setCurrentStep(researchSteps.length);

      if (error) throw error;

      const run: GeneratorRun = {
        id: crypto.randomUUID(),
        persona,
        category,
        region: region || undefined,
        platform: platform || undefined,
        problemClusters: data.problemClusters || [],
        ideaSuggestions: data.ideaSuggestions || [],
        createdAt: new Date().toISOString(),
      };

      saveGeneratorRun(run);
      setResult(run);
      setPhase('results');
    } catch (err: any) {
      toast.error("Generation failed: " + (err.message || "Unknown error"));
      setPhase('input');
    }
  }, [persona, category, region, platform]);

  const handleAddToBacklog = (idea: IdeaSuggestion) => {
    addToBacklog({
      id: crypto.randomUUID(),
      ideaName: idea.name,
      source: 'Generated',
      sourceId: result!.id,
      demandScore: idea.demandScore,
      status: 'New',
      createdAt: new Date().toISOString(),
    });
    toast.success(`"${idea.name}" added to backlog`);
  };

  const handleValidate = (idea: IdeaSuggestion) => {
    navigate(`/validate?idea=${encodeURIComponent(idea.name + ': ' + idea.description)}`);
  };

  if (phase === 'input') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Ideas</h1>
          <p className="text-muted-foreground mt-1">Discover real problems and product opportunities.</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Persona *</Label>
                <Select value={persona} onValueChange={setPersona}>
                  <SelectTrigger><SelectValue placeholder="Who are you building for?" /></SelectTrigger>
                  <SelectContent>{personas.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Industry / domain" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Region <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="e.g. US, Europe, Global" value={region} onChange={e => setRegion(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Platform <span className="text-muted-foreground">(optional)</span></Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue placeholder="Preferred platform" /></SelectTrigger>
                  <SelectContent>{platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={generate} size="lg" className="w-full">Generate Ideas</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'researching') {
    return (
      <div className="max-w-lg mx-auto mt-20">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-2">Researching...</h2>
            <p className="text-sm text-muted-foreground mb-4">Mining real complaints and opportunities for {persona} in {category}.</p>
            <ResearchTrace steps={researchSteps} currentStep={currentStep} isComplete={false} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results phase
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results</h1>
          <p className="text-muted-foreground mt-1">{persona} × {category} — {result?.ideaSuggestions.length} ideas found</p>
        </div>
        <Button variant="outline" onClick={() => { setPhase('input'); setResult(null); }}>New Search</Button>
      </div>

      {/* Problem Clusters */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Problem Themes</h2>
        <div className="space-y-3">
          {result?.problemClusters.map((cluster) => (
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
                    {cluster.complaints.map((c, i) => (
                      <p key={i} className="text-xs text-muted-foreground italic">"{c}"</p>
                    ))}
                    {cluster.evidenceLinks.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {cluster.evidenceLinks.map((link, i) => (
                          <a key={i} href={link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                            Source {i + 1}
                          </a>
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

      {/* Idea Suggestions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Idea Suggestions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {result?.ideaSuggestions.map((idea) => (
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
                    <Bookmark className="h-3 w-3 mr-1" /> Backlog
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
        <AIHandoff context={`I discovered these product opportunities for ${persona} in ${category}:\n\n${result.ideaSuggestions.map(i => `- ${i.name}: ${i.description} (Score: ${i.demandScore}/100)`).join('\n')}\n\nHelp me build an MVP for the top opportunity.`} />
      )}
    </div>
  );
}
