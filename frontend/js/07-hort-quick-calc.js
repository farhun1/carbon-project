function renderHMethods(){
  const el=document.getElementById('h-meth-factors'); if(!el) return;
  const F=HDATA.factors, stat={};
  F.forEach(f=>{stat[f.st]=(stat[f.st]||0)+1;});
  const SC={'Australian official':'#4e9d52','Australian official/derived':'#4e9d52','IPCC Tier 1':'#6BA644',
    'Australian/IPCC GWP basis':'#df9b26','Check reporting-year factor':'#df9b26','Proxy - replace':'#d14a3f'};
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
      <td style="text-align:center"><span class="prio" style="background:${cut>30?'#d14a3f':cut>12?'#df9b26':'#4e9d52'}">${cut>30?'High':cut>12?'Medium':'Low'}</span></td></tr>`}).join('');
  const totalCut=ranked.slice(0,6).reduce((s,r)=>{const a=ACT[r[0]]||['',10];return s+r[1]*parseFloat(a[1])/100;},0);
  document.getElementById('h-ai-content').innerHTML=`
   <div class="kpibar" style="grid-template-columns:repeat(4,1fr)">
     <div class="kpi"><div class="kl">Carbon intensity</div><div class="kv" style="color:${over?'#d14a3f':'#4e9d52'}">${f.ci.toFixed(3)}</div><div class="ks">target ${f.tgt.toFixed(2)} kg CO₂-e/kg</div></div>
     <div class="kpi"><div class="kl">Variance to target</div><div class="kv" style="color:${over?'#d14a3f':'#4e9d52'}">${gap>0?'+':''}${gap.toFixed(0)}%</div><div class="ks">${over?'action required':'on track'}</div></div>
     <div class="kpi"><div class="kl">Top emission driver</div><div class="kv" style="font-size:19px">${ranked[0][0]}</div><div class="ks">${ranked[0][1].toFixed(0)} t · ${(ranked[0][1]/f.gross*100).toFixed(0)}% of gross</div></div>
     <div class="kpi"><div class="kl">Reduction potential</div><div class="kv" style="color:#b8881e">${totalCut.toFixed(0)} t</div><div class="ks">across recommended actions</div></div>
   </div>
   <div class="panel"><h3>Why this grower ${over?'misses':'meets'} target</h3>
     <div class="ph">${f.name} · ${f.crop} · ${f.sys} · ${f.state} · ${f.area} ha</div>
     <p style="font-size:13px;color:var(--muted);margin:0 0 10px">${over
       ? `Intensity is <b style="color:#d14a3f">${gap.toFixed(0)}% above</b> the ${f.tgt.toFixed(2)} target. The dominant driver is <b>${ranked[0][0]}</b> (${(ranked[0][1]/f.gross*100).toFixed(0)}% of gross), followed by ${ranked[1][0]} and ${ranked[2][0]}.`
       : `Intensity is <b style="color:#4e9d52">${Math.abs(gap).toFixed(0)}% below</b> the ${f.tgt.toFixed(2)} target — this grower is a network benchmark. Largest remaining source is <b>${ranked[0][0]}</b>.`}</p>
   </div>
   <div class="panel" style="margin-top:16px"><h3>AI-recommended abatement</h3><div class="ph">Ranked by tonnes saved · ${f.name}</div>
     <table class="tbl"><tr><th>Source</th><th>Action</th><th style="text-align:center">Cut t/yr</th><th style="text-align:center">Reduction</th><th style="text-align:center">Payback</th><th style="text-align:center">Priority</th></tr>${rows}</table>
   </div>`;
}

/* ---- horticulture calculator ---- */
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
  const fmt=x=>Math.round(x).toLocaleString();
  $('h-input-result').innerHTML=`
   <div class="result">
     <div><div class="big">${fmt(net)}</div><div class="rl">t CO₂-e / year (net)</div></div>
     <div>
       <div class="rl"><b style="color:#fff">${$('hi-name').value}</b> · ${$('hi-state').value} · ${$('hi-crop').value} · ${$('hi-sys').value} · ${area} ha</div>
       <div class="rl" style="margin-top:6px">Gross <b style="color:#fff">${fmt(gross)} t</b> · Removals <b style="color:#e9c768">−${fmt(rem)} t</b> · Intensity <b style="color:#e9c768">${ci.toFixed(3)}</b> kg CO₂-e / kg sold</div>
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
     ${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="n" style="color:${r[2]<0?'#4e9d52':'#16201a'}">${r[2]<0?'−':''}${fmt(Math.abs(r[2]))}</td><td class="n">${gross>0?(Math.abs(r[2])/gross*100).toFixed(1):0}%</td></tr>`).join('')}
     <tr style="background:#faf9f8"><td><b>Net</b></td><td></td><td class="n"><b>${fmt(net)}</b></td><td class="n"></td></tr></table>
     <p style="font-size:11.5px;color:var(--muted);margin-top:10px"><b>Indicative estimate.</b> Of the 111 factors in the horticulture library, only 10 are Australian official — production replaces proxy factors with published NGER values before any formal reporting.</p>
   </div>`;
  $('h-input-result').scrollIntoView({behavior:'smooth',block:'center'});
}

boot();
buildNav();
