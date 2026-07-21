# LCCIP Backend API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real Node.js/Express/SQLite backend for LCCIP — user accounts (signup/login), persisted contact leads, persisted calculation history, and the two carbon-emission calculation engines (farm and horticulture, quick and advanced) moved server-side — then wire the `frontend/` app (built in `docs/superpowers/plans/2026-07-21-frontend-restructure.md`) to call it instead of computing everything client-side.

**Architecture:** A single Express app (`backend/server.js`) exposes a JSON REST API under `/api/*` and also serves `frontend/` as static files, so the browser talks to the same origin (no CORS needed). SQLite (via `better-sqlite3`, synchronous — no async ceremony for a single-process app) stores everything that gets *created* (users, leads, assessment history). The pre-seeded demo network (the 7 cattle farms and 12 horticulture growers + their monthly time series) is read-only reference data extracted once from the frontend's existing JS constants into JSON files on disk — it never changes, so it doesn't need database tables, just a `GET` route reading a file.

**Tech Stack:** Node.js, Express 4, `better-sqlite3`, `bcryptjs` (pure-JS password hashing — no native build tooling needed on Windows), `express-session` (cookie-based sessions, `MemoryStore` — acceptable for a single-process student project; sessions reset on server restart, which is a known, accepted trade-off, not a bug).

## Global Constraints

- Runs on Node.js (any LTS version already on the machine — this plan doesn't pin a version).
- No ORM — raw SQL via `better-sqlite3`'s prepared statements. The schema is small enough that an ORM would be pure overhead.
- Every calculation endpoint must reproduce the **exact same formulas** currently in `frontend/js/03-calculator-farm.js` (`calcLocal`), `frontend/js/02-dashboard-farm.js` (`calcInput`), `frontend/js/07-hort-quick-calc.js` (`calcHort`), and `frontend/js/09-calculator-hort.js` (`hCalcLocal`) — this plan ports them, it does not "improve" or "fix" them (the known issues in `LCCIP_Code_Review_Documentation.md` §6 are out of scope here).
- Session cookies: `httpOnly`, `sameSite: 'lax'`. No plaintext password ever touches the database — `bcryptjs` hash only.
- This plan assumes Plan 1 (frontend restructure) is already complete — every task below references files created there (`frontend/js/01-data-core.js` through `frontend/js/10-ai-roi.js`, `frontend/index.html`).
- No test framework is introduced (none exists in this repo and none was requested). Verification is via `Invoke-RestMethod`/`curl` against the running server with hand-computed expected values, plus a browser click-through for the frontend-integration tasks — treat each "Step 2: verify" as the equivalent of "run the test and confirm it passes."
- Windows/PowerShell dev environment.

---

### Task 1: Backend project scaffolding

**Files:**
- Create: `backend/package.json`
- Create: `backend/.gitignore`

**Interfaces:**
- Produces: an installable Node project every later task adds files into.

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "lccip-backend",
  "version": "1.0.0",
  "private": true,
  "description": "LCCIP backend API — auth, leads, carbon-emission calculators, network reference data.",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "seed": "node data/extract-seed-data.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "better-sqlite3": "^11.3.0",
    "express": "^4.19.2",
    "express-session": "^1.18.0"
  }
}
```

- [ ] **Step 2: Create `backend/.gitignore`**

```
node_modules/
db/lccip.sqlite
db/lccip.sqlite-shm
db/lccip.sqlite-wal
```

- [ ] **Step 3: Install dependencies**

Run:
```powershell
cd C:\Users\muhta\Documents\carbon-project\backend
npm install
```
Expected: `node_modules/` created, no errors. `better-sqlite3` compiles a small native addon on install — if this fails because build tools are missing, re-run with `npm install --build-from-source=false` (it ships prebuilt binaries for common platforms, so a plain `npm install` should normally succeed without Visual Studio Build Tools).

- [ ] **Step 4: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/.gitignore
git commit -m "chore: scaffold backend Node project"
```

---

### Task 2: SQLite schema and database connection

**Files:**
- Create: `backend/db/schema.sql`
- Create: `backend/db/db.js`

**Interfaces:**
- Produces: `module.exports` from `db.js` — a ready-to-query `better-sqlite3` `Database` instance, imported by every route file in later tasks.

- [ ] **Step 1: Write `backend/db/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'producer',
  subscribed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  industry TEXT NOT NULL CHECK(industry IN ('farm','hort')),
  name TEXT,
  organisation TEXT,
  email TEXT,
  role_or_crop TEXT,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  industry TEXT NOT NULL CHECK(industry IN ('farm','hort')),
  mode TEXT NOT NULL CHECK(mode IN ('quick','advanced')),
  input_json TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- [ ] **Step 2: Write `backend/db/db.js`**

```js
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'lccip.sqlite');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

module.exports = db;
```

- [ ] **Step 3: Verify the schema applies cleanly**

Run:
```powershell
cd C:\Users\muhta\Documents\carbon-project\backend
node -e "require('./db/db'); console.log('schema OK')"
node -e "const db=require('./db/db'); console.log(db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all())"
```
Expected: `schema OK`, then an array containing `{name:'users'}`, `{name:'leads'}`, `{name:'assessments'}` (plus SQLite's internal `sqlite_sequence`).

- [ ] **Step 4: Commit**

```bash
git add backend/db/schema.sql backend/db/db.js
git commit -m "feat(backend): add SQLite schema and db connection"
```

---

### Task 3: Extract seed data from the frontend into JSON

**Files:**
- Create: `backend/data/extract-seed-data.js`
- Create (generated, do not hand-edit): `backend/data/farms-cattle.json`
- Create (generated, do not hand-edit): `backend/data/farms-hort.json`
- Create (generated, do not hand-edit): `backend/data/hort-monthly.json`

**Interfaces:**
- Consumes: `frontend/js/01-data-core.js` through `frontend/js/05-hort-data-stats.js` (must already exist — Plan 1, Tasks 3–4).
- Produces: three JSON files served read-only by `routes/network.js` (Task 6).

This avoids hand-transcribing the `FARMS` array (7 farms) and, especially, the `HDATA` object (a single ~74KB line of monthly time-series JSON) — both get pulled out of the real frontend JS files programmatically, so there is zero risk of a copy-paste typo silently corrupting a number.

- [ ] **Step 1: Write `backend/data/extract-seed-data.js`**

```js
const fs = require('fs');
const path = require('path');

const FRONTEND_JS = path.join(__dirname, '..', '..', 'frontend', 'js');
// Order matters: 04-industry-router.js references `refreshLocks`, defined in 01-data-core.js,
// at its top level (`const _origRefresh = refreshLocks;`) — concatenating in load order avoids
// a ReferenceError during extraction, exactly mirroring how the browser loads these files.
const FILES = [
  '01-data-core.js',
  '02-dashboard-farm.js',
  '03-calculator-farm.js',
  '04-industry-router.js',
  '05-hort-data-stats.js',
];

const source = FILES.map(f => fs.readFileSync(path.join(FRONTEND_JS, f), 'utf8')).join('\n');
const extract = new Function(`${source}\nreturn { FARMS, HFARMS, HDATA };`);
const { FARMS, HFARMS, HDATA } = extract();

const outDir = __dirname;
fs.writeFileSync(path.join(outDir, 'farms-cattle.json'), JSON.stringify(FARMS, null, 2));
fs.writeFileSync(path.join(outDir, 'farms-hort.json'), JSON.stringify(HFARMS, null, 2));
fs.writeFileSync(path.join(outDir, 'hort-monthly.json'), JSON.stringify(HDATA, null, 2));

console.log(
  `Seed data extracted: ${FARMS.length} cattle farms, ${HFARMS.length} hort growers, ${HDATA.rows.length} monthly rows.`
);
```

- [ ] **Step 2: Run it**

Run:
```powershell
cd C:\Users\muhta\Documents\carbon-project\backend
node data/extract-seed-data.js
```
Expected output: `Seed data extracted: 7 cattle farms, 12 hort growers, 144 monthly rows.` (12 growers × 12 months = 144 — if this count is different, something in Plan 1's extraction shifted a line boundary; go back and re-check `frontend/js/05-hort-data-stats.js` against `index.html` lines 1858–2099 before continuing).

- [ ] **Step 3: Spot-check the generated JSON against the known source values**

Run:
```powershell
cd C:\Users\muhta\Documents\carbon-project\backend
node -e "const f=require('./data/farms-cattle.json'); console.log(f[0].id, f[0].name, f[0].net)"
node -e "const h=require('./data/farms-hort.json'); console.log(h[0].id, h[0].name, h[0].net)"
```
Expected: `RF-QLD-001 Riverdale Cattle Farm 2167` and `F001 Riverina Tomatoes 198.9` — these match the values visible in `index.html` line 1302 (`net:2167`) and line 1813 (`"net": 198.9`).

- [ ] **Step 4: Commit**

```bash
git add backend/data
git commit -m "feat(backend): extract seed reference data from frontend into JSON"
```

---

### Task 4: Authentication (signup, login, logout, session)

**Files:**
- Create: `backend/routes/auth.js`
- Create: `backend/middleware/requireAuth.js`

**Interfaces:**
- Consumes: `backend/db/db.js` (Task 2), `req.session` (populated once `express-session` middleware is wired in `server.js`, Task 9).
- Produces: `router` exported from `auth.js`, mounted at `/api/auth` in Task 9. `requireAuth` middleware consumed by Task 9's assessments route.

- [ ] **Step 1: Write `backend/middleware/requireAuth.js`**

```js
module.exports = function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'login required' });
  next();
};
```

- [ ] **Step 2: Write `backend/routes/auth.js`**

```js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/db');

const router = express.Router();

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

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.status(204).end());
});

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'not logged in' });
  const user = db.prepare('SELECT id, email, plan FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'not logged in' });
  res.json({ user });
});

module.exports = router;
```

- [ ] **Step 3: Verify (after Task 9 wires `server.js` — come back to this step once the server can actually start; for now just confirm the file has no syntax errors)**

Run:
```powershell
cd C:\Users\muhta\Documents\carbon-project\backend
node -c routes/auth.js
node -c middleware/requireAuth.js
```
Expected: no output (syntax OK). The functional test (`Invoke-RestMethod`) happens in Task 9 Step 4, once `server.js` exists and can listen for requests.

- [ ] **Step 4: Commit**

```bash
git add backend/routes/auth.js backend/middleware/requireAuth.js
git commit -m "feat(backend): add auth routes (signup/login/logout/me)"
```

---

### Task 5: Contact-form leads

**Files:**
- Create: `backend/routes/leads.js`

**Interfaces:**
- Consumes: `backend/db/db.js`.
- Produces: `router` mounted at `/api/leads` in Task 9.

- [ ] **Step 1: Write `backend/routes/leads.js`**

```js
const express = require('express');
const db = require('../db/db');

const router = express.Router();

router.post('/', (req, res) => {
  const { industry, name, organisation, email, roleOrCrop, message } = req.body;
  if (!industry || !['farm', 'hort'].includes(industry)) {
    return res.status(400).json({ error: 'industry must be "farm" or "hort"' });
  }
  const info = db
    .prepare(
      'INSERT INTO leads (industry, name, organisation, email, role_or_crop, message) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(industry, name || null, organisation || null, email || null, roleOrCrop || null, message || null);
  res.status(201).json({ id: info.lastInsertRowid });
});

module.exports = router;
```

- [ ] **Step 2: Syntax check**

Run: `node -c backend/routes/leads.js` — expect no output.

- [ ] **Step 3: Commit**

```bash
git add backend/routes/leads.js
git commit -m "feat(backend): add contact-lead capture route"
```

---

### Task 6: Network reference data (read-only)

**Files:**
- Create: `backend/routes/network.js`

**Interfaces:**
- Consumes: the three JSON files from Task 3.
- Produces: `router` mounted at `/api/network` in Task 9. Response shapes are **identical** to the original `FARMS`/`HFARMS`/`HDATA` JS constants, so frontend rendering code that already expects those shapes (Task 12) needs no restructuring, only a `fetch`.

- [ ] **Step 1: Write `backend/routes/network.js`**

```js
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', 'data');
const cache = {};

function loadJson(file) {
  if (!cache[file]) cache[file] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
  return cache[file];
}

router.get('/farms', (req, res) => {
  const industry = req.query.industry === 'hort' ? 'hort' : 'farm';
  res.json(loadJson(industry === 'hort' ? 'farms-hort.json' : 'farms-cattle.json'));
});

router.get('/hort-monthly', (req, res) => {
  res.json(loadJson('hort-monthly.json'));
});

module.exports = router;
```

- [ ] **Step 2: Syntax check**

Run: `node -c backend/routes/network.js` — expect no output.

- [ ] **Step 3: Commit**

```bash
git add backend/routes/network.js
git commit -m "feat(backend): add read-only network reference data routes"
```

---

### Task 7: Farm calculation engine (quick + advanced)

**Files:**
- Create: `backend/calc/farm.js`

**Interfaces:**
- Produces: `calcLocal(input)`, `quickFarmResult(input)`, `advancedFarmResult(input)` — pure functions, no I/O, consumed by `routes/calc.js` (Task 9).
- Ported from: `frontend/js/03-calculator-farm.js` function `calcLocal` (the advanced-wizard engine, originally `index.html` lines 1716–1737) and `frontend/js/02-dashboard-farm.js` function `calcInput` (the quick estimate, originally `index.html` lines 1580–1611 for the math portion — the HTML-rendering half of `calcInput` stays client-side and is not ported).

- [ ] **Step 1: Write `backend/calc/farm.js`**

```js
// Ported from frontend/js/03-calculator-farm.js:calcLocal — same formulas, same constants.
const CLASSES = [
  ['Dairy cows (milking)', 3.4],
  ['Dairy heifers/replacements', 2.2],
  ['Beef breeding cows', 2.4],
  ['Beef steers/heifers (grazing)', 1.9],
  ['Feedlot cattle', 1.6],
  ['Bulls', 2.6],
  ['Calves', 0.8],
];

function calcLocal(i) {
  const F = {
    diesel: 2.68, petrol: 2.3, lpg: 1.62, elec: 0.66, grain: 0.65, hay: 0.45, fertN: 5.5, lime: 0.44,
    freight: 0.12, treeSeq: 6.0, pastSeq: 0.5, cropSeq: 0.1, clearing: 120, revegSeq: 8.0, manureBase: 0.55,
  };
  let enteric = 0, headTot = 0;
  (i.ents || []).forEach(e => {
    const cls = CLASSES[e.cls] || CLASSES[0];
    const ef = cls[1] * ((e.wt || 450) / 450);
    enteric += (e.head || 0) * ef;
    headTot += e.head || 0;
  });
  enteric *= 1 - (i.additive || 0);
  const manure = headTot * F.manureBase * (i.manureFactor || 1);
  const feed = (i.grain || 0) * F.grain + (i.hay || 0) * F.hay;
  const fertiliser = ((i.fertN || 0) * F.fertN) / 1000 + (i.lime || 0) * F.lime;
  const fuel = ((i.diesel || 0) * F.diesel + (i.petrol || 0) * F.petrol + (i.lpg || 0) * F.lpg) / 1000;
  const netElec = Math.max(0, (i.elec || 0) - (i.solar || 0));
  const energy = (netElec * F.elec) / 1000;
  const transport = ((i.freight || 0) * F.freight) / 1000;
  const landUse = (i.cleared || 0) * F.clearing;
  const seq =
    (i.trees || 0) * F.treeSeq + (i.pasture || 0) * F.pastSeq + (i.crop || 0) * F.cropSeq + (i.reveg || 0) * F.revegSeq;
  const gross = enteric + manure + feed + fertiliser + fuel + energy + transport + landUse;
  const net = Math.max(0, gross - seq);
  const s1 = enteric + manure + fuel + fertiliser + landUse;
  const s2 = energy;
  const s3 = feed + transport;
  return { enteric, manure, feed, fertiliser, fuel, energy, transport, landUse, seq, gross, net, s1, s2, s3, headTot };
}

// Ported from frontend/js/03-calculator-farm.js:runAdvanced — the aggregation/ACCU half only
// (the HTML string it builds stays client-side; this returns the numbers that HTML is built from).
function advancedFarmResult(inp) {
  const r = calcLocal(inp);
  const milk = inp.milk || 0, lwg = inp.lwg || 0, redpct = inp.redpct || 0;
  const price = inp.price || 38, buf = (inp.buffer || 0) / 100;
  const intensity = milk > 0 ? (r.gross * 1000) / milk : lwg > 0 ? (r.gross * 1000) / lwg : 0;
  const iUnit = milk > 0 ? 'kg CO₂-e / L milk' : lwg > 0 ? 'kg CO₂-e / kg LWG' : '—';
  const baseline = r.net, project = r.net * (1 - redpct / 100), reduction = baseline - project;
  const accus = Math.max(0, Math.round(reduction * (1 - buf)));
  const revenue = accus * price;
  const perHead = r.headTot > 0 ? r.net / r.headTot : 0;
  const perPerson = Math.round(r.net / 15);
  return { ...r, intensity, iUnit, baseline, project, reduction, accus, revenue, perHead, perPerson, engine: 'LCCIP indicative' };
}

// Ported from frontend/js/02-dashboard-farm.js:calcInput — the math half only.
function quickFarmResult(inp) {
  const head = inp.head || 0, diesel = inp.diesel || 0, elec = inp.elec || 0, feed = inp.feed || 0;
  const fert = inp.fert || 0, milk = inp.milk || 0, trees = inp.trees || 0, pasture = inp.pasture || 0;
  const cleared = inp.cleared || 0, redpct = inp.redpct || 0, type = inp.type || 'Dairy';
  const entericRate = { Dairy: 3.1, Beef: 2.0, Mixed: 2.6, Feedlot: 2.2 }[type] ?? 2.6;
  const EF = { enteric: entericRate, manure: 0.55, diesel: 2.68, elec: 0.66, feed: 0.6, fert: 5.5, treeSeq: 6.0, pastSeq: 0.5, clearing: 120 };
  const enteric = head * EF.enteric, manure = head * EF.manure, fuel = (diesel * EF.diesel) / 1000, energy = (elec * EF.elec) / 1000;
  const feedE = feed * EF.feed, fertE = (fert * EF.fert) / 1000, transport = feed * 0.05 + head * 0.02;
  const landUse = cleared * EF.clearing, seq = trees * EF.treeSeq + pasture * EF.pastSeq;
  const grossAct = enteric + manure + fuel + energy + feedE + fertE + transport;
  const gross = grossAct + landUse, net = Math.max(0, gross - seq);
  const intensity = milk > 0 ? (gross * 1000) / milk : 0;
  const s1 = enteric + manure + fuel + fertE + landUse, s2 = energy, s3 = feedE + transport;
  const perHead = head > 0 ? net / head : 0, perPerson = Math.round(net / 15);
  const baseline = net, project = net * (1 - redpct / 100), reduction = baseline - project, buffer = 0.05;
  const accus = Math.max(0, Math.round(reduction * (1 - buffer))), revenue = accus * 38;
  return { enteric, manure, feedE, energy, fuel, fertE, transport, landUse, seq, gross, net, s1, s2, s3, intensity, perHead, perPerson, baseline, project, reduction, accus, revenue };
}

module.exports = { calcLocal, quickFarmResult, advancedFarmResult, CLASSES };
```

- [ ] **Step 2: Verify the port against hand-computed values from the known default wizard inputs**

The advanced wizard's default enterprises (from `frontend/js/03-calculator-farm.js`, `seedEnts`) are `[{cls:0,head:180,wt:550},{cls:1,head:70,wt:380},{cls:3,head:62,wt:420}]`. Run:
```powershell
cd C:\Users\muhta\Documents\carbon-project\backend
node -e "const {calcLocal}=require('./calc/farm'); const r=calcLocal({ents:[{cls:0,head:180,wt:550},{cls:1,head:70,wt:380},{cls:3,head:62,wt:420}],additive:0,manureFactor:1,grain:500,hay:350,fertN:12000,lime:20,diesel:67000,petrol:4000,lpg:0,elec:320000,solar:0,freight:42000,pasture:420,crop:50,trees:18,cleared:0,reveg:2}); console.log(Math.round(r.gross), Math.round(r.net), Math.round(r.headTot))"
```
Expected: `headTot` = 312 (180+70+62, matching the "312 head" shown in the original UI's default Riverdale farm). Note the exact gross/net figures down — they must stay **identical** every time you re-run this command (determinism check) and must match what the browser shows when you enter these same defaults into the "Full property assessment" wizard and click Calculate, once Task 11 wires the frontend to this endpoint.

- [ ] **Step 3: Commit**

```bash
git add backend/calc/farm.js
git commit -m "feat(backend): port farm emissions calculators (quick + advanced) to the server"
```

---

### Task 8: Horticulture calculation engine (quick + advanced)

**Files:**
- Create: `backend/calc/hort.js`

**Interfaces:**
- Produces: `hCalcLocal(input)`, `quickHortResult(input)`, `advancedHortResult(input)`.
- Ported from: `frontend/js/09-calculator-hort.js` function `hCalcLocal` (originally `index.html` lines 2714–2733) and `frontend/js/07-hort-quick-calc.js` function `calcHort` (originally `index.html` lines 2464–2480 for the math portion).

- [ ] **Step 1: Write `backend/calc/hort.js`**

```js
// Ported from frontend/js/09-calculator-hort.js:hCalcLocal — same formulas, same constants.
function hCalcLocal(i) {
  const F = {
    diesel: 2.71783, elec: 0.66, soilN2O: 7.82243, fertUp: 1.35, lime: 440, plastic: 2.6, card: 0.94,
    freight: 0.12, water: 0.15, chem: 9.1, waste: 520, refrig: 1430, treeSeq: 6.0, coverSeq: 0.4,
  };
  const yld = (i.ents || []).reduce((a, e) => a + (e.yld || 0), 0);
  const diesel = ((i.diesel || 0) * F.diesel) / 1000;
  const netE = Math.max(0, (i.elec || 0) - (i.solar || 0));
  const elec = (netE * F.elec) / 1000;
  const soilN = ((i.n || 0) * F.soilN2O) / 1000;
  const fertUp = ((i.n || 0) * F.fertUp) / 1000;
  const lime = ((i.lime || 0) * F.lime) / 1000;
  const plastic = ((i.plastic || 0) * F.plastic) / 1000;
  const card = ((i.card || 0) * F.card) / 1000;
  const pack = plastic + card;
  const freight = ((i.freight || 0) * F.freight) / 1000;
  const water = ((i.water || 0) * F.water) / 1000;
  const chem = ((i.chem || 0) * F.chem) / 1000;
  const waste = ((i.waste || 0) * F.waste) / 1000;
  const refrig = ((i.refrig || 0) * F.refrig) / 1000;
  const seq = (i.trees || 0) * F.treeSeq + (i.cover || 0) * F.coverSeq + (i.rem || 0);
  const gross = diesel + elec + soilN + fertUp + lime + pack + freight + water + chem + waste + refrig;
  const net = Math.max(0, gross - seq);
  const s1 = diesel + soilN + lime + refrig, s2 = elec, s3 = fertUp + pack + freight + water + chem + waste;
  return {
    diesel, elec, soilN, fertUp, lime, pack, plastic, card, freight, water, chem, waste, refrig, seq, gross, net, s1, s2, s3, yld,
    rows: [
      ['Fuel — diesel', 'Scope 1', diesel], ['Soil N₂O', 'Scope 1', soilN], ['Lime & urea', 'Scope 1', lime],
      ['Refrigerant', 'Scope 1', refrig], ['Electricity (net of solar)', 'Scope 2', elec],
      ['Fertiliser (upstream)', 'Scope 3', fertUp], ['Packaging', 'Scope 3', pack], ['Freight', 'Scope 3', freight],
      ['Water', 'Scope 3', water], ['Chemicals', 'Scope 3', chem], ['Organic waste', 'Scope 3', waste],
      ['Removals (soil + biomass + veg)', 'Removal', -seq],
    ],
  };
}

// Ported from frontend/js/09-calculator-hort.js:hRunAdvanced — the aggregation/ACCU half only.
function advancedHortResult(inp) {
  const r = hCalcLocal(inp);
  const redpct = inp.redpct || 0, price = inp.price || 38, buf = (inp.buffer || 0) / 100;
  const ci = r.yld ? (r.gross * 1000) / r.yld : 0;
  const baseline = r.net, project = r.net * (1 - redpct / 100), reduction = baseline - project;
  const accus = Math.max(0, Math.round(reduction * (1 - buf)));
  const revenue = accus * price;
  const perPerson = Math.round(r.net / 15);
  return { ...r, ci, baseline, project, reduction, accus, revenue, perPerson, engine: 'LCCIP indicative' };
}

// Ported from frontend/js/07-hort-quick-calc.js:calcHort — the math half only.
function quickHortResult(inp) {
  const F = { diesel: 2.718 + 0.668, elec: 0.66, soilN2O: 4.42, fertUp: 1.35, plastic: 2.6, card: 0.94, freight: 0.12, water: 0.15, chem: 9.1 };
  const n = k => inp[k] || 0;
  const diesel = (n('diesel') * F.diesel) / 1000, elec = (n('elec') * F.elec) / 1000;
  const soilN = (n('n') * F.soilN2O) / 1000, fertUp = (n('n') * F.fertUp) / 1000;
  const plastic = (n('plastic') * F.plastic) / 1000, card = (n('card') * F.card) / 1000;
  const freight = (n('freight') * F.freight) / 1000, water = (n('water') * F.water) / 1000, chem = (n('chem') * F.chem) / 1000;
  const pack = plastic + card;
  const gross = diesel + elec + soilN + fertUp + pack + freight + water + chem;
  const rem = n('rem'), net = Math.max(0, gross - rem);
  const y = n('yield'), ci = y > 0 ? (net * 1000) / y : 0;
  const s1 = diesel + soilN, s2 = elec, s3 = fertUp + pack + freight + water + chem;
  const area = n('area') || 1;
  return { diesel, elec, soilN, fertUp, pack, plastic, card, freight, water, chem, rem, gross, net, ci, s1, s2, s3, area };
}

module.exports = { hCalcLocal, quickHortResult, advancedHortResult };
```

- [ ] **Step 2: Verify against the default quick-estimate values shown in the original UI**

The quick horticulture form's defaults (`index.html` lines 1097–1111 / `frontend/index.html` unchanged) are diesel=22000, elec=95000, n=7800, plastic=9500, card=42000, freight=185000, water=310000, chem=850, rem=86, yield=640000, area=65. Run:
```powershell
cd C:\Users\muhta\Documents\carbon-project\backend
node -e "const {quickHortResult}=require('./calc/hort'); const r=quickHortResult({diesel:22000,elec:95000,n:7800,plastic:9500,card:42000,freight:185000,water:310000,chem:850,rem:86,yield:640000,area:65}); console.log(Math.round(r.gross), Math.round(r.net), r.ci.toFixed(3))"
```
Note the three numbers down — they must match what the browser shows for "My Orchard" with unmodified defaults once Task 11 wires this up.

- [ ] **Step 3: Commit**

```bash
git add backend/calc/hort.js
git commit -m "feat(backend): port horticulture emissions calculators (quick + advanced) to the server"
```

---

### Task 9: Wire the calc routes, assessments history, and `server.js`

**Files:**
- Create: `backend/routes/calc.js`
- Create: `backend/routes/assessments.js`
- Create: `backend/server.js`

**Interfaces:**
- Consumes: everything from Tasks 2, 4, 5, 6, 7, 8.
- Produces: a running HTTP server on `http://localhost:3000` — the integration point every frontend task (10–13) targets.

- [ ] **Step 1: Write `backend/routes/calc.js`**

```js
const express = require('express');
const db = require('../db/db');
const { quickFarmResult, advancedFarmResult } = require('../calc/farm');
const { quickHortResult, advancedHortResult } = require('../calc/hort');

const router = express.Router();

function persist(req, industry, mode, input, result) {
  db.prepare('INSERT INTO assessments (user_id, industry, mode, input_json, result_json) VALUES (?, ?, ?, ?, ?)').run(
    req.session.userId || null,
    industry,
    mode,
    JSON.stringify(input),
    JSON.stringify(result)
  );
}

router.post('/farm/quick', (req, res) => {
  const result = quickFarmResult(req.body);
  persist(req, 'farm', 'quick', req.body, result);
  res.json(result);
});

router.post('/farm/advanced', (req, res) => {
  const result = advancedFarmResult(req.body);
  persist(req, 'farm', 'advanced', req.body, result);
  res.json(result);
});

router.post('/hort/quick', (req, res) => {
  const result = quickHortResult(req.body);
  persist(req, 'hort', 'quick', req.body, result);
  res.json(result);
});

router.post('/hort/advanced', (req, res) => {
  const result = advancedHortResult(req.body);
  persist(req, 'hort', 'advanced', req.body, result);
  res.json(result);
});

module.exports = router;
```

- [ ] **Step 2: Write `backend/routes/assessments.js`**

```js
const express = require('express');
const db = require('../db/db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT id, industry, mode, input_json, result_json, created_at FROM assessments WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.session.userId);
  res.json(
    rows.map(r => ({
      id: r.id,
      industry: r.industry,
      mode: r.mode,
      input: JSON.parse(r.input_json),
      result: JSON.parse(r.result_json),
      createdAt: r.created_at,
    }))
  );
});

module.exports = router;
```

- [ ] **Step 3: Write `backend/server.js`**

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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/network', require('./routes/network'));
app.use('/api/calc', require('./routes/calc'));
app.use('/api/assessments', require('./routes/assessments'));

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));
app.get('*', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LCCIP backend listening on http://localhost:${PORT}`));
```

- [ ] **Step 4: Start the server and verify every route end-to-end**

Run (in one terminal):
```powershell
cd C:\Users\muhta\Documents\carbon-project\backend
node server.js
```
Expected: `LCCIP backend listening on http://localhost:3000`.

In a second terminal, run each of these and check the noted expectation:
```powershell
# Network reference data
(Invoke-RestMethod http://localhost:3000/api/network/farms?industry=farm).Count        # expect 7
(Invoke-RestMethod http://localhost:3000/api/network/farms?industry=hort).Count        # expect 12
(Invoke-RestMethod http://localhost:3000/api/network/hort-monthly).rows.Count          # expect 144

# Signup, session cookie persists across calls via -SessionVariable
Invoke-RestMethod -SessionVariable s -Method Post http://localhost:3000/api/auth/signup -ContentType 'application/json' -Body '{"email":"test@example.com","password":"hunter22","plan":"producer"}'
# expect: user object with id/email/plan, no error

Invoke-RestMethod -WebSession $s http://localhost:3000/api/auth/me               # expect the same user back
Invoke-RestMethod -Method Post http://localhost:3000/api/auth/logout -WebSession $s -SkipHttpErrorCheck  # expect empty 204
Invoke-RestMethod -Method Post http://localhost:3000/api/auth/login -WebSession $s -ContentType 'application/json' -Body '{"email":"test@example.com","password":"hunter22"}'
# expect: user object again

# Duplicate signup is rejected
try { Invoke-RestMethod -Method Post http://localhost:3000/api/auth/signup -ContentType 'application/json' -Body '{"email":"test@example.com","password":"x"}' }
catch { $_.Exception.Response.StatusCode.value__ }   # expect 409

# Leads
Invoke-RestMethod -Method Post http://localhost:3000/api/leads -ContentType 'application/json' -Body '{"industry":"farm","name":"Jo","email":"jo@x.com","message":"hi"}'
# expect: {"id":1}

# Farm calculators — compare against the numbers you wrote down in Task 7 Step 2
Invoke-RestMethod -Method Post http://localhost:3000/api/calc/farm/advanced -ContentType 'application/json' -Body '{"ents":[{"cls":0,"head":180,"wt":550},{"cls":1,"head":70,"wt":380},{"cls":3,"head":62,"wt":420}],"additive":0,"manureFactor":1,"grain":500,"hay":350,"fertN":12000,"lime":20,"diesel":67000,"petrol":4000,"lpg":0,"elec":320000,"solar":0,"freight":42000,"pasture":420,"crop":50,"trees":18,"cleared":0,"reveg":2}'
# expect: .gross and .net match Task 7 Step 2's numbers exactly

# Horticulture calculator — compare against Task 8 Step 2's numbers
Invoke-RestMethod -Method Post http://localhost:3000/api/calc/hort/quick -ContentType 'application/json' -Body '{"diesel":22000,"elec":95000,"n":7800,"plastic":9500,"card":42000,"freight":185000,"water":310000,"chem":850,"rem":86,"yield":640000,"area":65}'
# expect: .gross, .net, .ci match Task 8 Step 2's numbers exactly

# Assessments history requires login
Invoke-RestMethod -WebSession $s http://localhost:3000/api/assessments   # expect an array (may be empty if calc calls above weren't made with -WebSession $s)
```
Stop the server with `Ctrl+C` once every check passes.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/calc.js backend/routes/assessments.js backend/server.js
git commit -m "feat(backend): wire calc/assessments routes and server entrypoint"
```

---

### Task 10: Frontend integration — real signup/login in the Subscribe modal

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/js/01-data-core.js`

**Interfaces:**
- Consumes: `POST /api/auth/signup`, `POST /api/auth/login` (Task 4).
- Produces: a working password field and a login/signup toggle; `subscribe()` and a new `login()` become `async` and talk to the real backend instead of just flipping a client-side `subscribed` flag.

- [ ] **Step 1: Replace the modal markup in `frontend/index.html`**

Find (this is the block Plan 1 copied unchanged from `index.html` lines 500–514):
```html
<div class="modal" id="modal">
  <div class="modal-card">
    <button class="close-x" onclick="closeModal()">×</button>
    <h2 id="modal-title">Create your account</h2>
    <p class="m" id="modal-sub">Paid subscribers can view carbon-emission details for any farm in the Australian network.</p>
    <div class="fld"><label>Work email</label><input id="m-email" type="email" placeholder="you@organisation.com.au" value="analyst@rabobank.com.au"></div>
    <div class="fld"><label>Plan</label><select id="m-plan">
      <option>Network — view any farm in Australia ($149/mo)</option>
      <option>Producer — your own farm ($0, free)</option>
      <option>Enterprise — supply chain & API (custom)</option>
    </select></div>
    <button class="cta" style="width:100%;padding:12px;margin-top:6px" onclick="subscribe()">Start subscription</button>
    <p class="note">Demo prototype — no real payment or authentication. Riverdale uses your supplied pilot dataset; other farms are illustrative. Synthetic placeholders, not for formal reporting.</p>
  </div>
</div>
```

Replace with:
```html
<div class="modal" id="modal">
  <div class="modal-card">
    <button class="close-x" onclick="closeModal()">×</button>
    <h2 id="modal-title">Create your account</h2>
    <p class="m" id="modal-sub">Subscribers can view carbon-emission details for any farm in the Australian network.</p>
    <div id="modal-error" style="display:none;color:var(--red);font-size:12.5px;margin-bottom:10px"></div>
    <div class="fld"><label>Work email</label><input id="m-email" type="email" placeholder="you@organisation.com.au"></div>
    <div class="fld"><label>Password</label><input id="m-password" type="password" placeholder="At least 8 characters"></div>
    <div class="fld" id="m-plan-fld"><label>Plan</label><select id="m-plan">
      <option>Network — view any farm in Australia ($149/mo)</option>
      <option>Producer — your own farm ($0, free)</option>
      <option>Enterprise — supply chain & API (custom)</option>
    </select></div>
    <button class="cta" style="width:100%;padding:12px;margin-top:6px" id="modal-submit" onclick="subscribe()">Start subscription</button>
    <p class="note" id="modal-toggle" style="cursor:pointer;text-decoration:underline" onclick="toggleModalMode()">Already have an account? Log in instead.</p>
    <p class="note">No real payment. Data is stored so you can return to your assessments — not for formal carbon reporting.</p>
  </div>
</div>
```

- [ ] **Step 2: Replace `subscribe()` in `frontend/js/01-data-core.js`**

Find (this is the block Plan 1 copied unchanged from `index.html` lines 1347–1353):
```js
function openModal(){document.getElementById('modal').classList.add('show');}
function closeModal(){document.getElementById('modal').classList.remove('show');}
function subscribe(){
  subscribed=true; closeModal();
  document.getElementById('authbtn').textContent='Subscribed ✓';
  refreshLocks(); go(INDUSTRY==='hort'?'h-dash':'dashboard');
}
```

Replace with:
```js
function openModal(){document.getElementById('modal').classList.add('show');}
function closeModal(){document.getElementById('modal').classList.remove('show');}

let modalMode = 'signup'; // 'signup' | 'login'
function toggleModalMode(){
  modalMode = modalMode === 'signup' ? 'login' : 'signup';
  document.getElementById('modal-title').textContent = modalMode === 'signup' ? 'Create your account' : 'Log in';
  document.getElementById('modal-submit').textContent = modalMode === 'signup' ? 'Start subscription' : 'Log in';
  document.getElementById('m-plan-fld').style.display = modalMode === 'signup' ? '' : 'none';
  document.getElementById('modal-toggle').textContent = modalMode === 'signup' ? 'Already have an account? Log in instead.' : "Don't have an account? Sign up instead.";
  document.getElementById('modal-error').style.display = 'none';
}

async function subscribe(){
  const email = document.getElementById('m-email').value.trim();
  const password = document.getElementById('m-password').value;
  const plan = document.getElementById('m-plan').value;
  const errBox = document.getElementById('modal-error');
  errBox.style.display = 'none';
  const endpoint = modalMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
  const body = modalMode === 'signup' ? { email, password, plan } : { email, password };
  try{
    const r = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await r.json();
    if(!r.ok){ errBox.textContent = data.error || 'Something went wrong.'; errBox.style.display = 'block'; return; }
    subscribed = true;
    closeModal();
    document.getElementById('authbtn').textContent = 'Subscribed ✓';
    refreshLocks();
    go(INDUSTRY === 'hort' ? 'h-dash' : 'dashboard');
  } catch(e){
    errBox.textContent = 'Could not reach the server — is the backend running?';
    errBox.style.display = 'block';
  }
}
```

- [ ] **Step 3: Manual verification**

Start the backend (`node backend/server.js`), open `http://localhost:3000/` in a browser, click Subscribe, fill in a new email + password, submit. Expected: modal closes, header button reads "Subscribed ✓", dashboard/AI/credit views un-gate. Refresh the page and click Subscribe again with the same email — expect the "already exists" error to show. Click "Already have an account? Log in instead.", re-enter the same email/password, submit — expect success.

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html frontend/js/01-data-core.js
git commit -m "feat(frontend): wire Subscribe modal to real signup/login"
```

---

### Task 11: Frontend integration — wire both calculators to the backend

**Files:**
- Modify: `frontend/js/03-calculator-farm.js`
- Modify: `frontend/js/02-dashboard-farm.js`
- Modify: `frontend/js/09-calculator-hort.js`
- Modify: `frontend/js/07-hort-quick-calc.js`

**Interfaces:**
- Consumes: `POST /api/calc/farm/advanced`, `POST /api/calc/farm/quick`, `POST /api/calc/hort/advanced`, `POST /api/calc/hort/quick` (Task 9).
- Produces: `getEmissions`, `hGetEmissions`, `calcInput`, `calcHort` now fetch from the server instead of computing locally — the client-side `calcLocal`/`hCalcLocal` math functions are deleted (the server is now the single source of truth for the calculation, matching the "swappable engine" comment already in the original code).

- [ ] **Step 1: Replace `getEmissions`/`calcLocal` in `frontend/js/03-calculator-farm.js`**

Find:
```js
/* ---- SWAPPABLE ENGINE: today = local NGER/IPCC-aligned; tomorrow = AIA EAP API ---- */
async function getEmissions(inp){
  // When AIA EAP API access is granted, call it here (via a serverless function that holds the key):
  //   const r = await fetch('/.netlify/functions/eap', {method:'POST', body:JSON.stringify(inp)});
  //   if(r.ok) return {...await r.json(), engine:'AIA EAP'};
  return {...calcLocal(inp), engine:'LCCIP indicative'};
}
function calcLocal(i){
  const F={diesel:2.68,petrol:2.30,lpg:1.62,elec:0.66,grain:0.65,hay:0.45,fertN:5.5,lime:0.44,
           freight:0.12,treeSeq:6.0,pastSeq:0.5,cropSeq:0.1,clearing:120,revegSeq:8.0,manureBase:0.55};
  let enteric=0, headTot=0;
  i.ents.forEach(e=>{ const ef=CLASSES[e.cls][1]*(e.wt/450); enteric+=e.head*ef; headTot+=e.head; });
  enteric*= (1 - i.additive);
  const manure   = headTot*F.manureBase*i.manureFactor;
  const feed     = i.grain*F.grain + i.hay*F.hay;
  const fertiliser = i.fertN*F.fertN/1000 + i.lime*F.lime;
  const fuel     = (i.diesel*F.diesel + i.petrol*F.petrol + i.lpg*F.lpg)/1000;
  const netElec  = Math.max(0, i.elec - i.solar);
  const energy   = netElec*F.elec/1000;
  const transport= i.freight*F.freight/1000;
  const landUse  = i.cleared*F.clearing;
  const seq      = i.trees*F.treeSeq + i.pasture*F.pastSeq + i.crop*F.cropSeq + i.reveg*F.revegSeq;
  const gross    = enteric+manure+feed+fertiliser+fuel+energy+transport+landUse;
  const net      = Math.max(0, gross - seq);
  const s1 = enteric+manure+fuel+fertiliser+landUse;
  const s2 = energy;
  const s3 = feed+transport;
  return {enteric,manure,feed,fertiliser,fuel,energy,transport,landUse,seq,gross,net,s1,s2,s3,headTot};
}
```

Replace with:
```js
/* ---- ENGINE: the AIA-EAP-shaped calculation now runs on our own backend ---- */
async function getEmissions(inp){
  const r = await fetch('/api/calc/farm/advanced', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(inp)
  });
  if(!r.ok) throw new Error('Calculation failed');
  return await r.json();
}
```

`runAdvanced()` (the next function in this same file) already does `const r=await getEmissions(inp);` and reads `r.engine`, `r.gross`, `r.net`, `r.s1/s2/s3`, `r.headTot`, `r.intensity`, `r.iUnit`, `r.baseline`, `r.project`, `r.reduction`, `r.accus`, `r.revenue`, `r.perHead`, `r.perPerson` — every one of those fields is present on the object returned by `POST /api/calc/farm/advanced` (built by `advancedFarmResult` in `backend/calc/farm.js`, Task 7), so **no other change is needed in `runAdvanced()`**.

- [ ] **Step 2: Convert `calcInput` in `frontend/js/02-dashboard-farm.js` to fetch the backend**

Find the top of the function:
```js
function calcInput(){
  const $=id=>document.getElementById(id);
  const head=+$('i-head').value||0, diesel=+$('i-diesel').value||0, elec=+$('i-elec').value||0,
        feed=+$('i-feed').value||0, fert=+$('i-fert').value||0, milk=+$('i-milk').value||0,
        trees=+$('i-trees').value||0, pasture=+$('i-pasture').value||0, cleared=+$('i-cleared').value||0,
        redpct=+$('i-redpct').value||0, type=$('i-type').value;
  // --- NGER/IPCC-aligned emission factors (indicative) ---
  const EF={enteric:{Dairy:3.1,Beef:2.0,Mixed:2.6,Feedlot:2.2}[type], manure:0.55, diesel:2.68, elec:0.66,
            feed:0.6, fert:5.5, treeSeq:6.0, pastSeq:0.5, clearing:120};
  const enteric=head*EF.enteric, manure=head*EF.manure, fuel=diesel*EF.diesel/1000, energy=elec*EF.elec/1000,
        feedE=feed*EF.feed, fertE=fert*EF.fert/1000, transport=(feed*0.05)+(head*0.02);
  const landUse=cleared*EF.clearing, seq=trees*EF.treeSeq+pasture*EF.pastSeq;
  const grossAct=enteric+manure+fuel+energy+feedE+fertE+transport;
  const gross=grossAct+landUse, net=Math.max(0,gross-seq);
  const intensity=milk>0?(gross*1000/milk):0;
  const s1=enteric+manure+fuel+fertE+landUse, s2=energy, s3=feedE+transport;
  // benchmarks (all reference figures)
  const perHead=head>0?(net/head):0, perLitre=intensity, perPerson=Math.round(net/15);
  // ACCU: baseline − project
  const baseline=net, project=net*(1-redpct/100), reduction=baseline-project, buffer=0.05;
  const accus=Math.max(0,Math.round(reduction*(1-buffer))), revenue=accus*38;
  const rows=[
```

Replace it with an `async` wrapper that fetches the same shape and destructures it into the same local variable names, so the large HTML-template literal immediately below (unchanged — still builds `rows`, `$('input-result').innerHTML=...`) keeps working without edits:
```js
async function calcInput(){
  const $=id=>document.getElementById(id);
  const head=+$('i-head').value||0, diesel=+$('i-diesel').value||0, elec=+$('i-elec').value||0,
        feed=+$('i-feed').value||0, fert=+$('i-fert').value||0, milk=+$('i-milk').value||0,
        trees=+$('i-trees').value||0, pasture=+$('i-pasture').value||0, cleared=+$('i-cleared').value||0,
        redpct=+$('i-redpct').value||0, type=$('i-type').value;
  const r = await fetch('/api/calc/farm/quick', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({head,diesel,elec,feed,fert,milk,trees,pasture,cleared,redpct,type})
  }).then(res=>res.json());
  const EF={enteric:{Dairy:3.1,Beef:2.0,Mixed:2.6,Feedlot:2.2}[type], manure:0.55, diesel:2.68, elec:0.66,
            feed:0.6, fert:5.5, treeSeq:6.0, pastSeq:0.5, clearing:120};
  const {enteric,manure,fuel,energy,feedE,fertE,transport,landUse,seq,gross,net,intensity,s1,s2,s3,perHead,perPerson,baseline,project,reduction,accus,revenue}=r;
  const perLitre=intensity;
  const rows=[
```

The rest of the function (the `rows=[...]` array literal and everything after it, through the closing `}`) is **unchanged** — it already only reads the local variables this replacement still defines (`enteric, manure, feedE, energy, fuel, fertE, transport, landUse, seq, EF, head, diesel, elec, feed, fert, trees, pasture, cleared, type, milk`).

Also update the wizard's call site: the "Calculate emissions" button already does `onclick="calcInput()"` (unchanged markup) — since `calcInput` is now `async`, the button click just fires an unawaited promise, which is fine (the function updates the DOM itself once the fetch resolves).

- [ ] **Step 3: Apply the equivalent change to `hGetEmissions`/`hCalcLocal` in `frontend/js/09-calculator-hort.js`**

Find:
```js
/* swappable engine — same pattern as farm; EAP stub commented */
async function hGetEmissions(inp){
  // when AIA EAP API is connected: const r=await fetch('/.netlify/functions/eap-hort',{...}); if(r.ok) return {...await r.json(),engine:'AIA EAP'};
  return {...hCalcLocal(inp), engine:'LCCIP indicative'};
}
function hCalcLocal(i){
```
(and the whole `hCalcLocal` function body through its closing `}`).

Replace the `hGetEmissions`/`hCalcLocal` pair with:
```js
/* engine: the AIA-EAP-shaped calculation now runs on our own backend */
async function hGetEmissions(inp){
  const r = await fetch('/api/calc/hort/advanced', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(inp)
  });
  if(!r.ok) throw new Error('Calculation failed');
  return await r.json();
}
```
`hRunAdvanced()` (the next function, unchanged) reads `r.yld, r.gross, r.net, r.seq, r.s1/s2/s3, r.rows, r.ci, r.baseline, r.project, r.reduction, r.accus, r.revenue, r.engine` — all present on `advancedHortResult`'s return shape (Task 8), so no further change needed there.

- [ ] **Step 4: Apply the equivalent change to `calcHort` in `frontend/js/07-hort-quick-calc.js`**

Find:
```js
function calcHort(){
  const $=id=>document.getElementById(id), n=id=>+($(id).value)||0;
  const F={diesel:2.718+0.668, elec:0.66, soilN2O:(4.42), fertUp:1.35, plastic:2.6, card:0.94, freight:0.12, water:0.15, chem:9.1};
  const diesel=n('hi-diesel')*F.diesel/1000, elec=n('hi-elec')*F.elec/1000,
        soilN=n('hi-n')*F.soilN2O/1000, fertUp=n('hi-n')*F.fertUp/1000,
        plastic=n('hi-plastic')*F.plastic/1000, card=n('hi-card')*F.card/1000,
        freight=n('hi-freight')*F.freight/1000, water=n('hi-water')*F.water/1000,
        chem=n('hi-chem')*F.chem/1000;
  const pack=plastic+card;
  const gross=diesel+elec+soilN+fertUp+pack+freight+water+chem;
  const rem=n('hi-rem'), net=Math.max(0,gross-rem);
  const y=n('hi-yield'), ci=y>0?net*1000/y:0;
  const s1=diesel+soilN, s2=elec, s3=fertUp+pack+freight+water+chem;
  const area=n('hi-area')||1;
  const rows=[['Fuel (diesel)','Scope 1/3',diesel],['Soil N₂O','Scope 1',soilN],['Electricity','Scope 2',elec],
    ['Fertiliser (upstream)','Scope 3',fertUp],['Packaging','Scope 3',pack],['Transport / freight','Scope 3',freight],
    ['Water supply','Scope 3',water],['Chemicals','Scope 3',chem],['Removals (soil + biomass)','Removal',-rem]];
```

Replace with:
```js
async function calcHort(){
  const $=id=>document.getElementById(id), n=id=>+($(id).value)||0;
  const diesel_i=n('hi-diesel'), elec_i=n('hi-elec'), n_i=n('hi-n'), plastic_i=n('hi-plastic'), card_i=n('hi-card'),
        freight_i=n('hi-freight'), water_i=n('hi-water'), chem_i=n('hi-chem'), rem_i=n('hi-rem'), yield_i=n('hi-yield'), area_i=n('hi-area');
  const r = await fetch('/api/calc/hort/quick', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({diesel:diesel_i, elec:elec_i, n:n_i, plastic:plastic_i, card:card_i, freight:freight_i, water:water_i, chem:chem_i, rem:rem_i, yield:yield_i, area:area_i})
  }).then(res=>res.json());
  const {diesel, elec, soilN, fertUp, pack, freight, water, chem, rem, gross, net, ci, s1, s2, s3, area} = r;
  const y = yield_i;
  const rows=[['Fuel (diesel)','Scope 1/3',diesel],['Soil N₂O','Scope 1',soilN],['Electricity','Scope 2',elec],
    ['Fertiliser (upstream)','Scope 3',fertUp],['Packaging','Scope 3',pack],['Transport / freight','Scope 3',freight],
    ['Water supply','Scope 3',water],['Chemicals','Scope 3',chem],['Removals (soil + biomass)','Removal',-rem]];
```

The rest of the function (the `$('h-input-result').innerHTML=...` template and everything after it) is **unchanged** — it already only reads `net, gross, ci, s1, s2, s3, area, rem, y, rows` and the `$(...)` form fields, all of which are still defined by this replacement.

- [ ] **Step 5: Manual verification**

With the backend running, open the app, go to Farm Data Input → Quick estimate, click Calculate — expect the same net figure as before Plan 2 (compare against a screenshot from Plan 1 Task 1, or re-derive by hand). Repeat for Full property assessment (click through all 6 wizard steps to Results). Repeat both for the Horticulture industry. Open DevTools → Network tab and confirm each "Calculate" click fires the corresponding `/api/calc/...` request and gets a `200`.

- [ ] **Step 6: Commit**

```bash
git add frontend/js/03-calculator-farm.js frontend/js/02-dashboard-farm.js frontend/js/09-calculator-hort.js frontend/js/07-hort-quick-calc.js
git commit -m "feat(frontend): move emissions calculations to the backend API"
```

---

### Task 12: Frontend integration — fetch network reference data on boot

**Files:**
- Modify: `frontend/js/01-data-core.js`
- Modify: `frontend/js/04-industry-router.js`
- Modify: `frontend/js/05-hort-data-stats.js`

**Interfaces:**
- Consumes: `GET /api/network/farms?industry=farm`, `GET /api/network/farms?industry=hort`, `GET /api/network/hort-monthly` (Task 6).
- Produces: `FARMS`, `HFARMS`, `HDATA` become `let` bindings populated by `fetch` before `boot()` renders anything, instead of hardcoded literals.

- [ ] **Step 1: Change the `FARMS` declaration in `frontend/js/01-data-core.js`**

Find: `const FARMS=[` … through its closing `];` (the full 7-farm array literal).

Replace with: `let FARMS = [];` (a single line — delete the entire array literal; it now lives in `backend/data/farms-cattle.json`, Task 3, and is fetched below).

- [ ] **Step 2: Change the `HFARMS` declaration in `frontend/js/04-industry-router.js`**

Find: `const HFARMS=[` … through its closing `];` (the full 12-grower array literal).

Replace with: `let HFARMS = [];`

- [ ] **Step 3: Change the `HDATA` declaration in `frontend/js/05-hort-data-stats.js`**

Find: `const HDATA={` … through its closing `};` (the single long line).

Replace with: `let HDATA = { srcNames: [], rows: [] };` (an empty-but-correctly-shaped placeholder so any code that runs before the fetch resolves — there shouldn't be any, but this is defensive — doesn't throw on `HDATA.rows.filter`).

- [ ] **Step 4: Make `boot()` fetch all three before rendering, in `frontend/js/01-data-core.js`**

Find:
```js
function boot(){
```
and read through to its closing `}` (originally `index.html` lines 1415–1422 — it currently synchronously calls `fillSelect`, `ausMap`, populates `#stepgrid`/`#layers`, and sets the hero stat numbers).

Wrap its existing body in an async loader. Replace the function signature and its first line with:
```js
async function boot(){
  const [farms, hfarms, hdata] = await Promise.all([
    fetch('/api/network/farms?industry=farm').then(r=>r.json()),
    fetch('/api/network/farms?industry=hort').then(r=>r.json()),
    fetch('/api/network/hort-monthly').then(r=>r.json()),
  ]);
  FARMS = farms; HFARMS = hfarms; HDATA = hdata;
```
Leave every existing line inside `boot()` below that point completely unchanged — they already reference `FARMS` by name, and by the time they run, `FARMS` has been reassigned to the fetched array.

- [ ] **Step 5: Confirm the trailing bootstrap calls in `frontend/js/07-hort-quick-calc.js` still work**

`boot(); buildNav();` are two independent top-level statements. `boot()` is now `async` and returns a promise immediately without blocking — but `buildNav()` (which calls `refreshLocks()`, not dependent on `FARMS`/`HFARMS`/`HDATA`) doesn't need to wait for it. No change needed to this file; just confirm by reading it that these two calls are still there, unmodified, as the last two lines before `</script>` — Plan 1 Task 4 Step 4 already asserted this.

- [ ] **Step 6: Manual verification**

Start the backend, open the app in a browser with DevTools → Network open. Expected on page load: three requests to `/api/network/...`, each `200`, followed by the home page's hero stats (`7 farms connected`, `27.0k tCO₂-e/yr monitored`, etc.) and the Australia map dots rendering exactly as before. Switch to Horticulture and confirm the dashboard's grower table and monthly charts still populate.

- [ ] **Step 7: Commit**

```bash
git add frontend/js/01-data-core.js frontend/js/04-industry-router.js frontend/js/05-hort-data-stats.js
git commit -m "feat(frontend): fetch network reference data from the backend on boot"
```

---

### Task 13: Frontend integration — real contact-form submission

**Files:**
- Modify: `frontend/index.html`

**Interfaces:**
- Consumes: `POST /api/leads` (Task 5).
- Produces: both contact forms (`data-view="contact"` and `data-view="h-contact"`) persist real submissions instead of showing a placeholder `alert()`.

- [ ] **Step 1: Replace the farm contact form's submit handler**

Find (originally `index.html` line 957, unchanged by Plan 1):
```html
<button class="btn-lg btn-primary" style="margin-top:16px" onclick="alert('Thanks — this is a demo form. We will be in touch.')">Send message</button>
```
This button sits inside `<section class="view" data-view="contact">`, whose four inputs (in the `.form-grid` above it) are, in order: Name, Organisation, Email, Role (`<select>`), followed by a Message `<input>`. None currently have `id` attributes — add them so the handler can read their values. In the surrounding markup, add `id="c-name"`, `id="c-org"`, `id="c-email"`, `id="c-role"` to those four fields respectively, and `id="c-message"` to the Message input. Then replace the button with:
```html
<button class="btn-lg btn-primary" style="margin-top:16px" onclick="submitLead('farm')">Send message</button>
```

- [ ] **Step 2: Replace the horticulture contact form's submit handler**

Find (originally `index.html` line 1266, unchanged by Plan 1) inside `<section class="view" data-view="h-contact">` — same pattern, four fields are Name, Organisation, Email, Crop (a plain `<input>` here, not a `<select>`), plus Message. Add `id="hc-name"`, `id="hc-org"`, `id="hc-email"`, `id="hc-crop"`, `id="hc-message"` respectively, and replace:
```html
<button class="btn-lg btn-primary" style="margin-top:16px" onclick="alert('Thanks — this is a demo form. We will be in touch.')">Send message</button>
```
with:
```html
<button class="btn-lg btn-primary" style="margin-top:16px" onclick="submitLead('hort')">Send message</button>
```

- [ ] **Step 3: Add `submitLead` to `frontend/js/01-data-core.js`**

Append (anywhere after `boot` is defined, e.g. directly below `refreshLocks`):
```js
async function submitLead(industry){
  const $=id=>document.getElementById(id);
  const isFarm = industry === 'farm';
  const body = {
    industry,
    name: $(isFarm?'c-name':'hc-name').value,
    organisation: $(isFarm?'c-org':'hc-org').value,
    email: $(isFarm?'c-email':'hc-email').value,
    roleOrCrop: $(isFarm?'c-role':'hc-crop').value,
    message: $(isFarm?'c-message':'hc-message').value,
  };
  const r = await fetch('/api/leads', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  alert(r.ok ? 'Thanks — we\'ll be in touch.' : 'Something went wrong sending your message — please try again.');
}
```

- [ ] **Step 4: Manual verification**

With the backend running, submit both contact forms with sample data. Expected: the success alert appears. Confirm persistence:
```powershell
node -e "const db=require('C:/Users/muhta/Documents/carbon-project/backend/db/db'); console.log(db.prepare('SELECT * FROM leads').all())"
```
Expected: an array containing the rows you just submitted.

- [ ] **Step 5: Commit**

```bash
git add frontend/index.html frontend/js/01-data-core.js
git commit -m "feat(frontend): submit contact forms to the backend instead of a placeholder alert"
```

---

### Task 14: End-to-end verification and documentation

**Files:**
- Create: `backend/README.md`
- Modify: `frontend/README.md`

**Interfaces:**
- Produces: onboarding docs covering the full stack, and a final confirmation the whole system works together.

- [ ] **Step 1: Full manual regression pass**

Run `node backend/server.js`, open `http://localhost:3000/`, and repeat the entire checklist from the frontend plan's Task 1 Step 2 (every view, both industries, both calculator modes, Subscribe/login, both contact forms) one more time end-to-end. Expected: identical visuals to the original monolithic `index.html`, but now every "Calculate," "Subscribe," and "Send message" action is a real network call backed by SQLite.

- [ ] **Step 2: Write `backend/README.md`**

```markdown
# LCCIP Backend

Node.js + Express + SQLite (`better-sqlite3`). No ORM, no build step.

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

## Data model

`db/schema.sql` — three tables: `users`, `leads`, `assessments`. The demo network (7 cattle farms,
12 horticulture growers + monthly time series) is **not** in the database — it's static, read-only
reference data extracted once from the frontend's original hardcoded JS into `data/*.json` by
`data/extract-seed-data.js` (see `docs/superpowers/plans/2026-07-21-backend-api.md`, Task 3).

## Known scope boundaries

The "Investment & ROI" recommendation modelling (`frontend/js/10-ai-roi.js`) stays entirely
client-side — it only re-derives numbers from data already fetched from `/api/network/*`, plus
slider inputs, so there's nothing to persist. Porting it server-side was explicitly out of scope
for this plan.
```

- [ ] **Step 3: Update `frontend/README.md`'s "Data" section**

Find the "## Data" section (written in Plan 1, Task 7) and replace its contents with:
```markdown
## Data

`FARMS`, `HFARMS`, and `HDATA` are `let` bindings (in `js/01-data-core.js`, `js/04-industry-router.js`,
and `js/05-hort-data-stats.js` respectively) populated by `fetch()` calls inside `boot()` against the
backend's `/api/network/*` routes — see `docs/superpowers/plans/2026-07-21-backend-api.md`. The
frontend cannot render real data without the backend running; opening `frontend/index.html` directly
via `file://` will fail (fetch calls need an HTTP origin) — always serve it via `node backend/server.js`
(or `python -m http.server` from `frontend/` if you only need to check static styling, in which case
the network-backed views will stay empty).
```

- [ ] **Step 4: Commit**

```bash
git add backend/README.md frontend/README.md
git commit -m "docs: document the backend API and update frontend data-loading notes"
```
