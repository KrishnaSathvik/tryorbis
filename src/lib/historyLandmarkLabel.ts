/**
 * Human-readable History instance stamp for accessible landmark uniqueness
 * when multiple reports share the same idea / persona / category.
 */
export function formatHistoryInstanceStamp(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) {
    return "unknown date";
  }
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Append an instance stamp so landmark names stay unique across History rows. */
export function withHistoryInstance(baseLabel: string, dateIso: string): string {
  return `${baseLabel} — ${formatHistoryInstanceStamp(dateIso)}`;
}
