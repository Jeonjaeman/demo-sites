/* =====================================================
   SALESUP 관리자 백오피스 — 데모 (인메모리 상태)
   ===================================================== */
(() => {
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const main = $("#admMain");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* 인메모리 작업 상태 (새로고침 시 초기화 — 데모) */
const st = {
  page: "dash",
  badges: SEED.badgeRequests.map(b => ({ ...b })),
  reports: SEED.reports.map(r => ({ ...r })),
  companies: SEED.companies.map(c => ({ ...c })),
  posts: SEED.posts.map(p => ({ ...p, blind: false })),
  members: SEED.users.map(u => ({ ...u, status: "정상" })),
  curation: { ...SEED.curation, hotPosts: [...SEED.curation.hotPosts] },
};

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove("show"), 2200);
}
const gradeLabel = g => (SEED.grades[g] || SEED.grades.normal).label;
const stTag = s => {
  const cls = { "대기": "st-wait", "접수": "st-wait", "승인": "st-ok", "정상": "st-ok", "처리완료": "st-ok", "반려": "st-no", "정지": "st-no", "블라인드": "st-blind" }[s] || "st-wait";
  return `<span class="st-tag ${cls}">${s}</span>`;
};

/* ---------- 대시보드 ---------- */
function pDash() {
  const k = ADMIN_STATS.kpi, w = ADMIN_STATS.weekly;
  const pendB = st.badges.filter(b => b.status === "대기").length;
  const pendR = st.reports.filter(r => r.status === "접수").length;
  const mx = Math.max(...w.posts);
  return `
  <div class="adm-h"><div><h1>대시보드</h1><p>2026-07-18 기준 · 실서비스에서는 실시간 집계</p></div></div>
  <div class="kpis">
    <div class="kpi"><span class="k">전체 회원</span><b>${k.members.toLocaleString()}</b><small>▲ 51 오늘 가입</small></div>
    <div class="kpi"><span class="k">오늘 게시글</span><b>${k.todayPosts}</b><small>▲ 6.3% 전일 대비</small></div>
    <div class="kpi ${pendB ? "alert" : ""}"><span class="k">뱃지 승인 대기</span><b>${pendB}</b><small style="color:var(--gray2)">회원 관리에서 처리</small></div>
    <div class="kpi ${pendR ? "alert" : ""}"><span class="k">미처리 신고</span><b>${pendR}</b><small style="color:var(--gray2)">24시간 내 처리 권장</small></div>
  </div>
  <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:18px" class="dash-grid">
    <div class="panel">
      <h3>주간 활동 추이 <span style="font-size:12px;color:var(--gray2);font-weight:400">게시글 / 회사 리뷰</span></h3>
      <div class="chart-box">
        ${w.labels.map((lb, i) => `
        <div class="chart-col">
          <div class="bars">
            <i class="b1" style="height:${w.posts[i] / mx * 100}%" title="게시글 ${w.posts[i]}"></i>
            <i class="b2" style="height:${w.reviews[i] / mx * 100}%" title="리뷰 ${w.reviews[i]}"></i>
          </div>
          <span class="lb">${lb}</span>
        </div>`).join("")}
      </div>
      <div class="legend"><span><i style="background:var(--red)"></i>게시글</span><span><i style="background:#ffd2d2"></i>회사 리뷰</span></div>
    </div>
    <div class="panel">
      <h3>AI 자동답변 현황 <span style="font-size:12px;color:var(--gray2);font-weight:400">비용 가드레일 포함</span></h3>
      <table class="tbl">
        <tr><td>오늘 AI 답변 생성</td><td style="text-align:right"><b>31건</b></td></tr>
        <tr><td>평균 응답 시간</td><td style="text-align:right"><b>52초</b></td></tr>
        <tr><td>유사질문 캐시 적중</td><td style="text-align:right"><b>9건</b> <span style="font-size:11px;color:var(--green)">API 호출 절감 29%</span></td></tr>
        <tr><td>이번 달 토큰 사용량</td><td style="text-align:right"><b>2.4M</b> <span style="font-size:11px;color:var(--gray2)">(≈ $12.8)</span></td></tr>
        <tr><td>월 예산 상한</td><td style="text-align:right"><b>$50</b> <span style="font-size:11px;color:var(--gray2)">26% 소진 · 80% 도달 시 알림</span></td></tr>
        <tr><td>사용자당 일일 한도</td><td style="text-align:right"><b>3회</b> <span style="font-size:11px;color:var(--gray2)">등급별 차등(전문가 5회)</span></td></tr>
        <tr><td>답변 도움돼요 비율</td><td style="text-align:right"><b>78%</b></td></tr>
      </table>
      <p style="font-size:11.5px;color:var(--gray2);margin-top:10px">ⓘ OpenAI API 토큰 비용은 클라이언트 부담 — 일일 한도·예산 상한·유사질문 캐시로 비용을 통제하고, 예산 소진 시 AI 답변을 자동 일시중지(커뮤니티 답변 유도)합니다.</p>
    </div>
  </div>
  <style>@media(max-width:1024px){.dash-grid{grid-template-columns:1fr!important}}</style>`;
}

/* ---------- 회원 관리 ---------- */
function pMembers() {
  return `
  <div class="adm-h"><div><h1>회원 관리</h1><p>회원 조회 · 뱃지(등급) 신청 승인/반려 · 제재</p></div></div>
  <div class="panel">
    <h3>🎖️ 뱃지(등급) 신청 큐 <span style="font-size:12px;color:var(--gray2);font-weight:400">증빙 서류 확인 후 수동 승인</span></h3>
    <div style="overflow-x:auto"><table class="tbl">
      <tr><th>닉네임</th><th>신청 등급</th><th>증빙 서류</th><th class="hide-m">신청일</th><th>상태</th><th>처리</th></tr>
      ${st.badges.map(b => `
      <tr>
        <td><b>${esc(b.nick)}</b></td>
        <td>${gradeLabel(b.want)}</td>
        <td><span class="file-link" data-file="${esc(b.file)}">📎 ${esc(b.file)}</span></td>
        <td class="hide-m">${b.date}</td>
        <td>${stTag(b.status)}</td>
        <td>${b.status === "대기" ? `
          <button class="mini-btn ok" data-badge-ok="${b.id}">승인</button>
          <button class="mini-btn no" data-badge-no="${b.id}">반려</button>` : "—"}</td>
      </tr>`).join("")}
    </table></div>
  </div>
  <div class="panel">
    <h3>👥 전체 회원 <span style="font-size:12px;color:var(--gray2);font-weight:400">데모: 상위 8명 표시</span></h3>
    <div style="overflow-x:auto"><table class="tbl">
      <tr><th>닉네임</th><th>등급</th><th class="hide-m">직무</th><th class="hide-m">가입일</th><th>레벨/포인트</th><th>상태</th><th>제재</th></tr>
      ${st.members.map(m => `
      <tr>
        <td><b>${esc(m.nick)}</b></td>
        <td>${gradeLabel(m.grade)}</td>
        <td class="hide-m">${esc(m.job)}</td>
        <td class="hide-m">${m.joined}</td>
        <td>Lv.${m.level} · ${m.pts.toLocaleString()}P</td>
        <td>${stTag(m.status)}</td>
        <td><button class="mini-btn ${m.status === "정상" ? "no" : "ok"}" data-ban="${m.id}">${m.status === "정상" ? "정지" : "해제"}</button></td>
      </tr>`).join("")}
    </table></div>
  </div>`;
}

/* ---------- 회사 관리 ---------- */
function pCompanies() {
  return `
  <div class="adm-h">
    <div><h1>회사 관리</h1><p>리뷰 대상 회사 기초 정보 등록 · 엑셀 일괄 업로드 · 크롤러(예정)</p></div>
    <div style="display:flex;gap:8px">
      <button class="mini-btn dark" id="btnNewCo" style="padding:9px 16px">+ 수기 등록</button>
      <button class="mini-btn" id="btnExcel" style="padding:9px 16px">📊 엑셀 일괄 업로드</button>
    </div>
  </div>
  <div class="panel" style="background:var(--bluesoft);border-color:#cdd9ff">
    <p style="font-size:13px;color:var(--ink2)">🤖 <b>크롤러 자동 수집 (2단계 로드맵)</b> — 공공 API·채용 사이트 기반 회사 정보 자동 수집 및 중복 병합 기능이 예정되어 있습니다. 현재는 수기 등록과 엑셀 업로드를 제공합니다.</p>
  </div>
  <div class="panel">
    <h3>등록된 회사 <span style="font-size:12px;color:var(--gray2);font-weight:400">${st.companies.length}개</span></h3>
    <div style="overflow-x:auto"><table class="tbl">
      <tr><th>회사명</th><th>업종</th><th class="hide-m">규모</th><th class="hide-m">지역</th><th>평균 별점</th><th>리뷰 수</th><th>관리</th></tr>
      ${st.companies.map(c => `
      <tr>
        <td><b>${esc(c.name)}</b></td>
        <td>${esc(c.industry)}</td>
        <td class="hide-m">${esc(c.size)}</td>
        <td class="hide-m">${esc(c.location)}</td>
        <td><span style="color:var(--gold)">★</span> <b>${c.rating.toFixed(1)}</b></td>
        <td>${c.reviews}</td>
        <td><button class="mini-btn" data-co-edit="${c.id}">수정</button></td>
      </tr>`).join("")}
    </table></div>
  </div>`;
}

/* ---------- 게시글 모니터링 ---------- */
function pPosts() {
  return `
  <div class="adm-h"><div><h1>게시글 모니터링</h1><p>전체 게시글/댓글 조회 · 블라인드 처리 · 금칙어 자동 필터(로드맵)</p></div></div>
  <div class="panel">
    <h3>게시글 목록 <span style="font-size:12px;color:var(--gray2);font-weight:400">블라인드 시 사용자에게 "운영정책 위반으로 가려진 글"로 표시</span></h3>
    <div style="overflow-x:auto"><table class="tbl">
      <tr><th>게시판</th><th>제목</th><th class="hide-m">작성자</th><th class="hide-m">작성일</th><th>조회/좋아요</th><th>상태</th><th>처리</th></tr>
      ${st.posts.map(p => {
        const u = SEED.users.find(x => x.id === p.uid) || SEED.me;
        return `
        <tr style="${p.blind ? "opacity:.45" : ""}">
          <td>${SEED.boards[p.board].label}</td>
          <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>${esc(p.title)}</b></td>
          <td class="hide-m">${esc(u.nick)}</td>
          <td class="hide-m">${p.date.slice(0, 10)}</td>
          <td>${p.views} / ${p.likes}</td>
          <td>${p.blind ? stTag("블라인드") : stTag("정상")}</td>
          <td><button class="mini-btn ${p.blind ? "ok" : "no"}" data-blind="${p.id}">${p.blind ? "해제" : "블라인드"}</button></td>
        </tr>`;
      }).join("")}
    </table></div>
  </div>`;
}

/* ---------- 신고 처리 ---------- */
function pReports() {
  return `
  <div class="adm-h"><div><h1>신고 처리</h1><p>욕설·홍보·개인정보 노출 신고 검토 — 정보통신망법 44조의2 임시조치 대응 포함</p></div></div>
  <div class="panel">
    <h3>신고 큐</h3>
    <div style="overflow-x:auto"><table class="tbl">
      <tr><th>대상</th><th>내용</th><th>사유</th><th class="hide-m">신고자</th><th class="hide-m">일자</th><th>상태</th><th>처리</th></tr>
      ${st.reports.map(r => `
      <tr>
        <td>${esc(r.target)}</td>
        <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>${esc(r.title)}</b></td>
        <td><span class="tag rd">${esc(r.reason)}</span></td>
        <td class="hide-m">${esc(r.reporter)}</td>
        <td class="hide-m">${r.date}</td>
        <td>${stTag(r.status)}</td>
        <td>${r.status === "접수" ? `
          <button class="mini-btn no" data-rp-blind="${r.id}">블라인드</button>
          <button class="mini-btn" data-rp-dismiss="${r.id}">기각</button>` : "—"}</td>
      </tr>`).join("")}
    </table></div>
    <p style="font-size:11.5px;color:var(--gray2);margin-top:12px">ⓘ 명예훼손 신고는 접수 즉시 <b>임시비공개(30일)</b> 처리 후 소명 절차를 진행합니다. (실서비스 정책)</p>
  </div>`;
}

/* ---------- 메인 큐레이션 ---------- */
function pCuration() {
  const posts = id => SEED.posts.find(p => p.id === id);
  return `
  <div class="adm-h">
    <div><h1>메인 큐레이션</h1><p>메인 화면 노출 콘텐츠 수동 배치 — 실시간 인기글 / 오늘의 회사 / 오늘의 노하우</p></div>
    <button class="mini-btn dark" id="curSave" style="padding:9px 16px">배치 저장</button>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px" class="cur-grid">
    <div class="panel">
      <h3>🔥 실시간 인기글 슬롯 (5)</h3>
      ${st.curation.hotPosts.map((id, i) => {
        const p = posts(id);
        return `
        <div class="cur-slot">
          <span class="hnd">⠿</span>
          <b style="color:var(--red);font-size:13px">${i + 1}</b>
          <span class="t">${esc(p ? p.title : id)}</span>
          <button class="mini-btn" data-cur-up="${i}" ${i === 0 ? "disabled style='opacity:.3'" : ""}>↑</button>
          <button class="mini-btn" data-cur-dn="${i}" ${i === st.curation.hotPosts.length - 1 ? "disabled style='opacity:.3'" : ""}>↓</button>
        </div>`;
      }).join("")}
      <p style="font-size:11.5px;color:var(--gray2);margin-top:8px">ⓘ 슬롯 순서는 메인 "실시간 인기글" 영역에 즉시 반영됩니다. (자동 큐레이션 OFF 상태)</p>
    </div>
    <div>
      <div class="panel">
        <h3>🏢 오늘 가장 많이 본 회사 (4)</h3>
        ${st.curation.hotCompanies.map(id => {
          const c = st.companies.find(x => x.id === id);
          return `<div class="cur-slot"><span class="hnd">⠿</span><span class="t">${esc(c.name)} <span style="color:var(--gray2);font-weight:400">· ${esc(c.industry)}</span></span><span class="tag gy">노출중</span></div>`;
        }).join("")}
      </div>
      <div class="panel">
        <h3>💡 오늘의 노하우 (1)</h3>
        <div class="cur-slot"><span class="hnd">⠿</span><span class="t">${esc(posts(st.curation.todayKnowhow).title)}</span><span class="tag rd">밴드 노출</span></div>
        <select style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:8px;font-size:13px" id="curKnowhow">
          ${SEED.posts.filter(p => p.board === "knowhow").map(p => `<option value="${p.id}" ${p.id === st.curation.todayKnowhow ? "selected" : ""}>${esc(p.title)}</option>`).join("")}
        </select>
      </div>
    </div>
  </div>
  <style>@media(max-width:1024px){.cur-grid{grid-template-columns:1fr!important}}</style>`;
}

/* ---------- 렌더 ---------- */
function render() {
  const pages = { dash: pDash, members: pMembers, companies: pCompanies, posts: pPosts, reports: pReports, curation: pCuration };
  main.innerHTML = (pages[st.page] || pDash)();
  $("#cntBadge").textContent = st.badges.filter(b => b.status === "대기").length;
  bind();
}

function bind() {
  // 뱃지 승인/반려
  $$("[data-badge-ok]").forEach(b => b.addEventListener("click", () => {
    const x = st.badges.find(v => v.id === b.dataset.badgeOk);
    x.status = "승인"; render(); toast(`${x.nick}님에게 '${gradeLabel(x.want)}' 뱃지를 부여했습니다`);
  }));
  $$("[data-badge-no]").forEach(b => b.addEventListener("click", () => {
    const x = st.badges.find(v => v.id === b.dataset.badgeNo);
    x.status = "반려"; render(); toast(`${x.nick}님의 신청을 반려했습니다 (사유 알림 발송)`);
  }));
  $$("[data-file]").forEach(b => b.addEventListener("click", () => toast(`증빙 이미지 뷰어: ${b.dataset.file} (데모)`)));
  // 회원 제재
  $$("[data-ban]").forEach(b => b.addEventListener("click", () => {
    const m = st.members.find(v => v.id === b.dataset.ban);
    m.status = m.status === "정상" ? "정지" : "정상";
    render(); toast(m.status === "정지" ? `${m.nick}님을 활동 정지 처리했습니다` : `${m.nick}님의 정지를 해제했습니다`);
  }));
  // 회사
  $("#btnNewCo")?.addEventListener("click", () => $("#mCompany").classList.add("show"));
  $("#btnExcel")?.addEventListener("click", () => {
    $("#excelProg").classList.remove("show"); $("#excelProg i").style.width = "0";
    $("#excelMsg").textContent = "";
    $("#mExcel").classList.add("show");
  });
  $$("[data-co-edit]").forEach(b => b.addEventListener("click", () => toast("회사 정보 수정 (데모)")));
  // 게시글 블라인드
  $$("[data-blind]").forEach(b => b.addEventListener("click", () => {
    const p = st.posts.find(v => v.id === b.dataset.blind);
    p.blind = !p.blind; render();
    toast(p.blind ? "블라인드 처리되었습니다 — 사용자에게 비공개" : "블라인드가 해제되었습니다");
  }));
  // 신고
  $$("[data-rp-blind]").forEach(b => b.addEventListener("click", () => {
    const r = st.reports.find(v => v.id === b.dataset.rpBlind);
    r.status = "처리완료"; render(); toast("대상 콘텐츠를 블라인드(임시비공개) 처리했습니다");
  }));
  $$("[data-rp-dismiss]").forEach(b => b.addEventListener("click", () => {
    const r = st.reports.find(v => v.id === b.dataset.rpDismiss);
    r.status = "처리완료"; render(); toast("신고를 기각 처리했습니다");
  }));
  // 큐레이션
  $$("[data-cur-up]").forEach(b => b.addEventListener("click", () => {
    const i = +b.dataset.curUp; const a = st.curation.hotPosts;
    [a[i - 1], a[i]] = [a[i], a[i - 1]]; render();
  }));
  $$("[data-cur-dn]").forEach(b => b.addEventListener("click", () => {
    const i = +b.dataset.curDn; const a = st.curation.hotPosts;
    [a[i + 1], a[i]] = [a[i], a[i + 1]]; render();
  }));
  $("#curKnowhow")?.addEventListener("change", e => { st.curation.todayKnowhow = e.target.value; render(); });
  $("#curSave")?.addEventListener("click", () => toast("메인 배치가 저장되었습니다 — 사용자 메인에 즉시 반영 (데모)"));
}

/* 전역 */
$$("#admNav button").forEach(b => b.addEventListener("click", () => {
  $$("#admNav button").forEach(x => x.classList.remove("on")); b.classList.add("on");
  st.page = b.dataset.p; render();
}));
$$("[data-close]").forEach(b => b.addEventListener("click", () => $$(".modal-bg").forEach(m => m.classList.remove("show"))));
$$(".modal-bg").forEach(m => m.addEventListener("click", e => { if (e.target === m) m.classList.remove("show"); }));

/* 엑셀 업로드 시뮬레이션 */
$("#excelZone").addEventListener("click", () => {
  const prog = $("#excelProg"), bar = $("#excelProg i"), msg = $("#excelMsg");
  prog.classList.add("show"); bar.style.width = "0"; msg.textContent = "company_list_0718.xlsx 업로드 중…";
  let w = 0;
  const tm = setInterval(() => {
    w += 20; bar.style.width = w + "%";
    if (w >= 100) {
      clearInterval(tm);
      msg.innerHTML = "✅ <b>17개 행 파싱 완료</b> — 신규 15건 등록 · 중복 2건 병합 (데모 시뮬레이션)";
      const samples = [
        { name: "동서필름유통", industry: "산업재 B2B", size: "중소(80명)", location: "인천 남동구" },
        { name: "코어메딕스", industry: "의료기기", size: "중소(60명)", location: "서울 강서구" },
      ];
      samples.forEach((s, i) => st.companies.push({ id: "nc" + Date.now() + i, ...s, rating: 0, cats: { pay: 0, wlb: 0, culture: 0, growth: 0, mgmt: 0 }, reviews: 0, views: 0, salaryHint: "정보 수집중" }));
      setTimeout(() => { $$(".modal-bg").forEach(m => m.classList.remove("show")); render(); toast("회사 15건이 일괄 등록되었습니다"); }, 1200);
    }
  }, 180);
});

/* 회사 수기 등록 */
$("#ncSubmit").addEventListener("click", () => {
  const name = $("#ncName").value.trim();
  if (!name) return toast("회사명을 입력해 주세요");
  st.companies.unshift({
    id: "nc" + Date.now(), name,
    industry: $("#ncInd").value.trim() || "미분류", size: $("#ncSize").value.trim() || "-", location: $("#ncLoc").value.trim() || "-",
    rating: 0, cats: { pay: 0, wlb: 0, culture: 0, growth: 0, mgmt: 0 }, reviews: 0, views: 0, salaryHint: "정보 수집중",
  });
  $$(".modal-bg").forEach(m => m.classList.remove("show"));
  ["ncName", "ncInd", "ncSize", "ncLoc"].forEach(id => $("#" + id).value = "");
  render(); toast(`'${name}' 회사가 등록되었습니다 — 리뷰 작성 대상에 즉시 노출`);
});

render();
})();
