/* ============================================================
   С?М — админ-панель: общий каркас (сайдбар, шапка страницы).
   Подключать после data.js, store.js, ui.js (для UI.toast/icon).
   Страница вызывает AdminUI.mount('orders', 'заказы', {sub, actions}).
   ============================================================ */

const AdminUI = (() => {
  const R = Store.REL; // '../' на страницах /admin/

  const NAV = [
    { group: 'обзор', items: [
      { key: 'dashboard', name: 'dashboard', href: 'index.html', icon: 'spark' },
    ]},
    { group: 'продажи', items: [
      { key: 'orders', name: 'заказы', href: 'orders.html', icon: 'box' },
      { key: 'customers', name: 'клиенты', href: 'customers.html', icon: 'user' },
    ]},
    { group: 'каталог', items: [
      { key: 'products', name: 'товары', href: 'products.html', icon: 'bag' },
      { key: 'import', name: 'импорт / экспорт', href: 'import.html', icon: 'copy' },
      { key: 'categories', name: 'категории', href: 'categories.html', icon: 'filter' },
    ]},
    { group: 'маркетинг', items: [
      { key: 'marketing', name: 'промокоды и акции', href: 'marketing.html', icon: 'star' },
    ]},
    { group: 'контент', items: [
      { key: 'content', name: 'блог и страницы', href: 'content.html', icon: 'copy' },
    ]},
    { group: 'система', items: [
      { key: 'settings', name: 'настройки', href: 'settings.html', icon: 'filter' },
    ]},
  ];

  const sidebar = (active) => `
  <aside class="adm-side">
    <a class="logo" href="${R}index.html" aria-label="с?м — на главную"><svg class="logo__mark" viewBox="0 0 532 185" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M479.311 35.9961H532V156.549H503.218V60.3478H498.112L448.208 156.549H415.712L365.576 60.3478H360.47V156.549H331.92V35.9961H384.609L432.192 127.375L479.311 35.9961Z" fill="currentColor"/><path d="M157.604 106.399C156.675 109.051 155.515 111.703 154.122 113.873C148.551 123.035 138.571 129.063 127.429 129.063H58.0279C40.6195 129.063 26.2286 114.355 26.2286 96.0314C26.2286 77.7074 40.6195 63.241 58.0279 63.241H127.429C137.642 63.241 146.695 68.3043 152.497 76.0196C153.89 77.9485 155.051 79.8773 155.979 82.0473H183.832C182.208 75.0552 179.422 68.5454 175.709 62.9999C165.264 46.6047 147.623 35.9961 127.429 35.9961H58.0279C25.9965 35.9961 0 62.9999 0 96.2725C0 129.545 25.9965 156.549 58.0279 156.549H127.429C148.319 156.549 166.656 145.217 176.869 127.857C180.815 121.348 183.368 114.114 184.761 106.399H157.604Z" fill="currentColor"/><path d="M304.298 128.34H288.05C280.623 128.34 274.588 134.609 274.588 142.324C274.588 150.039 280.623 156.308 288.05 156.308H304.298C311.726 156.308 317.761 150.039 317.761 142.324C317.761 134.609 311.726 128.34 304.298 128.34ZM304.995 151.968H286.89C282.248 151.968 278.766 147.628 278.766 142.324C278.766 137.02 282.48 132.68 286.89 132.68H304.995C309.637 132.68 313.118 137.02 313.118 142.324C313.351 147.628 309.637 151.968 304.995 151.968Z" fill="currentColor"/><path d="M305.691 140.156C305.691 137.263 303.37 134.852 300.585 134.852H289.907H288.979H286.426V149.559H289.907V145.46H298.96L301.745 149.559H305.691L302.674 144.978C304.53 144.255 305.691 142.326 305.691 140.156ZM289.907 138.227H300.585C301.513 138.227 302.441 139.191 302.441 140.156C302.441 141.12 301.513 142.085 300.585 142.085H289.907V138.227Z" fill="currentColor"/><path d="M294.55 90.2454L198.688 148.111V115.32L280.855 65.6526C290.14 60.1072 293.157 47.5697 287.818 38.1666C282.48 28.5224 270.41 25.388 261.358 30.9334L198.92 68.787V35.9966L247.663 6.58174C269.946 -6.92018 298.496 1.03631 311.494 24.1825C324.492 47.0875 316.832 76.7435 294.55 90.2454ZM198.92 156.308V185H232.112V156.308H198.92Z" fill="currentColor"/></svg></a>
    <span class="adm-side__badge">админ-панель • прототип</span>
    ${NAV.map(g => `
      <div class="adm-side__group">
        <div class="adm-side__label">${g.group}</div>
        ${g.items.map(i => `<a href="${i.href}" class="${i.key === active ? 'is-active' : ''}">${UI.icon(i.icon)}${i.name}</a>`).join('')}
      </div>`).join('')}
    <div class="adm-side__foot">
      <div class="adm-user"><span class="adm-user__ava">а</span> анна — администратор</div>
      <a href="${R}index.html">← вернуться в магазин</a>
      <a href="#" data-reset-demo>↺ сбросить демо-данные</a>
    </div>
  </aside>`;

  /* Сброс демо-состояния прототипа — удобно перед показом клиенту */
  const bindReset = () => {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-reset-demo]');
      if (!btn) return;
      e.preventDefault();
      if (!confirm('сбросить демо-данные прототипа?\n\nкорзина, избранное, созданные заказы и правки каталога вернутся в исходное состояние.')) return;
      Store.resetDemo();
      location.reload();
    });
  };

  const mount = (active, title, opts = {}) => {
    document.body.classList.add('admin');
    const root = document.getElementById('adm-root');
    const main = document.getElementById('adm-main');
    if (root && !root.querySelector('.adm-side')) {
      root.insertAdjacentHTML('afterbegin', sidebar(active));
    }
    if (main) {
      main.insertAdjacentHTML('afterbegin', `
        <div class="adm-top">
          <div>
            <div class="adm-top__title">${title}</div>
            ${opts.sub ? `<div class="adm-top__sub">${opts.sub}</div>` : ''}
          </div>
          <div class="adm-top__actions">${opts.actions || ''}</div>
        </div>`);
    }
    bindReset();
  };

  /* CSV-экспорт: массив объектов -> скачивание файла */
  const exportCSV = (filename, rows) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const csv = '﻿' + [keys.join(';')].concat(rows.map(r => keys.map(k => esc(r[k])).join(';'))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    UI.toast('файл выгружен: ' + filename);
  };

  return { mount, exportCSV, NAV };
})();
