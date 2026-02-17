import { cn } from "@/lib/utils";

interface ScoreBarProps {
  label: string;
  value: number;
  className?: string;
}

export function ScoreBar({ label, value, className }: ScoreBarProps) {
  const color = value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
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
