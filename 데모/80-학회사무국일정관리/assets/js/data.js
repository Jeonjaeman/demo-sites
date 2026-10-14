/* BUREAU 뷰로 — 데모 시드 데이터
   ※ 학회명·인물·일정은 전부 가상입니다. 날짜는 "오늘" 기준 상대값으로 생성되어 언제 열어도 살아 있는 화면이 됩니다. */
(function (W) {
  'use strict';
  const { addDays, startOfWeek, iso, nextBiz, dow } = W.B;

  const ORG = { name: '대한가온의학회 사무국', short: '가온의학회', note: '가상의 학회입니다' };

  const CATS = [
    { id: 'conf', name: '학술대회', color: '#1d9bf0', desc: '춘·추계 학술대회 준비와 운영' },
    { id: 'edu', name: '교육·연수', color: '#00ba7c', desc: '연수강좌·워크숍·전공의 교육' },
    { id: 'comm', name: '위원회', color: '#7856ff', desc: '이사회·평의원회·각 위원회' },
    { id: 'grant', name: '연구비', color: '#ff7a00', desc: '연구과제 협약·집행·정산' },
    { id: 'intl', name: '국제교류', color: '#f91880', desc: '해외 학회·자매학회 교류' },
    { id: 'admin', name: '행정·총무', color: '#e6b800', desc: '회비·회계·시설·공문' },
    { id: 'away', name: '부재', color: '#8b98a5', desc: '휴가·외근·출장 — 팀 현황에 표시' }
  ];

  const USERS = [
    { id: 'u1', name: '정혜원', title: '사무국장', dept: '사무국', role: 'admin', avc: '#0f1419', handle: 'hyewon', active: true },
    { id: 'u2', name: '강민석', title: '학술팀장', dept: '학술팀', role: 'manager', avc: '#1d9bf0', handle: 'minseok', active: true },
    { id: 'u3', name: '박서연', title: '학술팀 주임', dept: '학술팀', role: 'staff', avc: '#4aa8e6', handle: 'seoyeon', active: true },
    { id: 'u4', name: '최윤재', title: '교육팀 대리', dept: '교육팀', role: 'staff', avc: '#00ba7c', handle: 'yunjae', active: true },
    { id: 'u5', name: '김다인', title: '위원회 담당', dept: '운영팀', role: 'staff', avc: '#7856ff', handle: 'dain', active: true },
    { id: 'u6', name: '한지우', title: '연구비 담당', dept: '운영팀', role: 'staff', avc: '#ff7a00', handle: 'jiwoo', active: true },
    { id: 'u7', name: '윤채린', title: '국제교류 담당', dept: '운영팀', role: 'staff', avc: '#f91880', handle: 'chaerin', active: true },
    { id: 'u8', name: '오태경', title: '총무·회계', dept: '사무국', role: 'admin', avc: '#c79a00', handle: 'taekyung', active: true },
    { id: 'u9', name: '서하늘', title: '학회지·홍보', dept: '운영팀', role: 'staff', avc: '#536471', handle: 'haneul', active: true },
    { id: 'u10', name: '문지성', title: '전 교육팀 주임', dept: '교육팀', role: 'staff', avc: '#8b98a5', handle: 'jiseong', active: false, leftAt: '2026-09-30' }
  ];

  const ROOMS = [
    { id: 'r1', name: '대회의실', cap: 12, alias: ['큰회의실', '대회'] },
    { id: 'r2', name: '소회의실', cap: 6, alias: ['작은회의실'] },
    { id: 'r3', name: '국장실', cap: 4, alias: [] },
    { id: 'online', name: '온라인', cap: 0, alias: ['줌', 'Zoom', '화상', '웹엑스'] },
    { id: 'ext', name: '외부 장소', cap: 0, alias: ['외부'] }
  ];

  /* 외부 기관 마감 규칙 (리서치 F8 — 근거 URL 확인분만 단정)
     base: 'start' = 행사 첫날 기준 / 'end' = 행사 마지막 날 기준
     기한이 주말·공휴일이면 "안전 기한" = 직전 영업일로 당겨 등록 (원래 법정 기한도 함께 표기) */
  const DEADLINE_RULES = [
    { id: 'kpbma-apply', kinds: ['conf'], base: 'start', d: -90, t: '제약사 학술대회 지원 신청', org: '한국제약바이오협회 · 공정경쟁규약',
      note: '개최 90일 전까지 신청. 2026.7.1부터 공인 학술대회만 후원 허용, 사전신고 누락·지연 시 경고·최대 1천만원.',
      src: 'https://dailypharm.com/user/news/334656', who: 'lead' },
    { id: 'kma-apply', kinds: ['conf', 'edu'], base: 'start', d: -20, t: '연수평점 신청', org: '대한의사협회 KMA교육센터',
      note: '교육실시 20일 이전 온라인 신청.', src: 'https://edu.kma.org/dataRoom/eduCompany', who: 'reg' },
    { id: 'kma-change', kinds: ['conf', 'edu'], base: 'start', d: -5, t: '평점 계획 변경 기한', org: '대한의사협회 KMA교육센터',
      note: '연자·시간 변경은 5일 이전까지 유선·공문.', src: 'https://edu.kma.org/dataRoom/eduCompany', who: 'reg' },
    { id: 'kma-report', kinds: ['conf', 'edu'], base: 'end', d: 28, t: '평점 참석자 입력', org: '대한의사협회 KMA교육센터',
      note: '교육 시행 후 4주(28일) 이내 참석자 입력 — 늦으면 회원 평점 미반영.', src: 'https://edu.kma.org/dataRoom/eduCompany', who: 'reg' },
    { id: 'kpbma-report', kinds: ['conf'], base: 'end', d: 90, t: '제약사 지원 결과보고', org: '한국제약바이오협회 · 공정경쟁규약',
      note: '행사 종료 후 90일 내 결과보고서 제출.', src: 'https://dailypharm.com/user/news/334656', who: 'lead' }
  ];
  /* 학회 자체 준비 일정 (예시 — 학회마다 다름, 킥오프 때 확정) */
  const INTERNAL_RULES = [
    { id: 'abs', kinds: ['conf'], base: 'start', d: -45, t: '초록 접수 마감', who: 'reg' },
    { id: 'spk', kinds: ['conf'], base: 'start', d: -30, t: '연자·좌장 확정 및 숙박 예약', who: 'reg' },
    { id: 'book', kinds: ['conf'], base: 'start', d: -14, t: '프로그램북 인쇄 발주', who: 'pr' },
    { id: 'prereg', kinds: ['conf', 'edu'], base: 'start', d: -10, t: '사전등록 마감', who: 'reg' },
    { id: 'goods', kinds: ['conf'], base: 'start', d: -3, t: '현장 물품 발송·명찰 출력', who: 'ops' }
  ];
  function ruleDate(rule, start, end) {
    const legal = W.B.addDays(rule.base === 'end' ? (end || start) : start, rule.d);
    const safe = W.B.isOff(legal) ? W.B.prevBiz(legal) : legal;
    return { legal, safe, shifted: legal !== safe };
  }

  function seed(today) {
    const W0 = startOfWeek(today);              // 이번 주 월요일
    const wd = (w, d) => addDays(W0, w * 7 + (d + 6) % 7); // d: 0=일 … 6=토
    const T = n => addDays(today, n);
    const now = Date.now(), H = 3600e3, M = 60e3;
    let n = 0;
    const id = () => 'e' + (++n);
    const log = (by, at, action, extra) => Object.assign({ by, at, action }, extra || {});
    const base = (o) => Object.assign({
      type: 'event', allDay: false, endDate: null, room: null, loc: '', note: '', vis: 'all',
      people: [], rule: null, exdates: [], overrides: {}, agenda: [], minutes: '', actions: [], rsvp: {},
      ver: 1, deleted: false, created: { by: o.owner, at: now - 9 * 86400e3 }, log: []
    }, o);

    // 학술대회 날짜 — 5주 뒤 금요일(1박 2일)
    let conf = addDays(today, 33);
    while (dow(conf) !== 5) conf = addDays(conf, 1);
    const confEnd = addDays(conf, 1);

    const E = [];
    const push = o => { const e = base(o); e.id = e.id || id(); E.push(e); return e; };

    /* ---- 반복 ---- */
    const weekly = push({
      title: '사무국 주간회의', type: 'meeting', cat: 'admin', date: wd(-6, 1), start: '10:00', end: '10:40', room: 'r2', owner: 'u1',
      people: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'], rule: { freq: 'weekly', byday: [1] },
      agenda: [{ t: '지난주 할 일 점검', done: false }, { t: '이번 주 주요 일정 공유', done: false }, { t: '부재·외근 확인', done: false }],
      note: '매주 월요일. 공휴일이면 그 회차는 자동 제외됩니다.',
      rsvp: { u1: 'yes', u2: 'yes', u3: 'yes', u4: 'yes', u5: 'yes', u6: 'yes', u7: 'yes', u8: 'yes', u9: 'maybe' }
    });
    // 공휴일과 겹친 회차는 EXDATE
    for (let d = weekly.date; d <= addDays(today, 120); d = addDays(d, 7)) if (W.B.HOLIDAYS[d]) weekly.exdates.push(d);
    // 지난주 회차 회의록 (회차별 덮어쓰기)
    weekly.overrides[wd(-1, 1)] = {
      minutes: '1) 추계학술대회 사전등록 현황: 목표 대비 62% — 학회지 광고·문자 재안내\n2) 이사회 자료: 안건 4건 확정, 김다인 담당 취합\n3) 연구비 중간보고 마감 확인 — 한지우',
      actions: [
        { id: 'a1', t: '사전등록 재안내 문자 발송', who: 'u9', due: wd(0, 3), done: true },
        { id: 'a2', t: '이사회 안건 자료 취합·발송', who: 'u5', due: wd(0, 5), done: false },
        { id: 'a3', t: '연구비 중간보고서 초안 공유', who: 'u6', due: wd(1, 2), done: false }
      ]
    };

    const acad = push({
      title: '학술위원회 회의', type: 'meeting', cat: 'comm', date: '2026-07-14', start: '19:00', end: '21:00', room: 'online', owner: 'u5',
      people: ['u2', 'u3', 'u5'], rule: { freq: 'monthly', nth: 2, wd: 2 },
      loc: 'Zoom (외부 위원 9명)', note: '위원장·위원 9명은 외부 참석 — 사무국은 회의 운영·회의록 담당.',
      agenda: [{ t: '학술대회 세션 구성안', done: false }, { t: '초록 심사 일정', done: false }],
      rsvp: { u2: 'yes', u3: 'yes', u5: 'yes' }
    });
    const lastAcad = W.B.occurrences(acad, addDays(today, -40), addDays(today, -1)).pop();
    if (lastAcad) acad.overrides[lastAcad.date] = {
      minutes: '세션 구성안 2안으로 확정. 좌장 섭외는 위원장 명의 공문으로.\n초록 심사위원 12명 배정 완료.',
      actions: [
        { id: 'a4', t: '좌장 섭외 공문 발송', who: 'u5', due: T(2), done: false },
        { id: 'a5', t: '세션별 연자 연락처 정리', who: 'u3', due: T(5), done: false }
      ]
    };

    push({
      title: '편집위원회 회의', type: 'meeting', cat: 'comm', date: '2026-07-30', start: '18:30', end: '20:00', room: 'r1', owner: 'u9',
      people: ['u9', 'u5'], rule: { freq: 'monthly', nth: -1, wd: 4 }, loc: '대회의실 · 외부 위원 6명',
      rsvp: { u9: 'yes', u5: 'maybe' }
    });
    push({
      title: '연구비 집행 점검', cat: 'grant', date: wd(-4, 3), start: '15:00', end: '15:30', owner: 'u6', people: ['u6', 'u8'],
      rule: { freq: 'weekly', interval: 2, byday: [3] }, note: '과제별 집행률·증빙 누락 확인'
    });

    /* ---- 이번 주 · 오늘 ---- */
    push({
      title: '추계학술대회 준비 점검', type: 'meeting', cat: 'conf', date: today, start: '09:30', end: '10:00', room: 'r3', owner: 'u1',
      people: ['u1', 'u2', 'u3'], agenda: [{ t: '사전등록 현황', done: true }, { t: '연자 숙박 예약', done: false }, { t: '후원사 부스 배정', done: false }],
      rsvp: { u1: 'yes', u2: 'yes', u3: 'yes' }
    });
    push({ title: '연수평점 신청서 작성', cat: 'conf', date: today, start: '14:00', end: '15:00', owner: 'u3', people: ['u3'], note: '학술대회 프로그램 확정본 기준' });
    push({ title: '교육위원회 회의자료 발송', cat: 'edu', date: today, start: '16:00', end: '16:30', owner: 'u4', people: ['u4', 'u5'] });
    push({ title: '외근 — 연구재단 방문', cat: 'away', date: today, start: '13:00', end: '17:00', owner: 'u6', people: ['u6'], loc: '연구재단(대전)' });
    push({ title: '병원 진료', cat: 'away', date: T(1), start: '09:00', end: '11:00', owner: 'u8', people: ['u8'], vis: 'busy', note: '개인 일정 — 다른 직원에게는 "부재"로만 표시' });

    push({ title: '연차', cat: 'away', date: T(1), allDay: true, owner: 'u3', people: ['u3'] });
    push({
      title: '유럽 자매학회 공동세션 화상 협의', type: 'meeting', cat: 'intl', date: nextBiz(T(1)), start: '17:00', end: '18:00', room: 'online', owner: 'u7',
      people: ['u7', 'u1', 'u2'], loc: 'Teams (상대측 초대)', note: '현지 시각 10:00 (CEST, 한국보다 7시간 느림) — 10/25 서머타임 종료 후엔 8시간 차이.',
      agenda: [{ t: '공동 세션 주제·연자 2명', done: false }, { t: '항공·숙박 부담 주체', done: false }],
      rsvp: { u7: 'yes', u1: 'yes', u2: 'pending' }
    });

    /* ---- 다음 주 이후 ---- */
    push({
      title: '교육위원회 회의', type: 'meeting', cat: 'edu', date: wd(1, 2), start: '19:00', end: '20:30', room: 'online', owner: 'u4',
      people: ['u4', 'u5'], loc: 'Zoom (위원 7명)', rsvp: { u4: 'yes', u5: 'pending' }
    });
    push({ title: '4분기 회비 납부 안내 발송', cat: 'admin', date: wd(1, 3), start: '10:00', end: '11:00', owner: 'u8', people: ['u8', 'u9'] });
    push({ title: '부산 지회 학술행사 지원 출장', cat: 'away', date: wd(1, 3), endDate: wd(1, 4), allDay: true, owner: 'u7', people: ['u7'], loc: '부산' });
    push({ title: '반차(오후)', cat: 'away', date: wd(1, 2), start: '13:00', end: '18:00', owner: 'u8', people: ['u8'] });
    const board = push({
      title: '정기 이사회', type: 'meeting', cat: 'comm', date: wd(1, 5), start: '18:30', end: '20:30', room: 'ext', owner: 'u5',
      people: ['u1', 'u5'], loc: '외부 회의장 (이사 15명)', note: '안건 4건 · 의결 정족수 과반',
      agenda: [{ t: '2027년 사업계획(안)', done: false }, { t: '추계학술대회 예산 변경', done: false }, { t: '신규 위원 위촉', done: false }, { t: '기타', done: false }],
      rsvp: { u1: 'yes', u5: 'yes' }
    });
    board.log.push(log('u5', now - 70 * M, 'edit', { field: '시간', from: '18:00', to: '18:30' }));
    const eduEv = push({ id: 'edu1', title: '전공의 연수강좌', cat: 'edu', date: wd(1, 6), start: '09:00', end: '17:00', room: 'ext', owner: 'u4', people: ['u4', 'u2'], loc: '서울 ○○교육센터(가상)', note: '사전등록 140명 · 평점 6점' });
    push({ title: '연구비 중간보고서 제출 마감', cat: 'grant', date: nextBiz(wd(2, 2)), allDay: true, owner: 'u6', people: ['u6'], note: '전자 제출 18:00 마감' });
    push({ title: '사무실 소방 점검', cat: 'admin', date: wd(2, 3), start: '14:00', end: '15:00', owner: 'u8', people: ['u8'], loc: '건물 관리사무소 입회' });
    push({
      title: '해외 자매학회 대표단 방문', type: 'meeting', cat: 'intl', date: wd(4, 3), start: '14:00', end: '17:00', room: 'r1', owner: 'u7',
      people: ['u7', 'u1', 'u2'], note: '대표단 4명 · 통역 동행 · 만찬 18:30', rsvp: { u7: 'yes', u1: 'yes', u2: 'yes' }
    });
    push({ title: '연구비 정산 마감', cat: 'grant', date: nextBiz(addDays(today, 46)), allDay: true, owner: 'u6', people: ['u6', 'u8'] });

    /* ---- 학술대회 + 역산 일정 ---- */
    const confEv = push({
      id: 'conf', title: '2026 추계학술대회', cat: 'conf', date: conf, endDate: confEnd, allDay: true, owner: 'u2', room: 'ext',
      people: ['u1', 'u2', 'u3', 'u4', 'u8', 'u9'], loc: '서울 ○○컨벤션센터(가상)', note: '사전등록 목표 900명 · 부스 24개 · 평점 신청 완료'
    });
    const roleWho = { lead: 'u2', reg: 'u3', pr: 'u9', ops: 'u8' };
    const genDeadlines = (parent, kind, roles) => {
      DEADLINE_RULES.concat(INTERNAL_RULES).filter(r => r.kinds.includes(kind)).forEach(r => {
        const { legal, safe, shifted } = ruleDate(r, parent.date, parent.endDate || parent.date);
        const ext = !!r.org;
        push({
          title: r.t, cat: parent.cat, date: safe, allDay: true, owner: parent.owner, people: [roles[r.who] || parent.owner],
          parent: parent.id, rule_id: r.id, dday: r.d, base: r.base, legal: shifted ? legal : null, ext,
          org: r.org || '', src: r.src || '', note: r.note || (ext ? '' : '학회 자체 준비 일정 (예시)'),
          done: safe < today, deadline: true
        });
      });
    };
    genDeadlines(confEv, 'conf', roleWho);
    genDeadlines(eduEv, 'edu', { lead: 'u4', reg: 'u4', pr: 'u9', ops: 'u4' });

    /* ---- 지난 미팅 (회의록 · 후속 할 일) ---- */
    push({
      title: '학술대회 준비 킥오프', type: 'meeting', cat: 'conf', date: W.B.prevBiz(addDays(today, -14)), start: '14:00', end: '15:30', room: 'r1', owner: 'u2',
      people: ['u1', 'u2', 'u3', 'u4', 'u8', 'u9'],
      minutes: '역할 분담 확정: 학술(강민석·박서연) / 등록·평점(박서연·최윤재) / 후원·부스(강민석) / 물품·회계(오태경) / 홍보(서하늘)\n사전등록 오픈은 다음 주 월요일.',
      actions: [
        { id: 'a6', t: '사전등록 페이지 오픈', who: 'u3', due: W.B.prevBiz(addDays(today, -9)), done: true },
        { id: 'a7', t: '후원사 제안서 발송', who: 'u2', due: W.B.prevBiz(addDays(today, -4)), done: true },
        { id: 'a8', t: '프로그램북 디자인 시안 받기', who: 'u9', due: T(4), done: false }
      ],
      rsvp: { u1: 'yes', u2: 'yes', u3: 'yes', u4: 'yes', u8: 'no', u9: 'yes' }
    });

    /* ---- 퇴사자에게 남은 일정 (이관 필요) ---- */
    push({ title: '교육자료 아카이브 정리', cat: 'edu', date: wd(1, 4), start: '15:00', end: '16:00', owner: 'u10', people: ['u10'] });
    push({ title: '연수강좌 강사료 지급 확인', cat: 'edu', date: wd(2, 2), start: '11:00', end: '11:30', owner: 'u10', people: ['u10'] });

    /* ---- 비공개(참석자만) ---- */
    push({
      title: '직원 인사평가 면담', type: 'meeting', cat: 'admin', date: wd(1, 4), start: '16:00', end: '17:00', room: 'r3', owner: 'u1', people: ['u1', 'u8'],
      vis: 'attendees', note: '참석자만 열람', rsvp: { u1: 'yes', u8: 'yes' }
    });

    /* ---- 휴지통 (실행 취소 · 복구 시연) ---- */
    push({ title: '소식지 원고 마감(구)', cat: 'admin', date: wd(1, 1), allDay: true, owner: 'u9', people: ['u9'], deleted: true, deletedAt: now - 26 * H, deletedBy: 'u9' });

    /* 변경 이력 시드 — 홈 「사무국 소식」과 알림이 이걸로 만들어집니다 */
    const byTitle = t => E.find(e => e.title === t);
    const feed = [
      { by: 'u2', at: now - 12 * M, action: 'create', ev: byTitle('연수평점 신청서 작성').id },
      { by: 'u5', at: now - 70 * M, action: 'edit', ev: board.id, field: '시간', from: '18:00', to: '18:30' },
      { by: 'u7', at: now - 2.5 * H, action: 'invite', ev: byTitle('유럽 자매학회 공동세션 화상 협의').id, to: ['u1', 'u2'] },
      { by: 'u4', at: now - 4 * H, action: 'invite', ev: byTitle('교육위원회 회의').id, to: ['u5'] },
      { by: 'u9', at: now - 26 * H, action: 'delete', ev: byTitle('소식지 원고 마감(구)').id },
      { by: 'u6', at: now - 28 * H, action: 'create', ev: byTitle('연구비 중간보고서 제출 마감').id },
      { by: 'u2', at: now - 30 * H, action: 'minutes', ev: byTitle('학술대회 준비 킥오프').id }
    ];
    feed.forEach(f => { const e = E.find(x => x.id === f.ev); if (e && f.action !== 'edit') e.log.push(log(f.by, f.at, f.action, f.to ? { to: f.to } : null)); });

    const access = [];
    const ips = ['10.0.4.21', '10.0.4.23', '10.0.4.31', '10.0.4.12', '10.0.4.27'];
    const nd = new Date(); const morning = new Date(nd.getFullYear(), nd.getMonth(), nd.getDate(), 8, 41).getTime();
    const base0 = nd.getHours() >= 9 ? morning : morning - 24 * H;
    USERS.filter(u => u.active).forEach((u, i) => {
      access.push({ uid: u.id, at: base0 + (i * 4 + (i % 3) * 3) * M, ip: ips[i % ips.length], act: '로그인' });
      access.push({ uid: u.id, at: base0 - 24 * H + (i * 5 + 2) * M, ip: ips[i % ips.length], act: '로그인' });
    });
    access.push({ uid: 'u8', at: now - 3 * 86400e3, ip: '10.0.4.27', act: '권한 변경: 서하늘 → 일반 직원' });
    access.push({ uid: 'u1', at: now - 15 * 86400e3, ip: '10.0.4.21', act: '계정 비활성화: 문지성 (퇴사)' });
    access.push({ uid: 'x', at: now - 5 * H, ip: '203.0.113.48', act: '로그인 실패 5회 → 10분 잠금 (아이디: admin)' });
    access.sort((a, b) => b.at - a.at);

    return { events: E, feed, access, conf: { date: conf, end: confEnd, id: confEv.id }, seededAt: now, today };
  }

  /* 아바타 — Higgsfield 생성 가상 인물(실존 인물 아님) · 128px WebP. 퇴사자는 이니셜 */
  const PHOTOS = {};
  ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'].forEach(id => { PHOTOS[id] = 'assets/img/staff/' + id + '.webp'; });

  W.BD = { ORG, CATS, USERS, ROOMS, DEADLINE_RULES, INTERNAL_RULES, ruleDate, seed, PHOTOS };
})(window);
