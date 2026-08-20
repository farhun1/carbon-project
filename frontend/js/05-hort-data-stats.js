const HSRC=['Fuel','Electricity','Soil N₂O','Fertiliser (upstream)','Lime & urea','Chemicals','Packaging','Transport','Waste','Refrigeration','Water','Planting materials'];
const HCOL={'Packaging':'#B08429','Soil N₂O':'#8C3B1E','Fuel':'#8C3B1E','Electricity':'#2E6F7E','Fertiliser (upstream)':'#B08429',
 'Planting materials':'#B08429','Chemicals':'#B08429','Transport':'#B08429','Lime & urea':'#8C3B1E','Waste':'#B08429','Water':'#2E6F7E','Refrigeration':'#8C3B1E'};
const HSTEPS=[['Crop data capture','Yield, area, fuel, energy, fertiliser, packaging, freight, water.'],
['Factor library','111 NGER / IPCC factors — each graded by confidence.'],
['LCA engine','Cradle-to-farm-gate · 12 sources → CO₂-e by Scope 1·2·3.'],
['Removals','Soil carbon and biomass subtracted to give net.'],
['Intensity','Net ÷ marketable yield = kg CO₂-e per kg sold.'],
['Benchmark','Compared to a crop-specific target — over or under.'],
['Abatement','AI ranks levers by tonnes saved and cost.'],
['Report','Retailer- and auditor-ready Scope 3 disclosure.'],
['Improve','Results feed the next season.']];

function hStats(){
  const gross=HFARMS.reduce((a,f)=>a+f.gross,0), net=HFARMS.reduce((a,f)=>a+f.net,0);
  const ci=HFARMS.reduce((a,f)=>a+f.ci,0)/HFARMS.length;
  return {gross,net,ci};
}
function hBoot(){
  const s=hStats();
  const el=id=>document.getElementById(id);
  if(el('hh-farms')){ el('hh-farms').textContent=HFARMS.length; el('hh-net').textContent=(s.net/1000).toFixed(1)+'k'; el('hh-ci').textContent=s.ci.toFixed(2); }
  const m=el('hausmap'); if(m) m.innerHTML=hAusMap();
}
function hAusMap(){
  const path="M104 196 L120 168 L150 150 L168 120 L182 96 L196 120 L214 110 L226 86 L240 70 L252 96 L268 88 L286 110 L330 104 L386 104 L430 116 L470 104 L496 120 L520 150 L540 150 L560 178 L572 214 L560 250 L526 268 L500 262 L484 286 L470 300 L452 322 L430 352 L398 372 L356 380 L312 376 L280 360 L250 346 L220 354 L190 344 L162 312 L138 270 L118 232 Z";
  const P={NSW:[[470,300]],VIC:[[430,340]],QLD:[[440,190]],SA:[[350,290]],WA:[[190,270]],TAS:[[430,392]]};
  const used={}; let dots='';
  HFARMS.forEach((f,i)=>{
    const b=P[f.state]?P[f.state][0]:[400,280];
    used[f.state]=(used[f.state]||0)+1; const k=used[f.state];
    const x=b[0]+((k-1)%3)*16-14, y=b[1]+Math.floor((k-1)/3)*16-8;
    const over=f.ci>f.tgt, c=over?'#A8352B':'#4C7A4A';
    dots+=`<g class="dotpulse" style="animation-delay:${i*0.15}s"><circle cx="${x}" cy="${y}" r="9" fill="${c}" opacity=".22"/><circle cx="${x}" cy="${y}" r="4.5" fill="${c}" stroke="#fff" stroke-width="1.4"/></g>`;
  });
  return `<svg viewBox="0 0 600 410" width="100%"><path d="${path}" fill="#123A26" stroke="#3E6B4A" stroke-width="2"/>
   <ellipse cx="430" cy="392" rx="18" ry="13" fill="#123A26" stroke="#3E6B4A" stroke-width="2"/>${dots}</svg>`;
}
let HDATA = { srcNames: [], rows: [] };

/* ================= HORTICULTURE DASHBOARD — full 7-page replica ================= */
const HPAGES=[['overview','Executive overview'],['sources','Emission sources'],['bench','Farm benchmarking'],
 ['resource','Resource efficiency'],['confidence','Data confidence'],['abate','Abatement'],['factors','Factor library']];
let hPage='overview';
let SN=HDATA.srcNames; // reassigned in boot() once HDATA is fetched — see 01-data-core.js
const HSCOL=['#8C3B1E','#2E6F7E','#C05A2C','#B08429','#8A8F5E','#6D5A8C','#B08429','#4E8FA8','#4A5D6B','#6E7569','#2E6F7E','#3C6140'];
const hf=(x,d)=>Number(x).toLocaleString(undefined,{minimumFractionDigits:d||0,maximumFractionDigits:d||0});
const T=kg=>kg/1000;

function hMonths(){return [...new Set(HDATA.rows.map(r=>r.m))].sort();}
function hInitFilters(){
  const ms=hMonths(), uniq=k=>[...new Set(HDATA.rows.map(r=>r[k]))].sort();
  const fill=(id,arr,all)=>{const s=document.getElementById(id);
    s.innerHTML=(all?`<option value="ALL">${all}</option>`:'')+arr.map(v=>`<option value="${v}">${v}</option>`).join('');};
  fill('fFrom',ms); fill('fTo',ms); document.getElementById('fFrom').value=ms[0]; document.getElementById('fTo').value=ms[ms.length-1];
  fill('fState',uniq('st'),'All states'); fill('fCrop',uniq('crop'),'All crops');
  fill('fSys',uniq('sys'),'All systems'); fill('fPri',['High','Medium','Low'],'All priorities');
  const farms=[...new Map(HDATA.rows.map(r=>[r.fid,r.farm])).entries()];
  document.getElementById('hfarmsel').innerHTML='<option value="ALL">All growers</option>'+farms.map(f=>`<option value="${f[0]}">${f[1]}</option>`).join('');
}
function hResetFilters(){hInitFilters();renderHDash();}
function hRows(){
  const v=id=>document.getElementById(id)?document.getElementById(id).value:'ALL';
  const f=v('fFrom'),t=v('fTo'),st=v('fState'),cr=v('fCrop'),sy=v('fSys'),pr=v('fPri'),fm=v('hfarmsel');
  return HDATA.rows.filter(r=>r.m>=f&&r.m<=t&&(st==='ALL'||r.st===st)&&(cr==='ALL'||r.crop===cr)
    &&(sy==='ALL'||r.sys===sy)&&(pr==='ALL'||r.pri===pr)&&(fm==='ALL'||r.fid===fm));
}
function hSum(rows){
  const s={g:0,rm:0,n:0,s1:0,s2:0,s3:0,yld:0,ha:new Set(),dsl:0,kwh:0,kl:0,nkg:0,pkg:0,src:SN.map(()=>0),farms:new Set()};
  rows.forEach(r=>{s.g+=r.g;s.rm+=r.rm;s.n+=r.n;s.s1+=r.s1;s.s2+=r.s2;s.s3+=r.s3;s.yld+=r.yld;
    s.dsl+=r.dsl;s.kwh+=r.kwh;s.kl+=r.kl;s.nkg+=r.nkg;s.pkg+=r.pkg;s.farms.add(r.fid);
    r.src.forEach((v,i)=>s.src[i]+=v);});
  s.ci=s.yld?s.g/s.yld:0;
  const tw=rows.reduce((a,r)=>a+r.tgt*r.yld,0); s.tgt=s.yld?tw/s.yld:0;
  return s;
}
function hKPI(l,v,u,d,acc){return `<div class="hkpi ${acc?'accent':''}"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${u||''}${d?' · '+d:''}</div></div>`;}

/* ---- tooltip ---- */
let _tip;
function hTip(){if(!_tip){_tip=document.createElement('div');_tip.style.cssText='position:fixed;z-index:200;background:#1C221C;color:#fff;padding:8px 10px;border-radius:4px;font-size:11.5px;line-height:1.5;pointer-events:none;display:none;max-width:230px;box-shadow:0 6px 20px rgba(0,0,0,.3)';document.body.appendChild(_tip);}return _tip;}
function bind(el,html){const t=hTip();
  el.style.cursor='pointer';
  el.addEventListener('mousemove',e=>{t.innerHTML=html;t.style.display='block';
    t.style.left=Math.min(window.innerWidth-245,e.clientX+14)+'px';t.style.top=(e.clientY+14)+'px';});
  el.addEventListener('mouseleave',()=>{t.style.display='none';});}
const ticks=(max,n)=>Array.from({length:n},(_,i)=>max*(i+1)/n);
const nice=v=>{const p=Math.pow(10,Math.floor(Math.log10(v||1)));return Math.ceil(v/p*2)/2*p;};

/* ---- 01 diverging monthly balance: emissions above, removals below ---- */
function hMonthly(rows,months){
  const W=700,H=320,L=46,R=8,TP=10,B=34;
  const m=months.map(mo=>{const sub=rows.filter(r=>r.m===mo);
    return {mo,s1:sub.reduce((a,r)=>a+r.s1,0)/1000,s2:sub.reduce((a,r)=>a+r.s2,0)/1000,
      s3:sub.reduce((a,r)=>a+r.s3,0)/1000,rm:sub.reduce((a,r)=>a+r.rm,0)/1000,
      g:sub.reduce((a,r)=>a+r.g,0)/1000,n:sub.reduce((a,r)=>a+r.n,0)/1000};});
  const up=nice(Math.max(...m.map(d=>d.g),1)), dn=nice(Math.max(...m.map(d=>d.rm),0.001));
  const plotH=H-TP-B, zeroY=TP+plotH*(up/(up+dn));
  const yU=v=>zeroY-(v/up)*(zeroY-TP), yD=v=>zeroY+(v/dn)*(H-B-zeroY);
  const bw=(W-L-R)/Math.max(m.length,1), bar=Math.min(30,bw*0.62);
  let s='';
  ticks(up,4).forEach(v=>{s+=`<line x1="${L}" x2="${W-R}" y1="${yU(v)}" y2="${yU(v)}" stroke="#DDE0D6"/><text x="${L-7}" y="${yU(v)+3}" text-anchor="end" font-size="9" fill="#6E7569" font-family="ui-monospace,monospace">${hf(v)}</text>`;});
  if(dn>0.01) s+=`<line x1="${L}" x2="${W-R}" y1="${yD(dn)}" y2="${yD(dn)}" stroke="#DDE0D6"/><text x="${L-7}" y="${yD(dn)+3}" text-anchor="end" font-size="9" fill="#3C6140" font-family="ui-monospace,monospace">−${hf(dn)}</text>`;
  m.forEach((d,i)=>{const x=L+i*bw+(bw-bar)/2; let acc=0;
    [['s1','#8C3B1E'],['s2','#2E6F7E'],['s3','#B08429']].forEach(([k,c])=>{const v=d[k];
      s+=`<rect class="mb" data-i="${i}" data-k="${k}" x="${x}" y="${yU(acc+v)}" width="${bar}" height="${Math.max(0,yU(acc)-yU(acc+v))}" fill="${c}"/>`;acc+=v;});
    if(d.rm>0) s+=`<rect class="mb" data-i="${i}" data-k="rm" x="${x}" y="${zeroY}" width="${bar}" height="${Math.max(0,yD(d.rm)-zeroY)}" fill="#3C6140"/>`;
    s+=`<text x="${x+bar/2}" y="${H-12}" text-anchor="middle" font-size="8" fill="#6E7569">${d.mo.slice(5)}</text>`;});
  s+=`<line x1="${L}" x2="${W-R}" y1="${zeroY}" y2="${zeroY}" stroke="#1C221C" stroke-width="1.4"/>`;
  return {svg:`<svg viewBox="0 0 ${W} ${H}" width="100%">${s}</svg>`, m};
}
/* ---- 01 semicircular gauge ---- */
function hGauge(inten,tg){
  const W=340,H=180,cx=170,cy=140,rad=110,th=26;
  const max=Math.max(inten,tg)*1.35||1, over=inten>tg;
  const A=v=>Math.PI+Math.min(1,v/max)*Math.PI;
  const arc=(a0,a1,col,t)=>{const x0=cx+(rad-t/2)*Math.cos(a0),y0=cy+(rad-t/2)*Math.sin(a0),
    x1=cx+(rad-t/2)*Math.cos(a1),y1=cy+(rad-t/2)*Math.sin(a1);
    return `<path d="M${x0} ${y0} A${rad-t/2} ${rad-t/2} 0 ${a1-a0>Math.PI?1:0} 1 ${x1} ${y1}" stroke="${col}" stroke-width="${t}" fill="none"/>`;};
  const tA=A(tg);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">
    ${arc(Math.PI,2*Math.PI,'#E4E7DD',th)}
    ${arc(Math.PI,A(inten),over?'#A8352B':'#4C7A4A',th)}
    <line x1="${cx+(rad-th-7)*Math.cos(tA)}" y1="${cy+(rad-th-7)*Math.sin(tA)}" x2="${cx+(rad+7)*Math.cos(tA)}" y2="${cy+(rad+7)*Math.sin(tA)}" stroke="#1C221C" stroke-width="2.5"/>
    <text x="${cx-rad+2}" y="${cy+16}" text-anchor="middle" font-size="9" fill="#6E7569">0</text>
    <text x="${cx+rad-2}" y="${cy+16}" text-anchor="middle" font-size="9" fill="#6E7569">${max.toFixed(2)}</text>
    <text x="${cx}" y="${cy-14}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="34" fill="${over?'#A8352B':'#4C7A4A'}">${inten.toFixed(3)}</text>
    <text x="${cx}" y="${cy+6}" text-anchor="middle" font-size="10.5" fill="#6E7569">kg CO₂-e / kg · target ${tg.toFixed(3)}</text>
    <text x="${cx}" y="${cy+30}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="12" fill="${over?'#A8352B':'#4C7A4A'}">${over?'+':''}${(tg?(inten/tg-1)*100:0).toFixed(1)}% vs target</text></svg>`;
}
/* ---- 01 scope ribbon ---- */
function hRibbon(s1,s2,s3){
  const g=s1+s2+s3||1;
  const P=[['Scope 1','#8C3B1E',s1,'Fuel, soil N₂O, lime &amp; urea, refrigerant'],
           ['Scope 2','#2E6F7E',s2,'Purchased grid electricity'],
           ['Scope 3','#B08429',s3,'Fertiliser, packaging, freight, chemicals, water, seedlings']];
  return `<div style="display:flex;height:34px;border-radius:3px;overflow:hidden" id="hribbon">${P.map((p,i)=>
    `<div data-i="${i}" style="width:${p[2]/g*100}%;background:${p[1]};color:#fff;font-size:11px;display:grid;place-items:center;font-family:ui-monospace,monospace">${p[2]/g>0.08?Math.round(p[2]/g*100)+'%':''}</div>`).join('')}</div>
    <div style="display:flex;gap:14px;margin-top:8px;flex-wrap:wrap">${P.map(p=>`<span style="font-size:10.5px;color:#6E7569"><i style="display:inline-block;width:9px;height:9px;background:${p[1]};margin-right:4px"></i>${p[0]} · ${hf(T(p[2]))} t</span>`).join('')}</div>`;
}
/* ---- 01 stacked columns by dimension (switchable) ---- */
let hGroup='st';
function hByScope(rows){
  const W=700,H=250,L=46,R=10,TP=10,B=48;
  const by={};
  rows.forEach(r=>{const k=r[hGroup]; (by[k]=by[k]||{k,s1:0,s2:0,s3:0}); by[k].s1+=r.s1;by[k].s2+=r.s2;by[k].s3+=r.s3;});
  const items=Object.values(by).map(d=>({...d,tot:d.s1+d.s2+d.s3})).sort((a,b)=>b.tot-a.tot);
  const max=nice(Math.max(...items.map(d=>d.tot/1000),0.001));
  const y=v=>H-B-(v/max)*(H-B-TP);
  const bw=(W-L-R)/Math.max(items.length,1), bar=Math.min(56,bw*0.6);
  let s='';
  ticks(max,4).forEach(v=>{s+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#DDE0D6"/><text x="${L-7}" y="${y(v)+3}" text-anchor="end" font-size="9" fill="#6E7569" font-family="ui-monospace,monospace">${hf(v)}</text>`;});
  items.forEach((d,i)=>{const x=L+i*bw+(bw-bar)/2; let acc=0;
    [['s1','#8C3B1E'],['s2','#2E6F7E'],['s3','#B08429']].forEach(([k,c])=>{const v=d[k]/1000;
      s+=`<rect class="bs" data-i="${i}" data-k="${k}" x="${x}" y="${y(acc+v)}" width="${bar}" height="${Math.max(0,y(acc)-y(acc+v))}" fill="${c}"/>`;acc+=v;});
    const lab=String(d.k).length>13?String(d.k).slice(0,12)+'…':d.k;
    s+=`<text x="${x+bar/2}" y="${H-B+15}" text-anchor="${items.length>6?'end':'middle'}" font-size="9" fill="#6E7569" ${items.length>6?`transform="rotate(-32 ${x+bar/2} ${H-B+15})"`:''}>${lab}</text>`;});
  s+=`<line x1="${L}" x2="${W-R}" y1="${H-B}" y2="${H-B}" stroke="#1C221C"/>`;
  return {svg:`<svg viewBox="0 0 ${W} ${H}" width="100%">${s}</svg>`, items};
}
window.hSetGroup=function(g){hGroup=g;renderHDash();};
/* ---- 02 squarified treemap ---- */
function hTreemap(rows){
  const W=700,H=360;
  const items=SN.map((n,i)=>({n,i,v:T(rows.reduce((a,r)=>a+r.src[i],0))})).filter(d=>d.v>0).sort((a,b)=>b.v-a.v);
  const total=items.reduce((a,d)=>a+d.v,0)||1;
  const out=[]; let x=0,y=0,w=W,h=H,rest=items.slice(), scale=W*H/total;
  const worst=(row,len)=>{const s=row.reduce((a,d)=>a+d.v*scale,0);
    const mx=Math.max(...row.map(d=>d.v*scale)), mn=Math.min(...row.map(d=>d.v*scale));
    return Math.max(len*len*mx/(s*s), s*s/(len*len*mn));};
  while(rest.length){
    const horiz=w>=h, len=horiz?h:w; let row=[rest[0]],i=1;
    while(i<rest.length && worst(row.concat(rest[i]),len)<=worst(row,len)){row.push(rest[i]);i++;}
    const s=row.reduce((a,d)=>a+d.v*scale,0), thick=s/len; let off=0;
    row.forEach(d=>{const side=d.v*scale/thick;
      out.push(horiz?{...d,x,y:y+off,w:thick,h:side}:{...d,x:x+off,y,w:side,h:thick}); off+=side;});
    if(horiz){x+=thick;w-=thick;}else{y+=thick;h-=thick;}
    rest=rest.slice(row.length);
  }
  const svg=out.map(d=>{const p=d.v/total*100, big=d.w>66&&d.h>40;
    return `<g class="tm" data-i="${d.i}"><rect x="${d.x+1}" y="${d.y+1}" width="${Math.max(0,d.w-2)}" height="${Math.max(0,d.h-2)}" fill="${HSCOL[d.i]}"/>
      ${big?`<text x="${d.x+9}" y="${d.y+21}" font-size="12" fill="#fff" font-family="system-ui">${d.n}</text>
      <text x="${d.x+9}" y="${d.y+38}" font-size="12" fill="#fff" font-family="ui-monospace,monospace">${hf(d.v)} t · ${p.toFixed(1)}%</text>`:''}</g>`;}).join('');
  return {svg:`<svg viewBox="0 0 ${W} ${H}" width="100%">${svg}</svg>`, items, total};
}
/* ---- generic bars ---- */
function svgBars(items,opt){
  const W=480,rh=(opt&&opt.rh)||20,gap=6,H=items.length*(rh+gap)+8,x0=(opt&&opt.lw)||118;
  const max=Math.max(...items.map(i=>i[1]),1);
  let s='';items.forEach((it,i)=>{const y=4+i*(rh+gap),w=(W-x0-58)*it[1]/max;
    s+=`<text x="${x0-6}" y="${y+rh/2+4}" text-anchor="end" font-size="10.5" fill="#1C221C" font-family="system-ui">${it[0]}</text>
        <rect x="${x0}" y="${y}" width="${Math.max(1,w)}" height="${rh}" fill="${it[2]||'#8C3B1E'}"/>
        <text x="${x0+w+5}" y="${y+rh/2+4}" font-size="10" fill="#6E7569" font-family="ui-monospace,monospace">${hf(it[1],(opt&&opt.dec)||0)}${(opt&&opt.suf)||''}</text>`;});
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${s}</svg>`;
}
function svgLine(series,opt){
  const W=520,H=190,pl=44,pr=12,pt=12,pb=26,all=[].concat(...series.map(s=>s.v));
  let mn=Math.min(...all),mx=Math.max(...all);
  if(opt&&opt.zero) mn=Math.min(0,mn);
  const pad=(mx-mn)*0.15||1; mn-=pad; mx+=pad;
  const n=series[0].v.length, X=i=>pl+(W-pl-pr)*i/(n-1||1), Y=v=>pt+(H-pt-pb)*(1-(v-mn)/(mx-mn));
  let g='',lab='';
  for(let k=0;k<=4;k++){const val=mn+(mx-mn)*k/4,y=Y(val);
    g+=`<line x1="${pl}" y1="${y}" x2="${W-pr}" y2="${y}" stroke="#DDE0D6"/>`;
    lab+=`<text x="${pl-5}" y="${y+3}" text-anchor="end" font-size="9" fill="#6E7569" font-family="ui-monospace,monospace">${hf(val,(opt&&opt.dec)||0)}</text>`;}
  const xl=((opt&&opt.labels)||[]).map((m,i)=>`<text x="${X(i)}" y="${H-8}" text-anchor="middle" font-size="8.5" fill="#6E7569">${m}</text>`).join('');
  const paths=series.map(s=>`<path d="${s.v.map((v,i)=>(i?'L':'M')+X(i)+' '+Y(v)).join(' ')}" fill="none" stroke="${s.c}" stroke-width="${s.w||2.2}" ${s.dash?'stroke-dasharray="4 3"':''}/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${g}${lab}${xl}${paths}</svg>`;
}
function svgStack(rows,months){
  const W=520,H=200,pl=44,pr=10,pt=10,pb=26;
  const per=months.map(m=>{const rs=rows.filter(r=>r.m===m);return SN.map((_,i)=>T(rs.reduce((a,r)=>a+r.src[i],0)));});
  const tot=per.map(p=>p.reduce((a,b)=>a+b,0)), mx=Math.max(...tot,1);
  const bw=(W-pl-pr)/months.length*0.72, gap=(W-pl-pr)/months.length;
  let s='';
  for(let k=0;k<=4;k++){const y=pt+(H-pt-pb)*(1-k/4);
    s+=`<line x1="${pl}" y1="${y}" x2="${W-pr}" y2="${y}" stroke="#DDE0D6"/><text x="${pl-5}" y="${y+3}" text-anchor="end" font-size="8.5" fill="#6E7569" font-family="ui-monospace,monospace">${hf(mx*k/4)}</text>`;}
  per.forEach((p,mi)=>{let acc=0;const x=pl+mi*gap+gap*0.14;
    p.forEach((v,si)=>{const h=(H-pt-pb)*v/mx;
      s+=`<rect x="${x}" y="${H-pb-acc-h}" width="${bw}" height="${Math.max(0,h)}" fill="${HSCOL[si]}"/>`;acc+=h;});
    s+=`<text x="${x+bw/2}" y="${H-8}" text-anchor="middle" font-size="7.5" fill="#6E7569">${months[mi].slice(5)}</text>`;});
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${s}</svg>`;
}
function svgScatter(pts,opt){
  const W=500,H=250,pl=46,pr=14,pt=12,pb=32;
  const x1=Math.max(...pts.map(p=>p.x))*1.15||1, y1=Math.max(...pts.map(p=>p.y))*1.15||1;
  const X=v=>pl+(W-pl-pr)*v/x1, Y=v=>pt+(H-pt-pb)*(1-v/y1);
  let s='';
  for(let k=0;k<=4;k++){const y=pt+(H-pt-pb)*(1-k/4),v=y1*k/4;
    s+=`<line x1="${pl}" y1="${y}" x2="${W-pr}" y2="${y}" stroke="#DDE0D6"/><text x="${pl-5}" y="${y+3}" text-anchor="end" font-size="8.5" fill="#6E7569" font-family="ui-monospace,monospace">${hf(v,(opt&&opt.ydec)||2)}</text>`;}
  for(let k=0;k<=4;k++){const x=pl+(W-pl-pr)*k/4;
    s+=`<text x="${x}" y="${H-14}" text-anchor="middle" font-size="8.5" fill="#6E7569" font-family="ui-monospace,monospace">${hf(x1*k/4)}</text>`;}
  pts.forEach((p,i)=>{s+=`<circle class="sc" data-i="${i}" cx="${X(p.x)}" cy="${Y(p.y)}" r="${p.r}" fill="${p.c}" fill-opacity=".55" stroke="${p.c}" stroke-width="1.2"/>`;});
  s+=`<text x="${W/2}" y="${H-2}" text-anchor="middle" font-size="9" fill="#6E7569">${(opt&&opt.xlab)||''}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${s}</svg>`;
}

/* ---- page nav ---- */
