/* ============================================================
   С?М — админ-панель: dashboard
   ============================================================ */

AdminUI.mount('dashboard', 'dashboard', { sub: 'сводка магазина на сегодня, 19 августа 2026' });

const orders = Store.allOrders();

/* ---------- метрики ---------- */
const count = (keys) => orders.filter(o => keys.includes(o.status)).length;
const revenue = orders.filter(o => !['cancelled', 'refund', 'await-pay', 'pay-issue'].includes(o.status))
  .reduce((s, o) => s + o.total, 0);

const stats = [
  { label: 'новые заказы', value: count(['new']), delta: '+2 за сегодня', up: true, cls: 'stat--lime' },
  { label: 'в обработке', value: count(['confirmed', 'paid', 'processing', 'packing']), delta: 'смена загружена на 60%', up: true },
  { label: 'ожидают оплаты', value: count(['await-pay', 'pay-issue']), delta: 'напомнить клиентам', up: false },
  { label: 'в доставке', value: count(['shipped', 'transit']), delta: 'все отправлены вовремя', up: true },
  { label: 'выручка за месяц', value: Store.money(revenue), delta: '+18% к июлю', up: true, cls: 'stat--dark' },
  { label: 'средний чек', value: Store.money(revenue / Math.max(1, orders.length)), delta: '+6% к июлю', up: true },
  { label: 'клиентов в базе', value: DATA.customers.length, delta: '+3 за неделю', up: true },
  { label: 'товаров в каталоге', value: Store.allProducts().length, delta: Store.allProducts().filter(p => Store.totalStock(p) === 0).length + ' нет в наличии', up: false },
];
document.querySelector('[data-stats]').innerHTML = stats.map(s => `
  <div class="stat ${s.cls || ''}">
    <div class="stat__label">${s.label}</div>
    <div class="stat__value">${s.value}</div>
    <div class="stat__delta ${s.up ? 'stat__delta--up' : 'stat__delta--down'}">${s.delta}</div>
  </div>`).join('');

/* ---------- график продаж (детерминированные демо-данные) ---------- */
const seedSales = [12400, 8900, 15300, 9800, 21500, 13090, 11500, 18800, 9300, 24100, 13880, 15000, 19400, 12300,
  8790, 15400, 22800, 9500, 13090, 11500, 26400, 7300, 18100, 12800, 9200, 15900, 21000, 10500, 13400, 17600];
const drawChart = (days) => {
  const data = seedSales.slice(0, days);
  const max = Math.max(...data);
  const today = new Date('2026-08-19');
  document.querySelector('[data-chart]').innerHTML = `
    <div class="chart-bars">
      ${data.map((v, i) => `<div class="chart-bars__bar ${v === max ? 'is-max' : ''}" style="height:${Math.round(v / max * 100)}%" title="${Store.money(v)}">
        ${v === max ? `<span class="chart-bars__cap">${Store.money(v)}</span>` : ''}</div>`).join('')}
    </div>
    <div class="chart-x">
      ${data.map((v, i) => {
        const d = new Date(today); d.setDate(d.getDate() - (data.length - 1 - i));
        return `<span>${days <= 14 || i % 3 === 0 ? d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0') : ''}</span>`;
      }).join('')}
    </div>`;
};
drawChart(14);
document.querySelector('[data-period]').addEventListener('change', (e) => drawChart(+e.target.value));

/* ---------- низкий остаток ---------- */
const low = Store.allProducts().map(p => ({ p, stock: Store.totalStock(p) }))
  .filter(x => x.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 6);
document.querySelector('[data-lowstock]').innerHTML = low.map(({ p, stock }) => `
  <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--line)">
    <img class="adm-thumb" src="../${p.images[0]}" alt="">
    <div style="flex:1;min-width:0">
      <a href="product-edit.html?id=${p.id}" style="text-decoration:underline;text-underline-offset:3px">${p.name}</a>
      <div class="small mute">${p.sku}</div>
    </div>
    <span class="tag ${stock === 0 ? 'tag--dark' : 'tag--lime'}">${stock === 0 ? 'нет в наличии' : 'осталось ' + stock + ' ' + Store.plural(stock, 'единица', 'единицы', 'единиц')}</span>
  </div>`).join('') || '<p class="mute small">все товары в достатке</p>';

/* ---------- свежие заказы ---------- */
const fresh = orders.slice(0, 6);
document.querySelector('[data-fresh-orders]').innerHTML = `
  <thead><tr><th>заказ</th><th>покупатель</th><th>сумма</th><th>статус</th></tr></thead>
  <tbody>${fresh.map(o => {
    const c = o.customerId === 'me' ? { name: 'алекс соколов' } : DATA.customerById[o.customerId] || { name: '—' };
    return `<tr>
      <td><a href="order.html?num=${encodeURIComponent(o.num)}">${o.num}</a><div class="small mute">${Store.fmtDate(o.date)}</div></td>
      <td>${c.name}</td>
      <td class="num">${Store.money(o.total)}</td>
      <td><span class="status-pill status-pill--${o.status}">${DATA.statusByKey[o.status].name}</span></td>
    </tr>`;
  }).join('')}</tbody>`;

/* ---------- популярные товары ---------- */
const topProducts = Store.allProducts().sort((a, b) => b.pop - a.pop).slice(0, 6);
document.querySelector('[data-top-products]').innerHTML = `
  <thead><tr><th></th><th>товар</th><th>категория</th><th>цена</th><th>спрос</th></tr></thead>
  <tbody>${topProducts.map(p => `<tr>
    <td style="width:52px"><img class="adm-thumb" src="../${p.images[0]}" alt=""></td>
    <td><a href="product-edit.html?id=${p.id}">${p.name}</a><div class="small mute">${p.sku}</div></td>
    <td>${(DATA.categoryBySlug[p.category] || {}).name || '—'}</td>
    <td class="num">${Store.money(p.price)}</td>
    <td class="num">${p.pop}%</td>
  </tr>`).join('')}</tbody>`;
