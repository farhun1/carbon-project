(function(){
document.head.insertAdjacentHTML('beforeend',`<style>
.rx-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px}
.rx-out{background:var(--pasture);color:#fff;border-radius:16px;padding:20px 22px}
.rx-out .big{font-family:var(--serif);font-size:40px;color:#D9A857;line-height:1}
.rx-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0 18px}
.rx-c{background:#fff;border:1px solid var(--hair);border-radius:12px;padding:14px;text-align:center;box-shadow:var(--shadow)}
.rx-c .v{font-family:var(--serif);font-size:23px;color:var(--forest)}
.rx-c .l{font-size:11px;color:var(--muted);margin-top:3px}
.rx-c.gold .v{color:var(--gold)}.rx-c.bad .v{color:var(--red)}
.rx-t{width:100%;border-collapse:collapse;font-size:12.5px}
.rx-t th{text-align:left;font-size:11px;color:var(--muted);font-weight:600;padding:8px;border-bottom:2px solid var(--hair)}
.rx-t td{padding:8px;border-bottom:1px solid #EEF0E4;vertical-align:top}
.rx-t td.n{text-align:right;font-variant-numeric:tabular-nums}
.rx-t tr.pick td{background:#f2f8ef}
.rx-pill{font-size:9.5px;font-weight:700;color:#fff;padding:2px 7px;border-radius:10px}
.rx-w{font-size:11.5px;color:var(--muted)}
@media(max-width:900px){.rx-grid,.rx-cards{grid-template-columns:1fr}}
</style>`);
document.getElementById('main').insertAdjacentHTML('beforeend',`
<div id="roi-template" style="display:none">
  <div class="sec-head"><span class="kicker">Investment & ROI scenario</span>
    <h2 class="h-lead">If you invest, what do you get back?</h2>
    <p class="sub">Set a budget. The engine builds the best portfolio of actions, then shows carbon cut, ACCUs earned, payback and ROI — and explains what every number means and how you compare.</p></div>
  <div id="rx-gate"></div>
  <div id="rx-body" style="display:none">
    <div class="toolbar">
      <div class="grp"><label>Farm</label><select id="rx-farm" onchange="renderROI()"></select></div>
      <div class="grp"><label>Carbon price</label><select id="rx-price" onchange="renderROI()">
        <option value="38">$38 / ACCU (today)</option><option value="50">$50 / ACCU</option><option value="75">$75 / ACCU</option></select></div>
      <div class="grp"><label>Horizon</label><select id="rx-yrs" onchange="renderROI()">
        <option value="5">5 years</option><option value="10" selected>10 years</option></select></div>
    </div>
    <div class="panel" style="margin-bottom:18px"><h3>Your investment budget</h3>
      <div class="ph">Drag to set the capital available — the engine funds the best-value actions within it</div>
      <div style="display:flex;justify-content:space-between;margin:12px 0 6px"><span style="font-size:13px">Budget</span>
        <b id="rx-bl" style="font-family:var(--serif);font-size:20px">$80,000</b></div>
      <input type="range" id="rx-budget" min="0" max="300000" step="5000" value="80000" style="width:100%" oninput="renderROI()">
    </div>
    <div id="rx-out"></div>
  </div>
</div>`);
GATED.push('roi'); HGATED.push('roi'); // ROI now lives inside AI Recommendations
buildNav();
function mountROI(targetId){
  const t=document.getElementById(targetId), tpl=document.getElementById('roi-template');
  if(t && !t.dataset.mounted){ t.appendChild(tpl); tpl.style.display='block'; t.dataset.mounted='1'; }
  else if(t){ t.appendChild(tpl); tpl.style.display='block'; }
  renderROIView();
}
window.mountROI=mountROI;

/* Cattle: capex, opex saving/yr, and abatement scaled to farm size (base = Riverdale 2,167 t net) */
const RX_CATTLE=[
 ['Herd productivity & health program',45000,238,18000,'Root cause: milk yield, feed conversion, animal health'],
 ['Ration optimisation + 3-NOP additive',28000,99,2000,'Cuts enteric methane at the source'],
 ['Feed storage, diet & supplier change',12000,59,4000,'Less waste, better feed conversion'],
 ['Covered manure storage / digester',95000,52,12000,'Captures methane, generates energy'],
 ['Route optimisation + telematics',9000,42,5000,'Fewer kilometres, less diesel'],
 ['Solar pumps + LED + refrigeration',60000,35,14000,'Displaces purchased grid electricity'],
 ['Combine deliveries, cut empty runs',5000,23,3000,'Freight consolidation'],
 ['Rotational grazing + NDVI monitoring',15000,10.6,4000,'Pasture recovery and soil carbon'],
 ['Precision nitrogen + soil testing',7000,2.9,2500,'Less N₂O and a lower fertiliser bill'],
 ['Smart water metering + leak detection',6000,1.5,2000,'Pumping energy saved']];
/* Horticulture: abatement derived from THIS farm's own source tonnes (defensible, not a guess) */
const RX_HORT=[
 {n:'Lighter / fibre-based packaging', cap:520, si:6, cut:0.30, save:1.9,
  why:'Largest source — and it sits on a proxy factor, so the saving carries the same uncertainty'},
 {n:'Precision nitrogen (−25% rate)',  cap:300, si:2, cut:0.25, save:2.6, si2:3,
  why:'Soil N₂O is 265× stronger than CO₂; also cuts the fertiliser bill'},
 {n:'Solar PV + efficient cooling',    cap:2400, si:1, cut:0.60, save:2.1,
  why:'Displaces purchased grid electricity — biggest capex, strong long-run saving'},
 {n:'Renewable diesel (50% switch)',   cap:110, si:0, cut:0.45, save:-1.1,
  why:'Fuel costs MORE per litre — this only pays once the carbon price is high enough'},
 {n:'Freight consolidation (−20%)',    cap:90, si:7, cut:0.20, save:2.8,
  why:'Backhauling and fuller loads — cheap to do, quick payback'},
 {n:'Drip irrigation + moisture sensors',cap:760, si:10, cut:0.25, save:1.7,
  why:'Saves water and the energy used to pump it'},
 {n:'On-site composting of organic waste',cap:240, si:8, cut:0.30, save:1.4,
  why:'Avoids landfill methane and buys less fertiliser'},
 {n:'Low-GWP refrigerant + leak detection',cap:170, si:9, cut:0.40, save:1.2,
  why:'High-GWP gases, small tonnage — cheap insurance'}];

function rxFarm(){
  const id=document.getElementById('rx-farm').value;
  if(INDUSTRY==='farm'){
    const f=FARMS.find(x=>x.id===id)||FARMS[0];
    const k=f.net/2167;              // scale vs pilot farm
    const lib=RX_CATTLE.map(r=>({n:r[0],why:r[4],capex:r[1]*Math.sqrt(k),t:r[2]*k,opex:r[3]*k}));
    return {name:f.name,net:f.net,ci:f.intensity,unit:f.unit,tgt:null,
            yield:f.intensity?f.gross/f.intensity*1000:0,s3:f.scopeR[2]*100,lib};
  }
  const rs=HDATA.rows.filter(r=>r.fid===id); if(!rs.length) return null;
  const s=hSum(rs), ha=rs[0].ha;
  const lib=RX_HORT.map(r=>{
    let t=T(s.src[r.si])*r.cut; if(r.si2!==undefined) t+=T(s.src[r.si2])*r.cut;
    const capex=r.cap*ha;                       // capex scales with planted area
    return {n:r.n,why:r.why,capex,t,opex:capex*r.save/10};  // opex saving as a fraction of capex
  });
  return {name:rs[0].farm,net:T(s.n),ci:s.ci,unit:'kg CO₂-e / kg sold',tgt:s.tgt,
          yield:s.yld,s3:s.g?s.s3/s.g*100:0,lib};
}
window.renderROIView=function(){
  document.getElementById('rx-body').style.display='block';
  document.getElementById('rx-farm').innerHTML = INDUSTRY==='farm'
    ? FARMS.map(f=>`<option value="${f.id}">${f.name} · ${f.region}</option>`).join('')
    : [...new Map(HDATA.rows.map(r=>[r.fid,r.farm])).entries()].map(f=>`<option value="${f[0]}">${f[1]}</option>`).join('');
  renderROI();
};
window.renderROI=function(){
  const f=rxFarm(); if(!f) return;
  const budget=+document.getElementById('rx-budget').value, price=+document.getElementById('rx-price').value,
        yrs=+document.getElementById('rx-yrs').value, BUF=0.05, fmt=x=>Math.round(x).toLocaleString();
  document.getElementById('rx-bl').textContent='$'+budget.toLocaleString();
  const lib=f.lib.map(r=>{const accu=r.t*(1-BUF), rev=accu*price, benefit=rev+r.opex;
    return {...r,accu,rev,benefit,pay:benefit>0?r.capex/benefit:Infinity,ratio:r.capex>0?benefit/r.capex:0};})
    .sort((a,b)=>b.ratio-a.ratio);
  let spent=0; lib.forEach(i=>{i.pick=(spent+i.capex<=budget)&&i.benefit>0; if(i.pick)spent+=i.capex;});
  const P=lib.filter(i=>i.pick);
  const tCut=P.reduce((a,i)=>a+i.t,0), accus=Math.round(P.reduce((a,i)=>a+i.accu,0)),
        rev=P.reduce((a,i)=>a+i.rev,0), opex=P.reduce((a,i)=>a+i.opex,0), benefit=rev+opex,
        payback=benefit>0?spent/benefit:0, roi=spent>0?((benefit*yrs-spent)/spent*100):0, gain=benefit*yrs-spent, aroi=spent>0?(benefit/spent*100):0;
  const netAfter=Math.max(0,f.net-tCut), ciAfter=f.yield>0?netAfter*1000/f.yield:0, cutPct=f.net>0?tCut/f.net*100:0;
  const rows=lib.map(i=>`<tr class="${i.pick?'pick':''}">
    <td><b>${i.n}</b><div class="rx-w">${i.why}</div></td>
    <td class="n">$${fmt(i.capex)}</td><td class="n">${i.t.toFixed(1)}</td><td class="n">${Math.round(i.accu)}</td>
    <td class="n">$${fmt(i.rev)}</td>
    <td class="n" style="color:${i.opex<0?'var(--red)':'inherit'}">${i.opex<0?'−$'+fmt(-i.opex):'$'+fmt(i.opex)}</td>
    <td class="n"><b>$${fmt(i.benefit)}</b></td>
    <td class="n">${isFinite(i.pay)?i.pay.toFixed(1)+' yr':'—'}</td>
    <td style="text-align:center"><span class="rx-pill" style="background:${i.pick?'#5C8A4A':'#9aa89c'}">${i.pick?'FUNDED':'not funded'}</span></td></tr>`).join('');
  const V = INDUSTRY==='farm'
   ? [['Carbon intensity',f.ci,1.20,f.unit,'Emissions per unit of product sold.','Processors and banks ask for this, not your total — it compares a big farm and a small farm fairly.','Cut emissions or lift productivity; both push it down.']
     ,['Net emissions',f.net,2000,'t CO₂-e / yr','Gross emissions minus what your land absorbs.','This is what a net-zero target is measured against.','Reduce sources first, then increase sequestration.']
     ,['Payback period',payback,3,'years','Years for the savings to repay the capital.','Under ~3 years is normally financeable; beyond 5 needs a carbon-price story.','Fund high-benefit, low-capex actions first.']
     ,['ACCUs / year',accus,300,'credits','Verified tonnes cut, after a 5% risk buffer.','At $'+price+' each this is new income — carbon stops being purely a cost.','Register a project under a CER-approved method.']]
   : [['Carbon intensity',f.ci,f.tgt,f.unit,'Emissions per kg of marketable yield.','Retailers and exporters set targets on this number, not on your total.','Attack packaging and nitrogen first — the two biggest levers.']
     ,['Net emissions',f.net,300,'t CO₂-e / yr','Gross minus soil and biomass removals.','This is your disclosure number to the supply chain.','Cut Scope 3: packaging, fertiliser, freight.']
     ,['Payback period',payback,3,'years','Years for the savings to repay the capital.','Under ~3 years is normally financeable.','Fund the high-ratio levers before capital-heavy ones.']
     ,['Scope 3 share',f.s3,40,'% of gross','Emissions upstream of your farm gate.','60% means most of your footprint is bought in, not grown — you change it by changing what you buy.','Switch packaging format, fertiliser rate and freight.']];
  const vrows=V.map(v=>{
    const good = v[0]==='Payback period' ? (v[1]>0&&v[1]<=v[2]) : (v[0]==='ACCUs / year' ? v[1]>=v[2] : v[1]<=v[2]);
    const val = v[0]==='Payback period' ? (v[1]?v[1].toFixed(1):'—') : (v[1]<10?(+v[1]).toFixed(2):Math.round(v[1]).toLocaleString());
    return `<tr><td><b>${v[0]}</b><div class="rx-w">${v[4]}</div></td>
      <td class="rx-w"><b style="color:var(--ink)">Why it matters:</b> ${v[5]}</td>
      <td class="rx-w"><b style="color:var(--ink)">What to do:</b> ${v[6]}</td>
      <td class="n"><b>${val}</b><div class="rx-w">${v[3]}</div></td>
      <td class="n">${v[2]?(+v[2]).toFixed(2):'—'}<div class="rx-w">benchmark</div></td>
      <td style="text-align:center"><span class="rx-pill" style="background:${good?'#5C8A4A':'#C23333'}">${good?'GOOD':'ACT'}</span></td></tr>`;}).join('');
  document.getElementById('rx-out').innerHTML=`
  <div class="rx-grid">
    <div class="rx-out">
      <div style="font-size:11px;color:#9FB08C;letter-spacing:.1em">RETURN ON $${fmt(spent)} INVESTED</div>
      <div class="big">${roi>0?'+':''}${Math.round(roi)}%</div>
      <div style="font-size:12.5px;color:#D9E4CE">Total return over ${yrs} yrs · net gain $${fmt(gain)} · <b style="color:#fff">${Math.round(aroi)}%/yr</b></div>
      <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:12px">
        <div style="background:rgba(255,255,255,.08);border-radius:9px;padding:7px 11px;font-size:12px;color:#D9E4CE">Payback <b style="color:#fff">${payback?payback.toFixed(1):'—'} yr</b></div>
        <div style="background:rgba(255,255,255,.08);border-radius:9px;padding:7px 11px;font-size:12px;color:#D9E4CE">Annual benefit <b style="color:#D9A857">$${fmt(benefit)}</b></div>
        <div style="background:rgba(255,255,255,.08);border-radius:9px;padding:7px 11px;font-size:12px;color:#D9E4CE">${P.length} actions funded</div>
      </div>
    </div>
    <div class="panel"><h3>Outcome of these recommendations</h3><div class="ph">${f.name} · what actually changes if you invest</div>
      <div class="hot"><div class="hn">Net emissions</div><div class="bar"><i style="width:${Math.max(0,100-cutPct)}%;background:#123A26"></i></div><div class="hv">${fmt(f.net)} → <b>${fmt(netAfter)}</b> t</div></div>
      <div class="hot"><div class="hn">Carbon intensity</div><div class="bar"><i style="width:${f.ci?Math.min(100,ciAfter/f.ci*100):0}%;background:#5C8A4A"></i></div><div class="hv">${(+f.ci).toFixed(2)} → <b>${ciAfter.toFixed(2)}</b></div></div>
      <div class="hot"><div class="hn">Carbon cut</div><div class="bar"><i style="width:${Math.min(100,cutPct)}%;background:#A87A2A"></i></div><div class="hv"><b>${tCut.toFixed(0)} t</b> · ${cutPct.toFixed(0)}%</div></div>
      ${f.tgt?`<div style="font-size:12.5px;margin-top:10px;color:${ciAfter<=f.tgt?'#5C8A4A':'#C23333'}"><b>${ciAfter<=f.tgt?'✓ Clears':'✗ Still misses'}</b> the ${(+f.tgt).toFixed(2)} target after this investment.</div>`:''}
    </div>
  </div>
  <div class="rx-cards">
    <div class="rx-c"><div class="v">${tCut.toFixed(0)} t</div><div class="l">CO₂-e cut per year</div></div>
    <div class="rx-c gold"><div class="v">${accus.toLocaleString()}</div><div class="l">ACCUs / yr (after 5% buffer)</div></div>
    <div class="rx-c gold"><div class="v">$${fmt(rev)}</div><div class="l">carbon revenue / yr @ $${price}</div></div>
    <div class="rx-c ${opex<0?'bad':''}"><div class="v">${opex<0?'−$'+fmt(-opex):'$'+fmt(opex)}</div><div class="l">operational savings / yr</div></div>
  </div>
  <div class="panel" style="margin-bottom:18px"><h3>Recommended portfolio — what your money buys</h3>
    <div class="ph">Ranked by annual benefit per dollar of capital. Green rows fit inside your $${fmt(budget)} budget.</div>
    <table class="rx-t"><tr><th>Action</th><th class="n">Capex</th><th class="n">t CO₂-e/yr</th><th class="n">ACCUs</th><th class="n">Carbon rev</th><th class="n">Opex saving</th><th class="n">Annual benefit</th><th class="n">Payback</th><th style="text-align:center">Status</th></tr>${rows}</table>
    <p style="font-size:11.5px;color:var(--muted);margin-top:10px"><b>Indicative.</b> ACCUs = tonnes × (1 − 5% risk buffer); revenue = ACCUs × $${price}. Real credits require a CER-approved method, an approved baseline and independent verification.</p></div>
  <div class="panel"><h3>What every number means — and how you compare</h3>
    <div class="ph">Each variable: what it is, why it matters, what to do about it, your value vs the benchmark</div>
    <table class="rx-t">${vrows}</table></div>`;
};
})();
