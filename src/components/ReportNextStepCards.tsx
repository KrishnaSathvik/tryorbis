import { NextStepCard, type NextStepAction } from "@/components/NextStepCard";
import {
  generateNextStepContent,
  validateNextStepContent,
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
  id: string,
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
    default:
      return undefined;
  }
}

function toActions(
  content: ReturnType<typeof generateNextStepContent>,
  handlers: SharedHandlers,
): { primary: NextStepAction; secondary: NextStepAction[] } {
  const mapOne = (item: { id: NextStepAction["id"]; label: string }): NextStepAction => ({
    id: item.id,
    label: item.label,
    onSelect: resolveHandler(item.id, handlers) ?? (() => undefined),
    loading: item.id === "save_idea" ? handlers.saveLoading : undefined,
  });
  return {
    primary: mapOne(content.primary),
    secondary: content.secondary.map(mapOne),
  };
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
  const { primary, secondary } = toActions(content, handlers);
  return (
    <NextStepCard
      rationale={content.rationale}
      primaryAction={primary}
      secondaryActions={secondary}
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
  const { primary, secondary } = toActions(content, handlers);
  return (
    <NextStepCard
      rationale={content.rationale}
      primaryAction={primary}
      secondaryActions={secondary}
    />
  );
}
