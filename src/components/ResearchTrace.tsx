import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

interface ResearchTraceProps {
  steps: string[];
  currentStep: number;
  isComplete: boolean;
}

export function ResearchTrace({ steps, currentStep, isComplete }: ResearchTraceProps) {
  return (
    <div className="space-y-3 py-4">
      {steps.map((step, i) => {
        const isDone = isComplete || i < currentStep;
        const isActive = !isComplete && i === currentStep;

        return (
          <div key={i} className="flex items-center gap-3">
            {isDone ? (
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            ) : isActive ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-border shrink-0" />
            )}
            <span className={`text-sm ${isDone ? 'text-foreground' : isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
