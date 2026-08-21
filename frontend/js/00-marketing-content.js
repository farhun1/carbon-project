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

function renderMarketingAbout(industry){
  const c = INDUSTRY_CONTENT[industry].about;
  const el = document.querySelector(`section.view[data-view="${industry==='farm'?'about':'h-about'}"]`);
  if(!el) return;
  el.innerHTML = `
  <div class="sec-head"><span class="kicker">${c.kicker}</span><h2 class="h-lead">${c.h1}</h2><p class="sub">${c.sub}</p></div>
  <div class="impact ledger-rule">${c.impactStats.map(s=>`<div class="im"><b${s.id?` id="${s.id}"`:''}${s.gold?' class="ledger-underline" style="color:var(--gold)"':''}>${s.value}</b><span>${s.label}</span></div>`).join('')}</div>
  <div class="cards c3">${c.cards.map(card=>`<div class="tile"><h3>${card.title}</h3><p>${card.body}</p></div>`).join('')}</div>`;
}

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
