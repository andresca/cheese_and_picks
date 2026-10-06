// Postgres (Neon) storage: catalog as a single JSONB document, orders as rows, admin sessions with expiry.
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { migrate } = require('./migrate');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

async function init() {
  await migrate(pool);
  // Seed the catalog from the bundled JSON the first time.
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'catalog.json'), 'utf8'));
  await pool.query('INSERT INTO catalog (id, data) VALUES (1, $1) ON CONFLICT (id) DO NOTHING', [seed]);
  // Import any orders left over from the old file storage.
  const legacy = path.join(__dirname, 'data', 'orders.json');
  if (fs.existsSync(legacy)) {
    for (const o of JSON.parse(fs.readFileSync(legacy, 'utf8'))) await saveOrder(o, true);
  }
  await pool.query('DELETE FROM admin_sessions WHERE expires_at < now()');
}

async function getCatalog() {
  const { rows } = await pool.query('SELECT data FROM catalog WHERE id = 1');
  return rows[0]?.data || null;
}
async function saveCatalog(c) {
  await pool.query('UPDATE catalog SET data = $1, updated_at = now() WHERE id = 1', [c]);
}

async function getOrders() {
  const { rows } = await pool.query('SELECT data FROM orders ORDER BY created_at DESC');
  return rows.map(r => r.data);
}
async function getOrder(id) {
  const { rows } = await pool.query('SELECT data FROM orders WHERE id = $1', [id]);
  return rows[0]?.data || null;
}
async function saveOrder(o, ignoreExisting = false) {
  await pool.query(
    `INSERT INTO orders (id, created_at, status, data) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO ${ignoreExisting ? 'NOTHING' : 'UPDATE SET status = EXCLUDED.status, data = EXCLUDED.data'}`,
    [o.id, o.createdAt, o.status, o]);
}
async function countOrdersOn(date) {
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM orders WHERE status <> 'cancelled' AND data->'customer'->>'date' = $1", [date]);
  return rows[0].n;
}
async function deleteOrder(id) {
  const { rowCount } = await pool.query('DELETE FROM orders WHERE id = $1', [id]);
  return rowCount > 0;
}

async function createSession(tokenHash, ttlHours) {
  await pool.query(`INSERT INTO admin_sessions (token_hash, expires_at) VALUES ($1, now() + make_interval(hours => $2))`, [tokenHash, ttlHours]);
}
async function isValidSession(tokenHash) {
  const { rowCount } = await pool.query('SELECT 1 FROM admin_sessions WHERE token_hash = $1 AND expires_at > now()', [tokenHash]);
  return rowCount > 0;
}
async function deleteSession(tokenHash) {
  await pool.query('DELETE FROM admin_sessions WHERE token_hash = $1', [tokenHash]);
}

module.exports = { pool, init, getCatalog, saveCatalog, getOrders, getOrder, saveOrder, deleteOrder, countOrdersOn, createSession, isValidSession, deleteSession };
