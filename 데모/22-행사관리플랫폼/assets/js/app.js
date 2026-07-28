/* ============================================================
   BOOTHPIN — 앱 화면 로직 (데모)
   기획서의 화면 구조를 그대로 폰 프레임 안에 구현
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const won = n => n === 0 ? '무료' : n.toLocaleString('ko-KR') + '원';

const S = {
  view: 'home',
  tab: 'home',
  stack: [],
  ctx: {},                 // 화면 간 전달 데이터
  applyForm: { cat: '', one: '', photos: 0, opts: [] },
  createForm: { cats: [], kind: '' },
  checked: new Set(['s1', 's2', 's3', 's6']),
  gradeMode: 'orig',
  mapSel: null,
  filter: '전체',
};

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.35s'; setTimeout(() => el.remove(), 350); }, 2800);
}

/* ---------- 라우팅 ---------- */
function go(v, ctx = {}, push = true) {
  if (push && S.view !== v) S.stack.push({ v: S.view, ctx: { ...S.ctx } });
  S.ctx = ctx;
  S.view = v;
  const tabOf = { home:'home', seller:'home', create:'home', hosted:'home', joined:'home',
    participants:'home', attendee:'home', qr:'home', scan:'home',
    map:'map', nearby:'map', detail:'map', apply:'map',
    chat:'chat', room:'chat', profile:'profile', grade:'profile', risks:'profile' };
  S.tab = tabOf[v] || 'home';
  render();
  $('.body')?.scrollTo({ top: 0 });
}
function back() {
  const p = S.stack.pop();
  if (p) { S.view = p.v; S.ctx = p.ctx; const t={seller:'home',create:'home'}; render(); }
  else go('home', {}, false);
}
function goTab(t) {
  S.stack = [];
  go({ home:'home', map:'map', chat:'chat', profile:'profile' }[t], {}, false);
}

/* ---------- 공통 UI 조각 ---------- */
const bar = (title, opts = {}) => `
  <div class="appbar">
    ${opts.back !== false ? `<button class="back" onclick="back()">‹</button>` : ''}
    <h1>${title}</h1>
    <div class="act">${opts.act || ''}</div>
  </div>`;

const evCard = (e, onclick) => `
  <div class="ev-card" onclick="${onclick}">
    <div class="ev-img">
      ${imgFor(e.img)}
      <span class="dday">D-${e.dday}</span>
      <span class="kind">${e.kind}</span>
    </div>
    <div class="ev-body">
      <h3>${e.name}</h3>
      <div class="ev-meta">
        <div>📅 ${e.date.slice(5).replace('-', '월 ')}일</div>
        <div>📍 ${e.place.split(' ').slice(0, 3).join(' ')}</div>
      </div>
      <div class="ev-foot">
        <span class="fee">${won(e.fee)}<small>${e.fee ? ' / 부스' : ''}</small></span>
        <span class="slots">모집 <b>${e.applied}</b>/${e.cap}</span>
      </div>
    </div>
  </div>`;

/* 이미지 대체 — CSS 그라디언트 플레이스홀더 (에셋 없이도 완결) */
function imgFor(key) {
  const g = {
    market1: 'linear-gradient(135deg,#FFB27A,#FF6600)',
    market2: 'linear-gradient(135deg,#7C5CFF,#3659E3)',
    market3: 'linear-gradient(135deg,#63E6BE,#12B886)',
    market4: 'linear-gradient(135deg,#FFD43B,#F59F00)',
    market5: 'linear-gradient(135deg,#B197FC,#7950F2)',
    market6: 'linear-gradient(135deg,#74C0FC,#3659E3)',
  }[key] || 'linear-gradient(135deg,#CED4DA,#868B94)';
  const ico = { market1:'🎪', market2:'🌙', market3:'🌱', market4:'🐾', market5:'🕰', market6:'🧸' }[key] || '🎪';
  return `<div style="width:100%;height:100%;background:${g};display:grid;place-items:center;font-size:34px">${ico}</div>`;
}

const gradeBadge = (joined) => {
  const g = S.gradeMode === 'orig' ? gradeOriginal(joined) : gradeFixed(joined);
  return `<span class="grade ${g.cls}">${g.g}</span>${g.isTop ? ' <span class="grade g-top">TOP10</span>' : ''}`;
};

/* ============================================================
   1. 홈
   ============================================================ */
function vHome() {
  return `
    ${bar('부스핀', { back: false, act: `<button class="icon-btn" onclick="toast('🔔 알림 3건')">🔔</button>` })}
    <div class="body">
      <div class="pad">
        <div style="margin-bottom:14px">
          <div style="font-size:19px;font-weight:800;letter-spacing:-.6px">안녕하세요, ${ME.nick}님 👋</div>
          <div style="font-size:13px;color:var(--ink-2);margin-top:4px">이번 주 내 주변에 <b style="color:var(--brand)">6개</b>의 행사가 열려요</div>
        </div>

        <div class="quad" style="margin-bottom:18px">
          <button class="quad-btn primary" onclick="go('create')">
            <span class="qi">🎪</span><b>행사 만들기</b><span>주최자로 셀러 모집</span></button>
          <button class="quad-btn" onclick="go('seller')">
            <span class="qi">🧺</span><b>셀러 등록</b><span>내 부스 정보 설정</span></button>
          <button class="quad-btn" onclick="go('hosted')">
            <span class="cnt">${HOSTED.reduce((s,h)=>s+h.pending,0)}</span>
            <span class="qi">📋</span><b>개최 행사관리</b><span>신청 승인·출석</span></button>
          <button class="quad-btn" onclick="go('joined')">
            <span class="cnt">${JOINED.length}</span>
            <span class="qi">🎟</span><b>참여 행사관리</b><span>내 신청 현황</span></button>
        </div>

        <div class="sec-t">🔥 마감 임박<span class="more" onclick="goTab('map')">전체보기 ›</span></div>
        ${EVENTS.slice(0, 2).map(e => evCard(e, `go('detail',{id:'${e.id}'})`)).join('')}

        <div class="sec-t" style="margin-top:16px">✨ 새로 열린 행사</div>
        ${EVENTS.slice(2, 4).map(e => evCard(e, `go('detail',{id:'${e.id}'})`)).join('')}
      </div>
    </div>`;
}

/* ============================================================
   2. 셀러 등록
   ============================================================ */
function vSeller() {
  return `
    ${bar('셀러 등록')}
    <div class="body"><div class="pad">
      <div style="background:var(--brand-soft);border:1px solid rgba(255,102,0,.18);border-radius:10px;padding:12px 14px;font-size:12px;color:#9A4B00;line-height:1.7;margin-bottom:16px">
        🔒 실명·나이·연락처는 <b>비공개</b>입니다. 신청한 행사의 주최자에게만 표시되며, 신청 시 제공 동의를 받습니다.
      </div>

      <div class="fld"><label>프로필 사진</label>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="av" style="width:62px;height:62px;background:${ME.color};font-size:22px">${ME.avatar}</div>
          <button class="btn btn-line btn-s">사진 변경</button>
        </div>
      </div>

      <div class="fld"><label>부스명(닉네임) <span class="req">*</span></label>
        <input type="text" value="${ME.nick}"></div>

      <div class="fld"><label>부스 설명 <span class="req">*</span></label>
        <textarea placeholder="어떤 부스인지 소개해 주세요">${ME.one}</textarea></div>

      <div class="fld"><label>판매 품목 카테고리 <span class="req">*</span> <span class="lock">중복 선택 가능</span></label>
        <div class="multi">${CATS.map(c => `
          <button class="mc ${ME.cats.includes(c) ? 'on' : ''}" onclick="this.classList.toggle('on')">${c}</button>`).join('')}</div>
      </div>

      <div class="fld"><label>포트폴리오 <span class="lock">사진 + 한 줄 메모</span></label>
        <div class="upl" onclick="toast('📷 갤러리가 열립니다 (데모)')">＋ 작업 사진을 등록해 주세요</div>
        <div class="thumbs">
          ${[1,2,3,4,5].map(i=>`<div class="thumb">${['🪴','🕯','🧶','🌿','🫙'][i-1]}</div>`).join('')}
        </div>
      </div>

      <div style="height:1px;background:var(--line);margin:20px 0"></div>
      <div style="font-size:12.5px;font-weight:800;color:var(--ink-2);margin-bottom:12px">🔒 비공개 정보 (주최자만 열람)</div>

      <div class="fld-row">
        <div class="fld"><label>실명 <span class="lock">비공개</span></label><input type="text" value="김마루"></div>
        <div class="fld"><label>나이 <span class="lock">비공개</span></label><input type="number" value="34"></div>
      </div>
      <div class="fld"><label>연락처 <span class="lock">비공개</span></label>
        <input type="text" value="010-1234-1234">
        <p class="hint">승인된 행사의 주최자에게 <b>행사 기간에만</b> 공개됩니다</p>
      </div>

      <button class="btn btn-primary" onclick="toast('✅ 셀러 정보가 저장되었습니다','ok')">저장하기</button>
      <div style="height:16px"></div>
    </div></div>`;
}

/* ============================================================
   3. 행사 만들기
   ============================================================ */
function vCreate() {
  return `
    ${bar('행사 만들기')}
    <div class="body"><div class="pad">
      <div class="fld"><label>행사명 <span class="req">*</span></label>
        <input type="text" placeholder="예) 성수 봄바람 플리마켓"></div>

      <div class="fld"><label>행사 소개 사진 <span class="req">*</span></label>
        <div class="upl" onclick="toast('📷 대표 사진을 등록합니다 (데모)')">＋ 대표 사진 (최대 5장)</div></div>

      <div class="fld"><label>행사 설명</label>
        <textarea placeholder="어떤 행사인지, 어떤 셀러를 찾는지 적어 주세요"></textarea></div>

      <div class="fld-row">
        <div class="fld"><label>날짜 <span class="req">*</span></label><input type="date" value="2026-09-12"></div>
        <div class="fld"><label>모집 인원 <span class="req">*</span></label><input type="number" placeholder="40"></div>
      </div>

      <div class="fld"><label>장소 <span class="req">*</span></label>
        <div style="display:flex;gap:8px">
          <input type="text" placeholder="주소 검색" style="flex:1" readonly onclick="toast('🔍 주소 검색 API 연동 지점')">
          <button class="btn btn-line btn-s" style="flex-shrink:0" onclick="toast('🔍 주소 검색 (데모)')">검색</button>
        </div>
        <input type="text" placeholder="상세주소" style="margin-top:8px">
      </div>

      <div class="fld"><label>행사 종류 <span class="req">*</span></label>
        <select><option value="">선택해 주세요</option>${KINDS.map(k=>`<option>${k}</option>`).join('')}</select></div>

      <div class="fld"><label>모집 판매품목 <span class="req">*</span> <span class="lock">중복 선택 가능</span></label>
        <div class="multi">${CATS.map(c=>`<button class="mc" onclick="this.classList.toggle('on')">${c}</button>`).join('')}</div>
      </div>

      <div class="fld"><label>참가비</label>
        <input type="number" placeholder="30000">
        <p class="hint">💳 결제는 <b>주최자 명의로 직접 수취</b>됩니다 (PG 하위 가맹점 구조 — 검토 항목 참고)</p>
      </div>

      <div class="fld"><label>추가 옵션 <span class="lock">셀러가 선택 구매</span></label>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${[['전기 사용','10000'],['테이블 대여','5000']].map(([n,p])=>`
            <div style="display:flex;gap:8px">
              <input type="text" value="${n}" style="flex:1">
              <input type="number" value="${p}" style="width:104px">
            </div>`).join('')}
          <button class="btn btn-line btn-s" style="width:100%" onclick="toast('➕ 옵션 항목이 추가됩니다')">＋ 옵션 추가</button>
        </div>
      </div>

      <div style="background:var(--warn-soft);border:1px solid rgba(245,159,0,.22);border-radius:10px;padding:12px 14px;font-size:11.5px;color:#9A6800;line-height:1.7;margin-bottom:14px">
        ⚠️ <b>환불 규정이 자동 안내됩니다</b> — D-7 100% / D-3 50% / 당일 0%. 셀러는 신청 시 동의합니다. (노쇼 대응 — 검토 항목)
      </div>

      <button class="btn btn-primary" onclick="toast('🎪 행사가 등록되었습니다. 승인 후 지도에 노출됩니다','ok')">행사 등록하기</button>
      <div style="height:16px"></div>
    </div></div>`;
}

/* ============================================================
   4. 개최 행사관리
   ============================================================ */
function vHosted() {
  return `
    ${bar('개최 행사관리')}
    <div class="body"><div class="pad">
      ${HOSTED.map(h => `
        <div class="ev-card" style="padding:0">
          <div style="padding:14px 15px 13px">
            <div style="display:flex;align-items:flex-start;gap:9px">
              <div style="flex:1;min-width:0">
                <h3 style="font-size:15px;font-weight:800;letter-spacing:-.3px">${h.name}</h3>
                <div style="font-size:12px;color:var(--ink-3);margin-top:4px">📅 ${h.date} · 📍 ${h.place.split(' ').slice(0,3).join(' ')}</div>
              </div>
              ${h.pending ? `<span class="tag tag-warn">승인대기 ${h.pending}</span>` : '<span class="tag tag-good">모집완료</span>'}
            </div>
            <div class="stat-row" style="margin-top:12px">
              <div class="stat"><b>${h.applied}</b><span>신청</span></div>
              <div class="stat"><b style="color:var(--good)">${h.approved}</b><span>승인</span></div>
              <div class="stat"><b style="color:var(--brand)">${h.checked}</b><span>출석</span></div>
            </div>
            <div class="prog"><i data-w="${(h.approved/h.cap*100).toFixed(0)}"></i></div>
            <div style="font-size:11px;color:var(--ink-3);margin-top:6px">모집률 ${(h.approved/h.cap*100).toFixed(0)}% (${h.approved}/${h.cap}명)</div>
            <div style="display:flex;gap:7px;margin-top:12px">
              <button class="btn btn-line btn-s" style="flex:1" onclick="go('room',{ev:'${h.name}'})">💬 채팅방</button>
              <button class="btn btn-primary btn-s" style="flex:1" onclick="go('participants',{ev:'${h.name}',id:'${h.id}'})">👥 참여자 목록</button>
            </div>
          </div>
        </div>`).join('')}
      <div style="height:8px"></div>
    </div></div>`;
}

/* ============================================================
   5. 참여자 목록 (출석 + 승인)
   ============================================================ */
function vParticipants() {
  const ev = S.ctx.ev || '성수 봄바람 플리마켓';
  const checkedN = SELLERS.filter(s => S.checked.has(s.id)).length;
  return `
    ${bar('참여자 목록', { act: `
      <button class="icon-btn" onclick="go('qr',{ev:'${ev}'})" title="출석 QR">🔳</button>
      <button class="icon-btn" onclick="exportXlsx()" title="엑셀 다운로드">📊</button>` })}
    <div class="body">
      <div style="padding:12px 16px;background:var(--white);border-bottom:1px solid var(--line)">
        <div style="font-size:12.5px;color:var(--ink-2)">${ev}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:7px">
          <div style="font-size:13px"><b style="color:var(--brand);font-size:17px">${checkedN}</b> <span class="faint">/ ${SELLERS.length}명 출석</span></div>
          <button class="btn btn-line btn-s" style="margin-left:auto" onclick="toast('📶 오프라인 모드 — 명단을 기기에 저장했습니다. 네트워크 없이 출석 체크할 수 있어요','ok')">📶 오프라인 준비</button>
        </div>
      </div>
      <div class="pad">
        ${SELLERS.map(s => {
          const on = S.checked.has(s.id);
          return `
          <div class="li">
            <div class="av" style="background:${s.c}" onclick="go('attendee',{sid:'${s.id}'})">${s.av}</div>
            <div class="li-b" onclick="go('attendee',{sid:'${s.id}'})">
              <div class="nm">${s.nick} ${gradeBadge(s.joined)}</div>
              <div class="sub">${s.cat} · ${s.one}</div>
            </div>
            <div class="li-r">
              ${s.st === 'pending'
                ? `<span class="tag tag-warn">승인대기</span>`
                : `<button class="btn ${on ? 'btn-primary' : 'btn-line'} btn-s" onclick="toggleCheck('${s.id}',event)">${on ? '✓ 출석' : '출석'}</button>`}
            </div>
          </div>`;
        }).join('')}
        <div style="background:var(--white);border:1px solid var(--line);border-radius:12px;padding:13px 15px;font-size:11.5px;color:var(--ink-2);line-height:1.75;margin-top:4px">
          💡 출석 버튼을 <b>한 번 더 누르면 취소</b>됩니다. QR이 안 될 때를 대비해 닉네임 수동 조회와 종이 명단 출력도 제공합니다.
        </div>
      </div>
    </div>`;
}
function toggleCheck(id, e) {
  e?.stopPropagation();
  S.checked.has(id) ? S.checked.delete(id) : S.checked.add(id);
  render();
  toast(S.checked.has(id) ? '✅ 출석 처리되었습니다' : '출석이 취소되었습니다', S.checked.has(id) ? 'ok' : '');
}
function exportXlsx() {
  const head = ['닉네임','실명','나이','등급','판매품목','제품 한줄소개','추가옵션','승인상태','출석'];
  const rows = [head, ...SELLERS.map(s => {
    const g = S.gradeMode === 'orig' ? gradeOriginal(s.joined) : gradeFixed(s.joined);
    return [s.nick, s.real, s.age, g.g, s.cat, s.one, s.opt ? 'Y' : 'N',
      s.st === 'approved' ? '승인' : '대기', S.checked.has(s.id) ? '출석' : '미출석'];
  })];
  const csv = rows.map(r => r.map(c => {
    const t = String(c).replace(/"/g, '""');
    return /[",\n]/.test(t) ? `"${t}"` : t;
  }).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `참여자목록_${(S.ctx.ev||'행사').slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
  toast('📊 엑셀 다운로드 완료<br><span style="font-size:10.5px;opacity:.85">반출 이력이 기록되며 행사 종료 30일 후 차단됩니다</span>', 'ok');
}

/* ============================================================
   6. 참여자 상세 (승인/거절)
   ============================================================ */
function vAttendee() {
  const s = SELLERS.find(x => x.id === S.ctx.sid) || SELLERS[0];
  return `
    ${bar(s.nick)}
    <div class="body"><div class="pad">
      <div class="prof-hd">
        <div class="av" style="background:${s.c}">${s.av}</div>
        <div class="nm">${s.nick} ${gradeBadge(s.joined)}</div>
        <div class="one">${s.one}</div>
        <div style="display:flex;gap:16px;justify-content:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">
          <div><b style="font-size:16px;font-weight:800">${s.joined}</b><span style="font-size:11px;color:var(--ink-3);display:block">참여</span></div>
          <div><b style="font-size:16px;font-weight:800;color:${s.joined>3?'var(--good)':'var(--warn)'}">${s.joined>3?'2%':'—'}</b><span style="font-size:11px;color:var(--ink-3);display:block">노쇼율</span></div>
          <div><b style="font-size:16px;font-weight:800">${s.opt?'있음':'없음'}</b><span style="font-size:11px;color:var(--ink-3);display:block">추가옵션</span></div>
        </div>
      </div>

      <div style="background:var(--white);border:1px solid var(--line);border-radius:12px;padding:14px 15px;margin-top:10px">
        <div style="font-size:11.5px;font-weight:800;color:var(--ink-3);letter-spacing:.05em;margin-bottom:10px">🔒 주최자 열람 정보</div>
        ${[['실명', s.real], ['나이', s.age + '세'], ['판매 품목', s.cat], ['추가옵션', s.opt ? '전기 사용, 테이블 대여' : '없음']]
          .map(([k, v]) => `<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--line)"><span class="faint">${k}</span><b style="font-weight:600">${v}</b></div>`).join('')}
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0"><span class="faint">연락처</span><b style="font-weight:600">행사 기간에 공개</b></div>
      </div>

      <div style="margin-top:10px">
        <div class="sec-t" style="font-size:13px">판매할 품목 사진</div>
        <div class="thumbs">${['🪴','🕯','🧶'].map(i=>`<div class="thumb" style="width:76px;height:76px;font-size:24px">${i}</div>`).join('')}</div>
      </div>

      <button class="btn btn-line" style="margin-top:12px" onclick="toast('🖼 포트폴리오 5장을 확인합니다')">📁 포트폴리오 보기</button>

      ${s.st === 'pending' ? `
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn btn-line" style="flex:1" onclick="openReject()">거절</button>
          <button class="btn btn-primary" style="flex:1.4" onclick="toast('✅ ${s.nick}님을 승인했습니다','ok');back()">승인하기</button>
        </div>`
        : `<div style="margin-top:14px;text-align:center;font-size:12.5px;color:var(--good);font-weight:700;padding:12px;background:var(--good-soft);border-radius:10px">✓ 승인 완료된 참여자입니다</div>`}
      <div style="height:16px"></div>
    </div></div>`;
}
function openReject() {
  $('#sheetWrap').innerHTML = `
    <div class="sheet">
      <div class="sheet-grip"></div>
      <h3>참여 거절</h3>
      <p style="font-size:12.5px;color:var(--ink-2);margin-bottom:14px">거절 사유는 신청자에게 그대로 전달됩니다.</p>
      <div class="fld">
        <label>거절 사유 <span class="lock">40자 이내</span></label>
        <textarea id="rejReason" maxlength="40" placeholder="예) 모집 품목과 맞지 않아 이번 회차는 어렵습니다"></textarea>
        <p class="hint"><span id="rejCount">0</span> / 40자</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-line" style="flex:1" onclick="closeSheet()">취소</button>
        <button class="btn btn-dark" style="flex:1" onclick="doReject()">거절하기</button>
      </div>
    </div>`;
  $('#sheetWrap').classList.add('show');
  $('#rejReason').addEventListener('input', e => { $('#rejCount').textContent = e.target.value.length; });
}
function doReject() {
  const v = $('#rejReason').value.trim();
  if (!v) return toast('거절 사유를 입력해 주세요', 'err');
  closeSheet(); back();
  toast('거절 처리되었습니다. 사유가 신청자에게 전달됩니다');
}
function closeSheet() { $('#sheetWrap').classList.remove('show'); }

/* ============================================================
   7. 출석 QR 발급
   ============================================================ */
function vQr() {
  return `
    ${bar('출석용 QR')}
    <div class="body"><div class="pad">
      <div class="qr-box">
        <div style="font-size:13px;font-weight:700;margin-bottom:3px">${S.ctx.ev || '성수 봄바람 플리마켓'}</div>
        <div style="font-size:11.5px;color:var(--ink-3);margin-bottom:16px">셀러가 이 코드를 스캔하면 출석 처리됩니다</div>
        ${qrSvg()}
        <div style="font-size:11px;color:var(--ink-3);margin-top:14px;font-family:monospace">BP-2026-E1-CHECKIN</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-line" style="flex:1" onclick="window.print()">🖨 인쇄</button>
        <button class="btn btn-line" style="flex:1" onclick="toast('💾 이미지로 저장되었습니다')">💾 저장</button>
      </div>
      <div style="background:var(--white);border:1px solid var(--line);border-radius:12px;padding:14px 15px;font-size:11.5px;color:var(--ink-2);line-height:1.8;margin-top:12px">
        📶 <b>네트워크가 끊겨도 동작합니다.</b> 승인자 명단이 기기에 미리 저장되어 있어 오프라인에서 검증·기록하고, 연결되면 자동으로 동기화됩니다.<br>
        🖨 QR을 못 쓰는 상황을 위해 <b>종이 명단 인쇄</b>와 닉네임 수동 조회를 함께 제공합니다.
      </div>
      <div style="height:16px"></div>
    </div></div>`;
}
/* 결정론적 QR 형태 SVG (실제 인코딩 아님 — 시각 시연용) */
function qrSvg() {
  const N = 21;
  let seed = 987654321;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  let cells = '';
  const finder = (ox, oy) => {
    let s = `<rect x="${ox}" y="${oy}" width="7" height="7" fill="#1A1C20"/>
             <rect x="${ox+1}" y="${oy+1}" width="5" height="5" fill="#fff"/>
             <rect x="${ox+2}" y="${oy+2}" width="3" height="3" fill="#1A1C20"/>`;
    return s;
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const inFinder = (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    if (inFinder) continue;
    if (rnd() > .52) cells += `<rect x="${x}" y="${y}" width="1" height="1" fill="#1A1C20"/>`;
  }
  return `<svg class="qr-img" viewBox="0 0 ${N} ${N}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${N}" height="${N}" fill="#fff"/>${cells}
    ${finder(0,0)}${finder(N-7,0)}${finder(0,N-7)}</svg>`;
}

/* ============================================================
   8. 참여 행사관리
   ============================================================ */
function vJoined() {
  const label = { approved: ['승인됨', 'tag-good'], pending: ['승인대기', 'tag-warn'], rejected: ['거절됨', 'tag-bad'] };
  return `
    ${bar('참여 행사관리')}
    <div class="body"><div class="pad">
      ${JOINED.map(j => {
        const [t, c] = label[j.status];
        return `
        <div class="ev-card" style="padding:0">
          <div style="padding:14px 15px">
            <div style="display:flex;align-items:flex-start;gap:9px">
              <div style="flex:1;min-width:0">
                <h3 style="font-size:15px;font-weight:800;letter-spacing:-.3px">${j.name}</h3>
                <div style="font-size:12px;color:var(--ink-3);margin-top:4px">📅 ${j.date} · ${j.myCat}</div>
              </div>
              <span class="tag ${c}">${t}</span>
            </div>
            ${j.status === 'rejected' ? `
              <div style="background:var(--bad-soft);border-radius:9px;padding:11px 13px;margin-top:11px;font-size:12px;color:#A02020;line-height:1.65">
                <b>거절 사유</b><br>${j.reason}
              </div>` : ''}
            ${j.status === 'approved' ? `
              <div style="display:flex;gap:7px;margin-top:12px">
                <button class="btn btn-line btn-s" style="flex:1" onclick="go('room',{ev:'${j.name}'})">💬 채팅방</button>
                <button class="btn btn-line btn-s" style="flex:1" onclick="go('participants',{ev:'${j.name}'})">👥 참여자</button>
                <button class="btn btn-primary btn-s" style="flex:1" onclick="go('scan')">📷 출석</button>
              </div>` : ''}
            ${j.status === 'pending' ? `
              <div style="margin-top:11px;font-size:11.5px;color:var(--ink-3)">주최자 승인을 기다리고 있어요 · 신청일 2026-07-24</div>` : ''}
          </div>
        </div>`;
      }).join('')}
      <div style="height:8px"></div>
    </div></div>`;
}

/* ============================================================
   9. QR 스캔
   ============================================================ */
function vScan() {
  return `
    ${bar('출석 체크')}
    <div class="body"><div class="pad">
      <div class="qr-scan">
        <div class="qr-frame"><i></i><i></i><i></i><i></i><div class="qr-line"></div></div>
        <div style="position:absolute;bottom:18px;left:0;right:0;text-align:center;color:#fff;font-size:12.5px;opacity:.85">
          주최자의 QR 코드를 화면에 맞춰 주세요
        </div>
      </div>
      <button class="btn btn-primary" style="margin-top:14px" onclick="toast('✅ 출석 완료! 한강 야시장 위켄드','ok')">스캔 시뮬레이션</button>
      <button class="btn btn-line" style="margin-top:8px" onclick="toast('🔍 닉네임으로 수동 조회합니다 (QR 실패 대비)')">QR이 안 되나요? 수동 조회</button>
      <div style="background:var(--white);border:1px solid var(--line);border-radius:12px;padding:13px 15px;font-size:11.5px;color:var(--ink-2);line-height:1.8;margin-top:12px">
        📶 행사장은 동시 접속이 몰려 네트워크가 자주 끊깁니다. 스캔 기록은 <b>기기에 먼저 저장</b>되고 연결되면 자동 전송됩니다.
      </div>
    </div></div>`;
}

/* ============================================================
   10. 지도 탐색
   ============================================================ */
function vMap() {
  const sel = S.mapSel ? EVENTS.find(e => e.id === S.mapSel) : null;
  return `
    ${bar('내 주변 행사', { back: false, act: `<button class="icon-btn" onclick="go('nearby')">☰</button>` })}
    <div class="body" style="overflow:hidden;position:relative">
      <div class="map">
        <div class="map-water" style="left:-16%;top:44%;width:150%;height:16%;transform:rotate(-6deg)"></div>
        <div class="map-blob" style="left:8%;top:8%;width:34%;height:20%"></div>
        <div class="map-blob" style="right:4%;bottom:16%;width:30%;height:18%"></div>
        <div class="map-road" style="left:0;top:32%;width:100%;height:7px"></div>
        <div class="map-road" style="left:38%;top:0;width:7px;height:100%"></div>
        <div class="map-road" style="left:0;top:66%;width:100%;height:5px"></div>
        <div class="map-road" style="left:72%;top:0;width:5px;height:100%"></div>

        ${[[20,30],[55,50],[80,22]].map(([x,y])=>`<div class="foot" style="left:${x}%;top:${y}%">👣</div>`).join('')}

        ${EVENTS.map(e => `
          <div class="pin ${S.mapSel === e.id ? 'on' : ''}" style="left:${e.x}%;top:${e.y}%" onclick="selPin('${e.id}')">
            <div class="pin-body">${e.kind}</div>
            <div class="pin-tail"></div><div class="pin-dot"></div>
          </div>`).join('')}

        <div class="map-fab" onclick="toast('📍 현재 위치로 이동합니다')">◎</div>

        <div class="map-sheet">
          <div class="sheet-grip"></div>
          ${sel ? `
            <div style="display:flex;gap:11px;align-items:flex-start">
              <div style="width:56px;height:56px;border-radius:10px;overflow:hidden;flex-shrink:0">${imgFor(sel.img)}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:14.5px;font-weight:800;letter-spacing:-.3px">${sel.name}</div>
                <div style="font-size:11.5px;color:var(--ink-3);margin-top:3px">📅 ${sel.date.slice(5)} · 📍 ${sel.place.split(' ').slice(0,3).join(' ')}</div>
                <div style="font-size:11.5px;color:var(--ink-3);margin-top:2px">참가비 <b style="color:var(--ink)">${won(sel.fee)}</b> · 모집 ${sel.applied}/${sel.cap}</div>
              </div>
            </div>
            <div style="display:flex;gap:7px;margin-top:12px">
              <button class="btn btn-line btn-s" style="flex:1" onclick="go('detail',{id:'${sel.id}'})">행사 정보 보기</button>
              <button class="btn btn-primary btn-s" style="flex:1" onclick="go('apply',{id:'${sel.id}'})">참여하기</button>
            </div>`
          : `
            <div style="font-size:13px;font-weight:700;margin-bottom:9px">가까운 행사 ${EVENTS.length}곳</div>
            <div style="font-size:11.5px;color:var(--ink-3);line-height:1.7">
              지도의 핀을 누르면 행사 정보가 표시됩니다.<br>
              👣 발자국은 <b>내가 참여했던 행사</b> 지점이에요.
            </div>`}
        </div>
      </div>
    </div>`;
}
function selPin(id) { S.mapSel = S.mapSel === id ? null : id; render(); }

/* ============================================================
   11. 근처 행사 목록
   ============================================================ */
function vNearby() {
  const list = S.filter === '전체' ? EVENTS : EVENTS.filter(e => e.kind === S.filter);
  const kinds = ['전체', ...new Set(EVENTS.map(e => e.kind))];
  return `
    ${bar('근처 행사')}
    <div class="body"><div class="pad">
      <div class="chips">${kinds.map(k => `
        <button class="chip ${S.filter === k ? 'on' : ''}" onclick="setFilter('${k}')">${k}</button>`).join('')}</div>
      <div style="font-size:11.5px;color:var(--ink-3);margin-bottom:10px">가까운 순 · ${list.length}개</div>
      ${list.length ? list.map((e, i) => `
        <div class="ev-card" onclick="go('detail',{id:'${e.id}'})">
          <div style="display:flex;gap:12px;padding:12px 13px">
            <div style="width:74px;height:74px;border-radius:10px;overflow:hidden;flex-shrink:0">${imgFor(e.img)}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px">
                <span class="tag tag-gray">${e.kind}</span>
                <span style="font-size:11px;color:var(--brand);font-weight:700">${(1.2 + i * 0.8).toFixed(1)}km</span>
              </div>
              <div style="font-size:14px;font-weight:700;margin-top:5px;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.name}</div>
              <div style="font-size:11.5px;color:var(--ink-3);margin-top:3px">📅 ${e.date.slice(5)} · ${won(e.fee)}</div>
              <div style="font-size:11px;color:var(--ink-3);margin-top:2px">모집 <b style="color:var(--brand)">${e.applied}</b>/${e.cap}명</div>
            </div>
          </div>
        </div>`).join('')
        : `<div class="empty"><span class="ei">🔍</span>해당 종류의 행사가 없어요</div>`}
      <div style="height:8px"></div>
    </div></div>`;
}
function setFilter(k) { S.filter = k; render(); }

/* ============================================================
   12. 행사 정보 보기
   ============================================================ */
function vDetail() {
  const e = EVENTS.find(x => x.id === S.ctx.id) || EVENTS[0];
  return `
    ${bar(e.kind, { act: `<button class="icon-btn" onclick="toast('🔗 링크를 복사했습니다')">↗</button>` })}
    <div class="body">
      <div style="aspect-ratio:16/9">${imgFor(e.img)}</div>
      <div class="pad">
        <span class="tag tag-brand">D-${e.dday}</span>
        <h2 style="font-size:19px;font-weight:800;letter-spacing:-.6px;margin-top:9px;line-height:1.35">${e.name}</h2>
        <div style="font-size:12.5px;color:var(--ink-3);margin-top:6px">주최 · ${e.host}</div>

        <div style="background:var(--white);border:1px solid var(--line);border-radius:12px;padding:14px 15px;margin-top:14px">
          ${[['📅 날짜', e.date], ['📍 장소', e.place + ' ' + e.detail], ['🎪 종류', e.kind],
             ['👥 모집 인원', `${e.cap}명 (현재 ${e.applied}명 신청)`], ['💰 참가비', won(e.fee)]]
            .map(([k, v]) => `
            <div style="display:flex;gap:12px;font-size:13px;padding:7px 0;border-bottom:1px solid var(--line)">
              <span class="faint" style="width:78px;flex-shrink:0">${k}</span><b style="font-weight:600;flex:1">${v}</b>
            </div>`).join('')}
          <div style="display:flex;gap:12px;font-size:13px;padding:7px 0">
            <span class="faint" style="width:78px;flex-shrink:0">🧺 모집 품목</span>
            <span style="flex:1;display:flex;gap:4px;flex-wrap:wrap">${e.cats.map(c=>`<span class="tag tag-gray">${c}</span>`).join('')}</span>
          </div>
        </div>

        <div class="sec-t" style="margin-top:16px;font-size:14px">행사 소개</div>
        <p style="font-size:13.5px;color:var(--ink-2);line-height:1.8">${e.desc}</p>

        ${e.opts.length ? `
          <div class="sec-t" style="margin-top:16px;font-size:14px">추가 옵션</div>
          ${e.opts.map(o => `
            <div style="display:flex;justify-content:space-between;font-size:13px;padding:9px 13px;background:var(--white);border:1px solid var(--line);border-radius:9px;margin-bottom:6px">
              <span>${o.n}</span><b style="font-weight:700">+${o.p.toLocaleString()}원</b>
            </div>`).join('')}` : ''}

        <div style="height:12px"></div>
      </div>
      <div style="padding:12px 16px;background:var(--white);border-top:1px solid var(--line);position:sticky;bottom:0">
        <button class="btn btn-primary" onclick="go('apply',{id:'${e.id}'})">참여 신청하기</button>
      </div>
    </div>`;
}

/* ============================================================
   13. 참여하기
   ============================================================ */
function vApply() {
  const e = EVENTS.find(x => x.id === S.ctx.id) || EVENTS[0];
  const total = e.fee + S.applyForm.opts.reduce((s, i) => s + e.opts[i].p, 0);
  return `
    ${bar('참여 신청')}
    <div class="body"><div class="pad">
      <div style="font-size:12.5px;color:var(--ink-3);margin-bottom:4px">${e.name}</div>

      <div class="sec-t" style="font-size:13px;margin-top:14px">내 프로필</div>
      <div class="li" style="margin-bottom:14px">
        <div class="av" style="background:${ME.color}">${ME.avatar}</div>
        <div class="li-b"><div class="nm">${ME.nick} ${gradeBadge(ME.joined)}</div>
          <div class="sub">${ME.one}</div></div>
      </div>

      <div class="fld"><label>판매 품목 <span class="req">*</span></label>
        <select id="apCat" onchange="S.applyForm.cat=this.value">
          <option value="">선택해 주세요</option>
          ${CATS.map(c => `<option ${S.applyForm.cat === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select></div>

      <div class="fld"><label>제품 한 줄 소개 <span class="req">*</span></label>
        <input type="text" id="apOne" maxlength="40" placeholder="예) 유리 테라리움과 이끼 정원" value="${S.applyForm.one}"
          oninput="S.applyForm.one=this.value"></div>

      <div class="fld"><label>판매할 품목 사진 <span class="req">*</span> <span class="lock">최소 1장 · 최대 5장</span></label>
        <div class="upl" onclick="addPhoto()">＋ 사진 추가 (${S.applyForm.photos}/5)</div>
        ${S.applyForm.photos ? `<div class="thumbs">${Array.from({length:S.applyForm.photos},(_,i)=>
          `<div class="thumb">${['🪴','🕯','🧶','🌿','🫙'][i]}<span class="x" onclick="rmPhoto(event)">✕</span></div>`).join('')}</div>` : ''}
      </div>

      ${e.opts.length ? `
        <div class="fld"><label>추가 옵션 <span class="lock">선택</span></label>
          ${e.opts.map((o, i) => `
            <label style="display:flex;align-items:center;gap:10px;padding:12px 13px;background:var(--white);border:1px solid ${S.applyForm.opts.includes(i)?'var(--brand)':'var(--line-2)'};border-radius:9px;margin-bottom:6px;cursor:pointer">
              <input type="checkbox" ${S.applyForm.opts.includes(i)?'checked':''} onchange="toggleOpt(${i})" style="accent-color:var(--brand);width:17px;height:17px">
              <span style="flex:1;font-size:13.5px">${o.n}</span>
              <b style="font-weight:700;font-size:13px">+${o.p.toLocaleString()}원</b>
            </label>`).join('')}
        </div>` : ''}

      <div style="background:var(--white);border:1px solid var(--line);border-radius:12px;padding:14px 15px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0"><span class="faint">참가비</span><span>${won(e.fee)}</span></div>
        ${S.applyForm.opts.map(i => `<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0"><span class="faint">${e.opts[i].n}</span><span>+${e.opts[i].p.toLocaleString()}원</span></div>`).join('')}
        <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;padding-top:9px;margin-top:5px;border-top:1px solid var(--line)">
          <span>결제 예정 금액</span><span style="color:var(--brand)">${total.toLocaleString()}원</span></div>
      </div>

      <div style="background:var(--bg-app);border-radius:10px;padding:12px 14px;font-size:11px;color:var(--ink-2);line-height:1.75;margin-bottom:12px">
        <b>· 개인정보 제공 동의</b> — 실명·나이·연락처가 <b>주최자에게만</b> 제공됩니다.<br>
        <b>· 환불 규정</b> — D-7 100% / D-3 50% / 당일 0% 환불<br>
        <b>· 결제</b> — 주최자(${e.host}) 명의로 직접 결제됩니다
      </div>

      <button class="btn btn-primary" onclick="submitApply()">동의하고 신청하기</button>
      <div style="height:16px"></div>
    </div></div>`;
}
function addPhoto() {
  if (S.applyForm.photos >= 5) return toast('사진은 최대 5장까지 등록할 수 있어요', 'warn');
  S.applyForm.photos++; render();
}
function rmPhoto(e) { e.stopPropagation(); S.applyForm.photos = Math.max(0, S.applyForm.photos - 1); render(); }
function toggleOpt(i) {
  const a = S.applyForm.opts;
  a.includes(i) ? a.splice(a.indexOf(i), 1) : a.push(i);
  render();
}
function submitApply() {
  if (!S.applyForm.cat) return toast('판매 품목을 선택해 주세요', 'err');
  if (!S.applyForm.one.trim()) return toast('제품 한 줄 소개를 입력해 주세요', 'err');
  if (S.applyForm.photos < 1) return toast('판매할 품목 사진을 최소 1장 등록해 주세요', 'err');
  toast('🎉 신청이 완료되었습니다. 주최자 승인 후 알려드릴게요', 'ok');
  S.applyForm = { cat: '', one: '', photos: 0, opts: [] };
  go('joined');
}

/* ============================================================
   14. 채팅 목록 / 15. 채팅방
   ============================================================ */
function vChat() {
  return `
    ${bar('채팅', { back: false })}
    <div class="body"><div class="pad">
      ${CHATS.map(c => `
        <div class="li" onclick="go('room',{ev:'${c.ev}'})">
          <div class="av" style="background:${c.role === '개최' ? 'var(--brand)' : 'var(--blue)'}">${c.role === '개최' ? '주' : '셀'}</div>
          <div class="li-b">
            <div class="nm">${c.ev}<span class="tag ${c.role === '개최' ? 'tag-brand' : 'tag-blue'}">${c.role}</span></div>
            <div class="sub">${c.last}</div>
          </div>
          <div class="li-r">
            <span style="font-size:10.5px;color:var(--ink-4)">${c.t}</span>
            ${c.unread ? `<span style="background:var(--bad);color:#fff;font-size:10px;font-weight:800;padding:1px 6px;border-radius:99px">${c.unread}</span>`
              : `<span style="font-size:10px;color:var(--ink-4)">${c.n}명</span>`}
          </div>
        </div>`).join('')}
    </div></div>`;
}

function vRoom() {
  return `
    ${bar(S.ctx.ev || '성수 봄바람 플리마켓', { act: `<button class="icon-btn" onclick="openMembers()">👥</button>` })}
    <div class="body" style="background:var(--bg-app)"><div class="pad">
      <div class="chat-day">2026년 7월 26일</div>
      ${CHAT_MSGS.map(m => `
        <div class="msg ${m.me ? 'me' : ''}">
          ${!m.me ? `<div class="av" style="background:${m.c}">${m.av}</div>` : ''}
          <div class="msg-c">
            ${!m.me ? `<div class="msg-nm">${m.nick}</div>` : ''}
            <div class="bub">${m.txt}</div>
          </div>
          <span class="msg-t">${m.t}</span>
        </div>`).join('')}
    </div></div>
    <div class="chat-input">
      <input id="chatIn" placeholder="메시지 입력" onkeydown="if(event.key==='Enter')sendMsg()">
      <button class="send" onclick="sendMsg()">↑</button>
    </div>`;
}
function sendMsg() {
  const v = $('#chatIn').value.trim();
  if (!v) return;
  CHAT_MSGS.push({ me: true, nick: ME.nick, av: ME.avatar, c: ME.color, txt: v, t: '방금' });
  render();
  const b = $('.body'); b.scrollTop = b.scrollHeight;
}
function openMembers() {
  $('#sheetWrap').innerHTML = `
    <div class="sheet">
      <div class="sheet-grip"></div>
      <h3>참가자 ${SELLERS.length}명</h3>
      <p style="font-size:12px;color:var(--ink-2);margin-bottom:12px">참가자를 누르면 프로필을 볼 수 있어요</p>
      ${SELLERS.map(s => `
        <div class="li" onclick="closeSheet();go('attendee',{sid:'${s.id}'})">
          <div class="av" style="background:${s.c}">${s.av}</div>
          <div class="li-b"><div class="nm">${s.nick} ${gradeBadge(s.joined)}</div>
            <div class="sub">${s.cat} · ${s.one}</div></div>
        </div>`).join('')}
      <button class="btn btn-line" onclick="closeSheet()">닫기</button>
    </div>`;
  $('#sheetWrap').classList.add('show');
}

/* ============================================================
   16. 마이프로필
   ============================================================ */
function vProfile() {
  const g = S.gradeMode === 'orig' ? gradeOriginal(ME.joined) : gradeFixed(ME.joined);
  const next = S.gradeMode === 'orig' ? null : (ME.joined < 10 ? 10 : 20);
  return `
    ${bar('마이프로필', { back: false, act: `<button class="icon-btn" onclick="toast('⚙️ 설정')">⚙️</button>` })}
    <div class="body"><div class="pad">
      <div class="prof-hd">
        <div class="av" style="background:${ME.color}">${ME.avatar}</div>
        <div class="nm">${ME.nick} <span class="grade ${g.cls}">${g.g}</span>${g.isTop ? '<span class="grade g-top">TOP10</span>' : ''}</div>
        <div class="one">${ME.one}</div>
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:9px">
          ${ME.cats.map(c => `<span class="tag tag-gray">${c}</span>`).join('')}
        </div>
        <div class="grade-bar">
          <span style="font-size:11px;color:var(--ink-3);flex-shrink:0">참여 ${ME.joined}회</span>
          <div class="gtrack"><div class="gfill" data-w="${next ? (ME.joined / next * 100).toFixed(0) : 100}"></div></div>
          <span style="font-size:11px;color:var(--ink-3);flex-shrink:0">${next ? `다음 등급 ${next}회` : `상위 ${g.pct.toFixed(0)}%`}</span>
        </div>
      </div>

      <div class="stat-row" style="margin-top:10px">
        <div class="stat"><b>${ME.hosted}</b><span>개최</span></div>
        <div class="stat"><b>${ME.joined}</b><span>참여</span></div>
        <div class="stat"><b>${ME.portfolio}</b><span>포트폴리오</span></div>
      </div>

      <div style="margin-top:14px">
        ${[['✏️','프로필 수정','사진·카테고리·한줄소개',"toast('✏️ 프로필 수정 화면 (데모)')"],
           ['📁','포트폴리오','사진 5장 · 한줄 메모',"toast('📁 포트폴리오 (데모)')"],
           ['🏅','등급 규칙 진단','기획서 규칙의 충돌 검증',"go('grade')"],
           ['⚠️','착수 전 검토 항목','법적·운영 리스크 6건',"go('risks')"]].map(([i,t,s,fn])=>`
          <div class="li" onclick="${fn}">
            <div style="width:38px;height:38px;border-radius:10px;background:var(--bg-app);display:grid;place-items:center;font-size:17px;flex-shrink:0">${i}</div>
            <div class="li-b"><div class="nm">${t}</div><div class="sub">${s}</div></div>
            <span style="color:var(--ink-4);font-size:16px">›</span>
          </div>`).join('')}
      </div>
      <div style="height:8px"></div>
    </div></div>`;
}

/* ============================================================
   17. 등급 규칙 진단 (제안 화면)
   ============================================================ */
function vGrade() {
  const conflicts = gradeConflicts();
  const samples = [0, 1, 3, 6, 12, 24, 55];
  return `
    ${bar('등급 규칙 진단')}
    <div class="body"><div class="pad">
      <div style="background:var(--bad-soft);border:1px solid rgba(224,49,49,.18);border-radius:12px;padding:13px 15px;font-size:12px;color:#A02020;line-height:1.75;margin-bottom:14px">
        기획서의 등급 정의를 <b>실제 회원 분포(${MEMBER_POOL.length}명)에 대입해 계산</b>한 결과입니다.
        절대 기준과 상대 기준이 섞여 있어 아래 문제가 발생합니다.
      </div>

      ${conflicts.map((c, i) => `
        <div style="background:var(--white);border:1px solid var(--line);border-left:3px solid var(--bad);border-radius:10px;padding:13px 15px;margin-bottom:9px">
          <div style="font-size:13px;font-weight:800;letter-spacing:-.2px">${i + 1}. ${c.t}</div>
          <p style="font-size:12px;color:var(--ink-2);line-height:1.75;margin-top:6px">${c.d}</p>
        </div>`).join('')}

      <div class="sec-t" style="margin-top:18px;font-size:14px">두 방식 비교</div>
      <div style="display:flex;gap:7px;margin-bottom:10px">
        <button class="btn ${S.gradeMode==='orig'?'btn-dark':'btn-line'} btn-s" style="flex:1" onclick="setGrade('orig')">기획서 규칙</button>
        <button class="btn ${S.gradeMode==='fixed'?'btn-primary':'btn-line'} btn-s" style="flex:1" onclick="setGrade('fixed')">개선안</button>
      </div>

      <div style="background:var(--white);border:1px solid var(--line);border-radius:12px;overflow:hidden">
        <div style="display:grid;grid-template-columns:64px 1fr 1fr;gap:8px;padding:9px 13px;background:var(--bg-app);font-size:10.5px;font-weight:800;color:var(--ink-3)">
          <span>참여</span><span>기획서 규칙</span><span>개선안</span>
        </div>
        ${samples.map(n => {
          const a = gradeOriginal(n), b = gradeFixed(n);
          const diff = a.g !== b.g;
          return `<div style="display:grid;grid-template-columns:64px 1fr 1fr;gap:8px;padding:10px 13px;border-top:1px solid var(--line);align-items:center;${diff?'background:var(--warn-soft)':''}">
            <span style="font-size:12.5px;font-weight:700">${n}회</span>
            <span><span class="grade ${a.cls}">${a.g}</span></span>
            <span><span class="grade ${b.cls}">${b.g}</span>${b.isTop?' <span class="grade g-top">TOP</span>':''}</span>
          </div>`;
        }).join('')}
      </div>
      <p style="font-size:11px;color:var(--ink-3);margin-top:9px;line-height:1.7">
        노란 행은 두 방식의 결과가 다른 구간입니다. 개선안은 <b>누적 절대 기준(강등 없음)</b>이고, 순위는 <b>TOP 배지로 분리</b>해 경쟁 요소를 남깁니다.
      </p>
      <div style="height:12px"></div>
    </div></div>`;
}
function setGrade(m) { S.gradeMode = m; render(); toast(m === 'orig' ? '기획서 규칙으로 표시합니다' : '개선안으로 표시합니다 — 앱 전체 등급이 바뀝니다'); }

/* ============================================================
   18. 검토 항목
   ============================================================ */
function vRisks() {
  return `
    ${bar('착수 전 검토 항목')}
    <div class="body"><div class="pad">
      <div style="font-size:12px;color:var(--ink-2);line-height:1.8;margin-bottom:14px">
        기획서를 검토하며 확인한 <b>법적·운영 리스크 ${RISKS.length}건</b>입니다.
        각 항목마다 이 데모에 실제로 적용한 대안을 함께 적었습니다.
      </div>
      ${RISKS.map(r => `
        <div style="background:var(--white);border:1px solid var(--line);border-left:3px solid ${r.lv==='high'?'var(--bad)':r.lv==='mid'?'var(--warn)':'var(--good)'};border-radius:10px;padding:14px 15px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
            <span style="font-size:15px">${r.ico}</span>
            <b style="font-size:13px;font-weight:800;letter-spacing:-.2px;flex:1">${r.t}</b>
            <span class="tag ${r.lv==='high'?'tag-bad':r.lv==='mid'?'tag-warn':'tag-good'}">${r.lv==='high'?'필수':r.lv==='mid'?'권장':'보완'}</span>
          </div>
          <p style="font-size:12px;color:var(--ink-2);line-height:1.8">${r.d}</p>
          <div style="font-size:10.5px;color:var(--ink-3);margin-top:8px;padding-top:8px;border-top:1px solid var(--line)">📚 ${r.s}</div>
          <div style="margin-top:9px;font-size:11.5px;color:#0B7A5A;background:var(--good-soft);padding:10px 12px;border-radius:8px;line-height:1.75">✓ ${r.f}</div>
        </div>`).join('')}
      <div style="height:8px"></div>
    </div></div>`;
}

/* ============================================================
   렌더
   ============================================================ */
const VIEWS = {
  home: vHome, seller: vSeller, create: vCreate, hosted: vHosted,
  participants: vParticipants, attendee: vAttendee, qr: vQr, joined: vJoined, scan: vScan,
  map: vMap, nearby: vNearby, detail: vDetail, apply: vApply,
  chat: vChat, room: vRoom, profile: vProfile, grade: vGrade, risks: vRisks,
};

const SCREEN_INFO = {
  home:{t:'홈',d:'기획서의 홈 4버튼(셀러등록·행사만들기·개최행사관리·참여행사관리)을 그대로 배치하고, 아래에 마감 임박·신규 행사를 노출했습니다.',s:'기획서 [네비게이션바-홈]'},
  seller:{t:'셀러 등록',d:'프로필·포트폴리오·부스설명과 비공개 정보(실명·나이·연락처)를 분리했습니다. 비공개 항목은 주최자에게만 제공되며 그 사실을 화면에 명시합니다.',s:'기획서 [셀러등록]'},
  create:{t:'행사 만들기',d:'행사명·사진·날짜·장소·종류(10종)·모집인원·모집품목(11종 중복선택)·참가비·추가옵션까지 명세 항목을 모두 담았습니다.',s:'기획서 [행사만들기]'},
  hosted:{t:'개최 행사관리',d:'행사별 신청·승인·출석 현황을 요약하고 채팅방/참여자목록으로 연결합니다.',s:'기획서 [개최 행사관리]'},
  participants:{t:'참여자 목록',d:'출석 버튼(한 번 더 누르면 취소), 우측 상단 QR 발급·엑셀 다운로드까지 명세 그대로입니다. 오프라인 준비 버튼을 추가했습니다.',s:'기획서 [개최행사관리-참여자목록]'},
  attendee:{t:'참여자 상세',d:'프로필·실명·나이·등급·판매품목·한줄소개·사진·포트폴리오·추가옵션과 승인/거절 버튼. 거절 시 40자 이내 사유를 받습니다.',s:'기획서 [참여자 클릭시 정보 표시]'},
  qr:{t:'출석용 QR 발급',d:'주최자가 발급·인쇄하는 출석 QR입니다. 네트워크가 끊겨도 동작하도록 오프라인 우선으로 설계했습니다.',s:'기획서 [출석용 QR코드 발급, 인쇄]'},
  joined:{t:'참여 행사관리',d:'승인된 행사는 채팅방·참여자목록·출석체크로, 거절된 행사는 사유만 표시(상호작용 없음)합니다.',s:'기획서 [참여 행사관리]'},
  scan:{t:'QR 출석 체크',d:'셀러가 주최자 QR을 스캔합니다. 실패에 대비한 수동 조회를 함께 제공합니다.',s:'기획서 [참여자목록 버튼{QR카메라연동}]'},
  map:{t:'지도 탐색',d:'행사를 핀으로 표시하고 누르면 정보 시트가 열립니다. 발자국은 참여했던 행사 지점입니다(상호작용 없음).',s:'기획서 [행사 탐색 / 참여기록]'},
  nearby:{t:'근처 행사',d:'가까운 순으로 정렬하고 행사 종류별 필터를 제공합니다.',s:'기획서 [근처 행사 정보 표시]'},
  detail:{t:'행사 정보 보기',d:'행사명·사진·설명·날짜·장소·종류·모집인원·모집품목·참가비·참여하기 버튼을 모두 표시합니다.',s:'기획서 [행사정보보기 버튼]'},
  apply:{t:'참여 신청',d:'판매품목 선택·제품 한줄소개·품목 사진(1~5장)·추가옵션 선택. 결제 금액과 동의 항목을 함께 보여줍니다.',s:'기획서 [참여 버튼(참여하기)]'},
  chat:{t:'채팅 목록',d:'개최/참여한 행사 목록에서 바로 채팅방으로 연결됩니다.',s:'기획서 [개최/참여한 행사목록]'},
  room:{t:'채팅방',d:'우측 상단 참가자 버튼 → 참가자 클릭 → 프로필 확인까지 명세대로 연결됩니다.',s:'기획서 [채팅방 우측 상단 참가자 버튼]'},
  profile:{t:'마이프로필',d:'프로필 수정·포트폴리오·등급 표시. 등급 규칙 진단과 검토 항목으로 들어가는 입구를 두었습니다.',s:'기획서 [마이프로필]'},
  grade:{t:'등급 규칙 진단',d:'기획서의 등급 정의를 실제 회원 분포에 대입해 계산한 결과입니다. 절대·상대 기준 혼용, 서열 역전, 강등 문제를 화면에서 확인할 수 있습니다.',s:'제안 — 기획서 [등급설정] 검증'},
  risks:{t:'착수 전 검토 항목',d:'PG 등록, 위치기반서비스 신고, 등급 규칙, QR 오프라인, 노쇼, 개인정보 제3자 제공 등 6건.',s:'제안 — 리서치 기반'},
};

function render() {
  $('#screen').innerHTML = (VIEWS[S.view] || vHome)() + tabbar();
  $$('.tab').forEach(b => b.addEventListener('click', () => goTab(b.dataset.t)));
  setTimeout(() => {
    $$('.prog i[data-w], .gfill[data-w]').forEach(b => { b.style.width = b.dataset.w + '%'; });
  }, 60);
  // 인덱스 하이라이트
  $$('.idx-item').forEach(b => b.classList.toggle('on', b.dataset.v === S.view));
  // 사이드 설명
  const info = SCREEN_INFO[S.view];
  const side = $('#sideInfo');
  if (side && info) {
    side.innerHTML = `
      <h2>${info.t}</h2>
      <p>${info.d}</p>
      <div class="spec"><b>원본 기획서 대응</b>${info.s}</div>
      ${S.view === 'grade' || S.view === 'risks'
        ? `<div class="risk"><b>제안 화면</b><br>기획서에 없던 내용으로, 착수 전 확인이 필요한 부분을 정리했습니다.</div>` : ''}`;
  }
}

function tabbar() {
  const tabs = [['home','🏠','홈'],['map','🗺','지도'],['chat','💬','채팅'],['profile','👤','내정보']];
  return `<div class="tabbar">${tabs.map(([k,i,l]) => `
    <button class="tab ${S.tab === k ? 'on' : ''}" data-t="${k}">
      <span class="ico">${i}</span>${l}
      ${k === 'chat' ? '<span class="badge">3</span>' : ''}
    </button>`).join('')}</div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  $$('.idx-item').forEach(b => b.addEventListener('click', () => { S.stack = []; go(b.dataset.v, {}, false); }));
  $('#sheetWrap').addEventListener('click', e => { if (e.target.id === 'sheetWrap') closeSheet(); });
  render();
});
