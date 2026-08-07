/** Pure helpers for determining whether an idea is already in the backlog. */

export function normalizeIdeaName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
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
 * Precedence: stable source_id match when candidate provides one,
 * otherwise exact normalized idea-name match.
 */
export function isIdeaSavedInBacklog(
  items: BacklogMatchItem[],
  candidate: IdeaSaveCandidate,
): boolean {
  const sourceId =
    typeof candidate.sourceId === "string" ? candidate.sourceId.trim() : "";
  if (sourceId) {
    return items.some(
      (item) =>
        typeof item.source_id === "string" &&
        item.source_id.trim() === sourceId,
    );
  }

  const name = normalizeIdeaName(candidate.ideaName);
  if (!name) return false;
  return items.some(
    (item) =>
      typeof item.idea_name === "string" &&
      normalizeIdeaName(item.idea_name) === name,
  );
}
