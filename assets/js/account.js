/* ============================================================
   С?М — личный кабинет (account.html)
   вкладки по хэшу: #profile | #orders | #favorites | #offers | #addresses
   ============================================================ */

UI.mount({ active: '', reloadOnLogin: true });

const lkRoot = document.querySelector('[data-lk-root]');

/* экранирование пользовательских данных (имя, адреса, комментарий к заказу) */
const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- вкладки ---------- */
const LK_TABS = [
  { key: 'profile',   name: 'профиль' },
  { key: 'orders',    name: 'мои заказы' },
  { key: 'favorites', name: 'избранное' },
  { key: 'offers',    name: 'спецпредложения' },
  { key: 'addresses', name: 'адреса' },
];
const currentTab = () => {
  const h = (location.hash || '').replace('#', '');
  return LK_TABS.some(t => t.key === h) ? h : 'profile';
};

/* ---------- локальное состояние страницы ---------- */
const openOrders = new Set();   // раскрытые заказы (номера)
let addrEdit = null;            // id редактируемого адреса или '__new'

const favProducts = () => Store.fav().map(id => Store.getProduct(id)).filter(Boolean);

/* ============================================================
   не залогинен
   ============================================================ */
const renderGuest = () => {
  lkRoot.innerHTML = `
    <div class="empty">
      <h1 class="empty__title">личный кабинет</h1>
      <p>войди, чтобы видеть заказы, адреса и персональные скидки</p>
      <button class="btn btn--dark" type="button" data-open-auth>войти</button>
    </div>`;
};

/* ============================================================
   вкладка: профиль
   ============================================================ */
const paneProfile = (u) => `
  <h2 class="h2">профиль</h2>
  <form class="lk-form mt-20" data-profile-form>
    <div class="grid-2">
      <label class="field"><span>имя</span>
        <input type="text" name="name" value="${esc(u.name)}" placeholder="алекс" required></label>
      <label class="field"><span>фамилия</span>
        <input type="text" name="lastName" value="${esc(u.lastName)}" placeholder="соколов"></label>
    </div>
    <label class="field"><span>телефон</span>
      <input type="tel" name="phone" value="${esc(u.phone)}" placeholder="+7 (___) ___-__-__"></label>
    <label class="field"><span>e-mail</span>
      <input type="email" name="email" value="${esc(u.email)}" placeholder="alex@example.com"></label>
    <button class="btn btn--dark" type="submit">сохранить</button>
  </form>

  <div class="lk-pass mt-40">
    <h3 class="h3">сменить пароль</h3>
    <p class="small mute mt-20">пароль — штука скучная, но пусть будет крепким.</p>
    <form class="mt-20" data-pass-form>
      <label class="field"><span>текущий пароль</span><input type="password" placeholder="••••••••" required></label>
      <label class="field"><span>новый пароль</span><input type="password" placeholder="минимум 8 символов" minlength="8" required></label>
      <button class="btn btn--outline" type="submit">обновить пароль</button>
    </form>
  </div>`;

/* ============================================================
   вкладка: мои заказы
   ============================================================ */
const STATUS_CHAIN = ['new', 'confirmed', 'paid', 'processing', 'packing', 'shipped', 'transit', 'delivered'];

const orderQty = (o) => (o.items || []).reduce((s, i) => s + i.qty, 0);

const statusBlock = (o) => {
  const st = DATA.statusByKey[o.status] || { name: o.status, step: -1 };
  if (st.step === -1) {
    return `<span class="status-pill status-pill--${o.status} status-pill--big">${st.name}</span>`;
  }
  return `<div class="status-track">
    ${STATUS_CHAIN.map((key, i) => {
      const cls = i < st.step ? ' is-done' : (i === st.step ? ' is-now' : '');
      return `<div class="status-track__step${cls}">${DATA.statusByKey[key].name}</div>`;
    }).join('')}
  </div>`;
};

const orderItemsTable = (o) => `
  <div class="table-wrap">
    <table class="table order-items">
      <thead><tr><th></th><th>товар</th><th>размер</th><th>кол-во</th><th>цена</th></tr></thead>
      <tbody>
        ${(o.items || []).map(i => {
          const p = Store.getProduct(i.id);
          return `<tr>
            <td>${p ? `<img src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy">` : ''}</td>
            <td>${p ? `<a href="product.html?id=${p.id}">${esc(p.name)}</a>` : esc(i.id)}</td>
            <td>${i.size === 'uni' ? 'один размер' : esc(i.size)}</td>
            <td>${i.qty} шт.</td>
            <td><b>${Store.money(i.price)}</b></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;

const orderInfo = (o) => {
  const dm = DATA.deliveryMethods.find(m => m.key === (o.delivery || {}).method);
  const pm = DATA.payMethods.find(m => m.key === o.payment);
  const d = o.delivery || {};
  const blocks = [
    `<div>
      <div class="order-info__label">доставка</div>
      <div>${dm ? dm.name : '—'}${dm ? ` <span class="small mute">(${dm.days})</span>` : ''}</div>
      <div class="small mute">${esc([d.city, d.addr].filter(Boolean).join(', ')) || '—'}</div>
      <div class="small mute">${o.deliveryCost ? Store.money(o.deliveryCost) : 'доставка бесплатно'}</div>
    </div>`,
    `<div>
      <div class="order-info__label">оплата</div>
      <div>${pm ? pm.name : '—'}</div>
      <div class="small mute">${esc(o.payStatus) || '—'}</div>
    </div>`,
  ];
  if (o.promo || o.discount) {
    blocks.push(`<div>
      <div class="order-info__label">промокод</div>
      <div>${esc(o.promo) || '—'}</div>
      <div class="small mute">скидка ${Store.money(o.discount || 0)}</div>
    </div>`);
  }
  if (o.comment) {
    blocks.push(`<div>
      <div class="order-info__label">комментарий</div>
      <div class="small">${esc(o.comment)}</div>
    </div>`);
  }
  return `<div class="order-info">${blocks.join('')}</div>`;
};

const orderCard = (o) => {
  const st = DATA.statusByKey[o.status] || { name: o.status };
  const qty = orderQty(o);
  const thumbs = (o.items || []).slice(0, 3).map(i => {
    const p = Store.getProduct(i.id);
    return p ? `<img src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy">` : '';
  }).join('');
  return `
  <article class="order-card${openOrders.has(o.num) ? ' is-open' : ''}" data-order="${o.num}">
    <button class="order-card__head" type="button" data-order-toggle="${o.num}">
      <span class="order-card__num">${o.num}</span>
      <span class="order-card__date">от ${Store.fmtDate(o.date)}</span>
      <span class="status-pill status-pill--${o.status}">${st.name}</span>
      <span class="order-card__sum">${Store.money(o.total)}</span>
      <span class="small mute">${qty} ${Store.plural(qty, 'товар', 'товара', 'товаров')}</span>
      <span class="order-card__thumbs">${thumbs}</span>
      <span class="order-card__chev">${UI.icon('chevron')}</span>
    </button>
    <div class="order-card__body">
      ${statusBlock(o)}
      ${orderItemsTable(o)}
      ${orderInfo(o)}
      <div class="order-card__actions">
        <button class="btn btn--outline btn--sm" type="button" data-repeat="${o.num}">повторить заказ</button>
        ${o.status === 'await-pay' ? `<button class="btn btn--lime btn--sm" type="button" data-pay="${o.num}">оплатить</button>` : ''}
      </div>
    </div>
  </article>`;
};

const paneOrders = () => {
  const list = Store.userOrders();
  if (!list.length) {
    return `<h2 class="h2">мои заказы</h2>
      <div class="empty">
        <div class="empty__title">заказов пока нет</div>
        <p>самое время это исправить — в каталоге лежит то, что тебе точно нужно.</p>
        <a class="btn btn--dark" href="catalog.html">в каталог</a>
      </div>`;
  }
  return `<h2 class="h2">мои заказы</h2>
    <p class="small mute mt-20 mb-20">нажми на заказ — покажем путь посылки и состав.</p>
    ${list.map(orderCard).join('')}`;
};

/* ============================================================
   вкладка: спецпредложения
   ============================================================ */
const offerCard = (of) => {
  const until = of.until ? `<div class="offer-card__until">до ${Store.fmtDate(of.until)}</div>` : '';
  const head = `<div class="offer-card__title">${of.title}</div><p>${of.text}</p>`;

  if (of.kind === 'promo') {
    return `<article class="offer-card offer-card--promo">
      ${head}
      <div class="offer-card__code">
        <b>${of.code}</b>
        <button class="btn btn--dark btn--sm" type="button" data-copy="${of.code}">${UI.icon('copy')} скопировать</button>
      </div>
      ${until}
    </article>`;
  }

  if (of.kind === 'product') {
    const p = Store.getProduct(of.productId);
    return `<article class="offer-card">
      ${head}
      ${p ? `<a class="offer-card__product" href="product.html?id=${p.id}">
        <img src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy">
        <span>
          <span class="offer-card__pname">${esc(p.name)}</span><br>
          <b>${Store.money(p.price)}</b>
        </span>
      </a>` : ''}
      ${until}
    </article>`;
  }

  return `<article class="offer-card">
    ${head}
    <div class="mt-20"><span class="tag tag--lime">доставка за наш счёт</span></div>
    ${until}
  </article>`;
};

const paneOffers = () => `
  <h2 class="h2">спецпредложения</h2>
  <p class="small mute mt-20 mb-20">персонально для тебя — потому что ты с нами.</p>
  <div class="offers-grid">${DATA.offers.map(offerCard).join('')}</div>

  <h3 class="h3 mt-60 mb-20">действующие акции</h3>
  ${DATA.actions.filter(a => a.active).map(a => `
    <div class="action-row">
      <div>
        <div class="action-row__name">${a.name}</div>
        <div class="small mute">${a.desc}</div>
      </div>
      <div class="small mute">${a.until ? 'до ' + Store.fmtDate(a.until) : 'бессрочно'}</div>
    </div>`).join('')}`;

/* ============================================================
   вкладка: адреса
   ============================================================ */
const addrForm = (a) => `
  <form class="addr-card addr-form" data-addr-form="${a ? a.id : '__new'}">
    <label class="field"><span>название</span>
      <input type="text" name="title" value="${a ? esc(a.title) : ''}" placeholder="дом, работа, зал" required></label>
    <label class="field"><span>город</span>
      <input type="text" name="city" value="${a ? esc(a.city) : ''}" placeholder="новосибирск" required></label>
    <label class="field"><span>адрес</span>
      <input type="text" name="addr" value="${a ? esc(a.addr) : ''}" placeholder="ул. ленина, 12, кв. 45" required></label>
    <div class="addr-form__btns">
      <button class="btn btn--dark btn--sm" type="submit">сохранить</button>
      <button class="btn btn--ghost btn--sm" type="button" data-addr-cancel>отмена</button>
    </div>
  </form>`;

const addrCard = (a) => `
  <article class="addr-card">
    <div class="addr-card__title">${UI.icon('pin')}${esc(a.title)}</div>
    <div class="addr-card__text">${esc(a.city)}<br>${esc(a.addr)}</div>
    <div class="addr-card__actions">
      <button class="linklike" type="button" data-addr-edit="${a.id}">редактировать</button>
      <button class="linklike" type="button" data-addr-del="${a.id}">удалить</button>
    </div>
  </article>`;

const paneAddresses = (u) => {
  const list = u.addresses || [];
  const cards = list.map(a => (addrEdit === a.id ? addrForm(a) : addrCard(a)));
  cards.push(addrEdit === '__new'
    ? addrForm(null)
    : `<button class="addr-add" type="button" data-addr-add>${UI.icon('plus')}<span>добавить адрес</span></button>`);
  return `<h2 class="h2">адреса</h2>
    <p class="small mute mt-20 mb-20">куда везти дроп — выбирается при оформлении заказа.</p>
    <div class="addr-grid">${cards.join('')}</div>`;
};

/* ============================================================
   вкладка: избранное
   ============================================================ */
const paneFav = () => {
  const items = favProducts();
  if (!items.length) {
    return `<h2 class="h2">избранное</h2>
      <div class="empty">
        <div class="empty__title">пока пусто</div>
        <p>лайкай сердечки в каталоге — всё, что зацепило, соберётся здесь.</p>
        <a class="btn btn--dark" href="catalog.html">в каталог</a>
      </div>`;
  }
  return `<h2 class="h2">избранное</h2>
    <p class="small mute mt-20 mb-20">${items.length} ${Store.plural(items.length, 'товар', 'товара', 'товаров')} ждут своего часа.</p>
    <div class="pgrid">${items.map(p => UI.productCard(p)).join('')}</div>`;
};

/* ============================================================
   каркас кабинета
   ============================================================ */
const menuHTML = (tab) => {
  const counts = { orders: Store.userOrders().length, favorites: Store.fav().length };
  return `<nav class="lk-menu">
    ${LK_TABS.map(t => `
      <a class="lk-menu__item${t.key === tab ? ' is-active' : ''}" href="#${t.key}">
        <span>${t.name}</span>
        ${counts[t.key] !== undefined ? `<span class="lk-menu__count">${counts[t.key]}</span>` : ''}
      </a>`).join('')}
    <button class="lk-menu__item lk-menu__item--logout" type="button" data-logout><span>выйти</span></button>
  </nav>`;
};

const paneHTML = (tab, u) => {
  if (tab === 'orders') return paneOrders();
  if (tab === 'favorites') return paneFav();
  if (tab === 'offers') return paneOffers();
  if (tab === 'addresses') return paneAddresses(u);
  return paneProfile(u);
};

const renderPane = () => {
  const u = Store.user();
  if (!u) return renderAll();
  const box = lkRoot.querySelector('[data-lk-pane]');
  if (!box) return renderAll();
  const tab = currentTab();
  box.innerHTML = paneHTML(tab, u);
  lkRoot.querySelectorAll('.lk-menu__item[href]').forEach(el => {
    el.classList.toggle('is-active', el.getAttribute('href') === '#' + tab);
  });
};

const renderAll = () => {
  const u = Store.user();
  if (!u) { renderGuest(); return; }
  const tab = currentTab();
  lkRoot.innerHTML = `
    <h1 class="h1 lk-title">личный кабинет</h1>
    <div class="lk">
      <aside class="lk__side">
        <div class="lk-user">
          <div class="lk-user__hello">привет,</div>
          <div class="lk-user__name">${esc([u.name, u.lastName].filter(Boolean).join(' ')) || 'друг'}</div>
        </div>
        ${menuHTML(tab)}
      </aside>
      <div data-lk-pane>${paneHTML(tab, u)}</div>
    </div>`;
};

/* ============================================================
   события
   ============================================================ */
window.addEventListener('hashchange', () => { addrEdit = null; renderPane(); });

lkRoot.addEventListener('click', (e) => {
  /* выйти */
  if (e.target.closest('[data-logout]')) {
    Store.logout();
    UI.toast('вышли из кабинета — возвращайся');
    renderAll();
    return;
  }

  /* раскрыть заказ */
  const toggle = e.target.closest('[data-order-toggle]');
  if (toggle) {
    const num = toggle.dataset.orderToggle;
    const card = toggle.closest('.order-card');
    const isOpen = card.classList.toggle('is-open');
    if (isOpen) openOrders.add(num); else openOrders.delete(num);
    return;
  }

  /* повторить заказ */
  const rep = e.target.closest('[data-repeat]');
  if (rep) {
    const [ok, skip] = Store.repeatOrder(rep.dataset.repeat);
    UI.toast(`в корзине: ${ok}, пропущено: ${skip} (нет в наличии)`, skip && !ok ? 'warn' : '');
    return;
  }

  /* оплатить */
  const pay = e.target.closest('[data-pay]');
  if (pay) {
    const num = pay.dataset.pay;
    const o = Store.getOrder(num);
    if (!o) return;
    Store.patchOrder(num, {
      status: 'paid',
      payStatus: 'оплачено',
      history: (o.history || []).concat([
        { at: '2026-08-19T12:00:00', by: 'платёжная система', from: 'await-pay', to: 'paid' },
      ]),
    });
    openOrders.add(num);
    renderPane();
    UI.toast(`${num} оплачен — собираем посылку`);
    return;
  }

  /* скопировать промокод */
  const copy = e.target.closest('[data-copy]');
  if (copy) {
    const code = copy.dataset.copy;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code)
        .then(() => UI.toast(`промокод ${code} скопирован`))
        .catch(() => UI.toast(`промокод: ${code} — скопируй вручную`, 'warn'));
    } else {
      UI.toast(`промокод: ${code} — скопируй вручную`, 'warn');
    }
    return;
  }

  /* адреса */
  const aEdit = e.target.closest('[data-addr-edit]');
  if (aEdit) { addrEdit = aEdit.dataset.addrEdit; renderPane(); return; }

  if (e.target.closest('[data-addr-add]')) { addrEdit = '__new'; renderPane(); return; }
  if (e.target.closest('[data-addr-cancel]')) { addrEdit = null; renderPane(); return; }

  const aDel = e.target.closest('[data-addr-del]');
  if (aDel) {
    const u = Store.user();
    if (!u) return;
    Store.updateUser({ addresses: (u.addresses || []).filter(a => a.id !== aDel.dataset.addrDel) });
    addrEdit = null;
    renderPane();
    UI.toast('адрес удалён');
  }
});

lkRoot.addEventListener('submit', (e) => {
  const u = Store.user();
  if (!u) return;

  /* профиль */
  const pForm = e.target.closest('[data-profile-form]');
  if (pForm) {
    e.preventDefault();
    const fd = new FormData(pForm);
    Store.updateUser({
      name: (fd.get('name') || '').trim(),
      lastName: (fd.get('lastName') || '').trim(),
      phone: (fd.get('phone') || '').trim(),
      email: (fd.get('email') || '').trim(),
    });
    renderAll();
    UI.toast('сохранили — теперь всё по-твоему');
    return;
  }

  /* пароль */
  const passForm = e.target.closest('[data-pass-form]');
  if (passForm) {
    e.preventDefault();
    passForm.reset();
    UI.toast('пароль обновлён (ну, почти — это прототип)');
    return;
  }

  /* адрес */
  const aForm = e.target.closest('[data-addr-form]');
  if (aForm) {
    e.preventDefault();
    const fd = new FormData(aForm);
    const patch = {
      title: (fd.get('title') || '').trim(),
      city: (fd.get('city') || '').trim(),
      addr: (fd.get('addr') || '').trim(),
    };
    const list = (u.addresses || []).slice();
    const id = aForm.dataset.addrForm;
    if (id === '__new') list.push({ id: 'a' + Date.now(), ...patch });
    else {
      const i = list.findIndex(a => a.id === id);
      if (i >= 0) list[i] = { ...list[i], ...patch };
    }
    Store.updateUser({ addresses: list });
    addrEdit = null;
    renderPane();
    UI.toast(id === '__new' ? 'адрес добавлен' : 'адрес обновлён');
  }
});

/* избранное могли изменить прямо на плитке — обновляем счётчики и грид */
Store.onChange((e) => {
  const key = (e.detail || {}).key;
  if (key !== 'fav') return;
  if (!Store.user()) return;
  const counter = lkRoot.querySelector('.lk-menu__item[href="#favorites"] .lk-menu__count');
  if (counter) counter.textContent = Store.fav().length;
  if (currentTab() === 'favorites') renderPane();
});

/* ---------- старт ---------- */
renderAll();
