/* ============================================================
   С?М — Store: состояние прототипа поверх localStorage.
   Подключать после data.js. Глобальный объект `Store`.
   ============================================================ */

const Store = (() => {
  const PREFIX = 'som_';
  const read = (key, def) => {
    try { const v = localStorage.getItem(PREFIX + key); return v === null ? def : JSON.parse(v); }
    catch { return def; }
  };
  const write = (key, val) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch {}
    document.dispatchEvent(new CustomEvent('store:change', { detail: { key } }));
  };

  /* Префикс относительных путей: страницы в /admin/ живут на уровень глубже */
  const REL = /\/admin\//.test(location.pathname) ? '../' : '';
  const asset = (path) => REL + path;

  /* ---------- форматирование ---------- */
  const money = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
  const plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };
  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const fmtDateTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
           d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  /* Локальная отметка времени в формате YYYY-MM-DDTHH:MM:SS (без сдвига UTC) */
  const nowStamp = () => {
    const d = new Date();
    const p2 = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
  };

  /* ---------- товары: остатки и цены с учётом правок в админке ---------- */
  const productPatch = () => read('productPatch', {});           // {id: {price, oldPrice, stockDelta?, status}}
  const customProducts = () => read('customProducts', []);       // товары, добавленные через админку
  const patchProduct = (id, patch) => {
    const all = productPatch(); all[id] = { ...(all[id] || {}), ...patch }; write('productPatch', all);
  };
  const addCustomProduct = (p) => { const l = customProducts(); l.push(p); write('customProducts', l); };
  const removeCustomProduct = (id) => write('customProducts', customProducts().filter(p => p.id !== id));

  /* Товар с учётом правок админки */
  const getProduct = (id) => {
    const base = DATA.productById[id] || customProducts().find(p => p.id === id);
    if (!base) return null;
    const patch = productPatch()[id];
    return patch ? { ...base, ...patch, sizes: patch.sizes || base.sizes } : base;
  };
  const allProducts = () => DATA.products.concat(customProducts()).map(p => getProduct(p.id));
  const totalStock = (p) => Object.values(p.sizes || {}).reduce((s, n) => s + n, 0);
  const inStock = (p, size) => size ? (p.sizes[size] || 0) > 0 : totalStock(p) > 0;
  const discountPct = (p) => p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  /* ---------- корзина ---------- */
  const cart = () => read('cart', []);
  const cartCount = () => cart().reduce((s, i) => s + i.qty, 0);
  const cartSet = (items) => write('cart', items);
  const cartAdd = (id, size, qty = 1) => {
    const items = cart();
    const line = items.find(i => i.id === id && i.size === size);
    const p = getProduct(id);
    const max = p ? (p.sizes[size] || 0) : 99;
    if (line) line.qty = Math.min(line.qty + qty, Math.max(max, 1));
    else items.push({ id, size, qty });
    cartSet(items);
  };
  const cartRemove = (id, size) => cartSet(cart().filter(i => !(i.id === id && i.size === size)));
  const cartQty = (id, size, qty) => {
    const items = cart();
    const line = items.find(i => i.id === id && i.size === size);
    if (!line) return;
    if (qty <= 0) return cartRemove(id, size);
    line.qty = qty; cartSet(items);
  };
  const cartClear = () => cartSet([]);

  /* Применённый промокод */
  const promo = () => read('promo', null);
  const setPromo = (code) => write('promo', code);

  /* Расчёт корзины: {lines, subtotal, discount, promoCode, total, freeDeliveryFrom} */
  const cartTotals = () => {
    const lines = cart().map(i => {
      const p = getProduct(i.id);
      return p ? { ...i, product: p, sum: p.price * i.qty, avail: p.sizes[i.size] || 0 } : null;
    }).filter(Boolean);
    const subtotal = lines.reduce((s, l) => s + l.sum, 0);
    let discount = 0;
    const code = promo();
    const pr = code ? DATA.promos.find(x => x.code === code && x.active) : null;
    if (pr && subtotal >= pr.minSum) {
      const base = pr.scope
        ? lines.filter(l => l.product.collection === pr.scope).reduce((s, l) => s + l.sum, 0)
        : subtotal;
      discount = pr.type === 'percent' ? Math.round(base * pr.value / 100) : Math.min(pr.value, base);
    }
    return { lines, subtotal, discount, promoCode: pr ? pr.code : null, total: subtotal - discount };
  };

  /* ---------- избранное ---------- */
  const fav = () => read('fav', []);
  const favHas = (id) => fav().includes(id);
  const favToggle = (id) => {
    const list = fav();
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    write('fav', list);
    return i < 0; // true — добавили
  };

  /* ---------- недавно просмотренные ---------- */
  const viewed = () => read('viewed', []);
  const addViewed = (id) => {
    let list = viewed().filter(x => x !== id);
    list.unshift(id); list = list.slice(0, 8);
    write('viewed', list);
  };

  /* ---------- пользователь ---------- */
  const user = () => read('user', null); // {name, lastName, phone, email, addresses:[{id,title,city,addr}]}
  const login = (data) => write('user', {
    name: 'алекс', lastName: 'соколов', phone: '+7 (913) 245-67-01', email: 'alex@example.com',
    addresses: [
      { id: 'a1', title: 'дом', city: 'новосибирск', addr: 'ул. ленина, 12, кв. 45' },
      { id: 'a2', title: 'работа', city: 'новосибирск', addr: 'красный проспект, 82, офис 14' },
    ],
    ...data,
  });
  const logout = () => write('user', null);
  const updateUser = (patch) => { const u = user(); if (u) write('user', { ...u, ...patch }); };

  /* ---------- заказы ---------- */
  const myOrders = () => read('myOrders', []);            // созданные в этой сессии
  const orderPatch = () => read('orderPatch', {});        // правки статусов из админки {num: {status, manager, history, comment}}
  const patchOrder = (num, patch) => {
    const all = orderPatch(); all[num] = { ...(all[num] || {}), ...patch }; write('orderPatch', all);
  };
  const getOrder = (num) => {
    const base = DATA.orders.find(o => o.num === num) || myOrders().find(o => o.num === num);
    if (!base) return null;
    const patch = orderPatch()[num];
    return patch ? { ...base, ...patch } : base;
  };
  /* Все заказы (для админки): демо-база + созданные в прототипе, с правками */
  const allOrders = () => DATA.orders.concat(myOrders())
    .map(o => getOrder(o.num))
    .sort((a, b) => b.date.localeCompare(a.date));
  /* Заказы демо-пользователя (для ЛК) */
  const userOrders = () => allOrders().filter(o => o.customerId === 'me');

  const nextOrderNum = () => {
    const seq = read('orderSeq', 10245) + 1;
    write('orderSeq', seq);
    return 'С?М-' + seq;
  };
  const createOrder = ({ contact, delivery, payment, comment }) => {
    const t = cartTotals();
    const dm = DATA.deliveryMethods.find(d => d.key === delivery.method);
    const deliveryCost = dm && (dm.freeFrom && t.total >= dm.freeFrom) ? 0 : (dm ? dm.cost : 0);
    const order = {
      num: nextOrderNum(),
      date: nowStamp(),
      customerId: 'me',
      customer: contact,
      manager: null,
      items: t.lines.map(l => ({ id: l.id, size: l.size, qty: l.qty, price: l.product.price })),
      promo: t.promoCode, discount: t.discount,
      total: t.total + deliveryCost, deliveryCost,
      delivery, payment: payment.method,
      payStatus: payment.method === 'cod' ? 'при получении' : 'оплачено',
      status: 'new', comment: comment || '',
      history: [{ at: nowStamp(), by: 'система', from: null, to: 'new' }],
    };
    const list = myOrders(); list.unshift(order); write('myOrders', list);
    cartClear(); setPromo(null);
    return order;
  };
  /* Повторить заказ: доступные товары в корзину, вернуть [сколько добавлено, сколько пропущено] */
  const repeatOrder = (num) => {
    const o = getOrder(num); if (!o) return [0, 0];
    let ok = 0, skip = 0;
    o.items.forEach(i => {
      const p = getProduct(i.id);
      if (p && (p.sizes[i.size] || 0) > 0) { cartAdd(i.id, i.size, i.qty); ok++; } else skip++;
    });
    return [ok, skip];
  };

  /* ---------- cookie-баннер / подписка ---------- */
  const flag = (key) => read(key, false);
  const setFlag = (key, v = true) => write(key, v);

  /* Полный сброс демо-состояния прототипа (корзина, избранное, заказы, правки админки) */
  const resetDemo = () => {
    Object.keys(localStorage)
      .filter(k => k.indexOf(PREFIX) === 0)
      .forEach(k => localStorage.removeItem(k));
  };

  const onChange = (fn) => document.addEventListener('store:change', fn);

  return {
    REL, asset, money, plural, fmtDate, fmtDateTime, nowStamp,
    getProduct, allProducts, totalStock, inStock, discountPct,
    patchProduct, productPatch, customProducts, addCustomProduct, removeCustomProduct,
    cart, cartCount, cartAdd, cartRemove, cartQty, cartClear, cartTotals,
    promo, setPromo,
    fav, favHas, favToggle,
    viewed, addViewed,
    user, login, logout, updateUser,
    myOrders, allOrders, userOrders, getOrder, createOrder, repeatOrder, patchOrder, orderPatch,
    flag, setFlag, onChange, resetDemo,
  };
})();
