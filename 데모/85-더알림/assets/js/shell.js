/* 공통 GNB(메가메뉴 3겹 시차·모바일 드로어)·LNB·푸터·FAB 주입 — Samsung CSR 골격 (gnb.css·footer.css 실측) */
(function () {
  document.documentElement.classList.add("js");
  const page = location.pathname.split("/").pop() || "index.html";
  const q = new URLSearchParams(location.search);
  /* 1뎁스 4 × 2뎁스 (삼성: Our Vision/Story/Program/Newsroom → 더알림: 교육출강/프로그램·강사/자격·콘텐츠/소식·회사) */
  const NAV = [
    { id:"outreach", t:"교육출강", lnb:"교육출강", items:[["outreach.html?c=youth","청소년 교육센터","학교·청소년기관"],["outreach.html?c=corp","기업 HRD 컨설팅","대기업·중견·스타트업"],["outreach.html?c=medical","병원 메디컬센터","CS·리더십·조직관리"],["outreach.html?c=public","공공기관·지자체","민원·청렴·안전"]] },
    { id:"program", t:"프로그램·강사", lnb:"프로그램·강사", items:[["programs.html","프로그램 카탈로그","47개 과정 · 필터"],["lecturers.html","강사진","2,000명 · 공개 범위"],["request.html","맞춤 제안서 요청","4단계 · 즉시 추천"]] },
    { id:"cert", t:"자격·콘텐츠", lnb:"자격·콘텐츠", items:[["certificates.html","민간자격증","32종 · 표시 블록"],["consulting.html","개인컨설팅","1:1 7개 과정"],["academy.html","아카데미","명사초청 · 특강"],["about.html#contents","교재·VOD 제작","출판·영상"]] },
    { id:"news", t:"소식·회사", lnb:"소식·회사", items:[["cases.html","현장 사례","담당자 평가 · 기록"],["news.html","언론보도·공지","수상 · 협약"],["partners.html","함께한 곳","기관 100+"],["about.html","회사소개","비전 · 협회 · 오시는 길"],["contact.html","문의","15초 상담 · 제휴 · 강사 지원"]] },
  ];
  const cur = (href) => { const [f, qq] = href.split("?"); const [file] = f.split("#"); if (file !== page) return false; if (qq) return location.search.includes(qq); return true; };
  const group = NAV.find(g => g.items.some(i => cur(i[0]))) || (page === "index.html" ? null : null);
  const gnb = `<header class="gnb" id="gnb">
    <div class="gnb-in">
      <a class="logo" href="index.html" aria-label="더알림 홈">더알림 <small>THE ALRIM</small></a>
      <nav aria-label="주 메뉴"><ul class="gnb-nav">${NAV.map(g => `<li data-g="${g.id}"><button type="button" aria-haspopup="true" aria-expanded="false">${g.t}</button></li>`).join("")}</ul></nav>
      <div class="gnb-util"><a class="ic" href="lecturer-portal.html">◎ 강사전용</a><a class="ic" href="admin.html">⊕ 관리자</a><a class="ic" href="request.html">제안서 <span class="cart cart-badge" hidden>0</span></a></div>
      <button class="gnb-burger" type="button" aria-label="메뉴" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
    <div class="mega" id="mega"><div class="mega-in">${NAV.map(g => `<div class="mega-g" data-g="${g.id}"><div class="mega-t">${g.t}</div><div class="mega-cols"><div class="mega-col">${g.items.slice(0, Math.ceil(g.items.length/2)).map(i => `<a href="${i[0]}"><span>${i[1]}</span><small>${i[2]}</small></a>`).join("")}</div><div class="mega-col">${g.items.slice(Math.ceil(g.items.length/2)).map(i => `<a href="${i[0]}"><span>${i[1]}</span><small>${i[2]}</small></a>`).join("")}</div></div></div>`).join("")}</div></div>
  </header>
  <div class="mega-dim" id="megaDim"></div>
  <div class="drawer-dim" id="drawerDim"></div>
  <aside class="drawer" id="drawer" aria-hidden="true">
    <div class="drawer-h"><button type="button" class="back" id="drawerBack" hidden>‹ <span></span></button><span class="logo" style="font-size:1.8rem">더알림</span><button type="button" class="x" id="drawerX" aria-label="닫기">✕</button></div>
    <div class="drawer-panel on" data-p="root"><ul class="drawer-l1">${NAV.map(g => `<li><button type="button" data-open="${g.id}">${g.t}</button></li>`).join("")}</ul>
      <div class="drawer-util"><a href="request.html">맞춤 제안서 요청</a><a href="contact.html">빠른 상담 15초</a><a href="lecturer-portal.html">◎ 강사전용</a><a href="admin.html">⊕ 관리자</a></div></div>
    ${NAV.map(g => `<div class="drawer-panel" data-p="${g.id}"><ul class="drawer-l2">${g.items.map(i => `<li><a href="${i[0]}">${i[1]}</a></li>`).join("")}</ul></div>`).join("")}
  </aside>`;
  const lnb = group ? `<div class="lnb" id="lnb"><div class="lnb-in"><span class="lnb-t">${group.lnb}</span><nav class="lnb-links">${group.items.filter(i => !i[0].includes("#")).map(i => `<a href="${i[0]}">${i[1]}</a>`).join("")}</nav></div></div><div class="lnb-pad"></div>` : "";
  const footer = `<footer class="ft">
    <div class="ft-map">
      <div class="ft-col"><h4>교육출강</h4><div><a href="outreach.html?c=youth">청소년 교육센터</a><a href="outreach.html?c=corp">기업 HRD 컨설팅</a><a href="outreach.html?c=medical">병원 메디컬센터</a><a href="outreach.html?c=public">공공기관·지자체</a></div></div>
      <div class="ft-col"><h4>프로그램·강사</h4><div><a href="programs.html">프로그램 카탈로그</a><a href="lecturers.html">강사진</a><a href="request.html">맞춤 제안서 요청</a><a href="lecturer-portal.html">강사전용</a></div></div>
      <div class="ft-col"><h4>자격·콘텐츠</h4><div><a href="certificates.html">민간자격증</a><a href="consulting.html">개인컨설팅</a><a href="academy.html">아카데미</a><a href="about.html#contents">교재·VOD 제작</a></div></div>
      <div class="ft-col"><h4>소식·회사</h4><div><a href="cases.html">현장 사례</a><a href="news.html">언론보도·공지</a><a href="partners.html">함께한 곳</a><a href="about.html">회사소개</a><a href="contact.html">문의</a><a href="admin.html">관리자</a></div></div>
    </div>
    <div class="ft-copy"><div>(주)더알림 · 대표 김경림 · 사업자등록번호 535-81-02819 · 통신판매업 신고 제2023-서울금천-0325호 · 서울 강남구 도곡로 123 대경빌딩 2층 · 0507-1322-2916 · thealrim7@gmail.com<br>© <span id="year"></span> THE ALRIM. All rights reserved. 리뉴얼 제안 데모 — 강사·사례·수치·자격 등록번호는 가상입니다.</div></div>
    <div class="ft-bot"><div class="l"><a href="#" onclick="return false">개인정보처리방침</a><a href="#" onclick="return false">이용약관</a><a href="https://blog.naver.com/bkh2457" target="_blank" rel="noopener">블로그</a><a href="#" onclick="return false">카카오톡 채널</a></div><span class="live" id="ftLive"><i></i><span></span></span></div>
  </footer>
  <button class="fab" id="fab" type="button" aria-label="맨 위로">↑</button>`;
  const mount = document.getElementById("hd"); if (mount) mount.outerHTML = gnb + lnb; else document.body.insertAdjacentHTML("afterbegin", gnb + lnb);
  const fmount = document.getElementById("ft"); if (fmount) fmount.outerHTML = footer; else document.body.insertAdjacentHTML("beforeend", footer);
  if (!document.querySelector("link[rel=icon]")) document.head.insertAdjacentHTML("beforeend", `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#000"/><text x="16" y="22" font-size="17" font-family="sans-serif" font-weight="700" fill="#fff" text-anchor="middle">알</text></svg>')}">`);
  /* 현재 페이지 표시 */
  document.querySelectorAll(".mega a, .lnb-links a, .drawer-l2 a, .ft-col a").forEach(a => { if (cur(a.getAttribute("href"))) a.setAttribute("aria-current", "page"); });
  if (group) { const b = document.querySelector(`.gnb-nav li[data-g="${group.id}"] > button`); if (b) b.setAttribute("aria-current", "page"); }
  /* 메가메뉴: hover·focus·click → 패널(.3s .1s) → 내용(.4/.5s) → 딤(.6s) */
  const hd = document.getElementById("gnb"), dim = document.getElementById("megaDim"); let closeT;
  const open = id => { clearTimeout(closeT); document.querySelectorAll(".mega-g").forEach(g => g.classList.toggle("on", g.dataset.g === id)); document.querySelectorAll(".gnb-nav li").forEach(li => { const on = li.dataset.g === id; li.classList.toggle("open", on); li.querySelector("button").setAttribute("aria-expanded", on); }); hd.classList.add("open"); dim.classList.add("on"); };
  const close = () => { hd.classList.remove("open"); dim.classList.remove("on"); document.querySelectorAll(".gnb-nav li").forEach(li => { li.classList.remove("open"); li.querySelector("button").setAttribute("aria-expanded", "false"); }); };
  document.querySelectorAll(".gnb-nav li").forEach(li => { li.addEventListener("mouseenter", () => open(li.dataset.g)); li.querySelector("button").addEventListener("focus", () => open(li.dataset.g)); li.querySelector("button").addEventListener("click", () => hd.classList.contains("open") && li.classList.contains("open") ? close() : open(li.dataset.g)); });
  hd.addEventListener("mouseleave", () => { closeT = setTimeout(close, 120); }); hd.addEventListener("mouseenter", () => clearTimeout(closeT));
  dim.addEventListener("click", close); addEventListener("keydown", e => { if (e.key === "Escape") { close(); drawerClose(); } });
  /* 모바일 드로어 (.3s cubic-bezier(.6,0,.4,1)) */
  const dr = document.getElementById("drawer"), drDim = document.getElementById("drawerDim"), burger = document.querySelector(".gnb-burger"), back = document.getElementById("drawerBack");
  const drawerOpen = () => { dr.classList.add("open"); drDim.classList.add("on"); dr.setAttribute("aria-hidden", "false"); burger.setAttribute("aria-expanded", "true"); document.body.classList.add("no-scroll"); };
  const drawerClose = () => { dr.classList.remove("open"); drDim.classList.remove("on"); dr.setAttribute("aria-hidden", "true"); burger.setAttribute("aria-expanded", "false"); document.body.classList.remove("no-scroll"); showPanel("root"); };
  const showPanel = id => { dr.querySelectorAll(".drawer-panel").forEach(p => p.classList.toggle("on", p.dataset.p === id)); back.hidden = id === "root"; const g = NAV.find(x => x.id === id); if (g) back.querySelector("span").textContent = g.t; };
  burger.addEventListener("click", drawerOpen); document.getElementById("drawerX").addEventListener("click", drawerClose); drDim.addEventListener("click", drawerClose);
  dr.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => showPanel(b.dataset.open))); back.addEventListener("click", () => showPanel("root"));
  /* LNB 고정 + FAB(위로 스크롤 시만) */
  const lnbEl = document.getElementById("lnb"), fab = document.getElementById("fab"); let last = 0, dir = "down";
  addEventListener("scroll", () => { const y = scrollY; if (lnbEl) document.body.classList.toggle("lnb-fixed", y > hd.offsetHeight);
    if (y > 300 && y < last && dir !== "up") { dir = "up"; fab.classList.add("on"); } else if ((y > last || y <= 300) && dir !== "down") { dir = "down"; fab.classList.remove("on"); } last = y; }, { passive: true });
  fab.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  /* 푸터 모바일 아코디언 · 실시간 상담 표시 · 연도 */
  document.querySelectorAll(".ft-col h4").forEach(h => h.addEventListener("click", () => { if (innerWidth <= 767) h.parentElement.classList.toggle("open"); }));
  { const l = document.getElementById("ftLive"); const now = new Date(), h = now.getHours(), on = h >= 10 && h < 20; l.classList.toggle("on", on); l.querySelector("span").textContent = on ? `지금 상담 가능 · ${String(h).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")} KST · 0507-1322-2916` : `상담 시간 외 · 10:00에 다시 열립니다 · 0507-1322-2916`; }
  const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
})();
