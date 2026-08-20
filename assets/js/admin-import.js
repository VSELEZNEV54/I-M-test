/* ============================================================
   С?М — админ-панель: импорт товаров из csv и экспорт данных
   Разметка — в admin/import.html.
   ============================================================ */

AdminUI.mount('import', 'импорт / экспорт', {
  sub: 'загрузка каталога файлом и выгрузка того, что уже накопилось в прототипе',
  actions: '<a class="btn btn--sm btn--outline" href="products.html">к списку товаров</a>',
});

(() => {
  const TODAY = '2026-08-19';
  const IMPORT_IMAGES = [
    'assets/img/products/voidhood-1.jpg',
    'assets/img/products/inkburst-1.jpg',
    'assets/img/products/asphaltform-1.jpg',
  ];
  const STATUSES = ['published', 'draft', 'hidden'];
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const dropzone = document.querySelector('[data-dropzone]');
  const fileInput = document.querySelector('[data-file]');
  const fileName = document.querySelector('[data-file-name]');
  const csvBox = document.querySelector('[data-csv]');
  const report = document.querySelector('[data-report]');
  const previewWrap = document.querySelector('[data-preview-wrap]');
  const previewTable = document.querySelector('[data-preview]');
  const importBtn = document.querySelector('[data-import]');

  let ready = [];   // валидные строки, готовые к импорту

  /* ---------- разбор и проверка ---------- */
  const findCategory = (raw) => {
    const v = String(raw || '').trim().toLowerCase();
    if (!v) return null;
    return DATA.categories.find(c => c.slug.toLowerCase() === v || c.name.toLowerCase() === v) || null;
  };

  const parse = (text) => {
    const errors = [];
    const rows = [];
    const existing = new Set(Store.allProducts().map(p => String(p.sku).trim().toLowerCase()));
    let headerChecked = false;

    String(text || '').split(/\r?\n/).forEach((raw, i) => {
      const lineNo = i + 1;
      const line = raw.trim();
      if (!line) return;
      const cells = line.split(/[;\t]/).map(c => c.trim().replace(/^"|"$/g, '').trim());
      if (!headerChecked) {
        headerChecked = true;
        if (cells[0].toLowerCase() === 'sku') return; // строка-шапка
      }

      const sku = cells[0] || '';
      const nameCell = cells[1] || '';
      const catCell = cells[2] || '';
      const priceCell = cells[3] || '';
      const stockCell = cells[4] || '';
      const statusCell = (cells[5] || '').toLowerCase();

      let bad = false;

      if (!sku) { errors.push(`строка ${lineNo}: отсутствует sku`); bad = true; }

      const price = Number(String(priceCell).replace(/\s/g, '').replace(',', '.'));
      if (!priceCell || !isFinite(price)) { errors.push(`строка ${lineNo}: цена не число`); bad = true; }

      const cat = findCategory(catCell);
      if (!cat) { errors.push(`строка ${lineNo}: неизвестная категория «${catCell || '—'}»`); bad = true; }

      const skuKey = sku.toLowerCase();
      if (sku && existing.has(skuKey)) { errors.push(`строка ${lineNo}: sku уже существует`); bad = true; }

      if (bad) return;
      existing.add(skuKey);

      const stock = Math.max(0, Math.round(Number(String(stockCell).replace(/\s/g, '')) || 0));
      rows.push({
        line: lineNo,
        sku,
        name: nameCell || sku.toLowerCase(),
        cat: cat.slug,
        catName: cat.name,
        price: Math.round(price),
        stock,
        status: STATUSES.includes(statusCell) ? statusCell : 'published',
      });
    });

    return { errors, rows };
  };

  /* ---------- отчёт ---------- */
  const renderReport = ({ errors, rows }) => {
    ready = rows;
    report.innerHTML =
      errors.map(e => `<div class="import-error">${esc(e)}</div>`).join('') +
      (rows.length
        ? `<div class="import-ok">строк готово к импорту: ${rows.length}</div>`
        : (errors.length ? '' : '<div class="import-error">не нашли ни одной строки — вставь данные или загрузи файл</div>'));

    if (rows.length) {
      const head = rows.slice(0, 10);
      previewTable.innerHTML = `
        <thead><tr>
          <th>строка</th><th>sku</th><th>название</th><th>категория</th><th>цена</th><th>остаток</th><th>статус</th>
        </tr></thead>
        <tbody>${head.map(r => `
          <tr>
            <td class="num">${r.line}</td>
            <td>${esc(r.sku)}</td>
            <td>${esc(r.name)}</td>
            <td>${esc(r.catName)}</td>
            <td class="num">${Store.money(r.price)}</td>
            <td class="num">${r.stock}</td>
            <td>${r.status === 'published' ? '<span class="tag tag--lime">опубликован</span>' : r.status === 'draft' ? '<span class="tag">черновик</span>' : '<span class="tag tag--dark">скрыт</span>'}</td>
          </tr>`).join('')}
          ${rows.length > 10 ? `<tr><td colspan="7" class="mute" style="text-align:center">…и ещё ${rows.length - 10} ${Store.plural(rows.length - 10, 'строка', 'строки', 'строк')}</td></tr>` : ''}
        </tbody>`;
      previewWrap.hidden = false;
      importBtn.hidden = false;
      importBtn.textContent = `импортировать ${rows.length} ${Store.plural(rows.length, 'товар', 'товара', 'товаров')}`;
    } else {
      previewWrap.hidden = true;
      previewTable.innerHTML = '';
      importBtn.hidden = true;
    }
  };

  const check = () => renderReport(parse(csvBox.value));

  /* ---------- размеры из остатка ---------- */
  const sizesFor = (cat, stock) => {
    if (cat === 'aksessuary') return { uni: stock };
    const base = Math.floor(stock / 3);
    const rest = stock - base * 3;
    return { S: base + (rest > 0 ? 1 : 0), M: base + (rest > 1 ? 1 : 0), L: base };
  };

  /* ---------- импорт ---------- */
  const runImport = () => {
    if (!ready.length) return;
    const n = ready.length;
    ready.forEach((r, i) => {
      const id = r.sku.toLowerCase();
      Store.addCustomProduct({
        id,
        sku: r.sku,
        name: r.name,
        category: r.cat,
        collection: '',
        color: '',
        price: r.price,
        oldPrice: null,
        images: [IMPORT_IMAGES[i % IMPORT_IMAGES.length]],
        sizes: sizesFor(r.cat, r.stock),
        tags: [],
        pop: 40,
        created: TODAY,
        short: 'товар приехал импортом из csv — описание ещё не написано.',
        desc: 'карточка создана автоматически при импорте каталога. дополни описание, характеристики и съёмку в редакторе товара.',
        chars: { 'источник': 'импорт csv', 'дата загрузки': Store.fmtDate(TODAY) },
        related: [],
      });
      Store.patchProduct(id, { status: r.status });
    });
    UI.toast(`импортировано ${n} ${Store.plural(n, 'товар', 'товара', 'товаров')} — смотри в разделе «товары»`);
    clearAll();
  };

  const clearAll = () => {
    csvBox.value = '';
    fileInput.value = '';
    fileName.hidden = true;
    fileName.textContent = '';
    report.innerHTML = '';
    previewTable.innerHTML = '';
    previewWrap.hidden = true;
    importBtn.hidden = true;
    ready = [];
  };

  /* ---------- файл: клик, drag&drop ---------- */
  const readFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      csvBox.value = String(reader.result || '');
      fileName.hidden = false;
      fileName.textContent = `загружен файл: ${file.name} (${Math.max(1, Math.round(file.size / 1024))} кб)`;
      check();
    };
    reader.onerror = () => UI.toast('не смогли прочитать файл', 'warn');
    reader.readAsText(file, 'utf-8');
  };

  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('[data-file]')) return; // клик самого input — не зацикливаемся
    fileInput.click();
  });
  fileInput.addEventListener('change', () => readFile(fileInput.files[0]));

  ['dragenter', 'dragover'].forEach(ev => dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.classList.add('is-over');
  }));
  ['dragleave', 'dragend'].forEach(ev => dropzone.addEventListener(ev, () => dropzone.classList.remove('is-over')));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-over');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) { UI.toast('это не файл — попробуй ещё раз', 'warn'); return; }
    readFile(file);
  });

  document.querySelector('[data-check]').addEventListener('click', check);
  document.querySelector('[data-clear]').addEventListener('click', clearAll);
  importBtn.addEventListener('click', runImport);

  /* ---------- шаблон csv ---------- */
  document.querySelector('[data-template]').addEventListener('click', () => {
    AdminUI.exportCSV('template.csv', [
      { sku: 'SM-1001', 'название': 'худи overload', 'категория': 'hudi', 'цена': 7900, 'остаток': 12, 'статус': 'published' },
      { sku: 'SM-1002', 'название': 'кепка nightcall', 'категория': 'aksessuary', 'цена': 2900, 'остаток': 7, 'статус': 'draft' },
    ]);
  });

  /* ---------- экспорт ---------- */
  const productStatus = (id) => (Store.productPatch()[id] || {}).status || 'published';
  const catName = (slug) => (DATA.categoryBySlug[slug] || {}).name || '—';
  const ME = { name: 'алекс соколов' };
  const customerOf = (o) => o.customerId === 'me'
    ? ME
    : (DATA.customerById[o.customerId] || { name: (o.customer && o.customer.name) || '—' });

  document.querySelector('[data-export-products]').addEventListener('click', () => {
    const rows = Store.allProducts().map(p => ({
      sku: p.sku,
      'название': p.name,
      'категория': catName(p.category),
      'цена': p.price,
      'старая_цена': p.oldPrice || '',
      'остаток': Store.totalStock(p),
      'статус': productStatus(p.id),
    }));
    if (!rows.length) { UI.toast('товаров нет — выгружать нечего', 'warn'); return; }
    AdminUI.exportCSV('products.csv', rows);
  });

  document.querySelector('[data-export-orders]').addEventListener('click', () => {
    const rows = Store.allOrders().map(o => ({
      'номер': o.num,
      'дата': Store.fmtDateTime(o.date),
      'покупатель': customerOf(o).name,
      'сумма': o.total,
      'статус': (DATA.statusByKey[o.status] || { name: o.status }).name,
    }));
    if (!rows.length) { UI.toast('заказов нет — выгружать нечего', 'warn'); return; }
    AdminUI.exportCSV('orders.csv', rows);
  });
})();
