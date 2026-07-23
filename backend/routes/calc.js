const express = require('express');
const db = require('../db/db');
const { quickFarmResult, advancedFarmResult } = require('../calc/farm');
const { quickHortResult, advancedHortResult } = require('../calc/hort');

const router = express.Router();

function persist(req, industry, mode, input, result) {
  db.prepare('INSERT INTO assessments (user_id, industry, mode, input_json, result_json) VALUES (?, ?, ?, ?, ?)').run(
    req.session.userId || null,
    industry,
    mode,
    JSON.stringify(input),
    JSON.stringify(result)
  );
}

router.post('/farm/quick', (req, res) => {
  const result = quickFarmResult(req.body);
  persist(req, 'farm', 'quick', req.body, result);
  res.json(result);
});

router.post('/farm/advanced', (req, res) => {
  const result = advancedFarmResult(req.body);
  persist(req, 'farm', 'advanced', req.body, result);
  res.json(result);
});

router.post('/hort/quick', (req, res) => {
  const result = quickHortResult(req.body);
  persist(req, 'hort', 'quick', req.body, result);
  res.json(result);
});

router.post('/hort/advanced', (req, res) => {
  const result = advancedHortResult(req.body);
  persist(req, 'hort', 'advanced', req.body, result);
  res.json(result);
});

module.exports = router;
