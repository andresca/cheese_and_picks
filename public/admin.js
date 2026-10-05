// Admin console (uses i18n.js: t, tr, LANG, setLang, formatMoney)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STATUSES = ['new', 'confirmed', 'preparing', 'delivered', 'cancelled'];
const CURRENCIES = ['COP', 'USD', 'EUR', 'MXN'];
const app = document.getElementById('app');
let token = sessionStorage.getItem('adminToken');
let tab = 'dashboard';
let catalog = null;
let orders = [];
const filters = { status: '', q: '', from: '', to: '' };

const money = (n, code) => formatMoney(n, code || catalog?.settings.currencyCode || 'COP');
const st = s => t('status_' + s);

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) { logout(); throw new Error('Session expired'); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function logout() {
  token = null;
  sessionStorage.removeItem('adminToken');
  renderLogin();
}
document.getElementById('logout').onclick = logout;

// language switch in header
const langBox = document.getElementById('langBox');
langBox.innerHTML = langSwitcher();
langBox.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => {
  setLang(b.dataset.lang);
  if (token && catalog) renderShell(); else if (!token) renderLogin();
});
setLang(LANG);

// ---------- login ----------
function renderLogin() {
  document.getElementById('logout').style.display = 'none';
  app.innerHTML = `<div class="card login">
    <h2>${t('login')}</h2>
    <form id="lf"><div class="field"><label>${t('password')}</label><input type="password" id="pw" autofocus></div>
    <div id="err"></div><button class="btn" style="width:100%">${t('enter')}</button></form></div>`;
  document.getElementById('lf').onsubmit = async e => {
    e.preventDefault();
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw.value }) });
    const d = await res.json();
    if (!res.ok) { document.getElementById('err').innerHTML = `<div class="error">${esc(d.error)}</div>`; return; }
    token = d.token;
    sessionStorage.setItem('adminToken', token);
    start();
  };
}

async function start() {
  document.getElementById('logout').style.display = '';
  try { catalog = await api('/api/admin/catalog'); } catch { return; }
  renderShell();
}

function renderShell() {
  app.innerHTML = `<div class="tabs">
      ${[['dashboard', 'tabDashboard'], ['orders', 'tabOrders'], ['catalog', 'tabCatalog'], ['settings', 'tabSettings']]
        .map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'active' : ''}">${t(l)}</button>`).join('')}
    </div><div id="view"></div>`;
  app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; renderShell(); });
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
async function saveCatalog(msgEl) {
  try {
    catalog = await api('/api/admin/catalog', { method: 'PUT', body: catalog });
    if (msgEl) { msgEl.textContent = t('saved'); setTimeout(() => msgEl.textContent = '', 2000); }
  } catch (e) { alert(e.message); }
}

function renderCatalog() {
  const limited = catalog.categories.filter(c => c.limited);
  const step = (CURRENCY_DIGITS[catalog.settings.currencyCode] ?? 2) === 0 ? 1000 : 0.5;
  view().innerHTML = `
    <div class="card">
      <div class="section-h"><h3 style="margin:0">${t('sizes')}</h3><span class="muted" id="msg1"></span></div>
      <p class="muted">${t('sizesHelp')}</p>
      <div class="tablewrap"><table class="t">
        <tr><th>${t('name')}</th><th>${t('nameEn')}</th><th>${t('serves')}</th><th>${t('servesEn')}</th><th>${t('basePrice')}</th>${limited.map(c => `<th>${t('max')} ${esc(tr(c))}</th>`).join('')}<th>${t('custom')}</th><th>${t('active')}</th></tr>
        ${catalog.sizes.map((s, i) => `<tr>
          <td><input data-s="${i}" data-k="name" value="${esc(s.name)}"></td>
          <td><input data-s="${i}" data-k="nameEn" value="${esc(s.nameEn || '')}"></td>
          <td><input data-s="${i}" data-k="serves" value="${esc(s.serves)}"></td>
          <td><input data-s="${i}" data-k="servesEn" value="${esc(s.servesEn || '')}"></td>
          <td><input data-s="${i}" data-k="basePrice" type="number" min="0" step="${step}" value="${s.basePrice}" style="width:120px"></td>
          ${limited.map(c => `<td><input data-s="${i}" data-lim="${c.id}" type="number" min="0" value="${s.limits?.[c.id] ?? 0}" style="width:70px" ${s.custom ? 'disabled' : ''}></td>`).join('')}
          <td><input data-s="${i}" data-k="custom" type="checkbox" ${s.custom ? 'checked' : ''}></td>
          <td><input data-s="${i}" data-k="active" type="checkbox" ${s.active ? 'checked' : ''}></td>
        </tr>`).join('')}
      </table></div>
      <div style="margin-top:12px;display:flex;gap:8px"><button class="btn small" id="saveSizes">${t('saveSizes')}</button><button class="btn small ghost" id="addSize">${t('addSize')}</button></div>
    </div>
    <div class="card" style="margin-top:18px">
      <div class="section-h"><h3 style="margin:0">${t('products')}</h3><span class="muted" id="msg2"></span></div>
      <p class="muted">${t('productsHelp')}</p>
      <div class="tablewrap"><table class="t">
        <tr><th>${t('name')}</th><th>${t('nameEn')}</th><th>${t('category')}</th><th>${t('price')}</th><th>${t('active')}</th><th></th></tr>
        ${catalog.products.map((p, i) => `<tr>
          <td><input data-p="${i}" data-k="name" value="${esc(p.name)}"></td>
          <td><input data-p="${i}" data-k="nameEn" value="${esc(p.nameEn || '')}"></td>
          <td><select data-p="${i}" data-k="category">${catalog.categories.map(c => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${esc(tr(c))}</option>`).join('')}</select></td>
          <td><input data-p="${i}" data-k="price" type="number" min="0" step="${step}" value="${p.price}" style="width:120px"></td>
          <td><input data-p="${i}" data-k="active" type="checkbox" ${p.active ? 'checked' : ''}></td>
          <td><button class="btn small ghost" data-delp="${i}">${t('del')}</button></td>
        </tr>`).join('')}
      </table></div>
      <div style="margin-top:12px;display:flex;gap:8px"><button class="btn small" id="saveProducts">${t('saveProducts')}</button><button class="btn small ghost" id="addProduct">${t('addProduct')}</button></div>
    </div>
    <div class="card" style="margin-top:18px">
      <div class="section-h"><h3 style="margin:0">${t('categories')}</h3><span class="muted" id="msg3"></span></div>
      <p class="muted">${t('categoriesHelp')}</p>
      <div class="tablewrap"><table class="t"><tr><th>ID</th><th>${t('name')}</th><th>${t('nameEn')}</th><th>${t('description')}</th><th>${t('descriptionEn')}</th><th>${t('limited')}</th></tr>
        ${catalog.categories.map((c, i) => `<tr><td>${esc(c.id)}</td>
          <td><input data-c="${i}" data-k="name" value="${esc(c.name)}"></td>
          <td><input data-c="${i}" data-k="nameEn" value="${esc(c.nameEn || '')}"></td>
          <td><input data-c="${i}" data-k="description" value="${esc(c.description || '')}"></td>
          <td><input data-c="${i}" data-k="descriptionEn" value="${esc(c.descriptionEn || '')}"></td>
          <td><input data-c="${i}" data-k="limited" type="checkbox" ${c.limited ? 'checked' : ''}></td></tr>`).join('')}
      </table></div>
      <div style="margin-top:12px;display:flex;gap:8px"><button class="btn small" id="saveCats">${t('saveCats')}</button><button class="btn small ghost" id="addCat">${t('addCat')}</button></div>
    </div>`;

  const val = el => el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value;
  view().querySelectorAll('[data-s]').forEach(el => el.onchange = () => {
    const s = catalog.sizes[el.dataset.s];
    if (el.dataset.lim) (s.limits ||= {})[el.dataset.lim] = Number(el.value);
    else { s[el.dataset.k] = val(el); if (el.dataset.k === 'custom') renderCatalog(); }
  });
  view().querySelectorAll('[data-p]').forEach(el => el.onchange = () => { catalog.products[el.dataset.p][el.dataset.k] = val(el); });
  view().querySelectorAll('[data-c]').forEach(el => el.onchange = () => { catalog.categories[el.dataset.c][el.dataset.k] = val(el); });
  view().querySelectorAll('[data-delp]').forEach(b => b.onclick = () => {
    if (!confirm(t('confirmDelProduct'))) return;
    catalog.products.splice(b.dataset.delp, 1); saveCatalog().then(renderCatalog);
  });
  document.getElementById('saveSizes').onclick = () => saveCatalog(msg1);
  document.getElementById('saveProducts').onclick = () => saveCatalog(msg2);
  document.getElementById('saveCats').onclick = () => saveCatalog(msg3).then(renderCatalog);
  document.getElementById('addSize').onclick = () => {
    catalog.sizes.push({ id: 'size' + Date.now(), name: t('newSize'), nameEn: '', serves: '', servesEn: '', basePrice: 0, active: false, limits: {} });
    renderCatalog();
  };
  document.getElementById('addProduct').onclick = () => {
    catalog.products.push({ id: 'p' + Date.now(), category: catalog.categories[0].id, name: t('newProduct'), nameEn: '', price: 0, active: true });
    renderCatalog();
  };
  document.getElementById('addCat').onclick = () => {
    const name = prompt(t('catPrompt'));
    if (!name) return;
    const id = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cat' + Date.now();
    if (catalog.categories.some(c => c.id === id)) return alert(t('catExists'));
    catalog.categories.push({ id, name, nameEn: '', description: '', descriptionEn: '', limited: false });
    renderCatalog();
  };
}

// ---------- settings ----------
function renderSettings() {
  const s = catalog.settings;
  const code = s.currencyCode || 'COP';
  view().innerHTML = `<div class="card" style="max-width:520px">
    <h3>${t('business')}</h3>
    <div class="field"><label>${t('businessName')}</label><input id="bn" value="${esc(s.businessName)}"></div>
    <div class="field"><label>${t('waNumber')}</label><input id="wn" value="${esc(s.whatsappNumber)}">
      <small class="muted">${t('waHelp')}</small></div>
    <div class="row2">
      <div class="field"><label>${t('currency')}</label><select id="cy">${CURRENCIES.map(c => `<option ${c === code ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label>${t('deliveryFee')}</label><input id="df" type="number" min="0" value="${s.deliveryFee}"></div>
    </div>
    <button class="btn" id="ss">${t('saveSettings')}</button> <span class="muted" id="msg"></span>
  </div>`;
  document.getElementById('ss').onclick = () => {
    Object.assign(catalog.settings, { businessName: bn.value, whatsappNumber: wn.value.replace(/\D/g, ''), currencyCode: cy.value, deliveryFee: Number(df.value) });
    delete catalog.settings.currency; // legacy symbol field
    saveCatalog(msg);
  };
}

token ? start() : renderLogin();
