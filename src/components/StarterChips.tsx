import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarterChipItem {
  id: string;
  label: string;
  value: string;
  icon?: LucideIcon;
}

export interface StarterChipsProps {
  items: StarterChipItem[];
  onSelect: (item: StarterChipItem) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  heading?: string;
}

/**
 * Shared empty-state starter prompts. Parents own selection side effects.
 */
export function StarterChips({
  items,
  onSelect,
  ariaLabel,
  disabled = false,
  className,
  heading = "Try an example",
}: StarterChipsProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("w-full space-y-2.5", className)}>
      {heading ? (
        <p className="text-xs font-medium text-muted-foreground">
          {heading}
        </p>
      ) : null}
      <div
        role="group"
        aria-label={ariaLabel}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(item)}
              className={cn(
                "group text-left text-[13px] leading-snug px-4 py-3.5 min-h-11 rounded-2xl border border-border/40 bg-background/80 text-muted-foreground",
                "hover:text-foreground hover:border-primary/25 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              {Icon ? (
                <Icon
                  className="h-4 w-4 text-primary/60 group-hover:text-primary mb-2 transition-colors"
                  aria-hidden="true"
                />
              ) : null}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
