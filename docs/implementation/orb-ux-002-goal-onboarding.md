# ORB-UX-002 — Goal-based onboarding routing

**Date:** 2026-08-06  
**Branch:** `cursor/orb-ux-002-goal-onboarding`  
**Status:** Implemented (merge-ready after 001A rebase + corrections)  
**Base:** `main` includes merged ORB-UX-001A (`15acf1d` / PR #5)

## ORB-UX-001A integration

PR #4 was rebased onto `main` after PR #5 merged shared credit state. Generate/Validate retain:

- Shared `CreditsProvider` / `useCredits()` context
- `creditsLoading` / `creditsUnavailable` research guards
- Existing `refreshCredits()` call sites
- `useFocusComposerOnArrive()` for onboarding focus

## Previous onboarding behavior

`OnboardingTour` showed a 5-step informational card on `/dashboard` for first-time users. Steps declared unused `route` values but **never navigated**. Completion used a single browser-global key `orbis_onboarding_complete`. Skip/close set that key and stayed on (or returned to) Dashboard. The overlay was a custom `div`, not a dialog with focus trap semantics.

## New goal choices

Heading: **What do you want to do first?**  
Supporting: **Choose a starting point. You can use every tool later.**

| Goal | Route |
| ---- | ----- |
| Find product ideas | `/generate` |
| Validate an idea | `/validate` |
| Talk to Orbis AI | `/chat` |
| Skip | Stay on `/dashboard` |

Selecting a goal persists completion, closes the dialog, navigates immediately, and requests one-time composer focus. No extra Continue step.

## Completion-storage strategy

- **Scoped key:** `orbis_onboarding_complete:<user-id>`
- **Legacy key:** `orbis_onboarding_complete`

### One-time migration

1. Scoped value `"true"` → return `true`. If a leftover legacy key remains, remove it so later accounts are not suppressed.
2. Scoped absent + legacy `"true"` → write scoped completion for the **current** user, remove the legacy key, return `true`.
3. Neither → return `false`.
4. Storage errors → fail gracefully (read `false` / write no-op); navigation is never blocked.

Account isolation is only complete after the legacy key is removed by migration (or leftover cleanup).

Helpers live in `src/lib/onboardingStorage.ts`.

## Destination-focus mechanism

Navigation state may include `{ focusComposer: true, ...other }`.

`useFocusComposerOnArrive(ref)` on Generate, Validate, and Orbis Chat:

1. Detects `focusComposer`
2. Focuses the composer (`preventScroll: true`)
3. `replace`s the same `pathname` + `search` + `hash` with remaining state only (`focusComposer` stripped; empty remaining → `null`)

Skip restores focus to `#dashboard-welcome` via dialog `onCloseAutoFocus`.

## Dialog dismissal

- Visible **Skip** is the secondary escape
- Built-in X is hidden via `DialogContent showCloseButton={false}` (default remains `true` for other dialogs)
- Escape / overlay dismiss behave like Skip (persist + stay on Dashboard)

## Accessibility

- Radix/shadcn `Dialog` with `DialogTitle` + `DialogDescription`
- Goal choices are real `<button>` elements with `aria-describedby`
- Focus trap / restore handled by Radix; destination focus after goal selection

## Files changed

| File | Change |
| ---- | ------ |
| `src/components/OnboardingTour.tsx` | Goal dialog; `showCloseButton={false}` |
| `src/components/OnboardingTour.test.tsx` | Routing / storage / a11y / Skip-only tests |
| `src/lib/onboardingStorage.ts` | User-scoped storage + one-time legacy migration |
| `src/hooks/useFocusComposerOnArrive.ts` | One-time focus; preserve unrelated state/hash |
| `src/hooks/useFocusComposerOnArrive.test.tsx` | Focus + state-preservation tests |
| `src/components/ui/dialog.tsx` | Optional `showCloseButton` |
| `src/components/ui/dialog.showCloseButton.test.tsx` | Default vs hidden close control |
| `src/pages/GenerateIdeas.tsx` | Focus hook + 001A credits guards |
| `src/pages/ValidateIdea.tsx` | Focus hook + 001A credits guards |
| `src/pages/OrbisChat.tsx` | Focus hook |
| `src/pages/Dashboard.tsx` | `#dashboard-welcome` focus restore target |
| `docs/uiux-audit-assets/implementation/orb-ux-002/*` | Browser evidence |
| `docs/implementation/orb-ux-002-goal-onboarding.md` | This record |

## Tests run (combined branch after rebase)

```text
npm test
npx tsc -p tsconfig.app.json --noEmit
npx eslint <correction-touched modules>
npm run build
```

**45/45** vitest tests passed (includes CreditsProvider + meter + onboarding + dialog); `tsc` clean; eslint clean on correction-touched modules; build succeeded.

## Browser verification

| Flow | Result |
| ---- | ------ |
| A Find ideas → `/generate` + composer focus; Back does not reopen | Pass |
| B Validate → `/validate` + focus | Pass |
| C Orbis AI → `/chat` + focus | Pass |
| D Skip → Dashboard, welcome focused, reload no reopen | Pass |
| Mobile 390 + dark mode dialog | Pass |
| No Close X; Skip only | Pass (post-correction) |

## Screenshots

- `docs/uiux-audit-assets/implementation/orb-ux-002/desktop-goal-onboarding.png`
- `docs/uiux-audit-assets/implementation/orb-ux-002/mobile-goal-onboarding.png`
- `docs/uiux-audit-assets/implementation/orb-ux-002/dark-mode-goal-onboarding.png`
- `docs/uiux-audit-assets/implementation/orb-ux-002/generate-after-goal-selection.png`
- `docs/uiux-audit-assets/implementation/orb-ux-002/validate-after-goal-selection.png`
- `docs/uiux-audit-assets/implementation/orb-ux-002/chat-after-goal-selection.png`
- `docs/uiux-audit-assets/implementation/orb-ux-002/dashboard-after-skip.png`
- `docs/uiux-audit-assets/implementation/orb-ux-002/goal-card-focus-state.png`

## Limitations

- Analytics events for goal/skip remain deferred.
- Dual-account browser matrix for legacy migration is covered primarily by unit tests.

## Intentionally excluded follow-ups

ORB-UX-003 post-quota continuation, starter chips, dashboard resume, landing prompt, Idea Workspace, sidebar regrouping, billing/schema.
