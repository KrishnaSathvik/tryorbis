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
