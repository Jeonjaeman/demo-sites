(function () {
  "use strict";

  var data = JSON.parse(JSON.stringify(window.MOST_DATA));
  var filter = { status: "", district: "" };

  function statusLabel(status) {
    return { pending: "승인대기", approved: "승인완료", rejected: "반려" }[status];
  }

  function badge(status) {
    return '<span class="badge badge--' + status + '">' + statusLabel(status) + "</span>";
  }

  function toast(message) {
    var region = document.getElementById("toast-region");
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    region.appendChild(el);
    window.setTimeout(function () { el.remove(); }, 2600);
  }

  function filteredListings() {
    return data.listings.filter(function (item) {
      return (!filter.status || item.status === filter.status) && (!filter.district || item.district === filter.district);
    });
  }

  function renderStats() {
    var counts = data.listings.reduce(function (memo, item) {
      memo[item.status] += 1;
      return memo;
    }, { pending: 0, approved: 0, rejected: 0 });
    document.getElementById("admin-stats").innerHTML = [
      ["승인대기", counts.pending],
      ["승인완료", counts.approved],
      ["반려", counts.rejected],
      ["신고", data.reports.length]
    ].map(function (item) {
      return '<article><span>' + item[0] + '</span><strong data-count="' + item[1] + '">' + item[1] + "</strong></article>";
    }).join("");
  }

  function renderQueue() {
    document.getElementById("queue-body").innerHTML = filteredListings().map(function (item) {
      return "<tr><td><strong>" + item.titleKo + "</strong><small>" + item.id + "</small></td><td>" + item.district + "</td><td>" + item.provider + "<small>" + (item.providerNo || "직거래") + "</small></td><td>" + item.ad + "</td><td>" + badge(item.status) + "</td><td>" +
        '<button class="btn btn--small" data-action="approved" data-id="' + item.id + '">승인</button> <button class="btn btn--small btn--risk" data-action="rejected" data-id="' + item.id + '">반려</button></td></tr>';
    }).join("") || '<tr><td colspan="6">조건에 맞는 매물이 없습니다.</td></tr>';
  }

  function renderPanels() {
    document.getElementById("report-list").innerHTML = data.reports.map(function (item) {
      return '<div class="stack-row"><strong>' + item.id + " " + item.reason + '</strong><span>' + item.target + " · " + item.status + " · " + item.created + "</span></div>";
    }).join("");
    document.getElementById("freshness-list").innerHTML = data.content.map(function (item) {
      return '<div class="stack-row"><strong>' + item.titleKo + '</strong><span>출처 ' + item.source + " · 최종검토일 " + item.reviewed + "</span></div>";
    }).join("");
    document.getElementById("ad-list").innerHTML = data.ads.map(function (item) {
      return '<div class="stack-row"><strong>' + item.label + '</strong><span>' + item.owner + " · " + item.status + "</span></div>";
    }).join("");
  }

  function renderAll() {
    renderStats();
    renderQueue();
    renderPanels();
  }

  function downloadCsv() {
    var rows = [["id", "title", "district", "provider", "status", "reviewed"]].concat(data.listings.map(function (item) {
      return [item.id, item.titleKo, item.district, item.provider, statusLabel(item.status), item.reviewed];
    }));
    var csv = "\ufeff" + rows.map(function (row) {
      return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\r\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "most-listings.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    toast("CSV 다운로드를 시작했습니다.");
  }

  function bind() {
    var form = document.getElementById("admin-filter");
    form.addEventListener("input", function () {
      filter.status = form.status.value;
      filter.district = form.district.value;
      renderQueue();
    });
    document.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-action]");
      if (!btn) return;
      var item = data.listings.find(function (listing) { return listing.id === btn.dataset.id; });
      item.status = btn.dataset.action;
      renderAll();
      toast(item.id + " 상태가 " + statusLabel(item.status) + "로 변경되었습니다.");
    });
    document.getElementById("csv-download").addEventListener("click", downloadCsv);
  }

  function reveal() {
    if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) entry.target.classList.add("is-visible"); });
      });
      document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });
    } else {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
    }
  }

  bind();
  renderAll();
  reveal();
})();
