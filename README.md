# Orbis — Founder Research OS

> Stop guessing. Start validating. Orbis is an AI-powered product strategy engine that mines real complaints, clusters pain points, and validates ideas with deep market intelligence — so you build what people actually need.

🔗 **Live:** [www.tryorbis.com](https://www.tryorbis.com)

---

## Features

### Core Research Engine
- **Problem Discovery** — Automatically mine real complaints from forums, reviews, and social media.
- **Pain Point Clustering** — AI groups raw complaints into thematic clusters with evidence links and complaint counts.
- **Idea Generation** — Get actionable product ideas ranked by opportunity score, backed by real evidence.
- **Deep Research Mode** — Toggle between regular and deep research. Deep mode runs 3 sequential stages (sonar-pro) with progressive result rendering instead of a single slow call.
- **Full Validation Reports** — Competitor analysis, pros & cons, evidence links, and a Build / Pivot / Skip verdict.
- **Full Idea Persistence** — Save ideas to backlog with complete details: description, MVP scope, and monetization strategy.

### Orbis AI Advisor
- **Personalized Strategic Chat** — An always-on AI advisor that knows your saved ideas and research history to give tailored guidance.
- **User-Aware Context** — Orbis AI dynamically adapts advice based on your account type and activity.
- **Platform-Aware** — Can explain all Orbis features, guide you to the right tool, and suggest next steps based on your research progress.
- **AI Handoff** — Export your research context to ChatGPT, Claude, Gemini, Cursor, or Codex with one click.
- **Image & File Understanding** — Attach up to 10 images or files per message. Orbis AI can analyze screenshots, mockups, PDFs, and text files alongside your questions.
- **Voice Input** — Speak your questions using the built-in voice button (Web Speech API — no API key required). Works in Chrome, Edge, Safari, and PWA.
- **Smart Model Routing** — Automatically selects the right AI model based on query complexity (fast model for simple questions, powerful model for deep analysis).
- **Drag & Drop Uploads** — Drag files directly into any chat input area for quick attachment.

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

### Access
- **Free Tier** — 2 free research reports (Generate or Validate), no signup required.
- **Unlimited Plan** — $19/month for unlimited research, deep research mode, and priority support.
- **Waitlist** — Join the waitlist for early access to the unlimited plan.

### Platform
- **My Ideas (Backlog)** — Save, rename, and track ideas with status workflow (New → Exploring → Testing → Validated → Archived), inline notes with formatting, and keyboard shortcuts. Full idea metadata (description, MVP, monetization) is preserved.
- **History** — Dual archive for research runs and Orbis AI conversations, with deletion and chronological sorting.
- **Analytics Dashboard** — Personal stats: verdict distribution, average scores, category trends, build rate.
- **Community Trends** — Live trends showing what categories and personas the community is researching.
- **Competitive Comparison** — Side-by-side feature comparison against IdeaBuddy, Validator AI, DimeADozen, Informly, and IdeaProof.
- **Founder Success Tracking** — Pipeline funnel, progression rate, and build rate metrics.
- **Top Ideas Leaderboard** — Community-ranked ideas by validation score.
- **Examples** — Sample reports showing what Orbis delivers.
- **Changelog** — Dedicated product update timeline with all recent changes.
- **Feedback Widget** — In-app feedback submission (Bug / Feature Request / General).
- **Profile Sheet** — Sidebar drawer for account info, plan status, and account deletion.
- **Account Deletion** — Full data sweep (backlog, research, conversations, chat messages, profile) with typed "DELETE" confirmation.
- **Observability Logging** — Latency, error rates, and provider tracking across all AI functions.
- **Dark / Light Theme** — Full theme support with system preference detection.
- **PWA Support** — Install Orbis to your home screen for a native app experience, including voice input.
- **Anti-Abuse** — Device fingerprinting and signup limits (3 per device).

### Security
- **Row-Level Security (RLS)** — All tables are protected with permissive RLS policies scoped to authenticated users via `auth.uid()`.
- **Rate Limiting** — Database-level rate limiting with automatic cleanup.
- **Service Role Isolation** — Admin-only tables (rate_limits, request_logs) deny all client access.

## Tech Stack

- **Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Recharts · Framer Motion
- **Backend:** Lovable Cloud (database, auth, edge functions, secrets)
- **AI Research:** Perplexity Sonar Pro (regular + deep multi-stage)
- **AI Advisor:** Google Gemini 3 Flash Preview (simple queries) · Gemini 2.5 Pro (complex analysis)
- **Voice:** Web Speech API (browser-native, zero-cost)
- **Routing:** React Router v6

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Public marketing page with feature highlights and waitlist |
| `/examples` | Examples | Sample validation reports |
| `/changelog` | Changelog | Product update timeline |
| `/auth` | Auth | Sign up / sign in / guest mode |
| `/dashboard` | Dashboard | Welcome screen with quick stats and CTA cards |
| `/chat` | Orbis AI | Personalized AI advisor for strategy and brainstorming |
| `/generate` | Generate Ideas | AI-powered problem discovery and idea generation |
| `/validate` | Validate Idea | Full validation report with verdict |
| `/ideas` | My Ideas | Backlog of saved ideas with status tracking |
| `/history` | History | Past research runs and AI conversations |
| `/analytics` | Analytics | Personal usage analytics |
| `/features` | Features | Detailed feature breakdown with interactive demos |
| `/community` | Community Trends | Live research trends, category breakdown, and top ideas |

## Edge Functions

| Function | Purpose |
|----------|---------|
| `perplexity-generate` | AI research for idea generation (Sonar Pro / Deep Research) |
| `perplexity-validate` | AI research for idea validation |
| `chat-generate` | Follow-up chat on generation results |
| `chat-validate` | Follow-up chat on validation results |
| `chat-followup` | General follow-up conversations |
| `orbis-chat` | Personalized Orbis AI advisor with smart model routing and multimodal support |
| `community-stats` | Aggregated community statistics (public) |
| `delete-account` | Full account deletion with service role data sweep |
| `analyze-images` | Image analysis for attached screenshots and mockups |
| `showcase-reports` | Curated showcase reports for the landing page |

## Changelog

### v2.7 — Mar 2026
- **Multi-Stage Deep Research** — Replaced single `sonar-deep-research` call (2-5 min, frequent timeouts) with 3 fast sequential `sonar-pro` stages (~15s each). Results appear progressively as each stage completes.
- **Progressive Result Rendering** — Deep mode switches to results view after stage 1, then loads additional sections (ideas/competitors, intelligence) with loading indicators as subsequent stages finish.
- **Mobile Responsiveness** — Fixed landing page headline wrapping, Examples page card layout, market sizing pill overflow, and responsive padding/font sizes across pages.
- **Go Pro Upgrade Flow** — New upgrade modal accessible to all users (guest + registered) via sidebar Go Pro button.
- **Double Credit Fix** — Fixed bug where deep research could deduct credits multiple times; credits now only deducted on the first stage.
- **Accessibility Fixes** — Resolved Radix UI `DialogDescription` warnings across all modal components.
- **Community Trends Privacy** — Removed raw usage counts from community trends; now shows percentages only.

### v2.6 — Mar 2026
- **Free Reports + Waitlist Model** — Replaced credit system with 2 free research reports and a $19/month unlimited waitlist.
- **Features Page** — New `/features` page with interactive feature breakdown and comparison.
- **Community Trends Page** — New `/community` page with live research trends, category breakdown, verdict distribution, and top-scored ideas leaderboard.
- **GenerateIdeas Redesign** — Quick summary card, "Real Problems Found" with preview quotes, restructured ranked idea cards with color-coded scores, market intelligence context subtitle.
- **ValidationScorecard Redesign** — Cleaner layout with larger score display, improved evidence section, and streamlined verdict presentation.
- **Edge Function Auth Fix** — Fixed authentication in all edge functions (replaced broken `getClaims` with `getUser`).
- **Upgrade Modal** — New modal for prompting users to join the unlimited plan waitlist.
- **Profile Sheet Update** — Replaced credit display with plan status and upgrade CTA.

### v2.5 — Feb 2026
- **Voice Input** — Added browser-native voice-to-text input across all chat interfaces (Orbis Chat, Generate Ideas, Validate Idea). Uses Web Speech API — no API key needed. Works on desktop, mobile, and PWA.
- **Multi-File Upload (up to 10)** — Increased attachment limit from 3 to 10 files per message. Supports images (JPEG, PNG, WebP, GIF), PDFs, and text files (TXT, CSV).
- **Drag & Drop** — Drag files directly into any chat input area with a visual drop zone overlay.
- **Image Support in Orbis AI** — Orbis Chat now accepts and analyzes images alongside text. Ask questions about screenshots, mockups, competitor UIs, or data visualizations.
- **Smart Model Routing** — Orbis AI automatically picks the optimal model based on query complexity — fast responses for simple questions, deep analysis for complex strategy queries.
- **Multimodal Content Fix** — Fixed edge function crashes when sending images (content format handling for multipart messages).
- **Input Layout Refinement** — Voice button repositioned next to the send button for a cleaner input bar layout across all chat pages.

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
├── hooks/             # Custom hooks (credits, page title, mobile detection, voice input, drop zone)
├── lib/               # Database helpers, types, utilities, attachment processing
├── pages/             # Route pages
└── integrations/      # Backend client config
supabase/
└── functions/         # Edge functions (AI endpoints, stats, image analysis)
public/
├── manifest.json      # PWA manifest
├── sitemap.xml        # SEO sitemap
└── robots.txt         # Crawler rules
```

## License

© 2026 Orbis. All rights reserved.
