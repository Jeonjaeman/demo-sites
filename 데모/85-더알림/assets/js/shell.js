/* 더알림 v2 — 공통 셸 (천만문화재단 GNB·전체메뉴·일정 드로어·퀵메뉴·모바일 탭바·인디고 푸터 실측 재현)
   GNB 119px · 1뎁스 20/600 · 단일 이동형 서브메뉴 패널 280w (height .6s / x .45s cubic-bezier(.4,.1,.1,1), 닫힘 150ms 지연, 딤 .5 .4s)
   전체메뉴 4열(센터 4 = 열 4) 사진 hover(opacity .7s · scale 1.08→1 1.2s) + 하단 인디고 바 108
   스크롤 방향 내비 숨김(power2.in .35s / out .45s, 홈 50vh · 서브 80px) · 모바일 ≤1024 햄버거 + 하단 탭바 5칸 */
(function () {
  const page = location.pathname.split("/").pop() || "index.html";
  const NAV = [
    { id:"outreach", t:"교육출강", img:"center-youth", items:[["outreach.html?c=youth","청소년 교육센터","학교·청소년기관 · 진로·취업"],["outreach.html?c=corp","기업 HRD 컨설팅","대기업·중견·스타트업"],["outreach.html?c=medical","병원 메디컬센터","CS·리더십·조직관리"],["outreach.html?c=public","공공기관·지자체","소통·안전·법정의무"]] },
    { id:"program", t:"프로그램·강사", img:"case-corp", items:[["programs.html","프로그램 카탈로그","47개 과정 · 필터"],["lecturers.html","강사진","2,000명 · 공개 범위"],["request.html","맞춤 제안서 요청","5단계 · 즉시 추천"]] },
    { id:"cert", t:"자격·콘텐츠", img:"cert-exam", items:[["certificates.html","민간자격증","32종 · 표시 블록"],["consulting.html","개인컨설팅","1:1 7개 과정"],["academy.html","아카데미","명사초청 · 특강"],["about.html#contents","교재·VOD 제작","출판·영상"]] },
    { id:"news", t:"소식·회사", img:"about-office", items:[["cases.html","현장 사례","담당자 평가 · 기록"],["news.html","언론보도·공지","수상 · 협약"],["partners.html","함께한 곳","기관 64"],["about.html","회사소개","비전 · 연혁 · 협회"],["contact.html","문의","15초 상담 · 제휴 · 강사 지원"]] },
  ];
  const cur = href => { const [f, qq] = href.split("?"); const [file] = f.split("#"); if (file !== page) return false; if (qq) return location.search.includes(qq); return true; };
  const group = NAV.find(g => g.items.some(i => cur(i[0])));
  const crumb = group ? [group, group.items.find(i => cur(i[0]))] : null;
  window.ALRIM_NAV = NAV; window.ALRIM_CRUMB = crumb;

  const nav = `<header class="nav" id="nav">
    <div class="nav-in">
      <a class="logo" href="index.html" aria-label="더알림 홈">더알림<small>THE ALRIM</small></a>
      <nav class="nav-menu" aria-label="주 메뉴">${NAV.map(g => `<a href="${g.items[0][0]}" data-id="${g.id}" ${group && group.id === g.id ? 'aria-current="page"' : ""}>${g.t}</a>`).join("")}</nav>
      <div class="nav-util">
        <a class="pc" href="request.html" aria-label="제안서 담기"><span style="position:relative;display:grid;place-items:center"><i class="nic ic-bell"></i><span class="cart-badge" hidden style="position:absolute;top:-4px;right:-8px;min-width:1.125rem;height:1.125rem;border-radius:9px;background:var(--primary);color:#fff;font-size:.6875rem;font-weight:700;display:grid;place-items:center;padding:0 .25rem">0</span></span></a>
        <button class="pc" type="button" id="schedBtn" aria-label="교육 일정·모집 안내"><i class="nic ic-clock"></i></button>
        <button type="button" id="allBtn" aria-label="전체메뉴" aria-expanded="false"><i class="nic ic-burger"></i></button>
      </div>
    </div>
    <div class="nav-sub" id="navSub">${NAV.map(g => `<div class="pn" data-submenu="${g.id}">${g.items.map(i => `<a href="${i[0]}">${i[1]}<small>${i[2]}</small></a>`).join("")}</div>`).join("")}</div>
  </header>
  <div class="nav-dim" id="navDim"></div>
  <div class="allmenu" id="allmenu" aria-hidden="true">
    <div class="hd"><a class="logo" href="index.html">더알림<small>THE ALRIM</small></a><button type="button" id="allX" aria-label="닫기" style="width:44px;height:44px;display:grid;place-items:center"><i class="nic ic-x"></i></button></div>
    <div class="cols">${NAV.map(g => `<div class="col"><img class="bgimg" src="assets/img/${g.img}.webp" alt="" loading="lazy"><div class="in"><button type="button" class="t">${g.t}</button><div class="l2s">${g.items.map(i => `<a class="l2" href="${i[0]}">${i[1]}<small>${i[2]}</small></a>`).join("")}</div></div></div>`).join("")}</div>
    <div class="bar"><span class="sl">가르치는 사람이 <img src="assets/img/hero-main.webp" alt=""> 교육의 전부입니다</span><a class="btn-under w" href="request.html" style="margin-left:auto"><span class="ar prev"></span><span class="in">맞춤 제안서 요청<span class="ar next"></span></span></a></div>
  </div>
  <div class="dim" id="dim"></div>
  <aside class="drawer" id="sched" aria-hidden="true">
    <div class="hd"><span class="t">교육 일정 · 모집 안내</span><button type="button" id="schedX" aria-label="닫기" style="width:44px;height:44px;display:grid;place-items:center"><i class="nic ic-x"></i></button></div>
    <div class="bd">
      <div class="cd"><div class="t">병원 메디컬센터 — 환자경험평가 대응 교육</div><div class="p">6차 평가 대상 887곳 확대 · 11월 집체 접수 중</div><a class="cta sm" href="outreach.html?c=medical">자세히 보기</a></div>
      <div class="cd"><div class="t">2026 하반기 법정의무교육 통합 운영</div><div class="p">4과목 1일 통합 · 12월까지 일정 조율</div><a class="cta sm ink" href="programs.html?legal=1">과정 보기</a></div>
      <div class="cd"><div class="t">아카데미 명사초청강연 11월 2회</div><div class="p">11.12 강남본사 · 11.26 온라인 · 잔여석 실시간</div><a class="cta sm ink" href="academy.html">일정 확인</a></div>
      <div class="cd"><div class="t">민간자격 2027 상반기 과정 개강</div><div class="p">병원코디네이터 1·2급 외 28종 · 환불 규정 표시</div><a class="cta sm ink" href="certificates.html">자격 보기</a></div>
      <div class="cd"><div class="t">강사 모집 — 병원 CS · 법정의무 인정자격</div><div class="p">심사제 · 초대코드 발송 · 7영업일 회신</div><a class="cta sm gray" href="contact.html#apply">강사 지원</a></div>
    </div>
  </aside>
  <div class="quick"><button type="button" class="top" id="toTop" aria-label="맨 위로">↑</button><a class="q1" href="contact.html">1:1 문의</a></div>
  <nav class="tabbar" aria-label="모바일 바로가기">
    <a href="cases.html" style="--m:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3' y='4' width='18' height='16' fill='none' stroke='%23000' stroke-width='1.5'/%3E%3Cpath d='M7 9h10M7 13h6' stroke='%23000' stroke-width='1.5'/%3E%3C/svg%3E&quot;)"><i></i>현장 사례</a>
    <a href="programs.html" style="--m:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3' y='3' width='7' height='7' fill='none' stroke='%23000' stroke-width='1.5'/%3E%3Crect x='14' y='3' width='7' height='7' fill='none' stroke='%23000' stroke-width='1.5'/%3E%3Crect x='3' y='14' width='7' height='7' fill='none' stroke='%23000' stroke-width='1.5'/%3E%3Crect x='14' y='14' width='7' height='7' fill='none' stroke='%23000' stroke-width='1.5'/%3E%3C/svg%3E&quot;)"><i></i>프로그램</a>
    <a href="request.html" style="--m:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='9' fill='none' stroke='%23000' stroke-width='1.5'/%3E%3Cpath d='M12 7v5l4 2' fill='none' stroke='%23000' stroke-width='1.5'/%3E%3C/svg%3E&quot;)"><i></i>제안서</a>
    <a href="contact.html" style="--m:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M4 5h16v11H8l-4 4z' fill='none' stroke='%23000' stroke-width='1.5'/%3E%3C/svg%3E&quot;)"><i></i>1:1 문의</a>
    <a href="news.html" style="--m:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0' fill='none' stroke='%23000' stroke-width='1.5'/%3E%3C/svg%3E&quot;)"><i></i>알림</a>
  </nav>`;
  const footer = `<footer class="footer" id="footer">
    <div class="top" data-reveal-box>
      <div><p class="slogan" data-reveal="mask">Right Person,<br>Right Classroom</p><p class="slogan-sub">학교·기업·병원·공공기관, 기관마다 다른 질문에 꼭 맞는 한 사람을 보냅니다.</p></div>
      <div class="pic"><img src="assets/img/case-public.webp" alt="" loading="lazy"></div>
    </div>
    <div class="bot">
      <div>
        <div class="links"><a href="#" onclick="return false">이용약관</a><a href="#" onclick="return false">개인정보처리방침</a><a href="lecturer-portal.html">강사전용</a><a href="admin.html">관리자</a><a href="contact.html#apply">강사 지원</a></div>
        <div class="info">(주)더알림 · 대표 김경림 · 사업자등록번호 535-81-02819 · 통신판매업 신고 제2023-서울금천-0325호<br>서울 강남구 도곡로 123 대경빌딩 2층 · 경기화성 교육장 · 경북구미 사무소<br>Tel 0507-1322-2916 (월–일 10:00–20:00) · Email thealrim7@gmail.com</div>
        <div class="copy">Copyright © 2026 THE ALRIM. All rights reserved. · 리뉴얼 제안 데모 — 강사·사례·수치는 가상입니다.</div>
      </div>
      <div><div class="family" id="family"><button type="button">Family Site</button><ul><li><a href="#" onclick="return false">한국인재양성협회</a></li><li><a href="#" onclick="return false">한국기업경영협회</a></li><li><a href="https://www.pqi.or.kr" target="_blank" rel="noopener">민간자격정보서비스</a></li></ul></div>
        <div class="logos"><span>고용노동부</span><span>한국산업인력공단</span><span>연세대학교 교육대학원</span></div></div>
    </div>
  </footer>`;
  const mount = document.getElementById("hd"); if (mount) mount.outerHTML = nav; else document.body.insertAdjacentHTML("afterbegin", nav);
  const fmount = document.getElementById("ft"); if (fmount) fmount.outerHTML = footer; else document.body.insertAdjacentHTML("beforeend", footer);
  // 브레드크럼 자동 주입
  const bcMount = document.getElementById("bc"); if (bcMount) bcMount.outerHTML = `<div class="bc"><a href="index.html" aria-label="홈"><span class="home"></span></a>${crumb ? `<i></i><a href="${crumb[0].items[0][0]}">${crumb[0].t}</a><i></i><span>${bcMount.dataset.title || crumb[1][1]}</span>` : `<i></i><span>${bcMount.dataset.title || document.title.split(" — ")[0]}</span>`}</div>`;
  document.body.insertAdjacentHTML("beforeend", `<div class="demo-note">리뉴얼 제안 데모 · 강사·사례·수치는 가상 · 디자인 레퍼런스 천만문화재단 실측</div>`);
  if (!document.querySelector('link[rel="icon"]')) document.head.insertAdjacentHTML("beforeend", `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 fill=%27%23221EF4%27/%3E%3Ctext x=%2716%27 y=%2722%27 font-size=%2716%27 font-family=%27sans-serif%27 font-weight=%27700%27 fill=%27%23fff%27 text-anchor=%27middle%27%3E알%3C/text%3E%3C/svg%3E">`);
  document.querySelectorAll(".nav-sub a, .allmenu a.l2, .tabbar a").forEach(a => { if (cur(a.getAttribute("href"))) a.setAttribute("aria-current", "page"); });

  /* ── 단일 이동형 서브메뉴 패널 ── */
  const navEl = document.getElementById("nav"), panel = document.getElementById("navSub"), dimN = document.getElementById("navDim");
  const items = [...navEl.querySelectorAll(".nav-menu > a")], panes = [...panel.querySelectorAll(".pn")];
  const EASE = "cubic-bezier(.4,.1,.1,1)"; let openId = null, closeT;
  const openSub = a => { clearTimeout(closeT); const t = panel.querySelector(`[data-submenu="${a.dataset.id}"]`); panes.forEach(p => p.classList.toggle("is-active", p === t)); const x = a.offsetLeft + a.offsetWidth / 2 - 140; panel.style.transition = `height .6s ${EASE}, transform ${openId ? .45 : 0}s ${EASE}`; panel.style.height = t.scrollHeight + "px"; panel.style.transform = `translateX(${x}px)`; dimN.classList.add("is-active"); navEl.classList.add("is-open"); items.forEach(i => i.classList.toggle("on", i === a)); openId = a.dataset.id; };
  const closeSub = () => { closeT = setTimeout(() => { panel.style.transition = `height .45s ${EASE}`; panel.style.height = "0px"; dimN.classList.remove("is-active"); navEl.classList.remove("is-open"); items.forEach(i => i.classList.remove("on")); openId = null; }, 150); };
  if (matchMedia("(hover:hover) and (pointer:fine)").matches) { items.forEach(a => { a.addEventListener("mouseenter", () => openSub(a)); a.addEventListener("focus", () => openSub(a)); }); navEl.addEventListener("mouseleave", closeSub); panel.addEventListener("mouseenter", () => clearTimeout(closeT)); dimN.addEventListener("mouseenter", closeSub); }
  else items.forEach(a => a.addEventListener("click", e => { if (openId !== a.dataset.id) { e.preventDefault(); openSub(a); } }));
  dimN.addEventListener("click", () => { clearTimeout(closeT); closeSub(); });

  /* ── 전체메뉴 · 드로어 · 딤 · 잠금 ── */
  let locks = 0; const lock = on => { locks = Math.max(0, locks + (on ? 1 : -1)); document.body.classList.toggle("is-locked", locks > 0); };
  const all = document.getElementById("allmenu"), allBtn = document.getElementById("allBtn"), dim = document.getElementById("dim"), sched = document.getElementById("sched");
  const openAll = () => { all.classList.add("is-open"); all.setAttribute("aria-hidden", "false"); allBtn.setAttribute("aria-expanded", "true"); lock(true); };
  const closeAll = () => { if (!all.classList.contains("is-open")) return; all.classList.remove("is-open"); all.setAttribute("aria-hidden", "true"); allBtn.setAttribute("aria-expanded", "false"); lock(false); };
  allBtn.addEventListener("click", openAll); document.getElementById("allX").addEventListener("click", closeAll);
  all.querySelectorAll(".col .t").forEach(b => b.addEventListener("click", () => { if (innerWidth > 1024) { location.href = b.nextElementSibling.querySelector("a").getAttribute("href"); return; } const col = b.closest(".col"), was = col.classList.contains("open"); all.querySelectorAll(".col").forEach(c => c.classList.remove("open")); if (!was) col.classList.add("open"); }));
  const openSched = () => { sched.classList.add("is-open"); sched.setAttribute("aria-hidden", "false"); dim.classList.add("is-active"); lock(true); };
  const closeSched = () => { if (!sched.classList.contains("is-open")) return; sched.classList.remove("is-open"); sched.setAttribute("aria-hidden", "true"); dim.classList.remove("is-active"); lock(false); };
  document.getElementById("schedBtn").addEventListener("click", openSched); document.getElementById("schedX").addEventListener("click", closeSched); dim.addEventListener("click", closeSched);
  addEventListener("keydown", e => { if (e.key === "Escape") { closeAll(); closeSched(); const pu = document.querySelector(".popup.is-open"); if (pu) pu.classList.remove("is-open"); } });
  window.ALRIM_SHELL = { openAll, closeAll, openSched, closeSched, lock };

  /* ── 스크롤 방향 내비 숨김 · 투명 헤더 · 맨 위로 ── */
  let shown = true, last = scrollY; const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const setNav = s => { shown = s; document.body.classList.toggle("nav-hidden", !s); if (reduce) { navEl.style.transform = s ? "" : "translateY(-120px)"; return; } navEl.animate([{}, { transform: `translateY(${s ? 0 : -120}px)` }], { duration: s ? 450 : 350, easing: s ? "cubic-bezier(.33,1,.68,1)" : "cubic-bezier(.32,0,.67,0)", fill: "forwards" }); };
  const toTop = document.getElementById("toTop");
  addEventListener("scroll", () => { const y = scrollY, th = page === "index.html" ? innerHeight * .5 : 80; navEl.classList.toggle("is-scrolled", y > 0); toTop.classList.toggle("on", y > innerHeight); if (y < th) { if (!shown) setNav(true); last = y; return; } const d = y - last; if (d > 2 && shown && openId === null) setNav(false); else if (d < -2 && !shown) setNav(true); last = y; }, { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
  const fam = document.getElementById("family"); fam.querySelector("button").addEventListener("click", () => fam.classList.toggle("open"));
  // 홈이 아닌 페이지는 GNB가 바로 y 0 (천만: s.path !== '/' → gsap.set(nav,{y:0}))
  if (page !== "index.html") navEl.style.transform = "";
})();
