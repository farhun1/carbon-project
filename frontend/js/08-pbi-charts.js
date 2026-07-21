(function(){

const C={c1:'#2c5f2d',c2:'#6ba644',c3:'#b8881e',green:'#4e9d52',amber:'#df9b26',red:'#d14a3f',leaf:'#4e8b3a',grid:'#edebe9',axis:'#a19f9d',muted:'#605e5c'};
const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const netA=[189,169.5,190.6,186.8,187.8,181,178.4,183.5,174,175.9,173.6,176.5];
const netT=[185,182,179,176,173,170,167,164,161,158,155,152];
const pred=[188.6,171.9,190.8,188.3,189.3,183,176,183.1,174.6,172.2,172.1,171.2];
const ci=[1.432,1.419,1.43,1.437,1.39,1.384,1.316,1.377,1.344,1.317,1.351,1.344];
const ndvi=[0.484,0.53,0.598,0.663,0.723,0.708,0.708,0.631,0.584,0.508,0.466,0.46];
const sectors=[['Enteric CH₄',826,'red'],['Feed',590,'amber'],['Manure',289,'amber'],['Energy',234,'green'],['Fuel',210,'green'],['Transport',164,'green'],['Fertiliser',18,'green']];
const interventions=[
 ['Root-cause: milk yield, FCR, health',238.3,238,9056,0.9,'Pilot-ready'],
 ['Ration optimisation + 3-NOP additive',99.1,99,3767,2.2,'Pilot-ready'],
 ['Improve feed storage, diet, supplier',59.0,0,0,1.2,'Pilot-ready'],
 ['Covered manure storage / digester',52.0,52,1977,4.4,'Design-ready'],
 ['Route optimisation + machinery service',42.0,42,1596,1.2,'Pilot-ready'],
 ['Solar pumps, LED, refrigeration',35.1,35,1335,3.6,'Pilot-ready'],
 ['Combine deliveries, reduce empty runs',23.0,0,0,1.2,'Research'],
 ['Rotational grazing, pasture recovery',10.6,11,404,2.1,'Research'],
 ['Precision nitrogen, soil testing',2.9,3,109,1.9,'Design-ready'],
 ['Smart water metering + leak detection',1.5,0,0,1.8,'Design-ready'],
];
const paddocks=[
 ['Calf Paddock',-27.18,152.65,0.59,74,'Medium'],['Dairy Flat',-27.14,152.66,0.58,78,'Medium'],
 ['Feedlot Yard',-27.20,152.69,0.54,84,'Medium'],['Hill View',-27.14,152.69,0.59,81,'Medium'],
 ['Irrigation Block',-27.22,152.66,0.58,80,'Medium'],['North Creek',-27.11,152.65,0.58,79,'Medium'],
 ['River Bend',-27.16,152.65,0.57,79,'Medium'],['Shelterbelt Zone',-27.20,152.67,0.65,45,'Low'],
 ['Silage Block',-27.15,152.67,0.58,76,'Medium'],['South Ridge',-27.17,152.68,0.58,79,'Medium'],
 ['Wetland Buffer',-27.23,152.65,0.65,45,'Low'],['Windmill East',-27.12,152.67,0.58,75,'Medium'],
];
const HC={red:C.red,amber:C.amber,green:C.green};

/* ---------- KPI cards ---------- */
const KPI=[['Total Gross Emissions','2,332 t','CO₂-e · FY2026',''],['Total Net Emissions','2,167 t','after sequestration','em'],
 ['Product Carbon Intensity','1.38','kg CO₂-e / L milk',''],['Net Zero Progress','9%','toward 2040','em'],
 ['Potential ACCUs','480','per year','gold'],['Potential Carbon Revenue','$18.2k','at ~$38 / ACCU','gold']];
document.getElementById('kpis').innerHTML=KPI.map(k=>`<div class="pbtile pbkpi"><div class="v ${k[3]}">${k[1]}</div><div class="l">${k[0]}</div><div class="d">${k[2]}</div></div>`).join('');

/* ---------- helpers ---------- */
const SVG=(w,h,inner)=>`<svg viewBox="0 0 ${w} ${h}" width="100%" font-family="Segoe UI,system-ui,sans-serif">${inner}</svg>`;
function axisY(x0,y0,y1,min,max,fmt,W){let s='';for(let g=0;g<=4;g++){const v=min+(max-min)*g/4,y=y1-(y1-y0)*(v-min)/(max-min);
  s+=`<line x1="${x0}" y1="${y}" x2="${W}" y2="${y}" stroke="${C.grid}"/><text x="${x0-5}" y="${y+3}" text-anchor="end" font-size="9" fill="${C.axis}">${fmt(v)}</text>`;}return s;}

function donut(){
  const segs=[[1343,C.c1],[234,C.c2],[755,C.c3]],t=2332,R=46,Cc=2*Math.PI*R;let off=0,p='';
  segs.forEach(s=>{const l=Cc*s[0]/t;p+=`<circle cx="70" cy="65" r="${R}" fill="none" stroke="${s[1]}" stroke-width="22" stroke-dasharray="${l} ${Cc-l}" stroke-dashoffset="${-off}" transform="rotate(-90 70 65)"/>`;off+=l;});
  return SVG(160,135,`${p}<circle cx="70" cy="65" r="34" fill="#fff"/><text x="70" y="62" text-anchor="middle" font-size="19" font-weight="600" fill="${C.title||'#252423'}">2,332</text><text x="70" y="78" text-anchor="middle" font-size="9" fill="${C.muted}">gross tCO₂-e</text>`);
}
function lineChart(series,opt){
  const W=opt.w||440,H=opt.h||190,x0=34,y0=12,y1=H-22, all=[].concat(...series.map(s=>s.v));
  let mn=opt.min!=null?opt.min:Math.min(...all),mx=opt.max!=null?opt.max:Math.max(...all);
  const X=i=>x0+(W-x0-8)*i/11, Y=v=>y1-(y1-y0)*(v-mn)/(mx-mn);
  let g=axisY(x0,y0,y1,mn,mx,opt.fmt||(v=>Math.round(v)),W-8);
  let xl=M.map((m,i)=>`<text x="${X(i)}" y="${H-6}" text-anchor="middle" font-size="8" fill="${C.axis}">${m[0]}</text>`).join('');
  let paths=series.map(s=>`<path d="${s.v.map((v,i)=>(i?'L':'M')+X(i)+' '+Y(v)).join(' ')}" fill="none" stroke="${s.c}" stroke-width="${s.w||2.4}" ${s.dash?'stroke-dasharray="5 4"':''}/>`).join('');
  let dots=series[0].v.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="2.3" fill="${series[0].c}"/>`).join('');
  return SVG(W,H,g+xl+paths+dots);
}
function barsH(items,opt){
  const W=opt.w||440,rh=24,gap=8,H=items.length*(rh+gap)+10,max=Math.max(...items.map(i=>i[1])),x0=92;
  let s='';items.forEach((it,i)=>{const y=8+i*(rh+gap),w=(W-x0-46)*it[1]/max,col=it[2]?HC[it[2]]:C.c1;
    s+=`<text x="${x0-6}" y="${y+rh/2+4}" text-anchor="end" font-size="10.5" fill="${C.title||'#252423'}">${it[0]}</text>
        <rect x="${x0}" y="${y}" width="${Math.max(2,w)}" height="${rh}" rx="2" fill="${col}"/>
        <text x="${x0+w+5}" y="${y+rh/2+4}" font-size="10" font-weight="600" fill="${C.muted}">${it[1].toLocaleString()}</text>`;});
  return SVG(W,H,s);
}
function stacked100(){
  const W=440,H=190,x0=18,y0=12,y1=H-22,bw=22,parts=[[0.576,C.c1],[0.10,C.c2],[0.324,C.c3]];
  let s=`<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="${C.grid}"/>`;
  for(let g=0;g<=4;g++){const y=y1-(y1-y0)*g/4;s+=`<line x1="${x0}" y1="${y}" x2="${W-8}" y2="${y}" stroke="${C.grid}"/><text x="${x0-4}" y="${y+3}" text-anchor="end" font-size="8" fill="${C.axis}">${g*25}%</text>`;}
  M.forEach((m,i)=>{const x=x0+12+i*((W-x0-20)/12);let acc=0;
    parts.forEach(p=>{const h=(y1-y0)*p[0];s+=`<rect x="${x}" y="${y1-acc-h}" width="${bw}" height="${h}" fill="${p[1]}"/>`;acc+=h;});
    s+=`<text x="${x+bw/2}" y="${H-6}" text-anchor="middle" font-size="8" fill="${C.axis}">${m[0]}</text>`;});
  return SVG(W,H,s);
}
function waterfall(){
  const steps=[['Enteric',826,'i'],['Feed',590,'i'],['Manure',289,'i'],['Energy',234,'i'],['Fuel',210,'i'],['Transport',164,'i'],['Fert.',18,'i'],['Gross',2331,'t'],['Sequest.',-165,'d'],['Net',2167,'t']];
  const W=520,H=240,x0=30,y0=10,y1=H-26,max=2500,bw=34,gap=((W-x0-14)/steps.length)-bw;
  const Y=v=>y1-(y1-y0)*v/max; let s=axisY(x0,y0,y1,0,max,v=>Math.round(v/100)*100,W-8);let run=0;
  steps.forEach((st,i)=>{const x=x0+10+i*(bw+gap);let top,h,col;
    if(st[2]==='t'){top=Y(st[1]);h=y1-top;col=st[0]==='Net'?C.c1:'#586b5e';}
    else if(st[2]==='i'){top=Y(run+st[1]);h=Y(run)-top;col=C.leaf;run+=st[1];}
    else{top=Y(run);h=Y(run+st[1])-top;col=C.green;run+=st[1];}
    s+=`<rect x="${x}" y="${top}" width="${bw}" height="${Math.max(1.5,h)}" fill="${col}"/>
        <text x="${x+bw/2}" y="${H-13}" text-anchor="middle" font-size="8" fill="${C.axis}">${st[0]}</text>
        <text x="${x+bw/2}" y="${top-3}" text-anchor="middle" font-size="8" font-weight="600" fill="${C.muted}">${Math.abs(st[1])}</text>`;});
  return SVG(W,H,s);
}
function scatter(){
  const W=440,H=230,x0=36,y0=12,y1=H-26,xmin=0,xmax=5,ymin=0,ymax=260;
  const X=v=>x0+(W-x0-12)*(v-xmin)/(xmax-xmin),Y=v=>y1-(y1-y0)*(v-ymin)/(ymax-ymin);
  let s='';for(let g=0;g<=4;g++){const y=y1-(y1-y0)*g/4,v=ymin+(ymax-ymin)*g/4;s+=`<line x1="${x0}" y1="${y}" x2="${W-8}" y2="${y}" stroke="${C.grid}"/><text x="${x0-4}" y="${y+3}" text-anchor="end" font-size="8" fill="${C.axis}">${Math.round(v)}</text>`;}
  for(let g=0;g<=5;g++){const x=X(g);s+=`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="${C.grid}"/><text x="${x}" y="${H-6}" text-anchor="middle" font-size="8" fill="${C.axis}">${g}y</text>`;}
  interventions.forEach(it=>{const r=Math.max(4,Math.sqrt(it[3])/8);const col=it[4]<=1.5?C.green:(it[4]<=3?C.amber:C.red);
    s+=`<circle cx="${X(it[4])}" cy="${Y(it[1])}" r="${r}" fill="${col}" fill-opacity="0.55" stroke="${col}" stroke-width="1"/>`;});
  s+=`<text x="${W/2}" y="${H-1}" text-anchor="middle" font-size="8.5" fill="${C.muted}">Payback (years) →</text>`;
  return SVG(W,H,s);
}
function paddockMap(){
  const W=460,H=270,x0=14,y0=12,xr=[152.63,152.70],yr=[-27.24,-27.10];
  const X=lon=>x0+(W-x0-14)*(lon-xr[0])/(xr[1]-xr[0]),Y=lat=>y0+(H-y0-26)*(lat-yr[1])/(yr[0]-yr[1]);
  let s=`<rect x="${x0}" y="${y0}" width="${W-x0-8}" height="${H-y0-22}" fill="#f7faf5" stroke="${C.grid}"/>`;
  for(let g=1;g<5;g++){const gx=x0+(W-x0-8)*g/5,gy=y0+(H-y0-22)*g/5;s+=`<line x1="${gx}" y1="${y0}" x2="${gx}" y2="${H-22}" stroke="${C.grid}"/><line x1="${x0}" y1="${gy}" x2="${W-8}" y2="${gy}" stroke="${C.grid}"/>`;}
  paddocks.forEach(p=>{const col=p[5]==='Low'?C.green:C.amber,r=4+(p[4]-40)/8;
    s+=`<circle cx="${X(p[2])}" cy="${Y(p[1])}" r="${r}" fill="${col}" fill-opacity="0.5" stroke="${col}" stroke-width="1.2"/>`;});
  s+=`<text x="${x0+4}" y="${H-6}" font-size="8.5" fill="${C.muted}">← Longitude → · bubble size = emission intensity (kg CO₂-e/ha)</text>`;
  return SVG(W,H,s);
}

/* render charts */
document.getElementById('v-donut').innerHTML=donut();
document.getElementById('v-line').innerHTML=lineChart([{v:netA,c:C.c1,w:2.6},{v:netT,c:C.c2,dash:1}],{min:140,max:200,w:560});
document.getElementById('v-stack').innerHTML=stacked100();
document.getElementById('v-bar').innerHTML=barsH(sectors.map(s=>[s[0],s[1],null]),{w:430});
document.getElementById('v-ci').innerHTML=lineChart([{v:ci,c:C.c3,w:2.6}],{min:1.2,max:1.5,w:1180,fmt:v=>v.toFixed(2)});
document.getElementById('v-fc').innerHTML=lineChart([{v:netA,c:C.c1,w:2.6},{v:pred,c:C.c3,dash:1}],{min:160,max:200,w:560});
document.getElementById('v-hot').innerHTML=barsH(sectors.map(s=>[s[0],s[1],s[2]]),{w:430});
document.getElementById('v-ndvi').innerHTML=lineChart([{v:ndvi,c:C.leaf,w:2.6}],{min:0.4,max:0.8,w:420,fmt:v=>v.toFixed(2)});
document.getElementById('v-ibar').innerHTML=barsH(interventions.slice().sort((a,b)=>b[1]-a[1]).map(i=>[i[0].length>26?i[0].slice(0,26)+'…':i[0],Math.round(i[1]),null]),{w:560});
document.getElementById('v-scatter').innerHTML=scatter();
document.getElementById('v-water').innerHTML=waterfall();
document.getElementById('v-map').innerHTML=paddockMap();

/* pivot table */
const pivotRows=[['Enteric CH₄',826,'','',826],['Manure',289,'','',289],['Fuel',210,'','',210],['Fertiliser',18,'','',18],['Energy','',234,'',234],['Feed','','',590,590],['Transport','','',164,164]];
document.getElementById('v-pivot').innerHTML=`<table class="t"><tr><th>Sector</th><th class="n">Scope 1</th><th class="n">Scope 2</th><th class="n">Scope 3</th><th class="n">Total</th></tr>
${pivotRows.map(r=>`<tr><td>${r[0]}</td><td class="n">${r[1]||'–'}</td><td class="n">${r[2]||'–'}</td><td class="n">${r[3]||'–'}</td><td class="n"><b>${r[4]}</b></td></tr>`).join('')}
<tr style="background:#faf9f8"><td><b>Total</b></td><td class="n"><b>1,343</b></td><td class="n"><b>234</b></td><td class="n"><b>755</b></td><td class="n"><b>2,332</b></td></tr></table>`;

/* root-cause summary */
document.getElementById('v-rc').innerHTML=`<table class="t">
<tr><td>Anomaly status</td><td class="n"><span class="pill" style="background:${C.green}">NORMAL RANGE</span></td></tr>
<tr><td>Top emission driver</td><td class="n"><b>Enteric CH₄ · 35%</b></td></tr>
<tr><td>Root-cause driver 1</td><td class="n">Feed conversion ratio</td></tr>
<tr><td>Root-cause driver 2</td><td class="n">Herd productivity</td></tr>
<tr><td>NDVI / weather risk</td><td class="n"><span class="pill" style="background:${C.green}">LOW</span></td></tr>
<tr><td>Avg anomaly score</td><td class="n">0.18</td></tr>
<tr><td>Forecast model</td><td class="n">Prophet + LSTM + SHAP</td></tr></table>`;

/* intervention table */
const rl={'Pilot-ready':C.green,'Design-ready':C.amber,'Research':C.muted};
document.getElementById('v-itable').innerHTML=`<table class="t"><tr><th>Intervention</th><th class="n">Reduction tCO₂-e</th><th class="n">ACCUs</th><th class="n">Revenue AUD</th><th class="n">Payback yrs</th><th>Readiness</th></tr>
${interventions.map(r=>`<tr><td>${r[0]}</td><td class="n">${r[1].toFixed(1)}</td><td class="n">${r[2]||'–'}</td><td class="n">${r[3]?'$'+r[3].toLocaleString():'–'}</td><td class="n">${r[4]}</td><td><span class="pill" style="background:${rl[r[5]]}">${r[5].toUpperCase()}</span></td></tr>`).join('')}
<tr style="background:#faf9f8"><td><b>Total</b></td><td class="n"><b>564.0</b></td><td class="n"><b>480</b></td><td class="n"><b>$18,244</b></td><td class="n">–</td><td></td></tr></table>`;

/* paddock table */
document.getElementById('v-ptable').innerHTML=`<table class="t"><tr><th>Paddock</th><th class="n">NDVI</th><th class="n">Emission intensity kgCO₂-e/ha</th><th class="n">Soil moisture %</th><th>Hotspot</th></tr>
${paddocks.map(p=>`<tr><td>${p[0]}</td><td class="n">${p[3].toFixed(2)}</td><td class="n">${p[4]}</td><td class="n">${(36+Math.random()*5).toFixed(1)}</td><td><span class="pill" style="background:${p[5]==='Low'?C.green:C.amber}">${p[5].toUpperCase()}</span></td></tr>`).join('')}</table>`;

/* tab nav */
window.pbiJump=function(id,btn){document.getElementById(id).scrollIntoView({behavior:'smooth',block:'start'});
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}

})();
