/* ============================================================
   С?М — оформление заказа (checkout.html)
   три шага: контакты → доставка → оплата, сводка справа
   ============================================================ */

if (!Store.cart().length) {
  /* корзина пуста — оформлять нечего */
  location.replace('cart.html');
} else {
  UI.mount({ active: 'catalog', reloadOnLogin: true });

  const totals = Store.cartTotals();

  const formEl = document.querySelector('[data-co-form]');
  const stepsEl = document.querySelector('[data-steps]');
  const summaryEl = document.querySelector('[data-summary]');
  const deliveryBox = formEl.querySelector('[data-delivery]');
  const addrBox = formEl.querySelector('[data-addr-box]');
  const payBox = formEl.querySelector('[data-pay]');
  const authBox = formEl.querySelector('[data-co-auth]');
  const termsEl = formEl.querySelector('[data-terms]');
  const backBtn = formEl.querySelector('[data-back]');
  const nextBtn = formEl.querySelector('[data-next]');

  const PVZ = [
    'пвз «стрит», красный проспект, 82',
    'пвз «андеграунд», ленина, 46',
    'пвз «база», мира, 15',
  ];
  const PAY_SUB = {
    card: 'visa, mastercard, мир — платёж на сайте, без переходов',
    sbp: 'сканируешь qr в приложении банка — и всё',
    cod: 'наличными или картой курьеру при получении',
  };

  const view = { step: 1, delivery: 'courier', pay: 'card', addrText: '', pvz: PVZ[0] };

  const fld = (n) => formEl.querySelector(`[name="${n}"]`);
  const val = (n) => { const el = fld(n); return el ? el.value.trim() : ''; };
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- префилл из профиля ---------- */
  const me = Store.user();
  if (me) {
    ['name', 'lastName', 'phone', 'email'].forEach(k => { const el = fld(k); if (el && me[k]) el.value = me[k]; });
    if (me.addresses && me.addresses.length) view.addrText = me.addresses[0].addr;
  } else {
    authBox.hidden = false;
  }

  /* ---------- стоимость доставки ---------- */
  const deliveryCost = () => {
    const dm = DATA.deliveryMethods.find(d => d.key === view.delivery);
    if (!dm) return 0;
    return (dm.freeFrom && totals.total >= dm.freeFrom) ? 0 : dm.cost;
  };

  /* ---------- способы доставки ---------- */
  const renderDelivery = () => {
    deliveryBox.innerHTML = DATA.deliveryMethods.map(d => {
      const isFree = d.freeFrom && totals.total >= d.freeFrom;
      const sub = d.freeFrom
        ? (isFree ? `${d.days} • сумма заказа подошла — везём даром` : `${d.days} • бесплатно от ${Store.money(d.freeFrom)}`)
        : `${d.days} • по всей россии`;
      return `
      <label class="radio-tile ${view.delivery === d.key ? 'is-active' : ''}" data-dm="${d.key}">
        <input type="radio" name="delivery" value="${d.key}" ${view.delivery === d.key ? 'checked' : ''}>
        <div class="radio-tile__row">
          <span>${d.name}</span>
          <span>${isFree ? '<span class="co-free">бесплатно</span>' : Store.money(d.cost)}</span>
        </div>
        <div class="radio-tile__sub">${sub}</div>
      </label>`;
    }).join('');
  };

  /* ---------- адрес / пункт выдачи ---------- */
  const renderAddr = () => {
    const u = Store.user();
    const saved = (u && u.addresses && u.addresses.length && view.delivery !== 'pickup')
      ? `<div class="saved-addr"><span>сохранённые адреса:</span>${u.addresses.map(a =>
          `<button class="chip" type="button" data-addr="${esc(a.id)}">${esc(a.title)} — ${esc(a.addr)}</button>`).join('')}</div>`
      : '';
    if (view.delivery === 'pickup') {
      addrBox.innerHTML = `
        <label class="field" data-field="addr">
          <span>пункт выдачи *</span>
          <select name="addr">${PVZ.map(x => `<option value="${esc(x)}" ${x === view.pvz ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
          <div class="field__error">выбери пункт выдачи</div>
        </label>
        <div class="field__hint">заказ ждёт в пункте 5 дней — успеешь.</div>`;
    } else {
      addrBox.innerHTML = `
        ${saved}
        <label class="field" data-field="addr">
          <span>адрес *</span>
          <input type="text" name="addr" placeholder="улица, дом, квартира" autocomplete="street-address" value="${esc(view.addrText)}">
          <div class="field__error">без адреса заказ не доедет</div>
        </label>`;
    }
  };

  /* ---------- способы оплаты ---------- */
  const renderPay = () => {
    payBox.innerHTML = DATA.payMethods.map(p => `
      <label class="radio-tile ${view.pay === p.key ? 'is-active' : ''}" data-pm="${p.key}">
        <input type="radio" name="pay" value="${p.key}" ${view.pay === p.key ? 'checked' : ''}>
        <div class="radio-tile__row"><span>${p.name}</span></div>
        <div class="radio-tile__sub">${PAY_SUB[p.key] || ''}</div>
      </label>`).join('');
  };

  /* ---------- сводка справа ---------- */
  const renderSummary = () => {
    const dm = DATA.deliveryMethods.find(d => d.key === view.delivery);
    const cost = deliveryCost();
    summaryEl.innerHTML = `
      <div class="summary__title">ваш заказ</div>
      <div class="co-items">
        ${totals.lines.map(l => `
        <div class="co-item">
          <img src="${l.product.images[0]}" alt="${esc(l.product.name)}" loading="lazy">
          <div>
            <div class="co-item__name">${esc(l.product.name)}</div>
            <div class="co-item__meta">${l.size !== 'uni' ? `размер ${esc(l.size)} × ${l.qty}` : `${l.qty} шт`}</div>
          </div>
          <div class="co-item__sum">${Store.money(l.sum)}</div>
        </div>`).join('')}
      </div>
      <div class="summary__row"><span>подытог</span><b>${Store.money(totals.subtotal)}</b></div>
      ${totals.discount > 0
        ? `<div class="summary__row summary__row--discount"><span>скидка • ${totals.promoCode}</span><b>−${Store.money(totals.discount)}</b></div>`
        : ''}
      <div class="summary__row">
        <span>доставка${dm ? ` • ${dm.name}` : ''}</span>
        <b>${cost ? Store.money(cost) : '<span class="co-free">бесплатно</span>'}</b>
      </div>
      <div class="summary__total"><span>к оплате</span><span>${Store.money(totals.total + cost)}</span></div>
      <div class="summary__hint">
        это прототип: деньги не спишутся, а заказ появится в <a href="account.html#orders">личном кабинете</a>.
      </div>`;
  };

  /* ---------- шаги ---------- */
  const showStep = (n, scroll = true) => {
    view.step = n;
    formEl.querySelectorAll('[data-panel]').forEach(p => { p.hidden = Number(p.dataset.panel) !== n; });
    stepsEl.querySelectorAll('.steps__item').forEach(li => {
      const i = Number(li.dataset.step);
      li.classList.toggle('is-active', i === n);
      li.classList.toggle('is-done', i < n);
    });
    backBtn.textContent = n === 1 ? 'назад в корзину' : 'назад';
    nextBtn.textContent = n === 3 ? 'оплатить и оформить' : 'дальше';
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------- валидация шага ---------- */
  const validateStep = (n) => {
    const req = n === 1 ? ['name', 'lastName', 'phone', 'email'] : (n === 2 ? ['city', 'addr'] : []);
    let firstBad = null;
    req.forEach(key => {
      const el = fld(key);
      if (!el) return;
      const v = el.value.trim();
      let bad = !v;
      if (!bad && key === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (!bad && key === 'phone') bad = v.replace(/\D/g, '').length < 10;
      const label = el.closest('[data-field]');
      if (label) label.classList.toggle('field--error', bad);
      if (bad && !firstBad) firstBad = el;
    });
    if (n === 3) {
      const chk = termsEl.querySelector('input');
      termsEl.classList.toggle('check--error', !chk.checked);
      if (!chk.checked && !firstBad) firstBad = chk;
    }
    if (firstBad) {
      UI.toast(firstBad.type === 'checkbox'
        ? 'без согласия с офертой заказ не оформим'
        : 'проверь поля — что-то не заполнено или с опечаткой', 'warn');
      if (firstBad.focus) firstBad.focus();
      return false;
    }
    return true;
  };

  /* ---------- оформление ---------- */
  const submitOrder = () => {
    const order = Store.createOrder({
      contact: { name: val('name'), lastName: val('lastName'), phone: val('phone'), email: val('email') },
      delivery: { method: view.delivery, city: val('city'), addr: val('addr') },
      payment: { method: view.pay },
      comment: val('comment'),
    });
    location.href = 'order-success.html?num=' + encodeURIComponent(order.num);
  };

  const goNext = () => {
    if (!validateStep(view.step)) return;
    if (view.step < 3) { showStep(view.step + 1); return; }
    submitOrder();
  };

  /* ---------- события ---------- */
  formEl.addEventListener('submit', (e) => { e.preventDefault(); goNext(); });
  nextBtn.addEventListener('click', (e) => { e.preventDefault(); goNext(); });

  backBtn.addEventListener('click', () => {
    if (view.step === 1) { location.href = 'cart.html'; return; }
    showStep(view.step - 1);
  });

  stepsEl.addEventListener('click', (e) => {
    const li = e.target.closest('.steps__item');
    if (!li || !li.classList.contains('is-done')) return;
    showStep(Number(li.dataset.step));
  });

  formEl.addEventListener('change', (e) => {
    const el = e.target;
    if (el.name === 'delivery') {
      view.delivery = el.value;
      renderDelivery(); renderAddr(); renderSummary();
      return;
    }
    if (el.name === 'pay') { view.pay = el.value; renderPay(); renderSummary(); return; }
    if (el.name === 'addr') {
      if (view.delivery === 'pickup') view.pvz = el.value; else view.addrText = el.value;
    }
    if (el.name === 'terms') termsEl.classList.toggle('check--error', !el.checked);
    const label = el.closest('[data-field]');
    if (label && el.value.trim()) label.classList.remove('field--error');
  });

  formEl.addEventListener('input', (e) => {
    if (e.target.name === 'addr' && view.delivery !== 'pickup') view.addrText = e.target.value;
    const label = e.target.closest('[data-field]');
    if (label && e.target.value.trim()) label.classList.remove('field--error');
  });

  formEl.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-addr]');
    if (!chip) return;
    const u = Store.user();
    const a = ((u && u.addresses) || []).find(x => x.id === chip.dataset.addr);
    if (!a) return;
    view.addrText = a.addr;
    const addrEl = fld('addr');
    if (addrEl) {
      addrEl.value = a.addr;
      const label = addrEl.closest('[data-field]');
      if (label) label.classList.remove('field--error');
    }
    const cityEl = fld('city');
    if (cityEl && Array.from(cityEl.options).some(o => o.value === a.city)) cityEl.value = a.city;
    addrBox.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c === chip));
    UI.toast(`адрес «${a.title}» подставили`);
  });

  /* ---------- старт ---------- */
  renderDelivery();
  renderAddr();
  renderPay();
  renderSummary();
  showStep(1, false);
}
