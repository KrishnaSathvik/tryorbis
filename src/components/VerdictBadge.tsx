import { cn } from "@/lib/utils";
import { Rocket, RefreshCw, XOctagon } from "lucide-react";

interface VerdictBadgeProps {
  verdict: 'Build' | 'Pivot' | 'Skip';
  size?: 'sm' | 'lg';
}

export function VerdictBadge({ verdict, size = 'sm' }: VerdictBadgeProps) {
  const styles = {
    Build: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    Pivot: 'bg-amber-500/10 text-amber-700 border-amber-200',
    Skip: 'bg-rose-500/10 text-rose-700 border-rose-200',
  };

  const dotColors = {
    Build: 'bg-emerald-500',
    Pivot: 'bg-amber-500',
    Skip: 'bg-rose-500',
  };

  const iconSize = size === 'lg' ? 'h-4 w-4' : 'h-3 w-3';

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 font-semibold border rounded-full",
      styles[verdict],
      size === 'lg' ? 'px-4 py-1.5 text-base' : 'px-2.5 py-0.5 text-xs'
    )}>
      <span className={cn("rounded-full", dotColors[verdict], size === 'lg' ? 'h-2 w-2' : 'h-1.5 w-1.5')} />
      {verdict === 'Build' && <Rocket className={iconSize} />}
      {verdict === 'Pivot' && <RefreshCw className={iconSize} />}
      {verdict === 'Skip' && <XOctagon className={iconSize} />}
      {verdict}
    </span>
  );
}
