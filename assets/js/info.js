/* ============================================================
   с?м — общая логика информационных страниц
   (delivery / returns / contacts / privacy / terms)
   ============================================================ */

UI.mount({ active: '' });

/* таблица способов доставки (delivery.html) */
const deliveryRows = document.querySelector('[data-delivery-rows]');
if (deliveryRows) {
  deliveryRows.innerHTML = DATA.deliveryMethods.map(m => `
    <tr>
      <td><b>${m.name}</b></td>
      <td>${m.days}</td>
      <td>${Store.money(m.cost)}</td>
      <td>${m.freeFrom ? 'от ' + Store.money(m.freeFrom) : '—'}</td>
    </tr>`).join('');
}

/* аккордеоны .acc — открыт максимум один пункт в блоке */
document.querySelectorAll('.acc').forEach(acc => {
  acc.addEventListener('click', e => {
    const head = e.target.closest('.acc__head');
    if (!head) return;
    const item = head.closest('.acc__item');
    const wasOpen = item.classList.contains('is-open');
    acc.querySelectorAll('.acc__item.is-open').forEach(el => el.classList.remove('is-open'));
    if (!wasOpen) item.classList.add('is-open');
  });
});

/* фейковые формы: preventDefault + тост */
document.querySelectorAll('[data-fake-form]').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    UI.toast(form.dataset.toast || 'отправлено. мы на связи!');
    form.reset();
  });
});
