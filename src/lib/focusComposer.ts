/** Focus a text control and place the caret at the end without submitting. */
export function focusComposerAndPlaceCaret(
  el: HTMLInputElement | HTMLTextAreaElement | null,
): void {
  if (!el) return;
  el.focus({ preventScroll: true });
  const len = el.value.length;
  try {
    el.setSelectionRange(len, len);
  } catch {
    // Some input types disallow selection range
  }
}

/**
 * After a controlled value update, wait until the mounted element reflects
 * `expectedValue`, then focus and place the caret at the end.
 * Returns a cancel function for unmount / superseded selections.
 */
export function scheduleFocusComposerAtEnd(
  getEl: () => HTMLInputElement | HTMLTextAreaElement | null,
  expectedValue: string,
): () => void {
  let cancelled = false;
  let rafId = 0;
  let attempts = 0;
  const maxAttempts = 24;

  const tick = () => {
    if (cancelled) return;
    const el = getEl();
    if (el && el.value === expectedValue) {
      focusComposerAndPlaceCaret(el);
      return;
    }
    attempts += 1;
    if (attempts >= maxAttempts) return;
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}
