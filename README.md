# HotStack — File Orchestration & Global Brand Platform

HotStack is a full-stack application built with **React 19 + Hono + Vite** deployed on **Cloudflare Workers**. It provides file orchestration, brand search, an admin panel, AI-powered FAQ, currency conversion, and more.

> Created with [Mocha](https://getmocha.com). Join our community on [Discord](https://discord.gg/shDEGBSe2d).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Tailwind CSS 3 |
| Backend | Hono 4 (Cloudflare Workers) |
| Storage | Cloudflare D1 (SQL), Cloudflare R2 (files) |
| AI | Google Gemini (`@google/genai`) |
| Build | Vite 7, TypeScript 5.8 |
| Lint | ESLint 9 flat config |

---

## Prerequisites

- **Node.js ≥ 20**
- **npm ≥ 10**
- A [Cloudflare account](https://dash.cloudflare.com/) with D1 and R2 configured (for production)

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate Cloudflare Worker types (requires wrangler config)
npm run cf-typegen
```

### Environment Variables

Copy the secrets into your Cloudflare Worker environment (via `wrangler secret put` or the dashboard):

| Secret | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key |
| `CURRENCY_EXCHANGE_API_KEY` | Currency exchange rate API key |
| `SPOTIFY_ACCESS_TOKEN` | Spotify API access token |
| `MOCHA_USERS_SERVICE_API_URL` | Mocha users service URL |
| `MOCHA_USERS_SERVICE_API_KEY` | Mocha users service API key |

For local development with the Cloudflare Vite plugin, create a `.dev.vars` file (not committed):

```ini
GEMINI_API_KEY=your_key_here
CURRENCY_EXCHANGE_API_KEY=your_key_here
SPOTIFY_ACCESS_TOKEN=your_token_here
MOCHA_USERS_SERVICE_API_URL=https://...
MOCHA_USERS_SERVICE_API_KEY=your_key_here
```

---

## Development

```bash
npm run dev
```

Opens the Vite dev server with Cloudflare Worker emulation via Wrangler. The app runs at `http://localhost:5173` by default.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with Worker emulation |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint on all source files |
| `npm run typecheck` | Run TypeScript type checking only (no emit) |
| `npm run cf-typegen` | Regenerate Cloudflare Worker type definitions |
| `npm run check` | Full type check + build + wrangler dry-run |

---

## Database Migrations

Migrations live in the `migrations/` directory. Apply them to your D1 database:

```bash
# Local (development)
npx wrangler d1 execute hotstack-db --local --file=migrations/0001_initial.sql

# Remote (production)
npx wrangler d1 execute hotstack-db --file=migrations/0001_initial.sql
```

---

## Deployment

```bash
# Build and deploy to Cloudflare
npm run build
npx wrangler deploy
```

---

## Application Routes

| Path | Description |
|---|---|
| `/` | Home page with file manager |
| `/brands` | Global brand search |
| `/dashboard` | User dashboard |
| `/drop-zone` | File drop zone & AI analysis |
| `/hotstack` | HotStack admin panel |
| `/cart` | Shopping cart with AI recommendations |
| `/ecosystem` | Ecosystem explorer |
| `/global-synergy-hub` | Synergy hub (Spotify, AI, Currency) |
| `/faa-global` | FAA Global Release page |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Admin dashboard |
| `/admin/files` | Admin file management |
| `/admin/logs` | Admin activity logs |
| `/admin/system` | Admin system info |

---

## Follow-up Recommendations (Non-blocking)

- **Tests**: Add unit and integration tests (e.g., Vitest for React components, worker route tests).
- **Authentication hardening**: Refresh session tokens on activity; add rate limiting on `/api/admin/login`.
- **Type safety**: Replace remaining `any` types in worker routes and React hooks with proper interfaces.
- **Error boundaries**: Add React error boundaries around page components for resilient UX.
- **CI pipeline**: Add a GitHub Actions workflow that runs `npm run build` and `npm run lint` on every PR.
- **Dependency updates**: Wrangler has updates available (`4.59.1` → `4.111.0`); consider updating when ready.
