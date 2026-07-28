/* ============================================================
   CLASSPULSE — 교사 응답 화면
   인증 → 응답자 속성 → 리커트 문항 → 주관식 → 완료
   문항 이동 시마다 자동 저장 (중도 이탈 회수)
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const ST = {
  step: 'auth',
  qi: 0,
  profile: {},
  answers: {},
  free: '',
  token: '',
};

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 3000);
}

function save() {
  localStorage.setItem('cp_draft', JSON.stringify({
    token: ST.token, profile: ST.profile, answers: ST.answers, free: ST.free, qi: ST.qi,
  }));
  const tag = $('#savedTag');
  if (tag) {
    tag.innerHTML = '<span class="dot-live"></span>저장됨';
    tag.style.opacity = '1';
    setTimeout(() => { tag.style.opacity = '.55'; }, 1200);
  }
}

function show(step) {
  ST.step = step;
  $$('[data-step]').forEach(el => el.classList.toggle('hide', el.dataset.step !== step));
  updateProgress();
}

function updateProgress() {
  const total = QUESTIONS.length + 3;   // 인증 + 속성 + 문항 + 주관식
  let done = 0;
  if (ST.step === 'profile') done = 1;
  else if (ST.step === 'q') done = 2 + ST.qi;
  else if (ST.step === 'free') done = 2 + QUESTIONS.length;
  else if (ST.step === 'done') done = total;
  $('#progressBar').style.width = (done / total * 100) + '%';
  const pill = $('#stepPill');
  if (pill) {
    pill.textContent = ST.step === 'q' ? `문항 ${ST.qi + 1} / ${QUESTIONS.length}`
      : ST.step === 'free' ? '주관식'
      : ST.step === 'profile' ? '응답자 정보'
      : ST.step === 'done' ? '완료' : '참여 확인';
  }
}

/* ---------- 1. 인증 ---------- */
function submitAuth() {
  const code = $('#schoolCode').value.trim().toUpperCase();
  const tk = $('#tokenInput').value.trim().toUpperCase();
  if (!/^[A-Z]\d{4}$/.test(code)) return toast('학교 코드 형식이 올바르지 않습니다 (예: S1204)', 'err');
  if (tk.length < 6) return toast('참여 토큰 6자리를 입력해 주세요', 'err');
  if (localStorage.getItem('cp_used_' + tk)) return toast('이미 사용된 토큰입니다. 1인 1회만 응답할 수 있습니다', 'warn');
  ST.token = tk;
  ST.profile.school = code;
  save();
  show('profile');
}

/* ---------- 2. 응답자 속성 ---------- */
function submitProfile() {
  const p = {
    region: $('#pRegion').value, level: $('#pLevel').value,
    role: $('#pRole').value, career: $('#pCareer').value, gender: $('#pGender').value,
  };
  if (Object.values(p).some(v => !v)) return toast('모든 항목을 선택해 주세요', 'err');
  Object.assign(ST.profile, p);
  save();
  // 교장/교감이면 익명성 안내
  if (p.role === '교감' || p.role === '교장') {
    toast(`ℹ️ ${p.role}은 학교당 1명이므로, 결과 공개 시 <b>학교 단위로는 집계되지 않습니다</b> (익명 보호)`);
  }
  ST.qi = 0;
  show('q');
  renderQ();
}

/* ---------- 3. 리커트 문항 ---------- */
function renderQ() {
  const q = QUESTIONS[ST.qi];
  $('#qNum').textContent = `문항 ${ST.qi + 1} / ${QUESTIONS.length} · ${q.dim}`;
  $('#qText').textContent = q.text;
  $('#likert').innerHTML = LIKERT.map(o => `
    <button class="lk-opt ${ST.answers[q.code] === o.v ? 'on' : ''}" data-v="${o.v}" onclick="pickAns(${o.v})">
      <span class="lk-key">${o.v}</span>
      <span class="lk-label">${o.label}</span>
    </button>`).join('');
  $('#btnPrev').disabled = ST.qi === 0;
  $('#btnNext').disabled = !ST.answers[q.code];
  $('#btnNext').textContent = ST.qi === QUESTIONS.length - 1 ? '주관식으로' : '다음';
  updateProgress();
}

function pickAns(v) {
  const q = QUESTIONS[ST.qi];
  ST.answers[q.code] = v;
  $$('#likert .lk-opt').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === v));
  $('#btnNext').disabled = false;
  save();
}

function nextQ() {
  if (!ST.answers[QUESTIONS[ST.qi].code]) return;
  if (ST.qi < QUESTIONS.length - 1) { ST.qi++; renderQ(); }
  else { show('free'); }
}
function prevQ() {
  if (ST.qi > 0) { ST.qi--; renderQ(); }
}

/* 키보드 1~5 선택 */
document.addEventListener('keydown', e => {
  if (ST.step !== 'q') return;
  if (/^[1-5]$/.test(e.key)) { pickAns(Number(e.key)); }
  if (e.key === 'Enter' && ST.answers[QUESTIONS[ST.qi].code]) nextQ();
});

/* ---------- 4. 주관식 ---------- */
function submitFree() {
  ST.free = $('#freeText').value.trim();
  save();
  localStorage.setItem('cp_used_' + ST.token, '1');
  localStorage.removeItem('cp_draft');

  const answered = Object.keys(ST.answers).length;
  const avg = (Object.values(ST.answers).reduce((a, b) => a + b, 0) / answered).toFixed(2);
  $('#doneSummary').innerHTML = `
    <div class="sum-row"><span class="k">응답 문항</span><span class="v mono">${answered} / ${QUESTIONS.length}</span></div>
    <div class="sum-row"><span class="k">주관식</span><span class="v mono">${ST.free ? ST.free.length + '자' : '미작성'}</span></div>
    <div class="sum-row"><span class="k">내 응답 평균</span><span class="v mono">${avg} / 5.00</span></div>
    <div class="sum-row"><span class="k">참여 토큰</span><span class="v mono">${ST.token}</span></div>`;
  show('done');
  toast('✅ 응답이 제출되었습니다. 참여해 주셔서 감사합니다', 'ok');
}

function restart() {
  localStorage.removeItem('cp_used_' + ST.token);
  localStorage.removeItem('cp_draft');
  ST.qi = 0; ST.profile = {}; ST.answers = {}; ST.free = ''; ST.token = '';
  $('#schoolCode').value = 'S1204';
  $('#tokenInput').value = '';
  $('#freeText').value = '';
  $('#charCount').textContent = '0 / 500자';
  show('auth');
}

/* ---------- 이어하기 ---------- */
function tryResume() {
  const d = JSON.parse(localStorage.getItem('cp_draft') || 'null');
  if (!d || !d.token) return false;
  ST.token = d.token; ST.profile = d.profile || {}; ST.answers = d.answers || {};
  ST.free = d.free || ''; ST.qi = d.qi || 0;
  const n = Object.keys(ST.answers).length;
  toast(`🔄 이전 응답을 불러왔습니다 (${n}문항 완료) — 이어서 진행합니다`);
  if (ST.profile.region) { show('q'); renderQ(); }
  else show('profile');
  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  // 셀렉트 채우기
  const fill = (id, arr) => { $(id).innerHTML = '<option value="">선택</option>' + arr.map(v => `<option>${v}</option>`).join(''); };
  fill('#pRegion', REGIONS); fill('#pLevel', LEVELS);
  fill('#pRole', ROLES); fill('#pCareer', CAREERS); fill('#pGender', GENDERS);

  $('#btnAuth').addEventListener('click', submitAuth);
  $('#btnProfile').addEventListener('click', submitProfile);
  $('#btnNext').addEventListener('click', nextQ);
  $('#btnPrev').addEventListener('click', prevQ);
  $('#btnFree').addEventListener('click', submitFree);
  $('#btnRestart').addEventListener('click', restart);

  const ft = $('#freeText');
  ft.addEventListener('input', () => {
    $('#charCount').textContent = `${ft.value.length} / 500자`;
    ST.free = ft.value;
  });

  $('#svTitle').textContent = SURVEY.title;
  $('#svRound').textContent = SURVEY.round;

  if (!tryResume()) show('auth');
});
