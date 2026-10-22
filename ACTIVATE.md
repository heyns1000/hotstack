# HotStack™ Activation Guide — hotstack.faa.zone

Run these commands once to go from "static" to fully operational.

---

## Prerequisites

```bash
npm install -g wrangler
wrangler login   # authenticate with your Cloudflare account
```

---

## Step 1 — Apply D1 Migrations

```bash
# Apply all 7 migrations to the production database
wrangler d1 migrations apply hotstack-db --remote
```

This creates all tables and seeds the 16 marketplace brands.

---

## Step 2 — Create R2 Bucket (if it doesn't exist)

```bash
wrangler r2 bucket create hotstack-intake-bucket
```

---

## Step 3 — Set Worker Secrets

```bash
wrangler secret put GEMINI_API_KEY           # Google AI Studio key (gemini-2.5-flash)
wrangler secret put XAI_API_KEY              # xAI key for Grok-3 (preferred, optional)
wrangler secret put CURRENCY_EXCHANGE_API_KEY # exchangeratesapi.io or similar
wrangler secret put SPOTIFY_ACCESS_TOKEN     # Spotify API token
wrangler secret put MOCHA_USERS_SERVICE_API_URL
wrangler secret put MOCHA_USERS_SERVICE_API_KEY
```

At minimum, set `GEMINI_API_KEY` — the site will work with just that.

---

## Step 4 — Deploy the Worker

```bash
npm run build    # TypeScript + Vite build
wrangler deploy  # deploys Worker + static assets
```

---

## Step 5 — Verify

```bash
# Should return {"brands":[...],"total":16}
curl https://hotstack.faa.zone/api/brands

# Should return {"answer":"...","provider":"gemini"}
curl -X POST https://hotstack.faa.zone/api/ai/faq \
  -H 'Content-Type: application/json' \
  -d '{"question":"What is VaultMesh?"}'

# New super-agent endpoint with role routing
curl -X POST https://hotstack.faa.zone/api/ai/agent \
  -H 'Content-Type: application/json' \
  -d '{"task":"List all live brands in the ecosystem","role":"Brand Evidence Reviewer"}'
```

---

## What Was Added (this branch)

| File | Change |
|---|---|
| `migrations/7.sql` | `marketplace_brands` table + 16 seeded brands |
| `src/worker/routes/brands.ts` | `/api/brands` (list, get by ID, auth-guarded webhook import) |
| `src/worker/routes/ai.ts` | Expanded super-agent: all 16 brands + 8 steward roles + Grok-3 fallback + new `/api/ai/agent` endpoint |
| `src/worker/index.ts` | Registered `/api/brands` route |

---

## Security Notes (from audit findings F01/F02)

- `POST /api/brands/webhook/import` now requires admin session token — the previously unguarded D1 write is closed
- Never commit secrets to the repo — always use `wrangler secret put`
- Set `CURRENCY_EXCHANGE_API_KEY` before the currency routes are exposed publicly
