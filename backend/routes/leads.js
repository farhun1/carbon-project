const express = require('express');
const db = require('../db/db');

const router = express.Router();

router.post('/', (req, res) => {
  const { industry, name, organisation, email, roleOrCrop, message } = req.body;
  if (!industry || !['farm', 'hort'].includes(industry)) {
    return res.status(400).json({ error: 'industry must be "farm" or "hort"' });
  }
  const info = db
    .prepare(
      'INSERT INTO leads (industry, name, organisation, email, role_or_crop, message) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(industry, name || null, organisation || null, email || null, roleOrCrop || null, message || null);
  res.status(201).json({ id: info.lastInsertRowid });
});

module.exports = router;
