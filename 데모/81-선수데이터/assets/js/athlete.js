/* ATHLEDGER 선수 웹 — 폰 프레임 · 한 손 조작(드래그·핀치 없음) · 본인 데이터만
   화면: 로그인 · 오늘 · 내 기록 · 세션 상세(3D·좌우·그래프) · 세션 기록 · CSV 올리기 · 착용 평가 · 내 정보
   데모 데이터는 전부 가상입니다. */
(function (W) {
  'use strict';
  const { icon, LOGO, $, $$, esc, fmtN, fmtDur, fmtDate, fmtDateK, el, toast, modal, countUp, reveal, growBars } = CORE;
  const D = DATA; const screen = $('#screen');
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const BODY_COLORS = { base: '#d9e0e6', heat: '#1f8fb0', heat2: '#7ccbd2', left: '#5090f7', right: '#ef5c31', fit: '#069d7a', ghost: '#9fb0bb' };
  const DISCLAIMER = '<span class="disclaimer">' + icon('info') + '운동 기록 기술 통계 — 의학적 판단이 아닙니다</span>';
  const sportName = k => (D.SPORTS[k] || {}).name || k;
  const sound = a => a.amp.side === 'L' ? 'R' : 'L';
  const sideK = s => s === 'L' ? '왼쪽' : '오른쪽';
  // 세션 상태 (세션 스토리지 — 탭 닫으면 로그아웃)
  let me = null, actor = null; try { const s = JSON.parse(sessionStorage.getItem('athledger.athlete') || 'null'); if (s) { me = D.athletes().find(a => a.id === s.me); actor = s.actor; } } catch (e) { }
  const mySessions = () => D.sessions().filter(s => s.athlete === me.id);
  const log = (action, detail, target, denied) => D.log({ who: actor || me.id, role: actor ? '관계자(위임)' : '선수', target: target || me.id, action, detail: detail || '', denied: !!denied });

  /* ---------- 셸 ---------- */
  const leaveFns = []; const onLeave = fn => leaveFns.push(fn);
  function shell(title, body, tab, opts) {
    opts = opts || {}; while (leaveFns.length) { try { leaveFns.pop()(); } catch (e) { } }
    screen.innerHTML = '<div class="app-h">' + (opts.back ? '<button class="btn icon ghost" id="back" aria-label="뒤로">' + icon('back') + '</button>' : '<span class="mark" style="width:28px;height:28px;display:inline-block">' + LOGO + '</span>') + '<div style="flex:1;min-width:0"><div class="title-s" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + title + '</div>' + (opts.sub ? '<div class="muted body-s">' + opts.sub + '</div>' : '') + '</div>' + (opts.right || '') + '</div>' +
      '<div class="app-b">' + body + '</div>' +
      (tab ? '<nav class="app-tabbar" aria-label="메뉴">' + [['home', 'home', '오늘'], ['sessions', 'activity', '내 기록'], ['upload', 'upload', '올리기'], ['me', 'user', '내 정보']].map(t => '<button data-go="' + t[0] + '"' + (tab === t[0] ? ' aria-current="page"' : '') + '>' + icon(t[1]) + t[2] + '</button>').join('') + '</nav>' : '');
    $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
    const bk = $('#back'); if (bk) bk.onclick = () => history.length > 1 ? history.back() : go(opts.back === true ? 'home' : opts.back);
    reveal(screen); growBars(screen);
  }
  const go = h => { location.hash = '#/' + h; };

  /* ---------- 로그인 ---------- */
  function login() {
    screen.innerHTML = '<div class="app-h"><span class="mark" style="width:28px;height:28px;display:inline-block">' + LOGO + '</span><div><div class="title-s">ATHLEDGER</div><div class="muted body-s">선수 웹 · 데모</div></div></div><div class="app-b" style="gap:16px">' +
      '<div class="card"><div class="h"><b>익명 ID로 들어가기</b><span class="badge mono">PIN 4자리</span></div><div class="stack"><div class="field"><label>익명 ID</label><input class="input" id="lid" value="ATH-0001" style="height:48px;font-size:16px;font-family:var(--mono)"></div><div class="field"><label>PIN</label><input class="input" id="lpin" value="2468" inputmode="numeric" maxlength="4" style="height:48px;font-size:16px;font-family:var(--mono);letter-spacing:.3em"></div><button class="cta-big" id="doLogin">' + icon('key') + '<span>들어가기<small>실제 서비스는 이메일 매직 링크 또는 ID+PIN — 한 손 입력 부담을 줄입니다</small></span></button></div></div>' +
      '<div class="eyebrow ko">체험 계정 (탭 한 번)</div><div class="stack" style="gap:8px">' +
      [['ATH-0001', '', '육상 · 왼쪽 전완 절단 · 동의 완료 · 세션 6'], ['ATH-0009', '', '육상 · 기능 제한 · <b style="color:var(--warn)">민감정보 미동의 → 업로드 차단</b>'], ['ATH-0002', 'C-02', '코치 C-02가 <b>대리 입력</b> (위임 범위: 입력만)']].map(x => '<button class="list-row" data-as="' + x[0] + '" data-actor="' + x[1] + '"><span class="badge mono">' + x[0] + '</span><span class="t"><b>' + (x[1] ? '관계자 ' + x[1] + ' → ' + x[0] : x[0]) + '</b><small>' + x[2] + '</small></span>' + icon('chevR', 'chev') + '</button>').join('') + '</div>' +
      '<p class="help">주소창에서 다른 선수의 세션 주소(#/session/SES-019)를 직접 열어 보세요 — 0건 화면과 접속기록으로 막힙니다.</p></div>';
    $('#doLogin').onclick = () => enter($('#lid').value.trim().toUpperCase(), '');
    $$('[data-as]').forEach(b => b.onclick = () => enter(b.dataset.as, b.dataset.actor));
  }
  function enter(id, act) {
    const a = D.athletes().find(x => x.id === id); if (!a) { toast('등록되지 않은 익명 ID입니다', 'crit'); return; }
    me = a; actor = act || null; try { sessionStorage.setItem('athledger.athlete', JSON.stringify({ me: a.id, actor })); } catch (e) { }
    D.log({ who: actor || a.id, role: actor ? '관계자(위임)' : '선수', target: a.id, action: '로그인', detail: actor ? '위임 범위: 입력만' : '' });
    toast('<b>' + a.id + '</b>' + (actor ? ' 대리 입력 모드 (' + actor + ')' : '') + ' — 본인 기록만 보입니다', 'good'); go('home');
  }
  function logout() { me = null; actor = null; try { sessionStorage.removeItem('athledger.athlete'); } catch (e) { } location.hash = ''; login(); }
  const consentOk = () => { const c = D.consentOf(me.id); return c.personal && c.sensitive; };

  /* ---------- 오늘 ---------- */
  function home() {
    const ss = mySessions(); const last = ss.find(s => s.csv); const m = last ? D.metrics(D.imu(last, me), me) : null;
    const body = (actor ? '<div class="note warn">' + icon('users') + '<div><b>' + actor + ' 대리 입력 중</b> — 정보주체는 ' + me.id + '. 모든 입력에 "대리 입력"이 표기됩니다.</div></div>' : '') +
      (consentOk() ? '' : '<div class="note crit">' + icon('lock') + '<div><b>민감정보 별도 동의가 없습니다.</b> 센서 CSV 업로드가 차단돼 있습니다. 「내 정보」에서 동의하면 바로 열립니다.</div></div>') +
      '<div class="card rv"><div class="h"><b>최근 세션</b>' + (last ? '<span class="muted body-s">' + fmtDateK(last.date) + '</span>' : '') + '</div>' +
      (m ? '<div class="stage mini" id="homeStage" style="min-height:230px;margin:-4px -4px 12px"><canvas id="homeCv"></canvas><div class="hud-b" style="left:10px;right:10px;bottom:10px"><div class="seg" id="hv"><button data-v="front" aria-pressed="true">정면</button><button data-v="side">측면</button><button data-v="back">후면</button></div></div></div>' +
        '<div class="stat-stack"><div><span class="n ' + (m.asym > 0 ? 'ink-r' : 'ink-l') + '">' + Math.abs(m.asym).toFixed(0) + '<span style="font-size:14px;font-weight:500">%</span></span><span class="l">' + sideK(m.asym > 0 ? 'R' : 'L') + '으로 치우침 · ' + ((m.asym > 0 ? 'R' : 'L') === sound(me) ? '건측' : '절단측') + '</span></div><div><span class="n">' + (sound(me) === 'R' ? m.rotR / (m.rotL || 1) : m.rotL / (m.rotR || 1)).toFixed(2) + '<span style="font-size:14px;font-weight:500">×</span></span><span class="l">회전 비 건측/절단측</span></div><div><span class="n">' + ss.length + '</span><span class="l">세션 · CSV ' + ss.filter(s => s.csv).length + '</span></div></div>' +
        '<button class="btn block" style="margin-top:12px" data-open="' + last.id + '">' + icon('eye') + '세션 자세히</button>' : '<div class="empty"><div class="dash">—</div><b>아직 센서 기록이 없습니다.</b>세션을 기록하고 CSV를 올려 보세요.</div>') + '</div>' +
      '<div class="card rv"><div class="h"><b>내 추이</b><span class="muted body-s">최근 ' + ss.filter(s => s.csv).length + '세션 기준</span></div><div class="chart" style="height:64px"><canvas id="homeSpark"></canvas></div><p class="help" style="margin-top:8px">치우침 |%| · 다른 선수 평균은 보여 드리지 않습니다 — 실증 인원이 적어 평균과 내 값만으로 다른 선수가 역산될 수 있습니다.</p></div>' +
      '<button class="cta-big rv" data-go="new">' + icon('plus') + '<span>오늘 세션 기록<small>종목 · 시간 · 착용 제품 (미리 채워져 있음)</small></span></button>' +
      '<button class="cta-big sub rv" data-go="upload">' + icon('upload') + '<span>센서 CSV 올리기<small>탭 한 번 · 단위·방향·시간 자동 검사</small></span></button>' +
      '<div class="row" style="justify-content:center">' + DISCLAIMER + '</div>';
    shell('안녕하세요, ' + me.id, body, 'home', { sub: sportName(me.sport) + ' · ' + sideK(me.amp.side) + ' ' + D.AMP_LEVELS[me.amp.level], right: '<button class="btn icon ghost" id="lo" aria-label="로그아웃">' + icon('logout') + '</button>' });
    $('#lo').onclick = logout;
    $$('[data-open]').forEach(b => b.onclick = () => go('session/' + b.dataset.open));
    if (m) { const B = Body3D.mount($('#homeCv'), { mode: 'symmetry', amputation: me.amp, colors: BODY_COLORS, dark: true, labels: false, yaw: 0, pitch: .05, zoom: 1.05, wheelZoom: false }); B.setHeat(m.heat, true); onLeave(() => B.destroy()); $$('#hv button').forEach(b => b.onclick = () => { $$('#hv button').forEach(x => x.setAttribute('aria-pressed', x === b)); B.setView({ front: 0, side: 90, back: 180 }[b.dataset.v], 4, true); }); }
    const vals = ss.filter(s => s.csv).map(s => Math.abs((D.summary(s) || {}).asym || 0)).reverse(); if (vals.length > 1) Charts.animate(600, e => Charts.spark($('#homeSpark'), { data: vals, color: css('--accent'), progress: e, lineWidth: 2 }));
  }

  /* ---------- 내 기록 ---------- */
  function sessions() {
    const ss = mySessions();
    const body = '<div class="stack rv-rows" style="gap:8px">' + ss.map(s => '<button class="list-row" data-open="' + s.id + '"><span class="t"><b>' + fmtDateK(s.date) + ' ' + s.time + '</b><small>' + sportName(s.sport) + ' · ' + s.type + ' · ' + fmtDur(s.duration) + ' · ' + s.bra + ' ' + s.braVersion + '</small></span><span class="stack" style="gap:4px;justify-items:end">' + (s.csv ? '<span class="badge good">' + icon('check') + 'CSV</span>' : '<span class="badge warn">CSV 없음</span>') + (s.fit ? '<span class="badge">평가</span>' : '<span class="badge" style="opacity:.5">평가 전</span>') + '</span>' + icon('chevR', 'chev') + '</button>').join('') + '</div>' + (ss.length ? '' : '<div class="empty"><div class="dash">—</div><b>기록이 없습니다.</b></div>');
    shell('내 기록', body, 'sessions', { sub: '세션 ' + ss.length + '회 · 본인 것만', right: '<button class="btn icon ghost" data-go="new" aria-label="세션 기록">' + icon('plus') + '</button>' });
    $$('[data-open]').forEach(b => b.onclick = () => go('session/' + b.dataset.open));
  }

  /* ---------- 세션 상세 ---------- */
  function session(parts) {
    const s = D.sessions().find(x => x.id === parts[0]);
    if (!s || s.athlete !== me.id) { // 권한 분리 — 타 선수 세션은 존재하지 않는 것처럼
      log('타 선수 세션 조회 시도', '/session/' + parts[0] + ' → 0건 (권한 거부)', s ? s.athlete : '-', true);
      shell('세션', '<div class="card"><div class="empty"><div class="dash">' + icon('lock') + '</div><b>조회할 수 있는 기록이 없습니다. (0건)</b>본인 익명 ID의 기록만 조회됩니다. 이 시도는 접속기록에 남았습니다.</div></div>', 'sessions', { back: 'sessions' }); return;
    }
    log('본인 세션 조회', s.id);
    const bra = D.PRODUCTS.find(p => p.id === s.bra);
    let body = '<div class="card pad-s rv"><div class="row between"><div><b>' + sportName(s.sport) + ' · ' + s.type + '</b><div class="muted body-s">' + fmtDur(s.duration) + ' · ' + (bra ? bra.name : s.bra) + ' ' + s.braVersion + ' ' + s.braSize + ' · 의수 ' + s.profile.prosthesis + '</div></div>' + (s.csv ? '<span class="badge good">CSV</span>' : '<span class="badge warn">CSV 없음</span>') + '</div></div>';
    if (!s.csv) body += '<div class="card rv"><div class="empty"><div class="dash">—</div><b>센서 기록이 아직 없습니다.</b>CSV를 올리면 3D 바디와 그래프가 계산됩니다.</div><button class="cta-big" data-go="upload/' + s.id + '">' + icon('upload') + '<span>이 세션에 CSV 올리기<small>탭 한 번</small></span></button></div>';
    else body += '<div class="stage mini rv" id="sStage" style="min-height:300px"><canvas id="sCv"></canvas><div class="hud"><div class="seg" id="sMode"><button data-m="heat" aria-pressed="true">부하</button><button data-m="symmetry">좌/우</button><button data-m="fit">압박</button></div></div><div class="hud-b"><div class="seg" id="sView"><button data-v="front" aria-pressed="true">정면</button><button data-v="side">측면</button><button data-v="back">후면</button></div><button class="chip" id="sRot">' + icon('rotate') + '자동 회전</button></div></div>' +
      '<div class="card rv"><div class="h"><b>좌 · 우 분포</b><div class="seg" id="sAxis"><button data-ax="lr" aria-pressed="true">좌/우</button><button data-ax="side">절단측/건측</button></div></div><div class="chart" style="height:88px"><canvas id="sGauge"></canvas></div><div id="sMirror" class="stack" style="gap:8px;margin-top:8px"></div><p class="help" style="margin-top:8px">브라 속 센서 1개가 알려주는 좌우는 팔이 아니라 몸통이 좌우로 기울고 도는 정도입니다.</p></div>' +
      '<div class="card rv"><div class="h"><b>기울기 · 회전</b><div class="seg" id="sRange"><button data-r="all">전체</button><button data-r="60" aria-pressed="true">1분</button><button data-r="10">10초</button></div></div><div class="legend" style="margin-bottom:6px"><span><i style="background:var(--ax-x)"></i>기울기</span><span><i style="background:var(--ax-z)"></i>회전</span></div><div class="chart" style="height:150px"><canvas id="sTs"></canvas></div><div class="row" style="margin-top:8px;justify-content:space-between"><button class="btn sm" id="sPrev">' + icon('chevL') + '이전 구간</button><span class="bracket" id="sRng"></span><button class="btn sm" id="sNext">다음 구간' + icon('chevR') + '</button></div></div>';
    body += '<div class="card rv"><div class="h"><b>착용 평가</b>' + (s.fit ? '<span class="badge good">완료</span>' : '<span class="badge warn">전</span>') + '</div>' + (s.fit ? D.FIT_ITEMS.map(i => '<div class="mrow" style="padding:6px 0"><span class="k body-s">' + i.label + '</span><span class="v"><span class="bar" style="width:72px"><i data-w="' + (s.fit[i.key] / 5 * 100) + '%"></i></span><span class="num">' + s.fit[i.key] + '</span></span></div>').join('') + (s.fitComment ? '<p class="help" style="margin-top:6px">“' + esc(s.fitComment) + '”</p>' : '') : '<p class="help">운동 직후 편안함·지지·한 손 착탈을 1~5로 기록하면 브라 버전 비교에 쓰입니다.</p>') + '<button class="btn block' + (s.fit ? '' : ' primary') + '" style="margin-top:10px" data-go="eval/' + s.id + '">' + icon('edit') + (s.fit ? '평가 수정' : '착용 평가하기') + '</button></div>' +
      '<div class="row" style="justify-content:center">' + DISCLAIMER + '</div>';
    shell(fmtDateK(s.date) + ' ' + s.time, body, 'sessions', { back: 'sessions', sub: s.id + ' · ' + me.id });
    if (!s.csv) return;
    const series = D.imu(s, me); const st = { range: [0, 60], axis: 'lr' };
    const B = Body3D.mount($('#sCv'), { mode: 'heat', amputation: me.amp, colors: BODY_COLORS, dark: true, regionNames: Body3D.REGION_NAMES, yaw: 0, pitch: .05, zoom: 1.05, wheelZoom: false, onPick: (r, v) => toast('<b>' + Body3D.REGION_NAMES[r] + '</b> 부하 ' + Math.round((v || 0) * 100) + '%', 'info') });
    const M = D.metrics(series, me); B.setHeat(M.heat, true); onLeave(() => B.destroy());
    $$('#sMode button').forEach(b => b.onclick = () => { $$('#sMode button').forEach(x => x.setAttribute('aria-pressed', x === b)); B.setMode(b.dataset.m); });
    $$('#sView button').forEach(b => b.onclick = () => { $$('#sView button').forEach(x => x.setAttribute('aria-pressed', x === b)); B.setView({ front: 0, side: 90, back: 180 }[b.dataset.v], 4, true); });
    let rot = false; $('#sRot').onclick = () => { rot = !rot; $('#sRot').classList.toggle('on', rot); B.setAutoRotate(rot); };
    const draw = () => {
      const m = D.metrics(series, me, st.range); const flip = st.axis === 'side' && me.amp.side === 'R'; const v = flip ? -m.asym : m.asym; const sd = sound(me);
      const lab = side => st.axis === 'lr' ? sideK(side) : (side === sd ? '건측' : '절단측');
      Charts.gauge($('#sGauge'), { value: v, leftLabel: lab(flip ? 'R' : 'L'), rightLabel: lab(flip ? 'L' : 'R'), tolerance: 5 });
      const rows = [['±2° 밖 시간', m.tL / series.hz, m.tR / series.hz, 's'], ['회전 피크 평균', m.rotL, m.rotR, '°']];
      $('#sMirror').innerHTML = rows.map(r => { const L = flip ? r[2] : r[1], R = flip ? r[1] : r[2]; const mx = Math.max(L, R) || 1; return '<div><div class="row between body-s" style="margin-bottom:3px"><span class="muted">' + r[0] + '</span></div><div class="mirror" style="grid-template-columns:1fr 110px 1fr"><div class="lb"><i data-w="' + (L / mx * 100) + '%"></i></div><div class="c"><span class="num ink-l">' + fmtN(L, r[3] === 's' ? 0 : 1) + '</span> <span class="muted">' + r[3] + '</span> <span class="num ink-r">' + fmtN(R, r[3] === 's' ? 0 : 1) + '</span></div><div class="rb"><i data-w="' + (R / mx * 100) + '%"></i></div></div></div>'; }).join(''); growBars($('#sMirror'));
      const ds = D.downsample(series, ['roll', 'yaw'], 700, st.range);
      Charts.timeseries($('#sTs'), { t: ds.t, series: [{ key: 'roll', label: '기울기', data: ds.roll, color: css('--ax-x') }, { key: 'yaw', label: '회전', data: ds.yaw, color: css('--ax-z') }], unit: '°', padL: 36, bands: st.range && st.range[0] < 8 && s.profile.calibration ? [{ from: 0, to: 5, color: css('--ink-3'), alpha: .08, label: '정지' }, { from: 5, to: 8, color: css('--left'), alpha: .1, label: '왼쪽' }] : [] });
      $('#sRng').textContent = st.range ? st.range[0].toFixed(0) + 's → ' + st.range[1].toFixed(0) + 's' : '0 → ' + fmtDur(s.duration);
    };
    $$('#sAxis button').forEach(b => b.onclick = () => { $$('#sAxis button').forEach(x => x.setAttribute('aria-pressed', x === b)); st.axis = b.dataset.ax; draw(); });
    $$('#sRange button').forEach(b => b.onclick = () => { $$('#sRange button').forEach(x => x.setAttribute('aria-pressed', x === b)); const r = b.dataset.r; st.range = r === 'all' ? null : [st.range ? st.range[0] : 0, (st.range ? st.range[0] : 0) + Number(r)]; draw(); });
    const shift = dir => { if (!st.range) return; const w = st.range[1] - st.range[0]; const end = series.t[series.n - 1]; let a = Math.max(0, Math.min(end - w, st.range[0] + dir * w)); st.range = [a, a + w]; draw(); };
    $('#sPrev').onclick = () => shift(-1); $('#sNext').onclick = () => shift(1);
    draw();
  }

  /* ---------- 세션 기록 (프리필) ---------- */
  function newSession() {
    if (actor && D.DELEGATIONS.find(d => d.athlete === me.id && d.delegate === actor && d.scope === 'view')) { toast('조회만 위임된 관계자는 입력할 수 없습니다', 'crit'); go('home'); return; }
    const last = mySessions()[0]; const bra = D.PRODUCTS.find(p => p.id === ((last && last.bra) || 'SB-A'));
    const body = '<div class="card rv stack"><div class="field"><label>종목</label><select class="select" id="nSport" style="height:48px">' + Object.keys(D.SPORTS).map(k => '<option value="' + k + '"' + (k === me.sport ? ' selected' : '') + '>' + D.SPORTS[k].name + '</option>').join('') + '</select></div><div class="form-grid"><div class="field"><label>일자</label><input class="input" type="date" id="nDate" value="' + D.TODAY + '" style="height:48px"></div><div class="field"><label>시작</label><input class="input" type="time" id="nTime" value="10:30" style="height:48px"></div></div><div class="field"><label>운동 시간 (분)</label><div class="seg lg" id="nDur">' + [10, 20, 30, 45].map(v => '<button data-v="' + v + '"' + (v === 20 ? ' aria-pressed="true"' : '') + '>' + v + '</button>').join('') + '</div></div></div>' +
      '<div class="card rv stack"><div class="h"><b>착용 제품</b><span class="muted body-s">지난 세션 그대로</span></div><div class="field"><label>스포츠브라</label><select class="select" id="nBra" style="height:48px">' + D.PRODUCTS.filter(p => p.type === 'bra').map(p => '<option value="' + p.id + '"' + (p.id === bra.id ? ' selected' : '') + '>' + p.name + ' ' + p.current + '</option>').join('') + '</select></div><div class="field"><label>사이즈</label><div class="chips" id="nSize">' + bra.sizes.map(v => '<button class="chip' + ((last ? last.braSize : bra.sizes[2]) === v ? ' on' : '') + '" data-v="' + v + '" style="height:40px;padding:0 14px">' + v + '</button>').join('') + '</div></div><div class="field"><label>의수</label><div class="seg lg" id="nPro">' + ['없음', '일상용', '스포츠용'].map((v, i) => '<button data-v="' + v + '"' + (i === 0 ? ' aria-pressed="true"' : '') + '>' + v + '</button>').join('') + '</div></div><label class="check on"><input type="checkbox" id="nCal" checked><div><b>시작 보정 동작을 했어요</b><div class="help">5초 가만히 + 왼쪽으로 3초 기울이기</div></div></label></div>' +
      '<button class="cta-big rv" id="nSave">' + icon('check') + '<span>저장하고 CSV 올리기<small>' + (actor ? actor + ' 대리 입력으로 기록됩니다' : '본인 입력으로 기록됩니다') + '</small></span></button>';
    shell('오늘 세션 기록', body, 'home', { back: 'home' });
    $$('#nDur button, #nPro button').forEach(b => b.onclick = () => { $$('button', b.parentElement).forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $$('#nSize .chip').forEach(b => b.onclick = () => { $$('#nSize .chip').forEach(x => x.classList.toggle('on', x === b)); });
    $('#nSave').onclick = () => {
      const id = 'SES-' + String(D.sessions().length + 1).padStart(3, '0');
      const dur = Number($('#nDur [aria-pressed="true"]').dataset.v) * 60; const braId = $('#nBra').value; const p = D.PRODUCTS.find(x => x.id === braId);
      D.patchSession(id, { id, athlete: me.id, date: $('#nDate').value, time: $('#nTime').value, duration: dur, sport: $('#nSport').value, type: '훈련', bra: braId, braVersion: p.current, braSize: ($('#nSize .chip.on') || {}).dataset ? $('#nSize .chip.on').dataset.v : p.sizes[0], drawers: 'DR-A', drawersVersion: 'v1.1', drawersSize: 'M', csv: null, rpe: 5, note: actor ? '관계자 ' + actor + ' 대리 입력' : '', fit: null, fitComment: '', profile: { sensorId: 'IMU-07A', firmware: '1.3.1', hz: 100, position: p.sensorPocket, orientation: '정방향', prosthesis: me.amp.level === 'limited' ? '해당 없음' : $('#nPro [aria-pressed="true"]').dataset.v, calibration: $('#nCal').checked, venue: '실내' } });
      log('세션 기록', id + (actor ? ' (대리)' : '')); toast('세션 ' + id + ' 저장', 'good'); go('upload/' + id);
    };
  }

  /* ---------- CSV 올리기 (탭 한 번) ---------- */
  function upload(parts) {
    const ss = mySessions(); let s = parts[0] ? ss.find(x => x.id === parts[0]) : (ss.find(x => !x.csv) || ss[0]);
    if (!consentOk()) { shell('CSV 올리기', '<div class="note crit">' + icon('lock') + '<div><b>업로드가 차단돼 있습니다.</b> 장애·신체 정보와 결합되는 센서 데이터는 민감정보 별도 동의 전에 저장할 수 없습니다.</div></div><button class="cta-big" data-go="me">' + icon('shield') + '<span>내 정보에서 동의하기<small>동의서 v1.2 · 민감정보 별도 동의</small></span></button>', 'upload'); return; }
    if (!s) { shell('CSV 올리기', '<div class="empty"><div class="dash">—</div><b>먼저 세션을 기록하세요.</b></div><button class="cta-big" data-go="new">' + icon('plus') + '<span>오늘 세션 기록</span></button>', 'upload'); return; }
    const FX = IO.fixtures();
    const body = '<div class="card pad-s rv"><div class="row between"><div><b>' + fmtDateK(s.date) + ' ' + s.time + '</b><div class="muted body-s">' + sportName(s.sport) + ' · ' + fmtDur(s.duration) + ' · ' + s.id + '</div></div><button class="btn sm" id="pickSes">바꾸기</button></div></div>' +
      '<label class="file-btn rv" style="min-height:160px">' + icon('upload') + '<span style="font-size:16px">파일 선택 (탭 한 번)</span><small>센서 앱이 저장한 CSV · 최대 50MB</small><input type="file" accept=".csv,text/csv" class="sr" id="aFile"></label>' +
      '<div class="eyebrow ko rv">샘플로 체험</div><div class="stack rv" style="gap:8px">' + [['good', '정상 파일'], ['flip', '센서를 뒤집어 단 파일'], ['unit', '단위가 바뀐 파일 (m/s² · rad/s)'], ['utc', '시간이 9시간 어긋난 파일'], ['sci', '엑셀로 열었다 저장한 파일']].map(x => { const f = FX.find(y => y.id === x[0]); return '<button class="list-row" data-fx="' + x[0] + '"><span class="badge ' + (f.expect === 'pass' ? 'good' : f.expect === 'warn' ? 'warn' : 'crit') + '">' + ({ pass: '통과', warn: '경고', block: '차단' })[f.expect] + '</span><span class="t"><b>' + x[1] + '</b></span>' + icon('chevR', 'chev') + '</button>'; }).join('') + '</div><div id="aResult"></div>';
    shell('CSV 올리기', body, 'upload', { sub: '단위 · 방향 · 시간 자동 검사' });
    $('#pickSes').onclick = () => { const m = modal('<div class="panel-h"><div class="heading">세션 선택</div><button class="btn icon ghost sm" data-close>' + icon('close') + '</button></div><div class="panel-b stack" style="gap:8px">' + ss.map(x => '<button class="list-row" data-s="' + x.id + '"><span class="t"><b>' + fmtDateK(x.date) + ' ' + x.time + '</b><small>' + x.id + (x.csv ? ' · CSV 있음' : '') + '</small></span></button>').join('') + '</div>'); $$('[data-s]', m.el).forEach(b => b.onclick = () => { m.close(); go('upload/' + b.dataset.s); }); };
    const run = (text, name) => {
      const box = $('#aResult'); box.innerHTML = '<div class="card scan"><div class="row"><span class="spin"></span><b>검사 중 — ' + esc(name) + '</b></div><div class="progress" style="margin-top:10px"><i id="pg"></i></div></div>'; setTimeout(() => { const i = $('#pg'); if (i) i.style.width = '70%'; }, 50);
      setTimeout(() => {
        const p = IO.parseCSV(text); const v0 = IO.validate(p.rows, p.mapping, { headerRow: p.header }); const v = v0.ok ? IO.applyFixes(v0) : v0;
        const ph = v0.ok ? IO.physicsCheck(v, { date: s.date, time: s.time, duration: s.duration, declaredHz: s.profile.hz }, v0.rawT) : { level: 'block', checks: v0.errors.filter(e => e.fatal).map(e => ({ level: 'block', title: e.msg, detail: '' })) };
        const fixes = ph.checks.filter(c => c.fix && c.level === 'warn');
        box.innerHTML = '<div class="card" id="resCard"><div class="h"><b>' + ({ pass: '통과 — 연결할 수 있어요', warn: '경고 — 보정하면 연결할 수 있어요', block: '올릴 수 없는 파일이에요' })[ph.level] + '</b><span class="badge ' + (ph.level === 'pass' ? 'good' : ph.level === 'warn' ? 'warn' : 'crit') + ' count-in">' + ({ pass: '통과', warn: '경고', block: '차단' })[ph.level] + '</span></div><div class="checks" style="margin-bottom:12px">' + ph.checks.filter(c => c.level !== 'pass').concat(ph.checks.filter(c => c.level === 'pass').slice(0, 3)).map(c => '<div class="' + c.level + '"><span class="ic">' + icon(c.level === 'pass' ? 'check' : c.level === 'warn' ? 'alert' : 'close') + '</span><div><b>' + esc(c.title) + '</b><p>' + esc(c.detail) + '</p></div></div>').join('') + '</div>' +
          (fixes.length ? fixes.map(c => '<label class="check on" style="margin-bottom:8px"><input type="checkbox" checked data-fix="' + c.fix + '"><div><b>' + ({ acc_ms2: '가속도를 g로 환산', gyro_rad: '각속도를 °/s로 환산', rad: '각도를 °로 환산', utc9: '시간을 한국 시간으로 보정', flip: '좌우 반전 적용' })[c.fix] + '</b><div class="help">원본 파일은 그대로, 보정만 기록돼요</div></div></label>').join('') : '') +
          (ph.level === 'block' ? '<p class="help">센서 앱이 만든 원본 CSV를 다시 올려 주세요.</p>' : '<button class="cta-big" id="aCommit">' + icon('link') + '<span>이 세션에 연결<small>' + fmtN(v.rows) + '행 · ' + (v.stats.hz || 0).toFixed(0) + 'Hz · ' + (v.stats.duration / 60).toFixed(1) + '분</small></span></button>') + '</div>';
        reveal(box); box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const c = $('#aCommit'); if (c) c.onclick = () => { const fx = $$('[data-fix]:checked').map(x => x.dataset.fix); D.patchSession(s.id, { csv: { file: name, hz: Math.round(v.stats.hz) || 100, rows: v.rows, uploadedAt: D.TODAY + ' ' + new Date().toTimeString().slice(0, 5), by: actor ? 'delegate' : 'athlete', fingerprint: p.fingerprint, mappingVersion: 'map-v2', processor: 'proc-v1.2', fixes: fx } }); log('CSV 업로드' + (actor ? '(대리)' : ''), s.id + ' · ' + name + (fx.length ? ' · 보정 ' + fx.join(',') : '')); toast('연결했어요 — 3D 바디와 그래프를 계산했습니다', 'good'); go('session/' + s.id); };
      }, 700);
    };
    $$('[data-fx]').forEach(b => b.onclick = () => { const f = FX.find(x => x.id === b.dataset.fx); run(f.csv, 'imu_' + me.id.toLowerCase().replace('-', '') + '_' + s.date.replace(/-/g, '') + '.csv'); });
    $('#aFile').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => run(r.result, f.name); r.readAsText(f); };
  }

  /* ---------- 착용 평가 (1~5 탭) ---------- */
  function evaluate(parts) {
    const s = mySessions().find(x => x.id === parts[0]); if (!s) { go('sessions'); return; }
    const cur = Object.assign({}, s.fit || {}); const bra = D.PRODUCTS.find(p => p.id === s.bra); let parts2 = new Set(s.fitParts || []);
    const body = '<div class="card pad-s rv"><b>' + (bra ? bra.name : s.bra) + ' ' + s.braVersion + ' · ' + s.braSize + '</b><div class="muted body-s">이 평가는 제품·버전·사이즈에 고정돼 버전 비교에 쓰여요</div></div>' +
      D.FIT_ITEMS.map(i => '<div class="card pad-s rv"><div class="row between" style="margin-bottom:8px"><b>' + i.label + '</b>' + (i.key === 'donning' ? '<span class="badge accent">한 손</span>' : '') + '</div><div class="scale5" data-k="' + i.key + '">' + [1, 2, 3, 4, 5].map(v => '<button aria-pressed="' + (cur[i.key] === v) + '" data-v="' + v + '">' + v + '</button>').join('') + '</div><div class="scale-ends"><span>' + i.low + '</span><span>' + i.high + '</span></div></div>').join('') +
      '<div class="card pad-s rv"><b>불편한 부위</b><div class="chips" style="margin-top:8px">' + ['어깨끈 절단측', '어깨끈 건측', '밑밴드', '컵', '등판', '센서 포켓'].map(p => '<button class="chip' + (parts2.has(p) ? ' on' : '') + '" data-p="' + p + '" style="height:40px;padding:0 14px">' + p + '</button>').join('') + '</div></div>' +
      '<div class="card pad-s rv"><b>메모 (한 줄)</b><input class="input" id="eMemo" value="' + esc(s.fitComment || '') + '" placeholder="예: 밑단이 운동 중 조금 말려 올라감" style="margin-top:8px;height:48px"><button class="btn sm ghost" id="eSample" style="margin-top:6px">예시 문구 넣기</button></div>' +
      '<button class="cta-big rv" id="eSave">' + icon('check') + '<span>평가 저장<small>7항목 · 1 좋음 ~ 5 나쁨</small></span></button>';
    shell('착용 평가', body, 'sessions', { back: 'session/' + s.id, sub: fmtDateK(s.date) + ' ' + s.time });
    $$('.scale5 button').forEach(b => b.onclick = () => { const k = b.parentElement.dataset.k; cur[k] = Number(b.dataset.v); $$('button', b.parentElement).forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $$('[data-p]').forEach(b => b.onclick = () => { const p = b.dataset.p; parts2.has(p) ? parts2.delete(p) : parts2.add(p); b.classList.toggle('on', parts2.has(p)); });
    $('#eSample').onclick = () => { $('#eMemo').value = '-압박감이 밴드 쪽에 집중되고 어깨끈이 건측으로 쏠림'; toast("'-'로 시작하는 문장 — 내보낼 때 수식 주입 방지 처리됩니다", 'info'); };
    $('#eSave').onclick = () => { const missing = D.FIT_ITEMS.filter(i => !cur[i.key]); if (missing.length) { toast('아직 ' + missing.length + '개 항목이 남았어요 — ' + missing[0].label, 'warn'); const el2 = $('.scale5[data-k="' + missing[0].key + '"]'); if (el2) el2.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; } D.patchSession(s.id, { fit: cur, fitParts: [...parts2], fitComment: $('#eMemo').value }); log('착용 평가' + (actor ? '(대리)' : ''), s.id); toast('평가를 저장했어요', 'good'); go('session/' + s.id); };
  }

  /* ---------- 내 정보 · 동의 · 위임 ---------- */
  function meView() {
    const c = D.consentOf(me.id); const dele = D.DELEGATIONS.filter(d => d.athlete === me.id && !(D.load().revoked || []).includes(d.delegate));
    const body = '<div class="card rv"><div class="h"><b>' + me.id + '</b><span class="badge mono">' + me.cls + '</span></div>' + [['종목', sportName(me.sport)], ['절단 · 제한', sideK(me.amp.side) + ' ' + D.AMP_LEVELS[me.amp.level]], ['건측', sideK(sound(me))], ['신체', me.height + 'cm · ' + me.weight + 'kg · 밑가슴 ' + me.underbust + 'cm'], ['참여일', fmtDate(me.joined)]].map(r => '<div class="mrow"><span class="k">' + r[0] + '</span><span class="v">' + r[1] + '</span></div>').join('') + '<p class="help" style="margin-top:8px">실명·연락처는 이 시스템에 없습니다. 매핑 담당 1인만 별도 보관함에서 사유를 남기고 봅니다.</p></div>' +
      '<div class="card rv"><div class="h"><b>동의 상태</b><span class="badge mono">' + (c.version || '-') + '</span></div>' +
      [['개인정보 수집·이용', c.personal], ['민감정보(장애·신체) 별도 동의', c.sensitive], ['연구 참여 (IRB ' + (c.irb || '-') + ')', c.research]].map(r => '<div class="mrow"><span class="k">' + r[0] + '</span><span class="v">' + (r[1] ? '<span class="badge good">동의</span>' : '<span class="badge crit">없음</span>') + '</span></div>').join('') +
      '<div class="mrow"><span class="k">보관 만료</span><span class="v">' + (c.retainUntil ? fmtDate(c.retainUntil) : '-') + '</span></div>' +
      (c.sensitive ? '' : '<button class="cta-big" id="doConsent" style="margin-top:10px">' + icon('shield') + '<span>민감정보 별도 동의하기<small>동의하면 센서 업로드가 바로 열려요</small></span></button>') + '</div>' +
      '<div class="card rv"><div class="h"><b>관계자 위임</b></div>' + (dele.length ? dele.map(d => '<div class="mrow"><span class="k">' + d.name + ' · ' + (d.scope === 'input' ? '입력만' : '입력+조회') + '<div class="muted body-s">~' + fmtDate(d.until) + '</div></span><span class="v"><button class="btn sm" data-revoke="' + d.delegate + '">철회</button></span></div>').join('') : '<p class="help">위임한 관계자가 없습니다.</p>') + '</div>' +
      '<div class="card rv"><div class="h"><b>내 데이터 요구</b></div><div class="row"><button class="btn" id="reqView">' + icon('eye') + '열람</button><button class="btn danger" id="reqDel">' + icon('trash') + '삭제 요구</button></div><p class="help" style="margin-top:8px">요구는 접속기록과 동의·보관 화면에 남고 담당자가 처리합니다. 연구 기록 보관 의무와 충돌하면 동의서 조항을 따릅니다.</p></div>' +
      '<button class="btn block" id="lo2">' + icon('logout') + '로그아웃</button>';
    shell('내 정보', body, 'me');
    const dc = $('#doConsent'); if (dc) dc.onclick = () => { D.patchConsent(me.id, { sensitive: true, version: 'v1.2', date: D.TODAY, retainUntil: '2029-11-30' }); log('민감정보 별도 동의', 'v1.2'); toast('동의가 기록됐어요 — 업로드가 열렸습니다', 'good'); meView(); };
    $$('[data-revoke]').forEach(b => b.onclick = () => { const st = D.load(); st.revoked = st.revoked || []; st.revoked.push(b.dataset.revoke); D.save(); log('위임 철회', b.dataset.revoke); toast('위임을 철회했어요', 'good'); meView(); });
    $('#reqView').onclick = () => { log('열람 요구', ''); toast('열람 요구를 접수했어요 — 10일 내 처리', 'good'); };
    $('#reqDel').onclick = () => { log('삭제 요구', ''); toast('삭제 요구를 접수했어요 — 담당자가 보관 의무를 확인한 뒤 처리합니다', 'warn', 4000); };
    $('#lo2').onclick = logout;
  }

  /* ---------- 라우터 ---------- */
  const routes = { home, sessions, session, new: newSession, upload, eval: evaluate, me: meView };
  // 모든 라우트는 로그인 가드를 거친다. ?as=ATH-0001(&actor=C-02) 로 바로 들어갈 수 있다(체험·검증용).
  const guarded = {};
  Object.keys(routes).forEach(k => guarded[k] = (p, q, r) => {
    if (!me) {
      if (q.as) { const a = D.athletes().find(x => x.id === q.as.toUpperCase()); if (a) { me = a; actor = q.actor || null; try { sessionStorage.setItem('athledger.athlete', JSON.stringify({ me: a.id, actor })); } catch (e) { } } }
      if (!me) { login(); return; }
    }
    routes[k](p, q, r);
  });
  const R = CORE.router(guarded, () => { });
  if (!location.hash) location.hash = '#/home'; else R.go();
})(window);
