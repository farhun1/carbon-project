// Ported from frontend/js/03-calculator-farm.js:calcLocal — same formulas, same constants.
const CLASSES = [
  ['Dairy cows (milking)', 3.4],
  ['Dairy heifers/replacements', 2.2],
  ['Beef breeding cows', 2.4],
  ['Beef steers/heifers (grazing)', 1.9],
  ['Feedlot cattle', 1.6],
  ['Bulls', 2.6],
  ['Calves', 0.8],
];

function calcLocal(i) {
  const F = {
    diesel: 2.68, petrol: 2.3, lpg: 1.62, elec: 0.66, grain: 0.65, hay: 0.45, fertN: 5.5, lime: 0.44,
    freight: 0.12, treeSeq: 6.0, pastSeq: 0.5, cropSeq: 0.1, clearing: 120, revegSeq: 8.0, manureBase: 0.55,
  };
  let enteric = 0, headTot = 0;
  (i.ents || []).forEach(e => {
    const cls = CLASSES[e.cls] || CLASSES[0];
    const ef = cls[1] * ((e.wt || 450) / 450);
    enteric += (e.head || 0) * ef;
    headTot += e.head || 0;
  });
  enteric *= 1 - (i.additive || 0);
  const manure = headTot * F.manureBase * (i.manureFactor || 1);
  const feed = (i.grain || 0) * F.grain + (i.hay || 0) * F.hay;
  const fertiliser = ((i.fertN || 0) * F.fertN) / 1000 + (i.lime || 0) * F.lime;
  const fuel = ((i.diesel || 0) * F.diesel + (i.petrol || 0) * F.petrol + (i.lpg || 0) * F.lpg) / 1000;
  const netElec = Math.max(0, (i.elec || 0) - (i.solar || 0));
  const energy = (netElec * F.elec) / 1000;
  const transport = ((i.freight || 0) * F.freight) / 1000;
  const landUse = (i.cleared || 0) * F.clearing;
  const seq =
    (i.trees || 0) * F.treeSeq + (i.pasture || 0) * F.pastSeq + (i.crop || 0) * F.cropSeq + (i.reveg || 0) * F.revegSeq;
  const gross = enteric + manure + feed + fertiliser + fuel + energy + transport + landUse;
  const net = Math.max(0, gross - seq);
  const s1 = enteric + manure + fuel + fertiliser + landUse;
  const s2 = energy;
  const s3 = feed + transport;
  return { enteric, manure, feed, fertiliser, fuel, energy, transport, landUse, seq, gross, net, s1, s2, s3, headTot };
}

// Ported from frontend/js/03-calculator-farm.js:runAdvanced — the aggregation/ACCU half only
// (the HTML string it builds stays client-side; this returns the numbers that HTML is built from).
function advancedFarmResult(inp) {
  const r = calcLocal(inp);
  const milk = inp.milk || 0, lwg = inp.lwg || 0, redpct = inp.redpct || 0;
  const price = inp.price || 38, buf = (inp.buffer || 0) / 100;
  const intensity = milk > 0 ? (r.gross * 1000) / milk : lwg > 0 ? (r.gross * 1000) / lwg : 0;
  const iUnit = milk > 0 ? 'kg CO₂-e / L milk' : lwg > 0 ? 'kg CO₂-e / kg LWG' : '—';
  const baseline = r.net, project = r.net * (1 - redpct / 100), reduction = baseline - project;
  const accus = Math.max(0, Math.round(reduction * (1 - buf)));
  const revenue = accus * price;
  const perHead = r.headTot > 0 ? r.net / r.headTot : 0;
  const perPerson = Math.round(r.net / 15);
  return { ...r, intensity, iUnit, baseline, project, reduction, accus, revenue, perHead, perPerson, engine: 'LCCIP indicative' };
}

// Ported from frontend/js/02-dashboard-farm.js:calcInput — the math half only.
function quickFarmResult(inp) {
  const head = inp.head || 0, diesel = inp.diesel || 0, elec = inp.elec || 0, feed = inp.feed || 0;
  const fert = inp.fert || 0, milk = inp.milk || 0, trees = inp.trees || 0, pasture = inp.pasture || 0;
  const cleared = inp.cleared || 0, redpct = inp.redpct || 0, type = inp.type || 'Dairy';
  const entericRate = { Dairy: 3.1, Beef: 2.0, Mixed: 2.6, Feedlot: 2.2 }[type] ?? 2.6;
  const EF = { enteric: entericRate, manure: 0.55, diesel: 2.68, elec: 0.66, feed: 0.6, fert: 5.5, treeSeq: 6.0, pastSeq: 0.5, clearing: 120 };
  const enteric = head * EF.enteric, manure = head * EF.manure, fuel = (diesel * EF.diesel) / 1000, energy = (elec * EF.elec) / 1000;
  const feedE = feed * EF.feed, fertE = (fert * EF.fert) / 1000, transport = feed * 0.05 + head * 0.02;
  const landUse = cleared * EF.clearing, seq = trees * EF.treeSeq + pasture * EF.pastSeq;
  const grossAct = enteric + manure + fuel + energy + feedE + fertE + transport;
  const gross = grossAct + landUse, net = Math.max(0, gross - seq);
  const intensity = milk > 0 ? (gross * 1000) / milk : 0;
  const s1 = enteric + manure + fuel + fertE + landUse, s2 = energy, s3 = feedE + transport;
  const perHead = head > 0 ? net / head : 0, perPerson = Math.round(net / 15);
  const baseline = net, project = net * (1 - redpct / 100), reduction = baseline - project, buffer = 0.05;
  const accus = Math.max(0, Math.round(reduction * (1 - buffer))), revenue = accus * 38;
  return { enteric, manure, feedE, energy, fuel, fertE, transport, landUse, seq, gross, net, s1, s2, s3, intensity, perHead, perPerson, baseline, project, reduction, accus, revenue };
}

module.exports = { calcLocal, quickFarmResult, advancedFarmResult, CLASSES };
