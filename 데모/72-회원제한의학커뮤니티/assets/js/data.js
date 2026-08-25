/* BONCHO 본초 — 목데이터 (전부 가상. 실존 인물·기관·업체와 무관) */
(function (global) {
  'use strict';

  var D = {};

  /* ── 역할 정의 ─────────────────────────────────────────────
     guest   비회원(미로그인)
     pending 가입 신청 후 승인 대기
     member  일반회원(한의대생·예비한의사) — 승인 완료
     doctor  한의사회원 — 면허 증빙 확인 완료
     admin   관리자                                            */
  D.ROLES = {
    guest:   { key: 'guest',   name: '비회원',     rank: 0 },
    pending: { key: 'pending', name: '승인 대기',  rank: 0 },
    member:  { key: 'member',  name: '일반회원',   rank: 1 },
    doctor:  { key: 'doctor',  name: '한의사회원', rank: 2 },
    admin:   { key: 'admin',   name: '관리자',     rank: 3 }
  };

  /* 데모 계정 (역할 전환 시 이 계정으로 로그인된 것처럼 동작) */
  D.ACCOUNTS = {
    pending: { no: 'B-2088', name: '정수민', role: 'pending', joined: '2026-08-24' },
    member:  { no: 'B-1042', name: '박지호', role: 'member',  joined: '2026-07-02', school: '가온한의과대학 본과 3년' },
    doctor:  { no: 'B-0217', name: '김서연', role: 'doctor',  joined: '2026-06-11', clinic: '서연한의원 (서울 관악)' },
    admin:   { no: 'A-0001', name: '이운영', role: 'admin',   joined: '2026-06-01' }
  };

  /* ── 게시판 6종 — read/write 최소 등급(rank) ───────────────
     의료법 §56·비의료인 대상 의료정보 리스크 대응:
     임상·처방 게시판은 한의사회원(면허 확인) 전용으로 분리   */
  D.BOARDS = [
    { id: 'notice',  name: '공지사항',       read: 0, write: 3, desc: '운영 공지 · 이용 안내',            icon: 'M12 3 2 8l10 5 10-5-10-5Zm-8 8v5c0 2 4 4 8 4s8-2 8-4v-5' },
    { id: 'free',    name: '자유게시판',     read: 1, write: 1, desc: '승인 회원 누구나 · 일상과 진로',    icon: 'M4 5h16v11H8l-4 4V5Z' },
    { id: 'clinic',  name: '임상 증례',      read: 2, write: 2, desc: '한의사 전용 · 치험례와 경과 공유',  icon: 'M9 3h6v4h4v6h-4v4H9v-4H5V7h4V3Z' },
    { id: 'herb',    name: '처방·본초 자료실', read: 2, write: 2, desc: '한의사 전용 · 방제 구성과 자료',   icon: 'M6 3h9l5 5v13H6V3Zm9 0v5h5' },
    { id: 'mgmt',    name: '한의원 경영',    read: 2, write: 2, desc: '한의사 전용 · 개원과 운영 실무',    icon: 'M4 20V9h4v11H4Zm6 0V4h4v16h-4Zm6 0v-7h4v7h-4Z' },
    { id: 'academy', name: '학술·세미나',    read: 1, write: 2, desc: '읽기는 일반회원부터 · 강연과 학회', icon: 'M12 3 1 9l11 6 9-4.9V17h2V9L12 3ZM5 13.2V17c0 2 3.1 4 7 4s7-2 7-4v-3.8l-7 3.8-7-3.8Z' }
  ];

  D.boardOf = function (id) {
    for (var i = 0; i < D.BOARDS.length; i++) if (D.BOARDS[i].id === id) return D.BOARDS[i];
    return null;
  };

  /* ── 게시글 ── */
  D.POSTS = [
    /* 공지 (관리자 작성 — CMS) */
    { id: 101, b: 'notice', t: '서비스 정식 오픈 및 가입 승인 절차 안내', a: 'A-0001', an: '이운영', role: 'admin', d: '2026-08-01', v: 1284, cm: 0, att: [], pin: true,
      body: '본초 서비스가 정식 오픈했습니다. 회원가입 후 관리자 승인 절차를 거쳐야 커뮤니티를 이용할 수 있습니다.\n\n· 일반회원: 한의과대학 재학·졸업 증빙 확인 후 승인\n· 한의사회원: 한의사 면허 증빙 확인 후 승인 (영업일 기준 1~2일)\n\n승인 전에는 공지사항 열람만 가능합니다. 증빙 서류는 승인 심사에만 사용하며 심사 완료 후 90일 내 파기합니다.' },
    { id: 102, b: 'notice', t: '게시물 신고·블라인드 처리 기준 안내 (정보통신망법 임시조치)', a: 'A-0001', an: '이운영', role: 'admin', d: '2026-08-06', v: 892, cm: 0, att: [], pin: true,
      body: '권리 침해 신고가 접수된 게시물은 정보통신망법 제44조의2에 따라 접수 즉시 접근이 임시 차단(블라인드)되며, 최대 30일의 임시조치 기간 내에 게시자 이의신청 여부에 따라 복원 또는 삭제됩니다.\n\n신고는 각 게시글 상단의 [신고] 버튼으로 접수할 수 있습니다.' },
    { id: 103, b: 'notice', t: '강의 영상 열람 기록·워터마크 적용 안내', a: 'A-0001', an: '이운영', role: 'admin', d: '2026-08-12', v: 671, cm: 0, att: [],
      body: '강의 콘텐츠 보호를 위해 재생 화면에 회원번호 워터마크가 표시되며, 열람 일시·콘텐츠·접속 IP가 기록됩니다. 기록 항목과 보관 기간은 개인정보처리방침에 고지되어 있습니다.' },
    { id: 104, b: 'notice', t: '9월 정기 점검 안내 (9/3 새벽 2시~4시)', a: 'A-0001', an: '이운영', role: 'admin', d: '2026-08-21', v: 233, cm: 0, att: [],
      body: '서버 정기 점검으로 9월 3일 02:00~04:00 서비스 접속이 일시 중단됩니다.' },

    /* 자유게시판 (일반회원 이상) */
    { id: 201, b: 'free', t: '본과 3학년 방제학 공부법 공유합니다', a: 'B-1042', an: '박지호', role: 'member', d: '2026-08-23', v: 154, cm: 3, att: [],
      body: '방제학 각론 암기가 막막했는데, 군신좌사 구조로 먼저 뼈대를 잡고 가감례를 나중에 얹는 방식으로 바꾸니 훨씬 낫습니다. 스터디 자료 정리해서 올려봅니다.' },
    { id: 202, b: 'free', t: '국시 준비 스터디 인원 모집 (온라인, 주 2회)', a: 'B-1177', an: '최다인', role: 'member', d: '2026-08-22', v: 98, cm: 5, att: [],
      body: '내년 국시 대비 온라인 스터디 2명 더 모집합니다. 화·금 저녁 9시, 모의고사 회독 위주로 진행합니다.' },
    { id: 203, b: 'free', t: '부속병원 실습 후기 — 침구과 4주', a: 'B-1203', an: '한예린', role: 'member', d: '2026-08-19', v: 187, cm: 6, att: [],
      body: '침구과 실습 4주 다녀온 후기입니다. 외래 참관에서 배운 것, 실습 전에 챙겨 가면 좋은 것들 정리했습니다.' },
    { id: 204, b: 'free', t: '한의대생이 읽을 만한 임상 입문서 추천 부탁드립니다', a: 'B-1042', an: '박지호', role: 'member', d: '2026-08-15', v: 141, cm: 8, att: [],
      body: '본과 저학년 눈높이에서 임상 감각을 미리 익힐 수 있는 책 추천 부탁드립니다.' },
    { id: 205, b: 'free', t: '졸업 후 진로 — 부원장 vs 공보의 고민', a: 'B-1311', an: '오세훈', role: 'member', d: '2026-08-10', v: 265, cm: 11, att: [],
      body: '졸업을 앞두고 부원장으로 바로 나갈지, 공보의를 먼저 다녀올지 고민이 많습니다. 선배님들 경험담 듣고 싶습니다.' },
    { id: 206, b: 'free', t: '해부학 실습 조교 하면서 느낀 점', a: 'B-1177', an: '최다인', role: 'member', d: '2026-08-05', v: 76, cm: 2, att: [],
      body: '이번 학기 해부학 실습 조교를 맡으며 배운 점을 공유합니다.' },

    /* 임상 증례 (한의사 전용) */
    { id: 301, b: 'clinic', t: '만성 견비통 환자 침구·약침 병행 8주 경과', a: 'B-0217', an: '김서연', role: 'doctor', d: '2026-08-24', v: 212, cm: 7, att: [{ n: '경과기록_요약.pdf', f: 'PDF', s: '1.2MB' }],
      body: '50대 여성, 6개월 이상 지속된 견비통. 주 2회 침구 치료에 약침을 병행해 8주간 VAS 7→2로 호전된 증례입니다. 치료 간격과 수기요법 병행 여부에 대한 의견 나누고 싶습니다.\n\n※ 환자 정보는 비식별 처리했습니다.' },
    { id: 302, b: 'clinic', t: '기능성 소화불량 — 육군자탕 가감 12주 추적', a: 'B-0492', an: '문태준', role: 'doctor', d: '2026-08-21', v: 178, cm: 5, att: [{ n: '증례정리.hwp', f: 'HWP', s: '340KB' }],
      body: '기능성 소화불량 환자 3례에 육군자탕 가감을 12주 투여하고 NDI 점수 변화를 추적했습니다. 가감 구성과 경과를 첨부에 정리했습니다.' },
    { id: 303, b: 'clinic', t: '요추 추간판 탈출증 보존 치료 — 추나 병행 여부 질문', a: 'B-0533', an: '배윤호', role: 'doctor', d: '2026-08-18', v: 244, cm: 9, att: [],
      body: 'L4-5 팽윤 소견 환자, 급성기 통증이 가라앉은 뒤 추나를 시작하는 시점을 어떻게 잡으시는지 궁금합니다.' },
    { id: 304, b: 'clinic', t: '소아 야제 치험 2례 — 감맥대조탕 반응', a: 'B-0611', an: '서지우', role: 'doctor', d: '2026-08-13', v: 131, cm: 4, att: [],
      body: '만 3세, 5세 소아 야제 2례에서 감맥대조탕 투여 2주 후 수면 패턴이 안정된 경과를 공유합니다.' },
    { id: 305, b: 'clinic', t: '교통사고 후유증 다빈도 처방 정리 (자보 청구 관점 포함)', a: 'B-0217', an: '김서연', role: 'doctor', d: '2026-08-08', v: 356, cm: 12, att: [{ n: '자보다빈도정리.xlsx', f: 'XLSX', s: '88KB' }],
      body: '자보 환자 다빈도 처방과 청구 시 유의점을 표로 정리했습니다. 각 처방의 상병 매칭은 첨부 파일 참고해 주세요.' },
    { id: 306, b: 'clinic', t: '갱년기 상열감 — 가미소요산 vs 지백지황환 선택 기준', a: 'B-0492', an: '문태준', role: 'doctor', d: '2026-08-03', v: 289, cm: 8, att: [],
      body: '갱년기 상열감 주소 환자에서 두 처방의 감별 포인트를 어떻게 잡으시는지 의견 나누고 싶습니다.' },

    /* 처방·본초 자료실 (한의사 전용) */
    { id: 401, b: 'herb', t: '2026 개정 — 다빈도 방제 조성 일람표 (엑셀)', a: 'B-0533', an: '배윤호', role: 'doctor', d: '2026-08-22', v: 421, cm: 6, att: [{ n: '방제조성일람_2026.xlsx', f: 'XLSX', s: '412KB' }],
      body: '다빈도 방제 84종의 조성·용량·출전을 정리한 엑셀입니다. 시트별로 계통 분류해 뒀습니다. 오류 제보 환영합니다.' },
    { id: 402, b: 'herb', t: '약재 수급 이슈 — 감초 대체 가능 조합 논의', a: 'B-0611', an: '서지우', role: 'doctor', d: '2026-08-17', v: 198, cm: 7, att: [],
      body: '최근 감초 수급이 불안정한데, 방제 내 역할별 대체 조합을 어떻게 가져가시는지 공유 부탁드립니다.' },
    { id: 403, b: 'herb', t: '탕전실 위탁 vs 원내 탕전 비용 비교표', a: 'B-0217', an: '김서연', role: 'doctor', d: '2026-08-11', v: 305, cm: 9, att: [{ n: '탕전비용비교.pdf', f: 'PDF', s: '640KB' }],
      body: '원외탕전 위탁과 원내 탕전의 월 기준 비용을 비교한 자료입니다. 월 처방 건수 구간별로 손익분기점을 계산했습니다.' },
    { id: 404, b: 'herb', t: '본초 감별 사진 자료 — 형태 유사 약재 12쌍', a: 'B-0492', an: '문태준', role: 'doctor', d: '2026-08-06', v: 267, cm: 5, att: [{ n: '감별사진모음.pdf', f: 'PDF', s: '2.8MB' }],
      body: '형태가 유사해 혼동하기 쉬운 약재 12쌍의 감별 포인트를 사진과 함께 정리했습니다.' },

    /* 한의원 경영 (한의사 전용) */
    { id: 501, b: 'mgmt', t: '개원 1년차 결산 — 임대·인건비·마케팅 비중 공유', a: 'B-0533', an: '배윤호', role: 'doctor', d: '2026-08-20', v: 388, cm: 14, att: [{ n: '1년차결산_비중.xlsx', f: 'XLSX', s: '64KB' }],
      body: '작년 개원 후 1년 결산을 항목별 비중으로 공유합니다. 개원 준비하시는 분들께 참고가 되길 바랍니다.' },
    { id: 502, b: 'mgmt', t: '비급여 안내문, 의료광고 심의 대상일까요?', a: 'B-0611', an: '서지우', role: 'doctor', d: '2026-08-16', v: 276, cm: 10, att: [],
      body: '원내 게시용 비급여 안내문과 홈페이지 게시물의 의료광고 심의 필요 여부가 헷갈립니다. 최근 심의 받으신 분 계신가요?' },
    { id: 503, b: 'mgmt', t: '실손 청구 간소화 이후 원무 업무 변화 정리', a: 'B-0217', an: '김서연', role: 'doctor', d: '2026-08-09', v: 231, cm: 6, att: [],
      body: '실손 청구 간소화 시행 이후 원무 프로세스가 어떻게 달라졌는지 저희 원 기준으로 정리했습니다.' },
    { id: 504, b: 'mgmt', t: '직원 4대보험·연차 관리 실무 체크리스트', a: 'B-0492', an: '문태준', role: 'doctor', d: '2026-08-02', v: 342, cm: 8, att: [{ n: '노무체크리스트.hwp', f: 'HWP', s: '120KB' }],
      body: '직원 2인 이상 한의원 기준 노무 관리 체크리스트입니다. 노무사 자문 받은 내용 기반으로 정리했습니다.' },

    /* 학술·세미나 (읽기 rank1 / 쓰기 rank2) */
    { id: 601, b: 'academy', t: '[학회] 가을 학술대회 연제 접수 시작 (9/30 마감)', a: 'B-0533', an: '배윤호', role: 'doctor', d: '2026-08-23', v: 178, cm: 2, att: [],
      body: '가을 학술대회 연제 접수가 시작됐습니다. 증례 보고 세션이 신설됐으니 첫 발표 도전해 보실 분들께 추천합니다.' },
    { id: 602, b: 'academy', t: '침 치료 RCT 최신 논문 3편 요약', a: 'B-0217', an: '김서연', role: 'doctor', d: '2026-08-19', v: 265, cm: 7, att: [{ n: '논문요약.pdf', f: 'PDF', s: '890KB' }],
      body: '최근 발표된 침 치료 무작위대조시험 3편을 요약했습니다. 원문 링크는 본문에 정리해 뒀습니다.' },
    { id: 603, b: 'academy', t: '보수교육 온라인 이수 후기 — 절차 정리', a: 'B-0492', an: '문태준', role: 'doctor', d: '2026-08-12', v: 301, cm: 5, att: [],
      body: '올해 보수교육을 온라인으로 이수한 절차를 단계별로 정리했습니다. 마감 임박하신 분들 참고하세요.' },
    { id: 604, b: 'academy', t: '한약 안전성 연구 동향 — 학부생 눈높이 정리', a: 'B-0611', an: '서지우', role: 'doctor', d: '2026-08-04', v: 152, cm: 3, att: [],
      body: '학부생·예비 한의사 눈높이에서 최근 한약 안전성 연구 흐름을 정리했습니다.' }
  ];

  /* 신고·블라인드 상태 (정보통신망법 §44-2 임시조치 30일) */
  D.REPORTS = [
    { id: 'R-31', post: 205, reason: '명예훼손 주장 (특정 병원 언급)', by: 'B-1203', at: '2026-08-24 10:12', status: 'blinded', due: '2026-09-23', memo: '게시자 이의신청 접수 — 검토 중' },
    { id: 'R-30', post: 502, reason: '의료광고 규정 위반 우려', by: 'B-0492', at: '2026-08-22 16:40', status: 'reviewing', due: '2026-09-21', memo: '' },
    { id: 'R-29', post: 203, reason: '개인정보 노출 (실습 병원 실명)', by: 'B-1042', at: '2026-08-20 09:05', status: 'restored', due: '2026-09-19', memo: '게시자가 병원명 삭제 후 수정 — 복원 처리' },
    { id: 'R-28', post: 402, reason: '허위 정보 주장', by: 'B-0611', at: '2026-08-18 14:22', status: 'rejected', due: '—', memo: '근거 자료 확인 — 신고 반려' }
  ];
  D.blindedPosts = function () {
    var s = {};
    D.REPORTS.forEach(function (r) { if (r.status === 'blinded') s[r.post] = r; });
    return s;
  };

  /* 댓글 (대표 게시글용) */
  D.COMMENTS = {
    301: [
      { a: 'B-0492', an: '문태준', role: 'doctor', d: '2026-08-24 14:20', tx: '약침 시술 간격은 어떻게 가져가셨나요? 주 2회 모두 병행하셨는지 궁금합니다.' },
      { a: 'B-0217', an: '김서연', role: 'doctor', d: '2026-08-24 15:02', tx: '주 2회 중 1회만 병행했습니다. 4주차부터는 주 1회로 줄였고요.' },
      { a: 'B-0533', an: '배윤호', role: 'doctor', d: '2026-08-24 18:47', tx: '저희도 비슷한 프로토콜인데 수기요법을 얹으니 회복 속도가 빨라졌습니다. 좋은 증례 감사합니다.' }
    ],
    205: [
      { a: 'B-0217', an: '김서연', role: 'doctor', d: '2026-08-10 21:10', tx: '임상 감각을 빨리 쌓고 싶다면 부원장, 시간을 벌면서 진로를 넓게 보고 싶다면 공보의를 추천합니다.' },
      { a: 'B-1177', an: '최다인', role: 'member', d: '2026-08-11 08:33', tx: '저도 같은 고민 중이라 댓글들이 큰 도움이 됩니다.' }
    ],
    401: [
      { a: 'B-0217', an: '김서연', role: 'doctor', d: '2026-08-22 11:15', tx: '출전까지 정리돼 있어 바로 쓰기 좋네요. 감사합니다.' },
      { a: 'B-0611', an: '서지우', role: 'doctor', d: '2026-08-22 13:40', tx: '시트 3의 용량 단위 하나가 g이 아니라 냥으로 남아 있는 것 같습니다. 확인 부탁드려요.' }
    ]
  };

  /* ── 강의 (유튜브 연동) — grade: 열람 최소 rank ── */
  D.LECTURES = [
    { id: 'L-12', cpd: 2, t: '견비통 침구 치료 실전 — 취혈과 자침 깊이', cat: '침구', grade: 2, min: 48, ep: 6, img: 'lec-pulse.webp',  yt: 'dQw4w9WgXcQ', tutor: '김서연', tutorRole: '한의사 · 임상 12년', views: 342, date: '2026-08-18', desc: '어깨 질환 다빈도 혈위의 취혈 기준과 자침 깊이, 수기법을 실제 시연과 함께 다룹니다.' },
    { id: 'L-11', cpd: 2, t: '방제학 임상 적용 — 소화기 질환 처방 설계', cat: '방제·본초', grade: 2, min: 62, ep: 8, img: 'lec-yakjang.webp', yt: 'dQw4w9WgXcQ', tutor: '문태준', tutorRole: '한의사 · 한방내과', views: 287, date: '2026-08-14', desc: '기능성 소화불량·과민성 장증후군의 변증별 처방 구성과 가감 원칙을 증례 중심으로 강의합니다.' },
    { id: 'L-10', cpd: 2, t: '추나요법 기초 — 경추·요추 안전 수기', cat: '추나', grade: 2, min: 55, ep: 7, img: 'lec-chuna.webp', yt: 'dQw4w9WgXcQ', tutor: '배윤호', tutorRole: '한의사 · 추나 전문과정 수료', views: 401, date: '2026-08-10', desc: '경추·요추 추나의 금기 감별과 안전한 수기 순서를 단계별로 시연합니다.' },
    { id: 'L-09', cpd: 1, t: '뜸 치료의 근거와 실전 프로토콜', cat: '침구', grade: 2, min: 41, ep: 5, img: 'lec-moxa.webp', yt: 'dQw4w9WgXcQ', tutor: '서지우', tutorRole: '한의사 · 한방부인과', views: 218, date: '2026-08-05', desc: '뜸 치료의 최신 연구 근거를 정리하고, 질환별 시구 프로토콜을 제안합니다.' },
    { id: 'L-08', cpd: 1, t: '한의원 개원 준비 A to Z — 입지·인테리어·인허가', cat: '경영', grade: 2, min: 74, ep: 9, img: 'lec-yakjang.webp', yt: 'dQw4w9WgXcQ', tutor: '배윤호', tutorRole: '한의사 · 개원 3년차', views: 466, date: '2026-07-28', desc: '개원 입지 분석부터 의료기관 개설 신고까지, 실제 개원 과정의 순서와 비용을 공개합니다.' },
    { id: 'L-07', cpd: 0, t: '경혈학 국시 대비 핵심 정리', cat: '학부·국시', grade: 1, min: 58, ep: 10, img: 'lec-pulse.webp', yt: 'dQw4w9WgXcQ', tutor: '김서연', tutorRole: '한의사 · 국시 강의 5년', views: 529, date: '2026-07-20', desc: '국시 다빈도 경혈을 계통별로 묶어 정리합니다. 일반회원(한의대생)도 수강할 수 있는 강의입니다.' },
    { id: 'L-06', cpd: 0, t: '진단학 기초 — 맥진·설진 입문', cat: '학부·국시', grade: 1, min: 45, ep: 6, img: 'lec-moxa.webp', yt: 'dQw4w9WgXcQ', tutor: '문태준', tutorRole: '한의사 · 한방내과', views: 384, date: '2026-07-12', desc: '맥진과 설진의 기초 관찰 포인트를 학부생 눈높이에서 시연합니다.' },
    { id: 'L-05', cpd: 2, t: '자보 청구 실무 — 상병 매칭과 반려 대응', cat: '경영', grade: 2, min: 66, ep: 8, img: 'lec-chuna.webp', yt: 'dQw4w9WgXcQ', tutor: '서지우', tutorRole: '한의사 · 심사 자문 경력', views: 312, date: '2026-07-04', desc: '자동차보험 청구의 상병 매칭 원칙과 반려 다빈도 사유, 이의신청 절차를 다룹니다.' }
  ];
  D.lectureOf = function (id) {
    for (var i = 0; i < D.LECTURES.length; i++) if (D.LECTURES[i].id === id) return D.LECTURES[i];
    return null;
  };

  /* ── 갤러리 (권한: 일반회원부터) ── */
  D.GALLERY = [
    { id: 'G-08', t: '여름 학술 세미나 현장', img: 'gal-moxa.webp',   d: '2026-08-17', by: '이운영', cat: '행사' },
    { id: 'G-07', t: '본초 감별 스터디 — 약재 실물', img: 'gal-herbs1.webp', d: '2026-08-12', by: '문태준', cat: '자료' },
    { id: 'G-06', t: '약재 시장 견학 기록', img: 'gal-market.webp', d: '2026-08-08', by: '박지호', cat: '견학' },
    { id: 'G-05', t: '전통 약장 아카이브', img: 'gal-yakjang.webp', d: '2026-08-02', by: '김서연', cat: '자료' },
    { id: 'G-04', t: '건재 보관 상태 비교 사진', img: 'gal-herbs2.webp', d: '2026-07-26', by: '서지우', cat: '자료' },
    { id: 'G-03', t: '맥진 실습 워크숍', img: 'gal-pulse.webp',  d: '2026-07-19', by: '이운영', cat: '행사' },
    { id: 'G-02', t: '계절 약재 입고 기록', img: 'gal-herbs3.webp', d: '2026-07-11', by: '배윤호', cat: '자료' },
    { id: 'G-01', t: '개원 준비 견학 모임', img: 'gal-herbs4.webp', d: '2026-07-03', by: '배윤호', cat: '견학' }
  ];

  /* ── 회원 (관리자 화면용) ── */
  D.MEMBERS = [
    { no: 'B-2091', name: '강민재', role: 'pending', type: 'doctor', applied: '2026-08-25 09:41', proof: '면허증 사본.pdf', email: 'mj***@***.com', phone: '010-****-3921', note: '' },
    { no: 'B-2090', name: '윤하늘', role: 'pending', type: 'member', applied: '2026-08-25 08:12', proof: '재학증명서.pdf', email: 'sky**@***.com', phone: '010-****-8804', note: '' },
    { no: 'B-2089', name: '임초원', role: 'pending', type: 'doctor', applied: '2026-08-24 22:30', proof: '면허증 사본.jpg', email: 'cw***@***.com', phone: '010-****-1147', note: '면허번호 식별 불가 — 재요청 검토' },
    { no: 'B-2088', name: '정수민', role: 'pending', type: 'member', applied: '2026-08-24 19:05', proof: '재학증명서.pdf', email: 'sm***@***.com', phone: '010-****-6612', note: '' },
    { no: 'B-1311', name: '오세훈', role: 'member', type: 'member', applied: '2026-07-18', approved: '2026-07-19', email: 'sh***@***.com', phone: '010-****-2245', posts: 1, lastSeen: '2026-08-24' },
    { no: 'B-1203', name: '한예린', role: 'member', type: 'member', applied: '2026-07-08', approved: '2026-07-09', email: 'yr***@***.com', phone: '010-****-9083', posts: 1, lastSeen: '2026-08-25' },
    { no: 'B-1177', name: '최다인', role: 'member', type: 'member', applied: '2026-07-05', approved: '2026-07-05', email: 'di***@***.com', phone: '010-****-4417', posts: 2, lastSeen: '2026-08-23' },
    { no: 'B-1042', name: '박지호', role: 'member', type: 'member', applied: '2026-07-02', approved: '2026-07-02', email: 'jh***@***.com', phone: '010-****-7758', posts: 2, lastSeen: '2026-08-25' },
    { no: 'B-0611', name: '서지우', role: 'doctor', type: 'doctor', applied: '2026-06-28', approved: '2026-06-29', email: 'jw***@***.com', phone: '010-****-3306', posts: 4, lastSeen: '2026-08-24' },
    { no: 'B-0533', name: '배윤호', role: 'doctor', type: 'doctor', applied: '2026-06-21', approved: '2026-06-22', email: 'yh***@***.com', phone: '010-****-5529', posts: 5, lastSeen: '2026-08-25' },
    { no: 'B-0492', name: '문태준', role: 'doctor', type: 'doctor', applied: '2026-06-17', approved: '2026-06-18', email: 'tj***@***.com', phone: '010-****-8871', posts: 5, lastSeen: '2026-08-22' },
    { no: 'B-0217', name: '김서연', role: 'doctor', type: 'doctor', applied: '2026-06-11', approved: '2026-06-11', email: 'sy***@***.com', phone: '010-****-1094', posts: 6, lastSeen: '2026-08-25' }
  ];

  /* ── 열람 로그 — 회원/일시/콘텐츠/IP (IP 뒷자리 마스킹 표시) ── */
  D.LOGS = [
    { at: '2026-08-25 11:42', no: 'B-0217', name: '김서연', kind: '강의', ref: 'L-12', title: '견비통 침구 치료 실전 3강', ip: '211.36.xxx.xxx', dur: '18분' },
    { at: '2026-08-25 11:18', no: 'B-1042', name: '박지호', kind: '강의', ref: 'L-07', title: '경혈학 국시 대비 핵심 정리 2강', ip: '175.223.xxx.xxx', dur: '31분' },
    { at: '2026-08-25 10:55', no: 'B-0533', name: '배윤호', kind: '게시글', ref: '401', title: '다빈도 방제 조성 일람표', ip: '121.140.xxx.xxx', dur: '—' },
    { at: '2026-08-25 10:31', no: 'B-0492', name: '문태준', kind: '강의', ref: 'L-11', title: '방제학 임상 적용 5강', ip: '58.121.xxx.xxx', dur: '42분' },
    { at: '2026-08-25 09:58', no: 'B-1203', name: '한예린', kind: '게시글', ref: '601', title: '가을 학술대회 연제 접수', ip: '223.38.xxx.xxx', dur: '—' },
    { at: '2026-08-25 09:12', no: 'B-0611', name: '서지우', kind: '첨부', ref: '401', title: '방제조성일람_2026.xlsx 다운로드', ip: '112.170.xxx.xxx', dur: '—' },
    { at: '2026-08-24 23:40', no: 'B-0217', name: '김서연', kind: '강의', ref: 'L-10', title: '추나요법 기초 1강', ip: '211.36.xxx.xxx', dur: '55분' },
    { at: '2026-08-24 22:17', no: 'B-1177', name: '최다인', kind: '강의', ref: 'L-06', title: '진단학 기초 4강', ip: '106.101.xxx.xxx', dur: '26분' },
    { at: '2026-08-24 21:03', no: 'B-0533', name: '배윤호', kind: '게시글', ref: '305', title: '교통사고 후유증 다빈도 처방', ip: '39.115.xxx.xxx', dur: '—' },
    { at: '2026-08-24 20:44', no: 'B-0492', name: '문태준', kind: '첨부', ref: '404', title: '감별사진모음.pdf 다운로드', ip: '58.121.xxx.xxx', dur: '—' },
    { at: '2026-08-24 18:29', no: 'B-1042', name: '박지호', kind: '게시글', ref: '201', title: '방제학 공부법 공유', ip: '175.223.xxx.xxx', dur: '—' },
    { at: '2026-08-24 17:11', no: 'B-0611', name: '서지우', kind: '강의', ref: 'L-09', title: '뜸 치료 프로토콜 2강', ip: '112.170.xxx.xxx', dur: '38분' },
    { at: '2026-08-24 15:50', no: 'B-0217', name: '김서연', kind: '첨부', ref: '403', title: '탕전비용비교.pdf 다운로드', ip: '211.36.xxx.xxx', dur: '—' },
    { at: '2026-08-24 14:22', no: 'B-1311', name: '오세훈', kind: '게시글', ref: '205', title: '부원장 vs 공보의 고민', ip: '39.7.xxx.xxx', dur: '—' },
    { at: '2026-08-24 11:07', no: 'B-0533', name: '배윤호', kind: '강의', ref: 'L-08', title: '한의원 개원 준비 7강', ip: '61.32.xxx.xxx', dur: '61분' },
    { at: '2026-08-23 22:35', no: 'B-1177', name: '최다인', kind: '강의', ref: 'L-07', title: '경혈학 국시 대비 6강', ip: '106.101.xxx.xxx', dur: '44분' }
  ];

  /* 내 열람 이력 (마이페이지 · 강의 이어보기) */
  D.MY_HISTORY = {
    doctor: [
      { at: '2026-08-25 11:42', kind: '강의', ref: 'L-12', title: '견비통 침구 치료 실전', prog: 62 },
      { at: '2026-08-24 23:40', kind: '강의', ref: 'L-10', title: '추나요법 기초', prog: 100 },
      { at: '2026-08-24 15:50', kind: '첨부', ref: '403', title: '탕전비용비교.pdf', prog: null },
      { at: '2026-08-23 20:12', kind: '강의', ref: 'L-11', title: '방제학 임상 적용', prog: 38 }
    ],
    member: [
      { at: '2026-08-25 11:18', kind: '강의', ref: 'L-07', title: '경혈학 국시 대비 핵심 정리', prog: 74 },
      { at: '2026-08-23 21:00', kind: '강의', ref: 'L-06', title: '진단학 기초', prog: 100 },
      { at: '2026-08-22 19:44', kind: '게시글', ref: '201', title: '방제학 공부법 공유', prog: null }
    ]
  };

  D.BOOKMARKS = {
    doctor: [301, 401, 403, 305],
    member: [201, 602, 604]
  };

  /* ── 관리자 CMS 반영 (데모: localStorage) ──
     관리자가 「게시판 만들기」로 추가한 게시판과 공지 CMS의 글이
     사용자 화면 목록에 실제로 합류한다 */
  try {
    var cb = JSON.parse(localStorage.getItem('boncho_boards') || '[]');
    cb.forEach(function (b) {
      if (!D.boardOf(b.id)) {
        b.custom = true;
        b.icon = b.icon || 'M4 5h16v11H8l-4 4V5Z';
        D.BOARDS.push(b);
      }
    });
  } catch (e) {}
  try {
    var cn = JSON.parse(localStorage.getItem('boncho_notices') || '[]');
    cn.forEach(function (p) {
      p.custom = true;
      if (p.show !== false) D.POSTS.unshift(p);
    });
  } catch (e) {}
  /* 공개범위 매트릭스 override (admin/boards.html에서 조정) */
  try {
    var ov = JSON.parse(localStorage.getItem('boncho_board_read') || '{}');
    D.BOARDS.forEach(function (b) { if (ov[b.id] != null) b.read = ov[b.id]; });
  } catch (e) {}

  global.DATA = D;
})(window);
