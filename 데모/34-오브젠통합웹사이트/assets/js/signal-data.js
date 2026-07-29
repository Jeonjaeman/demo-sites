window.OBZEN_DEMO = {
  platform: {
    collect: { label: "CONNECT", title: "흩어진 데이터를<br>안전하게 연결합니다.", description: "고객 접점, 업무 시스템, 외부 채널을 표준화된 파이프라인으로 연결합니다.", points: ["실시간·배치 데이터 연계", "표준 커넥터와 품질 규칙", "권한 기반 접근 제어"], log: "4개의 데이터 소스가 정상 연결되었습니다." },
    unify: { label: "UNIFY", title: "같은 기준으로<br>데이터를 정리합니다.", description: "분산된 고객·상품·조직 데이터를 공통 모델과 거버넌스 정책으로 통합합니다.", points: ["통합 고객·업무 뷰", "메타데이터와 계보 관리", "품질 모니터링과 알림"], log: "12개의 품질 규칙이 데이터 흐름을 점검 중입니다." },
    analyze: { label: "ANALYZE", title: "설명 가능한 분석으로<br>의사결정을 돕습니다.", description: "BI, 예측 모델, 생성형 AI를 업무 맥락과 연결해 실행 가능한 인사이트를 만듭니다.", points: ["경영·고객 분석 대시보드", "예측 모델과 시나리오", "근거 추적 가능한 AI 응답"], log: "3개의 분석 모델이 최신 데이터로 갱신되었습니다." },
    activate: { label: "ACTIVATE", title: "인사이트를<br>실제 행동으로 바꿉니다.", description: "추천과 의사결정을 캠페인, 현장 업무, 경영 프로세스로 안전하게 전달합니다.", points: ["다채널 캠페인 실행", "업무 승인·알림 워크플로", "성과 측정과 지속 개선"], log: "승인된 다음 행동 8건이 업무 채널로 전달되었습니다." }
  },
  industries: {
    finance: { code: "FIN / 01", title: "고객의 다음 행동과<br>리스크를 함께 봅니다.", data: "거래 · 상담 · 채널", ai: "이탈 · 관심 · 이상징후", action: "최적 제안 · 선제 대응" },
    retail: { code: "RTL / 02", title: "수요의 변화와<br>고객의 취향을 연결합니다.", data: "구매 · 재고 · 행동", ai: "수요 · 세그먼트 · 추천", action: "개인화 · 재고 최적화" },
    manufacturing: { code: "MFG / 03", title: "현장 신호를 읽고<br>다음 운영을 예측합니다.", data: "설비 · 품질 · 생산", ai: "이상 · 원인 · 수요", action: "예방 정비 · 계획 조정" },
    public: { code: "PUB / 04", title: "복잡한 행정 데이터를<br>정책의 근거로 바꿉니다.", data: "민원 · 통계 · 사업", ai: "수요 · 영향 · 우선순위", action: "정책 설계 · 서비스 개선" }
  },
  ir: [
    { id: 1, type: "notice", label: "공지", date: "2026.07.29", title: "통합 법인 출범 및 홈페이지 개편 방향 안내" },
    { id: 2, type: "ir", label: "IR", date: "2026.07.24", title: "2026년 상반기 경영현황 설명자료" },
    { id: 3, type: "news", label: "보도자료", date: "2026.07.18", title: "오브젠, 통합 AI 데이터 사업 전략 발표" },
    { id: 4, type: "ir", label: "IR", date: "2026.07.11", title: "기업지배구조 주요 현황" },
    { id: 5, type: "notice", label: "공지", date: "2026.07.03", title: "합병에 따른 개인정보 이전 안내" }
  ],
  search: [
    { category: "제품", title: "CDXP+ 고객 데이터 플랫폼", meta: "통합 플랫폼 · 수집·연결", target: "#platform" },
    { category: "서비스", title: "생성형 AI 업무 적용", meta: "통합 플랫폼 · 분석·예측", target: "#platform" },
    { category: "회사", title: "오브젠·잘레시아 통합 비전", meta: "회사소개 · 합병 스토리", target: "#company" },
    { category: "IR", title: "2026년 상반기 경영현황 설명자료", meta: "홍보·IR · 제안용 가상 데이터", target: "#ir" },
    { category: "산업", title: "금융 고객 여정과 리스크 최적화", meta: "산업별 적용 · 금융", target: "#industries" },
    { category: "신뢰", title: "데이터·AI 거버넌스", meta: "접근 통제 · 처리 이력 · 배포 선택권", target: "#trust" }
  ]
};
