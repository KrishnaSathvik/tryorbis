/**
 * Formats an ISO timestamp for Dashboard/History cards.
 * Relative within a week; absolute calendar date afterward.
 */
export function formatRelativeTime(
  iso: string,
  now: Date = new Date(),
): { label: string; dateTime: string; valid: boolean } {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) {
    return { label: "Unknown time", dateTime: "", valid: false };
  }

  const dateTime = date.toISOString();
  const diffMs = now.getTime() - date.getTime();

  // Future-skewed (clock skew): treat as very recent
  if (diffMs < 0) {
    if (Math.abs(diffMs) < 60_000) {
      return { label: "Just now", dateTime, valid: true };
    }
    return {
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      dateTime,
      valid: true,
    };
  }

  if (diffMs < 60_000) {
    return { label: "Just now", dateTime, valid: true };
  }
  if (diffMs < 3_600_000) {
    const mins = Math.floor(diffMs / 60_000);
    return { label: `${mins}m ago`, dateTime, valid: true };
  }
  if (diffMs < 86_400_000) {
    const hours = Math.floor(diffMs / 3_600_000);
    return { label: `${hours}h ago`, dateTime, valid: true };
  }
  if (diffMs < 7 * 86_400_000) {
    const days = Math.floor(diffMs / 86_400_000);
    return { label: `${days}d ago`, dateTime, valid: true };
  }

  return {
    label: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    }),
    dateTime,
    valid: true,
  };
}
