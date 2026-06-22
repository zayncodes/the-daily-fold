# The Chronicle — a self-publishing digital newspaper

A premium, print-inspired digital newspaper that **publishes itself once a day**. Every morning a scheduled job pulls the day's most important headlines, has Claude rewrite them into editorial newspaper prose, and commits a new dated edition. The site reads like a real broadsheet — masthead, multi-column front page, drop caps, pull quotes, page-turn navigation — and keeps a growing archive of past editions.

Each daily edition has six stories:

- **2 × National** (India)
- **2 × International** (world)
- **1 × Feature** (rotates: science / technology / health / environment)
- **1 × Sports**

## How it works

```
NewsData.io ──fetch top headlines──┐
                                   ▼
            scripts/generate-edition.mjs ──Claude rewrite──► src/data/editions/YYYY-MM-DD.json
                                   ▲                                    │
            open-meteo (Delhi weather, no key)                         ▼
                                                     Vite bundles every edition (import.meta.glob)
GitHub Action (daily cron) ─ runs the script, commits the JSON ─► push ─► host auto-redeploys
```

- **No backend or database.** Each day is a committed JSON file; the archive is just the history of those files.
- **The front page** always shows the most recent edition; older ones live in the **Archive**.

## Tech stack

TanStack Start (SSR React 19) · Tailwind CSS v4 · shadcn/ui · Framer Motion (`motion`) · Nitro (build) · Node 22.

## Local development

```bash
npm install
npm run dev        # http://localhost:8080
```

### Generate an edition locally

1. Copy the env template and add your keys:

   ```bash
   cp .env.example .env
   ```

   - `NEWSDATA_API_KEY` — free key from <https://newsdata.io>
   - `ANTHROPIC_API_KEY` — key from <https://console.anthropic.com>

2. Preview the candidate headlines without spending any AI tokens:

   ```bash
   npm run edition:dry
   ```

3. Generate today's real edition (fetch → rewrite → write JSON):

   ```bash
   npm run edition
   # or a specific day:
   node scripts/generate-edition.mjs --date=2026-06-23
   ```

The new edition appears at `src/data/editions/<date>.json` and shows up on the site immediately.

### Cost & model

The rewrite defaults to `claude-opus-4-8` for the best editorial quality. Six short articles a day is a tiny workload; to trade quality for cost, set in `.env`:

```bash
EDITION_MODEL=claude-haiku-4-5   # cheapest, or claude-sonnet-4-6 for a middle ground
EDITION_EFFORT=low               # low | medium | high
```

## Daily automation (GitHub Actions)

The workflow at [`.github/workflows/daily-edition.yml`](.github/workflows/daily-edition.yml) runs every day at **00:30 UTC (06:00 IST)**, generates the edition, and commits it. You can also trigger it manually from the **Actions** tab.

**Set up the secrets** (repo → Settings → Secrets and variables → Actions):

| Type     | Name                | Value                          |
| -------- | ------------------- | ------------------------------ |
| Secret   | `NEWSDATA_API_KEY`  | your NewsData key              |
| Secret   | `ANTHROPIC_API_KEY` | your Anthropic key             |
| Variable | `EDITION_MODEL`     | _(optional)_ model override    |
| Variable | `EDITION_EFFORT`    | _(optional)_ `low`/`medium`/`high` |

The job has `contents: write` permission so it can push the new edition back to the repo.

## Deployment (Vercel)

The build is wired for Vercel via Nitro's Build Output API — `nitro: { preset: "vercel" }` in [`vite.config.ts`](vite.config.ts) plus [`vercel.json`](vercel.json). `npm run build` emits `.vercel/output`, which Vercel serves directly: SSR runs as a Node 22 function and static assets are served from the edge.

1. Push this repo to GitHub.
2. On Vercel: **Add New → Project → import the repo → Deploy.** Nothing to configure — `vercel.json` pins the build command and leaves the framework as **Other** so Vercel uses the Build Output API as-is.
3. **No runtime environment variables are needed** — the site serves pre-built editions. The API keys live only in GitHub Actions, which generates and commits each day's edition; that commit triggers Vercel to rebuild and ship the new front page.

Preview the production build locally with `npx vite preview` after `npm run build`.

### Other hosts

Netlify works the same way (Nitro auto-detects it on build). For Cloudflare Pages, change the preset to `nitro: { preset: "cloudflare-pages" }`. Inside Lovable's own sandbox the build always targets Cloudflare regardless, so Lovable previews keep working.

## Project structure

```
scripts/generate-edition.mjs      The daily content engine (fetch → rewrite → write)
src/data/editions/*.json          One file per published day (the archive)
src/lib/articles.ts               Loads + sorts editions; helpers used across the app
src/components/Masthead.tsx       Masthead, date, edition no., weather, nav
src/components/Reveal.tsx         Scroll-reveal animation wrapper (reduced-motion aware)
src/routes/index.tsx              Front page
src/routes/article.$slug.tsx      Article spread (page-turn, swipe, keyboard nav)
src/routes/archive.tsx            Past editions + search
.github/workflows/daily-edition.yml   The daily cron
```

## Customizing

- **Newspaper name / details** — `src/components/Masthead.tsx` and the footer in `src/routes/index.tsx`.
- **Desks & feature rotation** — `DESKS` and `FEATURE_ROTATION` in `scripts/generate-edition.mjs`.
- **Editorial voice** — the `system` prompt in `scripts/generate-edition.mjs`.
- **Palette & type** — CSS variables at the top of `src/styles.css`.

> **Attribution:** generated articles are AI rewrites of facts from real reporting, and each links back to its source. They are not verbatim copies.
