# ORB-UX-003 — Post-quota continuation experience

**Date:** 2026-08-06  
**Branch:** `cursor/orb-ux-003-post-quota-continuation`  
**Status:** Implemented (draft PR)  
**Base:** `main` after ORB-UX-002 merge (`999eefc` / PR #4)

## Previous waitlist-only behavior

When free research reports hit zero, Generate/Validate opened `UpgradeModal` with exhausted copy and a Pro waitlist form only. There was no guided path to Orbis AI, My Ideas, or History. The modal was also mounted only in the Generate/Validate **results** phase, so Start Research / Start Validation during the chat phase could set `upgradeOpen` without rendering the dialog.

`GuestUpgradeBanner` (guest → registered account conversion) existed but was unused and is **not** the Pro waitlist / quota UX.

## New continuation options

When report usage is confirmed exhausted (`remaining === 0`, not loading, not unavailable):

1. **Join the Pro waitlist** — existing `waitlist` insert; honest “coming soon / no charge until launch”
2. **Continue with Orbis AI** — navigate to `/chat` with `{ focusComposer: true }`
3. **My Ideas** — `/ideas`
4. **History** — `/history`

Orbis AI remains available subject to existing rate limits (no report credit deduction). Copy does not promise unlimited chat.

## Modal modes

`UpgradeModal` accepts:

```ts
mode?: "general" | "quota_exhausted"
source?: "meter" | "generate" | "validate" | "dashboard" | "profile"
```

| Mode | When | Content |
| ---- | ---- | ------- |
| `general` | Meter with reports remaining; ProfileSheet Pro CTA | Pro coming soon + waitlist; no exhausted language |
| `quota_exhausted` | Confirmed zero reports | Exhausted heading, continuation actions, waitlist |

If credits become available while an exhausted modal is open, the modal closes.

## Entry points

| Entry | Behavior |
| ----- | -------- |
| Generate Start Research | Opens exhausted modal (modal mounted in chat phase) |
| Validate Start Validation | Same exhausted modal |
| Zero report meter | Exhausted mode |
| Positive report meter | General mode |
| ProfileSheet | General mode |
| Dashboard panel | Continuation panel + waitlist opens exhausted modal |

Loading / unavailable usage never opens exhausted UI (ORB-UX-001A guards preserved).

## Dashboard behavior

`PostQuotaContinuationPanel` shows only when `isQuotaExhausted(...)` is true. Offers Orbis AI, My Ideas, History, and Join waitlist. Hidden while loading/unavailable or when reports remain.

`GuestUpgradeBanner` left unused (different purpose: account upgrade). Documented in-file.

## Waitlist behavior

- Pending disables duplicate submit
- Success / duplicate → “You’re on the waitlist”; report count unchanged
- Failures use generic toast (no raw backend dump); continuation actions stay usable
- Client `localStorage` key `orbis_waitlist_joined:<identity>` remembers membership (table is INSERT-only under RLS; no SELECT policy / no new DB fields)

## Guest and registered-user behavior

Same continuation actions for guests and registered free users. Guests enter email for waitlist; registered users with profile email use that address. No forced account conversion for free continuation.

## Navigation and focus

- Continue with Orbis AI closes modal, navigates `/chat`, one-time composer focus via `useFocusComposerOnArrive`
- My Ideas / History close modal and navigate
- Escape / close restore focus via Radix Dialog

## Accessibility

Dialog title + description, semantic buttons, pending `aria-busy`, `aria-live` status region, Escape support, visible focus rings, mobile touch targets.

## Files changed

| File | Change |
| ---- | ------ |
| `src/components/UpgradeModal.tsx` | Modes + continuation actions + waitlist honesty |
| `src/components/UpgradeModal.test.tsx` | Mode / nav / waitlist / a11y tests |
| `src/components/PostQuotaContinuationPanel.tsx` | Dashboard zero-quota panel |
| `src/components/PostQuotaContinuationPanel.test.tsx` | Panel visibility + nav tests |
| `src/lib/quotaExhausted.ts` + test | Shared exhausted predicate |
| `src/lib/waitlistStorage.ts` | Client waitlist membership memory |
| `src/lib/researchQuotaGate.test.tsx` | Generate/Validate gate regression |
| `src/components/AppSidebar.tsx` | Meter mode wiring |
| `src/components/AppSidebar.reportsMeter.test.tsx` | Exhausted vs general meter |
| `src/pages/Dashboard.tsx` | Mount continuation panel |
| `src/pages/GenerateIdeas.tsx` / `ValidateIdea.tsx` | Exhausted mode + chat-phase modal mount |
| `src/components/ProfileSheet.tsx` | General mode source |
| `src/components/GuestUpgradeBanner.tsx` | Clarify unused purpose |
| `docs/implementation/orb-ux-003-post-quota-continuation.md` | This note |
| `docs/uiux-implementation-plan.md` | Mark 003 implemented |
| `docs/uiux-audit-assets/implementation/orb-ux-003/*` | Browser evidence |

## Tests

```text
npm test
npx tsc -p tsconfig.app.json --noEmit
npx eslint <touched files>
npm run build
```

Combined suite on this branch: **73 tests passing**.

## Browser verification

Profiles API intercepted to `credits: 0` for deterministic zero state. Flows:

- Generate → Start Research → exhausted modal → Continue with Orbis AI → `/chat` + textarea focus
- Validate → Start Validation → exhausted modal → History → `/history`
- Zero meter → exhausted mode
- Dashboard panel visible at zero
- Waitlist success copy; reports remain gated
- Mobile 390×844 + dark mode screenshots

### Screenshot paths

`docs/uiux-audit-assets/implementation/orb-ux-003/`

- `generate-zero-quota-modal.png`
- `validate-zero-quota-modal.png`
- `zero-meter-exhausted-mode.png`
- `post-quota-continue-chat.png`
- `post-quota-saved-work-actions.png`
- `waitlist-success-zero-remains.png`
- `dashboard-zero-quota-panel.png`
- `mobile-zero-quota-modal.png`
- `dark-mode-zero-quota-modal.png`
- `modal-focus-return.png`

## Limitations

- Waitlist membership cannot be read from Supabase (INSERT-only RLS); relies on duplicate errors + localStorage
- Orbis AI is rate-limited, not unlimited
- ProfileSheet “Go Pro” button copy still promotional (general waitlist mode; no billing)

## Deferred analytics events

No PostHog/GA or product analytics plumbing (ORB-UX-008).

## Explicit scope exclusions

Starter chips, dashboard resume cards, landing prompt, Idea Workspace, NextStepCard, export, billing/Stripe, schema/edge-function changes, quota amount/rules, sidebar regrouping, ORB-UX-004+.
