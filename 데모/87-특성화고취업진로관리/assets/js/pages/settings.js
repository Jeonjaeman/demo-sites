/* 운영·권한·연동 — 3단계 교사 권한 매트릭스 · 직무별 권장 스펙 편집기(F10 → 갭 재계산) · 알림톡 채널·템플릿·발송 준비 체크리스트(F4·F5) · 운영 준비(클라우드 CSAP·학습지원 SW·개인정보파일 등록 F13·F14) · 졸업생 보존·파기 스케줄 + 파기 관리대장(F12) · 검토 항목 · 감사 로그 */
(function () {
  'use strict';
  const role = UI.requireRole(); if (!role) return;
  const { $, $$, esc, toast, badge, modal } = UI;
  const content = ADMIN.mountShell(role);
  const st = CP.load();
  const FEATURES = [['학생 목록·상세 열람', '본인 학급', '전체', '전체'], ['증빙 확인·반려 · 상담 메모 · 리포트 인쇄', '○', '○', '○'], ['기업 공고 등록 · 학생 배정', '✕', '○', '○'], ['동의서·협약서 발송·재발송 · 변경 합의', '✕(열람만)', '○', '○'], ['학교장 직인 날인(결재 대행)', '✕', '✕', '○'], ['맞춤 알림 발송 · 예약', '✕', '○', '○'], ['엑셀 일괄 업로드', '✕', '○', '○'], ['교육청 보고 양식 · HIFIVE 엑셀', '✕', '○', '○'], ['권장 스펙 기준표 편집', '✕', '○', '○'], ['권한 부여·회수 · 알림톡 채널·템플릿', '✕', '✕', '○'], ['졸업생 파기 실행 · 파기 관리대장', '✕', '✕', '○(행정실 협조)'], ['처리 기록(감사 로그) 열람', '✕', '본인 건', '전체']];
  const checks = riskChecks();
  const ret = st.retention; const readiness = st.readiness;
  const daysToDestroy = Math.round((new Date(ret.destroyDue) - CP.TODAY) / 86400000);

  content.innerHTML = `
    <nav class="subnav" aria-label="운영 메뉴">${[['#roles', '권한'], ['#specs', '권장 스펙 기준표'], ['#templates', '알림톡·발송 준비'], ['#ops', '운영 준비'], ['#retention', '보존·파기'], ['#risk', '검토 항목'], ['#audit', '처리 기록']].map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</nav>

    <section class="panel" data-reveal id="roles">
      <header class="panel__head"><h2 class="panel__title">3단계 교사 권한 (역할 × 범위)</h2><span class="muted t-small">현재: <b>${esc(role.name)}</b> · 서버는 행 단위로 범위를 강제(URL 변조로 다른 반 열람 불가)</span></header>
      <div class="table-wrap"><table class="table table--compact matrix"><thead><tr><th>기능</th><th>담임교사</th><th>취업지원부</th><th>총괄 관리자</th></tr></thead><tbody>${FEATURES.map((f) => `<tr><td>${f[0]}</td>${f.slice(1).map((v, i) => `<td class="${v.startsWith('✕') ? 'is-no' : 'is-yes'} ${['teacher', 'staff', 'admin'][i] === role.id ? 'is-me' : ''}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="roles-grid mt">${[['박지현', '담임교사', '소프트웨어 3-1', false], ['김도윤', '취업지원부 · 담임 겸임', '전체 (담임 범위: 전기전자 3-1)', true], ['이수민', '총괄 관리자(교감)', '전체 · 날인 대행', false], ['정하은', '담임교사', '전기전자 3-2', false], ['최민서', '담임교사', '경영회계 3-1', false]].map((r) => `<div class="role-row"><span class="avatar avatar--sm">${r[0][0]}</span><div><b>${r[0]}</b>${r[3] ? badge('겸임 — 상위 권한 적용 · 역할 전환', 'info') : ''}<span class="muted t-small">${r[1]} · ${r[2]}</span></div>${role.can.manageRoles ? `<button class="btn btn--ghost btn--sm" data-role-edit="${r[0]}">권한 변경</button>` : ''}</div>`).join('')}${role.can.manageRoles ? '<button class="btn btn--soft btn--sm" id="addTeacher">교사 추가</button>' : '<p class="t-small muted">권한 변경은 총괄 관리자만 할 수 있습니다.</p>'}</div>
    </section>

    <section class="panel" data-reveal id="specs">
      <header class="panel__head panel__head--wrap"><div><h2 class="panel__title">희망 직무별 권장 스펙 기준표</h2><p class="panel__desc">공공데이터에는 자격 종목·NCS 분류 같은 <b>재료</b>만 있고 "이 직무엔 이 자격"이라는 정답표는 없습니다. 학과가 직접 정하고, 바꾸면 모든 학생의 진로 준비도가 <b>즉시 재계산</b>됩니다 — 학과 개편·자격 개정 때 개발자를 부르지 않아도 됩니다.</p></div><div class="filters"><select class="select" id="specJob">${Object.keys(st.specs).map((j) => `<option>${j}</option>`).join('')}</select>${role.can.assign ? '<button class="btn btn--soft btn--sm" id="specAdd">항목 추가</button>' : ''}</div></header>
      <div id="specBody"></div>
      <p class="t-small muted mt-s">출처 칩: 국가기술자격(한국산업인력공단 기능사 종목 1,154종) · 공인민간자격 · 교내 기준. 필수 70% + 권장 30% 가중.</p>
    </section>

    <section class="panel" data-reveal id="templates">
      <header class="panel__head"><h2 class="panel__title">카카오 알림톡 채널 · 템플릿 · 발송 준비</h2>${CPX.readinessOk() ? badge('실발송 가능', 'ok') : badge('실발송 잠김', 'danger')}</header>
      <ol class="readiness">${readiness.map((r) => `<li class="${r.done ? 'is-done' : 'is-todo'}"><span class="readiness__mark" aria-hidden="true"></span><span>${esc(r.label)}</span><span class="muted t-small">${r.done ? (r.at ? `완료 ${CP.fmt.date(r.at)}` : '완료') : '진행 중'}</span></li>`).join('')}</ol>
      <div class="kv-cards mt-s"><div><span>발신 프로필</span><b>@${CP.SCHOOL.short} (비즈니스 채널)</b></div><div><span>대행사</span><b>공식 딜러사 API (NHN Cloud / 네이버 SENS 중 택1)</b></div><div><span>SMS 대체</span><b>자동 (실패 즉시 · 사유 기록)</b></div><div><span>이번 달 발송</span><b>${st.messages.length}건 · 약 ${(st.messages.filter((m) => m.channel === 'kakao').length * 13 + st.messages.filter((m) => m.channel === 'sms').length * 45).toLocaleString()}원</b></div></div>
      <div class="table-wrap mt-s"><table class="table table--compact"><thead><tr><th>코드</th><th>템플릿</th><th>유형</th><th>심사 상태</th><th>버튼</th><th class="actions"></th></tr></thead><tbody>${st.templates.map((t) => `<tr><td class="mono">${t.id}</td><td>${esc(t.name)}${t.reason ? `<br><span class="t-small t-danger">${esc(t.reason)}</span>` : ''}${t.note ? `<br><span class="t-small t-ok">${esc(t.note)}</span>` : ''}</td><td>${badge(t.kind, t.kind === '광고성' ? 'warn' : 'neutral')}</td><td>${badge({ approved: '승인', review: '심사 중 (영업일 1~3일)', rejected: '반려' }[t.status], { approved: 'ok', review: 'warn', rejected: 'danger' }[t.status])}</td><td class="t-small">${t.buttons.join(', ') || '—'}</td><td class="actions"><button class="btn btn--ghost btn--sm" data-tpl="${t.id}">본문</button>${t.status === 'rejected' && role.can.manageRoles ? `<button class="btn btn--soft btn--sm" data-retpl="${t.id}">수정 후 재심사</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
      <div class="notice notice--info t-small mt-s"><b>알림톡은 정보성 메시지만</b> — 수신자 행동에 대한 피드백·계약 이행 필수 정보·공익 무상 안내. 「맞춤 채용 공고 일괄 안내」는 요청하지 않은 정보라 반려됐고, 학생이 <b>채용 알림을 신청한 경우에만</b> 보내는 T07로 바꿨습니다. 광고성은 브랜드메시지(수신동의·야간 별도 동의)로만 가능합니다. 채널 개설·비즈니스 인증·발신번호 사전등록(전기통신사업법 §84의2)은 학교 명의로 착수 1주차에 함께 진행합니다.</div>
    </section>

    <section class="panel" data-reveal id="ops">
      <header class="panel__head"><h2 class="panel__title">운영 준비 — 착수 1주차에 교육청·행정실과 확인</h2></header>
      <ul class="checks">${[['warn', '클라우드 보안인증(CSAP) 등급 확인', '학생·보호자 개인정보를 담으므로 국내 CSP(네이버클라우드 공공·NHN·KT) 상위 등급 우선. AWS·Azure·GCP는 CSAP "하" 등급만 보유(2025). 공립학교의 의무 적용 여부는 교육청 정보보안 담당 확인.'], ['warn', '학습지원 소프트웨어 선정 기준·학운위 심의 해당 여부', '2026년 3월 시행. 행정·진로 업무용이면 비해당일 수 있으나 진로 리포트가 교육과정 운영에 쓰이면 해당 소지 — 해당 시 필수기준 체크리스트 자료를 저희가 작성.'], ['info', '개인정보파일 등록 · 처리방침 게시', '학교는 공공기관 — 개인정보파일 등록(개인정보보호법 §32), 처리방침에 수집 항목·보유 기간·제3자 제공(실습 기업) 명시.'], ['info', 'HIFIVE·하이잡과 역할 분담', '협약 등재·실습일지·권익침해 상담은 공식 시스템(HIFIVE)에, 학교 내부 관리·동의 수합·통계는 이 시스템에. 이중 입력을 피하기 위해 HIFIVE 등재용 엑셀 내보내기 제공.'], ['ok', '카카오 채널 개설 서류', '학교 고유번호증·대표번호 통신서비스 이용증명원 — 행정실 준비, 저희가 등록 대행.']].map(([lv, t, d]) => `<li class="check-item check-item--${lv}"><span class="check-item__mark" aria-hidden="true"></span><div><b>${t}</b><p>${d}</p></div></li>`).join('')}</ul>
    </section>

    <section class="panel" data-reveal id="retention">
      <header class="panel__head panel__head--wrap"><div><h2 class="panel__title">졸업생 보존·파기 스케줄</h2><p class="panel__desc">학교는 공공기관이라 처리 목적(졸업) 달성 시 <b>지체 없이(5일 이내) 파기</b>하고 파기 관리대장을 남겨야 합니다. 반면 유지취업률 조사는 졸업 후 6·12·18개월 — <b>사후관리 연락에 동의한 학생만</b> 별도 보존합니다.</p></div>${role.can.manageRoles ? `<button class="btn btn--danger btn--sm" id="destroy">파기 실행 + 관리대장 XLSX</button>` : ''}</header>
      <div class="kv-cards"><div><span>2026년 2월 졸업생</span><b>${ret.total}명</b></div><div><span>사후관리 동의</span><b>${ret.followUpConsent}명 · ${CP.fmt.date(ret.followUpUntil)}까지 보존</b></div><div><span>파기 대상</span><b>${ret.total - ret.followUpConsent - ret.destroyed}명 · 기한 ${CP.fmt.date(ret.destroyDue)} (${daysToDestroy < 0 ? `D+${-daysToDestroy} 지남` : `D-${daysToDestroy}`})</b></div><div><span>파기 완료</span><b>${ret.destroyed}명</b></div></div>
      <dl class="kv mt-s"><div><dt>동의서·협약서</dt><dd>실습 종료 후 <b>3년</b> 보존(분쟁 대응) · 변경 불가 저장 · 이후 파기</dd></div><div><dt>보호자 연락처</dt><dd>자녀 졸업 시 파기 · 알림톡 수신 동의 건별 기록</dd></div><div><dt>전학·자퇴</dt><dd>학적 변동 반영 즉시 열람 잠금 · 진행 중 문서 무효화 → 30일 후 파기</dd></div><div><dt>기업 제공 정보</dt><dd>실습 종료 30일 내 기업 파기(협약서 제6조) · 파기 확인서 회신</dd></div></dl>
    </section>

    <section class="panel" data-reveal id="risk">
      <header class="panel__head"><h2 class="panel__title">검토 항목 — 지금 데이터로 점검한 결과</h2><span class="muted t-small">운영 중 반드시 터지는 지점을 실제 데이터로 계산</span></header>
      <ul class="checks">${checks.map((c) => `<li class="check-item check-item--${c.level}"><span class="check-item__mark" aria-hidden="true"></span><div><b>${esc(c.title)}</b><p>${c.text}</p>${c.href ? `<a class="plink t-small" href="${c.href}">${c.hrefLabel} →</a>` : ''}</div></li>`).join('')}</ul>
    </section>

    <div class="grid-2 grid-2--wide">
      <section class="panel" data-reveal id="audit">
        <header class="panel__head"><h2 class="panel__title">처리 기록 (감사 로그)</h2><button class="btn btn--ghost btn--sm" id="auditCsv">CSV</button></header>
        <div class="table-wrap table-wrap--h"><table class="table table--compact"><thead><tr><th>일시</th><th>처리자</th><th>작업</th><th>내용</th></tr></thead><tbody>${(role.can.manageRoles ? st.audit : st.audit.filter((a) => a.by === role.person)).slice(0, 80).map((a) => `<tr><td class="mono t-small">${a.at}</td><td>${esc(a.by)}</td><td>${esc(a.action)}</td><td class="t-small">${esc(a.detail || '')}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">기록 없음 — 화면에서 뭔가 처리하면 여기 남습니다</td></tr>'}</tbody></table></div>
        <p class="t-small muted mt-s">개인정보 열람·다운로드·발송·날인·삭제는 모두 기록되고 1년 이상 보관합니다(개인정보 안전성 확보조치 기준).</p>
      </section>
      <section class="panel" data-reveal>
        <header class="panel__head"><h2 class="panel__title">엑셀 업로드 이력</h2></header>
        <ul class="bullets bullets--tight">${st.uploads.map((u) => `<li>${u.at} · ${esc(u.by)} · ${u.rows}행 (신규 ${u.added} · 갱신 ${u.updated} · 제외 ${u.errors})</li>`).join('') || '<li class="muted">아직 없음 — 학생 목록에서 「엑셀 일괄 업로드」</li>'}</ul>
      </section>
    </div>`;

  /* 권장 스펙 편집기 */
  let specJob = Object.keys(st.specs)[0];
  function renderSpec() {
    const sp = st.specs[specJob]; const affected = st.students.filter((s) => s.job === specJob); const avg = affected.length ? Math.round(affected.reduce((n, s) => n + CPX.gap(s).score, 0) / affected.length) : 0;
    $('#specBody').innerHTML = `<div class="sumline">희망 학생 <b>${affected.length}명</b> · 평균 준비도 <b id="specAvg">${avg}</b> · 필수 ${sp.items.filter((i) => i.must).length} · 권장 ${sp.items.filter((i) => !i.must).length}</div>
      <div class="table-wrap"><table class="table table--compact"><thead><tr><th>구분</th><th>항목</th><th>출처</th><th>필수/권장</th><th class="actions"></th></tr></thead><tbody>${sp.items.map((it, i) => `<tr><td>${{ cert: '자격증', lang: '어학', exp: '경험', edu: '교육' }[it.kind]}</td><td>${esc(it.name)}</td><td>${badge(it.kind === 'cert' ? (/기능사|기사|산업기사/.test(it.name) ? '국가기술자격' : '공인민간자격') : '교내 기준', 'neutral')}</td><td><div class="seg seg--sm"><label><input type="radio" name="m${i}" value="1" ${it.must ? 'checked' : ''} data-must="${i}" ${role.can.assign ? '' : 'disabled'}><span>필수</span></label><label><input type="radio" name="m${i}" value="0" ${!it.must ? 'checked' : ''} data-must="${i}" ${role.can.assign ? '' : 'disabled'}><span>권장</span></label></div></td><td class="actions">${role.can.assign ? `<button class="btn btn--text btn--sm" data-del="${i}">삭제</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
  }
  renderSpec();
  $('#specJob').addEventListener('change', (e) => { specJob = e.target.value; renderSpec(); });
  content.addEventListener('change', (e) => { const m = e.target.closest('[data-must]'); if (m) { st.specs[specJob].items[Number(m.dataset.must)].must = m.value === '1'; CP.save(); CP.audit('권장 스펙 변경', `${specJob} · ${st.specs[specJob].items[Number(m.dataset.must)].name} → ${m.value === '1' ? '필수' : '권장'}`); const before = $('#specAvg').textContent; renderSpec(); toast(`저장 — 「${specJob}」 학생 평균 준비도 ${before} → ${$('#specAvg').textContent} 로 즉시 재계산`, 'ok', 4000); } });
  content.addEventListener('click', (e) => {
    const d = e.target.closest('[data-del]'); if (d) { const it = st.specs[specJob].items.splice(Number(d.dataset.del), 1)[0]; CP.save(); CP.audit('권장 스펙 삭제', `${specJob} · ${it.name}`); renderSpec(); toast('항목을 삭제했습니다 — 준비도 재계산', 'ok'); }
    if (e.target.id === 'specAdd') modal({ title: `「${specJob}」 항목 추가`, size: 'sm', body: `<label class="field"><span class="field__label">구분</span><select class="select" id="nk"><option value="cert">자격증</option><option value="lang">어학</option><option value="exp">경험</option><option value="edu">교육</option></select></label><label class="field"><span class="field__label">항목명</span><input class="input" id="nn" placeholder="예: 전기산업기사(필기) 또는 TOEIC 600 이상"></label><label class="check"><input type="checkbox" id="nm"><span>필수</span></label>`, actions: [{ label: '취소' }, { label: '추가', kind: 'btn--primary', onClick: (m) => { const name = $('#nn', m.el).value.trim(); if (!name) return toast('항목명을 입력하세요', 'warn'); st.specs[specJob].items.push({ kind: $('#nk', m.el).value, name, must: $('#nm', m.el).checked }); CP.save(); CP.audit('권장 스펙 추가', `${specJob} · ${name}`); m.close(); renderSpec(); toast('추가 — 준비도 재계산', 'ok'); } }] });
    const t = e.target.closest('[data-tpl]'); if (t) { const T = st.templates.find((x) => x.id === t.dataset.tpl); modal({ title: `${T.id} ${T.name}`, size: 'sm', body: `<div class="tpl-preview"><pre>${esc(T.body)}</pre>${T.buttons.map((b) => `<span class="tpl-preview__btn">${b}</span>`).join('')}</div><p class="t-small muted mt-s">#{변수}는 발송 시 학생별로 치환됩니다. 변수명·버튼 URL은 심사 때 고정됩니다.</p>`, actions: [{ label: '닫기' }] }); }
    const rt = e.target.closest('[data-retpl]'); if (rt) { const T = st.templates.find((x) => x.id === rt.dataset.retpl); T.status = 'review'; T.reason = ''; T.note = '재심사 제출 — 수신자 요청 기반 문구로 수정'; CP.save(); CP.audit('템플릿 재심사 제출', T.id); toast('재심사 제출 — 영업일 1~3일 소요, 승인 전까지 발송 잠김', 'ok'); location.reload(); }
    const r = e.target.closest('[data-role-edit]'); if (r) modal({ title: `${r.dataset.roleEdit} 권한 변경`, size: 'sm', body: `<label class="field"><span class="field__label">역할</span><select class="select"><option>담임교사</option><option>취업지원부</option><option>총괄 관리자</option></select></label><label class="field"><span class="field__label">학급 범위 (담임)</span><select class="select">${CPX.byClass(null).map((c) => `<option>${CP.dept(c.dept).short} 3-${c.cls}</option>`).join('')}</select></label><label class="check"><input type="checkbox"><span>취업지원부 겸임 (상단에 역할 전환 표시)</span></label>`, actions: [{ label: '취소' }, { label: '저장', kind: 'btn--primary', onClick: (m) => { CP.audit('권한 변경', r.dataset.roleEdit); m.close(); toast('권한을 저장했습니다 (데모 — 목록 표시는 고정)', 'ok'); } }] });
    if (e.target.id === 'addTeacher') toast('교사 추가 — 학교 계정(NEIS 교직원 번호) 기준 초대 메일 발송 (데모 생략)', 'info');
    if (e.target.id === 'auditCsv') { CPX.csv(`처리기록_${CP.iso(CP.TODAY)}.csv`, ['일시', '처리자', '작업', '내용'], st.audit.map((a) => [a.at, a.by, a.action, a.detail || ''])); toast('CSV 다운로드', 'ok'); }
    if (e.target.id === 'destroy') { const n = ret.total - ret.followUpConsent - ret.destroyed; if (n <= 0) return toast('파기 대상이 없습니다', 'info'); modal({ title: `졸업생 ${n}명 개인정보 파기`, size: 'sm', body: `<p class="t-body">사후관리 동의 ${ret.followUpConsent}명을 제외한 ${n}명의 인적사항·연락처·이력 파일을 복구 불가 삭제하고, 파기 관리대장(교육부 개인정보 보호지침 별지 제10호 항목)을 XLSX로 만듭니다. 동의서·협약서 PDF는 보존 기간(3년) 동안 별도 보관됩니다.</p>`, actions: [{ label: '취소' }, { label: '파기 실행', kind: 'btn--danger', onClick: (m) => { ret.destroyed += n; CP.save(); CP.audit('졸업생 개인정보 파기', `${n}명 · 관리대장 생성`); CPX.xlsx(`개인정보_파기관리대장_${CP.iso(CP.TODAY)}.xlsx`, [{ name: '파기 관리대장', rows: [['번호', '개인정보파일명', '자료 종류', '생성일', '파기일', '파기 사유', '파기 방법', '건수', '처리 담당자', '처리 부서장 확인'], [1, '학생 취업·진로 이력(2026년 2월 졸업생)', '전자파일(DB·증빙 PDF)', '2023-03-02', CP.iso(CP.TODAY), '처리 목적 달성(졸업) · 사후관리 미동의', '복구 불가 삭제', n, role.person, ''], [2, '보호자 연락처(2026년 2월 졸업생)', '전자파일(DB)', '2023-03-02', CP.iso(CP.TODAY), '처리 목적 달성(졸업)', '복구 불가 삭제', n, role.person, '']] }]); m.close(); toast(`${n}명 파기 완료 — 파기 관리대장 XLSX 다운로드`, 'ok', 4500); location.reload(); } }] }); }
  });

  function riskChecks() {
    const out = [];
    const pls = st.placements;
    const blocked = st.jobs.filter((j) => CPX.jobIssues(j).some((x) => x.level === 'block')); if (blocked.length) out.push({ level: 'danger', title: `운영 기준을 넘어 배정이 잠긴 공고 ${blocked.length}건`, text: blocked.map((j) => `${j.company}(${CPX.jobIssues(j).filter((x) => x.level === 'block').map((x) => x.text.split(' — ')[0]).join('·')})`).join(', '), href: 'jobs.html', hrefLabel: '공고 보기' });
    const exp = pls.filter((p) => CPX.placementState(p) === 'expired'); if (exp.length) out.push({ level: 'warn', title: `72시간 지난 링크 ${exp.length}건`, text: '만료 링크는 열리지 않고 재발송해야 합니다. 발송 후 48시간째 자동 독려를 켜면 만료 전에 대부분 처리됩니다.', href: 'consents.html?f=expired', hrefLabel: '재발송' });
    const legal = pls.filter((p) => p.docs.guardian.legalGuardian === false); if (legal.length) out.push({ level: 'warn', title: `법정대리인 확인 필요 ${legal.length}건`, text: '「기타 보호자」가 서명한 건 — 교육법상 보호자와 민법상 법정대리인(친권자·후견인)은 다릅니다. 담임이 가족관계를 확인하고 필요 시 친권자 서명을 다시 받습니다.', href: 'consents.html', hrefLabel: '전자동의' });
    const dup = {}; st.students.forEach((s) => { dup[s.name] = (dup[s.name] || 0) + 1; }); const dups = Object.entries(dup).filter(([, n]) => n > 1); if (dups.length) out.push({ level: 'info', title: `동명이인 ${dups.length}쌍`, text: `${dups.slice(0, 4).map(([n, c]) => `${n}(${c})`).join(', ')}${dups.length > 4 ? ' 외' : ''} — 발송·배정은 학번으로만 처리하고 화면에는 학과·반을 항상 함께 표시합니다.`, href: 'students.html', hrefLabel: '학생 목록' });
    const sg = {}; st.students.forEach((s) => { sg[s.guardian.phone] = (sg[s.guardian.phone] || 0) + 1; }); const sib = Object.values(sg).filter((n) => n > 1).length; out.push({ level: 'info', title: `보호자 번호 중복 ${sib}건`, text: sib ? '형제·자매 재학 또는 입력 오류 — 동의서는 학생별로 따로 서명해야 하므로 링크를 각각 보냅니다.' : '중복 없음. 형제·자매 재학 시 링크는 학생별로 따로 갑니다.' });
    const nonLegal = st.students.filter((s) => !s.guardian.legal).length; out.push({ level: 'info', title: `등록 보호자가 조부모 등 비친권자인 학생 ${nonLegal}명`, text: '조손·한부모·시설 가정은 등록 연락처가 법정대리인이 아닐 수 있습니다. 서명 화면에서 관계를 고르게 하고, 기타 보호자면 확인 배지를 붙입니다.' });
    const pend = st.templates.filter((t) => t.status !== 'approved'); out.push({ level: pend.length ? 'warn' : 'ok', title: `알림톡 템플릿 미승인 ${pend.length}건`, text: pend.length ? `${pend.map((t) => `${t.name}(${t.status === 'review' ? '심사 중' : '반려'})`).join(', ')} — 승인 전에는 해당 템플릿으로 발송할 수 없습니다.` : '모든 템플릿이 승인되었습니다.', href: '#templates', hrefLabel: '템플릿' });
    const noVisit = pls.filter((p) => CP.job(p.jobId).status === 'ongoing' && !st.visits.some((v) => v.placementId === p.id && (CP.TODAY - new Date(v.date)) / 86400000 <= 30)); if (noVisit.length) out.push({ level: 'warn', title: `이번 달 현장 점검이 없는 진행 중 실습 ${noVisit.length}건`, text: '협약서 제6조③ 월 1회 이상 점검 기준 미달.', href: 'stats.html', hrefLabel: '점검 일지' });
    const noH = pls.filter((p) => CPX.placementState(p) === 'complete' && !p.hifive); if (noH.length) out.push({ level: 'info', title: `HIFIVE 미등재 협약 ${noH.length}건`, text: '승인된 협약·변경 합의서는 교육부 현장실습 관리 시스템에 등재합니다. 등재용 엑셀로 한 번에 내보낼 수 있습니다.', href: 'consents.html?f=complete', hrefLabel: '전자동의' });
    const rt = st.retention; const n = rt.total - rt.followUpConsent - rt.destroyed; out.push({ level: n > 0 && new Date(rt.destroyDue) < CP.TODAY ? 'danger' : 'ok', title: n > 0 ? `졸업생 파기 대상 ${n}명 — 기한 ${CP.fmt.date(rt.destroyDue)}` : '졸업생 파기 완료', text: n > 0 ? '처리 목적 달성 후 5일 이내 파기 기준을 넘겼습니다. 파기 실행 후 관리대장을 보관하세요.' : '사후관리 동의자만 보존 중입니다.', href: '#retention', hrefLabel: '보존·파기' });
    const small = CPX.byClass(null).filter((c) => c.base < 5); out.push({ level: 'ok', title: '통계 공개 시 소규모 집단 마스킹', text: `분모 5명 미만 학급 ${small.length}개 — 외부 공개 통계에서는 셀을 ＊로 가립니다(개인 특정 방지).` });
    return out;
  }
  if (location.hash) setTimeout(() => { const el = $(location.hash); if (el) el.scrollIntoView(); }, 150);
  UI.reveal();
})();
