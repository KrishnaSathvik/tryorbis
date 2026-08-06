# ORB-UX-005 — Dashboard resume and recommended next

**Date:** 2026-08-06  
**Branch:** `cursor/orb-ux-005-dashboard-resume`  
**Status:** Implemented  
**Base:** `main` after ORB-UX-004 merge (`9c821a4` / PR #7)

## Previous Dashboard behavior

- Welcome header + Generate/Validate CTA cards + three quick stats
- Stats loaded via `getMyGeneratorRuns` / `getMyValidationReports` / `getMyBacklog` with empty deps
- Failures silently left stats at `0` (false zeros)
- No recent-work resume, no History deep links from Dashboard, no Validate prefill from Dashboard
- History cards keyed by array index; no `?item=` deep-link support

## First-run behavior

When overview loads successfully with empty `recentActivity`:

- Heading: **Start your first research**
- Supporting copy explains starting Generate or Validate
- Two entry cards: **Find product ideas** → `/generate`, **Validate an idea** → `/validate`
- No empty recent-work list
- No duplicate full-size CTA trio (recent + first-run + entry cards)

## Returning-user behavior

When activity exists:

1. **Pick up where you left off** (up to 3 cards)
2. **Start something new** (existing Generate/Validate cards)
3. Quick statistics (unchanged meanings)

## Overview data contract

`src/lib/dashboardOverview.ts`

```ts
export type DashboardActivityItem =
  | {
      kind: "generator";
      id: string;
      createdAt: string;
      title: string;
      contextLabel: string;
      ideaCount: number;
      topIdea: { name: string; description?: string } | null;
    }
  | {
      kind: "validation";
      id: string;
      createdAt: string;
      title: string;
      verdict: string | null;
      overallScore: number | null;
    };

export interface DashboardOverview {
  recentActivity: DashboardActivityItem[];
  stats: {
    ideasGenerated: number;
    ideasValidated: number;
    ideasInBacklog: number;
  };
}
```

JSON fields are parsed safely; malformed rows never crash the UI.

## Query strategy

`getDashboardOverview(limit = 3)`:

- Resolves current Supabase user; empty overview when none
- Parallel fetches scoped with `.eq("user_id", user.id)`
- Fetches up to `limit` generator + validation rows each, then merges/sorts/slices to `limit`
- Stats: idea-suggestion totals across generator runs; validation count; backlog count
- Every Supabase `error` throws `DashboardOverviewError` (safe message only)

## Recent-item normalization

**Generator title:** first valid idea name → `persona × category` → `Idea discovery`  
**Validation title:** trimmed `idea_text` → `Validation report`  
**Overall score:** established product formula when all four score dimensions are numeric; otherwise `null`

## Recommended-next rules

Newest card only:

| Newest item | Primary action |
| --- | --- |
| Generator with top idea | **Validate this idea** → `/validate` + one-time prefill |
| Generator without top idea | **View research** → History |
| Validation | **Continue** → History deep link |

Label text: **Recommended next** (deterministic product rule, not AI).

## Generator → Validate prefill

Route state:

```ts
{ dashboardValidatePrefill: { text, sourceRunId, sourceIdeaName? } }
```

Validate applies only in untouched chat state, focuses composer, places caret at end, consumes via `replace`, preserves path/search/hash/unrelated state. Never auto-submits or calls AI/credits.

## History deep-link contract

```
/history?item=generator:<id>
/history?item=validation:<id>
```

Expands matching item, scrolls into view, focuses trigger. Invalid targets keep History usable with restrained status text. Items keyed by stable DB ids.

## Loading, failure, and retry

- Skeletons for recent activity + stats while loading (no first-run/zero flash)
- Error: “We couldn't load your dashboard.” + **Try again**
- Retry uses request-id + in-flight guard
- Stats only render after successful load

## User-switch protection

`user.id` dependency clears prior overview into loading; stale responses ignored via request id.

## Accessibility

Section headings, semantic list/articles, real buttons with descriptive `aria-label`s including titles, `<time dateTime>`, decorative icons `aria-hidden`, `role="alert"` on error, History focus target, Validate composer focus after prefill.

### Dashboard entry cards (merge-readiness correction)

First-run and returning-user entry cards are React Router `<Link>` elements wrapping non-interactive `Card` content:

- Real link semantics, Tab focus, Enter activation, visible focus ring
- Card titles use `<h3>` under section `<h2>`
- Full-card hit target; no nested interactive controls; browser Back / open-in-new-tab work as normal links

### Validate router-state safety

`isRouterStateRecord` guards before `in` / destructure / spread. Primitive, array, nullish, and Date values are ignored without crashing. Only object state with `dashboardValidatePrefill` is consumed.

### History independent expansion

Open state is a `Set<string>` of stable `generator:<id>` / `validation:<id>` keys. Manual open/close adds/removes one key. Deep links **add** the target without closing others. Focus tests assert `toHaveFocus()` after deep link without manually calling `focus()`.

### Copy accuracy

Supporting copy is: “Continue your latest research or move an idea forward.” (no unsupported “strongest idea” claim).

## Responsive behavior

Cards stack; titles clamp; actions wrap; touch-friendly buttons; works with PostQuotaContinuationPanel; light/dark readable.

## Files changed

- `src/lib/dashboardOverview.ts` (+ test)
- `src/lib/formatRelativeTime.ts` (+ test)
- `src/lib/dashboardValidatePrefill.ts` (+ test)
- `src/components/DashboardRecentActivity.tsx`
- `src/pages/Dashboard.tsx` (+ test)
- `src/pages/ValidateIdea.tsx` (+ dashboard prefill test)
- `src/pages/Reports.tsx` (+ deep-link test)
- `docs/implementation/orb-ux-005-dashboard-resume.md`
- `docs/uiux-implementation-plan.md`
- `docs/uiux-audit-assets/implementation/orb-ux-005/*`

## Tests

Vitest coverage for mapping, overview helper, Dashboard states, Validate prefill, History deep links, plus regressions from ORB-UX-001…004.

## Browser verification

See screenshot paths under `docs/uiux-audit-assets/implementation/orb-ux-005/`.

## Limitations

- History still loads full lists via existing helpers (not overview-limited)
- Overall score uses the established backlog formula; not a separate stored field
- Deep-link focus/scroll runs once per target key via `deepLinkHandledRef`

## Deferred analytics

No PostHog/GA or product analytics instrumentation.

## Explicit scope exclusions

No NextStepCard, sticky post-result actions, landing prompt, guest-auth prefill, Idea Workspace, projects/folders, report editing, export/PDF, billing/Stripe, schema/migrations, edge functions, quota changes, Chat/StarterChips/sidebar redesign, recommendation AI/backend, ORB-UX-006+.
