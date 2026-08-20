# Code Review Documentation
## LCCIP · Sustenora — Carbon Intelligence Platform (Cattle & Horticulture)



---

## 1. Purpose and Scope

This document reviews the `index.html` file of the LCCIP ("Sustenora") prototype — a single-page application that models life-cycle carbon accounting, AI-driven emission forecasting, and Australian Carbon Credit Unit (ACCU) monetisation for Australian cattle farms and horticulture operations.

The review covers:
- Overall architecture and technology choices
- Functional structure of each view/module
- The carbon-accounting equations and emission factors embedded in the UI, matched against their real-world regulatory and scientific sources (ACCU Scheme / Clean Energy Regulator, and AIA Environmental Accounting Platform, as requested)
- Code quality, maintainability, and risk observations
- Recommendations


---

## 2. System Overview

LCCIP is a marketing-and-demo prototype for a farm carbon-accounting SaaS product. It presents itself as a bridge between:
1. Farm operational data input,
2. Life-cycle assessment (LCA) emissions calculation (Scope 1/2/3),
3. AI-based forecasting and hotspot detection,
4. ACCU-based monetisation of verified emission reductions.

It is built as a static single-file app: inline `<style>` for all CSS (including a themed "Power BI replica" dashboard skin and a separate "ledger" skin for the Horticulture industry), inline `onclick` handlers wired to JS functions, and `Leaflet 1.9.4` (via the `unpkg` CDN) for map rendering. There is no build step, bundler, or backend visible in the reviewed portion — all "live" data (farm counts, tCO₂-e figures, ACCU potential) is static/synthetic and explicitly labelled as such in the UI copy (e.g. "Demo prototype · figures are indicative").

---

## 3. Architecture & Technology Summary

| Aspect | Observation |
|---|---|
| Structure | Single HTML file, view-based SPA pattern (`section.view` toggled via `go(viewName)`) |
| Styling | Inline `<style>`, CSS custom properties (`:root` variables), no CSS framework |
| Scripting | Inline/linked vanilla JS (only Leaflet as external dependency); calculation engine not reviewed (see §1) |
| Mapping | Leaflet 1.9.4 loaded from `unpkg.com`, no Subresource Integrity (SRI) hash present |
| Data | Fully static/synthetic, hardcoded in markup or (presumably) JS objects in the unreviewed script section |
| Auth/payment | Demo only — "Subscribe" modal collects an email and plan choice but explicitly states "no real payment or authentication" |
| Industries modelled | Cattle farming (dairy/beef/mixed/feedlot) and Horticulture (orchards, vineyards, protected cropping, open field) |

---

## 4. Module-by-Module Functional Review

| View / Module | Purpose | Key elements observed |
|---|---|---|
| Industry chooser (`#chooser`) | Landing overlay to pick Farm or Horticulture context | `pickIndustry('farm'|'hort')` |
| Header / nav | Global navigation between views | `go(view)`, industry switch, `backToLanding()`, Subscribe CTA |
| Subscribe modal | Fake account creation | `openModal()`, `closeModal()`, `subscribe()`; pre-filled with a third-party-looking email (see §6) |
| Home | Hero, workflow diagram (Baseline → Reduce → Verify → Earn), value props, pricing tiers ($0 Producer / $149 Network / Custom Enterprise) | Static |
| How It Works | 9-step process, 7-layer platform | Containers (`#stepgrid`, `#layers`) populated by JS not reviewed |
| Dashboard | Two modes: "Live summary" (farm selector + Leaflet GIS map) and a full 5-page **Power BI report replica** (Executive / LCA & Scope / AI Forecasting & Hotspots / Intervention & ACCU / Paddock & Sensors) | `dashTab()`, `renderDash()`, `pbiJump()` |
| Farm Data Input | **Quick estimate** calculator (12 fields: herd size, diesel, electricity, feed, fertiliser N, milk output, trees, pasture, land cleared, planned reduction %) and a **6-step "Full property assessment" wizard** (Property → Enterprises & Livestock → Feed/Fertiliser/Soil → Energy/Fuel/Transport → Production & Credit Scenario → Results) | `calcInput()`, `addEnt()`, `wizNext()`, `wizGo()`; explicitly states the engine is "NGER/IPCC-aligned... designed to run on the **AIA Environmental Accounting Platform** engine once connected" |
| AI Recommendations | Recommendations + Investment/ROI tabs | `aiTab()`, `renderAI()` |
| Carbon Credits | ACCU revenue modelling per farm | `renderCredit()` |
| Methods & Standards | **Public-facing methodology page** — states the core emission equation, GWP values, ACCU formula, and the emission-factor table (see §5) | Static content, this is the primary object of the equation review below |
| About / Impact | Mission statement, impact stats | Static |
| Contact | Lead-gen form | Submit handler is a placeholder `alert()`, no real backend |
| Horticulture views (`h-home`, `h-how`, …) | Parallel set of views for the Horticulture industry (packaging, soil N₂O, freight, water) | Partially reviewed; cut off after `h-home` and start of `h-how` |

---

## 5. Equation & Emission Factor Review (with ACCU / AIA References)

This is the core of the requested review: every equation and factor shown on the **Methods & Standards** page, matched to where a reviewer or auditor would find the equivalent in the real ACCU Scheme documentation and the AIA Environmental Accounting Platform (AIA EAP).

### 5.1 Core emissions equation

> **Code (as displayed):** `Total emissions = Σ (activity × emission factor)`

This is the standard NGER-style activity-based accounting equation.

- **Reference:** *National Greenhouse and Energy Reporting (Measurement) Determination 2008* (as amended) — the legislative source of this method.
- **Reference:** *National Greenhouse Accounts (NGA) Factors 2025*, Department of Climate Change, Energy, the Environment and Water (DCCEEW). https://www.dcceew.gov.au/climate-change/publications/national-greenhouse-accounts-factors-2025 — shows the equivalent worked formula (`E = Q × EC × EF` for fuel; analogous form for electricity, Table 3).

### 5.2 Global Warming Potential (GWP) conversions — CH₄ ×28, N₂O ×265

- **Reference:** IPCC Fifth Assessment Report (AR5), Working Group I, Chapter 8, Table 8.A.1 — origin of the 28 (CH₄) and 265 (N₂O) GWP‑100 values.
- **Reference:** NGA Factors 2025 (as above) — the table where DCCEEW publishes Australia's officially adopted GWP values for NGER reporting.
- **Note:** the code uses one CH₄ figure (28). NGER differentiates fossil vs biogenic methane GWP in some contexts (≈29.8 vs 27, AR5) — worth checking which is intended for livestock (biogenic) methane if this is taken further.

### 5.3 Diesel (2.68 kg CO₂-e/L) and Electricity (0.66 kg CO₂-e/kWh)

- **Reference:** *National Greenhouse Accounts Factors 2025* PDF — https://www.dcceew.gov.au/sites/default/files/documents/national-greenhouse-account-factors-2025.pdf
  - Diesel: fuel combustion table ("Automotive diesel oil" row, Scope 1 factor).
  - Electricity: Table 3, Indirect (Scope 2) emission factors for electricity grids — **published per state/territory**, not as one national number.

### 5.4 Enteric methane (2.0–3.1 t CO₂-e/head) and Manure (0.55 t CO₂-e/head)

- **Reference:** IPCC 2019 Refinement to the 2006 IPCC Guidelines for National Greenhouse Gas Inventories, Volume 4, Chapter 10 (Emissions from Livestock and Manure Management) — Tier 2 method, equations 10.21 (enteric CH₄) and 10.25 (manure).
- **Reference:** Australian National Greenhouse Gas Inventory / Australian Greenhouse Emissions Information System (AGEIS), Agriculture sector methodology — DCCEEW.
- **Reference (as named in the code itself):** AIA Environmental Accounting Platform (AIA EAP) — a real, currently operating calculation engine, developed by Agricultural Innovation Australia (AIA) with CSIRO, aligned to NGA Factors and to the Greenhouse Accounting Framework (GAF) Tools published by the Primary Industries Climate Challenges Centre. Overview: https://aginnovationaustralia.com.au/ea-platform/. AIA EAP does not publish a public raw equation sheet — the calculation logic is accessed via API/engine integration, so the project would need to contact AIA directly (or use their open-source calculator code, free until June 2028) for the exact factor sheet rather than treating the NGA Factors table as a substitute.

### 5.5 Fertiliser N₂O (5.5 kg CO₂-e/kg N)

- **Reference:** IPCC 2019 Refinement, Volume 4, Chapter 11 (N₂O Emissions from Managed Soils), Equation 11.1.

### 5.6 ACCU formula — `ACCUs = (Baseline − Project) × (1 − risk buffer)`; `Revenue = ACCUs × ~$38`

This is presented as a general ACCU formula but is actually specific to one (now closed) method, and mixes mechanics from two different method types:

- 

### 5.7 Land factors (Trees −6.0, Pasture −0.5, Land clearing +120 t CO₂-e/ha)

No single currently-active ACCU method uses these exact flat per-hectare rates — the UI itself already marks them "(indicative)", which is correct. Real equivalents would come from the *Estimating Soil Organic Carbon Sequestration using Measurement and Models Method 2021* (soil carbon) and the *Environmental Plantings* method, both of which use activity- and location-specific equations rather than flat rates. Suggest keeping the "indicative" labelling prominent if this table is shown to any external stakeholder (auditor, lender, processor), consistent with the "Honest status" banner already present on the page.

### 5.8 Summary table

| Equation / Factor in code | Primary scientific reference | Primary regulatory / platform reference | Status note |
|---|---|---|---|
| Total emissions = Σ(activity × EF) | — | NGER (Measurement) Determination 2008; NGA Factors 2025 | Current |
| GWP CH₄ ×28, N₂O ×265 | IPCC AR5, Table 8.A.1 | NGA Factors 2025 | Current |
| Diesel 2.68 kg CO₂-e/L | — | NGA Factors 2025 (fuel combustion table) | Current |
| Electricity 0.66 kg CO₂-e/kWh | — | NGA Factors 2025 (Table 3, per state) | Code uses flat national figure; source is state-differentiated |
| Enteric CH₄ 2.0–3.1 t CO₂-e/head | IPCC 2019 Refinement, Vol 4 Ch 10 | AGEIS; AIA EAP | AIA EAP factor sheet not publicly reproducible — contact AIA |
| Manure 0.55 t CO₂-e/head | IPCC 2019 Refinement, Vol 4 Ch 10 | AGEIS; AIA EAP | As above |
| Fertiliser N₂O 5.5 kg CO₂-e/kg N | IPCC 2019 Refinement, Vol 4 Ch 11 | — | Current |
| ACCU = (Baseline − Project) × (1 − buffer) | — | Beef Cattle Herd Management Determination 2015 | **Method closed to new projects since Dec 2024**; buffer mechanic belongs to sequestration methods, not this one |
| Land sequestration / clearing flat rates | — | Soil carbon / Environmental Plantings methods (structurally different) | Explicitly indicative — keep labelled as such |

---

## 6. Findings & Recommendations

### Critical / Major
1. **ACCU method mismatch (§5.6).** The ACCU formula mixes a livestock baseline/project structure with a sequestration-method risk buffer, and references (implicitly, via the "beef herd" framing) a methodology that is closed to new registrations. Before this is shown to any real farmer, lender, or processor, correct the mechanic and/or add a status disclaimer.
2. **Subscribe modal pre-fills a real-looking external email** (`analyst@rabobank.com.au`) as the default value in the email field. This should be replaced with a neutral placeholder — as written it could be read as implying a named financial institution uses or endorses the product.

### Moderate
3. **Single flat electricity factor** (0.66 kg CO₂-e/kWh) contradicts the cited source, which is state-differentiated. The form already captures `State`; wire the correct per-state Scope 2 factor.
4. **Leaflet loaded from `unpkg` CDN without an SRI hash** — add `integrity`/`crossorigin` attributes, standard practice for any externally hosted script on a page handling account/subscription data.
5. **Monolithic single file (2,981 lines / 315 KB)** mixing markup, ~1,700+ lines of CSS, and JS logic with no build step. Acceptable for a prototype/demo but will become hard to maintain if the project continues — consider splitting into separate CSS/JS files or a lightweight bundler once past the prototype stage.

### Minor / Informational
6. Contact form submit handler is a placeholder `alert()` — expected for a demo, flag before any production deployment.
7. No `aria-*` attributes or explicit `<label for="...">` bindings observed on form inputs in the reviewed markup (labels are visually adjacent `<label>` elements, not programmatically associated) — worth an accessibility pass.
8. The demo disclaimers already present throughout the UI ("Demo prototype — figures are indicative", "not for formal carbon reporting", "Honest status" banner) are good practice and should be retained/expanded as real data sources are integrated.

---

## 7. References

1. Department of Climate Change, Energy, the Environment and Water (DCCEEW) 2026, *National Greenhouse Accounts Factors 2025*, Australian Government. Available at: https://www.dcceew.gov.au/climate-change/publications/national-greenhouse-accounts-factors-2025
2. DCCEEW, *Australian National Greenhouse Accounts Factors 2025* (PDF). Available at: https://www.dcceew.gov.au/sites/default/files/documents/national-greenhouse-account-factors-2025.pdf
3. Australian Government, *National Greenhouse and Energy Reporting (Measurement) Determination 2008* (as amended).
4. IPCC 2013, *Fifth Assessment Report (AR5), Working Group I*, Chapter 8, Table 8.A.1 (Global Warming Potentials).
5. IPCC 2019, *2019 Refinement to the 2006 IPCC Guidelines for National Greenhouse Gas Inventories*, Volume 4: Agriculture, Forestry and Other Land Use — Chapter 10 (Livestock and Manure Management) and Chapter 11 (N₂O Emissions from Managed Soils).
6. Clean Energy Regulator (CER), *Beef cattle herd management method (closed)*. Available at: https://cer.gov.au/schemes/australian-carbon-credit-unit-scheme/accu-scheme-methods/beef-cattle-herd-management-method-closed
7. DCCEEW, *Beef cattle herd management method*. Available at: https://www.dcceew.gov.au/climate-change/emissions-reduction/accu-scheme/methods-closed/beef-cattle-herd-management
8. Australian Government, *Carbon Credits (Carbon Farming Initiative) Act 2011* and *Carbon Credits (Carbon Farming Initiative) Rule 2015*.
9. Clean Energy Regulator, *ACCU Scheme methods* (index). Available at: https://cer.gov.au/schemes/australian-carbon-credit-unit-scheme/accu-scheme-methods
10. Agricultural Innovation Australia (AIA), *AIA Environmental Accounting Platform (AIA EAP)*. Available at: https://aginnovationaustralia.com.au/ea-platform/ and https://www.aiaeap.com/
11. AIA, *AIA Environmental Accounting Platform — Final Report prepared for AMPC*. Available at: https://ampc.com.au/media/apsdcfxz/aia-environmental-accounting-platform-final-report-for-ampc.pdf
12. Repository under review: muhtashimfuad999-code, *carbon-project* (`index.html`), GitHub. Available at: https://github.com/muhtashimfuad999-code/carbon-project/blob/main/index.html

---

