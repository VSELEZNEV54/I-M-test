/* ============================================================
   С?М — админ-панель: категории каталога
   Разметка — в admin/categories.html.
   ============================================================ */

AdminUI.mount('categories', 'категории', {
  sub: 'порядок в меню, видимость, seo-тексты и вложенность',
  actions: '<a class="btn btn--sm btn--outline" href="products.html">к списку товаров</a>',
});

(() => {
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* вложенность второго уровня — только для демонстрации иерархии */
  const SUBS = {
    verhnyaya: [
      { slug: 'kurtki', name: 'куртки' },
      { slug: 'bombery', name: 'бомберы' },
      { slug: 'trenchi', name: 'тренчи' },
      { slug: 'zhilety', name: 'жилеты' },
    ],
  };

  const listBox = document.querySelector('[data-list]');
  const countBox = document.querySelector('[data-count]');

  const productsIn = (slug) => Store.allProducts().filter(p => p.category === slug).length;
  const isVisible = (slug) => !Store.flag('cat_hidden_' + slug);
  const seoOf = (slug) => Store.flag('cat_seo_' + slug) || {};

  const rowHTML = (cat, sub) => {
    const vis = isVisible(cat.slug);
    const n = sub ? 0 : productsIn(cat.slug);
    const seo = seoOf(cat.slug);
    return `
    <div data-item data-slug="${esc(cat.slug)}" ${sub ? 'data-sub' : ''} style="border-bottom:1px solid var(--line)">
      <div data-row style="display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:13px 22px 13px ${sub ? '54px' : '22px'};opacity:${vis ? '1' : '0.45'}">
        <div style="flex:1;min-width:0">
          <div style="font-weight:${sub ? '400' : '600'};font-size:${sub ? '13.5px' : '15px'}">
            ${sub ? '└ ' : ''}${esc(cat.name)}
          </div>
          <div class="small mute">slug: ${esc(cat.slug)}</div>
        </div>
        <div class="small mute" style="width:120px;text-align:right">
          ${sub ? 'подкатегория' : `${n} ${Store.plural(n, 'товар', 'товара', 'товаров')}`}
        </div>
        <label class="switch" title="показывать в каталоге">
          <input type="checkbox" data-vis ${vis ? 'checked' : ''} aria-label="показывать категорию ${esc(cat.name)} в каталоге">
          <span class="switch__track"></span>
        </label>
        <span class="small mute" data-vis-label style="width:158px">показывать в каталоге</span>
        <button class="btn btn--sm btn--ghost" type="button" data-up aria-label="выше">↑</button>
        <button class="btn btn--sm btn--ghost" type="button" data-down aria-label="ниже">↓</button>
        <button class="btn btn--sm btn--outline" type="button" data-seo>seo</button>
      </div>
      <div data-seo-box hidden style="padding:4px 22px 18px ${sub ? '54px' : '22px'};background:var(--off);border-top:1px solid var(--line)">
        <div class="grid-2" style="gap:14px">
          <label class="field" style="margin:0 0 12px"><span>seo title</span>
            <input type="text" data-seo-title value="${esc(seo.title || '')}" placeholder="${esc(cat.name)} — купить в новосибирске | с?м">
          </label>
          <label class="field" style="margin:0 0 12px"><span>seo description</span>
            <input type="text" data-seo-desc value="${esc(seo.desc || '')}" placeholder="дерзкое описание категории до 160 символов">
          </label>
        </div>
        <button class="btn btn--sm btn--dark" type="button" data-seo-save>сохранить</button>
      </div>
      ${sub ? '' : `<div data-children>${(SUBS[cat.slug] || []).map(s => rowHTML(s, true)).join('')}</div>`}
    </div>`;
  };

  const refreshCount = () => {
    const n = listBox.querySelectorAll('[data-item]:not([data-sub])').length;
    const goods = Store.allProducts().length;
    countBox.textContent = `${n} ${Store.plural(n, 'категория', 'категории', 'категорий')} • ` +
      `${goods} ${Store.plural(goods, 'товар', 'товара', 'товаров')} в каталоге`;
  };

  const render = () => {
    listBox.innerHTML = DATA.categories.map(c => rowHTML(c, false)).join('');
    refreshCount();
  };

  /* ---------- клики по списку ---------- */
  listBox.addEventListener('click', (e) => {
    const item = e.target.closest('[data-item]');
    if (!item) return;
    const slug = item.dataset.slug;

    if (e.target.closest('[data-seo]')) {
      const box = item.querySelector('[data-seo-box]');
      box.hidden = !box.hidden;
      return;
    }

    if (e.target.closest('[data-seo-save]')) {
      const box = item.querySelector('[data-seo-box]');
      Store.setFlag('cat_seo_' + slug, {
        title: box.querySelector('[data-seo-title]').value.trim(),
        desc: box.querySelector('[data-seo-desc]').value.trim(),
      });
      UI.toast('seo категории сохранено');
      box.hidden = true;
      return;
    }

    const up = e.target.closest('[data-up]');
    const down = e.target.closest('[data-down]');
    if (up || down) {
      const sibling = up ? item.previousElementSibling : item.nextElementSibling;
      if (!sibling || !sibling.hasAttribute('data-item')) {
        UI.toast('дальше двигать некуда', 'warn');
        return;
      }
      if (up) item.parentNode.insertBefore(item, sibling);
      else item.parentNode.insertBefore(sibling, item);
      UI.toast('порядок категорий обновлён');
    }
  });

  /* ---------- переключатель видимости ---------- */
  listBox.addEventListener('change', (e) => {
    const sw = e.target.closest('[data-vis]');
    if (!sw) return;
    const item = sw.closest('[data-item]');
    const slug = item.dataset.slug;
    Store.setFlag('cat_hidden_' + slug, !sw.checked);
    item.querySelector('[data-row]').style.opacity = sw.checked ? '1' : '0.45';
    UI.toast(sw.checked
      ? 'категория показывается в каталоге'
      : 'категория скрыта — в прототипе скрытие не влияет на витрину');
  });

  /* ---------- добавление категории ---------- */
  const addForm = document.querySelector('[data-add-form]');
  const nameInput = addForm.querySelector('[data-new-name]');
  const slugInput = addForm.querySelector('[data-new-slug]');
  const markErr = (key, on) => {
    const box = addForm.querySelector(`[data-req="${key}"]`);
    if (box) box.classList.toggle('field--error', on);
  };

  addForm.addEventListener('input', (e) => {
    const box = e.target.closest('[data-req]');
    if (box) box.classList.remove('field--error');
  });

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const catName = nameInput.value.trim();
    const slug = slugInput.value.trim().toLowerCase();
    const taken = Array.from(listBox.querySelectorAll('[data-item]')).some(i => i.dataset.slug === slug);

    markErr('name', !catName);
    markErr('slug', !slug || taken || !/^[a-z0-9-]+$/.test(slug));
    if (!catName || !slug || taken || !/^[a-z0-9-]+$/.test(slug)) {
      UI.toast(taken ? 'такой slug уже занят' : 'проверь имя и slug категории', 'warn');
      return;
    }

    listBox.insertAdjacentHTML('beforeend', rowHTML({ slug, name: catName }, false));
    nameInput.value = '';
    slugInput.value = '';
    refreshCount();
    UI.toast('в прототипе новая категория не появляется на витрине');
    listBox.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  render();
})();
