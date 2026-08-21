function renderHDashView(){
  if(!subscribed){document.getElementById('h-gate').innerHTML=gateHTML('The horticulture dashboard');document.getElementById('h-body').style.display='none';return;}
  document.getElementById('h-gate').innerHTML='';document.getElementById('h-body').style.display='block';
  document.getElementById('hnav').innerHTML=HPAGES.map((p,i)=>
    `<button class="${p[0]===hPage?'on':''}" onclick="setHPage('${p[0]}')"><i>0${i+1}</i>${p[1]}</button>`).join('');
  if(!document.getElementById('fFrom').options.length) hInitFilters();
  renderHDash(); setTimeout(initHGis,150);
}
function setHPage(p){hPage=p;
  document.querySelectorAll('#hnav button').forEach((b,i)=>b.classList.toggle('on',HPAGES[i][0]===p));
  renderHDash();}

/* ---- GIS ---- */
const HGEO={'Riverina Tomatoes':[-34.74,146.03],'Central West Apples':[-33.42,148.98],'Yarra Strawberries':[-37.65,145.45],
 'Sunshine Avocados':[-26.65,152.95],'Mareeba Mangoes':[-17.00,145.43],'Barossa Grapes':[-34.53,138.95],
 'Swan Potatoes':[-31.78,116.02],'Huon Cherries':[-43.03,147.06],'Gippsland Lettuce':[-38.10,146.27],
 'Coffs Blueberries':[-30.30,153.11],'Riverland Almonds':[-34.28,140.60],'Manjimup Carrots':[-34.24,116.15]};
let _hgis=null;
function initHGis(){
  const el=document.getElementById('hgismap'); if(!el) return;
  if(!window.L){el.innerHTML='<div class="gis-fallback">Interactive map loads online (Leaflet + OpenStreetMap).</div>';return;}
  if(_hgis){setTimeout(()=>_hgis.invalidateSize(),200);return;}
  try{
    _hgis=L.map(el,{scrollWheelZoom:false}).setView([-28,134],4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:12}).addTo(_hgis);
    const byFarm={};HDATA.rows.forEach(r=>{(byFarm[r.farm]=byFarm[r.farm]||[]).push(r);});
    Object.entries(byFarm).forEach(([farm,rs])=>{const c=HGEO[farm]; if(!c) return;
      const s=hSum(rs), over=s.ci>s.tgt, col=over?'#A8352B':'#4C7A4A';
      L.circleMarker(c,{radius:8,color:'#fff',weight:2,fillColor:col,fillOpacity:.9}).addTo(_hgis)
        .bindPopup(`<b>${farm}</b><br>${rs[0].crop} · ${rs[0].sys} · ${rs[0].st}<br>Gross ${hf(T(s.g))} t · Net ${hf(T(s.n))} t<br>Intensity ${s.ci.toFixed(3)} (target ${s.tgt.toFixed(2)})<br><b style="color:${col}">${over?'OVER TARGET':'UNDER TARGET'}</b>`);});
    setTimeout(()=>_hgis.invalidateSize(),300);
  }catch(e){el.innerHTML='<div class="gis-fallback">Map unavailable.</div>';}
}

/* ---- per-farm aggregate ---- */
function hFarms(rows){
  return [...new Map(rows.map(r=>[r.fid,r])).keys()].map(fid=>{
    const rs=rows.filter(r=>r.fid===fid), s=hSum(rs);
    const net=T(s.n), inten=s.ci, tgt=s.tgt;
    return {fid,farm:rs[0].farm,st:rs[0].st,crop:rs[0].crop,sys:rs[0].sys,ha:rs[0].ha,pri:rs[0].pri,
      g:T(s.g),net,rmt:T(s.rm),perha:rs[0].ha?T(s.g)/rs[0].ha:0,inten,tgt,
      vari:tgt?(inten/tgt-1):0, yld:s.yld, src:s.src, kwh:s.kwh, dsl:s.dsl, kl:s.kl, nkg:s.nkg};});
}
/* ---- sortable ledger state ---- */
let hSortKey='net', hSortDir=-1;
window.hSort=function(k){ if(hSortKey===k) hSortDir*=-1; else {hSortKey=k; hSortDir=(k==='farm')?1:-1;} renderHDash(); };

/* ---- MAIN ---- */
function renderHDash(){
  const rows=hRows(), s=hSum(rows), el=document.getElementById('h-dash-content');
  const months=[...new Set(rows.map(r=>r.m))].sort();
  const fa=hFarms(rows);
  const cov=document.getElementById('hcover');
  if(cov) cov.innerHTML=`${fa.length} farm${fa.length===1?'':'s'} · ${rows.length} monthly records`;
  if(!rows.length){el.innerHTML='<div class="hnote">No rows match these filters.</div>';return;}
  const g=s.g,pct=v=>g?Math.round(v/g*100):0;
  const hi=fa.filter(f=>f.pri==='High').length;
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
  const srcT=SN.map((n,i)=>[n,T(s.src[i]),HSCOL[i]]).sort((a,b)=>b[1]-a[1]);
  let b='', post=[];

  if(hPage==='overview'){
    const mb=hMonthly(rows,months);
    const bs=hByScope(rows);
    const gauge=hGauge(s.ci,s.tgt);
    // sortable ledger
    const key={farm:f=>f.farm,net:f=>f.net,rm:f=>f.rmt,perha:f=>f.perha,vari:f=>f.vari}[hSortKey]||(f=>f.net);
    const sorted=fa.slice().sort((a,b)=>{const x=key(a),y=key(b);return (typeof x==='string'?x.localeCompare(y):x-y)*hSortDir;});
    const scale=Math.max(...fa.map(f=>Math.max(f.inten,f.tgt)),0.001)*1.12;
    const car=k=>hSortKey===k?(hSortDir<0?'▼':'▲'):'▾';
    const led=sorted.map(f=>{const gs=f.src.reduce((a,b)=>a+b,0)||1, over=f.vari>0;
      return `<tr>
        <td class="t"><b>${f.farm}</b><div style="font-size:10px;color:#6E7569">${f.st} · ${f.crop} · ${f.ha} ha</div></td>
        <td><div class="mixbar" data-fid="${f.fid}">${f.src.map((v,i)=>`<span style="width:${v/gs*100}%;background:${HSCOL[i]}"></span>`).join('')}</div></td>
        <td>${hf(f.net)}</td>
        <td style="color:#3C6140">${f.rmt>0.05?'−'+hf(f.rmt):'—'}</td>
        <td>${f.perha.toFixed(1)}</td>
        <td><div class="lgauge"><div class="lg-f" style="width:${Math.min(100,f.inten/scale*100)}%;background:${over?'#A8352B':'#4C7A4A'}"></div><div class="lg-t" style="left:${Math.min(100,f.tgt/scale*100)}%"></div></div></td>
        <td><span class="flag" style="background:${over?'#A8352B':'#4C7A4A'}">${over?'+':''}${(f.vari*100).toFixed(0)}%</span></td></tr>`;}).join('');
    b=`${kpis}
    <div class="hgrid2">
      <div class="hpanel"><h3>Monthly balance <span style="font-weight:400;text-transform:none;letter-spacing:0">· emissions above the line, removals below</span></h3>${mb.svg}
        <div style="display:flex;gap:12px;margin-top:6px;flex-wrap:wrap">
          <span style="font-size:10px;color:#6E7569"><i style="display:inline-block;width:9px;height:9px;background:#8C3B1E;margin-right:4px"></i>Scope 1</span>
          <span style="font-size:10px;color:#6E7569"><i style="display:inline-block;width:9px;height:9px;background:#2E6F7E;margin-right:4px"></i>Scope 2</span>
          <span style="font-size:10px;color:#6E7569"><i style="display:inline-block;width:9px;height:9px;background:#B08429;margin-right:4px"></i>Scope 3</span>
          <span style="font-size:10px;color:#6E7569"><i style="display:inline-block;width:9px;height:9px;background:#3C6140;margin-right:4px"></i>Removals</span></div></div>
      <div class="hpanel"><h3>Intensity vs target <span style="font-weight:400;text-transform:none;letter-spacing:0">· yield-weighted</span></h3>${gauge}
        <div style="margin-top:10px"><h3 style="border:none;padding:0;margin:0 0 6px">Scope split</h3>${hRibbon(s.s1,s.s2,s.s3)}</div></div>
    </div>
    <div class="hpanel"><h3>Emissions by scope and <span style="text-transform:lowercase">${hGroup==='st'?'state':hGroup==='crop'?'crop':'system'}</span>
      <span style="float:right;font-weight:400"><button class="grpbtn ${hGroup==='st'?'on':''}" onclick="hSetGroup('st')">State</button>
      <button class="grpbtn ${hGroup==='crop'?'on':''}" onclick="hSetGroup('crop')">Crop</button>
      <button class="grpbtn ${hGroup==='sys'?'on':''}" onclick="hSetGroup('sys')">System</button></span></h3>${bs.svg}</div>
    <div class="hpanel"><h3>Farm ledger <span style="font-weight:400;text-transform:none;letter-spacing:0">· click a column head to sort</span></h3>
      <table class="hl"><tr>
        <th class="srt" onclick="hSort('farm')">Farm <span style="opacity:.5">${car('farm')}</span></th>
        <th>Source mix</th>
        <th class="srt" onclick="hSort('net')">Net t <span style="opacity:.5">${car('net')}</span></th>
        <th class="srt" onclick="hSort('rm')">Removals t <span style="opacity:.5">${car('rm')}</span></th>
        <th class="srt" onclick="hSort('perha')">t / ha <span style="opacity:.5">${car('perha')}</span></th>
        <th>Intensity vs target</th>
        <th class="srt" onclick="hSort('vari')">Variance <span style="opacity:.5">${car('vari')}</span></th></tr>${led}</table></div>`;
    post.push(()=>{
      document.querySelectorAll('#h-dash-content .mixbar[data-fid]').forEach(elx=>{
        const f=fa.find(x=>x.fid===elx.dataset.fid); if(!f)return;
        const gs=f.src.reduce((a,b)=>a+b,0)||1;
        const top=f.src.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]).slice(0,3).map(([v,i])=>`${SN[i]} ${Math.round(v/gs*100)}%`).join('<br>');
        bind(elx,`<b>${f.farm} · top sources</b><br>${top}`);});
      document.querySelectorAll('#h-dash-content .mb').forEach(elx=>{
        const d=mb.m[+elx.dataset.i], k=elx.dataset.k;
        const nm={s1:'Scope 1',s2:'Scope 2',s3:'Scope 3',rm:'Removals'}[k];
        bind(elx,`<b>${d.mo}</b><br>${nm}: ${hf(d[k],1)} t<br>Gross ${hf(d.g)} t · Net ${hf(d.n)} t`);});
      document.querySelectorAll('#h-dash-content .bs').forEach(elx=>{
        const d=bs.items[+elx.dataset.i], k=elx.dataset.k;
        bind(elx,`<b>${d.k}</b><br>Scope ${k[1]}: ${hf(T(d[k]))} t<br>Gross ${hf(T(d.tot))} t`);});
      document.querySelectorAll('#hribbon div').forEach((elx,i)=>{
        const P=[['Scope 1',s.s1,'Fuel, soil N₂O, lime &amp; urea, refrigerant'],['Scope 2',s.s2,'Purchased grid electricity'],['Scope 3',s.s3,'Fertiliser, packaging, freight, chemicals, water, seedlings']][i];
        bind(elx,`<b>${P[0]}</b><br>${hf(T(P[1]))} t · ${(P[1]/g*100).toFixed(0)}%<br>${P[2]}`);});
    });
  }

  else if(hPage==='sources'){
    const tm=hTreemap(rows);
    const top3=srcT.slice(0,3);
    const mat=fa.map(f=>{const vals=SN.map((_,i)=>T(f.src[i])), mx=Math.max(...vals,1);
      return `<tr><td>${f.farm}</td>${vals.map(v=>`<td style="background:rgba(176,132,41,${(v/mx*0.55).toFixed(2)})">${hf(v)}</td>`).join('')}</tr>`;}).join('');
    b=`${kpis}
    <div class="hgrid2">
      <div class="hpanel"><h3>Total emissions by source <span style="font-weight:400;text-transform:none;letter-spacing:0">· area = share</span></h3>${tm.svg}</div>
      <div class="hpanel"><h3>Where it comes from · gross t CO₂-e</h3>
        ${srcT.map(x=>`<div class="hbar"><div class="n">${x[0]}</div><div class="tr"><i style="width:${x[1]/srcT[0][1]*100}%;background:${x[2]}"></i></div><div class="v">${hf(x[1])} · ${(x[1]/T(g)*100).toFixed(1)}%</div></div>`).join('')}
        <div class="hnote" style="margin-top:10px">Top three sources — ${top3.map(x=>x[0]).join(', ')} — carry <b>${(top3.reduce((a,x)=>a+x[1],0)/T(g)*100).toFixed(0)}%</b> of gross emissions in this selection.</div></div>
    </div>
    <div class="hpanel"><h3>Monthly emission-source trend · stacked by source</h3>${svgStack(rows,months)}
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px">${SN.map((n,i)=>`<span style="font-size:10px;color:#6E7569"><i style="display:inline-block;width:9px;height:9px;background:${HSCOL[i]};margin-right:4px"></i>${n}</span>`).join('')}</div></div>
    <div class="hpanel"><h3>Farm × source matrix · t CO₂-e · shaded within each row</h3>
      <div style="overflow-x:auto"><table class="matrix"><tr><th>Farm</th>${SN.map(n=>`<th>${n}</th>`).join('')}</tr>${mat}</table></div></div>`;
    post.push(()=>{document.querySelectorAll('#h-dash-content .tm').forEach(elx=>{
      const d=tm.items.find(x=>x.i===+elx.dataset.i); if(!d)return;
      bind(elx,`<b>${d.n}</b><br>${hf(d.v)} t CO₂-e<br>${(d.v/tm.total*100).toFixed(1)}% of gross`);});});
  }

  else if(hPage==='bench'){
    const SYSC={'Protected Cropping':'#6D5A8C','Orchard':'#3C6140','Open Field':'#C05A2C','Vineyard':'#B08429'};
    const pts=fa.map(f=>({x:f.g,y:f.inten,r:4+Math.sqrt(f.yld)/260,c:SYSC[f.sys]||'#6E7569',f}));
    const worst=fa.slice().sort((a,b)=>b.vari-a.vari)[0];
    const wsrc=worst?SN.map((n,i)=>[n,T(worst.src[i]),HSCOL[i]]).sort((a,b)=>b[1]-a[1]).slice(0,6):[];
    const bm=fa.slice().sort((a,b)=>b.vari-a.vari).map(f=>{
      const pri=f.vari>0.15?'High':f.vari>0?'Medium':'Low';
      return `<tr><td class="t">${f.farm}</td><td class="t">${f.crop}</td><td class="t">${f.sys}</td><td>${f.st}</td>
        <td>${hf(f.g)}</td><td>${f.inten.toFixed(3)}</td><td>${f.tgt.toFixed(3)}</td>
        <td style="color:${f.vari>0?'#A8352B':'#4C7A4A'}">${f.vari>0?'+':''}${(f.vari*100).toFixed(0)}%</td>
        <td><span class="flag" style="background:${pri==='High'?'#A8352B':pri==='Medium'?'#C08A2E':'#4C7A4A'}">${pri}</span></td></tr>`;}).join('');
    b=`${kpis}
    <div class="hgrid2">
      <div class="hpanel"><h3>Intensity vs total footprint <span style="font-weight:400;text-transform:none;letter-spacing:0">· bubble = yield · colour = system</span></h3>${svgScatter(pts,{xlab:'Gross emissions (t CO₂-e) →',ydec:2})}
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px">${Object.entries(SYSC).map(([k,v])=>`<span style="font-size:10px;color:#6E7569"><i style="display:inline-block;width:9px;height:9px;background:${v};margin-right:4px"></i>${k}</span>`).join('')}</div></div>
      <div class="hpanel"><h3>Why this farm misses target${worst?' · '+worst.farm:''}</h3>
        ${worst?`<div class="hnote" style="margin-bottom:10px">${worst.farm} runs <b>${(worst.vari*100).toFixed(0)}%</b> ${worst.vari>0?'over':'under'} its ${worst.tgt.toFixed(3)} target. Dominant sources below — fix these first.</div>${svgBars(wsrc,{lw:130})}`:''}</div>
    </div>
    <div class="hpanel"><h3>Benchmark matrix <span style="font-weight:400;text-transform:none;letter-spacing:0">· &gt;15% over = High, &gt;0% = Medium</span></h3>
      <table class="hl"><tr><th>Farm</th><th>Crop</th><th>System</th><th>State</th><th>Gross t</th><th>Intensity</th><th>Target</th><th>Variance</th><th>Priority</th></tr>${bm}</table></div>`;
    post.push(()=>{document.querySelectorAll('#h-dash-content .sc').forEach(elx=>{
      const p=pts[+elx.dataset.i]; if(!p)return;
      bind(elx,`<b>${p.f.farm}</b><br>${p.f.crop} · ${p.f.sys}<br>Gross ${hf(p.f.g)} t<br>Intensity ${p.f.inten.toFixed(3)} (target ${p.f.tgt.toFixed(3)})<br>Yield ${hf(p.f.yld/1000)} t`);});});
  }

  else if(hPage==='resource'){
    const rk=`<div class="hkpis" style="grid-template-columns:repeat(5,1fr)">
      <div class="hkpi"><div class="l">Electricity</div><div class="v">${hf(s.kwh/1000)}</div><div class="d">MWh purchased</div></div>
      <div class="hkpi"><div class="l">Diesel</div><div class="v">${hf(s.dsl/1000,1)}</div><div class="d">kilolitres</div></div>
      <div class="hkpi"><div class="l">Water</div><div class="v">${hf(s.kl/1000)}</div><div class="d">megalitres</div></div>
      <div class="hkpi"><div class="l">Water intensity</div><div class="v">${(s.yld?s.kl*1000/s.yld:0).toFixed(1)}</div><div class="d">L / kg sold</div></div>
      <div class="hkpi accent"><div class="l">Packaging intensity</div><div class="v">${(s.yld?s.src[6]/s.yld*1000:0).toFixed(0)}</div><div class="d">g CO₂-e / kg sold</div></div>
    </div>`;
    const crop={};rows.forEach(r=>{crop[r.crop]=crop[r.crop]||{kl:0,yld:0};crop[r.crop].kl+=r.kl;crop[r.crop].yld+=r.yld;});
    const wi=Object.entries(crop).map(([k,v])=>[k,v.yld?v.kl*1000/v.yld:0,'#4E8FA8']).sort((a,b)=>b[1]-a[1]);
    const idxM=months.map(m=>{const rs=rows.filter(r=>r.m===m);return {y:rs.reduce((a,r)=>a+r.yld,0),n:rs.reduce((a,r)=>a+r.n,0)};});
    const y0=idxM[0].y||1,n0=idxM[0].n||1;
    b=`${rk}
    <div class="hgrid2">
      <div class="hpanel"><h3>Electricity use by farm · MWh purchased from grid</h3>${svgBars(fa.slice().sort((a,b)=>b.kwh-a.kwh).map(f=>[f.farm,f.kwh/1000,'#2E6F7E']),{lw:130})}</div>
      <div class="hpanel"><h3>Diesel use by farm · kilolitres</h3>${svgBars(fa.slice().sort((a,b)=>b.dsl-a.dsl).map(f=>[f.farm,f.dsl/1000,'#8C3B1E']),{lw:130,dec:1})}</div>
    </div>
    <div class="hgrid2">
      <div class="hpanel"><h3>Packaging intensity by farm · g CO₂-e / kg sold</h3>${svgBars(fa.slice().sort((a,b)=>(b.src[6]/b.yld)-(a.src[6]/a.yld)).map(f=>[f.farm,f.yld?f.src[6]/f.yld*1000:0,'#B08429']),{lw:130})}</div>
      <div class="hpanel"><h3>Water intensity by crop · litres per kg</h3>${svgBars(wi,{lw:100,dec:1})}</div>
    </div>
    <div class="hpanel"><h3>Yield and net emissions over time <span style="font-weight:400;text-transform:none;letter-spacing:0">· indexed, first month = 100</span></h3>
      ${svgLine([{v:idxM.map(x=>x.y/y0*100),c:'#3C6140',w:2.2},{v:idxM.map(x=>x.n/n0*100),c:'#8C3B1E',w:2.2}],{labels:months.map(m=>m.slice(5))})}
      <div style="display:flex;gap:14px;margin-top:6px"><span style="font-size:10px;color:#6E7569"><i style="display:inline-block;width:12px;height:3px;background:#3C6140;margin-right:4px"></i>Yield</span>
      <span style="font-size:10px;color:#6E7569"><i style="display:inline-block;width:12px;height:3px;background:#8C3B1E;margin-right:4px"></i>Net emissions</span></div>
      <div class="hnote" style="margin-top:10px">If emissions rise faster than yield, intensity is getting worse even when the farm looks busier.</div></div>`;
  }

  else if(hPage==='confidence'){
    const F=HDATA.factors;
    const SRCSTAT=[['Fuel','Australian official'],['Electricity','Australian official'],['Soil N₂O','IPCC Tier 1'],
      ['Fertiliser (upstream)','Proxy - replace'],['Lime & urea','Australian official'],['Chemicals','Proxy - replace'],
      ['Packaging','Proxy - replace'],['Transport','Proxy - replace'],['Waste','IPCC Tier 1'],
      ['Refrigeration','Australian/IPCC GWP basis'],['Water','Proxy - replace'],['Planting material','Proxy - replace']];
    const SC={'Australian official':'#4C7A4A','IPCC Tier 1':'#6E9A5E','Australian/IPCC GWP basis':'#C08A2E','Proxy - replace':'#A8352B'};
    const byStat={};
    SRCSTAT.forEach(([sn,st])=>{const i=SN.indexOf(sn); const v=i>=0?T(s.src[i]):0; byStat[st]=(byStat[st]||0)+v;});
    const bs=Object.entries(byStat).map(([k,v])=>[k,v,SC[k]]).sort((a,b)=>b[1]-a[1]);
    const proxy=byStat['Proxy - replace']||0, defensible=T(g)-proxy;
    const repl=SRCSTAT.filter(x=>x[1]==='Proxy - replace').map(([sn])=>{const i=SN.indexOf(sn);return [sn,i>=0?T(s.src[i]):0,'#A8352B'];}).sort((a,b)=>b[1]-a[1]);
    b=`<div class="hkpis" style="grid-template-columns:repeat(4,1fr)">
      <div class="hkpi"><div class="l">Factors in library</div><div class="v">${F.length}</div><div class="d">total</div></div>
      <div class="hkpi"><div class="l">Australian official</div><div class="v" style="color:#4C7A4A">${F.filter(f=>f.st.startsWith('Australian official')).length}</div><div class="d">highest confidence</div></div>
      <div class="hkpi"><div class="l">Proxies to replace</div><div class="v" style="color:#A8352B">${F.filter(f=>f.st==='Proxy - replace').length}</div><div class="d">of ${F.length} · 60%</div></div>
      <div class="hkpi accent"><div class="l">Tonnes on a proxy</div><div class="v">${hf(proxy)}</div><div class="d">t CO₂-e · ${(T(g)?proxy/T(g)*100:0).toFixed(0)}% of gross</div></div>
    </div>
    <div class="hnote"><b>How much of this number can you defend?</b> ${hf(defensible)} t rests on official or IPCC factors. <b>${hf(proxy)} t (${(T(g)?proxy/T(g)*100:0).toFixed(0)}%)</b> rides on a proxy and should be replaced before you put this number in front of a retailer or an auditor.</div>
    <div class="hgrid2">
      <div class="hpanel"><h3>Gross t CO₂-e by factor provenance</h3>${svgBars(bs,{lw:170})}</div>
      <div class="hpanel"><h3>Replace these first · tonnes riding on a proxy</h3>${svgBars(repl,{lw:150})}
        <div class="hnote" style="margin-top:10px">Packaging is both the <b>largest source</b> and a <b>proxy factor</b> — replacing that one factor is the highest-value data fix on the platform.</div></div>
    </div>`;
  }

  else if(hPage==='abate'){
    const lv=HLEV.map((l,i)=>({...l,i,sav:T(rows.reduce((a,r)=>a+l.f(r,l.val/100),0))}));
    const totSav=lv.reduce((a,l)=>a+l.sav,0);
    const base=T(s.n), now=Math.max(0,base-totSav);
    const ciNow=s.yld?(T(g)-totSav)*1000/s.yld:0;
    b=`<div class="hkpis" style="grid-template-columns:repeat(5,1fr)">
      <div class="hkpi"><div class="l">Baseline net</div><div class="v">${hf(base)}</div><div class="d">t CO₂-e</div></div>
      <div class="hkpi"><div class="l">Modelled saving</div><div class="v" style="color:#3C6140">${hf(totSav)}</div><div class="d">t CO₂-e / yr</div></div>
      <div class="hkpi accent"><div class="l">Modelled net</div><div class="v">${hf(now)}</div><div class="d">t CO₂-e · after the levers</div></div>
      <div class="hkpi"><div class="l">Intensity after</div><div class="v" style="color:${ciNow<=s.tgt?'#4C7A4A':'#A8352B'}">${ciNow.toFixed(3)}</div><div class="d">target ${s.tgt.toFixed(3)}</div></div>
      <div class="hkpi"><div class="l">Reduction</div><div class="v">${(base?totSav/base*100:0).toFixed(0)}%</div><div class="d">of net</div></div>
    </div>
    <div class="hgrid2">
      <div class="hpanel"><h3>Pull the levers <span style="font-weight:400;text-transform:none;letter-spacing:0">· applies to the current filter selection</span></h3>
        ${HLEV.map((l,i)=>`<div class="sl"><div class="sl-top"><span>${l.n}</span><span class="sl-v" id="hlv${i}">${l.val}${l.u}</span></div>
          <input type="range" min="0" max="${l.max}" step="5" value="${l.val}" oninput="hSetLever(${i},this.value)">
          <div class="sl-d">${l.d}</div></div>`).join('')}
        <button class="rst2" onclick="hResetLevers()">Reset levers</button></div>
      <div class="hpanel"><h3>Where the saving comes from · t CO₂-e avoided per year</h3>
        ${totSav>0?svgBars(lv.filter(l=>l.sav>0).sort((a,b)=>b.sav-a.sav).map(l=>[l.n,l.sav,'#3C6140']),{lw:180}):'<p style="font-size:12px;color:#6E7569;text-align:center;padding:24px 0">Move a lever to see the saving.</p>'}
        <div style="margin-top:10px"><h3 style="border:none;padding:0;margin:0 0 6px">Intensity after abatement</h3>${hGauge(ciNow,s.tgt)}</div>
        <div class="hnote">${totSav>0?`These levers avoid <b>${hf(totSav)} t CO₂-e</b> a year — ${(base?totSav/base*100:0).toFixed(0)}% of net. Savings inherit the proxy uncertainty flagged on page 05.`:'Savings are modelled on the same factors as the baseline.'}</div></div>
    </div>
    <div class="hpanel"><h3>Farm-by-farm outcome <span style="font-weight:400;text-transform:none;letter-spacing:0">· who clears their target once the levers are pulled</span></h3>
      <table class="hl"><tr><th>Farm</th><th>Intensity now</th><th>After levers</th><th>Target</th><th>Saved t</th><th>Outcome</th></tr>
      ${fa.map(f=>{const rs=rows.filter(r=>r.fid===f.fid);
        const sav=HLEV.reduce((a,l)=>a+rs.reduce((x,r)=>x+l.f(r,l.val/100),0),0);
        const ng=f.g-T(sav), nci=f.yld?ng*1000/f.yld:0;
        return `<tr><td class="t">${f.farm}</td><td>${f.inten.toFixed(3)}</td><td>${nci.toFixed(3)}</td><td>${f.tgt.toFixed(3)}</td><td>${hf(T(sav))}</td>
          <td><span class="flag" style="background:${nci<=f.tgt?'#4C7A4A':'#A8352B'}">${nci<=f.tgt?'CLEARS':'STILL OVER'}</span></td></tr>`;}).join('')}
      </table></div>`;
  }

  else if(hPage==='factors'){
    const F=HDATA.factors, grp={},stat={};
    F.forEach(f=>{grp[f.grp]=(grp[f.grp]||0)+1;stat[f.st]=(stat[f.st]||0)+1;});
    const SC={'Australian official':'#4C7A4A','Australian official/derived':'#4C7A4A','IPCC Tier 1':'#6E9A5E',
      'Australian/IPCC GWP basis':'#C08A2E','Check reporting-year factor':'#C08A2E','Proxy - replace':'#A8352B'};
    const gb=Object.entries(grp).map(([k,v])=>[k,v,'#B08429']).sort((a,b)=>b[1]-a[1]);
    const sb=Object.entries(stat).map(([k,v])=>[k,v,SC[k]||'#6E7569']).sort((a,b)=>b[1]-a[1]);
    b=`<div class="hkpis" style="grid-template-columns:repeat(4,1fr)">
      <div class="hkpi"><div class="l">Total factors</div><div class="v">${F.length}</div><div class="d">in library</div></div>
      <div class="hkpi"><div class="l">Scope 3 factors</div><div class="v">${F.filter(f=>f.sc===3).length}</div><div class="d">upstream</div></div>
      <div class="hkpi"><div class="l">Australian official</div><div class="v" style="color:#4C7A4A">${F.filter(f=>f.st.startsWith('Australian official')).length}</div><div class="d">highest confidence</div></div>
      <div class="hkpi accent"><div class="l">Proxies</div><div class="v">${F.filter(f=>f.st==='Proxy - replace').length}</div><div class="d">replace before reporting</div></div>
    </div>
    <div class="hgrid2">
      <div class="hpanel"><h3>Factors by group · count</h3>${svgBars(gb,{lw:130})}</div>
      <div class="hpanel"><h3>Factors by status · audit view</h3>${svgBars(sb,{lw:180})}
        <div class="hnote" style="margin-top:10px">60% of the library is a proxy. That is the honest state of Australian horticulture emission factors today — and exactly what we flag.</div></div>
    </div>
    <div class="hpanel"><h3>Biggest levers here · illustrative</h3>${svgBars(srcT.slice(0,5),{lw:130})}</div>
    <div class="hpanel"><h3>Factor catalogue · reference table</h3>
      <div style="max-height:420px;overflow:auto"><table class="hl"><tr><th>ID</th><th>Group</th><th>Source</th><th>Unit</th><th>Scope</th><th>kg CO₂-e/unit</th><th>Status</th><th>Applicability</th></tr>
      ${F.map(f=>`<tr><td>${f.id}</td><td class="t">${f.grp}</td><td class="t">${f.src}</td><td>${f.u}</td><td>${f.sc}</td><td>${f.ef}</td>
        <td><span class="flag" style="background:${SC[f.st]||'#6E7569'}">${f.st}</span></td><td class="t" style="font-size:10px">${f.ap||''}</td></tr>`).join('')}
      </table></div></div>`;
  }
  el.innerHTML=b;
  post.forEach(fn=>fn());
}
/* ---- levers (physics-based, from the workbook) ---- */
const HLEV=[
 {k:'solar',n:'Solar share of grid electricity',max:100,val:0,u:'%',
  d:'Displaces purchased grid power. Embodied PV of 0.045 kg CO₂-e/kWh charged back to Scope 3.',
  f:(r,v)=>r.src[1]*v - r.kwh*v*0.045},
 {k:'pkg',n:'Packaging emissions cut',max:60,val:0,u:'%',
  d:'Lighter, fibre-based or returnable formats. Sits on a proxy factor — the saving is as uncertain as the baseline.',
  f:(r,v)=>r.src[6]*v},
 {k:'nrate',n:'Synthetic nitrogen rate cut',max:40,val:0,u:'%',
  d:'Cuts direct + indirect soil N₂O and upstream manufacture. Assumes yield holds.',
  f:(r,v)=>r.nkg*v*7.82243},
 {k:'diesel',n:'Diesel displaced by renewable diesel',max:100,val:0,u:'%',
  d:'Renewable diesel modelled at ~90% lower lifecycle emissions than fossil diesel.',
  f:(r,v)=>r.dsl*2.71783*v*0.9},
 {k:'freight',n:'Road-freight reduction',max:30,val:0,u:'%',
  d:'Load consolidation and backhauling. Proxy t·km factor.',
  f:(r,v)=>r.src[7]*v}
];
function hSetLever(i,v){HLEV[i].val=+v;document.getElementById('hlv'+i).textContent=v+HLEV[i].u;renderHDash();}
function hResetLevers(){HLEV.forEach(l=>l.val=0);renderHDash();}

/* ---- methods page factor chart ---- */
