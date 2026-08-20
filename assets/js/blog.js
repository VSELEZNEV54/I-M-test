/* ============================================================
   С?М — логика блога (blog.html)
   чипы-фильтры по категориям + список статей
   ============================================================ */

UI.mount({ active: 'blog' });

const chipsEl = document.querySelector('[data-blog-chips]');
const listEl = document.querySelector('[data-blog-list]');

const ALL = 'все';
const blogCats = [ALL].concat(DATA.articleCategories);

/* стартовая категория можно задать через ?cat=гайды */
const blogParams = new URLSearchParams(location.search);
const startCat = blogParams.get('cat') || '';
let activeCat = blogCats.includes(startCat) ? startCat : ALL;

/* ---------- чипы ---------- */
chipsEl.innerHTML = blogCats.map(c => `
  <button class="chip ${c === activeCat ? 'is-active' : ''}" type="button" data-cat="${c}">${c}</button>`).join('');

/* ---------- карточка статьи ---------- */
const articleCard = (a, lead) => `
  <a class="acard ${lead ? 'acard--lead' : ''}" href="article.html?id=${a.id}">
    <span class="acard__media"><img src="${a.cover}" alt="${a.title}" loading="lazy"></span>
    <span class="acard__body">
      <span class="acard__meta"><span class="tag">${a.region}</span><span>${Store.fmtDate(a.date)}</span></span>
      <span class="acard__title">${a.title}</span>
      <span class="acard__excerpt">${a.excerpt}</span>
      <span class="acard__more">читать →</span>
    </span>
  </a>`;

/* ---------- список ---------- */
const renderList = () => {
  const items = DATA.articles
    .filter(a => activeCat === ALL || a.category === activeCat)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!items.length) {
    listEl.innerHTML = `
      <div class="empty">
        <div class="empty__title">тут пока тихо</div>
        <p>в этой рубрике мы ещё ничего не написали. загляни в другие — там громко.</p>
        <button class="btn btn--dark" type="button" data-cat-reset>показать все статьи</button>
      </div>`;
    return;
  }

  const lead = items[0];
  const rest = items.slice(1);
  listEl.innerHTML = articleCard(lead, true)
    + (rest.length ? `<div class="agrid">${rest.map(a => articleCard(a, false)).join('')}</div>` : '');
};

renderList();

/* ---------- клики по чипам ---------- */
chipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-cat]');
  if (!chip) return;
  activeCat = chip.dataset.cat;
  chipsEl.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c === chip));
  renderList();
});

listEl.addEventListener('click', (e) => {
  if (!e.target.closest('[data-cat-reset]')) return;
  activeCat = ALL;
  chipsEl.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c.dataset.cat === ALL));
  renderList();
});
