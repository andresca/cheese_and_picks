// Admin console (uses i18n.js: t, tr, LANG, setLang, formatMoney)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STATUSES = ['new', 'confirmed', 'preparing', 'delivered', 'cancelled'];
const CURRENCIES = ['COP', 'USD', 'EUR', 'MXN'];
const app = document.getElementById('app');
let tab = 'dashboard';
let catalog = null;
let orders = [];
const filters = { status: '', q: '', from: '', to: '' };

const money = (n, code) => formatMoney(n, code || catalog?.settings.currencyCode || 'COP');
const st = s => t('status_' + s);

// Sign-in is handled by Cloudflare Access (email one-time code) before this page loads;
// its cookie is sent automatically with every same-origin request.
async function api(path, opts = {}) {
  let res, data;
  try {
    res = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    data = await res.json();
  } catch {
    // Expired Access session: Cloudflare answers with a redirect to its login page instead of JSON.
    renderSignedOut();
    throw new Error(t('sessionExpired'));
  }
  if (res.status === 401 || res.status === 403) { renderSignedOut(data.error); throw new Error(data.error); }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Ends the Cloudflare Access session; the next visit asks for a new email code.
// The team-domain logout is used because the app-domain one (/cdn-cgi/access/logout) still points at the
// team's old name after the rename and shows "Unable to find your Access organization".
document.getElementById('logout').onclick = () => { location.href = 'https://websportal.cloudflareaccess.com/cdn-cgi/access/logout'; };

// language switch in header
const langBox = document.getElementById('langBox');
langBox.innerHTML = langSwitcher();
langBox.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => {
  setLang(b.dataset.lang);
  if (catalog) renderShell();
});
setLang(LANG);

// ---------- signed out / session expired ----------
function renderSignedOut(detail) {
  document.getElementById('logout').style.display = 'none';
  // With a detail the email login worked but the API refused it (config problem); without one the Access session expired.
  app.innerHTML = detail
    ? `<div class="card login">
    <h2>${t('accessDenied')}</h2>
    <p class="muted">${t('accessDeniedHelp')}</p><div class="error">${esc(detail)}</div>
    <button class="btn" style="width:100%" id="relogin">${t('retry')}</button></div>`
    : `<div class="card login">
    <h2>${t('login')}</h2>
    <p class="muted">${t('sessionExpired')}</p>
    <button class="btn" style="width:100%" id="relogin">${t('enter')}</button></div>`;
  document.getElementById('relogin').onclick = () => location.reload();
}

async function start() {
  document.getElementById('logout').style.display = '';
  try { catalog = await api('/api/admin/catalog'); } catch (e) {
    // 401/403 already rendered the signed-out card; anything else (e.g. API misconfigured) would leave a blank page.
    if (!app.innerHTML.trim()) app.innerHTML = `<div class="card login"><div class="error">${esc(e.message)}</div></div>`;
    return;
  }
  renderShell();
}

function renderShell() {
  app.innerHTML = `<div class="tabs">
      ${[['dashboard', 'tabDashboard'], ['orders', 'tabOrders'], ['catalog', 'tabCatalog'], ['settings', 'tabSettings']]
        .map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'active' : ''}">${t(l)}</button>`).join('')}
    </div><div id="view"></div>`;
  app.querySelectorAll('[data-tab]').forEach(b => b.onclick = async () => {
    if (tab === 'catalog' && b.dataset.tab !== 'catalog' && !(await leaveCatalog())) return;
    tab = b.dataset.tab; renderShell();
  });
  ({ dashboard: renderDashboard, orders: renderOrders, catalog: renderCatalog, settings: renderSettings })[tab]();
}
const view = () => document.getElementById('view');

// ---------- dashboard ----------
function bars(rows, fmt = v => v) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return rows.length ? rows.map(r => `<div class="bar"><span class="lbl" title="${esc(r.label)}">${esc(r.label)}</span>
    <div class="track"><div class="fill" style="width:${(r.value / max) * 100}%"></div></div><span class="n">${fmt(r.value)}</span></div>`).join('')
    : `<p class="muted">${t('noData')}</p>`;
}

async function renderDashboard() {
  view().innerHTML = `<p class="muted">${t('loading')}</p>`;
  const s = await api('/api/admin/stats');
  const days = t('weekdays');
  const m = v => money(v);
  view().innerHTML = `
    <div class="kpis">
      <div class="card kpi"><div class="v">${s.totalOrders}</div><div class="l">${t('kTotal')}</div></div>
      <div class="card kpi"><div class="v">${m(s.revenue)}</div><div class="l">${t('kRevenue')}</div></div>
      <div class="card kpi"><div class="v">${m(s.avgTicket)}</div><div class="l">${t('kAvg')}</div></div>
      <div class="card kpi"><div class="v">${s.pending}</div><div class="l">${t('kOpen')}</div></div>
    </div>
    <div class="two">
      <div class="card"><h3>${t('upcoming')}</h3>
        ${s.upcoming.length ? `<table class="t">${s.upcoming.map(u => `<tr><td>${esc(u.date)} ${esc(u.time)}</td><td>${esc(u.name)}</td><td>${esc(tr(u.size))}</td><td>${m(u.total)}</td></tr>`).join('')}</table>` : `<p class="muted">${t('nothingScheduled')}</p>`}
      </div>
      <div class="card"><h3>${t('byStatus')}</h3>${bars(STATUSES.map(k => ({ label: st(k), value: s.byStatus[k] })))}</div>
    </div>
    <div class="two">
      <div class="card"><h3>${t('revByMonth')}</h3>${bars(s.byMonth.map(x => ({ label: x.month, value: x.revenue })), m)}</div>
      <div class="card"><h3>${t('ordersByMonth')}</h3>${bars(s.byMonth.map(x => ({ label: x.month, value: x.orders })))}</div>
    </div>
    <div class="two">
      <div class="card"><h3>${t('sizesSold')}</h3>${bars(Object.values(s.bySize).map(v => ({ label: tr(v), value: v.count })))}</div>
      <div class="card"><h3>${t('revBySize')}</h3>${bars(Object.values(s.bySize).map(v => ({ label: tr(v), value: v.revenue })), m)}</div>
    </div>
    <div class="two">
      <div class="card"><h3>${t('topProducts')}</h3>${bars(s.topProducts.map(p => ({ label: tr(p), value: p.count })))}</div>
      <div class="card"><h3>${t('byWeekday')}</h3>${bars(days.map((d, i) => ({ label: d, value: s.byWeekday[i] })))}</div>
    </div>`;
}

// ---------- orders ----------
async function renderOrders() {
  orders = await api('/api/admin/orders');
  view().innerHTML = `<div class="card">
    <div class="filters">
      <input id="fq" placeholder="${esc(t('search'))}" value="${esc(filters.q)}">
      <select id="fs"><option value="">${t('allStatuses')}</option>${STATUSES.map(s => `<option value="${s}" ${filters.status === s ? 'selected' : ''}>${st(s)}</option>`).join('')}</select>
      <input type="date" id="ff" value="${filters.from}" title="${esc(t('dateFrom'))}">
      <input type="date" id="ft" value="${filters.to}" title="${esc(t('dateTo'))}">
      <button class="btn small ghost" id="csv">${t('exportCsv')}</button>
    </div>
    <div class="tablewrap" id="olist"></div></div>`;
  const bindF = (id, key) => document.getElementById(id).oninput = e => { filters[key] = e.target.value; drawOrders(); };
  bindF('fq', 'q'); bindF('fs', 'status'); bindF('ff', 'from'); bindF('ft', 'to');
  document.getElementById('csv').onclick = exportCsv;
  drawOrders();
}

function filteredOrders() {
  const q = filters.q.toLowerCase();
  return orders.filter(o =>
    (!filters.status || o.status === filters.status) &&
    (!filters.from || o.customer.date >= filters.from) &&
    (!filters.to || o.customer.date <= filters.to) &&
    (!q || [o.id, o.customer.name, o.customer.phone, o.customer.address].join(' ').toLowerCase().includes(q)));
}

function drawOrders() {
  const list = filteredOrders();
  document.getElementById('olist').innerHTML = list.length ? `<table class="t">
    <tr><th>${t('thOrder')}</th><th>${t('thPlaced')}</th><th>${t('thEvent')}</th><th>${t('thCustomer')}</th><th>${t('thTable')}</th><th>${t('thTotal')}</th><th>${t('thStatus')}</th></tr>
    ${list.map(o => `<tr class="clickable" data-id="${esc(o.id)}">
      <td><b>${esc(o.id)}</b></td>
      <td>${new Date(o.createdAt).toLocaleDateString(LANG === 'es' ? 'es-CO' : 'en-US')}</td>
      <td>${esc(o.customer.date)} ${esc(o.customer.time)}</td>
      <td>${esc(o.customer.name)}<br><span class="muted">${esc(o.customer.phone)}</span></td>
      <td>${esc(tr(o.size))}<br><span class="muted">${t(o.fulfillment)}</span></td>
      <td>${money(o.total, o.currencyCode)}</td>
      <td><span class="badge ${o.status}">${st(o.status)}</span></td></tr>`).join('')}
    </table>` : `<p class="muted">${t('noMatch')}</p>`;
  document.querySelectorAll('#olist [data-id]').forEach(tr => tr.onclick = () => openOrder(tr.dataset.id));
}

function openOrder(id) {
  const o = orders.find(x => x.id === id);
  const c = o.customer;
  const om = n => money(n, o.currencyCode);
  const catName = cid => tr(catalog.categories.find(x => x.id === cid)) || cid;
  const groups = {};
  o.lines.forEach(l => (groups[l.category] ||= []).push(l));
  const phoneDigits = c.phone.replace(/\D/g, '');
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="card modal">
    <div style="display:flex;justify-content:space-between;align-items:center"><h2>${esc(o.id)}</h2><button class="btn small ghost" data-close>✕</button></div>
    <p class="muted">${t('placed')} ${new Date(o.createdAt).toLocaleString(LANG === 'es' ? 'es-CO' : 'en-US')}</p>
    <h3>${t('customer')}</h3>
    <p><b>${esc(c.name)}</b><br>📞 ${esc(c.phone)} ${c.email ? '<br>✉️ ' + esc(c.email) : ''}<br>
    ${o.fulfillment === 'delivery' ? '🚚 ' + esc(c.address) : '🏠 ' + t('pickup')}<br>📅 ${esc(c.date)} ${esc(c.time)}
    ${c.occasion ? '<br>🎉 ' + esc(c.occasion) : ''}${c.notes ? '<br>📝 ' + esc(c.notes) : ''}</p>
    <h3>${t('order')}</h3>
    <table class="t">
      <tr><td><b>${esc(tr(o.size))}</b> (${esc(tr(o.size, 'serves'))})</td><td>${om(o.size.basePrice)}</td></tr>
      ${Object.entries(groups).map(([k, ls]) => `<tr><td colspan="2"><b>${esc(catName(k))}</b></td></tr>` +
        ls.map(l => `<tr><td>${esc(tr(l))}</td><td>${l.price ? om(l.price) : t('incl')}</td></tr>`).join('')).join('')}
      ${o.deliveryFee ? `<tr><td>${t('deliveryFee')}</td><td>${om(o.deliveryFee)}</td></tr>` : ''}
      <tr><td><b>${t('total')}</b></td><td><b>${om(o.total)}</b></td></tr>
    </table>
    <div class="field" style="margin-top:16px"><label>${t('status')}</label>
      <select id="ost">${STATUSES.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${st(s)}</option>`).join('')}</select></div>
    <div class="field"><label>${t('internalNotes')}</label><textarea id="onotes">${esc(o.adminNotes || '')}</textarea></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" id="osave">${t('save')}</button>
      ${phoneDigits ? `<a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/${phoneDigits}?text=${encodeURIComponent(
        (I18N[o.lang] || I18N.es).waGreeting.replace('{name}', c.name).replace('{id}', o.id))}">${t('waCustomer')}</a>` : ''}
      <button class="btn ghost" id="odel" style="margin-left:auto">${t('del')}</button>
    </div></div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  bg.onclick = e => { if (e.target === bg || e.target.hasAttribute('data-close')) close(); };
  bg.querySelector('#osave').onclick = async () => {
    await api(`/api/admin/orders/${encodeURIComponent(o.id)}`, { method: 'PATCH', body: { status: ost.value, adminNotes: onotes.value } });
    close(); renderOrders();
  };
  bg.querySelector('#odel').onclick = async () => {
    if (!confirm(t('confirmDelete', { id: o.id }))) return;
    await api(`/api/admin/orders/${encodeURIComponent(o.id)}`, { method: 'DELETE' });
    close(); renderOrders();
  };
}

function exportCsv() {
  const head = ['id', 'createdAt', 'status', 'eventDate', 'time', 'name', 'phone', 'email', 'fulfillment', 'address', 'size', 'items', 'currency', 'deliveryFee', 'total', 'notes'];
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = filteredOrders().map(o => [o.id, o.createdAt, o.status, o.customer.date, o.customer.time, o.customer.name, o.customer.phone,
    o.customer.email, o.fulfillment, o.customer.address, tr(o.size), o.lines.map(l => tr(l)).join('; '), o.currencyCode || '', o.deliveryFee, o.total, o.customer.notes].map(q).join(','));
  // BOM so Excel opens accents (á, ñ) correctly
  const blob = new Blob(['﻿' + [head.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// ---------- catalog ----------
let catTab = 'products'; // 'products' (categories + products) | 'sizes'
let productQuery = '';
const collapsed = new Set(); // category ids folded in the products view
let dirty = false;

window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

async function saveCatalog(msgEl) {
  try {
    catalog = await api('/api/admin/catalog', { method: 'PUT', body: catalog });
    setDirty(false);
    if (msgEl) { msgEl.textContent = t('saved'); setTimeout(() => msgEl.textContent = '', 2000); }
    return true;
  } catch (e) { alert(e.message); return false; }
}

// Edits stay local until "Save changes"; the bar shows whenever something is pending.
function setDirty(on = true) {
  dirty = on;
  const bar = document.getElementById('savebar');
  if (bar) bar.classList.toggle('show', on);
}

// Called before leaving the catalog: keep, save or discard pending edits.
async function leaveCatalog() {
  if (!dirty) return true;
  if (!confirm(t('discardConfirm'))) return false;
  catalog = await api('/api/admin/catalog');
  setDirty(false);
  return true;
}

// ----- drag and drop (HTML5; started only from the ⠿ handle so inputs stay usable) -----
let dragFrom = null; // { kind, i }
const clearMarks = () => document.querySelectorAll('.drop-over').forEach(el => el.classList.remove('drop-over'));
function makeDraggable(row, kind, i) {
  const handle = row.querySelector('.handle');
  handle.onmousedown = () => { row.draggable = true; };
  row.ondragstart = e => {
    dragFrom = { kind, i };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    row.classList.add('dragging');
  };
  row.ondragend = () => { row.draggable = false; row.classList.remove('dragging'); clearMarks(); dragFrom = null; };
}
function makeDropTarget(el, kind, onDrop) {
  el.ondragover = e => {
    if (dragFrom?.kind !== kind) return;
    e.preventDefault(); e.stopPropagation();
    clearMarks(); el.classList.add('drop-over');
  };
  el.ondrop = e => {
    if (dragFrom?.kind !== kind) return;
    e.preventDefault(); e.stopPropagation();
    const from = dragFrom.i;
    dragFrom = null; clearMarks();
    onDrop(from);
  };
}
// Move arr[from] so it lands just before arr[before] (or at the end).
function reorder(arr, from, before = arr.length) {
  const [x] = arr.splice(from, 1);
  arr.splice(before > from ? before - 1 : before, 0, x);
}
// Move a product into `cat`, before product index `before`, or at the end of that group.
function moveProduct(from, cat, before) {
  const arr = catalog.products;
  if (before === undefined) {
    const last = arr.reduce((acc, p, k) => (p.category === cat && k !== from ? k : acc), -1);
    before = last === -1 ? arr.length : last + 1;
  }
  arr[from].category = cat;
  reorder(arr, from, before);
  setDirty(); renderCatalog();
}

// Spanish + English inputs stacked in one cell
const pair = (attr, i, k, obj, ph = '') => `<input ${attr}="${i}" data-k="${k}" value="${esc(obj[k] || '')}" placeholder="${esc(ph)} ES">
  <input ${attr}="${i}" data-k="${k}En" value="${esc(obj[k + 'En'] || '')}" placeholder="${esc(ph)} EN">`;
const handle = `<span class="handle" title="${esc(t('dragHint'))}">⠿</span>`;
const touchArrows = (kind, i) => `<span class="touch-only"><button class="btn small ghost" data-up="${kind}:${i}">↑</button><button class="btn small ghost" data-down="${kind}:${i}">↓</button></span>`;

function renderCatalog() {
  view().innerHTML = `
    <div class="subtabs">
      <button data-ct="products" class="${catTab === 'products' ? 'active' : ''}">${t('subProducts')}</button>
      <button data-ct="sizes" class="${catTab === 'sizes' ? 'active' : ''}">${t('subSizes')}</button>
    </div>
    <div id="catview"></div>
    <div class="savebar ${dirty ? 'show' : ''}" id="savebar">
      <span>${t('unsaved')}</span>
      <button class="btn small ghost" id="discard">${t('discard')}</button>
      <button class="btn small" id="saveAll">${t('saveAll')}</button>
    </div>`;
  view().querySelectorAll('[data-ct]').forEach(b => b.onclick = () => { catTab = b.dataset.ct; renderCatalog(); });
  document.getElementById('saveAll').onclick = () => saveCatalog().then(ok => ok && renderCatalog());
  document.getElementById('discard').onclick = async () => {
    if (!confirm(t('discardConfirm'))) return;
    catalog = await api('/api/admin/catalog'); setDirty(false); renderCatalog();
  };
  (catTab === 'sizes' ? renderSizes : renderProducts)();
}

const val = el => el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value;
const priceStep = () => (CURRENCY_DIGITS[catalog.settings.currencyCode] ?? 2) === 0 ? 1000 : 0.5;

// Shared ↑/↓ buttons (touch screens, where drag and drop isn't available)
function bindArrows(root, lists) {
  root.querySelectorAll('[data-up],[data-down]').forEach(b => b.onclick = () => {
    const [kind, i] = (b.dataset.up || b.dataset.down).split(':');
    const { arr, same = () => true } = lists[kind];
    const dir = b.dataset.up ? -1 : 1;
    let j = +i + dir;
    while (j >= 0 && j < arr.length && !same(arr[j], arr[i])) j += dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setDirty(); renderCatalog();
  });
}

function renderProducts() {
  const root = document.getElementById('catview');
  const step = priceStep();
  const q = productQuery.trim().toLowerCase();
  const matches = p => !q || [p.name, p.nameEn, p.description, p.descriptionEn].join(' ').toLowerCase().includes(q);
  const count = id => catalog.products.filter(p => p.category === id).length;

  root.innerHTML = `
    <div class="card">
      <div class="section-h"><h3 style="margin:0">1. ${t('categories')}</h3>
        <button class="btn small ghost" id="addCat">${t('addCat')}</button></div>
      <p class="muted">${t('categoriesHelp')} ${t('catOrderHelp')}</p>
      <div class="dlist">
        ${catalog.categories.map((c, i) => `<div class="drow cat-row" data-ci="${i}">
          ${handle}
          <div class="stack">${pair('data-c', i, 'name', c, t('nameLbl'))}</div>
          <div class="stack grow">${pair('data-c', i, 'description', c, t('descLbl'))}</div>
          <label class="tog"><input type="checkbox" data-c="${i}" data-k="limited" ${c.limited ? 'checked' : ''}> ${t('limited')}</label>
          <span class="pill">${t('nProducts', { n: count(c.id) })}</span>
          ${touchArrows('c', i)}
          <button class="btn small ghost" data-delc="${i}" title="${esc(t('del'))}">🗑</button>
        </div>`).join('')}
      </div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="section-h"><h3 style="margin:0">2. ${t('products')}</h3>
        <input id="pq" placeholder="${esc(t('searchProducts'))}" value="${esc(productQuery)}" style="max-width:280px"></div>
      <p class="muted">${t('productsHelp')} ${t('dragHelp')}</p>
      ${catalog.categories.map(c => {
        const items = catalog.products.map((p, i) => [p, i]).filter(([p]) => p.category === c.id && matches(p));
        const open = !collapsed.has(c.id) || q;
        return `<div class="group" data-zone="${esc(c.id)}">
          <div class="group-h">
            <button class="fold" data-fold="${esc(c.id)}">${open ? '▾' : '▸'}</button>
            <b>${esc(tr(c))}</b>
            <span class="pill ${c.limited ? 'lim' : ''}">${c.limited ? t('limitedBadge') : t('unlimitedBadge')}</span>
            <span class="muted">${t('nProducts', { n: count(c.id) })}</span>
            <button class="btn small ghost" data-addp="${esc(c.id)}" style="margin-left:auto">${t('addHere')}</button>
          </div>
          ${open ? `<div class="dlist">
            ${items.length ? `<div class="drow head"><span></span><span>${t('nameLbl')}</span><span class="grow">${t('descLbl')}</span><span>${t('price')}</span><span>${t('surcharge')}</span><span>${t('active')}</span><span></span></div>` : ''}
            ${items.map(([p, i]) => `<div class="drow prod-row ${p.active ? '' : 'inactive'}" data-pi="${i}">
              ${handle}
              <div class="stack">${pair('data-p', i, 'name', p, t('nameLbl'))}</div>
              <div class="stack grow">${pair('data-p', i, 'description', p, t('descLbl'))}</div>
              <label class="cell"><span class="mlbl">${t('price')}</span><input data-p="${i}" data-k="price" type="number" min="0" step="${step}" value="${p.price}" class="num" title="${esc(t('price'))}"></label>
              <label class="cell"><span class="mlbl">${t('surcharge')}</span><input data-p="${i}" data-k="surcharge" type="number" min="0" step="${step}" value="${p.surcharge || 0}" class="num" title="${esc(t('surcharge'))}"></label>
              <label class="tog"><input type="checkbox" data-p="${i}" data-k="active" ${p.active ? 'checked' : ''}> <span class="mlbl">${t('active')}</span></label>
              <span>${touchArrows('p', i)}<button class="btn small ghost" data-delp="${i}" title="${esc(t('del'))}">🗑</button></span>
            </div>`).join('')}
            ${items.length ? '' : `<div class="empty-drop">${q ? t('noMatch') : t('emptyGroup')}</div>`}
          </div>` : ''}
        </div>`;
      }).join('')}
    </div>`;

  root.querySelectorAll('[data-c]').forEach(el => el.onchange = () => { catalog.categories[el.dataset.c][el.dataset.k] = val(el); setDirty(); if (el.dataset.k === 'limited') renderCatalog(); });
  root.querySelectorAll('[data-p]').forEach(el => el.onchange = () => {
    catalog.products[el.dataset.p][el.dataset.k] = val(el); setDirty();
    if (el.dataset.k === 'active') el.closest('.drow').classList.toggle('inactive', !el.checked);
  });
  const pq = document.getElementById('pq');
  pq.oninput = () => { productQuery = pq.value; renderCatalog(); const n = document.getElementById('pq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
  root.querySelectorAll('[data-fold]').forEach(b => b.onclick = () => {
    const id = b.dataset.fold; collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id); renderCatalog();
  });

  // categories: drag to reorder
  root.querySelectorAll('.cat-row').forEach(row => {
    const i = +row.dataset.ci;
    makeDraggable(row, 'cat', i);
    makeDropTarget(row, 'cat', from => { reorder(catalog.categories, from, i); setDirty(); renderCatalog(); });
  });
  // products: drop on a row = insert before it (and adopt its category); drop on a group = append to it
  root.querySelectorAll('.prod-row').forEach(row => {
    const i = +row.dataset.pi;
    makeDraggable(row, 'prod', i);
    makeDropTarget(row, 'prod', from => { if (from !== i) moveProduct(from, catalog.products[i].category, i); });
  });
  root.querySelectorAll('[data-zone]').forEach(zone => makeDropTarget(zone, 'prod', from => moveProduct(from, zone.dataset.zone)));
  bindArrows(root, {
    c: { arr: catalog.categories },
    p: { arr: catalog.products, same: (a, b) => a.category === b.category },
  });

  root.querySelectorAll('[data-delp]').forEach(b => b.onclick = () => {
    if (!confirm(t('confirmDelProduct'))) return;
    catalog.products.splice(b.dataset.delp, 1); setDirty(); renderCatalog();
  });
  root.querySelectorAll('[data-delc]').forEach(b => b.onclick = () => {
    const c = catalog.categories[b.dataset.delc];
    if (catalog.products.some(p => p.category === c.id)) return alert(t('catHasProducts'));
    if (!confirm(t('confirmDelCat'))) return;
    catalog.categories.splice(b.dataset.delc, 1);
    catalog.sizes.forEach(s => { delete s.limits?.[c.id]; delete s.mins?.[c.id]; });
    setDirty(); renderCatalog();
  });
  root.querySelectorAll('[data-addp]').forEach(b => b.onclick = () => {
    const category = b.dataset.addp;
    collapsed.delete(category);
    catalog.products.splice(catalog.products.reduce((acc, p, k) => (p.category === category ? k + 1 : acc), catalog.products.length), 0,
      { id: 'p' + Date.now(), category, name: t('newProduct'), nameEn: '', description: '', descriptionEn: '', price: 0, surcharge: 0, active: true });
    setDirty(); renderCatalog();
  });
  document.getElementById('addCat').onclick = () => {
    const name = prompt(t('catPrompt'));
    if (!name) return;
    const id = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cat' + Date.now();
    if (catalog.categories.some(c => c.id === id)) return alert(t('catExists'));
    catalog.categories.push({ id, name, nameEn: '', description: '', descriptionEn: '', limited: false });
    setDirty(); renderCatalog();
  };
}

// One card per size: basics, table type, what's included, and a live preview of the store card.
// Keep the generated text in sync locally (the server rebuilds it on save too).
function syncServes(s) {
  if (s.servesMin === undefined) {
    const [min = 0, max = min] = (String(s.serves || '').match(/\d+/g) || []).map(Number);
    Object.assign(s, { servesMin: min, servesMax: max });
  }
  s.serves = servesLabel(s.servesMin, s.servesMax, 'es');
  s.servesEn = servesLabel(s.servesMin, s.servesMax, 'en');
}

function sizePreview(s) {
  syncServes(s);
  const limited = catalog.categories.filter(c => c.limited);
  const lines = s.custom
    ? [t('noLimits'), t('perItem')]
    : limited.map(c => {
      const max = s.limits?.[c.id] ?? 0, min = Math.min(s.mins?.[c.id] ?? 0, max), cat = tr(c).toLowerCase();
      if (!max) return null;
      return min && min === max ? t('exactly', { n: max, cat }) : min ? t('between', { min, max, cat }) : t('upTo', { n: max, cat });
    }).filter(Boolean).concat(s.allowExtras ? [t('extrasAllowed')] : []);
  return `<div class="preview-card">
    <div class="muted" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.05em">${t('customerSees')}</div>
    <b style="font-size:1.1rem">${esc(tr(s)) || '—'}</b>
    <div class="muted">${esc(tr(s, 'serves'))}</div>
    <div class="pv-price">${s.custom ? t('from') : ''}${money(s.basePrice)}</div>
    ${tr(s, 'description') ? `<div class="muted" style="font-size:.9rem">${esc(tr(s, 'description'))}</div>` : ''}
    <ul>${lines.map(l => `<li>${esc(l)}</li>`).join('') || `<li class="warn">${t('nothingIncluded')}</li>`}</ul>
  </div>`;
}

function renderSizes() {
  const root = document.getElementById('catview');
  const limited = catalog.categories.filter(c => c.limited);
  const step = priceStep();
  const field = (i, k, label, help, s) => `<div class="field"><label>${label}</label>
    <div class="row2"><input data-s="${i}" data-k="${k}" value="${esc(s[k] || '')}" placeholder="ES"><input data-s="${i}" data-k="${k}En" value="${esc(s[k + 'En'] || '')}" placeholder="EN"></div>
    ${help ? `<small class="muted">${help}</small>` : ''}</div>`;

  root.innerHTML = `
    <div class="section-h" style="margin-top:0"><p class="muted" style="margin:0;max-width:720px">${t('sizesIntro')}</p>
      <button class="btn small" id="addSize">${t('addSize')}</button></div>
    <div class="size-grid">
    ${catalog.sizes.map((s, i) => `<div class="card size-card2 ${s.active ? '' : 'inactive'}" data-si="${i}">
      <div class="sc-head">
        ${handle}
        <h3 style="margin:0">${esc(tr(s)) || t('newSize')}</h3>
        <span class="pill ${s.custom ? '' : 'lim'}">${s.custom ? t('typeCustom') : t('typeFixed')}</span>
        <label class="tog" style="margin-left:auto"><input type="checkbox" data-s="${i}" data-k="active" ${s.active ? 'checked' : ''}> ${t('visibleInStore')}</label>
        ${touchArrows('s', i)}
        <button class="btn small ghost" data-dels="${i}" title="${esc(t('del'))}">🗑</button>
      </div>

      <div class="sc-body">
        <div>
          <h4>1. ${t('secBasics')}</h4>
          ${field(i, 'name', t('nameLbl'), t('sizeNameHelp'), s)}
          <div class="field"><label>${t('servesLbl')}</label>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${t('servesFrom')} <input data-s="${i}" data-k="servesMin" type="number" min="0" value="${s.servesMin || ''}" style="width:80px">
              ${t('servesTo')} <input data-s="${i}" data-k="servesMax" type="number" min="0" value="${s.servesMax || ''}" style="width:80px"> ${t('people')}</div>
            <small class="muted">${t('servesHelp')}</small></div>
          ${field(i, 'description', t('descLbl'), t('sizeDescHelp'), s)}

          <h4>2. ${t('secPricing')}</h4>
          <div class="choice">
            <label class="${s.custom ? '' : 'on'}"><input type="radio" name="type${i}" data-type="${i}" value="fixed" ${s.custom ? '' : 'checked'}>
              <b>${t('typeFixed')}</b><small class="muted">${t('typeFixedHelp')}</small></label>
            <label class="${s.custom ? 'on' : ''}"><input type="radio" name="type${i}" data-type="${i}" value="custom" ${s.custom ? 'checked' : ''}>
              <b>${t('typeCustom')}</b><small class="muted">${t('typeCustomHelp')}</small></label>
          </div>
          <div class="field"><label>${s.custom ? t('startingPrice') : t('tablePrice')}</label>
            <input data-s="${i}" data-k="basePrice" type="number" min="0" step="${step}" value="${s.basePrice}" style="max-width:200px">
            <small class="muted">${s.custom ? t('startingPriceHelp') : t('tablePriceHelp')}</small></div>

          ${s.custom ? '' : `<h4>3. ${t('secIncluded')}</h4>
          <p class="muted" style="margin-top:0">${t('includedHelp')}</p>
          ${limited.length ? `<div class="tablewrap"><table class="t inc">
            <tr><th>${t('category')}</th><th>${t('minPick')}</th><th>${t('maxPick')}</th><th></th></tr>
            ${limited.map(c => {
              const max = s.limits?.[c.id] ?? 0, min = s.mins?.[c.id] ?? 0;
              const note = !max ? t('notOffered') : min > max ? `<span class="warn">${t('minOverMax')}</span>` : min ? (min === max ? t('mustPick', { n: max }) : t('pickRange', { min, max })) : t('optionalUpTo', { n: max });
              return `<tr><td><b>${esc(tr(c))}</b></td>
                <td><input data-s="${i}" data-min="${c.id}" type="number" min="0" value="${min}" style="width:70px"></td>
                <td><input data-s="${i}" data-lim="${c.id}" type="number" min="0" value="${max}" style="width:70px"></td>
                <td class="muted" style="font-size:.85rem">${note}</td></tr>`;
            }).join('')}
          </table></div>` : `<p class="warn">${t('noLimitedCats')}</p>`}
          <label class="tog" style="margin-top:12px;align-items:flex-start"><input type="checkbox" data-s="${i}" data-k="allowExtras" ${s.allowExtras ? 'checked' : ''}>
            <span><b>${t('allowExtrasLbl')}</b><br><small class="muted">${t('allowExtrasHelp')}</small></span></label>`}
        </div>
        ${sizePreview(s)}
      </div>
    </div>`).join('')}
    </div>`;

  root.querySelectorAll('[data-s]').forEach(el => el.onchange = () => {
    const s = catalog.sizes[el.dataset.s];
    if (el.dataset.lim) (s.limits ||= {})[el.dataset.lim] = Number(el.value);
    else if (el.dataset.min) (s.mins ||= {})[el.dataset.min] = Number(el.value);
    else s[el.dataset.k] = val(el);
    setDirty();
    if (el.type === 'checkbox' || el.dataset.lim || el.dataset.min) return renderCatalog(); // notes/sections change
    // Text and price: refresh just the preview so focus isn't lost while tabbing through fields.
    const card = el.closest('.size-card2');
    card.querySelector('.preview-card').outerHTML = sizePreview(s);
    card.querySelector('.sc-head h3').textContent = tr(s) || t('newSize');
  });
  root.querySelectorAll('[data-type]').forEach(el => el.onchange = () => {
    catalog.sizes[el.dataset.type].custom = el.value === 'custom'; setDirty(); renderCatalog();
  });
  root.querySelectorAll('.size-card2').forEach(card => {
    const i = +card.dataset.si;
    makeDraggable(card, 'size', i);
    makeDropTarget(card, 'size', from => { reorder(catalog.sizes, from, i); setDirty(); renderCatalog(); });
  });
  bindArrows(root, { s: { arr: catalog.sizes } });
  root.querySelectorAll('[data-dels]').forEach(b => b.onclick = () => {
    if (!confirm(t('confirmDelSize'))) return;
    catalog.sizes.splice(b.dataset.dels, 1); setDirty(); renderCatalog();
  });
  document.getElementById('addSize').onclick = () => {
    catalog.sizes.push({ id: 'size' + Date.now(), name: t('newSize'), nameEn: '', serves: '', servesEn: '', description: '', descriptionEn: '',
      basePrice: 0, active: false, allowExtras: false, limits: {}, mins: {} });
    setDirty(); renderCatalog();
  };
}

// ---------- settings ----------
function renderSettings() {
  const s = catalog.settings;
  const code = s.currencyCode || 'COP';
  const closed = s.closedWeekdays || [];
  const chk = (id, on, label) => `<label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" id="${id}" style="width:auto" ${on ? 'checked' : ''}> ${label}</label>`;
  const numF = (id, label, v) => `<div class="field"><label>${label}</label><input id="${id}" type="number" min="0" value="${Number(v) || 0}"></div>`;
  view().innerHTML = `<div class="two">
    <div class="card">
      <h3>${t('business')}</h3>
      <div class="field"><label>${t('businessName')}</label><input id="bn" value="${esc(s.businessName)}"></div>
      <div class="field"><label>${t('waNumber')}</label><input id="wn" value="${esc(s.whatsappNumber)}">
        <small class="muted">${t('waHelp')}</small></div>
      <div class="field"><label>${t('currency')}</label><select id="cy">${CURRENCIES.map(c => `<option ${c === code ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    </div>
    <div class="card">
      <h3>${t('rules')}</h3>
      <p class="muted">${t('rulesHelp')}</p>
      <div class="field">${chk('de', s.deliveryEnabled !== false, t('deliveryEnabled'))}${chk('pe', s.pickupEnabled !== false, t('pickupEnabled'))}</div>
      <div class="row2">${numF('df', t('deliveryFee'), s.deliveryFee)}${numF('fd', t('freeDeliveryFrom'), s.freeDeliveryFrom)}</div>
      <div class="row2">${numF('mo', t('minOrderTotal'), s.minOrderTotal)}${numF('ld', t('minLeadDays'), s.minLeadDays)}</div>
      ${numF('mp', t('maxOrdersPerDay'), s.maxOrdersPerDay)}
      <div class="field"><label>${t('closedWeekdays')}</label><div style="display:flex;gap:12px;flex-wrap:wrap">
        ${t('weekdays').map((d, i) => `<label style="display:flex;gap:4px;align-items:center;font-weight:400"><input type="checkbox" data-wd="${i}" style="width:auto" ${closed.includes(i) ? 'checked' : ''}> ${d}</label>`).join('')}
      </div></div>
    </div></div>
    <button class="btn" id="ss">${t('saveSettings')}</button> <span class="muted" id="msg"></span>`;
  document.getElementById('ss').onclick = () => {
    if (!de.checked && !pe.checked) return alert(t('needOneMode'));
    Object.assign(catalog.settings, {
      businessName: bn.value, whatsappNumber: wn.value.replace(/\D/g, ''), currencyCode: cy.value,
      deliveryEnabled: de.checked, pickupEnabled: pe.checked,
      deliveryFee: Number(df.value), freeDeliveryFrom: Number(fd.value), minOrderTotal: Number(mo.value),
      minLeadDays: Number(ld.value), maxOrdersPerDay: Number(mp.value),
      closedWeekdays: [...view().querySelectorAll('[data-wd]:checked')].map(el => Number(el.dataset.wd)),
    });
    delete catalog.settings.currency; // legacy symbol field
    saveCatalog(msg);
  };
}

start();
