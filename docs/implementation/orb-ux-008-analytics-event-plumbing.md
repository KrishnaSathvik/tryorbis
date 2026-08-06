# ORB-UX-008 — Analytics event plumbing

**Date:** 2026-08-06  
**Branch:** `cursor/orb-ux-008-analytics-event-plumbing`  
**Status:** Implemented  
**Base:** `main` after ORB-UX-005 merge (`4b0f86c` / PR #8)

## Previous measurement limitation

Orbis had no product analytics layer. Funnel questions (CTA conversion, research activation, quota pressure, waitlist intent, Dashboard resume) could not be measured without adding a vendor SDK or scattering ad-hoc logs.

## Analytics API

`src/lib/analytics.ts` exposes:

```ts
track(event, ...propertiesArgs): void
setAnalyticsSink(sink | null): void
```

No React provider is required. Call sites stay vendor-agnostic.

## Typed event map

`AnalyticsEventProperties` allowlists event names and property shapes. Callers cannot pass arbitrary `Record<string, unknown>` payloads through the public API.

## Development console behavior

When `import.meta.env.DEV` is true, every event logs once via:

```ts
console.info("[orbis:analytics]", envelope);
```

The envelope is a structured object (`event`, `properties`, `occurredAt`). Production does not console-log when no sink is configured.

## Sink interface

```ts
export type AnalyticsEnvelopeFor<K extends AnalyticsEventName> = {
  event: K;
  properties: AnalyticsEventProperties[K];
  occurredAt: string;
};

export type AnalyticsEnvelope = {
  [K in AnalyticsEventName]: AnalyticsEnvelopeFor<K>;
}[AnalyticsEventName];

type AnalyticsSink = (envelope: AnalyticsEnvelope) => void | Promise<void>;
```

`AnalyticsEnvelope` is a **discriminated union**: narrowing `envelope.event === "quota_hit"` narrows `envelope.properties` to the matching allowlisted shape. Compile-time fixture: `src/lib/analytics.envelope.types.ts`.

Default sink is `null`. `setAnalyticsSink` replaces or clears it. A future PostHog/GA/etc. adapter can register near app startup without changing feature call sites.

## Failure isolation

- Synchronous sink exceptions are swallowed.
- Rejected sink Promises are caught.
- `track()` returns immediately and never returns a blocking Promise.
- No queue, retry loop, or network implementation.

## Event timing rules

Track semantic user actions and completed outcomes — not component renders.

## Research lifecycle semantics

| Stage | Rule |
| ----- | ---- |
| Start | After credits confirmed available and the user starts research; once per attempt |
| Success | Final **structurally usable** report rendered (deep: after all validated stages) |
| Failure | Overall attempt fails before final success; coarse `code` only |
| Duration | `performance.now()` delta, normalized to non-negative integer ms |
| Retry | New `research_started` + its own success/failure |

Persistence failures after a usable report do not convert success into failure.

A successful HTTP/edge response is **not** automatically a research success. Generate and Validate validate response shape before emitting `research_succeeded` or rendering/saving a final report (`src/lib/researchResponseValidation.ts`).

### Usable report structure

**Generate regular:** non-array object with `problemClusters` and `ideaSuggestions` arrays (may be empty — “no opportunities” ≠ malformed).

**Generate deep:**

1. Stage 1 — object with `problemClusters` array (partial UI only after this)
2. Stage 2 — object with `ideaSuggestions` array
3. Stage 3 — object with at least one non-null intelligence field (`wtpSignals`, `competitionDensity`, `marketTiming`, `icp`, `workaroundDetection`, `featureGapMap`, `platformRisk`, `gtmStrategy`, `pricingBenchmarks`, `defensibility`)

**Validate regular:** object with finite numeric `scores` (`demand`, `pain`, `competition`, `mvpFeasibility`) and `verdict` exactly `Build` | `Pivot` | `Skip`. Optional arrays may default to `[]` only after that structure is valid. Missing verdict/scores are never defaulted to `Skip` / zeros.

**Validate deep:**

1. Core — same score/verdict rules (no zero-score Skip partial for malformed core)
2. Competitors — object with `competitors` array (`marketSizing` optional)
3. Intelligence — at least one non-null intelligence field

### `invalid_response` semantics

`InvalidResearchResponseError` maps deterministically to `research_failed` with `code: "invalid_response"`. Malformed payloads produce: one `research_started`, zero `research_succeeded`, one `research_failed`, no save, retryable chat UI, and safe toast copy (never the internal error string or raw payloads). Stage names stay internal and are not sent in analytics.

## Quota semantics

`quota_hit` fires only via `isQuotaExhausted({ remaining, loading, unavailable })` — i.e. `remaining === 0 && !loading && !unavailable`. The product gate may still open the upgrade modal when `!hasCredits`, but instrumentation does **not** emit for `remaining: null`, loading, unavailable, or non-zero remaining. Surfaces: `generate`, `validate`, `reports_meter`, `dashboard`, `profile`.

## Waitlist semantics

`waitlist_join` fires only after a successful **new** waitlist insert. Duplicate/already-joined responses do not emit.

## Idea-save semantics

`idea_saved` fires only after `addToBacklogDb` succeeds, with coarse `from` values for generator/validation results and History paths.

## Dashboard resume semantics

`report_opened_from_dashboard` fires when Dashboard recent-activity actions navigate to History (`Continue` / `View report` / `View research`). `Validate this idea` does not emit this event.

## Privacy policy for event properties

Do **not** include: user IDs, emails, display names, IP, fingerprints, full URLs/query/referrer, prompts, idea text, titles, record IDs, file names, or raw backend errors.

Numeric normalization: `credits_left` → finite non-negative integer or `null`; `duration_ms` → finite non-negative integer.

## Implemented events

| Event | Trigger |
| ----- | ------- |
| `landing_cta_click` | Landing / public-header Try Free CTAs |
| `auth_guest_start` | Successful anonymous guest session |
| `onboarding_goal_select` | Goal chosen in onboarding |
| `onboarding_skip` | Skip / dismiss completing onboarding |
| `research_started` | Generate/Validate research about to begin |
| `research_succeeded` | Final report rendered |
| `research_failed` | Research attempt failed |
| `quota_hit` | Confirmed-zero gate interaction |
| `waitlist_join` | Successful new waitlist insert |
| `post_quota_chat_click` | Continue with Orbis AI (modal or Dashboard) |
| `idea_saved` | Successful backlog save from result/History |
| `report_opened_from_dashboard` | Dashboard History open actions |

## Defined-but-deferred events

| Event | Awaiting |
| ----- | -------- |
| `landing_prompt_submit` | ORB-UX-006 landing prompt |
| `next_step_click` | ORB-UX-007 NextStepCard |
| `export_markdown` | ORB-UX-010 markdown export |

## Files changed

- `src/lib/analytics.ts` (+ tests / privacy regression / discriminated envelope types)
- `src/lib/researchResponseValidation.ts` (+ unit tests)
- Landing, Auth, PublicHeader, OnboardingTour
- GenerateIdeas, ValidateIdea, Reports
- UpgradeModal, PostQuotaContinuationPanel, AppSidebar, ProfileSheet
- DashboardRecentActivity
- Docs + browser evidence under `docs/uiux-audit-assets/implementation/orb-ux-008/`
- Measurement table status in `docs/uiux-implementation-plan.md`

## Tests

- `src/lib/analytics.test.ts` — core API, sink safety, normalization, sink narrowing, `InvalidResearchResponseError` classification
- `src/lib/analytics.envelope.types.ts` — compile-time discriminated-union fixture
- `src/lib/analytics.privacy.test.ts` — forbidden key regression
- `src/lib/researchResponseValidation.test.ts` — structural validators
- Instrumentation suites for Landing (CTAs + waitlist form), Auth, Onboarding, Generate, Validate, UpgradeModal, PostQuota, Dashboard, Reports
- Generate/Validate malformed `{}` / stage / score-verdict lifecycle coverage; confirmed-zero vs null/loading/unavailable quota cases

Commands: `npm test` (**244 passed**) · `npx tsc -p tsconfig.app.json --noEmit` · eslint on touched files · `npm run build`

## Browser verification

Dev server with no sink. Console transcripts saved as Markdown under:

- `docs/uiux-audit-assets/implementation/orb-ux-008/analytics-dev-console-landing.md`
- `.../analytics-dev-console-onboarding.md`
- `.../analytics-dev-console-research.md`
- `.../analytics-dev-console-quota-waitlist.md`
- `.../analytics-dev-console-dashboard.md`
- `.../analytics-privacy-audit.md`

Landing waitlist join is covered by direct unit tests (successful insert, duplicate `23505`, non-duplicate failure, render-only). Live remote waitlist inserts are stateful (unique email constraint) and are not required for merge readiness; the evidence note documents unit coverage instead of treating live insertion as flaky without context.

## Remaining limitations

- No production sink is registered (by design).
- Guest `from: "landing"` is unused today because Landing CTAs go through `/try` → `try_route`.
- Waitlist source for Landing pricing form is coarse `other`.
- Real (non-mocked) deep-research browser timing was not exercised end-to-end against remote AI; covered by unit/instrumentation tests with mocked stages.

## Explicit scope exclusions

No analytics vendor SDK, npm dependency, DB table, cookies, event queue, fingerprinting, session replay, advertising pixels, landing prompt, NextStepCard, markdown export, billing, schema/edge changes, or unrelated product features.
