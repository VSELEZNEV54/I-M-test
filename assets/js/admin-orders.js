/* ============================================================
   С?М — админ-панель: заказы (таблица + канбан)
   ============================================================ */

AdminUI.mount('orders', 'заказы', {
  sub: 'вся база заказов магазина',
  actions: `
    <div class="viewtoggle" data-viewtoggle>
      <button type="button" data-view="table">таблица</button>
      <button type="button" data-view="kanban">канбан</button>
    </div>`,
});

/* ---------- состояние страницы ---------- */
const VIEW_KEY = 'ordersView';
const getView = () => Store.flag(VIEW_KEY) || 'table';

const state = {
  q: '', orderStatus: 'all', pay: 'all', delivery: 'all', from: '', to: '',
  sortKey: 'date', sortDir: 'desc',
};

const ME = { name: 'алекс соколов', phone: '+7 (913) 245-67-01', email: 'alex@example.com' };
const customerOf = (o) => o.customerId === 'me'
  ? ME
  : (DATA.customerById[o.customerId] || { name: '—', phone: '', email: '' });

const statusIndex = Object.fromEntries(DATA.orderStatuses.map((s, i) => [s.key, i]));
const lastChange = (o) => (o.history && o.history.length) ? o.history[o.history.length - 1].at : o.date;
const digitsOnly = (s) => String(s || '').replace(/\D/g, '');

/* ---------- тулбар фильтров ---------- */
document.querySelector('[data-filters]').innerHTML = `
  <div class="adm-search">${UI.icon('search')}<input type="text" data-f-q placeholder="номер, имя, email, телефон"></div>
  <select data-f-status>
    <option value="all">все статусы</option>
    ${DATA.orderStatuses.map(s => `<option value="${s.key}">${s.name}</option>`).join('')}
  </select>
  <select data-f-pay>
    <option value="all">оплата: любая</option>
    ${DATA.payMethods.map(m => `<option value="${m.key}">${m.name}</option>`).join('')}
  </select>
  <select data-f-delivery>
    <option value="all">доставка: любая</option>
    ${DATA.deliveryMethods.map(m => `<option value="${m.key}">${m.name}</option>`).join('')}
  </select>
  <label class="small mute" style="display:inline-flex;align-items:center;gap:6px">с <input type="date" data-f-from></label>
  <label class="small mute" style="display:inline-flex;align-items:center;gap:6px">по <input type="date" data-f-to></label>
  <button class="btn btn--ghost btn--sm" type="button" data-f-reset>сбросить</button>`;

/* ---------- фильтрация и сортировка ---------- */
const filtered = () => {
  const q = state.q.trim().toLowerCase();
  const qd = digitsOnly(q);
  return Store.allOrders().filter(o => {
    const c = customerOf(o);
    if (q) {
      const hay = (o.num + ' ' + c.name + ' ' + (c.email || '')).toLowerCase();
      const phoneOk = qd.length >= 3 && digitsOnly(c.phone).includes(qd);
      if (!hay.includes(q) && !phoneOk) return false;
    }
    if (state.orderStatus !== 'all' && o.status !== state.orderStatus) return false;
    if (state.pay !== 'all' && o.payment !== state.pay) return false;
    if (state.delivery !== 'all' && (o.delivery || {}).method !== state.delivery) return false;
    const day = (o.date || '').slice(0, 10);
    if (state.from && day < state.from) return false;
    if (state.to && day > state.to) return false;
    return true;
  });
};

const sorted = (list) => {
  const dir = state.sortDir === 'asc' ? 1 : -1;
  return list.slice().sort((a, b) => {
    let r = 0;
    if (state.sortKey === 'date') r = a.date.localeCompare(b.date);
    else if (state.sortKey === 'total') r = a.total - b.total;
    else if (state.sortKey === 'status') r = statusIndex[a.status] - statusIndex[b.status];
    return r * dir;
  });
};

/* ---------- вид: таблица ---------- */
const arrow = (k) => state.sortKey === k ? (state.sortDir === 'asc' ? ' ↑' : ' ↓') : '';

const renderTable = () => {
  const list = sorted(filtered());
  const rows = list.map(o => {
    const c = customerOf(o);
    const pm = DATA.payMethods.find(m => m.key === o.payment);
    const dm = DATA.deliveryMethods.find(m => m.key === (o.delivery || {}).method);
    return `<tr>
      <td><a href="order.html?num=${encodeURIComponent(o.num)}">${o.num}</a></td>
      <td>${Store.fmtDateTime(o.date)}</td>
      <td>${c.name}<div class="small mute">${c.phone || ''}</div></td>
      <td class="num">${Store.money(o.total)}</td>
      <td>${pm ? pm.name : '—'}<div class="small mute">${o.payStatus || ''}</div></td>
      <td>${dm ? dm.name : '—'}</td>
      <td><span class="status-pill status-pill--${o.status}">${(DATA.statusByKey[o.status] || {}).name || o.status}</span></td>
      <td>${o.manager || '—'}</td>
      <td class="small mute">${Store.fmtDateTime(lastChange(o))}</td>
    </tr>`;
  }).join('');
  document.querySelector('[data-orders-table]').innerHTML = `
    <thead><tr>
      <th>номер</th>
      <th data-sort="date">дата${arrow('date')}</th>
      <th>покупатель</th>
      <th data-sort="total">сумма${arrow('total')}</th>
      <th>оплата</th>
      <th>доставка</th>
      <th data-sort="status">статус${arrow('status')}</th>
      <th>менеджер</th>
      <th>изменён</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="9" class="mute" style="text-align:center;padding:36px">ничего не нашлось — ослабь фильтры</td></tr>'}</tbody>`;
};

/* ---------- вид: канбан ---------- */
const KANBAN_COLS = ['new', 'confirmed', 'paid', 'processing', 'packing', 'shipped', 'transit', 'delivered'];
const PROBLEM_KEYS = ['cancelled', 'refund', 'await-pay', 'pay-issue'];

const kcard = (o, locked) => {
  const c = customerOf(o);
  return `<div class="kcard" ${locked ? '' : 'draggable="true"'} data-num="${o.num}">
    <div class="kcard__num">
      <a href="order.html?num=${encodeURIComponent(o.num)}">${o.num}</a>
      <span class="kcard__sum">${Store.money(o.total)}</span>
    </div>
    <div class="kcard__meta">${c.name} · ${Store.fmtDate(o.date)}</div>
    ${locked ? `<div class="kcard__meta"><span class="status-pill status-pill--${o.status}">${(DATA.statusByKey[o.status] || {}).name || o.status}</span></div>` : ''}
  </div>`;
};

const renderKanban = () => {
  const list = filtered();
  const cols = KANBAN_COLS.map(key => {
    const items = list.filter(o => o.status === key);
    return `<div class="kanban__col" data-col="${key}">
      <div class="kanban__head"><span>${DATA.statusByKey[key].name}</span><span class="kanban__count">${items.length}</span></div>
      <div class="kanban__list">${items.map(o => kcard(o, false)).join('')}</div>
    </div>`;
  });
  const problems = list.filter(o => PROBLEM_KEYS.includes(o.status));
  cols.push(`<div class="kanban__col" data-col="">
    <div class="kanban__head"><span>проблемные</span><span class="kanban__count">${problems.length}</span></div>
    <div class="kanban__list">${problems.map(o => kcard(o, true)).join('')}</div>
  </div>`);
  document.querySelector('[data-kanban]').innerHTML = cols.join('');
};

const render = () => { renderTable(); renderKanban(); };

/* ---------- переключатель вида ---------- */
const applyView = () => {
  const v = getView();
  document.querySelectorAll('[data-viewtoggle] button').forEach(b => b.classList.toggle('is-active', b.dataset.view === v));
  document.querySelector('[data-view-table]').hidden = v !== 'table';
  document.querySelector('[data-view-kanban]').hidden = v !== 'kanban';
};
document.querySelector('[data-viewtoggle]').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-view]');
  if (!b) return;
  Store.setFlag(VIEW_KEY, b.dataset.view);
  applyView();
});

/* ---------- события фильтров ---------- */
const fQ = document.querySelector('[data-f-q]');
const fStatus = document.querySelector('[data-f-status]');
const fPay = document.querySelector('[data-f-pay]');
const fDelivery = document.querySelector('[data-f-delivery]');
const fFrom = document.querySelector('[data-f-from]');
const fTo = document.querySelector('[data-f-to]');

fQ.addEventListener('input', () => { state.q = fQ.value; render(); });
fStatus.addEventListener('change', () => { state.orderStatus = fStatus.value; render(); });
fPay.addEventListener('change', () => { state.pay = fPay.value; render(); });
fDelivery.addEventListener('change', () => { state.delivery = fDelivery.value; render(); });
fFrom.addEventListener('change', () => { state.from = fFrom.value; render(); });
fTo.addEventListener('change', () => { state.to = fTo.value; render(); });

document.querySelector('[data-f-reset]').addEventListener('click', () => {
  state.q = ''; state.orderStatus = 'all'; state.pay = 'all'; state.delivery = 'all'; state.from = ''; state.to = '';
  fQ.value = ''; fStatus.value = 'all'; fPay.value = 'all'; fDelivery.value = 'all'; fFrom.value = ''; fTo.value = '';
  render();
});

/* ---------- сортировка таблицы ---------- */
document.querySelector('[data-orders-table]').addEventListener('click', (e) => {
  const th = e.target.closest('th[data-sort]');
  if (!th) return;
  const key = th.dataset.sort;
  if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  else { state.sortKey = key; state.sortDir = key === 'date' ? 'desc' : 'asc'; }
  renderTable();
});

/* ---------- drag-n-drop канбана ---------- */
let dragNum = null;
const kanbanRoot = document.querySelector('[data-kanban]');

kanbanRoot.addEventListener('dragstart', (e) => {
  const card = e.target.closest('.kcard');
  if (!card) return;
  dragNum = card.dataset.num;
  card.classList.add('is-drag');
  e.dataTransfer.effectAllowed = 'move';
  try { e.dataTransfer.setData('text/plain', dragNum); } catch (err) {}
});
kanbanRoot.addEventListener('dragend', (e) => {
  const card = e.target.closest('.kcard');
  if (card) card.classList.remove('is-drag');
  kanbanRoot.querySelectorAll('.kanban__col.is-over').forEach(c => c.classList.remove('is-over'));
});
kanbanRoot.addEventListener('dragover', (e) => {
  const col = e.target.closest('.kanban__col');
  if (!col || !col.dataset.col || !dragNum) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  kanbanRoot.querySelectorAll('.kanban__col.is-over').forEach(c => { if (c !== col) c.classList.remove('is-over'); });
  col.classList.add('is-over');
});
kanbanRoot.addEventListener('dragleave', (e) => {
  const col = e.target.closest('.kanban__col');
  if (col && !col.contains(e.relatedTarget)) col.classList.remove('is-over');
});
kanbanRoot.addEventListener('drop', (e) => {
  const col = e.target.closest('.kanban__col');
  if (!col || !col.dataset.col || !dragNum) return;
  e.preventDefault();
  const toKey = col.dataset.col;
  const o = Store.getOrder(dragNum);
  dragNum = null;
  if (!o || o.status === toKey) { render(); return; }
  const fromKey = o.status;
  const stamp = '2026-08-19T' + new Date().toTimeString().slice(0, 8);
  Store.patchOrder(o.num, {
    status: toKey,
    history: (o.history || []).concat([{ at: stamp, by: 'менеджер анна', from: fromKey, to: toKey }]),
  });
  UI.toast(`${o.num}: ${DATA.statusByKey[fromKey].name} → ${DATA.statusByKey[toKey].name}`);
  render();
});

/* ---------- старт ---------- */
applyView();
render();
