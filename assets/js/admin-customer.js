/* ============================================================
   С?М — админ-панель: карточка клиента
   ============================================================ */

(() => {
  const params = new URLSearchParams(location.search);
  const cid = params.get('id') || '';

  /* ---------- кто это ---------- */
  const myOrders = Store.userOrders();
  const meCustomer = () => ({
    id: 'me',
    name: 'алекс соколов (демо)',
    email: 'alex@example.com',
    phone: '+7 (913) 245-67-01',
    reg: '2026-02-11',
    orders: myOrders.length,
    spent: myOrders.reduce((s, o) => s + o.total, 0),
    last: myOrders.map(o => o.date).sort().pop() || null,
    fav: Store.fav(),
  });

  const client = cid === 'me' ? meCustomer() : (DATA.customerById[cid] || null);

  if (!client) {
    AdminUI.mount('customers', 'клиент не найден', { sub: 'проверь ссылку — такого id в базе нет' });
    document.querySelector('[data-customer-page]').innerHTML = `
      <div class="empty">
        <div class="empty__title">клиент не найден</div>
        <p>такого id нет в базе прототипа: возможно, ссылка устарела или клиента удалили.</p>
        <a class="btn btn--dark" href="customers.html">ко всем клиентам</a>
      </div>`;
    return;
  }

  AdminUI.mount('customers', client.name, {
    sub: 'карточка клиента · id ' + client.id,
    actions: '<a class="btn btn--sm btn--outline" href="customers.html">← ко всем клиентам</a>',
  });

  /* ---------- заказы клиента ---------- */
  const orders = Store.allOrders().filter(o => o.customerId === client.id);
  const avg = client.orders ? Math.round(client.spent / client.orders) : 0;

  const ordersRows = orders.map(o => `<tr>
    <td><a href="order.html?num=${encodeURIComponent(o.num)}">${o.num}</a></td>
    <td>${Store.fmtDate(o.date)}</td>
    <td class="num">${Store.money(o.total)}</td>
    <td><span class="status-pill status-pill--${o.status}">${(DATA.statusByKey[o.status] || {}).name || o.status}</span></td>
  </tr>`).join('');

  const ordersNote = () => {
    if (orders.length < client.orders) {
      return `в демо-базе прототипа лежат только последние ${orders.length} ${Store.plural(orders.length, 'заказ', 'заказа', 'заказов')} из ${client.orders} — остальные в архиве crm.`;
    }
    if (orders.length > client.orders) {
      return 'отменённые и возвращённые заказы в статистику покупок не попадают — поэтому счётчик слева меньше.';
    }
    return '';
  };

  const emptyOrders = client.orders
    ? `все ${client.orders} ${Store.plural(client.orders, 'заказ', 'заказа', 'заказов')} этого клиента лежат в архиве crm — в демо-базе прототипа их нет.`
    : 'заказов нет — клиент зарегистрировался, но пока ничего не купил.';

  const ordersPanel = orders.length
    ? `<div class="table-wrap"><table class="adm-table">
        <thead><tr><th>номер</th><th>дата</th><th>сумма</th><th>статус</th></tr></thead>
        <tbody>${ordersRows}</tbody></table></div>
       ${ordersNote() ? `<p class="small mute" style="padding:12px 22px 18px">${ordersNote()}</p>` : ''}`
    : `<p class="mute" style="padding:0 22px 22px">${emptyOrders}</p>`;

  /* ---------- избранное ---------- */
  const favIds = (client.fav || []).filter(id => Store.getProduct(id));
  const favHTML = favIds.length
    ? favIds.map(id => {
        const p = Store.getProduct(id);
        return `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--line)">
          <img class="adm-thumb" src="../${p.images[0]}" alt="">
          <div style="flex:1;min-width:0">
            <a href="../product.html?id=${p.id}" style="text-decoration:underline;text-underline-offset:3px">${p.name}</a>
            <div class="small mute">${p.sku}</div>
          </div>
          <span class="num">${Store.money(p.price)}</span>
        </div>`;
      }).join('')
    : '<p class="mute small">в избранном пусто — не за что зацепиться при звонке.</p>';

  /* ---------- спецпредложения ---------- */
  const hasOffers = client.id === 'me' || client.id === 'c-01';
  const offersHTML = hasOffers
    ? DATA.offers.map(o => `<div style="border:1px solid var(--line);padding:12px 14px;margin-bottom:10px">
        <div style="font-weight:600">${o.title}</div>
        <div class="small mute" style="margin-top:6px">${o.text}</div>
        <div class="small mute" style="margin-top:6px">до ${Store.fmtDate(o.until)}</div>
      </div>`).join('')
    : `<p class="mute small">нет активных спецпредложений для этого клиента.</p>
       <button class="btn btn--sm btn--lime mt-20" type="button" data-give-promo>выдать промокод</button>`;

  /* ---------- сборка страницы ---------- */
  document.querySelector('[data-customer-page]').innerHTML = `
  <div class="adm-grid">
    <div style="display:grid;gap:14px">

      <div class="panel">
        <div class="panel__head"><div class="panel__title">профиль</div></div>
        <div class="grid-2">
          <div>
            <div class="small mute">имя</div>
            <div style="font-weight:600;margin-bottom:14px">${client.name}</div>
            <div class="small mute">телефон</div>
            <div class="num" style="font-weight:600">${client.phone}</div>
          </div>
          <div>
            <div class="small mute">e-mail</div>
            <div style="font-weight:600;margin-bottom:14px">${client.email}</div>
            <div class="small mute">дата регистрации</div>
            <div style="font-weight:600">${Store.fmtDate(client.reg)}</div>
          </div>
        </div>
      </div>

      <div class="panel panel--pad0">
        <div class="panel__head"><div class="panel__title">история заказов</div><a class="linklike small" href="orders.html">вся база заказов</a></div>
        ${ordersPanel}
      </div>

    </div>

    <div style="display:grid;gap:14px">

      <div class="stats" style="grid-template-columns:1fr;margin-bottom:0">
        <div class="stat stat--lime">
          <div class="stat__label">заказов</div>
          <div class="stat__value">${client.orders}</div>
        </div>
        <div class="stat stat--dark">
          <div class="stat__label">потрачено</div>
          <div class="stat__value">${Store.money(client.spent)}</div>
        </div>
        <div class="stat">
          <div class="stat__label">средний чек</div>
          <div class="stat__value">${client.orders ? Store.money(avg) : '—'}</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__head"><div class="panel__title">избранное</div></div>
        ${favHTML}
      </div>

      <div class="panel">
        <div class="panel__head"><div class="panel__title">спецпредложения</div></div>
        ${offersHTML}
      </div>

    </div>
  </div>

  <p class="adm-note mt-20">карточка демонстрационная: заказы, избранное и предложения собраны из данных прототипа. в боевой версии сюда же подтягиваются звонки, письма и заметки менеджеров.</p>`;

  /* ---------- выдать промокод ---------- */
  const giveBtn = document.querySelector('[data-give-promo]');
  if (giveBtn) giveBtn.addEventListener('click', () => UI.toast('промокод отправлен на почту (демо)'));
})();
