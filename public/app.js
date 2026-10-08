// Customer ordering wizard (uses i18n.js: t, tr, LANG, setLang, formatMoney)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let catalog;
let done = false; // order submitted
const state = {
  step: 0,
  sizeId: null,
  selected: new Set(),
  fulfillment: 'delivery',
  customer: { name: '', phone: '', email: '', address: '', date: '', time: '', occasion: '', notes: '' },
};

const money = n => formatMoney(n, catalog.settings.currencyCode);
const size = () => catalog.sizes.find(s => s.id === state.sizeId);
const product = id => catalog.products.find(p => p.id === id);
const selectedIn = cat => [...state.selected].map(product).filter(p => p && p.category === cat);

// Steps: size, one per category, details, summary
function steps() {
  return [
    { key: 'size', label: t('stepSize') },
    ...catalog.categories.map(c => ({ key: 'cat', cat: c, label: tr(c) })),
    { key: 'details', label: t('stepDetails') },
    { key: 'summary', label: t('stepSummary') },
  ];
}

const bounded = (s, cat) => s && !s.custom && cat.limited;
// Max included items (Infinity = no cap). Sizes that allow extras never block, they charge instead.
function limitFor(cat) {
  const s = size();
  return bounded(s, cat) ? s.limits[cat.id] ?? 0 : Infinity;
}
const minFor = cat => bounded(size(), cat) ? Math.min(size().mins?.[cat.id] ?? 0, limitFor(cat)) : 0;
const canAdd = cat => size()?.allowExtras || selectedIn(cat.id).length < limitFor(cat);

// Same rule as the server: the most expensive picks fill the included slots and pay only
// their surcharge; anything beyond the limit pays full price.
function itemPriceIn(s, p) {
  const cat = catalog.categories.find(c => c.id === p.category);
  if (!bounded(s, cat)) return p.price;
  const rank = selectedIn(cat.id).sort((x, y) => y.price - x.price).findIndex(x => x.id === p.id);
  return rank !== -1 && rank < (s.limits[cat.id] ?? 0) ? p.surcharge || 0 : p.price;
}
const itemPrice = p => itemPriceIn(tier(), p);
const subtotalIn = s => s.basePrice + [...state.selected].map(product).filter(Boolean).reduce((sum, p) => sum + itemPriceIn(s, p), 0);
// Whether the current picks satisfy a fixed size's per-category min/max.
const fits = s => catalog.categories.every(cat => {
  if (!cat.limited) return true;
  const n = selectedIn(cat.id).length, max = s.limits?.[cat.id] ?? 0;
  return n >= Math.min(s.mins?.[cat.id] ?? 0, max) && (n <= max || s.allowExtras);
});
// Size used for pricing. Same rule as the server: a custom selection that fits a
// cheaper fixed table is charged as that table.
function tier() {
  const s = size();
  if (!s?.custom) return s;
  return catalog.sizes.filter(x => x.active !== false && !x.custom && fits(x))
    .reduce((best, x) => subtotalIn(x) < subtotalIn(best) ? x : best, s);
}
// Price shown on a card that isn't selected yet: what it would cost if added now.
function nextPrice(p) {
  const cat = catalog.categories.find(c => c.id === p.category);
  if (!bounded(size(), cat)) return p.price;
  return selectedIn(cat.id).length < limitFor(cat) ? p.surcharge || 0 : p.price;
}

function deliveryFor(subtotal) {
  const st = catalog.settings;
  if (state.fulfillment !== 'delivery') return 0;
  if (st.freeDeliveryFrom && subtotal >= st.freeDeliveryFrom) return 0;
  return Number(st.deliveryFee) || 0;
}

function totals() {
  const s = size();
  if (!s) return { subtotal: 0, delivery: 0, total: 0 };
  const subtotal = subtotalIn(tier());
  const delivery = deliveryFor(subtotal);
  return { subtotal, delivery, total: subtotal + delivery };
}

const isoDay = offset => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

// ---------- rendering ----------
function render() {
  const st = steps();
  document.getElementById('stepper').innerHTML = st.map((s, i) =>
    `<div class="s ${i < state.step ? 'done' : ''} ${i === state.step ? 'active' : ''}">${i + 1}. ${esc(s.label)}</div>`).join('');
  // On narrow screens the stepper scrolls sideways; keep the current step in view.
  const stepper = document.getElementById('stepper'), activeStep = stepper.querySelector('.active');
  if (activeStep) stepper.scrollLeft = activeStep.offsetLeft - stepper.offsetLeft - 16;
  const cur = st[state.step];
  const body = document.getElementById('stepBody');
  if (cur.key === 'size') body.innerHTML = renderSize();
  else if (cur.key === 'cat') body.innerHTML = renderCategory(cur.cat);
  else if (cur.key === 'details') body.innerHTML = renderDetails();
  else body.innerHTML = renderSummary();
  renderCart();
  bind(cur);
}

function navButtons(nextLabel = t('next'), nextDisabled = false) {
  return `<div class="nav">
    ${state.step > 0 ? `<button class="btn ghost" data-act="back">${t('back')}</button>` : '<span></span>'}
    <button class="btn" data-act="next" ${nextDisabled ? 'disabled' : ''}>${nextLabel}</button>
  </div>`;
}

function renderSize() {
  const cats = catalog.categories.filter(c => c.limited);
  return `<h2>1. ${t('chooseSize')}</h2>
    <p class="muted">${t('chooseSizeHelp')}</p>
    <div class="grid">
      ${catalog.sizes.map(s => `
        <div class="option size-card ${state.sizeId === s.id ? 'selected' : ''}" data-size="${esc(s.id)}">
          <span class="check">✓</span>
          <h3>${esc(tr(s))}</h3>
          <div class="muted">${esc(tr(s, 'serves'))}</div>
          <div class="price">${s.custom ? t('from') : ''}${money(s.basePrice)}</div>
          ${tr(s, 'description') ? `<p class="muted" style="margin:6px 0 0">${esc(tr(s, 'description'))}</p>` : ''}
          <ul>
            ${s.custom
              ? `<li>${t('noLimits')}</li><li>${t('perItem')}</li>`
              : cats.map(c => {
                const max = s.limits[c.id] ?? 0, min = Math.min(s.mins?.[c.id] ?? 0, max), cat = tr(c).toLowerCase();
                return `<li>${esc(min && min === max ? t('exactly', { n: max, cat }) : min ? t('between', { min, max, cat }) : t('upTo', { n: max, cat }))}</li>`;
              }).join('') + (s.allowExtras ? `<li>${t('extrasAllowed')}</li>` : '')}
          </ul>
        </div>`).join('')}
    </div>
    ${navButtons(t('next'), !state.sizeId)}`;
}

function renderCategory(cat) {
  const items = catalog.products.filter(p => p.category === cat.id);
  const limit = limitFor(cat);
  const min = minFor(cat);
  const count = selectedIn(cat.id).length;
  const full = !canAdd(cat);
  const over = limit !== Infinity && count >= limit && !full;
  return `<h2>${state.step + 1}. ${esc(tr(cat))}</h2>
    <p class="muted">${esc(tr(cat, 'description'))}</p>
    <div class="counter">${limit === Infinity
      ? t('selected', { n: count }) + (cat.limited ? '' : t('optionalPriced'))
      : t('ofSelected', { n: count, max: limit }) + (min ? t('minNote', { min }) : '') + (full ? t('limitReached') : over ? t('extraCharged') : '')}</div>
    <div class="grid">
      ${items.length ? items.map(p => {
        const sel = state.selected.has(p.id);
        const price = sel ? itemPrice(p) : nextPrice(p);
        return `<div class="option ${sel ? 'selected' : ''} ${!sel && full ? 'disabled' : ''}" data-item="${esc(p.id)}">
          <span class="check">✓</span>
          <div style="font-weight:600;padding-right:26px">${esc(tr(p))}</div>
          ${tr(p, 'description') ? `<div class="muted" style="font-size:.85rem">${esc(tr(p, 'description'))}</div>` : ''}
          <div class="${price ? 'price' : 'muted'}">${price ? '+' + money(price) : t('included')}</div>
        </div>`;
      }).join('') : `<p class="muted">${t('noItems')}</p>`}
    </div>
    ${navButtons(count === 0 && !min ? t('skip') : t('next'), count < min)}`;
}

function renderDetails() {
  const c = state.customer;
  const st = catalog.settings;
  const minDate = isoDay(st.minLeadDays || 0);
  const fee = deliveryFor(totals().subtotal);
  const days = t('weekdays');
  const f = (id, label, type = 'text', extra = '') =>
    `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${esc(c[id])}" ${extra}></div>`;
  return `<h2>${state.step + 1}. ${t('stepDetails')}</h2>
    <div class="seg">
      ${st.deliveryEnabled ? `<div class="option ${state.fulfillment === 'delivery' ? 'selected' : ''}" data-ful="delivery">🚚 ${t('delivery')} (${fee || state.fulfillment !== 'delivery' ? '+' + money(st.deliveryFee) : t('free')})</div>` : ''}
      ${st.pickupEnabled ? `<div class="option ${state.fulfillment === 'pickup' ? 'selected' : ''}" data-ful="pickup">🏠 ${t('pickup')}</div>` : ''}
    </div>
    ${st.deliveryEnabled && st.freeDeliveryFrom ? `<p class="muted">${t('freeFrom', { amount: money(st.freeDeliveryFrom) })}</p>` : ''}
    <div class="row2">${f('name', t('fullName'))}${f('phone', t('phone'), 'tel')}</div>
    ${f('email', t('email'), 'email')}
    ${state.fulfillment === 'delivery' ? f('address', t('address')) : ''}
    <div class="row2">${f('date', t('eventDate'), 'date', `min="${minDate}"`)}${f('time', t('time'), 'time')}</div>
    ${st.minLeadDays || st.closedWeekdays.length ? `<p class="muted">${[st.minLeadDays ? t('leadNote', { n: st.minLeadDays }) : '',
      st.closedWeekdays.length ? t('closedNote', { days: st.closedWeekdays.map(d => days[d]).join(', ') }) : ''].filter(Boolean).join(' · ')}</p>` : ''}
    ${f('occasion', t('occasion'))}
    <div class="field"><label for="notes">${t('notes')}</label><textarea id="notes">${esc(c.notes)}</textarea></div>
    <div id="formErr"></div>
    ${navButtons(t('review'))}`;
}

function renderSummary() {
  const s = size(), tt = totals(), c = state.customer;
  const rows = catalog.categories.map(cat => {
    const items = selectedIn(cat.id);
    if (!items.length) return '';
    return `<tr><td colspan="2" style="padding-top:14px"><b>${esc(tr(cat))}</b></td></tr>` +
      items.map(p => `<tr><td>${esc(tr(p))}</td><td>${itemPrice(p) ? money(itemPrice(p)) : `<span class="muted">${t('included')}</span>`}</td></tr>`).join('');
  }).join('');
  const tableName = LANG === 'en' ? `${esc(tr(s))} ${t('table')}` : `${t('table')} ${esc(tr(s))}`;
  return `<div class="summary">
    <h2>${state.step + 1}. ${t('summaryTitle')}</h2>
    <table>
      <tr><td><b>${tableName}</b> <span class="muted">(${esc(tr(s, 'serves'))})</span>${pricedAsNote()}</td><td>${money(tier().basePrice)}</td></tr>
      ${rows}
      <tr><td style="padding-top:14px">${t('subtotal')}</td><td style="padding-top:14px">${money(tt.subtotal)}</td></tr>
      ${tt.delivery ? `<tr><td>${t('deliveryFee')}</td><td>${money(tt.delivery)}</td></tr>` : ''}
      <tr><td><b>${t('total')}</b></td><td><b>${money(tt.total)}</b></td></tr>
    </table>
    <h3 style="margin-top:22px">${t('customer')}</h3>
    <p>
      <b>${esc(c.name)}</b> · ${esc(c.phone)}${c.email ? ' · ' + esc(c.email) : ''}<br>
      ${state.fulfillment === 'delivery' ? '🚚 ' + t('deliveryTo') + ' ' + esc(c.address) : '🏠 ' + t('pickup')}<br>
      📅 ${esc(c.date)} ${esc(c.time)}${c.occasion ? '<br>🎉 ' + esc(c.occasion) : ''}
      ${c.notes ? '<br>📝 ' + esc(c.notes) : ''}
    </p>
    <p class="muted">${t('confirmHelp')}</p>
    <div id="formErr"></div>
    ${navButtons(t('confirm'))}
  </div>`;
}

function renderCart() {
  const s = size();
  const el = document.getElementById('cart');
  const bar = document.getElementById('mtotal');
  if (!s) { el.innerHTML = `<h3>${t('yourTable')}</h3><p class="muted">${t('chooseToStart')}</p>`; bar.hidden = true; return; }
  const tt = totals();
  const atEnd = state.step >= steps().length - 2;
  // Phone-only bar: the cart sits below the step, so keep the running total visible.
  bar.hidden = false;
  bar.innerHTML = `<span>${t('yourTable')} · ${esc(tr(s))}</span><b>${money(atEnd ? tt.total : tt.subtotal)}</b>`;
  el.innerHTML = `<h3>${t('yourTable')}</h3>
    <div class="line"><span>${esc(tr(s))}</span><span>${money(tier().basePrice)}</span></div>
    ${pricedAsNote()}
    ${catalog.categories.map(cat => {
      const items = selectedIn(cat.id);
      if (!items.length) return '';
      const lim = limitFor(cat);
      return `<div class="cat">${esc(tr(cat))}${lim !== Infinity ? ` (${items.length}/${lim})` : ''}</div>` +
        items.map(p => `<div class="line"><span>${esc(tr(p))}</span><span>${itemPrice(p) ? money(itemPrice(p)) : '✓'}</span></div>`).join('');
    }).join('')}
    ${tt.delivery && atEnd ? `<div class="line" style="margin-top:8px"><span>${t('deliveryFee')}</span><span>${money(tt.delivery)}</span></div>` : ''}
    <div class="line total"><span>${t('total')}</span><span>${money(atEnd ? tt.total : tt.subtotal)}</span></div>`;
}

// Shown when a custom selection is charged as a cheaper fixed table.
function pricedAsNote() {
  const tr_ = tier();
  return tr_ !== size() ? `<p class="muted" style="font-size:.85rem;margin:4px 0">${esc(t('pricedAs', { size: tr(tr_) }))}</p>` : '';
}

// ---------- events ----------
function bind(cur) {
  const body = document.getElementById('stepBody');
  body.querySelectorAll('[data-size]').forEach(el => el.onclick = () => {
    const newId = el.dataset.size;
    if (newId !== state.sizeId) {
      state.sizeId = newId;
      // trim selections that exceed the new size's limits (unless extras are allowed)
      if (!size().allowExtras) catalog.categories.forEach(cat => {
        selectedIn(cat.id).slice(limitFor(cat)).forEach(p => state.selected.delete(p.id));
      });
    }
    render();
  });
  body.querySelectorAll('[data-item]').forEach(el => el.onclick = () => {
    const id = el.dataset.item;
    if (state.selected.has(id)) state.selected.delete(id);
    else {
      const cat = catalog.categories.find(c => c.id === product(id).category);
      if (!canAdd(cat)) return;
      state.selected.add(id);
    }
    render();
  });
  body.querySelectorAll('[data-ful]').forEach(el => el.onclick = () => { saveForm(); state.fulfillment = el.dataset.ful; render(); });
  body.querySelectorAll('input, textarea').forEach(el => el.oninput = () => { state.customer[el.id] = el.value; });

  const back = body.querySelector('[data-act=back]');
  if (back) back.onclick = () => { saveForm(); state.step--; render(); scrollTo({ top: 0, behavior: 'smooth' }); };
  const next = body.querySelector('[data-act=next]');
  next.onclick = async () => {
    if (cur.key === 'details') {
      saveForm();
      const err = validate();
      if (err) { document.getElementById('formErr').innerHTML = `<div class="error">${esc(err)}</div>`; return; }
    }
    if (cur.key === 'cat' && isLastCategory(cur.cat) && state.selected.size === 0) {
      alert(t('errEmpty')); return;
    }
    if (cur.key === 'cat' && isLastCategory(cur.cat) && catalog.settings.minOrderTotal && totals().subtotal < catalog.settings.minOrderTotal) {
      alert(t('errMinOrder', { min: money(catalog.settings.minOrderTotal) })); return;
    }
    if (cur.key === 'summary') return submit(next);
    state.step++;
    render();
    scrollTo({ top: 0, behavior: 'smooth' });
  };
}

const isLastCategory = cat => catalog.categories[catalog.categories.length - 1].id === cat.id;

function saveForm() {
  document.querySelectorAll('#stepBody input, #stepBody textarea').forEach(el => { state.customer[el.id] = el.value; });
}

function validate() {
  const c = state.customer;
  if (!c.name.trim()) return t('errName');
  if (!/^[+\d\s()-]{7,}$/.test(c.phone.trim())) return t('errPhone');
  if (state.fulfillment === 'delivery' && !c.address.trim()) return t('errAddress');
  if (!c.date) return t('errDate');
  const st = catalog.settings;
  if (c.date < isoDay(st.minLeadDays || 0)) return t('errLead', { n: st.minLeadDays });
  if (st.closedWeekdays.includes(new Date(c.date + 'T12:00:00').getDay())) return t('errClosed');
  return null;
}

async function submit(btn) {
  btn.disabled = true;
  btn.textContent = t('sending');
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: LANG, sizeId: state.sizeId, itemIds: [...state.selected], fulfillment: state.fulfillment, customer: state.customer }),
    });
    const data = await res.json().catch(() => ({ error: 'Online ordering is not available yet' }));
    if (!res.ok) throw new Error(data.error || 'Error');
    window.open(data.whatsappUrl, '_blank');
    done = true;
    document.getElementById('cart').style.display = 'none';
    document.getElementById('mtotal').hidden = true;
    document.getElementById('stepBody').innerHTML = `<div class="success">
      <div class="big">🧀🍷</div>
      <h2>${esc(t('thanks', { name: state.customer.name }))}</h2>
      <p>${t('registered', { id: esc(data.order.id), total: money(data.order.total) })}</p>
      <p class="muted">${t('waFallback')}</p>
      <a class="btn wa" href="${esc(data.whatsappUrl)}" target="_blank" rel="noopener">${t('sendWa')}</a>
      <p style="margin-top:20px"><a href="/">${t('newOrder')}</a></p>
    </div>`;
  } catch (e) {
    document.getElementById('formErr').innerHTML = `<div class="error">${esc(e.message)}</div>`;
    btn.disabled = false;
    btn.textContent = t('confirm');
  }
}

(async function init() {
  // Static hosting (GitHub Pages) has no API; fall back to the prebuilt catalog.json
  const apiRes = await fetch('/api/catalog').catch(() => null);
  catalog = apiRes && apiRes.ok ? await apiRes.json() : await (await fetch('catalog.json')).json();
  catalog.settings.closedWeekdays ||= [];
  catalog.settings.deliveryEnabled ??= true;
  catalog.settings.pickupEnabled ??= true;
  if (!catalog.settings.deliveryEnabled) state.fulfillment = 'pickup';
  document.getElementById('bizName').textContent = catalog.settings.businessName;
  const box = document.getElementById('langBox');
  box.innerHTML = langSwitcher();
  const applyLang = l => {
    setLang(l);
    document.title = `${catalog.settings.businessName} — ${t('heroTitle')}`;
  };
  box.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => {
    saveForm();
    applyLang(b.dataset.lang);
    if (!done) render();
  });
  applyLang(LANG);
  render();
})();
