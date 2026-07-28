/* ==========================================================================
   KidTempo — 차트 (순수 SVG, 외부 라이브러리 없음)
   radar / barT / curve / donut / line / miniBars
   모든 차트는 고정 viewBox 좌표계에서 그려지고 컨테이너 폭에 비례해 스케일됩니다.
   ========================================================================== */

const Chart = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a={}) => { const e = document.createElementNS(NS, n); for(const k in a) e.setAttribute(k, a[k]); return e; };
  const T = (x,y,txt,a={}) => { const t = el('text',{x,y,...a}); t.textContent = txt; return t; };
  const svg = (w,h) => el('svg',{ viewBox:`0 0 ${w} ${h}`, width:'100%', height:'100%',
    preserveAspectRatio:'xMidYMid meet', style:'overflow:visible' });
  const mount = (host, s) => { host.innerHTML=''; host.appendChild(s); return s; };
  const BAND_COLOR = { vhigh:'#E2483D', high:'#F0A32B', mid:'#12A594', low:'#2E7BEA', vlow:'#7A6BF0' };

  /* ------------------------------ 방사형 차트 ------------------------------
     data: [{key,label,t,color}] · T점수(20~80) 6축 */
  function radar(host, data, opt={}){
    const W = opt.size || 380, H = W, cx = W/2, cy = H/2 + 4;
    const R = W*0.33, N = data.length;
    const s = svg(W,H);
    const ang = i => (Math.PI*2*i/N) - Math.PI/2;
    const val2r = v => R * ((v-20)/60);              // T 20~80 → 0~R

    // 배경 링
    [20,35,50,65,80].forEach((v,i)=>{
      const r = val2r(v);
      const pts = data.map((_,k)=>`${cx+r*Math.cos(ang(k))},${cy+r*Math.sin(ang(k))}`).join(' ');
      s.appendChild(el('polygon',{ points:pts, fill: v===50?'#F2F7F6':'none', stroke: v===50?'#B9CFCB':'#E8EDEC',
        'stroke-width': v===50?1.4:1, 'stroke-dasharray': v===50?'4 3':'0' }));
    });
    // 축
    data.forEach((d,i)=>{
      const x = cx + R*Math.cos(ang(i)), y = cy + R*Math.sin(ang(i));
      s.appendChild(el('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#E4EAE9','stroke-width':1}));
    });
    // 데이터 폴리곤
    const pts = data.map((d,i)=>{ const r = val2r(Math.max(20,Math.min(80,d.t))); return `${cx+r*Math.cos(ang(i))},${cy+r*Math.sin(ang(i))}`; });
    const poly = el('polygon',{ points:pts.join(' '), fill:'rgba(18,165,148,.18)', stroke:'#12A594','stroke-width':2.2,'stroke-linejoin':'round' });
    s.appendChild(poly);
    // 점 + 값
    data.forEach((d,i)=>{
      const r = val2r(Math.max(20,Math.min(80,d.t)));
      const x = cx+r*Math.cos(ang(i)), y = cy+r*Math.sin(ang(i));
      s.appendChild(el('circle',{cx:x,cy:y,r:4.5,fill:'#fff',stroke:d.color||'#12A594','stroke-width':2.4}));
      // 라벨
      const lr = R + 26, lx = cx + lr*Math.cos(ang(i)), ly = cy + lr*Math.sin(ang(i));
      const anchor = Math.abs(Math.cos(ang(i))) < .3 ? 'middle' : (Math.cos(ang(i))>0 ? 'start':'end');
      s.appendChild(T(lx, ly-3, d.label, { 'text-anchor':anchor, 'font-size':12, 'font-weight':800, fill:'#3D4A48' }));
      s.appendChild(T(lx, ly+11, `T ${Math.round(d.t)}`, { 'text-anchor':anchor, 'font-size':11, 'font-weight':800, fill:d.color||'#12A594' }));
    });
    s.appendChild(T(cx, cy+3, '', {}));
    return mount(host, s);
  }

  /* ------------------------------ T점수 막대 ------------------------------
     data: [{label,t,pct,color,band}] */
  function barT(host, data, opt={}){
    const rowH = opt.rowH || 46, padL = 78, padR = 46, W = opt.width || 620;
    const H = data.length*rowH + 34;
    const s = svg(W,H);
    const x0 = padL, x1 = W - padR, span = x1 - x0;
    const t2x = t => x0 + span * ((Math.max(20,Math.min(80,t))-20)/60);

    // 눈금
    [20,30,40,50,60,70,80].forEach(v=>{
      const x = t2x(v);
      s.appendChild(el('line',{x1:x,y1:16,x2:x,y2:H-16,stroke:v===50?'#B9CFCB':'#EFF3F2','stroke-width':v===50?1.4:1,'stroke-dasharray':v===50?'4 3':'0'}));
      s.appendChild(T(x, H-4, String(v), {'text-anchor':'middle','font-size':10,'font-weight':700,fill:'#9AA8A6'}));
    });
    s.appendChild(T(t2x(50), 10, '평균 T50', {'text-anchor':'middle','font-size':10,'font-weight':800,fill:'#6C7B79'}));

    data.forEach((d,i)=>{
      const y = 24 + i*rowH;
      s.appendChild(T(x0-10, y+15, d.label, {'text-anchor':'end','font-size':12.5,'font-weight':800,fill:'#3D4A48'}));
      // 트랙
      s.appendChild(el('rect',{x:x0,y:y+6,width:span,height:16,rx:8,fill:'#F4F7F6'}));
      // 값 (T50 기준 양방향)
      const xv = t2x(d.t), xm = t2x(50);
      const bx = Math.min(xv,xm), bw = Math.abs(xv-xm);
      const c = d.color || BAND_COLOR[d.band] || '#12A594';
      const r = el('rect',{x:bx,y:y+6,width:0,height:16,rx:8,fill:c,opacity:.92});
      s.appendChild(r);
      requestAnimationFrame(()=>{ r.style.transition='width .7s cubic-bezier(.22,.61,.36,1)'; r.setAttribute('width', Math.max(3,bw)); });
      // 값 라벨
      s.appendChild(T(x1+8, y+18, `T ${Math.round(d.t)}`, {'font-size':12,'font-weight':800,fill:c}));
      if(d.pct!=null) s.appendChild(T(x0-10, y+29, `${d.pct}%ile`, {'text-anchor':'end','font-size':10,'font-weight':700,fill:'#9AA8A6'}));
    });
    return mount(host, s);
  }

  /* --------------------------- 정규분포 곡선 + 위치 ---------------------------
     t: 개인 T점수 · color */
  function curve(host, t, color='#12A594', opt={}){
    const W = opt.width || 300, H = opt.height || 96;
    const s = svg(W,H);
    const padX = 12, base = H-18, top = 10;
    const x0 = padX, x1 = W-padX, span = x1-x0;
    const t2x = v => x0 + span*((Math.max(20,Math.min(80,v))-20)/60);
    const f = v => Math.exp(-0.5*((v-50)/10)**2);

    // 구간 배경
    const zones = [[20,36,'#EEECFB'],[36,44,'#E9F0FB'],[44,57,'#E9F5F3'],[57,65,'#FEF2E0'],[65,80,'#FDE9E3']];
    zones.forEach(([a,b,c])=> s.appendChild(el('rect',{x:t2x(a),y:top-4,width:t2x(b)-t2x(a),height:base-top+4,fill:c,opacity:.55})));

    // 곡선
    let d = '';
    for(let v=20; v<=80; v+=0.5){ const x=t2x(v), y=base-(base-top)*f(v); d += (v===20?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1); }
    s.appendChild(el('path',{d, fill:'none', stroke:'#8FA5A1','stroke-width':1.6}));
    s.appendChild(el('line',{x1:x0,y1:base,x2:x1,y2:base,stroke:'#D8E0DE','stroke-width':1}));

    // 마커
    const mx = t2x(t), my = base-(base-top)*f(t);
    s.appendChild(el('line',{x1:mx,y1:base,x2:mx,y2:my-2,stroke:color,'stroke-width':2,'stroke-dasharray':'3 2'}));
    s.appendChild(el('circle',{cx:mx,cy:my-2,r:5,fill:color,stroke:'#fff','stroke-width':2}));
    s.appendChild(T(mx, my-11, `T${Math.round(t)}`, {'text-anchor':'middle','font-size':10.5,'font-weight':800,fill:color}));
    [30,40,50,60,70].forEach(v=> s.appendChild(T(t2x(v), H-4, String(v), {'text-anchor':'middle','font-size':9,'font-weight':700,fill:'#9AA8A6'})));
    return mount(host, s);
  }

  /* ------------------------------- 도넛 ------------------------------- */
  function donut(host, segs, opt={}){
    const W = opt.size||210, H = W, cx=W/2, cy=H/2, R=W*0.4, r=W*0.26;
    const s = svg(W,H);
    const total = segs.reduce((a,b)=>a+b.v,0) || 1;
    let acc = -Math.PI/2;
    segs.forEach(sg=>{
      if(!sg.v) return;
      const a0 = acc, a1 = acc + Math.PI*2*sg.v/total; acc = a1;
      const large = (a1-a0) > Math.PI ? 1:0;
      const p = [
        `M ${cx+R*Math.cos(a0)} ${cy+R*Math.sin(a0)}`,
        `A ${R} ${R} 0 ${large} 1 ${cx+R*Math.cos(a1)} ${cy+R*Math.sin(a1)}`,
        `L ${cx+r*Math.cos(a1)} ${cy+r*Math.sin(a1)}`,
        `A ${r} ${r} 0 ${large} 0 ${cx+r*Math.cos(a0)} ${cy+r*Math.sin(a0)}`,'Z'
      ].join(' ');
      const path = el('path',{d:p, fill:sg.color, stroke:'#fff','stroke-width':2});
      path.appendChild(el('title')).textContent = `${sg.label} ${sg.v}명`;
      s.appendChild(path);
    });
    s.appendChild(T(cx, cy-2, String(total), {'text-anchor':'middle','font-size':24,'font-weight':800,fill:'#16211F'}));
    s.appendChild(T(cx, cy+15, opt.unit||'명', {'text-anchor':'middle','font-size':11,'font-weight':700,fill:'#9AA8A6'}));
    return mount(host, s);
  }

  /* ------------------------------- 라인 ------------------------------- */
  function line(host, series, labels, opt={}){
    const W = opt.width||620, H = opt.height||200, padL=34, padR=12, padT=14, padB=26;
    const s = svg(W,H);
    // 눈금이 정수로 떨어지도록 최대값을 4의 배수로 올림 (0,1,3,4 처럼 중복·누락되는 라벨 방지)
    const raw = Math.max(...series.flatMap(x=>x.data), 1);
    const max = Math.max(4, Math.ceil(raw/4)*4);
    const x0=padL, x1=W-padR, y0=H-padB, y1=padT;
    const X = i => x0 + (x1-x0)*i/(labels.length-1||1);
    const Y = v => y0 - (y0-y1)*(v/max);

    [0,.25,.5,.75,1].forEach(p=>{
      const y = y0-(y0-y1)*p;
      s.appendChild(el('line',{x1:x0,y1:y,x2:x1,y2:y,stroke:'#EFF3F2','stroke-width':1}));
      s.appendChild(T(x0-8, y+3, String(max*p), {'text-anchor':'end','font-size':9.5,'font-weight':700,fill:'#9AA8A6'}));
    });
    labels.forEach((l,i)=> s.appendChild(T(X(i), H-8, l, {'text-anchor':'middle','font-size':10,'font-weight':700,fill:'#9AA8A6'})));

    series.forEach(sr=>{
      const d = sr.data.map((v,i)=> (i?'L':'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
      if(sr.area){
        const ar = d + ` L ${X(sr.data.length-1)} ${y0} L ${X(0)} ${y0} Z`;
        s.appendChild(el('path',{d:ar, fill:sr.color, opacity:.10}));
      }
      const p = el('path',{d, fill:'none', stroke:sr.color,'stroke-width':2.4,'stroke-linecap':'round','stroke-linejoin':'round'});
      s.appendChild(p);
      const len = 1200; p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      requestAnimationFrame(()=>{ p.style.transition='stroke-dashoffset 1s ease-out'; p.style.strokeDashoffset = 0; });
      sr.data.forEach((v,i)=> s.appendChild(el('circle',{cx:X(i),cy:Y(v),r:3.2,fill:'#fff',stroke:sr.color,'stroke-width':2})));
    });
    return mount(host, s);
  }

  /* ---------------------------- 미니 막대 (요인 요약) ---------------------------- */
  function miniBars(host, data, opt={}){
    const W = opt.width||260, H = opt.height||90, n=data.length, gap=8;
    const s = svg(W,H);
    const bw = (W - gap*(n-1))/n, base = H-16;
    data.forEach((d,i)=>{
      const h = (base-6) * ((Math.max(20,Math.min(80,d.t))-20)/60);
      const x = i*(bw+gap);
      s.appendChild(el('rect',{x, y:6, width:bw, height:base-6, rx:5, fill:'#F2F6F5'}));
      const r = el('rect',{x, y:base-h, width:bw, height:0, rx:5, fill:d.color});
      s.appendChild(r);
      requestAnimationFrame(()=>{ r.style.transition='height .7s cubic-bezier(.22,.61,.36,1), y .7s cubic-bezier(.22,.61,.36,1)'; r.setAttribute('height',h); r.setAttribute('y', base-h); });
      s.appendChild(T(x+bw/2, H-3, d.label, {'text-anchor':'middle','font-size':9.5,'font-weight':800,fill:'#6C7B79'}));
    });
    return mount(host, s);
  }

  return { radar, barT, curve, donut, line, miniBars, BAND_COLOR };
})();
