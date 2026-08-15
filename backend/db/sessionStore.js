const session = require('express-session');
const db = require('./db');

// The session's cookie carries its own expiry once express-session has processed it
// (sess.cookie.expires); fall back to "now + maxAge" for the very first save, before
// express-session has computed .expires yet. A day is a safe fallback if a session
// object somehow has neither (shouldn't happen given server.js always sets maxAge).
function expiresAtFor(sess) {
  if (sess.cookie && sess.cookie.expires) return new Date(sess.cookie.expires).getTime();
  const maxAge = (sess.cookie && sess.cookie.maxAge) || 1000 * 60 * 60 * 24;
  return Date.now() + maxAge;
}

class SqliteSessionStore extends session.Store {
  get(sid, callback) {
    try {
      const row = db.prepare('SELECT session_json FROM sessions WHERE sid = ? AND expires_at > ?').get(sid, Date.now());
      if (!row) return callback(null, null);
      let sess = null;
      try {
        sess = JSON.parse(row.session_json);
      } catch {
        sess = null;
      }
      callback(null, sess);
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sess, callback) {
    try {
      // Opportunistic cleanup - keeps the table from growing unbounded without a
      // separate cron job or setInterval.
      db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
      db.prepare('INSERT OR REPLACE INTO sessions (sid, session_json, expires_at) VALUES (?, ?, ?)')
        .run(sid, JSON.stringify(sess), expiresAtFor(sess));
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = SqliteSessionStore;
