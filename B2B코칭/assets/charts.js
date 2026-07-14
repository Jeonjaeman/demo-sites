/* ============================================================
   HOW BOOSTER — 순수 SVG 차트 (외부 라이브러리 없음)
   모두 viewBox 기반이라 반응형으로 자동 축소됩니다.
   ============================================================ */

const C_BRAND = '#5B4BE8', C_GRID = '#EDEFF6', C_TXT = '#727A94';

/* 가로 막대 : [[label, value, percent], ...] */
function hbar(sel, rows, o){
  o = Object.assign({ color:C_BRAND, unit:'개', labelW:118, showPct:true }, o||{});
  const w = 520, rowH = 26, h = rows.length * rowH + 26;
  const max = Math.max(...rows.map(r => r[1])) * 1.18;
  const bw = w - o.labelW - 58;
  const ticks = 5, step = Math.ceil(max / ticks / 10) * 10;
  let g = '';
  for(let i=0; i<=ticks; i++){
    const x = o.labelW + (step*i/max)*bw;
    if(x > w-40) break;
    g += `<line x1="${x}" y1="4" x2="${x}" y2="${rows.length*rowH+4}" stroke="${C_GRID}"/>
          <text x="${x}" y="${rows.length*rowH+18}" font-size="9.5" fill="${C_TXT}" text-anchor="middle">${step*i}</text>`;
  }
  const bars = rows.map((r,i) => {
    const y = i*rowH + 7, bl = Math.max(2, (r[1]/max)*bw);
    return `<text x="${o.labelW-8}" y="${y+11}" font-size="11" fill="#39405A" text-anchor="end">${r[0]}</text>
      <rect x="${o.labelW}" y="${y}" width="${bl}" height="14" rx="3" fill="${o.color}" opacity="${1 - i*0.055}">
        <animate attributeName="width" from="0" to="${bl}" dur="0.7s" fill="freeze" calcMode="spline" keySplines="0.22 0.61 0.36 1"/>
      </rect>
      <text x="${o.labelW+bl+7}" y="${y+11}" font-size="10.5" font-weight="700" fill="#39405A">${r[1]}${o.showPct&&r[2]!=null?` (${r[2]}%)`:''}</text>`;
  }).join('');
  $(sel).innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;overflow:visible">${g}${bars}</svg>`;
}

/* 도넛 : [{n,v,p,c}] */
function donut(sel, data, centerTop, centerSub){
  const size = 190, cx = size/2, cy = size/2, r = 66, sw = 26;
  const total = data.reduce((a,b) => a + b.v, 0);
  let acc = -90, arcs = '';
  data.forEach((d,i) => {
    const ang = (d.v/total) * 360;
    const s = acc*Math.PI/180, e = (acc+ang)*Math.PI/180;
    const x1 = cx + r*Math.cos(s), y1 = cy + r*Math.sin(s);
    const x2 = cx + r*Math.cos(e), y2 = cy + r*Math.sin(e);
    arcs += `<path d="M${x1} ${y1} A${r} ${r} 0 ${ang>180?1:0} 1 ${x2} ${y2}" stroke="${d.c}" stroke-width="${sw}" fill="none" stroke-linecap="butt">
      <animate attributeName="stroke-dasharray" from="0 999" to="999 0" dur="${0.5+i*0.12}s" fill="freeze"/></path>`;
    acc += ang;
  });
  $(sel).innerHTML = `<svg viewBox="0 0 ${size} ${size}" style="width:100%;max-width:200px;height:auto">
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#F2F3F8" stroke-width="${sw}" fill="none"/>
    ${arcs}
    <text x="${cx}" y="${cy-2}" font-size="11" fill="${C_TXT}" text-anchor="middle">${centerTop||''}</text>
    <text x="${cx}" y="${cy+16}" font-size="17" font-weight="800" fill="#171A28" text-anchor="middle">${centerSub||total}</text>
  </svg>`;
}

/* 라인(멀티) : {labels, series:[{n,data,c}]} */
function line(sel, cfg){
  const w = 560, h = 190, pl = 34, pr = 12, pt = 14, pb = 30;
  const iw = w-pl-pr, ih = h-pt-pb;
  const all = cfg.series.flatMap(s => s.data);
  const min = Math.max(0, Math.floor(Math.min(...all)/10)*10 - 10), max = Math.ceil(Math.max(...all)/10)*10;
  const X = i => pl + (iw/(cfg.labels.length-1))*i;
  const Y = v => pt + ih - ((v-min)/(max-min))*ih;
  let g = '';
  for(let v=min; v<=max; v+=Math.max(10,Math.round((max-min)/4/10)*10)){
    g += `<line x1="${pl}" y1="${Y(v)}" x2="${w-pr}" y2="${Y(v)}" stroke="${C_GRID}"/>
          <text x="${pl-8}" y="${Y(v)+3.5}" font-size="9.5" fill="${C_TXT}" text-anchor="end">${v}</text>`;
  }
  const xs = cfg.labels.map((l,i) => `<text x="${X(i)}" y="${h-10}" font-size="9.5" fill="${C_TXT}" text-anchor="middle">${l}</text>`).join('');
  const ls = cfg.series.map(s => {
    const d = s.data.map((v,i) => `${i?'L':'M'}${X(i)} ${Y(v)}`).join(' ');
    const dots = s.data.map((v,i) => `<circle cx="${X(i)}" cy="${Y(v)}" r="3.4" fill="#fff" stroke="${s.c}" stroke-width="2"/>
      <text x="${X(i)}" y="${Y(v)-9}" font-size="9.5" font-weight="700" fill="${s.c}" text-anchor="middle">${v}</text>`).join('');
    return `<path d="${d}" fill="none" stroke="${s.c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
       stroke-dasharray="1200" stroke-dashoffset="1200"><animate attributeName="stroke-dashoffset" to="0" dur="1s" fill="freeze"/></path>${dots}`;
  }).join('');
  const lg = cfg.series.map(s => `<span class="row" style="gap:5px"><i style="width:14px;height:2.5px;border-radius:9px;background:${s.c};display:block"></i><span style="font-size:11px;color:var(--muted)">${s.n}</span></span>`).join('');
  $(sel).innerHTML = `<div class="row" style="justify-content:flex-end;gap:12px;margin-bottom:2px">${lg}</div>
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;overflow:visible">${g}${xs}${ls}</svg>`;
}

/* 레이더 : axes[], series[{n,data,c,dash}] */
function radar(sel, axes, series, max){
  max = max || 5;
  const size = 260, cx = size/2, cy = size/2 + 4, R = 88, n = axes.length;
  const P = (i, v) => {
    const a = (Math.PI*2/n)*i - Math.PI/2, r = (v/max)*R;
    return [cx + r*Math.cos(a), cy + r*Math.sin(a)];
  };
  let g = '';
  for(let ring=1; ring<=5; ring++){
    const pts = axes.map((_,i) => P(i, max*ring/5).join(',')).join(' ');
    g += `<polygon points="${pts}" fill="none" stroke="${C_GRID}"/>`;
  }
  axes.forEach((_,i) => { const [x,y] = P(i,max); g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C_GRID}"/>`; });
  const lbl = axes.map((a,i) => {
    const [x,y] = P(i, max*1.28);
    return `<text x="${x}" y="${y}" font-size="11" font-weight="700" fill="#39405A" text-anchor="middle" dominant-baseline="middle">${a}</text>
            <text x="${x}" y="${y+13}" font-size="10.5" font-weight="800" fill="${C_BRAND}" text-anchor="middle">${series[0].data[i]}</text>`;
  }).join('');
  const polys = series.map(s => {
    const pts = s.data.map((v,i) => P(i,v).join(',')).join(' ');
    return `<polygon points="${pts}" fill="${s.c}" fill-opacity="${s.dash?0:0.12}" stroke="${s.c}" stroke-width="2" ${s.dash?'stroke-dasharray="4 3"':''}>
      <animateTransform attributeName="transform" type="scale" additive="sum" from="0.4" to="1" dur=".6s" fill="freeze"/></polygon>` +
      (s.dash ? '' : s.data.map((v,i) => { const [x,y]=P(i,v); return `<circle cx="${x}" cy="${y}" r="3" fill="${s.c}"/>`; }).join(''));
  }).join('');
  const lg = series.map(s => `<span class="row" style="gap:5px"><i style="width:14px;height:2.5px;background:${s.c};display:block;border-radius:9px;${s.dash?'opacity:.5':''}"></i><span style="font-size:11px;color:var(--muted)">${s.n}</span></span>`).join('');
  $(sel).innerHTML = `<svg viewBox="0 0 ${size} ${size+16}" style="width:100%;max-width:290px;height:auto;overflow:visible;margin:0 auto"><g transform="translate(0,0)">${g}${polys}${lbl}</g></svg>
    <div class="row" style="justify-content:center;gap:14px;margin-top:4px">${lg}</div>`;
}

/* 히트맵 : rows[], cols[], matrix[][] (0~10) */
function heatmap(sel, rows, cols, m){
  const cw = 44, ch = 26, lw = 92, th = 42;
  const w = lw + cols.length*cw, h = th + rows.length*ch + 18;
  const cells = m.map((r,ri) => r.map((v,ci) =>
    `<rect x="${lw+ci*cw+1}" y="${th+ri*ch+1}" width="${cw-2}" height="${ch-2}" rx="3" fill="${C_BRAND}" fill-opacity="${0.07 + (v/10)*0.85}"><title>${rows[ri]} × ${cols[ci]} : ${v}</title></rect>`
  ).join('')).join('');
  const cl = cols.map((c,i) => `<text x="${lw+i*cw+cw/2}" y="${th-8}" font-size="8.2" fill="${C_TXT}" text-anchor="middle" transform="rotate(-32 ${lw+i*cw+cw/2} ${th-8})">${c}</text>`).join('');
  const rl = rows.map((r,i) => `<text x="${lw-8}" y="${th+i*ch+ch/2+3.5}" font-size="10.5" fill="#39405A" text-anchor="end">${r}</text>`).join('');
  $(sel).innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;overflow:visible">${cl}${rl}${cells}</svg>
    <div class="row" style="justify-content:flex-end;gap:6px;margin-top:6px">
      <span class="small muted">연결 적음</span>
      <span style="width:88px;height:8px;border-radius:9px;background:linear-gradient(90deg,rgba(91,75,232,.08),${C_BRAND});display:block"></span>
      <span class="small muted">많음</span>
    </div>`;
}

/* 워드클라우드 : [[word, weight]] */
function words(sel, ws){
  const cs = ['#5B4BE8','#3B82F6','#14B8A6','#F59E0B','#EC4899','#8B5CF6','#0EA5E9'];
  $(sel).innerHTML = `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 12px;padding:8px 4px;min-height:150px">
    ${ws.map((w,i) => `<span style="font-size:${12 + w[1]*0.62}px;font-weight:${w[1]>24?900:700};color:${cs[i%cs.length]};opacity:${0.55 + w[1]/70};line-height:1.15">${w[0]}</span>`).join('')}
  </div>`;
}

/* 진행 링 */
function ring(sel, p, opts){
  opts = Object.assign({ size:96, sw:9, color:'#fff', track:'rgba(255,255,255,.28)', label:'', sub:'' }, opts||{});
  const r = (opts.size - opts.sw)/2, c = 2*Math.PI*r, cx = opts.size/2;
  $(sel).innerHTML = `<svg viewBox="0 0 ${opts.size} ${opts.size}" style="width:${opts.size}px;height:${opts.size}px">
    <circle cx="${cx}" cy="${cx}" r="${r}" stroke="${opts.track}" stroke-width="${opts.sw}" fill="none"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" stroke="${opts.color}" stroke-width="${opts.sw}" fill="none" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c}" transform="rotate(-90 ${cx} ${cx})">
      <animate attributeName="stroke-dashoffset" to="${c*(1-p/100)}" dur=".9s" fill="freeze" calcMode="spline" keySplines="0.22 0.61 0.36 1"/>
    </circle>
    <text x="${cx}" y="${cx+1}" font-size="${opts.size*0.21}" font-weight="800" fill="${opts.color}" text-anchor="middle">${p}%</text>
    <text x="${cx}" y="${cx+16}" font-size="9" fill="${opts.color}" opacity=".78" text-anchor="middle">${opts.sub||''}</text>
  </svg>`;
}

/* 세로 막대(간단) : [[label,value]] */
function vbar(sel, rows, o){
  o = Object.assign({ color:C_BRAND, h:150 }, o||{});
  const w = 460, pb = 24, pt = 16, iw = w-20, bw = iw/rows.length;
  const max = Math.max(...rows.map(r=>r[1])) * 1.2 || 1;
  const bars = rows.map((r,i) => {
    const bh = (r[1]/max)*(o.h-pt-pb), x = 10 + i*bw + bw*0.22, y = o.h - pb - bh;
    return `<rect x="${x}" y="${y}" width="${bw*0.56}" height="${bh}" rx="4" fill="${o.color}" opacity=".9">
        <animate attributeName="height" from="0" to="${bh}" dur=".7s" fill="freeze"/><animate attributeName="y" from="${o.h-pb}" to="${y}" dur=".7s" fill="freeze"/></rect>
      <text x="${x+bw*0.28}" y="${y-5}" font-size="10" font-weight="700" fill="#39405A" text-anchor="middle">${r[1]}</text>
      <text x="${x+bw*0.28}" y="${o.h-8}" font-size="10" fill="${C_TXT}" text-anchor="middle">${r[0]}</text>`;
  }).join('');
  $(sel).innerHTML = `<svg viewBox="0 0 ${w} ${o.h}" style="width:100%;height:auto">${bars}</svg>`;
}

/* 점수 비교 바(자가진단 vs 다면진단) : [[label, a, b]] */
function cmpbar(sel, rows, na, nb){
  const w = 500, rowH = 30, h = rows.length*rowH + 24, lw = 78, bw = w - lw - 40, max = 5;
  const bars = rows.map((r,i) => {
    const y = i*rowH + 6;
    const w1 = (r[1]/max)*bw, w2 = (r[2]/max)*bw;
    return `<text x="${lw-8}" y="${y+13}" font-size="10.5" fill="#39405A" text-anchor="end">${r[0]}</text>
      <rect x="${lw}" y="${y}" width="${w1}" height="8" rx="4" fill="#3B4CE8"><animate attributeName="width" from="0" to="${w1}" dur=".7s" fill="freeze"/></rect>
      <text x="${lw+w1+6}" y="${y+8}" font-size="9.5" font-weight="700" fill="#3B4CE8">${r[1]}</text>
      <rect x="${lw}" y="${y+11}" width="${w2}" height="8" rx="4" fill="#A78BFA"><animate attributeName="width" from="0" to="${w2}" dur=".7s" fill="freeze"/></rect>
      <text x="${lw+w2+6}" y="${y+19}" font-size="9.5" font-weight="700" fill="#8B5CF6">${r[2]}</text>`;
  }).join('');
  const ax = [1,2,3,4,5].map(v => `<text x="${lw + (v/max)*bw}" y="${h-4}" font-size="9" fill="${C_TXT}" text-anchor="middle">${v}</text>`).join('');
  $(sel).innerHTML = `<div class="row" style="justify-content:flex-end;gap:12px;margin-bottom:4px">
      <span class="row" style="gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:#3B4CE8;display:block"></i><span class="small muted">${na}</span></span>
      <span class="row" style="gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:#A78BFA;display:block"></i><span class="small muted">${nb}</span></span>
    </div><svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;overflow:visible">${bars}${ax}</svg>`;
}
