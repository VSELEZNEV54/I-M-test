/* ============================================================
   С?М — админ-панель: настройки магазина
   ============================================================ */

AdminUI.mount('settings', 'настройки', {
  sub: 'оплата, доставка, уведомления, сотрудники и системные параметры',
});

(() => {
  const switchHTML = (attr, id, on) => `<label class="switch">
      <input type="checkbox" ${attr}="${id}" ${on ? 'checked' : ''}>
      <span class="switch__track"></span>
    </label>`;

  /* ---------- оплата ---------- */
  const PAY_ON = { card: true, sbp: true, cod: false };
  const PAY_HINT = {
    card: 'visa, mastercard, мир — 3-d secure включён',
    sbp: 'оплата по qr-коду, комиссия ниже эквайринга',
    cod: 'наличные и карта курьеру — только по новосибирску',
  };

  document.querySelector('[data-pay-methods]').innerHTML = DATA.payMethods.map(m => `
    <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--line)">
      <div style="flex:1;min-width:0">
        <div style="font-weight:600">${m.name}</div>
        <div class="small mute" style="margin-top:4px">${PAY_HINT[m.key] || ''}</div>
      </div>
      ${switchHTML('data-pay-toggle', m.key, !!PAY_ON[m.key])}
    </div>`).join('');

  document.querySelector('[data-pay-methods]').addEventListener('change', (e) => {
    const inp = e.target.closest('[data-pay-toggle]');
    if (!inp) return;
    const m = DATA.payMethods.find(x => x.key === inp.dataset.payToggle);
    UI.toast(`${m ? m.name : ''} — ${inp.checked ? 'включена' : 'выключена'}`, inp.checked ? '' : 'warn');
  });

  const providerSel = document.querySelector('[data-pay-provider]');
  providerSel.addEventListener('change', () => {
    UI.toast(`провайдер: ${providerSel.options[providerSel.selectedIndex].text} — подключим по api`);
  });

  /* ---------- доставка ---------- */
  document.querySelector('[data-delivery]').innerHTML = `
    <thead><tr><th>метод</th><th>цена, ₽</th><th>бесплатно от, ₽</th><th>срок</th></tr></thead>
    <tbody>${DATA.deliveryMethods.map(d => `<tr>
      <td><b>${d.name}</b></td>
      <td><input type="number" value="${d.cost}" min="0" step="10" aria-label="стоимость: ${d.name}" style="width:110px;padding:8px 10px;border:1px solid var(--line);background:var(--paper);font-size:13.5px"></td>
      <td><input type="number" value="${d.freeFrom == null ? '' : d.freeFrom}" min="0" step="500" placeholder="не действует" aria-label="бесплатно от: ${d.name}" style="width:140px;padding:8px 10px;border:1px solid var(--line);background:var(--paper);font-size:13.5px"></td>
      <td class="mute">${d.days}</td>
    </tr>`).join('')}</tbody>`;

  document.querySelector('[data-save-delivery]').addEventListener('click', () => {
    UI.toast('настройки доставки сохранены');
  });

  /* ---------- уведомления ---------- */
  document.querySelector('[data-notify]').innerHTML = DATA.notifyTemplates.map((t, i) => `
    <div style="border:1px solid var(--line);padding:14px 16px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600">${t.event}</div>
          <span class="tag" style="margin-top:6px">${t.channel}</span>
        </div>
        ${switchHTML('data-notify-toggle', String(i), true)}
      </div>
      <textarea rows="2" aria-label="шаблон: ${t.event}" style="width:100%;padding:10px 12px;border:1px solid var(--line);background:var(--paper);font-family:inherit;font-size:13.5px">${t.text}</textarea>
    </div>`).join('');

  document.querySelector('[data-notify]').addEventListener('change', (e) => {
    const inp = e.target.closest('[data-notify-toggle]');
    if (!inp) return;
    const t = DATA.notifyTemplates[+inp.dataset.notifyToggle];
    UI.toast(`уведомление «${t ? t.event : ''}» ${inp.checked ? 'включено' : 'выключено'}`, inp.checked ? '' : 'warn');
  });

  document.querySelector('[data-save-notify]').addEventListener('click', () => {
    UI.toast('шаблоны уведомлений сохранены');
  });

  /* ---------- сотрудники и роли ---------- */
  const STAFF = [
    { name: 'анна', role: 'администратор', cls: 'role--admin', access: 'полный доступ: заказы, товары, клиенты, настройки' },
    { name: 'игорь', role: 'менеджер заказов', cls: 'role--orders', access: 'заказы, клиенты и возвраты — без правки каталога' },
    { name: 'света', role: 'контент-менеджер', cls: 'role--content', access: 'блог, страницы и карточки товаров — без финансов' },
  ];

  document.querySelector('[data-staff]').innerHTML = `
    <thead><tr><th>сотрудник</th><th>роль</th><th>доступ</th></tr></thead>
    <tbody>${STAFF.map(s => `<tr>
      <td><b>${s.name}</b></td>
      <td><span class="role ${s.cls}">${s.role}</span></td>
      <td class="mute">${s.access}</td>
    </tr>`).join('')}</tbody>`;

  document.querySelector('[data-invite]').addEventListener('click', () => {
    UI.toast('приглашение отправлено на почту (демо)');
  });

  /* ---------- seo и системные ---------- */
  document.querySelector('[data-ecom]').addEventListener('change', (e) => {
    UI.toast(`ecommerce-события ${e.target.checked ? 'включены' : 'выключены'}`, e.target.checked ? '' : 'warn');
  });
  document.querySelector('[data-save-seo]').addEventListener('click', () => {
    UI.toast('настройки сохранены');
  });

  /* ---------- журнал действий ---------- */
  const LOG = [
    { who: 'анна', what: `изменила цену худи voidhood: ${Store.money(8400)} → ${Store.money(7900)}`, at: '2026-08-18T14:02:00' },
    { who: 'игорь', what: 'перевёл заказ С?М-10241 в статус «передан в доставку»', at: '2026-08-18T17:10:00' },
    { who: 'света', what: 'опубликовала статью «россия на подиуме»', at: '2026-08-17T11:35:00' },
    { who: 'анна', what: 'создала промокод BUNT10 на коллекцию «бунтари»', at: '2026-08-16T09:48:00' },
    { who: 'игорь', what: 'оформил возврат по заказу С?М-10236', at: '2026-08-15T16:20:00' },
  ];

  document.querySelector('[data-log]').innerHTML = `
    <thead><tr><th>кто</th><th>что сделал</th><th>когда</th></tr></thead>
    <tbody>${LOG.map(l => `<tr>
      <td><b>${l.who}</b></td>
      <td class="mute">${l.what}</td>
      <td class="num">${Store.fmtDateTime(l.at)}</td>
    </tr>`).join('')}</tbody>`;
})();
