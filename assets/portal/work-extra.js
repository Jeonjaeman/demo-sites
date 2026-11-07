// WORK 에만 있는 MVP — 탱탱소프트 WORKS 에 공개 등록됐지만 포털 DEMOS 에는 없는 작업(2026-11-07 기준 15건).
//   운영 중이 아닌 작업은 모두 MVP 로 보인다(카드를 누르면 새 탭에서 바로 열림). 썸네일은 WORKS 원본(1600×1200)을 assets/work/<slug>.webp 로.
//   WORKS 와 DEMOS 에 둘 다 있는 작업(운송포탈 · 탐정법인 · 레오닉스 · HAOS · VIVAFIT · 장인)은 DEMOS 쪽 한 장만 싣는다.
window.WORK_EXTRA = [
  { slug:"malgeunnun-eye", title:"맑은눈안과", sub:"메디지오 제작 샘플 · 안과(녹내장·백내장 센터)", url:"https://medigeo.co.kr/samples/malgeunnun-eye/" },
  { slug:"ongyeol-kmc", title:"온결한방병원", sub:"메디지오 제작 샘플 · 한방병원(척추·관절 비수술)", url:"https://medigeo.co.kr/samples/ongyeol-kmc/" },
  { slug:"bareungyeol-hospital", title:"바른결병원", sub:"메디지오 제작 샘플 · 척추·관절 병원", url:"https://medigeo.co.kr/samples/bareungyeol-hospital/" },
  { slug:"pogeun-amc", title:"포근동물의료센터", sub:"메디지오 제작 샘플 · 24시 동물의료센터", url:"https://medigeo.co.kr/samples/pogeun-amc/" },
  { slug:"sodam-eye", title:"소담안과", sub:"메디지오 제작 샘플 · 안과(망막·백내장·녹내장)", url:"https://medigeo.co.kr/samples/sodam-eye/" },
  { slug:"daon-uro", title:"다온비뇨의학과의원", sub:"메디지오 제작 샘플 · 비뇨의학과(전립선·요로결석)", url:"https://medigeo.co.kr/samples/daon-uro/" },
  { slug:"mediimg-neuflow-brainall", title:"MEDIIMG NeuFlow 데모 01", sub:"의료영상 제품 소개 사이트 리뉴얼 데모 (BrainAll 스타일)", url:"https://jeonjaeman.github.io/mediimg-demo/01-brainall/" },
  { slug:"mediimg-neuflow-unitedcarriers", title:"MEDIIMG NeuFlow 데모 04", sub:"의료영상 제품 소개 사이트 리뉴얼 데모 (United Carriers 스타일)", url:"https://jeonjaeman.github.io/mediimg-demo/04-unitedcarriers/" },
  { slug:"mediimg-neuflow-alethia", title:"MEDIIMG NeuFlow 데모 05", sub:"의료영상 제품 소개 사이트 리뉴얼 데모 (Alethia 스타일)", url:"https://jeonjaeman.github.io/mediimg-demo/05-alethia/" },
  { slug:"mediimg-neuflow-gigavis", title:"MEDIIMG NeuFlow 데모 06", sub:"의료영상 제품 소개 사이트 리뉴얼 데모 (Gigavis 스타일)", url:"https://jeonjaeman.github.io/mediimg-demo/06-gigavis/" },
  { slug:"basak-chicken-bold", title:"바삭치킨 데모 A (Bold)", sub:"신규 치킨 브랜드 웹사이트 시안", url:"https://jeonjaeman.github.io/basak-chicken-demo/a-bold/" },
  { slug:"basak-chicken-pop", title:"바삭치킨 데모 B (Pop)", sub:"신규 치킨 브랜드 웹사이트 시안", url:"https://jeonjaeman.github.io/basak-chicken-demo/b-pop/" },
  { slug:"basak-chicken-warm", title:"바삭치킨 데모 C (Warm)", sub:"신규 치킨 브랜드 웹사이트 시안", url:"https://jeonjaeman.github.io/basak-chicken-demo/c-warm/" },
  { slug:"staydrop-magazine", title:"스테이드롭 데모 A (Magazine)", sub:"호텔 어메니티 자판기 브랜드 메인페이지 시안 (매거진 화보형)", url:"https://jeonjaeman.github.io/staydrop-demo/a-magazine/" },
  { slug:"staydrop-editorial", title:"스테이드롭 데모 B (Editorial)", sub:"호텔 어메니티 자판기 브랜드 메인페이지 시안 (에디토리얼형)", url:"https://jeonjaeman.github.io/staydrop-demo/b-editorial/" },
].map(w => ({ ...w, cat:"home", status:"live", thumb:`./assets/work/${w.slug}.webp`, work:true }));
