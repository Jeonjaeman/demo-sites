/* KEYRING 관리자 v2 — 가이드 CRUD + 실스캔 QR 발급 + A4 인쇄 시트.
   모든 데이터 가상 · localStorage 저장 (데모). */
(function () {
  'use strict';

  var BASE = location.origin + location.pathname.replace(/admin\.html$/, 'index.html');
  var DEFAULTS = [
    { id: 'sedan', name: '컴팩트 세단', sub: '5인승 · 가솔린', code: 'KR-SD01', builtin: true },
    { id: 'van', name: '패밀리 밴', sub: '9인승 · 디젤', code: 'KR-VN02', builtin: true },
    { id: 'ev', name: '전기 SUV', sub: '5인승 · EV', code: 'KR-EV03', builtin: true }
  ];

  var editId = null;
  var currentQR = 'sedan';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function loadCustom() {
    try { return JSON.parse(localStorage.getItem('keyring_guides')) || []; } catch (e) { return []; }
  }
  function saveCustom(v) { try { localStorage.setItem('keyring_guides', JSON.stringify(v)); } catch (e) {} }
  function all() { return DEFAULTS.concat(loadCustom()); }
  function toast(msg, acc) {
    var w = document.getElementById('toastWrap');
    var t = document.createElement('div');
    t.className = 'toast' + (acc ? ' acc' : ''); t.textContent = msg;
    w.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2100);
    setTimeout(function () { t.remove(); }, 2500);
  }

  function renderList() {
    var list = all();
    document.getElementById('guideCount').textContent = '총 ' + list.length + '종 (기본 3 + 등록 ' + loadCustom().length + ')';
    document.getElementById('guideList').innerHTML = list.map(function (g) {
      return '<div class="adm-row">' +
        '<span class="ar-t">' + esc(g.name) + ' <span class="ar-d">' + esc(g.sub) + (g.builtin ? ' · 기본 샘플' : ' · 등록됨') + '</span></span>' +
        '<button class="btn btn-sm btn-gho" data-qr="' + g.id + '">QR·링크</button>' +
        '<a class="btn btn-sm btn-gho" href="index.html#car=' + g.id + '" target="_blank">미리보기</a>' +
        (g.builtin ? '' :
          '<button class="btn btn-sm btn-gho" data-edit="' + g.id + '">수정</button>' +
          '<button class="btn btn-sm btn-danger" data-del="' + g.id + '">삭제</button>') +
        '</div>';
    }).join('');
  }

  function showQR(id) {
    var g = all().filter(function (x) { return x.id === id; })[0];
    if (!g) return;
    currentQR = id;
    var url = BASE + '#car=' + encodeURIComponent(id);
    document.getElementById('qrLink').value = url;
    var box = document.getElementById('qrBox');
    box.innerHTML = '';
    if (window.QRCode) {
      new QRCode(box, { text: url, width: 168, height: 168, correctLevel: QRCode.CorrectLevel.M });
    } else {
      box.innerHTML = '<div class="notice warn">QR 라이브러리 로드 실패 — 링크 복사로 대체하세요</div>';
    }
    document.getElementById('qrStatus').textContent = esc(g.name) + ' 발급됨';
    // 인쇄 시트 준비
    document.getElementById('psName').textContent = g.name;
    document.getElementById('psSub').textContent = (g.code || 'KEYRING') + ' · KEYRING 차량 이용 가이드';
    var psQr = document.getElementById('psQr');
    psQr.innerHTML = '';
    if (window.QRCode) new QRCode(psQr, { text: url, width: 240, height: 240, correctLevel: QRCode.CorrectLevel.M });
  }

  document.getElementById('guideList').addEventListener('click', function (e) {
    var q = e.target.closest('[data-qr]');
    if (q) { showQR(q.dataset.qr); document.getElementById('qrPanel').scrollIntoView({ behavior: 'smooth' }); return; }
    var ed = e.target.closest('[data-edit]');
    if (ed) {
      var g = loadCustom().filter(function (x) { return x.id === ed.dataset.edit; })[0];
      if (!g) return;
      editId = g.id;
      document.getElementById('edTitleH').textContent = '가이드 수정 — ' + g.name;
      document.getElementById('gName').value = g.name;
      document.getElementById('gSub').value = g.sub;
      document.getElementById('gFeat').value = g.feat || '';
      document.getElementById('gWarns').value = (g.warns || []).join('\n');
      document.getElementById('gReset').style.display = '';
      document.getElementById('gSave').textContent = '수정 저장';
      return;
    }
    var del = e.target.closest('[data-del]');
    if (del) {
      var list = loadCustom();
      var t = list.filter(function (x) { return x.id === del.dataset.del; })[0];
      if (!confirm('「' + t.name + '」 가이드를 삭제할까요? 인쇄된 QR은 만료 안내로 연결됩니다.')) return;
      saveCustom(list.filter(function (x) { return x.id !== del.dataset.del; }));
      renderList();
      toast('삭제했습니다');
    }
  });

  document.getElementById('gSave').addEventListener('click', function () {
    var name = document.getElementById('gName').value.trim();
    if (name.length < 2) { toast('차종명을 입력해 주세요'); return; }
    var rec = {
      id: editId || ('g' + Date.now().toString(36)),
      name: name,
      sub: document.getElementById('gSub').value.trim(),
      feat: document.getElementById('gFeat').value.trim(),
      warns: document.getElementById('gWarns').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean)
    };
    var list = loadCustom();
    if (editId) list = list.map(function (x) { return x.id === editId ? rec : x; });
    else list.push(rec);
    saveCustom(list);
    editId = null;
    document.getElementById('edTitleH').textContent = '새 가이드 등록 (한국어 원고)';
    document.getElementById('gReset').style.display = 'none';
    document.getElementById('gSave').textContent = '등록 + QR 발급';
    renderList();
    showQR(rec.id);
    toast('등록 완료 — QR·링크가 발급되었습니다', true);
    document.getElementById('qrPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('gReset').addEventListener('click', function () {
    editId = null;
    document.getElementById('edTitleH').textContent = '새 가이드 등록 (한국어 원고)';
    document.getElementById('gReset').style.display = 'none';
    document.getElementById('gSave').textContent = '등록 + QR 발급';
  });

  document.getElementById('copyLink').addEventListener('click', function () {
    var inp = document.getElementById('qrLink');
    inp.select();
    try { document.execCommand('copy'); toast('링크를 복사했어요', true); } catch (e) {}
  });

  document.getElementById('btnPrint').addEventListener('click', function () {
    window.print();
  });

  renderList();
  showQR('sedan');
})();
