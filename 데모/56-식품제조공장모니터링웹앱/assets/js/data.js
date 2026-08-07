/* ONDO 온도 — 스마트 HACCP 모니터링 데모 데이터 (전부 가상 · 실존 업체·인물 무관) */
window.ONDO = (() => {
  /* ---------- 시드 난수 (재현성) ---------- */
  const seed = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const rand = (h) => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };

  /* ---------- 다국어 (KO 기본 · EN · VI — 해썹인증원 다국어 교육 3개 언어 구성 반영) ---------- */
  const I18N = {
    ko: {
      brand: '온도', dashboard: '대시보드', equip: '설비', inspect: '점검', report: '리포트', settings: '설정',
      factory: '한별식품 제2공장 (가상)', simulate: '이탈 시뮬레이션', simulating: '이탈 발생 중 — 복귀 처리를 진행하세요',
      kpi_total: '가동 설비', kpi_ok: '정상', kpi_warn: '주의', kpi_bad: '이탈', kpi_records: '금일 자동기록',
      st_ok: '정상', st_warn: '주의', st_bad: '이탈', st_off: '점검중',
      now_temp: '현재 온도', limit: '허용 한계', ccp_info: 'CCP 정보', history: '이탈·조치 이력',
      chain: '전자기록 위변조 방지 체인', chain_ok: '체인 무결성 검증됨',
      map_title: '공장 현장도', alerts: '실시간 알림', all_ok: '모든 설비가 정상 범위입니다',
      act_confirm: '복귀 확인', act_note: '개선조치 입력', save: '저장', cancel: '취소',
      lang: '언어', font_size: '글자 크기', cvd: '색각 보조 모드', cvd_desc: '적·녹 구분이 어려운 사용자를 위해 색상+아이콘+텍스트를 함께 사용하고, 팔레트를 청·주황 계열로 전환합니다',
      noti: '알림 채널', push: '앱 푸시', sms: 'SMS', kakao: '카카오 알림톡',
      users: '사용자 권한', role_admin: '관리자', role_field: '현장', role_qa: '품질',
      report_title: '식약처 제출용 CCP 모니터링 리포트', report_dl: 'PDF 저장 (인쇄)', report_csv: 'CSV 다운로드',
      inspect_title: '일일 위생 점검', inspect_done: '점검 완료 — 기록이 저장되었습니다 (데모)',
      demo_note: '데모 — 모든 데이터·업체명은 가상입니다'
    },
    en: {
      brand: 'ONDO', dashboard: 'Dashboard', equip: 'Equipment', inspect: 'Inspection', report: 'Reports', settings: 'Settings',
      factory: 'Hanbyeol Foods Plant 2 (demo)', simulate: 'Simulate deviation', simulating: 'Deviation active — please resolve',
      kpi_total: 'Devices', kpi_ok: 'Normal', kpi_warn: 'Caution', kpi_bad: 'Deviation', kpi_records: 'Auto records today',
      st_ok: 'OK', st_warn: 'CAUTION', st_bad: 'ALERT', st_off: 'CHECK',
      now_temp: 'Current temp', limit: 'Critical limit', ccp_info: 'CCP details', history: 'Deviations & actions',
      chain: 'Tamper-proof record chain', chain_ok: 'Chain integrity verified',
      map_title: 'Factory floor map', alerts: 'Live alerts', all_ok: 'All equipment within limits',
      act_confirm: 'Confirm recovery', act_note: 'Corrective action', save: 'Save', cancel: 'Cancel',
      lang: 'Language', font_size: 'Font size', cvd: 'Color-vision assist', cvd_desc: 'Uses color+icon+text together and switches to a blue/orange palette for red-green color blindness',
      noti: 'Notifications', push: 'Push', sms: 'SMS', kakao: 'KakaoTalk',
      users: 'User roles', role_admin: 'Admin', role_field: 'Field', role_qa: 'QA',
      report_title: 'CCP monitoring report (MFDS)', report_dl: 'Save as PDF (print)', report_csv: 'Download CSV',
      inspect_title: 'Daily hygiene inspection', inspect_done: 'Inspection saved (demo)',
      demo_note: 'Demo — all data and company names are fictional'
    },
    vi: {
      brand: 'ONDO', dashboard: 'Bảng điều khiển', equip: 'Thiết bị', inspect: 'Kiểm tra', report: 'Báo cáo', settings: 'Cài đặt',
      factory: 'Nhà máy số 2 Hanbyeol (demo)', simulate: 'Mô phỏng vượt ngưỡng', simulating: 'Đang vượt ngưỡng — hãy xử lý',
      kpi_total: 'Thiết bị', kpi_ok: 'Bình thường', kpi_warn: 'Chú ý', kpi_bad: 'Vượt ngưỡng', kpi_records: 'Bản ghi hôm nay',
      st_ok: 'TỐT', st_warn: 'CHÚ Ý', st_bad: 'CẢNH BÁO', st_off: 'KIỂM TRA',
      now_temp: 'Nhiệt độ hiện tại', limit: 'Giới hạn cho phép', ccp_info: 'Thông tin CCP', history: 'Lịch sử xử lý',
      chain: 'Chuỗi chống giả mạo bản ghi', chain_ok: 'Đã xác minh toàn vẹn',
      map_title: 'Sơ đồ nhà máy', alerts: 'Cảnh báo trực tiếp', all_ok: 'Tất cả thiết bị trong ngưỡng',
      act_confirm: 'Xác nhận phục hồi', act_note: 'Hành động khắc phục', save: 'Lưu', cancel: 'Hủy',
      lang: 'Ngôn ngữ', font_size: 'Cỡ chữ', cvd: 'Hỗ trợ mù màu', cvd_desc: 'Dùng màu+biểu tượng+chữ cùng lúc, chuyển bảng màu sang xanh/cam cho người mù màu đỏ-lục',
      noti: 'Kênh thông báo', push: 'Push', sms: 'SMS', kakao: 'KakaoTalk',
      users: 'Phân quyền', role_admin: 'Quản trị', role_field: 'Hiện trường', role_qa: 'QA',
      report_title: 'Báo cáo giám sát CCP (MFDS)', report_dl: 'Lưu PDF (in)', report_csv: 'Tải CSV',
      inspect_title: 'Kiểm tra vệ sinh hằng ngày', inspect_done: 'Đã lưu kiểm tra (demo)',
      demo_note: 'Demo — mọi dữ liệu đều là giả lập'
    }
  };

  /* ---------- 설비 (구역·CCP·한계 기준) ---------- */
  /* type: cold(냉장 0~10) frozen(냉동 ≤-18) heat(가열 ≥85 · CCP-1B) cool(냉각 ≤10/2h) room(작업장 ≤15) */
  const EQUIP = [
    { id: 'e1', ko: '원료 냉장고 A', en: 'Raw fridge A', vi: 'Tủ mát A', zone: 'in',   type: 'cold',   lo: 0,   hi: 10,  ccp: 'CP-1',    base: 4.2 },
    { id: 'e2', ko: '원료 냉동고',   en: 'Raw freezer',  vi: 'Tủ đông NL', zone: 'in', type: 'frozen', lo: -30, hi: -18, ccp: 'CP-2',    base: -21.5 },
    { id: 'e3', ko: '전처리실 온도', en: 'Prep room',    vi: 'Phòng sơ chế', zone: 'prep', type: 'room', lo: 0,  hi: 15,  ccp: 'CP-3',    base: 12.1 },
    { id: 'e4', ko: '가열 살균기',   en: 'Sterilizer',   vi: 'Máy tiệt trùng', zone: 'heat', type: 'heat', lo: 85, hi: 121, ccp: 'CCP-1B', base: 91.3 },
    { id: 'e5', ko: '급속 냉각기',   en: 'Blast chiller', vi: 'Máy làm lạnh nhanh', zone: 'cool', type: 'cold', lo: 0, hi: 10, ccp: 'CCP-2B', base: 6.8 },
    { id: 'e6', ko: '포장실 온도',   en: 'Packing room', vi: 'Phòng đóng gói', zone: 'pack', type: 'room', lo: 0, hi: 15, ccp: 'CP-4',    base: 13.4 },
    { id: 'e7', ko: '완제품 냉장고', en: 'Product fridge', vi: 'Tủ mát TP', zone: 'store', type: 'cold', lo: 0, hi: 10,  ccp: 'CP-5',    base: 3.6 },
    { id: 'e8', ko: '완제품 냉동고', en: 'Product freezer', vi: 'Tủ đông TP', zone: 'store', type: 'frozen', lo: -30, hi: -18, ccp: 'CP-6', base: -19.2 }
  ];
  const ZONES = {
    in: { ko: '입고·보관', en: 'Receiving', vi: 'Nhập kho' },
    prep: { ko: '전처리', en: 'Prep', vi: 'Sơ chế' },
    heat: { ko: '가열', en: 'Heating', vi: 'Gia nhiệt' },
    cool: { ko: '냉각', en: 'Cooling', vi: 'Làm nguội' },
    pack: { ko: '포장', en: 'Packing', vi: 'Đóng gói' },
    store: { ko: '완제품 보관', en: 'Storage', vi: 'Kho TP' }
  };

  /* ---------- 24h 온도 시계열 (10분 간격 144pt · 시드 기반 결정적) ---------- */
  const seriesFor = (eq) => {
    const pts = []; let h = seed(eq.id + 'series');
    const amp = eq.type === 'heat' ? 2.6 : eq.type === 'frozen' ? 1.1 : 1.4;
    for (let i = 0; i < 144; i++) {
      h = (h * 1103515245 + 12345) >>> 0;
      const wave = Math.sin(i / 144 * Math.PI * 4 + (h % 7)) * amp * .45;
      const noise = (rand(h) - .5) * amp * .5;
      /* e2(원료 냉동고)는 오후에 성에 제거 구간 → 주의 근접 연출 */
      const defrost = eq.id === 'e2' && i > 96 && i < 108 ? (i - 96) * .22 : 0;
      pts.push(+(eq.base + wave + noise + defrost).toFixed(1));
    }
    return pts;
  };

  /* ---------- 상태 판정 (실계산 — 하드코딩 없음) ---------- */
  const WARN_MARGIN = { cold: 1.2, frozen: 1.5, heat: 2.0, room: 1.5, cool: 1.2 };
  const judge = (eq, t) => {
    if (t < eq.lo || t > eq.hi) return 'bad';
    const m = WARN_MARGIN[eq.type] || 1.2;
    if (eq.type === 'heat') { if (t < eq.lo + m) return 'warn'; }
    else if (t > eq.hi - m || t < eq.lo + m * (eq.type === 'frozen' ? 0 : 0)) { if (t > eq.hi - m) return 'warn'; }
    return 'ok';
  };

  /* ---------- 전자기록 해시 체인 (위변조 방지 — 스마트 HACCP 인증 요건의 시각화) ---------- */
  const hash8 = (s) => { let h = seed(s); h = (h * 2654435761) >>> 0; return h.toString(16).padStart(8, '0').slice(0, 8); };
  const RECORDS = (() => {
    const rows = []; let prev = 'GENESIS0';
    const times = ['06:00', '08:00', '10:00', '12:00', '14:00'];
    times.forEach((t, i) => {
      EQUIP.slice(0, 4).forEach(eq => {
        const temp = +(eq.base + (rand(seed(eq.id + t)) - .5)).toFixed(1);
        const h = hash8(prev + eq.id + t + temp);
        rows.push({ time: '2026-08-07 ' + t, eq: eq.id, temp, prev, hash: h, by: 'AUTO-SENSOR' });
        prev = h;
      });
    });
    return rows;
  })();

  /* ---------- 알림 이력 ---------- */
  const ALERTS = [
    { time: '13:42', eq: 'e2', type: 'warn', ko: '원료 냉동고 성에 제거 구간 — 한계 근접', en: 'Raw freezer defrost — near limit', vi: 'Tủ đông rã đông — gần ngưỡng' },
    { time: '11:05', eq: 'e4', type: 'ok', ko: '가열 살균기 목표 온도 도달·기록', en: 'Sterilizer reached target', vi: 'Máy tiệt trùng đạt nhiệt' },
    { time: '09:30', eq: 'e5', type: 'ok', ko: '급속 냉각 완료 (2시간 내 10℃)', en: 'Blast chilling done', vi: 'Làm nguội xong' },
    { time: '06:00', eq: null, type: 'ok', ko: '일일 자동기록 시작 — 센서 8대 정상', en: 'Daily auto-log started', vi: 'Bắt đầu ghi tự động' }
  ];

  /* ---------- 일일 점검 (SafetyCulture식 신호등 점검) ---------- */
  const INSPECTION = [
    { ko: '작업자 위생 상태 (복장·장신구)', en: 'Worker hygiene', vi: 'Vệ sinh công nhân' },
    { ko: '손 세척·소독 설비 작동', en: 'Hand-wash station', vi: 'Trạm rửa tay' },
    { ko: '작업대·도구 세척 상태', en: 'Tools sanitized', vi: 'Dụng cụ sạch' },
    { ko: '방충·방서 상태 (포충등·틈새)', en: 'Pest control', vi: 'Kiểm soát côn trùng' },
    { ko: '원료 보관 구분 (교차오염 방지)', en: 'Cross-contamination', vi: 'Chống nhiễm chéo' },
    { ko: '냉장·냉동고 문 밀폐 상태', en: 'Door seals', vi: 'Gioăng cửa' }
  ];

  /* ---------- 이탈 이력 (설비 상세용) ---------- */
  const DEVIATIONS = [
    { date: '2026-08-02 14:20', eq: 'e5', temp: 11.4, action: { ko: '냉각팬 필터 교체 후 30분 내 복귀. 해당 배치 품질검사 후 출하', en: 'Filter replaced, recovered in 30min', vi: 'Thay lọc, phục hồi sau 30 phút' }, by: '김현장' },
    { date: '2026-07-28 09:12', eq: 'e2', temp: -16.8, action: { ko: '성에 제거 지연 원인. 제상 주기 6h→4h 조정', en: 'Defrost cycle adjusted 6h→4h', vi: 'Chỉnh chu kỳ rã đông' }, by: '박품질' }
  ];

  return { I18N, EQUIP, ZONES, seriesFor, judge, RECORDS, ALERTS, INSPECTION, DEVIATIONS, hash8 };
})();
