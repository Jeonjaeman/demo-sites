# 34 — 오브젠 통합 웹사이트 제안 데모

오브젠·잘레시아 합병 이후의 새 기업 정체성과 통합 데이터·AI 역량을 설명하는 반응형 기업·IR 사이트 데모다.

## 실행

정적 파일이므로 `index.html`을 직접 열 수 있다. 검색·다운로드·관리자 저장까지 안정적으로 확인하려면 로컬 정적 서버 사용을 권장한다.

```powershell
python -m http.server 8034
```

브라우저에서 `http://localhost:8034/데모/34-오브젠통합웹사이트/` 또는 이 폴더를 서버 루트로 실행했을 경우 `http://localhost:8034/`로 접속한다.

## 주요 화면

- `index.html`: 공개 홈페이지, 통합검색, 플랫폼·산업 탭, IR 필터·다운로드, 문의 폼
- `admin.html`: 검색·필터·등록·수정·게시 상태·로컬 저장
- `showcase.html`: 디자인 프리미티브 검증 화면
- `DESIGN.md`: 실제 구현과 일치하는 Signal Loom 디자인 시스템
- `DESIGN_ALT_CONCURRENT.md`: 병렬 작업 중 생성된 대안 방향 보존본(현재 구현에는 미적용)
- `분석/`: 기획·IA·사용자 여정

## 구현 원칙

- 탭과 관리자 버튼은 해당 영역만 갱신한다. 앱 루트의 `innerHTML` 전체 교체를 하지 않는다.
- 모든 가상 문서와 수치는 제안용임을 명시한다.
- 외부 프레임워크 없이 브라우저 표준 API만 사용한다.
- 모바일 메뉴, 다이얼로그, 폼 오류, 동적 결과에는 키보드·초점·ARIA 처리를 적용한다.

## 배포 대상

활성 화면은 `index.html`, `admin.html`, `showcase.html`과 `assets/css/signal-loom.css`, `assets/js/signal-data.js`, `assets/js/app.js`, `assets/js/admin.js`만 참조한다. 병렬 제작 과정의 `style.css`, `data.js`, `site.js`는 `archive-concurrent/`로 격리했고, `DESIGN_ALT_CONCURRENT.md`와 함께 배포 대상에서 제외한다.

## 데모 데이터

관리자 데이터는 `localStorage`의 `obzen-admin-demo-v1` 키에 저장된다. “초기화” 버튼으로 시드 데이터로 복원할 수 있다.

본 결과물은 오브젠 공식 홈페이지가 아니며, 제안 검토를 위한 비공식 데모다.
