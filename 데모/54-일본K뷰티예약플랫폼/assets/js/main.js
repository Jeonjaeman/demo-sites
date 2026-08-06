/* MIYABI Seoul — 공통 모션·내비 */
(() => {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav scroll state */
  const nav = $('.nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* burger */
  const burger = $('.nav-burger'), links = $('.nav-links');
  if (burger) burger.addEventListener('click', () => {
    burger.classList.toggle('x'); links.classList.toggle('open');
  });
  if (links) $$('.nav-links a').forEach(a => a.addEventListener('click', () => {
    burger?.classList.remove('x'); links.classList.remove('open');
  }));

  /* lang switch */
  $$('.lang-sw button').forEach(b => {
    b.classList.toggle('on', b.dataset.lang === window.MIYABI_LANG);
    b.addEventListener('click', () => { if (b.dataset.lang !== window.MIYABI_LANG) setLang(b.dataset.lang); });
  });

  /* scroll reveal */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* count-up */
  const ease = t => 1 - Math.pow(1 - t, 3);
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, dur = 1400, t0 = performance.now();
    const dec = el.dataset.dec ? 1 : 0;
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = (end * ease(p)).toFixed(dec).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = (+end).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
    };
    reduced ? el.textContent = end.toLocaleString() : requestAnimationFrame(tick);
  }), { threshold: .5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* 카드 3D 틸트 + 스포트라이트 (데스크톱 · 포인터 파인만) */
  if (matchMedia('(pointer:fine)').matches && !reduced) {
    $$('.cat-card').forEach(card => {
      let raf = 0;
      card.addEventListener('pointermove', ev => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = card.getBoundingClientRect();
          const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
          card.style.transform = `perspective(900px) rotateY(${(x - .5) * 7}deg) rotateX(${(.5 - y) * 7}deg)`;
          card.style.setProperty('--mx', (x * 100) + '%');
          card.style.setProperty('--my', (y * 100) + '%');
        });
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* 풀블리드 패럴랙스 */
  const fbs = $$('.fb-bg img, [data-plx]');
  if (fbs.length && !reduced) {
    let raf2 = 0;
    const plx = () => {
      raf2 = 0;
      fbs.forEach(el => {
        const r = el.closest('.fb-sec, .hero, section')?.getBoundingClientRect();
        if (!r || r.bottom < 0 || r.top > innerHeight) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        el.style.transform = `translateY(${p * -46}px) scale(1.12)`;
      });
    };
    addEventListener('scroll', () => { if (!raf2) raf2 = requestAnimationFrame(plx); }, { passive: true });
    plx();
  }

  /* 캐러셀 네비 */
  $$('.car-wrap').forEach(w => {
    const car = $('.car', w);
    $('.car-prev', w)?.addEventListener('click', () => car.scrollBy({ left: -car.firstElementChild.offsetWidth - 18, behavior: 'smooth' }));
    $('.car-next', w)?.addEventListener('click', () => car.scrollBy({ left: car.firstElementChild.offsetWidth + 18, behavior: 'smooth' }));
  });

  /* 텍스트 스크럽 (⑤ — 스크롤에 따라 단어가 또렷해짐) */
  $$('.scrub-line').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    const ws = $$('.w', el);
    const upd = () => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * .82 - r.top) / (innerHeight * .6)));
      const n = Math.floor(p * ws.length);
      ws.forEach((w, i) => w.classList.toggle('on', i < n));
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  });

  /* toast */
  window.toast = msg => {
    let el = $('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('on');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2600);
  };

  applyI18n();
})();
