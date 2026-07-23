// Ported from frontend/js/09-calculator-hort.js:hCalcLocal — same formulas, same constants.
function hCalcLocal(i) {
  const F = {
    diesel: 2.71783, elec: 0.66, soilN2O: 7.82243, fertUp: 1.35, lime: 440, plastic: 2.6, card: 0.94,
    freight: 0.12, water: 0.15, chem: 9.1, waste: 520, refrig: 1430, treeSeq: 6.0, coverSeq: 0.4,
  };
  const yld = (i.ents || []).reduce((a, e) => a + (e.yld || 0), 0);
  const diesel = ((i.diesel || 0) * F.diesel) / 1000;
  const netE = Math.max(0, (i.elec || 0) - (i.solar || 0));
  const elec = (netE * F.elec) / 1000;
  const soilN = ((i.n || 0) * F.soilN2O) / 1000;
  const fertUp = ((i.n || 0) * F.fertUp) / 1000;
  const lime = ((i.lime || 0) * F.lime) / 1000;
  const plastic = ((i.plastic || 0) * F.plastic) / 1000;
  const card = ((i.card || 0) * F.card) / 1000;
  const pack = plastic + card;
  const freight = ((i.freight || 0) * F.freight) / 1000;
  const water = ((i.water || 0) * F.water) / 1000;
  const chem = ((i.chem || 0) * F.chem) / 1000;
  const waste = ((i.waste || 0) * F.waste) / 1000;
  const refrig = ((i.refrig || 0) * F.refrig) / 1000;
  const seq = (i.trees || 0) * F.treeSeq + (i.cover || 0) * F.coverSeq + (i.rem || 0);
  const gross = diesel + elec + soilN + fertUp + lime + pack + freight + water + chem + waste + refrig;
  const net = Math.max(0, gross - seq);
  const s1 = diesel + soilN + lime + refrig, s2 = elec, s3 = fertUp + pack + freight + water + chem + waste;
  return {
    diesel, elec, soilN, fertUp, lime, pack, plastic, card, freight, water, chem, waste, refrig, seq, gross, net, s1, s2, s3, yld,
    rows: [
      ['Fuel — diesel', 'Scope 1', diesel], ['Soil N₂O', 'Scope 1', soilN], ['Lime & urea', 'Scope 1', lime],
      ['Refrigerant', 'Scope 1', refrig], ['Electricity (net of solar)', 'Scope 2', elec],
      ['Fertiliser (upstream)', 'Scope 3', fertUp], ['Packaging', 'Scope 3', pack], ['Freight', 'Scope 3', freight],
      ['Water', 'Scope 3', water], ['Chemicals', 'Scope 3', chem], ['Organic waste', 'Scope 3', waste],
      ['Removals (soil + biomass + veg)', 'Removal', -seq],
    ],
  };
}

// Ported from frontend/js/09-calculator-hort.js:hRunAdvanced — the aggregation/ACCU half only.
function advancedHortResult(inp) {
  const r = hCalcLocal(inp);
  const redpct = inp.redpct || 0, price = inp.price || 38, buf = (inp.buffer || 0) / 100;
  const ci = r.yld ? (r.gross * 1000) / r.yld : 0;
  const baseline = r.net, project = r.net * (1 - redpct / 100), reduction = baseline - project;
  const accus = Math.max(0, Math.round(reduction * (1 - buf)));
  const revenue = accus * price;
  const perPerson = Math.round(r.net / 15);
  return { ...r, ci, baseline, project, reduction, accus, revenue, perPerson, engine: 'LCCIP indicative' };
}

// Ported from frontend/js/07-hort-quick-calc.js:calcHort — the math half only.
function quickHortResult(inp) {
  const F = { diesel: 2.718 + 0.668, elec: 0.66, soilN2O: 4.42, fertUp: 1.35, plastic: 2.6, card: 0.94, freight: 0.12, water: 0.15, chem: 9.1 };
  const n = k => inp[k] || 0;
  const diesel = (n('diesel') * F.diesel) / 1000, elec = (n('elec') * F.elec) / 1000;
  const soilN = (n('n') * F.soilN2O) / 1000, fertUp = (n('n') * F.fertUp) / 1000;
  const plastic = (n('plastic') * F.plastic) / 1000, card = (n('card') * F.card) / 1000;
  const freight = (n('freight') * F.freight) / 1000, water = (n('water') * F.water) / 1000, chem = (n('chem') * F.chem) / 1000;
  const pack = plastic + card;
  const gross = diesel + elec + soilN + fertUp + pack + freight + water + chem;
  const rem = n('rem'), net = Math.max(0, gross - rem);
  const y = n('yield'), ci = y > 0 ? (net * 1000) / y : 0;
  const s1 = diesel + soilN, s2 = elec, s3 = fertUp + pack + freight + water + chem;
  const area = n('area') || 1;
  return { diesel, elec, soilN, fertUp, pack, plastic, card, freight, water, chem, rem, gross, net, ci, s1, s2, s3, area };
}

module.exports = { hCalcLocal, quickHortResult, advancedHortResult };
