/* ============================================================
   С?М — админ-панель: клиенты (список, поиск, сортировка)
   ============================================================ */

AdminUI.mount('customers', 'клиенты', {
  sub: 'база покупателей магазина',
  actions: '<button class="btn btn--sm btn--outline" type="button" data-export-csv>экспорт csv</button>',
});

(() => {
  /* ---------- строки: демо-аккаунт прототипа + база клиентов ---------- */
  const myOrders = Store.userOrders();
  const meRow = () => ({
    id: 'me',
    name: 'алекс соколов (демо)',
    email: 'alex@example.com',
    phone: '+7 (913) 245-67-01',
    reg: '2026-02-11',
    orders: myOrders.length,
    spent: myOrders.reduce((s, o) => s + o.total, 0),
    last: myOrders.map(o => o.date).sort().pop() || null,
  });

  const rows = () => [meRow()].concat(DATA.customers);

  const state = { q: '', sortKey: '', sortDir: -1 };
  const digitsOnly = (s) => String(s || '').replace(/\D/g, '');

  /* ---------- поиск и сортировка ---------- */
  const visible = () => {
    const q = state.q.trim().toLowerCase();
    const qd = digitsOnly(q);
    let list = rows().filter(c => {
      if (!q) return true;
      const hay = (c.name + ' ' + c.email).toLowerCase();
      const phoneOk = qd.length >= 3 && digitsOnly(c.phone).includes(qd);
      return hay.includes(q) || phoneOk;
    });
    if (state.sortKey) {
      const dir = state.sortDir;
      list = list.slice().sort((a, b) => {
        if (state.sortKey === 'reg') return (a.reg || '').localeCompare(b.reg || '') * dir;
        if (state.sortKey === 'spent') return (a.spent - b.spent) * dir;
        return (a.orders - b.orders) * dir;
      });
    }
    return list;
  };

  const arrow = (key) => state.sortKey === key ? (state.sortDir > 0 ? ' ↑' : ' ↓') : '';

  /* ---------- таблица ---------- */
  const tableEl = document.querySelector('[data-customers-table]');

  const render = () => {
    const list = visible();
    document.querySelector('[data-total]').textContent =
      list.length + ' ' + Store.plural(list.length, 'клиент', 'клиента', 'клиентов');

    const body = list.map(c => `<tr>
      <td><a href="customer.html?id=${encodeURIComponent(c.id)}">${c.name}</a></td>
      <td class="mute">${c.email}</td>
      <td class="num">${c.phone}</td>
      <td>${Store.fmtDate(c.reg)}</td>
      <td class="num">${c.orders}</td>
      <td class="num">${Store.money(c.spent)}</td>
      <td>${c.last ? Store.fmtDate(c.last) : '<span class="mute">заказов не было</span>'}</td>
    </tr>`).join('');

    tableEl.innerHTML = `
      <thead><tr>
        <th>клиент</th>
        <th>email</th>
        <th>телефон</th>
        <th data-sort="reg">регистрация${arrow('reg')}</th>
        <th data-sort="orders">заказов${arrow('orders')}</th>
        <th data-sort="spent">сумма покупок${arrow('spent')}</th>
        <th>последний заказ</th>
      </tr></thead>
      <tbody>${body || '<tr><td colspan="7" class="mute" style="text-align:center;padding:36px">никого не нашлось — попробуй другой запрос</td></tr>'}</tbody>`;
  };

  /* ---------- события ---------- */
  document.querySelector('[data-search-box]').insertAdjacentHTML('afterbegin', UI.icon('search'));

  const fQ = document.querySelector('[data-f-q]');
  fQ.addEventListener('input', () => { state.q = fQ.value; render(); });

  tableEl.addEventListener('click', (e) => {
    const th = e.target.closest('th[data-sort]');
    if (!th) return;
    const key = th.dataset.sort;
    if (state.sortKey === key) state.sortDir = -state.sortDir;
    else { state.sortKey = key; state.sortDir = -1; }
    render();
  });

  document.querySelector('[data-export-csv]').addEventListener('click', () => {
    AdminUI.exportCSV('clients.csv', visible().map(c => ({
      клиент: c.name,
      email: c.email,
      телефон: c.phone,
      регистрация: Store.fmtDate(c.reg),
      заказов: c.orders,
      'сумма покупок': c.spent,
      'последний заказ': c.last ? Store.fmtDate(c.last) : '',
    })));
  });

  render();
})();
