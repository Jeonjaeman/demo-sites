/* CONFETTI 관리자 — 응답 실집계·엑셀(.xls)·CSV·인쇄용 QR. 모든 데이터 가상. */
(function () {
  'use strict';

  var Q1 = ['지나가다 들렀어요', 'SNS·온라인 홍보를 봤어요', '지인 추천', '경품 이벤트 때문에요'];
  var Q3 = ['제품 체험', '스태프 설명', '부스 분위기·디자인', '기념품·경품', '포토존'];
  var Q4 = ['꼭 구매하고 싶어요', '조금 더 알아보고요', '나중에 필요할 때요', '아직은 잘 모르겠어요'];
  var TXT_SAMPLES = ['포토존이 진짜 귀여웠어요! 사진 잘 나와요', '스태프분이 친절하게 설명해 주셨어요', '굿즈 종류가 더 다양했으면 좋겠어요',
    '체험 대기줄이 조금 길었어요', '음료 나눔 최고… 내년에도 와주세요', '설문이 1분 만에 끝나서 좋네요'];

  /* ---------- 가상 샘플 200건 (시드 고정 의사난수 — 실집계) ---------- */
  function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rnd = mulberry(20260805);
  function pick(arr, w) {
    var r = rnd() * w.reduce(function (a, b) { return a + b; }, 0);
    for (var i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
  }
  var SAMPLES = [];
  for (var i = 0; i < 200; i++) {
    var checks = Q3.filter(function () { return rnd() < 0.38; });
    if (!checks.length) checks = [Q3[Math.floor(rnd() * Q3.length)]];
    SAMPLES.push({
      at: '2026-08-0' + (1 + Math.floor(rnd() * 4)) + 'T' + String(10 + Math.floor(rnd() * 9)).padStart(2, '0') + ':' + String(Math.floor(rnd() * 60)).padStart(2, '0') + ':00',
      answers: {
        q1: pick(Q1, [38, 26, 14, 22]),
        q2: pick([1, 2, 3, 4, 5], [2, 5, 18, 45, 30]),
        q3: checks,
        q4: pick(Q4, [18, 34, 28, 20]),
        q5: rnd() < 0.25 ? TXT_SAMPLES[Math.floor(rnd() * TXT_SAMPLES.length)] : ''
      }
    });
  }

  function loadLive() {
    try { return JSON.parse(localStorage.getItem('confetti_responses') || '[]'); } catch (e) { return []; }
  }
  function all() { return SAMPLES.concat(loadLive()); }

  function toast(msg, sun) {
    var w = document.getElementById('toastWrap');
    var t = document.createElement('div');
    t.className = 'toast' + (sun ? ' sun' : ''); t.textContent = msg;
    w.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2100);
    setTimeout(function () { t.remove(); }, 2500);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- KPI ---------- */
  var rows = all();
  var live = loadLive().length;
  var avg = rows.reduce(function (a, r) { return a + (+r.answers.q2 || 0); }, 0) / rows.length;
  var buyHigh = rows.filter(function (r) { return r.answers.q4 === Q4[0] || r.answers.q4 === Q4[1]; }).length;
  document.getElementById('kpis').innerHTML =
    '<div class="kpi"><div class="v">' + rows.length + '<em>건</em></div><div class="k">총 응답 (샘플 200 + 실제 제출 ' + live + ')</div></div>' +
    '<div class="kpi"><div class="v">' + avg.toFixed(2) + '</div><div class="k">평균 만족도 (5점 만점)</div></div>' +
    '<div class="kpi"><div class="v">' + Math.round(buyHigh / rows.length * 100) + '<em>%</em></div><div class="k">구매 의향 상위 2단계</div></div>' +
    '<div class="kpi"><div class="v">' + rows.filter(function (r) { return (r.answers.q5 || '').length > 0; }).length + '<em>건</em></div><div class="k">주관식 의견</div></div>';

  /* ---------- 바 차트 ---------- */
  function bars(elId, labels, counts, total) {
    var mx = Math.max.apply(null, counts.concat([1]));
    document.getElementById(elId).innerHTML = labels.map(function (l, i) {
      var pct = total ? Math.round(counts[i] / total * 100) : 0;
      return '<div class="bar-row"><span class="bl">' + esc(l) + '</span>' +
        '<div class="bar-track"><div class="bar-fill" data-w="' + Math.round(counts[i] / mx * 100) + '"></div></div>' +
        '<span class="bv">' + counts[i] + ' · ' + pct + '%</span></div>';
    }).join('');
  }
  bars('barQ1', Q1, Q1.map(function (o) { return rows.filter(function (r) { return r.answers.q1 === o; }).length; }), rows.length);
  bars('barQ2', ['★5', '★4', '★3', '★2', '★1'], [5, 4, 3, 2, 1].map(function (n) { return rows.filter(function (r) { return +r.answers.q2 === n; }).length; }), rows.length);
  bars('barQ3', Q3, Q3.map(function (o) { return rows.filter(function (r) { return (r.answers.q3 || []).indexOf(o) >= 0; }).length; }), rows.length);
  bars('barQ4', Q4, Q4.map(function (o) { return rows.filter(function (r) { return r.answers.q4 === o; }).length; }), rows.length);
  setTimeout(function () {
    [].forEach.call(document.querySelectorAll('.bar-fill'), function (f) { f.style.width = f.dataset.w + '%'; });
  }, 80);

  /* ---------- 주관식 ---------- */
  var txts = rows.filter(function (r) { return (r.answers.q5 || '').trim(); }).slice(-8).reverse();
  document.getElementById('txtCount').textContent = '최근 ' + txts.length + '건 표시';
  document.getElementById('txtList').innerHTML = txts.map(function (r) {
    return '<div class="txt-item">' + esc(r.answers.q5) + '<div class="ti-meta">' + r.at.replace('T', ' ').slice(0, 16) + '</div></div>';
  }).join('');

  /* ---------- 엑셀(.xls SpreadsheetML) — 공고 문구 그대로 Excel 포맷 ---------- */
  document.getElementById('btnXls').addEventListener('click', function () {
    var head = ['제출일시', 'Q1 방문경로', 'Q2 만족도', 'Q3 좋았던 점', 'Q4 구매의향', 'Q5 의견'];
    var xmlRows = ['<Row>' + head.map(function (h) { return '<Cell ss:StyleID="h"><Data ss:Type="String">' + h + '</Data></Cell>'; }).join('') + '</Row>'];
    all().forEach(function (r) {
      var a = r.answers;
      var cells = [r.at.replace('T', ' ').slice(0, 16), a.q1 || '', String(a.q2 || ''), (a.q3 || []).join(' · '), a.q4 || '', a.q5 || ''];
      xmlRows.push('<Row>' + cells.map(function (c, i) {
        var t = i === 2 && c ? 'Number' : 'String';
        return '<Cell><Data ss:Type="' + t + '">' + String(c).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</Data></Cell>';
      }).join('') + '</Row>');
    });
    var xml = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
      '<Styles><Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#FFC933" ss:Pattern="Solid"/></Style></Styles>' +
      '<Worksheet ss:Name="응답"><Table>' + xmlRows.join('') + '</Table></Worksheet></Workbook>';
    dl(new Blob([xml], { type: 'application/vnd.ms-excel' }), 'confetti_responses_2026-08-05.xls');
    toast('엑셀 파일을 내려받았어요 — ' + all().length + '건', true);
  });

  /* ---------- CSV ---------- */
  document.getElementById('btnCsv').addEventListener('click', function () {
    var lines = ['제출일시,Q1 방문경로,Q2 만족도,Q3 좋았던 점,Q4 구매의향,Q5 의견'];
    all().forEach(function (r) {
      var a = r.answers;
      lines.push([r.at.replace('T', ' ').slice(0, 16), a.q1 || '', a.q2 || '', '"' + (a.q3 || []).join('·') + '"', a.q4 || '', '"' + String(a.q5 || '').replace(/"/g, '""') + '"'].join(','));
    });
    dl(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), 'confetti_responses.csv');
    toast('CSV를 내려받았어요');
  });

  function dl(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  /* ---------- QR (인쇄용 PNG) ---------- */
  var url = location.origin + location.pathname.replace(/admin\.html$/, 'index.html');
  document.getElementById('qrLink').value = url;
  if (window.QRCode) {
    new QRCode(document.getElementById('qrBox'), { text: url, width: 176, height: 176, correctLevel: QRCode.CorrectLevel.M });
  }
  document.getElementById('btnQrPng').addEventListener('click', function () {
    var cv = document.querySelector('#qrBox canvas');
    var img = document.querySelector('#qrBox img');
    var src = cv ? cv.toDataURL('image/png') : (img ? img.src : null);
    if (!src) { toast('QR 생성 실패 — 링크를 복사해 주세요'); return; }
    var a = document.createElement('a');
    a.href = src; a.download = 'confetti_booth_qr.png';
    document.body.appendChild(a); a.click(); a.remove();
    toast('인쇄용 QR PNG를 내려받았어요 — X배너 인쇄소 전달용', true);
  });
  document.getElementById('copyLink').addEventListener('click', function () {
    var inp = document.getElementById('qrLink');
    inp.select();
    try { document.execCommand('copy'); toast('링크를 복사했어요', true); } catch (e) {}
  });
})();
