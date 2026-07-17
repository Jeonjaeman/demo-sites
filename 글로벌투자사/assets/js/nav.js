/* ============================================================
   Chrome only — for the statically generated pages.
   index.html has app.js, which owns its own header and menu;
   these pages need the burger and the scrolled border, nothing
   more. Kept separate so a content page does not download the
   portfolio filter engine.
   ============================================================ */

(function () {
  'use strict';

  const hd  = document.getElementById('hd');
  const nav = document.getElementById('nav');
  const btn = document.getElementById('navBtn');

  if (hd) {
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        hd.classList.toggle('is-stuck', scrollY > 8);
        ticking = false;
      });
    }, { passive: true });
  }

  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }));
  }
})();
