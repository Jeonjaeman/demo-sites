/* ============================================================
   SEMINAR56 — 랜딩 + 예약 로직 (데모)
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const won = n => n.toLocaleString('ko-KR') + '원';

const S = {
  group: '수도권',
  step: 1,
  sess: null,
  pay: 'card',
};

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.35s'; setTimeout(() => el.remove(), 350); }, 3400);
}

/* ============================================================
   스크롤 리빌 / 카운트업 / 패럴랙스
   ============================================================ */
function observeReveal() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .1 });
  $$('.rv:not(.in)').forEach(el => io.observe(el));
}

function countUp(el, target, suffix = '', dec = 0) {
  const t0 = performance.now(), dur = 1400;
  const tick = t => {
    const p = Math.min((t - t0) / dur, 1);
    const v = target * (1 - Math.pow(1 - p, 3));
    el.textContent = (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('ko-KR')) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function bindParallax() {
  const bg = $('.hero-bg');
  if (!bg) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < 800) bg.style.transform = `translateY(${y * .22}px) scale(1.06)`;
  }, { passive: true });
}

/* ============================================================
   수익 계산기 (요구사항 2-1)
   ============================================================ */
const CALC = { visitors: 300, price: 15000, repeat: 20 };

function renderCalc(animate = true) {
  const { visitors, price, repeat } = CALC;
  // 개선 가정: 노출↑ 신규 +35%, 재방문율 +12%p, 광고비 -40%
  const nowSales = visitors * price;
  const newVisitors = Math.round(visitors * 1.35);
  const repeatGain = Math.round(newVisitors * (repeat + 12) / 100);
  const afterSales = Math.round(newVisitors * price + repeatGain * price * .4);
  const adSave = Math.round(visitors * 1200 * .4);
  const gain = afterSales - nowSales + adSave;

  $('#cVisitors').textContent = visitors.toLocaleString() + '명';
  $('#cPrice').textContent = price.toLocaleString() + '원';
  $('#cRepeat').textContent = repeat + '%';

  $('#outNow').textContent = won(nowSales);
  $('#outAfter').textContent = won(afterSales);
  $('#outAd').textContent = '+' + won(adSave);
  const amt = $('#outGain');
  const prev = Number(amt.dataset.v || 0);
  amt.dataset.v = gain;
  // 초기 렌더는 즉시 표기 — 탭이 백그라운드면 rAF가 멈춰 0으로 남는 것을 방지
  if (animate) animateNum(amt, prev, gain);
  else amt.textContent = '+' + gain.toLocaleString('ko-KR') + '원';
}

function animateNum(el, from, to) {
  const t0 = performance.now(), dur = 600;
  const tick = t => {
    const p = Math.min((t - t0) / dur, 1);
    const v = from + (to - from) * (1 - Math.pow(1 - p, 3));
    el.textContent = '+' + Math.round(v).toLocaleString('ko-KR') + '원';
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ============================================================
   지역 · 회차
   ============================================================ */
function renderSessions() {
  const list = SESSIONS.filter(s => s.group === S.group);
  $('#sessGrid').innerHTML = list.map(s => {
    const st = sessState(s);
    const left = seatsLeft(s);
    const pct = ((s.booked + s.pending) / s.cap * 100).toFixed(0);
    const badge = { open: ['모집중', 'b-open'], hot: ['마감임박', 'b-hot'], closed: ['마감', 'b-closed'] }[st];
    const color = st === 'closed' ? 'var(--ink-24)' : st === 'hot' ? 'var(--red)' : 'var(--good)';
    return `
      <div class="sess ${st} rv">
        <div class="sess-top">
          <span class="sess-region">${s.region}</span>
          <span class="sess-badge ${badge[1]}">${badge[0]}</span>
        </div>
        <div class="sess-meta">
          <div>📅 ${s.date.slice(5).replace('-', '월 ')}일 · ${s.time}</div>
          <div>📍 ${s.venue}</div>
        </div>
        <div class="seat-bar"><div class="seat-fill" style="background:${color}" data-w="${pct}"></div></div>
        <div class="seat-txt">
          <span class="left ${left <= 8 && left > 0 ? 'few' : ''}">${st === 'closed' ? '정원 마감' : `잔여 ${left}석`}</span>
          <span class="total">정원 ${s.cap}명${s.pending ? ` · 입금대기 ${s.pending}` : ''}</span>
        </div>
        <button class="sess-btn" ${st === 'closed' ? 'disabled' : ''} onclick="openBook('${s.id}')">
          ${st === 'closed' ? '다음 회차 알림 신청' : '신청하기'}
        </button>
      </div>`;
  }).join('');
  setTimeout(() => {
    $$('#sessGrid .seat-fill').forEach(b => b.style.width = b.dataset.w + '%');
    observeReveal();
  }, 60);
}

function setGroup(g) {
  S.group = g;
  $$('.rf').forEach(b => b.classList.toggle('on', b.dataset.g === g));
  renderSessions();
}

/* ============================================================
   예약 모달 (4단계)
   ============================================================ */
function openBook(id) {
  S.sess = SESSIONS.find(s => s.id === id);
  S.step = 1; S.pay = 'card';
  $('#bookModal').classList.add('show');
  renderStep();
}
function closeBook() { $('#bookModal').classList.remove('show'); }

function renderStep() {
  const s = S.sess;
  $$('.step').forEach((el, i) => el.classList.toggle('on', i < S.step));
  const titles = ['신청 정보 입력', '결제 수단 선택', '신청 완료'];
  $('#mTitle').textContent = titles[S.step - 1];
  $('#mSub').textContent = `${s.region} · ${s.date.slice(5).replace('-', '월 ')}일 ${s.time}`;

  const body = $('#mBody');
  if (S.step === 1) {
    body.innerHTML = `
      <div class="summary">
        <div class="row"><span class="k">지역·회차</span><span class="v">${s.region} ${s.round}회차</span></div>
        <div class="row"><span class="k">일시</span><span class="v">${s.date} ${s.time}</span></div>
        <div class="row"><span class="k">장소</span><span class="v">${s.venue}</span></div>
        <div class="row"><span class="k">잔여 좌석</span><span class="v" style="color:var(--red);font-weight:700">${seatsLeft(s)}석</span></div>
      </div>
      <div class="fld"><label>성함 <span class="req">*</span></label><input type="text" id="bName" placeholder="홍길동"></div>
      <div class="fld"><label>연락처 <span class="req">*</span></label>
        <input type="tel" id="bPhone" placeholder="010-0000-0000">
        <p class="hint">예약 확정과 리마인드 알림톡이 이 번호로 발송됩니다</p></div>
      <div class="fld"><label>업종 <span class="req">*</span></label>
        <select id="bBiz">
          <option value="">선택해 주세요</option>
          ${['음식점·카페','미용·뷰티','헬스·필라테스','학원·교육','병원·의원','소매·판매','서비스업','기타'].map(v=>`<option>${v}</option>`).join('')}
        </select></div>
      <label style="display:flex;gap:9px;align-items:flex-start;font-size:12.5px;color:var(--ink-64);line-height:1.65;cursor:pointer;margin-bottom:18px">
        <input type="checkbox" id="bAgree" style="margin-top:2px;accent-color:var(--red);width:16px;height:16px;flex-shrink:0">
        <span>개인정보 수집·이용 및 <b style="color:var(--ink)">알림톡 수신</b>에 동의합니다. 세미나 운영 목적으로만 사용되며 종료 후 3개월 뒤 파기됩니다.</span>
      </label>
      <button class="btn-full btn-red" onclick="toStep2()">다음</button>`;
  }
  else if (S.step === 2) {
    body.innerHTML = `
      <div class="pay-opts" style="margin-bottom:18px">
        <label class="pay ${S.pay === 'card' ? 'on' : ''}" onclick="setPay('card')">
          <input type="radio" name="pay" ${S.pay === 'card' ? 'checked' : ''}>
          <div><b>💳 신용카드</b><p>결제 즉시 좌석이 확정되고 알림톡이 발송됩니다</p></div>
        </label>
        <label class="pay ${S.pay === 'va' ? 'on' : ''}" onclick="setPay('va')">
          <input type="radio" name="pay" ${S.pay === 'va' ? 'checked' : ''}>
          <div><b>🏦 가상계좌</b><p>계좌 발급 후 <b>${BRAND.holdHours}시간 이내</b> 입금해야 좌석이 확정됩니다</p></div>
        </label>
      </div>
      ${S.pay === 'va' ? `
        <div class="notice-box">
          ⏳ <b>좌석 임시 확보 안내</b><br>
          계좌 발급 시점부터 <b>${BRAND.holdHours}시간 동안</b> 좌석이 임시로 확보됩니다.
          기한 내 입금하지 않으시면 <b>자동으로 취소</b>되고 대기 신청자에게 자리가 넘어갑니다.
          <span style="display:block;margin-top:7px;opacity:.8">※ 이 홀딩 로직이 없으면 미입금자가 정원을 막거나, 반대로 60명 초과 입금이 발생합니다 — 검토 항목 참조</span>
        </div>` : ''}
      <div class="summary">
        <div class="row"><span class="k">세미나 참가비</span><span class="v">${won(BRAND.price)}</span></div>
        <div class="row"><span class="k">교재비</span><span class="v">포함</span></div>
        <div class="row total"><span class="k">결제 금액</span><span class="v">${won(BRAND.price)}</span></div>
      </div>
      <div class="notice-box blue" style="font-size:11.5px">
        <b>환불 규정</b> · 세미나 7일 전까지 100% · 3일 전까지 50% · 당일·미참석 환불 불가 (다른 지역 회차 1회 변경은 무료)
      </div>
      <div style="display:flex;gap:9px">
        <button class="btn-full btn-line" style="flex:1" onclick="S.step=1;renderStep()">이전</button>
        <button class="btn-full btn-red" style="flex:1.6" onclick="toStep3()">${S.pay === 'card' ? '결제하기' : '가상계좌 발급'}</button>
      </div>`;
  }
  else {
    const isVa = S.pay === 'va';
    const deadline = new Date(Date.now() + BRAND.holdHours * 3600e3);
    const dl = `${deadline.getMonth() + 1}월 ${deadline.getDate()}일 ${String(deadline.getHours()).padStart(2, '0')}:${String(deadline.getMinutes()).padStart(2, '0')}`;
    body.innerHTML = `
      <div class="done-ico">${isVa ? '⏳' : '✓'}</div>
      <h3 style="text-align:center;font-size:19px;font-weight:800;letter-spacing:-.5px">
        ${isVa ? '가상계좌가 발급되었습니다' : '신청이 완료되었습니다'}</h3>
      <p style="text-align:center;font-size:13.5px;color:var(--ink-64);margin-top:7px;line-height:1.7">
        ${isVa ? `<b style="color:var(--red)">${dl}</b>까지 입금해 주세요<br>그때까지 좌석이 확보되어 있습니다`
                : '예약 확정 알림톡을 발송했습니다'}</p>

      <div class="summary" style="margin-top:20px">
        <div class="row"><span class="k">지역·회차</span><span class="v">${S.sess.region} ${S.sess.round}회차</span></div>
        <div class="row"><span class="k">일시</span><span class="v">${S.sess.date} ${S.sess.time}</span></div>
        ${isVa ? `
          <div class="row"><span class="k">입금 계좌</span><span class="v mono">국민 1234-56-789012</span></div>
          <div class="row"><span class="k">입금 기한</span><span class="v" style="color:var(--red);font-weight:700">${dl}</span></div>` : ''}
        <div class="row total"><span class="k">${isVa ? '입금 금액' : '결제 금액'}</span><span class="v">${won(BRAND.price)}</span></div>
      </div>

      <div style="font-size:12px;font-weight:800;color:var(--ink-40);margin:20px 0 8px;letter-spacing:.04em">
        발송된 알림톡 (요구사항 2-3)</div>
      <div class="alim-preview">
        <div class="alim-card">
          <div class="alim-hd">💬 알림톡 도착</div>
          <div class="alim-bd">${isVa
            ? `${$('#bName')?.value || '홍길동'}님, 입금 계좌가 발급되었습니다.\n\n▪ 은행: 국민은행\n▪ 계좌: 1234-56-789012\n▪ 금액: ${won(BRAND.price)}\n▪ 입금기한: ${dl}\n\n기한 내 미입금 시 예약이 자동 취소됩니다.`
            : `${$('#bName')?.value || '홍길동'}님, 세미나 예약이 확정되었습니다.\n\n▪ 일시: ${S.sess.date} ${S.sess.time}\n▪ 장소: ${S.sess.venue}\n▪ 좌석: 자유석\n\n입장 시 성함을 말씀해 주세요.`}</div>
          <div class="alim-ft">세미나56 · 정보성 메시지</div>
        </div>
      </div>
      <p style="font-size:11px;color:var(--ink-40);margin-top:10px;line-height:1.7;text-align:center">
        광고성 문구가 들어가면 알림톡 심사에서 반려되므로, 할인·프로모션 안내는 별도 채널로 분리합니다
      </p>

      <button class="btn-full btn-line" style="margin-top:18px" onclick="closeBook()">확인</button>`;

    // 좌석 반영
    if (isVa) S.sess.pending++; else S.sess.booked++;
    renderSessions();
  }
}

function setPay(p) { S.pay = p; renderStep(); }

function toStep2() {
  const name = $('#bName').value.trim();
  const phone = $('#bPhone').value.trim();
  const biz = $('#bBiz').value;
  const agree = $('#bAgree').checked;
  if (!name) return toast('성함을 입력해 주세요', 'err');
  if (!/^01[016-9][-\s]?\d{3,4}[-\s]?\d{4}$/.test(phone.replace(/\s/g, ''))) return toast('연락처 형식을 확인해 주세요 (예: 010-1234-5678)', 'err');
  if (!biz) return toast('업종을 선택해 주세요', 'err');
  if (!agree) return toast('개인정보 수집·알림톡 수신 동의가 필요합니다', 'err');
  S.form = { name, phone, biz };
  S.step = 2; renderStep();
}

function toStep3() {
  const s = S.sess;
  if (seatsLeft(s) <= 0) { toast('죄송합니다. 방금 정원이 마감되었습니다', 'err'); closeBook(); renderSessions(); return; }
  S.step = 3;
  renderStep();
  toast(S.pay === 'va'
    ? `⏳ 좌석이 <b>${BRAND.holdHours}시간</b> 임시 확보되었습니다`
    : '✅ 결제가 완료되어 좌석이 확정되었습니다', 'ok');
}

/* ============================================================
   FAQ
   ============================================================ */
function renderFaq() {
  $('#faqList').innerHTML = FAQS.map((f, i) => `
    <div class="faq-item rv">
      <button class="faq-q" onclick="toggleFaq(${i})">
        <span class="qm">Q</span><span>${f.q}</span><span class="arw">⌄</span>
      </button>
      <div class="faq-a"><div>${f.a}</div></div>
    </div>`).join('');
}
function toggleFaq(i) {
  const item = $$('.faq-item')[i];
  const a = $('.faq-a', item);
  const open = item.classList.toggle('open');
  a.style.maxHeight = open ? a.scrollHeight + 'px' : '0';
}

/* ============================================================
   초기화
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // 지역 그룹 필터
  $('#regionFilter').innerHTML = Object.keys(REGION_GROUPS).map(g => `
    <button class="rf ${g === S.group ? 'on' : ''}" data-g="${g}" onclick="setGroup('${g}')">
      ${g} <span style="opacity:.55;font-weight:600">${REGION_GROUPS[g].length}</span>
    </button>`).join('');

  // 커리큘럼
  $('#curriList').innerHTML = CURRICULUM.map((c, i) => `
    <div class="cur-item rv rv-${Math.min(i, 4)}">
      <div class="cur-no">${String(i + 1).padStart(2, '0')}</div>
      <div class="cur-b"><h3>${c.t}</h3><p>${c.d}</p></div>
      <span class="cur-time">${c.time}</span>
    </div>`).join('');

  // 후기
  $('#revList').innerHTML = REVIEWS.map((r, i) => `
    <div class="rev rv rv-${i}">
      <div class="stars">★★★★★</div>
      <p>"${r.txt}"</p>
      <div class="who"><span class="av" style="background:${r.c}">${r.av}</span>
        <span><b>${r.who}</b><span>${r.biz}</span></span></div>
    </div>`).join('');

  renderSessions();
  renderFaq();
  renderCalc(false);
  observeReveal();
  bindParallax();

  // 계산기 슬라이더
  ['visitors', 'price', 'repeat'].forEach(k => {
    const el = $('#r' + k[0].toUpperCase() + k.slice(1));
    if (el) el.addEventListener('input', e => { CALC[k] = Number(e.target.value); renderCalc(); });
  });

  // 히어로 통계 카운트업
  const hs = $('.hero-stats');
  if (hs) new IntersectionObserver((es, io) => {
    if (es[0].isIntersecting) {
      countUp($('#stRegion'), BRAND.regions, '개');
      countUp($('#stGrad'), 2847, '명');
      countUp($('#stSat'), 4.8, '점', 1);
      countUp($('#stRe'), 31, '%');
      io.disconnect();
    }
  }, { threshold: .4 }).observe(hs);

  // 모달 바깥 클릭
  $('#bookModal').addEventListener('click', e => { if (e.target.id === 'bookModal') closeBook(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBook(); });
});
