/* ============================================================
   OUTBOUNDER admin.views.js — 관리자 셸 뷰 모듈 (Views.admin.*)
   ============================================================ */
(function (w) {
  'use strict';
  var V = w.Views.admin = {};
  var esc = function (s) { return Store.esc(s); };
  var STATUS_KO = { applied: '접수', review: '서류심사', pass: '합격', fail: '불합격' };
  var FOLLOW_KO = { employed: '취업', founded: '창업', rejoined: '재참여' };

  function go(r) { location.hash = '#/' + r; }
  function isAuthed() { try { return sessionStorage.getItem('ob-admin') === '1'; } catch (e) { return false; } }
  V._isAuthed = isAuthed;

  function headHtml(title, sub, actions) {
    return '<div class="admin-head"><div><h4>' + title + ' <span class="badge demo">DEMO</span></h4>' +
      (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div>' +
      (actions ? '<div class="actions">' + actions + '</div>' : '') + '</div>';
  }

  /* ============ 로그인 ============ */
  V.login = {
    render: function () {
      return '<div class="admin-login-wrap"><div class="admin-login-card">' +
        '<span class="ob-label green">Admin Console</span>' +
        '<h4 style="margin-bottom:8px">아웃바운더 관리자</h4>' +
        '<p class="small muted" style="margin-bottom:20px">사용자 서비스와 URL이 분리된 운영 전용 콘솔입니다.</p>' +
        '<div class="approval-note">🔐 <span><b>승인 기반 계정 정책</b> — 이메일 가입 후 기존 관리자의 승인을 거쳐야 계정이 활성화됩니다. (실서비스 정책 · 데모에서는 아래 버튼으로 바로 입장)</span></div>' +
        '<div class="field"><label for="ad-email">관리자 이메일</label><input class="input" id="ad-email" type="email" placeholder="admin@outbounder.kr" value="admin@outbounder.kr"></div>' +
        '<div class="field"><label for="ad-pw">비밀번호</label><input class="input" id="ad-pw" type="password" placeholder="(데모: 아무 값이나)" value="demo1234"></div>' +
        '<button class="btn green block lg" id="ad-login">데모 관리자로 로그인</button>' +
        '<p class="hint center" style="margin-top:14px">실서비스: 이메일 인증 + 관리자 승인 + 권한(역할) 부여</p>' +
        '<hr style="border:0;border-top:1px solid var(--g01);margin:20px 0">' +
        '<div style="display:flex;justify-content:space-between;font-size:12.5px"><a class="muted" href="../index.html" style="text-decoration:underline">← 데모 홈</a><a class="muted" href="../app/index.html" style="text-decoration:underline">청년 서비스 보기</a></div>' +
        '</div></div>';
    },
    after: function () {
      document.getElementById('ad-login').addEventListener('click', function () {
        try { sessionStorage.setItem('ob-admin', '1'); } catch (e) {}
        OB.toast('관리자로 로그인했습니다 (데모)');
        go('dashboard');
      });
    }
  };

  /* ============ 성과 대시보드 ============ */
  V.dashboard = {
    render: function () {
      var st = Store.stats();
      var trend = Store.trend();
      var jobs = Store.publishedJobs();
      // 공고별 지원자수 상위 6
      var byJob = jobs.map(function (j) {
        return { label: j.region, full: j.title, value: Store.jobStats(j.id).applications };
      }).sort(function (a, b) { return b.value - a.value; }).slice(0, 6);
      // 상태 분포 도넛
      var apps = Store.applications();
      var dist = [
        { label: '접수', value: apps.filter(function (a) { return a.status === 'applied'; }).length, color: '#afafaf' },
        { label: '심사중', value: apps.filter(function (a) { return a.status === 'review'; }).length, color: '#00b9ef' },
        { label: '합격', value: apps.filter(function (a) { return a.status === 'pass'; }).length, color: '#00b670' },
        { label: '불합격', value: apps.filter(function (a) { return a.status === 'fail'; }).length, color: '#e5484d' }
      ];
      return headHtml('성과 대시보드',
        '이번 분기, 지역에 연결된 청년 <b>' + st.pass + '명</b> — 모든 수치는 실제 지원 데이터에서 집계됩니다.',
        '<button class="btn ghost sm" onclick="OB.toast(\'PDF 리포트 내보내기 (데모 — 실서비스에서 제공)\',\'warn\')">📄 PDF 내보내기 (데모)</button>' +
        '<a class="btn dark sm" href="#/report">파트너 리포트 →</a>') +

        '<div class="kpi-grid">' +
        '<div class="kpi accent"><div class="k-label">게시 중 공고</div><div class="k-num" data-count="' + st.jobs + '">0</div><div class="k-delta">프로그램 ' + Store.programs().length + '개 운영</div></div>' +
        '<div class="kpi"><div class="k-label">누적 지원자</div><div class="k-num" data-count="' + st.applications + '">0</div><div class="k-delta">▲ 이번 주 +' + apps.filter(function (a) { return Store.dday(a.appliedAt) > -8; }).length + '</div></div>' +
        '<div class="kpi"><div class="k-label">선발률</div><div class="k-num"><span data-count="' + st.selectRate + '">0</span><small>%</small></div><div class="k-delta">합격 ' + st.pass + '명</div></div>' +
        '<div class="kpi"><div class="k-label">참여완료율</div><div class="k-num"><span data-count="' + st.completeRate + '">0</span><small>%</small></div><div class="k-delta">완주 ' + st.done + '명</div></div>' +
        '<div class="kpi"><div class="k-label">평균 만족도</div><div class="k-num"><span data-count="' + st.satisfaction + '">0</span><small>/5</small></div><div class="k-delta">설문 ' + Store.surveys().length + '건 축적</div></div>' +
        '</div>' +

        '<div class="panel-grid"><div class="apanel">' +
        '<h6>조회수·지원 추이</h6><p class="p-sub">최근 6개 구간 — 실선: 조회수 · 점선: 지원 건수</p>' +
        OB.lineChart(trend.map(function (t) { return { label: t.w, a: t.views, b: t.apps }; }), { label: '조회수·지원 추이' }) +
        '<div class="legend"><span><i style="background:#00b670"></i>조회수</span><span><i style="background:#f05519"></i>지원 건수</span></div>' +
        '</div><div class="apanel">' +
        '<h6>지원 상태 분포</h6><p class="p-sub">전체 ' + st.applications + '건의 현재 상태</p>' +
        '<div style="max-width:230px;margin-inline:auto">' + OB.donutChart(dist, { label: '지원 상태 분포', center: String(st.applications), centerLabel: '총 지원' }) + '</div>' +
        '<div class="legend" style="justify-content:center">' + dist.map(function (d) { return '<span><i style="background:' + d.color + '"></i>' + d.label + ' ' + d.value + '</span>'; }).join('') + '</div>' +
        '</div></div>' +

        '<div class="panel-grid"><div class="apanel">' +
        '<h6>공고별 지원자 수 <a class="small" style="text-decoration:underline;color:var(--g05)" href="#/applicants">전체 보기</a></h6><p class="p-sub">상위 6개 공고 (지역 라벨)</p>' +
        OB.barChart(byJob, { label: '공고별 지원자 수' }) +
        '</div><div class="apanel">' +
        '<h6>후속연결 퍼널</h6><p class="p-sub">지원 → 선발 → 참여완료 → 취업·창업·재참여</p>' +
        OB.funnelChart(st.funnel) +
        '<div class="legend" style="margin-top:16px">' +
        Object.keys(st.follow).map(function (k) { return '<span><i style="background:#0e8c5a"></i>' + FOLLOW_KO[k] + ' ' + st.follow[k] + '명</span>'; }).join('') +
        '</div></div></div>' +

        '<div class="apanel"><h6>웹 분석</h6><p class="p-sub">주요 페이지·전환 이벤트 트래킹</p>' +
        '<div class="ga-widget"><span class="dot"></span><b>GA4 연동됨 (데모 표시)</b><span class="muted">— 실서비스에서 페이지뷰·지원 전환·회원가입 이벤트가 실시간 수집됩니다</span></div></div>';
    }
  };

  /* ============ 프로그램·공고 관리 ============ */
  var openPrg = {};
  V.programs = {
    render: function () {
      var progs = Store.programs();
      return headHtml('프로그램 · 공고 관리',
        '프로그램(상위) → 공고(하위) 2단계 구조 · 생성/수정/복제/삭제와 게시·모집 상태 제어',
        '<button class="btn green sm" id="prg-new">+ 새 프로그램</button>') +
        progs.map(function (p) {
          var jobs = Store.jobs().filter(function (j) { return j.programId === p.id; });
          return '<div class="prg-item' + (openPrg[p.id] !== false ? ' open' : '') + '" data-prg="' + p.id + '">' +
            '<div class="prg-head" role="button" tabindex="0" aria-expanded="' + (openPrg[p.id] !== false) + '">' +
            '<span class="arrow">▶</span><div style="flex:1"><h6>' + esc(p.name) + ' <span class="badge plain ' + (p.status === 'active' ? 'pass' : 'applied') + '" style="margin-left:6px">' + (p.status === 'active' ? '운영중' : '준비중') + '</span></h6>' +
            '<div class="p-meta">' + esc(p.season) + ' · ' + esc(p.desc) + '</div></div>' +
            '<span class="p-meta">공고 ' + jobs.length + '개</span>' +
            '<button class="btn ghost sm" data-newjob="' + p.id + '">+ 공고</button></div>' +
            '<div class="prg-jobs">' + (jobs.length ? jobs.map(function (j) {
              var stt = Store.jobState(j), dd = Store.dday(j.deadline), js = Store.jobStats(j.id);
              return '<div class="prg-job"><div class="t">' + esc(j.title) +
                '<div class="small">' + esc(j.region) + ' · 마감 ' + OB.fmtDate(j.deadline) + ' · 지원 ' + js.applications + '명 · 조회 ' + OB.fmt(j.views) + '</div></div>' +
                OB.badge(stt, dd) +
                '<label class="switch" title="게시 상태"><input type="checkbox" data-pub="' + j.id + '"' + (j.published ? ' checked' : '') + ' aria-label="게시 상태"><span class="tr"></span></label>' +
                '<div class="ops">' +
                '<button class="iconbtn" data-edit="' + j.id + '" title="수정" aria-label="수정">✏️</button>' +
                '<button class="iconbtn" data-dup="' + j.id + '" title="복제" aria-label="복제">📑</button>' +
                '<button class="iconbtn danger" data-del="' + j.id + '" title="삭제" aria-label="삭제">🗑️</button>' +
                '</div></div>';
            }).join('') : '<div class="empty-state" style="padding:32px"><div class="art">📄</div><h6>이 프로그램에 공고가 없습니다</h6><p>+ 공고 버튼으로 첫 공고를 만들어 보세요.</p></div>') +
            '</div></div>';
        }).join('');
    },
    after: function () {
      var d = Store.all();
      document.querySelectorAll('.prg-head').forEach(function (h) {
        var toggle = function (e) {
          if (e.target.closest('[data-newjob]')) return;
          var item = h.closest('.prg-item');
          item.classList.toggle('open');
          openPrg[item.dataset.prg] = item.classList.contains('open');
          h.setAttribute('aria-expanded', item.classList.contains('open'));
        };
        h.addEventListener('click', toggle);
        h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
      });
      document.getElementById('prg-new').addEventListener('click', function () {
        OB.modal('<h5 style="margin-bottom:16px">새 프로그램</h5>' +
          '<div class="field"><label>프로그램명</label><input class="input" id="np-name" placeholder="예) 로컬 크리에이터 캠프"></div>' +
          '<div class="field"><label>설명</label><input class="input" id="np-desc" placeholder="프로그램 한 줄 설명"></div>' +
          '<div class="field"><label>시즌</label><input class="input" id="np-season" value="2026 하반기"></div>' +
          '<button class="btn green block" id="np-save">프로그램 생성</button>');
        document.getElementById('np-save').addEventListener('click', function () {
          var name = document.getElementById('np-name').value.trim();
          if (!name) { OB.toast('프로그램명을 입력해 주세요', 'warn'); return; }
          Store.saveProgram({ name: name, desc: document.getElementById('np-desc').value.trim(), season: document.getElementById('np-season').value.trim(), status: 'active' });
          document.querySelector('.ob-modal .close-x').click();
          OB.toast('프로그램이 생성되었습니다');
          V._rr();
        });
      });
      function jobForm(job, programId) {
        var j = job || { title: '', region: d.regions[0], field: d.fields[0], capacity: 3, deadline: Store.today(), period: '4주', pay: '', summary: '', detail: '', tags: [], partner: '' };
        OB.modal('<h5 style="margin-bottom:16px">' + (job ? '공고 수정' : '새 공고') + '</h5>' +
          '<div class="field"><label>공고 제목 <span class="req">*</span></label><input class="input" id="nj-title" value="' + esc(j.title) + '"></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div class="field"><label>지역</label><select class="select" id="nj-region">' + d.regions.map(function (r) { return '<option' + (j.region === r ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label>분야</label><select class="select" id="nj-field">' + d.fields.map(function (f) { return '<option' + (j.field === f ? ' selected' : '') + '>' + esc(f) + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label>모집 인원</label><input class="input" id="nj-cap" type="number" min="1" value="' + j.capacity + '"></div>' +
          '<div class="field"><label>마감일</label><input class="input" id="nj-deadline" type="date" value="' + j.deadline + '"></div>' +
          '<div class="field"><label>활동 기간</label><input class="input" id="nj-period" value="' + esc(j.period) + '"></div>' +
          '<div class="field"><label>보상</label><input class="input" id="nj-pay" value="' + esc(j.pay) + '" placeholder="예) 월 180만원"></div></div>' +
          '<div class="field"><label>운영 파트너</label><input class="input" id="nj-partner" value="' + esc(j.partner) + '"></div>' +
          '<div class="field"><label>요약 (목록 노출)</label><input class="input" id="nj-summary" value="' + esc(j.summary) + '"></div>' +
          '<div class="field"><label>상세 소개</label><textarea class="textarea" id="nj-detail">' + esc(j.detail) + '</textarea></div>' +
          '<button class="btn green block" id="nj-save">' + (job ? '수정 저장' : '공고 생성 (비공개 상태)') + '</button>');
        document.getElementById('nj-save').addEventListener('click', function () {
          var title = document.getElementById('nj-title').value.trim();
          if (!title) { OB.toast('제목을 입력해 주세요', 'warn'); return; }
          var nj = job ? Store.job(job.id) : { programId: programId, published: false, status: 'open', views: 0, benefits: ['활동비 지급', '전담 코디네이터'], schedule: [], tags: [] };
          nj.title = title;
          nj.region = document.getElementById('nj-region').value;
          nj.field = document.getElementById('nj-field').value;
          nj.capacity = +document.getElementById('nj-cap').value || 1;
          nj.deadline = document.getElementById('nj-deadline').value || Store.today();
          nj.period = document.getElementById('nj-period').value.trim();
          nj.pay = document.getElementById('nj-pay').value.trim();
          nj.partner = document.getElementById('nj-partner').value.trim();
          nj.summary = document.getElementById('nj-summary').value.trim();
          nj.detail = document.getElementById('nj-detail').value.trim();
          if (!nj.schedule.length) {
            var dl = nj.deadline;
            nj.schedule = [['서류 접수', dl], ['서류 발표', dl], ['온라인 인터뷰', dl], ['최종 발표', dl]];
          }
          Store.saveJob(nj);
          document.querySelector('.ob-modal .close-x').click();
          OB.toast(job ? '공고가 수정되었습니다' : '공고가 생성되었습니다 — 게시 토글을 켜면 청년 서비스에 노출됩니다');
          V._rr();
        });
      }
      document.querySelectorAll('[data-newjob]').forEach(function (b) {
        b.addEventListener('click', function (e) { e.stopPropagation(); jobForm(null, b.dataset.newjob); });
      });
      document.querySelectorAll('[data-edit]').forEach(function (b) {
        b.addEventListener('click', function () { jobForm(Store.job(b.dataset.edit)); });
      });
      document.querySelectorAll('[data-dup]').forEach(function (b) {
        b.addEventListener('click', function () {
          Store.duplicateJob(b.dataset.dup);
          OB.toast('공고가 복제되었습니다 (비공개 상태)');
          V._rr();
        });
      });
      document.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          var j = Store.job(b.dataset.del);
          OB.modal('<h5 style="margin-bottom:10px">공고 삭제</h5><p class="small muted" style="margin-bottom:20px">「' + esc(j.title) + '」 공고를 삭제할까요? 연결된 지원서 기록은 유지됩니다.</p><div style="display:flex;gap:10px"><button class="btn ghost block" onclick="this.closest(\'.ob-modal\').querySelector(\'.close-x\').click()">취소</button><button class="btn block" style="background:var(--st-fail);color:#fff" id="del-yes">삭제</button></div>');
          document.getElementById('del-yes').addEventListener('click', function () {
            Store.deleteJob(j.id);
            document.querySelector('.ob-modal .close-x').click();
            OB.toast('공고가 삭제되었습니다');
            V._rr();
          });
        });
      });
      document.querySelectorAll('[data-pub]').forEach(function (t) {
        t.addEventListener('change', function () {
          var j = Store.job(t.dataset.pub);
          j.published = t.checked;
          Store.saveJob(j);
          OB.toast(t.checked ? '게시되었습니다 — 청년 서비스에 노출' : '게시가 중단되었습니다');
        });
      });
    }
  };

  /* ============ 지원자 관리 ============ */
  var apf = { job: '', status: '', q: '' };
  V.applicants = {
    render: function () {
      var jobs = Store.jobs();
      var list = Store.applications().filter(function (a) {
        if (apf.job && a.jobId !== apf.job) return false;
        if (apf.status && a.status !== apf.status) return false;
        if (apf.q && (a.name + a.email).toLowerCase().indexOf(apf.q.toLowerCase()) < 0) return false;
        return true;
      }).sort(function (a, b) { return b.appliedAt < a.appliedAt ? -1 : 1; });
      var rows = list.map(function (a) {
        var j = Store.job(a.jobId);
        return '<tr data-app="' + a.id + '" tabindex="0">' +
          '<td data-th="지원자"><b>' + esc(a.name) + '</b>' + (a.mine ? ' <span class="badge demo" style="padding:2px 7px;font-size:10px">내 지원</span>' : '') + '<div class="small muted">' + esc(a.email) + '</div></td>' +
          '<td data-th="공고">' + esc(j ? j.title : '(삭제된 공고)') + '<div class="small muted">' + esc(j ? j.region : '') + '</div></td>' +
          '<td data-th="접수일">' + OB.fmtDate(a.appliedAt) + '</td>' +
          '<td data-th="평가">' + (a.evals.length ? '<b>' + a.evals[a.evals.length - 1].score + '점</b>' : '<span class="muted">—</span>') + '</td>' +
          '<td data-th="상태">' + OB.badge(a.status) + '</td></tr>';
      }).join('');
      return headHtml('지원자 관리',
        '지원서 검토 → 평가 입력 → 합격/불합격 처리. 상태 변경은 청년 마이페이지에 즉시 반영됩니다.',
        '<button class="btn dark sm" id="csv-apps">⬇ CSV 추출</button>') +
        '<div class="admin-filter">' +
        '<select class="select" id="ap-job"><option value="">전체 공고</option>' + jobs.map(function (j) { return '<option value="' + j.id + '"' + (apf.job === j.id ? ' selected' : '') + '>' + esc(j.title) + '</option>'; }).join('') + '</select>' +
        '<select class="select" id="ap-status"><option value="">전체 상태</option>' + Object.keys(STATUS_KO).map(function (s) { return '<option value="' + s + '"' + (apf.status === s ? ' selected' : '') + '>' + STATUS_KO[s] + '</option>'; }).join('') + '</select>' +
        '<input class="input search" id="ap-q" type="search" placeholder="이름·이메일 검색" value="' + esc(apf.q) + '">' +
        '<span class="count">' + list.length + '건</span></div>' +
        (list.length
          ? '<div class="tbl-wrap responsive"><table class="tbl"><thead><tr><th>지원자</th><th>공고</th><th>접수일</th><th>평가</th><th>상태</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
          : '<div class="apanel"><div class="empty-state"><div class="art">📭</div><h6>조건에 맞는 지원서가 없습니다</h6><p>필터를 조정해 보세요.</p></div></div>');
    },
    after: function () {
      document.getElementById('ap-job').addEventListener('change', function (e) { apf.job = e.target.value; V._rr(); });
      document.getElementById('ap-status').addEventListener('change', function (e) { apf.status = e.target.value; V._rr(); });
      var deb;
      document.getElementById('ap-q').addEventListener('input', function (e) {
        clearTimeout(deb); deb = setTimeout(function () { apf.q = e.target.value.trim(); V._rr(); }, 300);
      });
      document.getElementById('csv-apps').addEventListener('click', function () {
        var rows = Store.applications().map(function (a) {
          var j = Store.job(a.jobId);
          return [a.no, a.name, a.email, a.phone, j ? j.title : '', j ? j.region : '', STATUS_KO[a.status] || a.status, a.appliedAt,
            a.evals.map(function (e) { return e.score + '점(' + e.role + ')'; }).join('; ')];
        });
        Store.downloadCSV('outbounder_지원자_' + Store.today() + '.csv',
          Store.toCSV(rows, ['접수번호', '이름', '이메일', '연락처', '공고', '지역', '상태', '접수일', '평가']));
        OB.toast('지원자 목록 CSV가 다운로드되었습니다');
      });
      function openDrawer(id) {
        var a = Store.application(id);
        var j = Store.job(a.jobId);
        var dr = OB.drawer('<div class="dr-head"><div style="display:flex;gap:8px;align-items:center">' + OB.badge(a.status) + '<span class="small muted">' + esc(a.no) + '</span></div>' +
          '<h5>' + esc(a.name) + '</h5>' +
          '<p class="small muted">' + esc(a.email) + ' · ' + esc(a.phone) + ' · ' + OB.fmtDate(a.appliedAt) + ' 접수</p></div>' +

          '<div class="dr-sec"><h6>지원 공고</h6><div class="qa"><b>' + esc(j ? j.region + ' · ' + j.field : '') + '</b>' + esc(j ? j.title : '(삭제된 공고)') + '</div></div>' +
          '<div class="dr-sec"><h6>지원서</h6>' +
          '<div class="qa"><b>지원 동기</b>' + esc(a.motivation) + '</div>' +
          '<div class="qa"><b>관련 경험</b>' + esc(a.exp) + '</div>' +
          (a.skills.length ? '<div class="qa"><b>역량 태그</b>' + a.skills.map(esc).join(', ') + '</div>' : '') +
          (a.files.length ? '<div class="qa"><b>첨부 (데모 — 메타 정보만 보존)</b>' + a.files.map(function (f) { return '📄 ' + esc(f.name) + ' (' + (f.size / 1048576).toFixed(1) + 'MB)'; }).join('<br>') + '</div>' : '') +
          '</div>' +

          '<div class="dr-sec"><h6>평가 데이터</h6><div id="dr-evals">' +
          (a.evals.length ? a.evals.map(function (e) {
            return '<div class="eval-item"><span class="score">' + e.score + '</span><span class="role">' + esc(e.role || '역할 미정') + '</span><span>' + esc(e.comment || '') + '</span></div>';
          }).join('') : '<p class="small muted">아직 평가가 없습니다.</p>') + '</div>' +
          '<div style="display:grid;grid-template-columns:80px 1fr;gap:8px;margin-top:12px">' +
          '<input class="input" id="ev-score" type="number" min="0" max="100" placeholder="점수">' +
          '<input class="input" id="ev-role" placeholder="추천 역할 (예: PD, 촬영)">' +
          '<input class="input" id="ev-comment" placeholder="코멘트" style="grid-column:1/-1">' +
          '<button class="btn ghost sm" id="ev-add" style="grid-column:1/-1">+ 평가 추가</button></div></div>' +

          '<div class="dr-sec"><h6>선발 처리</h6><div class="status-btns">' +
          '<button class="btn ghost sm" data-st="review">서류심사</button>' +
          '<button class="btn green sm" data-st="pass">합격</button>' +
          '<button class="btn sm" style="background:var(--ob-pink-w);color:var(--st-fail)" data-st="fail">불합격</button></div>' +
          '<p class="hint" style="margin-top:10px">처리 결과는 청년 마이페이지에 바로 반영됩니다' + (a.mine ? ' — 이 지원서는 <b>당신이 청년 화면에서 제출한 지원서</b>입니다. 합격 처리 후 마이페이지를 확인해 보세요!' : '') + '</p></div>');
        dr.querySelector('#ev-add').addEventListener('click', function () {
          var sc = +dr.querySelector('#ev-score').value;
          if (!(sc >= 0 && sc <= 100)) { OB.toast('0~100 사이 점수를 입력해 주세요', 'warn'); return; }
          Store.addEval(a.id, { score: sc, role: dr.querySelector('#ev-role').value.trim(), comment: dr.querySelector('#ev-comment').value.trim() });
          OB.toast('평가가 저장되었습니다');
          dr.obClose(); openDrawer(id);
        });
        dr.querySelectorAll('[data-st]').forEach(function (b) {
          b.addEventListener('click', function () {
            Store.setAppStatus(a.id, b.dataset.st);
            OB.toast(esc(a.name) + ' — ' + STATUS_KO[b.dataset.st] + ' 처리되었습니다');
            dr.obClose(); V._rr();
          });
        });
      }
      document.querySelectorAll('[data-app]').forEach(function (tr) {
        tr.addEventListener('click', function () { openDrawer(tr.dataset.app); });
        tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') openDrawer(tr.dataset.app); });
      });
    }
  };

  /* ============ 청년 인재 관리 ============ */
  var mf = { active: '', risk: '', q: '' };
  V.members = {
    render: function () {
      var list = Store.members().filter(function (m) {
        if (mf.active === 'on' && !m.active) return false;
        if (mf.active === 'off' && m.active) return false;
        if (mf.risk === 'yes' && !m.risk) return false;
        if (mf.q && (m.name + m.email + m.region).toLowerCase().indexOf(mf.q.toLowerCase()) < 0) return false;
        return true;
      });
      var rows = list.map(function (m) {
        return '<tr data-mem="' + m.id + '" tabindex="0">' +
          '<td data-th="이름"><b>' + esc(m.name) + '</b><div class="small muted">' + m.age + '세 · ' + esc(m.region) + '</div></td>' +
          '<td data-th="분야">' + m.fields.map(esc).join(', ') + '</td>' +
          '<td data-th="참여 이력">' + m.history + '회</td>' +
          '<td data-th="리스크">' + (m.risk ? '<span class="badge closing plain">⚠ ' + esc(m.risk) + '</span>' : '<span class="muted small">없음</span>') + '</td>' +
          '<td data-th="상태">' + (m.active ? '<span class="badge pass">활동중</span>' : '<span class="badge closed">비활성</span>') + '</td></tr>';
      }).join('');
      return headHtml('청년 인재 관리',
        '회원 조회 · 활동 이력 · 리스크 태그 · 계정 상태 관리',
        '<button class="btn dark sm" id="csv-mem">⬇ CSV 추출</button>') +
        '<div class="admin-filter">' +
        '<select class="select" id="m-active"><option value="">전체 상태</option><option value="on"' + (mf.active === 'on' ? ' selected' : '') + '>활동중</option><option value="off"' + (mf.active === 'off' ? ' selected' : '') + '>비활성</option></select>' +
        '<select class="select" id="m-risk"><option value="">리스크 전체</option><option value="yes"' + (mf.risk === 'yes' ? ' selected' : '') + '>리스크 있음</option></select>' +
        '<input class="input search" id="m-q" type="search" placeholder="이름·이메일·지역 검색" value="' + esc(mf.q) + '">' +
        '<span class="count">' + list.length + '명</span></div>' +
        (list.length
          ? '<div class="tbl-wrap responsive"><table class="tbl"><thead><tr><th>이름</th><th>분야</th><th>참여 이력</th><th>리스크</th><th>상태</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
          : '<div class="apanel"><div class="empty-state"><div class="art">👥</div><h6>조건에 맞는 회원이 없습니다</h6><p>필터를 조정해 보세요.</p></div></div>');
    },
    after: function () {
      document.getElementById('m-active').addEventListener('change', function (e) { mf.active = e.target.value; V._rr(); });
      document.getElementById('m-risk').addEventListener('change', function (e) { mf.risk = e.target.value; V._rr(); });
      var deb;
      document.getElementById('m-q').addEventListener('input', function (e) {
        clearTimeout(deb); deb = setTimeout(function () { mf.q = e.target.value.trim(); V._rr(); }, 300);
      });
      document.getElementById('csv-mem').addEventListener('click', function () {
        var rows = Store.members().map(function (m) {
          return [m.name, m.age, m.region, m.fields.join('; '), m.history, m.active ? '활동중' : '비활성', m.risk || '', m.joined, m.email];
        });
        Store.downloadCSV('outbounder_청년인재_' + Store.today() + '.csv',
          Store.toCSV(rows, ['이름', '나이', '거주지역', '분야', '참여이력', '상태', '리스크', '가입일', '이메일']));
        OB.toast('청년 인재 목록 CSV가 다운로드되었습니다');
      });
      function openDrawer(id) {
        var m = Store.member(id);
        var apps = Store.applications().filter(function (a) { return a.name === m.name; });
        var dr = OB.drawer('<div class="dr-head"><div style="display:flex;gap:8px;align-items:center">' +
          (m.active ? '<span class="badge pass">활동중</span>' : '<span class="badge closed">비활성</span>') +
          (m.risk ? '<span class="badge closing plain">⚠ ' + esc(m.risk) + '</span>' : '') + '</div>' +
          '<h5>' + esc(m.name) + '</h5>' +
          '<p class="small muted">' + m.age + '세 · ' + esc(m.region) + ' · ' + esc(m.email) + ' · 가입 ' + OB.fmtDate(m.joined) + '</p></div>' +
          '<div class="dr-sec"><h6>프로필</h6><div class="qa"><b>관심 분야</b>' + m.fields.map(esc).join(', ') + '</div>' +
          '<div class="qa"><b>참여 이력</b>' + m.history + '회 프로젝트 참여' +
          (apps.length ? '<br>' + apps.map(function (a) { var j = Store.job(a.jobId); return '· ' + esc(j ? j.title : '') + ' — ' + (STATUS_KO[a.status] || a.status); }).join('<br>') : '') + '</div></div>' +
          '<div class="dr-sec"><h6>운영 메모</h6><div id="dr-memos">' +
          (m.memos.length ? m.memos.map(function (mm) { return '<div class="qa"><b>' + OB.fmtDate(mm.at) + '</b>' + esc(mm.text) + '</div>'; }).join('') : '<p class="small muted">메모가 없습니다.</p>') +
          '</div><div style="display:grid;gap:8px;margin-top:10px"><textarea class="textarea" id="memo-txt" style="min-height:70px" placeholder="예) 차기 브랜딩 공고 우선 안내"></textarea>' +
          '<button class="btn ghost sm" id="memo-add">+ 메모 추가</button></div></div>' +
          '<div class="dr-sec"><h6>계정 관리</h6>' +
          '<button class="btn ' + (m.active ? '' : 'green') + ' sm block" style="' + (m.active ? 'background:var(--ob-pink-w);color:var(--st-fail)' : '') + '" id="mem-toggle">' + (m.active ? '계정 비활성화' : '계정 활성화') + '</button></div>');
        dr.querySelector('#memo-add').addEventListener('click', function () {
          var t = dr.querySelector('#memo-txt').value.trim();
          if (!t) { OB.toast('메모 내용을 입력해 주세요', 'warn'); return; }
          Store.addMemberMemo(m.id, t);
          OB.toast('메모가 저장되었습니다');
          dr.obClose(); openDrawer(id);
        });
        dr.querySelector('#mem-toggle').addEventListener('click', function () {
          Store.toggleMember(m.id);
          OB.toast(m.name + ' — 계정 상태가 변경되었습니다');
          dr.obClose(); V._rr();
        });
      }
      document.querySelectorAll('[data-mem]').forEach(function (tr) {
        tr.addEventListener('click', function () { openDrawer(tr.dataset.mem); });
        tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') openDrawer(tr.dataset.mem); });
      });
    }
  };

  /* ============ 콘텐츠 관리 (구조화 폼 에디터) ============ */
  V.content = {
    render: function () {
      var list = Store.contents().sort(function (a, b) { return b.at < a.at ? -1 : 1; });
      return headHtml('콘텐츠 관리',
        '인터뷰·지역탐방 콘텐츠를 자체 에디터로 작성·발행 — 발행 즉시 청년 서비스 스토리에 노출됩니다 (자체 아카이빙)',
        '<button class="btn green sm" id="cnt-new">+ 새 콘텐츠</button>') +
        '<div class="tbl-wrap responsive"><table class="tbl"><thead><tr><th>제목</th><th>카테고리</th><th>작성일</th><th>상태</th><th>관리</th></tr></thead><tbody>' +
        list.map(function (c) {
          return '<tr><td data-th="제목"><b>' + esc(c.title) + '</b></td>' +
            '<td data-th="카테고리"><span class="badge demo" style="background:var(--ob-purple-w)">' + esc(c.category) + '</span></td>' +
            '<td data-th="작성일">' + OB.fmtDate(c.at) + '</td>' +
            '<td data-th="상태">' + (c.published ? '<span class="badge pass">발행됨</span>' : '<span class="badge applied">임시저장</span>') + '</td>' +
            '<td data-th="관리"><div class="ops" style="display:flex;gap:6px">' +
            '<button class="iconbtn" data-cedit="' + c.id + '" title="수정" aria-label="수정">✏️</button>' +
            (c.published ? '<a class="iconbtn" href="../app/index.html#/story/' + c.id + '" title="보기" aria-label="보기">👁️</a>' : '') +
            '<button class="iconbtn danger" data-cdel="' + c.id + '" title="삭제" aria-label="삭제">🗑️</button></div></td></tr>';
        }).join('') + '</tbody></table></div>';
    },
    after: function () {
      var THUMBS = [
        { id: null, label: '없음 (그라디언트)' },
        { id: 'story-cafe', label: '카페 인터뷰' },
        { id: 'story-branding', label: '브랜딩 워크숍' },
        { id: 'story-market', label: '시장 촬영' }
      ];
      function editorModal(c) {
        c = c || { title: '', category: '인터뷰', thumb: null, body: '', published: false };
        OB.modal('<h5 style="margin-bottom:6px">콘텐츠 에디터</h5>' +
          '<p class="small muted" style="margin-bottom:18px">본문은 문단 단위로 자동 서식 처리됩니다 (빈 줄 = 문단 구분). 발행 시 안전하게 이스케이프됩니다.</p>' +
          '<div class="field"><label>제목 <span class="req">*</span></label><input class="input" id="ce-title" value="' + esc(c.title) + '"></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div class="field"><label>카테고리</label><select class="select" id="ce-cat">' + ['인터뷰', '지역탐방', '참여후기', '아웃바운더'].map(function (k) { return '<option' + (c.category === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label>썸네일 프리셋</label><select class="select" id="ce-thumb">' + THUMBS.map(function (t) { return '<option value="' + (t.id || '') + '"' + (c.thumb === t.id ? ' selected' : '') + '>' + t.label + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="field"><label>본문 <span class="req">*</span></label><textarea class="textarea" id="ce-body" style="min-height:220px" placeholder="이야기를 들려주세요...">' + esc(c.body) + '</textarea></div>' +
          '<div style="display:flex;gap:10px">' +
          '<button class="btn ghost block" id="ce-draft">임시저장</button>' +
          '<button class="btn green block" id="ce-pub">발행하기</button></div>');
        function save(pub) {
          var title = document.getElementById('ce-title').value.trim();
          var body = document.getElementById('ce-body').value.trim();
          if (!title || !body) { OB.toast('제목과 본문을 입력해 주세요', 'warn'); return; }
          var obj = c.id ? Store.content(c.id) : {};
          obj.title = title;
          obj.category = document.getElementById('ce-cat').value;
          obj.thumb = document.getElementById('ce-thumb').value || null;
          obj.body = body;
          obj.published = pub;
          if (c.id) obj.id = c.id;
          Store.saveContent(obj);
          document.querySelector('.ob-modal .close-x').click();
          OB.toast(pub ? '발행되었습니다 — 청년 서비스 스토리에서 확인하세요' : '임시저장되었습니다');
          V._rr();
        }
        document.getElementById('ce-draft').addEventListener('click', function () { save(false); });
        document.getElementById('ce-pub').addEventListener('click', function () { save(true); });
      }
      document.getElementById('cnt-new').addEventListener('click', function () { editorModal(null); });
      document.querySelectorAll('[data-cedit]').forEach(function (b) {
        b.addEventListener('click', function () { editorModal(Store.content(b.dataset.cedit)); });
      });
      document.querySelectorAll('[data-cdel]').forEach(function (b) {
        b.addEventListener('click', function () {
          var c = Store.content(b.dataset.cdel);
          OB.modal('<h5 style="margin-bottom:10px">콘텐츠 삭제</h5><p class="small muted" style="margin-bottom:20px">「' + esc(c.title) + '」을(를) 삭제할까요?</p><div style="display:flex;gap:10px"><button class="btn ghost block" onclick="this.closest(\'.ob-modal\').querySelector(\'.close-x\').click()">취소</button><button class="btn block" style="background:var(--st-fail);color:#fff" id="cdel-yes">삭제</button></div>');
          document.getElementById('cdel-yes').addEventListener('click', function () {
            Store.deleteContent(c.id);
            document.querySelector('.ob-modal .close-x').click();
            OB.toast('삭제되었습니다');
            V._rr();
          });
        });
      });
    }
  };

  /* ============ 파트너 성과 리포트 (확장 선시연) ============ */
  var rpPartner = '';
  V.report = {
    render: function () {
      var partners = [];
      Store.publishedJobs().forEach(function (j) { if (j.partner && partners.indexOf(j.partner) < 0) partners.push(j.partner); });
      if (!rpPartner) rpPartner = partners[0] || '';
      var jobs = Store.publishedJobs().filter(function (j) { return j.partner === rpPartner; });
      var apps = [], views = 0;
      jobs.forEach(function (j) {
        views += j.views || 0;
        apps = apps.concat(Store.applications().filter(function (a) { return a.jobId === j.id; }));
      });
      var pass = apps.filter(function (a) { return a.status === 'pass'; });
      var done = apps.filter(function (a) { return a.completed; });
      return headHtml('파트너별 성과 리포트',
        '공고·파트너 단위 성과를 보고서 형식으로 — 정부지원사업 성과 증빙에 그대로 활용',
        '<button class="btn dark sm" onclick="OB.toast(\'PDF 내보내기 (데모 — 실서비스 Phase 2에서 자동화)\',\'warn\')">📄 PDF 내보내기 (데모)</button>') +

        '<div class="phase2-stub"><span class="ico">💳</span><div><h6>결제·구독 관리</h6><p>파트너별 이용료 결제(PG)와 구독형 자동 결제 — DB·권한 구조에 확장 여지를 설계해 두었습니다.</p></div><span class="tag">PHASE 2 예정</span></div>' +
        '<div class="phase2-stub"><span class="ico">🤖</span><div><h6>성과 리포트 자동화</h6><p>월간·분기 리포트 자동 생성과 이메일 발송 — 지금 보는 화면이 그 원형입니다.</p></div><span class="tag">PHASE 2 예정</span></div>' +

        '<div class="admin-filter" style="margin-top:20px">' +
        '<label class="small" style="font-weight:700" for="rp-partner">파트너 선택</label>' +
        '<select class="select" id="rp-partner" style="min-width:240px">' + partners.map(function (p) { return '<option' + (rpPartner === p ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select></div>' +

        '<div class="report-sheet"><div class="rs-head"><div>' +
        '<span class="ob-label green" style="margin-bottom:6px">Partner Performance Report</span>' +
        '<h5>' + esc(rpPartner) + ' 성과 요약</h5></div>' +
        '<div class="rs-meta">보고 기준일 ' + OB.fmtDate(Store.today()) + ' · 아웃바운더 운영사무국</div></div>' +
        '<div class="rs-kpis">' +
        '<div class="rs-kpi"><div class="n">' + jobs.length + '</div><div class="l">운영 공고</div></div>' +
        '<div class="rs-kpi"><div class="n">' + OB.fmt(views) + '</div><div class="l">누적 조회수</div></div>' +
        '<div class="rs-kpi"><div class="n">' + apps.length + '</div><div class="l">총 지원자</div></div>' +
        '<div class="rs-kpi"><div class="n">' + (apps.length ? Math.round(pass.length / apps.length * 100) : 0) + '%</div><div class="l">선발률 (' + pass.length + '명)</div></div></div>' +
        (jobs.length ? '<h6 style="margin-bottom:12px">공고별 세부 성과</h6><div class="tbl-wrap"><table class="tbl"><thead><tr><th>공고</th><th>상태</th><th>조회수</th><th>지원</th><th>선발</th><th>선발률</th></tr></thead><tbody>' +
          jobs.map(function (j) {
            var js = Store.jobStats(j.id);
            return '<tr><td>' + esc(j.title) + '</td><td>' + OB.badge(Store.jobState(j)) + '</td><td>' + OB.fmt(j.views) + '</td><td>' + js.applications + '</td><td>' + js.pass + '</td><td><b>' + js.rate + '%</b></td></tr>';
          }).join('') + '</tbody></table></div>' : '<div class="empty-state"><div class="art">📄</div><h6>이 파트너의 게시 공고가 없습니다</h6></div>') +
        '<p class="hint" style="margin-top:18px">※ 참여완료 ' + done.length + '건 · 본 리포트의 모든 수치는 플랫폼 지원 데이터에서 실시간 집계됩니다. 실서비스에서는 만족도·후속연결 지표가 함께 포함됩니다.</p>' +
        '</div>';
    },
    after: function () {
      document.getElementById('rp-partner').addEventListener('change', function (e) {
        rpPartner = e.target.value; V._rr();
      });
    }
  };

  V._rr = function () { w.dispatchEvent(new HashChangeEvent('hashchange')); };
})(window);
