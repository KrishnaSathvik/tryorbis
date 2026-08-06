import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ReportsRemainingMeterProps {
  loading?: boolean;
  /** Remaining free reports. Null/undefined when unknown. */
  remaining?: number | null;
  unavailable?: boolean;
  /** Only set when account data proves unlimited/paid access. */
  isUnlimited?: boolean;
  onUpgradeClick?: () => void;
  className?: string;
}

function remainingLabel(remaining: number): string {
  if (remaining === 1) return "1 free report left";
  return `${remaining} free reports left`;
}

export function ReportsRemainingMeter({
  loading = false,
  remaining = null,
  unavailable = false,
  isUnlimited = false,
  onUpgradeClick,
  className,
}: ReportsRemainingMeterProps) {
  if (loading) {
    return (
      <div
        className={cn("flex items-center gap-2 px-3 py-2 rounded-xl", className)}
        aria-busy="true"
        aria-label="Loading report usage"
        data-testid="reports-remaining-meter-loading"
      >
        <Skeleton className="h-4 w-4 rounded-md shrink-0" />
        <Skeleton className="h-3.5 w-28" />
      </div>
    );
  }

  if (isUnlimited) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground",
          className,
        )}
        data-testid="reports-remaining-meter"
      >
        <FileText className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        <span>Unlimited reports</span>
      </div>
    );
  }

  if (unavailable || remaining === null || remaining === undefined) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground",
          className,
        )}
        data-testid="reports-remaining-meter"
        role="status"
      >
        <FileText className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
        <span>Report usage unavailable</span>
      </div>
    );
  }

  const label = remainingLabel(remaining);
  const isZero = remaining <= 0;

  if (onUpgradeClick) {
    return (
      <button
        type="button"
        onClick={onUpgradeClick}
        className={cn(
          "flex items-center gap-2 px-3 py-2 w-full rounded-xl text-sm text-left transition-colors",
          "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isZero ? "text-foreground font-medium" : "text-muted-foreground",
          className,
        )}
        aria-label={label}
        data-testid="reports-remaining-meter"
        data-remaining={remaining}
      >
        <FileText
          className={cn("h-4 w-4 shrink-0", isZero ? "text-warning" : "text-primary")}
          aria-hidden="true"
        />
        <span className="min-w-0 truncate">{label}</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
        isZero ? "text-foreground font-medium" : "text-muted-foreground",
        className,
      )}
      data-testid="reports-remaining-meter"
      data-remaining={remaining}
      role="status"
      aria-label={label}
    >
      <FileText
        className={cn("h-4 w-4 shrink-0", isZero ? "text-warning" : "text-primary")}
        aria-hidden="true"
      />
      <span className="min-w-0 truncate">{label}</span>
    </div>
  );
}
