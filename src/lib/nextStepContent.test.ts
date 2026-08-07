import { describe, expect, it } from "vitest";
import {
  askOrbisPrefillForGenerate,
  askOrbisPrefillForValidate,
  generateNextStepContent,
  validateNextStepContent,
  type ValidationVerdict,
} from "./nextStepContent";

describe("generateNextStepContent", () => {
  it("recommends validating the top idea when ideas exist", () => {
    const content = generateNextStepContent({
      topIdeaName: "SQL Buddy",
      ideaCount: 2,
      inHistory: false,
      ideaSaved: false,
    });
    expect(content.rationale).toBe(
      "Validate the strongest idea before investing more time.",
    );
    expect(content.primary).toEqual({
      id: "validate_idea",
      label: 'Validate “SQL Buddy”',
    });
    expect(content.secondary.map((a) => a.id)).toEqual([
      "save_idea",
      "ask_orbis",
    ]);
  });

  it("shows Ask Orbis recovery when there are no ideas", () => {
    const content = generateNextStepContent({
      topIdeaName: null,
      ideaCount: 0,
      inHistory: false,
      ideaSaved: false,
    });
    expect(content.rationale).toBe(
      "The research found the problem space, but it needs a sharper concept.",
    );
    expect(content.primary).toEqual({
      id: "ask_orbis",
      label: "Ask Orbis for stronger ideas",
    });
    expect(content.secondary).toEqual([]);
  });

  it("swaps Save for View saved ideas when already saved", () => {
    const content = generateNextStepContent({
      topIdeaName: "Alpha",
      ideaCount: 1,
      inHistory: false,
      ideaSaved: true,
    });
    expect(content.secondary.map((a) => a.id)).toEqual([
      "view_saved_ideas",
      "ask_orbis",
    ]);
    expect(content.secondary[0].label).toBe("View saved ideas");
  });

  it("keeps Save + Ask Orbis in History (Generate has no View history action)", () => {
    const content = generateNextStepContent({
      topIdeaName: "Alpha",
      ideaCount: 1,
      inHistory: true,
      ideaSaved: false,
    });
    expect(content.secondary.map((a) => a.id)).toEqual([
      "save_idea",
      "ask_orbis",
    ]);
  });
});

describe("validateNextStepContent", () => {
  const cases: Array<{
    verdict: ValidationVerdict;
    primaryId: string;
    rationale: string;
    primaryLabel: string;
  }> = [
    {
      verdict: "Build",
      primaryId: "save_idea",
      primaryLabel: "Save this idea",
      rationale:
        "The evidence is promising—save this idea and plan the first test.",
    },
    {
      verdict: "Pivot",
      primaryId: "ask_orbis",
      primaryLabel: "Ask Orbis to refine it",
      rationale:
        "The opportunity may work with a narrower audience or a sharper problem.",
    },
    {
      verdict: "Skip",
      primaryId: "ask_orbis",
      primaryLabel: "Ask Orbis for a stronger direction",
      rationale:
        "The current direction is weak—use Orbis to explore a stronger angle.",
    },
  ];

  for (const c of cases) {
    it(`maps ${c.verdict} to the correct primary recommendation`, () => {
      const content = validateNextStepContent({
        verdict: c.verdict,
        inHistory: false,
        ideaSaved: false,
      });
      expect(content.rationale).toBe(c.rationale);
      expect(content.primary).toEqual({
        id: c.primaryId,
        label: c.primaryLabel,
      });
      const ids = [content.primary.id, ...content.secondary.map((a) => a.id)];
      expect(new Set(ids).size).toBe(ids.length);
    });
  }

  it("Build secondary is Ask Orbis + View history", () => {
    const content = validateNextStepContent({
      verdict: "Build",
      inHistory: false,
      ideaSaved: false,
    });
    expect(content.secondary.map((a) => a.id)).toEqual([
      "ask_orbis",
      "view_history",
    ]);
  });

  it("replaces View history with Back to all reports in History", () => {
    const content = validateNextStepContent({
      verdict: "Pivot",
      inHistory: true,
      ideaSaved: false,
    });
    expect(content.secondary.map((a) => a.id)).toContain("back_to_all_reports");
    expect(content.secondary.map((a) => a.id)).not.toContain("view_history");
  });

  it("swaps Save for View saved ideas when saved", () => {
    const build = validateNextStepContent({
      verdict: "Build",
      inHistory: false,
      ideaSaved: true,
    });
    expect(build.primary).toEqual({
      id: "view_saved_ideas",
      label: "View saved ideas",
    });

    const pivot = validateNextStepContent({
      verdict: "Pivot",
      inHistory: false,
      ideaSaved: true,
    });
    expect(pivot.secondary.find((a) => a.id === "view_saved_ideas")?.label).toBe(
      "View saved ideas",
    );
    expect(pivot.secondary.map((a) => a.id)).not.toContain("save_idea");
  });
});

describe("askOrbisPrefill", () => {
  it("returns generate prefills", () => {
    expect(askOrbisPrefillForGenerate({ hasIdeas: true })).toBe(
      "What should I validate first for this idea?",
    );
    expect(askOrbisPrefillForGenerate({ hasIdeas: false })).toBe(
      "Can you suggest stronger ideas based on this research?",
    );
  });

  it("returns verdict-aware validate prefills", () => {
    expect(askOrbisPrefillForValidate("Build")).toBe(
      "What is the best first test for this idea?",
    );
    expect(askOrbisPrefillForValidate("Pivot")).toBe(
      "How should I refine this idea based on the weak points?",
    );
    expect(askOrbisPrefillForValidate("Skip")).toBe(
      "What stronger direction should I explore instead?",
    );
  });
});
