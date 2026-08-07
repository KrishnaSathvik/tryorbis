import { NextStepCard, type NextStepAction } from "@/components/NextStepCard";
import {
  generateNextStepContent,
  validateNextStepContent,
  type NextStepActionId,
  type ValidationVerdict,
} from "@/lib/nextStepContent";

type SharedHandlers = {
  onValidateIdea?: () => void | Promise<void>;
  onSaveIdea?: () => void | Promise<void>;
  onAskOrbis?: () => void | Promise<void>;
  onViewHistory?: () => void | Promise<void>;
  onViewSavedIdeas?: () => void | Promise<void>;
  onBackToAllReports?: () => void | Promise<void>;
  saveLoading?: boolean;
};

function resolveHandler(
  id: NextStepActionId,
  handlers: SharedHandlers,
): (() => void | Promise<void>) | undefined {
  switch (id) {
    case "validate_idea":
      return handlers.onValidateIdea;
    case "save_idea":
      return handlers.onSaveIdea;
    case "ask_orbis":
      return handlers.onAskOrbis;
    case "view_history":
      return handlers.onViewHistory;
    case "view_saved_ideas":
      return handlers.onViewSavedIdeas;
    case "back_to_all_reports":
      return handlers.onBackToAllReports;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function toActions(
  content: ReturnType<typeof generateNextStepContent>,
  handlers: SharedHandlers,
): { primary: NextStepAction; secondary: NextStepAction[] } | null {
  const primaryHandler = resolveHandler(content.primary.id, handlers);
  if (!primaryHandler) return null;

  const primary: NextStepAction = {
    id: content.primary.id,
    label: content.primary.label,
    onSelect: primaryHandler,
    loading: content.primary.id === "save_idea" ? handlers.saveLoading : undefined,
  };

  const secondary: NextStepAction[] = [];
  for (const item of content.secondary) {
    const handler = resolveHandler(item.id, handlers);
    if (!handler) continue;
    secondary.push({
      id: item.id,
      label: item.label,
      onSelect: handler,
      loading: item.id === "save_idea" ? handlers.saveLoading : undefined,
    });
  }

  return { primary, secondary };
}

export function GenerateNextStepCard({
  topIdeaName,
  ideaCount,
  inHistory,
  ideaSaved,
  handlers,
}: {
  topIdeaName: string | null;
  ideaCount: number;
  inHistory: boolean;
  ideaSaved: boolean;
  handlers: SharedHandlers;
}) {
  const content = generateNextStepContent({
    topIdeaName,
    ideaCount,
    inHistory,
    ideaSaved,
  });
  const actions = toActions(content, handlers);
  if (!actions) return null;
  return (
    <NextStepCard
      rationale={content.rationale}
      primaryAction={actions.primary}
      secondaryActions={actions.secondary}
    />
  );
}

export function ValidateNextStepCard({
  verdict,
  inHistory,
  ideaSaved,
  handlers,
}: {
  verdict: ValidationVerdict;
  inHistory: boolean;
  ideaSaved: boolean;
  handlers: SharedHandlers;
}) {
  const content = validateNextStepContent({ verdict, inHistory, ideaSaved });
  const actions = toActions(content, handlers);
  if (!actions) return null;
  return (
    <NextStepCard
      rationale={content.rationale}
      primaryAction={actions.primary}
      secondaryActions={actions.secondary}
    />
  );
}
