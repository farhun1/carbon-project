const fs = require('fs');
const path = require('path');

const FRONTEND_JS = path.join(__dirname, '..', '..', 'frontend', 'js');
// Order matters: 04-industry-router.js references `refreshLocks`, defined in 01-data-core.js,
// at its top level (`const _origRefresh = refreshLocks;`) — concatenating in load order avoids
// a ReferenceError during extraction, exactly mirroring how the browser loads these files.
const FILES = [
  '01-data-core.js',
  '02-dashboard-farm.js',
  '03-calculator-farm.js',
  '04-industry-router.js',
  '05-hort-data-stats.js',
];

const source = FILES.map(f => fs.readFileSync(path.join(FRONTEND_JS, f), 'utf8')).join('\n');
// 05-hort-data-stats.js has one top-level browser-only statement (`window.hSetGroup=...`) that
// wires a click handler for the live page — irrelevant to the FARMS/HFARMS/HDATA seed data, but
// it throws ReferenceError in plain Node since `window` doesn't exist there. Stub it as a no-op
// object so the concatenated source evaluates to completion; nothing ever reads this stub back.
global.window = global.window || {};
const extract = new Function(`${source}\nreturn { FARMS, HFARMS, HDATA };`);
const { FARMS, HFARMS, HDATA } = extract();

const outDir = __dirname;
fs.writeFileSync(path.join(outDir, 'farms-cattle.json'), JSON.stringify(FARMS, null, 2));
fs.writeFileSync(path.join(outDir, 'farms-hort.json'), JSON.stringify(HFARMS, null, 2));
fs.writeFileSync(path.join(outDir, 'hort-monthly.json'), JSON.stringify(HDATA, null, 2));

console.log(
  `Seed data extracted: ${FARMS.length} cattle farms, ${HFARMS.length} hort growers, ${HDATA.rows.length} monthly rows.`
);
