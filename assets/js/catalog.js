/* ============================================================
   С?М — каталог: фильтры, сортировка, порционная выдача
   ============================================================ */

UI.mount({ active: 'catalog' });

const PER_PAGE = 8;
const DEFAULT_H1 = 'место, где ты раскроешь настоящего себя';

const SORTS = [
  { key: 'pop', name: 'по популярности' },
  { key: 'price-asc', name: 'сначала дешёвые' },
  { key: 'price-desc', name: 'сначала дорогие' },
  { key: 'new', name: 'сначала новые' },
  { key: 'discount', name: 'по размеру скидки' },
];
const SORT_KEYS = SORTS.map(s => s.key);

/* ---------- состояние из query ---------- */
const query = new URLSearchParams(location.search);
const listParam = (key) => (query.get(key) || '').split(',').map(s => s.trim()).filter(Boolean);
const numParam = (key) => {
  const v = (query.get(key) || '').replace(/[^0-9]/g, '');
  return v ? String(Math.min(Number(v), 9999999)) : '';
};

const state = {
  cat: query.get('cat') || '',
  cats: listParam('cats'),
  collection: query.get('collection') || '',
  tag: ['new', 'sale'].includes(query.get('tag')) ? query.get('tag') : '',
  q: query.get('q') || '',
  sort: SORT_KEYS.includes(query.get('sort')) ? query.get('sort') : 'pop',
  colors: listParam('colors'),
  sizes: listParam('sizes'),
  from: numParam('from'),
  to: numParam('to'),
  instock: query.get('instock') === '1',
  sale: query.get('sale') === '1',
};
let shown = PER_PAGE;

/* ---------- узлы страницы ---------- */
const pick = (sel) => document.querySelector(sel);
const crumbsBox = pick('[data-crumbs]');
const h1Box = pick('[data-h1]');
const noteBox = pick('[data-note]');
const chipsBox = pick('[data-chips]');
const fbar = pick('[data-fbar]');
const gridBox = pick('[data-grid]');
const emptyBox = pick('[data-empty]');
const moreWrap = pick('[data-more-wrap]');
const countBox = pick('[data-count]');
const moreBtn = pick('[data-more]');
const sortLabel = pick('[data-sort-label]');
const fromInput = pick('[data-price-from]');
const toInput = pick('[data-price-to]');
const instockInput = pick('[data-f-instock]');
const saleInput = pick('[data-f-sale]');
const clearBtn = pick('.fbar__clear');
const panelOf = (key) => document.querySelector(`[data-panel="${key}"]`);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- категории: cat (одна) + cats (мультивыбор) ---------- */
const catSet = () => {
  const set = new Set(state.cats);
  if (state.cat) set.add(state.cat);
  return set;
};
const setCats = (arr) => {
  const uniq = [...new Set(arr.filter(Boolean))];
  if (uniq.length === 1) { state.cat = uniq[0]; state.cats = []; }
  else { state.cat = ''; state.cats = uniq; }
};
const soleCat = () => {
  const arr = [...catSet()];
  return arr.length === 1 ? DATA.categoryBySlug[arr[0]] : null;
};

/* ---------- синхронизация адреса ---------- */
const syncURL = () => {
  const p = new URLSearchParams();
  if (state.cat) p.set('cat', state.cat);
  if (state.cats.length) p.set('cats', state.cats.join(','));
  if (state.collection) p.set('collection', state.collection);
  if (state.tag) p.set('tag', state.tag);
  if (state.q) p.set('q', state.q);
  if (state.sort && state.sort !== 'pop') p.set('sort', state.sort);
  if (state.colors.length) p.set('colors', state.colors.join(','));
  if (state.sizes.length) p.set('sizes', state.sizes.join(','));
  if (state.from) p.set('from', state.from);
  if (state.to) p.set('to', state.to);
  if (state.instock) p.set('instock', '1');
  if (state.sale) p.set('sale', '1');
  const s = p.toString().replace(/%2C/g, ',');
  history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
};

const filtersOn = () =>
  !!(state.cat || state.cats.length || state.collection || state.tag || state.q ||
     state.colors.length || state.sizes.length || state.from || state.to ||
     state.instock || state.sale || state.sort !== 'pop');

/* ---------- отбор товаров ---------- */
const isShoppable = (p) => {
  const st = (Store.productPatch()[p.id] || {}).status || p.status || 'published';
  return st !== 'draft' && st !== 'hidden';
};

const matchQuery = (p, raw) => {
  const words = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const cat = DATA.categoryBySlug[p.category];
  const col = DATA.collectionBySlug[p.collection];
  const clr = DATA.colorBySlug[p.color];
  const hay = [p.name, p.sku, cat && cat.name, col && col.name, p.short, clr && clr.name]
    .filter(Boolean).join(' ').toLowerCase();
  return words.every(w => hay.includes(w));
};

const sortList = (list) => {
  const arr = list.slice();
  if (state.sort === 'price-asc') arr.sort((a, b) => a.price - b.price);
  else if (state.sort === 'price-desc') arr.sort((a, b) => b.price - a.price);
  else if (state.sort === 'new') arr.sort((a, b) => String(b.created || '').localeCompare(String(a.created || '')));
  else if (state.sort === 'discount') arr.sort((a, b) => Store.discountPct(b) - Store.discountPct(a) || (b.pop || 0) - (a.pop || 0));
  else arr.sort((a, b) => (b.pop || 0) - (a.pop || 0));
  return arr;
};

const collect = () => {
  const cats = catSet();
  const from = state.from ? Number(state.from) : null;
  const to = state.to ? Number(state.to) : null;
  let list = Store.allProducts().filter(isShoppable);
  if (cats.size) list = list.filter(p => cats.has(p.category));
  if (state.collection) list = list.filter(p => p.collection === state.collection);
  if (state.tag === 'new') list = list.filter(p => (p.tags || []).includes('new'));
  if (state.tag === 'sale') list = list.filter(p => !!p.oldPrice || (p.tags || []).includes('sale'));
  if (state.q) list = list.filter(p => matchQuery(p, state.q));
  if (state.colors.length) list = list.filter(p => state.colors.includes(p.color));
  if (state.sizes.length) list = list.filter(p => state.sizes.some(s => ((p.sizes || {})[s] || 0) > 0));
  if (from !== null) list = list.filter(p => p.price >= from);
  if (to !== null) list = list.filter(p => p.price <= to);
  if (state.instock) list = list.filter(p => Store.totalStock(p) > 0);
  if (state.sale) list = list.filter(p => !!p.oldPrice);
  return sortList(list);
};

/* ---------- шапка: h1, крошки, счётчик ---------- */
const renderHead = (total) => {
  const col = state.collection ? DATA.collectionBySlug[state.collection] : null;
  const cat = soleCat();
  let title = DEFAULT_H1;
  let tail = '';
  if (col) { title = col.name; tail = col.name; }
  else if (state.tag === 'new') { title = 'новый дроп'; tail = 'новинки'; }
  else if (state.tag === 'sale') { title = 'распродажа'; tail = 'акции'; }
  else if (state.q) { title = `поиск: „${state.q}“`; tail = 'поиск'; }
  else if (cat) { title = cat.name; tail = cat.name; }

  h1Box.textContent = title;
  crumbsBox.innerHTML = tail
    ? `<span><a href="index.html">главная</a></span><span><a href="catalog.html">каталог</a></span><span>${esc(tail)}</span>`
    : '<span><a href="index.html">главная</a></span><span>каталог</span>';
  noteBox.textContent = `${total} ${Store.plural(total, 'товар', 'товара', 'товаров')}`;
};

/* ---------- чипы категорий ---------- */
const renderChips = () => {
  const cats = catSet();
  chipsBox.innerHTML =
    `<button class="chip ${cats.size ? '' : 'is-active'}" type="button" data-chip="">всё</button>` +
    DATA.categories.map(c =>
      `<button class="chip ${cats.has(c.slug) ? 'is-active' : ''}" type="button" data-chip="${c.slug}">${c.name}</button>`
    ).join('');
};

/* ---------- панели фильтров ---------- */
const setNum = (key, n) => {
  const badge = document.querySelector(`[data-num="${key}"]`);
  if (!badge) return;
  badge.textContent = n;
  badge.hidden = !n;
};

const renderPanels = () => {
  const cats = catSet();
  panelOf('cat').innerHTML = DATA.categories.map(c => `
    <label class="check"><input type="checkbox" data-f-cat="${c.slug}" ${cats.has(c.slug) ? 'checked' : ''}>
      <span class="check__box"></span><span>${c.name}</span></label>`).join('');

  panelOf('color').innerHTML = DATA.colors.map(c => `
    <label class="check check--color"><input type="checkbox" data-f-color="${c.slug}" ${state.colors.includes(c.slug) ? 'checked' : ''}>
      <span class="check__box"></span><span class="color-dot" style="background:${c.hex}"></span><span>${c.name}</span></label>`).join('');

  panelOf('size').innerHTML = `<div class="size-f">` + DATA.sizes.map(s => `
    <label class="check"><input type="checkbox" data-f-size="${s}" ${state.sizes.includes(s) ? 'checked' : ''}>
      <span class="check__box"></span><span>${s}</span></label>`).join('') + `</div>`;

  panelOf('sort').innerHTML = SORTS.map(s =>
    `<button class="dd__opt ${state.sort === s.key ? 'is-active' : ''}" type="button" data-sort-opt="${s.key}">${s.name}</button>`
  ).join('');

  setNum('cat', cats.size);
  setNum('color', state.colors.length);
  setNum('size', state.sizes.length);
  setNum('price', (state.from ? 1 : 0) + (state.to ? 1 : 0));

  fromInput.value = state.from;
  toInput.value = state.to;
  instockInput.checked = state.instock;
  saleInput.checked = state.sale;
  const active = SORTS.find(s => s.key === state.sort) || SORTS[0];
  sortLabel.textContent = active.name;
  if (clearBtn) clearBtn.hidden = !filtersOn();
};

/* ---------- грид ---------- */
const renderGrid = (list) => {
  if (!list.length) {
    gridBox.innerHTML = '';
    gridBox.hidden = true;
    emptyBox.hidden = false;
    moreWrap.hidden = true;
    return;
  }
  const part = list.slice(0, shown);
  gridBox.hidden = false;
  emptyBox.hidden = true;
  gridBox.innerHTML = part.map(p => UI.productCard(p)).join('');
  countBox.textContent = `показано ${part.length} из ${list.length}`;
  moreWrap.hidden = part.length >= list.length;
};

const render = () => {
  const list = collect();
  if (shown > list.length) shown = Math.max(PER_PAGE, Math.ceil(list.length / PER_PAGE) * PER_PAGE);
  renderHead(list.length);
  renderChips();
  renderPanels();
  renderGrid(list);
};

const apply = () => { shown = PER_PAGE; syncURL(); render(); };

/* ---------- дропдауны ---------- */
const closeDD = (keep) => {
  fbar.querySelectorAll('.dd').forEach(d => { if (d !== keep) d.classList.remove('is-open'); });
};

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.fbar .dd__btn');
  if (btn) {
    const dd = btn.closest('.dd');
    const willOpen = !dd.classList.contains('is-open');
    closeDD();
    dd.classList.toggle('is-open', willOpen);
    return;
  }
  if (!e.target.closest('.fbar .dd__panel')) closeDD();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDD(); });

/* ---------- чипы ---------- */
chipsBox.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-chip]');
  if (!chip) return;
  const slug = chip.dataset.chip;
  const cats = catSet();
  if (!slug) setCats([]);
  else if (cats.has(slug) && cats.size === 1) setCats([]);
  else setCats([slug]);
  apply();
});

/* ---------- чекбоксы фильтров ---------- */
fbar.addEventListener('change', (e) => {
  const t = e.target;
  const toggle = (arr, val, on) => (on ? arr.concat([val]) : arr.filter(x => x !== val));

  if (t.matches('[data-f-cat]')) {
    const cats = catSet();
    if (t.checked) cats.add(t.dataset.fCat); else cats.delete(t.dataset.fCat);
    setCats([...cats]);
  } else if (t.matches('[data-f-color]')) {
    state.colors = toggle(state.colors, t.dataset.fColor, t.checked);
  } else if (t.matches('[data-f-size]')) {
    state.sizes = toggle(state.sizes, t.dataset.fSize, t.checked);
  } else if (t.matches('[data-f-instock]')) {
    state.instock = t.checked;
  } else if (t.matches('[data-f-sale]')) {
    state.sale = t.checked;
  } else return;

  apply();
});

/* ---------- цена ---------- */
const applyPrice = () => {
  const clean = (v) => String(v || '').replace(/[^0-9]/g, '');
  let from = clean(fromInput.value);
  let to = clean(toInput.value);
  if (from && to && Number(from) > Number(to)) { const t = from; from = to; to = t; }
  state.from = from;
  state.to = to;
  closeDD();
  apply();
};
pick('[data-price-apply]').addEventListener('click', applyPrice);
[fromInput, toInput].forEach(inp => {
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyPrice(); } });
});

/* ---------- сортировка ---------- */
fbar.addEventListener('click', (e) => {
  const opt = e.target.closest('[data-sort-opt]');
  if (!opt) return;
  state.sort = opt.dataset.sortOpt;
  closeDD();
  apply();
});

/* ---------- сброс ---------- */
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-reset]')) return;
  state.cat = ''; state.cats = []; state.collection = ''; state.tag = ''; state.q = '';
  state.colors = []; state.sizes = []; state.from = ''; state.to = '';
  state.instock = false; state.sale = false; state.sort = 'pop';
  closeDD();
  apply();
  UI.toast('фильтры сброшены — весь каталог перед тобой');
});

/* ---------- ещё 8 ---------- */
moreBtn.addEventListener('click', () => {
  shown += PER_PAGE;
  renderGrid(collect());
});

/* ---------- старт ---------- */
syncURL();
render();
