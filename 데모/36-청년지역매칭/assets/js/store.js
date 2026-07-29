/* ============================================================
   OUTBOUNDER store.js — localStorage 영속 계층 (단일 진실원천)
   - 두 셸(app/admin)이 동일 키를 공유. 재진입 시 재독으로 동기화.
   - schemaVersion 불일치 시 자동 리시드. "데모 초기화"로 수동 리셋.
   ============================================================ */
(function (w) {
  'use strict';
  var NS = 'outbounder.v1';
  var SCHEMA_VERSION = 3;

  function readAll() {
    try {
      var raw = localStorage.getItem(NS);
      if (!raw) return null;
      var db = JSON.parse(raw);
      if (!db || db.schemaVersion !== SCHEMA_VERSION) return null; // 버전 불일치 → 리시드
      return db;
    } catch (e) { return null; }
  }
  function writeAll(db) {
    db.schemaVersion = SCHEMA_VERSION;
    try { localStorage.setItem(NS, JSON.stringify(db)); }
    catch (e) { /* file:// 프라이빗 모드 등 — 인메모리로 우아한 저하 */ }
    mem = db;
  }
  var mem = null; // localStorage 불가 환경 폴백

  function db() {
    var d = mem || readAll();
    if (!d) {
      d = (w.OB_SEED && w.OB_SEED.build()) || { schemaVersion: SCHEMA_VERSION };
      writeAll(d);
    }
    mem = d;
    return d;
  }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function today() { return new Date().toISOString().slice(0, 10); }

  var Store = {
    /* ---------- 원시 접근 ---------- */
    all: db,
    reset: function () {
      try { localStorage.removeItem(NS); } catch (e) {}
      mem = null;
      return db();
    },
    refresh: function () { mem = null; return db(); }, // 재진입 재독

    /* ---------- 공고 (jobs) ---------- */
    jobs: function () { return db().jobs.slice(); },
    job: function (id) { return db().jobs.find(function (j) { return j.id === id; }) || null; },
    publishedJobs: function () {
      return db().jobs.filter(function (j) { return j.published; });
    },
    saveJob: function (job) {
      var d = db();
      if (!job.id) { job.id = uid('job'); job.views = job.views || 0; d.jobs.push(job); }
      else {
        var i = d.jobs.findIndex(function (j) { return j.id === job.id; });
        if (i >= 0) d.jobs[i] = job; else d.jobs.push(job);
      }
      writeAll(d); return job;
    },
    duplicateJob: function (id) {
      var src = Store.job(id); if (!src) return null;
      var copy = JSON.parse(JSON.stringify(src));
      copy.id = uid('job');
      copy.title = src.title + ' (복제)';
      copy.published = false; copy.status = 'draft'; copy.views = 0;
      db().jobs.push(copy); writeAll(db()); return copy;
    },
    deleteJob: function (id) {
      var d = db();
      d.jobs = d.jobs.filter(function (j) { return j.id !== id; });
      writeAll(d);
    },
    addView: function (jobId) {
      var j = Store.job(jobId);
      if (j) { j.views = (j.views || 0) + 1; writeAll(db()); }
    },
    /* 마감일 기반 상태 계산: open / closing(D-7) / closed */
    jobState: function (job) {
      if (!job.published) return 'draft';
      var dd = Store.dday(job.deadline);
      if (dd < 0) return 'closed';
      if (job.status === 'closed') return 'closed';
      if (dd <= 7) return 'closing';
      return 'open';
    },
    dday: function (dateStr) {
      var t = new Date(); t.setHours(0, 0, 0, 0);
      var d = new Date(dateStr + 'T00:00:00');
      return Math.round((d - t) / 86400000);
    },

    /* ---------- 프로그램 ---------- */
    programs: function () { return db().programs.slice(); },
    program: function (id) { return db().programs.find(function (p) { return p.id === id; }) || null; },
    saveProgram: function (p) {
      var d = db();
      if (!p.id) { p.id = uid('prg'); d.programs.push(p); }
      else {
        var i = d.programs.findIndex(function (x) { return x.id === p.id; });
        if (i >= 0) d.programs[i] = p; else d.programs.push(p);
      }
      writeAll(d); return p;
    },

    /* ---------- 프로필 (청년 데모 사용자) ---------- */
    profile: function () { return db().profile; },
    saveProfile: function (patch) {
      var d = db();
      Object.keys(patch).forEach(function (k) { d.profile[k] = patch[k]; });
      writeAll(d); return d.profile;
    },
    isLoggedIn: function () { return !!db().profile.loggedIn; },
    login: function () { var d = db(); d.profile.loggedIn = true; writeAll(d); },
    logout: function () { var d = db(); d.profile.loggedIn = false; writeAll(d); },
    onboarded: function () { return !!db().profile.onboarded; },

    /* ---------- 매칭 점수 (온보딩 프로필 × 공고 태그) ---------- */
    matchScore: function (job) {
      var p = db().profile;
      if (!p.onboarded) return null;
      var score = 40, reasons = [], gaps = [];
      var skills = p.skills || [], regions = p.regions || [], fields = p.fields || [];
      (job.tags || []).forEach(function (t) {
        if (skills.indexOf(t) >= 0) { score += 12; reasons.push(t); }
        else gaps.push(t);
      });
      if (regions.indexOf(job.region) >= 0) { score += 15; reasons.push(job.region + ' 선호'); }
      if (fields.indexOf(job.field) >= 0) { score += 15; reasons.push(job.field + ' 직무'); }
      score = Math.max(35, Math.min(98, score));
      return { score: score, reasons: reasons.slice(0, 4), gaps: gaps.slice(0, 3) };
    },

    /* ---------- 지원서 (applications) — 폐쇄순환의 심장 ---------- */
    applications: function () { return db().applications.slice(); },
    application: function (id) { return db().applications.find(function (a) { return a.id === id; }) || null; },
    myApplications: function () {
      return db().applications.filter(function (a) { return a.mine; });
    },
    hasApplied: function (jobId) {
      return db().applications.some(function (a) { return a.mine && a.jobId === jobId; });
    },
    submitApplication: function (payload) {
      var d = db();
      var app = {
        id: uid('app'),
        no: 'OB-' + today().replace(/-/g, '') + '-' + String(d.applications.length + 1).padStart(3, '0'),
        jobId: payload.jobId,
        name: payload.name, email: payload.email, phone: payload.phone,
        motivation: payload.motivation, exp: payload.exp,
        skills: payload.skills || [],
        files: payload.files || [], // {name,size} 메타만 — 실파일 미보존(데모)
        status: 'applied',          // applied → review → pass | fail
        mine: true,
        appliedAt: today(),
        evals: [],                  // {score, role, comment}
        memo: ''
      };
      d.applications.push(app);
      writeAll(d);
      return app;
    },
    setAppStatus: function (id, status) {
      var a = Store.application(id);
      if (a) { a.status = status; writeAll(db()); }
      return a;
    },
    addEval: function (id, ev) {
      var a = Store.application(id);
      if (a) { a.evals.push(ev); writeAll(db()); }
      return a;
    },

    /* ---------- 회원 (members — 청년 인재) ---------- */
    members: function () { return db().members.slice(); },
    member: function (id) { return db().members.find(function (m) { return m.id === id; }) || null; },
    toggleMember: function (id) {
      var m = Store.member(id);
      if (m) { m.active = !m.active; writeAll(db()); }
      return m;
    },
    addMemberMemo: function (id, text) {
      var m = Store.member(id);
      if (m) { m.memos.push({ text: text, at: today() }); writeAll(db()); }
      return m;
    },

    /* ---------- 콘텐츠 (contents — 자체 아카이빙) ---------- */
    contents: function () { return db().contents.slice(); },
    content: function (id) { return db().contents.find(function (c) { return c.id === id; }) || null; },
    publishedContents: function () {
      return db().contents.filter(function (c) { return c.published; })
        .sort(function (a, b) { return b.at < a.at ? -1 : 1; });
    },
    saveContent: function (c) {
      var d = db();
      if (!c.id) { c.id = uid('cnt'); c.at = today(); d.contents.push(c); }
      else {
        var i = d.contents.findIndex(function (x) { return x.id === c.id; });
        if (i >= 0) d.contents[i] = c; else d.contents.push(c);
      }
      writeAll(d); return c;
    },
    deleteContent: function (id) {
      var d = db();
      d.contents = d.contents.filter(function (c) { return c.id !== id; });
      writeAll(d);
    },

    /* ---------- 통계: 전부 applications/jobs에서 파생 (하드코딩 금지) ---------- */
    stats: function () {
      var d = db();
      var apps = d.applications;
      var pubJobs = d.jobs.filter(function (j) { return j.published; });
      var pass = apps.filter(function (a) { return a.status === 'pass'; });
      var done = apps.filter(function (a) { return a.completed; });
      var views = d.jobs.reduce(function (s, j) { return s + (j.views || 0); }, 0);
      var satisf = d.surveys.length
        ? (d.surveys.reduce(function (s, x) { return s + x.rating; }, 0) / d.surveys.length)
        : 0;
      var follow = { employed: 0, founded: 0, rejoined: 0 };
      done.forEach(function (a) { if (a.followUp && follow[a.followUp] !== undefined) follow[a.followUp]++; });
      return {
        jobs: pubJobs.length,
        applications: apps.length,
        selectRate: apps.length ? Math.round((pass.length / apps.length) * 100) : 0,
        completeRate: pass.length ? Math.round((done.length / pass.length) * 100) : 0,
        satisfaction: Math.round(satisf * 10) / 10,
        views: views,
        pass: pass.length, done: done.length, follow: follow,
        funnel: [
          { label: '지원', n: apps.length },
          { label: '선발', n: pass.length },
          { label: '참여완료', n: done.length },
          { label: '후속연결', n: follow.employed + follow.founded + follow.rejoined }
        ]
      };
    },
    /* 공고별 집계 */
    jobStats: function (jobId) {
      var apps = db().applications.filter(function (a) { return a.jobId === jobId; });
      var pass = apps.filter(function (a) { return a.status === 'pass'; });
      return { applications: apps.length, pass: pass.length,
        rate: apps.length ? Math.round((pass.length / apps.length) * 100) : 0 };
    },
    surveys: function () { return db().surveys.slice(); },
    addSurvey: function (appId, rating, comment) {
      var d = db();
      if (!d.surveys.some(function (s) { return s.appId === appId; })) {
        d.surveys.push({ appId: appId, rating: rating, comment: comment || '' });
        writeAll(d);
      }
    },
    trend: function () { return db().trend.slice(); },
    partners: function () { return db().partners.slice(); },

    /* ---------- CSV 직렬화 + 실다운로드 ---------- */
    toCSV: function (rows, headers) {
      var esc = function (v) {
        v = v == null ? '' : String(v);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      };
      var lines = [headers.map(esc).join(',')];
      rows.forEach(function (r) { lines.push(r.map(esc).join(',')); });
      return '﻿' + lines.join('\n'); // BOM — 엑셀 한글 호환
    },
    downloadCSV: function (filename, csv) {
      try {
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
      } catch (e) { // file:// 일부 브라우저 폴백
        location.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      }
    },

    /* ---------- HTML 이스케이프 (콘텐츠 발행 XSS 방어) ---------- */
    esc: function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    /* 개행 → <p> (이스케이프 후) */
    toParagraphs: function (s) {
      return String(s || '').split(/\n{2,}/).map(function (p) {
        return '<p>' + Store.esc(p).replace(/\n/g, '<br>') + '</p>';
      }).join('');
    },

    uid: uid, today: today
  };

  w.Store = Store;

  /* ---------- 콘솔 단위 어서션 (M1 게이트) — Store.selfTest() ---------- */
  Store.selfTest = function () {
    var results = [], ok = function (name, cond) { results.push((cond ? 'PASS' : 'FAIL') + ' — ' + name); };
    var before = Store.applications().length;
    var app = Store.submitApplication({ jobId: Store.publishedJobs()[0].id, name: '테스트', email: 't@t.kr', phone: '010', motivation: 'x', exp: 'y', files: [{ name: 'a.pdf', size: 1000 }] });
    ok('지원서 생성', Store.applications().length === before + 1);
    Store.setAppStatus(app.id, 'pass');
    ok('상태 변경', Store.application(app.id).status === 'pass');
    var csv = Store.toCSV([['가,나', 'x"y']], ['A', 'B']);
    ok('CSV 이스케이프', csv.indexOf('"가,나"') > 0 && csv.indexOf('"x""y"') > 0);
    var ms = Store.matchScore(Store.publishedJobs()[0]);
    ok('매칭점수 범위', ms === null || (ms.score >= 35 && ms.score <= 98));
    ok('이스케이프', Store.esc('<b>&"') === '&lt;b&gt;&amp;&quot;');
    var d = db(); d.applications = d.applications.filter(function (a) { return a.id !== app.id; }); writeAll(d);
    ok('정리 후 원복', Store.applications().length === before);
    console.log('%cOUTBOUNDER store selfTest', 'font-weight:bold', '\n' + results.join('\n'));
    return results.every(function (r) { return r.indexOf('PASS') === 0; });
  };
})(window);
