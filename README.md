# Orbis — Founder Research OS

> Stop guessing. Start validating. Orbis is an AI-powered product strategy engine that mines real complaints, clusters pain points, and validates ideas with deep market intelligence — so you build what people actually need.

🔗 **Live:** [www.tryorbis.com](https://www.tryorbis.com)

---

## Features

### Core Research Engine
- **Problem Discovery** — Automatically mine real complaints from forums, reviews, and social media.
- **Pain Point Clustering** — AI groups raw complaints into thematic clusters with evidence links and complaint counts.
- **Idea Generation** — Get actionable product ideas ranked by opportunity score, backed by real evidence.
- **Deep Research Mode** — Toggle between regular (1 credit) and deep research (3 credits) for more thorough analysis using advanced AI models.
- **Full Validation Reports** — Competitor analysis, pros & cons, evidence links, and a Build / Pivot / Skip verdict.
- **Full Idea Persistence** — Save ideas to backlog with complete details: description, MVP scope, and monetization strategy.

### Orbis AI Advisor
- **Personalized Strategic Chat** — An always-on AI advisor that knows your credits, saved ideas, and research history to give tailored guidance.
- **User-Aware Context** — Orbis AI dynamically adapts advice based on your account type (guest vs registered), remaining credits, and activity.
- **Platform-Aware** — Can explain all Orbis features, guide you to the right tool, and suggest next steps based on your research progress.
- **AI Handoff** — Export your research context to ChatGPT, Claude, Gemini, Cursor, or Codex with one click.

### 10-Dimension Market Intelligence
Every research run includes up to 10 intelligence layers:

| Layer | What It Tells You |
|-------|-------------------|
| **Willingness-to-Pay (WTP)** | Direct pricing signals and budget intent from real conversations |
| **Competition Density** | Blue Ocean to Winner-Take-Most classification with funding estimates |
| **Market Timing** | Emerging / Growing / Saturated / Declining phase detection |
| **ICP Precision** | Business type, industry, buying triggers, and tech stack targeting |
| **Workaround Detection** | How people currently solve the problem (and how much they invest) |
| **Feature Gap Map** | Competitor coverage gaps ranked by opportunity |
| **Platform Risk** | Bundling, API limitation, and roadmap overlap signals |
| **GTM Strategy** | Channel viability, SEO potential, and founder-led sales assessment |
| **Pricing Benchmarks** | Competitor pricing data with suggested range |
| **Defensibility & Moat** | Data network, lock-in, community, and technical moat analysis |

### Data Quality & Transparency
- **Sourced vs Estimated Labels** — Every metric shows whether it's backed by research data or AI-estimated.
- **Market Sizing (TAM/SAM/SOM)** — Estimated market size with methodology transparency.
- **Evidence Attribution** — Research sources with clickable URLs and site favicons.

### Credit System
- **Guest Mode** — Try free with 5 credits, no signup required (just a nickname).
- **Registered Users** — Sign up to get 20 credits with auto-refill.
- **24-Hour Auto-Refill** — When credits hit zero, a timer starts and credits refill to max after 24 hours.
- **Live Countdown** — Sidebar shows "Resets in Xh Ym Zs" when credits are depleted.
- **Additive Upgrade** — Guest-to-registered upgrade adds 20 credits to existing balance.

### Platform
- **My Ideas (Backlog)** — Save, rename, and track ideas with status workflow (New → Exploring → Testing → Validated → Archived), inline notes with formatting, and keyboard shortcuts. Full idea metadata (description, MVP, monetization) is preserved.
- **History** — Dual archive for research runs and Orbis AI conversations, with deletion and chronological sorting.
- **Analytics Dashboard** — Personal stats: verdict distribution, average scores, category trends, build rate.
- **Community Trends** — Live aggregate stats showing what the community is researching.
- **Competitive Comparison** — Side-by-side feature comparison against IdeaBuddy, Validator AI, DimeADozen, Informly, and IdeaProof.
- **Founder Success Tracking** — Pipeline funnel, progression rate, and build rate metrics.
- **Top Ideas Leaderboard** — Community-ranked ideas by validation score.
- **Examples & Changelog** — Sample reports and product update timeline.
- **Feedback Widget** — In-app feedback submission (Bug / Feature Request / General).
- **Profile Sheet** — Sidebar drawer for credits, account info, guest upgrade, and account deletion.
- **Account Deletion** — Full data sweep (backlog, research, conversations, chat messages, profile) with typed "DELETE" confirmation.
- **Observability Logging** — Latency, error rates, and provider tracking across all AI functions.
- **Dark / Light Theme** — Full theme support with system preference detection.
- **Anti-Abuse** — Device fingerprinting and signup limits (3 per device).

### Security
- **Row-Level Security (RLS)** — All tables are protected with permissive RLS policies scoped to authenticated users via `auth.uid()`.
- **Rate Limiting** — Database-level rate limiting with automatic cleanup.
- **Service Role Isolation** — Admin-only tables (rate_limits, request_logs) deny all client access.

## Tech Stack

- **Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Recharts · Framer Motion
- **Backend:** Lovable Cloud (database, auth, edge functions, secrets)
- **AI Research:** Perplexity Sonar Pro (regular) · Sonar Deep Research (deep mode)
- **AI Advisor:** Google Gemini 3 Flash Preview (chat) · Gemini 2.5 Pro (deep analysis)
- **Routing:** React Router v6

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Public marketing page with live community stats |
| `/examples` | Examples & Changelog | Sample reports and recent product updates |
| `/auth` | Auth | Sign up / sign in / guest mode |
| `/dashboard` | Dashboard | Welcome screen with quick stats and CTA cards |
| `/chat` | Orbis AI | Personalized AI advisor for strategy and brainstorming |
| `/generate` | Generate Ideas | AI-powered problem discovery and idea generation |
| `/validate` | Validate Idea | Full validation report with verdict |
| `/ideas` | My Ideas | Backlog of saved ideas with status tracking |
| `/history` | History | Past research runs and AI conversations |
| `/analytics` | Analytics | Personal usage analytics |

## Edge Functions

| Function | Purpose |
|----------|---------|
| `perplexity-generate` | AI research for idea generation (Sonar Pro / Deep Research) |
| `perplexity-validate` | AI research for idea validation |
| `chat-generate` | Follow-up chat on generation results |
| `chat-validate` | Follow-up chat on validation results |
| `chat-followup` | General follow-up conversations |
| `orbis-chat` | Personalized Orbis AI advisor (with user context) |
| `community-stats` | Aggregated community statistics (public) |
| `delete-account` | Full account deletion with service role data sweep |

## Getting Started

```bash
git clone <YOUR_GIT_URL>
cd orbis
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) to view the app.

## Project Structure

```
src/
├── components/        # Reusable UI components (sidebar, badges, charts, etc.)
│   ├── icons/         # Custom AI brand icons
│   ├── landing/       # Landing page sections (charts, leaderboard)
│   └── ui/            # shadcn/ui primitives
├── contexts/          # Auth context (session, profile, guest mode)
├── hooks/             # Custom hooks (credits, page title, mobile detection)
├── lib/               # Database helpers, types, utilities
├── pages/             # Route pages
└── integrations/      # Backend client config
supabase/
└── functions/         # Edge functions (AI endpoints, stats)
public/
├── manifest.json      # PWA manifest
├── sitemap.xml        # SEO sitemap
└── robots.txt         # Crawler rules
```

## License

© 2026 Orbis. All rights reserved.
