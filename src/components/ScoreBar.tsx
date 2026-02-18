import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const scoreDescriptions: Record<string, string> = {
  "Demand": "How much market demand exists for this idea, based on search trends, forum activity, and user complaints.",
  "Pain": "How severe the problem is for users — higher means people are actively struggling.",
  "Competition": "How crowded the market is. Higher score = more competitors.",
  "MVP Feasibility": "How easy it is to build a minimum viable product for this idea.",
  "Opportunity Score": "Overall opportunity rating combining demand signals and market gaps.",
};

interface ScoreBarProps {
  label: string;
  value: number;
  className?: string;
}

export function ScoreBar({ label, value, className }: ScoreBarProps) {
  const color = value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  const description = scoreDescriptions[label];

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{label}</span>
          {description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <p className="text-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
        </div>
        <span className="text-sm text-muted-foreground font-semibold">{value}/100</span>
      </div>
      <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
