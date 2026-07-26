/* ============================================================
   탑로더 ADMIN — 관리자 백오피스 (요구사항 2-5)
   대시보드 통계 · 신고 처리 · 회원 관리 · 광고 슬롯 수동 등록(Phase 1)
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toastWrap').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 2600);
}

let page = 'dash';

/* ---------- 대시보드 ---------- */
function viewDash() {
  const s = ADMIN.stats;
  return `
    <h1>대시보드</h1>
    <div class="stat-grid">
      <div class="stat-card"><div class="s-label">전체 회원</div><div class="s-val mono" data-n="${s.members}">0</div><div class="s-chg up">▲ ${s.memberChg}</div></div>
      <div class="stat-card"><div class="s-label">누적 게시글</div><div class="s-val mono" data-n="${s.posts}">0</div><div class="s-chg up">▲ ${s.postChg}</div></div>
      <div class="stat-card"><div class="s-label">이번 달 거래 성사</div><div class="s-val mono" data-n="${s.trades}">0</div><div class="s-chg up">▲ ${s.tradeChg}</div></div>
      <div class="stat-card"><div class="s-label">신고 누적</div><div class="s-val mono" data-n="${s.reports}">0</div><div class="s-chg down">● ${s.reportChg}</div></div>
    </div>
    <div class="panel">
      <h2>📈 최근 7일 활동 추이</h2>
      <canvas id="weeklyChart" style="width:100%;height:210px"></canvas>
      <div style="display:flex;gap:18px;margin-top:10px;font-size:12px;color:var(--ink-sub)">
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#3E7BFF;margin-right:6px"></span>게시글 등록</span>
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#2CE0A7;margin-right:6px"></span>신규 가입</span>
      </div>
    </div>
    <div class="panel">
      <h2>🚨 미처리 신고 <span class="pill pill-red">4건</span></h2>
      ${reportTable(ADMIN.reports.filter(r => r.state === 'wait').slice(0, 3))}
      <button class="btn-sm" style="margin-top:12px" onclick="goPage('reports')">신고 관리 전체 보기 →</button>
    </div>`;
}

function drawWeekly() {
  const cv = $('#weeklyChart');
  if (!cv) return;
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth, H = 210;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const a = ADMIN.weekly, b = ADMIN.signups;
  const max = Math.max(...a) * 1.15;
  const pad = 30, bw = (W - pad * 2) / 7;
  ctx.font = '11px Pretendard, sans-serif';
  a.forEach((v, i) => {
    const x = pad + i * bw + bw * .18;
    // 게시글 바
    const h1 = (v / max) * (H - 55);
    ctx.fillStyle = 'rgba(62,123,255,.85)';
    roundRect(ctx, x, H - 30 - h1, bw * .28, h1, 4);
    // 가입 바
    const h2 = (b[i] / max) * (H - 55);
    ctx.fillStyle = 'rgba(44,224,167,.85)';
    roundRect(ctx, x + bw * .34, H - 30 - h2, bw * .28, h2, 4);
    ctx.fillStyle = '#5F6980';
    ctx.textAlign = 'center';
    ctx.fillText(days[i], pad + i * bw + bw / 2, H - 10);
    ctx.fillStyle = '#9AA3B8';
    ctx.fillText(v, x + bw * .14, H - 36 - h1);
  });
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, 0);
  ctx.arcTo(x, y + h, x, y, 0);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.fill();
}

/* ---------- 신고 관리 ---------- */
function reportTable(rows) {
  return `
    <table class="table">
      <thead><tr><th>ID</th><th>유형</th><th>대상</th><th>사유</th><th>신고자</th><th>상태</th><th>조치</th></tr></thead>
      <tbody>${rows.map(r => `
        <tr>
          <td class="mono faint">${r.id}</td>
          <td><span class="pill ${r.type === '회원' ? 'pill-yellow' : 'pill-blue'}">${r.type}</span></td>
          <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.target}</td>
          <td class="muted">${r.reason}</td>
          <td class="faint">${r.reporter}</td>
          <td>${r.state === 'wait' ? '<span class="pill pill-red">대기</span>' : '<span class="pill pill-green">처리완료</span>'}</td>
          <td style="white-space:nowrap">
            ${r.state === 'wait' ? `
              <button class="btn-sm danger" onclick="handleReport('${r.id}','del')">삭제</button>
              <button class="btn-sm" onclick="handleReport('${r.id}','keep')">기각</button>` : '—'}
          </td>
        </tr>`).join('')}</tbody>
    </table>`;
}

function viewReports() {
  return `
    <h1>신고 관리</h1>
    <div class="panel">
      <h2>신고 접수 내역 <span class="pill pill-red">${ADMIN.reports.filter(r => r.state === 'wait').length}건 대기</span></h2>
      ${reportTable(ADMIN.reports)}
    </div>
    <div class="panel">
      <h2>🤖 자동 감지 규칙 (스팸 방지 — 요구사항 2-1)</h2>
      <table class="table">
        <thead><tr><th>규칙</th><th>조건</th><th>조치</th><th>상태</th></tr></thead>
        <tbody>
          <tr><td>연속 등록 제한</td><td>60초 내 게시글 재등록</td><td>등록 차단 + 안내</td><td><span class="pill pill-green">ON</span></td></tr>
          <tr><td>도배 감지</td><td>10분 내 5개 이상 등록</td><td>자동 신고 생성</td><td><span class="pill pill-green">ON</span></td></tr>
          <tr><td>가입 봇 방지</td><td>reCAPTCHA v3 점수 &lt; 0.3</td><td>가입 차단</td><td><span class="pill pill-green">ON</span></td></tr>
          <tr><td>외부링크 유인 감지</td><td>금칙 패턴(텔레·현금깡 등)</td><td>블라인드 + 신고 생성</td><td><span class="pill pill-green">ON</span></td></tr>
        </tbody>
      </table>
    </div>`;
}

function handleReport(id, action) {
  const r = ADMIN.reports.find(x => x.id === id);
  if (!r) return;
  r.state = 'done';
  render();
  toast(action === 'del'
    ? `🗑 <b>${id}</b> — 게시물 강제 삭제 및 작성자 경고 처리 (요구사항 2-5)`
    : `✅ <b>${id}</b> — 검토 후 기각 처리되었습니다`, action === 'del' ? 'err' : 'ok');
}

/* ---------- 회원 관리 ---------- */
function viewMembers() {
  return `
    <h1>회원 관리</h1>
    <div class="panel">
      <h2>회원 목록 <span class="pill pill-yellow">스팸 의심 ${ADMIN.members.filter(m => m.state === 'flag').length}명</span></h2>
      <table class="table">
        <thead><tr><th>닉네임</th><th>가입일</th><th>게시글</th><th>거래후기</th><th>신뢰등급</th><th>상태</th><th>조치</th></tr></thead>
        <tbody>${ADMIN.members.map((m, i) => `
          <tr>
            <td style="font-weight:700">${m.nick}</td>
            <td class="faint mono">${m.joined}</td>
            <td class="mono">${m.posts}</td>
            <td class="mono">${m.trades}</td>
            <td>${m.trust === '우수' ? '<span class="pill pill-green">우수</span>' : m.trust === '양호' ? '<span class="pill pill-blue">양호</span>' : '<span class="pill pill-gray">—</span>'}</td>
            <td>${m.state === 'flag' ? '<span class="pill pill-red">스팸 의심</span>' : '<span class="pill pill-green">정상</span>'}</td>
            <td style="white-space:nowrap">
              ${m.state === 'flag'
                ? `<button class="btn-sm danger" onclick="banMember(${i})">강제 탈퇴</button><button class="btn-sm" onclick="clearMember(${i})">정상 처리</button>`
                : '<button class="btn-sm">활동 보기</button>'}
            </td>
          </tr>`).join('')}</tbody>
      </table>
      <p style="font-size:12px;color:var(--ink-faint);margin-top:12px">💡 소셜 로그인 전용 가입이므로 이메일 스팸 가입이 원천 차단되며, 의심 계정은 자동 플래그됩니다.</p>
    </div>`;
}
function banMember(i) {
  ADMIN.members[i].state = 'banned';
  ADMIN.members.splice(i, 1);
  render();
  toast('⛔ 스팸 회원 강제 탈퇴 처리 완료 (요구사항 2-5)', 'err');
}
function clearMember(i) {
  ADMIN.members[i].state = 'normal';
  render();
  toast('✅ 정상 회원으로 처리되었습니다', 'ok');
}

/* ---------- 광고 슬롯 (Phase 1: 수동 등록) ---------- */
function viewAds() {
  const live = ADMIN.adSlots.filter(s => s.state === 'live').length;
  return `
    <h1>광고 슬롯 관리</h1>
    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat-card"><div class="s-label">전체 슬롯</div><div class="s-val">${ADMIN.adSlots.length}</div><div class="s-chg faint">6개 존 운영</div></div>
      <div class="stat-card"><div class="s-label">집행 중</div><div class="s-val up">${live}</div><div class="s-chg faint">수동 등록 (Phase 1)</div></div>
      <div class="stat-card"><div class="s-label">월 예상 광고 수익</div><div class="s-val mono">77만원</div><div class="s-chg up">▲ 집행 슬롯 기준</div></div>
    </div>
    <div class="panel">
      <h2>슬롯 현황 <span class="pill pill-blue">Phase 2: 광고주 셀프 등록·과금 확장</span></h2>
      <div class="adslot-grid">
        ${ADMIN.adSlots.map((s, i) => `
          <div class="adslot-card">
            <div class="zone">${s.zone} · ${s.size}</div>
            <div class="zone-name">${s.name}</div>
            <div class="slot-meta">
              ${s.state === 'live'
                ? `광고주: <b style="color:var(--ink)">${s.client}</b><br>기간: ${s.period} · ${s.price}`
                : `비어 있는 슬롯<br>제안가: ${s.price}`}
            </div>
            <div class="slot-state">
              ${s.state === 'live' ? '<span class="pill pill-green">집행 중</span>' : '<span class="pill pill-gray">비어있음</span>'}
              ${s.state === 'live'
                ? `<button class="btn-sm" onclick="endAd(${i})">집행 종료</button>`
                : `<button class="btn-sm primary" onclick="fillAd(${i})">수동 등록</button>`}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}
function fillAd(i) {
  const s = ADMIN.adSlots[i];
  s.state = 'live'; s.client = '신규 광고주 (수동 입력)'; s.period = '~ 08.31';
  render();
  toast(`📣 <b>${s.zone}</b> 슬롯에 광고가 수동 등록되었습니다 (Phase 1 범위)`, 'ok');
}
function endAd(i) {
  const s = ADMIN.adSlots[i];
  s.state = 'empty'; s.client = null; s.period = null;
  render();
  toast(`🔚 <b>${s.zone}</b> 슬롯 집행이 종료되었습니다`);
}

/* ---------- 라우팅 ---------- */
function goPage(p) {
  page = p;
  $$('.anav button[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === p));
  render();
}

function render() {
  const views = { dash: viewDash, reports: viewReports, members: viewMembers, ads: viewAds };
  $('#adminRoot').innerHTML = (views[page] || viewDash)();
  if (page === 'dash') {
    drawWeekly();
    // 카운트업
    $$('.s-val[data-n]').forEach(el => {
      const target = Number(el.dataset.n);
      const t0 = performance.now();
      const tick = t => {
        const p = Math.min((t - t0) / 1200, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('ko-KR');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $$('.anav button[data-p]').forEach(b => b.addEventListener('click', () => goPage(b.dataset.p)));
  render();
  window.addEventListener('resize', () => { if (page === 'dash') drawWeekly(); });
});
