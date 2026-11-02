/* =====================================================================
   FAQ controller — replaces the four overlapping FAQ scripts in the
   original export (two of them toggled the same question, so clicking a
   closed question left everything closed).
   Keeps: categories, search, count badge, empty state, expand-all,
   "view all 12" — adds plus/minus icons, bronze active state, ARIA,
   and soft transitions between filter/search results.
   ===================================================================== */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrap = document.getElementById('faq-items-wrapper');
  if (!wrap) return;
  const items = Array.from(wrap.querySelectorAll('.faq-item'));
  const input = document.getElementById('faq-search-input');
  const clearBtn = document.getElementById('faq-search-clear-btn');
  const badge = document.getElementById('faq-count-badge');
  const empty = document.getElementById('faq-empty-state');
  const filterBtns = Array.from(document.querySelectorAll('.faq-filter-btn'));
  const topToggle = document.getElementById('faq-toggle-all-btn');
  const topText = document.getElementById('faq-toggle-all-text');
  const bottomBtn = document.getElementById('faq-view-all-bottom-btn');
  const bottomText = bottomBtn && bottomBtn.querySelector('.faq-btn-text');
  const total = items.length;

  const state = { cat: 'all', q: '', showAll: false, allOpen: false };

  items.forEach((it, i) => {
    const trig = it.querySelector('.faq-trigger');
    const content = it.querySelector('.faq-content');
    const qSpan = trig.querySelector('span');
    it._q = qSpan; it._qText = qSpan.textContent;
    it._text = it.textContent.toLowerCase();
    it._extra = it.classList.contains('faq-extra-item');
    const cid = 'faq-a-' + (i + 1);
    content.id = cid;
    content.setAttribute('role', 'region');
    trig.setAttribute('aria-controls', cid);
    trig.setAttribute('aria-expanded', 'false');
    trig.type = 'button';
    trig.addEventListener('click', () => {
      const open = it.classList.contains('is-open');
      if (!state.allOpen) items.forEach(o => o !== it && setOpen(o, false));
      setOpen(it, !open);
      if (open && state.allOpen) syncToggle(false);
    });
  });

  function setOpen(it, open) {
    const c = it.querySelector('.faq-content');
    it.classList.toggle('is-open', open);
    it.querySelector('.faq-trigger').setAttribute('aria-expanded', String(open));
    c.style.maxHeight = open ? c.scrollHeight + 'px' : '0px';
    c.setAttribute('aria-hidden', String(!open));
  }

  function syncToggle(allOpen) {
    state.allOpen = allOpen;
    if (topText) topText.textContent = allOpen ? 'Collapse All' : 'Expand All';
    if (topToggle) topToggle.setAttribute('aria-pressed', String(allOpen));
  }

  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const highlight = (it, q) => {
    if (!q) { it._q.textContent = it._qText; return; }
    const i = it._qText.toLowerCase().indexOf(q);
    if (i < 0) { it._q.textContent = it._qText; return; }
    it._q.innerHTML = esc(it._qText.slice(0, i)) + '<mark>' + esc(it._qText.slice(i, i + q.length)) + '</mark>' + esc(it._qText.slice(i + q.length));
  };

  function apply(animate = true) {
    const q = state.q;
    const run = () => {
      let shown = 0, first = null;
      items.forEach(it => {
        const inCat = state.cat === 'all' || it.dataset.category === state.cat;
        const inQ = !q || it._text.includes(q);
        // extras stay hidden in the default "All" view until "View all" is chosen
        const visible = inCat && inQ && (state.showAll || q || state.cat !== 'all' || !it._extra);
        it.style.display = visible ? 'block' : 'none';
        highlight(it, visible ? q : '');
        if (visible) {
          shown++;
          if (!first) first = it;
          if (animate && !reduce) { it.style.setProperty('--d', shown); it.classList.remove('enter'); void it.offsetWidth; it.classList.add('enter'); }
          setOpen(it, q ? true : state.allOpen);
        } else setOpen(it, false);
      });
      if (!q && !state.allOpen && first) setOpen(first, true);
      if (badge) badge.textContent = q ? shown + ' found' : total + ' questions';
      if (empty) empty.style.display = q && shown === 0 ? 'block' : 'none';
      if (clearBtn) clearBtn.style.visibility = q ? 'visible' : 'hidden';
      wrap.classList.remove('swapping');
    };
    if (animate && !reduce) { wrap.classList.add('swapping'); setTimeout(run, 160); } else run();
  }

  const styleFilter = active => filterBtns.forEach(b => {
    const on = b === active;
    b.style.background = on ? '#1C1D20' : 'rgba(255,255,255,0.85)';
    b.style.color = on ? '#ffffff' : '#1C1D20';
    b.style.borderColor = on ? '#1C1D20' : 'rgba(92, 98, 106, 0.35)';
    b.setAttribute('aria-pressed', String(on));
  });

  filterBtns.forEach(b => b.addEventListener('click', () => {
    if (state.cat === b.dataset.category) return;
    state.cat = b.dataset.category; syncToggle(false); styleFilter(b); apply();
  }));

  if (input) {
    let tmr;
    input.setAttribute('aria-controls', 'faq-items-wrapper');
    input.addEventListener('input', () => {
      clearTimeout(tmr);
      tmr = setTimeout(() => { state.q = input.value.toLowerCase().trim(); syncToggle(false); apply(); }, 140);
    });
  }
  if (clearBtn) clearBtn.addEventListener('click', () => { if (input) { input.value = ''; state.q = ''; apply(); input.focus(); } });

  if (topToggle) topToggle.addEventListener('click', () => {
    syncToggle(!state.allOpen);
    items.forEach(it => { if (it.style.display !== 'none') setOpen(it, state.allOpen); });
    if (!state.allOpen) { const f = items.find(it => it.style.display !== 'none'); if (f) setOpen(f, true); }
  });

  if (bottomBtn) {
    bottomBtn.removeAttribute('onclick');
    bottomBtn.setAttribute('aria-expanded', 'false');
    bottomBtn.addEventListener('click', () => {
      state.showAll = !state.showAll;
      bottomBtn.setAttribute('aria-expanded', String(state.showAll));
      if (bottomText) bottomText.textContent = state.showAll ? 'Show Fewer Questions' : 'View All ' + total + ' Questions';
      if (state.showAll && state.cat !== 'all') { state.cat = 'all'; styleFilter(filterBtns.find(b => b.dataset.category === 'all')); }
      apply();
    });
  }

  // keep open answers sized correctly when fonts load or the viewport changes
  const resize = () => items.forEach(it => { if (it.classList.contains('is-open')) { const c = it.querySelector('.faq-content'); c.style.maxHeight = c.scrollHeight + 'px'; } });
  addEventListener('resize', resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);

  styleFilter(filterBtns.find(b => b.dataset.category === 'all') || filterBtns[0]);
  apply(false);
})();
