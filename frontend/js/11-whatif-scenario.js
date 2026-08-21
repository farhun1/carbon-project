(function(){
/* ===== WHAT-IF SCENARIO SIMULATOR =====
   Sliders test operational assumptions (herd size, methane, renewables, diesel,
   fertiliser / yield, electricity, nitrogen, packaging, freight, water, removals)
   against a farm's or grower's baseline and recalculate emissions, carbon
   intensity, ACCUs, investment, payback and ROI live. Nothing here writes back
   to FARMS/HFARMS - it's a scenario, not an edit. */
document.head.insertAdjacentHTML('beforeend',`<style>
.sc-layout{display:grid;grid-template-columns:360px 1fr;gap:18px;align-items:start}
.sc-controls{position:sticky;top:82px}.sc-group{border-top:1px solid var(--hair);padding:13px 0}.sc-group:first-child{border-top:none;padding-top:0}
.sc-top{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:6px}.sc-top label{font-size:12px;font-weight:700;color:var(--ink)}
.sc-val{font-family:var(--mono);font-size:12px;color:var(--forest);font-weight:700}.sc-help{font-size:10.5px;color:var(--muted);margin-top:3px;line-height:1.35}
.sc-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.sc-k{background:#fff;border:1px solid var(--hair);border-radius:13px;padding:14px;box-shadow:var(--shadow)}
.sc-k .l{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}.sc-k .v{font-family:var(--serif);font-size:24px;margin-top:4px}.sc-k .d{font-size:10.5px;color:var(--muted);margin-top:3px}
.sc-k.good .v{color:var(--green)}.sc-k.bad .v{color:var(--red)}.sc-k.gold .v{color:var(--gold)}
.sc-compare{display:grid;grid-template-columns:1fr 1fr;gap:12px}.sc-side{border-radius:12px;padding:15px;border:1px solid var(--hair)}.sc-side.base{background:#fafcf8}.sc-side.proj{background:#eef6ec;border-color:#cfe3c6}
.sc-side h4{margin:0 0 10px;font-family:var(--serif);font-size:16px}.sc-row{display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:6px 0;border-bottom:1px solid rgba(0,0,0,.06)}.sc-row:last-child{border-bottom:none}.sc-row b{font-family:var(--mono)}
.sc-source{display:grid;grid-template-columns:145px 1fr 75px;gap:9px;align-items:center;margin:9px 0;font-size:12px}.sc-track{height:10px;background:#edf1e9;border-radius:6px;overflow:hidden;position:relative}.sc-track i{display:block;height:100%;border-radius:6px;background:var(--forest)}.sc-track em{position:absolute;top:0;height:100%;width:2px;background:var(--red);font-style:normal}
.sc-delta{text-align:right;font-family:var(--mono);font-size:11px}.sc-rec{display:flex;gap:10px;align-items:flex-start;padding:11px 0;border-bottom:1px solid var(--hair)}.sc-rec:last-child{border-bottom:none}.sc-rank{width:26px;height:26px;border-radius:50%;background:var(--forest);color:#fff;display:grid;place-items:center;font-family:var(--serif);font-weight:700;flex:0 0 auto}.sc-rec b{font-size:13px}.sc-rec p{margin:2px 0 0;font-size:11.5px;color:var(--muted)}
.sc-presets{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}.sc-presets button{border:1px solid var(--hair);background:#fff;border-radius:18px;padding:6px 11px;font-size:11px;font-weight:700;color:var(--forest)}.sc-presets button:hover{background:var(--mint)}
.sc-engine{font-size:11px;color:var(--muted);padding:9px 11px;background:#fafcf8;border:1px solid var(--hair);border-radius:9px;margin-bottom:12px}.sc-engine b{color:var(--forest)}
.sc-herd-entry{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.sc-herd-entry input[type=number]{width:120px;padding:9px 10px;border:1px solid var(--hair);border-radius:8px;font:700 14px var(--mono);color:var(--forest);background:#fff}.sc-herd-summary{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.sc-herd-summary span{font-size:10.5px;padding:4px 8px;border-radius:14px;background:var(--mint);color:var(--forest);font-weight:700}
@media(max-width:980px){.sc-layout{grid-template-columns:1fr}.sc-controls{position:static}.sc-kpis{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.sc-kpis,.sc-compare{grid-template-columns:1fr}.sc-source{grid-template-columns:110px 1fr 65px}}
</style>`);

const money=x=>'$'+Math.round(x).toLocaleString();
const nfmt=(x,d=0)=>Number(x).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
function scGate(id,title){
 const g=document.getElementById(id+'-gate'), b=document.getElementById(id+'-body');
 if(!subscribed){g.innerHTML=gateHTML(title);b.style.display='none';return false;} g.innerHTML='';b.style.display='block';return true;
}
function slider(id,label,min,max,step,val,unit,help){return `<div class="sc-group"><div class="sc-top"><label>${label}</label><span class="sc-val" id="${id}-v"></span></div><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}" oninput="runScenario()"><div class="sc-help">${help}</div></div>`;}
window.renderScenarioView=function(ind){
 const id=ind==='farm'?'scenario':'h-scenario'; if(!scGate(id,'What-if scenario simulation'))return;
 const body=document.getElementById(id+'-body');
 const options=ind==='farm'?FARMS.map(f=>`<option value="${f.id}">${f.name} · ${f.region}</option>`).join(''):HFARMS.map(f=>`<option value="${f.id}">${f.name} · ${f.state}</option>`).join('');
 const controls=ind==='farm'?
  `<div class="sc-group"><div class="sc-top"><label>New herd size</label><span class="sc-val" id="sc-herd-v"></span></div><div class="sc-herd-entry"><div><div class="sc-help" style="margin:0">Current herd: <b id="sc-herd-current"></b> cattle</div></div><input id="sc-herd-head" type="number" min="1" step="1" oninput="runScenario()"></div><input id="sc-herd-range" type="range" min="1" max="1000" step="1" oninput="syncHerdFromRange()"><div class="sc-herd-summary"><span id="sc-herd-diff"></span><span id="sc-herd-pct"></span></div><div class="sc-help">Enter the planned number of cattle. The simulator derives the percentage change and scales enteric methane, manure and feed demand.</div></div>`+
  slider('sc-prod','Product output change',-20,50,1,0,'%','Changes milk or liveweight output used for carbon intensity.')+
  slider('sc-methane','Low-methane feed adoption',0,30,1,0,'%','Applied as a direct reduction to enteric methane.')+
  slider('sc-renew','Renewable electricity',0,100,5,0,'%','Displaces purchased electricity (Scope 2).')+
  slider('sc-diesel','Diesel reduction',0,60,5,0,'%','Efficiency, route optimisation or electrification.')+
  slider('sc-fert','Nitrogen fertiliser reduction',0,40,5,0,'%','Reduces fertiliser-related N₂O emissions.')+
  `<div class="sc-group"><div class="sc-top"><label>Manure management</label></div><select id="sc-manure" onchange="runScenario()" style="width:100%;padding:9px;border:1px solid var(--hair);border-radius:8px"><option value="0">Current practice</option><option value="25">Covered storage (−25%)</option><option value="45">Covered lagoon (−45%)</option><option value="65">Anaerobic digester (−65%)</option></select></div>`:
  slider('sc-yield','Marketable yield change',-25,40,1,0,'%','Changes the functional-unit denominator: kg CO₂-e per kg sold.')+
  slider('sc-elec','Grid electricity reduction',0,100,5,0,'%','Solar, renewable supply or efficiency.')+
  slider('sc-n','Synthetic nitrogen reduction',0,50,5,0,'%','Reduces soil N₂O and upstream fertiliser emissions.')+
  slider('sc-pack','Packaging reduction',0,60,5,0,'%','Lighter packs, recycled content or format redesign.')+
  slider('sc-freight','Freight reduction',0,50,5,0,'%','Consolidation, backhauling and route optimisation.')+
  slider('sc-water','Water and pumping reduction',0,40,5,0,'%','Irrigation efficiency and moisture sensing.')+
  slider('sc-rem','Additional removals',0,50,5,0,'%','Increase in measured soil and biomass removals.');
 body.innerHTML=`<div class="toolbar"><div class="grp"><label>${ind==='farm'?'Farm':'Grower'}</label><select id="sc-farm" onchange="resetScenario()">${options}</select></div><div class="grp"><label>ACCU price</label><select id="sc-price" onchange="runScenario()"><option value="38">$38</option><option value="50">$50</option><option value="75">$75</option></select></div><span class="live-pill"><i></i>Scenario only · actual data unchanged</span></div>
 <div class="sc-presets"><button onclick="scPreset('balanced')">Balanced reduction</button><button onclick="scPreset('lowcost')">Low-cost actions</button><button onclick="scPreset('maximum')">Maximum abatement</button><button onclick="resetScenario()">Reset baseline</button></div>
 <div class="sc-engine"><b>Engine:</b> recalculates live from ${ind==='farm'?"this farm's":"this grower's"} own baseline dataset — nothing here is written back to the farm record.</div>
 <div class="sc-layout"><div class="panel sc-controls"><h3>Scenario assumptions</h3><div class="ph">Move one or more controls. Results update instantly.</div>${controls}
 <div class="sc-group"><div class="sc-top"><label>Available investment budget</label><span class="sc-val" id="sc-budget-v"></span></div><input id="sc-budget" type="range" min="0" max="300000" step="5000" value="80000" oninput="runScenario()"><div class="sc-help">Used to test whether the selected intervention package is financially feasible.</div></div></div><div id="sc-output"></div></div>`;
 resetScenario();
};
function setRange(id,v){const e=document.getElementById(id);if(e)e.value=v;}
function setHerdHeads(head){
 const input=document.getElementById('sc-herd-head'), range=document.getElementById('sc-herd-range');
 if(!input||!range)return;
 const base=Math.max(1,Math.round(head));
 input.min=Math.max(1,Math.round(base*.5)); input.max=Math.max(base+1,Math.round(base*2)); input.value=base;
 range.min=input.min; range.max=input.max; range.value=base;
}
window.syncHerdFromRange=function(){const r=document.getElementById('sc-herd-range'),i=document.getElementById('sc-herd-head');if(r&&i){i.value=r.value;runScenario();}};
window.resetScenario=function(){
 ['sc-prod','sc-methane','sc-renew','sc-diesel','sc-fert','sc-yield','sc-elec','sc-n','sc-pack','sc-freight','sc-water','sc-rem'].forEach(x=>setRange(x,0));
 if(INDUSTRY==='farm'){const f=FARMS.find(x=>x.id===document.getElementById('sc-farm').value)||FARMS[0];setHerdHeads(f.head);}
 setRange('sc-budget',80000); const m=document.getElementById('sc-manure');if(m)m.value=0; runScenario();
};
window.scPreset=function(p){
 if(INDUSTRY==='farm'){
  const z=p==='lowcost'?[0,5,12,20,15,10,25,45000]:p==='maximum'?[10,15,30,100,50,35,65,250000]:[0,8,20,60,25,20,45,120000];
  const f=FARMS.find(x=>x.id===document.getElementById('sc-farm').value)||FARMS[0];setHerdHeads(Math.round(f.head*(1+z[0]/100)));
  ['sc-prod','sc-methane','sc-renew','sc-diesel','sc-fert'].forEach((x,i)=>setRange(x,z[i+1]));document.getElementById('sc-manure').value=z[6];setRange('sc-budget',z[7]);
 }else{
  const z=p==='lowcost'?[5,15,15,20,15,10,5,40000]:p==='maximum'?[20,100,45,55,45,35,40,250000]:[10,60,25,35,25,20,20,120000];
  ['sc-yield','sc-elec','sc-n','sc-pack','sc-freight','sc-water','sc-rem','sc-budget'].forEach((x,i)=>setRange(x,z[i]));
 } runScenario();
};
function sval(id,unit='%'){const e=document.getElementById(id);if(!e)return 0;const v=+e.value;const o=document.getElementById(id+'-v');if(o)o.textContent=(v>0?'+':'')+v+unit;return v;}
function sourceBars(base,proj){
 const max=Math.max(...Object.values(base),1);return Object.keys(base).map(k=>{const b=base[k],p=proj[k],delta=p-b;return `<div class="sc-source"><span>${k}</span><div class="sc-track"><i style="width:${Math.max(1,p/max*100)}%"></i><em style="left:${Math.min(99,b/max*100)}%"></em></div><span class="sc-delta" style="color:${delta<=0?'var(--green)':'var(--red)'}">${delta>0?'+':''}${nfmt(delta,1)} t</span></div>`}).join('');
}
function recommendationList(items){return items.slice(0,4).map((r,i)=>`<div class="sc-rec"><span class="sc-rank">${i+1}</span><div><b>${r[0]}</b><p>${r[1]}</p></div></div>`).join('');}
window.runScenario=function(){
 const out=document.getElementById('sc-output');if(!out)return;const budget=sval('sc-budget','$');document.getElementById('sc-budget-v').textContent=money(+document.getElementById('sc-budget').value);const price=+document.getElementById('sc-price').value;
 let base,proj,yieldBase,yieldProj,ciBase,ciProj,remBase,remProj,invest,savings,recs;
 if(INDUSTRY==='farm'){
  const f=FARMS.find(x=>x.id===document.getElementById('sc-farm').value)||FARMS[0];
  const herdInput=document.getElementById('sc-herd-head'),herdRange=document.getElementById('sc-herd-range');
  let scenarioHead=Math.max(1,Math.round(+(herdInput?.value||f.head))); if(herdInput)herdInput.value=scenarioHead;if(herdRange)herdRange.value=Math.min(+herdRange.max,Math.max(+herdRange.min,scenarioHead));
  const herd=(scenarioHead-f.head)/f.head,prod=sval('sc-prod')/100,meth=sval('sc-methane')/100,ren=sval('sc-renew')/100,diesel=sval('sc-diesel')/100,fert=sval('sc-fert')/100,man=+document.getElementById('sc-manure').value/100;
  const herdDiff=scenarioHead-f.head,herdPct=herd*100;
  const hc=document.getElementById('sc-herd-current'),hv=document.getElementById('sc-herd-v'),hd=document.getElementById('sc-herd-diff'),hp=document.getElementById('sc-herd-pct');
  if(hc)hc.textContent=f.head.toLocaleString();if(hv)hv.textContent=scenarioHead.toLocaleString()+' cattle';if(hd)hd.textContent=(herdDiff>=0?'+':'')+herdDiff.toLocaleString()+' cattle';if(hp)hp.textContent=(herdPct>=0?'+':'')+herdPct.toFixed(1)+'%';
  const shares={Enteric:f.hot.find(x=>x[0].includes('Enteric'))?.[1]||35,Manure:f.hot.find(x=>x[0].includes('Manure'))?.[1]||12,Feed:f.hot.find(x=>x[0]==='Feed')?.[1]||20,Energy:f.hot.find(x=>x[0]==='Energy')?.[1]||10,Fuel:f.hot.find(x=>x[0]==='Fuel')?.[1]||9,Transport:f.hot.find(x=>x[0]==='Transport')?.[1]||7,Fertilizer:3};const total=Object.values(shares).reduce((a,b)=>a+b,0);base={};Object.entries(shares).forEach(([k,v])=>base[k]=f.gross*v/total);
  proj={...base};proj.Enteric*=Math.max(0,(1+herd)*(1-meth));proj.Manure*=Math.max(0,(1+herd)*(1-man));proj.Feed*=Math.max(0,1+herd);proj.Energy*=1-ren;proj.Fuel*=1-diesel;proj.Fertilizer*=1-fert;proj.Transport*=Math.max(0,1+herd*.5-diesel*.25);
  remBase=f.gross-f.net;remProj=remBase;yieldBase=f.gross*1000/f.intensity;yieldProj=yieldBase*Math.max(.1,1+prod);ciBase=f.intensity;const grossP=Object.values(proj).reduce((a,b)=>a+b,0);ciProj=grossP*1000/yieldProj;
  invest=meth*90000+ren*130000+diesel*45000+fert*20000+man*150000;savings=ren*22000+diesel*15000+fert*8000+man*18000+Math.max(0,prod)*25000;
  recs=[['Adopt low-methane feed'],['Renewable electricity'],['Improve manure storage'],['Protect productivity']];
  base._gross=f.gross;base._net=f.net;proj._gross=grossP;proj._net=Math.max(0,grossP-remProj);
 }else{
  const f=HFARMS.find(x=>x.id===document.getElementById('sc-farm').value)||HFARMS[0];const y=sval('sc-yield')/100,e=sval('sc-elec')/100,n=sval('sc-n')/100,p=sval('sc-pack')/100,fr=sval('sc-freight')/100,w=sval('sc-water')/100,r=sval('sc-rem')/100;
  base={...f.src};proj={...base};proj.Electricity*=1-e;proj['Soil N₂O']*=1-n;proj['Fertiliser (upstream)']*=1-n;proj['Lime & urea']*=1-n*.5;proj.Packaging*=1-p;proj.Transport*=1-fr;proj.Water*=1-w;
  remBase=f.rem;remProj=f.rem*(1+r);yieldBase=f.yieldkg;yieldProj=yieldBase*Math.max(.1,1+y);ciBase=f.ci;const grossP=Object.values(proj).reduce((a,b)=>a+b,0);ciProj=Math.max(0,grossP-remProj)*1000/yieldProj;
  invest=e*150000+n*35000+p*70000+fr*25000+w*60000+r*80000;savings=e*18000+n*12000+p*10000+fr*9000+w*6000;
  recs=[['Redesign packaging'],['Optimise nitrogen'],['Increase renewable electricity'],['Protect marketable yield']];
  base._gross=f.gross;base._net=f.net;proj._gross=grossP;proj._net=Math.max(0,grossP-remProj);
 }
 const reduction=Math.max(0,base._net-proj._net),accu=reduction*.95,revenue=accu*price,annual=savings+revenue,pay=annual>0?invest/annual:0,roi=invest>0?(annual*10-invest)/invest*100:0,within=invest<=+document.getElementById('sc-budget').value;
 const delta=proj._net-base._net,cut=base._net?reduction/base._net*100:0;const cleanBase={...base},cleanProj={...proj};delete cleanBase._gross;delete cleanBase._net;delete cleanProj._gross;delete cleanProj._net;
 const status=delta<=0?'good':'bad';
 out.innerHTML=`<div class="sc-kpis"><div class="sc-k ${status}"><div class="l">Net emissions</div><div class="v">${nfmt(proj._net,0)} t</div><div class="d">${delta>0?'+':''}${nfmt(delta,0)} t vs baseline</div></div><div class="sc-k ${ciProj<=ciBase?'good':'bad'}"><div class="l">Carbon intensity</div><div class="v">${nfmt(ciProj,3)}</div><div class="d">baseline ${nfmt(ciBase,3)}</div></div><div class="sc-k gold"><div class="l">Potential ACCUs</div><div class="v">${nfmt(accu,0)}</div><div class="d">5% risk buffer applied</div></div><div class="sc-k ${within?'good':'bad'}"><div class="l">Investment fit</div><div class="v">${within?'Within budget':'Over budget'}</div><div class="d">estimated ${money(invest)}</div></div></div>
 <div class="sc-compare"><div class="sc-side base"><h4>Current baseline</h4><div class="sc-row"><span>Gross emissions</span><b>${nfmt(base._gross,0)} t</b></div><div class="sc-row"><span>Net emissions</span><b>${nfmt(base._net,0)} t</b></div><div class="sc-row"><span>Carbon intensity</span><b>${nfmt(ciBase,3)}</b></div><div class="sc-row"><span>Removals</span><b>${nfmt(remBase,0)} t</b></div></div><div class="sc-side proj"><h4>Scenario outcome</h4><div class="sc-row"><span>Gross emissions</span><b>${nfmt(proj._gross,0)} t</b></div><div class="sc-row"><span>Net emissions</span><b>${nfmt(proj._net,0)} t</b></div><div class="sc-row"><span>Carbon intensity</span><b>${nfmt(ciProj,3)}</b></div><div class="sc-row"><span>Reduction</span><b>${nfmt(reduction,0)} t (${nfmt(cut,1)}%)</b></div></div></div>
 <div class="panel" style="margin-top:16px"><h3>Emission source movement</h3><div class="ph">Green bar = scenario; red marker = current baseline</div>${sourceBars(cleanBase,cleanProj)}</div>
 <div class="grid-d" style="grid-template-columns:1fr 1fr;margin-top:16px"><div class="panel"><h3>Investment & carbon value</h3><div class="ph">Indicative 10-year financial view</div><div class="sc-row"><span>Estimated investment</span><b>${money(invest)}</b></div><div class="sc-row"><span>Operational savings / year</span><b>${money(savings)}</b></div><div class="sc-row"><span>Carbon revenue / year</span><b>${money(revenue)}</b></div><div class="sc-row"><span>Simple payback</span><b>${pay?nfmt(pay,1)+' years':'—'}</b></div><div class="sc-row"><span>10-year ROI</span><b>${invest?nfmt(roi,0)+'%':'—'}</b></div></div><div class="panel"><h3>AI decision support</h3><div class="ph">Recommendations based on the current scenario gap</div>${recommendationList(recs)}</div></div>
 <div class="note-banner" style="margin-top:16px"><b>Scenario only.</b> These figures do not change your farm record — apply the changes for real once you're ready to act on them.</div>`;
};
})();
