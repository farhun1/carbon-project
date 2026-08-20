function dashTab(w){
  document.getElementById('dt-live').classList.toggle('on',w==='live');
  document.getElementById('dt-report').classList.toggle('on',w==='report');
  document.getElementById('dash-live').style.display=w==='live'?'block':'none';
  document.getElementById('pbi-wrap').style.display=w==='report'?'block':'none';
}

/* =================== ADVANCED (EAP-STYLE) CALCULATOR =================== */
const WSTEPS=['Property','Enterprises','Feed & soil','Energy','Production','Results'];
let wzi=0, ents=[];

function calcTab(w){
  document.getElementById('ct-quick').classList.toggle('on',w==='quick');
  document.getElementById('ct-adv').classList.toggle('on',w==='adv');
  document.getElementById('calc-quick').style.display=w==='quick'?'block':'none';
  document.getElementById('calc-adv').style.display=w==='adv'?'block':'none';
  if(w==='adv'){ renderWizSteps(); if(!ents.length) seedEnts(); }
}
function renderWizSteps(){
  document.getElementById('wiz-steps').innerHTML=WSTEPS.map((s,i)=>
    `<div class="ws ${i===wzi?'on':''} ${i<wzi?'done':''}" onclick="wizJump(${i})"><span class="sn">${i+1}</span>${s}</div>`).join('');
  document.querySelectorAll('.wiz-pane').forEach((p,i)=>p.classList.toggle('on',i===wzi));
  document.getElementById('wz-prog').textContent=`Step ${wzi+1} of ${WSTEPS.length}`;
  document.getElementById('wz-prev').disabled=(wzi===0);
  document.getElementById('wz-next').textContent = wzi===WSTEPS.length-2 ? 'Calculate →' : (wzi===WSTEPS.length-1?'Recalculate':'Next →');
}
function wizJump(i){ wzi=Math.max(0,Math.min(WSTEPS.length-1,i)); renderWizSteps(); if(wzi===5) runAdvanced(); }
function wizGo(d){ wizJump(wzi+d); }
function wizNext(){ if(wzi>=WSTEPS.length-2){ wzi=WSTEPS.length-1; renderWizSteps(); runAdvanced(); } else wizJump(wzi+1); }

const CLASSES=[
  ['Dairy cows (milking)',3.4],['Dairy heifers/replacements',2.2],['Beef breeding cows',2.4],
  ['Beef steers/heifers (grazing)',1.9],['Feedlot cattle',1.6],['Bulls',2.6],['Calves',0.8]
];
function seedEnts(){ ents=[{cls:0,head:180,wt:550},{cls:1,head:70,wt:380},{cls:3,head:62,wt:420}]; renderEnts(); }
function addEnt(){ ents.push({cls:3,head:50,wt:400}); renderEnts(); }
function rmEnt(i){ ents.splice(i,1); renderEnts(); }
function updEnt(i,k,v){ ents[i][k]= k==='cls'?+v:(+v||0); }
function renderEnts(){
  document.getElementById('ent-list').innerHTML=ents.map((e,i)=>`
   <div class="enterprise">
     <div class="eh"><b>Livestock enterprise ${i+1}</b><button class="rm" onclick="rmEnt(${i})">Remove</button></div>
     <div class="form-grid">
       <div class="fld"><label>Animal class</label><select onchange="updEnt(${i},'cls',this.value)">
         ${CLASSES.map((c,j)=>`<option value="${j}" ${j===e.cls?'selected':''}>${c[0]}</option>`).join('')}
       </select></div>
       <div class="fld"><label>Head</label><input type="number" value="${e.head}" onchange="updEnt(${i},'head',this.value)"></div>
       <div class="fld"><label>Avg liveweight (kg)</label><input type="number" value="${e.wt}" onchange="updEnt(${i},'wt',this.value)"></div>
     </div>
   </div>`).join('') || '<p style="color:var(--muted);font-size:13px">No enterprises yet — add one.</p>';
}

/* ---- ENGINE: the AIA-EAP-shaped calculation now runs on our own backend ---- */
async function getEmissions(inp){
  const r = await fetch('/api/calc/farm/advanced', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(inp)
  });
  if(!r.ok) throw new Error('Calculation failed');
  return await r.json();
}

async function runAdvanced(){
  const $=id=>document.getElementById(id), n=id=>+($(id).value)||0;
  const inp={
    ents:ents.slice(), additive:parseFloat($('a-additive').value)||0, manureFactor:parseFloat($('a-manure').value)||1,
    grain:n('a-grain'), hay:n('a-hay'), fertN:n('a-fertn'), lime:n('a-lime'),
    diesel:n('a-diesel'), petrol:n('a-petrol'), lpg:n('a-lpg'), elec:n('a-elec'), solar:n('a-solar'), freight:n('a-freight'),
    pasture:n('a-pasture'), crop:n('a-crop'), trees:n('a-trees'), cleared:n('a-cleared'), reveg:n('a-reveg')
  };
  let r;
  try{
    r=await getEmissions(inp);
  }catch(e){
    $('adv-result').innerHTML='<p style="color:var(--muted);font-size:13px">Could not reach the calculation service — please try again.</p>';
    return;
  }
  const milk=n('a-milk'), lwg=n('a-lwg'), redpct=n('a-redpct'), price=n('a-price')||38, buf=(n('a-buffer')||0)/100;
  const intensity = milk>0 ? r.gross*1000/milk : (lwg>0 ? r.gross*1000/lwg : 0);
  const iUnit = milk>0 ? 'kg CO₂-e / L milk' : (lwg>0?'kg CO₂-e / kg LWG':'—');
  const baseline=r.net, project=r.net*(1-redpct/100), reduction=baseline-project;
  const accus=Math.max(0,Math.round(reduction*(1-buf))), revenue=accus*price;
  const perHead = r.headTot>0 ? r.net/r.headTot : 0;
  const perPerson = Math.round(r.net/15);
  const fmt=x=>Math.round(x).toLocaleString();
  const rows=[
    ['Enteric methane (CH₄)','Scope 1',r.enteric],['Manure (CH₄/N₂O)','Scope 1',r.manure],
    ['Fuel — diesel/petrol/LPG','Scope 1',r.fuel],['Fertiliser & lime (N₂O/CO₂)','Scope 1',r.fertiliser],
    ['Land-use change (clearing)','Scope 1',r.landUse],['Electricity (net of solar)','Scope 2',r.energy],
    ['Purchased feed (embedded)','Scope 3',r.feed],['Freight & transport','Scope 3',r.transport],
    ['Sequestration (trees, pasture, reveg)','Removal',-r.seq],
  ];
  $('eng-status').className='eng-badge'+(r.engine==='AIA EAP'?' live':'');
  $('eng-status').innerHTML=`<i></i>Engine: ${r.engine==='AIA EAP'?'AIA EAP (national standard)':'LCCIP indicative (NGER/IPCC-aligned) — EAP-ready'}`;
  $('adv-result').innerHTML=`
   <div class="res-hero">
     <div><div class="rv">${fmt(r.net)}</div><div class="rl">t CO₂-e / year (net)</div></div>
     <div>
       <div class="rl"><b style="color:#fff">${$('a-name').value}</b> · ${$('a-state').value} · ${$('a-year').value} · ${fmt(r.headTot)} head · ${fmt(n('a-area'))} ha</div>
       <div class="rl" style="margin-top:6px">Gross <b style="color:#fff">${fmt(r.gross)} t</b> · Sequestered <b style="color:#D9A857">−${fmt(r.seq)} t</b> · Intensity <b style="color:#D9A857">${intensity.toFixed(2)}</b> ${iUnit}</div>
       <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
         <span class="chip" style="background:rgba(255,255,255,.1);color:#fff;border-color:transparent">Scope 1 <b>${fmt(r.s1)} t</b></span>
         <span class="chip" style="background:rgba(255,255,255,.1);color:#fff;border-color:transparent">Scope 2 <b>${fmt(r.s2)} t</b></span>
         <span class="chip" style="background:rgba(255,255,255,.1);color:#fff;border-color:transparent">Scope 3 <b>${fmt(r.s3)} t</b></span>
       </div>
     </div>
   </div>

   <div class="res-grid">
     <div class="rc"><div class="v">${perHead.toFixed(1)}</div><div class="l">t CO₂-e / head<br><span style="color:var(--gold)">ref ≈ 5–8</span></div></div>
     <div class="rc"><div class="v">${intensity.toFixed(2)}</div><div class="l">${iUnit}<br><span style="color:var(--gold)">ref ≈ 1.0–1.4 (milk)</span></div></div>
     <div class="rc"><div class="v">${perPerson.toLocaleString()}</div><div class="l">≈ avg Australians' footprint<br><span style="color:var(--gold)">~15 t / person / yr</span></div></div>
     <div class="rc"><div class="v" style="color:var(--gold)">${accus.toLocaleString()}</div><div class="l">potential ACCUs / yr<br><span style="color:var(--gold)">≈ $${revenue.toLocaleString()}</span></div></div>
   </div>

   <div class="panel" style="margin-top:16px;box-shadow:none;border:1px solid var(--hair)">
     <h3>Carbon credit — baseline − project</h3>
     <div class="ph">${redpct}% planned reduction · ${(buf*100).toFixed(0)}% risk buffer · $${price}/ACCU</div>
     <div class="accueq">
       <span class="b">Baseline ${fmt(baseline)} t</span><span class="op">−</span>
       <span class="b">Project ${fmt(project)} t</span><span class="op">=</span>
       <span class="b">Reduction ${fmt(reduction)} t</span><span class="op">→</span>
       <span class="g">${accus.toLocaleString()} ACCUs</span><span class="op">≈</span>
       <span class="g">$${revenue.toLocaleString()}/yr</span>
     </div>
   </div>

   <div class="panel" style="margin-top:16px;box-shadow:none;border:1px solid var(--hair)">
     <h3>Full emissions inventory</h3><div class="ph">Every source, by scope · engine: ${r.engine}</div>
     <table class="factbl"><tr><th>Source</th><th>Scope</th><th class="n">t CO₂-e</th><th class="n">Share</th></tr>
     ${rows.map(x=>`<tr><td>${x[0]}</td><td>${x[1]}</td>
       <td class="n" style="color:${x[2]<0?'#5C8A4A':'#1B211C'}">${x[2]<0?'−':''}${fmt(Math.abs(x[2]))}</td>
       <td class="n">${r.gross>0?((Math.abs(x[2])/r.gross)*100).toFixed(1):0}%</td></tr>`).join('')}
     <tr style="background:#FAF8F2"><td><b>Gross</b></td><td></td><td class="n"><b>${fmt(r.gross)}</b></td><td class="n">100%</td></tr>
     <tr style="background:#FAF8F2"><td><b>Net (after removals)</b></td><td></td><td class="n"><b>${fmt(r.net)}</b></td><td class="n"></td></tr>
     </table>
     <p style="font-size:11.5px;color:var(--muted);margin-top:10px"><b>Indicative.</b> Calculated by the LCCIP engine with NGER/IPCC-aligned factors. Designed to run on the <b>AIA Environmental Accounting Platform</b> (the industry-owned national engine) once API access is connected — the results panel will then show <b>Engine: AIA EAP</b>. Real ACCUs require an approved CER method, baseline and independent verification.</p>
   </div>`;
}

