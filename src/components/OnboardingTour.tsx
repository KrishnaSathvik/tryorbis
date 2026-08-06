import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lightbulb, ClipboardCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { readOnboardingComplete, writeOnboardingComplete } from "@/lib/onboardingStorage";
import type { FocusComposerState } from "@/hooks/useFocusComposerOnArrive";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

const goals = [
  {
    id: "generate" as const,
    title: "Find product ideas",
    description: "Research real complaints and opportunities, then surface product ideas worth building.",
    icon: Lightbulb,
    path: "/generate",
  },
  {
    id: "validate" as const,
    title: "Validate an idea",
    description: "Check demand, competition, and evidence — then get a Build, Pivot, or Skip verdict.",
    icon: ClipboardCheck,
    path: "/validate",
  },
  {
    id: "chat" as const,
    title: "Talk to Orbis AI",
    description: "Think through an idea, problem, or next step in a focused conversation.",
    icon: Sparkles,
    path: "/chat",
  },
] as const;

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const navigatingAwayRef = useRef(false);
  const lockingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    lockingRef.current = false;
    navigatingAwayRef.current = false;

    if (loading || !userId) {
      setVisible(false);
      return;
    }

    if (location.pathname !== "/dashboard") {
      setVisible(false);
      return;
    }

    setVisible(!readOnboardingComplete(userId));
  }, [location.pathname, loading, userId]);

  const persistComplete = () => {
    writeOnboardingComplete(userId);
  };

  const handleSkip = () => {
    if (lockingRef.current) return;
    lockingRef.current = true;
    navigatingAwayRef.current = false;
    persistComplete();
    track("onboarding_skip");
    setVisible(false);
  };

  const handleGoal = (goal: (typeof goals)[number]) => {
    if (lockingRef.current) return;
    lockingRef.current = true;
    navigatingAwayRef.current = true;
    persistComplete();
    track("onboarding_goal_select", { goal: goal.id });
    setVisible(false);
    const state: FocusComposerState = { focusComposer: true };
    navigate(goal.path, { state });
  };

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) handleSkip();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[min(90vh,40rem)] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-[28px] border-0 p-6 sm:w-full"
        onCloseAutoFocus={(event) => {
          if (navigatingAwayRef.current) {
            event.preventDefault();
            return;
          }
          event.preventDefault();
          const restore = document.getElementById("dashboard-welcome");
          restore?.focus();
        }}
        onEscapeKeyDown={() => {
          navigatingAwayRef.current = false;
        }}
      >
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="font-nunito text-xl">What do you want to do first?</DialogTitle>
          <DialogDescription>
            Choose a starting point. You can use every tool later.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-3" role="group" aria-label="Starting goals">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const descriptionId = `onboarding-goal-${goal.id}-desc`;
            return (
              <button
                key={goal.id}
                type="button"
                aria-describedby={descriptionId}
                onClick={() => handleGoal(goal)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-secondary/40 p-4 text-left transition-all",
                  "hover:border-primary/30 hover:bg-secondary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="block text-sm font-semibold font-nunito text-foreground">{goal.title}</span>
                  <span id={descriptionId} className="block text-sm leading-relaxed text-muted-foreground">
                    {goal.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-1">
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSkip}>
            Skip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
