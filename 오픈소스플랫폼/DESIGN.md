# AI 교수·학습 플랫폼 프로덕션 전환 데모 디자인

## 1. Product intent

이 사이트는 새로운 LMS를 제안하는 제품 소개서가 아니다. 이미 운영 중인 AnythingLLM 기반 PoC를 대학 운영 환경으로 전환할 수 있음을, 학습자 경험과 운영 증거가 하나의 출처 ID로 연결되는 **Learning Proofbook(운영 증거 보드)** 형태로 보여주는 위시캣 지원용 데모다.

- 첫 30초 안에 `기존 PoC 유지 → 보안·SSO·재현 가능한 배포 → 검수 증거` 흐름을 이해한다.
- 기능 약속보다 실제 검수 항목, 산출물, 복구 리허설과 역할 통제를 먼저 보여준다.
- 계약 범위 밖인 신규 UI/디자인·학습 대시보드 개발을 과업으로 오인하게 만들지 않는다.
- 외부 데이터 반출 없이 내부 OpenAI 호환 게이트웨이만 사용하는 운영 경계를 명확히 한다.

## 2. Users and jobs

| 사용자 | 판단해야 할 것 | 데모에서 확인할 증거 |
| --- | --- | --- |
| 의뢰 담당자 | 요구를 정확히 읽었는가 | TXT/DOCX 추적률, 범위·제외 항목, 검수 6종 |
| 대학 IT 관리자 | 안전하게 운영 가능한가 | OIDC/SAML, 역할 매핑, 443/22, SSH·fail2ban, 비밀 분리 |
| 교수자 | 수업 자료 기반 답변이 가능한가 | 문서 인용형 AI 튜터, 워크스페이스, 출처 카드 |
| 학생 | 출처를 확인하며 학습할 수 있는가 | 질문·답변·인용 연결, 권한 제한 안내 |
| 검수자 | 완료 여부를 재현할 수 있는가 | Compose, 클린 서버 재배포, 백업·복구 로그, 한글 문서 |

## 3. Information architecture

하나의 앱 셸 안에 다섯 개 증거 화면을 둔다.

1. `전환 개요`: 목표, 계약 범위, 핵심 인프라, 6개 검수 조건.
2. `AI 튜터`: 교수/학생 관점의 문서 인용형 RAG 상호작용.
3. `보안·SSO`: 관리자 전용 역할 매핑, 인증 경로, 하드닝 체크.
4. `배포·복구`: Compose 스택, 클린 서버 재배포, 백업·복구 리허설.
5. `산출물`: 한글 문서, 인수인계, 주간 보고, 검수 패키지.

모바일에서는 좌측 탐색을 상단 가로 탭으로 바꾸고, 증거 카드는 한 열로 적층한다. 제품 화면과 제안서 설명을 혼합하지 않도록 상단에 `제안 데모 · 실제 운영 전환 범위 시각화`를 계속 표시한다.

## 4. Visual system

- 방향: 기술 운영 콘솔의 신뢰감과 교육 서비스의 부드러움을 결합한 dark navy + warm paper + emerald 시스템.
- 배경: `#07110f`, 표면: `#0d1b18`, 문서 표면: `#f3f0e8`, 핵심 강조: `#42e6a4`.
- 서체: 로컬 시스템 기반의 한국어 우선 스택. 제목은 무겁고 짧게, 본문은 17px 전후와 1.7 행간.
- 형태: 작은 10–18px 반경만 사용하고, 과도한 알약형 카드와 그라디언트는 쓰지 않는다.
- 질감: 얇은 격자와 상태선, 문서 인덱스 번호로 깊이를 만든다. 장식용 이미지·가짜 고객 로고·AI 생성 인물은 사용하지 않는다.
- 카피: 결과와 증거를 먼저 쓰고, 기술명은 이를 뒷받침하는 위치에 둔다.

## 5. Primitive showcase gate

제품 화면 전 다음 원시 컴포넌트와 상태를 `/`의 `컴포넌트 기준` 패널에서 먼저 검증한다.

| Primitive | 상태 |
| --- | --- |
| Button | primary, secondary, text, disabled, focus-visible |
| Role switch | 관리자, 교수자, 학생, keyboard selected |
| Status chip | 완료, 진행, 예정, 제한 |
| Evidence card | 기본, 강조, 잠금, hover/focus |
| Requirement badge | 단일 ID, 다중 ID, excluded/context |
| Text input | empty, filled, error, submitting |
| Progress rail | complete, active, upcoming |
| Source citation | collapsed summary, selected detail |

검증 폭은 375×812, 768×1024, 1280×900이다. 모든 상태에서 대비, 포커스 링, 텍스트 줄바꿈, 44px 터치 영역을 확인한 뒤 제품 패널에 동일 토큰을 사용한다.

## 6. Interaction and motion

- 역할 전환은 즉시 적용하고 현재 역할을 `aria-live`로 알린다.
- AI 튜터는 빈 질문을 막고 입력 가까이에 오류를 표시한다. 예시 질문 제출 후 답변과 출처 문서를 같은 화면에서 노출한다.
- 학생이 관리자 전용 화면을 열면 민감한 상세 대신 접근 제한 이유와 허용 역할만 보여준다.
- 화면 전환은 160–220ms의 opacity/translate만 사용하며 `prefers-reduced-motion`에서 제거한다.
- 네비게이션, 역할 선택, 질문 제출은 키보드만으로 완료할 수 있어야 한다.

## 7. Responsive and accessibility rules

- 375px에서도 가로 스크롤이 없어야 하며 긴 영문 기술명은 `overflow-wrap:anywhere`를 적용한다.
- 한국어 제목은 `word-break:keep-all`, 본문은 `line-break:strict`를 적용해 조사·마지막 음절 고아를 줄인다.
- 색만으로 상태를 구분하지 않고 텍스트 레이블을 함께 쓴다.
- 모든 상호작용 요소에 명시적 label, focus-visible, disabled 상태를 제공한다.
- 랜드마크는 header/nav/main/aside/footer 순으로 구성하고 헤딩 수준을 건너뛰지 않는다.
- 최소 WCAG AA 대비를 유지하고 표는 작은 화면에서 카드형 목록으로 변환한다.

## 8. Research and decision log

| 근거 | 반영한 결정 |
| --- | --- |
| Elice LXP / 360Learning / Sana Learn | 학습 흐름은 질문과 출처 확인을 중심으로 단순화 |
| Dify retrieval / Langfuse evaluation | 학습자 답변과 운영 추적을 동일 source ID로 연결 |
| Supabase product UI pattern | 어두운 운영 셸, 조밀한 상태 표현, emerald 단일 강조색 |
| DOCX 과업지시서 | 신규 UI/디자인은 계약 과업에서 제외하고 데모 시각화로 명확히 표시 |
| TXT 프로젝트 설명 | AnythingLLM 유지, 3역할, 내부 게이트웨이, 검수 6종을 핵심 경로로 배치 |
| Higgsfield official CLI | 브라우저 로그인이 필요한 자격증명 경로를 확인. 장식 이미지가 요구 충족에 기여하지 않아 생성하지 않음 |

실제 고객 로고, 성과 수치, 수행 이력은 제공 자료에 없으므로 만들지 않는다. 지원자 이력·포트폴리오는 위시캣 지원서에서 별도 입력해야 한다.
