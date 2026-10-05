/* ============================================================
   HONU POKÉ & MORE · tienda
   Productos, personalización, bolsa (localStorage) y pedido.
   La web no cobra ni envía pedidos sola: prepara el pedido y lo
   manda por WhatsApp (si se configura el número) o se copia/llama.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- CONFIGURACIÓN QUE SE EDITA AQUÍ ---------- */
  const CONFIG = {
    whatsapp: '',                 // número con prefijo y sin +, p. ej. '34600123456'. Vacío = sin botón de WhatsApp
    phone: '865 79 59 88',
    // tramos de recogida (minutos desde las 00:00) y días abiertos (0 domingo … 6 sábado)
    slots: [[13 * 60, 16 * 60], [20 * 60, 23 * 60 + 30]],
    openDays: [0, 1, 2, 3, 4, 5, 6],
    leadMinutes: 25,              // margen mínimo para preparar el pedido
    stepMinutes: 15
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const eur = (n) => n.toFixed(2).replace('.', ',') + ' €';
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     DATOS DE LA CARTA
     ============================================================ */
  const SAUCES = ['Curry mango', 'Miel mostaza', 'Curry mayo', 'Spicy mayo', 'Mayo pesto', 'Soja mayo', 'Mayo trufada', 'Sweet mayo',
    'Mayo yuzu', 'Siracha mayo vegana', 'Teriyaki', 'Teriyaki BBQ', 'César', 'Soja', 'Soja cítrica', 'Soja sin gluten'];
  const CRUJ = ['Polvo de kikos', 'Cacahuete', 'Mix de sésamos', 'Cebolla crujiente', 'Pipas de calabaza', 'Nueces', 'Chips de plátano',
    'Chips vegetales', 'Chía', 'Sésamo caramelizado', 'Arroz inflado', 'Copos de maíz'];
  const TOP = ['Queso feta', 'Queso mozzarella', 'Queso crema', 'Piña', 'Huevo duro', 'Mango', 'Tomate', 'Pepino', 'Edamame', 'Aguacate',
    'Cebolla morada', 'Cebolla caramelizada', 'Cebolla encurtida', 'Wakame', 'Maíz', 'Zanahoria'];
  const o = (list) => list.map((k) => ({ k, p: 0 }));

  const EXTRAS = [
    { k: 'Extra de salsa', p: 0.4 }, { k: 'Aceite o picantes', p: 0.5 }, { k: 'Extra proteína', p: 2 }, { k: 'Extra topping', p: 1 },
    { k: '2.ª de aguacate', p: 1 }, { k: '2.ª de queso feta', p: 1 }, { k: '2.ª de mozzarella', p: 1 }
  ];
  const DRINK_MENU = [{ k: 'Agua', p: 0 }, { k: 'Coca-Cola', p: 0 }, { k: 'Aquarius', p: 0 }, { k: 'Nestea', p: 0 }, { k: 'Fanta', p: 0 },
    { k: 'Mahou 5 Estrellas', p: 0.5 }, { k: 'Mahou Tostada 00', p: 0.5 }];
  const DESSERT_MENU = [{ k: 'Tarta de queso casera', p: 0 }, { k: 'Tarta de queso y pistacho', p: 0 }, { k: 'Tarta de queso y Kinder', p: 0 }, { k: 'Yogurfruit', p: 1 }];

  // grupos reutilizables
  const G = {
    size: { id: 'size', title: 'Tamaño', rule: 'Elige 1', type: 'one', min: 1, options: [{ k: 'Mediano', p: 0 }, { k: 'Grande', p: 1 }] },
    base: (list) => ({ id: 'base', title: 'Base', rule: '1 o 2', type: 'many', min: 1, max: 2, options: o(list) }),
    extras: { id: 'extras', title: 'Extras', rule: 'Si quieres', type: 'many', min: 0, max: 7, options: EXTRAS },
    menu: { id: 'menu', title: '¿Lo hacemos menú?', short: 'Menú', rule: 'Con bebida y postre', type: 'one', min: 1, def: 0,
      options: [{ k: 'Solo el plato', p: 0 }, { k: 'Hazlo menú', p: 4 }] },
    drink: { id: 'drink', title: 'Bebida del menú', rule: 'Elige 1', type: 'one', min: 1, showIf: (s) => (s.menu || [])[0] === 'Hazlo menú', options: DRINK_MENU },
    dessert: { id: 'dessert', title: 'Postre del menú', rule: 'Elige 1', type: 'one', min: 1, showIf: (s) => (s.menu || [])[0] === 'Hazlo menú', options: DESSERT_MENU }
  };
  const POKE_BASES = ['Arroz sushi', 'Arroz negro', 'Arroz integral', 'Quinoa', 'Mézclum de lechugas'];

  const HOUSE = [
    ['honu', 'Honu', 'Salsa curry mango', 'Pollo casero troceado, aguacate, tomate cherry, edamame, mango y polvo de kikos.'],
    ['maui', 'Maui', 'Salsa teriyaki', 'Salmón, mango, aguacate, queso crema, cebolla morada y crujiente de nueces.'],
    ['oahu', 'Oahu', 'Salsa spicymayo', 'Atún, bolas de mozzarella, wakame, mango, cebolla caramelizada y crujiente de chía.'],
    ['aya', 'Aya', 'Salsa curry mayo', 'Gamba, huevo duro, pepino, cebolla encurtida, aguacate y crujiente de pipas de calabaza.'],
    ['wiki', 'Wiki Liki Hot', 'Salsa spicy mayo', 'Atún macerado en siracha, queso crema, cebolla morada, aguacate, mango, picadillo de jalapeños y crujiente de sésamo caramelizado.', 'Pica'],
    ['io', 'Ío', 'Salsa miel mostaza', 'Pulled pork BBQ desmenuzado, pepino, cebolla morada, piña, tomate cherry y crujiente de cacahuete.'],
    ['moana', 'Moana', 'Salsa mayo pesto', 'Salmón y atún macerados en limón, queso feta, wakame, mango, cebolla encurtida y crujiente de arroz inflado.'],
    ['aina', 'Aina', 'Salsa mayo trufa', 'Tofu marinado, piña, edamame, cebolla morada, aguacate y crujiente mix de sésamo.', 'Con tofu']
  ];

  /*  PRECIO BASE DE LOS POKES DE LA CASA: la carta solo da el precio del menú (15,90 / 16,90) y el del
      "haz tu poke" (11,90 / 12,90). Aquí se usa el del "haz tu poke" y el menú suma 4 €. Confirmar con el local. */
  const POKE_PRICE = 11.9;

  const PRODUCTS = [];
  HOUSE.forEach(([id, name, sauce, ing, tag], i) => {
    PRODUCTS.push({ id, cat: 'casa', n: i + 1, name, sub: sauce, desc: ing, tag, price: POKE_PRICE,
      groups: [G.size, G.base(POKE_BASES), G.extras, G.menu, G.drink, G.dessert] });
  });

  PRODUCTS.push({
    id: 'tuyo-poke', cat: 'tuyo', kind: 'poke', name: 'Haz tu poke', sub: 'Mediano 11,90 € · Grande 12,90 €',
    desc: 'Elige tu base, tu salsa, tu proteína, tus toppings y tus crujientes.', price: 11.9, img: 'assets/img/bowl-salmon.jpg', pos: '50% 60%',
    groups: [G.size, G.base(POKE_BASES),
      { id: 'salsa', title: 'Salsa', rule: '1 o 2', type: 'many', min: 1, max: 2, options: o(SAUCES) },
      { id: 'prot', title: 'Proteína', rule: 'Elige 1', type: 'one', min: 1, options: o(['Pollo casero', 'Salmón', 'Atún', 'Gambas', 'Pulled pork', 'Tofu marinado']) },
      { id: 'top', title: 'Toppings', rule: 'Hasta 4', type: 'many', min: 0, max: 4, options: o(TOP.slice(0, 13).concat(['Brotes de soja'], TOP.slice(13))) },
      { id: 'cruj', title: 'Crujientes', rule: 'Hasta 2', type: 'many', min: 0, max: 2, options: o(CRUJ) },
      G.extras, G.menu, G.drink, G.dessert]
  });
  PRODUCTS.push({
    id: 'tuyo-wrap', cat: 'tuyo', kind: 'wrap', name: 'Haz tu wrap', sub: 'Caliente o frío',
    desc: 'Base, proteína, toppings, salsa y crujiente, enrollado y cortado por la mitad.', price: 10.5, img: 'assets/img/wrap-corte.jpg', pos: '50% 62%',
    groups: [{ id: 'temp', title: 'Temperatura', rule: 'Elige 1', type: 'one', min: 1, options: o(['Caliente', 'Frío']) },
      G.base(['Arroz sushi', 'Mézclum de lechugas']),
      { id: 'prot', title: 'Proteína', rule: 'Elige 1', type: 'one', min: 1, options: o(['Pollo', 'Salmón', 'Atún', 'Gambas', 'Pulled pork', 'Tofu marinado']) },
      { id: 'top', title: 'Toppings', rule: 'Hasta 4', type: 'many', min: 0, max: 4, options: o(TOP) },
      { id: 'salsa', title: 'Salsa', rule: 'Elige 1', type: 'one', min: 1, options: o(SAUCES) },
      { id: 'cruj', title: 'Crujiente', rule: 'Elige 1', type: 'one', min: 0, options: o(CRUJ) },
      G.extras, G.menu, G.drink, G.dessert]
  });

  [['Gyozas de pollo y vegetales'], ['Gyozas de cerdo y vegetales'], ['Gyozas vegetales']].forEach(([name], i) => {
    PRODUCTS.push({ id: 'gyoza' + i, cat: 'compartir', name, sub: 'Para compartir', price: 5.9, groups: [] });
  });

  PRODUCTS.push({ id: 'tarta', cat: 'postres', name: 'Postre', sub: 'Tarta de queso casera', price: 4.9,
    groups: [{ id: 'sabor', title: 'Sabor', rule: 'Elige 1', type: 'one', min: 1, options: o(['Queso', 'Queso y pistacho', 'Queso y Kinder']) }] });
  PRODUCTS.push({ id: 'agua', cat: 'postres', name: 'Agua', sub: 'Bebida', price: 1.5, groups: [] });
  PRODUCTS.push({ id: 'refresco', cat: 'postres', name: 'Refresco', sub: 'Bebida', price: 1.7,
    groups: [{ id: 'sabor', title: 'Sabor', rule: 'Elige 1', type: 'one', min: 1, options: o(['Coca-Cola', 'Aquarius', 'Nestea', 'Fanta']) }] });
  PRODUCTS.push({ id: 'cerveza', cat: 'postres', name: 'Cerveza', sub: 'Mahou 5 Estrellas', price: 2.6, groups: [] });
  PRODUCTS.push({ id: 'cerveza00', cat: 'postres', name: 'Cerveza 00', sub: 'Mahou Tostada 00', price: 2.9, groups: [] });

  const byId = (id) => PRODUCTS.find((p) => p.id === id);

  /* ============================================================
     BOLSA
     ============================================================ */
  const KEY = 'honu-bag-v1';
  let bag = [];
  try { bag = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { bag = []; }
  const saveBag = () => { try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) { /* sin storage */ } };
  const bagCount = () => bag.reduce((n, l) => n + l.qty, 0);
  const bagTotal = () => bag.reduce((t, l) => t + l.qty * l.unit, 0);

  /* ============================================================
     CARTA EN PANTALLA
     ============================================================ */
  function fromPrice(p) { return p.price; }

  function renderGoods() {
    const casa = $('#list-casa');
    PRODUCTS.filter((p) => p.cat === 'casa').forEach((p) => {
      const card = el('article', 'good');
      card.innerHTML =
        '<span class="good__n" aria-hidden="true">' + p.n + '</span>' +
        '<h3>' + p.name + '</h3>' +
        '<p class="good__sauce">' + p.sub + '</p>' +
        '<p class="good__ing">' + p.desc + '</p>' +
        (p.tag ? '<span class="good__tag">' + p.tag + '</span>' : '') +
        '<div class="good__foot"><p class="price"><span>desde</span><b>' + fromPrice(p).toFixed(2).replace('.', ',') + '<em>€</em></b></p>' +
        '<button class="btn btn--sm" type="button" data-add="' + p.id + '"><span>Elegir</span></button></div>';
      casa.appendChild(card);
    });

    const tuyo = $('#list-tuyo');
    PRODUCTS.filter((p) => p.cat === 'tuyo').forEach((p, i) => {
      const f = el('article', 'feature feature--' + (i ? 'pink' : 'yellow'));
      f.innerHTML =
        '<div class="feature__img arch"><img src="' + p.img + '" alt="" loading="lazy" style="object-position:' + p.pos + '"></div>' +
        '<div class="feature__txt"><p class="script">' + (i ? 'Caliente o frío' : 'Tu bowl') + '</p><h3>' + p.name + '</h3>' +
        '<p>' + p.desc + '</p>' +
        '<p class="price price--big"><span>desde</span><b>' + p.price.toFixed(2).replace('.', ',') + '<em>€</em></b></p>' +
        '<button class="btn" type="button" data-add="' + p.id + '"><span>Montar el mío</span></button></div>';
      tuyo.appendChild(f);
    });

    const comp = $('#list-compartir');
    PRODUCTS.filter((p) => p.cat === 'compartir').forEach((p) => {
      const c = el('article', 'good good--slim');
      c.innerHTML = '<h3>' + p.name + '</h3><div class="good__foot"><p class="price"><b>' + p.price.toFixed(2).replace('.', ',') + '<em>€</em></b></p>' +
        '<button class="btn btn--sm" type="button" data-add="' + p.id + '"><span>Añadir</span></button></div>';
      comp.appendChild(c);
    });

    const rows = $('#list-postres');
    PRODUCTS.filter((p) => p.cat === 'postres').forEach((p) => {
      const r = el('div', 'row');
      r.innerHTML = '<span class="row__name">' + p.name + '<i>' + p.sub + '</i></span><span class="row__dots" aria-hidden="true"></span>' +
        '<b class="row__price">' + eur(p.price) + '</b>' +
        '<button class="btn btn--sm" type="button" data-add="' + p.id + '" aria-label="Añadir ' + p.name + '"><span>+</span></button>';
      rows.appendChild(r);
    });

    $$('[data-add]').forEach((b) => b.addEventListener('click', () => addProduct(byId(b.dataset.add))));
  }

  /* ============================================================
     PERSONALIZAR (hoja)
     ============================================================ */
  const sheet = $('#sheet');
  const sheetBody = $('#sheet-body');
  let cur = null;          // producto en edición
  let sel = {};            // selección: id de grupo -> [keys]
  let qty = 1;

  function addProduct(p) {
    if (!p.groups.length) { pushLine(p, {}, 1); say(p.name + ' añadido a la bolsa'); return; }
    openSheet(p);
  }

  function openSheet(p) {
    cur = p; sel = {}; qty = 1;
    p.groups.forEach((g) => { sel[g.id] = (g.def != null) ? [g.options[g.def].k] : []; });
    $('#sheet-title').textContent = p.name;
    $('#sheet-sub').textContent = p.sub || '';
    sheetBody.innerHTML = '';
    p.groups.forEach((g, gi) => {
      const sec = el('section', 'mgroup');
      sec.dataset.gid = g.id;
      sec.innerHTML = '<div class="mgroup__head"><h4>' + g.title + '</h4><span class="mgroup__rule">' + g.rule + '</span><span class="mgroup__count"></span></div>';
      const chips = el('div', 'chips');
      g.options.forEach((opt) => {
        const b = el('button', 'chip', opt.k + (opt.p ? ' <small>+' + eur(opt.p) + '</small>' : ''));
        b.type = 'button'; b.dataset.k = opt.k; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => pick(g, opt, b));
        chips.appendChild(b);
      });
      sec.appendChild(chips);
      sheetBody.appendChild(sec);
    });
    $('#q-out').textContent = qty;
    syncSheet();
    sheet.hidden = false; lock(true);
    sheetBody.scrollTop = 0;
    $('.x', sheet).focus({ preventScroll: true });
  }
  function closeSheet() { sheet.hidden = true; if ($('#drawer').hidden) lock(false); }

  function pick(g, opt, btn) {
    const list = sel[g.id];
    const at = list.indexOf(opt.k);
    if (g.type === 'one') {
      if (at > -1) { if (g.min === 0) list.length = 0; } else { list.length = 0; list.push(opt.k); }
    } else if (at > -1) list.splice(at, 1);
    else if (list.length < (g.max || 99)) list.push(opt.k);
    else { say('Máximo ' + g.max + ' en ' + g.title.toLowerCase()); return; }
    btn.classList.remove('is-pop'); void btn.offsetWidth; btn.classList.add('is-pop');
    syncSheet();
  }

  const visible = (g) => !g.showIf || g.showIf(sel);

  function unitPrice() {
    let t = cur.price;
    cur.groups.forEach((g) => { if (!visible(g)) return; (sel[g.id] || []).forEach((k) => { const op = g.options.find((x) => x.k === k); if (op) t += op.p; }); });
    return t;
  }

  function syncSheet() {
    const missing = [];
    cur.groups.forEach((g) => {
      const sec = $('[data-gid="' + g.id + '"]', sheetBody);
      const show = visible(g);
      sec.hidden = !show;
      if (!show) return;
      const list = sel[g.id];
      $$('.chip', sec).forEach((c) => {
        const on = list.indexOf(c.dataset.k) > -1;
        c.setAttribute('aria-pressed', String(on));
        c.setAttribute('aria-disabled', String(g.type === 'many' && !on && list.length >= (g.max || 99)));
      });
      $('.mgroup__count', sec).textContent = g.type === 'many' && g.max ? list.length + '/' + g.max : '';
      sec.classList.toggle('is-done', list.length >= Math.max(1, g.min));
      if (list.length < g.min) missing.push(g.title.toLowerCase());
    });
    const miss = $('#sheet-miss');
    miss.hidden = !missing.length;
    miss.textContent = missing.length ? 'Falta elegir: ' + missing.join(', ') + '.' : '';
    $('#sheet-add').disabled = missing.length > 0;
    $('#sheet-total').innerHTML = eur(unitPrice() * qty);
  }

  $('#q-minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); $('#q-out').textContent = qty; syncSheet(); });
  $('#q-plus').addEventListener('click', () => { qty = Math.min(20, qty + 1); $('#q-out').textContent = qty; syncSheet(); });
  $('#sheet-add').addEventListener('click', () => {
    const lines = [];
    cur.groups.forEach((g) => { if (visible(g) && sel[g.id].length) lines.push([g.short || g.title, sel[g.id].slice()]); });
    pushLine(cur, lines, qty, unitPrice());
    closeSheet();
    say(cur.name + ' añadido a la bolsa');
  });
  $$('[data-close-sheet]').forEach((b) => b.addEventListener('click', closeSheet));

  /* ============================================================
     LÍNEAS DE LA BOLSA
     ============================================================ */
  function pushLine(p, lines, n, unit) {
    const key = p.id + '|' + JSON.stringify(lines);
    const found = bag.find((l) => l.key === key);
    if (found) found.qty = Math.min(30, found.qty + n);
    else bag.push({ key, pid: p.id, name: p.name, sub: p.sub || '', qty: n, unit: unit != null ? unit : p.price, lines: Array.isArray(lines) ? lines : [] });
    saveBag(); renderBag(); bump();
  }

  function renderBag() {
    const list = $('#bag-items');
    list.innerHTML = '';
    bag.forEach((l, i) => {
      const li = el('li', 'bagline');
      const det = l.lines.map(([t, v]) => '<b>' + t + ':</b> ' + v.join(', ')).join('<br>');
      li.innerHTML = '<div class="bagline__main"><h4>' + l.name + '</h4>' +
        (det ? '<p class="bagline__det">' + det + '</p>' : '') + '</div>' +
        '<div class="bagline__side"><b class="bagline__price">' + eur(l.qty * l.unit) + '</b>' +
        '<div class="stepper"><button type="button" aria-label="Quitar uno">−</button><output>' + l.qty + '</output><button type="button" aria-label="Añadir uno">+</button></div>' +
        '<button class="bagline__rm" type="button">Quitar</button></div>';
      const [minus, plus] = $$('.stepper button', li);
      minus.addEventListener('click', () => { l.qty -= 1; if (l.qty < 1) bag.splice(i, 1); saveBag(); renderBag(); });
      plus.addEventListener('click', () => { l.qty = Math.min(30, l.qty + 1); saveBag(); renderBag(); });
      $('.bagline__rm', li).addEventListener('click', () => { bag.splice(i, 1); saveBag(); renderBag(); });
      list.appendChild(li);
    });

    const n = bagCount();
    $('#bag-count').textContent = n;
    $('#bag-fab-count').textContent = n;
    $('#bag-fab').hidden = n === 0;
    $('#bag-empty').hidden = n > 0;
    $('#order-form').hidden = n === 0;
    $('#drawer-foot').hidden = n === 0 || !$('#view-done').hidden;
    $('#bag-total').innerHTML = eur(bagTotal());
  }

  function bump() {
    [$('#bag-open'), $('#bag-fab')].forEach((b) => { if (!b) return; b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); });
  }

  /* ============================================================
     CAJÓN DE LA BOLSA
     ============================================================ */
  const drawer = $('#drawer');
  function openDrawer() {
    $('#view-bag').hidden = false; $('#view-done').hidden = true;
    fillTimes(); renderBag();
    drawer.hidden = false; lock(true);
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    $('.x', drawer).focus({ preventScroll: true });
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    setTimeout(() => { drawer.hidden = true; if (sheet.hidden) lock(false); }, reduced ? 0 : 320);
  }
  $('#bag-open').addEventListener('click', openDrawer);
  $('#bag-fab').addEventListener('click', openDrawer);
  $$('[data-close-drawer]').forEach((b) => b.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!sheet.hidden) closeSheet(); else if (!drawer.hidden) closeDrawer();
  });

  function lock(v) { document.body.classList.toggle('is-locked', v); }

  /* --- horas de recogida --- */
  function fillTimes() {
    const sel = $('#f-time');
    const prev = sel.value;
    sel.innerHTML = '';
    const now = new Date();
    const out = [];
    for (let d = 0; d < 3 && out.length < 14; d++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
      if (CONFIG.openDays.indexOf(day.getDay()) === -1) continue;
      CONFIG.slots.forEach(([a, b]) => {
        for (let m = a; m <= b - 15; m += CONFIG.stepMinutes) {
          const t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, m);
          if (t.getTime() < now.getTime() + CONFIG.leadMinutes * 60000) continue;
          const hh = String(Math.floor(m / 60)).padStart(2, '0'), mm = String(m % 60).padStart(2, '0');
          out.push({ v: t.toISOString(), label: (d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : 'Pasado mañana') + ' · ' + hh + ':' + mm });
        }
      });
    }
    out.slice(0, 14).forEach((x) => { const op = el('option', '', x.label); op.value = x.label; sel.appendChild(op); });
    if (!sel.options.length) { const op = el('option', '', 'Lo antes posible'); op.value = 'Lo antes posible'; sel.appendChild(op); }
    if (prev) sel.value = prev;
  }

  /* --- preparar el pedido --- */
  function orderText() {
    const L = ['PEDIDO · Honu Poké & More', ''];
    bag.forEach((l) => {
      L.push(l.qty + '× ' + l.name + ' — ' + eur(l.qty * l.unit).replace(' ', ' '));
      l.lines.forEach(([t, v]) => L.push('   ' + t + ': ' + v.join(', ')));
    });
    L.push('', 'TOTAL: ' + eur(bagTotal()).replace(' ', ' '), '');
    L.push('Nombre: ' + $('#f-name').value.trim(), 'Teléfono: ' + $('#f-phone').value.trim(), 'Recogida: ' + $('#f-time').value);
    const note = $('#f-note').value.trim();
    if (note) L.push('Notas: ' + note);
    L.push('Pago: en el local al recoger');
    return L.join('\n');
  }

  $('#order-go').addEventListener('click', () => {
    const err = $('#order-err');
    const name = $('#f-name').value.trim();
    const phone = $('#f-phone').value.replace(/[\s.-]/g, '');
    $('#f-name').classList.toggle('is-bad', !name);
    $('#f-phone').classList.toggle('is-bad', !/^\+?\d{9,13}$/.test(phone));
    if (!name || !/^\+?\d{9,13}$/.test(phone)) {
      err.hidden = false; err.textContent = !name ? 'Dinos tu nombre para poder avisarte.' : 'Revisa el teléfono: tiene que tener al menos 9 cifras.';
      (name ? $('#f-phone') : $('#f-name')).focus();
      return;
    }
    err.hidden = true;
    const text = orderText();
    $('#done-msg').textContent = text;
    const wa = $('#done-wa');
    if (CONFIG.whatsapp) {
      wa.hidden = false; wa.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(text);
      $('#done-lead').textContent = 'Último paso: envíanos el pedido por WhatsApp y te lo confirmamos.';
    } else {
      wa.hidden = true;
      $('#done-lead').textContent = 'Todavía no se ha enviado. Para terminar, copia el pedido y mándanoslo, o llámanos al ' + CONFIG.phone + ' y te lo tomamos al momento.';
    }
    $('#view-bag').hidden = true; $('#view-done').hidden = false; $('#drawer-foot').hidden = true;
    $('#drawer-scroll').scrollTop = 0;
  });

  $('#done-copy').addEventListener('click', () => {
    const t = $('#done-msg').textContent;
    const ok = () => say('Pedido copiado');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fb); else fb();
    function fb() { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { say('No se pudo copiar'); } ta.remove(); }
  });
  $('#done-new').addEventListener('click', () => { bag = []; saveBag(); renderBag(); closeDrawer(); });
  ['#f-name', '#f-phone'].forEach((s) => $(s).addEventListener('input', (e) => e.target.classList.remove('is-bad')));

  /* ============================================================
     AVISO, NAV, MENÚ MÓVIL, SOL Y CATEGORÍAS
     ============================================================ */
  const toast = $('#toast'); let toastT;
  function say(msg) { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('is-on'), 2200); }

  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 70);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  (function burger() {
    const b = $('#burger'), p = $('#menu-panel');
    const set = (v) => { p.classList.toggle('is-open', v); b.setAttribute('aria-expanded', String(v)); document.body.classList.toggle('is-locked', v); document.body.classList.toggle('panel-open', v); };
    b.addEventListener('click', () => set(!p.classList.contains('is-open')));
    $$('a', p).forEach((a) => a.addEventListener('click', () => set(false)));
  })();

  // enlaces internos de la página con scroll suave
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = a.getAttribute('href').length > 1 ? $(a.getAttribute('href')) : null;
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: Math.max(0, t.getBoundingClientRect().top + window.scrollY - 120), behavior: reduced ? 'auto' : 'smooth' });
  }));

  // categoría activa
  if (window.IntersectionObserver) {
    $$('.shopsec').forEach((s) => {
      new IntersectionObserver((es) => { const a = $('[data-cat="' + s.id + '"]'); if (a) a.classList.toggle('is-here', es[0].isIntersecting); }, { rootMargin: '-40% 0px -55% 0px' }).observe(s);
    });
  }

  // el sol de la cabecera (mismo dibujo que en la landing)
  (function sun() {
    const svg = $('[data-sun]'); if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('fill', 'none'); g.setAttribute('stroke', 'currentColor'); g.setAttribute('stroke-linecap', 'round'); g.setAttribute('stroke-linejoin', 'round');
    const core = document.createElementNS(NS, 'circle'); core.setAttribute('r', 30); core.setAttribute('stroke-width', 5); g.appendChild(core);
    for (let k = 0; k < 18; k++) {
      const th = (k / 18) * Math.PI * 2, len = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(k * 2.399)), ph = k * 1.7; let d = '';
      for (let i = 0; i <= 16; i++) {
        const t = i / 16, r = 40 + 52 * len * t, off = Math.sin(t * Math.PI * 2 + ph) * (0.8 + 2.6 * t);
        d += (i ? 'L' : 'M') + (r * Math.cos(th) - off * Math.sin(th)).toFixed(2) + ' ' + (r * Math.sin(th) + off * Math.cos(th)).toFixed(2);
      }
      const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('stroke-width', (2.2 + 1.6 * len).toFixed(2)); g.appendChild(p);
    }
    svg.appendChild(g);
    if (window.gsap && !reduced) gsap.to(g, { rotation: 360, svgOrigin: '0 0', duration: 140, ease: 'none', repeat: -1 });
  })();

  renderGoods();
  renderBag();
})();
