// Runs pending SQL migrations from migrations/ in filename order, then seeds the catalog.
// Each migration runs once, inside a transaction, and is recorded in schema_migrations.
// A Postgres advisory lock keeps two runs (e.g. two CI jobs) from migrating at the same time.
// Usage: npm run migrate   (reads DATABASE_URL from the environment or .env)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import pg from 'pg';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(root, 'migrations');
const LOCK_ID = 7262001; // arbitrary, unique to this app

async function migrate(client) {
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
      console.log(`Migration applied: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${err.message}`);
    }
  }
  if (!pending.length) console.log('Database schema is up to date');
}

// The first time only: load the catalog from data/catalog.json (afterwards it is edited in the admin).
async function seed(client) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data', 'catalog.json'), 'utf8'));
  const { rowCount } = await client.query('INSERT INTO catalog (id, data) VALUES (1, $1) ON CONFLICT (id) DO NOTHING', [catalog]);
  if (rowCount) console.log('Catalog seeded from data/catalog.json');
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
  await migrate(client);
  await seed(client);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
  await client.end();
}
