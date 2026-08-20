# С?М — бриф для сборки страниц прототипа

Кликабельный прототип интернет-магазина стритвир-бренда «с?м» («сколько можно?», Новосибирск).
Чистая статика для GitHub Pages: HTML + CSS + vanilla JS, никаких сборщиков и внешних библиотек.
Все данные — в `assets/js/data.js` (глобал `DATA`), состояние — `assets/js/store.js` (глобал `Store`, localStorage), общий хром — `assets/js/ui.js` (глобал `UI`), каркас админки — `assets/js/admin-ui.js` (глобал `AdminUI`).

## Тон и стиль
- ВСЁ строчными буквами (кроме промокодов и SKU). Тон дерзкий, короткий, без канцелярита: «возврат без допросов», «запретите себе запрещать!».
- Брутальный стритвир: белый фон, чёрная типографика, кислотный лайм `#c6db1f` (--lime), слива `#83517b` (--plum). Прямые углы, никаких border-radius (кроме круглых кнопок-иконок).
- Шрифт один на весь проект: **Manrope** (Google Fonts, веса 300–800; 900 не существует — не используй). Акцидентные заголовки — класс `.h-display` (Manrope 800), текст — Manrope 400/500.
- Деньги: только через `Store.money(n)` → «7 300 ₽». Даты: `Store.fmtDate`/`Store.fmtDateTime`.

## Обязательный шаблон страницы (пользовательская часть, корень сайта)
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>…точный title под SEO… | с?м</title>
  <meta name="description" content="…">
  <link rel="canonical" href="https://example.github.io/som-store/ИМЯ.html">
  <meta property="og:title" content="…"><meta property="og:type" content="website"><meta property="og:image" content="assets/img/…">
  <link rel="icon" type="image/svg+xml" href="assets/img/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/main.css">
  <link rel="stylesheet" href="assets/css/СВОЯ-СТРАНИЦА.css"><!-- если нужны свои стили -->
</head>
<body>
  <div id="chrome-top"></div>
  …контент…
  <div id="chrome-footer"></div>
  <script src="assets/js/data.js"></script>
  <script src="assets/js/store.js"></script>
  <script src="assets/js/ui.js"></script>
  <script src="assets/js/СВОЯ-СТРАНИЦА.js"></script>
</body>
</html>
```
Первая строка своего JS: `UI.mount({ active: 'catalog' })` — active подсвечивает пункт меню: `about|catalog|new|sale|lookbook|blog` или `''`.

## Шаблон страницы админки (папка /admin/, пути с ../)
Смотри эталон `admin/index.html` + `assets/js/admin-dashboard.js`. Каркас:
```html
<body class="admin">
  <div class="adm" id="adm-root">
    <main class="adm__main" id="adm-main"> …контент… </main>
  </div>
  <script src="../assets/js/data.js"></script>
  <script src="../assets/js/store.js"></script>
  <script src="../assets/js/ui.js"></script>
  <script src="../assets/js/admin-ui.js"></script>
  <script src="../assets/js/СВОЙ.js"></script>
</body>
```
Первая строка JS: `AdminUI.mount('orders', 'заказы', { sub: 'подзаголовок', actions: '<a class="btn btn--sm" …>' })`.
Ключи меню: `dashboard|orders|customers|products|import|categories|marketing|content|settings`.
В `<head>` админ-страниц: `<meta name="robots" content="noindex">`, стили `../assets/css/main.css` + `../assets/css/admin.css`.

## ЖЕЛЕЗНЫЕ ПРАВИЛА
1. **Пути только относительные.** Корень: `assets/…`, `catalog.html`. Админка: `../assets/…`, соседние `orders.html`. Никаких путей с ведущим `/`.
2. **Картинки товаров в DATA лежат как `assets/img/products/x.jpg`** (без префикса). В корневых страницах вставляй как есть; в JS админки добавляй `../`: `src="../${p.images[0]}"`.
3. **Не редактируй общие файлы**: main.css, admin.css, data.js, store.js, ui.js, admin-ui.js, index.html, home.*, admin/index.html, admin-dashboard.js. Свои стили — в свой css-файл, свою логику — в свой js-файл. Не трогай файлы других страниц.
4. **Не объявляй топ-левел `const/let` с именами браузерных глобалов**: `top, name, status, history, length, parent, self, origin, close, open, event, screen` — будет SyntaxError/баги. Используй `pageTop`, `orderStatus` и т.п.
5. Товар бери через `Store.getProduct(id)` / `Store.allProducts()` (учитывают правки из админки), а не напрямую из DATA.products.
6. Проверь себя: `node --check assets/js/твой.js` и `curl -s http://localhost:8899/твоя-страница.html | head -5` (сервер уже запущен). Браузер не открывай.
7. В карточках товара используй `UI.productCard(p)` — клики (избранное/в корзину) уже обрабатываются `UI.mount()`.
8. Каждая страница пользовательской части: хлебные крошки `.breadcrumbs` под шапкой (кроме главной), заголовок `h1` (класс `.h1` или `.h-display`), SEO title/description.
9. **Отступы контейнера.** Ширина и боковые поля живут в `.container` (`--pad: clamp(16px, 3.2vw, 72px)` — тянутся за экраном). Если секции нужен свой вертикальный отступ, пиши `padding-block: 64px`, а НЕ `padding: 64px 0` — шорткат сбивает боковые поля, и контент липнет к краям экрана. Полноширинные блоки (герой, плитки, бегущая строка) просто не оборачивай в `.container`.
10. GitHub Pages: никакого fetch/XHR к своим файлам — все данные уже в DATA. Query-параметры (`?id=…`) читай через `new URLSearchParams(location.search)`.

## API шпаргалка
`DATA`: shop, categories[{slug,name}], collections, colors[{slug,name,hex}], sizes, products[18], articles[6] (blocks: p|h2|h3|ul|table|quote|products), promos, actions, offers, orderStatuses[{key,name,step}] (step -1 = вне цепочки), deliveryMethods[{key,name,cost,freeFrom,days}], payMethods, customers, orders (демо-база), notifyTemplates, lookbooks; индексы: productById, categoryBySlug, collectionBySlug, colorBySlug, statusByKey, articleById, customerById.

`Store`: REL, asset(p), money, plural(n,'товар','товара','товаров'), fmtDate, fmtDateTime,
getProduct(id), allProducts(), totalStock(p), inStock(p,size?), discountPct(p),
patchProduct(id,patch), customProducts(), addCustomProduct(p), removeCustomProduct(id),
cart(), cartCount(), cartAdd(id,size,qty), cartRemove(id,size), cartQty(id,size,qty), cartClear(), cartTotals()→{lines:[{id,size,qty,product,sum,avail}],subtotal,discount,promoCode,total},
promo(), setPromo(code|null),
fav(), favHas(id), favToggle(id)→bool,
viewed(), addViewed(id),
user()→null|{name,lastName,phone,email,addresses[]}, login(patch?), logout(), updateUser(patch),
myOrders(), allOrders(), userOrders(), getOrder(num), createOrder({contact,delivery:{method,city,addr},payment:{method},comment})→order, repeatOrder(num)→[ok,skip], patchOrder(num,patch), orderPatch(),
flag(k), setFlag(k,v), onChange(fn).

`UI`: mount(opts), icon(name), logo() — фирменный знак с?м® инлайн-svg (наследует color), toast(text, 'warn'?), productCard(p), quickAdd(id), marquee('marquee--lime'?), searchProducts(q).
Логотипы: `assets/img/brand/logo-full-dark.svg` и `logo-full-white.svg` — полный лок-ап «сколько? можно®» для крупных блоков.
Иконки: search, heart, heartFill, bag, user, plus, minus, close, arrowRight, arrowLeft, arrowDown, chevron, check, filter, trash, pin, star, spark, copy, box.
Открыть модалку входа: кнопка с атрибутом `data-open-auth`. После входа диспатчится событие `auth:login` (и есть opts.reloadOnLogin у mount).

`AdminUI`: mount(key,title,{sub,actions}), exportCSV(filename, rowsArray).

## Классы CSS (main.css) — используй их, не изобретай заново
Контейнер `.container`; кнопки `.btn` + `--dark|--lime|--plum|--outline|--ghost|--sm|--block`; `.linklike`;
чипы `.chips>.chip(.is-active)`; дропдаун `.dd(.is-open)>.dd__btn+.dd__panel`;
поля `.field>span+input|select|textarea`, `.field__hint`, `.field--error>.field__error`; чекбокс `.check>input+.check__box+span`; радио-плитка `.radio-tile(.is-active)>.radio-tile__row+.radio-tile__sub`;
карточка товара `.pcard` (генерит UI.productCard), сетка `.pgrid` (4 кол → адаптив) и `.pgrid--3`;
секции `.section(.—tight)`, шапка секции `.section-head>.h2+.section-head__link` (акцентное слово в h2: `<span class="accent">слово</span>`);
крошки `.breadcrumbs>span>a`; количество `.qty>button+input+button`; модалка `.modal>.modal__backdrop+.modal__panel(.modal__close,.modal__title)`; табы `.tabs>.tabs__tab(.is-active)`;
статус `.status-pill.status-pill--{key}`; прогресс `.status-track>.status-track__step(.is-done|.is-now)`;
таблица `.table` в `.table-wrap`; аккордеон `.acc>.acc__item(.is-open)>.acc__head+.acc__body`;
текстовые страницы `.prose` (h2, ul, table, blockquote готовы); пустое состояние `.empty>.empty__title+p+.btn`;
бегущая строка `UI.marquee()`; теги `.tag(--lime|--dark)`; утилиты `.grid-2, .mt-20/40/60, .mb-20/40, .small, .mute, .accent, .accent--plum, .h1 .h2 .h3 .h-display`.

Админка (admin.css): `.stats>.stat(--lime|--dark)`, `.panel(.panel--pad0)>.panel__head>.panel__title`, `.adm-grid(.adm-grid--halves)`, `.adm-filters`, `.adm-search`, `.adm-table` (+`.adm-thumb`, `.num`, `th[data-sort]`), `.kanban>.kanban__col>.kanban__head+.kanban__list>.kcard`, `.viewtoggle`, `.timeline>.timeline__item>.timeline__date+.timeline__who`, `.role--admin|content|orders`, `.dropzone`, `.import-error/.import-ok`, `.switch>input+.switch__track`, `.adm-note`, `.bulkbar(.is-show)`, `.chart-bars`.

## Демо-условности (важно для консистентности)
- Вход: любые данные / кнопка «войти демо-пользователем» → Store.login() → пользователь «алекс соколов».
- Промокоды в корзине: SKOLKO15 (−15%), MOZHNO500 (−500 ₽ от 5 000 ₽), BUNT10 (−10% на коллекцию «бунтари»). Неверный код — тост-ошибка.
- Бесплатная доставка: курьер от 8 000 ₽, ПВЗ от 5 000 ₽ (см. DATA.deliveryMethods).
- Все «отправки» форм — фейковые: preventDefault + UI.toast.
- Сегодняшняя дата в сценарии прототипа: 19 августа 2026.
