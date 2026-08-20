/* ============================================================
   С?М — избранное (favorites.html)
   ============================================================ */

UI.mount({ active: '' });

const favRoot = document.querySelector('[data-fav-root]');
const favCountEl = document.querySelector('[data-fav-count]');

const favItems = () => Store.fav().map(id => Store.getProduct(id)).filter(Boolean);

const renderFav = () => {
  const items = favItems();
  const n = items.length;

  if (favCountEl) favCountEl.textContent = `${n} ${Store.plural(n, 'товар', 'товара', 'товаров')}`;

  if (!n) {
    favRoot.innerHTML = `
      <div class="empty">
        <div class="empty__title">пока пусто</div>
        <p>лайкай сердечки в каталоге — всё, что зацепило, соберётся здесь.</p>
        <a class="btn btn--dark" href="catalog.html">в каталог</a>
      </div>`;
    return;
  }

  favRoot.innerHTML = `<div class="pgrid">${items.map(p => UI.productCard(p)).join('')}</div>`;
};

/* снятое сердце убирает карточку; перерисовка не пишет в Store — цикла нет */
Store.onChange((e) => {
  if ((e.detail || {}).key !== 'fav') return;
  renderFav();
});

renderFav();
