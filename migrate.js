// Runs pending SQL migrations from migrations/ in filename order.
// Each file runs once, inside a transaction, and is recorded in schema_migrations.
// A Postgres advisory lock keeps two server instances from migrating at the same time.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'migrations');
const LOCK_ID = 7262001; // arbitrary, unique to this app

async function migrate(pool, log = console.log) {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const done = new Set(rows.map(r => r.name));
    const pending = fs.readdirSync(DIR).filter(f => f.endsWith('.sql')).sort().filter(f => !done.has(f));

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(DIR, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        log(`Migration applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }
    if (!pending.length) log('Database schema is up to date');
    return pending;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    client.release();
  }
}

module.exports = { migrate };

// `npm run migrate` / `node migrate.js`
if (require.main === module) {
  require('dotenv').config();
  const { pool } = require('./db');
  migrate(pool)
    .then(() => pool.end())
    .catch(err => { console.error(err.message); pool.end(); process.exit(1); });
}
