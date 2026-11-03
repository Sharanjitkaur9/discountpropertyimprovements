/* =====================================================================
   Floating sections — every panel drifts in from below with a slight
   backward tilt, settles flat while you read it, then tilts away as it
   leaves; at rest it bobs a few pixels, as if floating over the 3D scene.
   Uses the individual CSS translate/rotate/scale properties so it never
   fights the existing reveal or hover transforms.
   ===================================================================== */
(() => {
  'use strict';
  if (document.documentElement.classList.contains('simple-mode')) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const formCard = document.getElementById('section-quote-form');
  // float the individual pieces (no container boxes any more)
  const els = Array.from(document.querySelectorAll('.hero-card, #services .bento > .card, #initial-reviews-grid > .card, .cinema-final .cf-photo'))
    .concat(formCard ? [formCard.parentElement] : []);
  if (!els.length) return;
  els.forEach((el, i) => { el.classList.add('fp'); el._phase = i * 1.7; });
  // touch screens: cards stay perfectly still (scroll-linked motion looks shaky with finger scrolling)
  if (reduce || (matchMedia('(pointer: coarse)').matches || document.documentElement.classList.contains('touch-lite'))) { els.forEach(el => el.classList.add('fp-in')); return; }
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = x => 1 - Math.pow(1 - x, 3);

  const tick = now => {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    const vh = innerHeight, t = now / 1000, small = innerWidth < 760;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const span = vh * (small ? 0.45 : 0.6);
      const enter = ease(clamp((vh - r.top) / span));    // 0 → 1 as the top comes up the screen
      const leave = ease(clamp(r.bottom / span));         // 1 → 0 as the bottom goes off the top
      const f = Math.min(enter, leave);
      const dir = enter < leave ? 1 : -1;                 // arriving (1) or leaving (-1)
      const off = 1 - f;
      const bob = 0;   // cards stay still at rest; they only move as you scroll
      const y = dir * off * (small ? 40 : 80) + bob;
      el.style.translate = `0 ${y.toFixed(1)}px`;
      el.style.rotate = `x ${(dir * off * (small ? 4 : 7)).toFixed(2)}deg`;
      el.style.scale = (1 - off * 0.05).toFixed(4);
      // bronze edge glow peaks as a panel arrives
      const edge = clamp(1 - Math.abs(r.top - vh * 0.5) / (vh * 0.35));
      el.style.setProperty('--edge', (edge * (r.top > 0 ? 1 : 0)).toFixed(3));
      if (enter > 0.04) el.classList.add('fp-in');
    }
  };
  requestAnimationFrame(tick);
})();
