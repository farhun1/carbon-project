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
