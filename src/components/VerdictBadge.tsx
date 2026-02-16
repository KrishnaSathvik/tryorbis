import { cn } from "@/lib/utils";

interface VerdictBadgeProps {
  verdict: 'Build' | 'Pivot' | 'Skip';
  size?: 'sm' | 'lg';
}

export function VerdictBadge({ verdict, size = 'sm' }: VerdictBadgeProps) {
  const styles = {
    Build: 'bg-green-100 text-green-700 border-green-200',
    Pivot: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Skip: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <span className={cn(
      "inline-flex items-center font-semibold border rounded-full",
      styles[verdict],
      size === 'lg' ? 'px-4 py-1.5 text-base' : 'px-2.5 py-0.5 text-xs'
    )}>
      {verdict === 'Build' ? '🚀 Build' : verdict === 'Pivot' ? '🔄 Pivot' : '⛔ Skip'}
    </span>
  );
}
