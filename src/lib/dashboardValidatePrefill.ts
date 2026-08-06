export interface DashboardValidatePrefill {
  text: string;
  sourceRunId: string;
  sourceIdeaName?: string;
}

export type DashboardValidatePrefillState = {
  dashboardValidatePrefill?: unknown;
  [key: string]: unknown;
};

export function parseDashboardValidatePrefill(
  value: unknown,
): DashboardValidatePrefill | null {
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
  return { text, sourceRunId, sourceIdeaName };
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
