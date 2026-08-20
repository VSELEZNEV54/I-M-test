/* ============================================================
   С?М — UI: общий «хром» страниц (топбар, шапка, подвал),
   поиск, модалка входа, карточка товара, тосты, cookie.
   Подключать после data.js и store.js.
   Страница должна содержать <div id="chrome-top"></div> в начале body
   и <div id="chrome-footer"></div> в конце. Вызов: UI.mount().
   ============================================================ */

const UI = (() => {
  const R = Store.REL;

  /* ---------- иконки (инлайн SVG) ---------- */
  const ICONS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.3-9.2-8.5C1.2 8.4 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3c.7-1.2 2.1-2.3 4.1-2.3 3.4 0 5.2 3.4 3.6 6.5C19 15.7 12 20 12 20z" stroke-linejoin="round"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.3-9.2-8.5C1.2 8.4 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3c.7-1.2 2.1-2.3 4.1-2.3 3.4 0 5.2 3.4 3.6 6.5C19 15.7 12 20 12 20z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 8h14l-1 12H6L5 8z" stroke-linejoin="round"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12h16m0 0l-6-6m6 6l-6 6"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 12H4m0 0l6-6m-6 6l6 6"/></svg>',
    arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 4v16m0 0l-6-6m6 6l6-6"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 9l6 6 6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12l5 5L20 7"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 7h14M10 7V5h4v2m-7 0l1 13h8l1-13"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.4"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2-5.6-3.2L6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" stroke-linejoin="round"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
  };
  const icon = (name, cls = '') => `<span class="icon ${cls}">${ICONS[name] || ''}</span>`;

  /* ---------- логотип ---------- */
  /* Фирменный знак с?м® — инлайн-svg, наследует цвет текста (currentColor) */
  const LOGO_MARK = '<svg class="logo__mark" viewBox="0 0 532 185" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M479.311 35.9961H532V156.549H503.218V60.3478H498.112L448.208 156.549H415.712L365.576 60.3478H360.47V156.549H331.92V35.9961H384.609L432.192 127.375L479.311 35.9961Z" fill="currentColor"/><path d="M157.604 106.399C156.675 109.051 155.515 111.703 154.122 113.873C148.551 123.035 138.571 129.063 127.429 129.063H58.0279C40.6195 129.063 26.2286 114.355 26.2286 96.0314C26.2286 77.7074 40.6195 63.241 58.0279 63.241H127.429C137.642 63.241 146.695 68.3043 152.497 76.0196C153.89 77.9485 155.051 79.8773 155.979 82.0473H183.832C182.208 75.0552 179.422 68.5454 175.709 62.9999C165.264 46.6047 147.623 35.9961 127.429 35.9961H58.0279C25.9965 35.9961 0 62.9999 0 96.2725C0 129.545 25.9965 156.549 58.0279 156.549H127.429C148.319 156.549 166.656 145.217 176.869 127.857C180.815 121.348 183.368 114.114 184.761 106.399H157.604Z" fill="currentColor"/><path d="M304.298 128.34H288.05C280.623 128.34 274.588 134.609 274.588 142.324C274.588 150.039 280.623 156.308 288.05 156.308H304.298C311.726 156.308 317.761 150.039 317.761 142.324C317.761 134.609 311.726 128.34 304.298 128.34ZM304.995 151.968H286.89C282.248 151.968 278.766 147.628 278.766 142.324C278.766 137.02 282.48 132.68 286.89 132.68H304.995C309.637 132.68 313.118 137.02 313.118 142.324C313.351 147.628 309.637 151.968 304.995 151.968Z" fill="currentColor"/><path d="M305.691 140.156C305.691 137.263 303.37 134.852 300.585 134.852H289.907H288.979H286.426V149.559H289.907V145.46H298.96L301.745 149.559H305.691L302.674 144.978C304.53 144.255 305.691 142.326 305.691 140.156ZM289.907 138.227H300.585C301.513 138.227 302.441 139.191 302.441 140.156C302.441 141.12 301.513 142.085 300.585 142.085H289.907V138.227Z" fill="currentColor"/><path d="M294.55 90.2454L198.688 148.111V115.32L280.855 65.6526C290.14 60.1072 293.157 47.5697 287.818 38.1666C282.48 28.5224 270.41 25.388 261.358 30.9334L198.92 68.787V35.9966L247.663 6.58174C269.946 -6.92018 298.496 1.03631 311.494 24.1825C324.492 47.0875 316.832 76.7435 294.55 90.2454ZM198.92 156.308V185H232.112V156.308H198.92Z" fill="currentColor"/></svg>';

  const logo = (cls = '') =>
    `<a class="logo ${cls}" href="${R}index.html" aria-label="с?м — на главную">${LOGO_MARK}</a>`;

  /* ---------- топбар + шапка + подвал ---------- */
  const topbarHTML = () => `
  <div class="topbar">
    <div class="topbar__in container">
      <a class="topbar__geo" href="${R}contacts.html">${icon('pin')} ${DATA.shop.city} • ${DATA.shop.address}</a>
      <nav class="topbar__links">
        <a href="${R}returns.html">обмен и возврат</a>
        <a href="${R}account.html#orders">статус заказа</a>
        <a href="${R}delivery.html">доставка и оплата</a>
        <a href="${R}contacts.html">адреса магазинов</a>
        <a href="${R}account.html#offers">программа лояльности</a>
        <a href="${R}admin/index.html" class="topbar__admin">админ-панель</a>
      </nav>
      <a class="topbar__phone" href="tel:+79039001516">${DATA.shop.phone}</a>
    </div>
  </div>`;

  const headerHTML = (active = '') => `
  <header class="site-header">
    <div class="site-header__in container">
      ${logo()}
      <nav class="site-header__nav">
        <a href="${R}about.html" ${active === 'about' ? 'class="is-active"' : ''}>о бренде</a>
        <a href="${R}catalog.html" ${active === 'catalog' ? 'class="is-active"' : ''}>каталог</a>
        <a href="${R}catalog.html?tag=new" ${active === 'new' ? 'class="is-active"' : ''}>новинки</a>
        <a href="${R}catalog.html?tag=sale" ${active === 'sale' ? 'class="is-active"' : ''}>акции</a>
        <a href="${R}lookbook.html" ${active === 'lookbook' ? 'class="is-active"' : ''}>лукбуки</a>
        <a href="${R}blog.html" ${active === 'blog' ? 'class="is-active"' : ''}>блог</a>
      </nav>
      <div class="site-header__actions">
        <button class="iconbtn" data-open-search aria-label="поиск">${icon('search')}</button>
        <a class="iconbtn" href="${R}favorites.html" aria-label="избранное">${icon('heart')}<span class="iconbtn__count" data-count-fav hidden></span></a>
        <a class="iconbtn" href="${R}cart.html" aria-label="корзина">${icon('bag')}<span class="iconbtn__count" data-count-cart hidden></span></a>
        <a class="iconbtn" href="${R}account.html" aria-label="личный кабинет">${icon('user')}</a>
        <button class="burger" data-burger aria-label="меню"><span></span><span></span><span></span></button>
      </div>
    </div>
    <nav class="mobile-nav" data-mobile-nav hidden>
      <a href="${R}catalog.html">каталог</a>
      <a href="${R}catalog.html?tag=new">новинки</a>
      <a href="${R}catalog.html?tag=sale">акции</a>
      <a href="${R}about.html">о бренде</a>
      <a href="${R}lookbook.html">лукбуки</a>
      <a href="${R}blog.html">блог</a>
      <a href="${R}delivery.html">доставка и оплата</a>
      <a href="${R}contacts.html">контакты</a>
      <a href="${R}admin/index.html">админ-панель</a>
    </nav>
  </header>`;

  const footerHTML = () => `
  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">${logo('logo--lg')}</div>
        <div class="footer__col">
          <div class="footer__head">магазин</div>
          <a href="${R}catalog.html?cat=hudi">худи</a>
          <a href="${R}catalog.html?cat=verhnyaya">верхняя одежда</a>
          <a href="${R}catalog.html?cat=futbolki">футболки</a>
          <a href="${R}catalog.html?cat=rubashki">рубашки</a>
          <a href="${R}catalog.html?cat=platya">платья</a>
          <a href="${R}catalog.html?cat=aksessuary">аксессуары</a>
        </div>
        <div class="footer__col">
          <div class="footer__head">помощь</div>
          <a href="${R}contacts.html">ответы на вопросы</a>
          <a href="${R}account.html#orders">статус заказа</a>
          <a href="${R}delivery.html">доставка и оплата</a>
          <a href="${R}account.html#offers">программа лояльности</a>
          <a href="${R}returns.html">обмен и возврат</a>
          <a href="${R}account.html#offers">подарочный сертификат</a>
        </div>
        <div class="footer__col">
          <div class="footer__head">контакты</div>
          <a href="mailto:${DATA.shop.email}">почта</a>
          <a href="#" rel="nofollow">instagram*</a>
          <a href="#" rel="nofollow">telegram</a>
          <a href="#" rel="nofollow">яндекс.дзен</a>
          <a href="#" rel="nofollow">вконтакте</a>
        </div>
        <div class="footer__sub">
          <div class="footer__head">подпишитесь на новости и обновления</div>
          <form class="subscribe" data-subscribe>
            <input type="email" required placeholder="введите e-mail" aria-label="e-mail">
            <label class="check"><input type="checkbox" required checked><span class="check__box"></span>
              <span>я даю согласие на обработку моих персональных данных в соответствии с <a href="${R}privacy.html">условиями политики конфиденциальности</a></span></label>
            <button class="btn btn--dark btn--block" type="submit">отправить</button>
          </form>
        </div>
      </div>
      <div class="footer__bottom">
        <span>2026 © все права защищены</span>
        <a href="${R}privacy.html">политика конфиденциальности</a>
        <a href="${R}terms.html">договор оферты</a>
        <a class="footer__phone" href="tel:+79039001516">${DATA.shop.phone}</a>
        <span>${DATA.shop.city} • ${DATA.shop.address}</span>
        <button class="footer__up" data-scroll-top aria-label="наверх">${icon('arrowRight', 'icon--up')}</button>
      </div>
    </div>
    <div class="footer__statement" aria-hidden="true">
      <div>разреши уже</div>
      <div>себе <span>быть собой</span></div>
    </div>
  </footer>`;

  /* ---------- поиск ---------- */
  const searchHTML = () => `
  <div class="search-overlay" data-search hidden>
    <div class="search-overlay__panel container">
      <div class="search-overlay__row">
        ${icon('search', 'icon--lg')}
        <input type="search" class="search-overlay__input" placeholder="искать дроп: худи, цепи, sm-0101…" data-search-input aria-label="поиск по магазину">
        <button class="iconbtn" data-close-search aria-label="закрыть">${icon('close')}</button>
      </div>
      <div class="search-overlay__hint">например: <button data-q="худи">худи</button><button data-q="балаклава">балаклава</button><button data-q="цепи">цепи</button><button data-q="тренч">тренч</button></div>
      <div class="search-overlay__results" data-search-results></div>
    </div>
  </div>`;

  const searchProducts = (q) => {
    q = q.trim().toLowerCase();
    if (q.length < 2) return [];
    return Store.allProducts().filter(p => {
      const cat = DATA.categoryBySlug[p.category], col = DATA.collectionBySlug[p.collection];
      const hay = [p.name, p.sku, cat && cat.name, col && col.name, p.short, DATA.colorBySlug[p.color] && DATA.colorBySlug[p.color].name]
        .filter(Boolean).join(' ').toLowerCase();
      return q.split(/\s+/).every(w => hay.includes(w));
    }).slice(0, 6);
  };

  const renderSearchResults = (q) => {
    const box = document.querySelector('[data-search-results]');
    if (!box) return;
    const items = searchProducts(q);
    if (q.trim().length < 2) { box.innerHTML = ''; return; }
    if (!items.length) {
      box.innerHTML = `<div class="search-empty"><div class="search-empty__title">ничего не нашлось</div>
        <p>попробуй иначе: «худи», «топ», «цепи» — или загляни в каталог, там всё.</p>
        <a class="btn btn--lime" href="${R}catalog.html">смотреть весь каталог</a></div>`;
      return;
    }
    box.innerHTML = items.map(p => `
      <a class="search-hit" href="${R}product.html?id=${p.id}">
        <img src="${R}${p.images[0]}" alt="${p.name}" loading="lazy">
        <span class="search-hit__name">${p.name}<em>${(DATA.categoryBySlug[p.category] || {}).name || ''} • ${p.sku}</em></span>
        <span class="search-hit__price">${Store.money(p.price)}</span>
      </a>`).join('') +
      `<a class="search-all" href="${R}catalog.html?q=${encodeURIComponent(q)}">все результаты ${icon('arrowRight')}</a>`;
  };

  /* ---------- модалка входа ---------- */
  const authHTML = () => `
  <div class="modal" data-auth-modal hidden>
    <div class="modal__backdrop" data-auth-close></div>
    <div class="modal__panel">
      <button class="modal__close iconbtn" data-auth-close aria-label="закрыть">${icon('close')}</button>
      <div class="modal__title">вход в кабинет</div>
      <div class="tabs" role="tablist">
        <button class="tabs__tab is-active" data-auth-tab="email">email + пароль</button>
        <button class="tabs__tab" data-auth-tab="phone">телефон + код</button>
      </div>
      <form class="authform" data-auth-form="email">
        <label class="field"><span>e-mail</span><input type="email" required placeholder="alex@example.com" value="alex@example.com"></label>
        <label class="field"><span>пароль</span><input type="password" required placeholder="••••••••" value="demo-demo"></label>
        <button class="btn btn--dark btn--block" type="submit">войти</button>
        <button class="linklike" type="button" data-auth-restore>восстановить доступ</button>
      </form>
      <form class="authform" data-auth-form="phone" hidden>
        <label class="field"><span>телефон</span><input type="tel" required placeholder="+7 (___) ___-__-__" value="+7 (913) 245-67-01"></label>
        <label class="field"><span>код из смс</span><input type="text" inputmode="numeric" required placeholder="0000" maxlength="4"></label>
        <div class="field__hint">это прототип: подойдёт код <b>0000</b></div>
        <button class="btn btn--dark btn--block" type="submit">войти</button>
      </form>
      <div class="modal__demo">
        <span>показываете прототип? — </span>
        <button class="linklike" data-auth-demo>войти демо-пользователем</button>
      </div>
    </div>
  </div>`;

  /* ---------- cookie ---------- */
  const cookieHTML = () => `
  <div class="cookie-pop" data-cookie hidden>
    <div class="cookie-pop__title">это кукис, наши «шпионы»</div>
    <p>нажимай «принять все», и забудем про скучные окна с настройками. давай ломать систему вместе — кукис с нами, хаос с тобой!</p>
    <div class="cookie-pop__btns">
      <button class="btn btn--dark" data-cookie-accept>принять все</button>
      <button class="btn btn--outline" data-cookie-reject>не принимать</button>
    </div>
  </div>`;

  /* ---------- тосты ---------- */
  const toast = (text, kind = '') => {
    let wrap = document.querySelector('.toasts');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toasts'; document.body.appendChild(wrap); }
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast--' + kind : '');
    el.innerHTML = text;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-in'));
    setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 350); }, 2600);
  };

  /* ---------- карточка товара ---------- */
  const productCard = (p, opts = {}) => {
    const pct = Store.discountPct(p);
    const out = Store.totalStock(p) <= 0;
    const img2 = p.images[1] ? `<img class="pcard__img2" src="${R}${p.images[1]}" alt="" loading="lazy">` : '';
    return `
    <article class="pcard ${out ? 'pcard--out' : ''}" data-id="${p.id}">
      <a class="pcard__media" href="${R}product.html?id=${p.id}">
        <img class="pcard__img" src="${R}${p.images[0]}" alt="${p.name}" loading="lazy">${img2}
        ${pct ? `<span class="pcard__badge">−${pct}%</span>` : ''}
        ${p.tags && p.tags.includes('new') ? '<span class="pcard__badge pcard__badge--new">new</span>' : ''}
        ${out ? '<span class="pcard__out">нет в наличии</span>' : ''}
        <button class="pcard__fav ${Store.favHas(p.id) ? 'is-active' : ''}" data-fav="${p.id}" aria-label="в избранное">
          ${icon('heart')}${icon('heartFill', 'icon--fill')}
        </button>
      </a>
      <div class="pcard__row">
        <a class="pcard__name" href="${R}product.html?id=${p.id}">${p.name}</a>
        <button class="pcard__add" data-add="${p.id}" aria-label="добавить в корзину" ${out ? 'disabled' : ''}>${icon('plus')}</button>
      </div>
      <div class="pcard__price">${Store.money(p.price)}${p.oldPrice ? `<s>${Store.money(p.oldPrice)}</s>` : ''}</div>
    </article>`;
  };

  /* Быстрое добавление из карточки: берём первый доступный размер */
  const quickAdd = (id) => {
    const p = Store.getProduct(id);
    if (!p) return;
    const size = Object.keys(p.sizes).find(s => p.sizes[s] > 0);
    if (!size) { toast('товара нет в наличии', 'warn'); return; }
    Store.cartAdd(id, size, 1);
    toast(`${p.name} — в корзине ${size !== 'uni' ? `(размер ${size})` : ''}`);
  };

  /* Делегирование кликов по карточкам (работает на любой странице) */
  const bindCards = (root = document) => {
    root.addEventListener('click', (e) => {
      const fav = e.target.closest('[data-fav]');
      if (fav) {
        e.preventDefault();
        const added = Store.favToggle(fav.dataset.fav);
        fav.classList.toggle('is-active', added);
        toast(added ? 'добавили в избранное' : 'убрали из избранного');
        return;
      }
      const add = e.target.closest('[data-add]');
      if (add && !add.disabled) { e.preventDefault(); quickAdd(add.dataset.add); }
    });
  };

  /* ---------- счётчики в шапке ---------- */
  const refreshCounts = () => {
    const c = Store.cartCount(), f = Store.fav().length;
    document.querySelectorAll('[data-count-cart]').forEach(el => { el.textContent = c; el.hidden = !c; });
    document.querySelectorAll('[data-count-fav]').forEach(el => { el.textContent = f; el.hidden = !f; });
  };

  /* ---------- бегущая строка ---------- */
  const marquee = (cls = '') => {
    const words = DATA.shop.values.concat(DATA.shop.values, DATA.shop.values, DATA.shop.values);
    return `<div class="marquee ${cls}" aria-hidden="true"><div class="marquee__track">
      ${words.map(w => `<span>${w}</span><i>✳</i>`).join('')}
      ${words.map(w => `<span>${w}</span><i>✳</i>`).join('')}
    </div></div>`;
  };

  /* ---------- монтаж ---------- */
  const mount = (opts = {}) => {
    const top = document.getElementById('chrome-top');
    if (top) top.innerHTML = topbarHTML() + headerHTML(opts.active || '');
    const foot = document.getElementById('chrome-footer');
    if (foot) foot.innerHTML = footerHTML();
    document.body.insertAdjacentHTML('beforeend', searchHTML() + authHTML() + cookieHTML());

    /* поиск */
    const overlay = document.querySelector('[data-search]');
    const input = document.querySelector('[data-search-input]');
    const openSearch = () => { overlay.hidden = false; document.body.classList.add('no-scroll'); setTimeout(() => input.focus(), 50); };
    const closeSearch = () => { overlay.hidden = true; document.body.classList.remove('no-scroll'); };
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-search]')) openSearch();
      if (e.target.closest('[data-close-search]')) closeSearch();
      const qb = e.target.closest('[data-q]');
      if (qb) { input.value = qb.dataset.q; renderSearchResults(input.value); input.focus(); }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSearch(); closeAuth(); } });
    input.addEventListener('input', () => renderSearchResults(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); location.href = `${R}catalog.html?q=${encodeURIComponent(input.value)}`; }
    });

    /* модалка входа */
    const authModal = document.querySelector('[data-auth-modal]');
    const closeAuth = () => { if (authModal) { authModal.hidden = true; document.body.classList.remove('no-scroll'); } };
    const openAuth = () => { authModal.hidden = false; document.body.classList.add('no-scroll'); };
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-auth-close]')) closeAuth();
      if (e.target.closest('[data-open-auth]')) { e.preventDefault(); openAuth(); }
      const tab = e.target.closest('[data-auth-tab]');
      if (tab) {
        document.querySelectorAll('[data-auth-tab]').forEach(t => t.classList.toggle('is-active', t === tab));
        document.querySelectorAll('[data-auth-form]').forEach(f => f.hidden = f.dataset.authForm !== tab.dataset.authTab);
      }
      if (e.target.closest('[data-auth-demo]')) { Store.login(); closeAuth(); toast('привет, алекс! ты в кабинете'); afterLogin(); }
      if (e.target.closest('[data-auth-restore]')) toast('в прототипе восстановление не настроено — войди демо-пользователем', 'warn');
    });
    document.querySelectorAll('[data-auth-form]').forEach(f => {
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        Store.login(); closeAuth(); toast('привет, алекс! ты в кабинете'); afterLogin();
      });
    });
    const afterLogin = () => {
      document.dispatchEvent(new CustomEvent('auth:login'));
      if (opts.reloadOnLogin) location.reload();
    };

    /* cookie */
    const cookie = document.querySelector('[data-cookie]');
    if (cookie && !Store.flag('cookieDone')) setTimeout(() => { cookie.hidden = false; }, 900);
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-cookie-accept]') || e.target.closest('[data-cookie-reject]')) {
        Store.setFlag('cookieDone'); cookie.hidden = true;
        if (e.target.closest('[data-cookie-accept]')) toast('кукис с нами, хаос с тобой');
      }
    });

    /* подписка в подвале */
    document.querySelectorAll('[data-subscribe]').forEach(f => {
      f.addEventListener('submit', (e) => { e.preventDefault(); f.reset(); toast('готово! письма будут дерзкими, обещаем'); });
    });

    /* мобильное меню */
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-burger]');
      const nav = document.querySelector('[data-mobile-nav]');
      if (b && nav) { nav.hidden = !nav.hidden; b.classList.toggle('is-open', !nav.hidden); }
    });

    /* наверх */
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-scroll-top]')) window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    bindCards();
    refreshCounts();
    Store.onChange(refreshCounts);
  };

  return { mount, icon, logo, toast, productCard, quickAdd, bindCards, refreshCounts, marquee, searchProducts };
})();
