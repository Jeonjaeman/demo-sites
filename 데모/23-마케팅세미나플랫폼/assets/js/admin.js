/* ============================================================
   SEMINAR56 — 워드프레스 관리자 (WP Admin UI 카피)
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const nf = n => n.toLocaleString('ko-KR');
const won = n => nf(n) + '원';

let page = 'dash';
let regionMode = 'cpt';   // 지역 페이지 관리 방식 비교용
let sessTab = 'upcoming';

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.35s'; setTimeout(() => el.remove(), 350); }, 3400);
}

/* ============================================================
   대시보드
   ============================================================ */
function vDash() {
  const open = SESSIONS.filter(s => sessState(s) !== 'closed').length;
  const closed = SESSIONS.filter(s => sessState(s) === 'closed').length;
  const totalBooked = SESSIONS.reduce((a, s) => a + s.booked, 0);
  const totalPending = SESSIONS.reduce((a, s) => a + s.pending, 0);
  const revenue = totalBooked * BRAND.price;

  return `
    <h1>대시보드</h1>
    <p class="desc">세미나56 · 전국 ${BRAND.regions}개 지역 순회 · 지역별 정원 ${BRAND.capacity}명</p>

    <div class="wp-notice warn">
      <b>⏳ 입금 대기 ${totalPending}건</b> — 가상계좌 발급 후 ${BRAND.holdHours}시간이 지나면 자동 취소되고 좌석이 풀립니다.
      만료 임박 건은 <a href="javascript:goPage('bookings')" style="color:#2271B1">예약자 관리</a>에서 확인하세요.
    </div>

    <div class="wp-stats">
      <div class="wp-stat"><div class="lbl">모집 중 회차</div><div class="val">${open}</div><div class="sub">마감 ${closed}개 회차</div></div>
      <div class="wp-stat"><div class="lbl">확정 신청자</div><div class="val">${nf(totalBooked)}</div><div class="sub up">▲ 어제 +38명</div></div>
      <div class="wp-stat"><div class="lbl">입금 대기</div><div class="val">${totalPending}</div><div class="sub down">좌석 임시 점유 중</div></div>
      <div class="wp-stat"><div class="lbl">누적 매출</div><div class="val" style="font-size:21px">${won(revenue)}</div><div class="sub">확정분 기준</div></div>
    </div>

    <div class="wp-card">
      <div class="wp-card-hd">📊 권역별 모집 현황
        <div class="right"><button class="wp-btn sm" onclick="goPage('sessions')">회차 관리 →</button></div>
      </div>
      <div class="wp-card-bd">
        ${Object.keys(REGION_GROUPS).map(g => {
          const list = SESSIONS.filter(s => s.group === g);
          const b = list.reduce((a, s) => a + s.booked, 0);
          const cap = list.reduce((a, s) => a + s.cap, 0);
          const pct = (b / cap * 100).toFixed(0);
          return `
          <div style="display:grid;grid-template-columns:110px 1fr 118px;gap:12px;align-items:center;padding:9px 0;border-bottom:1px solid #F0F0F1">
            <span style="font-size:13px;font-weight:600">${g}</span>
            <div style="height:18px;background:#F0F0F1;border-radius:2px;overflow:hidden">
              <div class="bar" data-w="${pct}" style="height:100%;background:${pct >= 85 ? '#D63638' : pct >= 60 ? '#DBA617' : '#2271B1'};width:0;transition:width .9s cubic-bezier(.2,.65,.3,1)"></div>
            </div>
            <span style="font-size:12.5px;color:#646970;text-align:right">${nf(b)} / ${nf(cap)}명 (${pct}%)</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="wp-card">
      <div class="wp-card-hd">🕐 최근 신청</div>
      <div class="tbl-scroll">
        <table class="wp-tbl">
          <thead><tr><th>신청번호</th><th>성함</th><th>지역·일시</th><th>업종</th><th>결제수단</th><th>상태</th><th>신청시각</th></tr></thead>
          <tbody>${BOOKINGS.slice(0, 5).map(b => {
            const [t, c] = ST_LABEL[b.st];
            return `<tr>
              <td class="mono" style="color:#646970">${b.id}</td>
              <td><b>${b.name}</b></td>
              <td>${b.region} · ${b.date.slice(5)}</td>
              <td>${b.biz}</td>
              <td>${b.pay}</td>
              <td><span class="wp-pill ${c}">${t}</span></td>
              <td style="color:#646970">${b.at}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>`;
}

/* ============================================================
   세미나 회차 관리
   ============================================================ */
function vSessions() {
  const list = sessTab === 'upcoming'
    ? SESSIONS.filter(s => sessState(s) !== 'closed')
    : SESSIONS.filter(s => sessState(s) === 'closed');
  return `
    <h1>세미나 회차</h1>
    <p class="desc">지역·회차별 예약 상품 — WooCommerce 상품으로 등록되며 <b>정원 = 재고</b>로 연결됩니다</p>

    <div class="wp-notice">
      💡 회차는 <code>seminar_session</code> 커스텀 포스트로 관리되고, 결제는 WooCommerce 상품과 1:1로 연결됩니다.
      정원 ${BRAND.capacity}명에 도달하면 <b>자동으로 품절 처리</b>되어 신청 버튼이 잠깁니다.
    </div>

    <div style="display:flex;gap:6px;margin-bottom:12px">
      <button class="wp-btn ${sessTab === 'upcoming' ? 'primary' : ''}" onclick="setSessTab('upcoming')">진행 예정 (${SESSIONS.filter(s => sessState(s) !== 'closed').length})</button>
      <button class="wp-btn ${sessTab === 'closed' ? 'primary' : ''}" onclick="setSessTab('closed')">마감·종료 (${SESSIONS.filter(s => sessState(s) === 'closed').length})</button>
      <button class="wp-btn primary" style="margin-left:auto" onclick="toast('➕ 새 회차 등록 폼이 열립니다 (지역·날짜·장소·정원 입력)')">＋ 회차 추가</button>
    </div>

    <div class="wp-card">
      <div class="tbl-scroll">
        <table class="wp-tbl">
          <thead><tr><th>지역</th><th>권역</th><th>일시</th><th>장소</th><th style="text-align:right">확정</th><th style="text-align:right">대기</th><th style="text-align:right">잔여</th><th>상태</th><th>작업</th></tr></thead>
          <tbody>
            ${list.slice(0, 14).map(s => {
              const st = sessState(s);
              const left = seatsLeft(s);
              const badge = { open: ['모집중', 'p-green'], hot: ['마감임박', 'p-yellow'], closed: ['정원마감', 'p-red'] }[st];
              return `<tr>
                <td><b>${s.region}</b></td>
                <td style="color:#646970">${s.group}</td>
                <td class="mono">${s.date} ${s.time}</td>
                <td style="color:#646970;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.venue}</td>
                <td style="text-align:right" class="mono">${s.booked}</td>
                <td style="text-align:right" class="mono" ${s.pending ? 'style="text-align:right;color:#8A6116;font-weight:600"' : ''}>${s.pending || '-'}</td>
                <td style="text-align:right;font-weight:600" class="mono">${left}</td>
                <td><span class="wp-pill ${badge[1]}">${badge[0]}</span></td>
                <td style="white-space:nowrap">
                  <button class="wp-btn sm" onclick="toast('✏️ ${s.region} 회차 편집')">편집</button>
                  <button class="wp-btn sm" onclick="goPage('bookings')">명단</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="padding:10px 14px;border-top:1px solid #DCDCDE;font-size:12.5px;color:#646970">
        전체 ${list.length}개 중 14개 표시 · <b>잔여 = 정원 − 확정 − 입금대기</b>
      </div>
    </div>`;
}
function setSessTab(t) { sessTab = t; render(); }

/* ============================================================
   지역 페이지 관리 — 복제 vs CPT 비교 (핵심 제안)
   ============================================================ */
function vRegions() {
  return `
    <h1>지역 페이지</h1>
    <p class="desc">전국 ${BRAND.regions}개 지역 페이지를 어떻게 만들고 유지할 것인가</p>

    <div class="wp-notice err">
      <b>⚠️ 요구사항 재검토가 필요한 항목입니다.</b><br>
      기획서는 <b>"마스터 템플릿 1개를 만들고 내부 인력이 복제"</b>하는 방식입니다.
      그런데 복제하면 56개가 <b>서로 연결이 끊긴 독립 페이지</b>가 되어, 공통 내용을 고칠 때마다 56번 수정해야 합니다.
    </div>

    <div class="cmp">
      <div class="cmp-col bad">
        <div class="cmp-hd"><b>❌ 페이지 복제 방식</b><span>기획서 원안 · Duplicate Post 등</span></div>
        <div class="cmp-bd">
          <div class="cmp-row"><span class="ic">✕</span><span><b>공통 수정 시 56번 반복</b><br>커리큘럼 한 줄, 환불 규정, 강사 프로필이 바뀌면 56개를 전부 열어 고쳐야 합니다.</span></div>
          <div class="cmp-row"><span class="ic">✕</span><span><b>누락과 불일치 발생</b><br>하나라도 빠뜨리면 지역마다 다른 정보가 노출됩니다.</span></div>
          <div class="cmp-row"><span class="ic">✕</span><span><b>SEO 유사 페이지 문제</b><br>본문이 같으면 Google이 하나만 표준으로 삼고 나머지는 색인을 줄입니다.</span></div>
          <div class="cmp-row"><span class="ic">✕</span><span><b>회차 정보와 분리</b><br>페이지 본문의 날짜와 예약 상품의 날짜를 각각 관리해야 합니다.</span></div>
          <div class="cmp-row"><span class="ic">✕</span><span><b>담당자 교육 부담</b><br>편집기 전체를 다뤄야 해서 실수 여지가 큽니다.</span></div>
        </div>
      </div>

      <div class="cmp-col good">
        <div class="cmp-hd"><b>✅ 커스텀 포스트 타입 방식</b><span>제안 · seminar_region + 단일 템플릿</span></div>
        <div class="cmp-bd">
          <div class="cmp-row"><span class="ic">✓</span><span><b>템플릿 1곳만 고치면 56개 즉시 반영</b><br>공통 영역은 템플릿이 담당하므로 반복 작업이 사라집니다.</span></div>
          <div class="cmp-row"><span class="ic">✓</span><span><b>담당자는 입력만</b><br>지역명·날짜·장소·정원·사진만 채우면 페이지가 자동 생성됩니다.</span></div>
          <div class="cmp-row"><span class="ic">✓</span><span><b>지역 고유 정보 필수화</b><br>오시는 길·주차·지역 후기를 필수 항목으로 두어 유사 페이지 문제를 피합니다.</span></div>
          <div class="cmp-row"><span class="ic">✓</span><span><b>회차·예약과 자동 연결</b><br>지역을 등록하면 회차 상품과 잔여 좌석이 자동으로 물립니다.</span></div>
          <div class="cmp-row"><span class="ic">✓</span><span><b>Event 구조화 데이터 자동 삽입</b><br>검색결과에 일정·장소가 노출됩니다.</span></div>
        </div>
      </div>
    </div>

    <div class="wp-card" style="margin-top:18px">
      <div class="wp-card-hd">🧪 시뮬레이션 — "환불 규정 문구를 바꾼다면?"
        <div class="right">
          <button class="wp-btn ${regionMode === 'dup' ? 'primary' : ''}" onclick="setRegionMode('dup')">복제 방식</button>
          <button class="wp-btn ${regionMode === 'cpt' ? 'primary' : ''}" onclick="setRegionMode('cpt')">CPT 방식</button>
        </div>
      </div>
      <div class="wp-card-bd">
        ${regionMode === 'dup' ? `
          <div style="font-size:13px;line-height:1.9">
            <b style="color:#D63638">복제 방식 — 예상 작업량</b><br>
            · 수정 대상 페이지: <b>${BRAND.regions}개</b><br>
            · 페이지당 소요: 약 2분 (열기 → 찾기 → 수정 → 저장 → 확인)<br>
            · <b>총 소요 시간: 약 ${Math.round(BRAND.regions * 2 / 60 * 10) / 10}시간</b><br>
            · 누락 위험: 페이지가 많을수록 증가<br><br>
            <span style="color:#646970">이 작업이 <b>내용이 바뀔 때마다</b> 반복됩니다.</span>
          </div>
          <button class="wp-btn danger" style="margin-top:12px" onclick="simulateDup()">56개 페이지 일괄 수정 실행</button>
          <div id="dupProg" style="margin-top:12px"></div>
        ` : `
          <div style="font-size:13px;line-height:1.9">
            <b style="color:#00A32A">CPT 방식 — 예상 작업량</b><br>
            · 수정 대상: <b>템플릿 파일 1곳</b> (또는 옵션 설정 1개)<br>
            · 소요: 약 1분<br>
            · <b>총 소요 시간: 1분</b> · 56개 지역 페이지에 즉시 반영<br>
            · 누락 위험: 없음 (단일 소스)<br><br>
            <span style="color:#646970">지역별로 다른 내용(장소·날짜·주차 안내)만 각 지역에서 관리합니다.</span>
          </div>
          <button class="wp-btn primary" style="margin-top:12px" onclick="toast('✅ 환불 규정이 수정되었습니다 — 56개 지역 페이지에 즉시 반영','ok')">템플릿 수정 저장</button>
        `}
      </div>
    </div>

    <div class="wp-card">
      <div class="wp-card-hd">📍 등록된 지역 (${BRAND.regions}개)
        <div class="right"><button class="wp-btn primary" onclick="toast('➕ 지역 등록 — 지역명·주소·장소사진·오시는길·주차안내 입력')">＋ 지역 추가</button></div>
      </div>
      <div class="tbl-scroll">
        <table class="wp-tbl">
          <thead><tr><th>지역</th><th>권역</th><th>URL</th><th>지역 고유 정보</th><th>구조화 데이터</th><th>상태</th></tr></thead>
          <tbody>
            ${ALL_REGIONS.slice(0, 8).map((r, i) => {
              const complete = i % 5 !== 3;
              return `<tr>
                <td><b>${r}</b></td>
                <td style="color:#646970">${Object.keys(REGION_GROUPS).find(g => REGION_GROUPS[g].includes(r))}</td>
                <td class="mono" style="color:#2271B1;font-size:12px">/seminar/${['seoul-gangnam','seoul-yeouido','seoul-hongdae','seoul-jamsil','incheon-songdo','incheon-bupyeong','suwon','seongnam'][i]}</td>
                <td>${complete
                  ? '<span class="wp-pill p-green">사진·오시는길·후기 완료</span>'
                  : '<span class="wp-pill p-yellow">주차 안내 누락</span>'}</td>
                <td>${complete ? '<span class="wp-pill p-blue">Event 삽입</span>' : '<span class="wp-pill p-gray">대기</span>'}</td>
                <td>${complete ? '<span class="wp-pill p-green">발행</span>' : '<span class="wp-pill p-gray">임시저장</span>'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="padding:10px 14px;border-top:1px solid #DCDCDE;font-size:12.5px;color:#646970">
        지역 고유 정보가 비어 있으면 <b>발행이 차단</b>됩니다 — 유사 페이지로 색인에서 밀리는 것을 막기 위함입니다.
      </div>
    </div>`;
}
function setRegionMode(m) { regionMode = m; render(); }

function simulateDup() {
  const box = $('#dupProg');
  let i = 0;
  box.innerHTML = `<div style="height:20px;background:#F0F0F1;border-radius:2px;overflow:hidden">
      <div id="dupBar" style="height:100%;background:#D63638;width:0;transition:width .12s"></div>
    </div>
    <div id="dupTxt" style="font-size:12.5px;color:#646970;margin-top:7px"></div>`;
  const iv = setInterval(() => {
    i++;
    $('#dupBar').style.width = (i / BRAND.regions * 100) + '%';
    $('#dupTxt').innerHTML = `${i} / ${BRAND.regions}개 페이지 수정 중… <span style="color:#D63638">(실제로는 담당자가 직접 클릭해야 합니다)</span>`;
    if (i >= BRAND.regions) {
      clearInterval(iv);
      $('#dupTxt').innerHTML = `<b style="color:#D63638">56개 수정 완료 · 예상 소요 약 1.9시간</b><br>
        <span style="color:#646970">CPT 방식이었다면 1분이면 끝났을 작업입니다.</span>`;
      toast('⚠️ 복제 방식은 내용이 바뀔 때마다 이 작업이 반복됩니다', 'warn');
    }
  }, 40);
}

/* ============================================================
   예약자 관리
   ============================================================ */
function vBookings() {
  return `
    <h1>예약자 관리</h1>
    <p class="desc">현장 확인용 명단 · 엑셀 다운로드 · 환불 처리 (요구사항 2-3)</p>

    <div class="wp-notice warn">
      ⏳ <b>입금 대기 2건</b> 중 1건은 만료가 임박했습니다. 기한이 지나면 자동으로 취소되고 좌석이 풀립니다.
    </div>

    <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
      <select class="wp-btn" style="padding-right:8px" onchange="toast('회차별 필터가 적용됩니다')">
        <option>전체 회차</option>
        ${SESSIONS.slice(0, 6).map(s => `<option>${s.region} · ${s.date.slice(5)}</option>`).join('')}
      </select>
      <button class="wp-btn" onclick="toast('🖨 현장 확인용 명단을 인쇄합니다')">🖨 명단 인쇄</button>
      <button class="wp-btn primary" style="margin-left:auto" onclick="exportXlsx()">📊 엑셀 다운로드</button>
    </div>

    <div class="wp-card">
      <div class="tbl-scroll">
        <table class="wp-tbl">
          <thead><tr><th>신청번호</th><th>성함</th><th>연락처</th><th>지역·일시</th><th>업종</th><th>결제</th><th>상태</th><th>작업</th></tr></thead>
          <tbody>${BOOKINGS.map(b => {
            const [t, c] = ST_LABEL[b.st];
            return `<tr>
              <td class="mono" style="color:#646970">${b.id}</td>
              <td><b>${b.name}</b></td>
              <td class="mono">${b.phone}</td>
              <td>${b.region} · ${b.date.slice(5)}</td>
              <td>${b.biz}</td>
              <td>${b.pay}</td>
              <td><span class="wp-pill ${c}">${t}</span></td>
              <td style="white-space:nowrap">
                ${b.st === 'paid' ? `<button class="wp-btn sm danger" onclick="doRefund('${b.id}')">환불</button>` : ''}
                ${b.st === 'pending' ? `<button class="wp-btn sm" onclick="toast('💬 입금 독려 알림톡을 재발송했습니다','ok')">알림톡 재발송</button>` : ''}
                ${b.st === 'expired' ? '<span style="color:#646970;font-size:12px">좌석 자동 반환됨</span>' : ''}
                ${b.st === 'refund' ? '<span style="color:#646970;font-size:12px">처리 완료</span>' : ''}
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>

    <div class="wp-card">
      <div class="wp-card-hd">💸 환불 규정 (요구사항 2-2 — 취소 시점별 사전 설정)</div>
      <div class="wp-card-bd">
        <table class="wp-tbl">
          <thead><tr><th>취소 시점</th><th>환불 비율</th><th>처리 방식</th></tr></thead>
          <tbody>
            <tr><td>세미나 <b>7일 전</b>까지</td><td><b style="color:#00733B">100%</b></td><td>PG 자동 취소 (카드) / 계좌 환불 (가상계좌)</td></tr>
            <tr><td>세미나 <b>3일 전</b>까지</td><td><b style="color:#8A6116">50%</b></td><td>관리자 부분 환불 처리</td></tr>
            <tr><td>세미나 <b>당일·미참석</b></td><td><b style="color:#B32D2E">0%</b></td><td>환불 불가 (다른 지역 회차 1회 변경 무료)</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

function doRefund(id) {
  const b = BOOKINGS.find(x => x.id === id);
  if (!b) return;
  b.st = 'refund';
  render();
  toast(`💸 <b>${b.name}</b>님 환불 처리 완료 — 좌석이 반환되고 대기자에게 알림톡이 발송됩니다`, 'ok');
}

function exportXlsx() {
  const head = ['신청번호', '성함', '연락처', '지역', '일시', '업종', '결제수단', '상태', '신청시각'];
  const rows = [head, ...BOOKINGS.map(b => [b.id, b.name, b.phone, b.region, b.date, b.biz, b.pay, ST_LABEL[b.st][0], b.at])];
  const csv = rows.map(r => r.map(c => {
    const s = String(c).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  }).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `세미나56_예약자명단_20260726.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
  toast(`📊 <b>${a.download}</b> 다운로드 완료 · ${BOOKINGS.length}건`, 'ok');
}

/* ============================================================
   알림톡 템플릿
   ============================================================ */
function vAlim() {
  const approved = ALIM_TEMPLATES.filter(t => t.st === 'approved').length;
  const rejected = ALIM_TEMPLATES.filter(t => t.st === 'rejected').length;
  return `
    <h1>알림톡 템플릿</h1>
    <p class="desc">카카오 비즈니스 채널 · 발신프로필 인증 완료 · 템플릿 사전 심사 현황</p>

    <div class="wp-notice err">
      <b>⚠️ 일정에 반영해야 할 항목</b><br>
      알림톡은 <b>발신프로필 인증 → 템플릿 사전 심사</b>를 거쳐야 발송할 수 있습니다.
      검수는 영업일 1~2일이지만 <b>실제 반영까지 최대 2개월</b>이 걸릴 수 있어, 착수 즉시 신청해 개발과 병행해야 합니다.
      심사 지연에 대비해 <b>SMS·이메일 폴백</b>을 함께 구축합니다.
    </div>

    <div class="wp-stats" style="grid-template-columns:repeat(3,1fr)">
      <div class="wp-stat"><div class="lbl">승인 완료</div><div class="val" style="color:#00733B">${approved}</div><div class="sub">발송 가능</div></div>
      <div class="wp-stat"><div class="lbl">심사 중</div><div class="val" style="color:#8A6116">1</div><div class="sub">07-25 접수</div></div>
      <div class="wp-stat"><div class="lbl">반려</div><div class="val" style="color:#B32D2E">${rejected}</div><div class="sub">광고성 문구</div></div>
    </div>

    ${ALIM_TEMPLATES.map(t => {
      const badge = { approved: ['승인', 'p-green'], review: ['심사중', 'p-yellow'], rejected: ['반려', 'p-red'] }[t.st];
      return `
      <div class="wp-card">
        <div class="wp-card-hd">
          <span class="mono" style="font-size:12px;color:#646970">${t.code}</span>
          <b style="font-weight:600">${t.name}</b>
          <div class="right">
            <span style="font-size:11.5px;color:#646970">${t.days}</span>
            <span class="wp-pill ${badge[1]}">${badge[0]}</span>
          </div>
        </div>
        <div class="wp-card-bd">
          <div style="background:#F6F7F7;border:1px solid #DCDCDE;padding:12px 14px;font-size:12.5px;line-height:1.85;white-space:pre-line;font-family:var(--mono)">${t.body}</div>
          ${t.reason ? `
            <div style="margin-top:10px;background:#FCF0F1;border:1px solid #F5C6C7;padding:11px 13px;font-size:12.5px;color:#B32D2E;line-height:1.75">
              <b>반려 사유</b><br>${t.reason}
            </div>` : ''}
        </div>
      </div>`;
    }).join('')}`;
}

/* ============================================================
   검토 항목
   ============================================================ */
function vRisks() {
  const hi = RISKS.filter(r => r.lv === 'high').length;
  return `
    <h1>착수 전 검토 항목</h1>
    <p class="desc">기획서 검토 중 확인된 ${RISKS.length}건 (필수 대응 ${hi}건)</p>

    <div class="wp-notice err">
      기획서를 그대로 구현하면 <b>56개 페이지 유지보수가 감당되지 않고</b>,
      <b>가상계좌와 정원 마감이 충돌</b>하며, <b>알림톡 심사가 오픈 일정을 밀어냅니다.</b>
      아래는 각 항목과 이 데모에 실제로 적용한 대안입니다.
    </div>

    ${RISKS.map(r => `
      <div class="risk ${r.lv}">
        <div class="risk-t">
          <span style="font-size:16px">${r.ico}</span>
          <b>${r.t}</b>
          <span class="wp-pill ${r.lv === 'high' ? 'p-red' : r.lv === 'mid' ? 'p-yellow' : 'p-green'}">
            ${r.lv === 'high' ? '필수' : r.lv === 'mid' ? '권장' : '보완'}</span>
        </div>
        <p>${r.d}</p>
        <div class="src">📚 ${r.s}</div>
        <div class="fix">✓ ${r.f}</div>
      </div>`).join('')}`;
}

/* ============================================================
   라우팅
   ============================================================ */
const PAGES = {
  dash:     { fn: vDash },
  sessions: { fn: vSessions },
  regions:  { fn: vRegions },
  bookings: { fn: vBookings },
  alim:     { fn: vAlim },
  risks:    { fn: vRisks },
};

function goPage(p) {
  page = p;
  $$('.wp-nav button[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === p));
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  $('#wpBody').innerHTML = (PAGES[page] || PAGES.dash).fn();
  setTimeout(() => $$('.bar[data-w]').forEach(b => b.style.width = b.dataset.w + '%'), 60);
}

document.addEventListener('DOMContentLoaded', () => {
  $$('.wp-nav button[data-p]').forEach(b => b.addEventListener('click', () => goPage(b.dataset.p)));
  render();
});
