# LCCIP Backend

Node.js (22.5+) + Express + SQLite (via the built-in `node:sqlite` module — no install, no native compilation). No ORM, no build step.

## Run it

    cd backend
    npm install
    npm run seed      # only needed once, or after frontend/js/01-05 data changes — regenerates data/*.json
    npm start          # serves the API and the frontend/ static files on http://localhost:3000

## Routes

- `POST /api/auth/signup` `{email,password,plan}` → creates a user + session, marks them subscribed.
- `POST /api/auth/login` `{email,password}` → session for an existing user.
- `POST /api/auth/logout`, `GET /api/auth/me`.
- `POST /api/leads` `{industry,name,organisation,email,roleOrCrop,message}` → contact-form capture.
- `GET /api/network/farms?industry=farm|hort` → the pre-seeded demo network (read-only, from `data/*.json`).
- `GET /api/network/hort-monthly` → the horticulture monthly time series (read-only).
- `POST /api/calc/farm/quick`, `POST /api/calc/farm/advanced` — see `calc/farm.js` for the exact input shape (ported from the original client-side `calcInput`/`calcLocal`).
- `POST /api/calc/hort/quick`, `POST /api/calc/hort/advanced` — see `calc/hort.js` (ported from `calcHort`/`hCalcLocal`).
- `GET /api/assessments` (requires login) — the logged-in user's calculation history.

## Environment variables

- `SESSION_SECRET` — secret used to sign the session cookie. **Required** when `NODE_ENV=production`
  (the server refuses to start without it); otherwise falls back to a hardcoded dev secret.

## Data model

`db/schema.sql` — four tables: `users`, `leads`, `assessments`, `sessions` (server-side session
state, replacing an in-memory store). The demo network (7 cattle farms,
12 horticulture growers + monthly time series) is **not** in the database — it's static, read-only
reference data extracted once from the frontend's original hardcoded JS into `data/*.json` by
`data/extract-seed-data.js` (see `docs/superpowers/plans/2026-07-21-backend-api.md`, Task 3).

## Known scope boundaries

The "Investment & ROI" recommendation modelling (`frontend/js/10-ai-roi.js`) stays entirely
client-side — it only re-derives numbers from data already fetched from `/api/network/*`, plus
slider inputs, so there's nothing to persist. Porting it server-side was explicitly out of scope
for this plan.
