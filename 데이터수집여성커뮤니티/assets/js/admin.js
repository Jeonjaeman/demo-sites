/* ============================================================
   HERLOOP 관리자 — 요구사항 2-3 백오피스
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const nf = n => n.toLocaleString('ko-KR');

let page = 'dash';
let expose = 'excerpt';           // 기본: 제목 + 짧은 발췌
let reports = JSON.parse(JSON.stringify(REPORTS));
let members = JSON.parse(JSON.stringify(MEMBERS));
let sources = JSON.parse(JSON.stringify(SOURCES));

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.35s'; setTimeout(() => el.remove(), 350); }, 3400);
}

/* ============================================================
   대시보드
   ============================================================ */
function vDash() {
  const own = POSTS.filter(p => p.type === 'own').length;
  const ext = POSTS.filter(p => p.type === 'ext').length;
  const ownRate = (own / POSTS.length * 100).toFixed(0);
  const urgent = reports.filter(r => r.st === 'wait' && r.urgent).length;
  const verified = members.filter(m => m.verified).length;

  return `
    ${urgent ? `<div class="note bad">🛡<div>
      <b>긴급 신고 ${urgent}건이 대기 중입니다.</b> 개인정보 노출·성적 괴롭힘·불법촬영물 의심은
      이미 가림 처리되었지만 <b>검토 후 조치</b>가 필요합니다 —
      <a href="javascript:goPage('reports')" style="color:#A3231A;font-weight:800;text-decoration:underline">신고 처리</a>
    </div></div>` : ''}

    <div class="kpis">
      <div class="kpi"><div class="l">전체 게시글</div><div class="v mono">${nf(POSTS.length)}</div>
        <div class="s">크롤링 ${ext} · 자체 ${own}</div></div>
      <div class="kpi"><div class="l">자체 글 비율 ★</div><div class="v mono">${ownRate}<small style="font-size:14px">%</small></div>
        <div class="s ${ownRate >= 40 ? 'up' : 'warn'}">시장 검증의 핵심 지표</div></div>
      <div class="kpi"><div class="l">본인확인 회원</div><div class="v mono">${verified}<small style="font-size:14px">/${members.length}</small></div>
        <div class="s">미확인 ${members.length - verified}명은 읽기만 가능</div></div>
      <div class="kpi"><div class="l">긴급 신고</div><div class="v mono" style="color:var(--bad)">${urgent}</div>
        <div class="s bad">즉시 가림 후 검토 대기</div></div>
    </div>

    <div class="note info">📊<div>
      <b>시장 검증 지표는 조회수가 아니라 "자체 글 작성률"입니다.</b>
      크롤링 콘텐츠는 유입 재료일 뿐, 커뮤니티가 살아 있는지는 <b>회원이 직접 쓴 글과 댓글</b>에서 드러납니다.
      그래서 이 두 지표를 대시보드 전면에 두었습니다.
    </div></div>

    <div class="pnl">
      <div class="pnl-hd"><h2>🤖 크롤링 상태</h2><span class="sub">요구사항 2-3 · 수집 동작 및 에러 로그</span>
        <div class="r"><button class="abtn sm" onclick="goPage('crawl')">설정 →</button></div></div>
      <div class="pnl-bd">
        <div class="tw"><table class="t">
          <thead><tr><th>대상</th><th>robots.txt</th><th style="text-align:right">딜레이</th><th style="text-align:right">수집</th><th style="text-align:right">실패</th><th>최근 실행</th><th>상태</th></tr></thead>
          <tbody>${sources.map(s => `
            <tr>
              <td><b>${s.name}</b> <span class="faint mono" style="font-size:11.5px">${s.host}</span></td>
              <td><span class="pill ${s.robots.includes('제외') ? 'p-warn' : 'p-ok'}">${s.robots}</span></td>
              <td style="text-align:right" class="mono">${s.delay}s</td>
              <td style="text-align:right" class="mono">${nf(s.ok)}</td>
              <td style="text-align:right" class="mono ${s.err > 5 ? '' : ''}" style="color:${s.err > 5 ? 'var(--bad)' : ''}">${s.err}</td>
              <td class="mono faint">${s.last}</td>
              <td><span class="pill ${s.on ? 'p-ok' : 'p-gray'}">${s.on ? '동작 중' : '중지'}</span></td>
            </tr>`).join('')}</tbody>
        </table></div>
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-hd"><h2>수집 로그</h2><span class="sub mono">2026-07-27 09:00 배치</span></div>
      <div class="pnl-bd">
        <div class="logbox">${CRAWL_LOG.map(([t, lv, m]) => `
          <div class="logline"><span class="t">${t}</span><span class="lv lv-${lv}">${lv.toUpperCase()}</span><span class="msg">${m}</span></div>`).join('')}</div>
      </div>
    </div>`;
}

/* ============================================================
   노출 방식 (핵심 제안 — 요구사항 3-2)
   ============================================================ */
function vExpose() {
  const cur = EXPOSE_MODES.find(m => m.id === expose);
  const sample = POSTS.find(p => p.type === 'ext');
  return `
    <div class="note warn">⚖️<div>
      요구사항 3-2에 <b>"단순 링크 아웃바운드 또는 요약 형태의 노출 방식 협의 필요"</b>라고 적어 주셨습니다.
      법적으로는 <b>링크는 복제에 해당하지 않아 자유</b>롭지만,
      <b>원문을 읽지 않아도 될 만큼 상세한 요약은 "전재"로 판단</b>되어 침해가 됩니다.
      아래에서 방식을 고르시면 실제 화면이 어떻게 바뀌는지 미리 보실 수 있습니다.
    </div></div>

    <div class="pnl">
      <div class="pnl-hd"><h2>크롤링 콘텐츠 노출 방식</h2>
        <span class="sub">선택한 방식이 서비스 전체에 적용됩니다</span></div>
      <div class="pnl-bd">
        <div class="expose">
          ${EXPOSE_MODES.map(m => `
            <div class="exp ${expose === m.id ? 'on' : ''}" onclick="setExpose('${m.id}')">
              <div class="exp-hd">
                <b>${m.name}</b>
                ${expose === m.id ? '<span class="pill p-brand" style="margin-left:auto">적용 중</span>' : ''}
              </div>
              <p>${m.desc}</p>
              <div class="risk ${m.risk}">${m.risk === 'low' ? '✓' : m.risk === 'mid' ? '⚠' : '✕'} ${m.riskTxt}</div>
            </div>`).join('')}
        </div>

        <div class="exp-preview">
          <div style="font-size:11.5px;font-weight:800;color:var(--ink-3);margin-bottom:11px;letter-spacing:.04em">
            미리보기 — 사용자 화면에 이렇게 보입니다</div>
          <div style="background:#fff;border:1px solid var(--line);border-left:3px solid var(--blue);border-radius:8px;padding:15px 16px">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <span class="pill p-blue">🔗 ${sample.src}</span>
              <span class="pill p-gray">${sample.cat}</span>
            </div>
            <div style="font-size:16px;font-weight:700;letter-spacing:-.3px">${sample.title}</div>
            ${expose === 'link' ? '' :
              expose === 'excerpt'
                ? `<p style="font-size:13.5px;color:var(--ink-2);line-height:1.75;margin-top:7px">${sample.excerpt}</p>`
                : `<p style="font-size:13.5px;color:var(--ink-2);line-height:1.75;margin-top:7px">${sample.excerpt}<br><br>
                   (본문 전체가 이어서 표시됩니다 — 원문을 방문할 이유가 사라지는 지점입니다)</p>`}
            <div style="display:flex;align-items:center;gap:8px;margin-top:11px;padding:10px 12px;background:var(--bg-2);border:1px solid var(--line);border-radius:8px;font-size:12.5px;color:var(--ink-2)">
              🔗 원문은 <b style="color:var(--ink)">${sample.host}</b> 에서 확인하세요
              <span style="margin-left:auto;color:var(--blue);font-weight:800">→</span>
            </div>
          </div>
        </div>

        ${expose === 'full' ? `
          <div class="note bad" style="margin:16px 0 0">✕<div>
            <b>전문 복제는 권장하지 않습니다.</b> 복제권·전송권 침해에 더해
            상당한 투자로 구축된 데이터베이스를 대량 수집하면 <b>DB제작자 권리</b> 침해가 별도로 성립합니다.
            경쟁사 콘텐츠 무단 수집으로 <b>총 4.5억원 배상</b> 판결이 확정된 사례가 있습니다.
          </div></div>` : ''}
        ${expose === 'link' ? `
          <div class="note ok" style="margin:16px 0 0">✓<div>
            <b>법적으로 가장 안전한 방식입니다.</b> 다만 제목만으로는 클릭 유인이 약해
            체류 시간이 짧아질 수 있습니다. 초기에는 이 방식으로 시작해 반응을 보고 조정하는 것도 방법입니다.
          </div></div>` : ''}
        ${expose === 'excerpt' ? `
          <div class="note info" style="margin:16px 0 0">⚠<div>
            <b>권장 기본값입니다.</b> 발췌는 <b>원문을 대체할 수 없는 분량</b>이어야 합니다.
            2~3줄을 넘기거나 결론까지 담으면 인용 범위를 벗어납니다. 본문 전체는 저장하지 않습니다.
          </div></div>` : ''}
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-hd"><h2>원문 상태 연동</h2><span class="sub">원문이 사라졌을 때의 처리</span></div>
      <div class="pnl-bd">
        <p style="font-size:13px;color:var(--ink-2);line-height:1.9">
          크롤링 글에 <b>회원 댓글이 쌓인 뒤 원문이 삭제되면</b>, 그 댓글도 함께 사라지는 문제가 생깁니다.
          이용자 입장에서는 자기 댓글이 이유 없이 없어지는 경험이 됩니다.<br><br>
          <b>허루프의 처리</b> — 크롤러가 원문 상태를 주기적으로 확인하고, 삭제가 감지되면
          <b>게시글은 비공개로 전환하되 댓글은 "원문이 삭제된 글"로 보존</b>합니다.
          원 저작자의 삭제 요청이 오면 즉시 같은 처리를 하고 기록을 남깁니다.
        </p>
        <div class="note ok" style="margin:14px 0 0">
          ✓<div>오늘 배치에서 <b>원문 삭제 2건</b>이 감지되어 자동 비공개 처리되었습니다 (수집 로그 참조).</div>
        </div>
      </div>
    </div>`;
}
function setExpose(id) { expose = id; render(); toast(`노출 방식을 <b>${EXPOSE_MODES.find(m=>m.id===id).name}</b>으로 변경했습니다`); }

/* ============================================================
   크롤링 설정
   ============================================================ */
function vCrawl() {
  return `
    <div class="note info">🤖<div>
      요구사항 3-1의 <b>딜레이 처리</b>는 예의 문제가 아니라 <b>법적 리스크와 직결</b>됩니다.
      법원은 크롤링의 형사책임을 판단할 때 <b>기술적 통제조치를 존중했는지</b>를 봅니다 —
      robots.txt 준수, 과도한 부하 회피, 로그인 벽 미우회가 그 기준입니다.
    </div></div>

    <div class="pnl">
      <div class="pnl-hd"><h2>수집 대상</h2><span class="sub">요구사항: 초기 1~2곳 협의</span>
        <div class="r"><button class="abtn p sm" onclick="toast('➕ 대상 추가 — robots.txt 자동 확인 후 등록됩니다')">＋ 대상 추가</button></div></div>
      <div class="pnl-bd">
        ${sources.map((s, i) => `
          <div style="border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:11px">
            <div style="display:flex;align-items:center;gap:9px;margin-bottom:12px">
              <b style="font-size:15px">${s.name}</b>
              <span class="faint mono" style="font-size:12px">${s.host}</span>
              <span class="pill ${s.on ? 'p-ok' : 'p-gray'}" style="margin-left:auto">${s.on ? '동작 중' : '중지'}</span>
              <button class="abtn sm" onclick="toggleSrc(${i})">${s.on ? '중지' : '재개'}</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;font-size:12.5px">
              <div><span class="faint">robots.txt</span><br><b>${s.robots}</b></div>
              <div><span class="faint">요청 간격</span><br><b class="mono">${s.delay}초</b></div>
              <div><span class="faint">수집 주기</span><br><b>1시간</b></div>
              <div><span class="faint">누적 수집</span><br><b class="mono">${nf(s.ok)}건</b></div>
            </div>
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);font-size:12px;color:var(--ink-2);line-height:1.75">
              ✓ 로그인이 필요한 페이지는 수집 대상에서 제외합니다<br>
              ✓ robots.txt 제외 경로는 매 수집마다 확인 후 건너뜁니다<br>
              ✓ 응답 지연·오류가 반복되면 자동으로 간격을 늘립니다
            </div>
          </div>`).join('')}
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-hd"><h2>중복 수집 방지</h2><span class="sub">요구사항 2-1 데이터 매핑</span></div>
      <div class="pnl-bd">
        <p style="font-size:13px;color:var(--ink-2);line-height:1.9">
          원문 URL의 <b>정규화된 해시</b>를 유니크 키로 두어 같은 글이 두 번 들어오지 않게 합니다.
          제목이 수정된 경우는 해시가 같으므로 <b>갱신</b>으로 처리하고, 원문이 사라지면 비공개로 전환합니다.
        </p>
        <div class="tw" style="margin-top:12px"><table class="t">
          <thead><tr><th>단계</th><th>처리</th><th style="text-align:right">오늘</th></tr></thead>
          <tbody>
            <tr><td>목록 파싱</td><td>대상 사이트 목록 페이지에서 URL 수집</td><td style="text-align:right" class="mono">233건</td></tr>
            <tr><td>중복 제거</td><td>URL 해시 대조 후 신규만 통과</td><td style="text-align:right" class="mono">59건</td></tr>
            <tr><td>본문 파싱</td><td>제목 + 발췌(2~3줄)만 추출 · 본문 전체 미저장</td><td style="text-align:right" class="mono">56건</td></tr>
            <tr><td>스키마 변환</td><td>카테고리 매핑 후 커뮤니티 DB 적재</td><td style="text-align:right" class="mono">56건</td></tr>
            <tr><td>실패</td><td>레이아웃 변경 의심 — 셀렉터 점검 필요</td><td style="text-align:right;color:var(--bad)" class="mono">3건</td></tr>
          </tbody>
        </table></div>
      </div>
    </div>`;
}
function toggleSrc(i) { sources[i].on = !sources[i].on; render(); toast(`${sources[i].name} 수집을 ${sources[i].on ? '재개' : '중지'}했습니다`); }

/* ============================================================
   신고 처리 (안전)
   ============================================================ */
function vReports() {
  const wait = reports.filter(r => r.st === 'wait');
  return `
    <div class="note bad">🛡<div>
      <b>여성 커뮤니티에서 신고 처리 속도는 서비스의 생존과 직결됩니다.</b>
      개인정보 노출·성적 괴롭힘·불법촬영물 의심은 <b>검토 전에 먼저 가려집니다.</b>
      피해가 확산되기 전에 멈추는 것이 우선이기 때문입니다.
    </div></div>

    <div class="pnl">
      <div class="pnl-hd"><h2>신고 접수</h2><span class="sub">대기 ${wait.length}건</span></div>
      <div class="tw"><table class="t">
        <thead><tr><th>ID</th><th>대상</th><th>내용</th><th>사유</th><th>신고 대상자</th><th>상태</th><th>조치</th></tr></thead>
        <tbody>${reports.map(r => `
          <tr>
            <td class="mono faint">${r.id}</td>
            <td><span class="pill p-gray">${r.target}</span></td>
            <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.txt}</td>
            <td>${r.urgent ? `<span class="pill p-bad">${r.reason}</span>` : `<span class="pill p-gray">${r.reason}</span>`}</td>
            <td class="mono">${r.by}</td>
            <td>${r.st === 'wait'
              ? (r.urgent ? '<span class="pill p-warn">가림 · 검토대기</span>' : '<span class="pill p-gray">대기</span>')
              : '<span class="pill p-ok">처리완료</span>'}</td>
            <td style="white-space:nowrap">${r.st === 'wait' ? `
              <button class="abtn sm danger" onclick="handleRep('${r.id}','ban')">삭제·정지</button>
              <button class="abtn sm" onclick="handleRep('${r.id}','keep')">복구</button>` : '—'}</td>
          </tr>`).join('')}</tbody>
      </table></div>
    </div>

    <div class="pnl">
      <div class="pnl-hd"><h2>📸 불법촬영물 대응 준비</h2><span class="sub">2026.7.1 이미지까지 확대 시행</span></div>
      <div class="pnl-bd">
        <div class="note warn" style="margin:0 0 14px">⚠️<div>
          <b>전기통신사업법·정보통신망법상 불법촬영물등 유통방지를 위한 기술적·관리적 조치</b> 의무가 있고,
          <b>2026년 7월 1일부터 적용 범위가 동영상에서 이미지까지 확대</b>되었습니다.
          여성 커뮤니티는 이 리스크에 가장 직접적으로 노출됩니다.
        </div></div>
        <div class="tw"><table class="t">
          <thead><tr><th>조치 항목</th><th>현재</th><th>비고</th></tr></thead>
          <tbody>
            <tr><td>신고 기능</td><td><span class="pill p-ok">구현</span></td><td>불법촬영물 의심 사유 분리 · 즉시 가림</td></tr>
            <tr><td>게재 시 사전 경고</td><td><span class="pill p-ok">구현</span></td><td>글쓰기 화면 안내 문구</td></tr>
            <tr><td>이미지 직접 업로드</td><td><span class="pill p-gray">미개방</span></td><td><b>1차에서는 열지 않음</b> — 필터링 연동 후 개방 권장</td></tr>
            <tr><td>특징 비교 필터링</td><td><span class="pill p-gray">2차</span></td><td>이미지 업로드 개방 시 연동 필요</td></tr>
            <tr><td>크롤링 이미지</td><td><span class="pill p-ok">링크만</span></td><td>자체 호스팅하지 않고 원문 링크만 참조</td></tr>
          </tbody>
        </table></div>
        <p style="font-size:11.5px;color:var(--ink-3);margin-top:12px;line-height:1.8">
          ※ 의무 적용 대상 규모는 사업 성장 시점에 다시 확인이 필요합니다.
          1차 오픈 단계에서는 <b>이미지 업로드를 열지 않는 것</b>이 가장 확실한 대응입니다.
        </p>
      </div>
    </div>`;
}

function handleRep(id, act) {
  const r = reports.find(x => x.id === id);
  r.st = 'done';
  render();
  toast(act === 'ban'
    ? `🛡 <b>${id}</b> — 콘텐츠 삭제 및 작성자 이용정지 처리했습니다`
    : `<b>${id}</b> — 검토 후 복구했습니다`, act === 'ban' ? 'err' : 'ok');
}

/* ============================================================
   회원 관리
   ============================================================ */
function vMembers() {
  return `
    <div class="note info">👤<div>
      요구사항의 회원 기능은 <b>"일반 회원가입, 로그인"</b>이지만, 여성 커뮤니티에서는
      <b>누가 들어오는지가 서비스의 본질</b>입니다. 본인확인을 거치지 않은 계정은 <b>읽기만</b> 가능하도록 했습니다.
    </div></div>

    <div class="pnl">
      <div class="pnl-hd"><h2>회원 목록</h2>
        <span class="sub">본인확인 ${members.filter(m=>m.verified).length}명 / 전체 ${members.length}명</span></div>
      <div class="tw"><table class="t">
        <thead><tr><th>닉네임</th><th>가입일</th><th style="text-align:right">작성글</th><th>본인확인</th><th style="text-align:right">피신고</th><th>상태</th><th>조치</th></tr></thead>
        <tbody>${members.map((m, i) => `
          <tr>
            <td><b>${m.nick}</b></td>
            <td class="mono faint">${m.joined}</td>
            <td style="text-align:right" class="mono">${m.posts}</td>
            <td>${m.verified ? '<span class="pill p-ok">✓ 확인됨</span>' : '<span class="pill p-gray">미확인 (읽기만)</span>'}</td>
            <td style="text-align:right" class="mono" ${m.reports >= 3 ? 'style="text-align:right;color:var(--bad);font-weight:700"' : ''}>${m.reports || '-'}</td>
            <td>${m.st === 'flag' ? '<span class="pill p-bad">주의</span>' : '<span class="pill p-ok">정상</span>'}</td>
            <td style="white-space:nowrap">${m.st === 'flag'
              ? `<button class="abtn sm danger" onclick="banMember(${i})">차단</button>
                 <button class="abtn sm" onclick="clearMember(${i})">해제</button>`
              : '<button class="abtn sm">활동 보기</button>'}</td>
          </tr>`).join('')}</tbody>
      </table></div>
      <div class="pnl-bd" style="border-top:1px solid var(--line)">
        <p style="font-size:11.5px;color:var(--ink-3);line-height:1.8">
          💡 <b>미확인 계정이 피신고 상위에 몰려 있습니다.</b> 본인확인 게이트가 왜 필요한지를 보여주는 지표입니다.
        </p>
      </div>
    </div>`;
}
function banMember(i) { const m = members[i]; members.splice(i, 1); render(); toast(`⛔ <b>${m.nick}</b> 차단 처리했습니다`, 'err'); }
function clearMember(i) { members[i].st = 'normal'; members[i].reports = 0; render(); toast('정상 회원으로 처리했습니다', 'ok'); }

/* ============================================================
   검토 항목
   ============================================================ */
function vRisks() {
  const hi = RISKS.filter(r => r.lv === 'high').length;
  return `
    <div class="note bad">⚠️<div>
      요구사항을 검토하며 확인한 <b>${RISKS.length}건</b>입니다 (필수 대응 ${hi}건).
      각 항목마다 이 데모에 실제로 적용한 대안을 함께 적었습니다.
    </div></div>
    ${RISKS.map(r => `
      <div class="risk-card ${r.lv}">
        <div class="risk-t">
          <span style="font-size:16px">${r.ico}</span><b>${r.t}</b>
          <span class="pill ${r.lv === 'high' ? 'p-bad' : r.lv === 'mid' ? 'p-warn' : 'p-ok'}">
            ${r.lv === 'high' ? '필수' : r.lv === 'mid' ? '권장' : '확인'}</span>
        </div>
        <p>${r.d}</p>
        <div class="src">📚 ${r.s}</div>
        <div class="fix">✓ ${r.f}</div>
      </div>`).join('')}`;
}

/* ============================================================
   라우팅
   ============================================================ */
const PAGES = { dash:vDash, expose:vExpose, crawl:vCrawl, reports:vReports, members:vMembers, risks:vRisks };
const TITLES = {
  dash:['대시보드','수집 상태 · 커뮤니티 지표'],
  expose:['노출 방식','크롤링 콘텐츠 법적 경계'],
  crawl:['크롤링 설정','대상 · robots · 딜레이'],
  reports:['신고 처리','안전 대응'],
  members:['회원 관리','본인확인 · 차단'],
  risks:['검토 항목','착수 전 확인 사항'],
};

function goPage(p) {
  page = p;
  $$('.adm-nav button[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === p));
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  const [t, c] = TITLES[page];
  $('#aTitle').textContent = t;
  $('#aCrumb').textContent = c;
  $('#admBody').innerHTML = PAGES[page]();
  const urgent = reports.filter(r => r.st === 'wait' && r.urgent).length;
  const badge = $('#repBadge');
  if (badge) { badge.textContent = urgent; badge.style.display = urgent ? '' : 'none'; }
}

document.addEventListener('DOMContentLoaded', () => {
  $$('.adm-nav button[data-p]').forEach(b => b.addEventListener('click', () => goPage(b.dataset.p)));
  render();
});
