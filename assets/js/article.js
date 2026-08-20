/* ============================================================
   С?М — логика страницы статьи (article.html?id=…)
   ============================================================ */

UI.mount({ active: 'blog' });

const artParams = new URLSearchParams(location.search);
const artId = artParams.get('id') || '';
const art = DATA.articleById[artId];

const crumbsEl = document.querySelector('[data-crumbs]');
const artEl = document.querySelector('[data-art]');

/* ---------- карточка статьи (для блока «читать дальше») ---------- */
const relatedCard = (a) => `
  <a class="acard" href="article.html?id=${a.id}">
    <span class="acard__media"><img src="${a.cover}" alt="${a.title}" loading="lazy"></span>
    <span class="acard__body">
      <span class="acard__meta"><span class="tag">${a.region}</span><span>${Store.fmtDate(a.date)}</span></span>
      <span class="acard__title">${a.title}</span>
      <span class="acard__excerpt">${a.excerpt}</span>
      <span class="acard__more">читать →</span>
    </span>
  </a>`;

/* ---------- рендер блока тела статьи ---------- */
const blockHTML = (b) => {
  switch (b.t) {
    case 'p':
      return `<p>${b.text}</p>`;
    case 'h2':
      return `<h2>${b.text}</h2>`;
    case 'h3':
      return `<h3>${b.text}</h3>`;
    case 'ul':
      return `<ul>${(b.items || []).map(i => `<li>${i}</li>`).join('')}</ul>`;
    case 'quote':
      return `<blockquote>${b.text}</blockquote>`;
    case 'table':
      return `<table>
        <thead><tr>${(b.head || []).map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${(b.rows || []).map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
    case 'products': {
      const items = (b.ids || []).map(id => Store.getProduct(id)).filter(Boolean);
      if (!items.length) return '';
      return `<div class="art-products">
        <div class="art-products__cap">носи из этого материала:</div>
        <div class="pgrid pgrid--3">${items.map(p => UI.productCard(p)).join('')}</div>
      </div>`;
    }
    default:
      return '';
  }
};

if (!art) {
  /* ---------- статья не найдена ---------- */
  document.title = 'статья не найдена | блог с?м';
  crumbsEl.innerHTML = `
    <span><a href="index.html">главная</a></span>
    <span><a href="blog.html">блог</a></span>
    <span>статья не найдена</span>`;
  artEl.innerHTML = `
    <div class="empty">
      <div class="empty__title">статья не найдена</div>
      <p>такого материала у нас нет — возможно, ссылка устарела. в блоге лежит всё остальное.</p>
      <a class="btn btn--dark" href="blog.html">в блог</a>
    </div>`;
} else {
  /* ---------- SEO: title, description, JSON-LD ---------- */
  document.title = `${art.title} | блог с?м`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', art.excerpt);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', art.title);
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.setAttribute('content', art.cover);

  const ldScript = document.createElement('script');
  ldScript.type = 'application/ld+json';
  ldScript.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: art.title,
    description: art.excerpt,
    datePublished: art.date,
    image: art.cover,
    author: { '@type': 'Organization', name: art.author },
    publisher: { '@type': 'Organization', name: 'с?м' },
    mainEntityOfPage: location.href,
  });
  document.head.appendChild(ldScript);

  /* ---------- крошки ---------- */
  crumbsEl.innerHTML = `
    <span><a href="index.html">главная</a></span>
    <span><a href="blog.html">блог</a></span>
    <span>${art.title}</span>`;

  /* ---------- тело статьи ---------- */
  const relatedItems = (art.related || [])
    .map(id => DATA.articleById[id])
    .filter(a => a && a.id !== art.id)
    .slice(0, 2);

  artEl.innerHTML = `
    <header class="art-head">
      <div class="art-meta">
        <span class="tag tag--lime">${art.category}</span>
        <span class="tag">${art.region}</span>
        <span>${Store.fmtDate(art.date)}</span>
        <i>✳</i>
        <span>${art.author}</span>
      </div>
      <h1 class="art-title">${art.title}</h1>
    </header>

    <div class="art-cover"><img src="${art.cover}" alt="${art.title}" fetchpriority="high"></div>

    <div class="prose">${(art.blocks || []).map(blockHTML).join('')}</div>

    ${relatedItems.length ? `
    <section class="art-related">
      <div class="section-head">
        <h2 class="h2"><span class="accent">читать</span> дальше</h2>
        <a class="btn btn--dark btn--sm section-head__link" href="blog.html">читать все статьи</a>
      </div>
      <div class="agrid agrid--2">${relatedItems.map(relatedCard).join('')}</div>
    </section>` : ''}
  `;
}
