
/* =================== INDUSTRY ROUTING =================== */
let HFARMS = [];
let INDUSTRY='farm';
const FARM_NAV=[['home','Home'],['how','How It Works'],['dashboard','Dashboard'],['input','Farm Data Input'],['ai','AI Recommendations'],['credit','Carbon Credits'],['methods','Methods & Standards'],['about','About / Impact'],['contact','Contact']];
const HORT_NAV=[['h-home','Home'],['h-how','How It Works'],['h-dash','Dashboard'],['h-input','Grower Data Input'],['h-ai','AI Recommendations'],['h-methods','Methods & Standards'],['h-about','About / Impact'],['h-contact','Contact']];
const HGATED=['h-dash','h-ai'];

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
  document.getElementById('navlinks').innerHTML = items.map(i=>`<button data-v="${i[0]}" onclick="go('${i[0]}')">${i[1]}</button>`).join('');
  refreshLocks();
}
const _origRefresh = refreshLocks;
refreshLocks = function(){
  const gated = INDUSTRY==='farm'?GATED:HGATED;
  document.querySelectorAll('#navlinks button').forEach(b=>{
    const g=gated.includes(b.dataset.v);
    b.innerHTML=b.textContent.replace(' 🔒','')+(g&&!subscribed?' <span class="lock">🔒</span>':'');
  });
};
const _origGo = go;
go = function(v){
  document.querySelectorAll('.view').forEach(s=>s.classList.toggle('show',s.dataset.view===v));
  document.querySelectorAll('#navlinks button').forEach(b=>b.classList.toggle('active',b.dataset.v===v));
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
