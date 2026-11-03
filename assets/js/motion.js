document.documentElement.classList.add('motion-ready');   // tells the safety net the scripts started
/* =====================================================================
   Discount Property Improvements — motion layer
   Hero transformation loop · reveals · parallax · service cards ·
   "See the Transformation" slider · review carousel · mobile quote button
   No dependencies. Respects prefers-reduced-motion.
   ===================================================================== */
(() => {
  'use strict';
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = mqReduce.matches;
  const isSmall = () => innerWidth < 760;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const smooth = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ------------------------------------------------------------------
     1. HERO — "The Art of Transformation" (16 s seamless loop)
        0.0–4.6  s  Scene 1  blueprint lines draw over slate drafting grid
        4.2–9.2  s  Scene 2  felt, timber slats, console, TV, LED assemble
                             while the camera eases from an angle to square
        9.2–10.8 s           crossfade to the real interior photograph
       10.8–14.0 s  Scene 3  completed interior, slow camera glide
       14.0–16.0 s  Scene 4  drafting grid returns → loop restarts at 0
     ------------------------------------------------------------------ */
  const heroMotion = () => {
    const hm = $('[data-hero-motion]');
    if (!hm) return;
    const L = 16;
    let raf = 0, running = false, visible = true, last = 0, elapsed = 0, prev = 0, heroPy = 0;
    const set = (k, v) => hm.style.setProperty(k, v);

    const frame = now => {
      raf = requestAnimationFrame(frame);
      const small = isSmall();
      // light-weight mode on phones: ~30 fps and no 3D camera
      if (small && now - last < 32) return;
      const dt = prev ? Math.min(now - prev, 100) : 16;
      prev = now; last = now;
      elapsed += dt / 1000;
      const t = elapsed % L;
      const draw = smooth(0.3, 4.6, t);
      const b = t < 12 ? smooth(4.2, 9.2, t) : 0;
      const lop = 1 - 0.62 * smooth(5.2, 8.6, t);
      const cam = 1 - smooth(9.2, 10.8, t) + smooth(14.0, 16.0, t);
      const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / L); // 0 → 1 → 0 over the loop
      set('--draw', draw.toFixed(4));
      set('--b', b.toFixed(4));
      set('--lop', lop.toFixed(3));
      set('--cam', cam.toFixed(3));
      if (small) {
        set('--ry', '0deg'); set('--cs', '1.06'); set('--cx', '0%');
      } else {
        set('--ry', (-4.5 * (1 - w)).toFixed(3) + 'deg');
        set('--cs', (1.1 - 0.06 * w).toFixed(4));
        set('--cx', (1.2 * (1 - w)).toFixed(3) + '%');
      }
      const g = Math.sin((2 * Math.PI * t) / L);
      set('--gs', (1.09 + 0.03 * g).toFixed(4));
      set('--gx', (-1.4 * g).toFixed(3) + '%');
      set('--hpy', heroPy.toFixed(1) + 'px');
    };
    const start = () => { if (!running && visible && !document.hidden && !reduce) { running = true; prev = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    if (reduce) { hm.classList.add('static'); return; }
    if (saveData) elapsed = 11; // start on the finished interior when data saver is on
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { threshold: 0 }).observe(hm);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    mqReduce.addEventListener && mqReduce.addEventListener('change', e => {
      reduce = e.matches;
      if (reduce) { stop(); ['--draw', '--b', '--lop', '--cam', '--ry', '--cs', '--cx', '--gs', '--gx'].forEach(k => hm.style.removeProperty(k)); }
      else start();
    });
    // subtle depth: background drifts slower than the page
    addEventListener('scroll', () => { heroPy = Math.min(28, scrollY * 0.08); }, { passive: true });
    start();
  };

  /* ------------------------------------------------------------------
     2. REVEALS (play once) — sections, lines, cards
     ------------------------------------------------------------------ */
  const reveals = () => {
    const els = $$('.rv-up, .rv-line, .hero-draft, .svc-card, .rev-card, .split:not([data-split])');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(e => io.observe(e));
  };

  /* ------------------------------------------------------------------
     3. PARALLAX — service images drift a few pixels against the scroll
     ------------------------------------------------------------------ */
  const parallax = () => {
    if (reduce || (matchMedia('(pointer: coarse)').matches || document.documentElement.classList.contains('touch-lite'))) return;   // phones: photos stay still
    const imgs = $$('.svc-media img');
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = innerHeight;
      imgs.forEach(img => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh; // -0.5 … 0.5
        img.style.setProperty('--py', (p * -14).toFixed(1) + 'px');
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  };

  /* ------------------------------------------------------------------
     4. SEE THE TRANSFORMATION — before/after slider
     ------------------------------------------------------------------ */
  const transformation = () => {
    const root = $('#see-the-transformation');
    const all = (window.DPI_CONFIG && window.DPI_CONFIG.transformations) || [];
    const cfg = window.DPI_CONFIG && window.DPI_CONFIG.showDemoTransformations ? all : all.filter(p => p.verified);
    if (!root) return;
    if (!cfg.length) { // nothing real to show yet: hide the section and links to it
      root.hidden = true;
      $$('a[href="#see-the-transformation"]').forEach(a => { a.hidden = true; });
      return;
    }
    const stage = $('.tx-stage', root), range = $('.tx-range', root);
    const imgB = $('.tx-before', root), imgA = $('.tx-after', root);
    const tabs = $('.tx-tabs', root), body = $('.tx-body', root);
    const demo = $('.tx-demo', root), status = $('.tx-status', root);
    const title = $('.tx-title', root), sum = $('.tx-summary', root), spec = $('.tx-spec', root);
    const cta = $('.tx-cta', root);
    let pos = 50, current = cfg[0];

    const setPos = v => {
      pos = Math.max(0, Math.min(100, v));
      stage.style.setProperty('--pos', pos + '%');
      range.value = Math.round(pos);
      range.setAttribute('aria-valuetext', Math.round(pos) + '% showing before');
    };

    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const render = (p, animate) => {
      current = p;
      const apply = () => {
        imgB.src = p.before; imgB.alt = p.beforeAlt || 'Before';
        imgA.src = p.after; imgA.alt = p.afterAlt || 'After';
        title.textContent = p.title; sum.textContent = p.summary;
        spec.innerHTML = (p.details || []).map(([k, v]) => '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>').join('');
        demo.hidden = !!p.verified;
        status.className = 'tx-status' + (p.verified ? ' verified' : '');
        status.textContent = p.verified ? 'Completed project' : 'Demonstration illustration';
        body.classList.remove('swap');
      };
      if (animate && !reduce) { body.classList.add('swap'); setTimeout(apply, 220); } else apply();
      $$('.tx-tab', tabs).forEach(t => t.setAttribute('aria-selected', String(t.dataset.id === p.id)));
    };

    tabs.innerHTML = cfg.map(p => '<button class="tx-tab" role="tab" type="button" data-id="' + esc(p.id) + '" aria-selected="false">' + esc(p.tab) + '</button>').join('');
    tabs.addEventListener('click', e => {
      const b = e.target.closest('.tx-tab'); if (!b) return;
      const p = cfg.find(x => x.id === b.dataset.id); if (p && p !== current) { render(p, true); setPos(50); }
    });
    tabs.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const list = $$('.tx-tab', tabs), i = list.indexOf(document.activeElement);
      if (i < 0) return;
      const n = list[(i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
      n.focus(); n.click();
    });
    if (cfg.length < 2) tabs.hidden = true;

    // pointer drag (mouse, pen, touch). touch-action:pan-y keeps vertical page scroll working.
    let dragging = false, startX = 0, startY = 0, decided = false;
    const fromEvent = e => { const r = stage.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
    stage.addEventListener('pointerdown', e => {
      dragging = true; decided = e.pointerType === 'mouse'; startX = e.clientX; startY = e.clientY;
      if (decided) { stage.classList.add('dragging'); setPos(fromEvent(e)); stage.setPointerCapture(e.pointerId); }
    });
    stage.addEventListener('pointermove', e => {
      if (!dragging) return;
      if (!decided) {
        const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
        if (dx < 6 && dy < 6) return;
        if (dy > dx) { dragging = false; return; } // vertical swipe = page scroll
        decided = true; stage.classList.add('dragging'); stage.setPointerCapture(e.pointerId);
      }
      setPos(fromEvent(e));
    });
    const end = e => {
      if (dragging && !decided && e && e.type === 'pointerup') setPos(fromEvent(e)); // a tap moves the divider
      dragging = false; stage.classList.remove('dragging');
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    range.addEventListener('input', () => setPos(+range.value));

    cta.addEventListener('click', e => {
      e.preventDefault();
      if (window.DPI_openQuoteModal) window.DPI_openQuoteModal(current.service);
      else location.hash = '#quote';
    });

    render(cfg[0], false);
    setPos(50);
    const note = $('.tx-note', root);
    if (note) note.hidden = cfg.some(p => p.verified);

    // one gentle hint sweep the first time the slider is seen
    if (!reduce && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const keys = [[0, 50], [700, 68], [1500, 34], [2200, 50]];
        const t0 = performance.now();
        const step = now => {
          if (dragging) return;
          const t = now - t0;
          let i = 0; while (i < keys.length - 1 && t > keys[i + 1][0]) i++;
          if (i >= keys.length - 1) { setPos(50); return; }
          const [ta, va] = keys[i], [tb, vb] = keys[i + 1];
          const x = (t - ta) / (tb - ta), ease = x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
          setPos(va + (vb - va) * ease);
          requestAnimationFrame(step);
        };
        setTimeout(() => requestAnimationFrame(step), 400);
      }, { threshold: 0.5 });
      io.observe(stage);
    }
  };

  /* ------------------------------------------------------------------
     5. REVIEWS — "View all" toggle + swipe/arrow carousel on small screens
     ------------------------------------------------------------------ */
  const reviews = () => {
    const grid = $('#initial-reviews-grid');
    const extra = $('#extra-reviews-container');
    const btn = $('#toggle-all-reviews-btn');
    const txt = $('#toggle-reviews-text');
    if (btn && extra) {
      const more = extra.querySelectorAll('.card').length;
      const closedLabel = txt ? txt.textContent : 'View All Reviews';
      btn.setAttribute('aria-controls', 'extra-reviews-container');
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', () => {
        const open = extra.style.display !== 'none' && extra.style.display !== '';
        if (open) {
          extra.style.opacity = '0';
          setTimeout(() => { extra.style.display = 'none'; }, reduce ? 0 : 420);
          if (txt) txt.textContent = closedLabel;
          btn.setAttribute('aria-expanded', 'false');
          if (grid) grid.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
        } else {
          extra.style.display = 'block';
          requestAnimationFrame(() => requestAnimationFrame(() => { extra.style.opacity = '1'; }));
          $$('.rev-card', extra).forEach(c => c.classList.add('in'));
          if (txt) txt.textContent = 'Show Fewer Reviews';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
      if (more === 0) btn.hidden = true;
    }
    if (!grid) return;
    const cards = $$(':scope > .card', grid);
    const nav = document.createElement('div');
    nav.className = 'rev-nav';
    nav.innerHTML =
      '<span class="rev-count" aria-live="polite"></span>' +
      '<button type="button" class="rev-prev" aria-label="Previous review"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>' +
      '<button type="button" class="rev-next" aria-label="Next review"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>';
    grid.parentNode.insertBefore(nav, grid);
    grid.setAttribute('role', 'region');
    grid.setAttribute('aria-label', 'Client reviews');
    grid.tabIndex = 0;
    const prevB = $('.rev-prev', nav), nextB = $('.rev-next', nav), count = $('.rev-count', nav);
    const idx = () => {
      const l = grid.scrollLeft; let best = 0, d = Infinity;
      cards.forEach((c, i) => { const dd = Math.abs(c.offsetLeft - grid.offsetLeft - l); if (dd < d) { d = dd; best = i; } });
      return best;
    };
    const go = dir => {
      const i = Math.max(0, Math.min(cards.length - 1, idx() + dir));
      grid.scrollTo({ left: cards[i].offsetLeft - grid.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    };
    const sync = () => {
      const i = idx();
      count.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
      prevB.disabled = grid.scrollLeft < 4;
      nextB.disabled = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4;
    };
    prevB.addEventListener('click', () => go(-1));
    nextB.addEventListener('click', () => go(1));
    grid.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    grid.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    addEventListener('resize', sync);
    sync();
  };

  /* ------------------------------------------------------------------
     6. MOBILE — floating "Request Quote" button after the hero,
        hidden while the quote form itself is on screen
     ------------------------------------------------------------------ */
  const mobileQuote = () => {
    const b = $('.m-quote'), hero = $('.hero-card'), quote = $('#quote');
    if (!b || !hero) return;
    let pastHero = false, atQuote = false;
    const upd = () => {
      const modalOpen = ['quote-modal', 'review-modal'].some(id => { const m = document.getElementById(id); return m && m.style.display === 'block'; });
      b.classList.toggle('show', pastHero && !atQuote && !modalOpen && !document.body.classList.contains('menu-open'));
    };
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; upd(); }).observe(hero);
    if (quote) new IntersectionObserver(([e]) => { atQuote = e.isIntersecting; upd(); }, { threshold: 0.05 }).observe(quote);
    const mo = new MutationObserver(upd);
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    ['quote-modal', 'review-modal'].forEach(id => { const m = document.getElementById(id); if (m) mo.observe(m, { attributes: true, attributeFilter: ['style'] }); });
  };


  /* dust motes drifting through the light in the hero photo scene */
  const dust = () => {
    const host = $('.hm-atmo'); if (!host || reduce) return;
    const cv = document.createElement('canvas'); host.appendChild(cv);
    const c = cv.getContext('2d'); let W = 0, H = 0, P = [];
    const size = () => { const r = host.getBoundingClientRect(); W = cv.width = Math.max(1, r.width); H = cv.height = Math.max(1, r.height);
      P = Array.from({ length: isSmall() ? 30 : 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: .6 + Math.random() * 1.8, vx: .08 + Math.random() * .25, vy: -.05 - Math.random() * .15, p: Math.random() * 6.28 })); };
    size(); new ResizeObserver(size).observe(host);
    let on = false;
    new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(host);
    const tick = t => {
      requestAnimationFrame(tick);
      if (!on || document.hidden) return;
      c.clearRect(0, 0, W, H);
      for (const d of P) {
        d.x += d.vx; d.y += d.vy; d.p += .02;
        if (d.x > W + 5) d.x = -5; if (d.y < -5) d.y = H + 5;
        const a = .25 + .35 * Math.sin(d.p) ** 2;
        c.fillStyle = `rgba(255,228,190,${a})`; c.beginPath(); c.arc(d.x, d.y, d.r, 0, 6.283); c.fill();
      }
    };
    requestAnimationFrame(tick);
  };

  const init = () => { dust(); heroMotion(); reveals(); parallax(); transformation(); reviews(); mobileQuote(); };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
