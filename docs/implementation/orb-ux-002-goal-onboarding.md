# ORB-UX-002 — Goal-based onboarding routing

**Date:** 2026-08-06  
**Branch:** `cursor/orb-ux-002-goal-onboarding`  
**Status:** Implemented  

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

- **New key:** `orbis_onboarding_complete:<user-id>` (Supabase auth user id, including anonymous guests)
- **Legacy key:** `orbis_onboarding_complete` — if present, treated as completed so existing browsers are not re-onboarded
- **Writes:** only the user-scoped key going forward
- **Storage failure:** read returns false / write no-ops; goal navigation still proceeds

Helpers live in `src/lib/onboardingStorage.ts`.

## Destination-focus mechanism

Navigation state: `{ focusComposer: true }`.

`useFocusComposerOnArrive(ref)` on Generate, Validate, and Orbis Chat:

1. Detects the flag on mount/navigation
2. Focuses the composer (`preventScroll: true`)
3. `replace`s history state to `{}` so refresh / later visits do not keep focusing

Skip restores focus to `#dashboard-welcome` via dialog `onCloseAutoFocus`.

## Accessibility

- Radix/shadcn `Dialog` with `DialogTitle` + `DialogDescription`
- Goal choices are real `<button>` elements with `aria-describedby`
- Skip is a secondary button; dialog Close (built-in) and Escape dismiss consistently with Skip (persist + stay on Dashboard)
- Focus trap / restore handled by Radix; destination focus after goal selection

## Files changed

| File | Change |
| ---- | ------ |
| `src/components/OnboardingTour.tsx` | Goal dialog replacing informational tour |
| `src/components/OnboardingTour.test.tsx` | **New** routing / storage / a11y tests |
| `src/lib/onboardingStorage.ts` | **New** user-scoped + legacy helpers |
| `src/hooks/useFocusComposerOnArrive.ts` | **New** one-time focus hook |
| `src/hooks/useFocusComposerOnArrive.test.tsx` | **New** focus tests |
| `src/pages/GenerateIdeas.tsx` | Consume focus hook |
| `src/pages/ValidateIdea.tsx` | Consume focus hook |
| `src/pages/OrbisChat.tsx` | Consume focus hook |
| `src/pages/Dashboard.tsx` | `#dashboard-welcome` focus restore target |
| `docs/uiux-audit-assets/implementation/orb-ux-002/*` | Browser evidence |
| `docs/implementation/orb-ux-002-goal-onboarding.md` | This record |

## Tests run

```text
npm test
npx tsc -p tsconfig.app.json --noEmit
npx eslint src/components/OnboardingTour.tsx src/components/OnboardingTour.test.tsx src/lib/onboardingStorage.ts src/hooks/useFocusComposerOnArrive.ts src/hooks/useFocusComposerOnArrive.test.tsx
npm run build
```

**29/29** vitest tests passed; `tsc` clean; eslint clean on new modules; build succeeded.

## Browser verification

| Flow | Result |
| ---- | ------ |
| A Find ideas → `/generate` + composer focus; Back does not reopen | Pass |
| B Validate → `/validate` + focus | Pass |
| C Orbis AI → `/chat` + focus | Pass |
| D Skip → Dashboard, welcome focused, reload no reopen | Pass |
| Mobile 390 + dark mode dialog | Pass |

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

- Dialog still includes the shared shadcn Close control in addition to Skip (both dismiss permanently).
- Account isolation across sign-out/sign-in was covered by unit tests; full dual-account browser matrix not recorded as video.
- Does not add analytics events (`onboarding_goal_select` / `onboarding_skip`) — reserved for later analytics plumbing.

## Intentionally excluded follow-ups

ORB-UX-003 post-quota continuation, starter chips, dashboard resume, landing prompt, Idea Workspace, sidebar regrouping, billing/schema, ORB-UX-001A (landed on separate branch `cursor/orb-ux-001a-shared-credit-state`).
