# Database & Session Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the backend's in-memory session store and synchronous password hashing — the two concrete concurrency/robustness gaps found in the 2026-08-15 backend assessment — without adding any native-compile npm dependency or changing the single-instance deployment shape.

**Architecture:** A small hand-written `express-session` `Store` subclass (`SqliteSessionStore`) persists sessions in the same `node:sqlite` database (`lccip.sqlite`) the app already uses, in a new `sessions` table, replacing the default `MemoryStore`. `routes/auth.js`'s `/signup` and `/login` switch from `bcrypt.hashSync`/`compareSync` to the promise-based `bcrypt.hash`/`compare`, so a slow password hash no longer blocks other in-flight requests. `server.js` also gains a boot-time check that refuses to start in production without a real `SESSION_SECRET`.

**Tech Stack:** Node.js (`node:sqlite`'s `DatabaseSync`, unchanged), Express 4, `express-session` 1.18 (already a dependency — `session.Store` is used directly, no new package), `bcryptjs` 2.4 (already a dependency — its async `hash`/`compare` return a Promise when no callback is passed).

**Spec:** `docs/superpowers/specs/2026-08-15-database-session-hardening-design.md`

## Global Constraints

- Single-instance deployment only — this plan does not touch horizontal scaling, Postgres, or Redis.
- No new native-compile npm dependency. `better-sqlite3` and anything depending on the `sqlite3` package (e.g. `connect-sqlite3`) are explicitly excluded — both are known to fail to install on this machine (see `docs/superpowers/plans/2026-07-21-backend-api.md`'s revision note).
- No new npm packages of any kind are needed for this plan — `express-session` and `bcryptjs` are already dependencies and both features used (`session.Store`, promise-based `bcrypt.hash`/`compare`) ship in the versions already pinned in `backend/package.json`.
- No test framework exists in this repo and none is introduced here. Verification in every task is manual: start the server, make real HTTP requests (via PowerShell `Invoke-RestMethod`), and check the response against an exact expected value — the same convention `docs/superpowers/plans/2026-07-21-backend-api.md` used.
- Windows/PowerShell dev environment.
- Follow the existing codebase's style: inline `db.prepare(sql).get/run(...)` calls (no module-level cached prepared statements) — every existing route file does it this way.

---

### Task 1: `sessions` table and the `SqliteSessionStore` class

**Files:**
- Modify: `backend/db/schema.sql`
- Create: `backend/db/sessionStore.js`

**Interfaces:**
- Consumes: the existing `db` singleton exported by `backend/db/db.js` (`db.prepare(sql).get/run(params)`, matching every other file in `backend/routes/*.js`).
- Produces: `SqliteSessionStore`, a class exported from `backend/db/sessionStore.js` (`module.exports = SqliteSessionStore`). Constructed with no arguments (`new SqliteSessionStore()`). Extends `express-session`'s `session.Store` and implements the three methods `express-session` calls on a configured store: `get(sid, callback)`, `set(sid, sess, callback)`, `destroy(sid, callback)` — `callback` follows Node's `(err, result)` convention. Task 2 consumes this class directly.

- [ ] **Step 1: Add the `sessions` table to `backend/db/schema.sql`**

Append this table definition to the end of the file (after the existing `assessments` table):

```sql

CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  session_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
```

`expires_at` is a Unix-milliseconds timestamp. It's written by `SqliteSessionStore.set()` below, derived from the session's own cookie expiry — it isn't a separately-hardcoded value, so it stays in sync with whatever `maxAge` `server.js`'s session config uses (currently 7 days).

- [ ] **Step 2: Write `backend/db/sessionStore.js`**

```js
const session = require('express-session');
const db = require('./db');

// The session's cookie carries its own expiry once express-session has processed it
// (sess.cookie.expires); fall back to "now + maxAge" for the very first save, before
// express-session has computed .expires yet. A day is a safe fallback if a session
// object somehow has neither (shouldn't happen given server.js always sets maxAge).
function expiresAtFor(sess) {
  if (sess.cookie && sess.cookie.expires) return new Date(sess.cookie.expires).getTime();
  const maxAge = (sess.cookie && sess.cookie.maxAge) || 1000 * 60 * 60 * 24;
  return Date.now() + maxAge;
}

class SqliteSessionStore extends session.Store {
  get(sid, callback) {
    try {
      const row = db.prepare('SELECT session_json FROM sessions WHERE sid = ? AND expires_at > ?').get(sid, Date.now());
      callback(null, row ? JSON.parse(row.session_json) : null);
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sess, callback) {
    try {
      // Opportunistic cleanup - keeps the table from growing unbounded without a
      // separate cron job or setInterval.
      db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
      db.prepare('INSERT OR REPLACE INTO sessions (sid, session_json, expires_at) VALUES (?, ?, ?)')
        .run(sid, JSON.stringify(sess), expiresAtFor(sess));
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = SqliteSessionStore;
```

- [ ] **Step 3: Write a throwaway verification script**

Create `backend/db/_verify-session-store.js` (this file is deleted at the end of this task — do not commit it):

```js
const SqliteSessionStore = require('./sessionStore');
const store = new SqliteSessionStore();

const sess = { cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, userId: 42 };

store.set('test-sid-1', sess, (err) => {
  if (err) throw err;
  store.get('test-sid-1', (err, loaded) => {
    if (err) throw err;
    console.log('after set+get:', JSON.stringify(loaded));
    store.destroy('test-sid-1', (err) => {
      if (err) throw err;
      store.get('test-sid-1', (err, loaded2) => {
        if (err) throw err;
        console.log('after destroy:', loaded2);
      });
    });
  });
});
```

- [ ] **Step 4: Run the verification script**

Run (from the repo root): `node backend/db/_verify-session-store.js`

Expected output, exactly:
```
after set+get: {"cookie":{"maxAge":604800000},"userId":42}
after destroy: null
```

If `after set+get` doesn't match, check `set()`'s `INSERT OR REPLACE` and `get()`'s `SELECT` are using the same column names as the Step 1 schema. If `after destroy` isn't `null`, check `destroy()`'s `DELETE` statement.

- [ ] **Step 5: Delete the throwaway script and the dev database**

```powershell
Remove-Item backend\db\_verify-session-store.js
Remove-Item backend\db\lccip.sqlite -ErrorAction SilentlyContinue
Remove-Item backend\db\lccip.sqlite-wal -ErrorAction SilentlyContinue
Remove-Item backend\db\lccip.sqlite-shm -ErrorAction SilentlyContinue
```

(Deleting the dev database is safe and recommended here — it's demo/seed data, and Task 2's verification restarts the server, which recreates it from `schema.sql` via `db.js`'s existing `db.exec(fs.readFileSync(...))` call. Starting Task 2 from a clean database makes its "session survives a restart" check unambiguous.)

- [ ] **Step 6: Commit**

```bash
git add backend/db/schema.sql backend/db/sessionStore.js
git commit -m "feat(backend): add sessions table and a node:sqlite-backed session store"
```

---

### Task 2: Wire the session store into `server.js`, and fail fast on a missing `SESSION_SECRET`

**Files:**
- Modify: `backend/server.js`

**Interfaces:**
- Consumes: `SqliteSessionStore` from Task 1 (`const SqliteSessionStore = require('./db/sessionStore')`, constructed with `new SqliteSessionStore()`).
- Produces: nothing further downstream — this is the integration point, no other task depends on it.

- [ ] **Step 1: Edit `backend/server.js`**

Current content:

```js
const path = require('path');
const express = require('express');
const session = require('express-session');
require('./db/db'); // creates the schema before any route touches it

const app = express();
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'lccip-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 },
  })
);
```

Replace with:

```js
const path = require('path');
const express = require('express');
const session = require('express-session');
require('./db/db'); // creates the schema before any route touches it
const SqliteSessionStore = require('./db/sessionStore');

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error(
    'SESSION_SECRET must be set when NODE_ENV=production - refusing to start with the default dev secret.'
  );
}

const app = express();
app.use(express.json());
app.use(
  session({
    store: new SqliteSessionStore(),
    secret: process.env.SESSION_SECRET || 'lccip-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 },
  })
);
```

The rest of the file (the `app.use('/api/...', ...)` route mounts, static serving, and `app.listen`) is unchanged.

- [ ] **Step 2: Verify the server still boots normally**

Run: `node backend/server.js`

Expected: prints `LCCIP backend listening on http://localhost:3000` and keeps running (no crash, no thrown error). Stop it with Ctrl+C once confirmed.

- [ ] **Step 3: Verify sessions now survive a server restart**

Start the server in the background and sign up a test user, capturing its session cookie:

```powershell
Start-Job -Name lccip -ScriptBlock { Set-Location 'E:\CodeBases\carbon-project'; node backend\server.js }
Start-Sleep -Seconds 1
$signup = Invoke-RestMethod -Uri http://localhost:3000/api/auth/signup -Method Post -ContentType 'application/json' `
  -Body (@{ email = 'restart-test@test.com'; password = 'testpass123' } | ConvertTo-Json) -SessionVariable sess
$signup.user.email
```

Expected: prints `restart-test@test.com`.

Confirm the session works before restarting:

```powershell
(Invoke-RestMethod -Uri http://localhost:3000/api/auth/me -WebSession $sess).user.email
```

Expected: `restart-test@test.com`.

Now restart the server (this is the actual behavior change under test — `MemoryStore` would lose the session here; the new store shouldn't):

```powershell
Stop-Job -Name lccip; Remove-Job -Name lccip
Start-Job -Name lccip -ScriptBlock { Set-Location 'E:\CodeBases\carbon-project'; node backend\server.js }
Start-Sleep -Seconds 1
(Invoke-RestMethod -Uri http://localhost:3000/api/auth/me -WebSession $sess).user.email
```

Expected: still prints `restart-test@test.com` — the same cookie, from the browser session captured before the restart, still resolves to a logged-in user because the session was persisted to `lccip.sqlite` rather than an in-memory map that died with the old process.

Clean up:

```powershell
Stop-Job -Name lccip; Remove-Job -Name lccip
```

- [ ] **Step 4: Verify the `SESSION_SECRET` boot check**

```powershell
$env:NODE_ENV = 'production'
Remove-Item Env:\SESSION_SECRET -ErrorAction SilentlyContinue
node backend\server.js
```

Expected: throws immediately —
```
Error: SESSION_SECRET must be set when NODE_ENV=production - refusing to start with the default dev secret.
```
— and exits (no `listening on` line ever printed).

```powershell
$env:SESSION_SECRET = 'a-real-secret-for-this-check'
node backend\server.js
```

Expected: prints `LCCIP backend listening on http://localhost:3000` normally this time. Stop it with Ctrl+C.

Reset the environment so later tasks aren't affected:

```powershell
Remove-Item Env:\NODE_ENV -ErrorAction SilentlyContinue
Remove-Item Env:\SESSION_SECRET -ErrorAction SilentlyContinue
```

- [ ] **Step 5: Commit**

```bash
git add backend/server.js
git commit -m "feat(backend): persist sessions via SqliteSessionStore, fail fast without SESSION_SECRET in production"
```

---

### Task 3: Async `bcrypt` in `routes/auth.js`

**Files:**
- Modify: `backend/routes/auth.js`

**Interfaces:**
- Consumes: nothing from Tasks 1-2 — independent of the session-store work (this task fixes password hashing, not session storage). Can be done before or after Tasks 1-2; ordered last here only because the spec lists it last.
- Produces: nothing further downstream.

- [ ] **Step 1: Edit `backend/routes/auth.js`**

Current `/signup` and `/login` handlers:

```js
router.post('/signup', (req, res) => {
  const { email, password, plan } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'an account with that email already exists — try logging in' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (email, password_hash, plan, subscribed_at) VALUES (?, ?, ?, datetime('now'))")
    .run(email, passwordHash, plan || 'producer');
  req.session.userId = info.lastInsertRowid;
  res.status(201).json({ user: { id: info.lastInsertRowid, email, plan: plan || 'producer' } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'invalid email or password' });
  }
  req.session.userId = user.id;
  res.json({ user: { id: user.id, email: user.email, plan: user.plan } });
});
```

Replace with:

```js
router.post('/signup', async (req, res) => {
  const { email, password, plan } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'an account with that email already exists — try logging in' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const info = db
      .prepare("INSERT INTO users (email, password_hash, plan, subscribed_at) VALUES (?, ?, ?, datetime('now'))")
      .run(email, passwordHash, plan || 'producer');
    req.session.userId = info.lastInsertRowid;
    res.status(201).json({ user: { id: info.lastInsertRowid, email, plan: plan || 'producer' } });
  } catch (err) {
    res.status(500).json({ error: 'something went wrong' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  try {
    const ok = user && (await bcrypt.compare(password || '', user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: 'invalid email or password' });
    }
    req.session.userId = user.id;
    res.json({ user: { id: user.id, email: user.email, plan: user.plan } });
  } catch (err) {
    res.status(500).json({ error: 'something went wrong' });
  }
});
```

`user && (await bcrypt.compare(...))` short-circuits exactly like the original `!user || !bcrypt.compareSync(...)` did — `bcrypt.compare` is never called with a missing `user.password_hash` when the email doesn't exist. `/logout` and `/me` are untouched (they don't call `bcrypt`).

- [ ] **Step 2: Verify signup/login still work correctly**

```powershell
Start-Job -Name lccip -ScriptBlock { Set-Location 'E:\CodeBases\carbon-project'; node backend\server.js }
Start-Sleep -Seconds 1

# 1. Signup with a new email -> 201 + user
$r1 = Invoke-RestMethod -Uri http://localhost:3000/api/auth/signup -Method Post -ContentType 'application/json' `
  -Body (@{ email = 'auth-test@test.com'; password = 'correct-password' } | ConvertTo-Json)
$r1.user.email   # expect: auth-test@test.com

# 2. Signup again with the same email -> 409 duplicate (unaffected by this change - happens before hashing)
try {
  Invoke-RestMethod -Uri http://localhost:3000/api/auth/signup -Method Post -ContentType 'application/json' `
    -Body (@{ email = 'auth-test@test.com'; password = 'whatever' } | ConvertTo-Json)
} catch {
  $_.Exception.Response.StatusCode.value__   # expect: 409
}

# 3. Login with the correct password -> 200 + user
$r3 = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -ContentType 'application/json' `
  -Body (@{ email = 'auth-test@test.com'; password = 'correct-password' } | ConvertTo-Json)
$r3.user.email   # expect: auth-test@test.com

# 4. Login with the wrong password -> 401
try {
  Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -ContentType 'application/json' `
    -Body (@{ email = 'auth-test@test.com'; password = 'wrong-password' } | ConvertTo-Json)
} catch {
  $_.Exception.Response.StatusCode.value__   # expect: 401
}

# 5. Login with an email that was never signed up -> 401 (exercises the `user &&` short-circuit)
try {
  Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -ContentType 'application/json' `
    -Body (@{ email = 'never-signed-up@test.com'; password = 'anything' } | ConvertTo-Json)
} catch {
  $_.Exception.Response.StatusCode.value__   # expect: 401 (not 500 - confirms no crash from a missing password_hash)
}

Stop-Job -Name lccip; Remove-Job -Name lccip
```

All five expected values above must match. If step 5 returns 500 instead of 401, the `user &&` short-circuit isn't working — check that `await` only runs when `user` is truthy.

- [ ] **Step 3: Verify a signup no longer blocks unrelated requests**

This is the actual concurrency fix under test. `bcryptjs`'s async `hash`/`compare` doesn't run in a separate thread (it's pure JS) — it yields the event loop in chunks instead of blocking it solid, so *other* requests can be served while a hash is in flight. Confirm that: fire a signup, and shortly after (while it's still hashing), fire an unrelated fast GET — the GET should come back quickly rather than waiting for the signup's ~tens-of-milliseconds hash to finish first.

```powershell
Start-Job -Name lccip -ScriptBlock { Set-Location 'E:\CodeBases\carbon-project'; node backend\server.js }
Start-Sleep -Seconds 1

$signupJob = Start-Job -ScriptBlock {
  Invoke-RestMethod -Uri http://localhost:3000/api/auth/signup -Method Post -ContentType 'application/json' `
    -Body (@{ email = 'concurrency-test@test.com'; password = 'testpass123' } | ConvertTo-Json)
}
Start-Sleep -Milliseconds 5
$farmsMs = (Measure-Command { Invoke-RestMethod -Uri 'http://localhost:3000/api/network/farms?industry=farm' }).TotalMilliseconds
Write-Output "GET /api/network/farms took $farmsMs ms while a signup was in flight"
Wait-Job $signupJob | Out-Null; Remove-Job $signupJob

Stop-Job -Name lccip; Remove-Job -Name lccip
```

Expected: `$farmsMs` is small (a handful of milliseconds — it's a cached in-memory JSON read), not ~tens of milliseconds. There's no fixed pass/fail threshold to assert programmatically here (timing is inherently a little noisy) — the point is confirming the GET isn't visibly held up behind the signup, which is what `hashSync` would have forced before this change.

- [ ] **Step 4: Commit**

```bash
git add backend/routes/auth.js
git commit -m "fix(backend): use async bcrypt in signup/login so hashing doesn't block the event loop"
```
