/* CAREERPASS — 실제 연산 모듈 (하드코딩 금지)
   갭 분석(상태 기준표) · 문서 체인 순서 잠금 · 만료 · KPI(분모 토글) · 학과별 집계 · 공고 운영 기준 검증 · 발송 대상 추출 · 변수 치환 · 파일 생성 */
(function (global) {
  'use strict';
  const CP = global.CP;
  const specs = () => CP.load().specs || CP.JOB_SPECS;

  /* ───────── 진로 갭 분석 ───────── */
  function gap(student, jobName) {
    const spec = specs()[jobName || student.job];
    if (!spec) return { items: [], must: { ok: 0, total: 0 }, all: { ok: 0, total: 0 }, score: 0 };
    const items = spec.items.map((it) => {
      let state = 'missing', evidence = null;
      if (it.kind === 'cert' || it.kind === 'edu') {
        const c = student.certs.find((x) => x.name === it.name || (it.kind === 'edu' && /교육|과정/.test(x.name) && x.name.includes(it.name.slice(0, 4))));
        if (c) { state = c.status === 'verified' ? 'ok' : c.status === 'pending' ? 'pending' : 'missing'; evidence = c; }
        if (it.kind === 'edu' && !c && student.memos.some((m) => /이수|수료/.test(m.text))) state = 'ok';
      } else if (it.kind === 'lang') {
        const m = it.name.match(/^(\S+)\s(\d+)/);
        if (m) { const l = student.langs.find((x) => x.test === m[1] && Number(x.score) >= Number(m[2])); if (l) { state = l.status === 'verified' ? 'ok' : 'pending'; evidence = l; } }
      } else if (it.kind === 'exp') {
        const pf = student.portfolio.filter((p) => p.ver > 0);
        if (/포트폴리오/.test(it.name)) { const need = Number((it.name.match(/(\d+)\s*(건|점|편)/) || [])[1] || 1); if (pf.length) { evidence = pf[pf.length - 1]; state = need > 1 ? (pf.length >= 2 ? 'ok' : 'pending') : 'ok'; } }
        else if (/실습/.test(it.name)) state = student.jobStatus !== 'preparing' ? 'ok' : 'missing';
        else state = pf.length ? 'ok' : 'missing';
      }
      return { ...it, state, evidence };
    });
    const must = items.filter((i) => i.must); const okMust = must.filter((i) => i.state === 'ok').length; const okAll = items.filter((i) => i.state === 'ok').length;
    const nice = items.length - must.length, okNice = okAll - okMust;
    const score = Math.round((must.length ? okMust / must.length : 1) * 70 + (nice ? okNice / nice : 1) * 30);
    return { items, must: { ok: okMust, total: must.length }, all: { ok: okAll, total: items.length }, score };
  }
  function guide(g) {
    return g.items.filter((i) => i.state !== 'ok').map((i) => {
      if (i.state === 'pending') return { kind: '확인 대기', text: `${i.name} — 증빙이 등록되어 교사 확인을 기다리는 중`, action: '교사 확인' };
      if (i.kind === 'cert') return { kind: '자격증', text: `${i.name} ${i.must ? '(필수)' : '(권장)'} — 다음 정기 검정 일정 확인 후 응시`, action: '응시 계획' };
      if (i.kind === 'lang') return { kind: '어학', text: `${i.name} — 교내 어학 방과후 또는 모의고사 응시`, action: '학습 계획' };
      if (i.kind === 'exp') return { kind: '경험', text: `${i.name} — 현장실습 참여 또는 교내 프로젝트로 채우기`, action: '실습 지원' };
      return { kind: '교육', text: `${i.name} — 교내 과정 신청`, action: '과정 신청' };
    });
  }

  /* ───────── 문서 체인 ───────── */
  const DOC_LABEL = { guardian: '보호자 사전동의서', student: '학생 사전동의서', agreement: '표준협약서(기업 대표 서명)', principal: '표준협약서(학교장 날인)' };
  const DOC_SHORT = { guardian: '보호자 동의', student: '학생 동의', agreement: '기업 서명', principal: '학교장 날인' };
  const SIGNER = { guardian: '보호자(법정대리인)', student: '학생 본인', agreement: '기업 대표', principal: '학교장' };
  const STATUS_LABEL = { none: '미발송', sent: '발송됨', viewed: '열람', signed: '서명 완료', expired: '만료', declined: '거부' };
  const EXPIRE_HOURS = CP.RULES.linkExpireHours;
  const nowTs = () => { const n = new Date(); n.setFullYear(CP.TODAY.getFullYear(), CP.TODAY.getMonth(), CP.TODAY.getDate()); return n; };
  function docExpired(doc) { if (doc && doc.internal) return false; if (!doc || !doc.sentAt || ['signed', 'none', 'declined', 'expired'].includes(doc.status)) return doc && doc.status === 'expired'; return (CP.TODAY - new Date(doc.sentAt)) / 3600000 > EXPIRE_HOURS; }
  function expiresAt(doc) { if (!doc || !doc.sentAt) return null; const d = new Date(doc.sentAt); d.setHours(d.getHours() + EXPIRE_HOURS); return d; }
  function effStatus(doc) { if (!doc) return 'none'; return docExpired(doc) ? 'expired' : doc.status; }
  /* 순서 잠금(F2): 앞 단계가 서명 완료여야 다음 단계를 보낼 수 있다 */
  function canSend(p, which) { const i = CP.DOC_CHAIN.indexOf(which); if (i <= 0) return { ok: true }; const prev = CP.DOC_CHAIN[i - 1]; if (p.docs[prev].status !== 'signed') return { ok: false, reason: `${DOC_SHORT[prev]}가 먼저 완료돼야 합니다 — ${prev === 'guardian' ? '미성년자 법률행위는 법정대리인 동의가 선행(민법 §5)' : prev === 'student' ? '학생 본인 참여 의사 확인 후 기업과 체결' : '기업 대표 서명 후 학교장 날인'}` }; return { ok: true }; }
  function nextStep(p) { for (const k of CP.DOC_CHAIN) { if (p.docs[k].status !== 'signed') return k; } return null; }
  function placementState(p) {
    const st = CP.DOC_CHAIN.map((k) => effStatus(p.docs[k]));
    if (st.includes('declined')) return 'declined';
    if (st.every((s) => s === 'signed')) return 'complete';
    if (st.includes('expired')) return 'expired';
    if (st[0] === 'none') return 'unsent';
    return 'progress';
  }
  const PSTATE_LABEL = { complete: '4단 체결 완료', progress: '진행 중', unsent: '미발송', expired: '만료 있음', declined: '거부' };
  const PSTATE_KIND = { complete: 'ok', progress: 'info', unsent: 'neutral', expired: 'danger', declined: 'danger' };
  function sendDoc(p, which, { resend = false } = {}) {
    const d = p.docs[which]; const today = CP.iso(CP.TODAY);
    p.docs[which] = { status: 'sent', sentAt: today, sentTime: nowTs().toISOString(), resent: resend ? (d.resent || 0) + 1 : (d.resent || 0), smsOptIn: d.smsOptIn };
    const st = CP.load(); const s = CP.student(p.studentId); const j = CP.job(p.jobId);
    const fail = which !== 'principal' && Math.random() < 0.08;
    const reason = fail ? ['inactive-72h', 'kakao-unregistered', 'bad-number'][Math.floor(Math.random() * 3)] : '';
    if (which !== 'principal') st.messages.unshift({ id: `m${Date.now().toString(36)}${which[0]}`, at: `${today} ${new Date().toTimeString().slice(0, 5)}`, templateId: resend ? 'T02' : 'T01', to: which === 'guardian' ? `${s.guardian.name}(${s.guardian.rel})` : which === 'student' ? s.name : `${j.ceo} (${j.company})`, phone: which === 'guardian' ? s.guardian.phone : which === 'student' ? s.phone : '02-***-****', studentId: s.id, channel: fail ? 'sms' : 'kakao', result: fail ? 'sms-fallback' : 'delivered', failReason: reason, placementId: p.id, who: which });
    CP.save();
    return fail ? 'sms' : 'kakao';
  }
  function viewDoc(p, which) { const d = p.docs[which]; if (d.status === 'sent') { d.status = 'viewed'; d.viewedAt = CP.iso(CP.TODAY); CP.save(); } }
  function signDoc(p, which, signature, extra = {}) {
    const d = p.docs[which]; const t = nowTs();
    d.status = 'signed'; d.signedAt = CP.iso(CP.TODAY); d.signedTime = t.toISOString(); d.signature = signature; Object.assign(d, extra);
    d.hash = hashHex(`${p.id}|${which}|v${p.version}|${d.signedTime}|${signature ? signature.length : 0}`);
    d.ip = '211.xxx.xxx.' + (100 + Math.floor(Math.random() * 150)); d.ua = /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
    // 완료 사본 알림톡(F3 ⑤)
    if (which === 'guardian' || which === 'student') { const s = CP.student(p.studentId); CP.load().messages.unshift({ id: `m${Date.now().toString(36)}c`, at: `${CP.iso(CP.TODAY)} ${new Date().toTimeString().slice(0, 5)}`, templateId: 'T06', to: which === 'guardian' ? `${s.guardian.name}(${s.guardian.rel})` : s.name, phone: which === 'guardian' ? s.guardian.phone : s.phone, studentId: s.id, channel: 'kakao', result: 'delivered', placementId: p.id, who: which }); }
    CP.save();
  }
  /* 변경 합의(F16): 현재 문서 체인을 v(n)으로 잠그고 새 체인을 연다 */
  function reopen(p, reasonText) { p.history = p.history || []; p.history.push({ version: p.version, docs: p.docs, closedAt: CP.iso(CP.TODAY), reason: reasonText }); p.version += 1; p.docs = { guardian: { status: 'none' }, student: { status: 'none' }, agreement: { status: 'none' }, principal: { status: 'none', internal: true } }; p.hifive = false; CP.save(); }
  function hashHex(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } const h2 = Math.imul(h ^ 0x9e3779b9, 2654435761) >>> 0; return (h.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).toUpperCase(); }

  /* ───────── 공고 운영 기준 검증(F7) ───────── */
  function jobIssues(j) {
    const R = CP.RULES; const out = [];
    if (j.hoursPerDay > R.hoursPerDayMax + (j.extension ? R.extDayMax : 0)) out.push({ level: 'block', text: `1일 실습시간 ${j.hoursPerDay}시간 — 기준 ${R.hoursPerDayMax}시간 초과${j.extension ? '(연장 동의 포함 8시간까지)' : ''}` });
    if (j.hoursPerWeek > R.hoursPerWeekMax + (j.extension ? R.extWeekMax : 0)) out.push({ level: 'block', text: `주 실습시간 ${j.hoursPerWeek}시간 — 기준 ${R.hoursPerWeekMax}시간 초과` });
    if (j.extension) out.push({ level: 'warn', text: '연장(1일 1시간·주 5시간) — 협약서 제9조에 학생 서면 동의 체크 필수(구두 합의 불인정)' });
    if (j.wageHour < R.minWageHour2026) out.push({ level: j.wageHour < R.minWageHour2025 ? 'block' : 'warn', text: `시간당 수당 ${CP.fmt.won(j.wageHour)} — 최저 현장실습 수당(2025 ${CP.fmt.won(R.minWageHour2025)} · 2026 추정 ${CP.fmt.won(R.minWageHour2026)}) ${j.wageHour < R.minWageHour2025 ? '미만' : '2026 기준 미만 가능'}` });
    if (!j.insurance) out.push({ level: 'block', text: '산재보험 가입 미확인 — 가입증명 확보 전 배정 불가' });
    if (j.approval === 'none') out.push({ level: 'block', text: '미승인 기업 — 사전 현장실사·현장실습운영위원회 심의(참여기업) 또는 교육청 협의체(선도기업) 승인 전 매칭 불가' });
    if (j.hazard) out.push({ level: 'block', text: '유해·위험 업종 표시 — 근로기준법 §65 금지 사업 해당 여부 노무사 확인 필요' });
    if (j.days > R.maxPracticeDays) out.push({ level: 'block', text: `실습일수 ${j.days}일 — 채용형 60일 초과(교육청 기간 연장 승인 서식8 필요)` });
    if (j.headcount > j.mentors * R.mentorRatio) out.push({ level: 'warn', text: `기업현장교사 ${j.mentors}명에 모집 ${j.headcount}명 — 1:1 배치 원칙 초과` });
    if (j.breakMin < (j.hoursPerDay >= 8 ? R.breakMin8h : R.breakMin4h)) out.push({ level: 'warn', text: `휴게 ${j.breakMin}분 — 4시간 이상 30분·8시간 60분 기준 미달` });
    return out;
  }
  const monthlyAllowance = (j) => j.wageHour * j.hoursPerDay * 21;

  /* ───────── KPI · 집계 (F9 분모 토글: 'moe' 교육부 기준(진학·입대 제외) / 'all' 전체) ───────── */
  function kpis(role, denom = 'moe') {
    const st = CP.load(); const studs = CP.scopedStudents(role); const ids = new Set(studs.map((s) => s.id));
    const pls = st.placements.filter((p) => ids.has(p.studentId));
    const base = denom === 'moe' ? studs.filter((s) => s.track === 'job') : studs;
    const placed = base.filter((s) => s.jobStatus !== 'preparing').length, hired = base.filter((s) => s.jobStatus === 'hired').length;
    let pendingDocs = 0, expiredDocs = 0, declined = 0;
    pls.forEach((p) => CP.DOC_CHAIN.forEach((k) => { const e = effStatus(p.docs[k]); if (e !== 'signed') pendingDocs++; if (e === 'expired') expiredDocs++; if (e === 'declined') declined++; }));
    const pendingProof = studs.reduce((n, s) => n + [...s.certs, ...s.langs, ...s.awards].filter((x) => x.status === 'pending').length, 0);
    return { enrollment: role && !role.can.viewAll ? studs.length : CP.ENROLLMENT.g1 + CP.ENROLLMENT.g2 + st.students.length, g3: studs.length, base: base.length, excluded: studs.length - base.length, placed, placeRate: base.length ? placed / base.length * 100 : 0, hired, hireRate: base.length ? hired / base.length * 100 : 0, pendingDocs, expiredDocs, declined, pendingProof, placements: pls.length, denom };
  }
  function byDept(role, denom = 'moe') { const studs = CP.scopedStudents(role); return CP.DEPARTMENTS.map((d) => { const ss = studs.filter((s) => s.dept === d.id); const base = denom === 'moe' ? ss.filter((s) => s.track === 'job') : ss; const placed = base.filter((s) => s.jobStatus !== 'preparing').length, hired = base.filter((s) => s.jobStatus === 'hired').length; return { ...d, total: ss.length, base: base.length, placed, hired, placeRate: base.length ? placed / base.length * 100 : 0, hireRate: base.length ? hired / base.length * 100 : 0 }; }).filter((d) => d.total > 0); }
  function byClass(role, denom = 'moe') { const studs = CP.scopedStudents(role); const map = {}; studs.forEach((s) => { const k = `${s.dept}-${s.cls}`; map[k] = map[k] || { dept: s.dept, cls: s.cls, total: 0, base: 0, placed: 0, hired: 0, certSum: 0 }; const r = map[k]; r.total++; const inBase = denom === 'all' || s.track === 'job'; if (inBase) { r.base++; if (s.jobStatus !== 'preparing') r.placed++; if (s.jobStatus === 'hired') r.hired++; } r.certSum += s.certs.filter((c) => c.status === 'verified').length; }); return Object.values(map).map((r) => ({ ...r, certAvg: r.total ? r.certSum / r.total : 0, placeRate: r.base ? r.placed / r.base * 100 : 0, hireRate: r.base ? r.hired / r.base * 100 : 0 })); }

  /* ───────── 발송 대상 추출 ───────── */
  function audience(role, cond) {
    const st = CP.load(); let list = CP.scopedStudents(role);
    if (cond.dept) list = list.filter((s) => s.dept === cond.dept);
    if (cond.job) list = list.filter((s) => s.job === cond.job);
    if (cond.noCert) list = list.filter((s) => { const g = gap(s); return g.must.ok < g.must.total; });
    if (cond.docPending) list = list.filter((s) => { const p = st.placements.find((x) => x.studentId === s.id); return p && CP.DOC_CHAIN.some((k) => !['signed', 'none'].includes(p.docs[k].status) || (k !== 'principal' && p.docs[k].status === 'none' && nextStep(p) === k)); });
    if (cond.proofPending) list = list.filter((s) => [...s.certs, ...s.langs, ...s.awards].some((x) => x.status === 'pending'));
    if (cond.placed) list = list.filter((s) => s.jobStatus !== 'preparing');
    if (cond.notPlaced) list = list.filter((s) => s.jobStatus === 'preparing');
    if (cond.optIn) list = list.filter((s) => s.jobAlertOptIn);
    if (cond.jobTrack) list = list.filter((s) => s.track === 'job');
    return list;
  }
  function fill(template, s, extra = {}) {
    const p = CP.placementOf(s.id); const j = p ? CP.job(p.jobId) : null; const exp = p ? expiresAt(p.docs.guardian) : null;
    const vars = Object.assign({ '학교명': CP.SCHOOL.short, '학생명': s.name, '받는분': s.guardian.name, '학부모명': s.guardian.name, '기업명': j ? j.company : '(배정 기업)', '직무': j ? j.role : s.job, '희망직무': s.job, '문서명': '보호자 사전동의서', '담당교사': '김도윤', '만료일시': CP.fmt.dt(CP.iso(CP.addDays(CP.TODAY, 3)) + 'T' + new Date().toTimeString().slice(0, 5)), '전화': CP.SCHOOL.phone, '시작일': j ? CP.fmt.date(j.start) : '—', '종료일': j ? CP.fmt.date(j.end) : '—', '일실습시간': j ? j.hoursPerDay : 7, '사전교육일': CP.fmt.date(CP.iso(CP.addDays(CP.TODAY, 3))), '마감일': CP.fmt.date(CP.iso(CP.addDays(CP.TODAY, 10))), '서명시각': CP.fmt.dt(new Date().toISOString()), '점검일': CP.fmt.date(CP.iso(CP.TODAY)), '항목': (s.certs.find((c) => c.status === 'rejected') || s.certs.find((c) => c.status === 'pending') || { name: '자격증' }).name }, extra);
    return template.body.replace(/#\{(.+?)\}/g, (_, k) => vars[k] !== undefined ? vars[k] : `#{${k}}`);
  }
  function sendCampaign(role, template, list, who = 'student') {
    const st = CP.load(); const now = `${CP.iso(CP.TODAY)} ${new Date().toTimeString().slice(0, 5)}`; let ok = 0, sms = 0; const reasons = {};
    list.forEach((s, i) => { const fail = ((i * 7 + s.id.charCodeAt(2)) % 13) === 0; const reason = fail ? ['inactive-72h', 'kakao-unregistered', 'bad-number'][i % 3] : ''; if (fail) { sms++; reasons[reason] = (reasons[reason] || 0) + 1; } else ok++; st.messages.unshift({ id: `m${Date.now().toString(36)}${i}`, at: now, templateId: template.id, to: who === 'guardian' ? `${s.guardian.name}(${s.guardian.rel})` : s.name, phone: who === 'guardian' ? s.guardian.phone : s.phone, studentId: s.id, channel: fail ? 'sms' : 'kakao', result: fail ? 'sms-fallback' : 'delivered', failReason: reason, who, campaign: true }); });
    CP.save(); CP.audit('알림 발송', `${template.name} · ${list.length}명 (알림톡 ${ok} · SMS 대체 ${sms})`);
    return { ok, sms, total: list.length, reasons, cost: ok * 13 + sms * 45 };
  }
  const FAIL_LABEL = { 'inactive-72h': '카톡 72시간 미사용', 'kakao-unregistered': '카카오톡 미가입', 'bad-number': '번호 오류', 'opt-out': '수신거부' };
  function sendWindow(template, hour) {
    const h = hour === undefined ? new Date().getHours() : hour; const night = h >= 21 || h < 8;
    if (template.status !== 'approved') return { ok: false, reason: template.status === 'review' ? '템플릿 심사 중(영업일 1~3일) — 승인 전에는 알림톡으로 보낼 수 없고 SMS로만 가능합니다' : `템플릿 반려 — ${template.reason || '수정 후 재심사'}` };
    if (template.kind === '광고성' && night) return { ok: false, reason: '광고성 정보는 21시~익일 8시 발송 금지(정보통신망법 §50③) — 예약 발송으로 전환하세요' };
    return { ok: true, night };
  }
  const readinessOk = () => (CP.load().readiness || []).filter((r) => r.k !== 'tpl').every((r) => r.done);

  /* ───────── 엑셀 일괄 업로드 검증(F11) ───────── */
  const TEMPLATE_COLS = ['학번', '이름', '학과', '반', '번호', '생년월일', '학생 연락처', '보호자 성명', '보호자 관계', '보호자 연락처', '희망 직무', '진로 트랙'];
  function sampleUploadRows() {
    const st = CP.load();
    const rows = st.students.slice(0, 8).map((s) => [s.sid, s.name, CP.dept(s.dept).name, s.cls, s.no, s.birth, s.phone, s.guardian.name, s.guardian.rel, s.guardian.phone, s.job, { job: '취업', college: '진학', military: '입대' }[s.track]]);
    rows.push(['3010199', '신예린', '스마트소프트웨어과', 1, 99, '2008-05-02', '1045671234', '신정숙', '모', '1034567890', '웹 개발자', '취업']);
    rows.push([st.students[2].sid, '최가온', '전기전자과', 1, 23, '2008-07-19', '010-2222-3333', '최병철', '부', '010-4444-5555', '전기 설비 기사', '취업']);
    rows.push(['3030299', '오하린', '경영회계', 2, 17, '08.03.21', '010-7777-8888', '오영희', '모', '010-9999-0000', '회계 사무원', '취업']);
    rows.push(['3050199', '장세아', '조리제과과', 1, 12, '2008-12-01', '010-1212-3434', '', '', '', '바리스타', '진학']);
    return rows;
  }
  function validateRows(rows) {
    const st = CP.load(); const seen = new Set(); const deptNames = CP.DEPARTMENTS.map((d) => d.name);
    return rows.map((r, i) => {
      const errs = [], warns = []; const [sid, name, deptName, , , birth, phone, gName, , gPhone, job] = r;
      if (!/^\d{7}$/.test(String(sid))) errs.push('학번 7자리 아님');
      if (seen.has(sid)) errs.push('파일 내 학번 중복'); seen.add(sid);
      const exists = st.students.find((s) => s.sid === sid); if (exists && exists.name !== name) errs.push(`학번 ${sid}는 이미 ${exists.name} 학생에게 등록됨`);
      if (!deptNames.includes(deptName)) errs.push(`학과명 "${deptName}" 기준표와 불일치`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) errs.push(`생년월일 서식(${birth}) → YYYY-MM-DD`);
      [phone, gPhone].forEach((p, k) => { const s = String(p || ''); if (!s) { (k ? errs : errs).push(`${k ? '보호자' : '학생'} 연락처 누락${k ? ' — 동의서 발송 불가' : ''}`); return; } if (/^\d{10}$/.test(s) && s.startsWith('10')) warns.push(`${k ? '보호자' : '학생'} 연락처 앞 0 소실(${s}) → 010-${s.slice(2, 6)}-${s.slice(6)} 로 복원`); else if (!/^010-\d{4}-\d{4}$/.test(s)) errs.push(`${k ? '보호자' : '학생'} 연락처 서식`); });
      if (!gName) errs.push('보호자 성명 누락');
      if (!specs()[job]) warns.push(`희망 직무 "${job}" 기준표에 없음 → 직접 분류 필요`);
      return { row: i + 2, data: r, errs, warns, status: errs.length ? 'error' : warns.length ? 'warn' : 'ok', update: !!exists };
    });
  }

  /* ───────── 파일 생성 ───────── */
  function downloadBlob(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
  function csv(name, header, rows) { const esc = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }; downloadBlob(name, new Blob(['﻿' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })); }
  function xlsx(name, sheets) {
    const enc = new TextEncoder(); const xmlEsc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const col = (n) => { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
    const sheetXml = (rows) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => typeof v === 'number' ? `<c r="${col(ci)}${ri + 1}"><v>${v}</v></c>` : `<c r="${col(ci)}${ri + 1}" t="inlineStr"><is><t>${xmlEsc(v)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
    const files = [['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`], ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`], ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xmlEsc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`], ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}</Relationships>`], ...sheets.map((s, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s.rows)])];
    const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
    const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
    const parts = [], central = []; let offset = 0; const u16 = (n) => [n & 255, (n >> 8) & 255], u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
    files.forEach(([fname, content]) => { const nameB = enc.encode(fname), data = enc.encode(content), crc = crc32(data); const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0), ...nameB]); parts.push(local, data); central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...nameB])); offset += local.length + data.length; });
    const cdSize = central.reduce((n, c) => n + c.length, 0); const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
    downloadBlob(name, new Blob([...parts, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  }

  global.CPX = { gap, guide, DOC_LABEL, DOC_SHORT, SIGNER, STATUS_LABEL, PSTATE_LABEL, PSTATE_KIND, EXPIRE_HOURS, docExpired, expiresAt, effStatus, canSend, nextStep, placementState, sendDoc, viewDoc, signDoc, reopen, hashHex, jobIssues, monthlyAllowance, kpis, byDept, byClass, audience, fill, sendCampaign, FAIL_LABEL, sendWindow, readinessOk, TEMPLATE_COLS, sampleUploadRows, validateRows, downloadBlob, csv, xlsx };
})(window);
