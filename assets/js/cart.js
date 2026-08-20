/* ============================================================
   С?М — корзина (cart.html)
   строки заказа, степперы, промокод, сводка, «с этим покупают»
   ============================================================ */

UI.mount({ active: 'catalog' });

const cartRoot = document.querySelector('[data-cart-root]');
const cartCountEl = document.querySelector('[data-cart-count]');
const relSec = document.querySelector('[data-sec-related]');
const relGrid = relSec.querySelector('[data-grid]');
const relTitle = relSec.querySelector('[data-rel-title]');

const courierMethod = DATA.deliveryMethods.find(d => d.key === 'courier') || { freeFrom: 8000 };
const freeFrom = courierMethod.freeFrom || 8000;

/* ---------- строка корзины ---------- */
const lineHTML = (l) => {
  const p = l.product;
  const isOut = l.avail === 0;
  const isLow = !isOut && l.avail < l.qty;
  const warn = isOut
    ? '<div class="cart-line__warn">товар закончился — удалите из корзины</div>'
    : (isLow ? `<div class="cart-line__warn">осталось ${l.avail} шт</div>` : '');
  return `
  <div class="cart-line ${isOut ? 'cart-line--out' : ''}" data-line data-id="${p.id}" data-size="${l.size}">
    <a class="cart-line__media" href="product.html?id=${p.id}" aria-label="${p.name}">
      <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
    </a>
    <div class="cart-line__info">
      <a class="cart-line__name" href="product.html?id=${p.id}">${p.name}</a>
      <div class="cart-line__meta">арт. ${p.sku}${l.size !== 'uni' ? ` • размер ${l.size}` : ''}</div>
      <div class="cart-line__unit">${Store.money(p.price)} за штуку${p.oldPrice ? `<s>${Store.money(p.oldPrice)}</s>` : ''}</div>
      ${warn}
    </div>
    <div class="qty">
      <button type="button" data-minus aria-label="меньше" ${isOut ? 'disabled' : ''}>${UI.icon('minus')}</button>
      <input data-qty value="${l.qty}" inputmode="numeric" aria-label="количество" ${isOut ? 'disabled' : ''}>
      <button type="button" data-plus aria-label="больше" ${isOut ? 'disabled' : ''}>${UI.icon('plus')}</button>
    </div>
    <div class="cart-line__sum">${Store.money(l.sum)}</div>
    <button class="cart-line__del" type="button" data-del aria-label="удалить из корзины">${UI.icon('trash')}</button>
  </div>`;
};

/* ---------- промокод: поле или применённый код ---------- */
const promoHTML = (t) => {
  const code = t.promoCode;
  if (!code) {
    return `
    <div class="cart-promo">
      <input data-promo-input type="text" placeholder="промокод" aria-label="промокод" autocomplete="off">
      <button class="btn btn--outline" type="button" data-promo-apply>применить</button>
    </div>
    <div class="small mute">есть код? вводи — посчитаем скидку сразу.</div>`;
  }
  const pr = DATA.promos.find(x => x.code === code) || {};
  const note = t.discount > 0
    ? `<span class="promo-applied__note">${pr.desc || ''}</span>`
    : `<span class="promo-applied__note">не хватает ${Store.money(Math.max(0, (pr.minSum || 0) - t.subtotal))} до скидки</span>`;
  return `
  <div class="promo-applied">
    ${UI.icon('check')}
    <span>промокод <b>${code}</b></span>
    ${t.discount > 0 ? `<span class="promo-applied__val">−${Store.money(t.discount)}</span>` : ''}
    ${note}
    <button class="promo-applied__del" type="button" data-promo-del aria-label="убрать промокод">${UI.icon('close')}</button>
  </div>`;
};

/* ---------- сводка ---------- */
const summaryHTML = (t) => {
  const count = t.lines.reduce((s, l) => s + l.qty, 0);
  const allOut = t.lines.every(l => l.avail === 0);
  const left = freeFrom - t.total;
  return `
  <aside class="summary">
    <div class="summary__title">итого</div>
    <div class="summary__row">
      <span>товары (${count} шт)</span><b>${Store.money(t.subtotal)}</b>
    </div>
    ${t.discount > 0 ? `<div class="summary__row summary__row--discount"><span>скидка${t.promoCode ? ` • ${t.promoCode}` : ''}</span><b>−${Store.money(t.discount)}</b></div>` : ''}
    <div class="summary__row"><span>доставка</span><b>рассчитается при оформлении</b></div>
    <div class="summary__total"><span>к оплате</span><span>${Store.money(t.total)}</span></div>
    ${allOut
      ? '<button class="btn btn--dark btn--block" type="button" disabled>оформить заказ</button>'
      : '<a class="btn btn--dark btn--block" href="checkout.html">оформить заказ</a>'}
    <div class="summary__hint">
      бесплатная доставка курьером от ${Store.money(freeFrom)}${left > 0 ? ` — не хватает ${Store.money(left)}` : ''}.
      <a href="delivery.html">все условия доставки</a>
    </div>
  </aside>`;
};

/* ---------- «с этим товаром покупают» ---------- */
const renderRelated = (t) => {
  const inCart = new Set(t.lines.map(l => l.id));
  let items = [];
  if (t.lines.length) {
    items = (t.lines[0].product.related || []).map(id => Store.getProduct(id)).filter(Boolean);
  }
  items = items.filter(p => !inCart.has(p.id));
  if (items.length < 4) {
    const taken = new Set(items.map(p => p.id));
    const extra = Store.allProducts()
      .filter(p => !inCart.has(p.id) && !taken.has(p.id) && Store.totalStock(p) > 0)
      .sort((a, b) => b.pop - a.pop);
    items = items.concat(extra);
  }
  items = items.slice(0, 4);
  if (!items.length) { relSec.hidden = true; return; }
  relSec.hidden = false;
  /* корзина пуста — это уже не «с этим товаром», а просто топ каталога */
  if (relTitle) {
    relTitle.innerHTML = t.lines.length
      ? 'с этим товаром <span class="accent">покупают</span>'
      : 'сейчас <span class="accent">разбирают</span>';
  }
  relGrid.innerHTML = items.map(p => UI.productCard(p)).join('');
};

/* ---------- полная перерисовка страницы ---------- */
const render = () => {
  const t = Store.cartTotals();
  const count = t.lines.reduce((s, l) => s + l.qty, 0);
  cartCountEl.textContent = count ? `${count} ${Store.plural(count, 'товар', 'товара', 'товаров')}` : '';

  if (!t.lines.length) {
    cartRoot.innerHTML = `
      <div class="empty">
        <div class="empty__title">в корзине пусто, а могло быть громко</div>
        <p>ничего не выбрано — самое время это исправить. каталог живой, размеры разбирают быстро.</p>
        <a class="btn btn--dark" href="catalog.html">в каталог</a>
      </div>`;
  } else {
    cartRoot.innerHTML = `
      <div class="cart-layout">
        <div>
          <div class="cart-lines">${t.lines.map(lineHTML).join('')}</div>
          ${promoHTML(t)}
        </div>
        ${summaryHTML(t)}
      </div>`;
  }
  renderRelated(t);
};

/* ---------- изменение количества ---------- */
const setQty = (row, next) => {
  const id = row.dataset.id, size = row.dataset.size;
  const line = Store.cartTotals().lines.find(l => l.id === id && l.size === size);
  if (!line) return;
  if (next > line.avail) {
    UI.toast(`доступно только ${line.avail} шт`, 'warn');
    next = line.avail;
  }
  if (next <= 0) {
    Store.cartRemove(id, size);
    UI.toast('убрали из корзины');
  } else {
    Store.cartQty(id, size, next);
  }
  render();
};

/* ---------- применение промокода ---------- */
const applyPromo = (raw) => {
  const code = (raw || '').trim().toUpperCase();
  if (!code) { UI.toast('введи промокод — иначе применять нечего', 'warn'); return; }
  const pr = DATA.promos.find(x => x.code === code);
  if (!pr || !pr.active) { UI.toast('такого промокода нет — проверь раскладку и регистр', 'warn'); return; }
  const t = Store.cartTotals();
  if (t.subtotal < (pr.minSum || 0)) {
    UI.toast(`промокод действует от ${Store.money(pr.minSum)}`, 'warn');
    return;
  }
  Store.setPromo(pr.code);
  UI.toast(`промокод ${pr.code} применён — ${pr.desc}`);
  render();
};

/* ---------- события корзины ---------- */
cartRoot.addEventListener('click', (e) => {
  const row = e.target.closest('[data-line]');

  if (e.target.closest('[data-del]')) {
    Store.cartRemove(row.dataset.id, row.dataset.size);
    UI.toast('убрали из корзины');
    render();
    return;
  }
  if (e.target.closest('[data-minus]')) {
    setQty(row, (parseInt(row.querySelector('[data-qty]').value, 10) || 1) - 1);
    return;
  }
  if (e.target.closest('[data-plus]')) {
    setQty(row, (parseInt(row.querySelector('[data-qty]').value, 10) || 1) + 1);
    return;
  }
  if (e.target.closest('[data-promo-apply]')) {
    applyPromo(cartRoot.querySelector('[data-promo-input]').value);
    return;
  }
  if (e.target.closest('[data-promo-del]')) {
    Store.setPromo(null);
    UI.toast('промокод убрали');
    render();
  }
});

cartRoot.addEventListener('change', (e) => {
  const input = e.target.closest('[data-qty]');
  if (!input) return;
  const n = parseInt(input.value.trim(), 10);
  if (isNaN(n)) { render(); return; }   /* ввели чепуху — просто вернём как было */
  setQty(input.closest('[data-line]'), n);
});

cartRoot.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (e.target.closest('[data-promo-input]')) {
    e.preventDefault();
    applyPromo(e.target.value);
  }
  if (e.target.closest('[data-qty]')) {
    e.preventDefault();
    e.target.blur();
  }
});

render();
