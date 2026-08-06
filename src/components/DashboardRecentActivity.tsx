import { Lightbulb, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VerdictBadge } from "@/components/VerdictBadge";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { DashboardActivityItem } from "@/lib/dashboardOverview";
import {
  buildValidatePrefillText,
  historyItemQuery,
} from "@/lib/dashboardValidatePrefill";
import { cn } from "@/lib/utils";

interface DashboardRecentActivityProps {
  items: DashboardActivityItem[];
  onNavigate: (to: string, options?: { state?: unknown }) => void;
}

function isVerdict(
  value: string | null,
): value is "Build" | "Pivot" | "Skip" {
  return value === "Build" || value === "Pivot" || value === "Skip";
}

export function DashboardRecentActivity({
  items,
  onNavigate,
}: DashboardRecentActivityProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="dashboard-resume-heading" className="space-y-4">
      <div>
        <h2
          id="dashboard-resume-heading"
          className="text-xl font-semibold font-nunito tracking-tight"
        >
          Pick up where you left off
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Continue your latest research or move an idea forward.
        </p>
      </div>

      <ul className="space-y-3 list-none p-0 m-0">
        {items.map((item, index) => {
          const isNewest = index === 0;
          const time = formatRelativeTime(item.createdAt);
          const historyPath = `/history?${historyItemQuery(
            item.kind === "generator" ? "generator" : "validation",
            item.id,
          )}`;

          const typeLabel =
            item.kind === "generator" ? "Idea discovery" : "Validation";
          const TypeIcon =
            item.kind === "generator" ? Lightbulb : ClipboardCheck;

          let primaryLabel = "View research";
          let primaryAction = () => onNavigate(historyPath);
          let primaryAria = `${primaryLabel}: ${item.title}`;

          if (isNewest && item.kind === "generator" && item.topIdea) {
            const text = buildValidatePrefillText(item.topIdea);
            primaryLabel = "Validate this idea";
            primaryAria = `Validate this idea: ${item.topIdea.name}`;
            primaryAction = () =>
              onNavigate("/validate", {
                state: {
                  dashboardValidatePrefill: {
                    text,
                    sourceRunId: item.id,
                    sourceIdeaName: item.topIdea!.name,
                  },
                },
              });
          } else if (isNewest && item.kind === "validation") {
            primaryLabel = "Continue";
            primaryAria = `Continue reviewing: ${item.title}`;
            primaryAction = () => onNavigate(historyPath);
          } else if (item.kind === "validation") {
            primaryLabel = "View report";
            primaryAria = `View report: ${item.title}`;
            primaryAction = () => onNavigate(historyPath);
          }

          const showSecondaryHistory =
            isNewest &&
            item.kind === "generator" &&
            Boolean(item.topIdea);

          return (
            <li key={`${item.kind}:${item.id}`}>
              <article
                className={cn(
                  "rounded-2xl border border-border/50 bg-card",
                  isNewest && "ring-1 ring-primary/15",
                )}
                aria-labelledby={`dashboard-activity-title-${item.kind}-${item.id}`}
              >
                <Card className="border-0 shadow-none bg-transparent">
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 shadow-sm"
                        aria-hidden="true"
                      >
                        <TypeIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                            {typeLabel}
                          </span>
                          {isNewest && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                              Recommended next
                            </span>
                          )}
                        </div>
                        <h3
                          id={`dashboard-activity-title-${item.kind}-${item.id}`}
                          className="text-sm font-semibold truncate"
                          title={item.title}
                        >
                          {item.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          {time.valid ? (
                            <time dateTime={time.dateTime}>{time.label}</time>
                          ) : (
                            <span>{time.label}</span>
                          )}
                          {item.kind === "generator" && (
                            <span className="truncate">{item.contextLabel}</span>
                          )}
                          {item.kind === "validation" &&
                            isVerdict(item.verdict) && (
                              <VerdictBadge verdict={item.verdict} />
                            )}
                          {item.kind === "validation" &&
                            item.overallScore !== null && (
                              <span>Score {item.overallScore}</span>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full min-h-9"
                        onClick={primaryAction}
                        aria-label={primaryAria}
                      >
                        {primaryLabel}
                      </Button>
                      {showSecondaryHistory && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-full min-h-9"
                          onClick={() => onNavigate(historyPath)}
                          aria-label={`View research: ${item.title}`}
                        >
                          View research
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
