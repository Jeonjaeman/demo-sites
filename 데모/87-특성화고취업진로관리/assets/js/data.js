/* CAREERPASS 커리어패스 — 시드 데이터 + 상태 저장소
   모든 인물·기업·학교·수치는 가상입니다. 결정적 PRNG(mulberry32)로 매번 같은 시드를 만들고,
   사용자가 바꾼 상태는 localStorage('cp:state:v2')에 저장해 페이지를 넘나들어도 유지됩니다.
   설계 근거: 분석/기획_설계.md 발견 F1~F18 (교육부 2025 직업계고 현장실습 운영 매뉴얼 · 전자서명법 · 정보통신망법 §50 · 민법 §5) */
(function (global) {
  'use strict';
  const STORE_KEY = 'cp:state:v2';
  const ROLE_KEY = 'cp:role';

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const rnd = mulberry32(20261024);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const chance = (p) => rnd() < p;
  const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pad = (n, w = 2) => String(n).padStart(w, '0');

  /* ───────── 기준값 ───────── */
  const TODAY = new Date(2026, 9, 24); // 데모 고정 기준일 2026-10-24
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const SCHOOL = { name: '한빛직업고등학교', short: '한빛직업고', phone: '02-123-4567', dept: '취업지원부' }; // 가상 학교
  /* 운영 기준 — 교육부 2025 현장실습 운영 매뉴얼 (분석 문서 2장 표) */
  const RULES = {
    hoursPerDayMax: 7, hoursPerWeekMax: 35, extDayMax: 1, extWeekMax: 5,   // 1일 7h·주 35h, 서면 동의 시 1일 1h·주 5h 연장
    minWageHour2025: 4900, minWageHour2026: 5000,                             // 최저 현장실습 수당(시간당) — 2026은 추정(최저임금 10,320원 × 40% 산식)
    minWageHourNote: '2025 매뉴얼 4,900원/h · 2026 추정 5,000원/h(최저임금 10,320원 기준 산식, 2026 매뉴얼 확인 필요)',
    maxPracticeDays: 60, linkExpireHours: 72, breakMin4h: 30, breakMin8h: 60, mentorRatio: 1, nightStart: 22, nightEnd: 6,
  };

  const DEPARTMENTS = [
    { id: 'sw', name: '스마트소프트웨어과', short: '소프트웨어', color: '#3182f6', classes: 2 },
    { id: 'ee', name: '전기전자과', short: '전기전자', color: '#03b26c', classes: 2 },
    { id: 'ac', name: '경영회계과', short: '경영회계', color: '#fe9800', classes: 2 },
    { id: 'dc', name: '디자인콘텐츠과', short: '디자인', color: '#7454e6', classes: 1 },
    { id: 'ck', name: '조리제과과', short: '조리제과', color: '#f04452', classes: 1 },
  ];

  /* 희망 직무별 권장 스펙 — 학교가 편집하는 기준표(F10). 하드코딩이 아니라 상태(st.specs)로 저장되어 운영 화면에서 수정 → 갭이 재계산된다.
     kind: cert(자격증) / lang(어학) / exp(경험) / edu(교육). 자격 명칭은 공공데이터(한국산업인력공단 기능사 종목·공인민간자격) 일반 명칭. */
  const JOB_SPECS = {
    '웹 개발자': { dept: 'sw', items: [{ kind: 'cert', name: '정보처리기능사', must: true }, { kind: 'cert', name: '웹디자인기능사', must: false }, { kind: 'cert', name: 'SQLD', must: false }, { kind: 'cert', name: '리눅스마스터 2급', must: false }, { kind: 'exp', name: '웹 프로젝트 포트폴리오 1건 이상', must: true }, { kind: 'edu', name: '교내 앱·웹 방과후 과정 수료', must: false }] },
    '네트워크·보안 엔지니어': { dept: 'sw', items: [{ kind: 'cert', name: '정보처리기능사', must: true }, { kind: 'cert', name: '네트워크관리사 2급', must: true }, { kind: 'cert', name: '리눅스마스터 2급', must: false }, { kind: 'cert', name: '정보보안기사(필기)', must: false }, { kind: 'exp', name: '서버 구축 실습 기록', must: false }] },
    '전기 설비 기사': { dept: 'ee', items: [{ kind: 'cert', name: '전기기능사', must: true }, { kind: 'cert', name: '승강기기능사', must: false }, { kind: 'cert', name: '소방설비기능사', must: false }, { kind: 'exp', name: '현장실습 또는 전기 설비 실습 60시간', must: true }, { kind: 'edu', name: '산업안전 교육 이수', must: true }] },
    '전자 생산·품질': { dept: 'ee', items: [{ kind: 'cert', name: '전자기기기능사', must: true }, { kind: 'cert', name: '전자캐드기능사', must: false }, { kind: 'cert', name: '컴퓨터활용능력 2급', must: false }, { kind: 'exp', name: 'PCB 제작 실습 기록', must: false }, { kind: 'edu', name: '산업안전 교육 이수', must: true }] },
    '회계 사무원': { dept: 'ac', items: [{ kind: 'cert', name: '전산회계 1급', must: true }, { kind: 'cert', name: '전산세무 2급', must: false }, { kind: 'cert', name: '컴퓨터활용능력 1급', must: false }, { kind: 'cert', name: 'ERP정보관리사(회계) 2급', must: false }, { kind: 'lang', name: 'TOEIC 550 이상', must: false }] },
    '사무 행정·총무': { dept: 'ac', items: [{ kind: 'cert', name: '컴퓨터활용능력 2급', must: true }, { kind: 'cert', name: '워드프로세서', must: false }, { kind: 'cert', name: '비서 2급', must: false }, { kind: 'cert', name: 'ITQ 한글 A등급', must: false }, { kind: 'lang', name: 'TOEIC 500 이상', must: false }] },
    '웹·UI 디자이너': { dept: 'dc', items: [{ kind: 'cert', name: '컴퓨터그래픽스운용기능사', must: true }, { kind: 'cert', name: 'GTQ 1급', must: true }, { kind: 'cert', name: '웹디자인기능사', must: false }, { kind: 'exp', name: '디자인 포트폴리오 5점 이상', must: true }] },
    '영상·모션 그래픽': { dept: 'dc', items: [{ kind: 'cert', name: 'GTQ 1급', must: false }, { kind: 'cert', name: '멀티미디어콘텐츠제작전문가', must: false }, { kind: 'exp', name: '영상 포트폴리오 3편 이상', must: true }, { kind: 'edu', name: '영상 편집 방과후 과정 수료', must: false }] },
    '한식·양식 조리사': { dept: 'ck', items: [{ kind: 'cert', name: '한식조리기능사', must: true }, { kind: 'cert', name: '양식조리기능사', must: false }, { kind: 'cert', name: '위생교육 이수증', must: true }, { kind: 'exp', name: '단체급식 또는 외식업 실습 40시간', must: false }] },
    '제과·제빵사': { dept: 'ck', items: [{ kind: 'cert', name: '제과기능사', must: true }, { kind: 'cert', name: '제빵기능사', must: true }, { kind: 'cert', name: '위생교육 이수증', must: true }, { kind: 'exp', name: '베이커리 실습 40시간', must: false }] },
  };
  const JOBS_BY_DEPT = {};
  Object.entries(JOB_SPECS).forEach(([job, s]) => { (JOBS_BY_DEPT[s.dept] = JOBS_BY_DEPT[s.dept] || []).push(job); });

  const LANG_TESTS = ['TOEIC', 'TOEIC Speaking', 'JLPT', 'OPIc'];
  const AWARDS = ['교내 기능경기대회 은상', '교내 기능경기대회 동상', '지방기능경기대회 장려상', '교내 창업 아이디어 공모전 우수상', '시 청소년 UCC 공모전 입선', '교내 캡스톤 디자인 최우수상', '전국 상업경진대회 장려상', '교내 독서토론대회 우수상'];
  const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍'];
  const GIVEN = ['서준', '하준', '도윤', '시우', '지호', '예준', '지유', '서윤', '하은', '민서', '지안', '수아', '유진', '채원', '지민', '현우', '준서', '건우', '우진', '민준', '다은', '은서', '소율', '나윤', '예린', '지우', '승현', '태윤', '연우', '하린', '세아', '주원', '시은', '지훈', '민재', '수빈', '가은', '유나', '서현', '도현'];
  const COMPANY_PREFIX = ['한결', '푸른', '세움', '다온', '온누리', '하늘', '새벽', '바른', '열린', '참빛', '늘품', '미래'];
  const COMPANY_SUFFIX = { sw: ['소프트', '시스템즈', '테크', '랩스'], ee: ['전기', '일렉트로닉스', '이엔지', '전자'], ac: ['세무회계', '물류', '유통', '상사'], dc: ['디자인', '스튜디오', '미디어', '크리에이티브'], ck: ['베이커리', '푸드', '키친', '외식'] };
  const ISSUERS = { 기능사: '한국산업인력공단', 정보처리기능사: '한국산업인력공단', SQLD: '한국데이터산업진흥원', '리눅스마스터 2급': '한국정보통신인력개발센터', '네트워크관리사 2급': '한국정보통신자격협회', '전산회계 1급': '한국세무사회', '전산세무 2급': '한국세무사회', '컴퓨터활용능력 1급': '대한상공회의소', '컴퓨터활용능력 2급': '대한상공회의소', 워드프로세서: '대한상공회의소', 'ITQ 한글 A등급': '한국생산성본부', 'GTQ 1급': '한국생산성본부', '비서 2급': '대한상공회의소', 'ERP정보관리사(회계) 2급': '한국생산성본부', '위생교육 이수증': '한국외식업중앙회', '정보보안기사(필기)': '한국방송통신전파진흥원', 멀티미디어콘텐츠제작전문가: '한국산업인력공단' };
  const issuerOf = (n) => ISSUERS[n] || (n.includes('기능사') ? '한국산업인력공단' : '발급기관');

  /* 동의·협약 문서 체인(F1·F2): 보호자 사전동의 → 학생 사전동의 → 표준협약서(기업 대표 서명) → 학교장 날인. 순서가 잠긴다.
     상태: none → sent → viewed → signed · expired · declined */
  const DOC_CHAIN = ['guardian', 'student', 'agreement', 'principal'];

  /* ───────── 시드 생성 ───────── */
  function buildSeed() {
    const students = [];
    const usedNames = new Set();
    let seq = 1;
    DEPARTMENTS.forEach((d, di) => {
      for (let c = 1; c <= d.classes; c++) {
        const n = between(17, 21);
        for (let i = 1; i <= n; i++) {
          let name; do { name = pick(SURNAMES) + pick(GIVEN); } while (usedNames.has(name) && chance(0.7)); usedNames.add(name);
          const job = pick(JOBS_BY_DEPT[d.id]);
          const sid = `3${pad(di + 1)}${pad(c)}${pad(i)}`;
          const birth = `${chance(0.85) ? 2008 : 2009}-${pad(between(1, 12))}-${pad(between(1, 28))}`;
          const rel = pick(['모', '부', '모', '부', '모', '조모', '부']);
          students.push({
            id: `s${pad(seq++, 3)}`, sid, name, dept: d.id, cls: c, no: i, birth, phone: `010-${between(2000, 9899)}-${pad(between(0, 9999), 4)}`,
            job, goal: pick(['졸업 후 바로 취업', '취업 후 재직자 전형 진학', '전문대 진학 후 취업', '공기업·공공기관 취업']),
            track: chance(0.45) ? 'college' : chance(0.03) ? 'military' : 'job',      // F9 취업률 분모: 진학·입대 제외
            infoConsent: chance(0.7),                                                   // F8 기업 열람용 정보 제공 동의
            jobAlertOptIn: chance(0.55),                                                // F4 채용 공고 안내 신청(정보성 발송 근거)
            guardian: { name: pick(SURNAMES) + pick(['영희', '미경', '성호', '정숙', '현주', '동현', '은정', '재호', '수진', '병철']), rel, phone: `010-${between(2000, 9899)}-${pad(between(0, 9999), 4)}`, legal: rel !== '조모' },
            certs: [], langs: [], awards: [], portfolio: [], memos: [], jobStatus: 'preparing',
          });
        }
      }
    });
    // 진학 트랙 학생은 취업 희망 목표를 진학형으로
    students.forEach((s) => { if (s.track === 'college') s.goal = pick(['전문대 진학 후 취업', '취업 후 재직자 전형 진학', '4년제 진학']); });

    let certSeq = 1;
    students.forEach((s) => {
      const certNames = JOB_SPECS[s.job].items.filter((x) => x.kind === 'cert').map((x) => x.name);
      const own = certNames.filter(() => chance(0.45));
      if (chance(0.25)) own.push(pick(['컴퓨터활용능력 2급', 'ITQ 한글 A등급', '워드프로세서', '정보처리기능사']));
      [...new Set(own)].forEach((name) => { const d = addDays(TODAY, -between(20, 540)); s.certs.push({ id: `c${pad(certSeq++, 4)}`, name, issuer: issuerOf(name), no: `${between(20, 26)}${pad(between(100000, 999999), 6)}`, date: iso(d), file: `${name.replace(/\s/g, '_')}.pdf`, status: chance(0.72) ? 'verified' : (chance(0.8) ? 'pending' : 'rejected'), note: '', verifiedBy: '', verifiedAt: '' }); });
      s.certs.forEach((c) => { if (c.status === 'verified') { c.verifiedBy = '담임'; c.verifiedAt = iso(addDays(new Date(c.date), between(2, 14))); } if (c.status === 'rejected') c.note = pick(['파일이 흐려서 내용을 읽을 수 없음', '자격증명과 파일 내용이 다름']); });
      if (chance(0.3)) { const t = pick(LANG_TESTS); s.langs.push({ id: `l${pad(certSeq++, 4)}`, test: t, score: t === 'TOEIC' ? between(420, 780) : t === 'JLPT' ? pick(['N3', 'N2']) : pick(['IM1', 'IM2', 'IL']), date: iso(addDays(TODAY, -between(30, 400))), file: `${t}_성적표.pdf`, status: chance(0.7) ? 'verified' : 'pending' }); }
      if (chance(0.35)) s.awards.push({ id: `a${pad(certSeq++, 4)}`, name: pick(AWARDS), date: iso(addDays(TODAY, -between(30, 600))), file: '상장.jpg', status: chance(0.8) ? 'verified' : 'pending' });
      const pv = chance(0.15) ? 0 : chance(0.5) ? 1 : chance(0.7) ? 2 : 3;
      for (let v = 1; v <= pv; v++) s.portfolio.push({ ver: v, file: `${s.name}_포트폴리오_v${v}.pdf`, date: iso(addDays(TODAY, -(pv - v + 1) * between(20, 45))), size: `${(between(12, 48) / 10).toFixed(1)}MB`, memo: v === pv ? '최신' : '' });
      if (chance(0.25)) s.portfolio.push({ ver: 0, file: `${s.name}_자기소개서_v${between(1, 3)}.docx`, date: iso(addDays(TODAY, -between(5, 90))), size: `${between(40, 120)}KB`, memo: '자기소개서', kind: 'resume' });
      if (chance(0.4)) s.memos.push({ date: iso(addDays(TODAY, -between(10, 120))), by: '담임', text: pick(['희망 직무 변경 고민 중 — 2학기 상담 재실시', '자격증 실기 일정 확인, 11월 응시 예정', '학부모 상담: 실습 지역은 서울·경기 희망', '포트폴리오 v2 피드백 전달, 반영 확인 필요']) });
    });

    /* 기업 공고 — 표준협약서 법정 항목 1:1(F7): 시간당 수당·1일/주 시간·연장 동의·휴게·야간 금지·기업현장교사·산재보험·기업 승인 상태·유해위험 */
    const jobs = [];
    let jSeq = 1;
    const approvals = ['leading', 'leading', 'participating', 'participating', 'participating', 'leading', 'participating', 'none', 'leading', 'participating', 'none', 'leading'];
    DEPARTMENTS.forEach((d) => {
      const count = d.id === 'sw' || d.id === 'ee' ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const role = pick(JOBS_BY_DEPT[d.id]);
        const idx = jobs.length;
        const ongoingIdx = [0, 4, 8, 11];
        const start = ongoingIdx.includes(idx) ? addDays(TODAY, -between(12, 30)) : addDays(TODAY, between(6, 28));
        const weeks = pick([4, 6, 8, 12]);
        const wageHour = idx === 3 ? 4800 : pick([5000, 5200, 5500, 6000, 6500, 7000]); // 1곳은 최저 미만(경고 시연)
        const hoursPerDay = idx === 6 ? 8 : 7, hoursPerWeek = idx === 6 ? 40 : 35;         // 1곳은 시간 초과(배정 잠금 시연)
        jobs.push({
          id: `j${pad(jSeq++, 2)}`, company: pick(COMPANY_PREFIX) + pick(COMPANY_SUFFIX[d.id]), dept: d.id,
          industry: { sw: '정보통신업', ee: '제조업(전기·전자)', ac: '전문서비스업', dc: '정보서비스업(콘텐츠)', ck: '숙박·음식점업' }[d.id], role,
          wageHour, hoursPerDay, hoursPerWeek, extension: false, breakMin: hoursPerDay >= 8 ? 60 : 30, payDay: 25,
          start: iso(start), end: iso(addDays(start, weeks * 7)), weeks, days: weeks * 5, headcount: between(1, 4), mentors: between(1, 3),
          approval: approvals[idx % approvals.length], hazard: idx === 6, insurance: idx !== 9, safetyEdu: true,
          region: pick(['서울 마포구', '서울 구로구', '서울 금천구', '경기 부천시', '경기 성남시', '인천 서구', '서울 영등포구']),
          status: start < TODAY ? 'ongoing' : 'open', contact: `${pick(SURNAMES)}${pick(['과장', '대리', '팀장', '실장'])}`, ceo: `${pick(SURNAMES)}${pick(GIVEN)} 대표`, createdAt: iso(addDays(start, -between(20, 40))),
        });
      }
    });

    /* 배정 — 문서 체인 4단 (보호자 → 학생 → 기업 → 학교장) 순서에 맞게 상태를 만든다 */
    const placements = [];
    let pSeq = 1;
    const mkDoc = (sentAt, status) => { const base = { status }; if (status !== 'none') base.sentAt = iso(sentAt); if (['viewed', 'signed'].includes(status)) base.viewedAt = iso(addDays(sentAt, 1)); if (status === 'signed') { base.signedAt = iso(addDays(sentAt, between(1, 2))); base.signedTime = `${base.signedAt}T${pad(between(9, 21))}:${pad(between(0, 59))}:00`; } return base; };
    jobs.forEach((j) => {
      if (j.approval === 'none' || j.hoursPerDay > RULES.hoursPerDayMax || j.wageHour < RULES.minWageHour2025 || !j.insurance) return; // 기준 초과·미승인 기업은 배정 불가(F7)
      const pool = students.filter((s) => s.dept === j.dept && s.jobStatus === 'preparing' && s.track === 'job' && s.job === j.role);
      const alt = students.filter((s) => s.dept === j.dept && s.jobStatus === 'preparing' && s.track === 'job');
      const n = Math.min(j.headcount, j.status === 'ongoing' ? j.headcount : between(1, j.headcount));
      for (let k = 0; k < n; k++) {
        const s = pool.find((x) => x.jobStatus === 'preparing') || alt.find((x) => x.jobStatus === 'preparing'); if (!s) break;
        s.jobStatus = 'placed';
        const sentAt = addDays(TODAY, -between(1, 12));
        // 진행 깊이: 0 미발송 · 1 보호자 진행 · 2 보호자 완료+학생 진행 · 3 학생 완료+기업 진행 · 4 기업 완료+날인 대기 · 5 전부 완료
        const openIdx = placements.filter((x) => jobs.find((jj) => jj.id === x.jobId).status === 'open').length;
        const depth = j.status === 'ongoing' ? 5 : [1, 1, 2, 0, 3, 1, 4, 2, 5, 1, 3, 2, 0, 4, 1, 5][openIdx % 16];
        const prog = () => pick(['sent', 'viewed', 'viewed']);
        const old = addDays(TODAY, -between(8, 14));   // 완료된 단계의 발송일
        const recent = addDays(TODAY, -between(0, 2)); // 진행 중 단계의 발송일(72시간 이내)
        const docs = {
          guardian: depth === 0 ? { status: 'none' } : depth === 1 ? mkDoc(openIdx === 1 ? addDays(TODAY, -6) : recent, openIdx === 1 ? 'expired' : prog()) : mkDoc(old, 'signed'),
          student: depth <= 1 ? { status: 'none' } : depth === 2 ? mkDoc(recent, prog()) : mkDoc(addDays(old, 2), 'signed'),
          agreement: depth <= 2 ? { status: 'none' } : depth === 3 ? mkDoc(recent, prog()) : mkDoc(addDays(old, 4), 'signed'),
          principal: depth <= 3 ? { status: 'none', internal: true } : depth === 4 ? { status: 'sent', sentAt: iso(recent), internal: true } : Object.assign(mkDoc(addDays(old, 6), 'signed'), { internal: true }),
        };
                if (docs.guardian.status === 'signed') { docs.guardian.rel = s.guardian.rel; docs.guardian.hash = ''; docs.guardian.otp = true; }
        placements.push({ id: `p${pad(pSeq++, 3)}`, studentId: s.id, jobId: j.id, assignedAt: iso(addDays(sentAt, -1)), docs, version: 1, history: [], hifive: depth === 5 && chance(0.6), token: `t${s.id.slice(1)}${j.id.slice(1)}${between(100, 999)}`, visits: [] });
      }
    });
    // 거부 1건 심기
    const dec = placements.filter((p) => ['sent', 'viewed'].includes(p.docs.guardian.status) && p.docs.student.status === 'none')[0]; if (dec) { dec.docs.guardian = { status: 'declined', sentAt: iso(addDays(TODAY, -3)), viewedAt: iso(addDays(TODAY, -2)), declinedAt: iso(addDays(TODAY, -2)), reason: '실습 기간·시간이 맞지 않음' }; }
    // 취업 확정: 진행 중 실습 일부 + 직접 취업 일부 — 취업(전환) 동의서(F17) 상태 포함
    students.filter((s) => s.jobStatus === 'placed').forEach((s) => { const p = placements.find((x) => x.studentId === s.id); if (p && jobs.find((j) => j.id === p.jobId).status === 'ongoing' && chance(0.4)) { s.jobStatus = 'hired'; p.employment = { guardian: mkDoc(addDays(TODAY, -5), chance(0.6) ? 'signed' : 'sent'), student: mkDoc(addDays(TODAY, -5), chance(0.5) ? 'signed' : 'none') }; } });
    students.filter((s) => s.jobStatus === 'preparing' && s.track === 'job').forEach((s) => { if (chance(0.08)) s.jobStatus = 'hired'; });

    /* 현장 점검 일지(순회지도) */
    const visits = [];
    placements.filter((p) => jobs.find((j) => j.id === p.jobId).status === 'ongoing').forEach((p, i) => { if (i % 3 === 2) return; visits.push({ id: `v${pad(i + 1, 3)}`, placementId: p.id, date: iso(addDays(TODAY, -between(2, 20))), by: '취업지원부', items: { safety: true, hours: chance(0.85), task: true, allowance: chance(0.9), intro: chance(0.8) }, incident: null, note: pick(['실습 내용 협약서와 일치. 입문교육 이수 확인.', '주 35시간 준수 확인. 멘토 교체 예정 — 다음 점검 시 확인.', '실습 수당 지급 내역 확인. 학생 만족도 높음.', '작업 범위가 협약서보다 넓어 조정 요청함.']) }); });

    /* 알림톡 템플릿 — 승인 상태가 발송 가능 여부를 좌우(F4). 채용 공고 일괄 안내는 반려 → 신청자 대상 정보성 템플릿으로 대체 */
    const templates = [
      { id: 'T01', name: '동의서 서명 요청', kind: '정보성', status: 'approved', body: '[#{학교명}] #{받는분}님, #{학생명} 학생의 현장실습(#{기업명}) #{문서명} 서명을 요청드립니다. 아래 버튼에서 내용을 확인하고 서명해 주세요.\n유효기간: #{만료일시}까지 · 담당 #{담당교사}', buttons: ['동의서 확인·서명'] },
      { id: 'T02', name: '동의서 서명 독려(재안내)', kind: '정보성', status: 'approved', body: '[#{학교명}] #{받는분}님, #{학생명} 학생 현장실습 #{문서명}가 아직 서명되지 않았습니다. #{만료일시}까지 서명 부탁드립니다.\n문의: #{학교명} 취업지원부 #{전화}', buttons: ['동의서 확인·서명'] },
      { id: 'T03', name: '현장실습 일정 안내', kind: '정보성', status: 'approved', body: '[#{학교명}] #{학생명} 학생의 현장실습 일정을 안내드립니다.\n기업: #{기업명} · 기간: #{시작일}~#{종료일} · 1일 #{일실습시간}시간\n사전 안전교육: #{사전교육일} · 담당 #{담당교사}', buttons: [] },
      { id: 'T04', name: '맞춤 채용 공고 안내(일괄)', kind: '광고성', status: 'rejected', reason: '수신자가 요청하지 않은 정보 제공 — 정보성 템플릿 기준 미충족(카카오 알림톡 가이드). 신청자 대상 T07로 대체', body: '[#{학교명}] #{학생명} 학생의 희망 직무(#{희망직무})에 맞는 채용 공고를 안내드립니다. #{기업명} · #{직무} · 마감 #{마감일}', buttons: ['공고 보기'] },
      { id: 'T05', name: '증빙 서류 보완 요청', kind: '정보성', status: 'review', body: '[#{학교명}] #{학생명} 학생, 등록한 #{항목}의 증빙 파일이 확인되지 않아 보완이 필요합니다. 학생 앱 > 내 이력에서 다시 올려 주세요.', buttons: ['내 이력 열기'] },
      { id: 'T06', name: '서명 완료 사본 안내', kind: '정보성', status: 'approved', body: '[#{학교명}] #{받는분}님, #{학생명} 학생의 #{문서명} 서명이 #{서명시각}에 완료되었습니다. 서명본 사본은 아래 버튼에서 확인하실 수 있습니다. 본인이 서명한 것이 아니라면 즉시 #{전화}로 알려 주세요.', buttons: ['서명본 보기'] },
      { id: 'T07', name: '채용 알림 신청자 공고 안내', kind: '정보성', status: 'approved', note: '학생이 「채용 공고 안내 받기」를 신청한 경우에만 발송(수신자 요청에 대한 피드백 → 정보성)', body: '[#{학교명}] #{학생명} 학생이 신청한 채용 공고 알림입니다.\n#{기업명} · #{직무} · 마감 #{마감일}\n알림 해지: 학생 앱 > 알림 설정', buttons: ['공고 보기'], optInOnly: true },
      { id: 'T08', name: '현장 점검 결과 안내(보호자)', kind: '정보성', status: 'approved', body: '[#{학교명}] #{받는분}님, #{학생명} 학생의 현장실습(#{기업명}) #{점검일} 점검 결과를 안내드립니다. 안전·실습시간·수당 지급 모두 확인되었습니다. 문의 #{전화}', buttons: [] },
    ];

    /* 발송 이력 — 실패 사유 코드(F5): kakao-unregistered(카톡 미가입) · inactive-72h(72시간 미사용) · bad-number(번호 오류) · opt-out(수신거부) */
    const messages = [];
    let mSeq = 1;
    const FAIL = ['inactive-72h', 'kakao-unregistered', 'bad-number', 'inactive-72h'];
    placements.forEach((p) => {
      ['guardian', 'student'].forEach((who) => {
        const d = p.docs[who]; if (d.status === 'none') return;
        const s = students.find((x) => x.id === p.studentId);
        const fail = chance(0.08);
        messages.push({ id: `m${pad(mSeq++, 4)}`, at: `${d.sentAt} ${pad(between(9, 17))}:${pad(between(0, 59))}`, templateId: 'T01', to: who === 'guardian' ? `${s.guardian.name}(${s.guardian.rel})` : s.name, phone: who === 'guardian' ? s.guardian.phone : s.phone, studentId: s.id, channel: fail ? 'sms' : 'kakao', result: fail ? 'sms-fallback' : (d.status === 'sent' ? 'delivered' : 'read'), failReason: fail ? pick(FAIL) : '', placementId: p.id, who });
        if (d.status === 'signed') messages.push({ id: `m${pad(mSeq++, 4)}`, at: `${d.signedAt} ${pad(between(9, 21))}:${pad(between(0, 59))}`, templateId: 'T06', to: who === 'guardian' ? `${s.guardian.name}(${s.guardian.rel})` : s.name, phone: who === 'guardian' ? s.guardian.phone : s.phone, studentId: s.id, channel: 'kakao', result: 'read', placementId: p.id, who });
      });
    });
    students.filter((s) => s.dept === 'sw' && s.jobAlertOptIn).slice(0, 9).forEach((s, i) => { messages.push({ id: `m${pad(mSeq++, 4)}`, at: `${iso(addDays(TODAY, -3))} 10:${pad(10 + i)}`, templateId: 'T07', to: s.name, phone: s.phone, studentId: s.id, channel: 'kakao', result: i % 4 === 0 ? 'delivered' : 'read', campaign: true }); });

    /* 졸업생 보존·파기 스케줄(F12) — 작년 졸업생 집계(가상) */
    const retention = { graduatedAt: '2026-02-10', total: 148, followUpConsent: 61, destroyed: 0, destroyDue: '2026-02-15', followUpUntil: '2027-08-10' };
    /* 발송 준비 체크리스트(F5) */
    const readiness = [{ k: 'channel', label: '카카오톡 채널 개설(학교 명의)', done: true, by: '행정실', at: '2026-09-02' }, { k: 'biz', label: '비즈니스 채널 인증(고유번호증)', done: true, at: '2026-09-09' }, { k: 'profile', label: '발신프로필 등록(@한빛직업고)', done: true, at: '2026-09-12' }, { k: 'sender', label: '문자 발신번호 사전등록(02-123-4567 · 통신서비스 이용증명원)', done: true, at: '2026-09-15' }, { k: 'tpl', label: '알림톡 템플릿 심사 — 승인 6 · 심사 중 1 · 반려 1', done: false, at: '' }, { k: 'balance', label: '발송 선불 충전 잔액 184,200원', done: true, at: '' }];
    const specs = JSON.parse(JSON.stringify(JOB_SPECS));
    return { students, jobs, placements, visits, templates, messages, uploads: [], audit: [], specs, retention, readiness, applications: [] };
  }

  /* ───────── 상태 저장소 ───────── */
  let state = null;
  function load() { if (state) return state; try { const raw = localStorage.getItem(STORE_KEY); if (raw) { state = JSON.parse(raw); if (state && state.students && state.students.length && state.specs) return state; } } catch (e) { /* ignore */ } state = buildSeed(); save(); return state; }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
  function reset() { try { localStorage.removeItem(STORE_KEY); localStorage.removeItem('cp:state:v1'); } catch (e) { /* ignore */ } state = null; return load(); }

  /* 역할 — teacher(담임: 본인 학급) / staff(취업지원부: 전체 열람·배정·발송) / admin(총괄 관리자: + 권한·연동·날인) */
  const ROLES = {
    teacher: { id: 'teacher', name: '담임교사', person: '박지현 선생님', scope: '스마트소프트웨어과 3학년 1반', dept: 'sw', cls: 1, can: { viewAll: false, assign: false, send: false, exportGov: false, manageRoles: false, seal: false, verify: true, memo: true } },
    staff: { id: 'staff', name: '취업지원부', person: '김도윤 선생님', scope: '전체 학과 열람·배정·발송', can: { viewAll: true, assign: true, send: true, exportGov: true, manageRoles: false, seal: false, verify: true, memo: true } },
    admin: { id: 'admin', name: '총괄 관리자', person: '이수민 교감', scope: '전체 + 학교장 날인 대행·권한·연동', can: { viewAll: true, assign: true, send: true, exportGov: true, manageRoles: true, seal: true, verify: true, memo: true } },
  };
  function getRole() { try { return ROLES[localStorage.getItem(ROLE_KEY)] || null; } catch (e) { return null; } }
  function setRole(id) { try { if (id) localStorage.setItem(ROLE_KEY, id); else localStorage.removeItem(ROLE_KEY); } catch (e) { /* ignore */ } }

  const dept = (id) => DEPARTMENTS.find((d) => d.id === id);
  const student = (id) => load().students.find((s) => s.id === id);
  const job = (id) => load().jobs.find((j) => j.id === id);
  const placement = (id) => load().placements.find((p) => p.id === id);
  const placementByToken = (t) => load().placements.find((p) => p.token === t);
  const placementOf = (studentId) => load().placements.find((p) => p.studentId === studentId);
  function scopedStudents(role) { const all = load().students; if (!role || role.can.viewAll) return all; return all.filter((s) => s.dept === role.dept && s.cls === role.cls); }
  function audit(action, detail) { const st = load(); const role = getRole(); st.audit.unshift({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), by: role ? role.person : '외부(링크)', action, detail }); if (st.audit.length > 300) st.audit.length = 300; save(); }
  const ENROLLMENT = { total: 486, g1: 164, g2: 170 };
  const age = (birth) => { const b = new Date(birth); let a = TODAY.getFullYear() - b.getFullYear(); if (TODAY < new Date(TODAY.getFullYear(), b.getMonth(), b.getDate())) a--; return a; };

  global.CP = { STORE_KEY, TODAY, iso, addDays, SCHOOL, RULES, DEPARTMENTS, JOB_SPECS, JOBS_BY_DEPT, DOC_CHAIN, ROLES, ENROLLMENT, issuerOf, age,
    load, save, reset, getRole, setRole, dept, student, job, placement, placementByToken, placementOf, scopedStudents, audit,
    fmt: { won: (n) => Math.round(n).toLocaleString('ko-KR') + '원', pct: (n) => (Math.round(n * 10) / 10).toFixed(1) + '%', date: (s) => s ? String(s).slice(0, 10).replace(/-/g, '.') : '—', dt: (s) => s ? String(s).replace('T', ' ').slice(0, 16).replace(/-/g, '.') : '—', phoneMask: (p) => p ? p.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3') : '', nameMask: (n) => n ? (n.length <= 2 ? n[0] + '○' : n[0] + '○' + n.slice(2)) : '' },
  };
})(window);
