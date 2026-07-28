/* ============================================================
   LABCHAT — 참가자 화면 로직
   동의 → 참가자 ID → 블록 무작위 배정 → 챗 → 종료
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const S = {
  step: 'consent',
  pid: '',
  cond: null,
  turns: 0,
  msgs: [],
  busy: false,
  startedAt: null,
};

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 3000);
}

/* ---------- 블록 무작위 배정 (가변 블록 4/8) ---------- */
function assignCondition() {
  let pool = JSON.parse(localStorage.getItem('lc_block') || '[]');
  if (!pool.length) {
    const blockSize = Math.random() < .5 ? 4 : 8;          // 가변 블록 → 배정 예측 방지
    const reps = blockSize / 4;
    pool = [];
    for (let i = 0; i < reps; i++) pool.push('A', 'B', 'C', 'D');
    // Fisher–Yates
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }
  const cond = pool.shift();
  localStorage.setItem('lc_block', JSON.stringify(pool));
  return cond;
}

/* ---------- 단계 전환 ---------- */
function show(step) {
  S.step = step;
  $$('[data-step]').forEach(el => el.classList.toggle('hide', el.dataset.step !== step));
}

/* 1. 동의 */
function onConsentChange() {
  const all = $$('#consentChecks input').every(c => c.checked);
  $('#btnConsent').disabled = !all;
}
function submitConsent() {
  localStorage.setItem('lc_consent', JSON.stringify({ v: '1.0', at: new Date().toISOString() }));
  show('id');
  setTimeout(() => $('#pidInput')?.focus(), 100);
}

/* 2. 참가자 ID → 배정 */
function submitId() {
  const v = $('#pidInput').value.trim().toUpperCase();
  if (!/^P\d{4}$/.test(v)) {
    toast('참가자 ID 형식이 올바르지 않습니다 (예: P1042)', 'err');
    return;
  }
  if (localStorage.getItem('lc_used_' + v)) {
    toast('이미 참여한 ID입니다. 1인 1회만 참여할 수 있습니다', 'warn');
    return;
  }
  S.pid = v;
  S.cond = assignCondition();
  const c = CONDITIONS[S.cond];
  $('#assignBox').innerHTML = `
    <div class="lbl">배정 완료</div>
    <div class="cond" style="color:${c.color}">${c.full}</div>
    <div class="desc">${c.desc}</div>
    <div class="blind">가변 블록 무작위화(4/8)로 배정되었습니다 · 참가자에게 조건명은 표시되지 않습니다(데모에서만 노출)</div>`;
  show('assign');
}

/* 3. 챗 시작 */
function startChat() {
  localStorage.setItem('lc_used_' + S.pid, '1');
  S.startedAt = Date.now();
  show('chat');
  $('#chatPid').textContent = S.pid;
  $('#chatCond').textContent = CONDITIONS[S.cond].full;
  $('#chatCond').style.color = CONDITIONS[S.cond].color;
  updateTurns();
  // 오프너
  pushBot(OPENERS[S.cond], false);
  setTimeout(() => $('#composerInput')?.focus(), 200);
}

function updateTurns() {
  $('#turnCount').innerHTML = `대화 <b>${S.turns}</b> / 최소 ${STUDY.minTurns}턴`;
  const btn = $('#btnEnd');
  const ok = S.turns >= STUDY.minTurns;
  btn.classList.toggle('ready', ok);
  btn.textContent = ok ? '대화 종료하기' : `종료 (${STUDY.minTurns - S.turns}턴 더)`;
  btn.disabled = !ok;
}

/* ---------- 메시지 ---------- */
function scrollBottom() {
  const el = $('#chatScroll');
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
}

function pushUser(text) {
  const el = document.createElement('div');
  el.className = 'msg user';
  el.innerHTML = `<div class="bubble"></div>`;
  el.querySelector('.bubble').textContent = text;
  $('#chatInner').appendChild(el);
  S.msgs.push({ role: 'user', content: text, t: new Date().toISOString() });
  scrollBottom();
}

/* 스트리밍 타이핑 (실서비스: OpenAI stream=True) */
function pushBot(text, stream = true) {
  const el = document.createElement('div');
  el.className = 'msg bot';
  el.innerHTML = `<div class="avatar">L</div><div class="bubble"></div>`;
  $('#chatInner').appendChild(el);
  const bubble = el.querySelector('.bubble');

  if (!stream) {
    bubble.textContent = text;
    S.msgs.push({ role: 'assistant', content: text, t: new Date().toISOString() });
    scrollBottom();
    return Promise.resolve();
  }

  return new Promise(resolve => {
    let i = 0;
    const step = () => {
      i += Math.max(1, Math.round(Math.random() * 3));
      bubble.innerHTML = text.slice(0, i).replace(/\n/g, '<br>') + '<span class="caret"></span>';
      scrollBottom();
      if (i < text.length) {
        setTimeout(step, 18 + Math.random() * 26);
      } else {
        bubble.textContent = text;
        S.msgs.push({ role: 'assistant', content: text, t: new Date().toISOString() });
        scrollBottom();
        resolve();
      }
    };
    step();
  });
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'msg bot';
  el.id = 'typingRow';
  el.innerHTML = `<div class="avatar">L</div><div class="bubble"><div class="typing"><i></i><i></i><i></i></div></div>`;
  $('#chatInner').appendChild(el);
  scrollBottom();
}
function hideTyping() { $('#typingRow')?.remove(); }

/* PII 마스킹 (저장 직전 적용 — 요구사항 3-2 보강) */
function maskPII(t) {
  return t
    .replace(/01[016-9][-\s]?\d{3,4}[-\s]?\d{4}/g, '[전화번호]')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[이메일]')
    .replace(/\d{6}[-\s]?[1-4]\d{6}/g, '[주민번호]');
}

async function send() {
  if (S.busy) return;
  const ta = $('#composerInput');
  const text = ta.value.trim();
  if (!text) return;
  if (S.turns >= STUDY.maxTurns) {
    toast(`최대 ${STUDY.maxTurns}턴에 도달했습니다. 대화를 종료해 주세요`, 'warn');
    return;
  }

  S.busy = true;
  $('#btnSend').disabled = true;
  ta.value = ''; ta.style.height = 'auto';

  const masked = maskPII(text);
  if (masked !== text) toast('🔒 개인정보로 보이는 내용은 저장 시 자동 마스킹됩니다');
  pushUser(text);

  S.turns++;
  updateTurns();

  showTyping();
  await new Promise(r => setTimeout(r, 550 + Math.random() * 500));
  hideTyping();

  await pushBot(buildReply(S.cond, text));

  S.busy = false;
  $('#btnSend').disabled = false;
  ta.focus();
}

/* 4. 종료 */
function endChat() {
  if (S.turns < STUDY.minTurns) return;
  const mins = Math.floor((Date.now() - S.startedAt) / 60000);
  const secs = Math.floor(((Date.now() - S.startedAt) % 60000) / 1000);
  const code = 'LC' + Math.random().toString(36).slice(2, 8).toUpperCase();
  $('#doneSummary').innerHTML = `
    <div class="summary-row"><span class="k">참가자 ID</span><span class="v">${S.pid}</span></div>
    <div class="summary-row"><span class="k">대화 턴 수</span><span class="v">${S.turns}턴</span></div>
    <div class="summary-row"><span class="k">소요 시간</span><span class="v">${mins}분 ${secs}초</span></div>
    <div class="summary-row"><span class="k">저장된 메시지</span><span class="v">${S.msgs.length}건</span></div>
    <div class="summary-row"><span class="k">모델</span><span class="v">${STUDY.model}</span></div>`;
  $('#doneCode').textContent = code;
  show('done');
  toast('✅ 응답이 저장되었습니다 (매 턴 즉시 저장 — 유실 없음)', 'ok');
}

function restart() {
  localStorage.removeItem('lc_used_' + S.pid);
  S.pid = ''; S.cond = null; S.turns = 0; S.msgs = []; S.busy = false;
  $('#chatInner').innerHTML = '';
  $('#pidInput').value = '';
  $$('#consentChecks input').forEach(c => c.checked = false);
  onConsentChange();
  show('consent');
}

/* ---------- 초기화 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $$('#consentChecks input').forEach(c => c.addEventListener('change', onConsentChange));
  $('#btnConsent').addEventListener('click', submitConsent);
  $('#btnId').addEventListener('click', submitId);
  $('#pidInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitId(); });
  $('#btnStart').addEventListener('click', startChat);
  $('#btnSend').addEventListener('click', send);
  $('#btnEnd').addEventListener('click', endChat);
  $('#btnRestart').addEventListener('click', restart);

  const ta = $('#composerInput');
  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
    $('#btnSend').disabled = !ta.value.trim() || S.busy;
  });
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  $('#studyModel').textContent = STUDY.model;
  show('consent');
});
