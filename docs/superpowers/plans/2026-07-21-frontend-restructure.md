# LCCIP Frontend Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the current 2,981-line monolithic `index.html` (inline CSS + inline JS) into a modular `frontend/` folder of separate CSS and JS files, with byte-for-byte identical visual output and behaviour — no framework, no build step, no rewriting.

**Architecture:** Pure mechanical extraction. Every CSS/JS block moves out of `index.html` into its own file **verbatim** (same characters, same order), and `index.html` is left with `<link rel="stylesheet">` / `<script src="...">` tags in the exact same relative order the inline blocks appeared in. Because the app has no bundler/module system (it's classic global-scope JS relying on execution order and implicit globals), preserving both (a) file order and (b) internal code order inside each file is mandatory — do not alphabetise, do not "clean up," do not reorder.

**Tech Stack:** Plain HTML/CSS/JS (no framework, no build tool, no npm needed for this plan). Existing external dependency: Leaflet 1.9.4 via `unpkg` CDN (unchanged).

## Global Constraints

- Every extracted file must be a **verbatim copy** of the source lines — no reformatting, no renaming of variables/classes, no whitespace changes.
- Relative order must be preserved exactly: CSS `<link>` tags in the same cascade order the `<style>` blocks appeared in; `<script src>` tags in the same order the inline `<script>` blocks appeared in (this is a classic-script app with shared global scope and execution-order dependencies — e.g. `boot()` at the end of one block calls functions defined in earlier blocks).
- No new dependencies, no bundler, no `type="module"` (module scripts don't share globals the way this code currently relies on — introducing them would silently break `onclick="go('home')"` style inline handlers that call global functions).
- All work happens in a new `frontend/` directory at the repo root; `index.html` at the repo root is left in place only as an untouched reference copy until Task 6, at which point it is replaced.
- Source-of-truth for every extraction task is the **current, untouched** `C:\Users\muhta\Documents\carbon-project\index.html` — because index.html is not modified until Task 6, line numbers quoted in every task below stay valid throughout Tasks 1–5.
- Windows/PowerShell dev environment — verification commands use PowerShell.

---

### Task 1: Baseline snapshot and directory scaffolding

**Files:**
- Create: `frontend/css/`, `frontend/js/`, `frontend/` (directories)
- Create: `docs/superpowers/plans/baseline-check.txt` (temporary snapshot, deleted at end of Task 6)

**Interfaces:**
- Produces: the directory layout every later task writes into.

- [ ] **Step 1: Record a baseline to compare against later**

Run:
```powershell
Get-Content C:\Users\muhta\Documents\carbon-project\index.html | Measure-Object -Line
```
Expected: `Lines : 2981` (confirms we're working from the known-good file before touching anything).

- [ ] **Step 2: Open the current site in the browser and note what "correct" looks like**

Run:
```powershell
Start-Process "C:\Users\muhta\Documents\carbon-project\index.html"
```
Manually click through: industry chooser → Home → How It Works → Dashboard (both "Live summary" and "Power BI report" tabs) → Farm Data Input (Quick + Full wizard, click "Calculate") → AI Recommendations → Carbon Credits → Methods & Standards → About → Contact → switch to Horticulture via "← Industries" → repeat for the `h-*` views → open the Subscribe modal. Leave this browser tab open for comparison after Task 6.

- [ ] **Step 3: Create the target directories**

Run:
```powershell
New-Item -ItemType Directory -Force -Path "C:\Users\muhta\Documents\carbon-project\frontend\css" | Out-Null
New-Item -ItemType Directory -Force -Path "C:\Users\muhta\Documents\carbon-project\frontend\js" | Out-Null
Test-Path "C:\Users\muhta\Documents\carbon-project\frontend\css", "C:\Users\muhta\Documents\carbon-project\frontend\js"
```
Expected: both `True`.

- [ ] **Step 4: Commit**

```bash
git add -A -- docs/superpowers/plans/2026-07-21-frontend-restructure.md
git commit -m "docs: add frontend restructure plan"
```

---

### Task 2: Extract the six CSS blocks

**Files:**
- Read (source, do not modify): `index.html` lines 8–444
- Create: `frontend/css/base.css`
- Create: `frontend/css/pbi-report.css`
- Create: `frontend/css/calculator.css`
- Create: `frontend/css/chooser.css`
- Create: `frontend/css/horticulture.css`
- Create: `frontend/css/marketing-extras.css`

**Interfaces:**
- Consumes: nothing (pure extraction from the untouched root `index.html`).
- Produces: six `.css` files that Task 6 references via `<link>` tags, in this exact order.

Each step below names the exact inclusive line range in the **current, untouched** `index.html`. Copy those lines exactly as they appear (do not include the `<style>`/`</style>` tags themselves) into the named target file.

- [ ] **Step 1: `frontend/css/base.css` ← index.html lines 8–201**

Contains: `:root` design tokens, reset, nav, page sections, home hero, generic cards/grids, steps, dashboard toolbar/kpi/panel/tables, forms, carbon-credit calculator layout, pricing, about/impact, contact, modal, banners/footer, the first responsive `@media(max-width:960px)` block, and the dashboard view-toggle tabs. This is the largest file — it's the app's core shell styling, kept together because it was authored as one continuous cascade in the source and splitting it further risks specificity-order bugs.

- [ ] **Step 2: `frontend/css/pbi-report.css` ← index.html lines 202–268**

Contains: the `.pbi`-scoped "Power BI report replica" skin (report header band, page tabs, slicer bar, KPI tiles, tables, legend) used only inside the Dashboard → "Power BI report" tab.

- [ ] **Step 3: `frontend/css/calculator.css` ← index.html lines 271–305**

Contains: the "EAP-style advanced calculator" styles — `.calc-tabs`, `.wiz` wizard shell, `.enterprise` cards, `.eng-badge`, `.res-hero`/`.res-grid` result panels. Shared by both the farm and horticulture full-assessment wizards.

- [ ] **Step 4: `frontend/css/chooser.css` ← index.html lines 307–330**

Contains: `#chooser` full-screen industry picker overlay and `.ind-switch` header toggle.

- [ ] **Step 5: `frontend/css/horticulture.css` ← index.html lines 332–400**

Contains: the `.hz` "ledger aesthetic" theme used by every horticulture (`h-*`) dashboard view.

- [ ] **Step 6: `frontend/css/marketing-extras.css` ← index.html lines 404–443**

Contains: the second `<style>` block — `.trust-strip`, `.flow4`, `.bench`, `.factbl`, `.accueq`, `.compare`, `#gismap`/`.gis-fallback`, `.factor-flow`, `.eqbox`, `.gaschip`. Used across Home, Methods & Standards, and How It Works.

- [ ] **Step 7: Verify no content was dropped or duplicated**

Run:
```powershell
cd C:\Users\muhta\Documents\carbon-project
(Get-Content frontend\css\base.css).Count            # expect 194  (lines 8-201 inclusive)
(Get-Content frontend\css\pbi-report.css).Count       # expect 67   (202-268)
(Get-Content frontend\css\calculator.css).Count       # expect 35   (271-305)
(Get-Content frontend\css\chooser.css).Count          # expect 24   (307-330)
(Get-Content frontend\css\horticulture.css).Count     # expect 69   (332-400)
(Get-Content frontend\css\marketing-extras.css).Count # expect 40   (404-443)
```
Expected: each count matches the comment above. If any is off, re-copy that file — do not hand-edit to force the count to match.

- [ ] **Step 8: Commit**

```bash
git add frontend/css
git commit -m "refactor: extract CSS from index.html into frontend/css/*.css"
```

---

### Task 3: Extract JS files 01–04 (core data, farm dashboard, farm calculator, industry router)

**Files:**
- Read (source, do not modify): `index.html` lines 1291–1857
- Create: `frontend/js/01-data-core.js`
- Create: `frontend/js/02-dashboard-farm.js`
- Create: `frontend/js/03-calculator-farm.js`
- Create: `frontend/js/04-industry-router.js`

**Interfaces:**
- Consumes: nothing (pure extraction).
- Produces: globals `FARMS`, `STEPS`, `LAYERS`, `go()`, `openModal()`, `closeModal()`, `subscribe()`, `boot()`, `renderDash()`, `calcInput()`, `calcLocal()`, `runAdvanced()`, `HFARMS`, `pickIndustry()`, `buildNav()` — all consumed by later JS files and by inline `onclick=` handlers in the HTML body (unchanged by this plan).

- [ ] **Step 1: `frontend/js/01-data-core.js` ← index.html lines 1291–1430**

Contains (in this order): shared chart-data helpers (`WAVE`, `monthly`, `target`, `scopeAbs`, `MIX`, `BEEF`, `LOT`, `COL`, `SCOL`), the `FARMS` array (7 cattle farms), `STEPS`, `LAYERS`, the `subscribed` flag, `GATED`, the router (`go`), modal controls (`openModal`, `closeModal`, `subscribe`, `refreshLocks`, `gateHTML`), the base SVG chart helpers (`lineChart`, `donut`, `ring`, `gauge`, `ausMap`), `fillSelect`, `boot`, `renderHow`.

- [ ] **Step 2: `frontend/js/02-dashboard-farm.js` ← index.html lines 1431–1656**

Contains: `regionFilter`, `renderDashView`, `initGisMap`, `renderTransparency`, `setRegion`, `renderDash`, `renderAIView`, `renderAI`, `renderCreditView`, `renderCredit`, `updCredit`, `calcInput` (the farm "Quick estimate" calculator).

- [ ] **Step 3: `frontend/js/03-calculator-farm.js` ← index.html lines 1657–1810**

Contains: `dashTab`, the advanced-calculator state (`WSTEPS`, `wzi`, `ents`), `calcTab`, `renderWizSteps`, `wizJump`/`wizGo`/`wizNext`, `CLASSES`, `seedEnts`/`addEnt`/`rmEnt`/`updEnt`, `renderEnts`, `getEmissions`, `calcLocal` (the farm emissions engine), `runAdvanced` (renders the full wizard result).

- [ ] **Step 4: `frontend/js/04-industry-router.js` ← index.html lines 1811–1857**

Contains: the `HFARMS` array (12 horticulture growers, annual summary), `INDUSTRY` state, `FARM_NAV`/`HORT_NAV`/`HGATED`, `backToLanding`, `pickIndustry`, `buildNav`, and the `refreshLocks` override that makes locking industry-aware.

- [ ] **Step 5: Verify line counts**

Run:
```powershell
cd C:\Users\muhta\Documents\carbon-project
(Get-Content frontend\js\01-data-core.js).Count       # expect 140  (1291-1430)
(Get-Content frontend\js\02-dashboard-farm.js).Count  # expect 226  (1431-1656)
(Get-Content frontend\js\03-calculator-farm.js).Count # expect 154  (1657-1810)
(Get-Content frontend\js\04-industry-router.js).Count # expect 47   (1811-1857)
```

- [ ] **Step 6: Commit**

```bash
git add frontend/js/01-data-core.js frontend/js/02-dashboard-farm.js frontend/js/03-calculator-farm.js frontend/js/04-industry-router.js
git commit -m "refactor: extract farm-industry JS from index.html into frontend/js/*.js"
```

---

### Task 4: Extract JS files 05–07 (horticulture data, dashboard, quick calculator)

**Files:**
- Read (source, do not modify): `index.html` lines 1858–2511
- Create: `frontend/js/05-hort-data-stats.js`
- Create: `frontend/js/06-hort-dashboard.js`
- Create: `frontend/js/07-hort-quick-calc.js`

**Interfaces:**
- Consumes: globals from Task 3's files (`boot`, `buildNav`, chart helpers).
- Produces: `HDATA` (monthly horticulture time series — a single very long line, ~74KB; copy it as one unmodified line), `renderHDash`, `calcHort`, and the two trailing top-level calls `boot(); buildNav();` that bootstrap the whole app on page load.

- [ ] **Step 1: `frontend/js/05-hort-data-stats.js` ← index.html lines 1858–2099**

Contains: `HSRC`, `HCOL`, `HSTEPS`, `hStats`, `hBoot`, `hAusMap`, `renderHHow`, `HPAGES`, `hPage`, `SN`, `HDATA` (the large monthly-rows object — copy this single line exactly as-is, do not reformat/pretty-print it), `HSCOL`, `T`, `hMonths`, `hInitFilters`, `hResetFilters`, `hRows`, `hSum`, `hKPI`, `hTip`, `bind`, `hMonthly`, `hGauge`, `hRibbon`, `hGroup`, `hByScope`, `hTreemap`, `svgBars`, `svgLine`, `svgStack`, `svgScatter`.

- [ ] **Step 2: `frontend/js/06-hort-dashboard.js` ← index.html lines 2100–2411**

Contains: `renderHDashView`, `setHPage`, `HGEO`, `initHGis`, `hFarms`, `hSortKey`/`hSortDir`, `renderHDash`, `HLEV`, `hSetLever`, `hResetLevers`.

- [ ] **Step 3: `frontend/js/07-hort-quick-calc.js` ← index.html lines 2412–2510**

Contains: `renderHMethods`, `renderHAIView`, `renderHAI`, `calcHort` (the horticulture "Quick estimate" calculator), and — critically — the trailing `boot(); buildNav();` calls that were the last two lines of the original first `<script>` block. These must remain the **last lines of the last file loaded from this group**, since they kick off rendering only after every earlier global/function has been defined.

- [ ] **Step 4: Verify line counts and that the boot calls survived**

Run:
```powershell
cd C:\Users\muhta\Documents\carbon-project
(Get-Content frontend\js\05-hort-data-stats.js).Count  # expect 242  (1858-2099)
(Get-Content frontend\js\06-hort-dashboard.js).Count    # expect 312  (2100-2411)
(Get-Content frontend\js\07-hort-quick-calc.js).Count   # expect 99   (2412-2510)
Select-String -Path frontend\js\07-hort-quick-calc.js -Pattern "^boot\(\);\s*$"
Select-String -Path frontend\js\07-hort-quick-calc.js -Pattern "^buildNav\(\);\s*$"
```
Expected: both `Select-String` calls return a match (confirms the two bootstrap calls are present and were not accidentally dropped).

- [ ] **Step 5: Commit**

```bash
git add frontend/js/05-hort-data-stats.js frontend/js/06-hort-dashboard.js frontend/js/07-hort-quick-calc.js
git commit -m "refactor: extract horticulture dashboard JS from index.html into frontend/js/*.js"
```

---

### Task 5: Extract JS files 08–10 (Power BI charts, horticulture wizard calculator, AI/ROI)

**Files:**
- Read (source, do not modify): `index.html` lines 2512–2978
- Create: `frontend/js/08-pbi-charts.js`
- Create: `frontend/js/09-calculator-hort.js`
- Create: `frontend/js/10-ai-roi.js`

**Interfaces:**
- Consumes: globals from all earlier files (`FARMS`, `HDATA`, `INDUSTRY`, `hents`, chart helpers).
- Produces: the Power BI report page's chart renderers, the horticulture full-assessment wizard (`hRunAdvanced`), and the cross-industry "Investment & ROI" tab (`renderROI`).

- [ ] **Step 1: `frontend/js/08-pbi-charts.js` ← index.html lines 2513–2668**

This was originally its own `<script>...</script>` block (an IIFE) — copy everything **between** the second `<script>` and `</script>` tags (i.e. start at the line right after `<script>` at 2512, through the line right before `</script>` at 2669). Contains: the `C`/`M`/`HC`/`KPI` local consts, `SVG`, `axisY`, `donut`, `lineChart`, `barsH`, `stacked100`, `waterfall`, `scatter`, `paddockMap` — the chart renderers used only by the Dashboard → "Power BI report" tab pages.

- [ ] **Step 2: `frontend/js/09-calculator-hort.js` ← index.html lines 2670–2786**

This is the start of the third (and last) `<script>` block. Copy everything between the `<script>` tag at 2669 and the line before `hAiTab`'s closing brace at 2786 inclusive. Contains: `HWSTEPS`, `hwzi`/`hents`, `HCROPS`, `HSYS`, `hCalcTab`, `renderHWizSteps`, `hWizJump`/`hWizGo`/`hWizNext`, `hSeedEnts`/`hAddEnt`/`hRmEnt`/`hUpdEnt`, `renderHEnts`, `hGetEmissions`, `hCalcLocal` (the horticulture emissions engine), `hRunAdvanced` (renders the full wizard result), `hAiTab`.

- [ ] **Step 3: `frontend/js/10-ai-roi.js` ← index.html lines 2787–2978**

Contains: `aiTab`, `mountROI`, `RX_CATTLE`, `RX_HORT`, `rxFarm`, `window.renderROIView`, `window.renderROI`, and the closing `})();` of the IIFE that this whole third `<script>` block is wrapped in. This is the last JS file loaded.

- [ ] **Step 4: Verify line counts**

Run:
```powershell
cd C:\Users\muhta\Documents\carbon-project
(Get-Content frontend\js\08-pbi-charts.js).Count     # expect 156  (2513-2668)
(Get-Content frontend\js\09-calculator-hort.js).Count # expect 117  (2670-2786)
(Get-Content frontend\js\10-ai-roi.js).Count          # expect 192  (2787-2978)
```

- [ ] **Step 5: Commit**

```bash
git add frontend/js/08-pbi-charts.js frontend/js/09-calculator-hort.js frontend/js/10-ai-roi.js
git commit -m "refactor: extract Power BI charts and horticulture calculator JS into frontend/js/*.js"
```

---

### Task 6: Rewrite index.html to reference the extracted files, retire the old root file

**Files:**
- Create: `frontend/index.html` (new shell)
- Modify: repo root `index.html` — replaced with a redirect stub (kept only so old bookmarks/links don't 404)
- Delete (temporary file from Task 1): `docs/superpowers/plans/baseline-check.txt` (only if created)

**Interfaces:**
- Consumes: all 6 CSS files and 10 JS files from Tasks 2–5.
- Produces: `frontend/index.html`, the single entry point Task's-worth-2 backend plan (Plan 2) will later serve as a static file.

- [ ] **Step 1: Build `frontend/index.html`**

Start from a full copy of the current root `index.html`, then:
1. Delete lines 7–400 (first `<style>...</style>` block) and replace with:
   ```html
   <link rel="stylesheet" href="css/base.css">
   <link rel="stylesheet" href="css/pbi-report.css">
   <link rel="stylesheet" href="css/calculator.css">
   <link rel="stylesheet" href="css/chooser.css">
   <link rel="stylesheet" href="css/horticulture.css">
   ```
2. Keep lines 401–402 unchanged (`<link>`/`<script>` for the Leaflet CDN).
3. Delete lines 403–444 (second `<style>...</style>` block) and replace with:
   ```html
   <link rel="stylesheet" href="css/marketing-extras.css">
   ```
4. Keep the entire body (lines 446–1289 — chooser, header, modal, all 16 `<section class="view">` blocks, footer) **unchanged, byte-for-byte**. This plan only moves CSS/JS out; it does not touch markup.
5. Delete lines 1290–2979 (all three `<script>` blocks) and replace with, immediately before `</body>`:
   ```html
   <script src="js/01-data-core.js"></script>
   <script src="js/02-dashboard-farm.js"></script>
   <script src="js/03-calculator-farm.js"></script>
   <script src="js/04-industry-router.js"></script>
   <script src="js/05-hort-data-stats.js"></script>
   <script src="js/06-hort-dashboard.js"></script>
   <script src="js/07-hort-quick-calc.js"></script>
   <script src="js/08-pbi-charts.js"></script>
   <script src="js/09-calculator-hort.js"></script>
   <script src="js/10-ai-roi.js"></script>
   ```
   This is the same order the code ran in originally (the first `<script>` block's contents = files 01–07, second block = file 08, third block = files 09–10), so global-scope execution order is identical to before.
6. Save as `frontend/index.html`.

- [ ] **Step 2: Serve the new frontend locally and smoke-test with a browser console check**

Run (from the `frontend` directory, any static file server works — Python ships everywhere and needs no install):
```powershell
cd C:\Users\muhta\Documents\carbon-project\frontend
python -m http.server 8000
```
In a browser, open `http://localhost:8000/` and open DevTools → Console. Expected: **zero red errors** on load. If you see `X is not defined`, the most likely cause is two `<script src>` tags in the wrong relative order — fix the order in `frontend/index.html`, not the JS files.

- [ ] **Step 3: Re-run the full manual checklist from Task 1 Step 2 against the new served version**

Click through every view again (industry chooser, all 9 farm views, all 8 horticulture views, both dashboard tabs, both calculator modes on both industries — click "Calculate" in each — Subscribe modal, industry switch). Compare visually against the browser tab left open from Task 1. Expected: **pixel-identical** — same fonts, same colors, same layout, same numbers when you click Calculate with the default input values.

Stop the server with `Ctrl+C` once verified.

- [ ] **Step 4: Retire the root `index.html`, point it at the new location**

The old root `index.html` is no longer the source of truth. Replace its entire contents with:
```html
<!doctype html>
<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=frontend/index.html"></head>
<body>Moved to <a href="frontend/index.html">frontend/index.html</a>.</body></html>
```
This keeps any existing bookmark/link to `/index.html` working without duplicating 3,000 lines of markup at two paths.

- [ ] **Step 5: Delete the Task 1 baseline snapshot if one was created, and verify the repo is clean**

Run:
```powershell
cd C:\Users\muhta\Documents\carbon-project
Remove-Item -ErrorAction SilentlyContinue docs\superpowers\plans\baseline-check.txt
git status
```
Expected: `frontend/` fully populated, root `index.html` now a 3-line redirect stub, nothing untracked besides what you intend to commit.

- [ ] **Step 6: Commit**

```bash
git add index.html frontend/index.html
git commit -m "refactor: assemble frontend/index.html from extracted CSS/JS, retire monolithic root index.html"
```

---

### Task 7: Document the new frontend structure

**Files:**
- Create: `frontend/README.md`

**Interfaces:**
- Consumes: the final file layout from Task 6.
- Produces: onboarding documentation for the next person (or Plan 2, the backend integration) touching this code.

- [ ] **Step 1: Write `frontend/README.md`**

```markdown
# LCCIP Frontend

Static HTML/CSS/JS — no build step, no framework, no bundler. Open `index.html` directly or serve
the folder with any static file server (`python -m http.server`, `npx serve`, or the Express static
middleware set up in the backend plan).

## Structure

- `index.html` — page shell: industry chooser overlay, header/nav, subscribe modal, all 16
  `<section class="view" data-view="...">` blocks (9 for the cattle-farm industry, 7 for
  horticulture), footer. View switching is done by `go(viewName)` toggling a `.show` class —
  there is no router library.
- `css/base.css` — design tokens (`:root` variables), reset, nav, page-section layout, forms,
  pricing, modal, footer. Loaded first; every other stylesheet assumes these tokens exist.
- `css/pbi-report.css` — the `.pbi`-scoped "Power BI report replica" skin (Dashboard → Power BI
  report tab only).
- `css/calculator.css` — the multi-step wizard UI shared by both industries' "Full property
  assessment" calculators.
- `css/chooser.css` — the full-screen `#chooser` industry-picker overlay shown on first load.
- `css/horticulture.css` — the `.hz` "ledger aesthetic" theme used by every `h-*` view.
- `css/marketing-extras.css` — trust strip, workflow steps, benchmark cards, comparison tables,
  equation boxes used on the marketing/methods pages.
- `js/01-data-core.js` … `js/10-ai-roi.js` — loaded in this exact numeric order. This is
  **classic global-scope JS, not ES modules** — every file relies on functions/consts defined by
  earlier files being already on `window` by the time it runs, and on inline `onclick="..."`
  attributes in `index.html` being able to call these globals directly. **Never reorder the
  `<script>` tags in `index.html` and never add `type="module"`** — both will break the app.
  See the file-by-file breakdown in
  `docs/superpowers/plans/2026-07-21-frontend-restructure.md` (Tasks 3–5) for exactly what each
  numbered file contains.

## Data

`FARMS` (7 cattle farms) and `HFARMS`/`HDATA` (12 horticulture growers + their monthly time
series) are currently hardcoded JS constants in `js/01-data-core.js` and
`js/05-hort-data-stats.js`. The backend plan
(`docs/superpowers/plans/2026-07-21-backend-api.md`) replaces these with `fetch()` calls to a
real API — see that plan before editing this data in place.

## Known non-goals of this restructure

This pass **only** moved code out of the monolithic file — it did not fix, refactor, or rename
anything. In particular the accessibility gaps and the ACCU-formula/electricity-factor issues
noted in `LCCIP_Code_Review_Documentation.md` (§6) are unchanged and out of scope here.
```

- [ ] **Step 2: Commit**

```bash
git add frontend/README.md
git commit -m "docs: add frontend structure README"
```
