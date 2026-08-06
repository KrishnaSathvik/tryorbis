/** Confirmed zero free research reports — never treat loading/unavailable as exhausted. */
export function isQuotaExhausted(state: {
  remaining: number | null | undefined;
  loading: boolean;
  unavailable: boolean;
}): boolean {
  return (
    !state.loading &&
    !state.unavailable &&
    state.remaining !== null &&
    state.remaining !== undefined &&
    state.remaining === 0
  );
}
