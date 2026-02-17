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
- **Community Trends** — Live stats showing what the community is researching.

## Tech Stack

- **Frontend:** React · TypeScript · Vite · Tailwind CSS · shadcn/ui
- **Backend:** Lovable Cloud (database, auth, edge functions)
- **AI:** Perplexity API for research, Lovable AI for chat
- **Charts:** Recharts

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
├── components/     # Reusable UI components
├── contexts/       # Auth context
├── hooks/          # Custom hooks (credits, page title, etc.)
├── lib/            # Database helpers, types, utilities
├── pages/          # Route pages
└── integrations/   # Backend client
supabase/
└── functions/      # Edge functions (AI endpoints)
public/
├── manifest.json   # PWA manifest
├── sitemap.xml     # SEO sitemap
└── robots.txt      # Crawler rules
```

## License

© 2026 Orbis. All rights reserved.
