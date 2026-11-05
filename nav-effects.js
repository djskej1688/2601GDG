/* Shared menu effects. dandelion scatters like seeds on the wind and untitled melts downward,
 * on the home menu and on every page's header menu. On pages other than home, hovering seeding
 * shows a small speech bubble (it used to run away on the home page).
 * Plain DOM + canvas, no dependencies. Reduced motion skips the effects. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, t) => { const q = clamp((t - a) / (b - a), 0, 1); return q * q * (3 - 2 * q); };

  /* ---------- shared: draw a link's text into a canvas ---------- */
  function snapshot(link) {
    const range = document.createRange();
    range.selectNodeContents(link);
    const r = range.getBoundingClientRect();
    const cs = getComputedStyle(link);
    const dpr = Math.min(2, devicePixelRatio || 1), pad = 4;
    const w = r.width + pad * 2, h = r.height + pad * 2;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const x = c.getContext('2d');
    x.scale(dpr, dpr);
    x.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    x.fillStyle = cs.color;
    x.textBaseline = 'alphabetic';
    const m = x.measureText(link.textContent);
    const asc = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent;
    const desc = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent;
    x.fillText(link.textContent, pad, pad + (r.height - asc - desc) / 2 + asc);
    return { canvas: c, ctx: x, left: r.left - pad, top: r.top - pad, w, h, dpr, color: cs.color };
  }
  function ensureGoo() {
    if (document.getElementById('menu-goo')) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    const filter = document.createElementNS(ns, 'filter');
    Object.entries({ id: 'menu-goo', x: '-20%', y: '-20%', width: '140%', height: '140%' }).forEach(([k, v]) => filter.setAttribute(k, v));
    const blur = document.createElementNS(ns, 'feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic'); blur.setAttribute('stdDeviation', '1.1'); blur.setAttribute('result', 'blur');
    const matrix = document.createElementNS(ns, 'feColorMatrix');
    matrix.setAttribute('in', 'blur'); matrix.setAttribute('mode', 'matrix');
    matrix.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 9 -2.6'); matrix.setAttribute('result', 'goo');
    const comp = document.createElementNS(ns, 'feComposite');
    comp.setAttribute('in', 'SourceGraphic'); comp.setAttribute('in2', 'goo'); comp.setAttribute('operator', 'atop');
    filter.append(blur, matrix, comp); svg.append(filter); document.body.append(svg);
  }
  function overlay(link, left, top, width, height, goo) {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const c = document.createElement('canvas');
    c.className = 'menu-effect' + (goo ? ' goo' : '');
    c.setAttribute('aria-hidden', 'true');
    c.width = Math.ceil(width * dpr); c.height = Math.ceil(height * dpr);
    Object.assign(c.style, { position: 'fixed', zIndex: '100', pointerEvents: 'none',
      left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
    if (goo) { ensureGoo(); c.style.filter = 'url(#menu-goo)'; }
    // A link inside an open <dialog> lives in the top layer; draw there so the effect stays visible.
    (link.closest('dialog[open]') || document.body).append(c);
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    return { c, ctx };
  }
  function release(link) { link.classList.add('is-released'); link.style.visibility = 'hidden'; }
  function run(duration, frame, done) {
    const start = performance.now();
    const step = now => {
      const t = (now - start) / 1000;
      frame(t);
      if (t * 1000 < duration) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  }

  /* ---------- dandelion: seeds scatter on the wind ---------- */
  function scatter(link, go) {
    const s = snapshot(link);
    const data = s.ctx.getImageData(0, 0, s.canvas.width, s.canvas.height).data;
    const parts = [];
    const stride = Math.max(1, Math.round(s.dpr));
    for (let py = 0; py < s.canvas.height; py += stride) {
      for (let px = 0; px < s.canvas.width; px += stride) {
        if (data[(py * s.canvas.width + px) * 4 + 3] < 110) continue;
        const x = s.left + px / s.dpr, y = s.top + py / s.dpr;
        const along = (x - s.left) / s.w;
        parts.push({
          x0: x, y0: y,
          delay: along * .42 + rand(0, .22),
          vx: rand(70, 190), vy: rand(-75, -18),
          sway: rand(8, 22), freq: rand(1.6, 3.4), phase: rand(0, 6.3),
          seed: Math.random() < .16, tilt: rand(-.5, .3), size: rand(.7, 1.15)
        });
      }
    }
    const view = overlay(link, 0, 0, innerWidth, innerHeight, false);
    const ctx = view.ctx;
    release(link);
    ctx.strokeStyle = ctx.fillStyle = s.color;
    run(1900, t => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        const u = t - p.delay;
        if (u <= 0) { ctx.globalAlpha = 1; ctx.fillRect(p.x0, p.y0, 1.05, 1.05); continue; }
        const lift = 1 - Math.exp(-u * 1.6);
        const x = p.x0 + p.vx * u + 26 * u * u;
        const y = p.y0 + p.vy * u * lift - 10 * u * u + Math.sin(u * p.freq + p.phase) * p.sway * lift;
        const a = 1 - smooth(.55, 1.45, u);
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        if (!p.seed) { ctx.beginPath(); ctx.arc(x, y, p.size * (1 - .35 * lift), 0, Math.PI * 2); ctx.fill(); continue; }
        // A tiny dandelion seed: achene, stalk and a pappus that opens as it flies.
        const open = smooth(0, .45, u), ang = p.tilt + Math.sin(u * p.freq + p.phase) * .35;
        const len = 7 + 3 * open, tx = x + Math.sin(ang) * len, ty = y - Math.cos(ang) * len;
        ctx.lineWidth = .55;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y, .7, 1.4, ang, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = .4;
        for (let k = 0; k < 7; k++) {
          const fa = ang - Math.PI / 2 + (k / 6 - .5) * Math.PI * .95 * (.35 + .65 * open) + Math.PI / 2;
          const fl = 3.2 + 2.6 * open;
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.sin(fa) * fl, ty - Math.cos(fa) * fl); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }, go);
  }

  /* ---------- untitled: melts into liquid and runs down ---------- */
  function melt(link, go) {
    const s = snapshot(link);
    const cols = s.canvas.width, rows = s.canvas.height;
    const data = s.ctx.getImageData(0, 0, cols, rows).data;
    const bottom = new Float32Array(cols).fill(-1);
    for (let i = 0; i < cols; i++) for (let j = rows - 1; j >= 0; j--) if (data[(j * cols + i) * 4 + 3] > 120) { bottom[i] = j / s.dpr; break; }
    const inked = [...bottom.keys()].filter(i => bottom[i] >= 0);
    if (!inked.length) { go(); return; }
    const count = Math.max(6, Math.round(s.w / 9));
    const drips = Array.from({ length: count }, (_, k) => {
      const i = inked[Math.floor((k + Math.random()) / count * inked.length)];
      return { i, x: i / s.dpr, y: bottom[i], w: rand(1.8, 3.4), amp: rand(.45, 1), start: rand(.05, .45), drop: rand(.95, 1.35) };
    });
    const phase = [rand(0, 6), rand(0, 6)];
    const width = s.w + 40, height = Math.max(s.h + 60, innerHeight - s.top + 20);
    const view = overlay(link, s.left - 20, s.top, width, height, true);
    const ctx = view.ctx;
    release(link);
    ctx.fillStyle = s.color;
    const bump = new Float32Array(cols);
    run(1800, t => {
      ctx.clearRect(0, 0, width, height);
      const sag = smooth(0, 1.1, t) * 7;
      ctx.globalAlpha = 1 - smooth(1.3, 1.8, t);
      bump.fill(0);
      const lens = drips.map(d => { const u = Math.max(0, t - d.start); return d.amp * (u * u * 300 + u * 22); });
      drips.forEach((d, k) => {
        const reach = Math.min(lens[k], 8) * s.dpr;
        for (let i = Math.max(0, d.i - 10 * s.dpr); i < Math.min(cols, d.i + 10 * s.dpr); i++) {
          bump[i] = Math.max(bump[i], reach * Math.exp(-((i - d.i) ** 2) / (2 * (d.w * s.dpr) ** 2)) / s.dpr);
        }
      });
      // The word sags and its lower edge bulges toward each drip; the top stays anchored.
      const drain = 1 - .55 * smooth(.7, 1.6, t);
      ctx.save(); ctx.globalAlpha *= drain;
      for (let i = 0; i < cols; i++) {
        const wave = (Math.sin(i * .06 / s.dpr + phase[0]) + Math.sin(i * .17 / s.dpr + phase[1])) * .25 + .5;
        const down = sag * (.5 + wave) + bump[i];
        ctx.drawImage(s.canvas, i, 0, 1, rows, 20 + i / s.dpr, down * .25, 1 / s.dpr + .4, s.h + down * .75);
      }
      ctx.restore();
      // Tapered streams with a heavier bead at the tip; late ones let go of a drop.
      drips.forEach((d, k) => {
        const len = lens[k];
        if (len < 1) return;
        const x = 20 + d.x, y0 = d.y + sag * .8;
        const steps = Math.max(2, Math.ceil(len / 1.4));
        for (let n = 0; n <= steps; n++) {
          const q = n / steps;
          ctx.beginPath(); ctx.arc(x + Math.sin(q * 3 + d.i) * .4, y0 + q * len, d.w * (.5 - .22 * q), 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(x, y0 + len, d.w * .62, 0, Math.PI * 2); ctx.fill();
        const fall = t - d.start - d.drop * .6;
        if (fall > 0) { ctx.beginPath(); ctx.arc(x, y0 + len + fall * fall * 900 + fall * 120, d.w * .55, 0, Math.PI * 2); ctx.fill(); }
      });
    }, go);
  }

  /* ---------- binding: click → effect → navigate ---------- */
  const EFFECTS = { seeds: scatter, melt };
  let busy = false;
  function bind(link, effect) {
    link.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (reduce.matches) return;
      e.preventDefault();
      if (busy) return;
      busy = true;
      const go = () => { location.href = link.href; };
      try { EFFECTS[effect](link, go); } catch (_) { go(); }
    });
  }
  // Coming back through the browser history restores clean links.
  addEventListener('pageshow', () => {
    busy = false;
    document.querySelectorAll('.menu-effect').forEach(c => c.remove());
    document.querySelectorAll('.is-released').forEach(a => { a.classList.remove('is-released'); a.style.visibility = ''; });
  });
  window.dandellasEffects = Object.freeze({ bind });

  /* ---------- header menus on every page except home ---------- */
  if (document.querySelector('#home-menu')) return;
  const here = location.pathname.split('/').pop() || 'index.html';
  const menus = document.querySelectorAll('.desktop-nav, #mobile-menu');
  menus.forEach(nav => nav.querySelectorAll('a[href]').forEach(link => {
    const target = new URL(link.href, location.href).pathname.split('/').pop();
    if (target === here) return;
    if (target === 'dandelion.html') bind(link, 'seeds');
    else if (target === 'untitled.html') bind(link, 'melt');
    else if (target === 'input.html') bubble(link);
  }));

  /* ---------- seeding easter egg: a speech bubble on hover ---------- */
  function bubble(link) {
    let tip = null, timer = 0;
    const show = () => {
      clearTimeout(timer);
      if (!tip) {
        tip = document.createElement('span');
        tip.className = 'seed-bubble';
        tip.setAttribute('role', 'tooltip');
        tip.id = 'seed-bubble-' + Math.random().toString(36).slice(2, 8);
        tip.textContent = "I think I'm ready now.. hehe";
        (link.closest('dialog') || document.body).append(tip);
        link.setAttribute('aria-describedby', tip.id);
      }
      const r = link.getBoundingClientRect(), w = tip.offsetWidth, cx = r.left + r.width / 2;
      const left = clamp(cx - w / 2, 8, innerWidth - w - 8);
      tip.style.left = `${left}px`;
      tip.style.top = `${r.bottom + 12}px`;
      tip.style.setProperty('--tail', `${cx - left}px`);
      tip.classList.add('is-on');
    };
    const hide = () => { clearTimeout(timer); timer = setTimeout(() => tip && tip.classList.remove('is-on'), 120); };
    link.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') show(); });
    link.addEventListener('pointerleave', hide);
    link.addEventListener('focus', () => { if (link.matches(':focus-visible')) show(); });
    link.addEventListener('blur', hide);
    addEventListener('scroll', hide, { passive: true });
  }
})();
