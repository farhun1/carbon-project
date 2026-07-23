/* =================== DATA =================== */
const WAVE=[.030,-.075,.045,.022,.034,-.012,-.022,.010,-.040,-.018,-.044,-.020];
const monthly=(net,real)=>real?real.slice():WAVE.map(w=>+(net/12*(1+w)).toFixed(1));
const target=a=>{let v=a[0]*0.99;return a.map((_,i)=>+(v*Math.pow(0.978,i)).toFixed(1));}
const scopeAbs=(g,r)=>({s1:Math.round(g*r[0]),s2:Math.round(g*r[1]),s3:Math.round(g*r[2])});
const MIX=[["Enteric CH₄",35,"r"],["Feed",25,"a"],["Manure",12,"a"],["Energy",10,"g"],["Fuel",9,"g"],["Transport",7,"g"]];
const BEEF=[["Enteric CH₄",52,"r"],["Feed",14,"a"],["Fuel",12,"a"],["Transport",9,"g"],["Manure",8,"g"],["Energy",5,"g"]];
const LOT=[["Feed",38,"r"],["Enteric CH₄",30,"r"],["Manure",14,"a"],["Transport",10,"a"],["Energy",5,"g"],["Fuel",3,"g"]];
const COL={r:"#d14a3f",a:"#df9b26",g:"#4e9d52"}, SCOL=["#2c5f2d","#6ba644","#b8881e"];

const FARMS=[
 {id:"RF-QLD-001",name:"Riverdale Cattle Farm",region:"QLD",mx:[-27.16,152.66],type:"Mixed dairy-beef",head:312,area:506,unit:"kg CO₂-e / L milk",intensity:1.38,gross:2332,net:2167,nz:9,accu:480,ndvi:0.60,paddocks:12,conf:84,scopeR:[.576,.100,.324],hot:MIX,real:[189,169.5,190.6,186.8,187.8,181,178.4,183.5,174,175.9,173.6,176.5],pred:[188.6,171.9,190.8,188.3,189.3,183,176,183.1,174.6,172.2,172.1,171.2],
  intv:[["Product carbon-intensity root-cause",238,"0.9 yr","High","r"],["Ration optimisation + 3-NOP additive",99,"2.2 yr","High","r"],["Better feed storage, diet & supplier",59,"1.2 yr","High","r"],["Covered manure storage / digester",52,"4.4 yr","Medium","a"],["Route optimisation + telematics",42,"1.2 yr","High","r"],["Solar pumps + pump efficiency",35,"3.6 yr","Medium","a"]],pilot:true},
 {id:"RF-VIC-004",name:"Greenvale Dairy",region:"VIC",mx:[-37.8,144.9],type:"Dairy",head:420,area:380,unit:"kg CO₂-e / L milk",intensity:1.16,gross:2580,net:2440,nz:15,accu:360,ndvi:0.68,paddocks:14,conf:86,scopeR:[.55,.13,.32],hot:MIX,
  intv:[["Methane-reducing feed additive",118,"2.4 yr","High","r"],["Solar + dairy-shed efficiency",62,"3.1 yr","High","r"],["Effluent pond covering",44,"4.0 yr","Medium","a"],["Nitrogen-use optimisation",21,"1.8 yr","Medium","a"]]},
 {id:"RF-TAS-007",name:"Meander Valley Dairy",region:"TAS",mx:[-41.7,146.6],type:"Dairy",head:350,area:410,unit:"kg CO₂-e / L milk",intensity:1.04,gross:1760,net:1580,nz:19,accu:280,ndvi:0.74,paddocks:13,conf:88,scopeR:[.54,.11,.35],hot:MIX,
  intv:[["Pasture & grazing optimisation",70,"2.0 yr","High","r"],["Renewable energy supply",48,"3.4 yr","High","r"],["Feed-conversion improvement",33,"1.5 yr","Medium","a"]]},
 {id:"RF-QLD-005",name:"Burnett Mixed Farms",region:"QLD",mx:[-25.6,151.6],type:"Mixed",head:280,area:640,unit:"kg CO₂-e / L milk",intensity:1.41,gross:1980,net:1840,nz:10,accu:300,ndvi:0.58,paddocks:11,conf:82,scopeR:[.58,.09,.33],hot:MIX,
  intv:[["Herd productivity & FCR review",96,"1.1 yr","High","r"],["Feed additive trial (3-NOP)",54,"2.3 yr","High","r"],["Diesel route optimisation",31,"1.2 yr","Medium","a"]]},
 {id:"RF-NSW-002",name:"Tablelands Beef Co",region:"NSW",mx:[-31.1,151.0],type:"Beef · grass-fed",head:540,area:1120,unit:"kg CO₂-e / kg LWG",intensity:11.8,gross:3850,net:3520,nz:12,accu:410,ndvi:0.55,paddocks:18,conf:81,scopeR:[.70,.05,.25],hot:BEEF,
  intv:[["Enteric methane feed strategy",182,"2.6 yr","High","r"],["Rotational grazing + NDVI monitoring",96,"2.1 yr","High","r"],["Machinery & fuel efficiency",48,"1.3 yr","Medium","a"],["Soil-carbon sequestration project",60,"4.5 yr","Medium","a"]]},
 {id:"RF-WA-003",name:"Gascoyne Station",region:"WA",mx:[-25.0,115.0],type:"Beef · rangeland",head:1250,area:8400,unit:"kg CO₂-e / kg LWG",intensity:13.2,gross:6900,net:6450,nz:7,accu:720,ndvi:0.32,paddocks:9,conf:79,scopeR:[.72,.04,.24],hot:BEEF,
  intv:[["Supplement & lick-block methane plan",340,"3.0 yr","High","r"],["Water-point solar pumping",120,"3.8 yr","High","r"],["Vegetation / sequestration project",180,"5.0 yr","Medium","a"]]},
 {id:"RF-NSW-006",name:"Riverina Feedlot",region:"NSW",mx:[-34.7,146.4],type:"Feedlot",head:2000,area:220,unit:"kg CO₂-e / kg LWG",intensity:9.4,gross:9200,net:9050,nz:5,accu:540,ndvi:0.41,paddocks:6,conf:80,scopeR:[.55,.08,.37],hot:LOT,
  intv:[["Ration reformulation + additive",430,"2.0 yr","High","r"],["Manure-to-energy (anaerobic digester)",260,"4.6 yr","High","r"],["Feed-supply transport optimisation",150,"1.4 yr","Medium","a"],["Solar array + shed efficiency",90,"3.5 yr","Medium","a"]]},
];
const STEPS=[["Farm data capture","Herd, feed, manure, fuel, energy, fertiliser, transport, weather & pasture."],
["Data integration layer","IoT sensors, FMS, invoices, API feeds and manual entry into one pipeline."],
["LCA modelling engine","Cradle-to-farm-gate · IPCC/NGER factors · CH₄, N₂O, CO₂ → CO₂-eq."],
["Emissions reporting","Scope 1/2/3, total emissions, product carbon intensity, source breakdown."],
["AI analytics engine","Detects anomalies, forecasts spikes, finds hotspots, explains root causes."],
["Sustain Pro dashboard","KPI cards, trends, hotspot maps, scope panels, alerts & scenarios."],
["Intervention engine","Threshold breached → targeted, farm-specific action recommended."],
["ACCU monetisation","Verified reductions → potential ACCUs, revenue and financial impact."],
["Continuous improvement","Results feed the next cycle — ongoing monitoring and net-zero tracking."]];
const LAYERS=[["Farm operational data","Animal count · diesel · water · energy · feed · manure · land use · transport"],
["Data integration layer","Centralises IoT, FMS, invoices & weather · connects existing tools"],
["LCA modelling engine","OpenLCA / Brightway2 · IPCC Tier 2 · NGER factors → CO₂-eq"],
["Emissions reporting & validation","Scope 1/2/3 · scenario modelling · supply-chain sharing"],
["AI analytics & data warehouse","Anomaly detection · hotspot ID · root-cause · 3-month forecast"],
["Sustain Pro dashboard","Real-time KPIs · trends · hotspot heatmaps · alerts"],
["Intervention & ACCU monetisation","Action plans · ACCU registration & revenue · net-zero tracker"]];

let subscribed=false;

/* =================== ROUTER =================== */
const GATED=["dashboard","ai","credit"];
function go(v){
  document.querySelectorAll('.view').forEach(s=>s.classList.toggle('show',s.dataset.view===v));
  document.querySelectorAll('#navlinks button').forEach(b=>b.classList.toggle('active',b.dataset.v===v));
  window.scrollTo({top:0,behavior:'smooth'});
  if(v==='dashboard') renderDashView();
  if(v==='ai') renderAIView();
  if(v==='credit') renderCreditView();
  if(v==='how') renderHow();
}
function openModal(){document.getElementById('modal').classList.add('show');}
function closeModal(){document.getElementById('modal').classList.remove('show');}

let modalMode = 'signup'; // 'signup' | 'login'
function toggleModalMode(){
  modalMode = modalMode === 'signup' ? 'login' : 'signup';
  document.getElementById('modal-title').textContent = modalMode === 'signup' ? 'Create your account' : 'Log in';
  document.getElementById('modal-submit').textContent = modalMode === 'signup' ? 'Start subscription' : 'Log in';
  document.getElementById('m-plan-fld').style.display = modalMode === 'signup' ? '' : 'none';
  document.getElementById('modal-toggle').textContent = modalMode === 'signup' ? 'Already have an account? Log in instead.' : "Don't have an account? Sign up instead.";
  document.getElementById('modal-error').style.display = 'none';
}

async function subscribe(){
  const email = document.getElementById('m-email').value.trim();
  const password = document.getElementById('m-password').value;
  const plan = document.getElementById('m-plan').value;
  const errBox = document.getElementById('modal-error');
  errBox.style.display = 'none';
  const endpoint = modalMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
  const body = modalMode === 'signup' ? { email, password, plan } : { email, password };
  try{
    const r = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await r.json();
    if(!r.ok){ errBox.textContent = data.error || 'Something went wrong.'; errBox.style.display = 'block'; return; }
    subscribed = true;
    closeModal();
    document.getElementById('authbtn').textContent = 'Subscribed ✓';
    refreshLocks();
    go(INDUSTRY === 'hort' ? 'h-dash' : 'dashboard');
  } catch(e){
    errBox.textContent = 'Could not reach the server — is the backend running?';
    errBox.style.display = 'block';
  }
}
function refreshLocks(){
  document.querySelectorAll('#navlinks button').forEach(b=>{
    const g=GATED.includes(b.dataset.v);
    b.innerHTML=b.textContent.replace(' 🔒','')+(g&&!subscribed?' <span class="lock">🔒</span>':'');
  });
}
function gateHTML(title){return `<div class="gate"><h3>🔒 ${title} is for subscribers</h3>
  <p>Subscribe to the Network plan to open any farm in Australia and view its full carbon profile, forecasts and credit opportunity.</p>
  <button class="btn-lg btn-primary" onclick="openModal()">Subscribe to view</button></div>`;}

/* =================== CHART HELPERS =================== */
function lineChart(series,opt={}){
  const W=560,H=200,pl=40,pr=14,pt=12,pb=26, all=[].concat(...series.map(s=>s.v));
  let mn=Math.min(...all),mx=Math.max(...all); mn=Math.floor((mn-(opt.pad||5))/10)*10; mx=Math.ceil((mx+(opt.pad||5))/10)*10;
  const M=["J","F","M","A","M","J","J","A","S","O","N","D"];
  const X=i=>pl+(W-pl-pr)*i/11, Y=v=>pt+(H-pt-pb)*(1-(v-mn)/(mx-mn));
  let grid="",lab="";
  for(let g=0;g<=4;g++){const v=mn+(mx-mn)*g/4,y=Y(v);grid+=`<line x1="${pl}" y1="${y}" x2="${W-pr}" y2="${y}" stroke="#eef3ea"/>`;
    lab+=`<text x="${pl-6}" y="${y+3}" text-anchor="end" font-size="9" fill="#9aa89c">${Math.round(v)}</text>`;}
  const xl=M.map((m,i)=>`<text x="${X(i)}" y="${H-8}" text-anchor="middle" font-size="9" fill="#9aa89c">${m}</text>`).join("");
  const paths=series.map(s=>`<path d="${s.v.map((v,i)=>(i?'L':'M')+X(i)+' '+Y(v)).join(' ')}" fill="none" stroke="${s.c}" stroke-width="${s.w||2.6}" ${s.dash?'stroke-dasharray="5 4"':''}/>`).join("");
  const dots=series[0]?series[0].v.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="2.5" fill="${series[0].c}"/>`).join(""):"";
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${grid}${lab}${xl}${paths}${dots}</svg>`;
}
function donut(scope){
  const t=scope.s1+scope.s2+scope.s3,seg=[scope.s1,scope.s2,scope.s3],R=52,C=2*Math.PI*R;let off=0,p="";
  seg.forEach((v,i)=>{const l=C*v/t;p+=`<circle cx="70" cy="70" r="${R}" fill="none" stroke="${SCOL[i]}" stroke-width="20" stroke-dasharray="${l} ${C-l}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`;off+=l;});
  return `<svg viewBox="0 0 140 140" width="148" height="148">${p}<circle cx="70" cy="70" r="40" fill="#fff"/>
   <text x="70" y="66" text-anchor="middle" font-family="var(--serif)" font-size="22" fill="#16201a">${(t/1000).toFixed(2)}k</text>
   <text x="70" y="84" text-anchor="middle" font-size="9" fill="#5d6c61">tCO₂-e</text></svg>`;
}
function ring(net,gross){
  const pct=Math.min(1,net/gross),R=58,C=2*Math.PI*R,l=C*pct;
  return `<svg viewBox="0 0 150 150" width="150" height="150"><circle cx="75" cy="75" r="${R}" fill="none" stroke="#eef3ea" stroke-width="14"/>
   <circle cx="75" cy="75" r="${R}" fill="none" stroke="#2c5f2d" stroke-width="14" stroke-linecap="round" stroke-dasharray="${l} ${C-l}" transform="rotate(-90 75 75)"/>
   <text x="75" y="70" text-anchor="middle" font-family="var(--serif)" font-size="29" fill="#16201a">${net.toLocaleString()}</text>
   <text x="75" y="90" text-anchor="middle" font-size="10" fill="#5d6c61">t CO₂-e net/yr</text></svg>`;
}
function gauge(pct){
  const R=46,C=Math.PI*R,l=C*pct/100;
  return `<svg viewBox="0 0 120 74" width="150"><path d="M14 64 A46 46 0 0 1 106 64" fill="none" stroke="#eef3ea" stroke-width="13" stroke-linecap="round"/>
   <path d="M14 64 A46 46 0 0 1 106 64" fill="none" stroke="#4e9d52" stroke-width="13" stroke-linecap="round" stroke-dasharray="${l} ${C-l}"/>
   <text x="60" y="58" text-anchor="middle" font-family="var(--serif)" font-size="24" fill="#16201a">${pct}%</text></svg>`;
}
/* Australia network map (stylised silhouette + farm dots) */
function ausMap(){
  const path="M104 196 L120 168 L150 150 L168 120 L182 96 L196 120 L214 110 L226 86 L240 70 L252 96 L268 88 L286 110 L330 104 L386 104 L430 116 L470 104 L496 120 L520 150 L540 150 L560 178 L572 214 L560 250 L526 268 L500 262 L484 286 L470 300 L452 322 L430 352 L398 372 L356 380 L312 376 L280 360 L250 346 L220 354 L190 344 L162 312 L138 270 L118 232 Z";
  const proj=([lat,lon])=>{const x=(lon-113)/(154-113)*(560-110)+110, y=(lat+10)/(-44+10)*(380-70)+70;return [x,y];};
  let dots="";
  FARMS.forEach((f,i)=>{const[x,y]=proj(f.mx);const c=f.hot[0][1]>=30?"#d14a3f":(f.hot[0][1]>=20?"#df9b26":"#4e9d52");
    dots+=`<g class="dotpulse" style="animation-delay:${i*0.25}s"><circle cx="${x}" cy="${y}" r="11" fill="${c}" opacity=".22"/><circle cx="${x}" cy="${y}" r="5.5" fill="${c}" stroke="#fff" stroke-width="1.5"/></g>`;});
  // Tasmania blob
  return `<svg viewBox="0 0 600 410" width="100%">
    <path d="${path}" fill="#1f4a2c" stroke="#3a6e44" stroke-width="2"/>
    <ellipse cx="430" cy="392" rx="18" ry="13" fill="#1f4a2c" stroke="#3a6e44" stroke-width="2"/>
    ${dots}
  </svg>`;
}

/* =================== HOME / mount =================== */
function fillSelect(sel){sel.innerHTML=FARMS.map(f=>`<option value="${f.id}">${f.name} · ${f.region}</option>`).join("");}
function boot(){
  const $=id=>document.getElementById(id);
  document.getElementById('ausmap').innerHTML=ausMap();
  const net=FARMS.reduce((a,f)=>a+f.net,0), accu=FARMS.reduce((a,f)=>a+f.accu,0), cut=FARMS.reduce((a,f)=>a+f.intv.reduce((b,r)=>b+r[1],0),0);
  $('hs-farms').textContent=FARMS.length; $('hs-net').textContent=(net/1000).toFixed(1)+'k'; $('hs-accu').textContent=accu.toLocaleString();
  $('im-farms').textContent=FARMS.length; $('im-net').textContent=(net/1000).toFixed(1)+'k'; $('im-cut').textContent=(cut/1000).toFixed(1)+'k'; $('im-rev').textContent='$'+Math.round(accu*38/1000)+'k';
  refreshLocks();
}
function renderHow(){
  document.getElementById('stepgrid').innerHTML=STEPS.map((s,i)=>`<div class="step"><div class="num">${i+1}</div><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join("");
  document.getElementById('layers').innerHTML=LAYERS.map((l,i)=>`<div class="panel" style="display:flex;align-items:center;gap:16px;margin-bottom:8px;padding:13px 18px">
    <div style="width:34px;height:34px;border-radius:50%;background:${i===6?'#b8881e':'#2c5f2d'};color:#fff;display:grid;place-items:center;font-family:var(--serif);font-weight:700">${i+1}</div>
    <div style="font-family:var(--serif);font-weight:700;width:280px">${l[0]}</div><div style="color:var(--muted);font-size:12.5px">${l[1]}</div></div>`).join("");
}

/* =================== DASHBOARD =================== */
