const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', 'data');
const cache = {};

function loadJson(file) {
  if (!cache[file]) cache[file] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
  return cache[file];
}

router.get('/farms', (req, res) => {
  const industry = req.query.industry === 'hort' ? 'hort' : 'farm';
  res.json(loadJson(industry === 'hort' ? 'farms-hort.json' : 'farms-cattle.json'));
});

router.get('/hort-monthly', (req, res) => {
  res.json(loadJson('hort-monthly.json'));
});

module.exports = router;
