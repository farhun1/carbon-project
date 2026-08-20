# LCCIP frontend redesign — design spec

Status: approved by user, ready for implementation planning.
Scope: `frontend/` only (static HTML/CSS/JS, no build step, no framework).

## 1. Problem

The current site (`frontend/index.html`, 871 lines, 17 `.view` sections across two
duplicated industry tracks — cattle-farm and horticulture) reads as a spreadsheet, not
a product. Every marketing page stacks hero + stat blocks + trust strip + 4-step
workflow + 4 value cards + 3-tier pricing with no editorial pacing, and every data
screen (dashboard, calculator wizard, AI/credit views, Power-BI-replica report) shows
every KPI/chart/table it has at once. Farm and horticulture content are near-identical
in *shape* (same section types, different copy and numbers) but fully duplicated in
markup, so there's no single place to fix the pattern.

## 2. Goals

1. Apply a distinctive visual system inspired by regrow.ag's design language (deep
   green + warm neutral palette, serif/sans pairing, editorial spacing, moderate
   density, gradient/illustration accents over stock photography) — adapted into our
   own tokens and a signature specific to LCCIP's subject (carbon accounting → ACCU
   revenue), not a copy of regrow's literal palette.
2. Cut real information density: rewrite marketing copy tighter, drop redundant
   sections/stat repeats, move pricing off the homepage, and put data screens behind
   progressive disclosure (summary first, detail on demand).
3. Consolidate the farm/horticulture marketing shell: one JS config + shared render
   functions instead of two full duplicated HTML trees, for the pages that are
   structurally identical between industries.
4. Keep every data screen functionally correct — same calculators, same charts, same
   subscriber gating, same figures — restyled and reorganized, not recomputed.

## 3. Non-goals

- No backend/API changes. No change to `FARMS`/`HFARMS`/`HDATA` data shape or the
  calculation logic in `01-data-core.js` / `03-calculator-farm.js` / `09-calculator-hort.js`.
- No change to script load order or a move to ES modules (`frontend/README.md`'s
  constraint stands — ten global-scope files, order is load-bearing).
- No merging of farm and horticulture *data* (herd vs. crop enterprises stay separate
  domain models). Only the marketing-shell *presentation* is templated.
- No new build tooling, bundler, or framework.

## 4. Design tokens

Six named colors, warm-paper/ledger-book anchored (own identity, not regrow's hexes):

| token | hex | role |
|---|---|---|
| `--ink` | `#1B211C` | body text, warm near-black |
| `--paper` | `#F5F2EA` | page background, warm parchment |
| `--forest` | `#123A26` | primary brand green — nav, primary buttons, headings accent |
| `--moss` | `#5C8A4A` | secondary accent — links, hover states, secondary CTA border |
| `--ledger-gold` | `#A87A2A` | reserved *only* for money/credit figures (ACCU counts, $ revenue) |
| `--rule` | `#DCD5C4` | hairline borders, the ledger-rule motif |

Signal colors (unchanged role, restated on the new base): red `#C33` / amber `#D89A2E`
/ green (reuse `--moss`) for hotspot and status states only — never used for brand
elements.

Card surface (`--card`) becomes `#FFFFFF` at low elevation over `--paper`, same
shadow language as today (soft, warm-tinted) but slightly quieter (`0 6px 20px
rgba(18,58,38,.08)`).

## 5. Typography

- Display/headline (`h1`, `h2`, big ledger figures): keep the existing serif system
  stack — `"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New
  Roman",serif`. It's already a literary, almanac-toned choice distinct from the
  generic AI serif-on-cream default, and it costs no font-loading latency. Increase
  its role: section eyebrows and big figures lean on it more than body copy does today.
- Body/UI: keep the system-ui sans stack — no change, it's the right utility choice
  for a data-heavy app with zero font-loading budget.
- New: `font-variant-numeric: tabular-nums` plus tightened letter-spacing on every
  numeric figure (KPIs, hero stats, ACCU counts, prices) — makes numbers read as
  ledger entries lining up in a column, reinforcing the signature motif below.
- Type scale gets one more intentional step between the current hero H1 (46px) and
  section H2 (33px) — a 38px "band head" size for the merged workflow/value-prop
  section headers introduced in §7.

## 6. Signature: the carbon ledger rule

A hairline ruled-paper motif — literal ledger lines — used sparingly in three places:

1. **Workflow thread**: the Baseline → Reduce → Verify → Earn steps (today four
   disconnected `.fs` tiles) sit on a single drawn horizontal rule with tick marks at
   each step, like entries in a passbook.
2. **Ledger underline**: every ACCU/revenue figure (`--ledger-gold` colored) gets a
   thin double-rule underline, like a total line in an account book.
3. **Hero stat strip**: the three home-page stats sit inside a single ruled row
   (one hairline top border, tick-mark dividers between stats) instead of three
   free-floating stat blocks.

This is the one deliberate risk: it literalizes LCCIP's actual thesis (carbon,
accounted, becomes revenue) in a way regrow's gradient-illustration language doesn't
attempt, and it's specific to a platform whose product *is* an accounting layer —
not a generic device applied because it looks nice.

## 7. Marketing-page content plan (per page, both industries)

Rewritten tighter; industry differences are copy/numbers only, structure is shared
(see §9 for the templating mechanism).

- **Home**: hero (kicker + H1 + one-sentence lead + single primary CTA, ghost CTA
  removed — "See how it works" folds into a scroll anchor, not a second button) + one
  ruled hero-stat strip + trust strip (unchanged, already tight) + one merged
  "workflow + value" band (the four pipeline steps *are* the four value props — today
  they're two separate four-item sections saying overlapping things; merge into one
  four-column band using the ledger-thread signature). Pricing teaser shrinks to a
  single line + link to a dedicated pricing anchor/section reached via nav, not three
  full plan cards inline.
- **How it works**: keep the step grid (already JS-rendered from `renderHow()`/
  `renderHHow()`), tighten copy per step, drop the separate "7-layer platform" /
  "horticulture emission model" block into a collapsed detail (`<details>`) under the
  steps rather than a second full section.
- **About/impact**: four impact stats keep their ruled-row treatment (reuses hero
  strip pattern); three mission/gap/why-it-matters cards shrink to one tightened
  paragraph each.
- **Methods & standards**: this page is inherently data-dense (it's the audit-facing
  page) — keep all factors/tables, but move the emission-factor table and the
  normal-vs-LCCIP comparison behind `<details>` disclosure with the mechanism
  equation and ACCU pathway staying visible by default.
- **Contact**: unchanged structurally (it's already minimal), only restyled.
- **Industry chooser**: restyle only, content already minimal.

## 8. Data-screen progressive disclosure

- **Dashboard (live summary)**: KPI bar defaults to the 3 headline numbers (net
  emissions, ACCU potential, data confidence) with a "View full ledger" expand for
  the remaining KPIs, matching the existing `.kpi`/`.kpibar` component — no new
  component family, just a collapsed/expanded state.
- **Power BI report replica**: already tab-paged (`p1`–`p5` via `pbiJump()`) — reduce
  simultaneous chart tiles per page where a page currently shows 4 (e.g. p1's two
  grid rows) down to a primary chart + an accordion for secondary charts, reusing the
  `<details>` pattern for consistency.
- **Calculator wizard**: no structural change (it's already one-step-at-a-time by
  design) — restyle only.
- **AI recommendations / credit**: collapse the ranked intervention table to top 5
  rows by default with a "show all interventions" expand, reusing `<details>`.

`<details>`/`<summary>` is the one new interaction primitive introduced across the
whole redesign — no new JS state machine, keyboard/AT support is free, and it matches
"quiet chrome, one signature element" from the design brief.

## 9. Industry consolidation architecture

For the five marketing views that are structurally identical between industries
(home, how, about, methods, contact — 10 sections today, farm + hort), replace the
duplicated static HTML with:

- One `INDUSTRY_CONTENT` config object (two entries: `farm`, `hort`) holding the
  copy/numbers that differ — hero headline, lead, stats, workflow step text, value
  cards, impact numbers, contact details, etc.
- Shared render functions (`renderMarketingHome(cfg)`, `renderMarketingAbout(cfg)`,
  etc.) that build each section's innerHTML from the config, following the *existing*
  pattern already used for `renderHow()` / `renderHHow()` / `renderHMethods()` (those
  three views are already JS-rendered into empty containers — this extends that idiom
  to the remaining marketing views instead of introducing a new one).
- The five view `<section class="view" data-view="...">` shells stay in
  `index.html` (so `go()`'s `data-view` toggling is untouched) but start empty and
  are populated by the shared render function for **both** industries at initial
  page load (see the boot-order constraint below), not lazily on
  `pickIndustry()` — matching how the fully-static markup behaves today, where both
  industries' content already exists in the DOM from parse time and only visibility
  toggles.
- Data/app screens (dashboard, wizard, AI, credit, PBI report) are **not** touched by
  this consolidation — they keep their separate farm/hort render functions
  (`renderDash()` vs `renderHDash()` etc.) exactly as today; only their CSS/markup
  output is restyled per §8. This is deliberately conservative: those files already
  contain the actual calculation logic and the README's script-order warning applies
  most directly to them.
- **Boot-order constraint**: `boot()` (`07-hort-quick-calc.js`, invoked at parse
  time) asynchronously writes farm/hort network totals directly into
  `#hs-farms`/`#hs-net`/`#hs-accu`/`#im-farms`/`#im-net`/`#im-cut`/`#im-rev` once its
  fetches resolve — independent of whether the user has picked an industry yet. Those
  ids must therefore exist in the DOM before `boot()`'s fetch resolves, not only after
  `pickIndustry()` first runs. The implementation plan must render **both**
  industries' marketing shells once at initial page load (cheap — it's config-driven
  string building, not a fetch), with `pickIndustry()` only toggling which one is
  visible via the existing `.view`/`data-view` mechanism, exactly like the two full
  static trees do today. `pickIndustry()` re-rendering on every switch (as originally
  worded above) is unnecessary once both shells exist from load — drop that call and
  render once per industry at boot instead.

New code lives in `frontend/js/00-marketing-content.js`, loaded *before*
`01-data-core.js` (config/data only, no DOM calls, so it can safely load first without
disturbing the documented order — `01`–`10` keep their exact current relative order).

## 10. File impact map

| file | change |
|---|---|
| `frontend/css/base.css` | token values, type scale, card/kpi/hero component updates, ledger-rule utility classes |
| `frontend/css/marketing-extras.css` | trust strip, workflow/value band merge, comparison table restyle |
| `frontend/css/chooser.css`, `calculator.css`, `horticulture.css`, `pbi-report.css` | restyle only, no structural CSS changes beyond `<details>` support |
| `frontend/index.html` | trim duplicated marketing markup down to empty view shells for the 10 consolidated sections; data/app view markup restyled in place, not restructured |
| `frontend/js/00-marketing-content.js` (new) | `INDUSTRY_CONTENT` config + shared render functions |
| `frontend/js/01-data-core.js`, `04-industry-router.js` | call the new render functions from boot/`pickIndustry()` |
| `frontend/js/02-dashboard-farm.js`, `05–10*.js` | markup/class changes only for `<details>` progressive disclosure; no calculation logic changes |

## 11. Risks & mitigations

- **Risk**: moving marketing markup into JS-rendered config could silently drop copy
  or a data-bound `id` some other script depends on (e.g. `#hs-farms`,
  `#im-farms`, `#hh-ci`). **Mitigation**: the implementation plan enumerates every
  `id` referenced by `01-data-core.js`/`04-industry-router.js`/`05-hort-data-stats.js`
  inside the five consolidated views before removing their static markup, and the
  config/render functions must preserve every one of those ids.
- **Risk**: `<details>` default-closed state could hide information a user actually
  needs before acting (e.g. a KPI referenced by a screenshot/test). **Mitigation**:
  only apply `<details>` to genuinely secondary content per §7/§8 (never to the
  primary CTA path or the top-line numbers), and keep it open by default on desktop
  wide viewports if content is short enough to not need collapsing there — decide
  per-instance in the implementation plan, not globally.
- **Risk**: two industries drifting out of sync in the shared render functions (a
  farm-only field slipping into config used by both). **Mitigation**: config schema
  documented with required keys in the implementation plan; both `farm` and `hort`
  entries built and reviewed side by side.

## 12. Verification plan

- Manual pass through every nav item for both industries (`pickIndustry('farm')` /
  `pickIndustry('hort')`) after the redesign, confirming all 17 views render, all
  gated views still gate correctly, and all calculators still compute (quick +
  advanced wizard, both industries).
- Visual check at desktop and the existing `960px` mobile breakpoint.
- `prefers-reduced-motion` behavior re-verified (base.css already has a dedicated
  block; new animation, if any, must be added to it).
- No console errors on load or on industry switch.
