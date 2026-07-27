/* ==========================================================================
   ADSUM — 대시보드 화면 로직
   모든 수치는 data.js의 생성 데이터에서 실제로 계산합니다.
   ========================================================================== */
(function () {
'use strict';
const A = window.ADSUM, F = A.fmt;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

/* --------------------------- 상태 --------------------------- */
const S = {
  period: 28,
  mode: 'rolling',
  rollDays: 14,
  basis: 'total',
  win: 7,
  minConv: 3,
  mult: 2.0,
  status: 'all',
  ch: '',
  naive: false,
  bw: 7
};

const BASIS_LABEL = { channel: '채널 합산', adonly: '광고 기여', total: '전체 실매출' };
const BASIS_DESC = {
  channel: '각 매체가 신고한 전환매출의 단순 합. 중복이 포함되어 있습니다.',
  adonly: '광고 터치가 있었던 주문만 중복 없이 집계한 금액입니다.',
  total: '스마트스토어 주문 전량. 통합 ROAS(MER)의 기준입니다.'
};

/* --------------------------- 유틸 --------------------------- */
function toast(msg, kind) {
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' ' + kind : '');
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2600);
  setTimeout(() => el.remove(), 3000);
}

function countUp(el, to, format) {
  const from = parseFloat(el.dataset.v || '0');
  el.dataset.v = to;
  const t0 = performance.now(), dur = 620;
  /* 최종값을 먼저 확정해 둡니다 — 창이 백그라운드라 rAF가 돌지 않아도 값이 남습니다 */
  el.innerHTML = format(to);
  if (Math.abs(to - from) < 1e-9) return;
  function step(t) {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);              // easeOutCubic
    el.innerHTML = format(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
    else el.innerHTML = format(to);
  }
  requestAnimationFrame(step);
}

/* 리빌 — 뷰포트 안이면 즉시, 밖이면 관찰 (숨겨진 창에서도 동작하도록 폴백) */
function observeReveal() {
  const targets = $$('.rv:not(.in)');
  if (!targets.length) return;
  /* 백그라운드 탭에서는 IntersectionObserver 콜백이 지연되므로 뷰포트 폴백을 둡니다 */
  const vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 800);
  const showIfVisible = el => {
    const r = el.getBoundingClientRect();
    if (r.top < vh * 1.05 && r.bottom > -50) { el.classList.add('in'); return true; }
    return false;
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.05 });
  targets.forEach((el, i) => {
    el.style.transitionDelay = Math.min(i, 5) * 40 + 'ms';
    if (!showIfVisible(el)) io.observe(el);
  });
}

function range() {
  const to = A.DAILY.length - 1;
  return { fromIdx: Math.max(0, to - S.period + 1), toIdx: to };
}
function winRange(win) {
  const to = A.DAILY.length - 1;
  return { fromIdx: Math.max(0, to - win + 1), toIdx: to };
}
function aggOpts(r) {
  return { fromIdx: r.fromIdx, toIdx: r.toIdx, mode: S.mode, rollDays: S.rollDays };
}

/* --------------------------- 세그먼트 바인딩 --------------------------- */
function bindSeg(sel, fn) {
  const box = $(sel);
  if (!box) return;
  box.addEventListener('click', e => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    $$('button', box).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    fn(b.dataset.v);
  });
}

/* ==========================================================================
   1) KPI + 신선도
   ========================================================================== */
function renderKPI() {
  const r = range();
  const g = A.aggregate(aggOpts(r));
  const rev = g.revenue[S.basis];
  const roas = g.spend ? rev / g.spend : 0;
  const ctr = g.imp ? g.clk / g.imp : 0;
  const cpa = g.convCh ? g.spend / g.convCh : 0;

  countUp($('[data-kpi="spend"]'), g.spend, v => F.won(v));
  countUp($('[data-kpi="rev"]'), rev, v => F.won(v));
  countUp($('[data-kpi="roas"]'), roas, v => (v * 100).toFixed(0) + '<small>%</small>');
  countUp($('[data-kpi="ctr"]'), ctr, v => (v * 100).toFixed(2) + '<small>%</small>');
  countUp($('[data-kpi="conv"]'), g.convCh, v => F.int(v) + '<small>건</small>');
  countUp($('[data-kpi="cpa"]'), cpa, v => F.won(v));

  $('#basisChip').textContent = BASIS_LABEL[S.basis];
  $('[data-sub="rev"]').textContent = BASIS_DESC[S.basis];
  $('[data-sub="roas"]').textContent = S.basis === 'total'
    ? 'MER — 전체 실매출 ÷ 총 광고비' : BASIS_LABEL[S.basis] + ' ÷ 광고비';
  $('[data-sub="conv"]').textContent = '채널 신고 전환수 합계(중복 포함)';
  $('[data-sub="spend"]').textContent = A.CHANNELS.length + '개 채널 합계 · ' + S.period + '일';

  /* 신선도 배너 */
  const last = g.series[g.series.length - 1];
  const m1 = A.maturity(1), full = 1;
  const banner = $('#freshBanner');
  if (S.mode === 'once') {
    const gRoll = A.aggregate({ fromIdx: r.fromIdx, toIdx: r.toIdx, mode: 'rolling', rollDays: S.rollDays });
    const diff = gRoll.valCh - g.valCh;
    banner.classList.add('warnish');
    $('#freshTitle').innerHTML = '일 1회 수집 — 과거 수치가 <b>' + F.won(diff) + '</b> 만큼 낮게 굳어 있습니다';
    $('#freshBody').innerHTML =
      '전환은 지연 도착합니다. D+1에 한 번 긁고 다시 조회하지 않으면 그 날짜는 성숙도 ' +
      (m1 * 100).toFixed(0) + '% 상태로 영구히 고정됩니다. ' +
      '이 기간 채널 신고 매출이 실제보다 <b>' + ((1 - g.valCh / gRoll.valCh) * 100).toFixed(1) +
      '%</b> 적게 집계되어 ROAS를 과소 평가하게 됩니다.' +
      (S.basis === 'total'
        ? ' <b>지금은 매출 기준이 [전체 실매출]이라 매출 KPI 자체는 변하지 않습니다</b> — ' +
          '스마트스토어 주문 금액은 어트리뷰션과 무관하게 확정이기 때문입니다. ' +
          '위 [채널 합산]으로 바꾸면 금액이 실제로 달라지는 것을 볼 수 있습니다.'
        : ' 전환수와 채널 ROAS가 함께 내려갑니다.');
  } else {
    const prov = g.series.filter(s => s.maturity < 0.95).length;
    banner.classList.remove('warnish');
    $('#freshTitle').innerHTML = '롤링 재수집 — 최근 <b>' + prov + '일</b>은 잠정치입니다';
    $('#freshBody').innerHTML =
      '최근 ' + S.rollDays + '일을 매일 다시 조회해 덮어씁니다. 전환 지연 때문에 최근 구간은 ' +
      '아직 값이 오르는 중이며(어제 성숙도 ' + (A.maturity(1) * 100).toFixed(0) + '%), ' +
      '성숙도 95%를 넘긴 날짜부터 확정으로 표시합니다. ' +
      '<b>어제 숫자로 소재를 끄지 마세요.</b>';
  }
  return g;
}

/* ==========================================================================
   2) 차트 — 채널별 광고비 스택 바 + 매출 라인
   ========================================================================== */
function drawMain(g) {
  const cv = $('#cvMain');
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth, H = 260;
  cv.width = W * dpr; cv.height = H * dpr;
  cv.style.height = H + 'px';
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);

  const pad = { l: 8, r: 8, t: 16, b: 26 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const days = g.series;
  const n = days.length;
  const maxSpend = Math.max(...days.map(d => d.spend), 1);
  const revOf = d => S.basis === 'channel' ? d.valCh : S.basis === 'adonly' ? d.ad : d.real;
  const maxRev = Math.max(...days.map(revOf), 1);

  const bw = Math.max(2, iw / n * 0.62);
  const step = iw / n;

  /* 가로 그리드 */
  c.strokeStyle = 'rgba(255,255,255,.06)'; c.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + ih * i / 4;
    c.beginPath(); c.moveTo(pad.l, y + .5); c.lineTo(W - pad.r, y + .5); c.stroke();
  }

  /* 애니메이션 진행률 */
  const t0 = performance.now(), dur = 700;
  function frame(t) {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    c.clearRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.06)';
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + ih * i / 4;
      c.beginPath(); c.moveTo(pad.l, y + .5); c.lineTo(W - pad.r, y + .5); c.stroke();
    }

    /* 스택 바 */
    days.forEach((d, i) => {
      const x = pad.l + step * i + (step - bw) / 2;
      let acc = 0;
      const idx = g.series.length - 1 - i;
      for (const ch of A.CHANNELS) {
        const day = A.DAILY[range().fromIdx + i];
        const sp = day.byCh[ch.id].spend;
        const h = (sp / maxSpend) * ih * 0.78 * e;
        acc += h;
        c.fillStyle = ch.color;
        c.globalAlpha = 0.85;
        c.fillRect(x, pad.t + ih - acc, bw, h);
      }
      c.globalAlpha = 1;
      /* 잠정 구간 표시 */
      if (d.maturity < 0.95) {
        c.fillStyle = 'rgba(255,255,255,.07)';
        c.fillRect(x - (step - bw) / 2, pad.t, step, ih);
      }
    });

    /* 매출 라인 */
    c.beginPath();
    days.forEach((d, i) => {
      const x = pad.l + step * i + step / 2;
      const y = pad.t + ih - (revOf(d) / maxRev) * ih * 0.86 * e;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    });
    c.strokeStyle = S.basis === 'channel' ? '#ff8589' : S.basis === 'adonly' ? '#8ab4ff' : '#45e07f';
    c.lineWidth = 2; c.lineJoin = 'round'; c.stroke();

    /* x 라벨 */
    c.fillStyle = '#6c7484'; c.font = '11px Pretendard, sans-serif'; c.textAlign = 'center';
    const every = Math.ceil(n / 8);
    days.forEach((d, i) => {
      if (i % every) return;
      c.fillText(F.date(d.date), pad.l + step * i + step / 2, H - 8);
    });

    if (p < 1) requestAnimationFrame(frame);
  }
  frame(t0 + dur);              // 완성 상태를 먼저 그려 둡니다 (rAF가 안 도는 환경 대비)
  requestAnimationFrame(frame); // 그 위에 0→100% 애니메이션을 얹습니다

  $('#lgMain').innerHTML = A.CHANNELS.map(ch =>
    `<span><i class="dot" style="background:${ch.color}"></i>${ch.name} 광고비</span>`).join('') +
    `<span><i class="dot" style="background:${S.basis === 'channel' ? '#ff8589' : S.basis === 'adonly' ? '#8ab4ff' : '#45e07f'}"></i>${BASIS_LABEL[S.basis]} 매출</span>` +
    `<span><i class="dot" style="background:rgba(255,255,255,.16)"></i>잠정 구간</span>`;
}

/* ==========================================================================
   3) 중복 진단
   ========================================================================== */
function renderDup(g) {
  const a = g.valCh, b = g.adTouched, cc = g.real;
  const mx = Math.max(a, b, cc, 1);
  $('#dupA').innerHTML = F.won(a) + ' &nbsp;<span class="bd bad">ROAS ' + F.roas(a / g.spend) + '</span>';
  $('#dupB').innerHTML = F.won(b) + ' &nbsp;<span class="bd info">ROAS ' + F.roas(b / g.spend) + '</span>';
  $('#dupC').innerHTML = F.won(cc) + ' &nbsp;<span class="bd ok">MER ' + F.roas(cc / g.spend) + '</span>';
  setTimeout(() => {
    $('#barA').style.width = (a / mx * 100) + '%';
    $('#barB').style.width = (b / mx * 100) + '%';
    $('#barC').style.width = (cc / mx * 100) + '%';
  }, 60);

  const dup = b ? (a - b) / b : 0;
  $('#dupRate').textContent = (dup * 100).toFixed(1) + '%';
  $('#dupNote').innerHTML =
    '채널 합산이 광고 기여 매출보다 <b>' + F.won(a - b) + '</b> 많습니다. ' +
    '같은 주문을 여러 매체가 각각 전액으로 신고했기 때문입니다. ' +
    '기여 인정 기간이 메타 ' + A.CH_BY_ID.meta.windowDays + '일, 구글 ' + A.CH_BY_ID.google.windowDays +
    '일로 다르므로 이 격차는 설정을 바꿔도 사라지지 않습니다. ' +
    '<b>합계 지표는 MER을 쓰고, 채널 ROAS는 채널 간 비교용으로만 쓰는 것</b>을 권합니다.';
}

/* ==========================================================================
   4) 채널별 표
   ========================================================================== */
function renderChannels(g) {
  const tb = $('#tblCh tbody'), tf = $('#tblCh tfoot');
  tb.innerHTML = A.CHANNELS.map(ch => {
    const p = g.perCh[ch.id];
    const src = A.SOURCES.find(s => s.id === ch.id);
    const manual = src && src.state !== 'live'
      ? ' <span class="bd warn" style="height:18px;font-size:10.5px">수동 수집</span>' : '';
    return `<tr>
      <td><span class="ch"><i class="dot" style="background:${ch.color}"></i>${ch.name}</span>${manual}
          <div class="mt" style="font-size:11.5px;color:var(--ink-3)">${manual ? 'API 권한 심사 중 — CSV 업로드' : ch.api}</div></td>
      <td style="text-align:left;color:var(--ink-2);font-size:12.5px">${ch.window}</td>
      <td class="num">${F.won(p.spend)}</td>
      <td class="num">${F.int(p.imp)}</td>
      <td class="num">${F.int(p.clk)}</td>
      <td class="num">${p.imp ? F.pct(p.clk / p.imp, 2) : '—'}</td>
      <td class="num">${F.int(p.conv)}</td>
      <td class="num">${F.won(p.val)}</td>
      <td class="num"><b style="color:${p.val / p.spend >= 3 ? '#45e07f' : p.val / p.spend >= 2 ? 'var(--ink)' : '#ff8589'}">${p.spend ? F.roas(p.val / p.spend) : '—'}</b></td>
      <td class="num">${p.conv ? F.won(p.spend / p.conv) : '—'}</td>
    </tr>`;
  }).join('');

  tf.innerHTML = `<tr>
    <td>합계</td>
    <td style="text-align:left;font-weight:500;color:var(--ink-3);font-size:12px">기간이 달라 합산 불가</td>
    <td class="num">${F.won(g.spend)}</td>
    <td class="num">${F.int(g.imp)}</td>
    <td class="num">${F.int(g.clk)}</td>
    <td class="num">${F.pct(g.clk / g.imp, 2)}</td>
    <td class="num">${F.int(g.convCh)}</td>
    <td class="num" style="color:#ff8589">${F.won(g.valCh)}</td>
    <td class="num" style="color:#ff8589">${F.roas(g.valCh / g.spend)}</td>
    <td class="num">${F.won(g.spend / g.convCh)}</td>
  </tr>
  <tr>
    <td colspan="7" style="text-align:left;color:var(--ink-2);font-size:12.5px">
      ↳ 실매출 기준 <b>통합 ROAS(MER)</b> — 중복 없는 경영 기준</td>
    <td class="num" style="color:#45e07f">${F.won(g.real)}</td>
    <td class="num" style="color:#45e07f"><b>${F.roas(g.real / g.spend)}</b></td>
    <td></td>
  </tr>`;
}

/* ==========================================================================
   5) 소재 · 목표 CPA
   ========================================================================== */
let CR_CACHE = [];
function renderCreatives() {
  const r = winRange(S.win);
  const stats = A.creativeStats(aggOpts(r));
  const params = { minConv: S.minConv, spendMultiple: S.mult };
  CR_CACHE = stats.map(s => Object.assign(s, { j: A.judge(s, params), jn: A.judgeNaive(s) }));

  const cnt = { over: 0, noconv: 0, hold: 0, ok: 0 };
  CR_CACHE.forEach(s => cnt[s.j.status]++);
  $('#cntOver').textContent = cnt.over;
  $('#cntNoconv').textContent = cnt.noconv;
  $('#cntHold').textContent = cnt.hold;

  /* 요구사항 그대로 구현했을 때 사라지는 소재 */
  const invisible = CR_CACHE.filter(s => s.jn.status === 'invisible');
  const lostSpend = invisible.reduce((a, s) => a + s.spend, 0);
  const naiveOver = CR_CACHE.filter(s => s.jn.status === 'over').length;
  $('#naiveNote').innerHTML =
    '"CPA > 목표"만 비교하면 최근 ' + S.win + '일 기준 <b>' + naiveOver + '건</b>이 초과로 잡힙니다. ' +
    '그런데 전환 0건이라 비교 자체가 불가능한 소재가 <b>' + invisible.length + '건</b> 있고, ' +
    '이 소재들이 같은 기간 <b>' + F.won(lostSpend) + '</b>을 이미 썼습니다. ' +
    (invisible.length ? '<b style="color:#ff8589">가장 위험한 소재가 목록에서 통째로 빠집니다.</b>'
                      : '이 기간엔 전환 0건 소재가 없어 차이가 나타나지 않습니다.');

  drawCrTable();
}

const ST_LABEL = {
  over: ['목표 초과', 'bad'], noconv: ['무전환 소진', 'warn'],
  hold: ['판정 보류', 'mute'], ok: ['정상', 'ok'], invisible: ['판정 불가', 'mute']
};

function drawCrTable() {
  let rows = CR_CACHE.slice();
  if (S.ch) rows = rows.filter(s => s.ch === S.ch);
  if (S.status !== 'all') rows = rows.filter(s => (S.naive ? s.jn.status : s.j.status) === S.status);
  rows.sort((a, b) => b.spend - a.spend);

  $('#crCount').textContent = rows.length + '개 소재 · 최근 ' + S.win + '일';
  $('#tblCr tbody').innerHTML = rows.map(s => {
    const j = S.naive ? s.jn : s.j;
    const [lab, cls] = ST_LABEL[j.status];
    const ch = A.CH_BY_ID[s.ch];
    return `<tr>
      <td><div class="cr">
        <img class="thumb" src="${A.thumbDataUri(s.cr)}" alt="">
        <div><div class="nm">${s.cr.name}</div>
        <div class="mt">${s.cr.format} · ${s.cr.tone} · ${s.cr.key}${s.cr.model ? ' · 인물' : ''}${s.cr.price ? ' · 가격표기' : ''}</div></div>
      </div></td>
      <td><span class="ch"><i class="dot" style="background:${ch.color}"></i>${ch.name}</span></td>
      <td class="num">${F.won(s.spend)}</td>
      <td class="num">${F.int(s.clk)}</td>
      <td class="num">${F.int(s.conv)}</td>
      <td class="num">${j.cpa ? F.won(j.cpa) : '<span style="color:var(--ink-3)">정의 불가</span>'}</td>
      <td class="num" style="color:var(--ink-3)">${F.won(j.target)}</td>
      <td class="num">${s.spend ? F.roas(s.roas) : '—'}</td>
      <td><span class="bd ${cls}">${lab}</span></td>
      <td><button class="btn sm" data-img="${s.crId}">보기</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="10" style="text-align:center;color:var(--ink-3);padding:26px">해당 조건의 소재가 없습니다.</td></tr>';
}

/* ==========================================================================
   6) 이미지 URL 모달 — 만료 재현
   ========================================================================== */
function openImage(crId) {
  const cr = A.CR_BY_ID[crId];
  const st = A.storedImageUrl(cr), rs = A.resolvedImageUrl(cr), mr = A.mirroredImageUrl(cr);
  const daysExp = F.days(st.expiresAt, A.TODAY);
  $('#modal').innerHTML = `
    <button class="x" data-close>×</button>
    <h3>소재 이미지 바로보기</h3>
    <p class="sub" style="color:var(--ink-3);font-size:13px;margin-top:4px">${cr.name}</p>

    <div class="banner warnish" style="margin-top:16px">
      <span class="ic">!</span>
      <div style="flex:1;min-width:200px">
        <b>요구사항 2-2 "이미지 바로보기(URL 연동)"는 그대로 만들면 깨집니다</b>
        <p>메타의 <code>image_url</code>·<code>thumbnail_url</code>은 서명이 붙은 임시 URL이며
           영구 링크가 없습니다. 호출할 때마다 새 URL이 발급되고 이전 URL은 만료됩니다.</p>
      </div>
    </div>

    <div class="rows" style="margin-top:16px">
      <div class="row" style="border-color:rgba(255,90,95,.3)">
        <span class="n" style="color:#ff8589">1</span>
        <div class="tx">
          <b>수집 시점 URL을 그대로 저장</b> <span class="bd bad">만료됨</span>
          <p style="word-break:break-all;font-family:monospace;font-size:11px;margin-top:6px">${st.url}</p>
          <p>수집일 ${F.dateFull(A.COLLECTED_AT)} · 서명 만료 ${F.dateFull(st.expiresAt)}
             (<b>${daysExp}일 경과</b>)</p>
          <button class="btn sm" style="margin-top:8px" data-try="stored">열어 보기</button>
        </div>
      </div>
      <div class="row" style="border-color:rgba(0,201,80,.3)">
        <span class="n" style="color:#45e07f">2</span>
        <div class="tx">
          <b>image_hash를 저장하고 조회 시점에 재해결</b> <span class="bd ok">정상</span>
          <p style="word-break:break-all;font-family:monospace;font-size:11px;margin-top:6px">hash = ${cr.imageHash}<br>${rs.url}</p>
          <button class="btn sm" style="margin-top:8px" data-try="resolve">열어 보기</button>
        </div>
      </div>
      <div class="row" style="border-color:rgba(167,139,250,.3)">
        <span class="n" style="color:#b98cff">3</span>
        <div class="tx">
          <b>수집 시 이미지를 자체 스토리지로 복사</b> <span class="bd vio">권장</span>
          <p style="word-break:break-all;font-family:monospace;font-size:11px;margin-top:6px">${mr.url}</p>
          <p>매체 계정에서 소재가 삭제돼도 과거 리포트가 유지됩니다. 저장 비용만 듭니다.</p>
          <button class="btn sm" style="margin-top:8px" data-try="mirror">열어 보기</button>
        </div>
      </div>
    </div>

    <div id="imgResult" style="margin-top:16px"></div>`;
  $('#mask').classList.add('on');

  $('#modal').addEventListener('click', e => {
    const t = e.target.closest('[data-try]');
    if (!t) return;
    const box = $('#imgResult');
    if (t.dataset.try === 'stored') {
      box.innerHTML = `<pre class="code"><span class="c">GET</span> ${st.url}
<span class="c">→</span> <span style="color:#ff8589">HTTP 403 Forbidden</span>
{ "error": { "message": <span class="s">"URL signature expired"</span>, "code": 4, "type": "OAuthException" } }</pre>
        <p style="color:#ff8589;font-size:13px;margin-top:8px">저장된 URL은 ${daysExp}일 전에 만료됐습니다. 이미지를 표시할 수 없습니다.</p>`;
      toast('저장된 URL이 만료되어 실패했습니다', 'bad');
    } else if (t.dataset.try === 'resolve') {
      box.innerHTML = `<pre class="code"><span class="c">GET</span> /adimages?hashes=["${cr.imageHash}"]
<span class="c">→</span> <span class="s">HTTP 200</span> · 새 서명 URL 발급 (유효 ${F.dateFull(rs.expiresAt)}까지)</pre>
        <div style="margin-top:12px;display:flex;gap:12px;align-items:center">
          <img src="${A.thumbDataUri(cr)}" style="width:96px;height:96px;border-radius:10px;border:1px solid var(--line-2)">
          <div style="font-size:13px;color:var(--ink-2)">
            <b style="color:var(--ink)">정상 표시</b><br>
            요청 시마다 재해결하므로 만료되지 않습니다.<br>
            대신 목록을 열 때마다 API 호출이 늘어납니다(캐시 TTL 필요).</div></div>`;
      toast('해시 재해결로 정상 표시했습니다', 'ok');
    } else {
      box.innerHTML = `<pre class="code"><span class="c">GET</span> ${mr.url}
<span class="c">→</span> <span class="s">HTTP 200</span> · 자체 스토리지 (외부 의존 없음)</pre>
        <div style="margin-top:12px;display:flex;gap:12px;align-items:center">
          <img src="${A.thumbDataUri(cr)}" style="width:96px;height:96px;border-radius:10px;border:1px solid var(--line-2)">
          <div style="font-size:13px;color:var(--ink-2)">
            <b style="color:var(--ink)">정상 표시</b><br>
            매체에서 소재가 삭제돼도 유지됩니다.</div></div>`;
      toast('자체 스토리지 사본에서 표시했습니다', 'ok');
    }
  });
}

/* ==========================================================================
   7) 베스트 / 워스트
   ========================================================================== */
function renderBW() {
  const r = winRange(S.bw);
  const stats = A.creativeStats(aggOpts(r));
  const minSpend = S.bw === 7 ? 300000 : 1000000;
  const minConv = 3;
  const pass = stats.filter(s => s.spend >= minSpend && s.conv >= minConv);
  const fail = stats.filter(s => !(s.spend >= minSpend && s.conv >= minConv));
  pass.sort((a, b) => b.roas - a.roas);

  $('#bwGate').innerHTML = '기준: 소진 ' + F.wonShort(minSpend) + '원 이상 · 전환 ' + minConv + '건 이상 → ' +
    '<b>' + pass.length + '개 후보</b> / 표본 부족 ' + fail.length + '개 제외';

  const card = (s, kind) => {
    const ch = A.CH_BY_ID[s.ch];
    return `<div class="row" style="border-color:${kind === 'best' ? 'rgba(0,201,80,.28)' : 'rgba(255,90,95,.28)'}">
      <img class="thumb" src="${A.thumbDataUri(s.cr)}" alt="">
      <div class="tx">
        <b>${s.cr.name}</b>
        <p><span class="ch"><i class="dot" style="background:${ch.color}"></i>${ch.name}</span>
           · ${s.cr.format} · ${s.cr.tone}${s.cr.model ? ' · 인물' : ''}</p>
        <p class="num">광고비 ${F.won(s.spend)} · 전환 ${s.conv}건 · CPA ${F.won(s.spend / s.conv)}</p>
      </div>
      <div style="text-align:right;flex:none">
        <div class="num" style="font-size:19px;font-weight:700;color:${kind === 'best' ? '#45e07f' : '#ff8589'}">${F.roas(s.roas)}</div>
        <div style="font-size:11px;color:var(--ink-3)">ROAS</div>
      </div>
    </div>`;
  };

  if (!pass.length) {
    $('#bwBox').innerHTML = '<p style="color:var(--ink-3);font-size:13px">기준을 만족하는 소재가 없습니다.</p>';
    return;
  }
  const best = pass.slice(0, 3), worst = pass.slice(-3).reverse();
  const naiveTop = stats.slice().sort((a, b) => b.roas - a.roas)[0];
  const naiveWarn = (naiveTop && naiveTop.spend < minSpend)
    ? `<div class="banner" style="margin-top:12px"><span class="ic" style="background:rgba(255,176,32,.14);color:var(--warn)">!</span>
       <div style="flex:1;min-width:200px"><b>기준을 안 걸면 1위는 이 소재입니다</b>
       <p>${naiveTop.cr.name} — 광고비 ${F.won(naiveTop.spend)} · 전환 ${naiveTop.conv}건 · ROAS ${F.roas(naiveTop.roas)}.
       표본이 너무 작아 다음 기획의 근거로 쓰기 어렵습니다.</p></div></div>` : '';

  $('#bwBox').innerHTML =
    '<div class="lbl" style="margin-bottom:8px">베스트 3</div><div class="rows">' + best.map(s => card(s, 'best')).join('') + '</div>' +
    '<div class="lbl" style="margin:16px 0 8px">워스트 3</div><div class="rows">' + worst.map(s => card(s, 'worst')).join('') + '</div>' +
    naiveWarn;
}

/* ==========================================================================
   8) 인사이트 — 디자인 요소 스코어카드
   ========================================================================== */
function attrStats(stats, keyFn, values) {
  const base = stats.reduce((a, s) => a + s.spend, 0);
  const baseVal = stats.reduce((a, s) => a + s.val, 0);
  const baseRoas = base ? baseVal / base : 0;
  return values.map(v => {
    const g = stats.filter(s => keyFn(s.cr) === v);
    const sp = g.reduce((a, s) => a + s.spend, 0);
    const va = g.reduce((a, s) => a + s.val, 0);
    const cl = g.reduce((a, s) => a + s.clk, 0);
    const im = g.reduce((a, s) => a + s.imp, 0);
    return { v, n: g.length, spend: sp, val: va, roas: sp ? va / sp : 0,
             ctr: im ? cl / im : 0, index: baseRoas ? (sp ? (va / sp) / baseRoas : 0) : 0 };
  }).filter(x => x.n > 0).sort((a, b) => b.roas - a.roas);
}

let LAST_PAYLOAD = null;

function renderInsight() {
  const r = winRange(S.bw);
  const stats = A.creativeStats(aggOpts(r)).filter(s => s.spend >= 100000);
  const groups = [
    { key: '소재 형식', fn: c => c.format, values: A.FORMATS },
    { key: '카피 톤', fn: c => c.tone, values: A.TONES },
    { key: '인물 등장', fn: c => (c.model ? '있음' : '없음'), values: ['있음', '없음'] },
    { key: '가격 표기', fn: c => (c.price ? '있음' : '없음'), values: ['있음', '없음'] },
    { key: '주조색', fn: c => c.key, values: A.KEYS }
  ].map(g => Object.assign(g, { rows: attrStats(stats, g.fn, g.values) }));

  const maxRoas = Math.max(...groups.flatMap(g => g.rows.map(r2 => r2.roas)), 0.01);
  $('#scoreBox').innerHTML = groups.map(g => `
    <div style="margin-bottom:14px">
      <div class="lbl" style="margin-bottom:7px">${g.key}</div>
      ${g.rows.map(r2 => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="width:74px;flex:none;font-size:12.5px;color:var(--ink-2)">${r2.v}</span>
          <div class="gauge" style="flex:1"><i data-w="${(r2.roas / maxRoas * 100).toFixed(1)}"
            style="background:${r2.index >= 1.08 ? 'var(--ok)' : r2.index <= 0.92 ? 'var(--bad)' : 'var(--accent)'}"></i></div>
          <span class="num" style="width:56px;text-align:right;font-size:12.5px">${F.roas(r2.roas)}</span>
          <span class="num" style="width:46px;text-align:right;font-size:11.5px;color:var(--ink-3)">${r2.n}개</span>
        </div>`).join('')}
    </div>`).join('');
  setTimeout(() => $$('#scoreBox .gauge i').forEach(i => { i.style.width = i.dataset.w + '%'; }), 60);

  /* 문장 생성 — 계산 결과에서 조립합니다 */
  const lines = [];
  for (const g of groups) {
    if (g.rows.length < 2) continue;
    const top = g.rows[0], bot = g.rows[g.rows.length - 1];
    if (!top.spend || !bot.spend) continue;
    const gap = (top.roas - bot.roas) * 100;
    /* 받침 유무에 따른 주격 조사 */
    const ga = w => {
      const c = w.charCodeAt(w.length - 1);
      return (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? '이' : '가';
    };
    if (gap < 30) {
      const eun = (w => { const c = w.charCodeAt(w.length - 1);
        return (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? '은' : '는'; })(g.key);
      lines.push(`<b>${g.key}</b>${eun} 이 기간 성과 차이가 ${gap.toFixed(0)}%p에 그칩니다 ` +
        `(${top.v} ${F.roas(top.roas)} / ${bot.v} ${F.roas(bot.roas)}). 판단 근거로 쓰기엔 이릅니다.`);
    } else {
      lines.push(`<b>${g.key}</b> — <b style="color:#45e07f">${top.v}</b>(${F.roas(top.roas)}, ${top.n}개)${ga(top.v)} ` +
        `<b style="color:#ff8589">${bot.v}</b>(${F.roas(bot.roas)}, ${bot.n}개)보다 <b>${gap.toFixed(0)}%p</b> 높습니다. ` +
        `광고비 ${F.wonShort(top.spend)}원 / ${F.wonShort(bot.spend)}원 규모에서 비교한 값입니다.`);
    }
  }
  const total = stats.reduce((a, s) => a + s.spend, 0);
  $('#insightBox').innerHTML =
    `<div class="rows">${lines.map((l, i) => `<div class="row"><span class="n">${i + 1}</span><div class="tx"><p style="color:var(--ink-2)">${l}</p></div></div>`).join('')}</div>
     <p style="font-size:12px;color:var(--ink-3);margin-top:10px">
       최근 ${S.bw}일 · 소진 10만원 이상 소재 ${stats.length}개 · 총 ${F.won(total)} 기준으로 계산했습니다.
       표본이 작은 조합은 문장에서 제외합니다.</p>`;

  /* LLM 전송 페이로드 — 화이트리스트만 */
  LAST_PAYLOAD = {
    period: { days: S.bw, as_of: F.dateFull(A.TODAY) },
    note: '집계 결과만 전송합니다. 원본 주문·금액·고객 데이터는 포함하지 않습니다.',
    attribute_scores: groups.map(g => ({
      dimension: g.key,
      rows: g.rows.map(r2 => ({
        value: r2.v, creatives: r2.n,
        roas_index: +r2.index.toFixed(3),      // 전체 평균 대비 지수 (금액 아님)
        ctr_pct: +(r2.ctr * 100).toFixed(2),
        spend_bucket: r2.spend >= 3e6 ? 'L' : r2.spend >= 1e6 ? 'M' : 'S'
      }))
    })),
    excluded_fields: ['광고비 원액', '매출 원액', '주문 단위 데이터', '고객 식별자', '계정 ID', '소재 이미지']
  };
}

function showPayload() {
  const json = JSON.stringify(LAST_PAYLOAD, null, 2)
    .replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="s">"$1"</span>');
  $('#modal').innerHTML = `
    <button class="x" data-close>×</button>
    <h3>LLM 전송 페이로드</h3>
    <p style="color:var(--ink-3);font-size:13px;margin-top:4px">
      "MCP·클로드 등을 최대한 활용" 요청을 그대로 따르면 프롬프트에 사내 매출이 실려 나갑니다.
      판단(무엇이 잘 됐는가)은 서버에서 계산하고, 모델에는 <b>지수화된 결과만</b> 보냅니다.</p>
    <pre class="code" style="margin-top:14px;max-height:340px">${json}</pre>
    <div class="banner" style="margin-top:14px">
      <span class="ic" style="background:rgba(0,201,80,.14);color:var(--ok)">✓</span>
      <div style="flex:1;min-width:200px">
        <b>금액이 한 건도 나가지 않습니다</b>
        <p>ROAS는 전체 평균 대비 지수(roas_index)로, 광고비는 규모 버킷(L/M/S)으로 치환했습니다.
           모델이 잘못 말해도 사내 수치가 유출되지 않습니다.</p>
      </div>
    </div>`;
  $('#mask').classList.add('on');
}

/* ==========================================================================
   9) CSV
   ========================================================================== */
function exportCsv() {
  const r = range();
  const g = A.aggregate(aggOpts(r));
  const head = ['일자', '수집방식', '성숙도', '확정여부', '총광고비',
    ...A.CHANNELS.map(c => c.name + '_광고비'), ...A.CHANNELS.map(c => c.name + '_신고매출'),
    '채널합산매출', '광고기여매출', '전체실매출', '통합ROAS(MER)'];
  const esc = v => {
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [head.join(',')];
  for (let i = r.fromIdx; i <= r.toIdx; i++) {
    const d = A.DAILY[i];
    const m = A.observed(d, i, S.mode, S.rollDays);
    const chSpend = A.CHANNELS.map(c => d.byCh[c.id].spend);
    const chVal = A.CHANNELS.map(c => Math.round(d.byCh[c.id].valFinal * m));
    const spend = chSpend.reduce((a, b) => a + b, 0);
    lines.push([
      d.key, S.mode === 'once' ? '일 1회 수집' : '롤링 재수집 ' + S.rollDays + '일',
      m.toFixed(3), m >= 0.95 ? '확정' : '잠정', spend,
      ...chSpend, ...chVal,
      chVal.reduce((a, b) => a + b, 0), d.adTouchedRevenue, d.realRevenue,
      spend ? (d.realRevenue / spend).toFixed(3) : ''
    ].map(esc).join(','));
  }
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `adsum_성과_${A.dayKey(A.TODAY)}_${S.period}일.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`CSV ${lines.length - 1}행을 내려받았습니다 (UTF-8 BOM · 엑셀 한글 대응)`, 'ok');
}

/* ==========================================================================
   렌더 파이프라인
   ========================================================================== */
function renderAll() {
  const g = renderKPI();
  drawMain(g);
  renderDup(g);
  renderChannels(g);
  renderCreatives();
  renderBW();
  renderInsight();
  observeReveal();
}

/* ==========================================================================
   초기화
   ========================================================================== */
function init() {
  $('#asOf').textContent = F.dateFull(A.TODAY);
  $('#selCh').innerHTML = '<option value="">전체 채널</option>' +
    A.CHANNELS.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  bindSeg('#segPeriod', v => { S.period = +v; renderAll(); });
  bindSeg('#segMode', v => {
    S.mode = v; renderAll();
    toast(v === 'once' ? '일 1회 수집 — 과거 값이 갱신되지 않습니다' : '롤링 재수집 — 최근 ' + S.rollDays + '일을 다시 조회합니다');
  });
  bindSeg('#segBasis', v => {
    S.basis = v; renderKPI(); drawMain(A.aggregate(aggOpts(range()))); observeReveal();
    toast('매출 기준: ' + BASIS_LABEL[v]);
  });
  bindSeg('#segWin', v => { S.win = +v; renderCreatives(); });
  bindSeg('#segStatus', v => { S.status = v; drawCrTable(); });
  bindSeg('#segBW', v => { S.bw = +v; renderBW(); renderInsight(); });

  $('#rMinConv').addEventListener('input', e => {
    S.minConv = +e.target.value; $('#vMinConv').textContent = S.minConv; renderCreatives();
  });
  $('#rMult').addEventListener('input', e => {
    S.mult = +e.target.value / 10; $('#vMult').textContent = S.mult.toFixed(1); renderCreatives();
  });
  $('#selCh').addEventListener('change', e => { S.ch = e.target.value; drawCrTable(); });

  $('#btnNaive').addEventListener('click', e => {
    S.naive = !S.naive;
    e.target.setAttribute('aria-pressed', String(S.naive));
    e.target.textContent = S.naive ? '되돌리기' : '비교 보기';
    e.target.classList.toggle('primary', S.naive);
    drawCrTable();
    toast(S.naive ? '요구사항 그대로 판정 — 전환 0건 소재는 "판정 불가"입니다' : '4단계 판정으로 되돌렸습니다');
  });

  $('#btnCsv').addEventListener('click', exportCsv);
  $('#btnPayload').addEventListener('click', showPayload);

  document.addEventListener('click', e => {
    const img = e.target.closest('[data-img]');
    if (img) { openImage(img.dataset.img); return; }
    if (e.target.closest('[data-close]') || e.target.id === 'mask') $('#mask').classList.remove('on');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#mask').classList.remove('on'); });

  window.addEventListener('scroll', observeReveal, { passive: true });
  let rz;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => drawMain(A.aggregate(aggOpts(range()))), 180);
  });

  renderAll();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

window.__ADSUM_TEST = { S, renderAll, renderCreatives, exportCsv, openImage, showPayload };
})();
