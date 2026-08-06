# Buildpad ↔ Orbis Comparison & Gap Analysis

**Date:** 2026-08-06  
**Sources:** `docs/buildpad-reference-audit.md`, `docs/current-project-uiux-audit.md`, browser screenshots, repository inspection  

> Orbis should **not** become a Buildpad clone. Orbis wins as a **fast, opinionated research/validation OS**. Borrow principles (guided momentum, trust, artifact persistence, clear pricing communication) — not branding, canvas cloning, or website-builder scope.

---

## 1. Side-by-side comparison

| Product area | Buildpad approach | Current approach | Current problem | Relevant opportunity | Recommendation |
| ------------ | ----------------- | ---------------- | --------------- | -------------------- | -------------- |
| Landing-page clarity | Prompt-first “turn idea into company” + live research demo | Headline + Try Free + sample report card | Clear, but less interactive activation | Add optional idea prompt that routes into guest Validate/Generate | **Improve existing** / Adapt principle |
| Product positioning | AI cofounder across full build lifecycle | Founder Research OS / validate before code | Narrower — and that’s OK | Double down on research depth & verdict clarity | **Preserve** |
| Navigation | Pricing, Docs, Story, sparse app nav (docs) | Public: Features/Community/Examples; App: 7 sidebar items | App nav lists tools without journey order cues | Group by journey: Discover → Validate → Decide | **Improve existing** |
| Authentication | Google + email; onboarding before/with signup | Email + anonymous guest | Guest is a strength | Keep guest; clarify limits upfront | **Preserve** + Improve |
| Onboarding | Multi-step goal calibration (choices) | 5-step info modal, no navigation | Tour doesn’t create first value | Goal choice → launch Generate or Validate with context | **Adapt from reference** |
| Dashboard | Project list + start prompt (docs) | Two CTA cards + zeroed stats | Thin resume/retention surface | Recent runs, credits left, suggested next | **Improve existing** |
| Project creation | Prompt creates project workspace | Starts chat/research threads per tool | No unifying “project” entity spanning generate→validate→notes | Lightweight Idea Project wrapping backlog item + linked reports | **Requires product decision** |
| Workspace | Persistent canvas | Separate pages + backlog notes | Context fragmented across Chat/Generate/Validate/History | Cross-link artifacts; “Idea workspace” panel | **Adapt principle** (not full canvas) |
| Core workflow | Phased guided building | Tool-centric (Generate / Validate / Chat) | User must know which tool | Guided path: Idea → Evidence → Verdict → Next decision | **Adapt from reference** |
| Progress tracking | Ultraplan / phase tasks (docs) | Backlog statuses + analytics | Statuses underused; no phase coach | Checklist on idea: researched → validated → decided | **Improve existing** |
| AI interactions | AI leads; challenges; proposes research | Mixed: clarifying chat then report; Orbis AI more open-ended | Generate empty state less guided than Chat | Shared starter chips + “recommended next” after reports | **Improve existing** |
| Research & sources | Multi-agent, approve gate, inline citations | Perplexity research + evidence links + sourced/estimated labels | Trust UI good but process less theatrical | Progressive stage UI already exists for deep mode — elevate it | **Preserve** + Improve |
| Generated artifacts | Canvas documents | Reports, scorecards, intelligence sections, backlog | Strong artifacts; weak packaging/export | PDF/Markdown export; shareable report link | **New capability** |
| Editing | Canvas editing (docs) | Notes on backlog; limited report edit | Reports largely immutable | Allow annotation / pin insights to idea | **Improve existing** |
| Collaboration | Real-time team (docs) | None | — | Not core to Orbis yet | **Not recommended** (now) |
| Sharing & export | PDF/Word/ZIP (docs) | AI handoff prompts to other AIs | Clever handoff; no shareable artifact | Public/share report + export | **New capability** |
| Empty states | Prompt + quick-start buttons | Uneven (Chat strong; Generate weaker) | Inconsistent first-run coaching | Standardize starter chips + examples | **Improve existing** |
| Loading states | Agent status theater | ResearchTrace + skeletons mixed | Inconsistent polish | Unify skeletons + stage progress | **Improve existing** |
| Error recovery | Unknown in-app | Toasts for 402/rate limit/timeout | Retry UX shallow | Explicit retry + credit restore messaging | **Improve existing** |
| Responsive design | Marketing OK | App generally OK | Some mobile density issues | Audit long reports on mobile | **Improve existing** |
| Accessibility | Unknown depth | Partial labels | Gaps on icon buttons/tour | Focus management + labels pass | **Improve existing** |
| Design consistency | Distinct serif+cream brand | Blue SaaS + Inter/Nunito | Looks generic vs Buildpad distinctiveness | Stronger brand expression *within Orbis identity* | **Improve existing** (not copy Buildpad) |
| Content hierarchy | Job-to-be-done headlines | Feature-forward in places | Tool names over outcomes | Outcome-led labels (“Validate demand”) | **Improve existing** |
| User trust | Citations + privacy mode + volume proof | Evidence links + sourced/estimated + examples | Good research trust; weaker social proof volume | More real reports + methodology transparency | **Preserve** + Improve |
| Conversion | Clear paid plans $39/$85 | Free 2 reports → waitlist $19 | Waitlist stalls intent | Either ship billing or reframe waitlist + free chat path | **Requires product decision** |
| Retention | Canvas + phases + projects | History + backlog + analytics | Return path weak | Dashboard resume + email digests later | **Improve existing** |
| Settings | Full settings docs | ProfileSheet only | Adequate for stage | Keep simple | **Preserve** |
| Billing / usage | Credits visible in docs/pricing | Credits in profile; not always pre-action | Surprise paywall | Always show “N reports left” | **Improve existing** |

---

## 2. Feature & workflow matrix

| Capability | Buildpad | Orbis | Fit for Orbis? |
| ---------- | -------- | ----- | -------------- |
| Guest / no-signup try | Unclear / limited | **Strong (2 free reports)** | Preserve |
| Idea generation from complaints | Yes (brainstorm docs) | **Yes (Generate)** | Preserve |
| Structured validation verdict | Soft / phased | **Yes (Build/Pivot/Skip + scores)** | Preserve — differentiator |
| 10-dimension intelligence | Different packaging | **Yes** | Preserve |
| Multi-agent research theater | Yes | Partial (deep stages) | Adapt lightly |
| Persistent canvas | Yes | No | Adapt as Idea Workspace, don’t clone |
| Website builder | Yes | No | **Not recommended** |
| Content calendar | Yes | No | **Not recommended** |
| Team collaboration | Yes | No | Later / optional |
| Export suite | Yes | AI handoff only | Worth adopting export |
| Streaming advisor chat | Yes | **Yes (Orbis AI)** | Preserve |
| Voice + attachments | Docs: files | **Yes** | Preserve |
| Transparent pricing page | Yes | Waitlist modal | Product decision |
| Community trends | No (marketing social proof) | **Yes** | Preserve |
| Dark mode | Not emphasized | **Yes** | Preserve |

---

## 3. Design-pattern comparison

| Pattern | Buildpad | Orbis | Action |
| ------- | -------- | ----- | ------ |
| Hero activation | Inline prompt | Button → auth | Consider prompt-to-guest-validate |
| Onboarding | Choice cards calibrating goals | Informational tour | Replace/augment with goal → tool routing |
| Progress | Phases / Ultraplan | Backlog statuses | Make statuses actionable |
| Trust during AI | Agent list + source counts | ResearchTrace + evidence favicons | Keep Orbis; enrich deep-mode theater |
| Artifact home | Canvas | Split across pages | Idea-centric hub |
| Paywall | Credits + plans | Waitlist | Be honest; offer free continuation |

---

## 4. Current strengths to preserve

1. **Clear specialist wedge:** validate before code + Build/Pivot/Skip.  
2. **Guest mode with 2 free reports** — faster time-to-value than many paid-first tools.  
3. **10-dimension intelligence + sourced vs estimated labels.**  
4. **Examples / Community / Changelog** public surfaces.  
5. **Orbis AI** streaming advisor with voice, files, handoff.  
6. **Deep research progressive stages** (already shipping).  
7. **Dark mode + PWA** affordances.  
8. **Account deletion** with typed confirm (trust).

---

## 5. Gaps & opportunities

### Critical usability problems
- Quota exhaustion → waitlist-only dead end.
- Onboarding tour doesn’t produce a first report.

### High-friction
- Tool choice paralysis (Generate vs Validate vs Chat).
- Credits not visible before spending.
- Dashboard doesn’t resume work.

### Product-clarity
- “Go Pro” vs waitlist mismatch.
- Overlap messaging between Chat and research tools.

### Visual-consistency
- Empty/loading patterns diverge by page.
- Starter chips only on Chat.

### Missing states
- Returning-user dashboard, retry panels, community errors, offline.

### Missing capabilities (fit-checked)
- Idea workspace linking reports + notes (**fits**).  
- Export/share validation report (**fits**).  
- Goal-based onboarding routing (**fits**).  
- Usage meter always visible (**fits**).  
- Full canvas / website builder / collab (**poor fit now**).

### Unnecessary complexity
- Unused `GuestUpgradeBanner`, `Index.tsx`, React Query scaffold.  
- Possibly too many peer nav items without grouping.  
- Waitlist + “unlimited” language without billing.

---

## 6. Features not worth adopting (now)

| Buildpad feature | Why not |
| ---------------- | ------- |
| Infinite canvas as core IA | Heavy build; Orbis artifacts are report-centric |
| In-app website builder / hosting | Dilutes research positioning |
| Content calendar | Off-mission |
| Team realtime collab | Premature without billing/PMF clarity |
| Serif cream visual clone | Brand theft risk + user rule against lookalike AI aesthetics |
| Long multi-step onboarding before any value | Orbis already has guest value — invert: value first, personalize second |

### Risks of over-copying
- Losing the sharp “validation OS” identity.
- Shipping half-canvas that feels worse than Buildpad.
- Matching credit complexity without matching product breadth.
- Legal/brand risk from copying illustrations, copy, or exact layout.

---

## 7. Prioritized recommendations

Scoring guide:  
`Priority = (User + Business + Urgency + Confidence) − (Effort + Tech risk + Dependency)`  
Each factor 1–5. Higher = do sooner.

| ID | Recommendation | Type | U | B | Urg | Conf | Eff | Risk | Dep | Priority | Tier |
| -- | -------------- | ---- | - | - | --- | ---- | --- | ---- | --- | -------- | ---- |
| R1 | Goal-based onboarding that routes into Generate/Validate and tracks first report | Adapt | 5 | 5 | 5 | 5 | 3 | 2 | 2 | **13** | P0 |
| R2 | Always-visible reports-remaining meter + pre-run confirm | Improve | 5 | 4 | 5 | 5 | 2 | 1 | 1 | **15** | P0 |
| R3 | Post-quota continuation: emphasize free Orbis AI + save/export; honest waitlist | Improve | 5 | 5 | 5 | 4 | 2 | 2 | 2 | **13** | P0 |
| R4 | Dashboard resume: recent runs, incomplete, CTA with context | Improve | 4 | 4 | 4 | 5 | 2 | 1 | 1 | **13** | P1 |
| R5 | Unify empty states + starter chips across Generate/Validate/Chat | Improve | 4 | 3 | 3 | 5 | 2 | 1 | 1 | **11** | P1 |
| R6 | Idea Workspace: link backlog item ↔ reports ↔ chat threads | New | 4 | 4 | 3 | 4 | 4 | 3 | 3 | **5** | P2 |
| R7 | Export/share validation report (MD/PDF or link) | New | 4 | 4 | 3 | 4 | 3 | 2 | 2 | **8** | P1 |
| R8 | Landing prompt → guest validate with prefilled idea | Adapt | 4 | 5 | 3 | 4 | 3 | 2 | 2 | **9** | P1 |
| R9 | Deep-research trust theater (stages/sources) polish | Improve | 3 | 3 | 2 | 4 | 2 | 2 | 2 | **6** | P2 |
| R10 | Accessibility pass (focus, labels, tour) | Improve | 4 | 2 | 3 | 4 | 2 | 1 | 1 | **9** | P1 |
| R11 | Product analytics event taxonomy | New | 3 | 5 | 4 | 5 | 2 | 1 | 2 | **12** | P1 |
| R12 | Ship real billing **or** permanently reframe waitlist | Decision | 5 | 5 | 4 | 3 | 5 | 4 | 4 | **5** | P1/Decision |
| R13 | Remove dead code / fix doc drift / AI credit copy | Improve | 2 | 2 | 2 | 5 | 1 | 1 | 1 | **8** | P2 |
| R14 | Canvas/website/collab clone | Not recommended | — | — | — | — | — | — | — | — | Not recommended |

### Now / Next / Later / Not recommended

- **Now:** R2, R1, R3, R11, R5, R4  
- **Next:** R8, R7, R10, R12 decision  
- **Later:** R6, R9, R13 polish  
- **Not recommended:** Full canvas, website builder, content calendar, collab v1  

---

## 8. Exceptions to the scoring formula

- **R12 (billing)** scores medium because effort/risk are high, but strategically it may unblock revenue — treat as **executive decision**, not a pure UX ticket.  
- **R6 (Idea Workspace)** is foundational for retention but depends on IA decisions — don’t start before R1–R4.
