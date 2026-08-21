/* =================== DATA =================== */
const WAVE=[.030,-.075,.045,.022,.034,-.012,-.022,.010,-.040,-.018,-.044,-.020];
const monthly=(net,real)=>real?real.slice():WAVE.map(w=>+(net/12*(1+w)).toFixed(1));
const target=a=>{let v=a[0]*0.99;return a.map((_,i)=>+(v*Math.pow(0.978,i)).toFixed(1));}
const scopeAbs=(g,r)=>({s1:Math.round(g*r[0]),s2:Math.round(g*r[1]),s3:Math.round(g*r[2])});
const MIX=[["Enteric CH₄",35,"r"],["Feed",25,"a"],["Manure",12,"a"],["Energy",10,"g"],["Fuel",9,"g"],["Transport",7,"g"]];
const BEEF=[["Enteric CH₄",52,"r"],["Feed",14,"a"],["Fuel",12,"a"],["Transport",9,"g"],["Manure",8,"g"],["Energy",5,"g"]];
const LOT=[["Feed",38,"r"],["Enteric CH₄",30,"r"],["Manure",14,"a"],["Transport",10,"a"],["Energy",5,"g"],["Fuel",3,"g"]];
const COL={r:"#C23333",a:"#D89A2E",g:"#5C8A4A"}, SCOL=["#123A26","#5C8A4A","#A87A2A"];

let FARMS = [];
const STEPS=[["Farm data capture","Herd, feed, manure, fuel, energy, fertiliser, transport, weather & pasture."],
["Data integration layer","IoT sensors, FMS, invoices, API feeds and manual entry into one pipeline."],
["LCA modelling engine","Cradle-to-farm-gate · IPCC/NGER factors · CH₄, N₂O, CO₂ → CO₂-eq."],
["Emissions reporting","Scope 1/2/3, total emissions, product carbon intensity, source breakdown."],
["AI analytics engine","Detects anomalies, forecasts spikes, finds hotspots, explains root causes."],
["Sustenora dashboard","KPI cards, trends, hotspot maps, scope panels, alerts & scenarios."],
["Intervention engine","Threshold breached → targeted, farm-specific action recommended."],
["ACCU monetisation","Verified reductions → potential ACCUs, revenue and financial impact."],
["Continuous improvement","Results feed the next cycle — ongoing monitoring and net-zero tracking."]];
const LAYERS=[["Farm operational data","Animal count · diesel · water · energy · feed · manure · land use · transport"],
["Data integration layer","Centralises IoT, FMS, invoices & weather · connects existing tools"],
["LCA modelling engine","OpenLCA / Brightway2 · IPCC Tier 2 · NGER factors → CO₂-eq"],
["Emissions reporting & validation","Scope 1/2/3 · scenario modelling · supply-chain sharing"],
["AI analytics & data warehouse","Anomaly detection · hotspot ID · root-cause · 3-month forecast"],
["Sustenora dashboard","Real-time KPIs · trends · hotspot heatmaps · alerts"],
["Intervention & ACCU monetisation","Action plans · ACCU registration & revenue · net-zero tracker"]];

let subscribed=false;

/* =================== ROUTER =================== */
const GATED=["dashboard","ai","credit"];
// NOTE: redefined in js/04-industry-router.js once it loads (adds the Workspace
// dropdown + mobile-menu handling); this copy only runs if called before that script
// executes, which the current boot sequence never does.
function go(v){
  document.querySelectorAll('.view').forEach(s=>s.classList.toggle('show',s.dataset.view===v));
  document.querySelectorAll(NAV_LEAF_SEL).forEach(b=>b.classList.toggle('active',b.dataset.v===v));
  const wsTrigger=document.querySelector('#nav-workspace .nav-drop-trigger');
  if(wsTrigger) wsTrigger.classList.toggle('active',!!document.querySelector(`#nav-workspace [data-v="${v}"]`));
  closeWorkspaceMenu(); closeMobileMenu();
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

// Mirrors the server-side check in backend/routes/auth.js - keep the two in sync.
function passwordPolicyError(password){
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character.';
  return null;
}

async function subscribe(){
  const email = document.getElementById('m-email').value.trim();
  const password = document.getElementById('m-password').value;
  const plan = document.getElementById('m-plan').value;
  const errBox = document.getElementById('modal-error');
  errBox.style.display = 'none';
  if (modalMode === 'signup') {
    const policyError = passwordPolicyError(password);
    if (policyError) { errBox.textContent = policyError; errBox.style.display = 'block'; return; }
  }
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
// NOTE: also redefined in js/04-industry-router.js - see the comment on go() above.
function refreshLocks(){
  document.querySelectorAll(NAV_LEAF_SEL).forEach(b=>{
    const g=GATED.includes(b.dataset.v);
    b.innerHTML=b.textContent.replace(' 🔒','')+(g&&!subscribed?' <span class="lock">🔒</span>':'');
  });
}
function gateHTML(title){return `<div class="gate"><h3>🔒 ${title} is for subscribers</h3>
  <p>Subscribe to the Network plan to open any farm in Australia and view its full carbon profile, forecasts and credit opportunity.</p>
  <button class="btn-lg btn-primary" onclick="openModal()">Subscribe to view</button></div>`;}
async function submitLead(industry){
  const $=id=>document.getElementById(id);
  const isFarm = industry === 'farm';
  const body = {
    industry,
    name: $(isFarm?'c-name':'hc-name').value,
    organisation: $(isFarm?'c-org':'hc-org').value,
    email: $(isFarm?'c-email':'hc-email').value,
    roleOrCrop: $(isFarm?'c-role':'hc-crop').value,
    message: $(isFarm?'c-message':'hc-message').value,
  };
  try{
    const r = await fetch('/api/leads', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    alert(r.ok ? 'Thanks — we\'ll be in touch.' : 'Something went wrong sending your message — please try again.');
  } catch(e){
    alert('Could not reach the server — please try again.');
  }
}

/* =================== CHART HELPERS =================== */
function lineChart(series,opt={}){
  const W=560,H=200,pl=40,pr=14,pt=12,pb=26, all=[].concat(...series.map(s=>s.v));
  let mn=Math.min(...all),mx=Math.max(...all); mn=Math.floor((mn-(opt.pad||5))/10)*10; mx=Math.ceil((mx+(opt.pad||5))/10)*10;
  const M=["J","F","M","A","M","J","J","A","S","O","N","D"];
  const X=i=>pl+(W-pl-pr)*i/11, Y=v=>pt+(H-pt-pb)*(1-(v-mn)/(mx-mn));
  let grid="",lab="";
  for(let g=0;g<=4;g++){const v=mn+(mx-mn)*g/4,y=Y(v);grid+=`<line x1="${pl}" y1="${y}" x2="${W-pr}" y2="${y}" stroke="#EEF0E4"/>`;
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
   <text x="70" y="66" text-anchor="middle" font-family="var(--serif)" font-size="22" fill="#1B211C">${(t/1000).toFixed(2)}k</text>
   <text x="70" y="84" text-anchor="middle" font-size="9" fill="#6B655D">tCO₂-e</text></svg>`;
}
function ring(net,gross){
  const pct=Math.min(1,net/gross),R=58,C=2*Math.PI*R,l=C*pct;
  return `<svg viewBox="0 0 150 150" width="150" height="150"><circle cx="75" cy="75" r="${R}" fill="none" stroke="#EEF0E4" stroke-width="14"/>
   <circle cx="75" cy="75" r="${R}" fill="none" stroke="#123A26" stroke-width="14" stroke-linecap="round" stroke-dasharray="${l} ${C-l}" transform="rotate(-90 75 75)"/>
   <text x="75" y="70" text-anchor="middle" font-family="var(--serif)" font-size="29" fill="#1B211C">${net.toLocaleString()}</text>
   <text x="75" y="90" text-anchor="middle" font-size="10" fill="#6B655D">t CO₂-e net/yr</text></svg>`;
}
function gauge(pct){
  const R=46,C=Math.PI*R,l=C*pct/100;
  return `<svg viewBox="0 0 120 74" width="150"><path d="M14 64 A46 46 0 0 1 106 64" fill="none" stroke="#EEF0E4" stroke-width="13" stroke-linecap="round"/>
   <path d="M14 64 A46 46 0 0 1 106 64" fill="none" stroke="#5C8A4A" stroke-width="13" stroke-linecap="round" stroke-dasharray="${l} ${C-l}"/>
   <text x="60" y="58" text-anchor="middle" font-family="var(--serif)" font-size="24" fill="#1B211C">${pct}%</text></svg>`;
}
/* Australia network map (stylised silhouette + farm dots) */
function ausMap(){
  const path="M104 196 L120 168 L150 150 L168 120 L182 96 L196 120 L214 110 L226 86 L240 70 L252 96 L268 88 L286 110 L330 104 L386 104 L430 116 L470 104 L496 120 L520 150 L540 150 L560 178 L572 214 L560 250 L526 268 L500 262 L484 286 L470 300 L452 322 L430 352 L398 372 L356 380 L312 376 L280 360 L250 346 L220 354 L190 344 L162 312 L138 270 L118 232 Z";
  const proj=([lat,lon])=>{const x=(lon-113)/(154-113)*(560-110)+110, y=(lat+10)/(-44+10)*(380-70)+70;return [x,y];};
  let dots="";
  FARMS.forEach((f,i)=>{const[x,y]=proj(f.mx);const c=f.hot[0][1]>=30?"#C23333":(f.hot[0][1]>=20?"#D89A2E":"#5C8A4A");
    dots+=`<g class="dotpulse" style="animation-delay:${i*0.25}s"><circle cx="${x}" cy="${y}" r="11" fill="${c}" opacity=".22"/><circle cx="${x}" cy="${y}" r="5.5" fill="${c}" stroke="#fff" stroke-width="1.5"/></g>`;});
  // Tasmania blob
  return `<svg viewBox="0 0 600 410" width="100%">
    <path d="${path}" fill="#123A26" stroke="#3E6B4A" stroke-width="2"/>
    <ellipse cx="430" cy="392" rx="18" ry="13" fill="#123A26" stroke="#3E6B4A" stroke-width="2"/>
    ${dots}
  </svg>`;
}

/* =================== HOME / mount =================== */
function fillSelect(sel){sel.innerHTML=FARMS.map(f=>`<option value="${f.id}">${f.name} · ${f.region}</option>`).join("");}
async function boot(){
  const [farms, hfarms, hdata] = await Promise.all([
    fetch('/api/network/farms?industry=farm').then(r=>r.json()),
    fetch('/api/network/farms?industry=hort').then(r=>r.json()),
    fetch('/api/network/hort-monthly').then(r=>r.json()),
  ]);
  FARMS = farms; HFARMS = hfarms; HDATA = hdata; SN = HDATA.srcNames;
  const $=id=>document.getElementById(id);
  document.getElementById('ausmap').innerHTML=ausMap();
  const net=FARMS.reduce((a,f)=>a+f.net,0), accu=FARMS.reduce((a,f)=>a+f.accu,0), cut=FARMS.reduce((a,f)=>a+f.intv.reduce((b,r)=>b+r[1],0),0);
  $('hs-farms').textContent=FARMS.length; $('hs-net').textContent=(net/1000).toFixed(1)+'k'; $('hs-accu').textContent=accu.toLocaleString();
  $('im-farms').textContent=FARMS.length; $('im-net').textContent=(net/1000).toFixed(1)+'k'; $('im-cut').textContent=(cut/1000).toFixed(1)+'k'; $('im-rev').textContent='$'+Math.round(accu*38/1000)+'k';
  refreshLocks();
}
/* =================== DASHBOARD =================== */
