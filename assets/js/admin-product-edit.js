/* ============================================================
   С?М — админ-панель: редактор товара (создание и правка)
   Разметка формы — в admin/product-edit.html.
   ============================================================ */

const editId = new URLSearchParams(location.search).get('id');
const editBase = editId ? Store.getProduct(editId) : null;
const isEdit = !!editBase;

AdminUI.mount('products', isEdit ? 'редактор товара' : 'новый товар', {
  sub: isEdit
    ? `${editBase.name} • sku ${editBase.sku} • правки видны на витрине прототипа`
    : 'заполни поля слева — карточка справа собирается на лету',
  actions: `
    ${isEdit ? `<a class="btn btn--sm btn--outline" href="../product.html?id=${encodeURIComponent(editBase.id)}" target="_blank" rel="noopener">открыть на витрине</a>` : ''}
    <a class="btn btn--sm btn--ghost" href="products.html">отмена</a>`,
});

(() => {
  const TODAY = '2026-08-19';
  const FALLBACK_IMG = 'assets/img/products/voidhood-1.jpg';
  const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
  const el = (sel) => document.querySelector(sel);

  const form = el('#pform');
  const fName = el('#f-name'), fSku = el('#f-sku'), fCat = el('#f-cat'), fCol = el('#f-col'), fColor = el('#f-color');
  const fPrice = el('#f-price'), fOld = el('#f-old'), fUni = el('#f-uni'), fStockUni = el('#f-stock-uni');
  const fShort = el('#f-short'), fDesc = el('#f-desc');
  const fSeoTitle = el('#f-seo-title'), fSeoDesc = el('#f-seo-desc'), fSlug = el('#f-slug');
  const uniBox = el('[data-sizes-uni]'), gridBox = el('[data-sizes-grid]');
  const charsBox = el('[data-chars]'), photosBox = el('[data-photos]'), previewBox = el('[data-preview]');
  const tilesBox = el('[data-status-tiles]');

  /* ---------- справочники в селекты ---------- */
  fCat.insertAdjacentHTML('beforeend',
    DATA.categories.map(c => `<option value="${c.slug}">${esc(c.name)}</option>`).join(''));
  fCol.innerHTML = '<option value="">— без коллекции —</option>' +
    DATA.collections.map(c => `<option value="${c.slug}">${esc(c.name)}</option>`).join('');
  fColor.innerHTML = '<option value="">— не указан —</option>' +
    DATA.colors.map(c => `<option value="${c.slug}">${esc(c.name)}</option>`).join('');

  /* ---------- фото: уникальные съёмки из data.js ---------- */
  const gallery = [];
  DATA.products.forEach(p => (p.images || []).forEach(src => { if (!gallery.includes(src)) gallery.push(src); }));
  let photos = [];

  const renderPhotos = () => {
    photosBox.innerHTML = gallery.map(src => {
      const i = photos.indexOf(src);
      const on = i >= 0;
      return `
      <button type="button" data-photo="${esc(src)}" title="${esc(src.split('/').pop())}"
        style="position:relative;padding:0;display:block;aspect-ratio:4/5;overflow:hidden;background:var(--off);
               border:2px solid ${on ? 'var(--ink)' : 'var(--line)'};cursor:pointer">
        <img src="../${esc(src)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;opacity:${on ? '1' : '0.72'}">
        ${on ? `<span class="tag tag--lime" style="position:absolute;left:3px;top:3px;padding:1px 6px;font-size:11px">${i === 0 ? 'главное' : i + 1}</span>` : ''}
      </button>`;
    }).join('');
  };

  photosBox.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-photo]');
    if (!btn) return;
    const src = btn.dataset.photo;
    const i = photos.indexOf(src);
    if (i >= 0) photos.splice(i, 1); else photos.push(src);
    renderPhotos();
    repaint();
  });

  /* ---------- характеристики ---------- */
  const charRow = (k, v) => `
    <div data-char-row style="display:grid;grid-template-columns:1fr 1.4fr auto;gap:10px;align-items:end;margin-bottom:10px">
      <label class="field" style="margin:0"><span>параметр</span><input type="text" data-char-k value="${esc(k)}" placeholder="состав"></label>
      <label class="field" style="margin:0"><span>значение</span><input type="text" data-char-v value="${esc(v)}" placeholder="80% хлопок, 20% полиэстер"></label>
      <button class="btn btn--sm btn--ghost" type="button" data-char-del aria-label="удалить строку">×</button>
    </div>`;

  const renderChars = (obj) => {
    const pairs = Object.entries(obj || {});
    charsBox.innerHTML =
      (pairs.length ? pairs.map(([k, v]) => charRow(k, v)).join('') : charRow('', '')) +
      '<button class="btn btn--sm btn--outline" type="button" data-char-add>+ строка</button>';
  };

  charsBox.addEventListener('click', (e) => {
    if (e.target.closest('[data-char-add]')) {
      e.target.closest('[data-char-add]').insertAdjacentHTML('beforebegin', charRow('', ''));
      return;
    }
    const del = e.target.closest('[data-char-del]');
    if (del) {
      del.closest('[data-char-row]').remove();
      if (!charsBox.querySelector('[data-char-row]')) {
        charsBox.querySelector('[data-char-add]').insertAdjacentHTML('beforebegin', charRow('', ''));
      }
      repaint();
    }
  });

  const readChars = () => {
    const out = {};
    charsBox.querySelectorAll('[data-char-row]').forEach(row => {
      const k = row.querySelector('[data-char-k]').value.trim();
      const v = row.querySelector('[data-char-v]').value.trim();
      if (k && v) out[k] = v;   // пустые строки в карточку товара не попадают
    });
    return out;
  };

  /* ---------- размеры: аксессуар или сетка ---------- */
  const syncSizesUI = () => {
    uniBox.hidden = !fUni.checked;
    gridBox.style.display = fUni.checked ? 'none' : 'grid';
  };

  const readSizes = () => {
    if (fUni.checked) return { uni: Math.max(0, Math.round(num(fStockUni.value))) };
    const out = {};
    SIZES.forEach(s => { out[s] = Math.max(0, Math.round(num(el('#f-s-' + s).value))); });
    return out;
  };

  const readTags = () => Array.from(form.querySelectorAll('[data-tag]'))
    .filter(c => c.checked).map(c => c.dataset.tag);

  const readStatus = () => (form.querySelector('input[name="pstatus"]:checked') || {}).value || 'published';

  /* ---------- сбор товара из формы ---------- */
  const collect = () => ({
    id: isEdit ? editBase.id : (fSlug.value.trim() || fSku.value.trim() || 'new').toLowerCase(),
    sku: fSku.value.trim(),
    name: fName.value.trim(),
    category: fCat.value,
    collection: fCol.value,
    color: fColor.value,
    price: Math.max(0, Math.round(num(fPrice.value))),
    oldPrice: num(fOld.value) > 0 ? Math.round(num(fOld.value)) : null,
    images: photos.length ? photos.slice() : [FALLBACK_IMG],
    sizes: readSizes(),
    tags: readTags(),
    pop: isEdit ? (editBase.pop || 50) : 50,
    created: isEdit ? (editBase.created || TODAY) : TODAY,
    short: fShort.value.trim(),
    desc: fDesc.value.trim(),
    chars: readChars(),
    related: isEdit ? (editBase.related || []) : [],
    status: readStatus(),
    seoTitle: fSeoTitle.value.trim(),
    seoDesc: fSeoDesc.value.trim(),
    slug: fSlug.value.trim(),
  });

  /* ---------- живое превью ---------- */
  const repaint = () => {
    const p = collect();
    previewBox.innerHTML = UI.productCard({
      ...p,
      id: p.id || 'preview',
      name: p.name || 'название товара',
      price: p.price || 0,
    });
  };

  /* ---------- заполнение формы (режим правки) ---------- */
  const fill = (p) => {
    fName.value = p.name || '';
    fSku.value = p.sku || '';
    fCat.value = p.category || '';
    fCol.value = p.collection || '';
    fColor.value = p.color || '';
    fPrice.value = p.price != null ? p.price : '';
    fOld.value = p.oldPrice || '';
    fShort.value = p.short || '';
    fDesc.value = p.desc || '';
    fSeoTitle.value = p.seoTitle || `купить ${p.name} — с?м, новосибирск`;
    fSeoDesc.value = p.seoDesc || p.short || '';
    fSlug.value = p.slug || p.id || '';

    const sizes = p.sizes || {};
    fUni.checked = Object.keys(sizes).length === 1 && sizes.uni != null;
    if (fUni.checked) fStockUni.value = sizes.uni || 0;
    else SIZES.forEach(s => { el('#f-s-' + s).value = sizes[s] || 0; });
    syncSizesUI();

    form.querySelectorAll('[data-tag]').forEach(c => { c.checked = (p.tags || []).includes(c.dataset.tag); });

    const st = (Store.productPatch()[p.id] || {}).status || p.status || 'published';
    const radio = form.querySelector(`input[name="pstatus"][value="${st}"]`);
    if (radio) radio.checked = true;

    photos = (p.images || []).slice();
    photos.forEach(src => { if (!gallery.includes(src)) gallery.push(src); });
    renderChars(p.chars);
  };

  const syncTiles = () => {
    tilesBox.querySelectorAll('.radio-tile').forEach(t => {
      t.classList.toggle('is-active', t.querySelector('input').checked);
    });
  };

  /* ---------- валидация ---------- */
  const markErr = (key, on) => {
    const box = form.querySelector(`[data-req="${key}"]`);
    if (box) box.classList.toggle('field--error', on);
  };

  const validate = () => {
    const p = collect();
    const bad = [];
    const sku = p.sku.toLowerCase();
    const dupe = !isEdit && Store.allProducts().some(x => String(x.sku).toLowerCase() === sku);

    markErr('name', !p.name); if (!p.name) bad.push('название');
    markErr('sku', !p.sku || dupe); if (!p.sku) bad.push('sku');
    markErr('cat', !p.category); if (!p.category) bad.push('категория');
    markErr('price', !(p.price > 0)); if (!(p.price > 0)) bad.push('цена');

    if (dupe) { UI.toast('товар с таким sku уже есть в каталоге', 'warn'); return null; }
    if (bad.length) { UI.toast('заполни обязательные поля: ' + bad.join(', '), 'warn'); return null; }
    return p;
  };

  /* ---------- сохранение ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = validate();
    if (!p) {
      const firstErr = form.querySelector('.field--error input, .field--error select');
      if (firstErr) firstErr.focus();
      return;
    }
    if (isEdit) {
      Store.patchProduct(editBase.id, {
        name: p.name, sku: p.sku, category: p.category, collection: p.collection, color: p.color,
        price: p.price, oldPrice: p.oldPrice, images: p.images, sizes: p.sizes, tags: p.tags,
        short: p.short, desc: p.desc, chars: p.chars, status: p.status,
        seoTitle: p.seoTitle, seoDesc: p.seoDesc, slug: p.slug,
      });
      UI.toast('сохранено');
      repaint();
      return;
    }
    let id = (p.slug || p.sku).toLowerCase().replace(/[^a-z0-9а-яё-]+/gi, '-').replace(/^-+|-+$/g, '') || 'tovar';
    if (Store.getProduct(id)) { let n = 2; while (Store.getProduct(id + '-' + n)) n++; id = id + '-' + n; }
    Store.addCustomProduct({
      id, sku: p.sku, name: p.name, category: p.category, collection: p.collection, color: p.color,
      price: p.price, oldPrice: p.oldPrice, images: p.images, sizes: p.sizes, tags: p.tags,
      pop: 50, created: TODAY, short: p.short, desc: p.desc, chars: p.chars, related: [],
    });
    Store.patchProduct(id, { status: p.status });
    UI.toast('товар добавлен в каталог');
    location = 'products.html';
  });

  /* ---------- реакция на любые изменения ---------- */
  form.addEventListener('input', repaint);
  form.addEventListener('change', (e) => {
    if (e.target === fUni) syncSizesUI();
    if (e.target.name === 'pstatus') syncTiles();
    repaint();
  });
  form.querySelectorAll('[data-req]').forEach(box => {
    box.addEventListener('input', () => box.classList.remove('field--error'));
  });

  /* кнопка «отмена» рядом с сохранением */
  const saveBtn = form.querySelector('[data-save]');
  if (saveBtn) saveBtn.insertAdjacentHTML('afterend',
    '<a class="btn btn--outline btn--block mt-20" href="products.html">отмена</a>');

  /* ---------- старт ---------- */
  if (editId && !editBase) UI.toast('товар не найден — открыли форму нового', 'warn');
  if (isEdit) fill(editBase);
  else {
    renderChars({ 'состав': '', 'плотность': '', 'посадка': '', 'уход': '' });
    photos = [gallery[0]];
  }
  syncSizesUI();
  syncTiles();
  renderPhotos();
  repaint();
})();
