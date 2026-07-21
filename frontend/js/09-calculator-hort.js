/* ===== HORTICULTURE advanced wizard ===== */
const HWSTEPS=['Property','Enterprises','Inputs & soil','Energy','Removals','Results'];
let hwzi=0, hents=[];
const HCROPS=['Apples','Tomatoes','Strawberries','Avocados','Mangoes','Wine Grapes','Potatoes','Cherries','Lettuce','Blueberries','Almonds','Carrots'];
const HSYS=['Orchard','Protected Cropping','Open Field','Vineyard'];
function hCalcTab(w){
  document.getElementById('hct-quick').classList.toggle('on',w==='quick');
  document.getElementById('hct-adv').classList.toggle('on',w==='adv');
  document.getElementById('hcalc-quick').style.display=w==='quick'?'block':'none';
  document.getElementById('hcalc-adv').style.display=w==='adv'?'block':'none';
  if(w==='adv'){ renderHWizSteps(); if(!hents.length) hSeedEnts(); }
}
function renderHWizSteps(){
  document.getElementById('hwiz-steps').innerHTML=HWSTEPS.map((s,i)=>
    `<div class="ws ${i===hwzi?'on':''} ${i<hwzi?'done':''}" onclick="hWizJump(${i})"><span class="sn">${i+1}</span>${s}</div>`).join('');
  document.querySelectorAll('#hcalc-adv .wiz-pane').forEach((p,i)=>p.classList.toggle('on',i===hwzi));
  document.getElementById('hwz-prog').textContent=`Step ${hwzi+1} of ${HWSTEPS.length}`;
  document.getElementById('hwz-prev').disabled=(hwzi===0);
  document.getElementById('hwz-next').textContent = hwzi===HWSTEPS.length-2?'Calculate →':(hwzi===HWSTEPS.length-1?'Recalculate':'Next →');
}
function hWizJump(i){ hwzi=Math.max(0,Math.min(HWSTEPS.length-1,i)); renderHWizSteps(); if(hwzi===5) hRunAdvanced(); }
function hWizGo(d){ hWizJump(hwzi+d); }
function hWizNext(){ if(hwzi>=HWSTEPS.length-2){ hwzi=HWSTEPS.length-1; renderHWizSteps(); hRunAdvanced(); } else hWizJump(hwzi+1); }
function hSeedEnts(){ hents=[{crop:1,sys:1,ha:45,yld:302824},{crop:0,sys:0,ha:20,yld:180000}]; renderHEnts(); }
function hAddEnt(){ hents.push({crop:0,sys:0,ha:20,yld:150000}); renderHEnts(); }
function hRmEnt(i){ hents.splice(i,1); renderHEnts(); }
function hUpdEnt(i,k,v){ hents[i][k]= (k==='crop'||k==='sys')?+v:(+v||0); }
function renderHEnts(){
  document.getElementById('hent-list').innerHTML=hents.map((e,i)=>`
   <div class="enterprise">
     <div class="eh"><b>Crop block ${i+1}</b><button class="rm" onclick="hRmEnt(${i})">Remove</button></div>
     <div class="form-grid">
       <div class="fld"><label>Crop</label><select onchange="hUpdEnt(${i},'crop',this.value)">${HCROPS.map((c,j)=>`<option value="${j}" ${j===e.crop?'selected':''}>${c}</option>`).join('')}</select></div>
       <div class="fld"><label>System</label><select onchange="hUpdEnt(${i},'sys',this.value)">${HSYS.map((c,j)=>`<option value="${j}" ${j===e.sys?'selected':''}>${c}</option>`).join('')}</select></div>
       <div class="fld"><label>Area (ha)</label><input type="number" value="${e.ha}" onchange="hUpdEnt(${i},'ha',this.value)"></div>
       <div class="fld"><label>Marketable yield (kg/yr)</label><input type="number" value="${e.yld}" onchange="hUpdEnt(${i},'yld',this.value)"></div>
     </div>
   </div>`).join('') || '<p style="color:var(--muted);font-size:13px">No blocks yet — add one.</p>';
}
/* swappable engine — same pattern as farm; EAP stub commented */
async function hGetEmissions(inp){
  // when AIA EAP API is connected: const r=await fetch('/.netlify/functions/eap-hort',{...}); if(r.ok) return {...await r.json(),engine:'AIA EAP'};
  return {...hCalcLocal(inp), engine:'LCCIP indicative'};
}
function hCalcLocal(i){
  const F={diesel:2.71783,elec:0.66,soilN2O:7.82243,fertUp:1.35,lime:440,plastic:2.6,card:0.94,
           freight:0.12,water:0.15,chem:9.1,waste:520,refrig:1430,treeSeq:6.0,coverSeq:0.4};
  const yld=i.ents.reduce((a,e)=>a+e.yld,0);
  const diesel=i.diesel*F.diesel/1000, netE=Math.max(0,i.elec-i.solar), elec=netE*F.elec/1000,
        soilN=i.n*F.soilN2O/1000, fertUp=i.n*F.fertUp/1000, lime=i.lime*F.lime/1000,
        plastic=i.plastic*F.plastic/1000, card=i.card*F.card/1000, pack=plastic+card,
        freight=i.freight*F.freight/1000, water=i.water*F.water/1000, chem=i.chem*F.chem/1000,
        waste=i.waste*F.waste/1000, refrig=i.refrig*F.refrig/1000;
  const seq=i.trees*F.treeSeq + i.cover*F.coverSeq + i.rem;
  const gross=diesel+elec+soilN+fertUp+lime+pack+freight+water+chem+waste+refrig;
  const net=Math.max(0,gross-seq);
  const s1=diesel+soilN+lime+refrig, s2=elec, s3=fertUp+pack+freight+water+chem+waste;
  return {diesel,elec,soilN,fertUp,lime,pack,plastic,card,freight,water,chem,waste,refrig,seq,gross,net,s1,s2,s3,yld,
    rows:[['Fuel — diesel','Scope 1',diesel],['Soil N₂O','Scope 1',soilN],['Lime & urea','Scope 1',lime],
      ['Refrigerant','Scope 1',refrig],['Electricity (net of solar)','Scope 2',elec],
      ['Fertiliser (upstream)','Scope 3',fertUp],['Packaging','Scope 3',pack],['Freight','Scope 3',freight],
      ['Water','Scope 3',water],['Chemicals','Scope 3',chem],['Organic waste','Scope 3',waste],
      ['Removals (soil + biomass + veg)','Removal',-seq]]};
}
async function hRunAdvanced(){
  const $=id=>document.getElementById(id), n=id=>+($(id).value)||0;
  const inp={ents:hents.slice(),n:n('ha-n'),lime:n('ha-lime'),chem:n('ha-chem'),plastic:n('ha-plastic'),card:n('ha-card'),
    waste:n('ha-waste'),diesel:n('ha-diesel'),elec:n('ha-elec'),solar:n('ha-solar'),water:n('ha-water'),
    freight:n('ha-freight'),refrig:n('ha-refrig'),trees:n('ha-trees'),cover:n('ha-cover'),rem:n('ha-rem')};
  const r=await hGetEmissions(inp);
  const redpct=n('ha-redpct'),price=n('ha-price')||38,buf=(n('ha-buffer')||0)/100;
  const ci=r.yld?r.gross*1000/r.yld:0;
  const baseline=r.net,project=r.net*(1-redpct/100),reduction=baseline-project;
  const accus=Math.max(0,Math.round(reduction*(1-buf))),revenue=accus*price;
  const area=n('ha-area')||1, perPerson=Math.round(r.net/15);
  const fmt=x=>Math.round(x).toLocaleString();
  $('heng-status').className='eng-badge'+(r.engine==='AIA EAP'?' live':'');
  $('heng-status').innerHTML=`<i></i>Engine: ${r.engine==='AIA EAP'?'AIA EAP (national standard)':'LCCIP indicative (NGER/IPCC-aligned) — EAP-ready'}`;
  $('hadv-result').innerHTML=`
   <div class="res-hero">
     <div><div class="rv">${fmt(r.net)}</div><div class="rl">t CO₂-e / year (net)</div></div>
     <div>
       <div class="rl"><b style="color:#fff">${$('ha-name').value}</b> · ${$('ha-state').value} · ${$('ha-year').value} · ${hents.length} block(s) · ${fmt(area)} ha</div>
       <div class="rl" style="margin-top:6px">Gross <b style="color:#fff">${fmt(r.gross)} t</b> · Removals <b style="color:#e9c768">−${fmt(r.seq)} t</b> · Intensity <b style="color:#e9c768">${ci.toFixed(3)}</b> kg CO₂-e / kg</div>
       <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
         <span class="chip" style="background:rgba(255,255,255,.1);color:#fff;border-color:transparent">Scope 1 <b>${fmt(r.s1)} t</b></span>
         <span class="chip" style="background:rgba(255,255,255,.1);color:#fff;border-color:transparent">Scope 2 <b>${fmt(r.s2)} t</b></span>
         <span class="chip" style="background:rgba(255,255,255,.1);color:#fff;border-color:transparent">Scope 3 <b>${fmt(r.s3)} t</b></span>
       </div>
     </div>
   </div>
   <div class="res-grid">
     <div class="rc"><div class="v">${ci.toFixed(3)}</div><div class="l">kg CO₂-e / kg<br><span style="color:var(--gold)">network ≈ 0.48</span></div></div>
     <div class="rc"><div class="v">${(r.gross/area).toFixed(1)}</div><div class="l">t CO₂-e / ha<br><span style="color:var(--gold)">network ≈ 5.3</span></div></div>
     <div class="rc"><div class="v">${perPerson.toLocaleString()}</div><div class="l">≈ avg Australians' footprint<br><span style="color:var(--gold)">~15 t / person</span></div></div>
     <div class="rc"><div class="v" style="color:var(--gold)">${accus.toLocaleString()}</div><div class="l">potential ACCUs / yr<br><span style="color:var(--gold)">≈ $${revenue.toLocaleString()}</span></div></div>
   </div>
   <div class="panel" style="margin-top:16px;box-shadow:none;border:1px solid var(--hair)">
     <h3>Carbon credit — baseline − project</h3><div class="ph">${redpct}% planned reduction · ${(buf*100).toFixed(0)}% buffer · $${price}/ACCU</div>
     <div class="accueq"><span class="b">Baseline ${fmt(baseline)} t</span><span class="op">−</span><span class="b">Project ${fmt(project)} t</span><span class="op">=</span><span class="b">Reduction ${fmt(reduction)} t</span><span class="op">→</span><span class="g">${accus.toLocaleString()} ACCUs</span><span class="op">≈</span><span class="g">$${revenue.toLocaleString()}/yr</span></div>
   </div>
   <div class="panel" style="margin-top:16px;box-shadow:none;border:1px solid var(--hair)">
     <h3>Full emissions inventory</h3><div class="ph">Every source, by scope · engine: ${r.engine}</div>
     <table class="factbl"><tr><th>Source</th><th>Scope</th><th class="n">t CO₂-e</th><th class="n">Share</th></tr>
     ${r.rows.map(x=>`<tr><td>${x[0]}</td><td>${x[1]}</td><td class="n" style="color:${x[2]<0?'#4e9d52':'#16201a'}">${x[2]<0?'−':''}${fmt(Math.abs(x[2]))}</td><td class="n">${r.gross>0?(Math.abs(x[2])/r.gross*100).toFixed(1):0}%</td></tr>`).join('')}
     <tr style="background:#faf9f8"><td><b>Net</b></td><td></td><td class="n"><b>${fmt(r.net)}</b></td><td class="n"></td></tr></table>
     <p style="font-size:11.5px;color:var(--muted);margin-top:10px"><b>Indicative.</b> Calculated by the LCCIP engine with NGER/IPCC-aligned factors, structured to run on the <b>AIA EAP</b> national engine once connected. Real ACCUs require an approved CER method, baseline and independent verification.</p>
   </div>`;
}
/* ===== AI Recommendations sub-tabs (both industries) ===== */
function hAiTab(t){
  document.getElementById('hai-t1').classList.toggle('on',t==='rec');
  document.getElementById('hai-t2').classList.toggle('on',t==='roi');
  document.getElementById('hai-rec').style.display=t==='rec'?'block':'none';
  const roi=document.getElementById('hai-roi'); roi.style.display=t==='roi'?'block':'none';
  if(t==='roi'){ mountROI('hai-roi'); }
}
