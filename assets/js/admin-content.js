/* ============================================================
   С?М — админ-панель: блог и страницы сайта
   ============================================================ */

AdminUI.mount('content', 'блог и страницы', {
  sub: 'материалы блога и статические страницы витрины',
});

(() => {
  /* ---------- статьи ---------- */
  const articlesEl = document.querySelector('[data-articles]');

  const firstParagraph = (a) => {
    const block = (a.blocks || []).find(b => b.t === 'p');
    return block ? block.text : '';
  };

  const renderArticles = () => {
    const rows = DATA.articles.map(a => `<tr>
      <td><b>${a.title}</b><div class="small mute">${a.excerpt}</div></td>
      <td>${a.category}</td>
      <td class="num">${Store.fmtDate(a.date)}</td>
      <td><span class="tag tag--lime">опубликована</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn--sm btn--outline" type="button" data-edit="${a.id}">редактировать</button>
        <a class="btn btn--sm btn--ghost" style="text-decoration:none" href="../article.html?id=${a.id}">открыть</a>
      </td>
    </tr>`).join('');

    articlesEl.innerHTML = `
      <thead><tr><th>заголовок</th><th>категория</th><th>дата</th><th>статус</th><th></th></tr></thead>
      <tbody>${rows}</tbody>`;
  };

  /* ---------- страницы сайта ---------- */
  const PAGES = [
    { name: 'главная', href: '../index.html' },
    { name: 'о бренде', href: '../about.html' },
    { name: 'доставка и оплата', href: '../delivery.html' },
    { name: 'обмен и возврат', href: '../returns.html' },
    { name: 'контакты', href: '../contacts.html' },
    { name: 'политика конфиденциальности', href: '../privacy.html' },
    { name: 'договор оферты', href: '../terms.html' },
  ];

  const renderPages = () => {
    const rows = PAGES.map(p => `<tr>
      <td><b>${p.name}</b></td>
      <td class="mute">${p.href.replace('../', '')}</td>
      <td style="white-space:nowrap;text-align:right">
        <a class="btn btn--sm btn--ghost" style="text-decoration:none" href="${p.href}">открыть</a>
        <button class="btn btn--sm btn--outline" type="button" data-edit-page="${p.name}">редактировать</button>
      </td>
    </tr>`).join('');

    document.querySelector('[data-pages]').innerHTML = `
      <thead><tr><th>страница</th><th>адрес</th><th></th></tr></thead>
      <tbody>${rows}</tbody>`;
  };

  /* ---------- модалка редактирования ---------- */
  const modalEl = document.querySelector('[data-modal]');
  const titleEl = document.querySelector('[data-modal-title]');
  const formEl = document.querySelector('[data-article-form]');
  const fTitle = formEl.querySelector('[data-a-title]');
  const fCat = formEl.querySelector('[data-a-cat]');
  const fDate = formEl.querySelector('[data-a-date]');
  const fExcerpt = formEl.querySelector('[data-a-excerpt]');
  const fBody = formEl.querySelector('[data-a-body]');

  modalEl.querySelector('.modal__close').innerHTML = UI.icon('close');
  fCat.innerHTML = DATA.articleCategories.map(c => `<option value="${c}">${c}</option>`).join('');

  const openModal = (a) => {
    titleEl.textContent = a ? 'редактировать статью' : 'новая статья';
    fTitle.value = a ? a.title : '';
    fCat.value = a ? a.category : DATA.articleCategories[0];
    fDate.value = a ? a.date : '2026-08-19';
    fExcerpt.value = a ? a.excerpt : '';
    fBody.value = a ? firstParagraph(a) : '';
    modalEl.hidden = false;
    document.body.classList.add('no-scroll');
    fTitle.focus();
  };
  const closeModal = () => {
    modalEl.hidden = true;
    document.body.classList.remove('no-scroll');
  };

  articlesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-edit]');
    if (!btn) return;
    openModal(DATA.articleById[btn.dataset.edit]);
  });

  document.querySelector('[data-new-article]').addEventListener('click', () => openModal(null));

  modalEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-modal-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalEl.hidden) closeModal();
  });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    closeModal();
    UI.toast('сохранено в прототипе');
  });

  /* ---------- редактирование статических страниц ---------- */
  document.querySelector('[data-pages]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-edit-page]');
    if (!btn) return;
    UI.toast('визуальный редактор доступен в полной версии', 'warn');
  });

  /* ---------- старт ---------- */
  renderArticles();
  renderPages();
})();
