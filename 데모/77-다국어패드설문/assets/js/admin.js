/* GYEOL 결 — 관리자 로직 (대시보드 표면)
   초안/발행 분리(C-3) · 이벤트가 3필드 잠금(B-6) · 금지표현 검출(B-1)
   유치 등록 게이트(B-2) · 수명주기·파기(B-3/C-8) · 동의 재현(B-8) · 키오스크 점검(A-3) */
'use strict';

const D = Store.load();
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KO = obj => pick(obj, 'ko');
const TODAY = '2026-09-02';

let toastTimer = null;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
function modal(html) { $('#modal-box').innerHTML = html; $('#modal').classList.add('show'); }
function closeModal() { $('#modal').classList.remove('show'); }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

function dday(dateStr) {
  const d = Math.round((new Date(dateStr) - new Date(TODAY)) / 86400000);
  return d;
}
function addDays(dateStr, n) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/* ── 내비 ─────────────────────────────────── */
const TITLES = {
  dash: ['대시보드', '오늘 제출 기준 실계산 · 데모 기준일 2026-09-02'],
  subs: ['제출 내역', '고객 제출 내용 확인 — 연락처는 마스킹, 동의는 당시 버전으로 재현'],
  treat: ['시술 관리', '초안으로 편집하고 「발행」해야 고객 화면에 반영됩니다'],
  survey: ['설문 · 매핑', '관심 부위 × 시술 가중치 — 추천 화면은 이 표로 실계산됩니다'],
  bna: ['Before & After', '3중 게이트: 동일인 · 동일 조건 · 동의서 — 하나라도 빠지면 저장되지 않습니다'],
  privacy: ['개인정보 수명주기', '보유기간 설정 → 만료 D-day → 파기 실행 · 파기 이력'],
  comply: ['운영 준수 체크', '유치기관 등록 · 배상보험 · 비급여 고지 · 공개 범위'],
  device: ['기기 · 키오스크', 'iPad별 콘텐츠 버전 · 키오스크 상태 실측 · 설치 가이드'],
};
const RENDER = { dash: rDash, subs: rSubs, treat: rTreat, survey: rSurvey, bna: rBna, privacy: rPrivacy, comply: rComply, device: rDevice };
let curSect = 'dash';
$$('#snav button').forEach(b => b.addEventListener('click', () => {
  curSect = b.dataset.s;
  $$('#snav button').forEach(x => x.classList.toggle('on', x === b));
  $$('.sect').forEach(s => s.classList.toggle('on', s.id === 'sect-' + curSect));
  $('#m-title').textContent = TITLES[curSect][0];
  $('#m-sub').textContent = TITLES[curSect][1];
  RENDER[curSect]();
}));

/* ── 카운트업 ─────────────────────────────── */
function countUp(el, to, suffix) {
  const t0 = performance.now(), dur = 700;
  const tick = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * e).toLocaleString('ko-KR') + (suffix || '');
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  setTimeout(() => { el.textContent = to.toLocaleString('ko-KR') + (suffix || ''); }, dur + 120);
}

/* ── 캔버스 (dpr 대응) ─────────────────────── */
function setupCv(cv) {
  const dpr = devicePixelRatio || 1;
  const w = cv.clientWidth, h = cv.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  const c = cv.getContext('2d'); c.scale(dpr, dpr);
  return [c, w, h];
}
const LANG_COLORS = { ko: '#322d25', en: '#bfa072', ja: '#8a9b8e', zh: '#b0563a' };

function whenSized(cv, fn, tries) {
  // 레이아웃 확정 전(폰트·CSS 로딩 중) clientWidth가 0~수십 px로 측정되는 문제 가드
  if (cv.clientWidth > 60 || (tries || 0) > 20) { fn(); return; }
  requestAnimationFrame(() => setTimeout(() => whenSized(cv, fn, (tries || 0) + 1), 50));
}
function drawDonut(cv, entries) { whenSized(cv, () => drawDonutNow(cv, entries)); }
function drawDonutNow(cv, entries) {
  const [c, w, h] = setupCv(cv);
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 16;
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
  const a0 = -Math.PI / 2;
  const t0 = performance.now(), dur = 800;
  const paint = e => {
    c.clearRect(0, 0, w, h);
    let a = a0;
    entries.forEach(([k, v]) => {
      const sweep = v / total * Math.PI * 2 * e;
      c.beginPath(); c.arc(cx, cy, r, a, a + sweep);
      c.strokeStyle = LANG_COLORS[k] || '#999'; c.lineWidth = 26; c.stroke();
      a += sweep;
    });
    c.fillStyle = '#150600'; c.font = '600 22px Pretendard Variable, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(Math.round(total * e) + '건', cx, cy);
  };
  const frame = now => {
    const p = Math.min(1, (now - t0) / dur);
    paint(1 - Math.pow(1 - p, 3));
    if (p < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  setTimeout(() => paint(1), dur + 120);   // rAF가 굶는 환경(숨겨진 탭)에서도 최종 상태 보장
}
function drawBars(cv, entries) { whenSized(cv, () => drawBarsNow(cv, entries)); }
function drawBarsNow(cv, entries) {
  const [c, w, h] = setupCv(cv);
  const max = Math.max(...entries.map(e => e[1]), 1);
  const bh = 26, gap = (h - entries.length * bh) / (entries.length + 1);
  const t0 = performance.now(), dur = 800;
  const paint = e => {
    c.clearRect(0, 0, w, h);
    entries.forEach(([label, v], i) => {
      const y = gap + i * (bh + gap);
      const bw = (w - 150) * (v / max) * e;
      c.fillStyle = 'rgba(21,6,0,.08)'; c.fillRect(120, y, w - 150, bh);
      c.fillStyle = i === 0 ? '#a5875a' : '#322d25'; c.fillRect(120, y, bw, bh);
      c.fillStyle = '#150600'; c.font = '500 12.5px Pretendard Variable, sans-serif';
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(label, 0, y + bh / 2);
      c.fillText(v + '건', 124 + bw + 6, y + bh / 2);
    });
  };
  const frame = now => {
    const p = Math.min(1, (now - t0) / dur);
    paint(1 - Math.pow(1 - p, 3));
    if (p < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  setTimeout(() => paint(1), dur + 120);
}

/* ═══ 1. 대시보드 ═══════════════════════════ */
function rDash() {
  const subs = D.submissions;
  const done = subs.filter(s => s.status === 'done').length;
  const foreign = subs.filter(s => s.lang !== 'ko').length;
  const langCnt = {};
  subs.forEach(s => { langCnt[s.lang] = (langCnt[s.lang] || 0) + 1; });
  const concernCnt = {};
  subs.forEach(s => s.concerns.forEach(c => { concernCnt[c] = (concernCnt[c] || 0) + 1; }));
  const top5 = Object.entries(concernCnt).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, v]) => [KO((D.concerns.find(c => c.id === id) || {}).short), v]);
  let q = 0; try { q = JSON.parse(localStorage.getItem('gyeol77-queue') || '[]').length; } catch (e) {}

  $('#sect-dash').innerHTML = `
    <div class="cards">
      <div class="card"><div class="k">오늘 설문</div><div class="v" id="k1">0</div><div class="d">완료 ${done} · 진행 중 ${subs.length - done}</div></div>
      <div class="card"><div class="k">완료율</div><div class="v" id="k2">0</div><div class="d">중간 이탈도 상담 정보로 보존 (C-7)</div></div>
      <div class="card"><div class="k">외국어 응답</div><div class="v" id="k3">0</div><div class="d">EN·JA·ZH — 정규화되어 동일 스키마 도착</div></div>
      <div class="card"><div class="k">전송 대기</div><div class="v" id="k4">0</div><div class="d">오프라인 큐 — 복귀 시 자동 전송 (C-2)</div></div>
    </div>
    <div class="chart-row">
      <div class="panel"><h3>언어 분포</h3><canvas class="cv" id="cv-lang"></canvas>
        <div class="legend">${Object.entries(langCnt).map(([k, v]) => `<span><i style="background:${LANG_COLORS[k]}"></i>${k.toUpperCase()} ${v}</span>`).join('')}</div></div>
      <div class="panel"><h3>관심 부위 TOP 5 <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink-38)">설문 문항 개선의 근거</span></h3><canvas class="cv" id="cv-top"></canvas></div>
    </div>
    <div class="panel">
      <h3>최근 제출</h3>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>시간</th><th>고객</th><th>언어</th><th>관심 부위</th><th>일정</th><th>상태</th></tr></thead><tbody>
        ${subs.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6).map(s => `
          <tr><td>${s.at.slice(11, 16)}</td><td>${esc(s.name)}</td><td><span class="badge">${s.lang.toUpperCase()}</span></td>
          <td>${s.concerns.map(id => KO((D.concerns.find(c => c.id === id) || {}).short)).join(' · ')}</td>
          <td>${s.dt ? t(s.dt, 'ko') : '—'}</td>
          <td>${s.status === 'done' ? '<span class="badge ok">완료</span>' : `<span class="badge warn">진행 ${s.progress}%</span>`}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`;
  countUp($('#k1'), subs.length, '건');
  countUp($('#k2'), Math.round(done / (subs.length || 1) * 100), '%');
  countUp($('#k3'), Math.round(foreign / (subs.length || 1) * 100), '%');
  countUp($('#k4'), q, '건');
  drawDonut($('#cv-lang'), Object.entries(langCnt));
  drawBars($('#cv-top'), top5);
}

/* ═══ 2. 제출 내역 ══════════════════════════ */
function rSubs() {
  const subs = D.submissions.slice().sort((a, b) => b.at.localeCompare(a.at));
  $('#sect-subs').innerHTML = `
    <div class="panel">
      <h3>제출 ${subs.length}건 — 연락처·생년월일은 상담실장 뷰에서만 열람(로그 적재)
        <button class="abtn ghost sm" id="csv-export">CSV 내보내기 (마스킹본)</button></h3>
      <div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>시간</th><th>고객</th><th>언어</th><th>상태</th><th>관심</th><th>동의</th><th>마케팅</th><th></th>
      </tr></thead><tbody>
        ${subs.map(s => `
        <tr><td>${s.at.slice(5, 16).replace('T', ' ')}</td><td>${esc(s.name)}${s.minor ? ' <span class="badge bad">14세 미만</span>' : ''}</td>
        <td><span class="badge">${s.lang.toUpperCase()}</span></td>
        <td>${s.status === 'done' ? '<span class="badge ok">완료</span>' : `<span class="badge warn">진행 ${s.progress}%</span>`}</td>
        <td>${s.concerns.map(id => KO((D.concerns.find(c => c.id === id) || {}).short)).join(' · ')}</td>
        <td><span class="badge gold">${esc(s.consentV)}</span></td>
        <td>${s.marketing ? '동의' : '거부'}</td>
        <td><button class="abtn ghost sm" data-act="consent" data-id="${s.id}">동의 재현</button></td></tr>`).join('')}
      </tbody></table></div>
    </div>
    <div class="panel">
      <h3>열람 로그 (상담실장 뷰 「전체 보기」 시 적재)</h3>
      <div class="loglist">${D.viewLogs.length ? D.viewLogs.slice().reverse().map(v => {
        const s = D.submissions.find(x => x.id === v.sid);
        return `${esc(v.at)} · <b>${esc(v.who)}</b> — ${s ? esc(s.name) : v.sid} ${esc(v.field)} 열람`;
      }).join('<br>') : '기록 없음'}</div>
    </div>`;
  $('#csv-export').addEventListener('click', () => {
    const head = ['제출시각', '고객명', '언어', '상태', '진행률', '관심부위', '관심시술', '일정', '동의버전', '마케팅', '14세미만'];
    const rows2 = subs.map(s => [
      s.at, s.name, s.lang.toUpperCase(), s.status === 'done' ? '완료' : '진행중', (s.progress || 100) + '%',
      s.concerns.map(id => KO((D.concerns.find(c => c.id === id) || {}).short)).join('·'),
      s.interests.map(id => KO((D.treatments.find(t2 => t2.id === id) || {}).name)).join('·') || '추천희망',
      s.dt ? t(s.dt, 'ko') : '', s.consentV, s.marketing ? 'Y' : 'N', s.minor ? 'Y' : 'N',
    ]);
    const csv = [head, ...rows2].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });   // BOM — 엑셀 한글 대응
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gyeol_제출내역_' + TODAY + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('CSV 저장 — 연락처·생년월일은 포함하지 않습니다 (개인정보 최소화)');
  });
  $$('#sect-subs [data-act="consent"]').forEach(b => b.addEventListener('click', () => {
    const s = D.submissions.find(x => x.id === b.dataset.id);
    const cv = D.consentVersions.find(v => v.v === s.consentV) || D.consentVersions[D.consentVersions.length - 1];
    const L = I18N[s.lang] || I18N.ko;
    modal(`
      <h3>동의서 원본 재현 — ${esc(s.name)}</h3>
      <p style="font-size:12.5px;color:var(--ink-38);">전자문서법 4조의2 — 작성 당시의 형태로 재현 · 버전 <b>${esc(s.consentV)}</b> (${esc(cv.date)}) · 언어 ${s.lang.toUpperCase()} ${s.consentHash ? '· hash ' + esc(s.consentHash) : ''}</p>
      <div class="warn-box" style="border-color:var(--ink-16);background:var(--bone);color:var(--ink);">
        <b>${esc(L.consentP1)}</b><br>${esc(L.consentP1Body).replace(/30일/g, cv.retention + '일')}<br><br>
        <b>${esc(L.consentP2)}</b><br>${esc(L.consentP2Body).replace(/30일/g, cv.retention + '일')}<br><br>
        <b>${esc(L.consentP3)}</b> — ${s.marketing ? '동의함' : '동의하지 않음'}
      </div>
      <p style="font-size:12px;color:var(--ink-38);">※ 문구를 다음 버전으로 수정해도 이 고객의 동의는 ${esc(s.consentV)} 문구로 보존·재현됩니다 (B-8).</p>
      <div class="row"><button class="abtn" onclick="document.getElementById('modal').classList.remove('show')">닫기</button></div>`);
  }));
}

/* ═══ 3. 시술 관리 ══════════════════════════ */
let editId = null, editLang = 'ko';
function rTreat() {
  const rows = D.treatments.map(tr => {
    const ev = eventActive(tr.event);
    return `<tr>
      <td><b>${esc(KO(tr.name))}</b><br><span style="font-size:11.5px;color:var(--ink-38)">${esc(tr.device.brand)}</span></td>
      <td>${esc(KO((D.categories.find(c => c.id === tr.cat) || {}).name))}</td>
      <td class="num">${fmtKRW(tr.price.list)}</td>
      <td class="num">${fmtKRW(tr.price.pkg.p3)} / ${fmtKRW(tr.price.pkg.p5)}</td>
      <td class="num" style="color:var(--warn)">${fmtKRW(tr.price.consult.min)}</td>
      <td>${tr.draft ? '<span class="badge warn">발행 대기</span>' : '<span class="badge ok">발행됨</span>'}${ev ? ' <span class="badge gold">이벤트</span>' : ''}</td>
      <td><button class="abtn ghost sm" data-edit="${tr.id}">편집</button></td>
    </tr>`;
  }).join('');
  $('#sect-treat').innerHTML = `
    <div class="panel">
      <h3>시술 ${D.treatments.length}종 · 콘텐츠 v${D.contentVersion}
        <span style="display:flex;gap:8px;">
          <button class="abtn ghost sm" id="add-treat">+ 새 시술</button>
          <button class="abtn gold sm" id="pub-all" ${D.treatments.some(t2 => t2.draft) ? '' : 'disabled'}>발행 (v${D.contentVersion + 1})</button>
        </span></h3>
      <div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>시술</th><th>카테고리</th><th>정가(고객)</th><th>3회/5회·회당</th><th>최저 승인가</th><th>상태</th><th></th>
      </tr></thead><tbody>${rows}</tbody></table></div>
    </div>
    <div id="treat-edit"></div>
    <div class="panel">
      <h3>가격 변경 이력 (B-5 — 고지 이행 증빙)</h3>
      <div class="loglist">${D.priceHistory.slice().reverse().map(h =>
        `${esc(h.at)} · <b>${esc(h.who)}</b> — ${esc(KO((D.treatments.find(t2 => t2.id === h.tid) || {}).name))} ${esc(h.field)} ${fmtKRW(h.from)} → <b>${fmtKRW(h.to)}</b>`).join('<br>') || '기록 없음'}</div>
    </div>`;
  $$('#sect-treat [data-edit]').forEach(b => b.addEventListener('click', () => { editId = b.dataset.edit; editLang = 'ko'; rTreatEdit(); }));
  $('#pub-all').addEventListener('click', publishAll);
  $('#add-treat').addEventListener('click', () => {
    const id = 't-new-' + Date.now().toString(36);
    D.treatments.push({
      id, cat: 'cat-lift', status: 'published', img: 'cat-lift.webp', duration: 30, downtime: 0, pain: 1,
      anesthesia: { ko: '불필요', en: 'Not required', ja: '不要', zh: '无需' },
      device: { brand: '', type: '', genuine: false },
      name: { ko: '새 시술', en: '', ja: '', zh: '' }, tag: { ko: '', en: '', ja: '', zh: '' },
      desc: { ko: '', en: '', ja: '', zh: '' }, effect: { ko: '', en: '', ja: '', zh: '' }, care: { ko: '', en: '', ja: '', zh: '' },
      price: { list: 100000, pkg: { p3: 90000, p5: 80000 }, consult: { min: 70000, note: '' } },
      alt: [], event: null, bna: null,
    });
    Store.save();
    editId = id; editLang = 'ko';
    toast('새 시술이 추가되었습니다 — 내용을 채우고 「발행」하세요');
    rTreat();
  });
  if (editId) rTreatEdit();
}
const ASSET_IMGS = ['cat-lift.webp', 'cat-boost.webp', 'cat-tox.webp', 'cat-laser.webp', 'cat-pore.webp', 'cat-body.webp',
  'concern-lifting.webp', 'concern-texture.webp', 'concern-pore.webp', 'concern-pigment.webp', 'concern-wrinkle.webp',
  'concern-contour.webp', 'concern-acne.webp', 'concern-scar.webp', 'concern-body.webp', 'concern-etc.webp', 'detail-scene.webp'];

function draftOf(tr) { return tr.draft || tr; }
function rTreatEdit() {
  const tr = D.treatments.find(x => x.id === editId);
  if (!tr) { $('#treat-edit').innerHTML = ''; return; }
  const d = draftOf(tr);
  const evOn = !!(d.event && d.event.on);
  const missing = LANGS.filter(l => !(d.name[l.code] || '').trim());
  $('#treat-edit').innerHTML = `
    <div class="panel">
      <h3>편집 — ${esc(KO(tr.name))} ${tr.draft ? '<span class="badge warn">발행 대기 초안</span>' : ''}
        <span style="display:flex;gap:8px;">
          <button class="abtn danger sm" id="ed-del">삭제</button>
          <button class="abtn ghost sm" id="ed-preview">고객/상담 미리보기</button>
          <button class="abtn sm" id="ed-save">초안 저장</button>
        </span></h3>
      <div class="ltabs">${LANGS.map(l => `<button data-l="${l.code}" class="${editLang === l.code ? 'on' : ''}">${l.code.toUpperCase()}${(d.name[l.code] || '').trim() ? '' : '<span class="miss"></span>'}</button>`).join('')}</div>
      ${missing.length ? `<div class="f"><div class="hint bad">번역 누락 — ${missing.map(l => l.code.toUpperCase()).join(' · ')} (고객 화면에서 한국어로 폴백됩니다)</div></div>` : ''}
      <div class="frm" style="margin-top:12px;">
        <div class="f"><label>시술명 (${editLang.toUpperCase()})</label><input id="ed-name" value="${esc(d.name[editLang] || '')}"></div>
        <div class="f"><label>한 줄 태그 (${editLang.toUpperCase()})</label><input id="ed-tag" value="${esc(d.tag[editLang] || '')}"></div>
        <div class="f full"><label>설명 (${editLang.toUpperCase()}) — 금지 표현 실시간 검출 (의료법 56조)</label>
          <textarea id="ed-desc">${esc(d.desc[editLang] || '')}</textarea>
          <div class="hint" id="ed-banned"></div></div>
        <div class="f"><label>정가 — 고객 노출 · 비급여 고지 기준</label><input id="ed-list" type="number" step="10000" value="${d.price.list}"></div>
        <div class="f"><label>최저 승인가 — 상담실장 전용</label><input id="ed-min" type="number" step="10000" value="${d.price.consult.min}"></div>
        <div class="f"><label>3회 패키지 · 회당</label><input id="ed-p3" type="number" step="10000" value="${d.price.pkg.p3}"></div>
        <div class="f"><label>5회 패키지 · 회당</label><input id="ed-p5" type="number" step="10000" value="${d.price.pkg.p5}"></div>
        <div class="f"><label>사용 장비 브랜드 (시술명과 분리 — B-7)</label><input id="ed-brand" value="${esc(d.device.brand)}"></div>
        <div class="f"><label>장비 유형</label><input id="ed-dtype" value="${esc(d.device.type)}"></div>
        <div class="f"><label>카테고리</label><select id="ed-cat">
          ${D.categories.map(c => `<option value="${c.id}" ${(d.cat || tr.cat) === c.id ? 'selected' : ''}>${esc(KO(c.name))}</option>`).join('')}</select></div>
        <div class="f"><label>대표 이미지 (에셋 선택 — 실구축 시 업로드로 대체)</label><select id="ed-img">
          ${ASSET_IMGS.map(f => `<option value="${f}" ${(d.img || tr.img) === f ? 'selected' : ''}>${f.replace('.webp', '')}</option>`).join('')}</select></div>
      </div>
      <div class="swrow" style="margin-top:14px;">
        <div><div class="t">이벤트가 (의료법 27조 3항 — 대상·기간·할인폭 필수)</div>
        <div class="s">세 필드를 모두 채워야 저장됩니다. 기간이 지나면 고객 화면은 자동으로 정가 복귀.</div></div>
        <span class="tgl ${evOn ? 'on' : ''}" id="ed-ev"></span>
      </div>
      <div class="frm" id="ed-ev-fields" style="${evOn ? '' : 'display:none;'}">
        <div class="f"><label>대상 *</label><input id="ed-ev-target" value="${esc(evOn ? KO(d.event.target) : '')}" placeholder="예: 첫 방문 고객"></div>
        <div class="f"><label>할인폭 (%) *</label><input id="ed-ev-rate" type="number" min="1" max="50" value="${evOn ? d.event.rate : ''}"></div>
        <div class="f"><label>시작일 *</label><input id="ed-ev-start" type="date" value="${evOn ? d.event.start : ''}"></div>
        <div class="f"><label>종료일 *</label><input id="ed-ev-end" type="date" value="${evOn ? d.event.end : ''}"></div>
      </div>
    </div>`;
  $$('#treat-edit .ltabs button').forEach(b => b.addEventListener('click', () => { editLang = b.dataset.l; rTreatEdit(); }));
  const banned = () => {
    const v = $('#ed-desc').value;
    const hits = D.bannedWords.filter(w => v.includes(w));
    const el = $('#ed-banned');
    if (hits.length) { el.className = 'hint bad'; el.textContent = '⚠ 금지 표현 검출 — ' + hits.map(h => '"' + h + '"') .join(' · ') + ' (과장·단정 표현은 의료광고 규제 대상)'; $('#ed-desc').classList.add('err'); }
    else { el.className = 'hint'; el.textContent = '검출된 금지 표현 없음'; $('#ed-desc').classList.remove('err'); }
  };
  $('#ed-desc').addEventListener('input', banned); banned();
  $('#ed-ev').addEventListener('click', function () {
    this.classList.toggle('on');
    $('#ed-ev-fields').style.display = this.classList.contains('on') ? '' : 'none';
  });
  $('#ed-save').addEventListener('click', saveDraft);
  $('#ed-preview').addEventListener('click', previewSplit);
  $('#ed-del').addEventListener('click', () => {
    modal(`
      <h3>「${esc(KO(tr.name))}」 시술을 삭제하시겠습니까?</h3>
      <div class="warn-box">삭제 즉시 고객 메뉴판·설문 매핑에서 제거되며 콘텐츠 버전이 올라갑니다. 이 동작은 되돌릴 수 없습니다 (데모: 「데모 데이터 리셋」으로 복원 가능).</div>
      <div class="row">
        <button class="abtn ghost" id="del-cancel">취소</button>
        <button class="abtn danger" id="del-confirm">삭제</button>
      </div>`);
    $('#del-cancel').addEventListener('click', closeModal);
    $('#del-confirm').addEventListener('click', () => {
      D.treatments = D.treatments.filter(x => x.id !== tr.id);
      Object.values(D.mapping).forEach(m => delete m[tr.id]);
      D.interestOptions = D.interestOptions.filter(x => x !== tr.id);
      D.contentVersion++;
      Store.save(); closeModal();
      editId = null;
      toast('삭제 완료 — v' + D.contentVersion + ' · 매핑·설문 선택지에서도 제거됨');
      rTreat();
    });
  });
}

function saveDraft() {
  const tr = D.treatments.find(x => x.id === editId);
  const d = tr.draft ? tr.draft : JSON.parse(JSON.stringify({ name: tr.name, tag: tr.tag, desc: tr.desc, price: tr.price, device: tr.device, event: tr.event, cat: tr.cat, img: tr.img }));
  const evOn = $('#ed-ev').classList.contains('on');
  if (evOn) {
    const tgt = $('#ed-ev-target').value.trim(), rate = +$('#ed-ev-rate').value, st = $('#ed-ev-start').value, en = $('#ed-ev-end').value;
    if (!tgt || !rate || !st || !en) {  // B-6 잠금
      ['ed-ev-target', 'ed-ev-rate', 'ed-ev-start', 'ed-ev-end'].forEach(id => { if (!$('#' + id).value) $('#' + id).classList.add('err'); });
      toast('이벤트가는 대상·기간·할인폭을 모두 채워야 저장됩니다 (의료법 27조 3항)');
      return;
    }
    d.event = { on: true, target: { ko: tgt, en: tgt, ja: tgt, zh: tgt }, start: st, end: en, rate };
  } else d.event = null;
  d.name[editLang] = $('#ed-name').value.trim();
  d.tag[editLang] = $('#ed-tag').value.trim();
  d.desc[editLang] = $('#ed-desc').value.trim();
  d.price = { list: +$('#ed-list').value, pkg: { p3: +$('#ed-p3').value, p5: +$('#ed-p5').value }, consult: { ...d.price.consult, min: +$('#ed-min').value } };
  d.device = { ...d.device, brand: $('#ed-brand').value.trim(), type: $('#ed-dtype').value.trim() };
  d.cat = $('#ed-cat').value;
  d.img = $('#ed-img').value;
  tr.draft = d;
  Store.save();
  toast('초안 저장됨 — 고객 화면은 아직 이전 버전입니다. 「발행」하면 반영됩니다 (C-3)');
  rTreat();
}

function previewSplit() {
  const tr = D.treatments.find(x => x.id === editId);
  const d = draftOf(tr);
  const ev = d.event && d.event.on && TODAY >= d.event.start && TODAY <= d.event.end;
  const evPrice = ev ? Math.round(d.price.list * (100 - d.event.rate) / 100 / 1000) * 1000 : d.price.list;
  modal(`
    <h3>같은 시술, 두 화면 — 가격 표면 2분할 (A-1)</h3>
    <p style="font-size:12.5px;color:var(--ink-38);">고객에게는 고지 기준가만, 상담실장에게는 협상 구간 전체가 보입니다. 실수로 내부가를 공개 필드에 넣지 않도록 저장 전 눈으로 확인하세요.</p>
    <div class="pv2">
      <div class="pv cust">
        <div class="cap">고객 iPad — 항상 노출</div>
        <div class="nm">${esc(KO(d.name))}</div>
        <div class="pr">${fmtKRW(evPrice)}${ev ? ` <span style="color:var(--gold-deep)">이벤트 −${d.event.rate}%</span>` : ''}</div>
        ${ev ? `<div class="sm">대상 ${esc(KO(d.event.target))} · ${d.event.start}~${d.event.end}</div>` : ''}
        <div class="sm">부가세 포함 · 1회 기준 · "패키지 구성은 상담 시 안내"</div>
      </div>
      <div class="pv coun">
        <div class="cap">상담실장 뷰 — PIN 접근</div>
        <div class="nm">${esc(KO(d.name))}</div>
        <div class="pr">정가 ${fmtKRW(d.price.list)} · 3회 ${fmtKRW(d.price.pkg.p3)} · 5회 ${fmtKRW(d.price.pkg.p5)}</div>
        <div class="pr" style="color:var(--warn)">최저 승인가 ${fmtKRW(d.price.consult.min)}</div>
        <div class="sm">${esc(d.price.consult.note || '')}</div>
      </div>
    </div>
    <div class="row"><button class="abtn" onclick="document.getElementById('modal').classList.remove('show')">확인</button></div>`);
}

function publishAll() {
  let changes = 0;
  D.treatments.forEach(tr => {
    if (!tr.draft) return;
    const d = tr.draft;
    if (d.price.list !== tr.price.list) D.priceHistory.push({ at: TODAY + ' ' + new Date().toTimeString().slice(0, 5), who: '박실장', tid: tr.id, field: '공개가', from: tr.price.list, to: d.price.list });
    if (d.price.pkg.p3 !== tr.price.pkg.p3) D.priceHistory.push({ at: TODAY + ' ' + new Date().toTimeString().slice(0, 5), who: '박실장', tid: tr.id, field: '3회 패키지', from: tr.price.pkg.p3, to: d.price.pkg.p3 });
    Object.assign(tr, { name: d.name, tag: d.tag, desc: d.desc, price: d.price, device: d.device, event: d.event, cat: d.cat || tr.cat, img: d.img || tr.img });
    delete tr.draft;
    changes++;
  });
  D.contentVersion++;
  D.devices.forEach(dv => { if (dv.id !== 'iPad-03') dv.ver = D.contentVersion; });  // 3번은 오프라인 시나리오
  Store.save();
  toast(`발행 완료 — v${D.contentVersion} · 시술 ${changes}건 반영. 고객 화면이 즉시 갱신됩니다`);
  rTreat();
}

/* ═══ 4. 설문 · 매핑 ════════════════════════ */
function rSurvey() {
  $('#sect-survey').innerHTML = `
    <div class="panel">
      <h3>설문 문항 (3문항 + 정보 입력)</h3>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>문항 (KO)</th><th>유형</th><th>선택지</th></tr></thead><tbody>
        <tr><td>Q1</td><td>${esc(t('q1Title', 'ko'))}</td><td>사진 카드 · 최대 3</td><td>${D.concerns.length}개 (관심 부위)</td></tr>
        <tr><td>Q2</td><td>${esc(t('q2Title', 'ko'))}</td><td>복수 선택</td><td>${D.interestOptions.length}개 + 추천 희망</td></tr>
        <tr><td>Q3</td><td>${esc(t('q3Title', 'ko'))}</td><td>단일 선택 · 제출</td><td>4개 (다운타임)</td></tr>
      </tbody></table></div>
    </div>
    <div class="panel-grid">
      <div class="panel">
        <h3>Q1 선택지 문구 편집 (KO) <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink-38)">수정 즉시 고객 화면 반영 · EN/JA/ZH는 번역 워크플로</span></h3>
        ${D.concerns.map(c => `
          <div class="f" style="margin-bottom:8px;"><input data-cid="${c.id}" class="q1-label" value="${esc(c.label.ko)}"></div>`).join('')}
      </div>
      <div class="panel">
        <h3>Q2 선택지 구성 <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink-38)">체크한 시술이 설문 Q2에 노출됩니다</span></h3>
        <div class="gate3">
          ${D.treatments.map(tr => `
            <label><input type="checkbox" class="q2-opt" data-tid="${tr.id}" ${D.interestOptions.includes(tr.id) ? 'checked' : ''}> ${esc(KO(tr.name))}</label>`).join('')}
        </div>
      </div>
    </div>
    <div class="panel">
      <h3>관심 부위 × 시술 가중치 매핑 <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink-38)">0~3 · 수정 즉시 추천 계산에 반영 — 하드코딩 없음</span></h3>
      <div class="matrix"><table class="tbl"><thead><tr><th>관심 부위 ↓</th>
        ${D.treatments.map(tr => `<th title="${esc(KO(tr.name))}">${esc(KO(tr.name)).slice(0, 6)}</th>`).join('')}
      </tr></thead><tbody>
        ${D.concerns.map(c => `<tr><td><b>${esc(KO(c.short))}</b></td>
          ${D.treatments.map(tr => {
            const w = (D.mapping[c.id] || {})[tr.id] || 0;
            return `<td><input data-c="${c.id}" data-t="${tr.id}" type="number" min="0" max="3" value="${w}" class="${w >= 2 ? 'hot' : ''}"></td>`;
          }).join('')}</tr>`).join('')}
      </tbody></table></div>
      <p style="font-size:12px;color:var(--ink-38);margin-top:10px;">추천 점수 = 선택한 부위 가중치 합 + 관심 시술 보너스(+2) → 다운타임 필터 → 상위 3. 값을 바꾸고 고객 화면에서 설문을 다시 돌려 보세요.</p>
    </div>`;
  $$('#sect-survey .q1-label').forEach(inp => inp.addEventListener('change', () => {
    const c = D.concerns.find(x => x.id === inp.dataset.cid);
    if (c && inp.value.trim()) { c.label.ko = inp.value.trim(); Store.save(); toast('Q1 문구 저장 — 고객 화면에 반영됩니다'); }
  }));
  $$('#sect-survey .q2-opt').forEach(cb => cb.addEventListener('change', () => {
    const tid = cb.dataset.tid;
    if (cb.checked) { if (!D.interestOptions.includes(tid)) D.interestOptions.push(tid); }
    else D.interestOptions = D.interestOptions.filter(x => x !== tid);
    Store.save();
    toast('Q2 선택지 ' + (cb.checked ? '추가' : '제외') + ' — ' + KO((D.treatments.find(x => x.id === tid) || {}).name));
  }));
  $$('#sect-survey .matrix input').forEach(inp => inp.addEventListener('change', () => {
    const c = inp.dataset.c, tid = inp.dataset.t, v = Math.max(0, Math.min(3, +inp.value || 0));
    inp.value = v;
    if (!D.mapping[c]) D.mapping[c] = {};
    if (v === 0) delete D.mapping[c][tid]; else D.mapping[c][tid] = v;
    inp.classList.toggle('hot', v >= 2);
    Store.save();
    toast(`매핑 저장 — ${KO((D.concerns.find(x => x.id === c) || {}).short)} × ${KO((D.treatments.find(x => x.id === tid) || {}).name)} = ${v}`);
  }));
}

/* ═══ 5. Before & After ═════════════════════ */
function rBna() {
  const items = D.treatments.filter(tr => tr.bna);
  $('#sect-bna').innerHTML = `
    <div class="panel">
      <h3>게시 중 ${items.length}건</h3>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>시술</th><th>경과</th><th>게이트</th><th>공개 범위</th></tr></thead><tbody>
        ${items.map(tr => `<tr><td><b>${esc(KO(tr.name))}</b></td><td>${esc(KO(tr.bna.period))}</td>
          <td><span class="badge ok">동일인 ✓</span> <span class="badge ok">동일조건 ✓</span> <span class="badge ok">동의서 ✓</span></td>
          <td><span class="badge">${D.settings.exposure === 'internal' ? '원내 전용' : '외부 공개'}</span></td></tr>`).join('')}
      </tbody></table></div>
    </div>
    <div class="panel">
      <h3>새 B&A 등록 — 3중 게이트 (B-1)</h3>
      <p style="font-size:12.5px;color:var(--ink-38);">의료법 56조 2항 전후사진 예외 요건: 동일인 · 동일 조건 촬영 · 해당 기관 진료 환자. 세 가지가 확인되지 않으면 저장 버튼이 열리지 않습니다.</p>
      <div class="frm" style="margin-top:12px;">
        <div class="f"><label>시술</label><select id="bna-t">${D.treatments.map(tr => `<option value="${tr.id}">${esc(KO(tr.name))}</option>`).join('')}</select></div>
        <div class="f"><label>경과 표기</label><input id="bna-p" placeholder="예: 3회 · 8주 경과"></div>
      </div>
      <div class="gate3">
        <label><input type="checkbox" class="bna-g"> 동일인 촬영본임을 확인했습니다</label>
        <label><input type="checkbox" class="bna-g"> 동일 조건(조명·각도·거리) 촬영임을 확인했습니다</label>
        <label><input type="checkbox" class="bna-g"> 환자 촬영·활용 동의서를 첨부했습니다</label>
      </div>
      <button class="abtn gold" id="bna-save" disabled>저장</button>
      <span style="font-size:12px;color:var(--ink-38);margin-left:10px;" id="bna-hint">게이트 0 / 3</span>
    </div>`;
  const gates = $$('#sect-bna .bna-g');
  const refresh = () => {
    const n = gates.filter(g => g.checked).length;
    $('#bna-save').disabled = n < 3;
    $('#bna-hint').textContent = `게이트 ${n} / 3` + (n < 3 ? ' — 전부 확인해야 저장됩니다' : ' — 저장 가능');
  };
  gates.forEach(g => g.addEventListener('change', refresh));
  $('#bna-save').addEventListener('click', () => {
    toast('B&A 등록됨 (데모 — 원내 전용 범위로 게시)');
    gates.forEach(g => { g.checked = false; }); refresh();
  });
}

/* ═══ 6. 개인정보 수명주기 ══════════════════ */
function rPrivacy() {
  const r = D.settings.retention;
  const rows = D.submissions.map(s => {
    const keep = s.status === 'partial' ? r.partial : r.survey;
    const exp = addDays(s.at.slice(0, 10), keep);
    const dd = dday(exp);
    return { s, exp, dd, expired: dd < 0 };
  }).sort((a, b) => a.dd - b.dd);
  const expired = rows.filter(x => x.expired);
  $('#sect-privacy').innerHTML = `
    <div class="panel">
      <h3>보유기간 설정 <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink-38)">문진·동의서는 법정 보존 목록에 없어 병원이 정해 동의문에 명시합니다 (C-8)</span></h3>
      <div class="frm">
        <div class="f"><label>설문 응답 (일)</label><input id="rt-survey" type="number" value="${r.survey}"></div>
        <div class="f"><label>미완료 응답 (일)</label><input id="rt-partial" type="number" value="${r.partial}"></div>
        <div class="f"><label>동의 이력 (일)</label><input id="rt-consent" type="number" value="${r.consent}"></div>
        <div class="f"><label>B&A 사진 (일)</label><input id="rt-bna" type="number" value="${r.bna}"></div>
      </div>
      <button class="abtn sm" id="rt-save" style="margin-top:12px;">저장</button>
      <span style="font-size:12px;color:var(--ink-38);margin-left:8px;">저장 시 동의문 다음 버전(v4) 발행이 필요합니다 — 기존 동의는 이전 버전으로 보존 (B-8)</span>
    </div>
    <div class="panel">
      <h3>만료 예정 · 파기 대상 <span>${expired.length ? `<button class="abtn danger sm" id="purge-now">지금 파기 실행 (${expired.length}건)</button>` : '<span class="badge ok">파기 대상 없음</span>'}</span></h3>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>고객</th><th>제출</th><th>상태</th><th>만료일</th><th>D-day</th></tr></thead><tbody>
        ${rows.map(({ s, exp, dd, expired: ex }) => `
          <tr><td>${esc(s.name)}</td><td>${s.at.slice(5, 10)}</td>
          <td>${s.status === 'done' ? '완료' : '미완료 ' + (s.progress || 0) + '% (보유 ' + r.partial + '일)'}</td>
          <td>${exp}</td>
          <td>${ex ? '<span class="badge bad">만료 — 파기 대상</span>' : `<span class="badge ${dd <= 7 ? 'warn' : ''}">D-${dd}</span>`}</td></tr>`).join('')}
      </tbody></table></div>
    </div>
    <div class="panel">
      <h3>파기 이력</h3>
      <div class="loglist" id="purge-log">${D.purgeLogs.slice().reverse().map(p => `${esc(p.at)} · <b>${esc(p.type)}</b> ${p.count}건 파기 (${esc(p.range)})`).join('<br>') || '기록 없음'}</div>
    </div>`;
  $('#rt-save').addEventListener('click', () => {
    D.settings.retention = { survey: +$('#rt-survey').value, partial: +$('#rt-partial').value, consent: +$('#rt-consent').value, bna: +$('#rt-bna').value };
    Store.save(); toast('보유기간 저장 — 동의문 v4 발행 전까지 신규 수집엔 기존 고지가 적용됩니다'); rPrivacy();
  });
  const purge = $('#purge-now');
  if (purge) purge.addEventListener('click', () => {
    const ex = rows.filter(x => x.expired).map(x => x.s.id);
    D.submissions = D.submissions.filter(s => !ex.includes(s.id));
    D.purgeLogs.push({ at: TODAY + ' ' + new Date().toTimeString().slice(0, 5), type: '설문 응답', count: ex.length, range: '보유기간 만료분' });
    Store.save(); toast(`${ex.length}건 파기 완료 — 파기 이력에 기록됨`); rPrivacy();
  });
}

/* ═══ 7. 운영 준수 체크 ═════════════════════ */
function rComply() {
  const reg = (D.settings.fetchRegNo || '').trim();
  const insD = dday(D.settings.insuranceExpiry);
  const pub = D.settings.exposure === 'public';
  $('#sect-comply').innerHTML = `
    <div class="panel">
      <h3>외국인환자 유치기관 등록 (의료해외진출법 6조 · 미등록 유치 시 3년 이하 징역)</h3>
      <div class="frm">
        <div class="f full"><label>등록번호 — 비우면 고객 앱의 日本語·中文 버튼이 실제로 잠깁니다 (B-2)</label>
          <input id="cp-reg" value="${esc(reg)}" placeholder="예: 서울-유치-2026-0412호">
          <div class="hint ${reg ? '' : 'bad'}">${reg ? '등록 확인 — 4개 국어 활성' : '⚠ 미등록 — 고객 언어 선택에서 日/中 비활성 상태'}</div></div>
      </div>
      <button class="abtn sm" id="cp-reg-save" style="margin-top:10px;">저장</button>
    </div>
    <div class="panel-grid">
      <div class="panel">
        <h3>준수 현황</h3>
        <div class="swrow"><div><div class="t">의료사고 배상책임보험</div><div class="s">만료 ${esc(D.settings.insuranceExpiry)}</div></div>
          <span class="badge ${insD < 0 ? 'bad' : insD <= 30 ? 'warn' : 'ok'}">${insD < 0 ? '만료' : 'D-' + insD}</span></div>
        <div class="swrow"><div><div class="t">비급여 고지 최종 갱신</div><div class="s">고객 앱 「비급여 진료비용 안내」 화면과 동기화</div></div>
          <span class="badge ok">${esc(D.settings.priceNoticeUpdated)}</span></div>
        <div class="swrow"><div><div class="t">동의문 버전</div><div class="s">현재 ${esc(D.settings.consentVersion)} · 이력 ${D.consentVersions.length}건</div></div>
          <span class="badge gold">${esc(D.settings.consentVersion)}</span></div>
      </div>
      <div class="panel">
        <h3>공개 범위 (B-1)</h3>
        <div class="swrow"><div><div class="t">${pub ? '외부 공개' : '원내 전용'}</div>
          <div class="s">원내 iPad는 의료광고 심의 대상 매체가 아닙니다(의료법 57조). 외부 공개 전환 시 규제가 달라집니다.</div></div>
          <span class="tgl ${pub ? 'on' : ''}" id="cp-exposure"></span></div>
        <div class="swrow"><div><div class="t">검색 엔진 차단</div><div class="s">&lt;meta name="robots" content="noindex,nofollow"&gt; 적용 중</div></div>
          <span class="badge ${pub ? 'warn' : 'ok'}">${pub ? '해제 예정' : 'noindex ✓'}</span></div>
      </div>
    </div>`;
  $('#cp-reg-save').addEventListener('click', () => {
    D.settings.fetchRegNo = $('#cp-reg').value.trim();
    Store.save();
    toast(D.settings.fetchRegNo ? '등록번호 저장 — 고객 앱 4개 국어 활성' : '등록번호 삭제 — 고객 앱에서 日/中 이 잠겼습니다');
    rComply();
  });
  $('#cp-exposure').addEventListener('click', () => {
    if (D.settings.exposure === 'internal') {
      const bnaN = D.treatments.filter(tr => tr.bna).length;
      const evN = D.treatments.filter(tr => tr.event && tr.event.on).length;
      modal(`
        <h3>외부 공개로 전환하시겠습니까?</h3>
        <div class="warn-box">
          외부 공개 시 이 콘텐츠는 <b>의료광고 규제(의료법 56·57조)</b> 대상이 됩니다.<br><br>
          · Before &amp; After <b>${bnaN}건</b> — 불특정 다수 공개 시 56조 2항 위반 소지 (로그인 등 제한 절차 필요)<br>
          · 이벤트가 <b>${evN}건</b> — 유인·알선(27조 3항) 심의 검토 대상<br>
          · 일평균 이용자 10만 이상 매체 게재 시 사전심의 대상(57조)
        </div>
        <p style="font-size:12.5px;color:var(--ink-38);">전환 전 의료광고 자율심의기구 검토를 권장합니다.</p>
        <div class="row">
          <button class="abtn ghost" id="cp-cancel">취소 (원내 전용 유지)</button>
          <button class="abtn danger" id="cp-confirm">위험을 인지하고 전환</button>
        </div>`);
      $('#cp-cancel').addEventListener('click', closeModal);
      $('#cp-confirm').addEventListener('click', () => { D.settings.exposure = 'public'; Store.save(); closeModal(); toast('외부 공개로 전환됨 — 심의 검토 대상 콘텐츠를 확인하세요'); rComply(); });
    } else {
      D.settings.exposure = 'internal'; Store.save(); toast('원내 전용으로 복귀 — noindex 재적용'); rComply();
    }
  });
}

/* ═══ 8. 기기 · 키오스크 ════════════════════ */
let devTimer = null;
function rDevice() {
  const perf = (() => { try { return JSON.parse(localStorage.getItem('gyeol77-fontperf') || '{}'); } catch (e) { return {}; } })();
  $('#sect-device').innerHTML = `
    <div class="panel">
      <h3>등록 기기 ${D.devices.length}대 · 발행 콘텐츠 v${D.contentVersion}</h3>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>기기</th><th>위치</th><th>콘텐츠 버전</th><th>마지막 접속</th><th>상태</th></tr></thead><tbody>
        ${D.devices.map(dv => `<tr><td><b>${esc(dv.id)}</b></td><td>${esc(KO(dv.place))}</td>
          <td>v${dv.ver}</td><td>${esc(dv.seen)}</td>
          <td>${dv.ver >= D.contentVersion ? '<span class="badge ok">최신</span>' : `<span class="badge warn">v${D.contentVersion} 새로고침 필요</span>`}</td></tr>`).join('')}
      </tbody></table></div>
      <p style="font-size:12px;color:var(--ink-38);margin-top:10px;">발행 시 사용 중인 iPad는 강제 새로고침하지 않습니다 — 고객 작성 중 데이터 보호. 어트랙트 복귀 시 자동 적용됩니다 (C-3).</p>
    </div>
    <div class="panel">
      <h3>키오스크 상태 점검 — 이 브라우저 실측 (A-3)</h3>
      <div class="kgrid" id="kiosk-grid"></div>
      <p style="font-size:12px;color:var(--ink-38);margin-top:10px;">iPad Safari에는 Fullscreen API가 없습니다. 「홈 화면 추가(standalone)」+「손쉬운 사용(Guided Access)」이 실제 키오스크 구성이며, 아래 가이드가 납품물에 포함됩니다.</p>
    </div>
    <div class="panel">
      <h3>iPad 설치 가이드 — 병원 직원용 3스텝</h3>
      <div class="steps3">
        <div class="st3"><div class="n">01</div><b>홈 화면에 추가</b><p>Safari에서 앱 주소 접속 → 공유 버튼 → 「홈 화면에 추가」. 주소창 없는 전체화면(standalone)으로 실행됩니다.</p></div>
        <div class="st3"><div class="n">02</div><b>안내 접근 켜기</b><p>설정 → 손쉬운 사용 → 안내 접근(Guided Access) 켜기 → 암호 지정. 앱 이탈을 잠급니다.</p></div>
        <div class="st3"><div class="n">03</div><b>앱에서 잠금 시작</b><p>홈 화면 아이콘으로 앱 실행 → 상단 버튼(또는 홈 버튼) 3회 클릭 → 시작. 해제도 3회 클릭 + 암호.</p></div>
      </div>
    </div>
    <div class="panel">
      <h3>다국어 폰트 로드 실측 (C-1) <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink-38)">언어 선택 시에만 해당 서브셋을 받습니다</span></h3>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>언어</th><th>로드 방식</th><th>전송량</th><th>로드 시간</th></tr></thead><tbody>
        <tr><td>한국어</td><td>Pretendard dynamic-subset (초기 로드)</td><td colspan="2">글리프 분할 — 쓰는 글자만</td></tr>
        <tr><td>English</td><td>포함 (라틴 서브셋)</td><td colspan="2">추가 로드 없음</td></tr>
        <tr><td>日本語</td><td>Noto Sans JP · 언어 선택 시 지연 로드</td>
          <td>${perf.ja ? (perf.ja.kb > 0 ? perf.ja.kb + ' KB' : '측정 제한(CORS) · 로드 확인') : '<span style="color:var(--ink-38)">미로드 — 고객 앱에서 日本語 선택 시 기록</span>'}</td><td>${perf.ja ? perf.ja.ms + ' ms' : ''}</td></tr>
        <tr><td>中文</td><td>Noto Sans SC · 언어 선택 시 지연 로드</td>
          <td>${perf.zh ? (perf.zh.kb > 0 ? perf.zh.kb + ' KB' : '측정 제한(CORS) · 로드 확인') : '<span style="color:var(--ink-38)">미로드</span>'}</td><td>${perf.zh ? perf.zh.ms + ' ms' : ''}</td></tr>
      </tbody></table></div>
      <p style="font-size:12px;color:var(--ink-38);margin-top:10px;">풀셋 Noto Sans CJK는 16MB — 그대로 실으면 첫 화면이 멈춥니다. unicode-range 슬라이스로 필요한 조각만 받습니다.</p>
    </div>`;
  renderKiosk();
  clearInterval(devTimer);
  devTimer = setInterval(() => { if (curSect === 'device') renderKiosk(); else clearInterval(devTimer); }, 2000);
}
function renderKiosk() {
  let k = null;
  try { k = JSON.parse(localStorage.getItem('gyeol77-kiosk') || 'null'); } catch (e) {}
  const grid = $('#kiosk-grid'); if (!grid) return;
  if (!k) { grid.innerHTML = '<div class="kcell"><div class="k">상태</div><div class="v">고객 화면(index.html)을 먼저 열어 주세요</div></div>'; return; }
  const cell = (kk, v, led) => `<div class="kcell"><div class="k">${kk}</div><div class="v"><span class="led ${led}"></span>${v}</div></div>`;
  grid.innerHTML =
    cell('실행 모드', k.standalone ? 'standalone (홈 화면 추가)' : '브라우저 탭', k.standalone ? '' : 'warn') +
    cell('Wake Lock (화면 꺼짐 방지)', k.wakelockSupported ? (k.wakelock ? '활성' : '미획득 — 터치 후 재시도') : '미지원 → 무음 영상 폴백', k.wakelock ? '' : 'warn') +
    cell('네트워크', k.online ? '온라인' : '오프라인 — 로컬 큐 동작', k.online ? '' : 'bad') +
    cell('화면 방향', k.orient, '') +
    cell('뷰포트 실측', k.vw + ' × ' + k.vh + ' @' + k.dpr + 'x', '') +
    cell('마지막 리포트', k.at.slice(11, 19), '');
}

/* ── 탭 간 동기화 ─────────────────────────── */
window.addEventListener('storage', e => {
  if (e.key !== GYEOL_KEY && e.key !== 'gyeol77-kiosk' && e.key !== 'gyeol77-fontperf') return;
  if (e.key === GYEOL_KEY) {
    Store._d = null; const nd = Store.load();
    Object.keys(D).forEach(k => delete D[k]); Object.assign(D, nd);
  }
  RENDER[curSect]();
});

/* ── 시작 ─────────────────────────────────── */
$('#m-sub').textContent = TITLES.dash[1];
rDash();
