/* ==========================================================================
   ADSUM — 관리자 화면 로직
   ========================================================================== */
(function () {
'use strict';
const A = window.ADSUM, F = A.fmt;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

const S = { roll: 14, role: 'owner', level: 'all' };
const TARGETS = {};                       // 소재별 목표 CPA (편집 상태)
A.CREATIVES.forEach(c => { TARGETS[c.id] = c.targetCPA; });

/* --------------------------- 공통 --------------------------- */
function toast(msg, kind) {
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' ' + kind : '');
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2600);
  setTimeout(() => el.remove(), 3000);
}
function observeReveal() {
  const targets = $$('.rv:not(.in)');
  if (!targets.length) return;
  const vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 800);
  const vis = el => {
    const r = el.getBoundingClientRect();
    if (r.top < vh * 1.05 && r.bottom > -50) { el.classList.add('in'); return true; }
    return false;
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.05 });
  targets.forEach((el, i) => { el.style.transitionDelay = Math.min(i, 5) * 40 + 'ms'; if (!vis(el)) io.observe(el); });
}
function bindSeg(sel, fn) {
  const box = $(sel); if (!box) return;
  box.addEventListener('click', e => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    $$('button', box).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    fn(b.dataset.v);
  });
}

/* ==========================================================================
   1) 연동 상태
   ========================================================================== */
function renderSources() {
  $('#kickoff').textContent = F.dateFull(A.KICKOFF);
  $('#srcRows').innerHTML = A.SOURCES.map(s => {
    const live = s.state === 'live';
    const elapsed = s.appliedAt ? F.days(s.appliedAt, A.TODAY) : null;
    const badge = live
      ? '<span class="bd ok">연동 완료</span>'
      : `<span class="bd warn">권한 심사 대기 · D+${elapsed}</span>`;
    const meta = live
      ? `연동일 ${F.dateFull(s.since)}` + (s.tokenExp ? ` · 토큰 만료 ${F.dateFull(s.tokenExp)} (D-${F.days(A.TODAY, s.tokenExp)})` : '')
      : `신청일 ${F.dateFull(s.appliedAt)} · 심사 기간 <b>공식 안내 없음</b>`;
    return `<div class="row" style="${live ? '' : 'border-color:rgba(255,176,32,.32);background:rgba(255,176,32,.05)'}">
      <span class="n" style="background:${s.color}22;color:${s.color}">${s.kind === '매출' ? '₩' : '광'}</span>
      <div class="tx">
        <b>${s.name}</b> ${badge}
        <p>${s.detail}</p>
        <p style="color:var(--ink-3)">${meta}</p>
        ${live ? '' : `<div style="margin-top:8px">
          <span class="bd warn">현재 수집 방식</span>
          <span style="font-size:12.5px;color:var(--ink-2);margin-left:6px">${s.fallback}</span>
          <div style="margin-top:6px"><span class="bd mute">대체 동선</span>
          <span style="font-size:12.5px;color:var(--ink-2);margin-left:6px">
            심사 지연 시 3채널 자동 수집 선오픈 · 표준 스키마에 어댑터만 추가하면 전환됩니다</span></div></div>`}
      </div>
      <div style="flex:none;text-align:right">
        <span class="dot" style="background:${live ? 'var(--ok)' : 'var(--warn)'};width:9px;height:9px"></span>
      </div>
    </div>`;
  }).join('');
}

/* ==========================================================================
   2) 배치 — 롤링 재수집
   ========================================================================== */
function batchMetrics(roll) {
  /* 하루 배치가 다시 조회해야 하는 (일자 × 채널) 조합 수 */
  const liveCh = A.SOURCES.filter(s => s.kind === '광고' && s.state === 'live').length;
  const rows = roll * liveCh;
  /* 채널당 일자별 요청 1건 + 소재 단위 분해 요청 1건으로 가정 */
  const calls = rows * 2;
  const to = A.DAILY.length - 1, from = Math.max(0, to - 27);
  const gOnce = A.aggregate({ fromIdx: from, toIdx: to, mode: 'once', rollDays: roll });
  const gRoll = A.aggregate({ fromIdx: from, toIdx: to, mode: 'rolling', rollDays: roll });
  return { rows, calls, once: gOnce.valCh, roll: gRoll.valCh, delta: gRoll.valCh - gOnce.valCh };
}

function renderBatchMetrics() {
  const m = batchMetrics(S.roll);
  $('#mCalls').textContent = F.int(m.calls);
  $('#mRows').textContent = F.int(m.rows);
  $('#mDelta').textContent = '+' + F.wonShort(m.delta) + '원';
  drawRoll();
}

function drawRoll() {
  const cv = $('#cvRoll');
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth, H = 220;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);

  const opts = [1, 3, 7, 14, 21, 30];
  const data = opts.map(o => Object.assign({ o }, batchMetrics(o)));
  const maxVal = Math.max(...data.map(d => d.roll));
  const maxCalls = Math.max(...data.map(d => d.calls));
  const pad = { l: 10, r: 10, t: 14, b: 28 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const step = iw / data.length, bw = Math.min(38, step * 0.44);

  const t0 = performance.now();
  function frame(t) {
    const p = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - p, 3);
    c.clearRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.06)';
    for (let i = 0; i <= 3; i++) {
      const y = pad.t + ih * i / 3;
      c.beginPath(); c.moveTo(pad.l, y + .5); c.lineTo(W - pad.r, y + .5); c.stroke();
    }
    data.forEach((d, i) => {
      const x = pad.l + step * i + step / 2;
      const h1 = (d.roll / maxVal) * ih * 0.82 * e;
      const h2 = (d.calls / maxCalls) * ih * 0.82 * e;
      c.fillStyle = d.o === S.roll ? '#45e07f' : 'rgba(69,224,127,.42)';
      c.fillRect(x - bw - 2, pad.t + ih - h1, bw, h1);
      c.fillStyle = d.o === S.roll ? '#8ab4ff' : 'rgba(138,180,255,.42)';
      c.fillRect(x + 2, pad.t + ih - h2, bw, h2);
      c.fillStyle = d.o === S.roll ? '#f2f3f5' : '#6c7484';
      c.font = (d.o === S.roll ? '600 ' : '') + '11px Pretendard, sans-serif';
      c.textAlign = 'center';
      c.fillText(d.o + '일', x, H - 9);
    });
    if (p < 1) requestAnimationFrame(frame);
  }
  frame(t0 + 700);
  requestAnimationFrame(frame);

  const cur = data.find(d => d.o === S.roll) || data[0];
  const best = data[data.length - 1];
  const cover = best.roll ? cur.roll / best.roll : 1;
  $('#rollNote').innerHTML =
    `재수집 창 <b>${S.roll}일</b>에서 최근 28일 채널 신고 매출은 <b>${F.won(cur.roll)}</b>로 집계됩니다. ` +
    `30일 창(사실상 완전 성숙) 대비 <b>${(cover * 100).toFixed(1)}%</b>를 회수하며, ` +
    `일 API 호출은 <b>${F.int(cur.calls)}건</b>입니다. ` +
    (cover > 0.995
      ? '이 지점부터는 창을 더 늘려도 회수량이 늘지 않습니다. 호출만 낭비됩니다.'
      : `창을 30일로 늘리면 <b>${F.won(best.roll - cur.roll)}</b>를 더 회수하지만 호출이 ${F.int(best.calls - cur.calls)}건 늘어납니다.`);
}

const CHANNELS_LIVE = A.SOURCES.filter(s => s.kind === '광고');
let running = false;
function runBatch() {
  if (running) return;
  running = true;
  const log = $('#log');
  const now = new Date(A.TODAY); now.setHours(4, 10, 0, 0);
  let tick = 0;
  const push = (html, cls) => {
    const t = new Date(now.getTime() + tick * 1000);
    const hh = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0') +
               ':' + String(t.getSeconds()).padStart(2, '0');
    const d = document.createElement('div');
    d.innerHTML = `<span class="t">${hh}</span> <span class="${cls || ''}">${html}</span>`;
    log.appendChild(d); log.scrollTop = log.scrollHeight;
  };

  const m = batchMetrics(S.roll);
  const steps = [];
  steps.push(() => push(`배치 시작 · 재수집 창 ${S.roll}일 · 기준일 ${A.dayKey(A.TODAY)}`, 'g'));
  for (const s of CHANNELS_LIVE) {
    if (s.state !== 'live') {
      steps.push(() => push(`${s.name} — SKIP (권한 심사 미완료, D+${F.days(s.appliedAt, A.TODAY)})`, 'y'));
      continue;
    }
    const ch = A.CH_BY_ID[s.id];
    steps.push(() => push(`${s.name} · ${ch.api} — 인증 OK`));
    steps.push(() => push(`  └ ${A.dayKey(A.addDays(A.TODAY, -S.roll))} ~ ${A.dayKey(A.TODAY)} 재조회 (${S.roll}일 × 2 요청)`));
    if (s.id === 'google') {
      steps.push(() => push(`  └ cost_micros ÷ 1,000,000 변환 · 전환 지연 반영분 upsert`, 'g'));
    }
    if (s.id === 'naver') {
      steps.push(() => push(`  └ 소재 단위 없음 → 광고그룹/키워드 단위로 매핑 (합의 필요 항목)`, 'y'));
    }
    if (s.id === 'meta') {
      steps.push(() => push(`  └ image_hash 기준 소재 메타 갱신 · 만료 URL 재해결 ${A.CREATIVES.filter(c => c.ch === 'meta').length}건`, 'g'));
    }
  }
  steps.push(() => push(`rate limit 대기 2.0s (429 방지)`, 'y'));
  steps.push(() => push(`upsert 완료 — ${F.int(m.rows)}행 갱신, 매출 보정 +${F.won(m.delta)}`, 'g'));
  steps.push(() => push(`확정 처리: 성숙도 95% 이상 일자 → 재조회 대상에서 제외`, 'g'));
  steps.push(() => push(`배치 종료 (소요 ${(m.calls * 0.32).toFixed(1)}s)`, 'g'));

  let i = 0;
  const iv = setInterval(() => {
    tick += Math.ceil(Math.random() * 3);
    steps[i++]();
    if (i >= steps.length) {
      clearInterval(iv); running = false;
      toast(`배치 완료 — ${F.int(m.rows)}행 갱신, 매출 보정 ${F.won(m.delta)}`, 'ok');
    }
  }, 180);
}

/* ==========================================================================
   3) 지표 매핑
   ========================================================================== */
function renderMap() {
  $('#tblMap tbody').innerHTML = A.FIELD_MAP.map(r => `<tr>
    <td><code style="color:#8ab4ff">${r.std}</code></td>
    <td style="text-align:left;color:var(--ink-2)">${r.label}</td>
    <td style="text-align:left;font-size:12.5px">${r.meta}</td>
    <td style="text-align:left;font-size:12.5px">${r.google}</td>
    <td style="text-align:left;font-size:12.5px">${r.kakao}</td>
    <td style="text-align:left;font-size:12.5px">${r.naver}</td>
  </tr>`).join('') +
  `<tr style="background:rgba(255,90,95,.05)">
    <td><code style="color:#ff8589">attribution</code></td>
    <td style="text-align:left;color:var(--ink-2)">기여 인정 기간</td>
    ${A.CHANNELS.map(c => `<td style="text-align:left;font-size:12.5px;color:#ff8589">${c.window}</td>`).join('')}
  </tr>`;
}

/* ==========================================================================
   4) 목표 CPA
   ========================================================================== */
function cpaStats() {
  const to = A.DAILY.length - 1;
  return A.creativeStats({ fromIdx: Math.max(0, to - 6), toIdx: to, mode: 'rolling', rollDays: 14 });
}
const ST = { over: ['목표 초과', 'bad'], noconv: ['무전환 소진', 'warn'], hold: ['판정 보류', 'mute'], ok: ['정상', 'ok'] };

function renderCpa() {
  const stats = cpaStats().sort((a, b) => b.spend - a.spend);
  const cnt = { over: 0, noconv: 0, hold: 0, ok: 0 };
  const rows = stats.map(s => {
    const target = TARGETS[s.crId];
    const fake = { conv: s.conv, spend: s.spend, cr: { targetCPA: target } };
    const j = A.judge(fake, { minConv: 3, spendMultiple: 2 });
    cnt[j.status]++;
    const ch = A.CH_BY_ID[s.ch];
    const [lab, cls] = ST[j.status];
    return `<tr>
      <td><div class="cr"><img class="thumb" src="${A.thumbDataUri(s.cr)}" alt="">
        <div><div class="nm">${s.cr.name}</div>
        <div class="mt">${s.cr.format} · ${s.cr.tone}</div></div></div></td>
      <td><span class="ch"><i class="dot" style="background:${ch.color}"></i>${ch.name}</span></td>
      <td class="num">${F.won(s.spend)}</td>
      <td class="num">${s.conv}</td>
      <td class="num">${s.conv ? F.won(s.spend / s.conv) : '<span style="color:var(--ink-3)">정의 불가</span>'}</td>
      <td><input type="number" data-cpa="${s.crId}" value="${target}" step="1000" min="1000"
           style="width:104px;text-align:right" class="num"></td>
      <td><span class="bd ${cls}">${lab}</span></td>
    </tr>`;
  });
  $('#tblCpa tbody').innerHTML = rows.join('');
  $('#aOver').textContent = cnt.over;
  $('#aNoconv').textContent = cnt.noconv;
  $('#aHold').textContent = cnt.hold;
}

/* ==========================================================================
   5) 권한
   ========================================================================== */
const PERMS = [
  { k: '대시보드 성과 조회', owner: '전체', marketer: '전체', viewer: '전체', why: '성과 확인은 모두에게 열려 있어야 협업이 됩니다.' },
  { k: '스마트스토어 실매출', owner: '금액 표시', marketer: '금액 표시', viewer: '지수만(금액 숨김)', why: '외부 대행사에 실매출 원액을 노출할 이유가 없습니다. ROAS 지수만으로 운영이 가능합니다.' },
  { k: '목표 CPA 수정', owner: '가능', marketer: '가능', viewer: '불가', why: '판정 기준을 바꾸면 모든 리포트가 달라집니다.' },
  { k: 'API 키·토큰 열람', owner: '마스킹 후 표시', marketer: '불가', viewer: '불가', why: '광고 계정 토큰이 유출되면 예산 집행 권한까지 넘어갑니다.' },
  { k: '채널 연동 설정 변경', owner: '가능', marketer: '불가', viewer: '불가', why: '연동 설정 변경은 과거 데이터 정합성에 영향을 줍니다.' },
  { k: 'CSV 내보내기', owner: '가능', marketer: '가능', viewer: '금액 제외 열만', why: '반출 경로가 가장 흔한 유출 지점입니다.' },
  { k: 'LLM 인사이트 요청', owner: '가능', marketer: '가능', viewer: '불가', why: '외부 모델 호출은 사내 데이터의 외부 전송입니다. 호출 이력을 남깁니다.' },
  { k: '배치 수동 실행', owner: '가능', marketer: '가능(일 3회 제한)', viewer: '불가', why: 'rate limit을 넘기면 그날 수집 전체가 실패합니다.' }
];
function renderRole() {
  $('#tblRole tbody').innerHTML = PERMS.map(p => {
    const v = p[S.role];
    const bad = /불가|숨김|제외/.test(v);
    return `<tr>
      <td>${p.k}</td>
      <td><span class="bd ${bad ? 'mute' : 'ok'}">${v}</span></td>
      <td style="text-align:left;color:var(--ink-2);font-size:12.5px">${p.why}</td>
    </tr>`;
  }).join('');
}

/* ==========================================================================
   6) 검토 항목
   ========================================================================== */
const LV = { high: ['그대로 만들면 작동 안 함', 'bad'], mid: ['운영 중 반드시 터짐', 'warn'], low: ['있으면 좋음', 'mute'] };
function renderRisk() {
  const rows = A.RISKS.filter(r => S.level === 'all' || r.level === S.level);
  $('#riskRows').innerHTML = rows.map(r => {
    const [lab, cls] = LV[r.level];
    return `<div class="row" style="border-color:${r.level === 'high' ? 'rgba(255,90,95,.28)' : r.level === 'mid' ? 'rgba(255,176,32,.24)' : 'var(--line)'}">
      <span class="n">${r.id}</span>
      <div class="tx">
        <b>${r.title}</b> <span class="bd ${cls}">${lab}</span>
        <p>${r.body}</p>
        <p style="color:#8ab4ff;margin-top:7px"><b>대응</b> — ${r.fix}</p>
        <p style="color:var(--ink-3);margin-top:4px">확인 위치: ${r.where}</p>
      </div>
    </div>`;
  }).join('') || '<p style="color:var(--ink-3)">해당 등급의 항목이 없습니다.</p>';
  observeReveal();
}

/* ==========================================================================
   초기화
   ========================================================================== */
function init() {
  renderSources();
  renderBatchMetrics();
  renderMap();
  renderCpa();
  renderRole();
  renderRisk();
  observeReveal();

  bindSeg('#segRoll', v => { S.roll = +v; renderBatchMetrics(); });
  bindSeg('#segRole', v => { S.role = v; renderRole(); toast('역할 전환: ' + $('#segRole button[aria-pressed="true"]').textContent); });
  bindSeg('#segLevel', v => { S.level = v; renderRisk(); });

  $('#btnRun').addEventListener('click', runBatch);

  $('#tblCpa').addEventListener('change', e => {
    const i = e.target.closest('[data-cpa]'); if (!i) return;
    const v = Math.max(1000, parseInt(i.value, 10) || 1000);
    TARGETS[i.dataset.cpa] = v;
    renderCpa();
    toast('목표 CPA를 ' + F.won(v) + '로 변경했습니다 — 판정을 다시 계산했습니다', 'ok');
  });
  $('#btnBulk').addEventListener('click', () => {
    Object.keys(TARGETS).forEach(k => TARGETS[k] = Math.round(TARGETS[k] * 1.1 / 100) * 100);
    renderCpa(); toast('전체 목표 CPA를 10% 올렸습니다 — 초과 건수가 줄어듭니다');
  });
  $('#btnBulkDn').addEventListener('click', () => {
    Object.keys(TARGETS).forEach(k => TARGETS[k] = Math.round(TARGETS[k] * 0.9 / 100) * 100);
    renderCpa(); toast('전체 목표 CPA를 10% 내렸습니다 — 초과 건수가 늘어납니다');
  });
  $('#btnReset').addEventListener('click', () => {
    A.CREATIVES.forEach(c => { TARGETS[c.id] = c.targetCPA; });
    renderCpa(); toast('초기값으로 되돌렸습니다', 'ok');
  });

  document.addEventListener('click', e => {
    if (e.target.closest('[data-close]') || e.target.id === 'mask') $('#mask').classList.remove('on');
  });
  window.addEventListener('scroll', observeReveal, { passive: true });
  let rz;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawRoll, 180); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

window.__ADSUM_ADMIN_TEST = { S, TARGETS, renderCpa, runBatch, batchMetrics, renderRisk, renderRole };
})();
