import { cn } from "@/lib/utils";
import { Zap, Microscope } from "lucide-react";

interface ResearchModeToggleProps {
  mode: 'regular' | 'deep';
  onChange: (mode: 'regular' | 'deep') => void;
}

export function ResearchModeToggle({ mode, onChange }: ResearchModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Research mode"
      className="flex items-center gap-1 p-1 bg-secondary/60 rounded-full border border-border/50 w-fit"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === "regular"}
        title="Fast research using Sonar-Pro — ~15s, up to 8 citations"
        onClick={() => onChange("regular")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          mode === "regular"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Zap className="h-3.5 w-3.5" aria-hidden />
        Regular
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={mode === "deep"}
        title="Expert-level multi-query analysis — slower but significantly more thorough with more citations"
        onClick={() => onChange("deep")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          mode === "deep"
            ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Microscope className="h-3.5 w-3.5" aria-hidden />
        Deep Research
      </button>
    </div>
  );
}
