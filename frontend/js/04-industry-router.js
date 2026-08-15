
/* =================== INDUSTRY ROUTING =================== */
let HFARMS = [];
let INDUSTRY='farm';
// 3rd element 'workspace' groups the app-flow steps (Baseline -> Reduce -> Verify -> Earn)
// under one dropdown instead of listing them as flat top-level links.
const FARM_NAV=[['home','Home'],['how','How It Works'],['dashboard','Dashboard','workspace'],['input','Farm Data Input','workspace'],['ai','AI Recommendations','workspace'],['credit','Carbon Credits','workspace'],['methods','Methods & Standards'],['about','About / Impact'],['contact','Contact']];
const HORT_NAV=[['h-home','Home'],['h-how','How It Works'],['h-dash','Dashboard','workspace'],['h-input','Grower Data Input','workspace'],['h-ai','AI Recommendations','workspace'],['h-methods','Methods & Standards'],['h-about','About / Impact'],['h-contact','Contact']];
const HGATED=['h-dash','h-ai'];
// leaf nav items only - excludes the Workspace dropdown trigger, which has no data-v
// and must not be rewritten by refreshLocks()'s innerHTML replace.
const NAV_LEAF_SEL='#navlinks button:not(.nav-drop-trigger), #mobileMenu button';

function backToLanding(){document.getElementById('chooser').classList.remove('hide');window.scrollTo({top:0});}
function pickIndustry(ind){
  INDUSTRY=ind;
  document.getElementById('chooser').classList.add('hide');
  document.getElementById('sw-farm').classList.toggle('on',ind==='farm');
  document.getElementById('sw-hort').classList.toggle('on',ind==='hort');
  buildNav();
  go(ind==='farm'?'home':'h-home');
}
function buildNav(){
  const items = INDUSTRY==='farm'?FARM_NAV:HORT_NAV;
  const btn = i=>`<button data-v="${i[0]}" onclick="go('${i[0]}')">${i[1]}</button>`;
  const top = items.filter(i=>i[2]!=='workspace');
  const ws = items.filter(i=>i[2]==='workspace');
  const site1 = top.slice(0,2).map(btn).join(''); // Home, How It Works
  const site2 = top.slice(2).map(btn).join('');   // Methods, About, Contact
  const wsMenu = ws.length ? `<div class="nav-drop" id="nav-workspace">
    <button class="nav-drop-trigger" type="button" aria-haspopup="true" aria-expanded="false" onclick="toggleWorkspace(event)">Workspace <span class="care" aria-hidden="true">⌄</span></button>
    <div class="nav-drop-menu" role="menu">${ws.map(btn).join('')}</div>
  </div>` : '';
  document.getElementById('navlinks').innerHTML = site1 + wsMenu + site2;
  document.getElementById('mobileMenu').innerHTML = items.map(btn).join('') +
    '<button class="mm-cta" onclick="closeMobileMenu();openModal()">Subscribe</button>';
  refreshLocks();
}
function toggleWorkspace(e){
  e.stopPropagation();
  const d=document.getElementById('nav-workspace'); if(!d) return;
  const open=!d.classList.contains('open');
  d.classList.toggle('open',open);
  d.querySelector('.nav-drop-trigger').setAttribute('aria-expanded',String(open));
}
function closeWorkspaceMenu(){
  const d=document.getElementById('nav-workspace'); if(!d) return;
  d.classList.remove('open');
  d.querySelector('.nav-drop-trigger').setAttribute('aria-expanded','false');
}
function toggleMobileMenu(e){
  if(e) e.stopPropagation();
  const panel=document.getElementById('mobileMenu'), btn=document.getElementById('menuBtn');
  const open=!panel.classList.contains('open');
  panel.classList.toggle('open',open);
  btn.setAttribute('aria-expanded',String(open));
}
function closeMobileMenu(){
  const panel=document.getElementById('mobileMenu'), btn=document.getElementById('menuBtn');
  if(!panel||!panel.classList.contains('open')) return;
  panel.classList.remove('open');
  btn.setAttribute('aria-expanded','false');
}
document.addEventListener('click',()=>{closeWorkspaceMenu();closeMobileMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeWorkspaceMenu();closeMobileMenu();}});
const _origRefresh = refreshLocks;
refreshLocks = function(){
  const gated = INDUSTRY==='farm'?GATED:HGATED;
  document.querySelectorAll(NAV_LEAF_SEL).forEach(b=>{
    const g=gated.includes(b.dataset.v);
    b.innerHTML=b.textContent.replace(' 🔒','')+(g&&!subscribed?' <span class="lock">🔒</span>':'');
  });
};
const _origGo = go;
go = function(v){
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
  if(v==='h-home') hBoot();
  if(v==='h-how') renderHHow();
  if(v==='h-dash') renderHDashView();
  if(v==='h-ai') renderHAIView();
  if(v==='h-methods') renderHMethods();
};

/* =================== HORTICULTURE =================== */
