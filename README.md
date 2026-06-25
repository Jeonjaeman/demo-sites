# Demo Portal — 데모사이트 모음

산업·업종별 제안용 데모사이트를 **하나의 레포에서 관리**하는 모노레포입니다.
루트 [`index.html`](index.html)은 모든 데모를 한 곳에서 보여주는 **통합 포털**입니다.

## 구조
```
demo-sites/  (이 레포, GitHub Pages 루트)
├─ index.html        ← 통합 포털 (모든 데모 링크)
└─ 운송포탈/          ← 데모 (하위 폴더 = 개별 URL)
   ├─ index.html
   ├─ rate.html · quote.html · board.html · admin.html
   └─ assets/ (css · js · media)
```

## 배포 (GitHub Pages)
- 포털: `https://jeonjaeman.github.io/demo-sites/`
- 운송포탈: `https://jeonjaeman.github.io/demo-sites/운송포탈/`

## 새 데모 추가하는 법
1. 이 레포에 데모 폴더를 추가 (`<데모이름>/index.html`)
2. 루트 `index.html`의 `DEMOS` 배열에 항목 1줄 추가 (`url:"./<데모이름>/index.html"`)
3. commit & push → 자동 배포

> 새 데모는 별도 레포를 만들 필요 없이 **이 레포에 폴더로** 추가하면 됩니다.

## 기존 개별 레포 데모
아래 데모들은 이전에 **각각 별도 레포**로 배포되어 있어, 이 모노레포에 합치지 않고 포털에서 각자 주소로 링크합니다(중복·URL 깨짐 방지). 원하면 추후 이 레포로 이전할 수 있습니다.

| 데모 | 기존 레포 | 배포 |
|------|-----------|------|
| 건축자재 | `haos-demo` | https://jeonjaeman.github.io/haos-demo/ |
| 여성 피트니스 | `vivafit-demo` | https://jeonjaeman.github.io/vivafit-demo/ |
| 중고 건설장비 | `jangin-demo` | https://jeonjaeman.github.io/jangin-demo/ |
| 매출·인보이스 | `goldinvoice` | https://jeonjaeman.github.io/goldinvoice/ |
| 보안업체 | `securion-demo` | https://jeonjaeman.github.io/securion-demo/ |
| 업무요청 접수 | `as-demo` | https://jeonjaeman.github.io/as-demo/ |
| 경매 | `demosite` | (Pages 미설정) |

## 로컬 실행
```bash
python -m http.server 8810
# http://127.0.0.1:8810/         → 포털
# http://127.0.0.1:8810/운송포탈/  → 운송포탈 데모
```
