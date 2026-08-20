/* ============================================================
   С?М — экран «заказ оформлен» (order-success.html?num=…)
   ============================================================ */

UI.mount({ active: '' });

const params = new URLSearchParams(location.search);
const orderNum = (params.get('num') || '').trim();
const orderData = orderNum ? Store.getOrder(orderNum) : null;
const successEl = document.querySelector('[data-success]');

/* номер приходит из адресной строки — выводим только как текст */
const escNum = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

if (orderNum) document.title = `заказ ${orderNum} оформлен | с?м`;

/* дата: у найденного заказа своя, иначе — сегодняшняя */
const orderDate = orderData ? Store.fmtDateTime(orderData.date) : Store.fmtDateTime(Store.nowStamp());

/* трек: 4 понятных шага вместо всей цепочки статусов */
const trackSteps = ['оформлен', 'собираем', 'передан в доставку', 'доставлен'];

successEl.innerHTML = `
  <div class="success__spark">${UI.icon('spark')}</div>
  <h1 class="h-display success__title">заказ оформлен!</h1>
  ${orderNum ? `<div class="success__num">${escNum(orderNum)}</div>` : ''}
  <p class="success__sub">письмо-подтверждение уже летит на почту</p>
  <p class="success__meta small mute">${orderDate} • оплата пройдёт при подтверждении${orderData ? ` • ${Store.money(orderData.total)}` : ''}</p>

  <div class="success__track">
    <div class="small mute">что дальше</div>
    <div class="status-track">
      ${trackSteps.map((s, i) => `<div class="status-track__step ${i === 0 ? 'is-now' : ''}">${s}</div>`).join('')}
    </div>
    <p class="small mute">менеджер позвонит, если по размерам появятся вопросы. статус видно в личном кабинете.</p>
  </div>

  <div class="success__btns">
    <a class="btn btn--dark" href="account.html#orders">мои заказы</a>
    <a class="btn btn--outline" href="catalog.html">продолжить покупки</a>
  </div>`;
