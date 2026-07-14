(() => {
  "use strict";
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  class LocalLineChart {
    constructor(host) {
      this.host = host;
      this.canvas = host.querySelector("[data-chart-canvas]");
      this.context = this.canvas.getContext("2d");
      this.tooltip = host.querySelector("[data-chart-tooltip]");
      this.live = host.querySelector("[data-chart-live]");
      this.summary = host.querySelector("[data-chart-summary]");
      this.legend = host.querySelector("[data-chart-legend]");
      this.tableBody = host.querySelector("[data-chart-table]");
      this.range = "24h";
      this.hiddenSeries = new Set();
      this.points = [];
      this.resizeObserver = new ResizeObserver(() => this.draw());
      this.resizeObserver.observe(this.canvas);
      this.bind();
      this.renderLegend();
      this.update();
    }

    bind() {
      this.host.closest(".panel").addEventListener("click", (event) => {
        const rangeButton = event.target.closest("[data-range]");
        if (rangeButton) {
          this.range = rangeButton.dataset.range;
          rangeButton.closest(".segmented").querySelectorAll("[data-range]").forEach((button) => {
            button.setAttribute("aria-pressed", String(button === rangeButton));
          });
          this.update();
        }
        const tableButton = event.target.closest("[data-table-toggle]");
        if (tableButton) {
          const wrap = this.host.querySelector("[data-chart-table-wrap]");
          const willOpen = wrap.hidden;
          wrap.hidden = !willOpen;
          tableButton.setAttribute("aria-expanded", String(willOpen));
          tableButton.textContent = willOpen ? "표 닫기" : "데이터 표";
        }
        const legendButton = event.target.closest("[data-series]");
        if (legendButton) {
          const key = legendButton.dataset.series;
          if (this.hiddenSeries.has(key)) this.hiddenSeries.delete(key);
          else this.hiddenSeries.add(key);
          legendButton.setAttribute("aria-pressed", String(!this.hiddenSeries.has(key)));
          this.draw();
        }
      });
      this.canvas.addEventListener("pointermove", (event) => this.onPointerMove(event));
      this.canvas.addEventListener("pointerleave", () => { this.tooltip.hidden = true; });
      this.canvas.addEventListener("focus", () => this.showPoint(this.points.at(-1)));
      this.canvas.addEventListener("blur", () => { this.tooltip.hidden = true; });
      this.canvas.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !this.points.length) return;
        event.preventDefault();
        const current = Math.max(0, this.points.findIndex((point) => point.row.label === this.focusedLabel));
        const next = event.key === "Home" ? 0 : event.key === "End" ? this.points.length - 1 : event.key === "ArrowLeft" ? Math.max(0, current - 1) : Math.min(this.points.length - 1, current + 1);
        this.showPoint(this.points[next]);
      });
    }

    renderLegend() {
      this.legend.replaceChildren();
      [
        { key: "actual", label: "유효전력", color: "--color-signal-600", dashed: false },
        { key: "target", label: "목표 부하", color: "--color-data-cyan", dashed: true }
      ].forEach((series) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "legend-button";
        button.dataset.series = series.key;
        button.dataset.dashed = String(series.dashed);
        button.setAttribute("aria-pressed", "true");
        button.style.setProperty("--legend-color", css(series.color));
        button.textContent = series.label;
        this.legend.append(button);
      });
    }

    update() {
      try {
        this.rows = window.VoltGuardData.queryLoadSeries(this.range);
      } catch {
        this.renderError();
        return;
      }
      if (!Array.isArray(this.rows) || this.rows.some((row) => row === null || typeof row !== "object" || !Number.isFinite(row.actual) || !Number.isFinite(row.target))) {
        this.renderError();
        return;
      }
      if (this.rows.length === 0) {
        this.renderEmpty();
        return;
      }
      const values = this.rows.map((row) => row.actual);
      const period = this.range === "7d" ? "최근 7일" : "24시간";
      this.summary.classList.remove("status", "status--danger");
      this.summary.textContent = period + " 유효전력은 최저 " + Math.min(...values).toLocaleString("ko-KR") + "kW, 최고 " + Math.max(...values).toLocaleString("ko-KR") + "kW이며 현재 " + values.at(-1).toLocaleString("ko-KR") + "kW입니다.";
      this.canvas.setAttribute("aria-label", this.summary.textContent);
      this.renderTable();
      this.draw();
    }

    renderTable() {
      this.tableBody.replaceChildren();
      this.rows.forEach((row) => {
        const tr = document.createElement("tr");
        [row.label, row.actual.toLocaleString("ko-KR"), row.target.toLocaleString("ko-KR")].forEach((value) => {
          const td = document.createElement("td");
          td.textContent = value;
          tr.append(td);
        });
        this.tableBody.append(tr);
      });
    }

    prepareCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      this.canvas.width = Math.round(rect.width * ratio);
      this.canvas.height = Math.round(rect.height * ratio);
      this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
      return { width: rect.width, height: rect.height };
    }

    draw() {
      if (!this.rows || !this.rows.length) return;
      const size = this.prepareCanvas();
      const width = size.width;
      const height = size.height;
      const ctx = this.context;
      const plot = { left: 44, right: width - 14, top: 18, bottom: height - 30 };
      const allValues = this.rows.flatMap((row) => [row.actual, row.target]);
      const min = Math.floor(Math.min(...allValues) / 200) * 200;
      const max = Math.ceil(Math.max(...allValues) / 200) * 200;
      const y = (value) => plot.bottom - ((value - min) / Math.max(max - min, 1)) * (plot.bottom - plot.top);
      const x = (index) => plot.left + (index / Math.max(this.rows.length - 1, 1)) * (plot.right - plot.left);
      ctx.clearRect(0, 0, width, height);
      ctx.font = "12px " + css("--font-sans");
      ctx.fillStyle = css("--color-text-500");
      ctx.strokeStyle = css("--color-border-subtle");
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i += 1) {
        const py = plot.top + ((plot.bottom - plot.top) / 4) * i;
        const value = Math.round(max - ((max - min) / 4) * i);
        ctx.beginPath();
        ctx.moveTo(plot.left, py);
        ctx.lineTo(plot.right, py);
        ctx.stroke();
        ctx.fillText(value.toLocaleString("ko-KR"), 2, py + 4);
      }
      this.rows.forEach((row, index) => {
        const lastIndex = this.rows.length - 1;
        const interval = Math.ceil(this.rows.length / 6);
        if (index % interval !== 0 && index !== lastIndex) return;
        const labelWidth = ctx.measureText(row.label).width;
        const pointX = x(index);
        if (index !== lastIndex && x(lastIndex) - pointX < labelWidth + 10) return;
        const labelX = index === 0 ? plot.left : index === lastIndex ? plot.right - labelWidth : pointX - labelWidth / 2;
        ctx.fillText(row.label, labelX, height - 8);
      });
      const drawSeries = (key, color, dashed) => {
        if (this.hiddenSeries.has(key)) return;
        ctx.beginPath();
        ctx.strokeStyle = css(color);
        ctx.lineWidth = key === "actual" ? 3 : 2;
        ctx.setLineDash(dashed ? [7, 5] : []);
        this.rows.forEach((row, index) => {
          const pointX = x(index);
          const pointY = y(row[key]);
          if (index === 0) ctx.moveTo(pointX, pointY);
          else ctx.lineTo(pointX, pointY);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      };
      drawSeries("target", "--color-data-cyan", true);
      drawSeries("actual", "--color-signal-600", false);
      this.points = this.rows.map((row, index) => ({ x: x(index), y: y(row.actual), row }));
      const last = this.points.at(-1);
      if (last && !this.hiddenSeries.has("actual")) {
        ctx.fillStyle = css("--color-surface");
        ctx.strokeStyle = css("--color-signal-600");
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    onPointerMove(event) {
      if (!this.points.length) return;
      const rect = this.canvas.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const nearest = this.points.reduce((best, point) => Math.abs(point.x - pointerX) < Math.abs(best.x - pointerX) ? point : best);
      this.showPoint(nearest);
    }

    showPoint(point) {
      if (!point) return;
      const rect = this.canvas.getBoundingClientRect();
      const label = document.createElement("strong");
      const actual = document.createElement("span");
      const target = document.createElement("span");
      this.focusedLabel = point.row.label;
      label.textContent = String(point.row.label);
      actual.textContent = "유효전력 " + point.row.actual.toLocaleString("ko-KR") + " kW";
      target.textContent = "목표 " + point.row.target.toLocaleString("ko-KR") + " kW";
      this.tooltip.replaceChildren(label, actual, target);
      this.tooltip.style.left = Math.max(72, Math.min(rect.width - 72, point.x)) + "px";
      this.tooltip.style.top = Math.max(76, point.y) + "px";
      this.tooltip.hidden = false;
      this.live.textContent = point.row.label + ", 유효전력 " + point.row.actual + "킬로와트, 목표 " + point.row.target + "킬로와트";
    }

    resetState(message, danger) {
      this.rows = [];
      this.points = [];
      this.focusedLabel = "";
      this.tooltip.hidden = true;
      this.tooltip.replaceChildren();
      this.live.textContent = "";
      this.tableBody.replaceChildren();
      this.summary.textContent = message;
      this.summary.classList.toggle("status", danger);
      this.summary.classList.toggle("status--danger", danger);
      this.canvas.setAttribute("aria-label", message);
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderEmpty() {
      this.resetState("선택 기간에 표시할 데이터가 없습니다.", false);
    }

    renderError() {
      this.resetState("데이터 형식 오류입니다. 로컬 어댑터 입력을 확인하세요.", true);
    }

    destroy() {
      this.resizeObserver.disconnect();
    }
  }
  window.LocalLineChart = LocalLineChart;
})();
