import { Loader2, CheckCircle2, Clock, Timer, Zap, FlaskConical } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface ResearchTraceProps {
  steps: string[];
  currentStep: number;
  isComplete: boolean;
  mode?: 'regular' | 'deep';
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

export function ResearchTrace({ steps, currentStep, isComplete, mode = 'regular' }: ResearchTraceProps) {
  const [elapsed, setElapsed] = useState(0);
  const stepTimestamps = useRef<number[]>([]);
  const isDeep = mode === 'deep';

  // Track when each step starts
  useEffect(() => {
    if (!isComplete) {
      stepTimestamps.current[currentStep] = Date.now();
    }
  }, [currentStep, isComplete]);

  useEffect(() => {
    if (isComplete) return;
    setElapsed(0);
    stepTimestamps.current = [Date.now()];
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  // Estimate remaining time — deep mode has higher baseline
  const getEstimate = () => {
    if (isComplete) return null;
    if (currentStep === 0) {
      // Before any step completes, show baseline estimate
      return isDeep ? 55 : 15;
    }
    const avgPerStep = elapsed / currentStep;
    const remaining = Math.max(0, Math.round(avgPerStep * (steps.length - currentStep)));
    return remaining;
  };

  const estimate = getEstimate();
  const progress = isComplete
    ? 100
    : Math.max(5, (currentStep / steps.length) * 100);

  return (
    <div className="space-y-4 py-4">
      {/* Mode badge */}
      {isDeep && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
          <FlaskConical className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Deep Research Mode</span>
          <span className="text-xs text-muted-foreground ml-auto">Multi-query exhaustive analysis • Takes 30-90s</span>
        </div>
      )}

      {/* Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium tabular-nums">
            {isComplete ? `Completed in ${formatTime(elapsed)}` : `Elapsed: ${formatTime(elapsed)}`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {!isComplete && estimate !== null ? (
            <>
              <Timer className="h-3.5 w-3.5" />
              <span className="text-xs font-medium tabular-nums">
                ~{formatTime(estimate)} remaining
              </span>
            </>
          ) : !isComplete ? (
            <span className="text-xs text-muted-foreground/60">Estimating...</span>
          ) : null}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-accent overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${isDeep ? 'bg-gradient-to-r from-primary via-primary to-primary/70' : 'bg-primary'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      {steps.map((step, i) => {
        const isDone = isComplete || i < currentStep;
        const isActive = !isComplete && i === currentStep;

        return (
          <div key={i} className="flex items-center gap-3">
            {isDone ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            ) : isActive ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-accent shrink-0" />
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
