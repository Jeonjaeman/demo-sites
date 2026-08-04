(() => {
  const D = window.PINGUARD;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const V = {
    block:  { label: "그대로는 위법", cls: "block" },
    review: { label: "조건부·재설계", cls: "review" },
    pass:   { label: "준법", cls: "pass" }
  };

  /* 요약 카운트 */
  const counts = { block: 0, review: 0, pass: 0 };
  D.compliance.forEach((c) => counts[c.verdict]++);
  $("[data-c-block]").textContent = counts.block;
  $("[data-c-review]").textContent = counts.review;
  $("[data-c-pass]").textContent = counts.pass;

  const host = $("[data-compliance-list]");
  const render = (filter = "all") => {
    const items = filter === "all" ? D.compliance : D.compliance.filter((c) => c.verdict === filter);
    host.replaceChildren(...items.map((c, i) => {
      const v = V[c.verdict];
      const card = document.createElement("article");
      card.className = "c-card reveal";
      card.dataset.delay = String(Math.min(i * 50, 250));
      card.innerHTML =
        `<div class="c-top"><span class="signal ${v.cls}">${v.label}</span>` +
        `<span class="c-req">${c.req}</span></div>` +
        `<h3 class="c-title">${c.title}</h3>` +
        (c.law && c.law !== "-" ? `<p class="c-law"><b>근거</b> ${c.law}</p>` : "") +
        `<p class="c-why">${c.why}</p>` +
        `<div class="c-fix"><b>준법 대안</b><p>${c.fix}</p></div>`;
      return card;
    }));
    runReveal();
  };

  const runReveal = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight || 900;
    $$(".reveal:not(.is-visible)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.95 && r.bottom > 0) {
        el.style.transitionDelay = Math.min(Number(el.dataset.delay || 0), 250) + "ms";
        el.classList.add("is-visible");
      }
    });
  };
  window.addEventListener("scroll", runReveal, { passive: true });
  window.addEventListener("resize", runReveal);

  $$("[data-c-filter]").forEach((b) => b.addEventListener("click", () => {
    $$("[data-c-filter]").forEach((x) => x.classList.toggle("is-active", x === b));
    render(b.dataset.cFilter);
  }));

  render();
})();
