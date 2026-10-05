/* HONU POKÉ & MORE · interacciones · GSAP 3 + ScrollTrigger */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const hasST = hasGsap && !!window.ScrollTrigger;

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));

  // al recargar se empieza siempre arriba: sin #ancla y sin restaurar el scroll.
  // ScrollTrigger devuelve el modo de restauración al original al cargar, así que se fija
  // también al terminar de cargar y justo antes de salir de la página.
  const toTop = () => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  };
  if (location.hash && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  toTop();
  window.addEventListener('load', toTop);
  window.addEventListener('pageshow', toTop);
  window.addEventListener('beforeunload', toTop);

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* EL SOL DE LA MARCA (rayos ondulados, dibujados en SVG) */
  (function sun() {
    const NS = 'http://www.w3.org/2000/svg';
    $$('[data-sun]').forEach((svg) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('fill', 'none');
      g.setAttribute('stroke', 'currentColor');
      g.setAttribute('stroke-linecap', 'round');
      g.setAttribute('stroke-linejoin', 'round');

      const core = document.createElementNS(NS, 'circle');
      core.setAttribute('r', 30); core.setAttribute('stroke-width', 5);
      g.appendChild(core);

      const RAYS = 18;
      for (let k = 0; k < RAYS; k++) {
        const th = (k / RAYS) * Math.PI * 2;
        const len = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(k * 2.399));
        const phase = k * 1.7;
        let d = '';
        for (let i = 0; i <= 16; i++) {
          const t = i / 16;
          const r = 40 + 52 * len * t;
          const off = Math.sin(t * Math.PI * 2 + phase) * (0.8 + 2.6 * t);
          const x = r * Math.cos(th) - off * Math.sin(th);
          const y = r * Math.sin(th) + off * Math.cos(th);
          d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
        }
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('stroke-width', (2.2 + 1.6 * len).toFixed(2));
        g.appendChild(p);
      }
      svg.appendChild(g);
      if (hasGsap && !reduced) {
        gsap.to(g, { rotation: 360, svgOrigin: '0 0', duration: 140, ease: 'none', repeat: -1 });
      }
    });
  })();

  /* NAVBAR: compacta + se aclara sobre fondos crema/amarillo */
  (function navbar() {
    const nav = $('#nav');
    if (!nav) return;
    let raf = false;
    function onScroll() {
      if (raf) return;
      raf = true;
      requestAnimationFrame(() => {
        nav.classList.toggle('is-stuck', window.scrollY > 70);
        raf = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // el enlace de la sección que se ve se marca como una etiqueta
    if (window.IntersectionObserver) {
      [['#carta', 'a[data-tab="t-casa"]'], ['#proceso', 'a[href="#proceso"]'], ['#visita', 'a[href="#visita"]']].forEach(([sel, link]) => {
        const sec = $(sel), a = $(link, nav);
        if (!sec || !a) return;
        new IntersectionObserver((es) => { a.classList.toggle('is-here', es[0].isIntersecting); }, { rootMargin: '-45% 0px -50% 0px' }).observe(sec);
      });
    }

    // enlaces internos con scroll suave
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const target = id.length > 1 ? $(id) : null;
        if (!target && id !== '#top') return;
        e.preventDefault();
        const y = id === '#top' ? 0 : Math.max(0, target.getBoundingClientRect().top + window.scrollY - 40);
        window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
      });
    });

    if (!hasST) return;
    ['.about', '.revs', '.visit'].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el, start: 'top 76px', end: 'bottom 76px',
        onToggle: (self) => {
          if (!document.body.classList.contains('panel-open')) nav.classList.toggle('is-light', self.isActive);
        }
      });
    });
  })();

  /* MENÚ MÓVIL */
  const menu = (function burgerMenu() {
    const burger = $('#burger');
    const panel = $('#menu-panel');
    const nav = $('#nav');
    if (!burger || !panel) return { close() {} };
    let isOpen = false;

    function set(v) {
      isOpen = v;
      panel.classList.toggle('is-open', v);
      burger.setAttribute('aria-expanded', String(v));
      document.body.classList.toggle('is-locked', v);
      document.body.classList.toggle('panel-open', v);
      if (v && nav) nav.classList.remove('is-light');
    }
    burger.addEventListener('click', () => set(!isOpen));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) { set(false); burger.focus(); } });
    $$('a', panel).forEach((a) => a.addEventListener('click', () => set(false)));
    return { close() { if (isOpen) set(false); } };
  })();

  /* HERO: vídeo + entrada orquestada */
  (function hero() {
    const video = $('#hero-video');
    if (video) {
      const tryPlay = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); };
      if (video.readyState >= 2) tryPlay();
      video.addEventListener('loadeddata', tryPlay, { once: true });
      document.addEventListener('visibilitychange', () => { document.hidden ? video.pause() : tryPlay(); });
    }
    if (!hasGsap || reduced) return;

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1, paused: true });
    tl.from('.nav', { y: -70, opacity: 0, duration: 1 })
      .from('.hero__place', { y: 16, opacity: 0, duration: 0.7 }, 0.2)
      .from('.hero__title .line > span', { yPercent: 112, duration: 1.1, stagger: 0.09 }, 0.25)
      .from('.hero__sub', { y: 20, opacity: 0, duration: 0.8 }, 0.7)
      .from('.hero__cta > *', { y: 20, opacity: 0, duration: 0.7, stagger: 0.08, clearProps: 'transform,opacity' }, 0.8)
      .from('.hero__arch', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.5 }, 0.3)
      .from('.hero__arch video', { scale: 1.2, duration: 2.2, ease: 'power2.out' }, 0.3)
      .from('.hero__rating', { y: 14, opacity: 0, duration: 0.7 }, 1.1)
      .from('.hero .sticker', { scale: 0, rotate: -40, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'back.out(1.8)' }, 1.0)
      .from('.hero__sun', { scale: 0.7, opacity: 0, duration: 2, ease: 'power3.out' }, 0);

    if (document.visibilityState === 'visible') tl.play();
    else {
      const start = () => {
        if (document.visibilityState !== 'visible') return;
        document.removeEventListener('visibilitychange', start);
        tl.play();
      };
      document.addEventListener('visibilitychange', start);
      // si nadie la ve (pestaña en segundo plano, vista previa), el hero queda ya montado
      setTimeout(() => { if (tl.progress() === 0) tl.progress(1); }, 2200);
    }

    if (hasST) {
      gsap.to('.hero__sun', { y: -90, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__text', { y: -40, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
      gsap.to('.hero__media', { y: -60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 } });
    }
  })();

  /* TÍTULOS: revelado palabra a palabra (respeta <em>) */
  (function titles() {
    if (!hasST) return;
    function wrapWords(node) {
      Array.prototype.slice.call(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('i'); i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) wrapWords(n);
      });
    }
    $$('.reveal-words').forEach((h) => {
      wrapWords(h);
      if (reduced) return;
      gsap.from($$('.w > i', h), {
        yPercent: 118, duration: 0.95, stagger: 0.055, ease: 'expo.out',
        scrollTrigger: { trigger: h, start: 'top 88%', once: true }
      });
    });
  })();

  /* SOBRE NOSOTROS + contadores */
  (function about() {
    if (!hasST) return;
    if (!reduced) {
      gsap.from('.about__arch', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.about__grid', start: 'top 80%', once: true } });
      gsap.from('.about__media .sticker', { scale: 0, rotate: -30, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.about__grid', start: 'top 70%', once: true } });
      gsap.from('.about__copy > *:not(h2)', { y: 28, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.about__grid', start: 'top 74%', once: true } });
      gsap.from('.about__run span', { y: 30, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.about__run', start: 'top 85%', once: true } });
      gsap.from('.about__run-note', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.about__run', start: 'top 70%', once: true } });
    }
    $$('.count').forEach((el) => {
      const to = parseFloat(el.dataset.to);
      const dec = parseInt(el.dataset.dec || '0', 10);
      const obj = { v: 0 };
      const write = () => { el.textContent = obj.v.toFixed(dec).replace('.', ','); };
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: () => {
          if (reduced) { obj.v = to; write(); return; }
          gsap.to(obj, { v: to, duration: 1.5, ease: 'power2.out', onUpdate: write });
        }
      });
    });
  })();

  /* CARTA: pestañas */
  const tabsApi = (function carta() {
    const tabs = $$('.tabs button');
    const panels = $$('.tabpanel');

    function show(id, animate) {
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t.getAttribute('aria-controls') === id)));
      panels.forEach((p) => { p.hidden = p.id !== id; });
      const panel = document.getElementById(id);
      if (!panel || !hasGsap || reduced || animate === false) return;
      const rows = $$('.poke, .mcard, .step, .xtras, .sum, .deal, .base-note, .extras, .bld__bar', panel);
      gsap.fromTo(rows, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.035, ease: 'power3.out', overwrite: true, clearProps: 'transform,opacity' });
      if (hasST) ScrollTrigger.refresh();
    }

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(t.getAttribute('aria-controls')));
      t.addEventListener('keydown', (e) => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus();
        show(next.getAttribute('aria-controls'));
      });
    });

    // enlaces de toda la web que abren una pestaña concreta
    $$('[data-tab]').forEach((a) => {
      a.addEventListener('click', () => {
        menu.close(); show(a.dataset.tab);
        if (a.dataset.kind) { const k = $('#seg-kind [data-kind="' + a.dataset.kind + '"]'); if (k) k.click(); }
      });
    });

    if (hasST && !reduced) {
      gsap.from('#t-casa .poke', {
        x: -34, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '#t-casa .pokes', start: 'top 82%', once: true }
      });
    }
    return { show };
  })();

  /* MONTA TU BOWL */
  (function builder() {
    const root = $('#builder');
    if (!root) return;

    const SAUCES = ['Curry mango', 'Miel mostaza', 'Curry mayo', 'Spicy mayo', 'Mayo pesto', 'Soja mayo', 'Mayo trufada', 'Sweet mayo',
      'Mayo yuzu', 'Siracha mayo vegana', 'Teriyaki', 'Teriyaki BBQ', 'César', 'Soja', 'Soja cítrica', 'Soja sin gluten'];
    const PROT = ['Pollo casero', 'Salmón', 'Atún', 'Gambas', 'Pulled pork', 'Tofu marinado'];
    const CRUJ = ['Polvo de kikos', 'Cacahuete', 'Mix de sésamos', 'Cebolla crujiente', 'Pipas de calabaza', 'Nueces', 'Chips de plátano',
      'Chips vegetales', 'Chía', 'Sésamo caramelizado', 'Arroz inflado', 'Copos de maíz'];
    const TOP_COMMON = ['Queso feta', 'Queso mozzarella', 'Queso crema', 'Piña', 'Huevo duro', 'Mango', 'Tomate', 'Pepino', 'Edamame', 'Aguacate',
      'Cebolla morada', 'Cebolla caramelizada', 'Cebolla encurtida', 'Wakame', 'Maíz', 'Zanahoria'];

    const KINDS = {
      poke: {
        label: 'poke',
        sizes: [{ k: 'Mediano', p: 11.9, m: 15.9 }, { k: 'Grande', p: 12.9, m: 16.9 }],
        steps: [
          { key: 'Base', pre: 'Elige tu', em: 'base', post: '', max: 2, rule: '1 o 2 ingredientes', opts: ['Arroz sushi', 'Arroz negro', 'Arroz integral', 'Quinoa', 'Mézclum de lechugas'] },
          { key: 'Salsa', pre: 'Pon tu', em: 'salsa', post: 'favorita', max: 2, rule: '2 ingredientes', opts: SAUCES },
          { key: 'Proteína', pre: 'Escoge tu', em: 'proteína', post: '', max: 1, rule: '1 ingrediente', opts: PROT },
          { key: 'Toppings', pre: 'Escoge tus', em: 'toppings', post: '', max: 4, rule: '4 ingredientes', opts: TOP_COMMON.slice(0, 13).concat(['Brotes de soja'], TOP_COMMON.slice(13)) },
          { key: 'Crujientes', pre: 'Elige los', em: 'crujientes', post: '', max: 2, rule: '2 ingredientes', opts: CRUJ }
        ]
      },
      wrap: {
        label: 'wrap',
        sizes: [{ k: 'Único', p: 10.5, m: 14.5 }],
        temp: true,
        steps: [
          { key: 'Base', pre: 'Elige tu', em: 'base', post: '', max: 2, rule: '1 o 2 ingredientes', opts: ['Arroz sushi', 'Mézclum de lechugas'] },
          { key: 'Proteína', pre: 'Escoge tu', em: 'proteína', post: '', max: 1, rule: '1 ingrediente', opts: ['Pollo', 'Salmón', 'Atún', 'Gambas', 'Pulled pork', 'Tofu marinado'] },
          { key: 'Toppings', pre: 'Escoge tus', em: 'toppings', post: '', max: 4, rule: '4 ingredientes', opts: TOP_COMMON },
          { key: 'Salsa', pre: 'Pon tu', em: 'salsa', post: 'favorita', max: 1, rule: '1 ingrediente', opts: SAUCES },
          { key: 'Crujientes', pre: 'Elige los', em: 'crujientes', post: '', max: 1, rule: '1 ingrediente', opts: CRUJ }
        ]
      }
    };

    const EXTRAS = [
      { id: 'salsa', name: 'Extra de salsa', p: 0.4 },
      { id: 'aceite', name: 'Aceite o picantes', p: 0.5 },
      { id: 'prot', name: 'Extra proteína', p: 2 },
      { id: 'top', name: 'Extra topping', p: 1 },
      { id: 'aguacate', name: '2.ª unidad de aguacate', p: 1 },
      { id: 'feta', name: '2.ª unidad de queso feta', p: 1 },
      { id: 'mozz', name: '2.ª unidad de mozzarella', p: 1 }
    ];

    const state = { kind: 'poke', size: 0, temp: 'Caliente', menu: false, sel: {}, extras: {} };

    const eur = (n) => n.toFixed(2).replace('.', ',') + ' €';
    const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

    const stepsBox = $('#steps');
    const xtrasBox = $('#xtras');
    const segKind = $('#seg-kind');
    const segSize = $('#seg-size');
    const segTemp = $('#seg-temp');
    const grpSize = $('#grp-size');
    const grpTemp = $('#grp-temp');
    const sumList = $('#sum-list');
    const sumTotal = $('#sum-total');
    const sumKind = $('#sum-kind');
    const sumSize = $('#sum-size');
    const sumMiss = $('#sum-miss');
    const menuOn = $('#menu-on');
    const menuDesc = $('#menu-desc');
    const toast = $('#toast');

    function resetSel() {
      state.sel = {};
      KINDS[state.kind].steps.forEach((s) => { state.sel[s.key] = []; });
    }

    /* --- pasos --- */
    function renderSteps() {
      const k = KINDS[state.kind];
      stepsBox.innerHTML = '';
      k.steps.forEach((s, i) => {
        const wrap = el('section', 'step');
        wrap.dataset.key = s.key;
        wrap.appendChild(el('div', 'step__n', String(i + 1)));
        const body = el('div');
        const head = el('div', 'step__head');
        head.appendChild(el('h3', '', s.pre + ' <em>' + s.em + '</em>' + (s.post ? ' ' + s.post : '')));
        head.appendChild(el('span', 'step__rule', s.rule));
        head.appendChild(el('span', 'step__count', '0/' + s.max));
        body.appendChild(head);

        const chips = el('div', 'chips');
        s.opts.forEach((o) => {
          const b = el('button', 'chip', o);
          b.type = 'button';
          b.setAttribute('aria-pressed', 'false');
          b.addEventListener('click', () => toggle(s, o, b));
          chips.appendChild(b);
        });
        body.appendChild(chips);
        wrap.appendChild(body);
        stepsBox.appendChild(wrap);
      });
    }

    function toggle(s, o, btn) {
      const list = state.sel[s.key];
      const at = list.indexOf(o);
      if (at > -1) list.splice(at, 1);
      else if (s.max === 1) { list.length = 0; list.push(o); }
      else if (list.length < s.max) list.push(o);
      else { say('Máximo ' + s.max + ' en ' + s.em); return; }
      btn.classList.remove('is-pop'); void btn.offsetWidth; btn.classList.add('is-pop');
      sync();
    }

    function sync() {
      const k = KINDS[state.kind];
      $$('.step', stepsBox).forEach((box, i) => {
        const s = k.steps[i];
        const list = state.sel[s.key];
        const full = list.length >= s.max && s.max > 1;
        box.classList.toggle('is-done', list.length > 0);
        $('.step__count', box).textContent = list.length + '/' + s.max;
        $$('.chip', box).forEach((c) => {
          const on = list.indexOf(c.textContent) > -1;
          c.setAttribute('aria-pressed', String(on));
          c.setAttribute('aria-disabled', String(full && !on));
        });
      });
      renderSummary();
    }

    /* --- extras --- */
    function renderExtras() {
      xtrasBox.innerHTML = '<h3>Y si quieres <em>más</em></h3>';
      const row = el('div', 'xrow');
      EXTRAS.forEach((x) => {
        const it = el('div', 'xitem');
        it.appendChild(el('span', '', x.name + '<b>+' + eur(x.p) + '</b>'));
        const st = el('div', 'stepper');
        const minus = el('button', '', '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Quitar ' + x.name);
        const out = el('output', '', '0');
        const plus = el('button', '', '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Añadir ' + x.name);
        const upd = () => { out.textContent = state.extras[x.id] || 0; minus.disabled = !(state.extras[x.id] > 0); plus.disabled = (state.extras[x.id] || 0) >= 5; };
        minus.addEventListener('click', () => { state.extras[x.id] = Math.max(0, (state.extras[x.id] || 0) - 1); upd(); renderSummary(); });
        plus.addEventListener('click', () => { state.extras[x.id] = Math.min(5, (state.extras[x.id] || 0) + 1); upd(); renderSummary(); });
        upd();
        st.append(minus, out, plus);
        it.appendChild(st);
        row.appendChild(it);
      });
      xtrasBox.appendChild(row);
    }

    /* --- resumen --- */
    function total() {
      const k = KINDS[state.kind];
      const size = k.sizes[Math.min(state.size, k.sizes.length - 1)];
      let t = state.menu ? size.m : size.p;
      EXTRAS.forEach((x) => { t += (state.extras[x.id] || 0) * x.p; });
      return t;
    }

    function summaryText() {
      const k = KINDS[state.kind];
      const size = k.sizes[Math.min(state.size, k.sizes.length - 1)];
      const lines = ['Honu Poké & More · Mi ' + k.label + (k.sizes.length > 1 ? ' (' + size.k + ')' : '') + (k.temp ? ' · ' + state.temp : '') + (state.menu ? ' · en menú (con bebida y postre)' : '')];
      k.steps.forEach((s) => { const v = state.sel[s.key]; if (v.length) lines.push(s.key + ': ' + v.join(', ')); });
      const ex = EXTRAS.filter((x) => state.extras[x.id] > 0).map((x) => state.extras[x.id] + '× ' + x.name.toLowerCase());
      if (ex.length) lines.push('Extras: ' + ex.join(', '));
      lines.push('Total: ' + eur(total()).replace(' ', ' '));
      return lines.join('\n');
    }

    function renderSummary() {
      const k = KINDS[state.kind];
      const size = k.sizes[Math.min(state.size, k.sizes.length - 1)];
      sumKind.textContent = k.label;
      sumSize.textContent = (k.sizes.length > 1 ? size.k : (k.temp ? state.temp : '')) + (k.sizes.length > 1 && k.temp ? ' · ' + state.temp : '');
      sumList.innerHTML = '';
      const missing = [];
      k.steps.forEach((s) => {
        const v = state.sel[s.key];
        const li = el('li', v.length ? '' : 'is-empty');
        li.innerHTML = '<b>' + s.key + '</b><span>' + (v.length ? v.join(', ') : 'Sin elegir') + '</span>';
        sumList.appendChild(li);
        if (!v.length) missing.push(s.em);
      });
      const ex = EXTRAS.filter((x) => state.extras[x.id] > 0).map((x) => state.extras[x.id] + '× ' + x.name.toLowerCase());
      if (ex.length) { const li = el('li'); li.innerHTML = '<b>Extras</b><span>' + ex.join(', ') + '</span>'; sumList.appendChild(li); }

      sumMiss.hidden = !missing.length;
      sumMiss.textContent = missing.length ? 'Aún sin elegir: ' + missing.join(', ') + '.' : '';
      sumTotal.innerHTML = eur(total());
      menuDesc.textContent = '+ bebida + postre · ' + eur(size.m);
    }

    function renderSizes() {
      const k = KINDS[state.kind];
      grpSize.hidden = k.sizes.length < 2;
      grpTemp.hidden = !k.temp;
      segSize.innerHTML = '';
      k.sizes.forEach((s, i) => {
        const b = el('button', '', s.k + '<small>' + eur(s.p) + '</small>');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(i === state.size));
        b.addEventListener('click', () => { state.size = i; $$('button', segSize).forEach((x, j) => x.setAttribute('aria-pressed', String(j === i))); renderSummary(); });
        segSize.appendChild(b);
      });
    }

    function setKind(kind) {
      state.kind = kind; state.size = 0;
      $$('button', segKind).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === kind)));
      resetSel(); renderSizes(); renderSteps(); sync();
    }

    $$('button', segKind).forEach((b) => b.addEventListener('click', () => { if (b.dataset.kind !== state.kind) setKind(b.dataset.kind); }));
    $$('button', segTemp).forEach((b) => b.addEventListener('click', () => {
      state.temp = b.dataset.temp;
      $$('button', segTemp).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      renderSummary();
    }));
    menuOn.addEventListener('change', () => { state.menu = menuOn.checked; renderSummary(); });

    /* --- copiar --- */
    let toastT;
    function say(msg) {
      toast.textContent = msg; toast.classList.add('is-on');
      clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('is-on'), 2200);
    }
    $('#copy').addEventListener('click', () => {
      const text = summaryText();
      const done = () => say('Pedido copiado. Ya puedes pegarlo.');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else fallback();
      function fallback() {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { say('No se pudo copiar'); }
        ta.remove();
      }
    });

    resetSel(); renderSizes(); renderSteps(); renderExtras(); sync();
  })();

  /* CÓMO LO HACEMOS: foto del producto y, al entrar o al pulsar, */
  (function proceso() {
    const reels = $$('.reel');
    if (!reels.length) return;
    const AUTOPLAY_DELAY = 900;

    reels.forEach((reel) => {
      const video = $('.reel__video', reel);
      const btn = $('.reel__btn', reel);
      const frame = $('.arch--reel', reel);
      const bar = $('.reel__bar i', reel);
      const tag = $('.reel__sound', reel);
      const list = $('.steps', reel);
      const items = list ? $$('li', list) : [];
      const ranges = list && list.dataset.steps ? list.dataset.steps.split('|').map((r) => r.split(',').map(Number)) : [];

      let asked = false, timer = null;

      video.addEventListener('playing', () => reel.classList.add('is-playing'));
      video.addEventListener('pause', () => { if (video.ended) reel.classList.remove('is-playing'); });
      video.addEventListener('error', () => { reel.classList.remove('is-playing'); btn.hidden = true; });

      function start() {
        if (asked && !video.paused) return;
        asked = true;
        if (video.preload !== 'auto') video.preload = 'auto';
        const p = video.play();
        if (p && p.catch) p.catch(() => { asked = false; });
      }
      function stop() { clearTimeout(timer); video.pause(); }

      if (window.IntersectionObserver) {
        new IntersectionObserver((entries, obs) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            if (video.preload === 'none') video.preload = 'metadata';
            obs.disconnect();
          });
        }, { rootMargin: '400px 0px' }).observe(reel);

        new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) { clearTimeout(timer); timer = setTimeout(start, asked ? 0 : AUTOPLAY_DELAY); }
            else stop();
          });
        }, { threshold: 0.45 }).observe(reel);
      } else start();

      btn.addEventListener('click', (e) => { e.stopPropagation(); clearTimeout(timer); start(); });

      frame.addEventListener('click', () => {
        if (!reel.classList.contains('is-playing')) { clearTimeout(timer); start(); return; }
        const turningOn = video.muted;
        reels.forEach((other) => {
          const ov = $('.reel__video', other);
          if (!ov) return;
          ov.muted = true;
          other.classList.remove('is-loud');
          const ot = $('.reel__sound', other);
          if (ot) ot.textContent = 'Sonido';
        });
        if (turningOn) { video.muted = false; reel.classList.add('is-loud'); if (tag) tag.textContent = 'Silenciar'; }
      });

      video.addEventListener('timeupdate', () => {
        const t = video.currentTime;
        const d = video.duration || 1;
        if (t > 0.2 && !video.paused) reel.classList.add('is-playing');
        if (bar) bar.style.width = ((t / d) * 100).toFixed(2) + '%';
        if (!ranges.length) return;
        items.forEach((li, i) => {
          const r = ranges[i];
          if (!r) return;
          li.classList.toggle('is-now', t >= r[0] && t < r[1]);
          li.classList.toggle('is-done', t >= r[1]);
        });
      });
      video.addEventListener('ended', () => { reel.classList.remove('is-playing'); asked = false; });
      document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
    });

    if (!hasST || reduced) return;

    reels.forEach((reel) => {
      const media = $('.reel__media', reel);
      const flip = reel.classList.contains('reel--flip');
      gsap.from(media, { x: flip ? 60 : -60, opacity: 0, rotate: flip ? 1.5 : -1.5, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: reel, start: 'top 78%', once: true } });
      gsap.from($$('.reel__eyebrow, .reel__info h3, .reel__lead, .steps li', reel), {
        y: 26, opacity: 0, duration: 0.75, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: reel, start: 'top 74%', once: true }
      });
    });
    gsap.from('.proc__cta', { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.proc__cta', start: 'top 88%', once: true } });
    gsap.to('.proc__wm', { yPercent: -14, rotate: 6, ease: 'none', scrollTrigger: { trigger: '.proc', start: 'top bottom', end: 'bottom top', scrub: true } });
  })();

  /* RESEÑAS Y DÓNDE: entradas */
  (function entrances() {
    if (!hasST || reduced) return;
    gsap.from('.score', { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.revs__grid', start: 'top 85%', once: true } });
    gsap.from('.quote', { y: 40, opacity: 0, duration: 0.9, delay: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.revs__grid', start: 'top 85%', once: true } });
    gsap.from('.score__stars span', { scale: 0, opacity: 0, duration: 0.55, stagger: 0.09, ease: 'back.out(2.4)', scrollTrigger: { trigger: '.revs__grid', start: 'top 80%', once: true } });
    gsap.from('.visit__grid > *', { y: 36, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.visit__grid', start: 'top 85%', once: true } });
    gsap.from('.order', { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.order', start: 'top 90%', once: true } });
  })();

  /* PIE Y STICKERS DEL HERO */
  (function extras() {
    if (hasST && !reduced) {
      gsap.from('.foot__giant', { yPercent: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.foot', start: 'top 85%', once: true } });
    }

    // los stickers del hero siguen un poco al ratón
    const hero = $('.hero');
    if (hero && hasGsap && !reduced && !window.matchMedia('(hover: none)').matches) {
      const items = $$('.hero__media .sticker, .hero__media .leek').map((el, i) => ({
        x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }),
        y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' }),
        k: (i % 2 ? -1 : 1) * (10 + i * 5)
      }));
      hero.addEventListener('mousemove', (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        items.forEach((it) => { it.x(nx * it.k); it.y(ny * it.k); });
      });
    }
  })();

  /* Recalcular medidas cuando cargan fuentes e imágenes */
  function refresh() { if (hasST) ScrollTrigger.refresh(); }
  window.addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh).catch(() => {});
  $$('img[loading="lazy"]').forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', () => { clearTimeout(refresh._t); refresh._t = setTimeout(refresh, 180); }, { once: true });
  });
})();
