# ORB-UX-004 — Shared empty-state starter chips

**Date:** 2026-08-06  
**Branch:** `cursor/orb-ux-004-shared-starter-chips`  
**Status:** Implemented (draft PR #7 — merge-readiness corrections applied)  
**Base:** `main` after ORB-UX-003 merge (`8d3201b` / PR #6)

## Previous empty-state behavior

- **Orbis AI:** Four inline suggestion cards that immediately called `sendMessage(text)`. Visible whenever `messages.length === 0 && !isStreaming`, even if the user had typed text or added attachments.
- **Generate / Validate:** Assistant greeting only; no starter prompts. Composers were blank aside from placeholders.

## Shared component API

`src/components/StarterChips.tsx`

```ts
interface StarterChipItem {
  id: string;
  label: string;
  value: string;
  icon?: LucideIcon;
}

interface StarterChipsProps {
  items: StarterChipItem[];
  onSelect: (item: StarterChipItem) => void;
  ariaLabel: string; // always applied as the group accessible name
  disabled?: boolean;
  className?: string;
  heading?: string; // default "Try an example"; pass "" to hide
}
```

Prompt catalogs live in `src/lib/starterChips.ts`. Focus helpers: `src/lib/focusComposer.ts` (`focusComposerAndPlaceCaret`, `scheduleFocusComposerAtEnd`).

## Prompt sets by tool

### Generate
1. Find recurring problems faced by small business owners  
2. Explore painful manual workflows for data teams  
3. Find unmet needs among frequent travelers  
4. Look for frustrating tasks independent creators still do manually  

### Validate
1. An AI trip planner for U.S. national parks  
2. A grocery-list app that organizes items by store aisle  
3. A tool that turns customer-support tickets into product insights  
4. A discovery platform for products built by solo founders  

### Orbis AI (preserved)
1. I have an idea for a SaaS tool — help me think it through  
2. What industries have the most unmet needs right now?  
3. How do I find my first 100 users?  
4. Help me decide between two startup ideas  

## Tool-specific selection behavior

| Tool | Behavior |
| ---- | -------- |
| Generate | Fill composer + schedule focus/caret after the controlled value renders. No AI, research, or credit calls. |
| Validate | Same fill/focus. No AI, validation, or credit calls. |
| Chat | `sendMessage(item.value)` once; streaming guard + `sendingRef` prevent duplicates. |

## Visibility rules

**Generate / Validate:** show when chat phase, no user messages, empty composer, no attachments, not typing, voice not listening, no research params. Hide on type, chip select (fills text), attachment, user message, research/results. Clearing the composer (still no user message) restores chips. New Search / New Validation restore the initial state including chips.

**Chat:** show when no messages, not streaming, empty input, no attachments. Hide on type, attachment, send/stream. New Chat clears messages/input/attachments and restores chips.

## Focus and caret timing

Generate/Validate call `scheduleFocusComposerAtEnd(() => inputRef.current, item.value)` after `setInputValue`. The helper polls via `requestAnimationFrame` until the mounted control’s DOM value matches the expected prompt, then focuses with `preventScroll: true` and sets `selectionStart`/`selectionEnd` to the prompt length. Pending work is cancelled on unmount or superseded selection. Does not touch router state or `useFocusComposerOnArrive`.

Browser-verified: selecting a chip then typing appends at the end (not the start).

## Chat send lock lifecycle

`sendMessage` acquires `sendingRef` + `isStreaming` immediately after guards, then runs **one outer `try/finally`** covering:

1. Conversation create/resolve  
2. User-message persistence (`persistMessage` throws on resolved Supabase `{ error }` **and** rejected Promises)  
3. Clear composer draft + attachments **only after** successful user persist  
4. Optimistic local message (only after successful user persist)  
5. Remote stream fetch/consume  
6. Assistant-message persistence (streamed reply stays visible if save fails)  
7. Conversation timestamp update (resolved `{ error }` is non-fatal)

`finally` always sets `sendingRef.current = false` and `setIsStreaming(false)`.

### Persistence failure and retry

If user-message persistence fails (resolved `{ error }` or rejected Promise):

- Toast: `We couldn't send your message. Please try again.` (never raw backend text)
- Remote Chat is not called; no optimistic user bubble
- Input text and attachments are kept / restored
- Starter-chip failure places the starter prompt back into the composer for retry
- Lock releases in `finally`

Assistant persist failure keeps the streamed reply and toasts: `The reply was shown, but it could not be saved to history.`

## Attachment safety

Chips hide when attachments exist; selection never clears attachments. Chat no longer shows suggestions while attachments are present.

## Accessibility

Real `type="button"` chips; group `aria-label` always uses the parent contextual label:

| Tool | Group name |
| ---- | ---------- |
| Generate | Generate idea starters |
| Validate | Validate idea starters |
| Chat | Orbis AI starters |

Visible heading `Try an example` remains on Generate/Validate as ordinary supporting text (not the group name). Chat passes `heading=""`. Decorative icons `aria-hidden`, visible focus rings, Enter/Space via native buttons, `min-h-11` touch targets, disabled state.

## Files changed

| File | Change |
| ---- | ------ |
| `src/components/StarterChips.tsx` | Shared component; contextual `aria-label` |
| `src/components/StarterChips.test.tsx` | Component + a11y tests |
| `src/lib/starterChips.ts` | Prompt catalogs |
| `src/lib/focusComposer.ts` | Sync + scheduled caret helpers |
| `src/lib/focusComposer.test.ts` | Helper timing/cancel tests |
| `src/pages/GenerateIdeas.tsx` | Fill + scheduled caret |
| `src/pages/ValidateIdea.tsx` | Fill + scheduled caret |
| `src/pages/OrbisChat.tsx` | Shared chips + exception-safe send lock |
| `src/pages/*.starters.test.tsx` | Integration tests (lock, caret, labels) |
| `package.json` / lock | `@testing-library/user-event` |
| Docs + screenshots | Implementation note + evidence |

## Tests

```text
npm test                         → 109 passed
npx tsc -p tsconfig.app.json --noEmit
npx eslint src/pages/OrbisChat.tsx src/pages/OrbisChat.starters.test.tsx
npm run build
```

### ESLint (touched files)

- New/starter-only files (`StarterChips*`, `starterChips.ts`, `focusComposer*`, `*.starters.test.tsx`): **clean**
- Established pre-existing failures in untouched lines of `GenerateIdeas.tsx`, `ValidateIdea.tsx`, `OrbisChat.tsx` (mostly `@typescript-eslint/no-explicit-any`, plus existing hooks deps / one `no-empty`). No new violations introduced by this correction pass. Local `catch (err: unknown)` cleanup applied in Chat send path.

## Browser verification

- Generate: four chips → select → INPUT focused; `selectionStart`/`selectionEnd` at prompt length; typing appends at end; no AI request  
- Validate: same fill/focus/caret  
- Chat: select → one remote request; New Chat restores chips  
- Desktop, mobile 390, dark mode  

### Screenshot / evidence paths

`docs/uiux-audit-assets/implementation/orb-ux-004/`

- `generate-starter-chips-desktop.png`
- `generate-starter-selected-focused.png`
- `generate-starter-caret-at-end.png`
- `validate-starter-chips-desktop.png`
- `validate-starter-selected-focused.png`
- `validate-starter-caret-at-end.png`
- `chat-shared-starter-chips.png`
- `chat-starter-message-sent.png`
- `mobile-generate-starter-chips.png`
- `mobile-validate-starter-chips.png`
- `mobile-generate-starter-caret.png`
- `dark-mode-starter-chips.png`
- `dark-mode-starter-caret.png`
- `starter-chip-focus-state.png`
- `contextual-starter-group-label.md`

## Limitations

- Generate/Validate “reset restores chips” is covered via clear-input / remount paths in unit tests; New Search/New Validation restore via existing `resetChat` returning to the initial assistant-only state.
- Chat streaming still depends on the remote `orbis-chat` function for live responses (tests mock fetch).
- Persistence-failure retry is covered by integration tests for both rejected insert Promises and resolved `{ data: null, error }` Supabase shapes, including draft/attachment preservation.

## Deferred analytics events

No product analytics (ORB-UX-008).

## Explicit scope exclusions

Dashboard resume, NextStepCard, analytics, landing prompt, Idea Workspace, export, billing, schema, quota changes, sidebar regrouping, ORB-UX-005+.
