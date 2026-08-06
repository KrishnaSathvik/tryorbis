# ORB-UX-004 — Shared empty-state starter chips

**Date:** 2026-08-06  
**Branch:** `cursor/orb-ux-004-shared-starter-chips`  
**Status:** Implemented (draft PR)  
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
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  heading?: string; // default "Try an example"; pass "" to hide
}
```

Prompt catalogs live in `src/lib/starterChips.ts`. Focus helper: `src/lib/focusComposer.ts`.

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
| Generate | Fill composer + focus + caret at end. No AI, research, or credit calls. |
| Validate | Same fill/focus. No AI, validation, or credit calls. |
| Chat | `sendMessage(item.value)` once; streaming guard + `sendingRef` prevent duplicates. |

## Visibility rules

**Generate / Validate:** show when chat phase, no user messages, empty composer, no attachments, not typing, voice not listening, no research params. Hide on type, chip select (fills text), attachment, user message, research/results. Clearing the composer (still no user message) restores chips. New Search / New Validation restore the initial state including chips.

**Chat:** show when no messages, not streaming, empty input, no attachments. Hide on type, attachment, send/stream. New Chat clears messages/input/attachments and restores chips.

## Focus behavior

`focusComposerAndPlaceCaret` focuses the existing input/textarea with `preventScroll: true` and places the caret at the end. Does not touch router state or `useFocusComposerOnArrive`.

## Attachment safety

Chips hide when attachments exist; selection never clears attachments. Chat no longer shows suggestions while attachments are present.

## Accessibility

Real `type="button"` chips, group labeling via heading / `aria-label`, decorative icons `aria-hidden`, visible focus rings, Enter/Space via native buttons, `min-h-11` touch targets, disabled state.

## Files changed

| File | Change |
| ---- | ------ |
| `src/components/StarterChips.tsx` | Shared component |
| `src/components/StarterChips.test.tsx` | Component tests |
| `src/lib/starterChips.ts` | Prompt catalogs |
| `src/lib/focusComposer.ts` | Focus helper |
| `src/pages/GenerateIdeas.tsx` | Fill/focus starters |
| `src/pages/ValidateIdea.tsx` | Fill/focus starters |
| `src/pages/OrbisChat.tsx` | Shared chips + send-once guards + New Chat clears input/attachments |
| `src/pages/*.starters.test.tsx` | Integration tests |
| `package.json` / lock | `@testing-library/user-event` |
| Docs + screenshots | Implementation note + evidence |

## Tests

```text
npm test                         → 95 passed
npx tsc -p tsconfig.app.json --noEmit
npx eslint <new source/test files>
npm run build
```

## Browser verification

- Generate: four chips → select → INPUT focused with prompt text; no AI request  
- Validate: same fill/focus  
- Chat: select → one user message; New Chat restores chips  
- Desktop, mobile 390, dark mode screenshots  

### Screenshot paths

`docs/uiux-audit-assets/implementation/orb-ux-004/`

- `generate-starter-chips-desktop.png`
- `generate-starter-selected-focused.png`
- `validate-starter-chips-desktop.png`
- `validate-starter-selected-focused.png`
- `chat-shared-starter-chips.png`
- `chat-starter-message-sent.png`
- `mobile-generate-starter-chips.png`
- `mobile-validate-starter-chips.png`
- `dark-mode-starter-chips.png`
- `starter-chip-focus-state.png`

## Limitations

- Generate/Validate “reset restores chips” is covered via clear-input / remount paths in unit tests; New Search/New Validation restore via existing `resetChat` returning to the initial assistant-only state.
- Chat streaming still depends on the remote `orbis-chat` function for live responses (tests mock fetch).

## Deferred analytics events

No product analytics (ORB-UX-008).

## Explicit scope exclusions

Dashboard resume, NextStepCard, analytics, landing prompt, Idea Workspace, export, billing, schema, quota changes, sidebar regrouping, ORB-UX-005+.
