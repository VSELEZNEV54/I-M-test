/* ============================================================
   С?М — админ-панель: товары (список, фильтры, массовые действия)
   ============================================================ */

AdminUI.mount('products', 'товары', {
  sub: 'весь каталог: базовые товары прототипа + добавленные через админку',
  actions: `
    <a class="btn btn--sm btn--lime" href="product-edit.html">+ добавить товар</a>
    <button class="btn btn--sm btn--outline" type="button" data-export-csv>экспорт csv</button>`,
});

(() => {
  const STATUS_TAG = {
    published: '<span class="tag tag--lime">опубликован</span>',
    draft: '<span class="tag">черновик</span>',
    hidden: '<span class="tag tag--dark">скрыт</span>',
  };

  const productStatus = (id) => (Store.productPatch()[id] || {}).status || 'published';
  const catName = (slug) => (DATA.categoryBySlug[slug] || {}).name || '—';

  const state = { q: '', cat: '', st: '', avail: '', sortKey: 'date', sortDir: -1 };
  const selected = new Set();

  /* ---------- фильтры ---------- */
  const catSelect = document.querySelector('[data-f-cat]');
  catSelect.innerHTML += DATA.categories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  document.querySelector('[data-search-box]').insertAdjacentHTML('afterbegin', UI.icon('search'));

  const filtered = () => {
    let list = Store.allProducts();
    const q = state.q.trim().toLowerCase();
    if (q) list = list.filter(p => (p.name + ' ' + p.sku).toLowerCase().includes(q));
    if (state.cat) list = list.filter(p => p.category === state.cat);
    if (state.st) list = list.filter(p => productStatus(p.id) === state.st);
    if (state.avail === 'in') list = list.filter(p => Store.totalStock(p) > 0);
    if (state.avail === 'out') list = list.filter(p => Store.totalStock(p) === 0);
    const dir = state.sortDir, key = state.sortKey;
    list.sort((a, b) => {
      if (key === 'name') return a.name.localeCompare(b.name, 'ru') * dir;
      if (key === 'price') return (a.price - b.price) * dir;
      if (key === 'stock') return (Store.totalStock(a) - Store.totalStock(b)) * dir;
      return (a.created || '').localeCompare(b.created || '') * dir;
    });
    return list;
  };

  const stockCell = (n) => n === 0
    ? '<span class="tag tag--dark">нет в наличии</span>'
    : n <= 5 ? `<span class="tag tag--lime">мало: ${n}</span>` : `<span class="num">${n}</span>`;

  const sortMark = (key) => state.sortKey === key ? (state.sortDir > 0 ? ' ↑' : ' ↓') : '';

  /* ---------- таблица ---------- */
  const tableEl = document.querySelector('[data-table]');
  const render = () => {
    const list = filtered();
    document.querySelector('[data-total]').textContent =
      `${list.length} ${Store.plural(list.length, 'товар', 'товара', 'товаров')}`;
    const allPicked = list.length > 0 && list.every(p => selected.has(p.id));
    tableEl.innerHTML = `
      <thead><tr>
        <th style="width:36px"><input type="checkbox" data-check-all ${allPicked ? 'checked' : ''} aria-label="выбрать всё"></th>
        <th></th>
        <th data-sort="name">название${sortMark('name')}</th>
        <th>sku</th>
        <th>категория</th>
        <th data-sort="price">цена${sortMark('price')}</th>
        <th>старая цена</th>
        <th data-sort="stock">остаток${sortMark('stock')}</th>
        <th>статус</th>
        <th data-sort="date">обновлён${sortMark('date')}</th>
      </tr></thead>
      <tbody>${list.map(p => `
        <tr>
          <td><input type="checkbox" data-pick="${p.id}" ${selected.has(p.id) ? 'checked' : ''} aria-label="выбрать ${p.name}"></td>
          <td style="width:52px"><img class="adm-thumb" src="../${p.images[0]}" alt=""></td>
          <td><a href="product-edit.html?id=${encodeURIComponent(p.id)}">${p.name}</a></td>
          <td>${p.sku}</td>
          <td>${catName(p.category)}</td>
          <td class="num">${Store.money(p.price)}</td>
          <td class="num">${p.oldPrice ? `<s class="mute">${Store.money(p.oldPrice)}</s>` : '—'}</td>
          <td>${stockCell(Store.totalStock(p))}</td>
          <td>${STATUS_TAG[productStatus(p.id)] || STATUS_TAG.published}</td>
          <td class="num">${Store.fmtDate(p.created)}</td>
        </tr>`).join('') ||
        '<tr><td colspan="10" class="mute" style="text-align:center;padding:30px">ничего не нашлось — ослабь фильтры</td></tr>'}
      </tbody>`;
    refreshBulkbar();
  };

  /* ---------- bulkbar ---------- */
  const bulkbar = document.querySelector('[data-bulkbar]');
  const refreshBulkbar = () => {
    bulkbar.classList.toggle('is-show', selected.size > 0);
    document.querySelector('[data-bulk-count]').textContent =
      `выбрано ${selected.size} ${Store.plural(selected.size, 'товар', 'товара', 'товаров')}`;
  };
  const bulkStatus = (st, msg) => {
    selected.forEach(id => Store.patchProduct(id, { status: st }));
    UI.toast(msg);
    selected.clear();
    render();
  };
  document.querySelector('[data-bulk-publish]').addEventListener('click', () => bulkStatus('published', 'опубликовано'));
  document.querySelector('[data-bulk-hide]').addEventListener('click', () => bulkStatus('hidden', 'товары скрыты'));
  document.querySelector('[data-bulk-clear]').addEventListener('click', () => { selected.clear(); render(); });
  document.querySelector('[data-bulk-delete]').addEventListener('click', () => {
    if (!confirm(`удалить выбранные товары (${selected.size} шт.)?`)) return;
    const customIds = Store.customProducts().map(p => p.id);
    let baseTouched = false;
    selected.forEach(id => {
      if (customIds.includes(id)) Store.removeCustomProduct(id);
      else { Store.patchProduct(id, { status: 'hidden' }); baseTouched = true; }
    });
    if (baseTouched) UI.toast('базовые товары прототипа скрываются, не удаляются', 'warn');
    else UI.toast('удалено');
    selected.clear();
    render();
  });

  /* ---------- клики по таблице: чекбоксы и сортировка ---------- */
  tableEl.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) {
      if (pick.checked) selected.add(pick.dataset.pick); else selected.delete(pick.dataset.pick);
      refreshBulkbar();
      return;
    }
    const all = e.target.closest('[data-check-all]');
    if (all) {
      const list = filtered();
      if (all.checked) list.forEach(p => selected.add(p.id)); else list.forEach(p => selected.delete(p.id));
      render();
      return;
    }
    const th = e.target.closest('th[data-sort]');
    if (th) {
      const key = th.dataset.sort;
      if (state.sortKey === key) state.sortDir *= -1;
      else { state.sortKey = key; state.sortDir = key === 'date' ? -1 : 1; }
      render();
    }
  });

  /* ---------- фильтры-контролы ---------- */
  document.querySelector('[data-f-q]').addEventListener('input', (e) => { state.q = e.target.value; render(); });
  catSelect.addEventListener('change', (e) => { state.cat = e.target.value; render(); });
  document.querySelector('[data-f-status]').addEventListener('change', (e) => { state.st = e.target.value; render(); });
  document.querySelector('[data-f-avail]').addEventListener('change', (e) => { state.avail = e.target.value; render(); });

  /* ---------- экспорт csv ---------- */
  document.querySelector('[data-export-csv]').addEventListener('click', () => {
    const rows = filtered().map(p => ({
      sku: p.sku,
      'название': p.name,
      'категория': catName(p.category),
      'цена': p.price,
      'старая_цена': p.oldPrice || '',
      'остаток': Store.totalStock(p),
      'статус': productStatus(p.id),
    }));
    if (!rows.length) { UI.toast('нечего выгружать — список пуст', 'warn'); return; }
    AdminUI.exportCSV('products.csv', rows);
  });

  render();
})();
