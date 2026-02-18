import { cn } from "@/lib/utils";
import { Zap, Microscope } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ResearchModeToggleProps {
  mode: 'regular' | 'deep';
  onChange: (mode: 'regular' | 'deep') => void;
}

export function ResearchModeToggle({ mode, onChange }: ResearchModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-secondary/60 rounded-full border border-border/50 w-fit">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onChange('regular')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                mode === 'regular'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              Regular
              <span className="text-[10px] opacity-60">1 credit</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-[200px]">
            Fast research using Sonar-Pro — ~15s, up to 8 citations
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onChange('deep')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                mode === 'deep'
                  ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Microscope className="h-3.5 w-3.5" />
              Deep Research
              <span className="text-[10px] opacity-60">3 credits</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-[220px]">
            Expert-level multi-query analysis — slower but significantly more thorough with more citations
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
