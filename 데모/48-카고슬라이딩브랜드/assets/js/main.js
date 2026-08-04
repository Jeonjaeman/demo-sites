/* PANDORA FACTORY — interactions */
(function () {
  "use strict";

  /* ---- Mobile nav ---- */
  var burger = document.querySelector(".burger");
  var mnav = document.querySelector(".m-nav");
  if (burger && mnav) {
    burger.addEventListener("click", function () { mnav.classList.add("open"); });
    mnav.querySelector(".close").addEventListener("click", function () { mnav.classList.remove("open"); });
    mnav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { mnav.classList.remove("open"); });
    });
  }

  /* ---- Hero slider (video + ken-burns images) ---- */
  var hero = document.querySelector(".hero");
  if (hero) {
    var slides = hero.querySelectorAll(".hero-slide");
    var dots = hero.querySelectorAll(".hero-dots button");
    var idxEl = hero.querySelector(".hero-idx");
    var cur = 0, timer = null;
    var DUR = 7000;

    function go(n) {
      slides[cur].classList.remove("active");
      if (dots[cur]) dots[cur].classList.remove("on");
      var v0 = slides[cur].querySelector("video");
      if (v0) v0.pause();
      cur = (n + slides.length) % slides.length;
      slides[cur].classList.add("active");
      if (dots[cur]) dots[cur].classList.add("on");
      if (idxEl) idxEl.textContent = "0" + (cur + 1) + " / 0" + slides.length;
      var v = slides[cur].querySelector("video");
      if (v) { v.currentTime = 0; v.play().catch(function () {}); }
      restart();
    }
    function restart() {
      clearInterval(timer);
      var d = parseInt(slides[cur].dataset.dur, 10) || DUR;
      timer = setInterval(function () { go(cur + 1); }, d);
    }
    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { go(i); });
    });
    var arrPrev = hero.querySelector(".hero-arr.prev");
    var arrNext = hero.querySelector(".hero-arr.next");
    if (arrPrev) arrPrev.addEventListener("click", function () { go(cur - 1); });
    if (arrNext) arrNext.addEventListener("click", function () { go(cur + 1); });
    var first = slides[0] && slides[0].querySelector("video");
    if (first) first.play().catch(function () {});
    restart();
  }

  /* ---- Reveal on scroll ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---- Counters ---- */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target;
      var target = parseFloat(el.dataset.count);
      var t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1400, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll("[data-count]").forEach(function (el) { cio.observe(el); });

  /* ---- Marquee: duplicate track for seamless loop ---- */
  document.querySelectorAll(".marquee").forEach(function (m) {
    var track = m.querySelector(".marquee-track");
    if (track) m.appendChild(track.cloneNode(true));
  });

  /* ---- Video tabs (product detail) ---- */
  var vtabs = document.querySelector(".vtabs");
  if (vtabs) {
    var player = document.querySelector(".vwrap video");
    vtabs.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        vtabs.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        player.src = b.dataset.src;
        player.play().catch(function () {});
      });
    });
  }

  /* ---- Gallery lightbox ---- */
  var lb = document.querySelector(".lb");
  if (lb) {
    var lbImg = lb.querySelector("img");
    document.querySelectorAll("[data-lb]").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        lbImg.src = a.getAttribute("href");
        lb.classList.add("open");
      });
    });
    lb.addEventListener("click", function () { lb.classList.remove("open"); });
  }

  /* ---- Hotspots ---- */
  document.querySelectorAll(".hs").forEach(function (b) {
    b.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var tip = document.getElementById(b.dataset.tip);
      var was = tip.classList.contains("show");
      document.querySelectorAll(".hs-tip").forEach(function (t) { t.classList.remove("show"); });
      if (!was) tip.classList.add("show");
    });
  });
  document.addEventListener("click", function () {
    document.querySelectorAll(".hs-tip").forEach(function (t) { t.classList.remove("show"); });
  });

  /* ---- Before / After slider ---- */
  document.querySelectorAll(".ba").forEach(function (ba) {
    var after = ba.querySelector(".after");
    var handle = ba.querySelector(".handle");
    function setX(clientX) {
      var r = ba.getBoundingClientRect();
      var x = Math.max(0, Math.min(clientX - r.left, r.width));
      var pct = (x / r.width) * 100;
      after.style.width = pct + "%";
      handle.style.left = pct + "%";
    }
    setX(ba.getBoundingClientRect().left + ba.getBoundingClientRect().width / 2);
    function move(ev) { setX(ev.touches ? ev.touches[0].clientX : ev.clientX); }
    ba.addEventListener("mousedown", function (ev) {
      move(ev);
      function up() { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); }
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    });
    ba.addEventListener("touchstart", move, { passive: true });
    ba.addEventListener("touchmove", move, { passive: true });
  });

  /* ---- Contact form (mock for local build) ---- */
  var form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      alert("문의가 정상적으로 접수되었습니다. 빠른 시일 내 연락드리겠습니다.");
      form.reset();
    });
  }
})();
