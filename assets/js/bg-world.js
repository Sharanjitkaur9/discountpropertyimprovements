/* =====================================================================
   One continuous moving world behind the whole site.
   A fixed backdrop of real architectural photography that is always in
   motion: slow camera drift (Ken Burns), scroll parallax, drifting haze,
   warm light sweeps and floating dust. As each section reaches the middle
   of the screen the scene cross-fades to the photo assigned to it, so the
   page reads as one journey instead of separate boxes. It starts on the
   same facade frame the cinematic opening ends on.
   ===================================================================== */
(() => {
  'use strict';
  const root = document.getElementById('bgworld');
  if (!root) return;
  const d0 = document.documentElement;
  d0.classList.add('has-3d', 'has-world');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;   // phones/tablets
  const scenes = Array.from(root.querySelectorAll('.bw-scene'));
  const byName = n => scenes.find(s => s.dataset.scene === n) || scenes[0];

  // which photo sits behind which part of the page
  const map = [
    ['.cinema-final', 'facade'], ['.hero', 'street'], ['#services', 'facade'], ['#reviews', 'steps'],
    ['#faq', 'street'], ['#quote', 'interior'], ['#contact', 'facade']
  ].map(([sel, scene]) => ({ el: document.querySelector(sel), scene })).filter(x => x.el);

  let current = null;
  const show = name => {
    // the street photo is a small portrait image: sharp on phones, too soft stretched across a desktop screen
    if (name === 'street' && innerWidth >= 760) name = 'facade';
    if (name === current) return;
    current = name;
    scenes.forEach(s => s.classList.toggle('on', s.dataset.scene === name));
  };

  // pick the section whose box covers the middle of the screen
  const pick = () => {
    const mid = innerHeight * 0.5;
    let best = map[0];
    for (const m of map) { const r = m.el.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) { best = m; break; } if (r.top < mid) best = m; }
    show(best.scene);
    // the world stays hidden behind the opaque cinematic stage, then fades in as it releases
    const cine = document.querySelector('.cinema-scroll');
    const vis = cine ? Math.min(1, Math.max(0, (innerHeight - cine.getBoundingClientRect().bottom) / (innerHeight * 0.4) + 0.999)) : 1;
    if (!coarse) root.style.setProperty('--world-y', `${(-scrollY * 0.04 % 60).toFixed(1)}px`);
  };

  // floating dust in warm light
  const dust = () => {
    if (reduce || d0.classList.contains('simple-mode')) return;
    const cv = root.querySelector('canvas'); const c = cv.getContext('2d');
    let W, H, P;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      P = Array.from({ length: W < 760 ? 40 : 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: .5 + Math.random() * 1.8, vx: .05 + Math.random() * .22, vy: -.04 - Math.random() * .14, p: Math.random() * 6.28, d: .4 + Math.random() * .6 }));
    };
    size(); addEventListener('resize', size);
    let lastY = scrollY;
    const tick = () => {
      requestAnimationFrame(tick);
      if (document.hidden) return;
      const dy = scrollY - lastY; lastY = scrollY;
      c.clearRect(0, 0, W, H);
      for (const d of P) {
        d.x += d.vx; d.y += d.vy - dy * 0.05 * d.d; d.p += .015;   // dust drifts and responds to scroll depth
        if (d.x > W + 5) d.x = -5; if (d.y < -5) d.y = H + 5; if (d.y > H + 5) d.y = -5;
        const a = (.18 + .32 * Math.sin(d.p) ** 2) * d.d;
        c.fillStyle = `rgba(255, 226, 186, ${a.toFixed(3)})`; c.beginPath(); c.arc(d.x, d.y, d.r, 0, 6.283); c.fill();
      }
    };
    requestAnimationFrame(tick);
  };

  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; pick(); }); } }, { passive: true });
  addEventListener('resize', pick);
  pick(); dust();
  requestAnimationFrame(() => root.classList.add('ready'));
})();
