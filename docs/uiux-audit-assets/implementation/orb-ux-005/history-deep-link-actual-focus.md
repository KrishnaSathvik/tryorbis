# History deep-link actual focus

ORB-UX-005 merge-readiness correction.

## Verification

Automated tests in `src/pages/Reports.deepLink.test.tsx`:

1. Stub `requestAnimationFrame` to run synchronously.
2. Render `/history?item=generator:gen-1` (and validation variant).
3. Assert the matching collapsible trigger becomes `data-state="open"`.
4. Assert `expect(trigger).toHaveFocus()` **without** calling `trigger.focus()` first.
5. Assert `scrollIntoView` was invoked on the matching artifact card.

Manual browser check: open two History items, then deep-link a third; previously open items remain expanded while the target receives scroll + focus.
