/* 관리자 — 로그인 게이트 + 응답 테이블 + 엑셀(CSV) 다운로드 */
(() => {
  NX.ensureSeed();

  const $ = id => document.getElementById(id);
  let filter = 'ALL';

  /* ---------- 로그인 게이트 (데모: admin / nexa2026) ---------- */
  const gate = $('login-gate');
  if (sessionStorage.getItem('nx22_admin') !== '1') {
    gate.classList.remove('hidden');
  }
  $('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const ok = $('login-id').value.trim() === 'admin' && $('login-pw').value === 'nexa2026';
    if (ok) {
      sessionStorage.setItem('nx22_admin', '1');
      gate.classList.add('hidden');
    } else {
      $('login-err').textContent = '아이디 또는 비밀번호가 올바르지 않습니다.';
    }
  });

  function render() {
    const t = NX.totals();
    $('s-all').textContent = t.all;
    $('s-k1').textContent = t.k1;
    $('s-k2').textContent = t.k2;
    $('s-last').textContent = t.last ? new Date(t.last).toLocaleString('ko-KR') : '—';

    const rows = NX.load()
      .filter(r => filter === 'ALL' || r.kiosk === filter)
      .slice()
      .reverse();

    const tbody = $('tbody');
    tbody.innerHTML = '';
    if (!rows.length) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="9">표시할 응답이 없습니다.</td></tr>';
      return;
    }
    rows.forEach((r, i) => {
      const tr = document.createElement('tr');
      const a = r.answers || [];
      tr.innerHTML =
        '<td>' + (rows.length - i) + '</td>' +
        '<td style="font-family:monospace">' + r.id + '</td>' +
        '<td><span class="pill ' + (r.kiosk === 'K1' ? 'k1">키오스크 1' : 'k2">키오스크 2') + '</span></td>' +
        '<td>' + new Date(r.ts).toLocaleString('ko-KR') + '</td>' +
        '<td>' + (a[0] || '—') + '</td>' +
        '<td>' + (a[1] || '—') + '</td>' +
        '<td>' + (a[2] || '—') + '</td>' +
        '<td>' + (a[3] || '—') + '</td>' +
        '<td>' + (r.pick || '—') + '</td>';
      tbody.appendChild(tr);
    });
  }

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('on'));
      chip.classList.add('on');
      filter = chip.dataset.f;
      render();
    });
  });

  $('btn-excel').addEventListener('click', NX.downloadCSV);
  $('btn-demo').addEventListener('click', () => { NX.addDemoBurst(5); render(); });
  $('btn-clear').addEventListener('click', () => {
    if (confirm('모든 응답 데이터를 삭제할까요?\n(다시 접속하면 시연용 데이터가 재생성됩니다)')) {
      NX.clearAll();
      location.reload();
    }
  });

  NX.onChange(render);
  render();
})();
