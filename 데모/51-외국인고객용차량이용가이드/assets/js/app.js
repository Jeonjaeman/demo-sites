/* KEYRING — 외국인 고객용 차량 이용가이드 앱 데모.
   공고 요구: QR 진입·차종 가이드(게시글)·자동번역 표시·주변 지점 지도(경로X)·외부 채팅 연결.
   모든 데이터 가상 · 번역은 "기계번역 표시" 흐름 시뮬레이션. */
(function () {
  'use strict';

  var LANGS = [['ko', '한국어'], ['en', 'EN'], ['zh', '中文'], ['ja', '日本語']];
  var lang = 'en'; // 외국인 고객 시나리오 기본

  var T = {
    mtBadge: {
      ko: '아래 내용은 관리자가 등록한 한국어 원고입니다.',
      en: 'Auto-translated by machine from Korean. Safety items show the original Korean together.',
      zh: '由机器自动翻译自韩语。安全事项同时显示韩语原文。',
      ja: '韓国語から機械翻訳されています。安全項目は原文を併記します。'
    },
    warn: { ko: '이용 시 주의사항', en: 'Precautions', zh: '注意事项', ja: '注意事項' },
    feat: { ko: '차량 종류 및 특징', en: 'Vehicle Type & Features', zh: '车辆类型与特点', ja: '車両の種類と特徴' },
    emg: { ko: '비상 연락처', en: 'Emergency Contacts', zh: '紧急联系方式', ja: '緊急連絡先' },
    map: { ko: '주변 지점·반납 장소', en: 'Nearby Branches & Return', zh: '附近网点·还车地点', ja: '近くの店舗・返却場所' },
    contact: { ko: '문의하기', en: 'Contact Us', zh: '咨询', ja: 'お問い合わせ' }
  };

  var CARS = [
    { id: 'sedan', img: 'assets/img/car-sedan.jpg', code: 'KR-SD01',
      name: { ko: '컴팩트 세단', en: 'Compact Sedan', zh: '紧凑型轿车', ja: 'コンパクトセダン' },
      sub: { ko: '5인승 · 가솔린', en: '5-seat · Gasoline', zh: '5座 · 汽油', ja: '5人乗り · ガソリン' },
      feat: {
        ko: '스마트키 차량입니다. 키를 소지한 상태에서 브레이크를 밟고 시동 버튼을 누르세요. 주유구는 운전석 좌측 하단 레버로 엽니다. 가솔린(휘발유)만 주유하세요.',
        en: 'This is a smart-key vehicle. With the key inside, press the brake and push the START button. The fuel door opens with the lever at the lower left of the driver seat. Use GASOLINE only.',
        zh: '本车为智能钥匙车辆。携带钥匙踩下刹车并按下启动按钮。加油口通过驾驶座左下方的拉杆打开。请只加汽油。',
        ja: 'スマートキー車両です。キーを持った状態でブレーキを踏み、STARTボタンを押してください。給油口は運転席左下のレバーで開きます。ガソリンのみ給油してください。'
      },
      warns: [
        { ko: '경고등이 켜지면 즉시 안전한 곳에 정차 후 비상 연락처로 전화하세요.', en: 'If a warning light turns on, stop safely and call the emergency line immediately.', zh: '警告灯亮起时，请立即安全停车并拨打紧急电话。', ja: '警告灯が点灯したら、安全な場所に停車しすぐ緊急連絡先へ電話してください。' },
        { ko: '주유는 반드시 가솔린(휘발유)입니다. 경유 주유 시 수리비가 청구됩니다.', en: 'GASOLINE only. Refueling with diesel will incur repair costs.', zh: '必须加汽油。加柴油将产生维修费用。', ja: '必ずガソリンを給油してください。軽油の場合は修理費を請求します。' },
        { ko: '반납 전 연료를 인수 시점 수준으로 채워 주세요.', en: 'Refill fuel to the pickup level before return.', zh: '还车前请将燃油加至取车时的水平。', ja: '返却前に燃料を受取時のレベルまで補充してください。' }
      ] },
    { id: 'van', img: 'assets/img/car-van.jpg', code: 'KR-VN02',
      name: { ko: '패밀리 밴', en: 'Family Van', zh: '家用MPV', ja: 'ファミリーバン' },
      sub: { ko: '9인승 · 디젤', en: '9-seat · Diesel', zh: '9座 · 柴油', ja: '9人乗り · ディーゼル' },
      feat: {
        ko: '슬라이딩 도어는 손잡이를 가볍게 당기면 자동으로 열립니다. 3열 시트는 바닥으로 접을 수 있습니다. 이 차량은 디젤(경유) 차량입니다.',
        en: 'Sliding doors open automatically with a light pull. The 3rd-row seats fold flat into the floor. This vehicle uses DIESEL.',
        zh: '轻拉把手滑动门会自动打开。第三排座椅可折叠进地板。本车使用柴油。',
        ja: 'スライドドアは軽く引くと自動で開きます。3列目シートは床下に収納できます。この車両はディーゼル（軽油）です。'
      },
      warns: [
        { ko: '높이 1.9m — 지하주차장 진입 시 높이 제한을 확인하세요.', en: 'Height 1.9m — check clearance before entering underground parking.', zh: '车高1.9米——进入地下停车场前请确认限高。', ja: '車高1.9m — 地下駐車場では高さ制限を確認してください。' },
        { ko: '이 차량은 경유 차량입니다. 가솔린 주유 시 운행이 불가합니다.', en: 'DIESEL vehicle. Refueling with gasoline will disable the car.', zh: '本车为柴油车。加汽油将无法行驶。', ja: 'ディーゼル車です。ガソリンを給油すると走行不能になります。' },
        { ko: '측풍이 강한 교량 구간에서는 감속 운행하세요.', en: 'Slow down on bridges with strong crosswinds.', zh: '在侧风强的桥梁路段请减速行驶。', ja: '横風の強い橋では減速して走行してください。' }
      ] },
    { id: 'ev', img: 'assets/img/car-ev.jpg', code: 'KR-EV03',
      name: { ko: '전기 SUV', en: 'Electric SUV', zh: '纯电SUV', ja: '電気SUV' },
      sub: { ko: '5인승 · EV', en: '5-seat · EV', zh: '5座 · 电动', ja: '5人乗り · EV' },
      feat: {
        ko: '충전구는 차량 앞쪽에 있습니다. 급속(DC)과 완속(AC) 모두 지원합니다. 기어는 다이얼 방식이며, 회생제동으로 감속 시 자동 충전됩니다.',
        en: 'The charging port is at the front. Both DC fast and AC slow charging are supported. The gear is a dial type; regenerative braking recharges while slowing down.',
        zh: '充电口位于车头。支持直流快充和交流慢充。换挡为旋钮式，减速时动能回收自动充电。',
        ja: '充電ポートは車両前方にあります。急速(DC)・普通(AC)充電の両方に対応。ギアはダイヤル式で、回生ブレーキで減速時に充電されます。'
      },
      warns: [
        { ko: '배터리 20% 이하가 되면 가까운 충전소를 안내받아 충전 후 운행하세요.', en: 'Below 20% battery, charge at the nearest station before continuing.', zh: '电量低于20%时，请前往最近的充电站充电后再行驶。', ja: 'バッテリー20%以下になったら、近くの充電所で充電してから運転してください。' },
        { ko: '반납 시 배터리 60% 이상으로 반납해 주세요.', en: 'Return with at least 60% battery.', zh: '还车时电量请保持60%以上。', ja: '返却時はバッテリー60%以上でお願いします。' },
        { ko: '충전 케이블은 트렁크 하단 수납함에 있습니다. 분실 시 비용이 청구됩니다.', en: 'The charging cable is in the trunk under-floor box. Loss will be charged.', zh: '充电线在后备箱下层储物格。丢失将收费。', ja: '充電ケーブルはトランク下の収納にあります。紛失時は費用を請求します。' }
      ] }
  ];

  var BRANCHES = [
    { id: 'b1', type: 'branch', name: { ko: '서울역 지점', en: 'Seoul Station Branch', zh: '首尔站网点', ja: 'ソウル駅支店' }, x: .32, y: .38, km: 0.4 },
    { id: 'b2', type: 'return', name: { ko: '명동 반납 전용', en: 'Myeongdong Return Only', zh: '明洞还车专用', ja: '明洞返却専用' }, x: .58, y: .30, km: 1.1 },
    { id: 'b3', type: 'branch', name: { ko: '공항터미널 지점', en: 'Airport Terminal Branch', zh: '机场航站楼网点', ja: '空港ターミナル支店' }, x: .74, y: .62, km: 2.6 },
    { id: 'b4', type: 'return', name: { ko: '동대문 반납 전용', en: 'Dongdaemun Return Only', zh: '东大门还车专用', ja: '東大門返却専用' }, x: .22, y: .68, km: 3.2 }
  ];

  var FLOW = [['s01', 'QR 진입 (현장 X배너)'], ['s02', '차종 가이드 · 자동번역'], ['s03', '주변 지점 지도'], ['s04', '문의 · 외부 채팅']];
  var screen = document.getElementById('screen');
  var cur = 's01';
  var car = CARS[0];
  var geoConsent = false;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function L(obj) { return obj[lang] || obj.ko; }
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
      return '<button data-lang="' + l[0] + '"' + (lang === l[0] ? ' class="on"' : '') + '>' + l[1] + '</button>';
    }).join('') + '</span>';
  }

  var R = {};

  /* 01 — QR 진입 */
  R.s01 = function () {
    return '<div class="scr on"><div class="scr-body">' +
      '<div class="qr-hero"><div class="chip" style="margin-bottom:12px">현장 X배너 · QR 시뮬레이션</div>' +
      '<div class="big">QR을 스캔하면<br><em>그 차의 가이드</em>가 바로 열려요</div>' +
      '<p>아래 카드가 차량에 붙는 QR입니다 — 탭 = 스캔.<br>별도 검색·로그인 없이 해당 차종 화면이 즉시 열립니다.</p></div>' +
      '<div class="qr-cards">' + CARS.map(function (c) {
        return '<button class="qr-card qr-scanline" data-car="' + c.id + '">' +
          '<span class="qc-img"><img src="' + c.img + '" alt="" onerror="this.style.display=\'none\'"></span>' +
          '<span><span class="qc-name">' + esc(c.name.ko) + '</span><span class="qc-sub" style="display:block">' + esc(c.sub.ko) + ' · <span class="mono">' + c.code + '</span></span></span>' +
          '<span class="qc-qr">▦</span></button>';
      }).join('') + '</div>' +
      '<p class="disclaimer">회사·차종·연락처 전부 가상 · 차량 이미지는 AI 생성 · <a href="admin.html" style="color:var(--acc)">관리자에서 QR·링크 발급 체험 →</a></p>' +
      '</div></div>';
  };

  /* 02 — 가이드 */
  R.s02 = function () {
    var isKo = lang === 'ko';
    return '<div class="scr on">' +
      '<div class="appbar"><button class="ab-btn" data-go="s01">‹</button><span class="ab-t">' + esc(L(car.name)) + ' <span class="mono" style="font-size:11px; color:var(--mut)">' + car.code + '</span></span>' + langSwitcher() + '</div>' +
      '<div class="scr-body">' +
      '<div class="g-hero"><img src="' + car.img + '" alt="" onerror="this.style.display=\'none\'">' +
      '<div class="gh-txt"><div class="gh-name">' + esc(L(car.name)) + '</div><div class="gh-sub">' + esc(L(car.sub)) + '</div></div></div>' +
      '<div class="mt-badge"><span class="ic">' + (isKo ? '✍️' : '🌐') + '</span><span>' + esc(T.mtBadge[lang]) + (isKo ? '' : ' <b>· Machine-translated</b>') + '</span></div>' +
      '<div class="g-sec"><div class="gs-h"><span class="ic">🚗</span>' + esc(T.feat[lang]) + '</div><div class="gs-b">' + esc(L(car.feat)) + '</div></div>' +
      '<div class="g-sec warn"><div class="gs-h"><span class="ic">⚠️</span>' + esc(T.warn[lang]) + '</div><div class="gs-b">' +
      car.warns.map(function (w, i) {
        return '<div class="g-warn-item"><span class="n">' + String(i + 1).padStart(2, '0') + '</span><span>' + esc(L(w)) +
          (isKo ? '' : '<span class="g-orig">원문: ' + esc(w.ko) + '</span>') + '</span></div>';
      }).join('') + '</div></div>' +
      '<div class="g-sec"><div class="gs-h"><span class="ic">🆘</span>' + esc(T.emg[lang]) + '</div><div class="gs-b" style="padding:10px 16px 14px">' +
      '<div class="emg" style="margin:4px 0 0">' +
      '<a href="#" data-tel="1544-0000"><span class="big">📞</span>24h ' + (isKo ? '콜센터' : 'Hotline') + '<span class="mono" style="font-size:11px">1544-0000</span></a>' +
      '<a href="#" data-tel="112"><span class="big">🚓</span>' + (isKo ? '경찰' : 'Police') + '<span class="mono" style="font-size:11px">112</span></a>' +
      '<a href="#" data-tel="119"><span class="big">🚑</span>' + (isKo ? '구급' : 'Ambulance') + '<span class="mono" style="font-size:11px">119</span></a>' +
      '</div></div></div>' +
      '<div class="g-foot" style="display:flex; gap:10px">' +
      '<button class="cta cta-gho sm" data-go="s03">🗺 ' + esc(T.map[lang]) + '</button>' +
      '<button class="cta cta-acc sm" data-go="s04">💬 ' + esc(T.contact[lang]) + '</button></div>' +
      '</div></div>';
  };

  /* 03 — 지도 (위치 동의 게이트 → 현위치 기준) */
  R.s03 = function () {
    var isKo = lang === 'ko';
    var html = '<div class="scr on">' +
      '<div class="appbar"><button class="ab-btn" data-go="s02">‹</button><span class="ab-t">' + esc(T.map[lang]) + '</span>' + langSwitcher() + '</div>' +
      '<div class="scr-body">';
    if (!geoConsent) {
      html += '<div class="consent-gate"><h4>📍 ' + (isKo ? '위치 정보 이용 동의' : 'Location Permission') + '</h4>' +
        '<p>' + (isKo
          ? '현재 위치 기준으로 주변 지점을 보여주려면 위치 정보 동의가 필요합니다. 개인위치정보는 화면 표시에만 사용되고 저장하지 않습니다. (실서비스는 위치기반서비스사업 신고 후 제공 — 착수 전 확인 항목)'
          : 'To sort branches by your current location, we need your permission. Your location is used only for display and never stored.') + '</p>' +
        '<div style="display:flex; gap:8px"><button class="cta cta-acc sm" id="geoYes" style="flex:1">' + (isKo ? '동의하고 보기' : 'Allow') + '</button>' +
        '<button class="cta cta-gho sm" id="geoNo" style="flex:1">' + (isKo ? '동의 없이 목록만' : 'List only') + '</button></div></div>';
    }
    html += '<div class="map-wrap"' + (!geoConsent ? ' style="opacity:.45; pointer-events:none"' : '') + '>' +
      '<canvas class="map" id="mapCv" height="240"></canvas>' +
      '<div class="map-legend"><span><i style="background:#1B64F2"></i>' + (isKo ? '내 위치' : 'You') + '</span>' +
      '<span><i style="background:#118A54"></i>' + (isKo ? '지점' : 'Branch') + '</span>' +
      '<span><i style="background:#D23B2E"></i>' + (isKo ? '반납 전용' : 'Return') + '</span></div></div>' +
      '<div class="branch-list">' + BRANCHES.slice().sort(function (a, b) { return a.km - b.km; }).map(function (b) {
        var isB = b.type === 'branch';
        return '<div class="branch"><span class="bi" style="background:' + (isB ? 'var(--ok-wash)' : 'var(--bad-wash)') + '">' + (isB ? '🏬' : '🅿️') + '</span>' +
          '<span><span class="bn">' + esc(L(b.name)) + '</span><span class="bd" style="display:block">' + (isB ? (isKo ? '대여·반납' : 'Rent & Return') : (isKo ? '반납 전용' : 'Return only')) + '</span></span>' +
          '<span class="bkm">' + (geoConsent ? b.km.toFixed(1) + 'km' : '—') + '</span></div>';
      }).join('') + '</div>' +
      '<p class="disclaimer">' + (isKo ? '경로 안내·내비게이션 기능이 아닙니다 (공고 스코프 그대로)' : 'Not a navigation service — nearby display only') + '</p>' +
      '</div></div>';
    return html;
  };

  /* 04 — 문의 (외부 채팅 연결) */
  R.s04 = function () {
    var isKo = lang === 'ko';
    return '<div class="scr on">' +
      '<div class="appbar"><button class="ab-btn" data-go="s02">‹</button><span class="ab-t">' + esc(T.contact[lang]) + '</span>' + langSwitcher() + '</div>' +
      '<div class="scr-body">' +
      '<div class="chat-card"><div class="ci">💬</div>' +
      '<h4>' + (isKo ? '외국인 상담 채팅 연결' : 'Foreign Customer Chat') + '</h4>' +
      '<p>' + (isKo
        ? '이미 운영 중인 본사 외국인 상담 채팅으로 연결합니다.<br>앱 안에 새 채팅을 만들지 않습니다 (공고 스코프 그대로).'
        : 'Connects to the company’s existing chat for foreign customers.<br>Opens in a new window.') + '</p>' +
      '<button class="cta cta-acc" id="extChat">' + (isKo ? '상담 채팅 열기' : 'Open Chat') + ' ↗</button>' +
      '<div class="ext-note">🔗 ' + (isKo ? '발주처 홈페이지의 기존 채팅으로 이동 (외부 연결)' : 'External link to the existing chat') + '</div></div>' +
      '<div class="g-sec" style="margin-top:14px"><div class="gs-h"><span class="ic">🕐</span>' + (isKo ? '상담 운영 시간' : 'Chat Hours') + '</div>' +
      '<div class="gs-b">EN · 中文 · 日本語<br>09:00 – 22:00 (KST) · ' + (isKo ? '그 외 시간은 24h 콜센터' : 'Other hours: 24h hotline 1544-0000') + '</div></div>' +
      '</div></div>';
  };

  /* ---------- 지도 그리기 ---------- */
  function drawMap() {
    var cv = document.getElementById('mapCv');
    if (!cv) return;
    var dpr = window.devicePixelRatio || 1;
    var w = cv.clientWidth, h = 240;
    cv.width = w * dpr; cv.height = h * dpr;
    var c = cv.getContext('2d'); c.scale(dpr, dpr);
    // 배경 (거리 격자)
    c.fillStyle = '#F1F4F9'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#DDE3EE'; c.lineWidth = 1;
    for (var x = 0; x < w; x += 34) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (var y = 0; y < h; y += 34) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    // 큰 도로
    c.strokeStyle = '#C9D2E2'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, h * .52); c.quadraticCurveTo(w * .5, h * .38, w, h * .58); c.stroke();
    c.beginPath(); c.moveTo(w * .42, 0); c.lineTo(w * .5, h); c.stroke();
    // 내 위치 (중앙)
    var mx = w * .45, my = h * .5;
    c.fillStyle = 'rgba(27,100,242,.15)';
    c.beginPath(); c.arc(mx, my, 22, 0, 7); c.fill();
    c.fillStyle = '#1B64F2';
    c.beginPath(); c.arc(mx, my, 7, 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke();
    // 지점 핀
    BRANCHES.forEach(function (b) {
      var px = b.x * w, py = b.y * h;
      c.fillStyle = b.type === 'branch' ? '#118A54' : '#D23B2E';
      c.beginPath(); c.arc(px, py, 8, 0, 7); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#101623'; c.font = '600 10px Pretendard, sans-serif'; c.textAlign = 'center';
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
    screen.addEventListener('click', delegate);
    if (id === 's03' && geoConsent) requestAnimationFrame(drawMap);
    if (id === 's03' && !geoConsent) {
      var gy = document.getElementById('geoYes'), gn = document.getElementById('geoNo');
      if (gy) gy.addEventListener('click', function () { geoConsent = true; show('s03'); toast(lang === 'ko' ? '현재 위치 기준으로 정렬했어요' : 'Sorted by your location', true); });
      if (gn) gn.addEventListener('click', function () { toast(lang === 'ko' ? '동의 없이 지점 목록만 표시합니다' : 'Showing list without location'); });
    }
    if (id === 's04') {
      var ec = document.getElementById('extChat');
      if (ec) ec.addEventListener('click', function () { toast(lang === 'ko' ? '발주처 상담 채팅(외부)이 새 창으로 열립니다 — 시뮬레이션' : 'Opening the existing chat (simulation)', true); });
    }
  }

  function delegate(e) {
    var qc = e.target.closest('[data-car]');
    if (qc) { car = CARS.filter(function (c) { return c.id === qc.dataset.car; })[0]; show('s02'); toast(lang === 'ko' ? 'QR 스캔 — 가이드가 자동으로 열렸어요' : 'QR scanned — guide opened', true); return; }
    var go = e.target.closest('[data-go]');
    if (go) { show(go.dataset.go); return; }
    var lg = e.target.closest('[data-lang]');
    if (lg) { lang = lg.dataset.lang; show(cur); return; }
    var tel = e.target.closest('[data-tel]');
    if (tel) { e.preventDefault(); toast('📞 ' + tel.dataset.tel + (lang === 'ko' ? ' 로 전화를 겁니다 (시뮬레이션)' : ' calling (simulation)')); }
  }

  /* ---------- 뷰어 네비 ---------- */
  var vNav = document.getElementById('vNav');
  var mNav = document.getElementById('mNav');
  vNav.innerHTML = FLOW.map(function (s) {
    return '<button class="v-item" data-scr="' + s[0] + '"><span class="no">' + s[0].replace('s', '') + '</span>' + s[1] + '</button>';
  }).join('');
  mNav.innerHTML = FLOW.map(function (s) { return '<button data-scr="' + s[0] + '">' + s[0].replace('s', '') + ' ' + s[1].split(' ')[0] + '</button>'; }).join('');
  [vNav, mNav].forEach(function (nav) {
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('[data-scr]'); if (!b) return;
      show(b.dataset.scr);
    });
  });
  function syncNav() {
    [].forEach.call(document.querySelectorAll('[data-scr]'), function (b) { b.classList.toggle('on', b.dataset.scr === cur); });
  }

  window.addEventListener('resize', function () { if (cur === 's03' && geoConsent) drawMap(); });

  /* ---------- 관리자 등록 가이드 로드 + QR 딥링크 (#car=id) ---------- */
  try {
    var custom = JSON.parse(localStorage.getItem('keyring_guides')) || [];
    custom.forEach(function (g) {
      var w = function (s) { return { ko: s, en: s + ' (KO original — MT pending)', zh: s, ja: s }; };
      CARS.push({
        id: g.id, img: 'assets/img/car-sedan.jpg', code: 'KR-NEW',
        name: { ko: g.name, en: g.name, zh: g.name, ja: g.name },
        sub: { ko: g.sub || '', en: g.sub || '', zh: g.sub || '', ja: g.sub || '' },
        feat: w(g.feat || ''),
        warns: (g.warns || []).map(w)
      });
    });
  } catch (e) {}

  var hashCar = (location.hash.match(/car=([\w-]+)/) || [])[1];
  if (hashCar) {
    var found = CARS.filter(function (c) { return c.id === hashCar; })[0];
    if (found) { car = found; show('s02'); toast(lang === 'ko' ? 'QR 링크로 가이드가 바로 열렸어요' : 'Opened directly from QR link', true); }
    else show('s01');
  } else {
    show('s01');
  }
})();
