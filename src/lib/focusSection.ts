/**
 * One-time Dashboard / My Ideas focus via router state.
 * Canonical key: focusSection === "my-ideas"
 */

export type FocusSectionId = "my-ideas";

export type FocusSectionRouterState = {
  focusSection?: unknown;
  [key: string]: unknown;
};

export function parseFocusSection(value: unknown): FocusSectionId | null {
  return value === "my-ideas" ? "my-ideas" : null;
}

export function consumeFocusSectionState(
  rawState: Record<string, unknown>,
): {
  focusSection: FocusSectionId | null;
  nextState: Record<string, unknown> | null;
} {
  const { focusSection: raw, ...rest } = rawState;
  const focusSection = Object.prototype.hasOwnProperty.call(rawState, "focusSection")
    ? parseFocusSection(raw)
    : null;
  const nextState = Object.keys(rest).length > 0 ? rest : null;
  return { focusSection, nextState };
}
