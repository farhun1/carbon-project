let regionFilter="All";
function renderDashView(){
  if(!subscribed){document.getElementById('dash-gate').innerHTML=gateHTML('The dashboard');document.getElementById('dash-body').style.display='none';return;}
  document.getElementById('dash-gate').innerHTML=""; document.getElementById('dash-body').style.display='block';
  const regions=["All",...new Set(FARMS.map(f=>f.region))];
  document.getElementById('regionchips').innerHTML=regions.map(r=>`<span class="chip ${r===regionFilter?'on':''}" onclick="setRegion('${r}')">${r}</span>`).join("");
  fillSelect(document.getElementById('farmsel'));
  renderDash();
  renderTransparency();
  setTimeout(initGisMap,150);
}
let _gis=null;
function initGisMap(){
  const el=document.getElementById('gismap'); if(!el) return;
  if(!window.L){ el.innerHTML='<div class="gis-fallback">Interactive map loads online (Leaflet + OpenStreetMap). On the hosted site it shows live farm &amp; paddock locations.</div>'; return; }
  if(_gis){ setTimeout(()=>_gis.invalidateSize(),200); return; }
  try{
    _gis=L.map(el,{scrollWheelZoom:false}).setView([-27.5,146],4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:12}).addTo(_gis);
    FARMS.forEach(f=>{const c=f.hot[0][1]>=30?'#C23333':(f.hot[0][1]>=20?'#D89A2E':'#5C8A4A');
      L.circleMarker([f.mx[0],f.mx[1]],{radius:9,color:'#fff',weight:2,fillColor:c,fillOpacity:0.9}).addTo(_gis)
       .bindPopup('<b>'+f.name+'</b><br>'+f.region+' · '+f.type+'<br>Net '+(f.net/1000).toFixed(2)+'k tCO₂-e/yr · NDVI '+f.ndvi.toFixed(2)+'<br>'+f.paddocks+' paddocks · '+f.accu+' ACCUs/yr');});
    setTimeout(()=>_gis.invalidateSize(),300);
  }catch(e){ el.innerHTML='<div class="gis-fallback">Map unavailable.</div>'; }
}
function renderTransparency(){
  const el=document.getElementById('data-transparency'); if(!el) return;
  const now=new Date().toLocaleTimeString();
  const srcs=[['IoT sensors','live'],['Farm-management system','live'],['Invoices &amp; meters','daily'],['Satellite / NDVI (GIS)','weekly'],['Manual entry','on submit']];
  el.innerHTML=`<div class="panel" style="margin-bottom:18px">
    <h3>Transparent &amp; automated data</h3><div class="ph">Every figure is traceable to a source and a factor · auto-synced</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
      ${srcs.map(s=>`<span class="chip">${s[0]} · <b style="color:var(--forest)">${s[1]}</b></span>`).join('')}
    </div>
    <div style="font-size:11.5px;color:var(--muted);margin-top:10px">Last sync ${now} · factors: NGER / IPCC Tier 2 · <b>indicative demo</b> — production applies audited factors and independent verification.</div>
  </div>`;
}

function setRegion(r){regionFilter=r;
  document.querySelectorAll('#regionchips .chip').forEach(c=>c.classList.toggle('on',c.textContent===r));
  const sel=document.getElementById('farmsel');
  const opts=FARMS.filter(f=>r==='All'||f.region===r);
  sel.innerHTML=opts.map(f=>`<option value="${f.id}">${f.name} · ${f.region}</option>`).join("");
  renderDash();
}
function renderDash(){
  const f=FARMS.find(x=>x.id===document.getElementById('farmsel').value)||FARMS[0];
  const sc=scopeAbs(f.gross,f.scopeR), act=monthly(f.net,f.real), tgt=target(act), rev=Math.round(f.accu*38).toLocaleString();
  const kpiAll=[["Gross emissions",(f.gross/1000).toFixed(2)+"k t","CO₂-e this year"],["Net emissions",(f.net/1000).toFixed(2)+"k t","after sequestration"],
    ["Carbon intensity",f.intensity,f.unit],["Net-zero progress",f.nz+"%","2040 target"],["Potential ACCUs",f.accu,"per year"],["Carbon revenue","$"+(f.accu*38/1000).toFixed(0)+"k","at $38/ACCU"]];
  const kpi=kpiAll.slice(0,4), kpiMore=kpiAll.slice(4);
  const scopeRows=[["Scope 1 — direct",sc.s1,0],["Scope 2 — energy",sc.s2,1],["Scope 3 — feed & transport",sc.s3,2]]
    .map(r=>`<div class="srow"><span class="sc" style="background:${SCOL[r[2]]}"></span><span class="sn">${r[0]}</span><span class="sv">${r[1].toLocaleString()}</span><span class="sp">${Math.round(r[1]/f.gross*100)}%</span></div>`).join("");
  const hot=f.hot.map(h=>`<div class="hot"><div class="hn">${h[0]}</div><div class="bar"><i style="width:${h[1]*2.2}%;background:${COL[h[2]]}"></i></div><div class="hv">${h[1]}%</div></div>`).join("");
  document.getElementById('dash-content').innerHTML=`
   <div class="note-banner"><b>${f.pilot?'Pilot dataset.':'Illustrative farm.'}</b> ${f.pilot?'Riverdale uses your supplied dataset (synthetic placeholders).':'Demo figures for network preview.'} · <span class="mono">${f.id}</span> · ${f.type} · ${f.head} head · ${f.area.toLocaleString()} ha</div>
   <div class="kpibar" style="grid-template-columns:repeat(4,1fr)">${kpi.map(k=>`<div class="kpi"><div class="kl">${k[0]}</div><div class="kv">${k[1]}</div><div class="ks">${k[2]}</div></div>`).join("")}</div>
   <details class="disclose"><summary>2 more figures — ACCU potential &amp; carbon revenue</summary>
     <div class="disclose-body kpibar" style="grid-template-columns:repeat(2,1fr);margin-top:12px">${kpiMore.map(k=>`<div class="kpi"><div class="kl">${k[0]}</div><div class="kv" style="color:#A87A2A">${k[1]}</div><div class="ks">${k[2]}</div></div>`).join("")}</div>
   </details>
   <div class="grid-d">
     <div class="panel"><h3>Monthly emissions</h3><div class="ph">Actual vs target · tCO₂-e</div>${lineChart([{v:act,c:'#123A26',w:3},{v:tgt,c:'#5C8A4A',dash:1}])}<div class="legend"><span><i style="background:#123A26"></i>Actual</span><span><i style="background:#5C8A4A"></i>Target</span></div></div>
     <div class="panel"><h3>Emissions by scope</h3><div class="ph">Gross CO₂-e split</div><div style="display:flex;gap:14px;align-items:center"><div>${donut(sc)}</div><div style="flex:1">${scopeRows}</div></div></div>
   </div>
   <div class="grid-d" style="grid-template-columns:1fr 1fr">
     <div class="panel"><h3>Emission hotspots</h3><div class="ph">Share of gross by source</div>${hot}</div>
     <div class="panel"><h3>Farm snapshot</h3><div class="ph">${f.name} · ${f.region}</div>
       <div style="display:flex;gap:18px;align-items:center">${ring(f.net,f.gross)}
       <div style="font-size:13px;color:var(--muted);line-height:1.9">
         <div><b style="color:var(--ink);font-family:var(--serif);font-size:15px">${f.ndvi.toFixed(2)}</b> avg NDVI · pasture health</div>
         <div><b style="color:var(--ink);font-family:var(--serif);font-size:15px">${f.paddocks}</b> paddocks monitored</div>
         <div><b style="color:var(--ink);font-family:var(--serif);font-size:15px">$${rev}</b> carbon revenue potential/yr</div>
         <div><b style="color:var(--ink);font-family:var(--serif);font-size:15px">${f.conf}%</b> AI forecast confidence</div>
       </div></div></div>
   </div>`;
}

/* =================== AI RECOMMENDATIONS =================== */
function renderAIView(){
  if(!subscribed){document.getElementById('ai-gate').innerHTML=gateHTML('AI recommendations');document.getElementById('ai-body').style.display='none';return;}
  document.getElementById('ai-gate').innerHTML="";document.getElementById('ai-body').style.display='block';
  fillSelect(document.getElementById('aifarmsel')); renderAI();
}
function renderAI(){
  const f=FARMS.find(x=>x.id===document.getElementById('aifarmsel').value)||FARMS[0];
  const act=monthly(f.net,f.real), pred=f.pred?f.pred.slice():act.map(v=>+(v*1.01).toFixed(1));
  const intvRows=f.intv.map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td style="text-align:center"><span class="prio" style="background:${COL[r[4]]}">${r[3]}</span></td></tr>`);
  const intv=intvRows.slice(0,5).join("");
  const intvMore=intvRows.slice(5).join("");
  const totalCut=f.intv.reduce((a,r)=>a+r[1],0);
  document.getElementById('ai-content').innerHTML=`
   <div class="kpibar" style="grid-template-columns:repeat(4,1fr)">
     <div class="kpi"><div class="kl">Forecast confidence</div><div class="kv">${f.conf}%</div><div class="ks">avg model confidence</div></div>
     <div class="kpi"><div class="kl">Anomaly days</div><div class="kv" style="color:#5C8A4A">0</div><div class="ks">all readings normal range</div></div>
     <div class="kpi"><div class="kl">Forecast horizon</div><div class="kv">30–60</div><div class="ks">days ahead</div></div>
     <div class="kpi"><div class="kl">Reduction potential</div><div class="kv" style="color:#A87A2A">${totalCut} t</div><div class="ks">across recommended actions</div></div>
   </div>
   <div class="grid-d">
     <div class="panel"><h3>Emission forecast</h3><div class="ph">Actual vs AI-predicted net · tCO₂-e · Prophet/LSTM</div>${lineChart([{v:act,c:'#123A26',w:3},{v:pred,c:'#A87A2A',dash:1}])}<div class="legend"><span><i style="background:#123A26"></i>Actual</span><span><i style="background:#A87A2A"></i>AI predicted</span></div></div>
     <div class="panel"><h3>Detection & root cause</h3><div class="ph">Isolation Forest · LSTM · SHAP</div>
       <div style="display:flex;gap:14px;align-items:center;margin-bottom:6px">${gauge(f.conf)}<div style="font-size:13px;color:var(--muted)">Model confidence on this farm's forecast</div></div>
       <div class="srow"><span class="sc" style="background:#5C8A4A"></span><span class="sn">Anomaly status</span><span class="sv" style="color:#5C8A4A;font-size:13px">Normal range</span></div>
       <div class="srow"><span class="sc" style="background:#D89A2E"></span><span class="sn">Top emission driver</span><span class="sv" style="font-size:13px">${f.hot[0][0]}</span></div>
       <div class="srow"><span class="sc" style="background:#5C8A4A"></span><span class="sn">NDVI / weather risk</span><span class="sv" style="font-size:13px">${f.ndvi<0.45?'Elevated':'Low'}</span></div>
     </div>
   </div>
   <div class="panel"><h3>AI-recommended interventions</h3><div class="ph">Ranked by impact · estimated cut & payback · ${f.name}</div>
     <table class="tbl"><tr><th>Action</th><th style="text-align:center">Cut t/yr</th><th style="text-align:center">Payback</th><th style="text-align:center">Priority</th></tr>${intv}</table>
     ${intvMore?`<details class="disclose"><summary>${f.intv.length-5} more interventions</summary><div class="disclose-body"><table class="tbl">${intvMore}</table></div></details>`:''}
   </div>`;
}

/* =================== CARBON CREDIT =================== */
function renderCreditView(){
  if(!subscribed){document.getElementById('credit-gate').innerHTML=gateHTML('Carbon credit opportunity');document.getElementById('credit-body').style.display='none';return;}
  document.getElementById('credit-gate').innerHTML="";document.getElementById('credit-body').style.display='block';
  fillSelect(document.getElementById('crfarmsel')); renderCredit();
}
function renderCredit(){
  const f=FARMS.find(x=>x.id===document.getElementById('crfarmsel').value)||FARMS[0];
  const maxCut=f.intv.reduce((a,r)=>a+r[1],0);
  document.getElementById('credit-content').innerHTML=`
   <div class="calc">
     <div class="panel">
       <h3>Reduction scenario</h3><div class="ph">Drag to model emissions reduction for ${f.name}</div>
       <div style="display:flex;justify-content:space-between;font-size:13px;margin:14px 0 6px"><span>Reduction</span><b id="cr-pct" style="font-family:var(--serif);font-size:18px">10%</b></div>
       <input type="range" id="cr-range" min="0" max="${Math.round(maxCut/f.net*100)}" value="10" oninput="updCredit()">
       <div style="font-size:11.5px;color:var(--muted);margin-top:6px">Max modelled here = ${maxCut} t/yr from the recommended intervention portfolio.</div>
       <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
         <div class="chip">Net now · <b style="color:var(--ink)">${f.net.toLocaleString()} t</b></div>
         <div class="chip">1 ACCU = <b style="color:var(--ink)">1 t CO₂-e</b></div>
         <div class="chip">ACCU price <b style="color:var(--ink)">$38</b></div>
       </div>
     </div>
     <div class="creditbox">
       <div style="font-size:12px;color:#9FB08C;letter-spacing:.1em">EST. ACCUs / YEAR</div>
       <div class="accu" id="cr-accu">217</div>
       <div class="rev" id="cr-rev">≈ $8,246 carbon revenue / year</div>
       <div class="meta" id="cr-meta">+ operational savings on fuel, feed & energy</div>
     </div>
   </div>
   <div class="sec-head" style="margin-top:30px"><span class="kicker">The economic loop</span><h3 class="h-lead" style="font-size:22px">Reductions → verified ACCUs → revenue</h3></div>
   <div class="steps" style="grid-template-columns:repeat(5,1fr)">
     ${[["Baseline","3-yr NGER baseline per head"],["Intervene","Apply AI-recommended action"],["Verify","Platform quantifies the reduction"],["Register","Submit project to the CER"],["Earn","ACCUs sold · paid to the farm"]].map((s,i)=>`<div class="step"><div class="num" style="background:${i===4?'#A87A2A':'#123A26'}">${i+1}</div><h3 style="font-size:13.5px">${s[0]}</h3><p style="font-size:11.5px">${s[1]}</p></div>`).join("")}
   </div>`;
  updCredit();
}
function updCredit(){
  const f=FARMS.find(x=>x.id===document.getElementById('crfarmsel').value)||FARMS[0];
  const pct=+document.getElementById('cr-range').value;
  const accu=Math.round(f.net*pct/100);
  document.getElementById('cr-pct').textContent=pct+'%';
  document.getElementById('cr-accu').textContent=accu.toLocaleString();
  document.getElementById('cr-rev').textContent='≈ $'+(accu*38).toLocaleString()+' carbon revenue / year';
}

/* =================== FARM DATA INPUT =================== */
async function calcInput(){
  const $=id=>document.getElementById(id);
  const head=+$('i-head').value||0, diesel=+$('i-diesel').value||0, elec=+$('i-elec').value||0,
        feed=+$('i-feed').value||0, fert=+$('i-fert').value||0, milk=+$('i-milk').value||0,
        trees=+$('i-trees').value||0, pasture=+$('i-pasture').value||0, cleared=+$('i-cleared').value||0,
        redpct=+$('i-redpct').value||0, type=$('i-type').value;
  let r;
  try{
    const res = await fetch('/api/calc/farm/quick', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({head,diesel,elec,feed,fert,milk,trees,pasture,cleared,redpct,type})
    });
    if(!res.ok) throw new Error('Calculation failed');
    r = await res.json();
  }catch(e){
    $('input-result').innerHTML='<p style="color:var(--muted);font-size:13px">Could not reach the calculation service — please try again.</p>';
    return;
  }
  const EF={enteric:{Dairy:3.1,Beef:2.0,Mixed:2.6,Feedlot:2.2}[type], manure:0.55, diesel:2.68, elec:0.66,
            feed:0.6, fert:5.5, treeSeq:6.0, pastSeq:0.5, clearing:120};
  const {enteric,manure,fuel,energy,feedE,fertE,transport,landUse,seq,gross,net,intensity,s1,s2,s3,perHead,perPerson,baseline,project,reduction,accus,revenue}=r;
  const perLitre=intensity;
  const rows=[
    ['Enteric CH₄', head+' head', EF.enteric+' t/head · IPCC T2', enteric],
    ['Manure CH₄/N₂O', head+' head', EF.manure+' t/head · IPCC', manure],
    ['Feed (embedded, Scope 3)', feed+' t', EF.feed+' t/t · LCA db', feedE],
    ['Energy (Scope 2)', elec.toLocaleString()+' kWh', EF.elec+' kg/kWh · NGER', energy],
    ['Fuel — diesel', diesel.toLocaleString()+' L', EF.diesel+' kg/L · NGER', fuel],
    ['Fertiliser N₂O', fert.toLocaleString()+' kg', EF.fert+' kg/kg · IPCC', fertE],
    ['Transport', '—', 'route estimate', transport],
    ['Land-use change (clearing)', cleared+' ha', EF.clearing+' t/ha · indic.', landUse],
    ['Sequestration (trees+pasture)', (trees+pasture)+' ha', '−'+EF.treeSeq+'/−'+EF.pastSeq+' t/ha · indic.', -seq],
  ];
  const fmt=x=>Math.round(x).toLocaleString();
  $('input-result').innerHTML=`
   <div class="result">
     <div><div class="big">${fmt(net)}</div><div class="rl">t CO₂-e / year (net)</div></div>
     <div>
       <div class="rl"><b style="color:#fff">${$('i-name').value}</b> · ${$('i-state').value} · ${type} · ${head} head</div>
       <div class="rl" style="margin-top:6px">Gross <b style="color:#fff">${fmt(gross)} t</b> · Sequestered <b style="color:#D9A857">−${fmt(seq)} t</b> · Intensity <b style="color:#D9A857">${intensity.toFixed(2)}</b> kg CO₂-e / L</div>
       <div class="split">
         <div class="s">Scope 1 <b>${fmt(s1)} t</b></div>
         <div class="s">Scope 2 <b>${fmt(s2)} t</b></div>
         <div class="s">Scope 3 <b>${fmt(s3)} t</b></div>
       </div>
     </div>
   </div>

   <div class="bench">
     <div class="bc"><div class="bv">${perHead.toFixed(1)}</div><div class="bl">t CO₂-e / head</div><div class="bref">industry ref ≈ 5–8</div></div>
     <div class="bc"><div class="bv">${perLitre.toFixed(2)}</div><div class="bl">kg CO₂-e / L milk (or /kg beef)</div><div class="bref">industry ref ≈ 1.0–1.4</div></div>
     <div class="bc"><div class="bv">${perPerson.toLocaleString()}</div><div class="bl">≈ average Australians' yearly footprint</div><div class="bref">~15 t CO₂-e / person / yr</div></div>
   </div>

   <div class="panel" style="margin-top:16px">
     <h3>Carbon credit potential — baseline − project</h3>
     <div class="ph">Planned reduction ${redpct}% · 1 ACCU = 1 t CO₂-e · $38/ACCU · 5% risk buffer</div>
     <div class="accueq">
       <span class="b">Baseline ${fmt(baseline)} t</span><span class="op">−</span>
       <span class="b">Project ${fmt(project)} t</span><span class="op">=</span>
       <span class="b">Reduction ${fmt(reduction)} t</span><span class="op">→</span>
       <span class="g">${accus.toLocaleString()} ACCUs</span><span class="op">≈</span>
       <span class="g">$${revenue.toLocaleString()}/yr</span>
     </div>
   </div>

   <div class="panel" style="margin-top:16px">
     <h3>Transparent data &amp; factors</h3><div class="ph">Every source is traceable to an activity and an NGER/IPCC-aligned factor · indicative</div>
     <table class="factbl"><tr><th>Source</th><th>Activity</th><th>Factor · basis</th><th class="n">t CO₂-e</th></tr>
       ${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="n" style="color:${r[3]<0?'#5C8A4A':'#1B211C'}">${r[3]<0?'−':''}${fmt(Math.abs(r[3]))}</td></tr>`).join('')}
       <tr style="background:#FAF8F2"><td><b>Net</b></td><td></td><td></td><td class="n"><b>${fmt(net)}</b></td></tr>
     </table>
   </div>

   <p class="sub" style="margin-top:14px"><b>Indicative estimate.</b> Uses NGER / IPCC-aligned factors including land &amp; vegetation. Real ACCUs require a project registered under an approved Clean Energy Regulator method, an approved baseline, and independent verification. <button class="btn-ghost" style="padding:8px 14px;border-radius:9px;border:1.5px solid var(--hair)" onclick="go('methods')">See methods &amp; standards</button> <button class="btn-ghost" style="padding:8px 14px;border-radius:9px;border:1.5px solid var(--hair)" onclick="openModal()">Connect this farm</button></p>`;
  $('input-result').scrollIntoView({behavior:'smooth',block:'center'});
}

