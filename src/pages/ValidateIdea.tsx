import { useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResearchTrace } from "@/components/ResearchTrace";
import { ScoreBar } from "@/components/ScoreBar";
import { VerdictBadge } from "@/components/VerdictBadge";
import { AIHandoff } from "@/components/AIHandoff";
import { supabase } from "@/integrations/supabase/client";
import { saveValidationReport, addToBacklog } from "@/lib/storage";
import { ValidationReport } from "@/lib/types";
import { toast } from "sonner";
import { Bookmark, Lightbulb, ThumbsUp, ThumbsDown, Target, AlertTriangle } from "lucide-react";

const researchSteps = [
  "Analyzing demand signals...",
  "Scanning for competitors...",
  "Extracting pain indicators...",
  "Evaluating MVP feasibility...",
  "Generating verdict...",
];

export default function ValidateIdea() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [ideaText, setIdeaText] = useState(searchParams.get('idea') || "");
  const [phase, setPhase] = useState<'input' | 'researching' | 'results'>('input');
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport] = useState<ValidationReport | null>(null);

  const validate = useCallback(async () => {
    if (!ideaText.trim()) { toast.error("Describe your idea first"); return; }

    setPhase('researching');
    setCurrentStep(0);

    try {
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= researchSteps.length - 1) { clearInterval(stepInterval); return prev; }
          return prev + 1;
        });
      }, 2000);

      const { data, error } = await supabase.functions.invoke('perplexity-validate', {
        body: { ideaText },
      });

      clearInterval(stepInterval);
      setCurrentStep(researchSteps.length);

      if (error) throw error;

      const validationReport: ValidationReport = {
        id: crypto.randomUUID(),
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
        createdAt: new Date().toISOString(),
      };

      saveValidationReport(validationReport);
      setReport(validationReport);
      setPhase('results');
    } catch (err: any) {
      toast.error("Validation failed: " + (err.message || "Unknown error"));
      setPhase('input');
    }
  }, [ideaText]);

  const handleAddToBacklog = () => {
    if (!report) return;
    addToBacklog({
      id: crypto.randomUUID(),
      ideaName: report.ideaText.slice(0, 80),
      source: 'Validated',
      sourceId: report.id,
      overallScore: Math.round((report.scores.demand + report.scores.pain + report.scores.mvpFeasibility - report.scores.competition) / 3),
      status: report.verdict === 'Build' ? 'Validated' : 'Exploring',
      createdAt: new Date().toISOString(),
    });
    toast.success("Added to backlog");
  };

  if (phase === 'input') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validate an Idea</h1>
          <p className="text-muted-foreground mt-1">Test if your idea is worth building.</p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-5">
            <Textarea
              placeholder="AI tool that tracks subscriptions automatically and suggests ways to save money..."
              className="min-h-[120px] text-base"
              value={ideaText}
              onChange={e => setIdeaText(e.target.value)}
            />
            <Button onClick={validate} size="lg" className="w-full">Validate Idea</Button>
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
            <h2 className="text-xl font-semibold mb-2">Validating...</h2>
            <p className="text-sm text-muted-foreground mb-4">Researching demand, competition, and feasibility.</p>
            <ResearchTrace steps={researchSteps} currentStep={currentStep} isComplete={false} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validation Report</h1>
          <p className="text-muted-foreground mt-1 max-w-lg truncate">{report?.ideaText}</p>
        </div>
        <Button variant="outline" onClick={() => { setPhase('input'); setReport(null); setIdeaText(""); }}>New Validation</Button>
      </div>

      {/* Verdict + Scores */}
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

      {/* Strategy Layer */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Strategy</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-600 shrink-0" />
                <h3 className="font-semibold text-sm">Pros</h3>
              </div>
              <ul className="space-y-1.5">
                {report!.pros.map((p, i) => <li key={i} className="text-sm text-muted-foreground">• {p}</li>)}
              </ul>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-red-600 shrink-0" />
                <h3 className="font-semibold text-sm">Cons</h3>
              </div>
              <ul className="space-y-1.5">
                {report!.cons.map((c, i) => <li key={i} className="text-sm text-muted-foreground">• {c}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold text-sm">Gap Opportunities</h3>
            </div>
            <ul className="space-y-1.5">
              {report!.gapOpportunities.map((g, i) => <li key={i} className="text-sm text-muted-foreground">• {g}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
              <h3 className="font-semibold text-sm">Kill Test</h3>
            </div>
            <p className="text-sm text-muted-foreground">{report!.killTest}</p>
          </CardContent>
        </Card>
      </div>

      {report!.mvpWedge && (
        <Card className="border">
          <CardContent className="p-5 space-y-2">
            <h3 className="font-semibold text-sm">Suggested MVP Wedge</h3>
            <p className="text-sm text-muted-foreground">{report!.mvpWedge}</p>
          </CardContent>
        </Card>
      )}

      {/* Competitors */}
      {report!.competitors.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Competitors</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {report!.competitors.map((c, i) => (
              <Card key={i} className="border">
                <CardContent className="p-5 space-y-1">
                  <p className="font-medium text-sm">{c.name}</p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p><span className="font-medium text-foreground">Weakness:</span> {c.weakness}</p>
                    {c.pricing && <p><span className="font-medium text-foreground">Pricing:</span> {c.pricing}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Evidence */}
      {report!.evidenceLinks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Sources</h2>
          <div className="flex flex-wrap gap-2">
            {report!.evidenceLinks.map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                Source {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button size="sm" variant="outline" onClick={handleAddToBacklog}>
          <Bookmark className="h-3 w-3 mr-1" /> Add to Backlog
        </Button>
        {report!.verdict !== 'Build' && (
          <Button size="sm" variant="outline" onClick={() => navigate('/generate')}>
            <Lightbulb className="h-3 w-3 mr-1" /> Explore Adjacent Ideas
          </Button>
        )}
      </div>

      {report && (
        <AIHandoff context={`Validation Report for: "${report.ideaText}"\n\nVerdict: ${report.verdict}\nDemand: ${report.scores.demand}/100, Pain: ${report.scores.pain}/100, Competition: ${report.scores.competition}/100, Feasibility: ${report.scores.mvpFeasibility}/100\n\nPros: ${report.pros.join(', ')}\nCons: ${report.cons.join(', ')}\nMVP Wedge: ${report.mvpWedge}\n\nHelp me build this product.`} />
      )}
    </div>
  );
}
