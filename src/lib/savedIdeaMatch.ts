/** Pure helpers for determining whether an idea is already in the backlog. */

export function normalizeIdeaName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Idea-level source reference for Generator History backlog rows.
 * A generator run contains multiple ideas, so bare runId is too broad.
 */
export function generatorIdeaSourceId(
  runId: string,
  idea: { id?: string; name: string },
): string {
  const ideaId = typeof idea.id === "string" ? idea.id.trim() : "";

  if (ideaId) {
    return `${runId}:idea:${ideaId}`;
  }

  return `${runId}:name:${normalizeIdeaName(idea.name)}`;
}

function normalizeSourceId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export type BacklogMatchItem = {
  idea_name?: string | null;
  source_id?: string | null;
};

export type IdeaSaveCandidate = {
  ideaName: string;
  sourceId?: string | null;
};

/**
 * Precedence:
 * 1. Exact source_id match when candidate provides one
 * 2. Else if candidate has sourceId, name-match only legacy rows with empty source_id
 * 3. Else exact normalized idea-name match
 */
export function isIdeaSavedInBacklog(
  items: BacklogMatchItem[],
  candidate: IdeaSaveCandidate,
): boolean {
  const candidateSourceId = normalizeSourceId(candidate.sourceId);
  const name = normalizeIdeaName(candidate.ideaName);

  if (candidateSourceId) {
    if (
      items.some(
        (item) => normalizeSourceId(item.source_id) === candidateSourceId,
      )
    ) {
      return true;
    }
    if (!name) return false;
    return items.some(
      (item) =>
        !normalizeSourceId(item.source_id) &&
        normalizeIdeaName(item.idea_name ?? "") === name,
    );
  }

  if (!name) return false;
  return items.some(
    (item) => normalizeIdeaName(item.idea_name ?? "") === name,
  );
}
