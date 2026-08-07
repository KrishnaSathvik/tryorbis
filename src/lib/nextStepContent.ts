export type NextStepActionId =
  | "validate_idea"
  | "save_idea"
  | "ask_orbis"
  | "view_history"
  | "view_saved_ideas"
  | "back_to_all_reports";

export type NextStepContentAction = {
  id: NextStepActionId;
  label: string;
};

export type NextStepContent = {
  rationale: string;
  primary: NextStepContentAction;
  secondary: NextStepContentAction[];
};

export type ValidationVerdict = "Build" | "Pivot" | "Skip";

function saveOrViewSaved(ideaSaved: boolean): NextStepContentAction {
  return ideaSaved
    ? { id: "view_saved_ideas", label: "View saved ideas" }
    : { id: "save_idea", label: "Save idea" };
}

function historyOrBack(inHistory: boolean): NextStepContentAction {
  return inHistory
    ? { id: "back_to_all_reports", label: "Back to all reports" }
    : { id: "view_history", label: "View history" };
}

export function generateNextStepContent(input: {
  topIdeaName: string | null;
  ideaCount: number;
  inHistory: boolean;
  ideaSaved: boolean;
}): NextStepContent {
  if (input.ideaCount <= 0 || !input.topIdeaName) {
    return {
      rationale:
        "The research found the problem space, but it needs a sharper concept.",
      primary: {
        id: "ask_orbis",
        label: "Ask Orbis for stronger ideas",
      },
      secondary: [],
    };
  }

  return {
    rationale: "Validate the strongest idea before investing more time.",
    primary: {
      id: "validate_idea",
      label: `Validate “${input.topIdeaName}”`,
    },
    secondary: [
      saveOrViewSaved(input.ideaSaved),
      { id: "ask_orbis", label: "Ask Orbis" },
    ],
  };
}

export function validateNextStepContent(input: {
  verdict: ValidationVerdict;
  inHistory: boolean;
  ideaSaved: boolean;
}): NextStepContent {
  const historyAction = historyOrBack(input.inHistory);
  const saveAction = saveOrViewSaved(input.ideaSaved);
  const savePrimary: NextStepContentAction = input.ideaSaved
    ? { id: "view_saved_ideas", label: "View saved ideas" }
    : { id: "save_idea", label: "Save this idea" };

  switch (input.verdict) {
    case "Build":
      return {
        rationale:
          "The evidence is promising—save this idea and plan the first test.",
        primary: savePrimary,
        secondary: [
          { id: "ask_orbis", label: "Ask Orbis" },
          historyAction,
        ],
      };
    case "Pivot":
      return {
        rationale:
          "The opportunity may work with a narrower audience or a sharper problem.",
        primary: {
          id: "ask_orbis",
          label: "Ask Orbis to refine it",
        },
        secondary: [saveAction, historyAction],
      };
    case "Skip":
      return {
        rationale:
          "The current direction is weak—use Orbis to explore a stronger angle.",
        primary: {
          id: "ask_orbis",
          label: "Ask Orbis for a stronger direction",
        },
        secondary: [saveAction, historyAction],
      };
    default: {
      const _exhaustive: never = input.verdict;
      return _exhaustive;
    }
  }
}

export function askOrbisPrefillForGenerate(input: {
  hasIdeas: boolean;
}): string {
  return input.hasIdeas
    ? "What should I validate first for this idea?"
    : "Can you suggest stronger ideas based on this research?";
}

export function askOrbisPrefillForValidate(verdict: ValidationVerdict): string {
  switch (verdict) {
    case "Build":
      return "What is the best first test for this idea?";
    case "Pivot":
      return "How should I refine this idea based on the weak points?";
    case "Skip":
      return "What stronger direction should I explore instead?";
    default: {
      const _exhaustive: never = verdict;
      return _exhaustive;
    }
  }
}
