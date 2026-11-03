/* =====================================================================
   Cinematic scroll engine — sticky stage, layered parallax, symmetric
   split-foreground reveal, story panels and an infinite services slider.
   Timing, easing and maths follow the reference engine exactly; only the
   geometry of the centre object is adapted to the timber-framing asset.
   ===================================================================== */
(() => {
  'use strict';
  const section = document.querySelector('.cinema-scroll');
  const rootCls = document.documentElement.classList;
  if (!section || rootCls.contains('simple-mode') || rootCls.contains('touch-lite')) return;   // phones use the auto-playing opening instead
  try {
  document.documentElement.classList.add('has-cinema');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const track = section.querySelector('.sights-track');
  const controls = section.querySelector('.sights-controls');
  const prev = section.querySelector('.sight-prev');
  const next = section.querySelector('.sight-next');
  const originals = Array.from(section.querySelectorAll('.sight-card'));
  const panel2 = section.querySelector('.story-panel-bridge');
  const panel3 = section.querySelector('.story-panel-bazaar');
  const intro = section.querySelector('.intro-copy');

  let targetMouseX = 0, targetMouseY = 0, mouseX = 0, mouseY = 0;
  let targetScroll = 0, smoothScroll = 0, initialized = false, rafPending = false;
  let sightCards = [], originalSightCount = originals.length, activeSight = originalSightCount;

  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const smoothstep = (e0, e1, v) => { const x = clamp((v - e0) / (e1 - e0)); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const segmentInOut = (s, a, b, c, d) => { const enter = smoothstep(a, b, s), exit = smoothstep(c, d, s); return { enter, exit, active: enter * (1 - exit) }; };
  const webIntro = document.documentElement.classList.contains('web-intro');
  const START = 0;
  // computers: the auto-playing landing sits inside the stage as the first screen and fades out exactly like the old title did
  const landing = document.querySelector('.phone-intro');
  if (webIntro && landing) { const stage = section.querySelector('.stage'); stage.appendChild(landing); landing.classList.add('in-stage'); }
  const getScrollDistance = () => START + clamp(-section.getBoundingClientRect().top, 0, section.offsetHeight - VH());
  const set = (k, v) => section.style.setProperty(k, v);
  const isSmall = () => innerWidth <= 640;
  // phones & tablets: the services slider uses the device's own sideways scrolling (smooth, snaps, never fights the finger)
  const nativeSlider = matchMedia('(pointer: coarse)').matches;
  if (nativeSlider) section.classList.add('native-slider');
  // phones resize the window as the address bar hides/shows while scrolling; keep one stable
  // height so the scene doesn't jump. Only a real change (rotation, new window size) updates it.
  let stableW = innerWidth, stableH = innerHeight;
  const VH = () => stableH;
  addEventListener('resize', () => {
    if (Math.abs(innerWidth - stableW) > 2 || Math.abs(innerHeight - stableH) > 160) { stableW = innerWidth; stableH = innerHeight; }
  });

  let lastT = 0;
  function update(now) {
    rafPending = false;
    // the reference eases 0.14 / 0.12 per frame at 60 fps; scale by elapsed time so slower devices feel the same
    const dt = lastT ? Math.min(0.1, ((now || performance.now()) - lastT) / 1000) : 1 / 60; lastT = now || performance.now();
    const k = 1 - Math.pow(1 - 0.14, dt * 60), km = 1 - Math.pow(1 - 0.12, dt * 60);
    targetScroll = getScrollDistance();
    if (!initialized || reduceMotion.matches || nativeSlider) { smoothScroll = targetScroll; initialized = true; }
    else smoothScroll = lerp(smoothScroll, targetScroll, k);
    if (Math.abs(smoothScroll - targetScroll) < 0.08) smoothScroll = targetScroll;
    mouseX = lerp(mouseX, targetMouseX, km);
    mouseY = lerp(mouseY, targetMouseY, km);
    const mx = reduceMotion.matches ? 0 : mouseX * (isSmall() ? 0.3 : 1);
    const my = reduceMotion.matches ? 0 : mouseY * (isSmall() ? 0.3 : 1);

    const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620);
    const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700);
    const progress = clamp(smoothScroll / 2700);
    const introExit = smoothstep(90, 650, smoothScroll);
    // phones: the cards arrive sooner, travel less, then rest for a long stretch so a finger can't shake or rewind them
    const sightsEnterRaw = nativeSlider ? smoothstep(2700, 3050, smoothScroll) : smoothstep(2760, 3560, smoothScroll);
    const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
    const sightsControlsEnter = nativeSlider ? smoothstep(2950, 3150, smoothScroll) : smoothstep(3360, 3660, smoothScroll);
    const blurActive = clamp(frame2.active + frame3.active);
    const frame2Opacity = frame2.active * (1 - frame3.enter);
    const splitDrift = Math.pow(frame2.enter, 1.5);
    const panel2Opacity = frame2.active * (1 - frame2.exit);
    const panel3Opacity = frame3.active * (1 - frame3.exit);
    const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16;
    const sharedHeroY = progress * -74;
    const sharedHeroScale = progress * 0.23;
    const sightsScreenTop = Math.min(220, Math.max(112, VH() * 0.19)) - 50;
    const sightsParentTop = VH() - (VH() - sightsScreenTop) / backScale;

    set('--mx', mx.toFixed(4)); set('--my', my.toFixed(4));
    set('--skyb-opacity', smoothstep(1650, 2150, smoothScroll).toFixed(4)); // second house fades in for the craftsmanship scene
    set('--back-opacity', (1 - frame2.active * 0.06).toFixed(4));
    set('--back-x', `${(mx * -12).toFixed(2)}px`);
    set('--back-y', `${(my * -4).toFixed(2)}px`);
    set('--back-scale', backScale.toFixed(4));
    set('--four-y', `${(10 + progress * 10).toFixed(3)}vh`);
    set('--four-scale', (0.78 + progress * 0.16).toFixed(4));
    set('--bazaar-y', `${(20 - progress * 8).toFixed(3)}vh`);
    const blurMax = isSmall() ? 7 : 14; // lighter blur on phones
    set('--blur-px', `${(blurActive * blurMax).toFixed(2)}px`);
    set('--back-brightness', (1 - blurActive * 0.255).toFixed(4));
    set('--bazaar-blur-px', `${(frame2.active * blurMax).toFixed(2)}px`);
    set('--bazaar-brightness', (1 - frame2.active * 0.255 - frame3.active * 0.06 + frame3.active * 0.35).toFixed(4)); // drawing glows brighter in the craftsmanship scene
    set('--bazaar-saturation', (1 + frame3.active * 0.18).toFixed(4));
    set('--shade-opacity', '1');
    set('--shade-z', frame2.active > 0.02 ? '2' : '0');
    set('--shade-top-alpha', (blurActive * 0.465).toFixed(4));
    set('--shade-mid-alpha', (blurActive * 0.42).toFixed(4));
    set('--shade-bottom-alpha', (blurActive * 0.51).toFixed(4));

    set('--title-y', `${(introExit * -210).toFixed(2)}px`);
    set('--title-scale', (1 - introExit * 0.08).toFixed(4));
    set('--title-opacity', (1 - introExit).toFixed(4));
    if (landing && webIntro) landing.style.pointerEvents = introExit > 0.85 ? 'none' : '';

    set('--bridge-x', `calc(-50% + ${(mx * 18).toFixed(2)}px)`);
    set('--bridge-y', `${(my * 8 + sharedHeroY - frame2.exit * 760).toFixed(2)}px`);
    set('--bridge-bottom', `${(-frame2.enter * 13).toFixed(3)}vh`);
    set('--bridge-width', `calc(max(100vw, 150vh) + ${(frame2.enter * 37.8).toFixed(3)}vw)`); // steps foreground starts aligned with the photo behind it
    set('--bridge-scale', (1.02 + sharedHeroScale + frame2.exit * 0.46).toFixed(4));
    set('--bridge-opacity', (1 - smoothstep(0.35, 0.9, frame2.exit)).toFixed(4)); // the large steps layer fades as it lifts away

    set('--split-left-x', `calc(-50% + ${(-splitDrift * 46).toFixed(3)}vw + ${(mx * 22).toFixed(2)}px)`);
    set('--split-left-y', `${(my * 10 + sharedHeroY - splitDrift * 180).toFixed(2)}px`);
    set('--split-left-scale', (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4));
    set('--split-right-x', `calc(-50% + ${(splitDrift * 46).toFixed(3)}vw + ${(mx * 22).toFixed(2)}px)`);
    set('--split-right-y', `${(my * 10 + sharedHeroY - splitDrift * 180).toFixed(2)}px`);
    set('--split-right-scale', (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4));

    set('--frame2-opacity', frame2Opacity.toFixed(4));
    set('--frame2-x', `calc(-50% + ${(mx * 10).toFixed(2)}px)`);
    set('--frame2-y', `calc(-50% + ${(my * 8 - frame2.exit * 150).toFixed(2)}px)`);
    set('--frame2-scale', (1.06 + frame2.enter * 0.08 + frame2.exit * 0.08).toFixed(4));

    set('--intro-copy-y', `${(introExit * 90).toFixed(2)}px`);
    set('--intro-copy-opacity', (1 - introExit).toFixed(4));
    set('--panel2-opacity', panel2Opacity.toFixed(4));
    set('--panel2-y', `calc(-50% + ${(-frame2.exit * 86 + (1 - frame2.enter) * 58).toFixed(2)}px)`);
    set('--panel3-opacity', panel3Opacity.toFixed(4));
    set('--panel3-y', `calc(-50% + ${(-frame3.exit * 86 + (1 - frame3.enter) * 58).toFixed(2)}px)`);

    set('--sights-opacity', sightsEnter.toFixed(4));
    set('--sights-controls-opacity', sightsControlsEnter.toFixed(4));
    controls.classList.toggle('is-ready', sightsControlsEnter > 0.98);
    set('--sights-visibility', sightsEnter > 0.01 ? 'visible' : 'hidden');
    set('--sights-y', '0px');
    set('--sights-enter-x', `${((1 - sightsEnter) * (nativeSlider ? 120 : 420)).toFixed(3)}vw`);
    set('--sights-scale', (1 / backScale).toFixed(5));
    // land the active card exactly at the left padding, whatever the background zoom is
    const W = innerWidth, sliderScreenX = -0.03 * W + mx * -12 + 0.53 * W * (1 - backScale);
    set('--fix', `${((isSmall() ? 20 : 48) - sliderScreenX).toFixed(2)}px`);
    set('--sights-top', `${sightsParentTop.toFixed(2)}px`);
    set('--sights-screen-top', `${sightsScreenTop.toFixed(2)}px`);

    // keep hidden buttons out of the keyboard order (accessibility)
    toggleInteractive(intro, 1 - introExit > 0.5);
    toggleInteractive(panel2, panel2Opacity > 0.5);
    toggleInteractive(panel3, panel3Opacity > 0.5);

    if (Math.abs(smoothScroll - targetScroll) > 0.08 || Math.abs(mouseX - targetMouseX) > 0.001 || Math.abs(mouseY - targetMouseY) > 0.001) requestTick(); else lastT = 0;
  }

  function toggleInteractive(el, on) {
    if (!el || el._on === on) return;
    el._on = on;
    el.setAttribute('aria-hidden', String(!on));
    el.querySelectorAll('a, button').forEach(b => { b.tabIndex = on ? 0 : -1; b.style.pointerEvents = on ? 'auto' : 'none'; });
  }

  function requestTick() { if (!rafPending) { rafPending = true; requestAnimationFrame(update); } }

  /* ---------------- infinite services slider ---------------- */
  function setupSightSlider() {
    track.replaceChildren();
    for (let setIndex = 0; setIndex < 3; setIndex++) {
      originals.forEach((card, cardIndex) => {
        const clone = card.cloneNode(true);
        clone.dataset.sightIndex = String(setIndex * originalSightCount + cardIndex);
        if (setIndex !== 1) clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    }
    sightCards = Array.from(track.children);
    activeSight = originalSightCount;
    sightCards.forEach(card => {
      card.addEventListener('click', () => selectSightCard(card, true));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSightCard(card, true); } });
    });
    track.addEventListener('transitionend', e => { if (e.target === track) normalizeSightSlider(); });
    if (nativeSlider) {
      const setWidth = () => sightCards[originalSightCount].offsetLeft - sightCards[0].offsetLeft;
      requestAnimationFrame(() => { track.scrollLeft = setWidth(); });
      let settle = 0;
      track.addEventListener('scroll', () => {
        clearTimeout(settle);
        settle = setTimeout(() => {                      // after the swipe has fully stopped, quietly jump to the same card in the middle set
          const w = setWidth(); if (!w) return;
          if (track.scrollLeft < w * 0.5) track.scrollLeft += w;
          else if (track.scrollLeft > w * 1.5) track.scrollLeft -= w;
        }, 180);
      }, { passive: true });
    }
    updateSightSlider();
  }
  function updateSightSlider() {
    if (!sightCards.length) return;
    const cardWidth = sightCards[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    if (nativeSlider) { set('--sights-shift', '0px'); return; }
    set('--sights-shift', `${-(cardWidth + gap) * activeSight}px`);
    sightCards.forEach((c, i) => c.classList.toggle('is-active', i === activeSight));
  }
  function moveSightSlider(dir) {
    if (nativeSlider) { const w = sightCards[0].offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0); track.scrollBy({ left: dir * w, behavior: 'smooth' }); return; }
    activeSight += dir; updateSightSlider();
  }
  function selectSightCard(card, navigate) {
    if (nativeSlider) { if (navigate) goToService(card.dataset.service); return; }
    const i = Number(card.dataset.sightIndex);
    if (Number.isFinite(i)) { activeSight = i; updateSightSlider(); }
    if (navigate) goToService(card.dataset.service);
  }
  function jumpSightSlider(i) {
    track.classList.add('is-jumping'); activeSight = i; updateSightSlider();
    requestAnimationFrame(() => requestAnimationFrame(() => track.classList.remove('is-jumping')));
  }
  function normalizeSightSlider() {
    if (activeSight >= originalSightCount * 2) jumpSightSlider(activeSight - originalSightCount);
    else if (activeSight < originalSightCount) jumpSightSlider(activeSight + originalSightCount);
  }
  // clicking a service card takes the visitor to the matching card in "What We Offer"
  function goToService(name) {
    const cards = Array.from(document.querySelectorAll('#services .svc-card'));
    const target = cards.find(c => (c.querySelector('h4') || {}).textContent === name) || document.getElementById('services');
    if (!target) return;
    const y = target.getBoundingClientRect().top + scrollY - 110;
    window.scrollTo({ top: y, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    if (target.classList) { target.classList.add('svc-flash'); setTimeout(() => target.classList.remove('svc-flash'), 2200); }
  }

  addEventListener('scroll', requestTick, { passive: true });
  addEventListener('resize', () => { updateSightSlider(); requestTick(); });
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; targetMouseX = e.clientX / innerWidth - 0.5; targetMouseY = e.clientY / VH() - 0.5; requestTick(); }, { passive: true });
  // swipe / drag (mouse, pen, touch) and horizontal trackpad scroll: drag left = next service
  let dragX = null, dragY = 0, dragged = 0, dragAxis = '', dragT0 = 0, wheelAcc = 0, lastWheel = 0, wheelLocked = false;
  const cancelDrag = () => { if (dragX === null) return; dragX = null; dragged = 0; dragAxis = ''; track.classList.remove('dragging'); set('--drag', '0px'); };
  track.addEventListener('pointerdown', e => { if (nativeSlider) return; dragX = e.clientX; dragY = e.clientY; dragged = 0; dragAxis = ''; dragT0 = performance.now(); });
  addEventListener('pointermove', e => {
    if (dragX === null) return;
    const dx = e.clientX - dragX, dy = e.clientY - dragY;
    // decide once, after the finger has moved a little, whether this is a sideways swipe or a page scroll
    if (!dragAxis && Math.hypot(dx, dy) > 16) dragAxis = Math.abs(dx) >= Math.abs(dy) * 0.7 ? 'x' : 'y';
    if (dragAxis === 'y') { cancelDrag(); return; }
    if (dragAxis !== 'x') return;
    dragged = dx;
    track.classList.add('dragging'); set('--drag', `${dragged}px`);
  });
  addEventListener('pointercancel', () => { if (dragAxis === 'x') finishDrag(); else cancelDrag(); });
  function finishDrag() {
    if (dragX === null) return;
    const width = sightCards[0] ? sightCards[0].offsetWidth : 300;
    const speed = Math.abs(dragged) / Math.max(1, performance.now() - dragT0);   // px per ms
    const go = dragAxis === 'x' && (Math.abs(dragged) > width * 0.18 || (Math.abs(dragged) > 30 && speed > 0.35));
    const dir = dragged < 0 ? 1 : -1;
    track.classList.remove('dragging'); set('--drag', '0px');
    dragX = null; dragAxis = '';
    if (go) moveSightSlider(dir);
  }
  addEventListener('pointerup', finishDrag);
  // a drag should not also count as a click on a card
  track.addEventListener('click', e => { if (Math.abs(dragged) > 6) { e.stopPropagation(); e.preventDefault(); } dragged = 0; }, true);
  // horizontal trackpad swipe: one swipe = one card.
  // - a pause of 200ms ends a swipe, so tiny sideways wobbles while scrolling never add up
  // - after a move, the swipe's fading momentum is ignored, but a NEW swipe (movement that grows
  //   again, or goes the other way) is accepted straight away
  let lastAbs = 0, lastSign = 0;
  track.addEventListener('wheel', e => {
    if (nativeSlider) return;
    const now = performance.now();
    const dx = e.deltaX, ax = Math.abs(dx), sign = Math.sign(dx);
    if (now - lastWheel > 200) { wheelAcc = 0; wheelLocked = false; lastAbs = 0; }
    lastWheel = now;
    if (ax <= Math.abs(e.deltaY)) return;                      // mostly up/down: keep scrolling the page
    e.preventDefault();
    if (wheelLocked && (sign !== lastSign || (ax > lastAbs * 1.6 && ax > 6))) { wheelLocked = false; wheelAcc = 0; }
    lastAbs = ax; lastSign = sign;
    if (wheelLocked) return;                                   // fading momentum of the last swipe
    wheelAcc += dx;
    if (Math.abs(wheelAcc) > 50) { moveSightSlider(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; wheelLocked = true; }
  }, { passive: false });
  prev.addEventListener('click', () => moveSightSlider(-1));
  next.addEventListener('click', () => moveSightSlider(1));
  setupSightSlider();
  requestTick();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { updateSightSlider(); requestTick(); });

  // closing scene: gentle photo settle when it comes into view
  const fin = document.querySelector('.cinema-final');
  if (fin && 'IntersectionObserver' in window) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { fin.classList.add('in'); o.disconnect(); } }, { threshold: .25 }).observe(fin);
  } catch (err) {
    // anything unexpected on an unusual device: fall back to the simple version instead of a broken page
    document.documentElement.classList.add('simple-mode'); console.warn('[DPI] opening animation turned off:', err);
  }
})();
