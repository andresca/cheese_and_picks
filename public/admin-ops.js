// Admin "Operations" tab: providers, ingredients (prices + stock), recipes & pricing, purchase planning.
// Loaded after admin.js and reuses its helpers (api, esc, money, view, catalog, orders, tr, t).
Object.assign(I18N.es, {
  tabOps: '📦 Operación', nIngredients: '{n} insumo(s)', subProviders: 'Proveedores', subIngredients: 'Insumos', subPricing: 'Costos y precios', subPlanning: 'Planeación',
  addProvider: '+ Proveedor', addIngredient: '+ Insumo', provName: 'Nombre', contactLbl: 'Contacto', phoneLbl: 'Teléfono', emailLbl: 'Correo',
  addressLbl: 'Dirección', deliveryDaysLbl: 'Días de entrega', leadDaysLbl: 'Días de anticipación', minOrderLbl: 'Pedido mínimo', notesLbl: 'Notas',
  noProviders: 'Aún no hay proveedores.', noIngredients: 'Aún no hay insumos.', providersHelp: 'Dónde compras: contacto, días de entrega y condiciones.',
  ingredientsHelp: 'Todo lo que compras (quesos, carnes, frutas, empaques…). Registra el precio de cada proveedor para comparar; se usa el preferido o, si no hay, el más barato.',
  unitLbl: 'Unidad', stockLbl: 'En stock', minStockLbl: 'Stock mínimo', unitCost: 'Costo / unidad', bestOffer: 'Mejor precio', preferred: 'Preferido',
  offers: 'Precios por proveedor', addOffer: '+ Precio', packSize: 'Cantidad del paquete', packPrice: 'Precio del paquete', updated: 'Actualizado',
  needProviderFirst: 'Primero agrega un proveedor.', lowStock: 'Stock bajo', confirmDelProvider: '¿Eliminar este proveedor? Sus precios también se borrarán.',
  confirmDelIngredient: '¿Eliminar este insumo? Se quitará de las recetas.', auto: 'Automático (más barato)', search: 'Buscar…',
  costingSettings: 'Parámetros de costo', laborPerHour: 'Mano de obra por hora', overheadPct: 'Gastos generales (%)', targetMargin: 'Margen objetivo (%)',
  costingHelp: 'Los gastos generales (arriendo, servicios, transporte) se suman como porcentaje del costo directo.',
  sizeCosts: 'Costo base por tamaño', sizeCostsHelp: 'Empaque/tabla y tiempo de armado de cada tamaño. El multiplicador escala las porciones de cada producto (Pequeña = 1).',
  portionMult: 'Multiplicador de porción', laborMin: 'Minutos de armado', packaging: 'Empaque y base', baseCost: 'Costo base',
  productRecipes: 'Receta por producto', productRecipesHelp: 'Cantidad de cada insumo para UNA porción (multiplicador 1).',
  addLine: '+ Insumo', portionCost: 'Costo porción', priceLbl: 'Precio', marginLbl: 'Margen', noRecipe: 'Sin receta',
  sizeSummary: 'Rentabilidad por tamaño', sizeSummaryHelp: 'Costo estimado de una tabla con el máximo de productos permitidos, usando el costo promedio de cada categoría.',
  estCost: 'Costo estimado', currentPrice: 'Precio actual', suggested: 'Precio sugerido', calculator: 'Calculadora de tabla',
  calcHelp: 'Elige tamaño y productos para ver costo, precio y margen exactos.', tableSize: 'Tamaño', directCost: 'Costo directo',
  overheadLbl: 'Gastos generales', laborLbl: 'Mano de obra', totalCost: 'Costo total', profit: 'Ganancia',
  planFrom: 'Desde', planTo: 'Hasta', planStatuses: 'Pedidos incluidos', planOrders: '{n} pedido(s) en el rango',
  extraTables: 'Tablas adicionales (sin pedido aún)', shopping: 'Lista de compras', needed: 'Necesario', toBuy: 'A comprar',
  packs: 'Paquetes', estCostShort: 'Costo', noProvider: 'Sin proveedor', sendWaProvider: 'Enviar por WhatsApp', copyList: 'Copiar',
  copied: 'Copiado', nothingToBuy: 'No hay nada que comprar para este rango.', missingRecipes: 'Productos sin receta (no se cuentan):',
  planHelp: 'Suma lo que necesitan los pedidos del rango (más tablas adicionales), resta el stock y completa hasta el stock mínimo.',
  waOrderGreeting: 'Hola {name}, quisiera hacer el siguiente pedido:', totalLbl: 'Total', saveOps: 'Guardar cambios', selectIngredient: '— insumo —',
  receivedStock: 'Marcar como recibido', receivedConfirm: '¿Sumar estas cantidades al stock?', deductStock: 'Descontar del stock',
  deductConfirm: '¿Descontar del stock lo necesario para estos pedidos?',
});
Object.assign(I18N.en, {
  tabOps: '📦 Operations', nIngredients: '{n} ingredient(s)', subProviders: 'Providers', subIngredients: 'Ingredients', subPricing: 'Costs & pricing', subPlanning: 'Planning',
  addProvider: '+ Provider', addIngredient: '+ Ingredient', provName: 'Name', contactLbl: 'Contact', phoneLbl: 'Phone', emailLbl: 'Email',
  addressLbl: 'Address', deliveryDaysLbl: 'Delivery days', leadDaysLbl: 'Lead time (days)', minOrderLbl: 'Minimum order', notesLbl: 'Notes',
  noProviders: 'No providers yet.', noIngredients: 'No ingredients yet.', providersHelp: 'Where you buy: contact, delivery days and terms.',
  ingredientsHelp: 'Everything you buy (cheeses, meats, fruit, packaging…). Add each provider\'s price to compare; the preferred one is used, otherwise the cheapest.',
  unitLbl: 'Unit', stockLbl: 'In stock', minStockLbl: 'Min stock', unitCost: 'Cost / unit', bestOffer: 'Best price', preferred: 'Preferred',
  offers: 'Prices by provider', addOffer: '+ Price', packSize: 'Pack size', packPrice: 'Pack price', updated: 'Updated',
  needProviderFirst: 'Add a provider first.', lowStock: 'Low stock', confirmDelProvider: 'Delete this provider? Its prices will be removed too.',
  confirmDelIngredient: 'Delete this ingredient? It will be removed from recipes.', auto: 'Automatic (cheapest)', search: 'Search…',
  costingSettings: 'Cost settings', laborPerHour: 'Labor per hour', overheadPct: 'Overhead (%)', targetMargin: 'Target margin (%)',
  costingHelp: 'Overhead (rent, utilities, transport) is added as a percentage of direct cost.',
  sizeCosts: 'Base cost per size', sizeCostsHelp: 'Packaging/board and assembly time per size. The multiplier scales each product\'s portion (Small = 1).',
  portionMult: 'Portion multiplier', laborMin: 'Assembly minutes', packaging: 'Packaging & base', baseCost: 'Base cost',
  productRecipes: 'Recipe per product', productRecipesHelp: 'Amount of each ingredient for ONE portion (multiplier 1).',
  addLine: '+ Ingredient', portionCost: 'Portion cost', priceLbl: 'Price', marginLbl: 'Margin', noRecipe: 'No recipe',
  sizeSummary: 'Profitability by size', sizeSummaryHelp: 'Estimated cost of a table with the maximum allowed items, using each category\'s average cost.',
  estCost: 'Estimated cost', currentPrice: 'Current price', suggested: 'Suggested price', calculator: 'Table calculator',
  calcHelp: 'Pick a size and items to see exact cost, price and margin.', tableSize: 'Size', directCost: 'Direct cost',
  overheadLbl: 'Overhead', laborLbl: 'Labor', totalCost: 'Total cost', profit: 'Profit',
  planFrom: 'From', planTo: 'To', planStatuses: 'Orders included', planOrders: '{n} order(s) in range',
  extraTables: 'Extra tables (no order yet)', shopping: 'Shopping list', needed: 'Needed', toBuy: 'To buy',
  packs: 'Packs', estCostShort: 'Cost', noProvider: 'No provider', sendWaProvider: 'Send via WhatsApp', copyList: 'Copy',
  copied: 'Copied', nothingToBuy: 'Nothing to buy for this range.', missingRecipes: 'Products without a recipe (not counted):',
  planHelp: 'Adds up what the orders in range need (plus extra tables), subtracts stock and tops up to the minimum stock.',
  waOrderGreeting: 'Hi {name}, I would like to order:', totalLbl: 'Total', saveOps: 'Save changes', selectIngredient: '— ingredient —',
  receivedStock: 'Mark as received', receivedConfirm: 'Add these quantities to stock?', deductStock: 'Deduct from stock',
  deductConfirm: 'Deduct what these orders need from stock?',
});

const UNITS = ['g', 'kg', 'ml', 'l', 'unit'];
let ops = null;
let opsTab = 'providers';
let opsDirty = false;
let ingQuery = '';
const plan = { from: '', to: '', statuses: ['new', 'confirmed', 'preparing'], extra: {} }; // extra: { sizeId: count }
const calc = { sizeId: '', items: new Set() };

const today = (d = 0) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
const fmtQty = (n, unit) => `${Math.round(n * 100) / 100} ${unit === 'unit' ? '' : unit}`.trim();
const pct = n => isFinite(n) ? `${Math.round(n * 10) / 10}%` : '—';
const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

async function loadOps() { if (!ops) ops = await api('/api/admin/ops'); }
function setOpsDirty(on = true) {
  opsDirty = on;
  document.getElementById('opsbar')?.classList.toggle('show', on);
}
async function saveOps() {
  try { ops = await api('/api/admin/ops', { method: 'PUT', body: ops }); setOpsDirty(false); return true; }
  catch (e) { alert(e.message); return false; }
}
async function leaveOps() {
  if (!opsDirty) return true;
  if (!confirm(t('discardConfirm'))) return false;
  ops = null; setOpsDirty(false);
  return true;
}
window.addEventListener('beforeunload', e => { if (opsDirty) { e.preventDefault(); e.returnValue = ''; } });

// ---------- costing ----------
const ingById = id => ops.ingredients.find(i => i.id === id);
const provById = id => ops.providers.find(p => p.id === id);
// The offer used for costing and buying: the preferred provider's, else the cheapest per unit.
function bestOffer(ing) {
  const offers = ing.offers.filter(o => o.packSize > 0);
  return offers.find(o => o.providerId === ing.preferredProviderId)
    || offers.reduce((a, o) => (!a || o.packPrice / o.packSize < a.packPrice / a.packSize ? o : a), null);
}
const unitCost = ing => { const o = ing && bestOffer(ing); return o ? o.packPrice / o.packSize : 0; };
const linesCost = (lines, mult = 1) => (lines || []).reduce((s, l) => s + l.qty * mult * unitCost(ingById(l.ingredientId)), 0);
const sizeRec = id => (ops.sizeRecipes[id] ||= { mult: 1, laborMin: 0, items: [] });
const sizeBase = id => { const r = sizeRec(id); return linesCost(r.items) + r.laborMin / 60 * ops.costing.laborPerHour; };
const productCost = (pid, sizeId) => linesCost(ops.recipes[pid], sizeId ? sizeRec(sizeId).mult : 1);
const withOverhead = c => c * (1 + ops.costing.overheadPct / 100);
const suggestedPrice = cost => cost / (1 - Math.min(95, ops.costing.targetMarginPct) / 100);
const margin = (price, cost) => price > 0 ? (price - cost) / price * 100 : NaN;
const marginCell = (price, cost) => {
  const m = margin(price, cost);
  return `<span class="${m < ops.costing.targetMarginPct ? 'warn' : ''}">${pct(m)}</span>`;
};

// ---------- shell ----------
async function renderOps() {
  view().innerHTML = `<p class="muted">${t('loading')}</p>`;
  await loadOps();
  view().innerHTML = `
    <div class="subtabs">
      ${[['providers', 'subProviders'], ['ingredients', 'subIngredients'], ['pricing', 'subPricing'], ['planning', 'subPlanning']]
        .map(([k, l]) => `<button data-ot="${k}" class="${opsTab === k ? 'active' : ''}">${t(l)}</button>`).join('')}
    </div>
    <div id="opsview"></div>
    <div class="savebar ${opsDirty ? 'show' : ''}" id="opsbar">
      <span>${t('unsaved')}</span>
      <button class="btn small ghost" id="opsDiscard">${t('discard')}</button>
      <button class="btn small" id="opsSave">${t('saveOps')}</button>
    </div>`;
  view().querySelectorAll('[data-ot]').forEach(b => b.onclick = () => { opsTab = b.dataset.ot; renderOps(); });
  document.getElementById('opsSave').onclick = () => saveOps().then(ok => ok && renderOps());
  document.getElementById('opsDiscard').onclick = () => {
    if (!confirm(t('discardConfirm'))) return;
    ops = null; setOpsDirty(false); renderOps();
  };
  ({ providers: renderProviders, ingredients: renderIngredients, pricing: renderPricing, planning: renderPlanning })[opsTab]();
}
const opsView = () => document.getElementById('opsview');
// Generic binding: inputs with data-bind="path" write into ops via a getter returning the target object.
function bindInputs(root, attr, getObj, rerender) {
  root.querySelectorAll(`[${attr}]`).forEach(el => el.onchange = () => {
    getObj(el)[el.dataset.k] = val(el); setOpsDirty();
    if (rerender) rerender(el);
  });
}

// ---------- providers ----------
function renderProviders() {
  const f = (i, k, label, p, type = 'text') => `<div class="field"><label>${label}</label>
    <input data-pv="${i}" data-k="${k}" type="${type}" ${type === 'number' ? 'min="0"' : ''} value="${esc(p[k] ?? '')}"></div>`;
  const used = id => ops.ingredients.filter(i => i.offers.some(o => o.providerId === id)).length;
  opsView().innerHTML = `
    <div class="section-h" style="margin-top:0"><p class="muted" style="margin:0">${t('providersHelp')}</p>
      <button class="btn small" id="addProv">${t('addProvider')}</button></div>
    ${ops.providers.length ? '' : `<div class="empty-drop">${t('noProviders')}</div>`}
    <div class="size-grid">
    ${ops.providers.map((p, i) => `<div class="card">
      <div class="sc-head"><h3 style="margin:0">${esc(p.name) || '—'}</h3>
        <span class="pill">${t('nIngredients', { n: used(p.id) })}</span>
        ${p.phone ? `<a class="btn small wa" style="margin-left:auto" target="_blank" rel="noopener" href="https://wa.me/${esc(p.phone.replace(/\D/g, ''))}">WhatsApp</a>` : '<span style="margin-left:auto"></span>'}
        <button class="btn small ghost" data-delpv="${i}" title="${esc(t('del'))}">🗑</button></div>
      <div class="row2" style="margin-top:12px">${f(i, 'name', t('provName'), p)}${f(i, 'contact', t('contactLbl'), p)}</div>
      <div class="row2">${f(i, 'phone', t('phoneLbl'), p)}${f(i, 'email', t('emailLbl'), p, 'email')}</div>
      <div class="row2">${f(i, 'address', t('addressLbl'), p)}${f(i, 'deliveryDays', t('deliveryDaysLbl'), p)}</div>
      <div class="row2">${f(i, 'leadDays', t('leadDaysLbl'), p, 'number')}${f(i, 'minOrder', t('minOrderLbl'), p, 'number')}</div>
      <div class="field"><label>${t('notesLbl')}</label><textarea data-pv="${i}" data-k="notes">${esc(p.notes)}</textarea></div>
    </div>`).join('')}
    </div>`;
  bindInputs(opsView(), 'data-pv', el => ops.providers[el.dataset.pv], el => el.dataset.k === 'name' && renderProviders());
  opsView().querySelectorAll('[data-delpv]').forEach(b => b.onclick = () => {
    if (!confirm(t('confirmDelProvider'))) return;
    const [p] = ops.providers.splice(b.dataset.delpv, 1);
    ops.ingredients.forEach(i => {
      i.offers = i.offers.filter(o => o.providerId !== p.id);
      if (i.preferredProviderId === p.id) i.preferredProviderId = '';
    });
    setOpsDirty(); renderProviders();
  });
  document.getElementById('addProv').onclick = () => {
    ops.providers.unshift({ id: newId('v'), name: '', contact: '', phone: '', email: '', address: '', deliveryDays: '', leadDays: 0, minOrder: 0, notes: '' });
    setOpsDirty(); renderProviders();
    opsView().querySelector('[data-pv="0"][data-k="name"]').focus();
  };
}

// ---------- ingredients ----------
function renderIngredients() {
  const q = ingQuery.trim().toLowerCase();
  const list = ops.ingredients.map((g, i) => [g, i]).filter(([g]) => !q || g.name.toLowerCase().includes(q));
  const provOpts = sel => ops.providers.map(p => `<option value="${esc(p.id)}" ${p.id === sel ? 'selected' : ''}>${esc(p.name || '—')}</option>`).join('');
  opsView().innerHTML = `
    <div class="section-h" style="margin-top:0"><p class="muted" style="margin:0;max-width:720px">${t('ingredientsHelp')}</p>
      <div style="display:flex;gap:8px"><input id="iq" placeholder="${esc(t('search'))}" value="${esc(ingQuery)}" style="max-width:220px">
      <button class="btn small" id="addIng">${t('addIngredient')}</button></div></div>
    ${ops.ingredients.length ? '' : `<div class="empty-drop">${t('noIngredients')}</div>`}
    <div class="size-grid">
    ${list.map(([g, i]) => {
      const best = bestOffer(g);
      const low = g.minStock > 0 && g.stock < g.minStock;
      return `<div class="card">
      <div class="sc-head">
        <input data-ig="${i}" data-k="name" value="${esc(g.name)}" placeholder="${esc(t('nameLbl'))}" style="max-width:280px;font-weight:600">
        ${low ? `<span class="pill lim">${t('lowStock')}</span>` : ''}
        <span class="pill" style="margin-left:auto">${t('unitCost')}: ${best ? money(unitCost(g)) + ' / ' + g.unit : '—'}</span>
        <button class="btn small ghost" data-delig="${i}" title="${esc(t('del'))}">🗑</button></div>
      <div class="ing-grid">
        <label class="cell"><span class="mlbl" style="display:block">${t('unitLbl')}</span>
          <select data-ig="${i}" data-k="unit">${UNITS.map(u => `<option ${u === g.unit ? 'selected' : ''}>${u}</option>`).join('')}</select></label>
        <label class="cell"><span class="mlbl" style="display:block">${t('stockLbl')}</span><input data-ig="${i}" data-k="stock" type="number" min="0" step="any" value="${g.stock}"></label>
        <label class="cell"><span class="mlbl" style="display:block">${t('minStockLbl')}</span><input data-ig="${i}" data-k="minStock" type="number" min="0" step="any" value="${g.minStock}"></label>
        <label class="cell"><span class="mlbl" style="display:block">${t('preferred')}</span>
          <select data-ig="${i}" data-k="preferredProviderId"><option value="">${t('auto')}</option>${provOpts(g.preferredProviderId)}</select></label>
      </div>
      <h4 style="margin:14px 0 6px">${t('offers')}</h4>
      ${g.offers.length ? `<div class="tablewrap"><table class="t">
        <tr><th>${t('subProviders')}</th><th>${t('packSize')} (${g.unit})</th><th>${t('packPrice')}</th><th>${t('unitCost')}</th><th>${t('updated')}</th><th></th></tr>
        ${g.offers.map((o, k) => `<tr>
          <td><select data-of="${i}:${k}" data-k="providerId">${provOpts(o.providerId)}</select></td>
          <td><input data-of="${i}:${k}" data-k="packSize" type="number" min="0" step="any" value="${o.packSize}" style="width:100px"></td>
          <td><input data-of="${i}:${k}" data-k="packPrice" type="number" min="0" step="any" value="${o.packPrice}" style="width:120px"></td>
          <td>${money(o.packPrice / (o.packSize || 1))}${o === best ? ` <span class="pill lim">${t('bestOffer')}</span>` : ''}</td>
          <td class="muted">${esc(o.updatedAt)}</td>
          <td><button class="btn small ghost" data-delof="${i}:${k}">✕</button></td></tr>`).join('')}
      </table></div>` : ''}
      <button class="btn small ghost" data-addof="${i}" style="margin-top:8px">${t('addOffer')}</button>
    </div>`;
    }).join('')}
    </div>`;
  const root = opsView();
  bindInputs(root, 'data-ig', el => ops.ingredients[el.dataset.ig], el => ['unit', 'preferredProviderId'].includes(el.dataset.k) && renderIngredients());
  const offer = el => { const [i, k] = el.dataset.of.split(':'); return ops.ingredients[i].offers[k]; };
  root.querySelectorAll('[data-of]').forEach(el => el.onchange = () => {
    const o = offer(el);
    o[el.dataset.k] = val(el); o.updatedAt = today();
    setOpsDirty(); renderIngredients();
  });
  root.querySelectorAll('[data-delof]').forEach(b => b.onclick = () => {
    const [i, k] = b.dataset.delof.split(':');
    ops.ingredients[i].offers.splice(k, 1); setOpsDirty(); renderIngredients();
  });
  root.querySelectorAll('[data-addof]').forEach(b => b.onclick = () => {
    if (!ops.providers.length) return alert(t('needProviderFirst'));
    const g = ops.ingredients[b.dataset.addof];
    const free = ops.providers.find(p => !g.offers.some(o => o.providerId === p.id)) || ops.providers[0];
    g.offers.push({ providerId: free.id, packSize: g.unit === 'g' || g.unit === 'ml' ? 1000 : 1, packPrice: 0, updatedAt: today() });
    setOpsDirty(); renderIngredients();
  });
  root.querySelectorAll('[data-delig]').forEach(b => b.onclick = () => {
    if (!confirm(t('confirmDelIngredient'))) return;
    const [g] = ops.ingredients.splice(b.dataset.delig, 1);
    const strip = lines => lines.filter(l => l.ingredientId !== g.id);
    for (const k of Object.keys(ops.recipes)) ops.recipes[k] = strip(ops.recipes[k]);
    for (const r of Object.values(ops.sizeRecipes)) r.items = strip(r.items);
    setOpsDirty(); renderIngredients();
  });
  const iq = document.getElementById('iq');
  iq.oninput = () => { ingQuery = iq.value; renderIngredients(); const n = document.getElementById('iq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
  document.getElementById('addIng').onclick = () => {
    ingQuery = '';
    ops.ingredients.unshift({ id: newId('i'), name: '', unit: 'g', stock: 0, minStock: 0, preferredProviderId: '', offers: [], notes: '' });
    setOpsDirty(); renderIngredients();
    opsView().querySelector('[data-ig="0"][data-k="name"]').focus();
  };
}

// ---------- pricing ----------
// Editable list of { ingredientId, qty } lines; `key` identifies the list for the handlers.
function linesEditor(lines, key) {
  const opts = sel => `<option value="">${t('selectIngredient')}</option>` + ops.ingredients
    .map(g => `<option value="${esc(g.id)}" ${g.id === sel ? 'selected' : ''}>${esc(g.name || '—')} (${g.unit})</option>`).join('');
  return `<div class="stack">${lines.map((l, k) => `<div class="rline">
      <select data-ln="${key}:${k}" data-k="ingredientId">${opts(l.ingredientId)}</select>
      <input data-ln="${key}:${k}" data-k="qty" type="number" min="0" step="any" value="${l.qty}" title="${esc(t('needed'))}">
      <span class="muted">${esc(ingById(l.ingredientId)?.unit || '')}</span>
      <button class="btn small ghost" data-delln="${key}:${k}">✕</button></div>`).join('')}
    <button class="btn small ghost" data-addln="${key}" style="align-self:flex-start">${t('addLine')}</button></div>`;
}
function linesFor(key) {
  const [kind, id] = key.split('|');
  if (kind === 's') return sizeRec(id).items;
  return (ops.recipes[id] ||= []);
}
function bindLines(root, rerender) {
  root.querySelectorAll('[data-ln]').forEach(el => el.onchange = () => {
    const [key, k] = el.dataset.ln.split(':');
    linesFor(key)[k][el.dataset.k] = val(el); setOpsDirty(); rerender();
  });
  root.querySelectorAll('[data-delln]').forEach(b => b.onclick = () => {
    const [key, k] = b.dataset.delln.split(':');
    linesFor(key).splice(k, 1); setOpsDirty(); rerender();
  });
  root.querySelectorAll('[data-addln]').forEach(b => b.onclick = () => {
    if (!ops.ingredients.length) return alert(t('noIngredients'));
    linesFor(b.dataset.addln).push({ ingredientId: '', qty: 0 }); rerender();
  });
}

// Estimated cost of a fixed table filled to its limits with average-cost items of each category.
function estimateSize(s) {
  let direct = sizeBase(s.id);
  if (!s.custom) {
    for (const c of catalog.categories.filter(c => c.limited)) {
      const n = s.limits?.[c.id] || 0;
      const prods = catalog.products.filter(p => p.active && p.category === c.id);
      if (!n || !prods.length) continue;
      direct += n * prods.reduce((a, p) => a + productCost(p.id, s.id), 0) / prods.length;
    }
  }
  return withOverhead(direct);
}

function renderPricing() {
  const c = ops.costing;
  const numIn = (k, label) => `<div class="field"><label>${label}</label><input data-cs data-k="${k}" type="number" min="0" step="any" value="${c[k]}"></div>`;
  const prodGroups = catalog.categories.map(cat => ({ cat, prods: catalog.products.filter(p => p.category === cat.id) })).filter(g => g.prods.length);
  opsView().innerHTML = `
    <div class="card"><h3>${t('costingSettings')}</h3><p class="muted">${t('costingHelp')}</p>
      <div class="ing-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">${numIn('laborPerHour', t('laborPerHour'))}${numIn('overheadPct', t('overheadPct'))}${numIn('targetMarginPct', t('targetMargin'))}</div></div>

    <div class="card" style="margin-top:18px"><h3>${t('sizeSummary')}</h3><p class="muted">${t('sizeSummaryHelp')}</p>
      <div class="tablewrap"><table class="t">
        <tr><th>${t('tableSize')}</th><th>${t('estCost')}</th><th>${t('currentPrice')}</th><th>${t('marginLbl')}</th><th>${t('suggested')}</th></tr>
        ${catalog.sizes.map(s => { const cost = estimateSize(s); return `<tr>
          <td><b>${esc(tr(s))}</b>${s.custom ? ` <span class="pill">${t('typeCustom')}</span>` : ''}</td>
          <td>${money(cost)}</td><td>${money(s.basePrice)}</td><td>${s.custom ? '—' : marginCell(s.basePrice, cost)}</td>
          <td>${s.custom ? '—' : money(suggestedPrice(cost))}</td></tr>`; }).join('')}
      </table></div></div>

    <div class="card" style="margin-top:18px"><h3>${t('calculator')}</h3><p class="muted">${t('calcHelp')}</p><div id="calc"></div></div>

    <div class="card" style="margin-top:18px"><h3>${t('sizeCosts')}</h3><p class="muted">${t('sizeCostsHelp')}</p>
      <div class="size-grid">${catalog.sizes.map(s => { const r = sizeRec(s.id); return `<div class="group" style="margin:0">
        <div class="group-h"><b>${esc(tr(s))}</b><span class="pill" style="margin-left:auto">${t('baseCost')}: ${money(sizeBase(s.id))}</span></div>
        <div class="row2"><div class="field"><label>${t('portionMult')}</label><input data-sr="${esc(s.id)}" data-k="mult" type="number" min="0.1" step="0.1" value="${r.mult}"></div>
          <div class="field"><label>${t('laborMin')}</label><input data-sr="${esc(s.id)}" data-k="laborMin" type="number" min="0" value="${r.laborMin}"></div></div>
        <label>${t('packaging')}</label>${linesEditor(r.items, 's|' + s.id)}</div>`; }).join('')}</div></div>

    <div class="card" style="margin-top:18px"><h3>${t('productRecipes')}</h3><p class="muted">${t('productRecipesHelp')}</p>
      ${prodGroups.map(({ cat, prods }) => `<div class="group"><div class="group-h"><b>${esc(tr(cat))}</b></div>
        <div class="tablewrap"><table class="t">
          <tr><th>${t('products')}</th><th>${t('subIngredients')}</th><th>${t('portionCost')}</th><th>${cat.limited ? t('surcharge') : t('priceLbl')}</th><th>${t('marginLbl')}</th></tr>
          ${prods.map(p => { const cost = withOverhead(productCost(p.id)); const price = cat.limited ? p.surcharge : p.price; return `<tr class="${p.active ? '' : 'inactive'}">
            <td><b>${esc(tr(p))}</b></td>
            <td style="min-width:300px">${linesEditor(ops.recipes[p.id] || [], 'p|' + p.id)}</td>
            <td>${ops.recipes[p.id]?.length ? money(cost) : `<span class="muted">${t('noRecipe')}</span>`}</td>
            <td>${price ? money(price) : '—'}</td>
            <td>${price && ops.recipes[p.id]?.length ? marginCell(price, cost) : '—'}</td></tr>`; }).join('')}
        </table></div></div>`).join('')}
    </div>`;
  const root = opsView();
  root.querySelectorAll('[data-cs]').forEach(el => el.onchange = () => { c[el.dataset.k] = val(el); setOpsDirty(); renderPricing(); });
  root.querySelectorAll('[data-sr]').forEach(el => el.onchange = () => { sizeRec(el.dataset.sr)[el.dataset.k] = val(el); setOpsDirty(); renderPricing(); });
  bindLines(root, renderPricing);
  renderCalc();
}

function renderCalc() {
  const box = document.getElementById('calc');
  if (!calc.sizeId || !catalog.sizes.some(s => s.id === calc.sizeId)) calc.sizeId = catalog.sizes[0]?.id || '';
  const s = catalog.sizes.find(x => x.id === calc.sizeId);
  if (!s) { box.innerHTML = `<p class="muted">${t('noData')}</p>`; return; }
  const picked = catalog.products.filter(p => calc.items.has(p.id));
  // Same price rule as the store: limited categories are included (surcharge only), others charge full price.
  const limited = new Set(catalog.categories.filter(c => c.limited).map(c => c.id));
  const price = s.basePrice + picked.reduce((a, p) => a + (s.custom || !limited.has(p.category) ? p.price : (p.surcharge || 0)), 0);
  const r = sizeRec(s.id);
  const labor = r.laborMin / 60 * ops.costing.laborPerHour;
  const direct = linesCost(r.items) + picked.reduce((a, p) => a + productCost(p.id, s.id), 0);
  const overhead = (direct + labor) * ops.costing.overheadPct / 100;
  const total = direct + labor + overhead;
  const row = (l, v, b) => `<tr><td>${b ? `<b>${l}</b>` : l}</td><td style="text-align:right">${b ? `<b>${v}</b>` : v}</td></tr>`;
  box.innerHTML = `<div class="sc-body">
    <div>
      <div class="field"><label>${t('tableSize')}</label><select id="calcSize">${catalog.sizes.map(x => `<option value="${esc(x.id)}" ${x.id === s.id ? 'selected' : ''}>${esc(tr(x))}</option>`).join('')}</select></div>
      ${catalog.categories.map(c => { const ps = catalog.products.filter(p => p.category === c.id && p.active); return ps.length ? `<div class="field"><label>${esc(tr(c))}</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px 14px">${ps.map(p => `<label class="tog"><input type="checkbox" data-calc="${esc(p.id)}" ${calc.items.has(p.id) ? 'checked' : ''}> ${esc(tr(p))}${ops.recipes[p.id]?.length ? '' : ' <span class="muted">*</span>'}</label>`).join('')}</div></div>` : ''; }).join('')}
    </div>
    <div class="preview-card"><table class="t">
      ${row(t('directCost'), money(direct))}${row(t('laborLbl'), money(labor))}${row(t('overheadLbl'), money(overhead))}
      ${row(t('totalCost'), money(total), true)}${row(t('currentPrice'), money(price))}
      ${row(t('profit'), money(price - total))}${row(t('marginLbl'), marginCell(price, total), true)}
      ${row(t('suggested'), money(suggestedPrice(total)))}
    </table>${picked.some(p => !ops.recipes[p.id]?.length) ? `<p class="muted" style="font-size:.8rem">* ${t('noRecipe')}</p>` : ''}</div>
  </div>`;
  document.getElementById('calcSize').onchange = e => { calc.sizeId = e.target.value; renderCalc(); };
  box.querySelectorAll('[data-calc]').forEach(el => el.onchange = () => { el.checked ? calc.items.add(el.dataset.calc) : calc.items.delete(el.dataset.calc); renderCalc(); });
}

// ---------- planning ----------
function planNeeds(planOrders, withExtra = true) {
  const need = {}; // ingredientId -> qty
  const missing = new Set();
  const add = (lines, mult) => (lines || []).forEach(l => { need[l.ingredientId] = (need[l.ingredientId] || 0) + l.qty * mult; });
  const table = (sizeId, productIds) => {
    add(sizeRec(sizeId).items, 1);
    productIds.forEach(pid => {
      if (!ops.recipes[pid]?.length) missing.add(pid);
      add(ops.recipes[pid], sizeRec(sizeId).mult);
    });
  };
  planOrders.forEach(o => table(o.size.id, o.lines.map(l => l.id)));
  // Extra tables: assume an average fill (each limited category at its max, average product).
  for (const [sizeId, n] of withExtra ? Object.entries(plan.extra) : []) {
    const s = catalog.sizes.find(x => x.id === sizeId);
    if (!s || !n) continue;
    add(sizeRec(sizeId).items, n);
    for (const c of catalog.categories.filter(c => c.limited)) {
      const prods = catalog.products.filter(p => p.active && p.category === c.id);
      const k = s.limits?.[c.id] || 0;
      if (!k || !prods.length) continue;
      prods.forEach(p => add(ops.recipes[p.id], sizeRec(sizeId).mult * n * k / prods.length));
    }
  }
  return { need, missing };
}

async function renderPlanning() {
  if (!plan.from) { plan.from = today(); plan.to = today(7); }
  orders = await api('/api/admin/orders');
  const planOrders = orders.filter(o => plan.statuses.includes(o.status) && o.customer.date >= plan.from && o.customer.date <= plan.to);
  const { need, missing } = planNeeds(planOrders);

  // Buy = needed + min stock - stock, rounded up to whole packs from the chosen provider.
  const rows = ops.ingredients.map(g => {
    const needed = need[g.id] || 0;
    const toBuy = Math.max(0, needed + g.minStock - g.stock);
    const offer = bestOffer(g);
    const packs = offer && toBuy > 0 ? Math.ceil(toBuy / offer.packSize) : 0;
    return { g, needed, toBuy, offer, packs, cost: offer ? packs * offer.packPrice : 0 };
  }).filter(r => r.needed > 0 || r.toBuy > 0);
  const byProv = {};
  rows.filter(r => r.toBuy > 0).forEach(r => (byProv[r.offer?.providerId || ''] ||= []).push(r));
  const provText = (p, list) => [t('waOrderGreeting', { name: p?.contact || p?.name || '' }), '',
    ...list.map(r => `• ${r.g.name}: ${r.offer ? `${r.packs} × ${fmtQty(r.offer.packSize, r.g.unit)}` : fmtQty(r.toBuy, r.g.unit)}`)].join('\n');

  opsView().innerHTML = `
    <div class="card">
      <p class="muted" style="margin-top:0">${t('planHelp')}</p>
      <div class="filters">
        <label class="cell">${t('planFrom')}<input type="date" id="pf" value="${plan.from}"></label>
        <label class="cell">${t('planTo')}<input type="date" id="pt" value="${plan.to}"></label>
      </div>
      <div class="field"><label>${t('planStatuses')}</label><div style="display:flex;gap:12px;flex-wrap:wrap">
        ${STATUSES.filter(s => s !== 'cancelled').map(s => `<label class="tog"><input type="checkbox" data-pst="${s}" ${plan.statuses.includes(s) ? 'checked' : ''}> ${st(s)}</label>`).join('')}
      </div></div>
      <div class="field"><label>${t('extraTables')}</label><div style="display:flex;gap:12px;flex-wrap:wrap">
        ${catalog.sizes.filter(s => !s.custom).map(s => `<label class="tog">${esc(tr(s))} <input type="number" min="0" data-px="${esc(s.id)}" value="${plan.extra[s.id] || 0}" style="width:70px"></label>`).join('')}
      </div></div>
      <p><b>${t('planOrders', { n: planOrders.length })}</b>${planOrders.length ? ': ' + planOrders.map(o => `${esc(o.id)} (${esc(o.customer.date)}, ${esc(tr(o.size))})`).join(', ') : ''}</p>
      ${missing.size ? `<p class="warn">${t('missingRecipes')} ${[...missing].map(id => esc(tr(catalog.products.find(p => p.id === id)) || id)).join(', ')}</p>` : ''}
      ${rows.length && planOrders.length ? `<button class="btn small ghost" id="deduct">${t('deductStock')}</button>` : ''}
    </div>
    <h3 style="margin-top:22px">${t('shopping')}</h3>
    ${Object.keys(byProv).length ? Object.entries(byProv).map(([pid, list]) => {
      const p = provById(pid);
      const total = list.reduce((a, r) => a + r.cost, 0);
      const phone = (p?.phone || '').replace(/\D/g, '');
      return `<div class="card" style="margin-bottom:14px">
        <div class="sc-head"><h3 style="margin:0">${esc(p?.name || t('noProvider'))}</h3>
          ${p?.deliveryDays ? `<span class="pill">${esc(p.deliveryDays)}</span>` : ''}
          ${p?.minOrder && total < p.minOrder ? `<span class="pill lim">${t('minOrderLbl')}: ${money(p.minOrder)}</span>` : ''}
          <span style="margin-left:auto"><b>${t('totalLbl')}: ${money(total)}</b></span></div>
        <div class="tablewrap"><table class="t">
          <tr><th>${t('subIngredients')}</th><th>${t('needed')}</th><th>${t('stockLbl')}</th><th>${t('toBuy')}</th><th>${t('packs')}</th><th>${t('estCostShort')}</th></tr>
          ${list.map(r => `<tr><td><b>${esc(r.g.name)}</b></td><td>${fmtQty(r.needed, r.g.unit)}</td><td>${fmtQty(r.g.stock, r.g.unit)}</td>
            <td>${fmtQty(r.toBuy, r.g.unit)}</td><td>${r.offer ? `${r.packs} × ${fmtQty(r.offer.packSize, r.g.unit)}` : '—'}</td><td>${r.offer ? money(r.cost) : '—'}</td></tr>`).join('')}
        </table></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          ${phone ? `<a class="btn small wa" target="_blank" rel="noopener" href="https://wa.me/${phone}?text=${encodeURIComponent(provText(p, list))}">${t('sendWaProvider')}</a>` : ''}
          <button class="btn small ghost" data-copy="${esc(pid)}">${t('copyList')}</button>
          <button class="btn small ghost" data-recv="${esc(pid)}">${t('receivedStock')}</button>
        </div></div>`;
    }).join('') : `<p class="muted">${t('nothingToBuy')}</p>`}`;

  const root = opsView();
  root.querySelector('#pf').onchange = e => { plan.from = e.target.value; renderPlanning(); };
  root.querySelector('#pt').onchange = e => { plan.to = e.target.value; renderPlanning(); };
  root.querySelectorAll('[data-pst]').forEach(el => el.onchange = () => {
    plan.statuses = el.checked ? [...plan.statuses, el.dataset.pst] : plan.statuses.filter(s => s !== el.dataset.pst); renderPlanning();
  });
  root.querySelectorAll('[data-px]').forEach(el => el.onchange = () => { plan.extra[el.dataset.px] = Math.max(0, Number(el.value) || 0); renderPlanning(); });
  root.querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => {
    try { await navigator.clipboard.writeText(provText(provById(b.dataset.copy), byProv[b.dataset.copy])); b.textContent = t('copied'); } catch {}
  });
  // Received: add the bought packs to stock (saved right away).
  root.querySelectorAll('[data-recv]').forEach(b => b.onclick = async () => {
    if (!confirm(t('receivedConfirm'))) return;
    byProv[b.dataset.recv].forEach(r => { r.g.stock += r.offer ? r.packs * r.offer.packSize : r.toBuy; });
    if (await saveOps()) renderPlanning();
  });
  const deduct = root.querySelector('#deduct');
  if (deduct) deduct.onclick = async () => {
    if (!confirm(t('deductConfirm'))) return;
    const { need: used } = planNeeds(planOrders, false);
    ops.ingredients.forEach(g => { g.stock = Math.max(0, g.stock - (used[g.id] || 0)); });
    if (await saveOps()) renderPlanning();
  };
}
