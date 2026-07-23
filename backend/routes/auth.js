const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/db');

const router = express.Router();

router.post('/signup', (req, res) => {
  const { email, password, plan } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'an account with that email already exists — try logging in' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (email, password_hash, plan, subscribed_at) VALUES (?, ?, ?, datetime('now'))")
    .run(email, passwordHash, plan || 'producer');
  req.session.userId = info.lastInsertRowid;
  res.status(201).json({ user: { id: info.lastInsertRowid, email, plan: plan || 'producer' } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'invalid email or password' });
  }
  req.session.userId = user.id;
  res.json({ user: { id: user.id, email: user.email, plan: user.plan } });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.status(204).end());
});

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'not logged in' });
  const user = db.prepare('SELECT id, email, plan FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'not logged in' });
  res.json({ user });
});

module.exports = router;
