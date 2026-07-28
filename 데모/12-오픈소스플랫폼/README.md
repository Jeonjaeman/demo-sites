# Campus AI Production Proofbook

AnythingLLM 기반 대학 AI 교수·학습 PoC의 보안 강화, SSO 연동, 재현 가능한 배포와 복구 검수를 보여주는 위시캣 지원용 인터랙티브 데모입니다.

## 제공 화면

- 전환 개요: 과업 범위, 인프라, 6개 검수 시나리오
- AI 튜터: 과목 워크스페이스 기반 RAG 답변과 출처 카드
- 보안·SSO: OIDC/SAML, 3역할, 폴백 가입, 호스트·컨테이너 하드닝
- 배포·복구: Docker Compose, 기관 Git, 클린 서버 재배포, 백업·복구 리허설
- 산출물: 한글 운영 문서, 주간 보고, 인수인계, 소유권 이관

신규 UI/디자인 개발은 실제 계약 과업에서 제외되며, 이 UI는 지원 검토를 위한 범위·검수 방식 시각화입니다.

## 실행

Node.js 22.13 이상이 필요합니다.

```bash
npm ci
npm run dev
```

React Grab과 React Scan을 개발 중 활성화하려면 `NEXT_PUBLIC_INSPECT=1`을 설정합니다. 운영 빌드에는 로드되지 않습니다.

## 검증

```bash
npx tsc --noEmit
npm run build
npm test
npm run lint
npm run doctor -- --verbose
node tests/browser-qa.mjs
```

브라우저 QA는 로컬 서버가 `http://localhost:3000`에서 실행 중이고 Windows 기본 Chrome 경로를 사용할 수 있을 때 동작합니다.

## 요구사항 추적

- `DESIGN.md`: 제품 의도, 정보 구조, 시각 시스템, 접근성 기준
- `docs/REQUIREMENTS.md`: TXT 127줄과 DOCX 58문단의 전체 추적 매트릭스
- `tests/rendered-html.test.mjs`: 핵심 요구 ID와 서버 렌더 계약
