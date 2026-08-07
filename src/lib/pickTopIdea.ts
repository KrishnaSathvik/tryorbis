export function pickTopIdea<T extends { name?: string; demandScore?: number }>(
  ideas: T[] | null | undefined,
): T | null {
  if (!ideas || ideas.length === 0) return null;
  return [...ideas].sort(
    (a, b) => (b.demandScore || 0) - (a.demandScore || 0),
  )[0] ?? null;
}
