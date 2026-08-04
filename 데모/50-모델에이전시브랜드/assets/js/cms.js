/* ELAN CMS — 공고 2-3 구현: 에디터·노출 토글·배경 영상 교체(용량 제한)·수정·삭제.
   localStorage로 공개 사이트(News)와 실제로 연동됩니다. 모든 데이터는 가상. */
(function () {
  'use strict';

  var DEFAULT_NEWS = [
    { id: 'n1', date: '2026.08.01', cat: 'Press',    title: '엘랑, FW26 시즌 캠페인 필름 공개 — 온세트 다큐 시리즈 시작', body: '엘랑이 FW26 시즌 캠페인 필름을 공개했습니다. (가상 본문)', on: true },
    { id: 'n2', date: '2026.07.24', cat: 'Model',    title: 'SUA, 파리 쇼 시즌 첫 오프닝 무대 (가상 데이터)', body: '소속 모델 SUA가 파리 쇼 시즌 오프닝을 맡았습니다. (가상 본문)', on: true },
    { id: 'n3', date: '2026.07.12', cat: 'Business', title: '신규 광고주 3사와 연간 캠페인 계약 체결 (가상 데이터)', body: '연간 캠페인 계약을 체결했습니다. (가상 본문)', on: true },
    { id: 'n4', date: '2026.06.30', cat: 'Notice',   title: '노출 꺼진 기사 예시 — CMS에서 토글을 켜면 여기 나타납니다', body: '이 기사는 기본으로 비노출 상태입니다.', on: false }
  ];
  var VIDEO_LIMIT_MB = 100;

  var view = 'posts';
  var editId = null;
  var main = document.getElementById('cmsMain');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function load() {
    try { var v = JSON.parse(localStorage.getItem('elan_news')); if (v && v.length) return v; } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_NEWS));
  }
  function save(news) { try { localStorage.setItem('elan_news', JSON.stringify(news)); } catch (e) {} }
  function toast(msg, acc) {
    var w = document.getElementById('toastWrap');
    var t = document.createElement('div');
    t.className = 'toast' + (acc ? ' acc' : ''); t.textContent = msg;
    w.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2100);
    setTimeout(function () { t.remove(); }, 2500);
  }

  /* ---------- 기사 목록 ---------- */
  function vPosts() {
    var news = load();
    var on = news.filter(function (n) { return n.on; }).length;
    var html = '<div class="kpis">' +
      '<div class="kpi"><div class="v">' + news.length + '</div><div class="k">전체 기사</div></div>' +
      '<div class="kpi"><div class="v">' + on + '</div><div class="k">노출 중 — 사이트 News에 표시</div></div>' +
      '<div class="kpi"><div class="v">' + (news.length - on) + '</div><div class="k">비노출 (토글 꺼짐)</div></div></div>';
    html += '<div class="panel"><div class="panel-h"><h3>기사 목록</h3><span class="sub">노출 토글을 바꾸면 공개 사이트 News가 즉시 바뀝니다</span></div>';
    html += news.map(function (n) {
      return '<div class="cms-row' + (n.on ? '' : ' off') + '">' +
        '<button class="toggle' + (n.on ? ' on' : '') + '" data-tg="' + n.id + '" title="노출 토글"></button>' +
        '<span class="cr-t">' + esc(n.title) + '</span>' +
        '<span class="cr-cat">' + esc(n.cat) + '</span>' +
        '<span class="cr-d">' + esc(n.date) + '</span>' +
        '<button class="btn btn-sm btn-gho" data-edit="' + n.id + '">수정</button>' +
        '<button class="btn btn-sm btn-danger" data-del="' + n.id + '">삭제</button></div>';
    }).join('');
    html += '</div><p class="disclaimer">모든 기사·데이터는 가상입니다 · 이 데모의 저장은 브라우저(localStorage)에만 기록됩니다</p>';
    return html;
  }
  function bindPosts() {
    main.addEventListener('click', postsDelegate);
  }
  function postsDelegate(e) {
    var tg = e.target.closest('[data-tg]');
    if (tg) {
      var news = load();
      var n = news.filter(function (x) { return x.id === tg.dataset.tg; })[0];
      n.on = !n.on; save(news); render();
      toast(n.on ? '노출 ON — 사이트 News에 표시됩니다' : '노출 OFF — 사이트에서 숨겨졌습니다', n.on);
      return;
    }
    var ed = e.target.closest('[data-edit]');
    if (ed) { editId = ed.dataset.edit; view = 'editor'; syncNav(); render(); return; }
    var del = e.target.closest('[data-del]');
    if (del) {
      var news2 = load();
      var t = news2.filter(function (x) { return x.id === del.dataset.del; })[0];
      if (!confirm('「' + t.title.slice(0, 24) + '…」 기사를 삭제할까요?')) return;
      save(news2.filter(function (x) { return x.id !== del.dataset.del; }));
      render(); toast('기사를 삭제했습니다');
    }
  }

  /* ---------- 에디터 ---------- */
  function vEditor() {
    var n = null;
    if (editId) n = load().filter(function (x) { return x.id === editId; })[0];
    return '<div class="panel"><div class="panel-h"><h3>' + (n ? '기사 수정' : '새 기사 작성') + '</h3><span class="sub">등록 즉시 공개 사이트 News에 반영</span></div>' +
      '<div class="field"><label>제목</label><input class="input" id="edTitle" value="' + (n ? esc(n.title) : 'FW26 룩북 비하인드 — 스튜디오 엘랑 (예시로 채워져 있음)') + '"></div>' +
      '<div class="field"><label>카테고리</label><select class="input" id="edCat">' +
      ['Press', 'Model', 'Business', 'Notice'].map(function (c) { return '<option' + (n && n.cat === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>본문</label><textarea class="input" id="edBody">' + (n ? esc(n.body) : '본문이 미리 채워져 있어 클릭만으로 등록을 체험할 수 있습니다. 실제 구축에서는 이미지·영상 삽입이 가능한 위지윅 에디터가 들어갑니다.') + '</textarea></div>' +
      '<div class="field"><label>노출 여부</label><button class="toggle on" id="edOn"></button> <span class="sub" style="font-size:12px; color:var(--mut)">켜면 등록 즉시 사이트에 노출</span></div>' +
      '<div style="display:flex; gap:10px; margin-top:18px"><button class="btn btn-acc" id="edSave">' + (n ? '수정 저장' : '기사 등록') + '</button>' +
      '<a class="btn btn-gho" href="index.html#news">사이트에서 확인 →</a></div></div>';
  }
  function bindEditor() {
    document.getElementById('edOn').addEventListener('click', function () { this.classList.toggle('on'); });
    document.getElementById('edSave').addEventListener('click', function () {
      var title = document.getElementById('edTitle').value.trim();
      if (title.length < 4) { toast('제목을 4자 이상 입력해 주세요'); return; }
      var news = load();
      var now = new Date();
      var date = now.getFullYear() + '.' + String(now.getMonth() + 1).padStart(2, '0') + '.' + String(now.getDate()).padStart(2, '0');
      if (editId) {
        var n = news.filter(function (x) { return x.id === editId; })[0];
        n.title = title; n.cat = document.getElementById('edCat').value;
        n.body = document.getElementById('edBody').value;
        n.on = document.getElementById('edOn').classList.contains('on');
        toast('수정했습니다 — 사이트에 반영됨', true);
      } else {
        news.unshift({ id: 'n' + Date.now(), date: date, cat: document.getElementById('edCat').value,
          title: title, body: document.getElementById('edBody').value,
          on: document.getElementById('edOn').classList.contains('on') });
        toast('기사를 등록했습니다 — News 맨 위에 노출됩니다', true);
      }
      save(news); editId = null; view = 'posts'; syncNav(); render();
    });
  }

  /* ---------- 배경 영상 교체 (용량 제한 알림) ---------- */
  function vVideo() {
    var cur = localStorage.getItem('elan_hero_video') || 'hero.mp4 (기본)';
    return '<div class="panel"><div class="panel-h"><h3>메인 배경 영상 교체</h3><span class="sub">공고 2-3: 파일 업로드 + 용량 제한 알림</span></div>' +
      '<div class="notice" style="margin-bottom:14px">현재 적용: <b class="mono">' + esc(cur) + '</b> · 제한 <b>' + VIDEO_LIMIT_MB + 'MB</b> / MP4(H.264) 권장 — 초과 파일은 업로드가 차단되고 이유를 알려줍니다.</div>' +
      '<label class="upload-zone" id="upZone">🎬 <b>영상 파일 선택</b> 또는 끌어다 놓기<br><span style="font-size:12px">선택 즉시 용량을 검사합니다 (서버 전송 없음 — 데모)</span>' +
      '<input type="file" id="upFile" accept="video/mp4,video/*" style="display:none"></label>' +
      '<div class="cap-bar"><i id="capBar"></i></div>' +
      '<p class="sub" id="capMsg" style="font-size:12.5px; color:var(--mut); margin-top:8px">파일을 선택하면 용량 게이지가 표시됩니다</p>' +
      '<div id="upResult" style="margin-top:12px"></div></div>' +
      '<div class="panel"><div class="panel-h"><h3>운영 메모</h3></div>' +
      '<div class="notice">실제 구축에서는 업로드 시 서버에서 트랜스코딩(해상도·비트레이트 최적화)과 포스터 프레임 추출까지 자동 처리해, 관리자는 파일만 올리면 됩니다.</div></div>';
  }
  function bindVideo() {
    var zone = document.getElementById('upZone');
    var file = document.getElementById('upFile');
    zone.addEventListener('click', function (e) { if (e.target !== file) file.click(); });
    ['dragover', 'dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); });
    });
    zone.addEventListener('drop', function (e) {
      if (e.dataTransfer.files.length) handle(e.dataTransfer.files[0]);
    });
    file.addEventListener('change', function () { if (file.files.length) handle(file.files[0]); });

    function handle(f) {
      var mb = f.size / 1024 / 1024;
      var bar = document.getElementById('capBar');
      var pct = Math.min(100, mb / VIDEO_LIMIT_MB * 100);
      bar.style.width = pct + '%';
      bar.classList.toggle('over', mb > VIDEO_LIMIT_MB);
      document.getElementById('capMsg').textContent = f.name + ' — ' + mb.toFixed(1) + 'MB / ' + VIDEO_LIMIT_MB + 'MB';
      var res = document.getElementById('upResult');
      if (mb > VIDEO_LIMIT_MB) {
        zone.classList.add('err');
        res.innerHTML = '<div class="notice warn">⚠️ <b>용량 초과 — 업로드 차단.</b> ' + mb.toFixed(1) + 'MB는 제한(' + VIDEO_LIMIT_MB + 'MB)을 넘습니다. 해상도를 1080p로 낮추거나 길이를 줄여 주세요.</div>';
        toast('용량 초과 — 업로드가 차단되었습니다');
      } else if (!/video/.test(f.type)) {
        zone.classList.add('err');
        res.innerHTML = '<div class="notice warn">⚠️ 영상 파일이 아닙니다 (' + esc(f.type || '알 수 없음') + '). MP4 파일을 올려 주세요.</div>';
        toast('영상 파일이 아닙니다');
      } else {
        zone.classList.remove('err');
        localStorage.setItem('elan_hero_video', f.name + ' (' + mb.toFixed(1) + 'MB)');
        res.innerHTML = '<div class="notice ok">✓ 검사 통과 — <b>' + esc(f.name) + '</b> (' + mb.toFixed(1) + 'MB)가 메인 배경 영상으로 적용되었습니다 (데모 — 실제 파일 전송 없음).</div>';
        toast('배경 영상이 교체되었습니다', true);
        render();
      }
    }
  }

  /* ---------- 가이드 ---------- */
  function vGuide() {
    return '<div class="panel"><div class="panel-h"><h3>이 CMS로 할 수 있는 것 (공고 2-3 전부)</h3></div>' +
      ['<b>기사 등록</b> — 에디터에서 작성하면 사이트 News 맨 위에 즉시 노출',
       '<b>노출 토글</b> — 기사·포트폴리오 노출 여부를 버튼 하나로 (목록에서 바로)',
       '<b>메인 배경 영상 교체</b> — 파일 업로드 + 용량 제한(' + VIDEO_LIMIT_MB + 'MB) 초과 시 차단·알림',
       '<b>수정·삭제</b> — 전체 콘텐츠 목록에서 개별 수정과 삭제',
       '개발 지식 없이 쓸 수 있도록 화면은 이 데모 수준으로 단순하게 유지합니다'
      ].map(function (t, i) { return '<div class="cms-row"><span class="cr-d mono">' + (i + 1) + '</span><span class="cr-t" style="white-space:normal">' + t + '</span></div>'; }).join('') +
      '</div>';
  }

  /* ---------- 렌더 ---------- */
  function render() {
    if (view === 'posts') main.innerHTML = vPosts();
    else if (view === 'editor') { main.innerHTML = vEditor(); bindEditor(); }
    else if (view === 'video') { main.innerHTML = vVideo(); bindVideo(); }
    else main.innerHTML = vGuide();
  }
  function syncNav() {
    [].forEach.call(document.querySelectorAll('.cms-nav'), function (n) {
      n.classList.toggle('on', n.dataset.view === view);
    });
  }
  document.getElementById('cmsNav').addEventListener('click', function (e) {
    var n = e.target.closest('.cms-nav'); if (!n) return;
    view = n.dataset.view;
    if (view !== 'editor') editId = null;
    syncNav(); render();
  });

  bindPosts();
  render();
})();
