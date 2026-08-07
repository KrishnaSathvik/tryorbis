import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { NextStepActionId } from "@/lib/nextStepContent";

export type { NextStepActionId };

export type NextStepAction = {
  id: NextStepActionId;
  label: string;
  onSelect: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
};

export type NextStepCardProps = {
  title?: string;
  /**
   * Unique accessible landmark name when multiple cards can appear together.
   * Visible heading stays `title`; this only affects the section's accessible name.
   */
  landmarkLabel?: string;
  rationale: string;
  primaryAction: NextStepAction;
  secondaryActions?: NextStepAction[];
  className?: string;
};

function dedupeActions(
  primary: NextStepAction,
  secondary: NextStepAction[],
): { primary: NextStepAction; secondary: NextStepAction[] } {
  const seen = new Set<NextStepActionId>([primary.id]);
  const uniqueSecondary: NextStepAction[] = [];
  for (const action of secondary.slice(0, 2)) {
    if (seen.has(action.id)) continue;
    seen.add(action.id);
    uniqueSecondary.push(action);
  }
  return { primary, secondary: uniqueSecondary };
}

export function NextStepCard({
  title = "Recommended next step",
  landmarkLabel,
  rationale,
  primaryAction,
  secondaryActions = [],
  className,
}: NextStepCardProps) {
  const headingId = useId();
  const { primary, secondary } = dedupeActions(primaryAction, secondaryActions);
  const [pendingId, setPendingId] = useState<NextStepActionId | null>(null);
  const pendingLockRef = useRef(false);
  const sectionLabel = landmarkLabel ?? title;

  const runAction = async (action: NextStepAction) => {
    if (action.disabled || action.loading || pendingLockRef.current) return;
    pendingLockRef.current = true;
    setPendingId(action.id);
    track("next_step_click", { action: action.id });
    try {
      await action.onSelect();
    } catch {
      // Page handlers own user-facing errors; reset pending so the card stays usable.
    } finally {
      pendingLockRef.current = false;
      setPendingId(null);
    }
  };

  const isBusy = (action: NextStepAction) =>
    Boolean(action.loading) || pendingId === action.id;

  return (
    <section
      aria-label={sectionLabel}
      className={cn(
        "rounded-2xl border border-border/60 bg-secondary/30 px-5 py-4 space-y-3",
        className,
      )}
    >
      <div className="space-y-1">
        <h2
          id={headingId}
          className="text-sm font-semibold font-nunito tracking-tight"
        >
          {title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{rationale}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-full sm:w-auto w-full"
          disabled={primary.disabled || isBusy(primary)}
          aria-busy={isBusy(primary) || undefined}
          onClick={() => {
            void runAction(primary);
          }}
        >
          {primary.label}
        </Button>
        {secondary.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant="outline"
            className="rounded-full sm:w-auto w-full"
            disabled={action.disabled || isBusy(action) || pendingId !== null}
            aria-busy={isBusy(action) || undefined}
            onClick={() => {
              void runAction(action);
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
