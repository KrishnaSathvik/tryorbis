import { cn } from "@/lib/utils";

interface ScoreBarProps {
  label: string;
  value: number; // 0-100
  className?: string;
}

export function ScoreBar({ label, value, className }: ScoreBarProps) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{value}/100</span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
