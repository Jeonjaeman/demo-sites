# Higgsfield 이미지·모션 제작 브리프

프로토타입의 상품 비주얼은 아래 파일명으로 교체한다. 이미지 생성 시 제품의 딥 세이지 색상, 짧은 블루종 길이, 리넨 혼방의 직조감, 둥근 칼라, 전면 버튼, 곡선형 포켓을 모든 컷에서 동일하게 유지한다.

## 공통 아트 디렉션

- 브랜드 무드: quiet luxury, Korean editorial commerce, warm natural daylight
- 배경: warm ivory `#E7E1D6`, 그림자는 부드럽고 낮은 대비
- 제품색: deep sage green `#486354`
- 재질: linen 64%, cotton 36%, visible natural weave, garment washed
- 금지: 로고, 워터마크, 텍스트, 과도한 광택, 지퍼, 후드, 가죽 질감, 왜곡된 단추와 소매
- 출력: sRGB, 세로 4:5, 최소 2400×3000px, 동일 seed/character reference 유지
- 인물 정책: 모든 모델은 실제 인물과 무관한 성인 가상 인물로 생성한다. 연예인·인플루언서·특정인의 이름, 얼굴, 닮은꼴 레퍼런스를 사용하지 않는다.

## 가상 모델 캐릭터 락

- 20대 후반의 성인 가상 패션 모델, 중성적이고 차분한 인상
- 짧은 다크 브라운 헤어, 자연스러운 피부 질감, 최소한의 메이크업
- 키가 크고 균형 잡힌 체형이되 비현실적으로 마르거나 과장되지 않음
- 모든 착용 컷에서 동일한 얼굴, 헤어, 체형, 피부톤 유지
- 실제 사람의 이름이나 사진을 character reference로 사용하지 않고, 최초 생성 컷의 seed와 가상 캐릭터 이미지만 후속 컷에 사용

## 01. 상품 정면 — `product-front.webp`

**Prompt**

> Premium fashion ecommerce product photography of a deep sage green cropped linen blouson, front view, rounded collar, five small natural horn buttons, two softly curved patch pockets, relaxed dropped shoulder, subtle visible linen weave, centered and floating on warm ivory seamless studio background, soft directional daylight from upper left, restrained natural shadow, quiet luxury Korean editorial styling, accurate garment construction, photorealistic, 85mm lens, no model, no hanger, no text, no logo, no watermark

## 02. 착용 정면 — `look-front.webp`

**Prompt**

> Full body Korean fashion editorial featuring a completely fictional adult androgynous model with no resemblance to any real person, wearing the exact same deep sage cropped linen blouson over an off-white tank and charcoal wide trousers, relaxed balanced fit with clean shoulder line and slight chest ease, neutral standing pose, warm ivory studio, diffused daylight, sophisticated minimal commerce campaign, natural skin texture, garment details fully visible, 50mm lens, no text, no logo, no watermark

## 03. 착용 측면 — `look-side.webp`

**Prompt**

> Three-quarter side view of the same completely fictional adult model from the character reference and the exact same deep sage linen blouson, showing cropped length, sleeve volume and back drape while taking one natural step, warm ivory studio, soft shadow, Korean quiet luxury fashion campaign, consistent face, body, garment construction and color, high-end ecommerce photography, no resemblance to any real person, no text, no logo, no watermark

## 04. 소재 디테일 — `fabric-detail.webp`

**Prompt**

> Extreme close-up macro photograph of the exact deep sage linen cotton fabric and one natural horn button from the same blouson, visible irregular linen weave, garment-washed softness, refined stitching, warm directional light, tactile premium fashion detail photography, shallow depth of field, no text, no logo, no watermark

## 05. 상품 히어로 모션 — `hero-motion.mp4`

**Start frame**: `product-front.webp`

**Motion prompt**

> A restrained 5-second luxury ecommerce camera move. Slow 6-degree arc from front-left to centered front while the jacket fabric responds with an almost imperceptible natural breeze. Keep the garment shape, buttons, pockets and color perfectly consistent. Soft shadow shifts naturally. No morphing, no added details, no dramatic zoom, no text. End on a stable centered product frame suitable for a seamless loop.

## 적용 위치

- `assets/images/product-front.webp`: 상품 상세 첫 화면
- `assets/images/look-front.webp`: 갤러리 02
- `assets/images/look-side.webp`: 갤러리 03
- `assets/images/fabric-detail.webp`: 갤러리 04 및 소재 설명
- `assets/video/hero-motion.mp4`: 데스크톱 hover/선택 재생, 모바일은 poster 우선

현재 `linen-blouson.svg`는 Higgsfield 결과물이 준비되기 전의 fallback이자 로딩 실패 대체 자산으로 유지한다.
