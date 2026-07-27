/* ============================================================
   HERLOOP — 커뮤니티 프론트 (데모)
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const S = {
  cat: '전체',
  view: 'feed',        // feed | own | ext
  open: null,          // 펼친 글 id
  gate: null,          // 게이트 종류
  gateStep: 1,
  repTarget: null,
  repReason: null,
  blinded: new Set(),
};

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.35s'; setTimeout(() => el.remove(), 350); }, 3400);
}

function observeReveal() {
  const targets = $$('.rv:not(.in)');
  if (!targets.length) return;

  // 이미 뷰포트 안에 있는 요소는 즉시 표시 — 탭이 백그라운드면 IO 콜백이 지연되므로 폴백
  const showIfVisible = el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 1.05 && r.bottom > 0) { el.classList.add('in'); return true; }
    return false;
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .06 });

  targets.forEach(el => { if (!showIfVisible(el)) io.observe(el); });
}

/* ============================================================
   피드
   ============================================================ */
function filtered() {
  return POSTS.filter(p => {
    if (S.blinded.has(p.id)) return false;
    if (S.view === 'own' && p.type !== 'own') return false;
    if (S.view === 'ext' && p.type !== 'ext') return false;
    if (S.cat !== '전체' && p.cat !== S.cat) return false;
    return true;
  });
}

function renderFeed() {
  const list = filtered();
  const ownN = POSTS.filter(p => p.type === 'own' && !S.blinded.has(p.id)).length;

  $('#feed').innerHTML = list.length ? list.map(p => card(p)).join('')
    : `<div class="empty"><span class="ei">🌱</span>이 카테고리에는 아직 글이 없어요.<br>첫 글을 남겨 보시겠어요?</div>`;

  $('#ownCnt').textContent = ownN;
  bindCards();
  observeReveal();
}

function card(p) {
  const isExt = p.type === 'ext';
  const opened = S.open === p.id;
  return `
  <article class="card ${isExt ? 'ext' : 'own'} rv" data-id="${p.id}">
    <div class="c-top">
      ${isExt
        ? `<span class="src src-ext">🔗 ${p.src}</span>`
        : `<span class="src src-own">✍️ 회원 작성</span>`}
      <span class="c-cat">${p.cat}</span>
      <span class="c-time">${p.time}</span>
    </div>

    <h3 class="c-title">${p.title}</h3>

    ${isExt
      ? `<p class="c-excerpt">${p.excerpt}</p>
         <a class="outlink" href="javascript:void(0)" onclick="goOut('${p.host}')">
           🔗 원문은 <span class="host">${p.host}</span> 에서 확인하세요
           <span class="arw">→</span>
         </a>`
      : (opened
          ? `<div class="c-body">${p.body}</div>`
          : `<p class="c-excerpt">${p.body.split('\n')[0]}</p>`)}

    <div class="c-foot">
      ${!isExt ? `<span class="c-author"><span class="av" style="background:${p.ac}">${p.av}</span>${p.author}</span>` : ''}
      <button class="act ${p.liked ? 'on' : ''}" data-like="${p.id}">${p.liked ? '♥' : '♡'} ${p.like}</button>
      <button class="act" data-open="${p.id}">💬 ${p.cmt}</button>
      <button class="act rep" data-rep="${p.id}">신고</button>
    </div>

    ${opened ? comments(p) : ''}
  </article>`;
}

function comments(p) {
  const list = COMMENTS[p.id] || [];
  return `
  <div class="cmts">
    ${list.map(c => `
      <div class="cmt">
        <span class="av" style="background:${c.c}">${c.av}</span>
        <div class="cmt-b">
          <div class="who">${c.who}<span>${c.t}</span></div>
          <p>${c.txt}</p>
        </div>
      </div>`).join('') || '<p class="faint" style="font-size:13px;padding:6px 0">첫 댓글을 남겨 보세요.</p>'}
    <div class="cmt-write">
      <input placeholder="${ME.verified ? '따뜻한 댓글을 남겨 주세요' : '댓글을 쓰려면 본인확인이 필요해요'}"
        ${ME.verified ? '' : 'readonly'} data-cmt="${p.id}">
      <button class="btn btn-p btn-sm" data-cmtsend="${p.id}">등록</button>
    </div>
  </div>`;
}

function bindCards() {
  $$('[data-like]').forEach(b => b.onclick = () => {
    if (!ME.verified) return openGate('verify', '좋아요를 누르려면');
    const p = POSTS.find(x => x.id === b.dataset.like);
    p.liked = !p.liked; p.like += p.liked ? 1 : -1;
    renderFeed();
  });
  $$('[data-open]').forEach(b => b.onclick = () => {
    S.open = S.open === b.dataset.open ? null : b.dataset.open;
    renderFeed();
  });
  $$('[data-rep]').forEach(b => b.onclick = () => openReport(b.dataset.rep));
  $$('[data-cmt]').forEach(i => i.onclick = () => { if (!ME.verified) openGate('verify', '댓글을 쓰려면'); });
  $$('[data-cmtsend]').forEach(b => b.onclick = () => {
    if (!ME.verified) return openGate('verify', '댓글을 쓰려면');
    const inp = $(`[data-cmt="${b.dataset.cmtsend}"]`);
    const v = inp.value.trim();
    if (!v) return toast('댓글 내용을 입력해 주세요', 'err');
    const id = b.dataset.cmtsend;
    (COMMENTS[id] = COMMENTS[id] || []).push({ who: ME.nick, av: ME.av, c: ME.color, txt: v, t: '방금' });
    POSTS.find(p => p.id === id).cmt++;
    renderFeed();
    toast('💬 댓글이 등록되었습니다', 'ok');
  });
}

function goOut(host) {
  toast(`🔗 <b>${host}</b> 원문으로 이동합니다<br><span style="font-size:11.5px;opacity:.85">본문을 복제하지 않고 링크로 연결합니다 (저작권 대응)</span>`);
}

/* ============================================================
   본인확인 게이트 (핵심 제안)
   ============================================================ */
function openGate(kind, why = '') {
  S.gate = kind; S.gateStep = 1; S.gateWhy = why;
  renderGate();
  $('#gate').classList.add('show');
}
function closeGate() { $('#gate').classList.remove('show'); }

function renderGate() {
  const box = $('#gateBody');
  if (S.gate === 'write' && !ME.verified) { S.gate = 'verify'; S.gateWhy = '글을 쓰려면'; }

  if (S.gate === 'verify') {
    if (S.gateStep === 1) {
      box.innerHTML = `
        <h2>${S.gateWhy} 본인확인이 필요해요</h2>
        <p class="sub">허루프는 <b>여성만 참여하는 공간</b>입니다.<br>
          이 확인이 있어야 서로 안심하고 이야기할 수 있어요.</p>
        <div class="steps"><span class="step on"></span><span class="step"></span><span class="step"></span></div>

        <div class="gate-note" style="margin-top:18px">
          🔒 <b>수집 항목</b> — 성별, 생년(연령대)만 확인하고 <b>이름·연락처는 저장하지 않습니다.</b><br>
          확인 결과는 <b>가입 여부 판단에만</b> 쓰이며, 프로필에는 닉네임만 표시됩니다.
        </div>

        <label class="check-row" style="margin-top:16px">
          <input type="checkbox" id="ag1">
          <span><b>본인확인 서비스 이용</b>에 동의합니다 (성별·연령대 확인 목적)</span>
        </label>
        <label class="check-row">
          <input type="checkbox" id="ag2">
          <span><b>커뮤니티 이용규칙</b>에 동의합니다 — 신상 노출, 성적 괴롭힘, 캡처 유출은 즉시 이용 정지됩니다</span>
        </label>

        <button class="btn btn-p btn-full" style="margin-top:8px" onclick="gateNext()">동의하고 본인확인</button>
        <button class="btn btn-l btn-full" style="margin-top:8px;height:42px;font-size:14px" onclick="closeGate()">나중에 하기</button>`;
    } else if (S.gateStep === 2) {
      box.innerHTML = `
        <h2>휴대폰 본인확인</h2>
        <p class="sub">통신사 본인확인 서비스로 확인합니다.</p>
        <div class="steps"><span class="step on"></span><span class="step on"></span><span class="step"></span></div>

        <div class="pass-box" style="margin-top:18px">
          <div class="pass-logo">PASS</div>
          <b>통신사 인증 앱으로 이동합니다</b>
          <p>이름·생년월일·성별을 통신사가 확인해<br>결과만 허루프로 전달합니다</p>
        </div>

        <div class="fld">
          <label>닉네임 <span class="req">*</span></label>
          <input type="text" id="gNick" placeholder="커뮤니티에서 쓸 이름" maxlength="12" value="루프01">
          <p class="hint">실명은 쓰지 마세요. 다른 회원에게는 닉네임만 보입니다.</p>
        </div>

        <button class="btn btn-p btn-full" onclick="gateNext()">본인확인 진행</button>`;
    } else {
      box.innerHTML = `
        <div class="done-ico">✓</div>
        <h2 style="text-align:center">확인이 완료되었어요</h2>
        <p class="sub" style="text-align:center">이제 글을 쓰고 댓글을 남길 수 있습니다.</p>
        <div class="steps"><span class="step on"></span><span class="step on"></span><span class="step on"></span></div>

        <div class="gate-note" style="margin-top:20px">
          ✓ 저장된 정보 — <b>성별(여성), 연령대(30대), 닉네임</b><br>
          ✕ 저장하지 않은 정보 — 이름, 생년월일, 휴대폰 번호, 통신사
        </div>

        <button class="btn btn-p btn-full" style="margin-top:16px" onclick="closeGate();renderMe();renderFeed()">시작하기</button>`;
    }
  }

  else if (S.gate === 'write') {
    box.innerHTML = `
      <h2>글쓰기</h2>
      <p class="sub">여기서 나눈 이야기는 회원에게만 보여요.</p>
      <div class="fld" style="margin-top:16px">
        <label>카테고리</label>
        <select id="wCat">${CATS.filter(c => c !== '전체').map(c => `<option>${c}</option>`).join('')}</select>
      </div>
      <div class="fld">
        <label>제목 <span class="req">*</span></label>
        <input type="text" id="wTitle" placeholder="어떤 이야기인가요?">
      </div>
      <div class="fld">
        <label>내용 <span class="req">*</span></label>
        <textarea class="write-area" id="wBody" placeholder="편하게 적어 주세요"></textarea>
      </div>
      <div class="gate-note" style="background:var(--warn-soft);border-color:#F3E0B8;color:#8A5A0B">
        ⚠️ 실명·주소·직장처럼 <b>본인을 특정할 수 있는 정보</b>는 적지 마세요. 다른 회원의 신상도 마찬가지입니다.
      </div>
      <button class="btn btn-p btn-full" style="margin-top:14px" onclick="submitPost()">올리기</button>`;
  }

  else if (S.gate === 'report') {
    box.innerHTML = `
      <h2>신고하기</h2>
      <p class="sub">확인 후 조치하고 결과를 알려 드립니다.</p>
      <div class="rep-opts" style="margin-top:16px">
        ${REPORT_REASONS.map(r => `
          <label class="rep-opt ${r.urgent ? 'urgent' : ''} ${S.repReason === r.id ? 'on' : ''}" onclick="pickReason('${r.id}')">
            <input type="radio" name="rep" ${S.repReason === r.id ? 'checked' : ''}>
            <span>${r.label}${r.urgent ? ' <b style="color:var(--bad);font-size:11px">긴급</b>' : ''}</span>
          </label>`).join('')}
      </div>
      <div class="gate-note" style="margin-top:14px">
        🛡 <b>긴급 사유</b>(개인정보 노출·성적 괴롭힘·불법촬영물 의심)로 신고하면
        <b>검토 전에 먼저 가려집니다.</b> 피해가 커지기 전에 멈추는 것이 우선이기 때문입니다.
      </div>
      <button class="btn btn-p btn-full" style="margin-top:14px" onclick="submitReport()">신고 접수</button>`;
  }
}

function gateNext() {
  if (S.gateStep === 1) {
    if (!$('#ag1').checked || !$('#ag2').checked) return toast('두 항목 모두 동의가 필요합니다', 'err');
    S.gateStep = 2; renderGate();
  } else if (S.gateStep === 2) {
    const n = $('#gNick').value.trim();
    if (!n) return toast('닉네임을 입력해 주세요', 'err');
    ME.nick = n; ME.av = n[0];
    toast('📱 통신사 인증 창이 열립니다 (데모에서는 즉시 완료)');
    setTimeout(() => {
      ME.verified = true;
      S.gateStep = 3; renderGate();
    }, 700);
  }
}

function submitPost() {
  const t = $('#wTitle').value.trim(), b = $('#wBody').value.trim();
  if (!t) return toast('제목을 입력해 주세요', 'err');
  if (!b) return toast('내용을 입력해 주세요', 'err');
  POSTS.unshift({
    id: 'p' + Date.now(), type: 'own', src: null, cat: $('#wCat').value,
    author: ME.nick, av: ME.av, ac: ME.color,
    title: t, body: b, time: '방금', like: 0, cmt: 0, liked: false,
  });
  closeGate(); renderFeed();
  toast('✅ 글이 올라갔습니다', 'ok');
}

function openReport(id) {
  if (!ME.verified) return openGate('verify', '신고하려면');
  S.repTarget = id; S.repReason = null;
  openGate('report');
}
function pickReason(rid) { S.repReason = rid; renderGate(); }

function submitReport() {
  if (!S.repReason) return toast('신고 사유를 선택해 주세요', 'err');
  const r = REPORT_REASONS.find(x => x.id === S.repReason);
  closeGate();
  if (r.urgent) {
    S.blinded.add(S.repTarget);
    renderFeed();
    toast(`🛡 <b>${r.label}</b> 신고 접수 — <b>즉시 가림 처리</b>했습니다<br><span style="font-size:11.5px;opacity:.85">운영자 검토 후 결과를 알려 드립니다</span>`, 'warn');
  } else {
    toast(`신고가 접수되었습니다 — ${r.label}`, 'ok');
  }
}

/* ============================================================
   상단 · 탭
   ============================================================ */
function renderMe() {
  $('#meBox').innerHTML = ME.verified
    ? `<span class="me"><span class="av" style="background:${ME.color}">${ME.av}</span>${ME.nick}
         <span class="verified">✓ 확인됨</span></span>`
    : `<button class="btn btn-l btn-sm" onclick="openGate('verify','시작하려면')">본인확인</button>`;
}

function setView(v) {
  S.view = v; S.open = null;
  $$('.hd-nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  renderFeed();
}
function setCat(c) {
  S.cat = c; S.open = null;
  $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.c === c));
  renderFeed();
}

document.addEventListener('DOMContentLoaded', () => {
  $('#tabs').innerHTML = CATS.map(c =>
    `<button class="tab ${c === '전체' ? 'on' : ''}" data-c="${c}" onclick="setCat('${c}')">${c}</button>`).join('');
  $$('.hd-nav button').forEach(b => b.onclick = () => setView(b.dataset.v));
  $('#gate').addEventListener('click', e => { if (e.target.id === 'gate') closeGate(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGate(); });
  $('#fab').onclick = () => ME.verified ? openGate('write') : openGate('verify', '글을 쓰려면');
  renderMe();
  renderFeed();
});
