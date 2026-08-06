# Orbis Current-Project UI/UX Audit

**Audit date:** 2026-08-06  
**App:** Orbis — Founder Research OS (this repository)  
**Runtime:** `npm run dev` → http://localhost:8080/ (Vite)  
**Backend:** Remote Lovable Cloud / Supabase (`VITE_SUPABASE_*` in `.env`)  
**Evidence root:** `docs/uiux-audit-assets/current-project/`

> **Legend:** **Verified** = codebase + running app. **Inferred**. **Unknown** = not exercised (e.g., full deep-research run cost/time).

---

## 1. Current product summary

| Dimension | Finding | Evidence |
| --------- | ------- | -------- |
| What it does | AI research OS: mine problems, generate ranked ideas, validate with Build/Pivot/Skip + up to 10 intelligence layers; Orbis AI advisor chat | `README.md`, `Landing.tsx`, edge functions |
| Target users | Solo founders / indie hackers validating before building | Landing “Who It’s For” |
| Primary problem | Building the wrong thing from gut feel | Landing problem framing |
| Value proposition | “Validate your startup idea before you write code” — 10-dimension report in ~60s; 2 free reports | `landing-hero-desktop.png` |
| Monetization | 2 free reports; $19/mo unlimited is **waitlist** (“Coming soon”) | `UpgradeModal.tsx`, waitlist migration |
| Live site | tryorbis.com (per README) | README |

Orbis is a **specialist research/validation tool**, not a full product-building suite.

---

## 2. Repository architecture

| Layer | Implementation | Files |
| ----- | -------------- | ----- |
| Frontend | React 18, TS, Vite, Tailwind, shadcn/ui, React Router v6 | `package.json`, `vite.config.ts` |
| State | AuthContext + local `useState`; React Query provider unused | `App.tsx`, `contexts/AuthContext.tsx` |
| Auth | Supabase session; anonymous guest via `signInAnonymously`; device fingerprint anti-abuse | `AuthContext.tsx`, `pages/Auth.tsx` |
| Data | Supabase tables via `lib/db.ts` + generated types | `integrations/supabase/*`, migrations |
| AI | Edge functions: Perplexity research, Gemini Orbis chat, follow-ups, image analysis | `supabase/functions/**` |
| Credits | `profiles.credits` default 2; server `try_deduct_credits` | `useCredits.ts`, migrations |
| Theme | Class dark mode, Inter + Nunito | `index.css`, `ThemeToggle.tsx` |
| Tests | Minimal vitest example | `src/test/example.test.ts` |
| Analytics SDK | **Missing** | repo grep |

---

## 3. Product map

| Area | Current implementation | Relevant files | Status | Observations |
| ---- | ---------------------- | -------------- | ------ | ------------ |
| Landing | Marketing hero, sample report, problem/solution, waitlist, CTAs → `/try` | `pages/Landing.tsx`, `PublicHeader.tsx` | Complete | Strong clarity; sample report still partly hardcoded |
| Auth | Email signup/signin + guest nickname | `pages/Auth.tsx` | Complete | Guest = anonymous user; low friction |
| Onboarding | 5-step modal tour on first `/dashboard` | `OnboardingTour.tsx` | Partially complete | Steps declare routes but **do not navigate**; overlay-only |
| Dashboard | Welcome + 2 CTA cards + 3 stats | `pages/Dashboard.tsx` | Partially complete | No recent activity, next-step coaching, or guest upgrade banner |
| Generate | Chat → research → results; deep 3-stage; intelligence; follow-up | `pages/GenerateIdeas.tsx` | Complete | Core loop solid; empty state sparse |
| Validate | Parallel to Generate + scorecard + verdict | `pages/ValidateIdea.tsx`, `ValidationScorecard.tsx` | Complete | Differentiating artifact |
| Orbis AI | Streaming chat, multimodal, voice, suggestions | `pages/OrbisChat.tsx` | Complete | Free chat; stale “credits” copy risk in edge prompt |
| My Ideas | Status workflow, notes, rename | `pages/Backlog.tsx` | Complete | README status names drift |
| History | Research + chat archives | `pages/Reports.tsx` | Complete | Good empty/skeleton patterns |
| Analytics (in-app) | Personal charts | `pages/Analytics.tsx` | Complete | Weak loading/error UX |
| Community | Public trends | `pages/Community.tsx` | Complete | Works (200); empty while data builds |
| Features / Examples / Changelog | Marketing surfaces | respective pages | Complete | Examples fallback if DB empty |
| Billing | Waitlist modal, not checkout | `UpgradeModal.tsx` | Partially complete | Dead-end after 2 reports |
| Guest upgrade banner | Component exists unused | `GuestUpgradeBanner.tsx` | Placeholder / dead | Never imported |
| Design system | CSS vars + shadcn | `index.css`, `components/ui/*` | Complete | Conventional SaaS look (Inter) |
| Responsive | Mobile sidebar sheet; grids | `AppLayout`, `use-mobile` | Partially complete | Mostly works; some empty states sparse on mobile |
| Accessibility | Partial aria-labels; Radix | various | Partially complete | Tour/modals/icon buttons incomplete |
| Product analytics | None | — | Missing | Cannot measure funnel |
| Index route file | Unused re-export | `pages/Index.tsx` | Placeholder | Dead code |

---

## 4. Route inventory

From `src/App.tsx` (Verified running — all return HTTP 200 via Vite):

| Route | Auth | Screen evidence |
| ----- | ---- | --------------- |
| `/` | Public (redirect if logged in) | `landing-hero-desktop.png`, mobile/tablet |
| `/features` | Public | `features-desktop.png` |
| `/community` | Public | `community-desktop.png` |
| `/examples` | Public | `examples-desktop.png` |
| `/changelog` | Public | `changelog-desktop.png` |
| `/auth`, `/auth?mode=guest`, `/try` | Public | `auth-desktop.png`, `guest-auth-desktop.png`, `auth-mobile.png` |
| `/dashboard` | Protected (guest OK) | `dashboard-guest-desktop.png`, `dashboard-clean-desktop.png`, `onboarding-tour-desktop.png` |
| `/generate` | Protected | `generate-empty-desktop.png`, `generate-tablet.png` |
| `/validate` | Protected | `validate-empty-desktop.png`, `validate-mobile.png` |
| `/chat` | Protected | `chat-empty-desktop.png`, `chat-mobile.png` |
| `/ideas` | Protected | `ideas-empty-desktop.png` |
| `/history` | Protected | `history-empty-desktop.png` |
| `/analytics` | Protected | `analytics-empty-desktop.png` |

---

## 5. Current user journeys

### 5.1 Guest first-value path (Verified)

```mermaid
flowchart LR
  A[Landing CTA Try Free] --> B[/try → guest auth]
  B --> C[Optional nickname]
  C --> D[Anonymous session]
  D --> E[Dashboard + tour modal]
  E --> F[Generate or Validate]
  F --> G{Credits > 0?}
  G -->|yes| H[Research report]
  G -->|no| I[UpgradeModal waitlist]
  H --> J[Save to My Ideas / History / Follow-up chat]
```

**Friction notes:**
- Tour does not escort user into Generate/Validate.
- Dashboard stats at zero don’t coach the first action beyond two large cards (good) but no “recommended next.”
- After 2 reports, waitlist is the only upgrade path.

### 5.2 Registered user path (Verified structure)

Email signup → same app shell → ProfileSheet for plan/usage/delete → waitlist for Pro.

### 5.3 Research loop (Verified code + empty UI)

Generate/Validate: clarifying chat (`chat-generate` / `chat-validate`) → optional attachments/`analyze-images` → `perplexity-*` (regular or deep 3-stage) → results components → optional `FollowUpChat` → save backlog / AI handoff.

---

## 6. Design-system inventory

| Element | Current | Files |
| ------- | ------- | ----- |
| Colors | Warm off-white light; blue primary; cream secondary; dark mode tokens | `index.css` |
| Type | Inter body, Nunito headings | `index.html` / CSS |
| Radius | Large (`--radius: 1rem`, cards `rounded-2xl` / `28px` tour) | pages/components |
| Buttons | Pill CTAs common (`rounded-full`) | Landing, tour |
| Cards | Heavy use of warm cards on dashboard/marketing | `card-warm` utility |
| Nav | Public header links; app left sidebar | `PublicHeader`, `AppSidebar` |
| Feedback | Sonner toasts; skeletons on some pages | multiple |
| Motion | CSS fade/slide; README mentions Framer Motion but **not installed** | doc drift |

---

## 7. Screen-by-screen UX notes (running app)

### Landing (`landing-hero-desktop.png`)

- **Strength:** Immediate clarity — validate before code; Build/Pivot/Skip; 2 free reports; sample report below fold.
- **Hierarchy:** Brand present but headline competes strongly; still readable as Orbis-specific because of report preview.
- **Issue:** Sample report commented as temporary in source; risk of looking canned.
- **Mobile:** Captured separately; public header collapses reasonably.

### Auth / Guest

- Low friction guest entry (Verified with nickname “AuditBot”).
- Guest limitations (2 reports, upgrade later) could be clearer before start.

### Onboarding tour (`onboarding-tour-desktop.png`)

- Friendly copy; progress dots; Skip works.
- **Critical UX gap:** `route` fields unused — tour is not experiential.
- Emoji in titles; close button lacks explicit aria-label in tour header.

### Dashboard (`dashboard-clean-desktop.png`)

- Clear binary choice: Find Ideas vs Validate.
- Missing: recent runs, resume unfinished research, credit remaining callout, guest upgrade prompt (`GuestUpgradeBanner` unused).

### Generate / Validate empty states

- Clean chat-first UI with example placeholder and voice/attach.
- Large whitespace; few starter chips on Generate vs Chat page (Chat has suggestion chips — inconsistency).
- No visible credit remaining in header (only fail → modal).

### Chat

- Strong empty state with suggestion chips and disclaimer.
- Streaming + multimodal is a product strength.

### Ideas / History / Analytics empty

- History/Ideas have clearer empty copy; Analytics “No data yet” is thinner.
- Good skeleton usage on Ideas/History/Dashboard.

### Profile / Upgrade (`profile-sheet-desktop.png`, `upgrade-modal-desktop.png` when captured)

- Plan status + waitlist CTA.
- “Go Pro” language vs waitlist reality can feel like a dead end.

---

## 8. UX issues (prioritized within current product)

### Critical usability

1. **Post-quota dead end:** After 2 free reports, only waitlist — no alternate valuable free actions highlighted (chat is free but not framed as the continuation).  
2. **Onboarding doesn’t create first value:** Tour ends without forcing/starting Generate or Validate.

### High friction

3. Generate vs Validate vs Orbis AI overlap is explained in tour text but not in persistent IA guidance.  
4. Credits/remaining reports not always visible before commit.  
5. Deep research duration/progress is better than before (3-stage) but still a long wait risk (not fully timed in this audit).

### Product clarity

6. Waitlist priced at $19 vs competitor live checkout — honesty is good; conversion path weak.  
7. Doc/code drifts (statuses, Framer Motion, “5 free credits” prompt risk, unused `Index.tsx`).

### Visual consistency

8. Chat has starter chips; Generate/Validate rely on a single system message.  
9. Loading: skeletons vs plain “Loading…” inconsistency (Analytics/Community).  
10. Pill-heavy / card-heavy patterns vary by page density.

### Missing states

| State | Where missing / weak |
| ----- | -------------------- |
| First-time coaching beyond tour | Dashboard |
| Returning-user resume | Dashboard |
| Inline credit exhaustion preview | Generate/Validate headers |
| Community fetch error UI | console only |
| Offline / retry | Mostly absent |
| Guest upgrade banner | Component dead |

### Accessibility

- Theme toggle labeled (good).
- Many icon-only controls incomplete.
- Tour focus trap / restore not obviously managed.
- Charts (Recharts) limited for SR users.

### Responsive

- App usable at 390 / 768 / 1280 / 1440 (Verified screenshots).
- Mobile dashboard still shows onboarding overlay occupying viewport — OK but blocks content.
- Long reports on mobile: structure exists; full report run **Unknown** in this pass.

---

## 9. Technical constraints

- Frontend-only; edge functions remote — local audit cannot modify backend behavior without deploy.
- React Query unused → duplicated fetch/loading patterns.
- No product analytics SDK.
- Unlimited plan not billable yet (waitlist table only).
- AI cost/latency depends on Perplexity/Gemini remote availability.

---

## 10. Screenshots

Primary evidence in `docs/uiux-audit-assets/current-project/`:

- Landing: `landing-hero-desktop.png`, `landing-mid-desktop.png`, `landing-footer-desktop.png`, `landing-hero-mobile.png`, `landing-hero-tablet.png`, `landing-hero-laptop.png`
- Marketing: `features-desktop.png`, `examples-desktop.png`, `community-desktop.png`, `changelog-desktop.png`
- Auth: `auth-desktop.png`, `guest-auth-desktop.png`, `auth-mobile.png`
- App: `dashboard-*.png`, `onboarding-tour-desktop.png`, `generate-*`, `validate-*`, `chat-*`, `ideas-empty-desktop.png`, `history-empty-desktop.png`, `analytics-empty-desktop.png`, `profile-sheet-desktop.png`

---

## 11. What could not be fully tested

| Item | Reason |
| ---- | ------ |
| Full deep-research multi-stage run | Time/cost; quota impact on shared backend |
| Email magic/verification edge cases | Not required for guest audit |
| Real unlimited billing | Waitlist only |
| Production tryorbis.com parity | Audited local build with remote Supabase |
| Exhaustive keyboard/SR audit | Partial only |
| Collaboration / multiplayer | Not in product |
