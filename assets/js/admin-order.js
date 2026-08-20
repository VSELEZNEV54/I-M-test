/* ============================================================
   С?М — админ-панель: карточка заказа
   ============================================================ */

const orderNum = decodeURIComponent(new URLSearchParams(location.search).get('num') || '');

const ME = { name: 'алекс соколов', phone: '+7 (913) 245-67-01', email: 'alex@example.com' };
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const statusName = (key) => (DATA.statusByKey[key] || {}).name || key || '—';
const stampNow = () => '2026-08-19T' + new Date().toTimeString().slice(0, 8);

const pageRoot = document.querySelector('[data-order-page]');

/* ---------- заказ не найден ---------- */
if (!Store.getOrder(orderNum)) {
  AdminUI.mount('orders', 'заказ не найден', { sub: 'проверь номер — или ссылка устарела' });
  pageRoot.innerHTML = `
    <div class="empty">
      <div class="empty__title">заказ не найден</div>
      <p>такого номера нет в базе. вернись к списку и найди нужный.</p>
      <a class="btn btn--dark" href="orders.html">ко всем заказам</a>
    </div>`;
} else {
  const first = Store.getOrder(orderNum);
  AdminUI.mount('orders', 'заказ ' + first.num, { sub: 'оформлен ' + Store.fmtDateTime(first.date) });

  /* ---------- actions в шапке ---------- */
  const actionsHtml = (o) => `
    <select data-status-select style="border:1px solid var(--line);padding:9px 10px;font-size:13px;background:var(--paper)">
      ${DATA.orderStatuses.map(s => `<option value="${s.key}" ${s.key === o.status ? 'selected' : ''}>${s.name}</option>`).join('')}
    </select>
    <button class="btn btn--dark btn--sm" type="button" data-apply>применить</button>
    ${o.status === 'delivered' ? '<button class="btn btn--plum btn--sm" type="button" data-refund>инициировать возврат</button>' : ''}
    <button class="btn btn--outline btn--sm" type="button" data-cancel>отменить заказ</button>`;

  /* ---------- контент ---------- */
  const itemsPanel = (o) => {
    const subtotal = o.items.reduce((s, i) => s + i.price * i.qty, 0);
    const rows = o.items.map(i => {
      const p = Store.getProduct(i.id);
      return `<tr>
        <td style="width:52px">${p ? `<img class="adm-thumb" src="../${p.images[0]}" alt="">` : ''}</td>
        <td><a href="../product.html?id=${i.id}">${p ? p.name : i.id}</a>${p ? `<div class="small mute">${p.sku}</div>` : ''}</td>
        <td>${i.size}</td>
        <td class="num">${i.qty}</td>
        <td class="num">${Store.money(i.price)}</td>
        <td class="num">${Store.money(i.price * i.qty)}</td>
      </tr>`;
    }).join('');
    const totalRow = (label, value, bold) => `
      <div style="display:flex;justify-content:space-between;gap:14px;padding:4px 0;${bold ? 'font-weight:700;font-size:16px;margin-top:6px' : ''}">
        <span class="${bold ? '' : 'mute'}">${label}</span><span class="num">${value}</span>
      </div>`;
    return `
      <div class="panel panel--pad0">
        <div class="panel__head"><div class="panel__title">состав заказа</div></div>
        <div class="table-wrap">
          <table class="adm-table">
            <thead><tr><th></th><th>товар</th><th>размер</th><th>кол-во</th><th>цена</th><th>сумма</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="padding:16px 22px;font-size:13.5px">
          ${totalRow('подытог', Store.money(subtotal))}
          ${o.discount ? totalRow('скидка' + (o.promo ? ` (промокод ${o.promo})` : ''), '− ' + Store.money(o.discount)) : ''}
          ${totalRow('доставка', o.deliveryCost ? Store.money(o.deliveryCost) : 'бесплатно')}
          ${totalRow('итог', Store.money(o.total), true)}
        </div>
      </div>`;
  };

  const historyPanel = (o) => {
    const items = (o.history || []).slice().reverse().map(h => `
      <div class="timeline__item">
        <div class="timeline__date">${Store.fmtDateTime(h.at)}</div>
        <div class="timeline__who">${h.by}</div>
        <div>${h.from ? `«${statusName(h.from)}» → «${statusName(h.to)}»` : 'заказ создан'}</div>
      </div>`).join('');
    return `
      <div class="panel mt-20">
        <div class="panel__head"><div class="panel__title">история изменений</div></div>
        <div class="timeline">${items || '<p class="mute small">пока пусто</p>'}</div>
      </div>`;
  };

  const sidePanels = (o) => {
    const c = o.customerId === 'me' ? ME : (DATA.customerById[o.customerId] || { name: '—', phone: '—', email: '—' });
    const dm = DATA.deliveryMethods.find(m => m.key === (o.delivery || {}).method);
    const pm = DATA.payMethods.find(m => m.key === o.payment);
    const line = (label, value) => `<div style="padding:5px 0;font-size:13.5px"><span class="mute">${label}: </span>${value}</div>`;
    return `
      <div class="panel">
        <div class="panel__head"><div class="panel__title">покупатель</div></div>
        ${line('имя', c.name)}
        ${line('телефон', c.phone || '—')}
        ${line('email', c.email || '—')}
        ${o.customerId !== 'me' && DATA.customerById[o.customerId] ? `<a class="linklike small" href="customer.html?id=${o.customerId}">карточка клиента →</a>` : ''}
      </div>
      <div class="panel mt-20">
        <div class="panel__head"><div class="panel__title">доставка</div></div>
        ${line('метод', dm ? dm.name : '—')}
        ${line('город', (o.delivery || {}).city || '—')}
        ${line('адрес', (o.delivery || {}).addr || '—')}
        ${line('стоимость', o.deliveryCost ? Store.money(o.deliveryCost) : 'бесплатно')}
      </div>
      <div class="panel mt-20">
        <div class="panel__head"><div class="panel__title">оплата</div></div>
        ${line('метод', pm ? pm.name : '—')}
        ${line('статус', o.payStatus || '—')}
      </div>
      <div class="panel mt-20">
        <div class="panel__head"><div class="panel__title">комментарий клиента</div></div>
        <p style="font-size:13.5px;margin:0">${o.comment ? esc(o.comment) : '—'}</p>
      </div>
      <div class="panel mt-20">
        <div class="panel__head"><div class="panel__title">внутренний комментарий</div></div>
        <textarea data-adm-note rows="4" placeholder="виден только команде магазина"
          style="width:100%;border:1px solid var(--line);background:var(--paper);padding:10px 12px;font-size:13.5px;font-family:inherit;resize:vertical">${esc(o.adminNote || '')}</textarea>
        <button class="btn btn--dark btn--sm" type="button" data-save-note style="margin-top:10px">сохранить</button>
      </div>`;
  };

  const render = () => {
    const o = Store.getOrder(orderNum);
    document.querySelector('.adm-top__actions').innerHTML = actionsHtml(o);
    pageRoot.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:18px">
        <span class="status-pill status-pill--${o.status}" style="font-size:15px;padding:9px 16px">${statusName(o.status)}</span>
        <span class="mute small">создан ${Store.fmtDateTime(o.date)}${o.manager ? ` · менеджер: ${o.manager}` : ''}</span>
      </div>
      <div class="adm-grid">
        <div>
          ${itemsPanel(o)}
          ${historyPanel(o)}
        </div>
        <div>${sidePanels(o)}</div>
      </div>`;
  };

  /* ---------- смена статуса ---------- */
  const changeStatus = (toKey) => {
    const o = Store.getOrder(orderNum);
    if (o.status === toKey) { UI.toast('заказ уже в этом статусе', 'warn'); return; }
    const fromKey = o.status;
    Store.patchOrder(o.num, {
      status: toKey,
      history: (o.history || []).concat([{ at: stampNow(), by: 'менеджер анна', from: fromKey, to: toKey }]),
    });
    UI.toast(`${o.num}: ${statusName(fromKey)} → ${statusName(toKey)}`);
    render();
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-apply]')) {
      const sel = document.querySelector('[data-status-select]');
      if (sel) changeStatus(sel.value);
    }
    if (e.target.closest('[data-cancel]')) {
      if (confirm('точно отменить заказ ' + orderNum + '?')) changeStatus('cancelled');
    }
    if (e.target.closest('[data-refund]')) {
      changeStatus('refund');
    }
    if (e.target.closest('[data-save-note]')) {
      const ta = document.querySelector('[data-adm-note]');
      Store.patchOrder(orderNum, { adminNote: ta ? ta.value : '' });
      UI.toast('внутренний комментарий сохранён');
      render();
    }
  });

  render();
}
