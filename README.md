# Orbis — AI-Powered Product Research & Validation

> Stop guessing. Start validating. Orbis mines real complaints, clusters pain points, and validates product ideas with AI-powered research — so you build what people actually need.

🔗 **Live:** [tryorbis.lovable.app](https://tryorbis.lovable.app)

---

## Features

- **Problem Discovery** — Automatically mine real complaints from forums, reviews, and social media.
- **Pain Point Clustering** — AI groups raw complaints into thematic clusters to spot high-frequency patterns.
- **Idea Generation** — Get actionable product ideas ranked by demand score, backed by evidence.
- **Full Validation Reports** — Competitor analysis, pros & cons, evidence links, and a Build / Pivot / Skip verdict.
- **Orbis AI Advisor** — Brainstorm ideas, discuss strategy, refine your pitch — all in a dedicated AI chat.
- **Backlog Management** — Save and track your best ideas with status tracking.
- **Analytics Dashboard** — Personal stats on ideas generated, validated, and saved.
- **Community Trends** — Live aggregate stats showing what the community is researching.
- **Guest Mode** — Try the app instantly without signing up (with limited credits).
- **Dark / Light Theme** — Full theme support with system preference detection.

## Tech Stack

- **Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Recharts
- **Backend:** Lovable Cloud (database, auth, edge functions, secrets)
- **AI:** Perplexity API for research · Lovable AI for Orbis Chat
- **Routing:** React Router v6

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Public marketing page with live community stats |
| `/auth` | Auth | Sign up / sign in |
| `/dashboard` | Dashboard | Welcome screen with quick stats and CTA cards |
| `/chat` | Orbis AI | Conversational AI advisor for strategy and brainstorming |
| `/generate` | Generate Ideas | AI-powered problem discovery and idea generation |
| `/validate` | Validate Idea | Full validation report with verdict |
| `/ideas` | My Ideas | Backlog of saved ideas with status tracking |
| `/history` | History | Past validation reports |
| `/analytics` | Analytics | Personal usage analytics |

## Edge Functions

| Function | Purpose |
|----------|---------|
| `perplexity-generate` | AI research for idea generation |
| `perplexity-validate` | AI research for idea validation |
| `chat-generate` | Follow-up chat on generation results |
| `chat-validate` | Follow-up chat on validation results |
| `chat-followup` | General follow-up conversations |
| `orbis-chat` | Orbis AI advisor chat |
| `community-stats` | Aggregated community statistics (public) |

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
