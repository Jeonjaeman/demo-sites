/* KEYRING v2 — 외국인 고객용 차량 이용가이드 앱 (재작업).
   언어 온보딩 → QR 진입 → 홈(탭) → 가이드(아코디언) → 반납 체크 → 지점 지도 → 문의.
   모든 데이터 가상 · 번역은 "기계번역 표시" 시뮬레이션. */
(function () {
  'use strict';

  /* ---------- 아이콘 (자체 SVG · 이모지 미사용) ---------- */
  var ICONS = {
    car: '<path d="M4 15l1.5-5.5A2 2 0 0 1 7.4 8h9.2a2 2 0 0 1 1.9 1.5L20 15"/><rect x="3" y="14" width="18" height="5" rx="1.6"/><circle cx="7.5" cy="19" r="1.6"/><circle cx="16.5" cy="19" r="1.6"/>',
    key: '<circle cx="8" cy="14" r="4.5"/><path d="M11.5 10.5 20 2M16 6l3 3M13 9l2 2"/>',
    fuel: '<path d="M5 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16M3.5 21h9"/><path d="M14 8h2.5a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 0 3 0V9l-2.5-2.5"/><path d="M6.5 7h4v4h-4z"/>',
    alert: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4M12 17h.01"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
    chat: '<path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12Z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/>',
    phone: '<path d="M5 4h4l1.5 4.5-2.2 1.6a13 13 0 0 0 5.6 5.6l1.6-2.2L20 15v4a1.8 1.8 0 0 1-2 1.8A16.5 16.5 0 0 1 3.2 6 1.8 1.8 0 0 1 5 4Z"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-6h4v6"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9"/>',
    checkS: '<path d="m5 12.5 4 4L19 7"/>',
    camera: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7 10 4.5h4L15.5 7"/><circle cx="12" cy="13.2" r="3.4"/>',
    bag: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/>',
    pin: '<path d="M12 21s-6.5-5.4-6.5-10a6.5 6.5 0 0 1 13 0c0 4.6-6.5 10-6.5 10Z"/><circle cx="12" cy="10.6" r="2.3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.7 3.8 9S14.6 18.4 12 21c-2.6-2.6-3.8-5.7-3.8-9S9.4 5.6 12 3Z"/>',
    park: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9.5 17V7h3.6a3 3 0 0 1 0 6H9.5"/>',
    ev: '<path d="m13 2-8 12h6l-2 8 8-12h-6l2-8Z"/>',
    doc: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>'
  };
  function icon(name, size) {
    return '<svg class="ico-svg" width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  }

  /* ---------- 다국어 ---------- */
  var LANGS = [['ko', '한국어', 'Korean'], ['en', 'English', 'EN'], ['zh', '中文', 'ZH'], ['ja', '日本語', 'JA']];
  var lang = null; // 온보딩에서 선택

  var T = {
    mtBadge: {
      ko: '아래 내용은 관리자가 등록한 한국어 원고입니다.',
      en: 'Auto-translated from Korean by machine. Safety items include the original Korean.',
      zh: '由机器自动翻译自韩语。安全事项附韩语原文。',
      ja: '韓国語から機械翻訳されています。安全項目は原文を併記します。'
    },
    tabs: {
      home: { ko: '홈', en: 'Home', zh: '主页', ja: 'ホーム' },
      guide: { ko: '가이드', en: 'Guide', zh: '指南', ja: 'ガイド' },
      check: { ko: '반납', en: 'Return', zh: '还车', ja: '返却' },
      map: { ko: '지점', en: 'Branch', zh: '网点', ja: '店舗' },
      contact: { ko: '문의', en: 'Contact', zh: '咨询', ja: '問合せ' }
    },
    sec: {
      start: { ko: '시동·기어', en: 'Start & Gear', zh: '启动·换挡', ja: '始動・ギア' },
      fuel: { ko: '주유·충전', en: 'Fuel / Charge', zh: '加油·充电', ja: '給油・充電' },
      warn: { ko: '이용 시 주의사항', en: 'Precautions', zh: '注意事项', ja: '注意事項' },
      ret: { ko: '반납 안내', en: 'Return Info', zh: '还车指南', ja: '返却案内' }
    },
    myCar: { ko: '내 차량', en: 'My Vehicle', zh: '我的车辆', ja: 'マイカー' },
    quick: {
      emg: { ko: '비상 연락', en: 'Emergency', zh: '紧急联系', ja: '緊急連絡' },
      ret: { ko: '반납 체크', en: 'Return Check', zh: '还车检查', ja: '返却チェック' },
      map: { ko: '주변 지점', en: 'Nearby', zh: '附近网点', ja: '近くの店舗' }
    },
    ckTitle: { ko: '반납 전 체크리스트', en: 'Return Checklist', zh: '还车检查清单', ja: '返却チェックリスト' },
    ckSub: { ko: '항목을 눌러 체크하세요 — 전부 체크되면 반납 준비 완료!', en: 'Tap each item — all done means ready to return!', zh: '点击各项进行检查——全部完成即可还车！', ja: '各項目をタップ — 全て完了で返却OK！' },
    ckDone: { ko: '반납 준비 완료! 지점 스태프에게 키를 전달해 주세요.', en: 'All set! Hand the key to our staff.', zh: '准备完毕！请将钥匙交给工作人员。', ja: '準備完了！スタッフにキーをお渡しください。' },
    mapT: { ko: '주변 지점·반납 장소', en: 'Nearby Branches & Return', zh: '附近网点·还车地点', ja: '近くの店舗・返却場所' },
    contactT: { ko: '문의하기', en: 'Contact Us', zh: '咨询', ja: 'お問い合わせ' }
  };
  function L(obj) { return obj[lang || 'ko'] || obj.ko; }

  /* ---------- 차량 데이터 (가상 · 4개 언어) ---------- */
  function ml(ko, en, zh, ja) { return { ko: ko, en: en, zh: zh, ja: ja }; }
  var CARS = [
    { id: 'sedan', img: 'assets/img/car-sedan.jpg', code: 'KR-SD01', icon: 'car',
      name: ml('컴팩트 세단', 'Compact Sedan', '紧凑型轿车', 'コンパクトセダン'),
      sub: ml('5인승 · 가솔린', '5-seat · Gasoline', '5座 · 汽油', '5人乗り · ガソリン'),
      start: ml('스마트키 차량입니다. 키를 소지한 채 브레이크를 밟고 START 버튼을 누르세요. 기어는 P에서 브레이크를 밟아야 변속됩니다.',
        'Smart-key vehicle. With the key inside, press the brake and push START. Shift from P only while pressing the brake.',
        '智能钥匙车辆。携带钥匙踩刹车并按START按钮。挂挡需在P挡踩住刹车。',
        'スマートキー車両です。キーを持った状態でブレーキを踏みSTARTボタンを押してください。'),
      fuel: ml('주유구는 운전석 좌측 하단 레버로 엽니다. 반드시 가솔린(휘발유)만 주유하세요.',
        'Open the fuel door with the lever at the driver seat lower-left. Use GASOLINE only.',
        '加油口通过驾驶座左下方拉杆打开。请务必只加汽油。',
        '給油口は運転席左下のレバーで開きます。必ずガソリンのみ給油してください。'),
      warns: [
        ml('경고등이 켜지면 즉시 안전한 곳에 정차 후 비상 연락처로 전화하세요.', 'If a warning light turns on, stop safely and call the emergency line.', '警告灯亮起时请立即安全停车并拨打紧急电话。', '警告灯が点灯したら安全な場所に停車し、緊急連絡先へ電話してください。'),
        ml('경유(디젤) 주유 시 수리비가 청구됩니다.', 'Refueling with diesel will incur repair costs.', '加柴油将产生维修费用。', '軽油を給油した場合は修理費を請求します。'),
        ml('반납 전 연료를 인수 시점 수준으로 채워 주세요.', 'Refill fuel to the pickup level before return.', '还车前请将燃油加至取车时的水平。', '返却前に燃料を受取時のレベルまで補充してください。')
      ],
      ret: ml('지정 반납 장소에 주차 후 앱의 반납 체크리스트를 완료하고 키를 스태프에게 전달하세요.',
        'Park at the designated return spot, finish the checklist in the app, and hand the key to staff.',
        '停至指定还车点，完成App内检查清单后将钥匙交给工作人员。',
        '指定の返却場所に駐車し、アプリのチェックリストを完了後、キーをスタッフへ。') },
    { id: 'van', img: 'assets/img/car-van.jpg', code: 'KR-VN02', icon: 'car',
      name: ml('패밀리 밴', 'Family Van', '家用MPV', 'ファミリーバン'),
      sub: ml('9인승 · 디젤', '9-seat · Diesel', '9座 · 柴油', '9人乗り · ディーゼル'),
      start: ml('슬라이딩 도어는 손잡이를 가볍게 당기면 자동으로 열립니다. 3열 시트는 바닥으로 접을 수 있습니다.',
        'Sliding doors open automatically with a light pull. 3rd-row seats fold into the floor.',
        '轻拉把手滑动门自动打开。第三排座椅可折入地板。',
        'スライドドアは軽く引くと自動で開きます。3列目は床下収納できます。'),
      fuel: ml('이 차량은 디젤(경유) 차량입니다. 가솔린 주유 시 운행이 불가합니다.',
        'DIESEL vehicle. Refueling with gasoline will disable the car.',
        '本车为柴油车。加汽油将无法行驶。',
        'ディーゼル車です。ガソリンを給油すると走行不能になります。'),
      warns: [
        ml('높이 1.9m — 지하주차장 진입 전 높이 제한을 확인하세요.', 'Height 1.9m — check clearance before underground parking.', '车高1.9米——进地下停车场前确认限高。', '車高1.9m — 地下駐車場では高さ制限を確認してください。'),
        ml('측풍이 강한 교량에서는 감속 운행하세요.', 'Slow down on bridges with strong crosswinds.', '侧风强的桥梁请减速行驶。', '横風の強い橋では減速してください。')
      ],
      ret: ml('반납 전 차내 좌석을 원위치하고 개인 소지품을 확인해 주세요.',
        'Restore seats and check personal belongings before return.',
        '还车前请复位座椅并检查随身物品。',
        '返却前に座席を元に戻し、私物をご確認ください。') },
    { id: 'ev', img: 'assets/img/car-ev.jpg', code: 'KR-EV03', icon: 'ev',
      name: ml('전기 SUV', 'Electric SUV', '纯电SUV', '電気SUV'),
      sub: ml('5인승 · EV', '5-seat · EV', '5座 · 电动', '5人乗り · EV'),
      start: ml('브레이크를 밟으면 시동이 걸립니다(무소음). 기어는 다이얼을 돌려 선택합니다.',
        'Press the brake to power on (silent). Rotate the dial to select gear.',
        '踩刹车即可启动（无声）。旋转旋钮选择挡位。',
        'ブレーキを踏むと起動します（無音）。ギアはダイヤルで選択します。'),
      fuel: ml('충전구는 차량 앞쪽에 있습니다. 급속(DC)·완속(AC) 모두 지원하며, 케이블은 트렁크 하단에 있습니다.',
        'Charging port is at the front. DC fast and AC slow are supported; the cable is under the trunk floor.',
        '充电口位于车头。支持快慢充，充电线在后备箱下层。',
        '充電ポートは前方にあります。急速・普通充電対応、ケーブルはトランク下です。'),
      warns: [
        ml('배터리 20% 이하가 되면 가까운 충전소에서 충전 후 운행하세요.', 'Below 20% battery, charge before continuing.', '电量低于20%请先充电再行驶。', 'バッテリー20%以下になったら充電してから運転してください。'),
        ml('반납 시 배터리 60% 이상을 유지해 주세요.', 'Return with at least 60% battery.', '还车时电量请保持60%以上。', '返却時はバッテリー60%以上でお願いします。'),
        ml('충전 케이블 분실 시 비용이 청구됩니다.', 'Loss of the charging cable will be charged.', '充电线丢失将收费。', 'ケーブル紛失時は費用を請求します。')
      ],
      ret: ml('반납 지점의 EV 전용 구역에 주차해 주세요.',
        'Park in the EV-only zone at the return branch.',
        '请停在还车网点的EV专用区。',
        '返却店舗のEV専用エリアに駐車してください。') }
  ];

  var BRANCHES = [
    { type: 'branch', name: ml('서울역 지점', 'Seoul Station Branch', '首尔站网点', 'ソウル駅支店'), x: .32, y: .38, km: 0.4 },
    { type: 'return', name: ml('명동 반납 전용', 'Myeongdong Return Only', '明洞还车专用', '明洞返却専用'), x: .58, y: .30, km: 1.1 },
    { type: 'branch', name: ml('공항터미널 지점', 'Airport Terminal Branch', '机场航站楼网点', '空港ターミナル支店'), x: .74, y: .62, km: 2.6 },
    { type: 'return', name: ml('동대문 반납 전용', 'Dongdaemun Return Only', '东大门还车专用', '東大門返却専用'), x: .22, y: .68, km: 3.2 }
  ];

  var CHECKS = [
    { id: 'fuel', icon: 'fuel', t: ml('연료·배터리 확인', 'Fuel / Battery level', '燃油·电量确认', '燃料・バッテリー確認'), s: ml('인수 시점 수준 이상', 'At least pickup level', '不低于取车水平', '受取時レベル以上') },
    { id: 'bag', icon: 'bag', t: ml('개인 소지품 확인', 'Personal belongings', '随身物品确认', '私物の確認'), s: ml('트렁크·좌석 아래까지', 'Trunk & under seats', '包括后备箱和座位下', 'トランク・座席下まで') },
    { id: 'photo', icon: 'camera', t: ml('차량 외관 사진 4장', 'Exterior photos (4)', '车身照片4张', '外観写真4枚'), s: ml('전·후·좌·우 촬영', 'Front, rear, both sides', '前后左右', '前後左右') },
    { id: 'park', icon: 'park', t: ml('지정 구역 주차', 'Park in return zone', '停至指定区域', '指定区域に駐車') },
    { id: 'key', icon: 'key', t: ml('키 반납', 'Return the key', '归还钥匙', 'キー返却'), s: ml('스태프에게 직접 전달', 'Hand to staff directly', '直接交给工作人员', 'スタッフへ直接') }
  ];

  /* ---------- 상태 ---------- */
  var screen = document.getElementById('screen');
  var cur = 'onb';
  var car = CARS[0];
  var geoConsent = false;
  var checks = {};

  var FLOW = [
    ['P1 — 진입', [['onb', '언어 온보딩'], ['s01', 'QR 진입 (현장 스티커)']]],
    ['P2 — 이용', [['home', '홈 (내 차량·빠른 액션)'], ['guide', '차종 가이드 · 자동번역'], ['check', '반납 체크리스트']]],
    ['P3 — 지원', [['map', '주변 지점 지도'], ['contact', '문의 · 외부 채팅']]]
  ];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(msg, acc) {
    var w = screen.querySelector('.toast-wrap');
    if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; screen.appendChild(w); }
    var t = document.createElement('div');
    t.className = 'toast' + (acc ? ' acc' : ''); t.textContent = msg;
    w.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2000);
    setTimeout(function () { t.remove(); }, 2400);
  }

  function langSwitcher() {
    return '<span class="langs">' + LANGS.map(function (l) {
      return '<button data-lang="' + l[0] + '"' + (lang === l[0] ? ' class="on"' : '') + '>' + (l[0] === 'ko' ? '한' : l[2]) + '</button>';
    }).join('') + '</span>';
  }
  function tabbar(active) {
    var tabs = [['home', 'home'], ['guide', 'doc'], ['check', 'list'], ['map', 'map'], ['contact', 'chat']];
    return '<nav class="tabbar">' + tabs.map(function (t) {
      return '<button class="tab' + (active === t[0] ? ' on' : '') + '" data-go="' + t[0] + '"><span class="ti">' + icon(t[1], 22) + '</span>' + esc(L(T.tabs[t[0]])) + '</button>';
    }).join('') + '</nav>';
  }

  /* ---------- 화면 렌더 ---------- */
  var R = {};

  R.onb = function () {
    return '<div class="scr on"><div class="onb">' +
      '<div class="onb-top"><div>' +
      '<div class="mark-big">K</div>' +
      '<h1>Welcome to<br>KEYRING</h1>' +
      '<p>렌터카 이용 가이드 · Rental car guide<br>租车指南 · レンタカーガイド</p>' +
      '</div></div>' +
      '<div class="onb-langs">' +
      LANGS.map(function (l) {
        return '<button class="onb-lang" data-pick="' + l[0] + '">' + icon('globe', 19) + '<span>' + l[1] + '<span class="ll">' + l[2] + '</span></span><span class="go">→</span></button>';
      }).join('') +
      '<div class="onb-note">언어는 언제든 상단에서 변경할 수 있어요 · You can change it anytime</div>' +
      '</div></div></div>';
  };

  R.s01 = function () {
    var isKo = lang === 'ko';
    return '<div class="scr on"><div class="scr-body">' +
      '<div class="qr-hero"><div class="chip" style="margin-bottom:11px">' + icon('key', 13) + (isKo ? ' 차량 QR 스티커 · 시뮬레이션' : ' Vehicle QR sticker · simulation') + '</div>' +
      '<div class="big">' + (isKo ? 'QR을 스캔하면<br><em>그 차의 가이드</em>가 바로' : 'Scan the QR —<br><em>your car\'s guide</em> opens') + '</div>' +
      '<p>' + (isKo ? '아래 카드가 차량에 붙는 QR입니다. 탭 = 스캔.<br>검색·로그인 없이 해당 차종 화면이 즉시 열립니다.' : 'Each card is a QR on the vehicle. Tap = scan.<br>No search, no login.') + '</p></div>' +
      '<div class="qr-cards">' + CARS.map(function (c) {
        return '<button class="qr-card" data-car="' + c.id + '">' +
          '<span class="qc-img"><img src="' + c.img + '" alt="" onerror="this.style.display=\'none\'"></span>' +
          '<span><span class="qc-name">' + esc(L(c.name)) + '</span><span class="qc-sub" style="display:block">' + esc(L(c.sub)) + ' · <span class="mono">' + c.code + '</span></span></span>' +
          '<span class="qc-qr">▦</span></button>';
      }).join('') + '</div>' +
      '<p class="disclaimer">' + (isKo ? '회사·차종·연락처 전부 가상 · 차량 이미지는 AI 생성' : 'All data is fictional · vehicle images are AI-generated') + ' · <a href="admin.html" style="color:var(--acc)">' + (isKo ? '관리자 →' : 'Admin →') + '</a></p>' +
      '</div></div>';
  };

  R.home = function () {
    var isKo = lang === 'ko';
    return '<div class="scr on">' +
      '<div class="appbar"><span class="ab-t">KEYRING</span>' + langSwitcher() + '</div>' +
      '<div class="scr-body">' +
      '<div class="home-sec-t">' + esc(L(T.myCar)) + '</div>' +
      '<button class="home-car" data-go="guide" style="display:block; width:calc(100% - 36px); text-align:left">' +
      '<span class="hc-code mono">' + car.code + '</span>' +
      '<img src="' + car.img + '" alt="" onerror="this.style.display=\'none\'">' +
      '<span class="hc-body" style="display:block"><span class="hc-name">' + esc(L(car.name)) + '</span>' +
      '<span class="hc-sub" style="display:block">' + esc(L(car.sub)) + ' · ' + (isKo ? '가이드 보기 →' : 'Open guide →') + '</span></span></button>' +
      '<div class="quick">' +
      '<button class="qk warn" data-tel="1544-0000"><span class="qi">' + icon('phone') + '</span>' + esc(L(T.quick.emg)) + '</button>' +
      '<button class="qk" data-go="check"><span class="qi">' + icon('list') + '</span>' + esc(L(T.quick.ret)) + '</button>' +
      '<button class="qk" data-go="map"><span class="qi">' + icon('pin') + '</span>' + esc(L(T.quick.map)) + '</button>' +
      '</div>' +
      '<div class="home-sec-t">' + (isKo ? '다른 차종 가이드' : 'Other vehicles') + '</div>' +
      '<div class="qr-cards" style="padding-top:0">' + CARS.filter(function (c) { return c.id !== car.id; }).map(function (c) {
        return '<button class="qr-card" data-car="' + c.id + '">' +
          '<span class="qc-img"><img src="' + c.img + '" alt="" onerror="this.style.display=\'none\'"></span>' +
          '<span><span class="qc-name">' + esc(L(c.name)) + '</span><span class="qc-sub" style="display:block">' + esc(L(c.sub)) + '</span></span></button>';
      }).join('') + '</div>' +
      '</div>' + tabbar('home') + '</div>';
  };

  R.guide = function () {
    var isKo = lang === 'ko';
    function acd(id, ic, title, body, open, warn) {
      return '<div class="acd' + (open ? ' open' : '') + (warn ? ' warn' : '') + '" data-acd="' + id + '">' +
        '<button class="acd-h"><span class="ai">' + icon(ic, 17) + '</span>' + esc(title) + '<span class="chev">▾</span></button>' +
        '<div class="acd-b"><div class="acd-b-in">' + body + '</div></div></div>';
    }
    var warnBody = car.warns.map(function (w, i) {
      return '<div class="g-warn-item"><span class="n">' + String(i + 1).padStart(2, '0') + '</span><span>' + esc(L(w)) +
        (isKo ? '' : '<span class="g-orig">원문: ' + esc(w.ko) + '</span>') + '</span></div>';
    }).join('');
    return '<div class="scr on">' +
      '<div class="appbar"><button class="ab-btn" data-go="home">‹</button><span class="ab-t">' + esc(L(car.name)) + '</span>' + langSwitcher() + '</div>' +
      '<div class="scr-body">' +
      '<div class="g-hero"><img src="' + car.img + '" alt="" onerror="this.style.display=\'none\'">' +
      '<div class="gh-txt"><div class="gh-name">' + esc(L(car.name)) + '</div><div class="gh-sub">' + esc(L(car.sub)) + ' · <span class="mono">' + car.code + '</span></div></div></div>' +
      '<div class="mt-badge">' + icon(isKo ? 'doc' : 'globe', 15) + '<span>' + esc(T.mtBadge[lang || 'ko']) + (isKo ? '' : ' <b>· Machine-translated</b>') + '</span></div>' +
      '<div class="acc-list">' +
      acd('start', 'key', L(T.sec.start), esc(L(car.start)), true) +
      acd('fuel', car.id === 'ev' ? 'ev' : 'fuel', L(T.sec.fuel), esc(L(car.fuel))) +
      acd('warn', 'alert', L(T.sec.warn), warnBody, true, true) +
      acd('ret', 'park', L(T.sec.ret), esc(L(car.ret)) + '<div style="margin-top:10px"><button class="cta cta-acc sm" data-go="check">' + esc(L(T.ckTitle)) + ' →</button></div>') +
      '</div>' +
      '<div class="home-sec-t" style="margin-top:4px">' + (isKo ? '비상 연락처' : 'Emergency') + '</div>' +
      '<div class="emg">' +
      '<a href="#" data-tel="1544-0000">' + icon('phone', 18) + '24h<span class="mono" style="font-size:10.5px">1544-0000</span></a>' +
      '<a href="#" data-tel="112">' + icon('alert', 18) + (isKo ? '경찰' : 'Police') + '<span class="mono" style="font-size:10.5px">112</span></a>' +
      '<a href="#" data-tel="119">' + icon('alert', 18) + (isKo ? '구급' : 'Rescue') + '<span class="mono" style="font-size:10.5px">119</span></a>' +
      '</div><div style="height:12px"></div>' +
      '</div>' + tabbar('guide') + '</div>';
  };

  R.check = function () {
    var done = CHECKS.filter(function (c) { return checks[c.id]; }).length;
    var all = done === CHECKS.length;
    return '<div class="scr on">' +
      '<div class="appbar"><button class="ab-btn" data-go="home">‹</button><span class="ab-t">' + esc(L(T.ckTitle)) + '</span>' + langSwitcher() + '</div>' +
      '<div class="scr-body">' +
      '<div class="ck-head"><p style="font-size:12.5px; color:var(--mut); margin:0">' + esc(L(T.ckSub)) + '</p></div>' +
      '<div class="ck-gauge"><div class="cg-top"><span>' + esc(L(car.name)) + ' · <span class="mono">' + car.code + '</span></span><b>' + done + '/' + CHECKS.length + '</b></div>' +
      '<div class="ck-bar"><i id="ckBar" style="width:' + (done / CHECKS.length * 100) + '%"></i></div></div>' +
      '<div class="ck-list">' + CHECKS.map(function (c) {
        var on = !!checks[c.id];
        return '<button class="ck' + (on ? ' done' : '') + '" data-ck="' + c.id + '">' +
          '<span class="cm">' + (on ? icon('checkS', 15) : '') + '</span>' +
          '<span>' + esc(L(c.t)) + (c.s ? '<span class="sub">' + esc(L(c.s)) + '</span>' : '') + '</span>' +
          '<span style="margin-left:auto; color:var(--mut-2)">' + icon(c.icon, 19) + '</span></button>';
      }).join('') + '</div>' +
      (all ? '<div class="ck-done-msg">' + icon('check', 17) + ' ' + esc(L(T.ckDone)) + '</div>' : '') +
      '</div>' + tabbar('check') + '</div>';
  };

  R.map = function () {
    var isKo = lang === 'ko';
    var html = '<div class="scr on">' +
      '<div class="appbar"><button class="ab-btn" data-go="home">‹</button><span class="ab-t">' + esc(L(T.mapT)) + '</span>' + langSwitcher() + '</div>' +
      '<div class="scr-body">';
    if (!geoConsent) {
      html += '<div class="consent-gate"><h4>' + icon('pin', 15) + ' ' + (isKo ? '위치 정보 이용 동의' : 'Location Permission') + '</h4>' +
        '<p>' + (isKo
          ? '현재 위치 기준으로 주변 지점을 보여주려면 동의가 필요합니다. 위치는 화면 표시에만 쓰고 저장하지 않습니다. (실서비스는 위치기반서비스사업 신고 후 제공)'
          : 'We need permission to sort branches by your location. Used for display only, never stored.') + '</p>' +
        '<div style="display:flex; gap:8px"><button class="cta cta-acc sm" id="geoYes" style="flex:1">' + (isKo ? '동의하고 보기' : 'Allow') + '</button>' +
        '<button class="cta cta-gho sm" id="geoNo" style="flex:1">' + (isKo ? '목록만 보기' : 'List only') + '</button></div></div>';
    }
    html += '<div class="map-wrap"' + (!geoConsent ? ' style="opacity:.45; pointer-events:none"' : '') + '>' +
      '<canvas class="map" id="mapCv" height="230"></canvas>' +
      '<div class="map-legend"><span><i style="background:#1B64F2"></i>' + (isKo ? '내 위치' : 'You') + '</span>' +
      '<span><i style="background:#0E8A54"></i>' + (isKo ? '지점' : 'Branch') + '</span>' +
      '<span><i style="background:#D23B2E"></i>' + (isKo ? '반납 전용' : 'Return') + '</span></div></div>' +
      '<div class="branch-list">' + BRANCHES.slice().sort(function (a, b) { return a.km - b.km; }).map(function (b) {
        var isB = b.type === 'branch';
        return '<div class="branch"><span class="bi" style="background:' + (isB ? 'var(--ok-wash)' : 'var(--bad-wash)') + '; color:' + (isB ? 'var(--ok)' : 'var(--bad)') + '">' + icon(isB ? 'pin' : 'park', 17) + '</span>' +
          '<span><span class="bn">' + esc(L(b.name)) + '</span><span class="bd" style="display:block">' + (isB ? (isKo ? '대여·반납' : 'Rent & Return') : (isKo ? '반납 전용' : 'Return only')) + '</span></span>' +
          '<span class="bkm">' + (geoConsent ? b.km.toFixed(1) + 'km' : '—') + '</span></div>';
      }).join('') + '</div>' +
      '<p class="disclaimer">' + (isKo ? '경로 안내·내비게이션이 아닙니다 (공고 스코프 그대로)' : 'Not navigation — nearby display only') + '</p>' +
      '</div>' + tabbar('map') + '</div>';
    return html;
  };

  R.contact = function () {
    var isKo = lang === 'ko';
    return '<div class="scr on">' +
      '<div class="appbar"><button class="ab-btn" data-go="home">‹</button><span class="ab-t">' + esc(L(T.contactT)) + '</span>' + langSwitcher() + '</div>' +
      '<div class="scr-body">' +
      '<div class="chat-card"><div class="ci">' + icon('chat', 26) + '</div>' +
      '<h4>' + (isKo ? '외국인 상담 채팅 연결' : 'Foreign Customer Chat') + '</h4>' +
      '<p>' + (isKo
        ? '이미 운영 중인 본사 상담 채팅으로 연결합니다.<br>앱 안에 새 채팅을 만들지 않습니다 (공고 스코프 그대로).'
        : 'Connects to the company\'s existing chat.<br>Opens in a new window.') + '</p>' +
      '<button class="cta cta-acc" id="extChat">' + (isKo ? '상담 채팅 열기 ↗' : 'Open Chat ↗') + '</button></div>' +
      '<div class="chat-card" style="text-align:left">' +
      '<div class="hour-row"><span class="k">EN · 中文 · 日本語</span><span class="v">09:00–22:00 KST</span></div>' +
      '<div class="hour-row"><span class="k">' + (isKo ? '그 외 시간' : 'Other hours') + '</span><span class="v mono">24h 1544-0000</span></div>' +
      '</div>' +
      '</div>' + tabbar('contact') + '</div>';
  };

  /* ---------- 지도 ---------- */
  function drawMap() {
    var cv = document.getElementById('mapCv');
    if (!cv) return;
    var dpr = window.devicePixelRatio || 1;
    var w = cv.clientWidth, h = 230;
    cv.width = w * dpr; cv.height = h * dpr;
    var c = cv.getContext('2d'); c.scale(dpr, dpr);
    c.fillStyle = '#F1F4F9'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#DDE3EE'; c.lineWidth = 1;
    for (var x = 0; x < w; x += 34) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (var y = 0; y < h; y += 34) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = '#C9D2E2'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, h * .52); c.quadraticCurveTo(w * .5, h * .38, w, h * .58); c.stroke();
    c.beginPath(); c.moveTo(w * .42, 0); c.lineTo(w * .5, h); c.stroke();
    var mx = w * .45, my = h * .5;
    c.fillStyle = 'rgba(27,100,242,.15)';
    c.beginPath(); c.arc(mx, my, 22, 0, 7); c.fill();
    c.fillStyle = '#1B64F2';
    c.beginPath(); c.arc(mx, my, 7, 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke();
    BRANCHES.forEach(function (b) {
      var px = b.x * w, py = b.y * h;
      c.fillStyle = b.type === 'branch' ? '#0E8A54' : '#D23B2E';
      c.beginPath(); c.arc(px, py, 8, 0, 7); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#0F1626'; c.font = '600 10px Pretendard, sans-serif'; c.textAlign = 'center';
      c.fillText(b.km.toFixed(1) + 'km', px, py + 21);
    });
  }

  /* ---------- 전환·바인딩 ---------- */
  function show(id) {
    cur = id;
    screen.innerHTML = R[id]();
    bind(id);
    syncNav();
  }

  function bind(id) {
    if (id === 'map' && geoConsent) setTimeout(drawMap, 40);
    if (id === 'map' && !geoConsent) {
      var gy = document.getElementById('geoYes'), gn = document.getElementById('geoNo');
      if (gy) gy.addEventListener('click', function () { geoConsent = true; show('map'); toast(lang === 'ko' ? '현재 위치 기준으로 정렬했어요' : 'Sorted by your location', true); });
      if (gn) gn.addEventListener('click', function () { toast(lang === 'ko' ? '동의 없이 지점 목록만 표시합니다' : 'Showing list without location'); });
    }
    if (id === 'contact') {
      var ec = document.getElementById('extChat');
      if (ec) ec.addEventListener('click', function () { toast(lang === 'ko' ? '발주처 상담 채팅(외부)이 새 창으로 열립니다 — 시뮬레이션' : 'Opening existing chat (simulation)', true); });
    }
  }

  screen.addEventListener('click', function (e) {
    var pick = e.target.closest('[data-pick]');
    if (pick) { lang = pick.dataset.pick; show('s01'); toast(lang === 'ko' ? '한국어로 표시합니다' : 'Language set', true); return; }
    var qc = e.target.closest('[data-car]');
    if (qc) { car = CARS.filter(function (c) { return c.id === qc.dataset.car; })[0]; checks = {}; show('guide'); toast(lang === 'ko' ? 'QR 스캔 — 가이드가 자동으로 열렸어요' : 'QR scanned — guide opened', true); return; }
    var go = e.target.closest('[data-go]');
    if (go) { show(go.dataset.go); return; }
    var lg = e.target.closest('[data-lang]');
    if (lg) { lang = lg.dataset.lang; show(cur); return; }
    var tel = e.target.closest('[data-tel]');
    if (tel) { e.preventDefault(); toast('📞 ' + tel.dataset.tel + (lang === 'ko' ? ' 로 전화를 겁니다 (시뮬레이션)' : ' calling (simulation)')); return; }
    var acdH = e.target.closest('.acd-h');
    if (acdH) { acdH.parentElement.classList.toggle('open'); return; }
    var ck = e.target.closest('[data-ck]');
    if (ck) {
      checks[ck.dataset.ck] = !checks[ck.dataset.ck];
      show('check');
      var done = CHECKS.filter(function (c) { return checks[c.id]; }).length;
      if (done === CHECKS.length) toast(lang === 'ko' ? '반납 준비 완료!' : 'Ready to return!', true);
      return;
    }
  });

  /* ---------- 뷰어 네비 ---------- */
  var vNav = document.getElementById('vNav');
  if (vNav) {
    vNav.innerHTML = FLOW.map(function (part) {
      return '<div class="v-part"><h4>' + part[0] + '</h4><div class="v-flow">' +
        part[1].map(function (s, i) {
          return '<button class="v-item" data-scr="' + s[0] + '"><span class="no">' + s[0].replace(/[a-z]/g, '').padStart(2, '0') + '</span>' + s[1] + '</button>';
        }).join('') + '</div></div>';
    }).join('');
    // 번호 다시: 순서 기반
    var all = [];
    FLOW.forEach(function (p) { p[1].forEach(function (s) { all.push(s[0]); }); });
    [].forEach.call(vNav.querySelectorAll('.v-item'), function (b, i) {
      b.querySelector('.no').textContent = String(i).padStart(2, '0');
    });
    vNav.addEventListener('click', function (e) {
      var b = e.target.closest('[data-scr]'); if (!b) return;
      if (!lang && b.dataset.scr !== 'onb') lang = 'en';
      show(b.dataset.scr);
    });
  }
  function syncNav() {
    [].forEach.call(document.querySelectorAll('[data-scr]'), function (b) { b.classList.toggle('on', b.dataset.scr === cur); });
  }

  window.addEventListener('resize', function () { if (cur === 'map' && geoConsent) drawMap(); });

  /* ---------- 관리자 등록 가이드 + 딥링크 ---------- */
  try {
    var custom = JSON.parse(localStorage.getItem('keyring_guides')) || [];
    custom.forEach(function (g) {
      var w = function (s) { return ml(s, s + ' (KO original — MT pending)', s, s); };
      CARS.push({
        id: g.id, img: 'assets/img/car-sedan.jpg', code: 'KR-NEW', icon: 'car',
        name: ml(g.name, g.name, g.name, g.name),
        sub: ml(g.sub || '', g.sub || '', g.sub || '', g.sub || ''),
        start: w(g.feat || ''), fuel: w(''), ret: w(''),
        warns: (g.warns || []).map(w)
      });
    });
  } catch (e) {}

  var hashCar = (location.hash.match(/car=([\w-]+)/) || [])[1];
  if (hashCar) {
    var found = CARS.filter(function (c) { return c.id === hashCar; })[0];
    if (found) { car = found; lang = lang || 'en'; show('guide'); toast('QR link — guide opened', true); }
    else show('onb');
  } else {
    show('onb');
  }
})();
