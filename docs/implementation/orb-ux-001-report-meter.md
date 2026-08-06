# ORB-UX-001 — Reports-remaining meter

**Date:** 2026-08-06  
**Branch:** `cursor/buildpad-uiux-audit-eb6d`  
**Status:** Implemented

## Files changed

| File | Change |
| ---- | ------ |
| `src/components/ReportsRemainingMeter.tsx` | **New** presentational meter |
| `src/components/ReportsRemainingMeter.test.tsx` | **New** component tests |
| `src/components/AppSidebar.reportsMeter.test.tsx` | **New** chrome integration tests |
| `src/components/AppSidebar.tsx` | Wire meter + `UpgradeModal` in sidebar footer |
| `src/hooks/useCredits.ts` | Expose `remaining` (nullable) + `unavailable`; keep prior `credits`/`hasCredits` API |
| `docs/uiux-audit-assets/implementation/orb-ux-001/*` | Browser evidence screenshots |
| `docs/implementation/orb-ux-001-report-meter.md` | This record |

## Final component behavior

- Lives in shared app chrome (`AppSidebar` footer), above the profile trigger.
- Visible on all authenticated routes that use `AppLayout` (including Generate and Validate) on desktop and in the mobile sidebar sheet.
- Clickable free-tier states open the existing `UpgradeModal` (waitlist).
- Copy uses “reports” (matches ProfileSheet), with singular/plural grammar.
- Unlimited UI exists only as an explicit `isUnlimited` prop — **not wired** because the app model has no paid/unlimited plan flag today.

## States supported

| State | Behavior |
| ----- | -------- |
| Loading | Skeleton + `aria-label="Loading report usage"`; no numeric count |
| Remaining > 1 | `N free reports left` (button → upgrade modal) |
| Remaining = 1 | `1 free report left` |
| Remaining = 0 | `0 free reports left` (text, not color-only) |
| Unlimited | `Unlimited reports` (non-button) — prop-only / unused in chrome |
| Unavailable | `Report usage unavailable` when profile credit fetch fails |
| Waitlisted | Still shows honest remaining count (waitlist ≠ unlimited) |

## Synchronization

- Single source of truth remains `profiles.credits` / `max_credits`.
- **ORB-UX-001 caveat (fixed in ORB-UX-001A):** the original meter wired `useCredits()` separately in AppSidebar vs Generate/Validate/ProfileSheet. Each call owned independent React state, so `refreshCredits()` on a research page did **not** update the sidebar meter until auth lifecycle refetch.
- **ORB-UX-001A:** one `CreditsProvider` in `AppLayout` owns fetched state; all surfaces consume the same context via `useCredits()`. See `docs/implementation/orb-ux-001a-shared-credit-state.md`.
- No optimistic local counter separate from the provider.

## Tests run

```text
npm test
npx tsc -p tsconfig.app.json --noEmit
npx eslint src/components/ReportsRemainingMeter.tsx src/components/ReportsRemainingMeter.test.tsx src/components/AppSidebar.tsx src/components/AppSidebar.reportsMeter.test.tsx src/hooks/useCredits.ts
npm run build
```

All passed (12 vitest tests).

## Browser checks completed

| Check | Result |
| ----- | ------ |
| Guest on `/generate` desktop 1440 | `2 free reports left` |
| Guest on `/validate` | Meter visible |
| Dark mode | Meter readable |
| Mobile 390 sidebar sheet | Meter above profile |
| Focus + click → UpgradeModal | Works |
| Zero via mocked `profiles` credits=0 | `0 free reports left` |

## Screenshots

- `docs/uiux-audit-assets/implementation/orb-ux-001/desktop-reports-remaining.png`
- `docs/uiux-audit-assets/implementation/orb-ux-001/desktop-zero-reports.png`
- `docs/uiux-audit-assets/implementation/orb-ux-001/desktop-validate-reports-remaining.png`
- `docs/uiux-audit-assets/implementation/orb-ux-001/desktop-upgrade-modal-from-meter.png`
- `docs/uiux-audit-assets/implementation/orb-ux-001/mobile-reports-remaining.png`
- `docs/uiux-audit-assets/implementation/orb-ux-001/dark-mode-reports-remaining.png`
- `docs/uiux-audit-assets/implementation/orb-ux-001/meter-focus-state.png`

## Limitations / follow-ups

- ~~`AppSidebar` and `ProfileSheet` each call `useCredits` (two fetches). Sharing via context would be a separate cleanup ticket.~~ **Addressed in ORB-UX-001A** (shared `CreditsProvider`).
- No real unlimited plan field in profiles — unlimited meter branch is ready but unused.
- Full live credit deduction after a real research run was not burned against shared quota in ORB-UX-001; ORB-UX-001A verified live sidebar sync via a production-faithful mocked Validate + shared `refreshCredits()`.
- Did not start `ORB-UX-002` or other Phase A tickets.
