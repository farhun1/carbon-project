# LCCIP/Sustenora Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the LCCIP/Sustenora static frontend into a warm-ledger visual system inspired by regrow.ag's editorial spacing, cut real information density on marketing pages and data screens, and consolidate the farm/horticulture marketing shell into one config-driven template.

**Architecture:** No build step, no framework — this stays static HTML/CSS/JS with ten numbered global-scope script files loaded in strict order. A new `js/00-marketing-content.js` (loaded before `01-data-core.js`, order otherwise untouched) holds an `INDUSTRY_CONTENT` config plus shared render functions that replace ten duplicated marketing `<section>`s (5 pages × 2 industries) with generated markup, rendered once for both industries at initial page load. Data/app screens (dashboard, wizard, AI, credit, PBI report) keep their existing render functions and calculation logic untouched — only their CSS and markup gain the new palette and `<details>`-based progressive disclosure.

**Tech Stack:** Vanilla HTML/CSS/JS, Node/Express backend (untouched by this plan), no test framework present — verification is via `node --check` (JS syntax), grep-based structural assertions, and manual smoke-testing against the running backend (`node backend/server.js`).

**Spec:** `docs/superpowers/specs/2026-08-20-frontend-redesign-design.md`

## Global Constraints

- No backend/API changes; no change to `FARMS`/`HFARMS`/`HDATA` shape or calculation logic in `01-data-core.js`, `03-calculator-farm.js`, `09-calculator-hort.js` (spec §3).
- Script load order in `index.html` is load-bearing — never reorder `01`–`10`; the only addition is `00-marketing-content.js` immediately before `01-data-core.js` (spec §3, §9).
- No ES modules, no bundler, no new dependencies (spec §3).
- Product name is **Sustenora** (already live, commit `8237220`); **LCCIP** stays as the separate acronym label. Any new copy this plan introduces uses "Sustenora", never "Sustain Pro".
- `css/pbi-report.css`, `js/08-pbi-charts.js`, and every `.pbi`-scoped color/markup are a deliberate pastiche of an external Power BI report and are **not** reskinned to the new palette (spec §9 keeps data-screen calculation/rendering logic separate from the marketing consolidation; the PBI replica's own Segoe-UI/canvas-gray identity is intentional product behavior, not something this redesign touches).
- `css/horticulture.css`'s `.hz` "ledger aesthetic" (soil/rust/teal tones, mono tabular figures, ruled tables) is **not** recolored — it already embodies the "carbon ledger" signature this redesign is introducing everywhere else, and is left as the existing reference implementation of that idea.
- Every `id` currently read or written by `01-data-core.js` (`boot()`), `04-industry-router.js`, `05-hort-data-stats.js` (`hBoot()`), and `01-data-core.js`'s `submitLead()` must be preserved exactly by any markup this plan regenerates (spec §11). The full list, verified against the current codebase: `hs-farms`, `hs-net`, `hs-accu`, `ausmap`, `im-farms`, `im-net`, `im-cut`, `im-rev` (written by `boot()`, farm side); `hh-farms`, `hh-net`, `hh-ci`, `hausmap` (written by `hBoot()`, hort side); `c-name`, `c-org`, `c-email`, `c-role`, `c-message` (read by `submitLead('farm')`); `hc-name`, `hc-org`, `hc-email`, `hc-crop`, `hc-message` (read by `submitLead('hort')`); `h-meth-factors` (written by `renderHMethods()`).
- **Boot-order rule** (spec §9): `boot()` (bottom of `07-hort-quick-calc.js`, runs at parse time) writes into `#hs-farms`/`#im-farms`/etc. as soon as its `fetch` calls resolve, independent of whether the user has picked an industry. Both industries' marketing shells must therefore exist in the DOM from initial script execution — `00-marketing-content.js` renders **both** `farm` and `hort` content immediately when it runs (same timing pattern `08-pbi-charts.js` already uses: a script tag placed after all body markup, executing top-to-bottom against elements that already exist), not lazily inside `pickIndustry()`.
- `renderHMethods()` (`07-hort-quick-calc.js`) reads live `HDATA.factors`, which is only populated after `boot()`'s `fetch` resolves — it is **not** folded into the synchronous `00-marketing-content.js` render pass. It keeps running from `go('h-methods')` exactly as today. The farm Methods factor table has no live-data dependency (it's a fixed indicative table today) and *is* fully config-driven.
- CSS variable **names** in `base.css` are not renamed (e.g. `--forest`, `--gold`, `--hair` keep their names) — only their hex **values** change, plus a small set of genuinely new tokens are added. Renaming ~150 existing `var(--x)` references across 5 CSS files for no functional benefit is exactly the kind of unrelated churn this plan avoids; the palette shift in spec §4 is fully achieved by changing values.

---

## File Structure

| File | Change |
|---|---|
| `frontend/css/base.css` | Modify: `:root` token values + new tokens, tabular-nums rule, `.disclose`/`.ledger-*` utility classes |
| `frontend/css/marketing-extras.css` | Modify: merged workflow/value band, comparison table, trust-strip, gaschip literal-hex cleanup |
| `frontend/css/chooser.css` | Modify: hardcoded gradient/rgba values updated to new palette |
| `frontend/css/calculator.css` | Modify: `.eng-badge` hardcoded hex updated |
| `frontend/css/horticulture.css` | No change (already the ledger-aesthetic reference) |
| `frontend/css/pbi-report.css` | No change (deliberately separate skin) |
| `frontend/js/00-marketing-content.js` | **New**: `INDUSTRY_CONTENT` config (farm + hort) + `renderMarketingHome/How/About/Methods/Contact` + bootstrap call |
| `frontend/index.html` | Modify: trim 10 marketing sections to empty shells, add script tag, chooser/header literal-hex cleanup, `hgismap` bg |
| `frontend/js/01-data-core.js` | Modify: delete now-superseded `renderHow()`; recolor hex literals |
| `frontend/js/04-industry-router.js` | Modify: `go()` drops `renderHow()`/`renderHHow()` calls |
| `frontend/js/05-hort-data-stats.js` | Modify: delete now-superseded `renderHHow()`; recolor 2 hex literals |
| `frontend/js/02-dashboard-farm.js` | Modify: recolor hex literals; KPI-bar progressive disclosure |
| `frontend/js/03-calculator-farm.js` | Modify: recolor hex literals |
| `frontend/js/06-hort-dashboard.js` | Modify: KPI-bar progressive disclosure only (no recolor — already `.hz`) |
| `frontend/js/07-hort-quick-calc.js` | Modify: recolor hex literals; AI table collapse |
| `frontend/js/09-calculator-hort.js` | Modify: recolor hex literals |
| `frontend/js/10-ai-roi.js` | Modify: recolor hex literals |
| `frontend/js/08-pbi-charts.js` | No change |

---

### Task 1: Design tokens in `base.css`

**Files:**
- Modify: `frontend/css/base.css:1-11` (`:root` block), `frontend/css/base.css:119,121,140,146,155` (hardcoded `#fafcf8`/`#eef3ea`)
- Test: manual — no test framework; verified by grep + visual smoke test in Task 16

**Interfaces:**
- Produces: the full token set every later CSS/JS task assumes exists — `--pasture`, `--pasture2`, `--forest`, `--leaf`, `--moss`, `--mint`, `--paper`, `--card`, `--ink`, `--muted`, `--hair`, `--gold`, `--gold-bright` (new), `--red`, `--amber`, `--green`, `--wash` (new), `--surface-soft` (new), `--on-dark` (new), `--on-dark-2` (new); the `.disclose`/`.disclose summary`/`.disclose-body` pattern used by Tasks 8, 12–15; `.ledger-rule`/`.ledger-underline`/`.ledger-tick` utilities used by Task 3.

- [ ] **Step 1: Replace the `:root` token block**

In `frontend/css/base.css`, replace:

```css
:root{
  --pasture:#12301d; --pasture2:#1b4228; --forest:#2c5f2d; --leaf:#4e8b3a; --moss:#6ba644; --mint:#eaf3e7;
  --paper:#f4f7f1; --card:#fff; --ink:#16201a; --muted:#5d6c61; --hair:#e2e9dd;
  --gold:#b8881e; --red:#d14a3f; --amber:#df9b26; --green:#4e9d52;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --mono:ui-monospace,Menlo,Consolas,"SF Mono",monospace;
  --shadow:0 8px 26px rgba(20,40,28,.10);
  --ease-out:cubic-bezier(.16,1,.3,1);
  --dur-fast:120ms; --dur-base:200ms;
}
```

with:

```css
:root{
  /* warm-ledger palette — spec 2026-08-20-frontend-redesign-design.md §4 */
  --pasture:#0B2417; --pasture2:#142E1E; --forest:#123A26; --leaf:#4B7F3E; --moss:#5C8A4A; --mint:#E9EEE1;
  --paper:#F5F2EA; --card:#fff; --ink:#1B211C; --muted:#6B655D; --hair:#DCD5C4;
  --gold:#A87A2A; --gold-bright:#D9A857; --red:#C23333; --amber:#D89A2E; --green:#5C8A4A;
  --wash:#EEF0E4; --surface-soft:#FAF8F2; --on-dark:#D9E4CE; --on-dark-2:#9FB08C;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --mono:ui-monospace,Menlo,Consolas,"SF Mono",monospace;
  --shadow:0 6px 20px rgba(18,58,38,.08);
  --ease-out:cubic-bezier(.16,1,.3,1);
  --dur-fast:120ms; --dur-base:200ms;
}
```

- [ ] **Step 2: Replace the 4 hardcoded near-white literals with the new surface tokens**

Still in `base.css`:
- Line 119 `.toolbar select{...background:#fafcf8;...}` → `background:var(--surface-soft)`
- Line 121 `.chip{...background:#fafcf8;...}` → `background:var(--surface-soft)`
- Line 140 `.hot .bar{...background:#eef3ea;...}` → `background:var(--wash)`
- Line 146 `table.tbl td{...border-bottom:1px solid #eef3ea}` → `border-bottom:1px solid var(--wash)`

- [ ] **Step 3: Add tabular-nums to every figure class**

Add to `base.css` (near the `.mono` rule, ~line 18):

```css
.hero-stats .hs b,.im b,.kpi .kv,.plan .price,.result .big,.res-hero .rv,.creditbox .accu,.rc .v,.bc .bv{
  font-variant-numeric:tabular-nums;letter-spacing:-.01em}
```

- [ ] **Step 4: Add the ledger signature + disclosure utilities**

Append to the end of `base.css` (before the `@media (prefers-reduced-motion: reduce)` block):

```css
/* ledger signature: hairline ruled-paper motif — spec §6 */
.ledger-rule{position:relative}
.ledger-rule:before{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:var(--hair)}
.ledger-underline{border-bottom:2px double var(--gold);padding-bottom:2px;display:inline-block}
.ledger-tick{width:6px;height:6px;border-radius:50%;background:var(--forest);display:inline-block;flex:0 0 auto}

/* progressive-disclosure primitive used across marketing + data screens — spec §8 */
.disclose{border:1px solid var(--hair);border-radius:12px;overflow:hidden;background:var(--card);box-shadow:var(--shadow);margin-top:16px}
.disclose summary{list-style:none;cursor:pointer;padding:14px 18px;font-weight:700;font-size:13.5px;color:var(--forest);display:flex;justify-content:space-between;align-items:center;gap:10px}
.disclose summary::-webkit-details-marker{display:none}
.disclose summary:after{content:"View details";font-weight:600;font-size:12px;color:var(--muted);white-space:nowrap}
.disclose[open] summary:after{content:"Hide details"}
.disclose .disclose-body{padding:0 18px 18px}
```

- [ ] **Step 5: Verify no stray old-token hex remains in base.css**

Run: `grep -nE "#2c5f2d|#6ba644|#b8881e|#16201a|#12301d|#eaf3e7|#e2e9dd|#f4f7f1|#5d6c61" frontend/css/base.css`
Expected: no output (all old brand hex values removed from this file).

- [ ] **Step 6: Commit**

```bash
git add frontend/css/base.css
git commit -m "style: warm-ledger design tokens in base.css

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Recolor hardcoded hex literals (JS + index.html chooser/header)

Every literal hex value below was located by an exhaustive repo-wide grep and is enumerated exactly — this is a mechanical 1:1 substitution, not a redesign of any logic. `.hz`-scoped colors (in `06-hort-dashboard.js`, `horticulture.css`) and everything in `08-pbi-charts.js`/`pbi-report.css` are excluded per the Global Constraints and are **not** touched.

**Files:**
- Modify: `frontend/index.html` (chooser + header + `hgismap` only — the marketing-view occurrences of these same hexes are deleted wholesale in Tasks 9–10, not recolored here)
- Modify: `frontend/js/01-data-core.js`, `frontend/js/02-dashboard-farm.js`, `frontend/js/03-calculator-farm.js`, `frontend/js/05-hort-data-stats.js`, `frontend/js/07-hort-quick-calc.js`, `frontend/js/09-calculator-hort.js`, `frontend/js/10-ai-roi.js`

**Interfaces:**
- Consumes: nothing new — pure literal substitution
- Produces: no new symbols; all chart/pill/badge colors now match the Task 1 token palette

**Mapping table** (old → new):

| old hex | new hex | role |
|---|---|---|
| `#2c5f2d` | `#123A26` | forest |
| `#6ba644` / `#6BA644` | `#5C8A4A` | moss / green |
| `#b8881e` | `#A87A2A` | gold |
| `#e9c768` | `#D9A857` | gold-bright (on dark bg) |
| `#4e9d52` | `#5C8A4A` | green (now = moss) |
| `#d14a3f` | `#C23333` | red |
| `#df9b26` | `#D89A2E` | amber |
| `#16201a` | `#1B211C` | ink |
| `#12301d` | `#0B2417` | pasture |
| `#234c24` | `#0D2C1C` | forest hover |
| `#3a6e44` | `#3E6B4A` | map stroke |
| `#1f4a2c` | `#123A26` | map fill (reuse forest) |
| `#eef3ea` | `#EEF0E4` | wash |
| `#fafcf8` | `#FAF8F2` | surface-soft |
| `#faf9f8` | `#FAF8F2` | surface-soft |
| `#cfe3c6` | `#D9E4CE` | on-dark |
| `#bcd9ad` | `#9FB08C` | on-dark-2 |
| `#dbe9d2` | `#D9E4CE` | on-dark |
| `#9cc18c` | `#9FB08C` | on-dark-2 |
| `#8fae84` | `#9FB08C` | on-dark-2 |

- [ ] **Step 1: `frontend/index.html` — chooser + header + hgismap**

5 occurrences of `fill="#12301d"` / `stroke="#12301d"` (leafmark SVG in header + chooser brand, chooser card icons at lines 23, 30, 36, 49) → `#0B2417`. 1 occurrence of `color:#8fae84` (line 42, chooser footnote) → `#9FB08C`. 1 occurrence of `background:#eef3ea` (line 650, `#hgismap` placeholder bg) → `#EEF0E4`.

Use Edit with `replace_all:true` on the exact strings `fill="#12301d"`, `stroke="#12301d"`, `color:#8fae84`, `background:#eef3ea` (each is unambiguous within `index.html` at this point in the plan — Tasks 9–10 haven't run yet, but none of these 4 exact strings appear inside the marketing-view sections being trimmed there, only in the chooser/header/dashboard markup that stays untouched by Tasks 9–10).

- [ ] **Step 2: `frontend/js/01-data-core.js`**

Replace (exact strings, `replace_all` where a value repeats):
- `const COL={r:"#d14a3f",a:"#df9b26",g:"#4e9d52"}, SCOL=["#2c5f2d","#6ba644","#b8881e"];` → `const COL={r:"#C23333",a:"#D89A2E",g:"#5C8A4A"}, SCOL=["#123A26","#5C8A4A","#A87A2A"];`
- `stroke="#eef3ea"` (×2, lines 130, 146, 153) → `stroke="#EEF0E4"`
- `fill="#9aa89c"` — **leave unchanged**, this is a neutral chart-axis gray, not part of the brand family (not in the mapping table)
- `fill="#16201a"` (×3, lines 141, 148, 155) → `fill="#1B211C"`
- `stroke="#2c5f2d"` (line 147) → `stroke="#123A26"`
- `stroke="#4e9d52"` (line 154) → `stroke="#5C8A4A"`
- `"#d14a3f":(f.hot[0][1]>=20?"#df9b26":"#4e9d52")` (line 162) → `"#C23333":(f.hot[0][1]>=20?"#D89A2E":"#5C8A4A")`
- `fill="#1f4a2c" stroke="#3a6e44"` (×2, lines 166–167) → `fill="#123A26" stroke="#3E6B4A"`
- `${i===6?'#b8881e':'#2c5f2d'}` (line 191, inside the now-superseded `renderHow()` — this whole function is deleted in Step 6, so skip recoloring it here)

- [ ] **Step 3: `frontend/js/02-dashboard-farm.js`**

Replace (exact strings):
- `'#d14a3f':(f.hot[0][1]>=20?'#df9b26':'#4e9d52')` (line 20) → `'#C23333':(f.hot[0][1]>=20?'#D89A2E':'#5C8A4A')`
- `${i>=4?'#b8881e':'#16201a'}` (line 56) → `${i>=4?'#A87A2A':'#1B211C'}`
- `c:'#2c5f2d',w:3},{v:tgt,c:'#6ba644',dash:1}` (line 58) → `c:'#123A26',w:3},{v:tgt,c:'#5C8A4A',dash:1}`
- `background:#2c5f2d"></i>Actual</span><span><i style="background:#6ba644` (line 58) → `background:#123A26"></i>Actual</span><span><i style="background:#5C8A4A`
- `style="color:#4e9d52"` (line 88) → `style="color:#5C8A4A"`
- `style="color:#b8881e"` (line 90) → `style="color:#A87A2A"`
- `c:'#2c5f2d',w:3},{v:pred,c:'#b8881e',dash:1}` (line 93) → `c:'#123A26',w:3},{v:pred,c:'#A87A2A',dash:1}`
- `background:#2c5f2d"></i>Actual</span><span><i style="background:#b8881e` (line 93) → `background:#123A26"></i>Actual</span><span><i style="background:#A87A2A`
- `background:#4e9d52` (line 96, `.sc` dot) → `background:#5C8A4A`
- `color:#4e9d52;font-size:13px` (line 96) → `color:#5C8A4A;font-size:13px`
- `background:#df9b26` (line 97) → `background:#D89A2E`
- `background:#6ba644` (line 98) → `background:#5C8A4A`
- `color:#bcd9ad` (line 128) → `color:#9FB08C`
- `${i===4?'#b8881e':'#2c5f2d'}` (line 136) → `${i===4?'#A87A2A':'#123A26'}`
- `color:#e9c768` (×2, line 189) → `color:#D9A857`
- `?'#4e9d52':'#16201a'` (line 219) → `?'#5C8A4A':'#1B211C'`
- `background:#faf9f8` (line 220) → `background:#FAF8F2`

- [ ] **Step 4: `frontend/js/03-calculator-farm.js`**

Replace (exact strings):
- `color:#e9c768` (×2, line 99) → `color:#D9A857`
- `?'#4e9d52':'#16201a'` (line 131) → `?'#5C8A4A':'#1B211C'`
- `background:#faf9f8` (×2, lines 133–134) → `background:#FAF8F2`

- [ ] **Step 5: `frontend/js/05-hort-data-stats.js`**

Replace (exact strings, lines 36–37):
- `fill="#1f4a2c" stroke="#3a6e44"` (×2) → `fill="#123A26" stroke="#3E6B4A"`

(Delete `renderHHow()` in Step 7 below — not recolored here since it's removed.)

- [ ] **Step 6: `frontend/js/07-hort-quick-calc.js`**

Replace (exact strings):
- `'Australian official':'#4e9d52','Australian official/derived':'#4e9d52','IPCC Tier 1':'#6BA644',` (line 5) → `'Australian official':'#5C8A4A','Australian official/derived':'#5C8A4A','IPCC Tier 1':'#5C8A4A',`
- `'Australian/IPCC GWP basis':'#df9b26','Check reporting-year factor':'#df9b26','Proxy - replace':'#d14a3f'` (line 6) → `'Australian/IPCC GWP basis':'#D89A2E','Check reporting-year factor':'#D89A2E','Proxy - replace':'#C23333'`
- `${cut>30?'#d14a3f':cut>12?'#df9b26':'#4e9d52'}` (line 32) → `${cut>30?'#C23333':cut>12?'#D89A2E':'#5C8A4A'}`
- `${over?'#d14a3f':'#4e9d52'}` (line 36, and again line 37) → `${over?'#C23333':'#5C8A4A'}`
- `color:#b8881e` (line 39) → `color:#A87A2A`
- `color:#d14a3f` (line 44) → `color:#C23333`
- `color:#4e9d52` (line 45) → `color:#5C8A4A`
- `color:#e9c768` (×2, line 80) → `color:#D9A857`
- `?'#4e9d52':'#16201a'` (line 95) → `?'#5C8A4A':'#1B211C'`
- `background:#faf9f8` (line 96) → `background:#FAF8F2`

- [ ] **Step 7: `frontend/js/09-calculator-hort.js`**

Replace (exact strings):
- `color:#e9c768` (×2, line 73) → `color:#D9A857`
- `?'#4e9d52':'#16201a'` (line 94) → `?'#5C8A4A':'#1B211C'`
- `background:#faf9f8` (line 95) → `background:#FAF8F2`

- [ ] **Step 8: `frontend/js/10-ai-roi.js`**

Replace (exact strings):
- `color:#e9c768` (injected `<style>`, line 5) → `color:#D9A857`
- `border-bottom:1px solid #eef3ea` (line 13) → `border-bottom:1px solid #EEF0E4`
- `${i.pick?'#4e9d52':'#9aa89c'}` (line 131) — replace only `'#4e9d52'` → `'#5C8A4A'`; leave `'#9aa89c'` unchanged
- `${good?'#4e9d52':'#d14a3f'}` (line 149) → `${good?'#5C8A4A':'#C23333'}`
- `color:#bcd9ad` (line 153) → `color:#9FB08C`
- `color:#cfe3c6` (line 155) → `color:#D9E4CE`
- `color:#dbe9d2` (×3, lines 157–159) → `color:#D9E4CE`
- `color:#e9c768` (line 158) → `color:#D9A857`
- `background:#2c5f2d` (line 163) → `background:#123A26`
- `background:#6ba644` (line 164) → `background:#5C8A4A`
- `background:#b8881e` (line 165) → `background:#A87A2A`
- `${ciAfter<=f.tgt?'#4e9d52':'#d14a3f'}` (line 166) → `${ciAfter<=f.tgt?'#5C8A4A':'#C23333'}`

- [ ] **Step 9: Delete the now-superseded `renderHow()` and `renderHHow()` functions**

In `frontend/js/01-data-core.js`, delete the entire `renderHow()` function (lines 188–193, the last function in the file — its content is superseded by `renderMarketingHow()` in Task 5/8). In `frontend/js/05-hort-data-stats.js`, delete the entire `renderHHow()` function (lines 39–41).

Leave the dead `if(v==='how') renderHow();` line inside `01-data-core.js`'s own `go()` function (line 46) alone — that `go()` is already fully overwritten by `04-industry-router.js`'s `go = function(v){...}` and never executes; deleting unrelated dead code in a file this task isn't otherwise touching is out of scope (see Task 11 for the one `go()` that actually runs).

- [ ] **Step 10: Syntax-check every touched JS file**

Run: `for f in frontend/js/01-data-core.js frontend/js/02-dashboard-farm.js frontend/js/03-calculator-farm.js frontend/js/05-hort-data-stats.js frontend/js/07-hort-quick-calc.js frontend/js/09-calculator-hort.js frontend/js/10-ai-roi.js; do node --check "$f" && echo "OK: $f"; done`
Expected: `OK:` printed for all 7 files, no syntax errors.

- [ ] **Step 11: Verify no old-brand hex remains outside the excluded files**

Run: `grep -rlnE "#2c5f2d|#6ba644|#b8881e|#e9c768|#4e9d52|#d14a3f|#df9b26|#16201a|#12301d|#234c24|#3a6e44|#1f4a2c|#eef3ea|#fafcf8|#faf9f8|#cfe3c6|#bcd9ad|#dbe9d2|#9cc18c|#8fae84" frontend/js frontend/index.html | grep -v "08-pbi-charts.js\|06-hort-dashboard.js"`
Expected: no output.

- [ ] **Step 12: Commit**

```bash
git add frontend/index.html frontend/js/01-data-core.js frontend/js/02-dashboard-farm.js frontend/js/03-calculator-farm.js frontend/js/05-hort-data-stats.js frontend/js/07-hort-quick-calc.js frontend/js/09-calculator-hort.js frontend/js/10-ai-roi.js
git commit -m "style: recolor hardcoded chart/badge hex literals to the new palette

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `marketing-extras.css` — merged band, comparison table, ledger-thread

**Files:**
- Modify: `frontend/css/marketing-extras.css`

**Interfaces:**
- Consumes: `--forest`, `--gold`, `--hair`, `--wash`, `--mint`, `--red`, `--moss`, `.ledger-rule`/`.ledger-tick` from Task 1
- Produces: `.flow4` gains a connecting ledger-thread; `.compare .col.bad/.good` use token-derived tints instead of hardcoded hex

- [ ] **Step 1: Replace hardcoded `.eqbox` background**

Replace `.eqbox{background:#f4f7f1;border:1px solid var(--hair);border-radius:12px;padding:16px;text-align:center;font-family:var(--serif);font-size:17px}` with `.eqbox{background:var(--wash);border:1px solid var(--hair);border-radius:12px;padding:16px;text-align:center;font-family:var(--serif);font-size:17px}`.

- [ ] **Step 2: Drop the now-redundant fallback on `.factor-flow .fx`**

Replace `.factor-flow .fx{background:var(--wash,#f4f7f1);border:1px solid var(--hair);border-radius:12px;padding:14px 10px;text-align:center}` with `.factor-flow .fx{background:var(--wash);border:1px solid var(--hair);border-radius:12px;padding:14px 10px;text-align:center}`.

- [ ] **Step 3: Replace hardcoded comparison-table tint colors**

Replace:
```css
.compare .col.bad{background:#fbf1ef;border-color:#f0d9d5}
.compare .col.good{background:#eef6ec;border-color:#cfe3c6}
```
with:
```css
.compare .col.bad{background:#FBEFEF;border-color:rgba(194,51,51,.22)}
.compare .col.good{background:var(--mint);border-color:rgba(92,138,74,.35)}
```

- [ ] **Step 4: Add the ledger-thread connector to the merged workflow band**

Add after the existing `.flow4` rules (this styles the `.flow4` wrapper used by both the farm "Baseline→Reduce→Verify→Earn" and hort "Baseline→Reduce→Verify→Report" bands rendered by Task 5/6):

```css
.flow4{position:relative;padding-top:22px}
.flow4:before{content:"";position:absolute;top:0;left:2%;right:2%;height:1px;background:repeating-linear-gradient(to right,var(--hair) 0 6px,transparent 6px 11px)}
.flow4 .fs{position:relative}
.flow4 .fs .n{box-shadow:0 0 0 4px var(--paper)}
.flow4 .fs.gold .n{background:var(--gold)}
```

(`.fs.gold` is a new modifier class the Task 5/6 render function adds to the fourth step, replacing the inline `style="background:..."` pattern used elsewhere in the codebase for the same "final/gold step" idea — see `.factor-flow .fx.gold` which already does exactly this.)

- [ ] **Step 5: Verify no CSS syntax errors**

Run: `node -e "require('fs').readFileSync('frontend/css/marketing-extras.css','utf8')" && echo "file readable"` (a minimal sanity check since there's no CSS linter in this project; the real check is the visual smoke test in Task 16).

- [ ] **Step 6: Commit**

```bash
git add frontend/css/marketing-extras.css
git commit -m "style: ledger-thread workflow band and token-based comparison table

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `chooser.css` + `calculator.css` hardcoded-value touch-ups

**Files:**
- Modify: `frontend/css/chooser.css`, `frontend/css/calculator.css`

**Interfaces:**
- Consumes: Task 1 tokens (values only — these two files keep their own hardcoded gradient/rgba because CSS custom properties can't be interpolated inside `rgba()`/multi-stop `gradient()` shorthand cleanly here; the values are hand-derived from the new tokens instead)

- [ ] **Step 1: Update the chooser background gradient**

In `frontend/css/chooser.css`, replace:
```css
#chooser{position:fixed;inset:0;z-index:80;background:radial-gradient(900px 500px at 75% -10%,#244e30 0%,transparent 60%),linear-gradient(160deg,#13311e,#0f271a);display:flex;align-items:center;justify-content:center;padding:24px}
```
with:
```css
#chooser{position:fixed;inset:0;z-index:80;background:radial-gradient(900px 500px at 75% -10%,#1B4A30 0%,transparent 60%),linear-gradient(160deg,#123A26,#0B2417);display:flex;align-items:center;justify-content:center;padding:24px}
```

- [ ] **Step 2: Update the chooser card hover tint**

Replace `.ch-card:hover{background:rgba(107,166,68,.18);border-color:var(--moss);transform:translateY(-3px)}` with `.ch-card:hover{background:rgba(92,138,74,.18);border-color:var(--moss);transform:translateY(-3px)}`.

- [ ] **Step 3: Update the calculator engine badge**

In `frontend/css/calculator.css`, replace `.eng-badge{display:inline-flex;align-items:center;gap:7px;background:#eef6ec;border:1px solid #cfe3c6;border-radius:20px;padding:5px 12px;font-size:11.5px;color:var(--forest);font-weight:600}` with `.eng-badge{display:inline-flex;align-items:center;gap:7px;background:var(--mint);border:1px solid rgba(92,138,74,.35);border-radius:20px;padding:5px 12px;font-size:11.5px;color:var(--forest);font-weight:600}`.

- [ ] **Step 4: Verify no old hex remains in these two files**

Run: `grep -nE "#244e30|#13311e|#0f271a|rgba\(107,166,68|#eef6ec|#cfe3c6" frontend/css/chooser.css frontend/css/calculator.css`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add frontend/css/chooser.css frontend/css/calculator.css
git commit -m "style: recolor chooser gradient and calculator engine badge

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: `00-marketing-content.js` — config schema + farm/hort Home + How

Creates the new file with the config schema, both industries' `home` and `how` entries, and the two render functions those entries need. Later tasks append to this same file (About/Contact in Task 6's counterpart — see note below — Methods in Task 7, bootstrap call in Task 8).

**Files:**
- Create: `frontend/js/00-marketing-content.js`

**Interfaces:**
- Produces: `const INDUSTRY_CONTENT = {farm: {...}, hort: {...}}` (module-global, `home` and `how` keys populated in this task, `about`/`methods`/`contact` keys added in Tasks 6–7); `function renderMarketingHome(industry)`; `function renderMarketingHow(industry)`. Both functions read `INDUSTRY_CONTENT[industry]` and write into the existing view shells (`data-view="home"`/`"h-home"` and `"how"`/`"h-how"`) that Tasks 9–10 leave as empty `<section>` containers.
- Consumes: nothing from other new-file tasks yet; consumes `openModal()` (global, from `01-data-core.js`, referenced only via an `onclick="openModal()"` string in generated markup — not called directly, so load order is fine) and `go()` (same, referenced the same way).

- [ ] **Step 1: Create the file with the config schema and Home content for both industries**

```js
/* =================== MARKETING CONTENT =================== */
/* Config-driven render functions for the 5 structurally-shared marketing pages
   (home, how, about, methods, contact) across both industries. Loaded before
   01-data-core.js — see frontend/README.md and the Global Constraints in
   docs/superpowers/plans/2026-08-20-frontend-redesign.md for why the load-order
   and both-industries-render-at-boot rules exist. This file only builds static
   markup from config; it never reads FARMS/HFARMS/HDATA (those are populated
   later, asynchronously, by boot()/hBoot() in 01-data-core.js / 05-hort-data-stats.js). */

const INDUSTRY_CONTENT = {
  farm: {
    home: {
      kicker: 'AI-enabled life-cycle carbon intelligence',
      h1: 'See the carbon position of <span class="accent">any Australian cattle farm</span> — live.',
      lead: 'LCCIP turns farm data into an audited carbon ledger, and audited reductions into ACCU revenue — across the national herd.',
      ctaLabel: 'Subscribe to the network',
      ctaAction: 'openModal()',
      stats: [
        {id:'hs-farms', value:'7', label:'farms connected'},
        {id:'hs-net', value:'27.0k', label:'tCO₂-e/yr monitored'},
        {id:'hs-accu', value:'3,090', label:'ACCU potential/yr', gold:true},
      ],
      mapTitle: 'Live farm network · Australia',
      mapId: 'ausmap',
      mapCaption: 'Each dot is a connected farm streaming carbon data — select one in the dashboard.',
      trust: ['Aligned to NGER','IPCC Tier 2 factors','Clean Energy Regulator · ACCU pathway','Audit-ready data','Cradle-to-farm-gate LCA'],
      bandKicker: 'Baseline → Reduce → Verify → Earn',
      bandLead: 'One ledger, four moves',
      band: [
        {title:'Baseline', body:'NGER/IPCC factors, cradle-to-farm-gate — the audited starting line for every farm.'},
        {title:'Reduce', body:'AI ranks interventions by impact, cost and payback against that baseline.'},
        {title:'Verify', body:'Every figure traces to a source and a factor — audit-ready from day one.'},
        {title:'Earn', gold:true, body:'Verified reductions become ACCUs under an approved method — revenue paid to the farm.'},
      ],
      pricingTeaser: 'Producer access is free. Network access opens every connected farm in Australia.',
      pricingLinkLabel: 'See plans ↓',
    },
    how: {
      kicker: 'How it works',
      h1: 'Nine steps — from farm data to carbon revenue and back',
      sub: 'The same pipeline runs behind every farm in the network, continuously.',
      steps: [
        ['Farm data capture','Herd, feed, manure, fuel, energy, fertiliser, transport, weather & pasture.'],
        ['Data integration layer','IoT sensors, FMS, invoices, API feeds and manual entry into one pipeline.'],
        ['LCA modelling engine','Cradle-to-farm-gate · IPCC/NGER factors · CH₄, N₂O, CO₂ → CO₂-eq.'],
        ['Emissions reporting','Scope 1/2/3, total emissions, product carbon intensity, source breakdown.'],
        ['AI analytics engine','Detects anomalies, forecasts spikes, finds hotspots, explains root causes.'],
        ['Sustenora dashboard','KPI cards, trends, hotspot maps, scope panels, alerts & scenarios.'],
        ['Intervention engine','Threshold breached → targeted, farm-specific action recommended.'],
        ['ACCU monetisation','Verified reductions → potential ACCUs, revenue and financial impact.'],
        ['Continuous improvement','Results feed the next cycle — ongoing monitoring and net-zero tracking.'],
      ],
      detailSummary: 'Under the hood',
      eqbox: 'Total emissions <span class="op">=</span> Σ ( <b>activity</b> <span class="op">×</span> <b>emission factor</b> )',
      detailTiles: [
        {title:'What we track', body:'Enteric CH₄, manure, fuel, energy, feed (embedded), fertiliser N₂O, land-use change and sequestration — each mapped to Scope 1, 2 or 3.'},
        {title:'Carbon intensity is the output', body:'Net emissions ÷ production = kg CO₂-e per litre milk or per kg liveweight — compared against an industry benchmark.'},
      ],
    },
  },
  hort: {
    home: {
      kicker: 'Horticulture · life-cycle carbon intelligence',
      h1: 'The carbon in <span class="accent">every crop you grow</span> — measured.',
      lead: 'LCCIP tracks emissions from soil to shelf, and turns them into a defensible carbon intensity per kilogram sold.',
      ctaLabel: 'Subscribe to the network',
      ctaAction: 'openModal()',
      stats: [
        {id:'hh-farms', value:'12', label:'growers connected'},
        {id:'hh-net', value:'3.2k', label:'tCO₂-e/yr net'},
        {id:'hh-ci', value:'0.48', label:'avg kg CO₂-e / kg'},
      ],
      mapTitle: 'Grower network · Australia',
      mapId: 'hausmap',
      mapCaption: '12 growers · 6 states · tomatoes to almonds.',
      trust: ['NGER · IPCC factors','111-factor library','Scope 1·2·3','Cradle-to-farm-gate LCA','Data-confidence rated'],
      bandKicker: 'Baseline → Reduce → Verify → Report',
      bandLead: 'One ledger, four moves',
      band: [
        {title:'Baseline', body:'Cradle-to-farm-gate LCA, 12 sources, NGER/IPCC factors, Scope 1·2·3.'},
        {title:'Reduce', body:'Abatement levers ranked by tonnes saved — packaging, nitrogen, energy, freight.'},
        {title:'Verify', body:'Every factor graded by provenance, so you know what you can defend.'},
        {title:'Report', gold:true, body:'Retailer- and auditor-ready Scope 3 disclosure per kilogram sold.'},
      ],
      pricingTeaser: 'Grower access is free. Network access opens every connected grower in Australia.',
      pricingLinkLabel: 'See plans ↓',
    },
    how: {
      kicker: 'How it works',
      h1: 'From crop inputs to a defensible carbon number',
      sub: 'The same LCCIP pipeline, tuned for horticulture — 111-factor library, honest data-confidence grading.',
      steps: [
        ['Crop data capture','Yield, area, fuel, energy, fertiliser, packaging, freight, water.'],
        ['Factor library','111 NGER / IPCC factors — each graded by confidence.'],
        ['LCA engine','Cradle-to-farm-gate · 12 sources → CO₂-e by Scope 1·2·3.'],
        ['Removals','Soil carbon and biomass subtracted to give net.'],
        ['Intensity','Net ÷ marketable yield = kg CO₂-e per kg sold.'],
        ['Benchmark','Compared to a crop-specific target — over or under.'],
        ['Abatement','AI ranks levers by tonnes saved and cost.'],
        ['Report','Retailer- and auditor-ready Scope 3 disclosure.'],
        ['Improve','Results feed the next season.'],
      ],
      detailSummary: 'Under the hood',
      eqbox: 'Net emissions <span class="op">=</span> Σ ( <b>activity</b> <span class="op">×</span> <b>emission factor</b> ) <span class="op">−</span> <b>soil &amp; biomass removals</b>',
      detailTiles: [
        {title:'12 emission sources tracked', body:'Fuel, electricity, soil N₂O, fertiliser (upstream), lime & urea, chemicals, packaging, transport, waste, refrigeration, water, planting materials — each mapped to Scope 1, 2 or 3.'},
        {title:'Carbon intensity is the output', body:'Emissions ÷ marketable yield = kg CO₂-e per kg sold — compared against a crop-specific target.'},
      ],
    },
  },
};

function renderMarketingHome(industry){
  const c = INDUSTRY_CONTENT[industry].home;
  const el = document.querySelector(`section.view[data-view="${industry==='farm'?'home':'h-home'}"]`);
  if(!el) return;
  el.innerHTML = `
  <div class="hero">
    <div>
      <span class="kicker">${c.kicker}</span>
      <h1>${c.h1}</h1>
      <p class="lead">${c.lead}</p>
      <div class="hero-cta">
        <button class="btn-lg btn-primary" onclick="${c.ctaAction}">${c.ctaLabel}</button>
      </div>
      <div class="hero-stats ledger-rule">${c.stats.map(s=>`<div class="hs"><b id="${s.id}"${s.gold?' class="ledger-underline" style="color:var(--gold)"':''}>${s.value}</b><span>${s.label}</span></div>`).join('')}</div>
    </div>
    <div class="mapcard">
      <div class="ml"><b>${c.mapTitle}</b><span class="live"><i></i>LIVE</span></div>
      <div id="${c.mapId}"></div>
      <div class="cap">${c.mapCaption}</div>
    </div>
  </div>
  <div class="trust-strip">${c.trust.map(t=>`<span class="ts">${t}</span>`).join('')}</div>
  <div class="sec-head" style="margin-top:24px"><span class="kicker">${c.bandKicker}</span><h2 class="h-lead">${c.bandLead}</h2></div>
  <div class="flow4">${c.band.map((b,i)=>`<div class="fs${b.gold?' gold':''}"><div class="n">${i+1}</div><h4>${b.title}</h4><p>${b.body}</p></div>`).join('')}</div>
  <p class="sub" style="margin-top:18px">${c.pricingTeaser} <a href="#pricing" style="color:var(--forest);font-weight:700">${c.pricingLinkLabel}</a></p>
  <div id="pricing"></div>`;
}

function renderMarketingHow(industry){
  const c = INDUSTRY_CONTENT[industry].how;
  const el = document.querySelector(`section.view[data-view="${industry==='farm'?'how':'h-how'}"]`);
  if(!el) return;
  el.innerHTML = `
  <div class="sec-head"><span class="kicker">${c.kicker}</span><h2 class="h-lead">${c.h1}</h2><p class="sub">${c.sub}</p></div>
  <div class="steps">${c.steps.map((s,i)=>`<div class="step"><div class="num">${i+1}</div><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('')}</div>
  <details class="disclose" style="margin-top:24px"><summary>${c.detailSummary}</summary>
    <div class="disclose-body">
      <div class="eqbox" style="margin-bottom:14px">${c.eqbox}</div>
      <div class="cards c2">${c.detailTiles.map(t=>`<div class="tile"><h3>${t.title}</h3><p style="font-size:12.5px;color:var(--muted);margin-top:6px">${t.body}</p></div>`).join('')}</div>
    </div>
  </details>`;
}
```

- [ ] **Step 2: Syntax-check the new file**

Run: `node --check frontend/js/00-marketing-content.js`
Expected: no output (valid syntax).

- [ ] **Step 3: Commit**

```bash
git add frontend/js/00-marketing-content.js
git commit -m "feat: marketing-content config + Home/How render functions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: `00-marketing-content.js` — About + Contact

Appends the `about`/`contact` config entries and their render functions to the same file created in Task 5.

**Files:**
- Modify: `frontend/js/00-marketing-content.js`

**Interfaces:**
- Consumes: `INDUSTRY_CONTENT` object literal from Task 5 (adds two more keys to each industry's entry — edit the object in place)
- Produces: `function renderMarketingAbout(industry)`, `function renderMarketingContact(industry)`

- [ ] **Step 1: Add `about` and `contact` keys to `INDUSTRY_CONTENT.farm`**

Insert after the `how:` block closes inside `INDUSTRY_CONTENT.farm` (i.e. after `},` that ends the farm `how` object, before farm's closing `},`):

```js
    about: {
      kicker: 'About / impact',
      h1: 'The missing intelligence layer for farm carbon',
      sub: 'Ruminati helps farms <i>report</i> emissions. Pairtree helps <i>integrate</i> farm data. LCCIP turns that data into live intelligence, AI-driven action and carbon revenue.',
      impactStats: [
        {id:'im-farms', value:'7', label:'farms connected'},
        {id:'im-net', value:'27.0k', label:'tCO₂-e/yr monitored'},
        {id:'im-cut', value:'2.4k', label:'tCO₂-e/yr reduction potential'},
        {id:'im-rev', value:'$117k', label:'carbon revenue potential/yr', gold:true},
      ],
      cards: [
        {title:'Our mission', body:'Make every Australian cattle farm carbon-intelligent and carbon-profitable.'},
        {title:'The gap we fill', body:'One platform for operational data, LCA, AI forecasting and ACCU monetisation.'},
        {title:'Why it matters', body:"Cattle farming is one of Australia's largest emission sources — farm-level intelligence unlocks Scope 3 trust and new income."},
      ],
    },
    contact: {
      kicker: 'Contact',
      h1: 'Talk to us about a pilot',
      fields: [
        {id:'c-name', label:'Name', placeholder:'Your name'},
        {id:'c-org', label:'Organisation', placeholder:'Farm / company'},
        {id:'c-email', label:'Email', type:'email', placeholder:'you@org.com.au'},
      ],
      roleField: {id:'c-role', label:'Role', options:['Producer','Processor','Bank / lender','Advisor','Researcher']},
      messageField: {id:'c-message', label:'Message', placeholder:'Tell us about your farm or network…'},
      submitAction: "submitLead('farm')",
      info: [
        {title:'Pilot program', body:'Now onboarding cattle farms in QLD, NSW, VIC, WA, TAS &amp; SA.'},
        {title:'Email', body:'hello@lccip.au'},
        {title:'Partnerships', body:'Processors, banks and advisors needing Scope 3 data.'},
        {title:'Research', body:'Academic collaboration to publish and strengthen the framework.'},
      ],
      disclaimer: 'Demo prototype · contact details illustrative.',
    },
```

- [ ] **Step 2: Add `about` and `contact` keys to `INDUSTRY_CONTENT.hort`**

Insert after the `how:` block closes inside `INDUSTRY_CONTENT.hort`:

```js
    about: {
      kicker: 'About / impact',
      h1: 'Carbon intelligence for Australian horticulture',
      sub: 'Retailers and exporters now demand farm-level Scope 3 data. LCCIP gives growers a defensible number, and a plan to lower it.',
      impactStats: [
        {value:'12', label:'growers connected'},
        {value:'3.9k', label:'tCO₂-e/yr gross'},
        {value:'677 t', label:'removals captured'},
        {value:'111', label:'emission factors'},
      ],
      cards: [
        {title:'Our mission', body:'Give every Australian grower a defensible carbon number, and the intelligence to reduce it.'},
        {title:'Honest by design', body:'We grade every factor by confidence — only 10 of 111 are Australian official, and we show which numbers are proxies.'},
        {title:'Why it matters', body:"Horticulture's footprint is 60% Scope 3 — packaging, fertiliser and freight. That's where the reductions are."},
      ],
    },
    contact: {
      kicker: 'Contact',
      h1: 'Talk to us about a horticulture pilot',
      fields: [
        {id:'hc-name', label:'Name', placeholder:'Your name'},
        {id:'hc-org', label:'Organisation', placeholder:'Farm / packer / retailer'},
        {id:'hc-email', label:'Email', type:'email', placeholder:'you@org.com.au'},
      ],
      roleField: {id:'hc-crop', label:'Crop', freeText:true, placeholder:'e.g. apples, table grapes'},
      messageField: {id:'hc-message', label:'Message', placeholder:'Tell us about your operation…'},
      submitAction: "submitLead('hort')",
      info: [
        {title:'Pilot program', body:'Onboarding growers across NSW, VIC, QLD, SA, WA &amp; TAS.'},
        {title:'Email', body:'hort@lccip.au'},
        {title:'Retail &amp; export', body:'Scope 3 reporting for packers, retailers and exporters.'},
      ],
      disclaimer: 'Demo prototype · contact details illustrative.',
    },
```

Note the hort `about.impactStats` entries have no `id` field (matches today's behavior — the horticulture impact numbers are static text, never written to by `hBoot()` or any other script) while farm's do; the render function in Step 4 must handle both shapes.

- [ ] **Step 3: Add `renderMarketingAbout`**

Append to the file:

```js
function renderMarketingAbout(industry){
  const c = INDUSTRY_CONTENT[industry].about;
  const el = document.querySelector(`section.view[data-view="${industry==='farm'?'about':'h-about'}"]`);
  if(!el) return;
  el.innerHTML = `
  <div class="sec-head"><span class="kicker">${c.kicker}</span><h2 class="h-lead">${c.h1}</h2><p class="sub">${c.sub}</p></div>
  <div class="impact ledger-rule">${c.impactStats.map(s=>`<div class="im"><b${s.id?` id="${s.id}"`:''}${s.gold?' class="ledger-underline" style="color:var(--gold)"':''}>${s.value}</b><span>${s.label}</span></div>`).join('')}</div>
  <div class="cards c3">${c.cards.map(card=>`<div class="tile"><h3>${card.title}</h3><p>${card.body}</p></div>`).join('')}</div>`;
}
```

- [ ] **Step 4: Add `renderMarketingContact`**

Append to the file:

```js
function renderMarketingContact(industry){
  const c = INDUSTRY_CONTENT[industry].contact;
  const el = document.querySelector(`section.view[data-view="${industry==='farm'?'contact':'h-contact'}"]`);
  if(!el) return;
  const roleFieldHtml = c.roleField.freeText
    ? `<div class="fld"><label>${c.roleField.label}</label><input id="${c.roleField.id}" placeholder="${c.roleField.placeholder}"></div>`
    : `<div class="fld"><label>${c.roleField.label}</label><select id="${c.roleField.id}">${c.roleField.options.map(o=>`<option>${o}</option>`).join('')}</select></div>`;
  el.innerHTML = `
  <div class="sec-head"><span class="kicker">${c.kicker}</span><h2 class="h-lead">${c.h1}</h2></div>
  <div class="contact-grid">
    <div class="panel">
      <div class="form-grid" style="grid-template-columns:1fr 1fr">
        ${c.fields.map(f=>`<div class="fld"><label>${f.label}</label><input id="${f.id}" type="${f.type||'text'}" placeholder="${f.placeholder}"></div>`).join('')}
        ${roleFieldHtml}
      </div>
      <div class="fld" style="margin-top:16px"><label>${c.messageField.label}</label><input id="${c.messageField.id}" style="height:90px" placeholder="${c.messageField.placeholder}"></div>
      <button class="btn-lg btn-primary" style="margin-top:16px" onclick="${c.submitAction}">Send message</button>
    </div>
    <div class="contact-info">
      ${c.info.map(i=>`<p><b>${i.title}</b><br>${i.body}</p>`).join('')}
      <p style="font-size:12px;margin-top:18px">${c.disclaimer}</p>
    </div>
  </div>`;
}
```

- [ ] **Step 5: Syntax-check**

Run: `node --check frontend/js/00-marketing-content.js`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add frontend/js/00-marketing-content.js
git commit -m "feat: marketing-content About/Contact config and render functions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: `00-marketing-content.js` — Methods (both industries)

Methods is the one page with a genuine farm/hort asymmetry (spec §9 amendment): farm's factor table is fully static; hort's factor-provenance chart depends on live `HDATA.factors` and keeps using the existing `renderHMethods()` function unchanged. This task's render function builds the static shell for both and leaves an empty container for hort's live piece.

**Files:**
- Modify: `frontend/js/00-marketing-content.js`

**Interfaces:**
- Consumes: `INDUSTRY_CONTENT` from Tasks 5–6
- Produces: `function renderMarketingMethods(industry)`. For `industry==='hort'` this leaves `<div id="h-meth-factors"></div>` inside the rendered page — the pre-existing `renderHMethods()` in `07-hort-quick-calc.js` (untouched by this plan) still targets that exact id from `go('h-methods')`.

- [ ] **Step 1: Add `methods` key to `INDUSTRY_CONTENT.farm`**

Insert inside `INDUSTRY_CONTENT.farm`, after `contact:`'s closing `},`:

```js
    methods: {
      kicker: 'Methods & standards',
      h1: 'How our carbon is calculated — and how it becomes ACCUs',
      sub: 'Transparent, NGER/IPCC-aligned, built to plug into the real Australian carbon-credit scheme.',
      mechanismEq: 'Total emissions <span class="op">=</span> Σ (&nbsp;<b>activity</b> <span class="op">×</span> <b>emission factor</b>&nbsp;)',
      gases: [
        {sym:'CO₂', mult:'×1', src:'diesel, electricity', color:'var(--muted)'},
        {sym:'CH₄', mult:'×28', src:'cattle &amp; manure', color:'var(--red)'},
        {sym:'N₂O', mult:'×265', src:'fertiliser &amp; manure', color:'var(--amber)'},
      ],
      gasNote: 'Methane dominates cattle carbon — a little counts as a lot of CO₂-e.',
      boundaryTitle: 'Cradle-to-farm-gate LCA · Scopes 1·2·3',
      boundaryNote: 'We count on-farm and <b>embedded</b> supply-chain emissions, then express them per unit of product (kg CO₂-e / L milk or / kg beef). Sorted into <b>Scope 1</b> (direct), <b>Scope 2</b> (energy) and <b>Scope 3</b> (feed &amp; transport).',
      processTitle: 'From reduction to credit — the real process',
      process: [
        {title:'Approved method', body:'Register under a CER-approved method (e.g. beef herd, soil carbon).'},
        {title:'Baseline', body:'Establish an approved baseline with NGER factors.'},
        {title:'Reduce &amp; measure', body:'Apply interventions · measure project emissions.'},
        {title:'Independent audit', body:'Third-party verification of the reduction.'},
        {title:'CER issues ACCUs', gold:true, body:'1 ACCU per verified tonne · sell or inset.'},
      ],
      accuEquation: '<span class="b">ACCUs</span><span class="op">=</span><span class="b">( Baseline − Project )</span><span class="op">×</span><span class="b">(1 − risk buffer)</span><span class="op">·</span><span class="g">Revenue = ACCUs × ~$38</span>',
      factorTableSummary: 'Emission factors we use',
      factorTable: [
        ['Enteric methane','2.0–3.1 t CO₂-e / head','IPCC Tier 2 (by system)'],
        ['Manure','0.55 t CO₂-e / head','IPCC / NGER'],
        ['Diesel','2.68 kg CO₂-e / L','NGER (National Greenhouse Accounts)'],
        ['Electricity','0.66 kg CO₂-e / kWh','NGER grid factor'],
        ['Feed (embedded)','0.6 t CO₂-e / t','Life-cycle inventory (indicative)'],
        ['Fertiliser (N₂O)','5.5 kg CO₂-e / kg N','IPCC N₂O'],
        ['Land — trees / shelterbelt','−6.0 t CO₂-e / ha / yr','Sequestration (indicative)'],
        ['Land — pasture / soil','−0.5 t CO₂-e / ha / yr','Soil carbon (indicative)'],
        ['Land-use change (clearing)','+120 t CO₂-e / ha','LULUCF (indicative)'],
      ],
      factorNote: '<b>Note:</b> factors shown are NGER/IPCC-aligned and indicative for demonstration. Production uses the current published NGER edition and method-specific equations, verified before any credit is issued.',
      compareSummary: "Why it's more than a calculator",
      compareBad: ['On-farm emissions only — stops at the fence','Ignores embedded feed &amp; fertiliser emissions','Gives one lump total','No land / vegetation carbon','No credit pathway'],
      compareGood: ['Cradle-to-farm-gate boundary (stated)','Counts embedded Scope 3 (feed, transport)','Reports intensity per litre / per kg','Includes land sequestration &amp; land-use change','Shapes reductions into ACCUs (baseline − project)'],
      honestBanner: '<b>Honest status.</b> LCCIP produces audit-ready, NGER/IPCC-aligned data to support carbon projects. It does not itself issue ACCUs — certification requires an approved CER method, baseline and independent verification.',
    },
```

- [ ] **Step 2: Add `methods` key to `INDUSTRY_CONTENT.hort`**

Insert inside `INDUSTRY_CONTENT.hort`, after `contact:`'s closing `},`:

```js
    methods: {
      kicker: 'Methods & standards',
      h1: 'How horticulture carbon is calculated',
      sub: 'Transparent, NGER/IPCC-aligned, cradle-to-farm-gate. This is the page we show to retailers, exporters and auditors.',
      mechanismEq: 'Net emissions <span class="op">=</span> Σ (&nbsp;<b>activity</b> <span class="op">×</span> <b>emission factor</b>&nbsp;) <span class="op">−</span> <b>soil &amp; biomass removals</b>',
      gases: [
        {sym:'CO₂', mult:'×1', src:'diesel, electricity, lime &amp; urea', color:'var(--muted)'},
        {sym:'CH₄', mult:'×28', src:'organic waste breakdown', color:'var(--red)'},
        {sym:'N₂O', mult:'×265', src:'nitrogen fertiliser in soil', color:'var(--amber)'},
      ],
      gasNote: "Soil N₂O is horticulture's hidden giant — 17% of network emissions from a gas 265× stronger than CO₂.",
      boundaryTitle: 'Boundary &amp; functional unit',
      boundaryNote: '<b>Cradle-to-farm-gate.</b> 12 sources across Scope 1 (fuel, soil N₂O, refrigerant), Scope 2 (grid electricity) and Scope 3 (packaging, fertiliser upstream, freight, water, chemicals, planting materials, waste). Removals are reported <b>separately</b>, not netted into scopes. Output: <b>kg CO₂-e per kg marketable yield</b>.',
      processTitle: 'What we align to',
      process: [
        {title:'NGA 2025', body:'Australian National Greenhouse Accounts factors.'},
        {title:'IPCC 2019', body:'Refinement — soil N₂O, GWP values.'},
        {title:'GHG Protocol', body:'Scope 1 · 2 · 3 boundary rules.'},
        {title:'ISO 14067', body:'Product carbon footprint / LCA.'},
        {title:'Retailer Scope 3', gold:true, body:'Disclosure-ready per kg sold.'},
      ],
      accuEquation: null,
      factorTableSummary: 'Factor provenance — what you can defend',
      factorTable: null,
      factorNote: '<b>Honest status.</b> 111 factors: NGA 2025 and IPCC 2019 where available, proxies flagged. 67 are proxies requiring replacement before formal reporting. Removals require site-specific measurement (soil sampling or biomass modelling) to be creditable.',
      compareSummary: "Why it's more than a calculator",
      compareBad: ['On-farm emissions only — stops at the gate','Ignores embedded packaging, fertiliser &amp; freight','One lump total for the whole business','No removals, no yield context','No honesty about factor quality'],
      compareGood: ['Stated boundary · 12 life-cycle sources','Scope 3 = 60% of the footprint, counted','<b>kg CO₂-e per kg sold</b> — the functional unit','Soil &amp; biomass removals reported separately','Every factor graded: official vs proxy'],
      honestBanner: '<b>Indicative demonstration.</b> Figures use NGER/IPCC-aligned factors with proxies flagged. Production replaces proxy factors with published values and requires site-specific measurement for removals.',
    },
```

`factorTable: null` and `accuEquation: null` signal to the render function (Step 3) to render the live `#h-meth-factors` container instead of a static table, and to skip the ACCU-equation block entirely (hort methods has no ACCU pathway, matching today's page).

- [ ] **Step 3: Add `renderMarketingMethods`**

Append to the file:

```js
function renderMarketingMethods(industry){
  const c = INDUSTRY_CONTENT[industry].methods;
  const el = document.querySelector(`section.view[data-view="${industry==='farm'?'methods':'h-methods'}"]`);
  if(!el) return;
  const factorBlock = c.factorTable
    ? `<table class="factbl"><tr><th>Source</th><th>Factor</th><th>Basis / standard</th></tr>
       ${c.factorTable.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>`
    : `<div id="h-meth-factors"></div>`;
  el.innerHTML = `
  <div class="sec-head"><span class="kicker">${c.kicker}</span><h2 class="h-lead">${c.h1}</h2><p class="sub">${c.sub}</p></div>
  <div class="eqbox" style="margin-bottom:14px">${c.mechanismEq}</div>
  <div class="cards c2" style="margin-bottom:8px">
    <div class="tile"><h3>Three gases → one unit (CO₂-e)</h3>
      <div style="margin-top:8px">${c.gases.map(g=>`<span class="gaschip"><i style="background:${g.color}">${g.sym}</i> ${g.mult} — ${g.src}</span><br>`).join('')}</div>
      <p style="font-size:12px;color:var(--muted);margin-top:8px">${c.gasNote}</p></div>
    <div class="tile"><h3>${c.boundaryTitle}</h3>
      <p style="font-size:12.5px;color:var(--muted);margin:6px 0 0">${c.boundaryNote}</p></div>
  </div>
  <div class="sec-head" style="margin-top:26px"><span class="kicker">${c.processTitle}</span></div>
  <div class="factor-flow">${c.process.map((p,i)=>`<div class="fx${p.gold?' gold':''}"><div class="n">${i+1}</div><b>${p.title}</b><span>${p.body}</span></div>`).join('')}</div>
  ${c.accuEquation ? `<div class="accueq" style="margin-top:14px">${c.accuEquation}</div>` : ''}
  <details class="disclose" style="margin-top:26px"><summary>${c.factorTableSummary}</summary>
    <div class="disclose-body">${factorBlock}
      <p style="font-size:11.5px;color:var(--muted);margin-top:10px">${c.factorNote}</p></div>
  </details>
  <details class="disclose"><summary>${c.compareSummary}</summary>
    <div class="disclose-body compare">
      <div class="col bad"><h4>A normal footprint calculator</h4><ul>${c.compareBad.map(x=>`<li>${x}</li>`).join('')}</ul></div>
      <div class="col good"><h4>LCCIP — life-cycle assessment</h4><ul>${c.compareGood.map(x=>`<li>${x}</li>`).join('')}</ul></div>
    </div>
  </details>
  <div class="note-banner" style="margin-top:24px">${c.honestBanner}</div>`;
}
```

- [ ] **Step 4: Syntax-check**

Run: `node --check frontend/js/00-marketing-content.js`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add frontend/js/00-marketing-content.js
git commit -m "feat: marketing-content Methods config and render function

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: `00-marketing-content.js` — bootstrap call

**Files:**
- Modify: `frontend/js/00-marketing-content.js`

**Interfaces:**
- Consumes: all five `renderMarketing*` functions from Tasks 5–7
- Produces: the actual side effect — both industries' marketing shells populated in the DOM as soon as this script runs

- [ ] **Step 1: Append the bootstrap call**

At the very end of the file:

```js
/* Render both industries' marketing shells immediately — see the Boot-order
   rule in docs/superpowers/plans/2026-08-20-frontend-redesign.md. This must
   run before 07-hort-quick-calc.js's boot()/buildNav() calls, which it does
   simply by being an earlier <script> tag (00 loads before 01-10). */
['farm','hort'].forEach(ind=>{
  renderMarketingHome(ind);
  renderMarketingHow(ind);
  renderMarketingAbout(ind);
  renderMarketingMethods(ind);
  renderMarketingContact(ind);
});
```

- [ ] **Step 2: Syntax-check the complete file**

Run: `node --check frontend/js/00-marketing-content.js`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/js/00-marketing-content.js
git commit -m "feat: bootstrap marketing-content render for both industries

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: `index.html` — trim farm marketing sections to shells

**Files:**
- Modify: `frontend/index.html`

**Interfaces:**
- Consumes: `renderMarketingHome/How/About/Methods/Contact` from Tasks 5–8 (via the `data-view` selector each function uses)
- Produces: empty `<section class="view" data-view="...">` shells that Task 8's bootstrap call fills

- [ ] **Step 1: Replace the farm `home` section body**

Find the `<section class="view show" data-view="home">...</section>` block (currently lines 88–136) and replace its entire inner content with nothing, keeping only the wrapper:

```html
<section class="view show" data-view="home"></section>
```

- [ ] **Step 2: Replace the farm `how` section body**

Find `<section class="view" data-view="how">...</section>` (currently lines 139–144) and replace with:

```html
<section class="view" data-view="how"></section>
```

- [ ] **Step 3: Replace the farm `about` section body**

Find `<section class="view" data-view="about">...</section>` (currently lines 429–443) and replace with:

```html
<section class="view" data-view="about"></section>
```

- [ ] **Step 4: Replace the farm `methods` section body**

Find `<section class="view" data-view="methods">...</section>` (currently lines 446–512) and replace with:

```html
<section class="view" data-view="methods"></section>
```

- [ ] **Step 5: Replace the farm `contact` section body**

Find `<section class="view" data-view="contact">...</section>` (currently lines 515–536) and replace with:

```html
<section class="view" data-view="contact"></section>
```

- [ ] **Step 6: Verify the 5 shells are present and empty**

Run: `grep -n 'data-view="home"\|data-view="how"\|data-view="about"\|data-view="methods"\|data-view="contact"' frontend/index.html`
Expected: 5 lines, each of the form `<section class="view..." data-view="X"></section>` with no content between the tags (except `home` keeps its `show` class).

- [ ] **Step 7: Commit**

```bash
git add frontend/index.html
git commit -m "refactor: trim farm marketing sections to config-driven shells

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: `index.html` — trim hort marketing sections to shells + add script tag

**Files:**
- Modify: `frontend/index.html`

**Interfaces:**
- Consumes: same render functions as Task 9
- Produces: the mirrored 5 empty hort shells, plus the new script tag that makes `00-marketing-content.js` and everything from Tasks 5–8 actually load

- [ ] **Step 1: Replace the hort `h-home` section body**

Find `<section class="view" data-view="h-home">...</section>` (currently lines 540–613) and replace with:

```html
<section class="view" data-view="h-home"></section>
```

- [ ] **Step 2: Replace the hort `h-how` section body**

Find `<section class="view" data-view="h-how">...</section>` (currently lines 615–627) and replace with:

```html
<section class="view" data-view="h-how"></section>
```

- [ ] **Step 3: Replace the hort `h-about` section body**

Find `<section class="view" data-view="h-about">...</section>` (currently lines 808–822) and replace with:

```html
<section class="view" data-view="h-about"></section>
```

- [ ] **Step 4: Replace the hort `h-methods` section body**

Find `<section class="view" data-view="h-methods">...</section>` (currently lines 773–806) and replace with:

```html
<section class="view" data-view="h-methods"></section>
```

- [ ] **Step 5: Replace the hort `h-contact` section body**

Find `<section class="view" data-view="h-contact">...</section>` (currently lines 824–844) and replace with:

```html
<section class="view" data-view="h-contact"></section>
```

- [ ] **Step 6: Add the new script tag before `01-data-core.js`**

Find:
```html
<script src="js/01-data-core.js"></script>
```
Replace with:
```html
<script src="js/00-marketing-content.js"></script>
<script src="js/01-data-core.js"></script>
```

- [ ] **Step 7: Verify the 5 hort shells and the new script tag**

Run: `grep -n 'data-view="h-home"\|data-view="h-how"\|data-view="h-about"\|data-view="h-methods"\|data-view="h-contact"\|00-marketing-content.js' frontend/index.html`
Expected: 6 lines — the 5 empty shells plus the new script tag, and the script tag line must appear immediately before the `01-data-core.js` line.

- [ ] **Step 8: Commit**

```bash
git add frontend/index.html
git commit -m "refactor: trim hort marketing sections to shells, wire up 00-marketing-content.js

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 11: Wire boot order in `04-industry-router.js`

**Files:**
- Modify: `frontend/js/04-industry-router.js:85,87` (inside the active `go()` function)

**Interfaces:**
- Consumes: nothing new
- Produces: `go()` no longer re-renders the now-static How pages on every nav click (they're already rendered once at boot by Task 8); `go('h-methods')` still calls `renderHMethods()` since that reads live `HDATA.factors`

- [ ] **Step 1: Remove the two now-redundant render calls**

In `frontend/js/04-industry-router.js`, inside the active `go = function(v){...}` (the one that actually runs — see Global Constraints), find:

```js
  if(v==='dashboard') renderDashView();
  if(v==='ai') renderAIView();
  if(v==='credit') renderCreditView();
  if(v==='how') renderHow();
  if(v==='h-home') hBoot();
  if(v==='h-how') renderHHow();
  if(v==='h-dash') renderHDashView();
  if(v==='h-ai') renderHAIView();
  if(v==='h-methods') renderHMethods();
```

Replace with:

```js
  if(v==='dashboard') renderDashView();
  if(v==='ai') renderAIView();
  if(v==='credit') renderCreditView();
  if(v==='h-home') hBoot();
  if(v==='h-dash') renderHDashView();
  if(v==='h-ai') renderHAIView();
  if(v==='h-methods') renderHMethods();
```

- [ ] **Step 2: Syntax-check**

Run: `node --check frontend/js/04-industry-router.js`
Expected: no output.

- [ ] **Step 3: Start the backend and smoke-test the full nav for both industries**

Run: `node backend/server.js &` then, once it logs `LCCIP backend listening on http://localhost:3000`:
- `curl -s http://localhost:3000/ | grep -c 'renderMarketingHome\|00-marketing-content'` → expect at least 1 (the script tag is present in the served HTML)
- `curl -s http://localhost:3000/api/network/farms?industry=farm -o /dev/null -w "%{http_code}\n"` → expect `200`
- `curl -s http://localhost:3000/api/network/farms?industry=hort -o /dev/null -w "%{http_code}\n"` → expect `200`
- `curl -s http://localhost:3000/api/network/hort-monthly -o /dev/null -w "%{http_code}\n"` → expect `200`

Stop the server afterward (`kill` the backgrounded process). A full in-browser click-through (chooser → both industries → every nav item) is done once, comprehensively, in Task 16 after all remaining tasks land — repeating it here would be redundant.

- [ ] **Step 4: Commit**

```bash
git add frontend/js/04-industry-router.js
git commit -m "refactor: drop redundant How-page re-render from go(), keep live Methods render

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 12: Dashboard progressive disclosure — farm

**Files:**
- Modify: `frontend/js/02-dashboard-farm.js:46-72` (`renderDash()`)

**Interfaces:**
- Consumes: `.disclose`/`.disclose-body` from Task 1
- Produces: the KPI bar shows 4 headline numbers by default with the remaining 2 behind a `<details>` — no change to `FARMS` data or the numbers themselves

- [ ] **Step 1: Split the 6-item KPI array into headline + secondary**

In `renderDash()`, replace:

```js
  const kpi=[["Gross emissions",(f.gross/1000).toFixed(2)+"k t","CO₂-e this year"],["Net emissions",(f.net/1000).toFixed(2)+"k t","after sequestration"],
    ["Carbon intensity",f.intensity,f.unit],["Net-zero progress",f.nz+"%","2040 target"],["Potential ACCUs",f.accu,"per year"],["Carbon revenue","$"+(f.accu*38/1000).toFixed(0)+"k","at $38/ACCU"]];
```

with:

```js
  const kpiAll=[["Gross emissions",(f.gross/1000).toFixed(2)+"k t","CO₂-e this year"],["Net emissions",(f.net/1000).toFixed(2)+"k t","after sequestration"],
    ["Carbon intensity",f.intensity,f.unit],["Net-zero progress",f.nz+"%","2040 target"],["Potential ACCUs",f.accu,"per year"],["Carbon revenue","$"+(f.accu*38/1000).toFixed(0)+"k","at $38/ACCU"]];
  const kpi=kpiAll.slice(0,4), kpiMore=kpiAll.slice(4);
```

- [ ] **Step 2: Render the secondary KPIs behind a `<details>`**

Replace:

```js
   <div class="kpibar">${kpi.map((k,i)=>`<div class="kpi"><div class="kl">${k[0]}</div><div class="kv" style="color:${i>=4?'#A87A2A':'#1B211C'}">${k[1]}</div><div class="ks">${k[2]}</div></div>`).join("")}</div>
```

with:

```js
   <div class="kpibar" style="grid-template-columns:repeat(4,1fr)">${kpi.map(k=>`<div class="kpi"><div class="kl">${k[0]}</div><div class="kv">${k[1]}</div><div class="ks">${k[2]}</div></div>`).join("")}</div>
   <details class="disclose"><summary>2 more figures — ACCU potential &amp; carbon revenue</summary>
     <div class="disclose-body kpibar" style="grid-template-columns:repeat(2,1fr);margin-top:12px">${kpiMore.map(k=>`<div class="kpi"><div class="kl">${k[0]}</div><div class="kv" style="color:#A87A2A">${k[1]}</div><div class="ks">${k[2]}</div></div>`).join("")}</div>
   </details>
```

(This edit replaces the line already recolored in Task 2 Step 3 — apply Task 2 first, then this task, so the `?'#A87A2A':'#1B211C'` ternary from Task 2 is what you're replacing here. If executing tasks out of order, match on the surrounding structure instead of the exact color hex.)

- [ ] **Step 3: Syntax-check**

Run: `node --check frontend/js/02-dashboard-farm.js`
Expected: no output.

- [ ] **Step 4: Smoke-test in the running app**

With the backend running (`node backend/server.js`), open `http://localhost:3000`, pick "Farm — Cattle", subscribe as Producer (free plan) via the modal, go to Dashboard → Live summary. Confirm: 4 KPI tiles show by default (Gross, Net, Carbon intensity, Net-zero progress), a closed "2 more figures" disclosure sits below them, and opening it reveals Potential ACCUs + Carbon revenue with the gold accent color intact.

- [ ] **Step 5: Commit**

```bash
git add frontend/js/02-dashboard-farm.js
git commit -m "feat: progressive disclosure on farm dashboard KPI bar

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 13: Dashboard progressive disclosure — hort

**Files:**
- Modify: `frontend/js/06-hort-dashboard.js:58-65` (the `kpis` template inside `renderHDash()`, `overview` page)

**Interfaces:**
- Consumes: `.disclose` (Task 1) — note the `.hz` theme's own panel styling stays untouched; the `<details>` wraps around it, it doesn't replace it
- Produces: the 6-tile `.hkpis` bar on the Overview page shows 4 by default, 2 behind disclosure; the other 6 `hPage` views (`sources`/`bench`/`resource`/`confidence`/`abate`/`factors`) are unchanged — they're already scoped to one topic per page, which is itself a form of progressive disclosure, so no further split is needed there (per spec §8, apply `<details>` only to genuinely secondary content, not globally)

- [ ] **Step 1: Split the KPI template**

Replace:

```js
  const kpis=`<div class="hkpis">
    <div class="hkpi"><div class="l">Gross</div><div class="v">${hf(T(s.g))}</div><div class="d">t CO₂-e · S1 ${pct(s.s1)}% · S2 ${pct(s.s2)}% · S3 ${pct(s.s3)}%</div></div>
    <div class="hkpi"><div class="l">Removals</div><div class="v" style="color:#3C6140">−${hf(T(s.rm))}</div><div class="d">t CO₂-e · ${pct(s.rm)}% of gross</div></div>
    <div class="hkpi accent"><div class="l">Net</div><div class="v">${hf(T(s.n))}</div><div class="d">t CO₂-e · gross less removals</div></div>
    <div class="hkpi"><div class="l">Carbon intensity</div><div class="v">${s.ci.toFixed(3)}</div><div class="d">kg CO₂-e / kg · target ${s.tgt.toFixed(3)}</div></div>
    <div class="hkpi"><div class="l">Marketable yield</div><div class="v">${hf(s.yld/1000)}</div><div class="d">tonnes · ${hf(fa.reduce((a,f)=>a+f.ha,0))} ha in scope</div></div>
    <div class="hkpi"><div class="l">High-priority farms</div><div class="v" style="color:${hi?'#A8352B':'#4C7A4A'}">${hi}<span style="font-size:14px;color:#6E7569"> / ${fa.length}</span></div><div class="d">&gt;15% over target</div></div>
  </div>`;
```

with:

```js
  const kpis=`<div class="hkpis" style="grid-template-columns:repeat(4,1fr)">
    <div class="hkpi"><div class="l">Gross</div><div class="v">${hf(T(s.g))}</div><div class="d">t CO₂-e · S1 ${pct(s.s1)}% · S2 ${pct(s.s2)}% · S3 ${pct(s.s3)}%</div></div>
    <div class="hkpi"><div class="l">Removals</div><div class="v" style="color:#3C6140">−${hf(T(s.rm))}</div><div class="d">t CO₂-e · ${pct(s.rm)}% of gross</div></div>
    <div class="hkpi accent"><div class="l">Net</div><div class="v">${hf(T(s.n))}</div><div class="d">t CO₂-e · gross less removals</div></div>
    <div class="hkpi"><div class="l">Carbon intensity</div><div class="v">${s.ci.toFixed(3)}</div><div class="d">kg CO₂-e / kg · target ${s.tgt.toFixed(3)}</div></div>
  </div>
  <details class="disclose"><summary>2 more figures — yield &amp; high-priority farms</summary>
    <div class="disclose-body hkpis" style="grid-template-columns:repeat(2,1fr);margin-top:12px">
      <div class="hkpi"><div class="l">Marketable yield</div><div class="v">${hf(s.yld/1000)}</div><div class="d">tonnes · ${hf(fa.reduce((a,f)=>a+f.ha,0))} ha in scope</div></div>
      <div class="hkpi"><div class="l">High-priority farms</div><div class="v" style="color:${hi?'#A8352B':'#4C7A4A'}">${hi}<span style="font-size:14px;color:#6E7569"> / ${fa.length}</span></div><div class="d">&gt;15% over target</div></div>
    </div>
  </details>`;
```

This `kpis` string is reused verbatim at the top of every one of the 7 `hPage` branches (`overview`, `sources`, `bench` — search for `${kpis}` inside `renderHDash()`), so the split applies everywhere it's used, not just `overview`.

- [ ] **Step 2: Syntax-check**

Run: `node --check frontend/js/06-hort-dashboard.js`
Expected: no output.

- [ ] **Step 3: Smoke-test**

With the backend running, pick "Horticulture", subscribe (Grower/free), go to Dashboard, confirm the 4+2-behind-disclosure KPI split appears on the Overview page (and on Sources/Benchmarking/etc. since they share the same `kpis` string) and every existing chart/table on all 7 sub-pages still renders (Overview, Sources, Benchmarking, Resource, Confidence, Abatement, Factors — click through each via `#hnav`).

- [ ] **Step 4: Commit**

```bash
git add frontend/js/06-hort-dashboard.js
git commit -m "feat: progressive disclosure on horticulture dashboard KPI bar

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 14: AI recommendations table collapse — farm + hort

**Files:**
- Modify: `frontend/js/02-dashboard-farm.js:80-103` (`renderAI()`)
- Modify: `frontend/js/07-hort-quick-calc.js:19-50` (`renderHAI()`)

**Interfaces:**
- Consumes: `.disclose` (Task 1)
- Produces: the intervention table shows its top 5 rows by default with the rest behind a `<details>`; the totals/ranking logic is unchanged

- [ ] **Step 1: Farm — split the intervention rows**

In `renderAI()` (`02-dashboard-farm.js`), replace:

```js
  const intv=f.intv.map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td style="text-align:center"><span class="prio" style="background:${COL[r[4]]}">${r[3]}</span></td></tr>`).join("");
```

with:

```js
  const intvRows=f.intv.map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td style="text-align:center"><span class="prio" style="background:${COL[r[4]]}">${r[3]}</span></td></tr>`);
  const intv=intvRows.slice(0,5).join("");
  const intvMore=intvRows.slice(5).join("");
```

Then replace:

```js
   <div class="panel"><h3>AI-recommended interventions</h3><div class="ph">Ranked by impact · estimated cut & payback · ${f.name}</div>
     <table class="tbl"><tr><th>Action</th><th style="text-align:center">Cut t/yr</th><th style="text-align:center">Payback</th><th style="text-align:center">Priority</th></tr>${intv}</table></div>`;
```

with:

```js
   <div class="panel"><h3>AI-recommended interventions</h3><div class="ph">Ranked by impact · estimated cut & payback · ${f.name}</div>
     <table class="tbl"><tr><th>Action</th><th style="text-align:center">Cut t/yr</th><th style="text-align:center">Payback</th><th style="text-align:center">Priority</th></tr>${intv}</table>
     ${intvMore?`<details class="disclose"><summary>${f.intv.length-5} more interventions</summary><div class="disclose-body"><table class="tbl">${intvMore}</table></div></details>`:''}
   </div>`;
```

- [ ] **Step 2: Hort — split the abatement rows**

In `renderHAI()` (`07-hort-quick-calc.js`), the ranked list is already sliced to 6 (`ranked.slice(0,6)`) before mapping, so there's no "more" data being computed today — this is the smallest of the three tables and 6 rows is already tight; per spec §8 ("only apply `<details>` to genuinely secondary content") leave this table as-is. Verify by re-reading the function: confirm `rows` (line 29-32) has no additional data being discarded that a "show more" would reveal — `ranked` holds all sources (up to 12), only the top 6 are ever computed into `rows`, so there is nothing left to disclose without changing what's computed. No code change in this step; this step exists to document why hort's AI table is intentionally excluded from this task, so a reviewer doesn't flag it as missed.

- [ ] **Step 3: Syntax-check**

Run: `node --check frontend/js/02-dashboard-farm.js`
Expected: no output.

- [ ] **Step 4: Smoke-test**

Farm: Dashboard is subscribed already from Task 12's test — go to AI Recommendations, confirm the table shows 5 rows plus a "5 more interventions" disclosure (farm's `RX_CATTLE`-adjacent `f.intv` array has 10 entries per farm in the seed data, so this should show `5 more`).

- [ ] **Step 5: Commit**

```bash
git add frontend/js/02-dashboard-farm.js
git commit -m "feat: collapse farm AI intervention table to top 5 with disclosure

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 15: PBI report — accordion for secondary chart tiles

**Files:**
- Modify: `frontend/index.html:193-271` (the `.pbi` report's 5 `<div class="page" id="p1">`…`id="p5">` blocks)
- Modify: `frontend/css/pbi-report.css` (append `<details>` styling, scoped to `.pbi` only — this is the one exception to "pbi-report.css is untouched," because `<details>` needs Segoe-UI-consistent styling to look native inside the replica rather than borrowing the ledger-toned `.disclose` class, which would break the deliberate separate skin)

**Interfaces:**
- Consumes: nothing from Task 1 (deliberately — see above)
- Produces: on each PBI page, the primary chart tile stays visible by default; secondary tiles move behind a page-scoped `<details>`. `08-pbi-charts.js` fills chart containers by `id` regardless of their visibility (it just sets `.innerHTML` on `document.getElementById(...)`), so wrapping a container in a closed `<details>` does not break the chart rendering — the SVG is built and inserted whether or not the `<details>` is open.

- [ ] **Step 1: Add `.pbi`-scoped `<details>` styling**

Append to `frontend/css/pbi-report.css`:

```css
.pbi details{margin-top:8px}
.pbi details summary{list-style:none;cursor:pointer;padding:8px 4px;font-size:11.5px;font-weight:600;color:var(--c1);display:flex;align-items:center;gap:6px}
.pbi details summary::-webkit-details-marker{display:none}
.pbi details summary:before{content:"▸";font-size:10px}
.pbi details[open] summary:before{content:"▾"}
```

- [ ] **Step 2: Page 1 (Executive Dashboard) — keep the donut+legend visible, move the line/stack/bar tiles behind disclosure**

Replace:

```html
    <div class="grid" id="kpis" style="grid-template-columns:repeat(6,1fr)"></div>
    <div class="grid" style="grid-template-columns:1fr 2fr;margin-top:12px">
      <div class="pbtile"><div class="tile-h"><h3>Emissions by Scope (tCO₂-e)</h3><span class="dots">⋯</span></div><div id="v-donut"></div>
        <div class="pblegend"><span><i style="background:var(--c1)"></i>Scope 1 · 1,343</span><span><i style="background:var(--c2)"></i>Scope 2 · 234</span><span><i style="background:var(--c3)"></i>Scope 3 · 755</span></div></div>
      <div class="pbtile"><div class="tile-h"><h3>Net Emissions vs Target by Month (tCO₂-e)</h3><span class="dots">⋯</span></div><div id="v-line"></div>
        <div class="pblegend"><span><i style="background:var(--c1)"></i>Actual net</span><span><i style="background:var(--c2)"></i>Target</span></div></div>
    </div>
    <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:12px">
      <div class="pbtile"><div class="tile-h"><h3>Scope Mix by Month (100% stacked)</h3><span class="dots">⋯</span></div><div id="v-stack"></div>
        <div class="pblegend"><span><i style="background:var(--c1)"></i>Scope 1</span><span><i style="background:var(--c2)"></i>Scope 2</span><span><i style="background:var(--c3)"></i>Scope 3</span></div></div>
      <div class="pbtile"><div class="tile-h"><h3>Emissions by Sector (tCO₂-e)</h3><span class="dots">⋯</span></div><div id="v-bar"></div></div>
    </div>
```

with:

```html
    <div class="grid" id="kpis" style="grid-template-columns:repeat(6,1fr)"></div>
    <div class="pbtile" style="margin-top:12px"><div class="tile-h"><h3>Emissions by Scope (tCO₂-e)</h3><span class="dots">⋯</span></div><div id="v-donut"></div>
      <div class="pblegend"><span><i style="background:var(--c1)"></i>Scope 1 · 1,343</span><span><i style="background:var(--c2)"></i>Scope 2 · 234</span><span><i style="background:var(--c3)"></i>Scope 3 · 755</span></div></div>
    <details><summary>3 more charts — trend, scope mix and sector breakdown</summary>
      <div class="grid" style="grid-template-columns:1fr;margin-top:8px">
        <div class="pbtile"><div class="tile-h"><h3>Net Emissions vs Target by Month (tCO₂-e)</h3><span class="dots">⋯</span></div><div id="v-line"></div>
          <div class="pblegend"><span><i style="background:var(--c1)"></i>Actual net</span><span><i style="background:var(--c2)"></i>Target</span></div></div>
      </div>
      <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:12px">
        <div class="pbtile"><div class="tile-h"><h3>Scope Mix by Month (100% stacked)</h3><span class="dots">⋯</span></div><div id="v-stack"></div>
          <div class="pblegend"><span><i style="background:var(--c1)"></i>Scope 1</span><span><i style="background:var(--c2)"></i>Scope 2</span><span><i style="background:var(--c3)"></i>Scope 3</span></div></div>
        <div class="pbtile"><div class="tile-h"><h3>Emissions by Sector (tCO₂-e)</h3><span class="dots">⋯</span></div><div id="v-bar"></div></div>
      </div>
    </details>
```

- [ ] **Step 3: Page 3 (AI Forecasting) — keep the forecast chart visible, move hotspot/root-cause behind disclosure**

Replace:

```html
    <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:12px">
      <div class="pbtile"><div class="tile-h"><h3>Hotspot Detection by Sector (tCO₂-e)</h3><span class="dots">⋯</span></div><div id="v-hot"></div>
        <div class="pblegend"><span><i style="background:var(--red)"></i>Red</span><span><i style="background:var(--amber)"></i>Amber</span><span><i style="background:var(--green)"></i>Green</span></div></div>
      <div class="pbtile"><div class="tile-h"><h3>Root-Cause &amp; Risk Summary</h3><span class="dots">⋯</span></div><div id="v-rc"></div></div>
    </div>
```

with:

```html
    <details style="margin-top:12px"><summary>Hotspot detection and root-cause detail</summary>
      <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:8px">
        <div class="pbtile"><div class="tile-h"><h3>Hotspot Detection by Sector (tCO₂-e)</h3><span class="dots">⋯</span></div><div id="v-hot"></div>
          <div class="pblegend"><span><i style="background:var(--red)"></i>Red</span><span><i style="background:var(--amber)"></i>Amber</span><span><i style="background:var(--green)"></i>Green</span></div></div>
        <div class="pbtile"><div class="tile-h"><h3>Root-Cause &amp; Risk Summary</h3><span class="dots">⋯</span></div><div id="v-rc"></div></div>
      </div>
    </details>
```

- [ ] **Step 4: Verify all 12 chart container ids referenced by `08-pbi-charts.js` still exist**

Run: `for id in v-donut v-line v-stack v-bar v-ci v-fc v-hot v-ndvi v-ibar v-scatter v-water v-map v-pivot v-rc v-itable v-ptable kpis; do grep -q "id=\"$id\"" frontend/index.html && echo "OK: $id" || echo "MISSING: $id"; done`
Expected: `OK:` for every id, no `MISSING:` lines. (`08-pbi-charts.js` does `document.getElementById(id).innerHTML=...` for each of these — if any is missing, that line throws and the whole IIFE stops executing partway through.)

- [ ] **Step 5: Smoke-test**

With the backend running, subscribe, go to Dashboard → Power BI report tab. Confirm Page 1 shows the KPI row + donut chart immediately, with a closed "3 more charts" disclosure below it that reveals the line/stack/bar charts when opened (already-rendered, since `08-pbi-charts.js` fills them regardless of visibility — opening should show fully-drawn charts instantly, no re-render). Confirm Page 3 behaves the same way for hotspot/root-cause. Click through pages 2, 4, 5 to confirm they're visually unaffected (this task only touches pages 1 and 3).

- [ ] **Step 6: Commit**

```bash
git add frontend/index.html frontend/css/pbi-report.css
git commit -m "feat: accordion secondary PBI report chart tiles on pages 1 and 3

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 16: Full verification pass

**Files:**
- None modified — this task is pure verification, per the spec's §12 Verification plan.

**Interfaces:**
- Consumes: everything from Tasks 1–15

- [ ] **Step 1: Start the backend**

Run: `node backend/server.js` (background it or run in a dedicated terminal). Confirm the log line `LCCIP backend listening on http://localhost:3000` with no errors above it.

- [ ] **Step 2: Syntax-check every JS file one more time in sequence**

Run: `for f in frontend/js/*.js; do node --check "$f" || echo "FAIL: $f"; done`
Expected: no `FAIL:` lines.

- [ ] **Step 3: Manual click-through — farm industry**

In a browser at `http://localhost:3000`: pick "Farm — Cattle" from the chooser. Confirm the Home hero shows one CTA, a ruled hero-stat strip with 3 live numbers, the trust strip, the merged 4-step ledger-thread band, and a one-line pricing teaser with a working `#pricing` anchor link scrolling to the 3 pricing cards at the bottom. Click every nav item (How it works, Dashboard, Farm Data Input, AI Recommendations, Carbon Credits, Methods & Standards, About/Impact, Contact) and confirm each renders without a blank page or console error. Run the Quick Estimate calculator and the full 6-step wizard through to Results. Subscribe via the modal (Producer plan), confirm the dashboard, AI, and credit views un-gate and render live data.

- [ ] **Step 4: Manual click-through — horticulture industry**

Click "← Industries" (or reload), pick "Horticulture". Repeat the same click-through: Home, How it works, Dashboard (all 7 `hPage` tabs: Overview, Sources, Benchmarking, Resource, Confidence, Abatement, Factors), Grower Data Input (quick + wizard), AI Recommendations, Methods & Standards (confirm the live factor-provenance chart still renders inside the disclosure), About/Impact, Contact.

- [ ] **Step 5: Reduced-motion check**

In browser dev tools, enable "prefers-reduced-motion: reduce" (Chrome DevTools → Rendering tab → Emulate CSS media feature). Reload and confirm section transitions, live-pill blinking, and chooser-card hover transforms are all suppressed per the existing `base.css` reduced-motion block (unchanged by this plan) — this is a regression check, not new behavior.

- [ ] **Step 6: Mobile breakpoint check**

Resize the browser to below 960px width (or use device emulation). Confirm the hero, KPI bars, cards, pricing, and impact grids collapse to their mobile column counts per the existing `@media(max-width:960px)` block in `base.css`, and that the new `.disclose`/`<details>` elements remain usable (full width, readable) at this width.

- [ ] **Step 7: Console error check**

With browser dev tools open to the Console tab, repeat Steps 3–4's click-through. Confirm zero uncaught errors at any point (industry switch, every nav item, both calculators, both dashboards' every sub-page, both AI/credit views, PBI report tab and every one of its 5 pages).

- [ ] **Step 8: Final full-repo grep for leftover old-brand hex**

Run: `grep -rlnE "#2c5f2d|#6ba644|#b8881e|#e9c768|#4e9d52|#d14a3f|#df9b26|#16201a|#12301d|#eaf3e7|#e2e9dd|#f4f7f1|#fafcf8|#faf9f8" frontend --include="*.css" --include="*.js" --include="*.html" | grep -v "08-pbi-charts.js\|06-hort-dashboard.js\|pbi-report.css\|horticulture.css"`
Expected: no output.

- [ ] **Step 9: Stop the backend and do a final status check**

Stop the `node backend/server.js` process. Run `git status --short` and `git log --oneline -20` to confirm every task's commit landed and the working tree is clean.
