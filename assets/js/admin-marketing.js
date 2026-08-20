/* ============================================================
   С?М — админ-панель: промокоды, акции и спецпредложения
   ============================================================ */

AdminUI.mount('marketing', 'промокоды и акции', {
  sub: 'скидки, автоматические механики и персональные предложения',
});

(() => {
  /* ---------- данные ---------- */
  const customPromos = () => Store.flag('customPromos') || [];
  const allPromos = () => DATA.promos.concat(customPromos());

  /* состояние переключателей живёт в рамках сессии страницы */
  const activeMap = {};
  const isActive = (p) => activeMap[p.code] === undefined ? !!p.active : activeMap[p.code];

  const actionActive = {};
  const isActionOn = (a) => actionActive[a.id] === undefined ? !!a.active : actionActive[a.id];

  const SEGMENTS = [
    { key: 'all', name: 'все клиенты' },
    { key: 'new', name: 'новые' },
    { key: 'noorders', name: 'без заказов' },
    { key: 'sleep', name: 'спящие 90+ дней' },
  ];

  const sizeOf = (p) => p.type === 'percent' ? p.value + '%' : Store.money(p.value);
  const switchHTML = (attr, id, on) => `<label class="switch">
      <input type="checkbox" ${attr}="${id}" ${on ? 'checked' : ''}>
      <span class="switch__track"></span>
    </label>`;

  /* ---------- панель 1: промокоды ---------- */
  const promosEl = document.querySelector('[data-promos]');

  const renderPromos = () => {
    const list = allPromos();
    const rows = list.map(p => `<tr>
      <td><b>${p.code}</b>${p.custom ? '<div class="small mute">создан в админке</div>' : ''}</td>
      <td class="mute">${p.desc || '—'}</td>
      <td class="num">${sizeOf(p)}</td>
      <td class="num">${p.minSum ? Store.money(p.minSum) : '—'}</td>
      <td>${p.until ? 'до ' + Store.fmtDate(p.until) : 'бессрочно'}</td>
      <td class="num">${p.used} / ${p.limit}</td>
      <td>${switchHTML('data-promo-toggle', p.code, isActive(p))}</td>
    </tr>`).join('');

    promosEl.innerHTML = `
      <thead><tr>
        <th>код</th><th>описание</th><th>размер скидки</th><th>мин. сумма</th>
        <th>срок</th><th>использовано</th><th>активен</th>
      </tr></thead>
      <tbody>${rows}</tbody>`;
  };

  promosEl.addEventListener('change', (e) => {
    const inp = e.target.closest('[data-promo-toggle]');
    if (!inp) return;
    const code = inp.dataset.promoToggle;
    activeMap[code] = inp.checked;
    UI.toast(`промокод ${code} ${inp.checked ? 'включён' : 'выключен'}`, inp.checked ? '' : 'warn');
  });

  /* форма создания */
  const formEl = document.querySelector('[data-promo-form]');
  const fCode = formEl.querySelector('[data-p-code]');
  const fType = formEl.querySelector('[data-p-type]');
  const fValue = formEl.querySelector('[data-p-value]');
  const fMin = formEl.querySelector('[data-p-min]');
  const fUntil = formEl.querySelector('[data-p-until]');

  document.querySelector('[data-new-promo]').addEventListener('click', () => {
    formEl.hidden = !formEl.hidden;
    if (!formEl.hidden) fCode.focus();
  });
  document.querySelector('[data-cancel-promo]').addEventListener('click', () => { formEl.hidden = true; });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    /* код промокода — только латиница, цифры и дефис (как SKOLKO15 и BUNT10) */
    const code = fCode.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const value = Math.max(1, parseInt(fValue.value, 10) || 0);
    if (!code) { UI.toast('придумай код латиницей — без него промокод не работает', 'warn'); return; }
    if (allPromos().some(p => p.code === code)) { UI.toast('такой код уже есть в списке', 'warn'); return; }

    const promoNew = {
      code,
      type: fType.value,
      value,
      minSum: Math.max(0, parseInt(fMin.value, 10) || 0),
      until: fUntil.value || null,
      limit: 100,
      used: 0,
      active: true,
      custom: true,
      desc: fType.value === 'percent' ? `скидка ${value}% на заказ` : `минус ${Store.money(value)} на заказ`,
    };
    Store.setFlag('customPromos', customPromos().concat([promoNew]));
    formEl.reset();
    fUntil.value = '2026-12-31';
    formEl.hidden = true;
    renderPromos();
    UI.toast(`промокод ${code} создан`);
  });

  /* ---------- панель 2: автоматические акции ---------- */
  const actionsEl = document.querySelector('[data-actions]');

  const renderActions = () => {
    actionsEl.innerHTML = DATA.actions.map(a => `
      <div style="border:1px solid var(--line);padding:14px 16px;margin-bottom:12px;display:flex;gap:14px;align-items:center">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600">${a.name}</div>
          <div class="small mute" style="margin-top:4px">${a.desc}</div>
          <div class="small mute" style="margin-top:6px">${a.until ? 'до ' + Store.fmtDate(a.until) : 'бессрочно'}</div>
        </div>
        ${switchHTML('data-action-toggle', a.id, isActionOn(a))}
      </div>`).join('');
  };

  actionsEl.addEventListener('change', (e) => {
    const inp = e.target.closest('[data-action-toggle]');
    if (!inp) return;
    const a = DATA.actions.find(x => x.id === inp.dataset.actionToggle);
    actionActive[inp.dataset.actionToggle] = inp.checked;
    UI.toast(`акция «${a ? a.name : ''}» ${inp.checked ? 'включена' : 'выключена'}`, inp.checked ? '' : 'warn');
  });

  document.querySelector('[data-new-action]').addEventListener('click', () => {
    UI.toast('конструктор акций доступен в полной версии', 'warn');
  });

  /* ---------- панель 3: спецпредложения в кабинете ---------- */
  const offersEl = document.querySelector('[data-offers]');

  const renderOffers = () => {
    offersEl.innerHTML = DATA.offers.map(o => `
      <div style="border:1px solid var(--line);padding:14px 16px;margin-bottom:12px">
        <div style="font-weight:600">${o.title}</div>
        <div class="small mute" style="margin-top:4px">${o.text}</div>
        <div class="small mute" style="margin-top:6px">до ${Store.fmtDate(o.until)}</div>
        <label class="field" style="margin:12px 0 0"><span>кому показываем</span>
          <select data-offer-seg="${o.id}">
            ${SEGMENTS.map(s => `<option value="${s.key}">${s.name}</option>`).join('')}
          </select>
        </label>
      </div>`).join('');
  };

  offersEl.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-offer-seg]');
    if (!sel) return;
    const o = DATA.offers.find(x => x.id === sel.dataset.offerSeg);
    const seg = SEGMENTS.find(s => s.key === sel.value);
    UI.toast(`«${o ? o.title : ''}» — сегмент: ${seg ? seg.name : ''}`);
  });

  /* ---------- старт ---------- */
  renderPromos();
  renderActions();
  renderOffers();
})();
