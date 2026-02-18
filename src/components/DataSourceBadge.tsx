import { cn } from "@/lib/utils";
import { BookOpen, Sparkles } from "lucide-react";

type DataSourceType = "sourced" | "estimated";

interface DataSourceBadgeProps {
  type: DataSourceType;
  className?: string;
}

export function DataSourceBadge({ type, className }: DataSourceBadgeProps) {
  const isSourced = type === "sourced";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
        isSourced
          ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
          : "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
        className
      )}
    >
      {isSourced ? (
        <BookOpen className="h-2.5 w-2.5" />
      ) : (
        <Sparkles className="h-2.5 w-2.5" />
      )}
      {isSourced ? "Sourced" : "Estimated"}
    </span>
  );
}
