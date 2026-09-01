/* GYEOL 결 — 고객 iPad 앱 로직
   화면 전환 800ms(--e-inout) · 유휴 세션 소거(A-2) · 민감정보 분리 동의(B-3)
   유치기관 등록 게이트(B-2) · 오프라인 큐(C-2) · CJK 폰트 지연 로드(C-1) */
'use strict';

const D = Store.load();
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ── 상태 ─────────────────────────────────── */
const S = {
  lang: 'ko',
  screen: 's-attract',
  step: 0,                    // 진행률 (consent 1 ~ q3 5)
  consent: { p1: false, p2: false, p3: false },
  info: { name: '', birth: '', phone: '', gender: 'F', guardian: { name: '', rel: '', phone: '' } },
  concerns: [], interests: [], dt: null,
  picks: [],                  // 관심 담기
  submitted: false,
  detailFrom: 's-menu',
  menuCat: 'all',
  simOffline: false, demoFast: false,
  lastReset: 0,
};

const T = k => t(k, S.lang);
const P = obj => pick(obj, S.lang);

/* ── 토스트 ───────────────────────────────── */
let toastTimer = null;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ── 화면 전환 ────────────────────────────── */
function nav(id) {
  if (id === S.screen) { renderScreen(id); return; }
  const prev = $('#' + S.screen), next = $('#' + id);
  renderScreen(id);
  if (prev) { prev.classList.add('leaving'); prev.classList.remove('active'); setTimeout(() => prev.classList.remove('leaving'), 820); }
  next.classList.add('active');
  S.screen = id;
  $('#hd').classList.toggle('hidden', id === 's-attract' || id === 's-lang');
  resetIdle();
}
function renderScreen(id) {
  ({ 's-attract': rAttract, 's-lang': rLang, 's-consent': rConsent, 's-info': rInfo,
     's-q1': rQ1, 's-q2': rQ2, 's-q3': rQ3, 's-rec': rRec, 's-menu': rMenu,
     's-notice': rNotice, 's-finish': rFinish }[id] || (() => {}))();
}

/* ── 언어 ─────────────────────────────────── */
function setLang(code) {
  S.lang = code;
  document.documentElement.setAttribute('lang', code);
  document.documentElement.dataset.lang = code;
  $('#hd-lang').textContent = I18N[code]._name;
  $('#hd-reset').textContent = T('nextGuest');
  $('#net-label').textContent = netLabel();
  loadCJKFont(code);
  renderScreen(S.screen);
}

/* CJK 폰트 지연 로드 (C-1) — 언어 선택 시에만 해당 서브셋 요청, 전송량 실측 기록 */
const fontLoaded = { ja: false, zh: false };
function loadCJKFont(code) {
  if (!(code in fontLoaded) || fontLoaded[code]) return;
  fontLoaded[code] = true;
  const fam = code === 'ja' ? 'Noto+Sans+JP:wght@400;500;600' : 'Noto+Sans+SC:wght@400;500;600';
  const t0 = performance.now();
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=' + fam + '&display=swap';
  link.onload = () => {
    document.fonts.ready.then(() => {
      const ms = Math.round(performance.now() - t0);
      let kb = 0;
      performance.getEntriesByType('resource').forEach(r => {
        if (r.name.includes('fonts.gstatic.com') && r.startTime >= t0 - 50) kb += (r.transferSize || 0);
      });
      try {
        const perf = JSON.parse(localStorage.getItem('gyeol77-fontperf') || '{}');
        perf[code] = { kb: Math.round(kb / 1024), ms, at: new Date().toISOString() };
        localStorage.setItem('gyeol77-fontperf', JSON.stringify(perf));
      } catch (e) {}
    });
  };
  document.head.appendChild(link);
}

/* ── 온라인 / 오프라인 (C-2) ───────────────── */
function isOnline() { return navigator.onLine && !S.simOffline; }
function queue() { try { return JSON.parse(localStorage.getItem('gyeol77-queue') || '[]'); } catch (e) { return []; } }
function setQueue(q) { try { localStorage.setItem('gyeol77-queue', JSON.stringify(q)); } catch (e) {} }
function netLabel() {
  const q = queue().length;
  if (!isOnline()) return T('offline') + (q ? ' · ' + q + T('queued') : '');
  return T('online');
}
function refreshNet() {
  const chip = $('#net-chip');
  chip.classList.toggle('off', !isOnline());
  $('#net-label').textContent = netLabel();
}
function flushQueue() {
  if (!isOnline()) return;
  const q = queue();
  if (!q.length) return;
  q.forEach(rec => D.submissions.push(rec));
  Store.save(); setQueue([]);
  toast(T('sent') + ' · ' + q.length);
  refreshNet();
}
window.addEventListener('online', () => { refreshNet(); flushQueue(); });
window.addEventListener('offline', refreshNet);

/* ── 제출 ─────────────────────────────────── */
function submitSurvey(partial) {
  if (S.submitted) return;
  if (!S.consent.p1 || !S.consent.p2) return;      // 동의 없이 저장 불가 (B-3)
  const rec = {
    id: 's' + Date.now(), at: new Date().toISOString().slice(0, 19), lang: S.lang,
    name: S.info.name, birth: S.info.birth, phone: S.info.phone, gender: S.info.gender,
    concerns: S.concerns.slice(), interests: S.interests.slice(), dt: S.dt,
    status: partial ? 'partial' : 'done',
    progress: partial ? Math.round(S.step / 5 * 100) : 100,
    consentV: D.settings.consentVersion,
    consentHash: fnv(T('consentP1Body') + T('consentP2Body')),
    marketing: S.consent.p3, minor: isMinor(),
    guardian: isMinor() ? { ...S.info.guardian } : null,
  };
  if (isOnline()) { D.submissions.push(rec); Store.save(); }
  else { const q = queue(); q.push(rec); setQueue(q); }
  if (!partial) S.submitted = true;
  refreshNet();
}

/* ── 세션 소거 (A-2) ──────────────────────── */
function wipeSession(byTimeout) {
  if (!S.submitted && S.consent.p1 && S.consent.p2 && S.step >= 2 && S.info.name) submitSurvey(true); // C-7 미완료 보존
  Object.assign(S, {
    step: 0, consent: { p1: false, p2: false, p3: false },
    info: { name: '', birth: '', phone: '', gender: 'F', guardian: { name: '', rel: '', phone: '' } },
    concerns: [], interests: [], dt: null, picks: [], submitted: false, menuCat: 'all',
    lastReset: Date.now(),
  });
  try { sessionStorage.clear(); } catch (e) {}
  setLang('ko');
  nav('s-attract');
  const note = $('#reset-note');
  note.textContent = T('resetDone');
  note.classList.add('show');
  setTimeout(() => note.classList.remove('show'), 6000);
}

/* ── 유휴 타이머 (A-2) ────────────────────── */
let idleTimer = null, cntTimer = null;
function timeoutSec() { return S.demoFast ? 8 : (D.settings.kioskTimeoutSec || 60); }
function resetIdle() {
  clearTimeout(idleTimer);
  if (S.screen === 's-attract') return;
  idleTimer = setTimeout(showIdleWarn, timeoutSec() * 1000);
}
function showIdleWarn() {
  let n = D.settings.kioskWarnSec || 10;
  $('#idle-title').textContent = T('idleTitle');
  $('#idle-body').textContent = T('idleBody');
  $('#idle-stay').textContent = T('idleStay');
  $('#idle-cnt').textContent = n;
  $('#idle-ov').classList.add('show');
  clearInterval(cntTimer);
  cntTimer = setInterval(() => {
    n -= 1; $('#idle-cnt').textContent = n;
    if (n <= 0) { clearInterval(cntTimer); $('#idle-ov').classList.remove('show'); wipeSession(true); }
  }, 1000);
}
['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => {
  if (!$('#idle-ov').classList.contains('show')) resetIdle();
}, { passive: true }));
$('#idle-stay').addEventListener('click', () => { clearInterval(cntTimer); $('#idle-ov').classList.remove('show'); resetIdle(); });

/* ── 나이 판단 (B-4) ──────────────────────── */
function isMinor() { return !!S.info.birth && ageOf(S.info.birth) < 14; }

/* ── 진행률 바 ────────────────────────────── */
function progressHTML(step) {
  return '<div class="progress">' + [1, 2, 3, 4, 5].map(i => `<i class="${i <= step ? 'on' : ''}"></i>`).join('') + '</div>';
}

/* ═══ 화면 렌더 ═══════════════════════════ */

/* S0 어트랙트 */
function rAttract() {
  const mark = $('#attract-mark');
  if (!mark.dataset.split) {
    mark.dataset.split = '1';
    mark.innerHTML = [...'GYEOL'].map((c, i) => `<span class="char" style="transition-delay:${.1 + i * .07}s">${c}</span>`).join('');
  }
  $('#attract-line').textContent = '결 — ' + T('attractLine');
  $('#attract-cta').textContent = 'TOUCH TO BEGIN';
}

/* S1 언어 선택 (B-2 게이트) */
function rLang() {
  const reg = (D.settings.fetchRegNo || '').trim();
  $('#lang-inner').innerHTML = `
    <div class="lang-mark rv" data-rv="1">GYEOL</div>
    <div class="lang-mark-ko rv" data-rv="2">결</div>
    <div class="lang-title rv" data-rv="3">${esc(T('langTitle'))} · Please select your language</div>
    <div class="lang-grid rv" data-rv="4">
      ${LANGS.map(l => {
        const locked = (l.code === 'ja' || l.code === 'zh') && !reg;
        return `<button class="lang-card ${locked ? 'locked' : ''}" data-lang="${l.code}" ${locked ? 'data-locked="1"' : ''}>
          <b>${l.endonym}</b><span>${esc(l.hint)}</span></button>`;
      }).join('')}
    </div>
    ${!reg ? `<div class="lang-lock-note rv" data-rv="5">${esc(t('langLocked', 'ko'))}</div>` : ''}`;
  $$('#lang-inner .lang-card').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.locked) { toast(t('langLocked', 'ko')); return; }
    setLang(b.dataset.lang);
    S.step = 1; nav('s-consent');
  }));
}

/* S2 동의 (B-3 · B-8) */
function rConsent() {
  const ver = D.settings.consentVersion;
  const hash = fnv(T('consentP1Body') + T('consentP2Body'));
  $('#consent-wrap').innerHTML = `
    <div class="step-head">
      <span class="eyebrow rv" data-rv="1">Privacy</span>
      <h2 class="h-sect rv" data-rv="2">${esc(T('consentTitle'))}</h2>
      <p class="lead rv" data-rv="3">${esc(T('consentLead'))}</p>
    </div>
    <div class="step-body consent-list rv" data-rv="4">
      ${[['p1', 'consentP1', 'consentP1Body', ''], ['p2', 'consentP2', 'consentP2Body', 'sensitive'], ['p3', 'consentP3', 'consentP3Body', '']]
        .map(([k, tt, bb, cls]) => `
        <div class="consent-card ${cls} ${S.consent[k] ? 'checked' : ''}" data-k="${k}">
          <div class="consent-top">
            <span class="cbox"><svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1 5.5L5 9.5L13 1.5" stroke="#f4f3ec" stroke-width="2"/></svg></span>
            <span class="consent-title">${esc(T(tt))}</span>
          </div>
          <div class="consent-body">${T(bb).replace(/·/g, '<br>·').replace(/^<br>/, '')}</div>
        </div>`).join('')}
      <div class="consent-ver">${esc(T('consentVersion'))} <code>${ver}</code> <code>hash ${hash}</code> · 2026-08-25</div>
    </div>
    <div class="step-foot">
      ${progressHTML(1)}
      <button class="btn" id="consent-go" ${S.consent.p1 && S.consent.p2 ? '' : 'disabled'}>${esc(T('agree'))}</button>
    </div>`;
  $$('#consent-wrap .consent-card').forEach(card => card.addEventListener('click', () => {
    const k = card.dataset.k;
    S.consent[k] = !S.consent[k];
    card.classList.toggle('checked', S.consent[k]);
    $('#consent-go').disabled = !(S.consent.p1 && S.consent.p2);
  }));
  $('#consent-go').addEventListener('click', () => { S.step = 2; nav('s-info'); });
}

/* S3 고객 정보 (B-4) */
const SAMPLES = {
  adult: { ko: ['김서연', '1992-03-14'], en: ['Emma Collins', '1990-01-30'], ja: ['佐藤 結衣', '1997-11-02'], zh: ['陈 薇', '1985-06-21'] },
  minor: { ko: ['이도윤', '2013-05-20'], en: ['Mia Park', '2013-05-20'], ja: ['山田 陽菜', '2013-05-20'], zh: ['李 小雨', '2013-05-20'] },
};
function rInfo() {
  if (!S.info.name) {  // 기본 프리필 — 타이핑 없이 진행 가능 (★)
    const s = SAMPLES.adult[S.lang];
    S.info.name = s[0]; S.info.birth = s[1]; S.info.phone = S.lang === 'ko' ? '010-2847-5910' : '+00-000-0000-000';
  }
  $('#info-wrap').innerHTML = `
    <div class="step-head">
      <span class="eyebrow rv" data-rv="1">Guest</span>
      <h2 class="h-sect rv" data-rv="2">${esc(T('infoTitle'))}</h2>
      <p class="lead rv" data-rv="3">${esc(T('infoLead'))}</p>
    </div>
    <div class="step-body scroll">
      <div class="info-grid rv" data-rv="4">
        <div class="field"><label>${esc(T('fName'))}</label><input id="f-name" value="${esc(S.info.name)}"></div>
        <div class="field"><label>${esc(T('fBirth'))}</label><input id="f-birth" type="date" value="${esc(S.info.birth)}"></div>
        <div class="field"><label>${esc(T('fPhone'))}</label><input id="f-phone" value="${esc(S.info.phone)}"></div>
        <div class="field"><label>${esc(T('fGender'))}</label>
          <div class="seg" id="f-gender">
            <button data-v="F" class="${S.info.gender === 'F' ? 'on' : ''}">${esc(T('gF'))}</button>
            <button data-v="M" class="${S.info.gender === 'M' ? 'on' : ''}">${esc(T('gM'))}</button>
            <button data-v="N" class="${S.info.gender === 'N' ? 'on' : ''}">${esc(T('gN'))}</button>
          </div></div>
      </div>
      <div class="preset-row rv" data-rv="5">
        <button class="preset" id="pre-adult">${esc(T('presetAdult'))}</button>
        <button class="preset" id="pre-minor">${esc(T('presetMinor'))}</button>
      </div>
      <div class="minor-box ${isMinor() ? 'show' : ''}" id="minor-box">
        <h4>${esc(T('minorTitle'))}</h4>
        <p class="easy">${esc(T('minorLead'))}<br>${esc(T('minorEasy'))}</p>
        <div class="minor-grid">
          <div class="field"><label>${esc(T('gName'))}</label><input id="g-name" value="${esc(S.info.guardian.name)}"></div>
          <div class="field"><label>${esc(T('gRel'))}</label><input id="g-rel" value="${esc(S.info.guardian.rel)}"></div>
          <div class="field"><label>${esc(T('gPhone'))}</label><input id="g-phone" value="${esc(S.info.guardian.phone)}"></div>
        </div>
      </div>
    </div>
    <div class="step-foot">
      ${progressHTML(2)}
      <div style="display:flex;gap:10px;">
        <button class="btn ghost" id="info-back">${esc(T('back'))}</button>
        <button class="btn" id="info-go">${esc(T('next'))}</button>
      </div>
    </div>`;
  const sync = () => {
    S.info.name = $('#f-name').value.trim();
    S.info.birth = $('#f-birth').value;
    S.info.phone = $('#f-phone').value.trim();
    $('#minor-box').classList.toggle('show', isMinor());
  };
  ['f-name', 'f-birth', 'f-phone'].forEach(id => $('#' + id).addEventListener('input', sync));
  ['g-name', 'g-rel', 'g-phone'].forEach(id => $('#' + id).addEventListener('input', () => {
    S.info.guardian = { name: $('#g-name').value, rel: $('#g-rel').value, phone: $('#g-phone').value };
  }));
  $$('#f-gender button').forEach(b => b.addEventListener('click', () => {
    S.info.gender = b.dataset.v;
    $$('#f-gender button').forEach(x => x.classList.toggle('on', x === b));
  }));
  $('#pre-adult').addEventListener('click', () => {
    const s = SAMPLES.adult[S.lang];
    $('#f-name').value = s[0]; $('#f-birth').value = s[1]; $('#f-phone').value = S.lang === 'ko' ? '010-2847-5910' : '+00-000-0000-000';
    sync();
  });
  $('#pre-minor').addEventListener('click', () => {
    const s = SAMPLES.minor[S.lang];
    $('#f-name').value = s[0]; $('#f-birth').value = s[1]; $('#f-phone').value = '010-0000-0000';
    sync();
  });
  $('#info-back').addEventListener('click', () => nav('s-consent'));
  $('#info-go').addEventListener('click', () => {
    sync();
    if (!S.info.name || !S.info.birth || !S.info.phone) { toast(T('reqField')); return; }
    if (isMinor() && !$('#g-name').value.trim()) { toast(T('reqField') + ' — ' + T('gName')); return; }
    S.step = 3; nav('s-q1');
  });
}

/* S4 설문 Q1 — 고민 카드 (사진 카드 · 최대 3) */
function rQ1() {
  $('#q1-wrap').innerHTML = `
    <div class="step-head">
      <span class="eyebrow rv" data-rv="1">Consultation 1 / 3</span>
      <h2 class="h-sect rv" data-rv="2">${esc(T('q1Title'))}</h2>
      <p class="lead rv" data-rv="3">${esc(T('q1Sub'))}</p>
    </div>
    <div class="step-body qcards">
      ${D.concerns.map((c, i) => `
        <button class="qcard rv ${S.concerns.includes(c.id) ? 'sel' : ''}" data-id="${c.id}" style="transition-delay:${(.12 + i * .045).toFixed(3)}s">
          <img src="assets/img/${c.img}" alt="" loading="lazy">
          <span class="mark"><svg width="13" height="10" viewBox="0 0 14 11" fill="none"><path d="M1 5.5L5 9.5L13 1.5" stroke="#150600" stroke-width="2"/></svg></span>
          <span class="lbl">${esc(P(c.label))}</span>
        </button>`).join('')}
    </div>
    <div class="step-foot">
      ${progressHTML(3)}
      <div style="display:flex;gap:10px;">
        <button class="btn ghost" id="q1-back">${esc(T('back'))}</button>
        <button class="btn" id="q1-go" ${S.concerns.length ? '' : 'disabled'}>${esc(T('next'))}</button>
      </div>
    </div>`;
  const refresh = () => {
    $$('#q1-wrap .qcard').forEach(c => {
      const sel = S.concerns.includes(c.dataset.id);
      c.classList.toggle('sel', sel);
      c.classList.toggle('dim', !sel && S.concerns.length >= 3);
    });
    $('#q1-go').disabled = !S.concerns.length;
  };
  $$('#q1-wrap .qcard').forEach(c => c.addEventListener('click', () => {
    const id = c.dataset.id;
    if (S.concerns.includes(id)) S.concerns = S.concerns.filter(x => x !== id);
    else if (S.concerns.length < 3) S.concerns.push(id);
    refresh();
  }));
  refresh();
  $('#q1-back').addEventListener('click', () => nav('s-info'));
  $('#q1-go').addEventListener('click', () => { S.step = 4; nav('s-q2'); });
}

/* S5 설문 Q2 — 관심 시술 */
function rQ2() {
  const opts = D.interestOptions.map(tid => D.treatments.find(t => t.id === tid)).filter(Boolean);
  $('#q2-wrap').innerHTML = `
    <div class="step-head">
      <span class="eyebrow rv" data-rv="1">Consultation 2 / 3</span>
      <h2 class="h-sect rv" data-rv="2">${esc(T('q2Title'))}</h2>
      <p class="lead rv" data-rv="3">${esc(T('q2Sub'))}</p>
    </div>
    <div class="step-body opt-list">
      ${opts.map((tr, i) => `
        <button class="opt rv ${S.interests.includes(tr.id) ? 'sel' : ''}" data-id="${tr.id}" style="transition-delay:${(.12 + i * .06).toFixed(3)}s">
          <span><b>${esc(P(tr.name))}</b><span>${esc(P(tr.tag))}</span></span>
          <span class="ring"><i></i></span>
        </button>`).join('')}
      <button class="opt ${S.interests.length === 0 && S._q2none ? 'sel' : ''}" data-id="__none">
        <span><b>${esc(T('q2None'))}</b></span><span class="ring"><i></i></span>
      </button>
    </div>
    <div class="step-foot">
      ${progressHTML(4)}
      <div style="display:flex;gap:10px;">
        <button class="btn ghost" id="q2-back">${esc(T('back'))}</button>
        <button class="btn" id="q2-go">${esc(T('next'))}</button>
      </div>
    </div>`;
  $$('#q2-wrap .opt').forEach(o => o.addEventListener('click', () => {
    const id = o.dataset.id;
    if (id === '__none') { S.interests = []; S._q2none = true; }
    else {
      S._q2none = false;
      if (S.interests.includes(id)) S.interests = S.interests.filter(x => x !== id);
      else S.interests.push(id);
    }
    $$('#q2-wrap .opt').forEach(x => x.classList.toggle('sel',
      x.dataset.id === '__none' ? (S._q2none && !S.interests.length) : S.interests.includes(x.dataset.id)));
  }));
  $('#q2-back').addEventListener('click', () => nav('s-q1'));
  $('#q2-go').addEventListener('click', () => { S.step = 5; nav('s-q3'); });
}

/* S6 설문 Q3 — 다운타임 (선택 즉시 제출) */
function rQ3() {
  const opts = [['dt0', 'dt0s'], ['dt1', 'dt1s'], ['dt2', 'dt2s'], ['dt3', 'dt3s']];
  $('#q3-wrap').innerHTML = `
    <div class="step-head">
      <span class="eyebrow rv" data-rv="1">Consultation 3 / 3</span>
      <h2 class="h-sect rv" data-rv="2">${esc(T('q3Title'))}</h2>
      <p class="lead rv" data-rv="3">${esc(T('q3Sub'))}</p>
    </div>
    <div class="step-body opt-list">
      ${opts.map(([k, s], i) => `
        <button class="opt rv ${S.dt === k ? 'sel' : ''}" data-id="${k}" style="transition-delay:${(.12 + i * .06).toFixed(3)}s">
          <span><b>${esc(T(k))}</b><span>${esc(T(s))}</span></span>
          <span class="ring"><i></i></span>
        </button>`).join('')}
    </div>
    <div class="step-foot">
      ${progressHTML(5)}
      <button class="btn ghost" id="q3-back">${esc(T('back'))}</button>
    </div>`;
  $$('#q3-wrap .opt').forEach(o => o.addEventListener('click', () => {
    S.dt = o.dataset.id;
    o.classList.add('sel');
    submitSurvey(false);
    setTimeout(() => nav('s-rec'), 350);
  }));
  $('#q3-back').addEventListener('click', () => nav('s-q2'));
}

/* S7 추천 — 매핑 테이블 실계산 */
function rRec() {
  const recs = recommend(D, S.concerns, S.interests, S.dt);
  const cNames = S.concerns.map(id => P((D.concerns.find(c => c.id === id) || {}).short)).filter(Boolean);
  $('#rec-wrap').innerHTML = `
    <div class="step-head">
      <span class="eyebrow rv" data-rv="1">${esc(T('doneTitle'))}</span>
      <h2 class="h-sect rv" data-rv="2">${esc(T('recTitle'))}</h2>
      <div class="rec-meta rv" data-rv="3">
        <div>${esc(T('recWhy'))} — <b>${esc(cNames.join(' · '))}</b></div>
        <div>${esc(T('recDt'))} — <b>${esc(T(S.dt || 'dt3'))}</b></div>
      </div>
    </div>
    <div class="step-body rec-wrap">
      <div class="rec-grid">
        ${recs.map((r, i) => `
          <button class="rec-card rv" data-id="${r.t.id}" style="transition-delay:${(.15 + i * .1).toFixed(3)}s">
            <span class="rec-rank">N°${i + 1}</span>
            <span class="im"><img src="assets/img/${r.t.img}" alt="" loading="lazy"></span>
            <span class="bd">
              <span class="rec-fit">MATCH ${r.s * 12 + 52}%</span>
              <h4>${esc(P(r.t.name))}</h4>
              <span class="tg">${esc(P(r.t.tag))}</span>
              <span class="pr">${esc(T('from'))}${fmtKRW(activePrice(r.t))}${esc(T('fromSuffix'))}<small>${esc(T('vatNote'))}</small></span>
            </span>
          </button>`).join('')}
      </div>
    </div>
    <div class="step-foot">
      <span></span>
      <button class="btn" id="rec-menu">${esc(T('viewMenu'))}</button>
    </div>`;
  $$('#rec-wrap .rec-card').forEach(c => c.addEventListener('click', () => { S.detailFrom = 's-rec'; openDetail(c.dataset.id); }));
  $('#rec-menu').addEventListener('click', () => nav('s-menu'));
}

function activePrice(t) { return eventActive(t.event) ? eventPrice(t) : t.price.list; }

/* S8 메뉴판 */
function rMenu() {
  const cats = [{ id: 'all', name: { ko: T('all'), en: t('all', 'en'), ja: t('all', 'ja'), zh: t('all', 'zh') } }, ...D.categories];
  const list = D.treatments.filter(t2 => t2.status === 'published' && (S.menuCat === 'all' || t2.cat === S.menuCat));
  $('#menu-wrap').innerHTML = `
    <div class="step-head">
      <span class="eyebrow rv" data-rv="1">Menu</span>
      <h2 class="h-sect rv" data-rv="2">${esc(T('menuTitle'))}</h2>
    </div>
    <div class="menu-tabs rv" data-rv="3">
      ${cats.map(c => `<button class="mtab ${S.menuCat === c.id ? 'on' : ''}" data-id="${c.id}">${esc(P(c.name))}</button>`).join('')}
    </div>
    <div class="menu-list">
      ${list.map((tr, i) => {
        const ev = eventActive(tr.event);
        return `<button class="mcard rv" data-id="${tr.id}" style="transition-delay:${(.1 + Math.min(i, 7) * .05).toFixed(3)}s">
          <span class="im"><img src="assets/img/${tr.img}" alt="" loading="lazy"></span>
          <span class="bd">
            <h4>${esc(P(tr.name))} ${ev ? `<span class="ev-badge">${esc(T('eventBadge'))} −${tr.event.rate}%</span>` : ''}</h4>
            <span class="tg">${esc(P(tr.tag))}</span>
            <span class="meta"><span>${tr.duration}min</span><span>${esc(T('downtime'))} ${tr.downtime ? tr.downtime + T('dtDays') : T('dtNone')}</span></span>
            <span class="pr">${esc(T('from'))}${fmtKRW(ev ? eventPrice(tr) : tr.price.list)}${esc(T('fromSuffix'))}<small>${esc(T('vatNote'))}</small></span>
          </span>
        </button>`;
      }).join('')}
    </div>
    <div class="menu-foot">
      <button class="link-notice" id="menu-notice">${esc(T('menuNotice'))}</button>
      <button class="btn sm" id="menu-finish">${esc(T('menuCta'))}</button>
    </div>`;
  $$('#menu-wrap .mtab').forEach(b => b.addEventListener('click', () => { S.menuCat = b.dataset.id; rMenu(); }));
  $$('#menu-wrap .mcard').forEach(c => c.addEventListener('click', () => { S.detailFrom = 's-menu'; openDetail(c.dataset.id); }));
  $('#menu-notice').addEventListener('click', () => nav('s-notice'));
  $('#menu-finish').addEventListener('click', () => nav('s-finish'));
}

/* S9 시술 상세 — Genesis 섹션 순서 · Aesop 가격 문법 */
let curDetail = null, pkgSel = 'p1';
function openDetail(tid) { curDetail = tid; pkgSel = 'p1'; rDetail(); nav('s-detail'); }
function rDetail() {
  const tr = D.treatments.find(x => x.id === curDetail);
  if (!tr) return;
  const ev = eventActive(tr.event);
  const painKey = tr.pain <= 1 ? 'painLow' : tr.pain === 2 ? 'painMid' : 'painHigh';
  const picked = S.picks.includes(tr.id);
  $('#detail-scroll').innerHTML = `
    <div class="d-hero" id="d-hero">
      <img src="assets/img/${tr.heroImg || tr.img}" alt="">
      <button class="d-back" id="d-back">← ${esc(T('back'))}</button>
      <div class="d-hero-txt">
        <span class="eyebrow">${esc(P((D.categories.find(c => c.id === tr.cat) || {}).name))}</span>
        <h2>${esc(P(tr.name))}</h2>
        <div class="tg">${esc(P(tr.tag))}</div>
      </div>
    </div>
    <div class="d-inner">
      <div class="d-spec rv">
        <div><div class="k">${esc(T('duration'))}</div><div class="v">${tr.duration} min</div></div>
        <div><div class="k">${esc(T('downtime'))}</div><div class="v">${tr.downtime ? tr.downtime + T('dtDays') : T('dtNone')}</div></div>
        <div><div class="k">${esc(T('pain'))}</div><div class="v">${esc(T(painKey))}</div></div>
        <div><div class="k">${esc(T('anesthesia'))}</div><div class="v">${esc(P(tr.anesthesia))}</div></div>
      </div>

      <div class="d-sect">
        <span class="eyebrow">${esc(T('pkgTitle'))}</span>
        <div class="pkg-grid">
          ${[['p1', 'pkg1', tr.price.list], ['p3', 'pkg3', tr.price.pkg.p3], ['p5', 'pkg5', tr.price.pkg.p5]].map(([k, nm, pr]) => `
            <button class="pkg ${pkgSel === k ? 'sel' : ''}" data-k="${k}">
              <span class="nm">${esc(T(nm))}</span>
              ${k === 'p1' && ev ? `<span class="ev">${esc(T('eventBadge'))} −${tr.event.rate}%</span>` : ''}
              <span class="pr"><b>${fmtKRW(k === 'p1' ? (ev ? eventPrice(tr) : pr) : pr)}</b></span>
              <span class="per">${k === 'p1' ? esc(T('vatNote')) : esc(T('perSession')) + ' · ' + esc(T('vatNote'))}</span>
            </button>`).join('')}
        </div>
        ${ev ? `<div class="ev-line"><span>${esc(T('eventTarget'))} — <b>${esc(P(tr.event.target))}</b></span><span>${esc(T('eventPeriod'))} — <b>${tr.event.start} ~ ${tr.event.end}</b></span><span>${esc(T('eventRate'))} — <b>${tr.event.rate}%</b></span></div>` : ''}
        <div class="pkg-note">${esc(T('consultNote'))}</div>
      </div>

      <div class="d-sect">
        <span class="eyebrow">${esc(T('secPrinciple'))}</span>
        <h3>${esc(P(tr.tag))}</h3>
        <p>${esc(P(tr.desc))}</p>
      </div>

      <div class="d-sect">
        <span class="eyebrow">${esc(T('secFor'))}</span>
        <div class="for-list">
          ${Object.entries(D.mapping).filter(([, m]) => m[tr.id]).sort((a, b) => b[1][tr.id] - a[1][tr.id])
            .map(([cid]) => { const c = D.concerns.find(x => x.id === cid); return c ? `<div class="for-item">${esc(P(c.label))}</div>` : ''; }).join('')}
        </div>
      </div>

      <div class="d-sect">
        <span class="eyebrow">${esc(T('secDevice'))}</span>
        <div class="dev-row">
          <div class="dev-seal">GENUINE<br>CERTIFIED</div>
          <div>
            <div class="nm">${esc(tr.device.brand)}</div>
            <div class="tp">${esc(tr.device.type)}</div>
            ${tr.device.genuine ? `<div class="gn">✓ ${esc(T('genuine'))} — ${esc(T('genuineNote'))}</div>` : ''}
          </div>
        </div>
      </div>

      <div class="d-sect">
        <span class="eyebrow">${esc(T('secEffect'))}</span>
        <p>${esc(P(tr.effect))}</p>
      </div>

      ${tr.bna ? `
      <div class="d-sect">
        <span class="eyebrow">${esc(T('bnaTitle'))}</span>
        <div class="bna" id="bna">
          <img src="assets/img/${tr.bna.base}-before.webp" alt="">
          <img class="aft" src="assets/img/${tr.bna.base}-after.webp" alt="">
          <div class="bar"></div>
          <div class="knob">◂▸</div>
          <span class="tag b">${esc(T('before'))}</span><span class="tag a">${esc(T('after'))}</span>
        </div>
        <div class="bna-period">${esc(P(tr.bna.period))}</div>
        <div class="bna-note">${esc(T('bnaNote'))}</div>
      </div>` : ''}

      <div class="d-sect">
        <div class="acc">
          <div class="acc-item">
            <button class="acc-head">${esc(T('secCare'))}<span class="ic">+</span></button>
            <div class="acc-body"><p>${esc(P(tr.care))}</p></div>
          </div>
          <div class="acc-item">
            <button class="acc-head">${esc(T('secSpec'))}<span class="ic">+</span></button>
            <div class="acc-body"><p>${esc(P(tr.name))} · ${tr.duration}min · ${esc(T('downtime'))} ${tr.downtime ? tr.downtime + T('dtDays') : T('dtNone')} · ${esc(tr.device.brand)} (${esc(tr.device.type)})</p></div>
          </div>
        </div>
      </div>

      <div class="d-cta-row">
        <button class="btn ghost" id="d-menu">${esc(T('viewMenu'))}</button>
        <button class="btn ${picked ? '' : 'gold'}" id="d-pick">${esc(picked ? T('interested') : T('interest'))}</button>
      </div>
    </div>`;
  setTimeout(() => $('#d-hero').classList.add('zoomed'), 80);
  $('#d-back').addEventListener('click', () => nav(S.detailFrom));
  $('#d-menu').addEventListener('click', () => nav('s-menu'));
  $('#d-pick').addEventListener('click', () => {
    if (!S.picks.includes(tr.id)) { S.picks.push(tr.id); toast(T('interested') + ' — ' + P(tr.name)); rDetail(); }
  });
  $$('#detail-scroll .pkg').forEach(b => b.addEventListener('click', () => {
    pkgSel = b.dataset.k;
    $$('#detail-scroll .pkg').forEach(x => x.classList.toggle('sel', x === b));
  }));
  $$('#detail-scroll .acc-head').forEach(h => h.addEventListener('click', () => {
    const item = h.parentElement, body = item.querySelector('.acc-body');
    const open = item.classList.toggle('open');
    body.style.maxHeight = open ? body.scrollHeight + 'px' : '0';
  }));
  initBna();
}

/* B&A 드래그 비교 */
function initBna() {
  const el = $('#bna'); if (!el) return;
  const aft = el.querySelector('.aft'), bar = el.querySelector('.bar'), knob = el.querySelector('.knob');
  const setP = x => {
    const r = el.getBoundingClientRect();
    const p = Math.min(96, Math.max(4, (x - r.left) / r.width * 100));
    aft.style.clipPath = `inset(0 0 0 ${p}%)`;
    bar.style.left = p + '%'; knob.style.left = p + '%';
  };
  el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); setP(e.clientX); });
  el.addEventListener('pointermove', e => { if (e.buttons) setP(e.clientX); });
}

/* 비급여 고지 (B-5) */
function rNotice() {
  const rows = D.treatments.filter(t2 => t2.status === 'published')
    .map(tr => `<tr><td>${esc(P(tr.name))}</td><td>${fmtKRW(tr.price.list)}</td><td>${eventActive(tr.event) ? esc(T('eventBadge')) + ' −' + tr.event.rate + '% (' + tr.event.start + '~' + tr.event.end + ')' : ''}</td></tr>`).join('');
  const cols = T('noticeCols');
  $('#notice-wrap').innerHTML = `
    <div class="step-head">
      <span class="eyebrow rv" data-rv="1">Notice</span>
      <h2 class="h-sect rv" data-rv="2">${esc(T('noticeTitle'))}</h2>
      <p class="lead rv" data-rv="3">${esc(T('noticeLead'))}</p>
    </div>
    <table class="notice-table rv" data-rv="4">
      <thead><tr><th>${esc(cols[0])}</th><th>${esc(cols[1])}</th><th>${esc(cols[2])}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="notice-updated rv" data-rv="5">Updated ${esc(D.settings.priceNoticeUpdated)} · ${esc(T('vatNote'))}</p>
    <div class="step-foot">
      <button class="btn ghost" id="notice-back">${esc(T('back'))}</button>
      <button class="btn sm ghost" id="notice-print">${esc(T('print'))}</button>
    </div>`;
  $('#notice-back').addEventListener('click', () => nav('s-menu'));
  $('#notice-print').addEventListener('click', () => window.print());
}

/* S10 완료 */
function rFinish() {
  const picks = S.picks.map(id => D.treatments.find(t2 => t2.id === id)).filter(Boolean);
  $('#finish-wrap').innerHTML = `
    <div class="finish-seal"><svg width="26" height="20" viewBox="0 0 26 20" fill="none"><path d="M2 10L10 18L24 2" stroke="currentColor" stroke-width="1.6"/></svg></div>
    <h2 class="h-display rv" data-rv="1">${esc(T('finishTitle'))}</h2>
    <p class="lead rv" data-rv="2" style="text-align:center;">${esc(T('finishLead'))}</p>
    ${picks.length ? `<div class="rv" data-rv="3" style="margin-top:10px;"><span class="eyebrow">${esc(T('summaryTitle'))}</span></div>
    <div class="summary-strip rv" data-rv="4">${picks.map(p2 => `<span>${esc(P(p2.name))}</span>`).join('')}</div>` : ''}
    <button class="btn rv" data-rv="5" id="finish-home" style="margin-top:22px;">${esc(T('finishBtn'))}</button>`;
  $('#finish-home').addEventListener('click', () => wipeSession(false));
}

/* ── 헤더 ─────────────────────────────────── */
$('#hd-lang').addEventListener('click', () => {
  const reg = (D.settings.fetchRegNo || '').trim();
  const avail = LANGS.filter(l => reg || (l.code !== 'ja' && l.code !== 'zh')).map(l => l.code);
  const next = avail[(avail.indexOf(S.lang) + 1) % avail.length];
  setLang(next);
});
$('#hd-reset').addEventListener('click', () => wipeSession(false));
$('#attract-cta').addEventListener('click', () => nav('s-lang'));
$('#s-attract').addEventListener('click', e => { if (S.screen === 's-attract' && !e.target.closest('#demo-fab,#demo-drawer')) nav('s-lang'); });

/* ── 데모 컨트롤 드로어 ────────────────────── */
$('#demo-fab').addEventListener('click', e => { e.stopPropagation(); $('#demo-drawer').classList.toggle('show'); });
document.addEventListener('click', e => {
  if (!e.target.closest('#demo-drawer') && !e.target.closest('#demo-fab')) $('#demo-drawer').classList.remove('show');
});
$('#dd-fast').addEventListener('click', function () {
  S.demoFast = !S.demoFast; this.classList.toggle('on', S.demoFast);
  toast(S.demoFast ? '유휴 타임아웃 8초 — 아무 화면에서 손을 떼 보세요' : '타임아웃 60초로 복귀');
  resetIdle();
});
$('#dd-offline').addEventListener('click', function () {
  S.simOffline = !S.simOffline; this.classList.toggle('on', S.simOffline);
  refreshNet();
  if (!S.simOffline) flushQueue();
  toast(S.simOffline ? '오프라인 시뮬레이션 — 제출하면 큐에 쌓입니다' : '온라인 복귀 — 대기 건 전송');
});
$('#dd-reg').addEventListener('click', function () {
  const off = !this.classList.contains('on');
  this.classList.toggle('on', off);
  D.settings.fetchRegNo = off ? '' : GYEOL_SEED.settings.fetchRegNo;
  Store.save();
  toast(off ? '유치기관 등록 해제 — 언어 화면에서 日/中 이 잠깁니다' : '등록번호 복원 — 4개 국어 활성');
  if (S.screen === 's-lang') rLang();
});
$('#dd-seed').addEventListener('click', () => {
  try { localStorage.removeItem('gyeol77-queue'); localStorage.removeItem('gyeol77-fontperf'); } catch (e) {}
  Store.reset(); location.reload();
});

/* ── 키오스크 상태 리포트 (A-3 — 관리자 점검 패널이 읽음) ── */
let wakeLockOn = false;
async function tryWakeLock() {
  try {
    if ('wakeLock' in navigator) { await navigator.wakeLock.request('screen'); wakeLockOn = true; }
  } catch (e) { wakeLockOn = false; }
  reportKiosk();
}
function reportKiosk() {
  try {
    localStorage.setItem('gyeol77-kiosk', JSON.stringify({
      standalone: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
      wakelock: wakeLockOn,
      wakelockSupported: 'wakeLock' in navigator,
      online: isOnline(),
      orient: (screen.orientation && screen.orientation.type) || '-',
      vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio,
      ua: navigator.userAgent.slice(0, 80),
      at: new Date().toISOString(),
    }));
  } catch (e) {}
}
document.addEventListener('pointerdown', () => { if (!wakeLockOn) tryWakeLock(); }, { once: true });
window.addEventListener('resize', reportKiosk);
setInterval(reportKiosk, 5000);

/* ── 콘텐츠 발행 반영 (C-3) — 다른 탭(관리자)에서 발행 시 ── */
window.addEventListener('storage', e => {
  if (e.key !== GYEOL_KEY) return;
  const old = D.contentVersion;
  Store._d = null; const nd = Store.load();
  Object.keys(D).forEach(k => delete D[k]); Object.assign(D, nd);
  if (D.contentVersion !== old) {
    toast('새 메뉴가 적용되었습니다 · v' + D.contentVersion);
    if (['s-menu', 's-rec', 's-notice'].includes(S.screen)) renderScreen(S.screen);
    if (S.screen === 's-detail') rDetail();
  }
});

/* ── 시작 ─────────────────────────────────── */
setLang('ko');
$('#s-attract').classList.add('active');
rAttract();
refreshNet();
reportKiosk();
flushQueue();
