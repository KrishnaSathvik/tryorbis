# AGENTS.md

## Cursor Cloud specific instructions

Orbis is a **frontend-only Vite + React + TypeScript** app (shadcn/ui, Tailwind). The
backend (database, auth, AI edge functions) is **hosted remotely on Lovable Cloud /
Supabase** — the project ref and anon key are committed in `.env` (`VITE_SUPABASE_*`).
There is no local Supabase/Docker stack to run; the dev server talks directly to the
remote backend, so AI research features work without any local backend setup.

### Running
- Dev server: `npm run dev` (Vite). Serves on **port 8080** (not the Vite default 5173;
  configured in `vite.config.ts`).
- Standard scripts live in `package.json`: `lint`, `test` (vitest run), `build`,
  `build:dev`, `preview`.
- The app supports **guest mode** and gives **2 free research reports without signup**,
  so core Generate/Validate flows can be exercised end-to-end without credentials.

### Package manager
Use **npm** (`package-lock.json` is the source of truth). `bun.lockb`/`bun.lock` are also
committed but bun is not required and not installed by default.

### Gotchas
- `npm run lint` currently reports many pre-existing errors (mostly
  `@typescript-eslint/no-explicit-any` in `supabase/functions/**` and generated code).
  These are pre-existing and not caused by environment setup.
- Edge functions under `supabase/functions/**` run on the remote backend; they are not
  executed by the local dev server.
