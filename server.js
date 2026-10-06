require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const { publicCatalog } = require('./public-catalog');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_HOURS = 12;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const STATUSES = ['new', 'confirmed', 'preparing', 'delivered', 'cancelled'];

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is not set (see .env.example)'); process.exit(1); }
if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error('ADMIN_PASSWORD must be set and at least 12 characters long (see .env.example)');
  process.exit(1);
}

const sha256 = s => crypto.createHash('sha256').update(String(s)).digest();
const { getCatalog } = db;
// Wraps async handlers so rejected promises reach the error handler.
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- i18n ----------
const MSG = {
  es: {
    badSize: 'Tamaño de tabla inválido', unavailable: 'Un producto seleccionado ya no está disponible',
    tooMany: 'Demasiados productos de {cat} para la tabla {size} (máx. {max})',
    required: 'Nombre, teléfono y fecha son obligatorios', address: 'La dirección es obligatoria para domicilio',
    empty: 'Por favor selecciona al menos un producto',
    tooFew: 'Elige al menos {min} de {cat} para la tabla {size}',
    noDelivery: 'El domicilio no está disponible', noPickup: 'Recoger en tienda no está disponible',
    badDate: 'Fecha inválida', leadTime: 'Necesitamos al menos {n} día(s) de anticipación',
    closedDay: 'No recibimos pedidos para ese día de la semana', fullDay: 'Ya no tenemos cupo para esa fecha, elige otra',
    minOrder: 'El pedido mínimo es {min}',
    newOrder: 'Nuevo pedido', table: 'Tabla', subtotal: 'Subtotal', delivery: 'Domicilio', total: 'TOTAL',
    customer: 'Cliente', phone: 'Teléfono', email: 'Correo', pickup: 'Recoger', address2: 'Dirección',
    occasion: 'Ocasión', notes: 'Notas',
  },
  en: {
    badSize: 'Invalid table size', unavailable: 'A selected item is no longer available',
    tooMany: 'Too many {cat} items for the {size} table (max {max})',
    required: 'Name, phone and date are required', address: 'Address is required for delivery',
    empty: 'Please select at least one item',
    tooFew: 'Choose at least {min} {cat} for the {size} table',
    noDelivery: 'Delivery is not available', noPickup: 'Pickup is not available',
    badDate: 'Invalid date', leadTime: 'We need at least {n} day(s) notice',
    closedDay: 'We do not take orders for that weekday', fullDay: 'That date is fully booked, please choose another',
    minOrder: 'The minimum order is {min}',
    newOrder: 'New order', table: 'Table', subtotal: 'Subtotal', delivery: 'Delivery', total: 'TOTAL',
    customer: 'Customer', phone: 'Phone', email: 'Email', pickup: 'Pickup', address2: 'Address',
    occasion: 'Occasion', notes: 'Notes',
  },
};
const msg = (lang, key, vars = {}) => (MSG[lang] || MSG.es)[key].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const loc = (lang, obj, field = 'name') => (lang === 'en' && obj?.[field + 'En']) || obj?.[field] || '';
class UserError extends Error {}

// "6-8 personas" / "6-8 people" built from numbers (same rule as servesLabel in public/i18n.js).
function servesLabel(min, max, lang) {
  const [a, b] = [min || max, max || min];
  if (!a) return lang === 'en' ? 'You decide' : 'Tú decides';
  const n = a === b ? String(a) : a + '-' + b;
  const one = a === 1 && b === 1;
  return n + ' ' + (lang === 'en' ? (one ? 'person' : 'people') : (one ? 'persona' : 'personas'));
}
const parseServes = text => {
  const [min = 0, max = min] = (String(text || '').match(/\d+/g) || []).map(Number);
  return { servesMin: min, servesMax: max };
};

const CURRENCY_DIGITS = { COP: 0, CLP: 0, JPY: 0 };
function formatMoney(n, code = 'COP') {
  const digits = CURRENCY_DIGITS[code] ?? 2;
  try {
    return new Intl.NumberFormat(code === 'COP' ? 'es-CO' : 'en-US', {
      style: 'currency', currency: code, minimumFractionDigits: digits, maximumFractionDigits: digits,
    }).format(n);
  } catch { return `${code} ${n}`; }
}

// ---------- pricing (always computed server-side) ----------
const line = p => ({ id: p.id, name: p.name, nameEn: p.nameEn, category: p.category });
function priceOrder(catalog, sizeId, itemIds, lang) {
  const size = catalog.sizes.find(s => s.id === sizeId && s.active);
  if (!size) throw new UserError(msg(lang, 'badSize'));
  const products = new Map(catalog.products.filter(p => p.active).map(p => [p.id, p]));
  const unique = [...new Set(itemIds || [])];
  const items = unique.map(id => {
    const p = products.get(id);
    if (!p) throw new UserError(msg(lang, 'unavailable'));
    return p;
  });

  const lines = [];
  for (const cat of catalog.categories) {
    const inCat = items.filter(p => p.category === cat.id);
    if (size.custom || !cat.limited) {
      inCat.forEach(p => lines.push({ ...line(p), price: p.price, included: false }));
      continue;
    }
    const max = size.limits?.[cat.id] ?? 0;
    const min = Math.min(size.mins?.[cat.id] ?? 0, max);
    const vars = { min, max, cat: loc(lang, cat).toLowerCase(), size: loc(lang, size) };
    if (inCat.length < min) throw new UserError(msg(lang, 'tooFew', vars));
    if (inCat.length > max && !size.allowExtras) throw new UserError(msg(lang, 'tooMany', vars));
    // The most expensive picks fill the included slots (paying only their surcharge); extras pay full price.
    [...inCat].sort((x, y) => y.price - x.price).forEach((p, i) => {
      const included = i < max;
      lines.push({ ...line(p), price: included ? (p.surcharge || 0) : p.price, included });
    });
  }
  const subtotal = size.basePrice + lines.reduce((s, l) => s + l.price, 0);
  return {
    size: { id: size.id, name: size.name, nameEn: size.nameEn, serves: size.serves, servesEn: size.servesEn, basePrice: size.basePrice },
    lines, subtotal,
  };
}

function newOrderId() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  return `CP-${ymd}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function buildWhatsappText(order, catalog) {
  const L = order.lang, m = k => msg(L, k), $ = n => formatMoney(n, order.currencyCode);
  const byCat = {};
  order.lines.forEach(l => (byCat[l.category] ||= []).push(l));
  let t = `*${m('newOrder')} ${order.id}* 🧀

`;
  t += `*${m('table')}:* ${loc(L, order.size)} (${loc(L, order.size, 'serves')}) - ${$(order.size.basePrice)}
`;
  for (const [cat, lines] of Object.entries(byCat)) {
    t += `
*${loc(L, catalog.categories.find(c => c.id === cat)) || cat}:*
`;
    lines.forEach(l => { t += `• ${loc(L, l)}${l.price ? ` (+${$(l.price)})` : ''}
`; });
  }
  t += `
*${m('subtotal')}:* ${$(order.subtotal)}`;
  if (order.deliveryFee) t += `
*${m('delivery')}:* ${$(order.deliveryFee)}`;
  t += `
*${m('total')}:* ${$(order.total)}
`;
  const cu = order.customer;
  t += `
*${m('customer')}:* ${cu.name}
*${m('phone')}:* ${cu.phone}`;
  if (cu.email) t += `
*${m('email')}:* ${cu.email}`;
  t += `
*${order.fulfillment === 'delivery' ? m('delivery') : m('pickup')}:* ${cu.date} ${cu.time || ''}`;
  if (order.fulfillment === 'delivery') t += `
*${m('address2')}:* ${cu.address}`;
  if (cu.occasion) t += `
*${m('occasion')}:* ${cu.occasion}`;
  if (cu.notes) t += `
*${m('notes')}:* ${cu.notes}`;
  return t;
}

// Date rules: minimum notice, closed weekdays, daily capacity.
async function checkDate(settings, date, lang) {
  const day = new Date(date + 'T12:00:00');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(day)) throw new UserError(msg(lang, 'badDate'));
  const lead = parseInt(settings.minLeadDays) || 0;
  const earliest = new Date(Date.now() + lead * 86_400_000).toISOString().slice(0, 10);
  if (date < earliest) throw new UserError(msg(lang, 'leadTime', { n: lead }));
  if ((settings.closedWeekdays || []).includes(day.getDay())) throw new UserError(msg(lang, 'closedDay'));
  const cap = parseInt(settings.maxOrdersPerDay) || 0;
  if (cap && (await db.countOrdersOn(date)) >= cap) throw new UserError(msg(lang, 'fullDay'));
}

// ---------- app ----------
const app = express();
app.set('trust proxy', 1); // correct client IPs for rate limiting behind a host's proxy
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
}));

// CORS only for the explicitly allowed origins (e.g. the static GitHub Pages front end).
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE',
      Vary: 'Origin',
    });
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '200kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const apiLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false });
const orderLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Too many orders from this connection, please try again later' } });
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false,
  skipSuccessfulRequests: true, message: { error: 'Too many login attempts, try again in 15 minutes' } });
app.use('/api', apiLimiter);

// Public catalog (only active entries)
app.get('/api/catalog', wrap(async (req, res) => {
  res.json(publicCatalog(await getCatalog()));
}));

app.post('/api/orders', orderLimiter, async (req, res) => {
  const lang = (req.body || {}).lang === 'en' ? 'en' : 'es';
  try {
    const catalog = await getCatalog();
    const { sizeId, itemIds, customer = {}, fulfillment } = req.body || {};
    const str = v => (typeof v === 'string' ? v.trim().slice(0, 500) : '');
    const cu = {
      name: str(customer.name), phone: str(customer.phone), email: str(customer.email),
      address: str(customer.address), date: str(customer.date), time: str(customer.time),
      occasion: str(customer.occasion), notes: str(customer.notes),
    };
    const st = catalog.settings;
    const mode = fulfillment === 'pickup' ? 'pickup' : 'delivery';
    if (!cu.name || !cu.phone || !cu.date) throw new UserError(msg(lang, 'required'));
    if (mode === 'delivery' && st.deliveryEnabled === false) throw new UserError(msg(lang, 'noDelivery'));
    if (mode === 'pickup' && st.pickupEnabled === false) throw new UserError(msg(lang, 'noPickup'));
    if (mode === 'delivery' && !cu.address) throw new UserError(msg(lang, 'address'));
    await checkDate(st, cu.date, lang);

    const priced = priceOrder(catalog, sizeId, itemIds, lang);
    if (priced.lines.length === 0) throw new UserError(msg(lang, 'empty'));
    const currency = st.currencyCode || 'COP';
    if (st.minOrderTotal && priced.subtotal < st.minOrderTotal) throw new UserError(msg(lang, 'minOrder', { min: formatMoney(st.minOrderTotal, currency) }));
    const freeFrom = Number(st.freeDeliveryFrom) || 0;
    const deliveryFee = mode === 'delivery' && !(freeFrom && priced.subtotal >= freeFrom) ? Number(st.deliveryFee) || 0 : 0;
    const order = {
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      status: 'new',
      lang,
      currencyCode: currency,
      fulfillment: mode,
      ...priced,
      deliveryFee,
      total: priced.subtotal + deliveryFee,
      customer: cu,
    };
    await db.saveOrder(order);

    const text = buildWhatsappText(order, catalog);
    const whatsappUrl = `https://wa.me/${catalog.settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    res.json({ order, whatsappUrl, whatsappText: text });
  } catch (e) {
    if (!(e instanceof UserError)) console.error(e);
    res.status(e instanceof UserError ? 400 : 500).json({ error: e instanceof UserError ? e.message : 'Server error' });
  }
});

// ---------- admin ----------
// Sessions: random token given to the browser, only its SHA-256 hash is stored, expires after SESSION_HOURS.
const bearer = req => (req.headers.authorization || '').replace(/^Bearer /, '');
app.post('/api/admin/login', loginLimiter, wrap(async (req, res) => {
  const pw = String((req.body || {}).password || '');
  // Hash both sides so the comparison is constant-time and doesn't leak the password length.
  if (!crypto.timingSafeEqual(sha256(pw), sha256(ADMIN_PASSWORD))) return res.status(401).json({ error: 'Wrong password' });
  const token = crypto.randomBytes(32).toString('hex');
  await db.createSession(sha256(token).toString('hex'), SESSION_HOURS);
  res.json({ token, expiresInHours: SESSION_HOURS });
}));
app.post('/api/admin/logout', wrap(async (req, res) => {
  await db.deleteSession(sha256(bearer(req)).toString('hex'));
  res.json({ ok: true });
}));
const requireAdmin = wrap(async (req, res, next) => {
  const token = bearer(req);
  if (!token || !(await db.isValidSession(sha256(token).toString('hex')))) return res.status(401).json({ error: 'Unauthorized' });
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/admin/orders', requireAdmin, wrap(async (req, res) => {
  res.json(await db.getOrders());
}));

app.patch('/api/admin/orders/:id', requireAdmin, wrap(async (req, res) => {
  const o = await db.getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const { status, adminNotes } = req.body || {};
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    o.status = status;
  }
  if (adminNotes !== undefined) o.adminNotes = String(adminNotes).slice(0, 2000);
  o.updatedAt = new Date().toISOString();
  await db.saveOrder(o);
  res.json(o);
}));

app.delete('/api/admin/orders/:id', requireAdmin, wrap(async (req, res) => {
  if (!(await db.deleteOrder(req.params.id))) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
}));

app.get('/api/admin/stats', requireAdmin, wrap(async (req, res) => {
  const all = await db.getOrders();
  const valid = all.filter(o => o.status !== 'cancelled');
  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const byStatus = Object.fromEntries(STATUSES.map(s => [s, all.filter(o => o.status === s).length]));
  const bySize = {};
  const products = {};
  const byMonth = {};
  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  valid.forEach(o => {
    const sk = o.size.id;
    bySize[sk] ||= { name: o.size.name, nameEn: o.size.nameEn, count: 0, revenue: 0 };
    bySize[sk].count++;
    bySize[sk].revenue += o.total;
    o.lines.forEach(l => {
      products[l.id] ||= { name: l.name, nameEn: l.nameEn, category: l.category, count: 0 };
      products[l.id].count++;
    });
    const m = o.createdAt.slice(0, 7);
    byMonth[m] ||= { orders: 0, revenue: 0 };
    byMonth[m].orders++;
    byMonth[m].revenue += o.total;
    const d = new Date(o.customer.date + 'T12:00:00');
    if (!isNaN(d)) byWeekday[d.getDay()]++;
  });
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    totalOrders: all.length,
    validOrders: valid.length,
    revenue,
    avgTicket: valid.length ? revenue / valid.length : 0,
    pending: all.filter(o => ['new', 'confirmed', 'preparing'].includes(o.status)).length,
    upcoming: valid.filter(o => o.status !== 'delivered' && o.customer.date >= today)
      .sort((a, b) => a.customer.date.localeCompare(b.customer.date)).slice(0, 5)
      .map(o => ({ id: o.id, name: o.customer.name, date: o.customer.date, time: o.customer.time, size: o.size, total: o.total })),
    byStatus, bySize,
    topProducts: Object.values(products).sort((a, b) => b.count - a.count).slice(0, 10),
    byMonth: Object.entries(byMonth).sort().map(([month, v]) => ({ month, ...v })),
    byWeekday,
  });
}));

app.get('/api/admin/catalog', requireAdmin, wrap(async (req, res) => res.json(await getCatalog())));

app.put('/api/admin/catalog', requireAdmin, wrap(async (req, res) => {
  const c = req.body;
  if (!c || !c.settings || !Array.isArray(c.sizes) || !Array.isArray(c.products) || !Array.isArray(c.categories)) {
    return res.status(400).json({ error: 'Invalid catalog' });
  }
  const num = v => Math.max(0, Number(v) || 0);
  const int = v => Math.max(0, parseInt(v) || 0);
  c.products.forEach(p => {
    p.price = num(p.price); p.surcharge = num(p.surcharge);
    if (!p.id) p.id = 'p' + crypto.randomBytes(4).toString('hex');
  });
  c.sizes.forEach(s => {
    s.basePrice = num(s.basePrice);
    s.limits ||= {}; s.mins ||= {};
    for (const k of Object.keys(s.limits)) s.limits[k] = int(s.limits[k]);
    for (const k of Object.keys(s.mins)) s.mins[k] = Math.min(int(s.mins[k]), s.limits[k] ?? 0);
    s.allowExtras = !!s.allowExtras;
    if (s.servesMin === undefined) Object.assign(s, parseServes(s.serves)); // older catalogs stored free text
    s.servesMin = int(s.servesMin); s.servesMax = int(s.servesMax);
    if (s.servesMax && s.servesMax < s.servesMin) [s.servesMin, s.servesMax] = [s.servesMax, s.servesMin];
    s.serves = servesLabel(s.servesMin, s.servesMax, 'es');
    s.servesEn = servesLabel(s.servesMin, s.servesMax, 'en');
  });
  const st = c.settings;
  for (const k of ['deliveryFee', 'freeDeliveryFrom', 'minOrderTotal']) st[k] = num(st[k]);
  for (const k of ['minLeadDays', 'maxOrdersPerDay']) st[k] = int(st[k]);
  st.closedWeekdays = [...new Set((st.closedWeekdays || []).map(Number).filter(d => d >= 0 && d <= 6))];
  st.deliveryEnabled = st.deliveryEnabled !== false;
  st.pickupEnabled = st.pickupEnabled !== false;
  if (!st.deliveryEnabled && !st.pickupEnabled) return res.status(400).json({ error: 'Enable delivery or pickup' });
  await db.saveCatalog(c);
  res.json(c);
}));

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') return res.status(400).json({ error: 'Invalid request body' });
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`Cheese Picks running at http://localhost:${PORT}`);
    console.log(`Admin console:      http://localhost:${PORT}/admin`);
  });
}).catch(err => {
  console.error('Could not connect to the database:', err.message);
  process.exit(1);
});
