/* KEYRING 관리자 — 가이드 등록·수정·삭제 + 차종별 링크·QR 발급 (실제 스캔 가능).
   모든 데이터 가상 · localStorage 저장 (데모). */
(function () {
  'use strict';

  var BASE = location.origin + location.pathname.replace(/admin\.html$/, 'index.html');
  var DEFAULTS = [
    { id: 'sedan', name: '컴팩트 세단', sub: '5인승 · 가솔린', feat: '스마트키 차량입니다.', warns: ['경고등 점등 시 즉시 정차 후 연락', '가솔린만 주유'], builtin: true },
    { id: 'van', name: '패밀리 밴', sub: '9인승 · 디젤', feat: '슬라이딩 도어 자동 개폐.', warns: ['높이 1.9m 지하주차장 주의', '경유만 주유'], builtin: true },
    { id: 'ev', name: '전기 SUV', sub: '5인승 · EV', feat: '급속·완속 충전 지원.', warns: ['배터리 60% 이상 반납'], builtin: true }
  ];

  var editId = null;
  var qr = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function loadCustom() {
    try { return JSON.parse(localStorage.getItem('keyring_guides')) || []; } catch (e) { return []; }
  }
  function saveCustom(v) { try { localStorage.setItem('keyring_guides', JSON.stringify(v)); } catch (e) {} }
  function all() { return DEFAULTS.concat(loadCustom()); }

  function renderList() {
    var list = all();
    document.getElementById('guideCount').textContent = '총 ' + list.length + '종 (기본 3 + 등록 ' + loadCustom().length + ')';
    document.getElementById('guideList').innerHTML = list.map(function (g) {
      return '<div class="adm-row">' +
        '<span class="ar-t">' + esc(g.name) + ' <span class="ar-d">' + esc(g.sub) + (g.builtin ? ' · 기본 샘플' : ' · 등록됨') + '</span></span>' +
        '<button class="btn btn-sm btn-gho" data-qr="' + g.id + '">QR·링크</button>' +
        (g.builtin ? '' :
          '<button class="btn btn-sm btn-gho" data-edit="' + g.id + '">수정</button>' +
          '<button class="btn btn-sm btn-danger" data-del="' + g.id + '">삭제</button>') +
        '</div>';
    }).join('');
  }

  function showQR(id) {
    var g = all().filter(function (x) { return x.id === id; })[0];
    if (!g) return;
    var url = BASE + '#car=' + encodeURIComponent(id);
    document.getElementById('qrLink').value = url;
    var box = document.getElementById('qrBox');
    box.innerHTML = '';
    if (window.QRCode) {
      qr = new QRCode(box, { text: url, width: 168, height: 168, correctLevel: QRCode.CorrectLevel.M });
    } else {
      box.innerHTML = '<div class="notice warn">QR 라이브러리 로드 실패 — 링크 복사로 대체하세요</div>';
    }
    document.getElementById('qrStatus').textContent = esc(g.name) + ' 발급됨';
  }

  document.getElementById('guideList').addEventListener('click', function (e) {
    var q = e.target.closest('[data-qr]');
    if (q) { showQR(q.dataset.qr); return; }
    var ed = e.target.closest('[data-edit]');
    if (ed) {
      var g = loadCustom().filter(function (x) { return x.id === ed.dataset.edit; })[0];
      if (!g) return;
      editId = g.id;
      document.getElementById('edTitleH').textContent = '가이드 수정 — ' + g.name;
      document.getElementById('gName').value = g.name;
      document.getElementById('gSub').value = g.sub;
      document.getElementById('gFeat').value = g.feat;
      document.getElementById('gWarns').value = (g.warns || []).join('\n');
      document.getElementById('gReset').style.display = '';
      document.getElementById('gSave').textContent = '수정 저장';
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }
    var del = e.target.closest('[data-del]');
    if (del) {
      var list = loadCustom();
      var t = list.filter(function (x) { return x.id === del.dataset.del; })[0];
      if (!confirm('「' + t.name + '」 가이드를 삭제할까요? 인쇄된 QR은 안내 페이지(만료)로 연결됩니다.')) return;
      saveCustom(list.filter(function (x) { return x.id !== del.dataset.del; }));
      renderList();
    }
  });

  document.getElementById('gSave').addEventListener('click', function () {
    var name = document.getElementById('gName').value.trim();
    if (name.length < 2) { alert('차종명을 입력해 주세요'); return; }
    var rec = {
      id: editId || ('g' + Date.now().toString(36)),
      name: name,
      sub: document.getElementById('gSub').value.trim(),
      feat: document.getElementById('gFeat').value.trim(),
      warns: document.getElementById('gWarns').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean)
    };
    var list = loadCustom();
    if (editId) {
      list = list.map(function (x) { return x.id === editId ? rec : x; });
    } else {
      list.push(rec);
    }
    saveCustom(list);
    var wasEdit = !!editId;
    editId = null;
    document.getElementById('edTitleH').textContent = '새 가이드 등록 (한국어 원고)';
    document.getElementById('gReset').style.display = 'none';
    document.getElementById('gSave').textContent = '등록 + QR 발급';
    renderList();
    showQR(rec.id);
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
    try { document.execCommand('copy'); this.textContent = '복사됨'; } catch (e) {}
    var b = this;
    setTimeout(function () { b.textContent = '복사'; }, 1500);
  });

  renderList();
  showQR('sedan');
})();
