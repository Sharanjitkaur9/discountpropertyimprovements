/* Consultation chat: plays the example conversation once, like a real chat —
   each reply is preceded by a short "typing…" bubble. Without JS (or with
   reduced motion) every message is simply shown. */
(() => {
  'use strict';
  const chat = document.querySelector('.dpi-chat');
  if (!chat || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const body = chat.querySelector('.dc-body');
  const msgs = Array.from(body.querySelectorAll('.dc-msg'));
  chat.classList.add('dc-anim');
  const typing = document.createElement('div');
  typing.className = 'dc-msg them dc-typing';
  typing.innerHTML = (body.querySelector('.dc-msg.them .dc-av') || {}).outerHTML + '<div><p><i></i><i></i><i></i></p></div>';
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const toBottom = () => body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
  const play = async () => {
    for (const m of msgs) {
      if (m.classList.contains('them')) {
        body.insertBefore(typing, m); typing.classList.add('in'); toBottom();
        await wait(1400);
        typing.classList.remove('in'); typing.remove();
      } else await wait(900);
      m.classList.add('in'); toBottom();
      await wait(500);
    }
    // hold the finished chat, fade it out, then start again: it never stops
    await wait(4500);
    body.classList.add('dc-fade');
    await wait(700);
    msgs.forEach(m => m.classList.remove('in'));
    body.scrollTop = 0;
    body.classList.remove('dc-fade');
    await wait(600);
    play();
  };
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); play(); } }, { threshold: 0.35 });
  io.observe(chat);
})();
