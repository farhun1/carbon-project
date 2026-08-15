const path = require('path');
const express = require('express');
const session = require('express-session');
require('./db/db'); // creates the schema before any route touches it
const SqliteSessionStore = require('./db/sessionStore');

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error(
    'SESSION_SECRET must be set when NODE_ENV=production - refusing to start with the default dev secret.'
  );
}

const app = express();
app.use(express.json());
if (!process.env.SESSION_SECRET) {
  console.warn('WARNING: SESSION_SECRET is not set - falling back to the default dev secret. Do not run this in production without setting a real SESSION_SECRET.');
}
app.use(
  session({
    store: new SqliteSessionStore(),
    secret: process.env.SESSION_SECRET || 'lccip-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 },
  })
);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/network', require('./routes/network'));
app.use('/api/calc', require('./routes/calc'));
app.use('/api/assessments', require('./routes/assessments'));

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));
app.get('*', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LCCIP backend listening on http://localhost:${PORT}`));
