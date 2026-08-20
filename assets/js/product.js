/* ============================================================
   С?М — логика карточки товара (product.html?id=…)
   ============================================================ */

UI.mount({ active: 'catalog' });

const params = new URLSearchParams(location.search);
const pid = params.get('id') || '';
const product = Store.getProduct(pid);

const crumbsEl = document.querySelector('[data-crumbs]');
const productEl = document.querySelector('[data-product]');

/* ---------- заполнение секции с карточками ---------- */
const fillSection = (key, items) => {
  const sec = document.querySelector(`[data-sec="${key}"]`);
  if (!sec) return;
  if (!items.length) { sec.hidden = true; return; }
  sec.hidden = false;
  sec.querySelector('[data-grid]').innerHTML = items.map(x => UI.productCard(x)).join('');
};

if (!product) {
  /* ---------- товар не найден ---------- */
  document.title = 'товар не найден | с?м';
  crumbsEl.innerHTML = `
    <span><a href="index.html">главная</a></span>
    <span><a href="catalog.html">каталог</a></span>
    <span>товар не найден</span>`;
  productEl.innerHTML = `
    <div class="empty">
      <div class="empty__title">товар не найден</div>
      <p>такого дропа у нас нет — или он уже разлетелся по рукам. загляни в каталог, там всё живое.</p>
      <a class="btn btn--dark" href="catalog.html">в каталог</a>
    </div>`;
} else {
  Store.addViewed(product.id);

  const cat = DATA.categoryBySlug[product.category];
  const col = DATA.collectionBySlug[product.collection];
  const pct = Store.discountPct(product);
  const total = Store.totalStock(product);
  const isUni = product.sizes.uni !== undefined;
  let selSize = isUni ? 'uni' : null;

  /* ---------- SEO: title, description, JSON-LD ---------- */
  document.title = `${product.name} — купить за ${Store.money(product.price)} | с?м`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content',
    `${product.name} (${product.sku}) за ${Store.money(product.price)} в интернет-магазине с?м. ${product.short} доставка по россии, возврат 14 дней.`);
  const ldScript = document.createElement('script');
  ldScript.type = 'application/ld+json';
  ldScript.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    image: product.images,
    description: product.short,
    brand: { '@type': 'Brand', name: 'с?м' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'RUB',
      availability: total > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: location.href,
    },
  });
  document.head.appendChild(ldScript);

  /* ---------- крошки ---------- */
  crumbsEl.innerHTML = `
    <span><a href="index.html">главная</a></span>
    <span><a href="catalog.html">каталог</a></span>
    ${cat ? `<span><a href="catalog.html?cat=${cat.slug}">${cat.name}</a></span>` : ''}
    <span>${product.name}</span>`;

  /* ---------- галерея ---------- */
  const badges =
    (pct ? `<span class="pcard__badge">−${pct}%</span>` : '') +
    (product.tags && product.tags.includes('new') ? '<span class="pcard__badge pcard__badge--new">new</span>' : '');
  const thumbsHTML = product.images.length > 1
    ? `<div class="product__thumbs" data-thumbs>
        ${product.images.map((src, i) => `
          <button class="product__thumb ${i === 0 ? 'is-active' : ''}" type="button" data-idx="${i}" aria-label="фото ${i + 1}">
            <img src="${src}" alt="${product.name} — фото ${i + 1}" loading="lazy">
          </button>`).join('')}
      </div>`
    : '';

  /* ---------- размеры ---------- */
  const sizesHTML = isUni ? '' : `
    <div class="product__sizes">
      <div class="product__sizes-head small mute">выбери размер</div>
      <div class="sizes" data-sizes>
        ${DATA.sizes.filter(s => s in product.sizes).map(s => {
          const n = product.sizes[s] || 0;
          return `<button class="size-btn" type="button" data-size="${s}" ${n === 0 ? 'disabled' : ''}>${s}</button>`;
        }).join('')}
      </div>
      <div class="size-hint" data-size-hint></div>
    </div>`;

  /* ---------- покупка ---------- */
  const favHTML = `
    <button class="fav-btn ${Store.favHas(product.id) ? 'is-active' : ''}" type="button" data-fav-toggle aria-label="в избранное">
      ${UI.icon('heart')}${UI.icon('heartFill', 'icon--fill')}
    </button>`;
  const buyHTML = total > 0 ? `
    <div class="buyrow">
      <div class="qty product-qty">
        <button type="button" data-qty-minus aria-label="меньше">${UI.icon('minus')}</button>
        <input data-qty value="1" inputmode="numeric" aria-label="количество">
        <button type="button" data-qty-plus aria-label="больше">${UI.icon('plus')}</button>
      </div>
      <button class="btn btn--dark" type="button" data-add-cart>добавить в корзину</button>
      ${favHTML}
    </div>` : `
    <div class="buyrow">
      <button class="btn btn--outline" type="button" data-notify>уведомить о поступлении</button>
      ${favHTML}
    </div>`;

  /* ---------- аккордеоны ---------- */
  const charsRows = Object.entries(product.chars || {})
    .map(([k, v]) => `<tr><td class="mute">${k}</td><td>${v}</td></tr>`).join('');
  const accHTML = `
    <div class="acc product__acc" data-acc>
      <div class="acc__item is-open">
        <button class="acc__head" type="button">описание ${UI.icon('chevron')}</button>
        <div class="acc__body"><p>${product.desc}</p></div>
      </div>
      <div class="acc__item">
        <button class="acc__head" type="button">характеристики ${UI.icon('chevron')}</button>
        <div class="acc__body"><div class="table-wrap"><table class="table">${charsRows}</table></div></div>
      </div>
      <div class="acc__item">
        <button class="acc__head" type="button">доставка и возврат ${UI.icon('chevron')}</button>
        <div class="acc__body">
          <p>курьер — 1–3 дня, бесплатно от 8 000 ₽. пункт выдачи — 2–4 дня, бесплатно от 5 000 ₽. почта дотянется куда угодно за 4–10 дней.</p>
          <p>не подошло? 14 дней на «не моё» — вернём деньги без допросов.</p>
          <p class="product__acc-links">
            <a class="linklike" href="delivery.html">доставка и оплата</a>
            <a class="linklike" href="returns.html">обмен и возврат</a>
          </p>
        </div>
      </div>
    </div>`;

  /* ---------- сборка страницы ---------- */
  productEl.innerHTML = `
    <div class="product__grid">
      <div class="product__gallery ${product.images.length > 1 ? '' : 'product__gallery--single'}">
        ${thumbsHTML}
        <div class="product__photo"><img data-photo src="${product.images[0]}" alt="${product.name}" fetchpriority="high">${badges}</div>
      </div>
      <div class="product__info">
        <h1 class="h1 product__name">${product.name}</h1>
        <div class="product__meta">
          арт. ${product.sku}
          ${cat ? ` • <a href="catalog.html?cat=${cat.slug}">${cat.name}</a>` : ''}
          ${col ? ` • коллекция <a href="catalog.html?collection=${col.slug}">«${col.name}»</a>` : ''}
        </div>
        <div class="product__price">
          ${Store.money(product.price)}
          ${product.oldPrice ? `<s>${Store.money(product.oldPrice)}</s>` : ''}
          ${pct ? `<span class="product__pct">−${pct}%</span>` : ''}
        </div>
        ${total > 0
          ? `<div class="product__stock product__stock--in">${UI.icon('check')} в наличии${total <= 5 ? ' — разбирают быстро' : ''}</div>`
          : `<div class="product__stock product__stock--out">${UI.icon('close')} нет в наличии — дроп разобрали</div>`}
        ${sizesHTML}
        ${buyHTML}
        ${accHTML}
      </div>
    </div>`;

  /* ---------- галерея: переключение фото ---------- */
  const bigImg = productEl.querySelector('[data-photo]');
  const thumbsWrap = productEl.querySelector('[data-thumbs]');
  if (thumbsWrap) thumbsWrap.addEventListener('click', (e) => {
    const b = e.target.closest('.product__thumb');
    if (!b) return;
    bigImg.src = product.images[+b.dataset.idx];
    thumbsWrap.querySelectorAll('.product__thumb').forEach(x => x.classList.toggle('is-active', x === b));
  });

  /* ---------- размер + подсказка об остатке ---------- */
  const hintEl = productEl.querySelector('[data-size-hint]');
  const qtyInput = productEl.querySelector('[data-qty]');
  const clampQty = () => {
    if (!qtyInput) return;
    const max = selSize ? Math.max(product.sizes[selSize] || 0, 1) : 99;
    let v = parseInt(qtyInput.value, 10) || 1;
    qtyInput.value = Math.max(1, Math.min(v, max));
  };
  const sizesWrap = productEl.querySelector('[data-sizes]');
  if (sizesWrap) sizesWrap.addEventListener('click', (e) => {
    const b = e.target.closest('.size-btn');
    if (!b || b.disabled) return;
    selSize = b.dataset.size;
    sizesWrap.querySelectorAll('.size-btn').forEach(x => x.classList.toggle('is-active', x === b));
    const left = product.sizes[selSize] || 0;
    hintEl.textContent = left > 0 && left <= 3 ? `осталось ${left} шт — успей забрать` : '';
    clampQty();
  });

  /* ---------- количество ---------- */
  if (qtyInput) {
    productEl.querySelector('[data-qty-minus]').addEventListener('click', () => { qtyInput.value = (parseInt(qtyInput.value, 10) || 1) - 1; clampQty(); });
    productEl.querySelector('[data-qty-plus]').addEventListener('click', () => { qtyInput.value = (parseInt(qtyInput.value, 10) || 1) + 1; clampQty(); });
    qtyInput.addEventListener('change', clampQty);
  }

  /* ---------- в корзину / уведомить / избранное ---------- */
  const addBtn = productEl.querySelector('[data-add-cart]');
  if (addBtn) addBtn.addEventListener('click', () => {
    if (!selSize) { UI.toast('сначала выбери размер', 'warn'); return; }
    clampQty();
    const qty = parseInt(qtyInput.value, 10) || 1;
    Store.cartAdd(product.id, selSize, qty);
    UI.toast(`${product.name} — в корзине${selSize !== 'uni' ? ` (размер ${selSize})` : ''}`);
  });
  const notifyBtn = productEl.querySelector('[data-notify]');
  if (notifyBtn) notifyBtn.addEventListener('click', () => UI.toast('пришлём письмо, как только вернём в дроп'));
  const favBtn = productEl.querySelector('[data-fav-toggle]');
  if (favBtn) favBtn.addEventListener('click', () => {
    const added = Store.favToggle(product.id);
    favBtn.classList.toggle('is-active', added);
    UI.toast(added ? 'добавили в избранное' : 'убрали из избранного');
  });

  /* ---------- аккордеоны ---------- */
  productEl.querySelector('[data-acc]').addEventListener('click', (e) => {
    const head = e.target.closest('.acc__head');
    if (head) head.closest('.acc__item').classList.toggle('is-open');
  });

  /* ---------- секции внизу ---------- */
  const relatedItems = (product.related || []).map(id => Store.getProduct(id)).filter(Boolean);
  fillSection('related', relatedItems);

  const excluded = new Set([product.id, ...(product.related || [])]);
  const similar = Store.allProducts()
    .filter(x => !excluded.has(x.id) && (x.category === product.category || x.collection === product.collection))
    .sort((a, b) => b.pop - a.pop)
    .slice(0, 4);
  fillSection('similar', similar);

  const viewedItems = Store.viewed()
    .filter(id => id !== product.id)
    .map(id => Store.getProduct(id))
    .filter(Boolean);
  fillSection('viewed', viewedItems);
}
