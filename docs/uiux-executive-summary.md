# Orbis UI/UX Audit — Executive Summary

**Date:** 2026-08-06  
**Scope:** Evidence-based audit of Orbis (this repo + local app) vs Buildpad (buildpad.io public product + docs)  
**Constraint honored:** No production application code was modified; planning docs + screenshots only.

---

## Five most important findings

1. **Orbis already has a sharper specialist wedge than Buildpad** — “validate before you write code” + Build/Pivot/Skip + 10-dimension intelligence is clearer than “AI cofounder for everything.”  
2. **Buildpad’s advantage is guided momentum** — prompt-first landing, choice-based onboarding, AI-led next steps, and persistent artifacts — not merely visual style.  
3. **Orbis onboarding is informational, not activating** — the tour never navigates to Generate/Validate despite defining routes.  
4. **Quota UX is a trust risk** — remaining free reports are easy to miss until failure; post-quota path is waitlist-only.  
5. **No product analytics** — funnel improvements cannot be measured until a thin event layer exists.

---

## Five highest-priority changes

1. **Always-visible reports-remaining meter** (`ORB-UX-001`)  
2. **Goal-based onboarding that routes into a tool** (`ORB-UX-002`)  
3. **Post-quota continuation** (free Orbis AI + history + honest waitlist) (`ORB-UX-003`)  
4. **Dashboard resume + recommended next action** (`ORB-UX-005`)  
5. **Shared starter chips + NextStepCard after reports** (`ORB-UX-004`, `ORB-UX-007`)

---

## Quick wins

- Wire or remove `GuestUpgradeBanner`  
- Starter chips on Generate/Validate  
- Sidebar section labels (Research / Advise / Library)  
- Fix stale credit copy in Orbis AI prompts/docs  
- Delete unused `Index.tsx` / align README drifts  
- Aria-labels on tour close + icon buttons  

---

## Larger strategic changes

- Idea Workspace linking backlog ↔ reports ↔ chats (not a full canvas)  
- Markdown/PDF export and optional share links  
- Landing prompt → guest validate prefill  
- **Billing decision:** ship real checkout vs permanent waitlist repositioning  
- Pluggable analytics → later vendor  

---

## Features to preserve

- Guest mode with 2 free reports  
- Build/Pivot/Skip verdict + ValidationScorecard  
- Sourced vs estimated labeling + evidence links  
- Deep research progressive stages  
- Orbis AI (stream, voice, files, handoff)  
- Examples, Community trends, Changelog  
- Dark mode, PWA, account deletion safeguards  

---

## Features not recommended (from Buildpad)

- Infinite canvas as primary IA  
- In-app website builder / hosting  
- Content calendar  
- Team realtime collaboration (premature)  
- Copying Buildpad branding, serif-cream identity, illustrations, or marketing copy  

---

## Suggested first implementation phase

**Phase A — Activation (tickets 001→005, 008):**  
Meter · Goal onboarding · Post-quota path · Empty-state chips · Dashboard resume · Analytics plumbing  

Do **not** start Idea Workspace or billing integration until Phase A ships and `ORB-UX-013` decides monetization.

---

## Major unanswered product decisions

1. Ship Stripe/billing for $19 unlimited, or keep waitlist and rewrite “Go Pro” language?  
2. Should landing use a prompt-first CTA, keep button-only, or both?  
3. Is the atomic object a **Report**, an **Idea**, or a future **Project**?  
4. Which analytics vendor (if any) after the pluggable layer?  
5. Allow authenticated Buildpad workspace testing later for deeper competitive notes?

---

## Documents in this pack

| Document | Path |
| -------- | ---- |
| Buildpad reference audit | `docs/buildpad-reference-audit.md` |
| Orbis current audit | `docs/current-project-uiux-audit.md` |
| Comparison & gaps | `docs/buildpad-comparison-gap-analysis.md` |
| Implementation plan + tickets | `docs/uiux-implementation-plan.md` |
| This summary | `docs/uiux-executive-summary.md` |
| Screenshots | `docs/uiux-audit-assets/buildpad-reference/`, `docs/uiux-audit-assets/current-project/` |

**Recommended first ticket to approve:** `ORB-UX-001` — Reports-remaining meter in app chrome.
