# ORB-UX-001A — Shared credit / report-usage state

**Date:** 2026-08-06  
**Status:** Implemented (hotfix for merged ORB-UX-001)  
**Does not start:** ORB-UX-002

## Root cause

`useCredits()` previously owned React `useState` inside each calling component. `AppSidebar`, `GenerateIdeas`, `ValidateIdea`, and `ProfileSheet` each created an independent hook instance.

Calling `refreshCredits()` from Generate or Validate refreshed only that page’s local state. The sidebar meter kept its stale value until an auth/user change triggered its own fetch.

Same hook **code** does not mean shared hook **state**.

## Previous state ownership

| Surface | Ownership |
| ------- | --------- |
| AppSidebar | Own `useCredits()` state + initial fetch |
| GenerateIdeas | Own `useCredits()` state + initial fetch |
| ValidateIdea | Own `useCredits()` state + initial fetch |
| ProfileSheet | Own `useCredits()` state + initial fetch |

## New provider ownership

- **Source of truth (DB):** `profiles.credits` / `profiles.max_credits` (unchanged)
- **Client owner:** one `CreditsProvider` holding fetched state in React context
- **Public API:** `useCredits()` (throws if used outside the provider)

## Provider mounting location

`CreditsProvider` wraps the authenticated shell in `AppLayout`:

```text
ProtectedRoute
  └─ AppLayout
       └─ CreditsProvider
            ├─ AppSidebar (+ ProfileSheet)
            └─ <Outlet /> (Generate, Validate, …)
```

All authenticated chrome and research pages are descendants of the same provider.

## Files changed

| File | Change |
| ---- | ------ |
| `src/contexts/CreditsContext.tsx` | **New** `CreditsProvider` + `useCredits` |
| `src/contexts/CreditsContext.test.tsx` | **New** shared-state / auth-safety / loading-gate tests |
| `src/hooks/useCredits.ts` | Re-exports provider API for existing import paths |
| `src/components/AppLayout.tsx` | Mount `CreditsProvider` above sidebar + outlet |
| `src/pages/GenerateIdeas.tsx` | Guard research start against loading/unavailable |
| `src/pages/ValidateIdea.tsx` | Guard research start against loading/unavailable |
| `docs/implementation/orb-ux-001-report-meter.md` | Correct inaccurate sync description |
| `docs/uiux-audit-assets/implementation/orb-ux-001a/*` | Browser evidence |

## Refresh flow

Backend deduction is unchanged:

- Regular mode: deduct once per invoke
- Deep mode: deduct only on first stage (`problems` / `core`)

Frontend still calls `refreshCredits()` at those existing consumption points (after stage one for deep; after completion for regular). Because refresh updates provider state, **every** consumer (sidebar meter, page `hasCredits`, ProfileSheet) re-renders with the new remaining count.

## Auth-transition behavior

On `user.id` change:

1. Clear `credits` to `null` immediately
2. Set `loading` true (when a user is present)
3. Clear `unavailable`
4. Fetch the new user’s profile

Stale responses are dropped via a monotonic request id plus a `userIdRef` check so user A’s late response cannot overwrite user B.

## Loading / action safety

Generate and Validate now:

```text
if (creditsLoading || creditsUnavailable) return;
if (!hasCredits) open upgrade modal;
```

Loading and unavailable are not treated as a confirmed zero balance.

## Tests

```text
npm test
npx tsc -p tsconfig.app.json --noEmit
npx eslint src/contexts/CreditsContext.tsx src/contexts/CreditsContext.test.tsx src/hooks/useCredits.ts src/components/AppLayout.tsx
npm run build
```

Results: 21/21 vitest tests passed; `tsc` clean; eslint 0 errors on new/touched scoped files; production build succeeded.

Covered behaviors include shared initial count (single fetch), cross-consumer `refreshCredits` / `deductCredit`, auth reset, stale-response ignore, unavailable + recovery, loading ≠ zero, and upgrade-modal gate while loading.

## Browser verification

Guest `SyncBot` on local Vite (`localhost:8080`):

| Check | Result |
| ----- | ------ |
| Before report | Sidebar `2 free reports left` |
| After mocked Validate (live, no reload) | Sidebar `1 free report left` |
| ProfileSheet | `1 / 2 used` matches sidebar |
| Mobile sidebar sheet | Shared meter visible |
| Loading meter | Skeleton only; no fabricated `0` |

Evidence:

- `docs/uiux-audit-assets/implementation/orb-ux-001a/before-report-two-left.png`
- `docs/uiux-audit-assets/implementation/orb-ux-001a/after-report-one-left-live.png`
- `docs/uiux-audit-assets/implementation/orb-ux-001a/profile-and-sidebar-consistent.png`
- `docs/uiux-audit-assets/implementation/orb-ux-001a/mobile-shared-meter.png`
- `docs/uiux-audit-assets/implementation/orb-ux-001a/loading-not-zero.png`

Live decrement used a production-faithful network mock of `perplexity-validate` plus profile credit reads (`2` → `1` on refresh) so the real `refreshCredits()` path updated the shared provider without burning a live LLM run.

## Remaining limitations

- No Realtime subscription; sync depends on explicit `refreshCredits()` after consumption (same as before, now shared).
- `deductCredit()` remains available but research flows rely on backend deduction + refresh.
- Did not start ORB-UX-002 or other Phase A tickets.
