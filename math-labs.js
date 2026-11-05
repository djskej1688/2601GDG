/* Interactive figures for the calculus notes: a polar-curve explorer and a Taylor polynomial explorer.
 * Markup: <figure class="mathlab" data-lab="polar|taylor"><div class="xtal-stage"></div><figcaption>…</figcaption></figure> */
(() => {
  'use strict';
  const C = { ivory: '#dde1c7', yellow: '#e0d67b', orange: '#f79234', muted: '#789278', sky: '#8cbecd', text: '#e8eadb' };
  const fact = n => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };

  const POLAR = {
    'rose-sin': { label: 'r = sin nθ', param: 'n', min: 1, max: 8, step: 1, value: 3, f: (t, n) => Math.sin(n * t), span: n => 2 * Math.PI, rmax: () => 1.1,
      note: n => `n = ${n} ${n % 2 ? '홀수' : '짝수'} → 꽃잎 ${n % 2 ? n : 2 * n}개` },
    'rose-cos': { label: 'r = cos nθ', param: 'n', min: 1, max: 8, step: 1, value: 2, f: (t, n) => Math.cos(n * t), span: () => 2 * Math.PI, rmax: () => 1.1,
      note: n => `n = ${n} ${n % 2 ? '홀수' : '짝수'} → 꽃잎 ${n % 2 ? n : 2 * n}개` },
    limacon: { label: 'r = a + cos θ', param: 'a', min: 0, max: 3, step: .1, value: .5, f: (t, a) => a + Math.cos(t), span: () => 2 * Math.PI, rmax: a => a + 1.1,
      note: a => { const k = Math.round(a * 10) / 10; return `a/b = ${k} → ${k < 1 ? (k === 0 ? '원 (r = cos θ)' : '안쪽 고리') : k === 1 ? '심장형 (뾰족한 꼭지)' : k < 2 ? '오목 리마송' : '볼록 리마송'}`; } },
    lemniscate: { label: 'r² = a² cos 2θ', param: 'a', min: .5, max: 2, step: .1, value: 1, f: (t, a) => { const v = a * a * Math.cos(2 * t); return v >= 0 ? Math.sqrt(v) : null; }, both: true, span: () => 2 * Math.PI, rmax: a => a * 1.1,
      note: () => 'cos 2θ < 0인 구간(π/4 < θ < 3π/4 등)에는 점이 없어요' }
  };
  const TAYLOR = {
    exp: { label: 'eˣ', f: Math.exp, c: k => 1 / fact(k), y: [-2, 8] },
    sin: { label: 'sin x', f: Math.sin, c: k => (k % 2 ? ((k - 1) / 2 % 2 ? -1 : 1) / fact(k) : 0), y: [-2.5, 2.5] },
    cos: { label: 'cos x', f: Math.cos, c: k => (k % 2 ? 0 : (k / 2 % 2 ? -1 : 1) / fact(k)), y: [-2.5, 2.5] },
    ln: { label: 'ln(1 + x)', f: x => (x > -1 ? Math.log(1 + x) : NaN), c: k => (k === 0 ? 0 : ((k + 1) % 2 ? -1 : 1) / k), y: [-3, 2.5], x: [-1.5, 3] }
  };

  function setup(fig) {
    const lab = fig.dataset.lab, stage = fig.querySelector('.xtal-stage');
    const canvas = document.createElement('canvas'); canvas.setAttribute('role', 'img'); stage.append(canvas);
    const ctx = canvas.getContext('2d');
    const tools = document.createElement('div'); tools.className = 'xtal-tools lab-tools'; stage.after(tools);
    const sel = document.createElement('select'); sel.setAttribute('aria-label', lab === 'polar' ? '곡선 종류' : '함수');
    const opts = lab === 'polar' ? POLAR : TAYLOR;
    Object.entries(opts).forEach(([k, v]) => { const o = document.createElement('option'); o.value = k; o.textContent = v.label; sel.append(o); });
    const range = document.createElement('input'); range.type = 'range';
    const out = document.createElement('output');
    const note = document.createElement('p'); note.className = 'lab-note'; note.setAttribute('aria-live', 'polite');
    const lbl = document.createElement('label'); lbl.append(range, out);
    tools.append(sel, lbl); tools.after(note);
    let W = 0, H = 0, dpr = 1;

    function configure() {
      if (lab === 'polar') { const p = POLAR[sel.value]; Object.assign(range, { min: p.min, max: p.max, step: p.step }); range.value = p.value; range.setAttribute('aria-label', p.param); }
      else { Object.assign(range, { min: 0, max: 12, step: 1 }); range.value = sel.value === 'exp' ? 3 : 5; range.setAttribute('aria-label', '차수 n'); }
      draw();
    }
    function axes(X, Y, x0, x1, y0, y1) {
      ctx.strokeStyle = C.muted; ctx.globalAlpha = .6; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(x0), Y(0)); ctx.lineTo(X(x1), Y(0)); ctx.moveTo(X(0), Y(y0)); ctx.lineTo(X(0), Y(y1)); ctx.stroke(); ctx.globalAlpha = 1;
    }
    function draw() {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const v = Number(range.value);
      if (lab === 'polar') {
        const p = POLAR[sel.value], R = p.rmax(v), s = Math.min(W, H) / 2 / R * .92;
        const X = x => W / 2 + x * s, Y = y => H / 2 - y * s;
        axes(X, Y, -R, R, -R, R);
        out.textContent = `${p.param} = ${Math.round(v * 10) / 10}`;
        // r ≥ 0 in yellow; r < 0 plotted on the opposite side in orange
        for (const sign of p.both ? [1, -1] : [1]) {
          let prev = null;
          for (let i = 0; i <= 1440; i++) {
            const t = p.span(v) * i / 1440, r0 = p.f(t, v);
            if (r0 === null) { prev = null; continue; }
            const r = r0 * sign, pt = [X(r * Math.cos(t)), Y(r * Math.sin(t))], neg = r < 0;
            if (prev && prev[2] === neg) { ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(pt[0], pt[1]); ctx.strokeStyle = neg && !p.both ? C.orange : C.yellow; ctx.lineWidth = 2; ctx.stroke(); }
            prev = [...pt, neg];
          }
        }
        note.textContent = p.note(v) + (p.both ? '' : ' · 주황 = r < 0이라 반대쪽(θ + π 방향)에 찍힌 부분');
        canvas.setAttribute('aria-label', `${p.label}, ${out.textContent}. ${p.note(v)}`);
      } else {
        const fn = TAYLOR[sel.value], [x0, x1] = fn.x || [-6, 6], [y0, y1] = fn.y;
        const X = x => (x - x0) / (x1 - x0) * W, Y = y => H - (y - y0) / (y1 - y0) * H;
        axes(X, Y, x0, x1, y0, y1);
        const plot = (g, color, width) => {
          ctx.beginPath(); let pen = false;
          for (let i = 0; i <= 600; i++) { const x = x0 + (x1 - x0) * i / 600, y = g(x); if (!isFinite(y) || y < y0 - 50 || y > y1 + 50) { pen = false; continue; } if (pen) ctx.lineTo(X(x), Y(y)); else { ctx.moveTo(X(x), Y(y)); pen = true; } }
          ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
        };
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
        plot(fn.f, C.ivory, 2.4);
        plot(x => { let s = 0; for (let k = 0; k <= v; k++) s += fn.c(k) * x ** k; return s; }, C.orange, 2);
        ctx.restore();
        out.textContent = `n = ${v}`;
        const sup = n => String(n).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
        let poly = '', shown = 0;
        for (let k = 0; k <= v && shown < 4; k++) {
          const c = fn.c(k); if (!c) continue;
          const mag = Math.abs(c), num = k === 0 || mag !== 1 ? String(+mag.toPrecision(3)) : '';
          const term = num + (k ? (num ? '·' : '') + 'x' + (k > 1 ? sup(k) : '') : '');
          poly += shown ? (c < 0 ? ' − ' : ' + ') + term : (c < 0 ? '−' : '') + term; shown++;
        }
        note.textContent = `흰 선 = ${fn.label}, 주황 = ${v}차 Maclaurin 다항식 Pₙ(x) = ${poly || '0'}${v > 4 ? ' + …' : ''}${sel.value === 'ln' ? ' · ln(1 + x)는 −1 < x ≤ 1에서만 수렴해서 그 밖에서는 차수를 올려도 멀어져요' : ''}`;
        canvas.setAttribute('aria-label', note.textContent);
      }
    }
    function resize() { const r = stage.getBoundingClientRect(); if (!r.width) return; dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); draw(); }
    sel.addEventListener('change', configure); range.addEventListener('input', draw);
    new ResizeObserver(resize).observe(stage);
    configure(); resize();
  }
  const init = () => document.querySelectorAll('figure.mathlab[data-lab]').forEach(f => { if (!f.dataset.ready) { f.dataset.ready = '1'; setup(f); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
