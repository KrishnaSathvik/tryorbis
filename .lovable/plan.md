
# IdeaForge — Problem Discovery & Idea Validation Platform

## Overview
A clean, minimal SaaS tool with two core flows: **Idea Generator** (discover problems → generate ideas) and **Idea Validator** (test an existing idea). Powered by Perplexity AI for real-time web research. No auth initially — data persists in browser localStorage.

---

## Phase 1: Foundation & Dashboard

### Navigation & Layout
- Clean sidebar navigation: Dashboard, Generate Ideas, Validate Idea, My Backlog, Reports
- Minimal white design with subtle gray accents, modern typography

### Dashboard Page
- Two prominent CTA cards side by side:
  - **"Find Ideas to Build"** — discovery vibe with exploratory icon, subtitle: *"Discover real problems people are facing."*
  - **"Validate My Idea"** — analytical vibe with chart icon, subtitle: *"Test if your idea is worth building."*
- Recent activity section showing past generations and validations
- Quick stats (ideas generated, ideas validated, ideas in backlog)

---

## Phase 2: Idea Generator Flow

### Step 1 — Input Form
- Persona selector (e.g., Remote workers, Parents, Students, Founders, ADHD)
- Industry/Category picker (Finance, Productivity, Health, Education, etc.)
- Optional: Region, Budget scope, Platform preference
- CTA: "Generate Ideas"

### Step 2 — Research Trace (Live Progress)
- Animated progress showing what the AI is doing:
  - "Searching for complaints..." → "Analyzing pain points..." → "Clustering themes..." → "Generating ideas..."
- Uses Perplexity API via edge function to search for real complaints and unmet needs based on persona/category

### Step 3 — Problem Themes
- Display top problem clusters as cards
- Each card shows: theme name, pain summary, complaint count indicator, evidence links
- Expandable to see raw complaint excerpts

### Step 4 — Idea Suggestions
- For each problem cluster, AI generates:
  - Product idea name & description
  - MVP scope suggestion
  - Monetization potential
  - Demand/opportunity score (visual bar)
- Cards sortable by opportunity score

### Step 5 — Action Options
- Per idea: "Validate This Idea" button (pre-fills Validator), "Add to Backlog", "Copy as PRD prompt"
- AI handoff buttons: links to open in ChatGPT, Claude, Cursor, Lovable with pre-filled context

---

## Phase 3: Idea Validator Flow

### Step 1 — Idea Input
- Large text input: "Describe your idea..."
- Example placeholder: *"AI tool that tracks subscriptions automatically"*
- CTA: "Validate Idea"

### Step 2 — Research Trace (Live Progress)
- Same animated progress pattern:
  - "Analyzing demand..." → "Scanning competitors..." → "Evaluating feasibility..."
- Perplexity searches for demand signals, existing competitors, pricing data

### Step 3 — Validation Report
- Score dashboard with visual gauges/bars:
  - Demand Score, Pain Score, Competition Score, MVP Feasibility
- Overall **Verdict**: Build / Pivot / Skip — with color-coded badge
- Evidence section with source links from Perplexity citations

### Step 4 — Strategy Layer
- Pros & Cons list
- Gap opportunities (what competitors miss)
- Suggested MVP wedge (smallest version to test)
- Kill test (what would disprove this idea)

### Step 5 — AI Handoff
- Buttons to continue in: ChatGPT, Claude, Gemini, Cursor, Lovable
- Each pre-fills context with the validation results
- If verdict is weak: "Explore Adjacent Opportunities" button → routes to Generator with related themes

---

## Phase 4: Cross-Flow & Supporting Features

### My Backlog
- Saved ideas from both flows
- Each entry shows: idea name, source (Generated/Validated), scores, date
- Filter/sort by score, date, status
- Status tags: New, Exploring, Validated, Building, Archived

### Reports Page
- History of all generator runs and validation reports
- Expandable to re-view full results

### Data Persistence
- All data stored in localStorage (no auth)
- Export functionality (JSON/CSV) for backup

---

## Phase 5: Backend (Perplexity Integration)

### Edge Functions
- `perplexity-generate`: Takes persona/category inputs, constructs research queries, returns problem clusters and idea suggestions
- `perplexity-validate`: Takes idea text, searches for demand/competitors/gaps, returns scored validation report
- Both use Perplexity's Sonar model with structured JSON output for consistent scoring

### Perplexity Connector
- Connect via Lovable's Perplexity connector for API key management
- Edge functions handle prompt engineering to extract structured data from search results
