function renderHMethods(){
  const el=document.getElementById('h-meth-factors'); if(!el) return;
  const F=HDATA.factors, stat={};
  F.forEach(f=>{stat[f.st]=(stat[f.st]||0)+1;});
  const SC={'Australian official':'#5C8A4A','Australian official/derived':'#5C8A4A','IPCC Tier 1':'#5C8A4A',
    'Australian/IPCC GWP basis':'#D89A2E','Check reporting-year factor':'#D89A2E','Proxy - replace':'#C23333'};
  const tot=F.length;
  el.innerHTML=Object.entries(stat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>
    `<div class="hot"><div class="hn" style="width:200px">${k}</div><div class="bar"><i style="width:${v/tot*100}%;background:${SC[k]||'#5d6c61'}"></i></div><div class="hv">${v} · ${(v/tot*100).toFixed(0)}%</div></div>`).join('');
}

/* ---- horticulture AI ---- */
function renderHAIView(){
  if(!subscribed){document.getElementById('h-ai-gate').innerHTML=gateHTML('AI recommendations');document.getElementById('h-ai-body').style.display='none';return;}
  document.getElementById('h-ai-gate').innerHTML='';document.getElementById('h-ai-body').style.display='block';
  document.getElementById('haifarmsel').innerHTML=HFARMS.map(f=>`<option value="${f.id}">${f.name} · ${f.crop}</option>`).join('');
  renderHAI();
}
function renderHAI(){
  const f=HFARMS.find(x=>x.id===document.getElementById('haifarmsel').value)||HFARMS[0];
  const over=f.ci>f.tgt, gap=((f.ci-f.tgt)/f.tgt*100);
  const ranked=HSRC.map(s=>[s,f.src[s]||0]).sort((a,b)=>b[1]-a[1]);
  const ACT={'Packaging':['Switch to recycled/lighter packaging','30%','1.2 yr'],'Soil N₂O':['Precision nitrogen + soil testing','25%','1.6 yr'],
   'Electricity':['Solar PV + efficient cooling','40%','3.4 yr'],'Fuel':['Efficient machinery + route planning','20%','1.8 yr'],
   'Fertiliser (upstream)':['Optimise fertiliser rate & supplier','20%','1.4 yr'],'Transport':['Consolidate freight, reduce empty runs','20%','1.0 yr'],
   'Chemicals':['Integrated pest management','15%','2.0 yr'],'Planting materials':['Extend planting cycle / local nursery','12%','2.5 yr'],
   'Water':['Drip irrigation + soil moisture sensors','25%','2.2 yr'],'Waste':['Compost organic waste on-site','30%','1.1 yr'],
   'Lime & urea':['Switch to coated urea','15%','1.3 yr'],'Refrigeration':['Low-GWP refrigerant, leak detection','40%','2.8 yr']};
  const rows=ranked.slice(0,6).map(r=>{const a=ACT[r[0]]||['Review source','10%','2 yr'];
    const cut=r[1]*parseFloat(a[1])/100;
    return `<tr><td>${r[0]}</td><td>${a[0]}</td><td class="num">${cut.toFixed(0)}</td><td class="num">${a[1]}</td><td class="num">${a[2]}</td>
      <td style="text-align:center"><span class="prio" style="background:${cut>30?'#C23333':cut>12?'#D89A2E':'#5C8A4A'}">${cut>30?'High':cut>12?'Medium':'Low'}</span></td></tr>`}).join('');
  const totalCut=ranked.slice(0,6).reduce((s,r)=>{const a=ACT[r[0]]||['',10];return s+r[1]*parseFloat(a[1])/100;},0);
  document.getElementById('h-ai-content').innerHTML=`
   <div class="kpibar" style="grid-template-columns:repeat(4,1fr)">
     <div class="kpi"><div class="kl">Carbon intensity</div><div class="kv" style="color:${over?'#C23333':'#5C8A4A'}">${f.ci.toFixed(3)}</div><div class="ks">target ${f.tgt.toFixed(2)} kg CO₂-e/kg</div></div>
     <div class="kpi"><div class="kl">Variance to target</div><div class="kv" style="color:${over?'#C23333':'#5C8A4A'}">${gap>0?'+':''}${gap.toFixed(0)}%</div><div class="ks">${over?'action required':'on track'}</div></div>
     <div class="kpi"><div class="kl">Top emission driver</div><div class="kv" style="font-size:19px">${ranked[0][0]}</div><div class="ks">${ranked[0][1].toFixed(0)} t · ${(ranked[0][1]/f.gross*100).toFixed(0)}% of gross</div></div>
     <div class="kpi"><div class="kl">Reduction potential</div><div class="kv" style="color:#A87A2A">${totalCut.toFixed(0)} t</div><div class="ks">across recommended actions</div></div>
   </div>
   <div class="panel"><h3>Why this grower ${over?'misses':'meets'} target</h3>
     <div class="ph">${f.name} · ${f.crop} · ${f.sys} · ${f.state} · ${f.area} ha</div>
     <p style="font-size:13px;color:var(--muted);margin:0 0 10px">${over
       ? `Intensity is <b style="color:#C23333">${gap.toFixed(0)}% above</b> the ${f.tgt.toFixed(2)} target. The dominant driver is <b>${ranked[0][0]}</b> (${(ranked[0][1]/f.gross*100).toFixed(0)}% of gross), followed by ${ranked[1][0]} and ${ranked[2][0]}.`
       : `Intensity is <b style="color:#5C8A4A">${Math.abs(gap).toFixed(0)}% below</b> the ${f.tgt.toFixed(2)} target — this grower is a network benchmark. Largest remaining source is <b>${ranked[0][0]}</b>.`}</p>
   </div>
   <div class="panel" style="margin-top:16px"><h3>AI-recommended abatement</h3><div class="ph">Ranked by tonnes saved · ${f.name}</div>
     <table class="tbl"><tr><th>Source</th><th>Action</th><th style="text-align:center">Cut t/yr</th><th style="text-align:center">Reduction</th><th style="text-align:center">Payback</th><th style="text-align:center">Priority</th></tr>${rows}</table>
   </div>`;
}

/* ---- horticulture calculator ---- */
async function calcHort(){
  const $=id=>document.getElementById(id), n=id=>+($(id).value)||0;
  const diesel_i=n('hi-diesel'), elec_i=n('hi-elec'), n_i=n('hi-n'), plastic_i=n('hi-plastic'), card_i=n('hi-card'),
        freight_i=n('hi-freight'), water_i=n('hi-water'), chem_i=n('hi-chem'), rem_i=n('hi-rem'), yield_i=n('hi-yield'), area_i=n('hi-area');
  let r;
  try{
    const res = await fetch('/api/calc/hort/quick', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({diesel:diesel_i, elec:elec_i, n:n_i, plastic:plastic_i, card:card_i, freight:freight_i, water:water_i, chem:chem_i, rem:rem_i, yield:yield_i, area:area_i})
    });
    if(!res.ok) throw new Error('Calculation failed');
    r = await res.json();
  }catch(e){
    $('h-input-result').innerHTML='<p style="color:var(--muted);font-size:13px">Could not reach the calculation service — please try again.</p>';
    return;
  }
  const {diesel, elec, soilN, fertUp, pack, freight, water, chem, rem, gross, net, ci, s1, s2, s3, area} = r;
  const y = yield_i;
  const rows=[['Fuel (diesel)','Scope 1/3',diesel],['Soil N₂O','Scope 1',soilN],['Electricity','Scope 2',elec],
    ['Fertiliser (upstream)','Scope 3',fertUp],['Packaging','Scope 3',pack],['Transport / freight','Scope 3',freight],
    ['Water supply','Scope 3',water],['Chemicals','Scope 3',chem],['Removals (soil + biomass)','Removal',-rem]];
  const fmt=x=>Math.round(x).toLocaleString();
  $('h-input-result').innerHTML=`
   <div class="result">
     <div><div class="big">${fmt(net)}</div><div class="rl">t CO₂-e / year (net)</div></div>
     <div>
       <div class="rl"><b style="color:#fff">${$('hi-name').value}</b> · ${$('hi-state').value} · ${$('hi-crop').value} · ${$('hi-sys').value} · ${area} ha</div>
       <div class="rl" style="margin-top:6px">Gross <b style="color:#fff">${fmt(gross)} t</b> · Removals <b style="color:#D9A857">−${fmt(rem)} t</b> · Intensity <b style="color:#D9A857">${ci.toFixed(3)}</b> kg CO₂-e / kg sold</div>
       <div class="split">
         <div class="s">Scope 1 <b>${fmt(s1)} t</b></div><div class="s">Scope 2 <b>${fmt(s2)} t</b></div><div class="s">Scope 3 <b>${fmt(s3)} t</b></div>
         <div class="s">Per ha <b>${(gross/area).toFixed(1)} t</b></div>
       </div>
     </div>
   </div>
   <div class="bench">
     <div class="bc"><div class="bv">${ci.toFixed(3)}</div><div class="bl">kg CO₂-e / kg sold</div><div class="bref">network avg ≈ 0.48</div></div>
     <div class="bc"><div class="bv">${(gross/area).toFixed(1)}</div><div class="bl">t CO₂-e / ha</div><div class="bref">network avg ≈ 5.3</div></div>
     <div class="bc"><div class="bv">${Math.round(net/15).toLocaleString()}</div><div class="bl">≈ average Australians' footprint</div><div class="bref">~15 t / person / yr</div></div>
   </div>
   <div class="panel" style="margin-top:16px"><h3>Transparent data &amp; factors</h3>
     <div class="ph">12-source model · NGER / IPCC-aligned · indicative</div>
     <table class="factbl"><tr><th>Source</th><th>Scope</th><th class="n">t CO₂-e</th><th class="n">Share of gross</th></tr>
     ${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="n" style="color:${r[2]<0?'#5C8A4A':'#1B211C'}">${r[2]<0?'−':''}${fmt(Math.abs(r[2]))}</td><td class="n">${gross>0?(Math.abs(r[2])/gross*100).toFixed(1):0}%</td></tr>`).join('')}
     <tr style="background:#FAF8F2"><td><b>Net</b></td><td></td><td class="n"><b>${fmt(net)}</b></td><td class="n"></td></tr></table>
     <p style="font-size:11.5px;color:var(--muted);margin-top:10px"><b>Indicative estimate.</b> Of the 111 factors in the horticulture library, only 10 are Australian official — production replaces proxy factors with published NGER values before any formal reporting.</p>
   </div>`;
  $('h-input-result').scrollIntoView({behavior:'smooth',block:'center'});
}

boot();
buildNav();
