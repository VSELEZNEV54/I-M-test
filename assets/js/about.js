/* ============================================================
   С?М — логика страницы «о бренде» (about.html)
   динамика: бегущие строки, ценности, факты, коллаж
   ============================================================ */

UI.mount({ active: 'about' });

/* ---------- бегущие строки между секциями ---------- */
const mq1 = document.querySelector('[data-mq-1]');
const mq2 = document.querySelector('[data-mq-2]');
if (mq1) mq1.innerHTML = UI.marquee();
if (mq2) mq2.innerHTML = UI.marquee('marquee--lime');

/* ---------- три ценности (DATA.shop.values) ---------- */
const valueText = {
  'решительность': 'сделать и посмотреть, что будет — быстрее, чем месяц согласовывать. если вещь страшно надеть, значит она уже работает.',
  'командность': 'десять человек, один цех и ноль иерархии. эскиз может принести любой — от закройщицы до сммщика, спорим до хрипоты, шьём вместе.',
  'насмотренность': 'сеул, париж, красный проспект — смотрим на всё и не копируем ничего. чужой тренд для нас максимум повод сделать наоборот.',
};
const valuesEl = document.querySelector('[data-ab-values]');
if (valuesEl) {
  valuesEl.innerHTML = DATA.shop.values.map((word, i) => `
    <div class="ab-value">
      <div class="ab-value__num">0${i + 1}</div>
      <div class="ab-value__word">${word}</div>
      <p>${valueText[word] || ''}</p>
    </div>`).join('');
}

/* ---------- факты в цифрах ---------- */
const factsEl = document.querySelector('[data-ab-facts]');
if (factsEl) {
  const facts = [
    { num: Store.allProducts().length, label: 'позиций в текущем дропе — и ни одной «на всякий случай»' },
    { num: DATA.collections.length, label: 'коллекций выпустили с 2024 года' },
    { num: '−30°', label: 'проверено сибирью: если носится тут — носится везде' },
    { num: 14, label: 'дней на возврат. без допросов и объяснительных' },
  ];
  factsEl.innerHTML = facts.map(f => `
    <div class="ab-fact">
      <div class="ab-fact__num">${f.num}</div>
      <div class="ab-fact__label">${f.label}</div>
    </div>`).join('');
}

/* ---------- коллаж ---------- */
const collageEl = document.querySelector('[data-ab-collage]');
if (collageEl) {
  const shots = [
    { src: 'assets/img/home/slide-2.jpg', alt: 'команда с?м на съёмке во дворе', mod: 'ab-collage__item--big' },
    { src: 'assets/img/home/face-2.jpg', alt: 'портрет модели в образе с?м', mod: 'ab-collage__item--tall' },
    { src: 'assets/img/products/streetshade-1.jpg', alt: 'вещь из дропа с?м крупным планом', mod: '' },
    { src: 'assets/img/products/frostburn-1.jpg', alt: 'зимний образ с?м', mod: '' },
    { src: 'assets/img/home/tile-lookbook.jpg', alt: 'кадр из лукбука с?м', mod: 'ab-collage__item--wide' },
    { src: 'assets/img/home/slide-3.jpg', alt: 'съёмка с?м на красном проспекте', mod: 'ab-collage__item--wide' },
  ];
  collageEl.innerHTML = shots.map(s => `
    <div class="ab-collage__item ${s.mod}">
      <img src="${s.src}" alt="${s.alt}" loading="lazy">
    </div>`).join('');
}
