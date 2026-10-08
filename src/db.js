// Neon Postgres over HTTP (works inside Cloudflare Workers). Schema lives in migrations/.
import { neon } from '@neondatabase/serverless';

export function createDb(databaseUrl) {
  const sql = neon(databaseUrl);
  const one = async (q, params) => (await sql.query(q, params))[0];

  return {
    async getCatalog() {
      return (await one('SELECT data FROM catalog WHERE id = 1'))?.data || null;
    },
    async saveCatalog(c) {
      await sql.query('UPDATE catalog SET data = $1, updated_at = now() WHERE id = 1', [c]);
    },

    async getOps() {
      return (await one('SELECT data FROM ops WHERE id = 1'))?.data || null;
    },
    async saveOps(o) {
      await sql.query(
        `INSERT INTO ops (id, data) VALUES (1, $1)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`, [o]);
    },

    async getOrders() {
      return (await sql.query('SELECT data FROM orders ORDER BY created_at DESC')).map(r => r.data);
    },
    async getOrder(id) {
      return (await one('SELECT data FROM orders WHERE id = $1', [id]))?.data || null;
    },
    async saveOrder(o) {
      await sql.query(
        `INSERT INTO orders (id, created_at, status, data) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, data = EXCLUDED.data`,
        [o.id, o.createdAt, o.status, o]);
    },
    async countOrdersOn(date) {
      return (await one("SELECT count(*)::int AS n FROM orders WHERE status <> 'cancelled' AND data->'customer'->>'date' = $1", [date])).n;
    },
    async deleteOrder(id) {
      return (await sql.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id])).length > 0;
    },
  };
}
