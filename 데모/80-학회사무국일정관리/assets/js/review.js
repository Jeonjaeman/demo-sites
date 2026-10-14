/* BUREAU 뷰로 — 제안 검토: 발견 · 성공 기준 · 스택 · DB 스키마
   근거는 분석/기획_설계.md · 분석/_리서치_원자료.md (URL 전부 확인분) */
(function (W) {
  'use strict';
  const B = W.B;
  const esc = B.esc, ic = B.icon;
  const APP = () => W.APP;

  const findings = [
    { k: 'F8', p: 3, star: true, t: '사무국의 진짜 마감은 외부 기관이 정한다', s: '제약사 학술대회 지원 신청 D-90 · 의협 연수평점 신청 D-20 · 변경 D-5 · 참석자 입력 D+28 · 지원 결과보고 D+90', tags: ['마감 역산', '학술대회·교육'],
      body: '<p>공고대로 “일정 등록·조회”만 만들면 학술대회 날짜는 들어가도 <b>그 날짜에서 거꾸로 계산되는 외부 마감</b>은 담당자 머릿속에만 남습니다. 담당자가 휴가·퇴사하면 평점 미신청 → 평점 미부여, 후원 신청 누락 → 후원 무산으로 이어집니다.</p><ul><li>한국제약바이오협회 공정경쟁규약: 개최 <b>90일 전</b> 지원 신청, 종료 후 <b>90일 내</b> 결과보고. 2026.7.1부터 누락·지연 제재 강화(경고·최대 1천만원).</li><li>대한의사협회 KMA교육센터: 교육 <b>20일 전</b> 평점 신청, 변경은 <b>5일 전</b>, 교육 후 <b>28일 내</b> 참석자 입력.</li></ul><p><b>데모에서는</b> 분류를 학술대회·교육으로 고르는 순간 마감 체크리스트가 펼쳐지고, 담당자·근거와 함께 저장됩니다. 기한이 주말·공휴일이면 직전 영업일로 당기고 원래 법정 기한도 함께 표시합니다. 행사 날짜를 바꾸면 마감도 같이 이동합니다.</p>',
      src: [['데일리팜 — 공정경쟁규약 5차 개정', 'https://dailypharm.com/user/news/334656'], ['KMA교육센터 교육기관 안내', 'https://edu.kma.org/dataRoom/eduCompany'], ['코메디닷컴 — 심의 강화', 'https://kormedi.com/1569558/']],
      acts: [['2027 춘계학술대회 등록해 보기', 'conf-new'], ['추계학술대회와 묶인 마감 보기', 'open-conf'], ['마감 화면', 'go-due']] },
    { k: 'F5', p: 2, t: '“로그인 10명”은 아이디·비밀번호로 끝나지 않는다', s: '접속기록 1년 보관·월 1회 점검, 권한 이력 3년, 외부 접속 안전한 인증, 자동 접속 차단', tags: ['개인정보', '로그인'],
      body: '<p>직원·외부 위원 정보가 들어가는 순간 「개인정보의 안전성 확보조치 기준」 적용 대상입니다. 클라우드 웹은 사실상 모든 접속이 “외부 접속”이라, 아이디·비밀번호만으로는 제6조를 충족하지 못할 소지가 있습니다.</p><ul><li>제5조 — 권한 부여·변경·말소 내역 최소 3년 보관, 계정 공유 금지, 인증 실패 시 접근 제한</li><li>제6조 — 외부 접속 시 안전한 인증수단, 일정 시간 미사용 시 자동 접속 차단</li><li>제7조 — 비밀번호 일방향 암호화</li><li>제8조 — 접속기록 1년 이상(민감정보 2년) 보관, 월 1회 이상 점검</li></ul><p><b>데모에서는</b> 2단계 인증 로그인, 자동 로그아웃 카운트다운, 5회 실패 잠금 기록, 접속기록·권한 이력 화면과 CSV, 월간 점검 버튼을 실제로 동작시킵니다. 적용 범위는 해석 여지가 있어 “기본값으로 켜 두기”를 제안합니다.</p>',
      src: [['고시 제2023-6호 조문', 'https://itwiki.kr/w/개인정보의_안전성_확보조치_기준_제6조'], ['2024.10 안내서 공개 보도', 'https://www.newsseoul.co.kr/news/view/1065603019773397']],
      acts: [['2단계 인증 로그인 보기', 'login'], ['자동 로그아웃 재현', 'idle'], ['접속기록', 'admin-access'], ['권한 변경 이력', 'admin-perm']] },
    { k: 'F1', p: 1, t: '외부 캘린더 “연동”은 실시간이 아니다', s: '구글은 구독 캘린더를 수 시간~하루 늦게 갱신하고 수동 새로고침이 없다 — 연동을 약속하면 오히려 사고', tags: ['외부 캘린더', 'ICS'],
      body: '<p>경쟁 지원자가 “외부 캘린더 연동이 필수인가요?”라고 물은 그 기능입니다. URL 구독(ICS)으로 붙이면 회의 시간을 바꿨는데 직원 폰에는 옛 시간이 하루 가까이 남을 수 있습니다. 메일보다 위험해지는 지점입니다.</p><p><b>데모에서는</b> 구독은 “보기용”으로만 제공하고 지연을 화면에 분명히 적습니다. 대신 일정을 고칠 때 “참석자에게 변경 알림 메일”이 기본으로 켜져 있어 1차 알림은 메일이 맡습니다. 지금 바로 필요하면 .ics 파일을 즉시 내려받습니다(반복 규칙·예외·종일 일정 끝 날짜 처리 포함).</p>',
      src: [['Cheqroom — Google 피드 갱신', 'https://knowledge.cheqroom.com/helpcenter/how-often-does-google-update-its-calendar-feeds'], ['Nocal — 구독 캘린더가 즉시 안 바뀌는 이유', 'https://nocal.app/help/ics-and-subscriptions/why-subscribed-calendars-dont-update-instantly']],
      acts: [['구독 안내 화면', 'admin-ics'], ['반복 회의 수정해 보기 (메일 알림)', 'weekly']] },
    { k: 'F2', p: 1, t: '“유지비 0원” 호스팅은 이 프로젝트에서 성립하지 않는다', s: 'Vercel 무료는 비상업 전용(외주 제작 = 상업 사용), Supabase 무료는 1주 무활동 정지·백업 없음', tags: ['호스팅', '백업'],
      body: '<p>예산 150만원에 맞추려고 무료 조합을 제안하면 약관 위반 상태로 운영되고, 설·추석 연휴 뒤 첫 출근날 시스템이 멈춰 있을 수 있으며, 실수로 지운 데이터를 되살릴 방법이 없습니다.</p><p><b>제안</b>: 정적 화면(Cloudflare Pages, 상업 사용 가능) + Supabase Pro 서울 리전. 월 약 3.5만원, 일일 백업 7일, 정지 없음. 비용을 숨기지 않고 지원서에 공개합니다. <b>데모에서는</b> 운영 상태 카드와 “시점 복원 리허설”을 직접 눌러 볼 수 있습니다.</p>',
      src: [['Vercel Fair Use (Hobby 비상업)', 'https://vercel.com/docs/limits/fair-use-guidelines'], ['Supabase 요금', 'https://supabase.com/pricing'], ['Supabase 무료 프로젝트 일시정지', 'https://supabase.com/docs/guides/platform/free-project-pausing']],
      acts: [['운영 상태·복원 리허설', 'admin-ops'], ['휴지통', 'admin-trash']] },
    { k: 'F3', p: 1, t: '반복 일정은 “규칙 + 예외”로 저장해야 한다', s: '회차를 N개 복사하면 정례회의 시간 변경·공휴일 회차·한 회차 취소가 전부 깨진다', tags: ['반복', 'RFC 5545'],
      body: '<p>위원회는 대부분 정례(매월 둘째 화요일 등)입니다. 반복을 회차 복사로 만들면 시간 변경 시 지난 회의록까지 바뀌거나, 한 회차 취소가 전체 삭제로 번집니다.</p><p><b>데모에서는</b> RFC 5545 방식(RRULE + EXDATE + 회차별 덮어쓰기)으로 저장하고, 수정·이동·삭제 때 “이 일정만 / 이후 모두 / 전체”를 고르면 영향받는 회차가 캘린더에서 깜빡입니다. 2026.10.5(개천절 대체공휴일) 같은 공휴일 회차는 자동으로 빠지고, 회의록은 회차별로 따로 남습니다.</p>',
      src: [['RFC 5545', 'https://datatracker.ietf.org/doc/html/rfc5545'], ['Google Calendar 반복 수정 3택', 'https://it.stonybrook.edu/help/kb/setting-up-a-recurring-repeating-meeting-in-google-calendar']],
      acts: [['주간회의 회차 열어 보기', 'weekly'], ['10월 캘린더 (10/5 회차 빠짐)', 'oct']] },
    { k: 'F9', p: 3, t: '회의실 이중 예약은 화면 확인만으로 못 막는다', s: '두 사람이 동시에 “빈 방”을 보고 저장하는 경쟁 조건 — DB 배타 제약으로 원천 차단', tags: ['회의실', '동시성'],
      body: '<p>“먼저 조회하고 비었으면 저장”은 두 요청이 같은 순간 들어오면 둘 다 통과합니다. 10명이어도 월요일 주간회의 직후엔 실제로 일어납니다.</p><p><b>데모에서는</b> 같은 순간 다른 직원이 같은 회의실을 예약하는 상황을 재현합니다. 두 번째 저장이 거절되고, 같은 회의실의 빈 시간·같은 시간의 다른 회의실을 바로 고를 수 있습니다. 운영에선 PostgreSQL <code>EXCLUDE USING gist (room_id WITH =, period WITH &&)</code>가 막습니다.</p>',
      src: [['PostgreSQL 배타 제약 예약 사례', 'https://bnikolic.co.uk/blog/postgresql/2025/12/19/postgresql-all'], ['btree_gist', 'https://neon.com/docs/extensions/btree_gist']],
      acts: [['동시 예약 재현', 'race'], ['회의실 현황', 'rooms']] },
    { k: 'F10', p: 3, t: '동시 수정 시 늦게 저장한 사람이 앞사람 수정을 지운다', s: '버전 번호로 충돌을 감지해 필드별로 비교·병합 (낙관적 잠금)', tags: ['동시성'],
      body: '<p>학술대회 일정을 학술팀과 교육팀이 동시에 고치면 한쪽 수정이 조용히 사라지고 아무도 모릅니다.</p><p><b>데모에서는</b> 이사회 일정을 여는 순간 다른 직원이 시간을 바꾸는 상황을 재현합니다. 그 상태에서 내가 다른 항목을 고쳐 저장하면, 겹치지 않는 변경은 자동으로 합치고 둘 다 바꾼 항목만 고르게 합니다.</p>',
      src: [['Optimistic locking (version)', 'https://vladmihalcea.com/optimistic-locking-version-property-jpa-hibernate']],
      acts: [['동시 수정 재현', 'remote']] },
    { k: 'F6', p: 2, t: '개인 일정의 “병원 진료”는 민감정보다', s: '10명 조직에선 특정인 건강정보가 그대로 공개된다 — 부재는 유형만, 사유는 본인만', tags: ['개인정보', '부재'],
      body: '<p>자유 입력 개인 일정에 병원·진료·검진이 쌓이면 건강정보(개인정보보호법 제23조)가 됩니다. 민감정보를 처리하면 접속기록 보관도 1년에서 2년으로 늘어납니다.</p><p><b>데모에서는</b> 제목에 병원·진료·검진 같은 단어를 쓰면 바로 안내가 뜨고, 한 번에 “부재(개인)”로 바꿉니다. 다른 직원에겐 “부재”와 시간만 보입니다.</p>',
      src: [['개인정보 보호법 제23조', 'https://itwiki.kr/w/개인정보_보호법_제23조']],
      acts: [['건강 정보 가드 체험', 'health'], ['오태경 님 일정 보기 (바쁨만)', 'busy']] },
    { k: 'F13', p: 3, t: '퇴사자 계정을 지우면 담당 일정이 주인을 잃는다', s: '계정 말소는 지체 없이 + 이력 3년, 그 전에 담당 일정 이관', tags: ['계정', '인수인계'],
      body: '<p>퇴사자 계정을 그냥 삭제하면 담당하던 미팅·마감이 함께 사라지거나 주인 없이 남습니다. 반대로 계정을 방치하면 권한 말소 지연이 됩니다.</p><p><b>데모에서는</b> 퇴사한 문지성 님에게 남은 일정 2건을 골라 다른 직원에게 넘기고, 말소까지 권한 이력에 기록합니다. 팀 현황 화면에도 경고가 뜹니다.</p>',
      src: [['안전성 확보조치 기준 제5조', 'https://itwiki.kr/w/개인정보의_안전성_확보조치_기준_제6조']],
      acts: [['이관 마법사', 'offboard'], ['팀 현황', 'team']] },
    { k: 'F14', p: 3, t: '해외학회 화상회의는 서머타임 전환 주간에 1시간 틀린다', s: '2026년 유럽 10.25, 미국 11.1 서머타임 종료 — 한국은 서머타임이 없다', tags: ['국제교류', '시차'],
      body: '<p>현지 시각 기준 회의를 한국 시각으로만 저장하면 전환 이후 1시간씩 어긋납니다. 일주일 동안은 유럽·미국 사이 시차도 평소와 다릅니다.</p><p><b>데모에서는</b> 미팅에 상대 도시를 고르면 한국·현지 시각을 함께 보여 주고(브라우저 시간대 데이터로 실제 계산), 앞뒤 3주 안에 전환이 있으면 경고합니다.</p>',
      src: [['2026 서머타임 종료일', 'https://www.timeout.com/usa/news/when-do-the-clocks-go-back-in-2026-heres-when-daylight-saving-time-officially-ends-100626']],
      acts: [['유럽 화상 협의 열어 보기', 'intl']] },
    { k: 'F11', p: 3, t: '공휴일은 한 번 넣고 끝나지 않는다', s: '임시공휴일은 수일~2주 전에 확정 — API 동기화 + 직접 추가 + 겹치는 일정 알림', tags: ['공휴일'],
      body: '<p>공휴일을 코드에 박아 두면 임시공휴일에 잡힌 위원회 회의를 당일에야 발견합니다(2025.1.27 임시공휴일은 의결 13일 전 확정).</p><p><b>데모에서는</b> 관리자가 임시공휴일을 추가하는 즉시 그날 잡힌 일정과 담당자가 나오고, 알림을 보낼 수 있습니다.</p>',
      src: [['특일정보 API', 'https://www.data.go.kr/data/15012690/openapi.do'], ['임시공휴일 의결 보도', 'https://www.newsis.com/view/NISX20250113_0003030503']],
      acts: [['공휴일 관리', 'admin-holidays']] },
    { k: 'F15', p: 3, t: '입력이 번거로우면 2주 뒤 다시 메일로 돌아간다', s: '필수 3개(제목·일시·분류), 한 줄 빠른 입력, 메일 본문 붙여넣기', tags: ['사용편의', '빠른 입력'],
      body: '<p>소규모 조직의 협업툴 도입 실패는 “몇 번 눌러야 찾는 구조”와 “도입 직후 한 달”에 갈립니다. 필수 칸이 많으면 “나중에 넣지”가 되고, 결국 메일로 돌아갑니다.</p><p><b>데모에서는</b> 우측 패널의 한 줄 입력이 날짜·시간·장소·사람·반복을 나눠 칩으로 보여 주고, Enter로 바로 저장됩니다. 메일 본문을 붙이면 미팅 초안이 됩니다. 중앙 어디를 눌러도 화면 이동 없이 우측에서 수정합니다.</p>',
      src: [['협업툴 도입 실패 원인', 'https://www.bizforms.co.kr/businessmap/teamwork/collab-tool-adoption.asp'], ['Google Quick Add', 'https://developers.google.cn/calendar/api/v3/reference/events/quickAdd?hl=en']],
      acts: [['빠른 입력 해 보기', 'compose'], ['메일에서 가져오기', 'mail']] },
    { k: 'F12', p: 3, t: '분류·담당자가 없으면 “찾기”가 메일보다 어렵다', s: '업무 7분류 고정 · 담당자 필수 · 회의록 본문까지 검색', tags: ['검색', '분류'],
      body: '<p>경쟁 지원자도 짚었듯, 자유 텍스트 제목만 쌓이면 “지난달 연구비 회의”를 찾지 못해 결국 메일 검색으로 돌아갑니다.</p><p><b>데모에서는</b> 분류 7개(색 = X 강조색 6종 + 부재)로 캘린더를 거르고, <b>/</b> 한 번으로 제목·참석자·장소·회의록 본문까지 찾습니다. 결과를 누르면 우측에 바로 열립니다.</p>',
      src: [['네이버웍스 캘린더 구조', 'https://help.worksmobile.com/ko/use-guides/calendar/overview/']],
      acts: [['“회의록”으로 검색', 'search']] },
    { k: 'F16', p: 3, t: '잘못 지운 일정을 되살릴 수 있어야 한다', s: '되돌리기 토스트 · 휴지통 30일 · 변경 이력', tags: ['복구'],
      body: '<p>반복 일정 “전체 삭제” 오클릭은 1년치 위원회 일정을 지웁니다. <b>데모에서는</b> 삭제·이동·수정마다 되돌리기가 뜨고, 휴지통에서 복구하며, 일정마다 누가 무엇을 바꿨는지 남습니다.</p>',
      src: [['Supabase 백업', 'https://supabase.com/pricing']],
      acts: [['휴지통', 'admin-trash']] },
    { k: 'F4', p: 1, t: '종일·여러 날 일정의 끝 날짜는 “포함하지 않음”', s: 'ICS의 DTEND는 다음 날 — 하루 어긋나면 학술대회가 하루짜리로 보인다', tags: ['ICS', '다일 일정'],
      body: '<p>RFC 5545는 종일 일정의 끝 날짜를 포함하지 않는 값으로 정합니다. 이걸 놓치면 11.20~21 학술대회가 하루짜리로 보이거나 내보내기에서 하루 늘어납니다.</p><p><b>데모에서는</b> 월·주 캘린더가 여러 날 일정을 한 막대로 이어 그리고(주를 넘으면 끊어진 끝을 직각으로), .ics 내보내기는 다음 날을 DTEND로 씁니다.</p>',
      src: [['RFC 5545', 'https://datatracker.ietf.org/doc/html/rfc5545']],
      acts: [['학술대회 달 보기', 'conf-month']] },
    { k: 'F7', p: 2, t: '외부 참석자 연락처는 최소로', s: '이름·소속 기본, 연락처는 목적과 파기 기한을 붙여 선택 입력', tags: ['개인정보'],
      body: '<p>미팅마다 교수 휴대폰 번호를 자유 입력하면 근거가 불분명한 개인정보가 쌓입니다(제15조 “합리적 범위”). <b>데모에서는</b> 외부 참석자를 이름·소속 칩으로만 받고, 연락처는 목적·파기 기한 안내와 함께 선택으로 둡니다.</p>',
      src: [['개인정보 보호법 제15조', 'https://korea.legal/wiki/개인정보-보호법-제15조/']],
      acts: [['미팅 폼에서 보기', 'mail']] }
  ];

  const criteria = [
    { t: '직원 전원 계정 발급 + 2단계 인증 등록', how: '관리자 화면 계정 목록에서 전원 “2단계 인증 ✓”', demo: true, act: 'admin-users' },
    { t: '분류·담당자 체계 확정 문서 (킥오프 1주 차)', how: '분류 7개 · 외부 마감 규칙 표를 발주사가 승인', demo: true, act: 'admin-rules' },
    { t: '일정 1건 등록 15초 이내, 원하는 일정 찾기 3클릭 이내', how: '오픈 전 직원 3명이 실제로 재서 확인', demo: true, act: 'compose' },
    { t: '학술대회·교육 등록 시 외부 마감 자동 생성', how: '다음 실제 학술대회로 시연 (D-90/D-20/D-5/D+28/D+90)', demo: true, act: 'conf-new' },
    { t: '2주 병행 뒤 “일정 공유 메일” 대신 시스템 링크 사용', how: '사무국장 확인 · 주간 요약 메일이 시스템 링크로', demo: true, act: 'digest' },
    { t: '백업 복원 리허설 1회 성공', how: '운영 안내서대로 발주사 직원이 직접 특정 시점 복원', demo: true, act: 'admin-ops' },
    { t: '개발자 없이 직원 추가·퇴사 이관·공휴일 추가', how: '운영 안내서 따라 실습', demo: true, act: 'offboard' },
    { t: '소스·DB 스키마·배포 절차가 발주사 저장소에, 새 환경 재배포 재현', how: '인수 체크리스트 — 발주사 명의 계정에서 재배포', demo: false, act: 'stack' }
  ];

  function run(a) {
    const A = APP(), S = A.S;
    const TODAY = A.TODAY, DB = A.DB();
    switch (a) {
      case 'conf-new': {
        let d = B.addDays(TODAY, 150); while (B.dow(d) !== 5) d = B.addDays(d, 1);
        A.panel.open('form', { prefill: { title: '2027 춘계학술대회', cat: 'conf', date: d, endDate: B.addDays(d, 1), allDay: true, people: ['u2', 'u3'], room: 'ext', loc: '서울 ○○컨벤션센터(가상)' } }, { force: true });
        if (S.view !== 'cal') location.hash = '#/cal/month';
        S.cursor = d; A.render();
        break;
      }
      case 'open-conf': A.openEvent('conf'); break;
      case 'go-due': location.hash = '#/due'; break;
      case 'login': location.href = 'login.html?demo=1'; break;
      case 'idle': A.panel.open('admin', { key: 'security' }); setTimeout(() => { const b = document.querySelector('[data-a="idle"]'); if (b) b.click(); }, 300); break;
      case 'weekly': {
        const ev = DB.events.find(e => e.title === '사무국 주간회의');
        const o = B.occurrences(ev, B.addDays(TODAY, 1), B.addDays(TODAY, 30))[0];
        S.cursor = o.date; if (S.view !== 'cal') location.hash = '#/cal/week'; else A.render();
        setTimeout(() => A.openEvent(ev.id, o.date), 80); break;
      }
      case 'oct': S.cursor = '2026-10-01'; location.hash = '#/cal/month'; A.render(); break;
      case 'race': A.simRace(); break;
      case 'remote': { const ev = DB.events.find(e => e.title === '정기 이사회'); A.simRemoteEdit(ev.id); break; }
      case 'rooms': S.mtgTab = 'rooms'; location.hash = '#/mtg'; A.render(); break;
      case 'health': A.panel.open('form', { prefill: { title: '치과 진료', date: B.nextBiz(B.addDays(TODAY, 1)), start: '15:00', end: '16:00' } }, { force: true }); break;
      case 'busy': { const ev = DB.events.find(e => e.title === '병원 진료'); if (A.S.me === 'u8') A.switchUser('u1'); setTimeout(() => A.openEvent(ev.id), 60); break; }
      case 'offboard': A.panel.open('offboard', { uid: 'u10' }, { force: true }); break;
      case 'team': location.hash = '#/team'; break;
      case 'intl': A.openEvent(DB.events.find(e => e.title.startsWith('유럽 자매학회')).id); break;
      case 'search': S.q = '회의록'; location.hash = '#/search'; A.render(); break;
      case 'compose': A.panel.reset(); setTimeout(() => { const t = document.getElementById('qa'); if (t) { t.value = '다음 주 화 2시 학술위원회 회의 @대회의실 김다인'; t.dispatchEvent(new Event('input', { bubbles: true })); t.focus(); } }, 60); document.body.classList.add('panel-open'); break;
      case 'mail': A.panel.reset(); setTimeout(() => { const b = document.querySelector('[data-p="qa-mail"]'); if (b) b.click(); }, 60); document.body.classList.add('panel-open'); break;
      case 'conf-month': S.cursor = DB.conf.date; location.hash = '#/cal/month'; A.render(); setTimeout(() => A.openEvent('conf'), 60); break;
      case 'digest': A.panel.open('digest'); break;
      case 'stack': location.hash = '#/review/stack'; break;
      default:
        if (a.startsWith('admin-')) {
          if (!A.isAdmin()) { A.switchUser('u1'); }
          setTimeout(() => A.panel.open('admin', { key: a.slice(6) }, { force: true }), 30);
        }
    }
  }

  function panel(key) {
    const f = findings.find(x => x.k === key) || findings[0];
    return {
      title: f.k + (f.star ? ' ★' : ''), crumb: ['', '그대로 만들면 작동 안 함', '법 위반 소지', '운영 중 반드시 터짐', '있으면 좋음'][f.p],
      body: '<h2 style="margin:0 0 12px;font-size:23px;line-height:28px;font-weight:800;letter-spacing:-.015em;word-break:keep-all">' + esc(f.t) + '</h2><div class="prose">' + f.body + '</div>' +
        '<div class="p-sec"><div class="p-sec-h"><h4>데모에서 확인</h4><span class="aside">누르면 바로 실행</span></div><div style="display:flex;flex-direction:column;gap:8px">' + f.acts.map(([l, a], i) => '<button class="btn ' + (i === 0 ? 'btn-dark' : 'btn-line') + '" data-r="' + a + '">' + esc(l) + '</button>').join('') + '</div></div>' +
        '<div class="p-sec"><div class="p-sec-h"><h4>근거</h4></div><ul class="src" style="margin:0;padding-left:16px">' + f.src.map(([l, u]) => '<li style="margin-bottom:6px"><a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(l) + '</a></li>').join('') + '</ul></div>'
    };
  }
  function critPanel(i) {
    const c = criteria[i], done = B.store.get('crit', []);
    return {
      title: '성공 기준 ' + (i + 1), crumb: '공고 제안 필수 사항 ②',
      body: '<h2 style="margin:0 0 10px;font-size:23px;line-height:28px;font-weight:800;word-break:keep-all">' + esc(c.t) + '</h2><dl class="kv"><dt>확인 방법</dt><dd>' + esc(c.how) + '</dd><dt>데모</dt><dd>' + (c.demo ? '지금 이 데모에서 확인할 수 있어요' : '실제 구축 인수 단계에서 확인') + '</dd></dl>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-top:20px"><button class="btn btn-dark" data-r="' + c.act + '">데모에서 확인하기</button>' +
        '<button class="btn btn-line" data-crit-ck="' + i + '">' + (done.includes(i) ? ic('check') + '확인함 — 취소' : '확인했어요') + '</button></div>' +
        '<div class="note" style="margin-top:20px">' + ic('info') + '<p>“화면이 다 나왔다”가 아니라 <b>직원이 메일 대신 이 시스템을 쓰기 시작했다</b>를 완료로 봅니다. 그래서 오픈 후 2주 병행과 실측 기준을 넣었어요.</p></div>'
    };
  }
  function onClick(e) {
    const r = e.target.closest('[data-r]');
    if (r) { run(r.dataset.r); return; }
    const c = e.target.closest('[data-crit-ck]');
    if (c) {
      const i = +c.dataset.critCk; let d = B.store.get('crit', []);
      d = d.includes(i) ? d.filter(x => x !== i) : d.concat(i); B.store.set('crit', d);
      APP().render(); APP().panel.refresh();
    }
  }

  const SCHEMA = `-- BUREAU 뷰로 · PostgreSQL 15 (Supabase) — 발주사 저장소 /db/schema.sql
create extension if not exists btree_gist;

create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null, title text, dept text,
  role text not null check (role in ('staff','manager','admin')),
  active boolean not null default true, left_at date,
  mfa_enrolled boolean not null default false,
  created_at timestamptz not null default now()
);

create table category (id text primary key, name text not null, color text not null, sort int);
create table room (id text primary key, name text not null, capacity int, bookable boolean default true);
create table deadline_rule (id text primary key, kinds text[], base text check (base in ('start','end')),
                            offset_days int, title text, org text, source_url text);

create table event (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('event','meeting')),
  title text not null,
  category_id text not null references category,
  all_day boolean not null default false,
  starts_at timestamptz, ends_at timestamptz,        -- 시간 일정 (Asia/Seoul 저장)
  start_date date, end_date_excl date,               -- 종일: 끝 날짜는 포함하지 않음 (RFC 5545)
  rrule text,                                         -- 'FREQ=MONTHLY;BYDAY=2TU'
  room_id text references room, location text,
  visibility text not null default 'all' check (visibility in ('all','busy','attendees')),
  peer_timezone text,                                 -- 상대 도시 'Europe/Paris'
  owner_id uuid not null references staff,
  parent_id uuid references event,                    -- 행사 ↔ 외부 마감
  deadline_rule text references deadline_rule, legal_due date, is_done boolean,
  note text,
  version int not null default 1,                     -- 낙관적 잠금 (동시 수정)
  task_id uuid, approval_status text,                 -- 향후 업무관리·결재 자리
  created_by uuid references staff, created_at timestamptz default now(),
  updated_by uuid references staff, updated_at timestamptz,
  deleted_at timestamptz                              -- 휴지통 30일
);

create table event_exception (                        -- EXDATE · 회차별 덮어쓰기
  event_id uuid references event on delete cascade,
  occurrence_date date,
  kind text check (kind in ('cancel','override')),
  patch jsonb,
  primary key (event_id, occurrence_date)
);

create table event_person (
  event_id uuid references event on delete cascade,
  staff_id uuid references staff,
  role text check (role in ('owner','assignee','attendee')),
  rsvp text default 'pending' check (rsvp in ('pending','yes','no','maybe')),
  primary key (event_id, staff_id)
);

create table external_attendee (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references event on delete cascade,
  name text not null, org text,
  contact text, purge_after date                      -- 최소 수집 · 파기 기한
);

create table room_booking (                           -- 회의실 이중 예약을 DB가 거절
  room_id text references room,
  event_id uuid references event on delete cascade,
  occurrence_date date,
  period tstzrange not null,
  exclude using gist (room_id with =, period with &&)
);

create table agenda_item (id uuid primary key, event_id uuid, occurrence_date date, body text, done boolean, sort int);
create table minutes (event_id uuid, occurrence_date date, body text, updated_by uuid, updated_at timestamptz,
                      primary key (event_id, occurrence_date));
create table action_item (id uuid primary key, event_id uuid, occurrence_date date, body text,
                          assignee_id uuid references staff, due date, done boolean, linked_event_id uuid);

create table holiday (date date primary key, name text,
                      kind text check (kind in ('legal','substitute','temporary','office')), source text);

create table change_log (id bigserial primary key, event_id uuid, actor_id uuid, action text, diff jsonb, at timestamptz default now());
create table access_log (id bigserial primary key, staff_id uuid, at timestamptz default now(), ip inet, action text);  -- 1년(민감 2년)
create table permission_log (id bigserial primary key, staff_id uuid, changed_by uuid, from_role text, to_role text, at timestamptz default now()); -- 3년

-- 비공개 회의·개인 일정: 참석자가 아니면 행 자체를 못 읽게 (관리자 포함)
alter table event enable row level security;
create policy event_read on event for select using (
  visibility = 'all'
  or owner_id = auth.uid()
  or exists (select 1 from event_person p where p.event_id = id and p.staff_id = auth.uid())
);
-- 나머지 직원에게는 시간·회의실 점유만 내보내는 뷰
create view event_busy as select id, starts_at, ends_at, start_date, end_date_excl, room_id, owner_id, visibility from event where deleted_at is null;`;

  function stackHTML() {
    const rows = [
      ['구성', '정적 화면 + Supabase Pro(서울)', 'Django + PostgreSQL 단일 VPS', 'Workers + D1', 'Vercel 무료 + Supabase 무료'],
      ['월 유지비', '약 3.5만원 ($25)', '$7~15 + 운영 인력', '$5', '$0'],
      ['2단계 인증', '앱 OTP 무료·기본', '직접 구성', '직접 구현', '가능'],
      ['회의실 이중 예약', 'DB 배타 제약 ✓', '✓', 'SQLite라 우회 구현', '✓'],
      ['비공개 회의', 'RLS로 DB에서 차단 ✓', '앱 코드', '앱 코드', '✓'],
      ['백업·복원', '일일 7일 ✓', '직접 구성', 'Time Travel', '없음 ✗'],
      ['정지', '없음', '없음', '없음', '1주 무활동 정지 ✗'],
      ['약관', '문제 없음', '문제 없음', '문제 없음', '상업 사용 금지 ✗'],
      ['개발자 없는 운영', '쉬움 (서버 관리 없음)', '어려움 (보안 패치)', '쉬움', '—']
    ];
    return '<p class="section-sub" style="padding:14px 16px 8px">공고 「제안 포함 필수 사항 ①」 — 기술 스택과 선택 이유. <b>A안을 추천</b>합니다.</p>' +
      '<div style="overflow-x:auto;padding:0 16px"><table class="tbl" style="min-width:640px"><thead><tr><th></th><th style="color:var(--ink);font-weight:800">A안 (추천)</th><th>B안</th><th>C안</th><th>✗ 무료 조합</th></tr></thead><tbody>' +
      rows.map(r => '<tr><th style="color:var(--ink-2)">' + r[0] + '</th>' + r.slice(1).map((c, i) => '<td' + (i === 0 ? ' style="font-weight:700"' : '') + '>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' +
      '<h2 class="section-title">A안을 고른 이유</h2><ol class="prose" style="padding:0 16px 0 36px;margin:0">' +
      ['법적 요건을 “기능 개발”이 아니라 “설정”으로 충족 — 2단계 인증 내장, RLS로 비공개 회의 차단, 기록 테이블', '이중 예약·동시 수정을 DB가 막음 — 화면 확인만으로는 경쟁 조건을 못 막습니다', '월 약 3.5만원·서울 리전·일일 백업·정지 없음 — 비용을 숨기지 않습니다', '발주사 소유 — 계정·저장소·도메인 모두 발주사 명의, 표준 PostgreSQL이라 언제든 이전', '확장 — 업무관리·결재는 같은 DB에 테이블을 붙이면 됩니다 (task_id·approval_status 자리 확보)'].map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
      '<h2 class="section-title">DB 스키마 (결과물)</h2><p class="section-sub">발주사 저장소에 들어갈 스키마 초안 — 반복 규칙·예외, 회의실 배타 제약, 버전 잠금, 기록 테이블, 행 수준 보안까지.</p><div style="padding:0 16px 32px"><pre class="code">' + esc(SCHEMA) + '</pre></div>';
  }

  W.REVIEW = { findings, criteria, run, panel, critPanel, onClick, stackHTML, SCHEMA };
})(window);
