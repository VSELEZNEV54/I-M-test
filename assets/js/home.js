/* ============================================================
   С?М — логика главной страницы
   ============================================================ */

UI.mount({ active: '' });

/* бегущая строка */
document.getElementById('marquee-slot').innerHTML = UI.marquee();

/* популярное: топ-4 по популярности */
const popular = Store.allProducts().filter(p => Store.totalStock(p) > 0)
  .sort((a, b) => b.pop - a.pop).slice(0, 4);
document.querySelector('[data-popular]').innerHTML = popular.map(p => UI.productCard(p)).join('');

/* новинки: топ-4 по дате */
const fresh = Store.allProducts().sort((a, b) => b.created.localeCompare(a.created)).slice(0, 4);
document.querySelector('[data-new]').innerHTML = fresh.map(p => UI.productCard(p)).join('');

/* список коллекций с числом товаров и ховер-картинками */
const colImgs = {
  'buntari': 'assets/img/home/slide-3.jpg',
  'buntarki': 'assets/img/home/slide-1.jpg',
  'bez-yarlykov': 'assets/img/home/tile-lookbook.jpg',
  'gromche': 'assets/img/home/tile-new.jpg',
  'zapreshchenka': 'assets/img/home/tile-popular.jpg',
};
const colWrap = document.querySelector('[data-colist]');
const all = Store.allProducts();
const rows = DATA.collections.map((c, i) => {
  const count = all.filter(p => p.collection === c.slug).length;
  return `<a class="colist__item ${i === 1 ? 'is-hot' : ''}" href="catalog.html?collection=${c.slug}" data-img="${colImgs[c.slug] || ''}">
    <sup>0${i + 1}</sup>${c.name}<sub>${count}</sub></a>`;
}).join('') + `<a class="colist__item" href="catalog.html"><sup>0${DATA.collections.length + 1}</sup>весь каталог<sub>${all.length}</sub></a>`;
colWrap.innerHTML = rows;

const imgL = document.querySelector('[data-colist-img-l]');
const imgR = document.querySelector('[data-colist-img-r]');
colWrap.addEventListener('mouseover', (e) => {
  const item = e.target.closest('.colist__item');
  if (!item) return;
  const src = item.dataset.img;
  if (src) { imgL.src = src; imgR.src = src; }
  imgL.classList.add('is-show'); imgR.classList.add('is-show');
});
colWrap.addEventListener('mouseleave', () => {
  imgL.classList.remove('is-show'); imgR.classList.remove('is-show');
});

/* лукбук-слайдер: перелистывание фото по кругу */
const lookImgs = [
  'assets/img/home/slide-1.jpg', 'assets/img/home/slide-2.jpg', 'assets/img/blog/blog-5.jpg',
  'assets/img/home/circle.jpg', 'assets/img/products/nightflow-1.jpg', 'assets/img/home/slide-3.jpg',
];
let lookIdx = 0;
const drawLook = () => {
  const stage = document.querySelector('[data-look]');
  const shots = stage.querySelectorAll('.look__shot img');
  const circle = stage.querySelector('.look__circle img');
  shots.forEach((img, i) => { img.src = lookImgs[(lookIdx + i) % lookImgs.length]; });
  circle.src = lookImgs[(lookIdx + 3) % lookImgs.length];
};
document.querySelector('[data-look-next]').addEventListener('click', () => { lookIdx = (lookIdx + 1) % lookImgs.length; drawLook(); });
document.querySelector('[data-look-prev]').addEventListener('click', () => { lookIdx = (lookIdx - 1 + lookImgs.length) % lookImgs.length; drawLook(); });

/* блог: 1 большая + 3 карточки */
const arts = DATA.articles.slice(0, 4);
document.querySelector('[data-blog]').innerHTML = arts.map((a, i) => `
  <a class="bcard ${i === 0 ? 'bcard--lead' : ''}" href="article.html?id=${a.id}">
    <span class="bcard__media"><img src="${a.cover}" alt="${a.title}" loading="lazy"></span>
    <span class="bcard__meta"><span class="tag">${a.region}</span>${Store.fmtDate(a.date)}</span>
    <span class="bcard__title">${a.title}</span>
    ${i === 0 ? '<span class="bcard__more">читать подробнее →</span>' : ''}
  </a>`).join('');

/* копирование промокода */
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-copy-promo]')) {
    navigator.clipboard && navigator.clipboard.writeText('SKOLKO15');
    UI.toast('промокод SKOLKO15 скопирован');
  }
});
