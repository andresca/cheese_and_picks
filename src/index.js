// Cheese Picks API — Cloudflare Worker.
// In production it is mounted on cheese-picks.websportal.dev/api/* (the site itself is GitHub Pages).
// Locally, `npm run dev` serves public/ and this API together.
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import { createDb } from './db.js';
import { verifyAccess } from './access.js';
import { STATUSES, UserError, publicCatalog, createOrder, normalizeCatalog, normalizeOps, emptyOps, computeStats } from './core.js';

const app = new Hono();

app.use('/api/*', secureHeaders({ xFrameOptions: 'DENY' }));
app.use('/api/*', bodyLimit({ maxSize: 200 * 1024, onError: c => c.json({ error: 'Request too large' }, 413) }));
app.use('/api/*', async (c, next) => {
  if (!c.env.DATABASE_URL) {
    console.error('DATABASE_URL must be set as a Worker secret');
    return c.json({ error: 'Server not configured' }, 500);
  }
  c.set('db', createDb(c.env.DATABASE_URL));
  await next();
});

// Per-IP rate limits using Cloudflare's rate limiting bindings (see wrangler.toml).
const limit = (binding, message) => async (c, next) => {
  const limiter = c.env[binding];
  if (limiter) {
    const ip = c.req.header('cf-connecting-ip') || 'local';
    const { success } = await limiter.limit({ key: `${binding}:${ip}` });
    if (!success) return c.json({ error: message }, 429);
  }
  await next();
};

const readJson = async c => { try { return (await c.req.json()) || {}; } catch { return null; } };

// ---------- public ----------
app.get('/api/catalog', async c => {
  c.header('Cache-Control', 'public, max-age=30');
  return c.json(publicCatalog(await c.get('db').getCatalog()));
});

app.post('/api/orders', limit('ORDER_LIMITER', 'Too many orders from this connection, please try again later'), async c => {
  const body = await readJson(c);
  if (!body) return c.json({ error: 'Invalid request body' }, 400);
  const db = c.get('db');
  try {
    const result = await createOrder(await db.getCatalog(), body, date => db.countOrdersOn(date));
    await db.saveOrder(result.order);
    return c.json(result);
  } catch (e) {
    if (e instanceof UserError) return c.json({ error: e.message }, 400);
    throw e;
  }
});

// ---------- admin: only requests that passed the Cloudflare Access email login ----------
app.use('/api/admin/*', async (c, next) => {
  const access = await verifyAccess(c.req.raw, c.env);
  if (!access.ok) return c.json({ error: access.error }, access.status);
  c.header('Cache-Control', 'no-store');
  await next();
});

app.get('/api/admin/orders', async c => c.json(await c.get('db').getOrders()));

app.patch('/api/admin/orders/:id', async c => {
  const db = c.get('db');
  const o = await db.getOrder(c.req.param('id'));
  if (!o) return c.json({ error: 'Not found' }, 404);
  const { status, adminNotes } = (await readJson(c)) || {};
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return c.json({ error: 'Invalid status' }, 400);
    o.status = status;
  }
  if (adminNotes !== undefined) o.adminNotes = String(adminNotes).slice(0, 2000);
  o.updatedAt = new Date().toISOString();
  await db.saveOrder(o);
  return c.json(o);
});

app.delete('/api/admin/orders/:id', async c => {
  if (!(await c.get('db').deleteOrder(c.req.param('id')))) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

app.get('/api/admin/stats', async c => c.json(computeStats(await c.get('db').getOrders())));

app.get('/api/admin/catalog', async c => c.json(await c.get('db').getCatalog()));

app.put('/api/admin/catalog', async c => {
  const catalog = await readJson(c);
  const error = normalizeCatalog(catalog);
  if (error) return c.json({ error }, 400);
  await c.get('db').saveCatalog(catalog);
  return c.json(catalog);
});

// Back office: providers, ingredients, recipes and costing settings.
app.get('/api/admin/ops', async c => c.json((await c.get('db').getOps()) || emptyOps()));

app.put('/api/admin/ops', async c => {
  const ops = await readJson(c);
  const error = normalizeOps(ops);
  if (error) return c.json({ error }, 400);
  await c.get('db').saveOps(ops);
  return c.json(ops);
});

app.all('/api/*', c => c.json({ error: 'Not found' }, 404));

// Local dev only: /admin → admin.html (GitHub Pages serves admin.html directly in production).
app.get('/admin', c => c.env.ASSETS ? c.env.ASSETS.fetch(new URL('/admin.html', c.req.url)) : c.notFound());
app.all('*', c => c.env.ASSETS ? c.env.ASSETS.fetch(c.req.raw) : c.notFound());

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Server error' }, 500);
});

export default app;
