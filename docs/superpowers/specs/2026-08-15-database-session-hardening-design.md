# Database & Session Hardening — Design

**Status:** proposed, pending user review.

**Origin:** a robustness/scalability assessment of `backend/` (2026-08-15) found the backend cannot safely serve concurrent traffic in its current form. This spec scopes the fix for two of the findings: the blocking auth path, and the in-memory session store. Everything else the assessment flagged (rate limiting, `helmet`, structured logging, Dockerfile/CI, a test suite) is out of scope here — separate follow-ups.

## Goal

Make `backend/` safe to run under real concurrent load on a **single server instance**, without introducing any new native (compiled) npm dependency, and without changing the deployment shape (still one Node process, still SQLite, still no new infra service to operate).

## Constraints carried in from prior decisions

- **Single-instance deployment**, not horizontally scaled. Ruled out migrating to Postgres/Redis — not justified at this scale and out of scope for this task.
- **No native-compile dependencies.** `docs/superpowers/plans/2026-07-21-backend-api.md` records that `better-sqlite3` already failed to install on this machine during the original build (no prebuilt binary for the Node version in use, no C++ build toolchain configured), which is why the backend runs on Node's built-in `node:sqlite` today. That constraint still holds — this spec does not reintroduce `better-sqlite3` or any other package requiring native compilation (e.g. `sqlite3`, which `connect-sqlite3` depends on).

## What's changing

### 1. Database driver — unchanged

Stays on `node:sqlite`'s `DatabaseSync`. Every query in this app (`db/db.js`, and its callers in `routes/auth.js`, `routes/calc.js`, `routes/leads.js`, `routes/assessments.js`) is a simple single-row lookup, insert, or primary-key select — no joins, no table scans. The synchronous blocking cost per query is sub-millisecond and not a practical concurrency problem at single-instance scale. `PRAGMA journal_mode = WAL` (already set) stays as-is.

This reframes the original assessment's priority: the DB driver was never the dominant blocking cost for *this* app's query shapes — synchronous `bcrypt` was. Fixing that (below) is the change that actually matters for concurrency.

### 2. Async bcrypt in `routes/auth.js`

`POST /signup` and `POST /login` currently call `bcrypt.hashSync` / `bcrypt.compareSync`. Password hashing is deliberately CPU-slow (cost factor 10 — tens of milliseconds), and running it synchronously blocks the entire event loop — every other in-flight request — for that duration, on every signup and every login.

Change: both handlers become `async`, and switch to the promise-based `bcrypt.hash(password, 10)` / `bcrypt.compare(password, hash)`. Both get wrapped in `try/catch` — today a thrown error here would crash the process (no error handling exists on this path at all); an unhandled rejection from the promise form would do the same or worse, so this fix also closes that gap, not just removes the blocking.

No other route touches `bcrypt`.

### 3. Session store: custom, on `node:sqlite`

`server.js` configures `express-session` with no `store` option today, which defaults to `MemoryStore` — explicitly flagged by `express-session`'s own docs as unfit for production: it leaks memory (sessions never expire from the store, only the cookie), and every restart drops all logged-in users.

Off-the-shelf replacements were considered and ruled out:
- `better-sqlite3-session-store` — requires a `better-sqlite3` instance. Not available (see constraints).
- `connect-sqlite3` — depends on the `sqlite3` package, which also requires native compilation. Same risk, not available.

Instead: a small custom store, written directly against the `db/db.js` `node:sqlite` connection already in the process. `express-session`'s `Store` interface is narrow — a class extending `session.Store` implementing three methods:

```js
class SqliteSessionStore extends session.Store {
  get(sid, cb) { /* SELECT session_json FROM sessions WHERE sid = ? AND expires_at > ? */ }
  set(sid, sess, cb) { /* opportunistically DELETE expired rows, then INSERT OR REPLACE */ }
  destroy(sid, cb) { /* DELETE FROM sessions WHERE sid = ? */ }
}
```

No `touch()` override needed initially — the default behavior (no-op on touch, relying on `set` to refresh) is acceptable for this app's traffic pattern; can be added later if session expiry behavior needs tightening.

**Schema addition** (`db/schema.sql`):

```sql
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  session_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL  -- Unix ms; derived from sess.cookie.expires (falls back to
                                -- Date.now() + cookie.maxAge if express-session hasn't set
                                -- .expires yet), so it stays in sync with the existing
                                -- 7-day maxAge in server.js's session config, not a
                                -- separately hardcoded value.
);
```

Expired-row cleanup happens opportunistically inside `set()` (`DELETE FROM sessions WHERE expires_at < ?` before the insert/replace) rather than via a cron job or `setInterval` — simplest option that keeps the table from growing unbounded without adding a background process to manage.

### 4. Fail-fast on `SESSION_SECRET`

`server.js` currently falls back to a hardcoded dev secret (`'lccip-dev-secret-change-me'`) if `SESSION_SECRET` is unset — meaning a production deployment that forgets to set the env var silently signs sessions with a secret sitting in git history.

Change: before `app.listen`, if `process.env.NODE_ENV === 'production'` and `process.env.SESSION_SECRET` is unset, throw and exit immediately with a clear error message. The dev fallback remains for local/demo use when `NODE_ENV` isn't `'production'`.

## Files touched

- `backend/db/schema.sql` — add `sessions` table.
- `backend/db/sessionStore.js` — **new file**, the custom `SqliteSessionStore` class.
- `backend/server.js` — wire `store: new SqliteSessionStore(db)` into the `express-session` config; add the `SESSION_SECRET` boot check.
- `backend/routes/auth.js` — `/signup` and `/login` become `async`, switch to promise-based `bcrypt.hash`/`compare`, add `try/catch`.

No changes to `routes/calc.js`, `routes/leads.js`, `routes/assessments.js`, `routes/network.js`, or any frontend file — none of them touch sessions or bcrypt, and the `db.prepare(...).get/run/all()` call shape they use is unaffected since the underlying driver isn't changing.

## Error handling

- Auth handlers: `try/catch` around the async bcrypt calls, responding `500 { error: 'something went wrong' }` on unexpected failure rather than crashing the process. Existing validation (missing email/password, duplicate email, wrong credentials) is unchanged.
- Session store: `get`/`set`/`destroy` each wrap their `db` calls in `try/catch` and call back with `(err)` on failure, per the `express-session` `Store` contract — a DB error surfaces as a session-layer error rather than an uncaught exception.
- Boot-time secret check: a thrown `Error` with a message naming the missing env var, before the server starts listening — fails loud and immediately rather than degrading silently at runtime.

## Testing / verification

No test framework exists in this repo (none was requested here either — out of scope, consistent with the rest of the codebase). Verification is manual, matching how the original backend-api plan was verified:
- Signup and login still work end-to-end (via the frontend modal or direct `curl`/`Invoke-RestMethod`), including the failure paths (duplicate email, wrong password).
- A session survives a server restart (log in, restart `node server.js`, confirm `GET /api/auth/me` still returns the user) — this is the concrete behavior change from moving off `MemoryStore`, worth checking explicitly since it's the one thing that couldn't be verified before.
- `SESSION_SECRET` boot check: confirm the server refuses to start with `NODE_ENV=production` and no `SESSION_SECRET` set, and starts normally otherwise.
- A quick informal concurrency check: fire several parallel signup/login requests and confirm none of them stall behind each other for the old ~tens-of-milliseconds-per-request duration.

## Out of scope

Rate limiting, `helmet`/security headers, structured logging, Dockerfile/CI, a formal test suite, and any move toward Postgres/Redis/horizontal scaling — all real gaps from the original assessment, all separate tasks.
