# Figma 전환 키트

프로토타입(`assets/style.css`)의 디자인 토큰을 **Figma 네이티브 자산**으로 만들어 주는 재료입니다.
스크린샷을 붙여넣는 방식이 아니라, 진짜 변수·스타일·컴포넌트를 생성합니다.

```
figma/
├─ tokens.json          ← Tokens Studio 플러그인용 (변수 임포트)
├─ plugin/
│  ├─ manifest.json     ← Figma 개발 플러그인
│  └─ code.js           ← 실행 시 변수·스타일·컴포넌트를 생성
└─ README.md
```

---

## 무엇이 자동으로 만들어지나

플러그인을 한 번 실행하면 아래가 **Figma 파일 안에 실제 노드로** 생성됩니다.

| 자산 | 내용 |
|---|---|
| 변수 컬렉션 `VOLTA` | 색상 40종 × **Light / Dark 2모드**. 모드 전환만으로 다크 테마 확인 가능 |
| 변수 컬렉션 `VOLTA · Scale` | 간격 10 · 라디우스 6 · 사이즈 8 (nav 248, row 46, cell 52 …) |
| 텍스트 스타일 11종 | KPI Value 32/800 → Label Micro 10.5/800/+9% 까지 |
| 이펙트 스타일 4종 | Elevation 1~4 (카드 / hover / 팝오버 / 모달) |
| 컴포넌트 13세트 | Button(18 베리언트) · Badge · Shift Badge · Chip · Input · Switch · Avatar · KPI Card · Meter · **Gantt Bar** · Note · Table Row · Nav Item |
| `📐 Foundations` 페이지 | 컬러 스와치 그리드 + 타입 스펙 |

컴포넌트는 전부 **오토레이아웃 + 베리언트**로 만들어지고, 색은 하드코딩이 아니라 **변수에 바인딩**됩니다.
즉 라이트/다크를 모드 스위치 하나로 전환할 수 있습니다.

---

## 실행 방법

### 방법 A — 플러그인 (권장, 컴포넌트까지 한 번에)

1. Figma **데스크톱 앱**을 엽니다 (브라우저 버전은 로컬 플러그인 임포트가 안 됩니다)
2. 새 디자인 파일 생성
3. 메뉴 → `Plugins` → `Development` → `Import plugin from manifest…`
4. `figma/plugin/manifest.json` 선택
5. `Plugins` → `Development` → **VOLTA Design System Builder** 실행
6. 몇 초 뒤 `📐 Foundations` 페이지로 이동하면 완료

### 방법 B — 토큰만 (Tokens Studio 플러그인)

컴포넌트 없이 변수/스타일만 필요할 때.

1. Figma에서 **Tokens Studio for Figma** 플러그인 설치
2. 플러그인 → `Settings` → `Load from file/folder` → `figma/tokens.json` 선택
3. `light` / `dark` 토큰 세트를 각각 Figma 변수로 push

> 두 방법을 같이 쓰면 변수가 중복 생성될 수 있습니다. **A 또는 B 중 하나만** 쓰세요.

---

## 폰트

플러그인은 설치된 폰트를 자동으로 찾습니다.

```
Pretendard → Pretendard Variable → Inter → Roboto  (먼저 발견된 것 사용)
```

프로토타입은 **Pretendard** 기준입니다. 최종 산출물의 타이포를 정확히 맞추려면
[Pretendard](https://github.com/orioncactus/pretendard) 를 로컬에 설치한 뒤 실행하세요.
없으면 Inter로 대체되며, 한글 자소 폭이 달라 줄바꿈 위치가 조금 달라질 수 있습니다.

---

## 자동화되지 않는 것 (정직하게)

이 키트가 만들어 주는 건 **재료(토큰 + 컴포넌트 라이브러리)** 이고, 아래는 사람이 해야 합니다.

- **아이콘** — 컴포넌트의 아이콘은 회색 사각형 자리표시자입니다.
  `assets/ui.js` 의 `UI.icon()` 에 50여 종의 SVG path가 있으니, 이를 Figma로 붙여넣어 교체하세요.
  (`design-system.html` 의 아이콘 섹션에서 이름별로 확인 가능)
- **화면 조립** — 11개 화면(Schedule / Utilization / Projects …)은 위 컴포넌트로 직접 배치합니다.
  데모를 2x 스크린샷으로 떠서 옆에 깔고 옮기면 빠릅니다.
- **간트 바의 45° 해칭** — 충돌 표시용 대각 패턴은 Figma에서 패턴 오버레이로 추가해야 합니다.
- **프로토타입 인터랙션** — 화면 전환·모달 연결은 Figma 프로토타입 탭에서.

> HTML을 Figma로 자동 변환해 주는 플러그인(html.to.design 등)도 있지만,
> 레이어 네이밍이 엉키고 컴포넌트·변수로 연결되지 않아 **납품용 원본 파일로는 쓰기 어렵습니다.**
> 토큰과 컴포넌트를 이 키트로 세워두고 화면만 손으로 조립하는 편이 결과물이 훨씬 깨끗합니다.

---

## 토큰 동기화 검증

`style.css` 와 플러그인의 색 값이 어긋나면 코드와 디자인이 따로 놉니다.
아래 명령으로 40개 토큰(라이트/다크 각각)을 대조할 수 있습니다.

```bash
node figma/verify-tokens.js
```

마지막 검증: **40/40 일치, 불일치 0**

`on-accent`, `avatar-bg`, `track` 3개는 CSS에서 인라인으로 처리하던 값을
Figma에서 재사용하기 위해 명시적 토큰으로 승격한 것입니다 (플러그인 전용).

---

## 화면 설계 참조

각 화면의 레이아웃 수치·인터랙션 규칙은 아래에 있습니다.

- `design-system.html` — 컴포넌트 스펙, 반응형 브레이크포인트(1240/1024/640), 접근성 규칙
- `assets/schedule.css` — 간트 그리드 치수 (행 46 / 셀 52 / 좌측 240)
- `views/schedule.js` — 드래그 배정, 충돌 3규칙, Undo 동작 명세
