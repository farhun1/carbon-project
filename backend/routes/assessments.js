const express = require('express');
const db = require('../db/db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT id, industry, mode, input_json, result_json, created_at FROM assessments WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.session.userId);
  res.json(
    rows.map(r => ({
      id: r.id,
      industry: r.industry,
      mode: r.mode,
      input: JSON.parse(r.input_json),
      result: JSON.parse(r.result_json),
      createdAt: r.created_at,
    }))
  );
});

module.exports = router;
