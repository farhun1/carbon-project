const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/db');

const router = express.Router();

// Minimum 8 characters, at least one non-alphanumeric ("special") character.
const SPECIAL_CHAR_RE = /[^A-Za-z0-9]/;
function passwordPolicyError(password) {
  if (password.length < 8) return 'password must be at least 8 characters long';
  if (!SPECIAL_CHAR_RE.test(password)) return 'password must contain at least one special character';
  return null;
}

router.post('/signup', async (req, res) => {
  const { email, password, plan } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const policyError = passwordPolicyError(password);
  if (policyError) {
    return res.status(400).json({ error: policyError });
  }
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'an account with that email already exists — try logging in' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const info = db
      .prepare("INSERT INTO users (email, password_hash, plan, subscribed_at) VALUES (?, ?, ?, datetime('now'))")
      .run(email, passwordHash, plan || 'producer');
    req.session.userId = info.lastInsertRowid;
    res.status(201).json({ user: { id: info.lastInsertRowid, email, plan: plan || 'producer' } });
  } catch (err) {
    if (String(err && err.message).includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'an account with that email already exists — try logging in' });
    }
    console.error('signup failed:', err);
    res.status(500).json({ error: 'something went wrong' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    const ok = user && (await bcrypt.compare(password || '', user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: 'invalid email or password' });
    }
    req.session.userId = user.id;
    res.json({ user: { id: user.id, email: user.email, plan: user.plan } });
  } catch (err) {
    console.error('login failed:', err);
    res.status(500).json({ error: 'something went wrong' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'something went wrong' });
    res.status(204).end();
  });
});

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'not logged in' });
  const user = db.prepare('SELECT id, email, plan FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'not logged in' });
  res.json({ user });
});

module.exports = router;
