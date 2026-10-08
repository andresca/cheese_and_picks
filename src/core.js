// Business rules shared by the Worker API and the static build: pricing, order validation,
// date rules, WhatsApp text, catalog normalization and admin stats. No I/O here.

export const STATUSES = ['new', 'confirmed', 'preparing', 'delivered', 'cancelled'];

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
export const msg = (lang, key, vars = {}) => (MSG[lang] || MSG.es)[key].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const loc = (lang, obj, field = 'name') => (lang === 'en' && obj?.[field + 'En']) || obj?.[field] || '';
export class UserError extends Error {}

const randomHex = bytes => [...crypto.getRandomValues(new Uint8Array(bytes))].map(b => b.toString(16).padStart(2, '0')).join('');

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

// The subset of the catalog the storefront sees (GET /api/catalog and the static catalog.json).
export function publicCatalog(cat) {
  const s = cat.settings;
  return {
    settings: {
      businessName: s.businessName, currencyCode: s.currencyCode || 'COP', deliveryFee: s.deliveryFee || 0,
      freeDeliveryFrom: s.freeDeliveryFrom || 0, minOrderTotal: s.minOrderTotal || 0, minLeadDays: s.minLeadDays || 0,
      closedWeekdays: s.closedWeekdays || [], deliveryEnabled: s.deliveryEnabled !== false, pickupEnabled: s.pickupEnabled !== false,
    },
    categories: cat.categories,
    sizes: cat.sizes.filter(x => x.active),
    products: cat.products.filter(x => x.active),
  };
}

// ---------- pricing (always computed server-side) ----------
const line = p => ({ id: p.id, name: p.name, nameEn: p.nameEn, category: p.category });
function priceOrder(catalog, sizeId, itemIds, lang) {
  const size = catalog.sizes.find(s => s.id === sizeId && s.active);
  if (!size) throw new UserError(msg(lang, 'badSize'));
  const products = new Map(catalog.products.filter(p => p.active).map(p => [p.id, p]));
  const unique = [...new Set(Array.isArray(itemIds) ? itemIds : [])];
  const items = unique.map(id => {
    const p = products.get(id);
    if (!p) throw new UserError(msg(lang, 'unavailable'));
    return p;
  });

  let tier = size, priced = priceAs(catalog, size, items, lang, true);
  // A custom selection that also fits a fixed table is charged as that table when it's cheaper.
  if (size.custom) {
    for (const s of catalog.sizes) {
      if (!s.active || s.custom) continue;
      const alt = priceAs(catalog, s, items, lang, false);
      if (alt && alt.subtotal < priced.subtotal) { tier = s; priced = alt; }
    }
  }
  return {
    size: { id: size.id, name: size.name, nameEn: size.nameEn, serves: size.serves, servesEn: size.servesEn, basePrice: tier.basePrice },
    ...(tier !== size && { pricedAs: { id: tier.id, name: tier.name, nameEn: tier.nameEn } }),
    ...priced,
  };
}

// Prices items under one size's rules. When the items don't fit the size, throws if `strict`, else returns null.
function priceAs(catalog, size, items, lang, strict) {
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
    const problem = inCat.length < min ? 'tooFew' : inCat.length > max && !size.allowExtras ? 'tooMany' : null;
    if (problem) {
      if (strict) throw new UserError(msg(lang, problem, vars));
      return null;
    }
    // The most expensive picks fill the included slots (paying only their surcharge); extras pay full price.
    [...inCat].sort((x, y) => y.price - x.price).forEach((p, i) => {
      const included = i < max;
      lines.push({ ...line(p), price: included ? (p.surcharge || 0) : p.price, included });
    });
  }
  return { lines, subtotal: size.basePrice + lines.reduce((s, l) => s + l.price, 0) };
}

function newOrderId() {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `CP-${ymd}-${randomHex(2).toUpperCase()}`;
}

function buildWhatsappText(order, catalog) {
  const L = order.lang, m = k => msg(L, k), $ = n => formatMoney(n, order.currencyCode);
  const byCat = {};
  order.lines.forEach(l => (byCat[l.category] ||= []).push(l));
  let t = `*${m('newOrder')} ${order.id}* 🧀\n\n`;
  t += `*${m('table')}:* ${loc(L, order.size)} (${loc(L, order.size, 'serves')}) - ${$(order.size.basePrice)}${order.pricedAs ? ` (= ${loc(L, order.pricedAs)})` : ''}\n`;
  for (const [cat, lines] of Object.entries(byCat)) {
    t += `\n*${loc(L, catalog.categories.find(c => c.id === cat)) || cat}:*\n`;
    lines.forEach(l => { t += `• ${loc(L, l)}${l.price ? ` (+${$(l.price)})` : ''}\n`; });
  }
  t += `\n*${m('subtotal')}:* ${$(order.subtotal)}`;
  if (order.deliveryFee) t += `\n*${m('delivery')}:* ${$(order.deliveryFee)}`;
  t += `\n*${m('total')}:* ${$(order.total)}\n`;
  const cu = order.customer;
  t += `\n*${m('customer')}:* ${cu.name}\n*${m('phone')}:* ${cu.phone}`;
  if (cu.email) t += `\n*${m('email')}:* ${cu.email}`;
  t += `\n*${order.fulfillment === 'delivery' ? m('delivery') : m('pickup')}:* ${cu.date} ${cu.time || ''}`;
  if (order.fulfillment === 'delivery') t += `\n*${m('address2')}:* ${cu.address}`;
  if (cu.occasion) t += `\n*${m('occasion')}:* ${cu.occasion}`;
  if (cu.notes) t += `\n*${m('notes')}:* ${cu.notes}`;
  return t;
}

// Date rules: minimum notice, closed weekdays, daily capacity (countOrdersOn is async, from the DB).
async function checkDate(settings, date, lang, countOrdersOn) {
  const day = new Date(date + 'T12:00:00');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(day)) throw new UserError(msg(lang, 'badDate'));
  const lead = parseInt(settings.minLeadDays) || 0;
  const earliest = new Date(Date.now() + lead * 86_400_000).toISOString().slice(0, 10);
  if (date < earliest) throw new UserError(msg(lang, 'leadTime', { n: lead }));
  if ((settings.closedWeekdays || []).includes(day.getDay())) throw new UserError(msg(lang, 'closedDay'));
  const cap = parseInt(settings.maxOrdersPerDay) || 0;
  if (cap && (await countOrdersOn(date)) >= cap) throw new UserError(msg(lang, 'fullDay'));
}

// Validates and prices an order request. Returns { order, whatsappUrl, whatsappText }; throws UserError.
export async function createOrder(catalog, body, countOrdersOn) {
  const lang = body.lang === 'en' ? 'en' : 'es';
  const { sizeId, itemIds, customer = {}, fulfillment } = body;
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
  await checkDate(st, cu.date, lang, countOrdersOn);

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
  const whatsappText = buildWhatsappText(order, catalog);
  const whatsappUrl = `https://wa.me/${String(st.whatsappNumber || '').replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`;
  return { order, whatsappUrl, whatsappText };
}

// Cleans up a catalog sent by the admin console. Returns an error string or null; mutates c.
export function normalizeCatalog(c) {
  if (!c || !c.settings || !Array.isArray(c.sizes) || !Array.isArray(c.products) || !Array.isArray(c.categories)) {
    return 'Invalid catalog';
  }
  const num = v => Math.max(0, Number(v) || 0);
  const int = v => Math.max(0, parseInt(v) || 0);
  c.products.forEach(p => {
    p.price = num(p.price); p.surcharge = num(p.surcharge);
    if (!p.id) p.id = 'p' + randomHex(4);
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
  if (!st.deliveryEnabled && !st.pickupEnabled) return 'Enable delivery or pickup';
  return null;
}

// ---------- back office (providers, ingredients, recipes) ----------
export const UNITS = ['g', 'kg', 'ml', 'l', 'unit'];
export const emptyOps = () => ({
  providers: [], ingredients: [], recipes: {}, sizeRecipes: {},
  costing: { laborPerHour: 0, overheadPct: 0, targetMarginPct: 60 },
});

export function normalizeOps(o) {
  if (!o || !Array.isArray(o.providers) || !Array.isArray(o.ingredients)) return 'Invalid data';
  const num = v => Math.max(0, Number(v) || 0);
  const str = (v, n = 300) => String(v ?? '').slice(0, n);
  o.providers = o.providers.map(p => ({
    id: str(p.id, 40) || 'v' + randomHex(4), name: str(p.name, 120), contact: str(p.contact, 120),
    phone: str(p.phone, 40), email: str(p.email, 120), address: str(p.address),
    deliveryDays: str(p.deliveryDays, 120), leadDays: num(p.leadDays), minOrder: num(p.minOrder), notes: str(p.notes, 2000),
  }));
  const providerIds = new Set(o.providers.map(p => p.id));
  o.ingredients = o.ingredients.map(i => ({
    id: str(i.id, 40) || 'i' + randomHex(4), name: str(i.name, 120),
    unit: UNITS.includes(i.unit) ? i.unit : 'g', stock: num(i.stock), minStock: num(i.minStock),
    preferredProviderId: providerIds.has(i.preferredProviderId) ? i.preferredProviderId : '',
    // A price offer: the provider sells packSize units (in the ingredient's unit) for packPrice.
    offers: (Array.isArray(i.offers) ? i.offers : []).filter(f => providerIds.has(f.providerId)).map(f => ({
      providerId: f.providerId, packSize: num(f.packSize) || 1, packPrice: num(f.packPrice), updatedAt: str(f.updatedAt, 30),
    })),
    notes: str(i.notes, 2000),
  }));
  const ingredientIds = new Set(o.ingredients.map(i => i.id));
  // recipes: { productId: [{ ingredientId, qty }] } per portion; sizeRecipes: { sizeId: { mult, laborMin, items } }
  const lines = arr => (Array.isArray(arr) ? arr : []).filter(l => ingredientIds.has(l.ingredientId))
    .map(l => ({ ingredientId: l.ingredientId, qty: num(l.qty) }));
  o.recipes = Object.fromEntries(Object.entries(o.recipes || {}).map(([k, v]) => [str(k, 40), lines(v)]));
  o.sizeRecipes = Object.fromEntries(Object.entries(o.sizeRecipes || {}).map(([k, v]) => [str(k, 40), {
    mult: Number(v?.mult) > 0 ? Number(v.mult) : 1, laborMin: num(v?.laborMin), items: lines(v?.items),
  }]));
  const c = o.costing || {};
  o.costing = { laborPerHour: num(c.laborPerHour), overheadPct: num(c.overheadPct), targetMarginPct: Math.min(95, num(c.targetMarginPct)) };
  return null;
}

export function computeStats(all) {
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
  return {
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
  };
}
