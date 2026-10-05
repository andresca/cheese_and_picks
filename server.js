const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DATA_DIR = path.join(__dirname, 'data');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const STATUSES = ['new', 'confirmed', 'preparing', 'delivered', 'cancelled'];

// ---------- storage ----------
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, data) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
const getCatalog = () => readJson(CATALOG_FILE, null);
const getOrders = () => readJson(ORDERS_FILE, []);

// ---------- i18n ----------
const MSG = {
  es: {
    badSize: 'Tamaño de tabla inválido', unavailable: 'Un producto seleccionado ya no está disponible',
    tooMany: 'Demasiados productos de {cat} para la tabla {size} (máx. {max})',
    required: 'Nombre, teléfono y fecha son obligatorios', address: 'La dirección es obligatoria para domicilio',
    empty: 'Por favor selecciona al menos un producto',
    newOrder: 'Nuevo pedido', table: 'Tabla', subtotal: 'Subtotal', delivery: 'Domicilio', total: 'TOTAL',
    customer: 'Cliente', phone: 'Teléfono', email: 'Correo', pickup: 'Recoger', address2: 'Dirección',
    occasion: 'Ocasión', notes: 'Notas',
  },
  en: {
    badSize: 'Invalid table size', unavailable: 'A selected item is no longer available',
    tooMany: 'Too many {cat} items for the {size} table (max {max})',
    required: 'Name, phone and date are required', address: 'Address is required for delivery',
    empty: 'Please select at least one item',
    newOrder: 'New order', table: 'Table', subtotal: 'Subtotal', delivery: 'Delivery', total: 'TOTAL',
    customer: 'Customer', phone: 'Phone', email: 'Email', pickup: 'Pickup', address2: 'Address',
    occasion: 'Occasion', notes: 'Notes',
  },
};
const msg = (lang, key, vars = {}) => (MSG[lang] || MSG.es)[key].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const loc = (lang, obj, field = 'name') => (lang === 'en' && obj?.[field + 'En']) || obj?.[field] || '';
class UserError extends Error {}

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

  const limitedCats = catalog.categories.filter(c => c.limited).map(c => c.id);
  const counts = {};
  items.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });

  if (!size.custom) {
    for (const cat of limitedCats) {
      const max = size.limits[cat] ?? 0;
      if ((counts[cat] || 0) > max) {
        const catObj = catalog.categories.find(c => c.id === cat);
        throw new UserError(msg(lang, 'tooMany', { cat: loc(lang, catObj).toLowerCase(), size: loc(lang, size), max }));
      }
    }
  }

  // Included items on base sizes cost nothing extra; custom tables pay per item.
  // Unlimited categories (wines/extras) are always charged.
  const lines = items.map(p => {
    const included = !size.custom && limitedCats.includes(p.category);
    return { id: p.id, name: p.name, nameEn: p.nameEn, category: p.category, price: included ? 0 : p.price, included };
  });
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

// ---------- app ----------
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Public catalog (only active entries)
app.get('/api/catalog', (req, res) => {
  const cat = getCatalog();
  res.json({
    settings: { businessName: cat.settings.businessName, currencyCode: cat.settings.currencyCode || 'COP', deliveryFee: cat.settings.deliveryFee },
    categories: cat.categories,
    sizes: cat.sizes.filter(s => s.active),
    products: cat.products.filter(p => p.active),
  });
});

app.post('/api/orders', (req, res) => {
  const lang = (req.body || {}).lang === 'en' ? 'en' : 'es';
  try {
    const catalog = getCatalog();
    const { sizeId, itemIds, customer = {}, fulfillment } = req.body || {};
    const str = v => (typeof v === 'string' ? v.trim().slice(0, 500) : '');
    const cu = {
      name: str(customer.name), phone: str(customer.phone), email: str(customer.email),
      address: str(customer.address), date: str(customer.date), time: str(customer.time),
      occasion: str(customer.occasion), notes: str(customer.notes),
    };
    const mode = fulfillment === 'pickup' ? 'pickup' : 'delivery';
    if (!cu.name || !cu.phone || !cu.date) throw new UserError(msg(lang, 'required'));
    if (mode === 'delivery' && !cu.address) throw new UserError(msg(lang, 'address'));

    const priced = priceOrder(catalog, sizeId, itemIds, lang);
    if (priced.lines.length === 0) throw new UserError(msg(lang, 'empty'));
    const deliveryFee = mode === 'delivery' ? Number(catalog.settings.deliveryFee) || 0 : 0;
    const order = {
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      status: 'new',
      lang,
      currencyCode: catalog.settings.currencyCode || 'COP',
      fulfillment: mode,
      ...priced,
      deliveryFee,
      total: priced.subtotal + deliveryFee,
      customer: cu,
    };
    const orders = getOrders();
    orders.push(order);
    writeJson(ORDERS_FILE, orders);

    const text = buildWhatsappText(order, catalog);
    const whatsappUrl = `https://wa.me/${catalog.settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    res.json({ order, whatsappUrl, whatsappText: text });
  } catch (e) {
    if (!(e instanceof UserError)) console.error(e);
    res.status(e instanceof UserError ? 400 : 500).json({ error: e instanceof UserError ? e.message : 'Server error' });
  }
});

// ---------- admin ----------
const sessions = new Set();
app.post('/api/admin/login', (req, res) => {
  const pw = String((req.body || {}).password || '');
  const ok = pw.length === ADMIN_PASSWORD.length &&
    crypto.timingSafeEqual(Buffer.from(pw), Buffer.from(ADMIN_PASSWORD));
  if (!ok) return res.status(401).json({ error: 'Wrong password' });
  const token = crypto.randomBytes(24).toString('hex');
  sessions.add(token);
  res.json({ token });
});
function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  res.json(getOrders().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const orders = getOrders();
  const o = orders.find(x => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const { status, adminNotes } = req.body || {};
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    o.status = status;
  }
  if (adminNotes !== undefined) o.adminNotes = String(adminNotes).slice(0, 2000);
  o.updatedAt = new Date().toISOString();
  writeJson(ORDERS_FILE, orders);
  res.json(o);
});

app.delete('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const orders = getOrders();
  const next = orders.filter(x => x.id !== req.params.id);
  if (next.length === orders.length) return res.status(404).json({ error: 'Not found' });
  writeJson(ORDERS_FILE, next);
  res.json({ ok: true });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const all = getOrders();
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
});

app.get('/api/admin/catalog', requireAdmin, (req, res) => res.json(getCatalog()));

app.put('/api/admin/catalog', requireAdmin, (req, res) => {
  const c = req.body;
  if (!c || !c.settings || !Array.isArray(c.sizes) || !Array.isArray(c.products) || !Array.isArray(c.categories)) {
    return res.status(400).json({ error: 'Invalid catalog' });
  }
  c.products.forEach(p => { p.price = Number(p.price) || 0; if (!p.id) p.id = 'p' + crypto.randomBytes(4).toString('hex'); });
  c.sizes.forEach(s => {
    s.basePrice = Number(s.basePrice) || 0;
    for (const k of Object.keys(s.limits || {})) s.limits[k] = Math.max(0, parseInt(s.limits[k]) || 0);
  });
  c.settings.deliveryFee = Number(c.settings.deliveryFee) || 0;
  writeJson(CATALOG_FILE, c);
  res.json(c);
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.listen(PORT, () => {
  console.log(`Cheese Picks running at http://localhost:${PORT}`);
  console.log(`Admin console:      http://localhost:${PORT}/admin`);
  if (!process.env.ADMIN_PASSWORD) console.log('WARNING: using default admin password "admin123". Set ADMIN_PASSWORD env var.');
});
