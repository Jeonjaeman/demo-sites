# OBZEN Integrated — Signal Loom Design System

## 0. Research Log

- Source brief: 오브젠·잘레시아 합병 후 공식 통합 기업·IR 홈페이지, 반응형 약 25페이지, 통합검색·문의·관리자·다국어 옵션.
- Current brand evidence: 오브젠 공식 사이트의 버건디 `#9F1B68`, 네이비 `#0F2861`, 오렌지 `#FFAB2C`를 계승했다.
- Domain references: Palantir의 운영 시스템 맵, Databricks의 플랫폼 중심 IA, Upstage의 국내 엔터프라이즈 AI 신뢰 구조.
- Design references: Microsoft AI의 책임·신뢰 위계, Terminal Industries의 연결 내러티브, LX Hausys Trendship 2025의 공간감과 절제된 전환.
- Embedded references: `soft-skill.md` + `stripe.md`.
- Lazyweb: 2026-07-29 curl 레시피로 3회 시도했으나 Windows curl 환경에서 요구 Accept 헤더를 서버가 거절해 공식 사이트 조사로 대체했다.
- Image generation: 정보 구조와 상태를 정확히 설명해야 하는 시스템 맵이므로 래스터 생성물 대신 코드 네이티브 SVG·CSS를 선택했다.

## 1. Concept

### Signal Loom

두 회사의 역량을 두 데이터 스트림으로 표현한다.

- Burgundy: 고객 접점, CRM, 캠페인 실행
- Navy: 기업 데이터, BI, 경영 분석
- Teal: 합병 이후의 통합 AI 제어 레이어
- Orange: 중요한 의사결정과 행동 시점

핵심 문장: “고객 데이터와 경영 데이터를 연결해, 다음 행동이 보이는 기업을 만듭니다.”

## 2. Tokens

| Token | Value | Role |
| --- | --- | --- |
| `--ink` | `#081321` | Hero, dark system surface |
| `--navy` | `#0F2861` | Enterprise stream |
| `--wine` | `#9F1B68` | Primary action, customer stream |
| `--wine2` | `#C43B80` | Hover and emphasis |
| `--teal` | `#22B8A7` | Integrated signal, success |
| `--orange` | `#FFAB2C` | Decision pulse, focus |
| `--paper` | `#F8F6F2` | Main light surface |
| `--paper2` | `#F0ECE6` | Editorial section |
| `--text` | `#172033` | Primary text |
| `--muted` | `#5B6578` | Secondary text |
| `--line` | `#D8DDE5` | Borders |

CSS에서 반복되는 알파 색은 이 기본 팔레트의 투명 파생값이다.

## 3. Typography

- Korean/UI: `Pretendard, "Noto Sans KR", Arial, sans-serif`
- System labels: `Consolas, monospace`
- Display: `clamp(4rem, 8vw, 8.6rem)`, weight 570, line-height .88
- Section heading: `clamp(2.7rem, 6.2vw, 6.6rem)`, line-height .98
- Body: 16–19px, line-height 1.65
- Minimum small text: 11px for short system labels only; meaningful body/help copy stays at 12px 이상.

## 4. Layout

- Content maximum: 1440px
- Desktop: 12-column intent, 64px outer gutter
- Tablet: 40px outer gutter
- Mobile: 16px outer gutter
- Section spacing: `clamp(6rem, 11vw, 11.25rem)`
- Touch target: 44×44px minimum
- Radius: 12px controls, 24–28px feature panels, circles only for nodes/status

Compositions alternate between dark system map, warm editorial split, platform console, sticky industry scenario, trust orbit, IR index, and form. 같은 카드 그리드를 반복하지 않는다.

## 5. Components

- Header: transparent over hero, solid blurred surface after scroll.
- Buttons: burgundy primary, outlined secondary, underline text link.
- Search: native modal dialog, live result count, keyboard `/` shortcut.
- Tabs: selected state updates only the related panel.
- IR index: date/type/title/download with local demo Blob.
- Contact: persistent labels, native validation, explicit summary, no network submission.
- Admin: localStorage demo CRUD, scoped table/stat updates, native modal editor.
- System map: native SVG flows and DOM nodes; no screenshot-as-UI.

## 6. Motion

- Control transitions: 180–300ms.
- Section reveal: 650ms, once per section.
- Motion communicates state or data flow only.
- `prefers-reduced-motion` disables CSS and JavaScript animations.
- No autoplay carousel, scroll hijacking, or whole-page fade on clicks.

## 7. Responsive

- At 1120px: navigation collapses, hero and platform stack.
- At 760px: 16px gutters, full-width CTAs, scrollable platform tabs, single-column scenarios/forms/footer.
- Admin becomes top navigation, two-column stats, reduced table columns, full-width editor.
- No horizontal page overflow is allowed.

## 8. Accessibility and Content Rules

- Skip link, semantic landmarks, one `h1`, visible focus, native dialogs.
- Dialogs trap focus, close on Escape, and restore focus.
- Dynamic counts/status use `aria-live`.
- Accent color is never the only state cue.
- All demo metrics, documents and scenarios are labelled “제안용 가상 데이터”.
- Public facts are separated from proposal-only generalizations.
- Tabs, filters, forms and admin edits update scoped DOM; application root replacement and `location.reload()` are prohibited.

## Primitive Showcase Gate

`showcase.html` verifies colors, typography, actions, tabs, index rows, forms, notices and system nodes before product screens are judged.

## Reference Evidence

Current public references used as directional evidence, not copied layouts:

- OBZEN: https://www.obzen.com/
- Palantir Foundry/AIP architecture: https://palantir.com/docs/foundry/architecture-center/overview/
- Databricks data and AI platform: https://www.databricks.com/
- Upstage enterprise AI: https://www.upstage.ai/
- Microsoft AI: https://microsoft.ai/
- Terminal Industries: https://terminal-industries.com/
- LX Hausys Trendship: https://www.lxtrendship.com/en

Brand colors were sampled from the public OBZEN presence and reconciled into this demo’s original Signal Loom system. References support the design rationale; all copy, composition, diagrams, and interactions are newly authored for this proposal.
