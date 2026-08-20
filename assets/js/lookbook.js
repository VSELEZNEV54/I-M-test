/* ============================================================
   С?М — логика страницы лукбуков (lookbook.html)
   ============================================================ */

UI.mount({ active: 'lookbook' });

const lbWrap = document.querySelector('[data-lb-sections]');

/* чередование форматов кадров */
const lbMods = ['lb-shot--tall', 'lb-shot--sq', 'lb-shot--mid'];

const lbSection = (lb, i) => {
  const n = lb.images.length;
  const shots = lb.images.map((src, j) => `
    <div class="lb-shot ${lbMods[j % lbMods.length]}">
      <img src="${src}" alt="лукбук «${lb.title}» — кадр ${j + 1}" loading="lazy">
    </div>`).join('');

  return `
  <section class="lb-section" id="lb-${lb.id}">
    <div class="lb-section__head">
      <span class="lb-section__num">0${i + 1}</span>
      <h2 class="lb-section__title">${lb.title}</h2>
      <span class="tag tag--lime">${lb.season}</span>
      <span class="lb-section__count">${n} ${Store.plural(n, 'кадр', 'кадра', 'кадров')}</span>
    </div>
    <div class="lb-grid">${shots}</div>
  </section>`;
};

if (lbWrap) {
  const books = DATA.lookbooks || [];
  lbWrap.innerHTML = books.length
    ? books.map(lbSection).join('')
    : `<div class="empty">
         <div class="empty__title">лукбуков пока нет</div>
         <p>съёмка нового дропа уже идёт. а пока посмотри, что лежит в каталоге.</p>
         <a class="btn btn--dark" href="catalog.html">в каталог</a>
       </div>`;
}
