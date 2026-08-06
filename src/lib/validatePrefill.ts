/**
 * One-time Validate composer prefill via router state.
 * Canonical key: validatePrefill. Legacy dashboardValidatePrefill is still recognized.
 */

export type ValidatePrefill =
  | {
      source: "landing";
      text: string;
    }
  | {
      source: "dashboard";
      text: string;
      sourceRunId: string;
      sourceIdeaName?: string;
    };

export type ValidatePrefillRouterState = {
  validatePrefill?: unknown;
  dashboardValidatePrefill?: unknown;
  [key: string]: unknown;
};

/** True when router state is a plain object safe for `in` / spread. */
export function isRouterStateRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseValidatePrefill(value: unknown): ValidatePrefill | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const text = typeof record.text === "string" ? record.text.trim() : "";
  if (!text) return null;

  if (record.source === "landing") {
    return { source: "landing", text };
  }

  if (record.source === "dashboard") {
    const sourceRunId =
      typeof record.sourceRunId === "string" ? record.sourceRunId.trim() : "";
    if (!sourceRunId) return null;
    const sourceIdeaName =
      typeof record.sourceIdeaName === "string" && record.sourceIdeaName.trim()
        ? record.sourceIdeaName.trim()
        : undefined;
    return { source: "dashboard", text, sourceRunId, sourceIdeaName };
  }

  return null;
}

/** Legacy Dashboard payload without `source` field. */
export function parseLegacyDashboardValidatePrefill(
  value: unknown,
): Extract<ValidatePrefill, { source: "dashboard" }> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const text = typeof record.text === "string" ? record.text.trim() : "";
  const sourceRunId =
    typeof record.sourceRunId === "string" ? record.sourceRunId.trim() : "";
  if (!text || !sourceRunId) return null;
  const sourceIdeaName =
    typeof record.sourceIdeaName === "string" && record.sourceIdeaName.trim()
      ? record.sourceIdeaName.trim()
      : undefined;
  return { source: "dashboard", text, sourceRunId, sourceIdeaName };
}

/** @deprecated Prefer parseLegacyDashboardValidatePrefill / parseValidatePrefill */
export function parseDashboardValidatePrefill(
  value: unknown,
): { text: string; sourceRunId: string; sourceIdeaName?: string } | null {
  const parsed = parseLegacyDashboardValidatePrefill(value);
  if (!parsed) return null;
  return {
    text: parsed.text,
    sourceRunId: parsed.sourceRunId,
    sourceIdeaName: parsed.sourceIdeaName,
  };
}

/**
 * Extract canonical prefill from router state and strip consumed keys.
 * Prefers `validatePrefill`; falls back to legacy `dashboardValidatePrefill`.
 */
export function consumeValidatePrefillState(rawState: Record<string, unknown>): {
  prefill: ValidatePrefill | null;
  nextState: Record<string, unknown> | null;
} {
  const {
    validatePrefill: canonicalRaw,
    dashboardValidatePrefill: legacyRaw,
    ...rest
  } = rawState;

  let prefill: ValidatePrefill | null = null;
  if (Object.prototype.hasOwnProperty.call(rawState, "validatePrefill")) {
    prefill = parseValidatePrefill(canonicalRaw);
  } else if (
    Object.prototype.hasOwnProperty.call(rawState, "dashboardValidatePrefill")
  ) {
    prefill = parseLegacyDashboardValidatePrefill(legacyRaw);
  }

  const nextState = Object.keys(rest).length > 0 ? rest : null;
  return { prefill, nextState };
}

export function hasValidatePrefillKey(rawState: Record<string, unknown>): boolean {
  return (
    Object.prototype.hasOwnProperty.call(rawState, "validatePrefill") ||
    Object.prototype.hasOwnProperty.call(rawState, "dashboardValidatePrefill")
  );
}

export function buildValidatePrefillText(idea: {
  name: string;
  description?: string;
}): string {
  const name = idea.name.trim();
  const description = idea.description?.trim();
  if (description) return `${name}: ${description}`;
  return name;
}

export function historyItemQuery(
  kind: "generator" | "validation",
  id: string,
): string {
  return `item=${encodeURIComponent(`${kind}:${id}`)}`;
}

export function parseHistoryItemQuery(
  raw: string | null,
): { kind: "generator" | "validation"; id: string } | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const colon = trimmed.indexOf(":");
  if (colon <= 0) return null;
  const kindPart = trimmed.slice(0, colon);
  const id = trimmed.slice(colon + 1).trim();
  if (!id) return null;
  if (kindPart !== "generator" && kindPart !== "validation") return null;
  return { kind: kindPart, id };
}
