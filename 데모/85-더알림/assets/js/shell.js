/* 공통 헤더·푸터 주입 — 모든 공개 페이지가 공유 (ui.js보다 먼저 로드) */
(function () {
  const NAV = [
    { t:"교육출강", sub:[["outreach.html?c=youth","청소년 교육센터","학교·청소년기관"],["outreach.html?c=corp","기업 HRD 컨설팅","대기업·중견·스타트업"],["outreach.html?c=medical","병원 메디컬센터","CS·리더십·조직관리"],["outreach.html?c=public","공공기관·지자체","민원·청렴·안전"]] },
    { t:"프로그램", href:"programs.html" },
    { t:"강사진", href:"lecturers.html" },
    { t:"자격·콘텐츠", sub:[["certificates.html","민간자격증","4분야 32종"],["consulting.html","개인컨설팅","1:1 진로·창업·PT"],["academy.html","아카데미","명사초청·전문가 특강"],["about.html#contents","교재·VOD 제작","도서출판·영상"]] },
    { t:"소식", sub:[["cases.html","현장 사례","강의후기"],["news.html","언론보도·수상",""],["partners.html","함께한 곳","파트너 100+"]] },
    { t:"회사소개", href:"about.html" },
  ];
  const page = location.pathname.split("/").pop() || "index.html";
  const navHtml = NAV.map(n => n.sub
    ? `<li class="has-sub"><button type="button" aria-haspopup="true">${n.t}</button><div class="sub">${n.sub.map(s => `<a href="${s[0]}">${s[1]}${s[2] ? `<small>${s[2]}</small>` : ""}</a>`).join("")}</div></li>`
    : `<li><a href="${n.href}">${n.t}</a></li>`).join("");
  const header = `<header class="hd"><div class="shell hd-in">
    <a class="logo" href="index.html" aria-label="더알림 홈">더알림 <small>THE ALRIM</small></a>
    <nav aria-label="주 메뉴"><ul class="hd-nav">${navHtml}
      <li class="hd-cta"><a class="btn btn-ghost btn-sm" href="contact.html">빠른 상담</a><a class="btn btn-primary btn-sm" href="request.html">제안서 요청 <span class="cart-badge" hidden>0</span></a></li></ul></nav>
    <button class="hd-burger" type="button" aria-label="메뉴" aria-expanded="false"><span></span><span></span><span></span></button>
  </div></header>`;
  const footer = `<footer class="ft"><div class="shell">
    <div class="ft-grid">
      <div><div class="ft-logo">더알림</div><p class="mt2" style="max-width:34ch">학교·기업·병원·공공기관에 검증된 강사를 보내는 교육 위탁 법인. 2,000명 강사 네트워크, 4대 전담 센터.</p>
        <p class="mt3 small">강남본사 · 경기화성 · 경북구미<br>월–일 10:00–20:00 · 0507-1322-2916</p><span class="live" id="ftLive"><i></i><span></span></span></div>
      <div><h4>교육출강</h4><ul><li><a href="outreach.html?c=youth">청소년 교육센터</a></li><li><a href="outreach.html?c=corp">기업 HRD 컨설팅</a></li><li><a href="outreach.html?c=medical">병원 메디컬센터</a></li><li><a href="outreach.html?c=public">공공기관·지자체</a></li><li><a href="programs.html">프로그램 카탈로그</a></li><li><a href="lecturers.html">강사진</a></li></ul></div>
      <div><h4>자격·콘텐츠</h4><ul><li><a href="certificates.html">민간자격증</a></li><li><a href="consulting.html">개인컨설팅</a></li><li><a href="academy.html">아카데미</a></li><li><a href="about.html#contents">교재·VOD 제작</a></li><li><a href="about.html#asso">한국인재양성협회</a></li><li><a href="about.html#asso">한국기업경영협회</a></li></ul></div>
      <div><h4>문의·회사</h4><ul><li><a href="request.html">맞춤 제안서 요청</a></li><li><a href="contact.html">빠른 상담 · 제휴 · 강사 지원</a></li><li><a href="cases.html">현장 사례</a></li><li><a href="news.html">언론보도·수상</a></li><li><a href="about.html">회사소개 · 오시는 길</a></li><li><a href="lecturer-portal.html">강사전용</a> · <a href="admin.html">관리자</a></li></ul></div>
    </div>
    <div class="ft-bottom"><span>(주)더알림 · 대표 김경림 · 사업자등록번호 535-81-02819 · 통신판매업 제2023-서울금천-0325호</span><span>서울 강남구 도곡로 123 대경빌딩 2층</span><span>thealrim7@gmail.com</span><span><a href="#">개인정보처리방침</a> · <a href="#">이용약관</a></span><span>© <span id="year"></span> THE ALRIM · 리뉴얼 제안 데모 — 강사·사례·수치는 가상 데이터</span></div>
  </div></footer>`;
  if (!document.querySelector("link[rel=icon]")) document.head.insertAdjacentHTML("beforeend", `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1B2A4E"/><text x="16" y="22" font-size="17" font-family="serif" font-weight="700" fill="#E4C766" text-anchor="middle">알</text></svg>')}">`);
  const mount = document.getElementById("hd"); if (mount) mount.outerHTML = header; else document.body.insertAdjacentHTML("afterbegin", header);
  const fmount = document.getElementById("ft"); if (fmount) fmount.outerHTML = footer; else document.body.insertAdjacentHTML("beforeend", footer);
  // 실시간 상담 가능 표시 (Odyssée 푸터 실시간 시각 → 더알림 상담시간 10–20시)
  { const l = document.getElementById("ftLive"); if (l) { const now = new Date(), h = now.getHours(), on = h >= 10 && h < 20; l.classList.toggle("on", on); l.querySelector("span").textContent = on ? `지금 상담 가능 · ${String(h).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")} KST` : `상담 시간 외 · 10:00에 다시 열립니다`; } }
  // 현재 페이지 표시(서브메뉴 포함)
  document.querySelectorAll(".hd a[href]").forEach(a => { const [f, q] = a.getAttribute("href").split("?"); if (f === page && (!q || location.search.includes(q))) { a.setAttribute("aria-current", "page"); const li = a.closest(".has-sub"); if (li) li.querySelector("button").setAttribute("aria-current", "page"); } });
})();
