/* Graph view used by the research map and the Input knowledge graph: a force-directed graph
 * drawn on canvas, no dependencies. Content comes from window.GRAPH_DATA (map-data.js or
 * chem-graph-data.js). Kinds: one root, hub nodes ("project"), and concept nodes. */
(() => {
  'use strict';
  const canvas = document.querySelector('#map-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dialog = document.querySelector('#project-dialog');
  const announce = document.querySelector('#map-announcement');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, t) => { const q = clamp((t - a) / (b - a), 0, 1); return q * q * (3 - 2 * q); };
  const INK = { ivory: [221, 225, 199], yellow: [224, 214, 123], muted: [120, 146, 120], amber: [181, 146, 85], orange: [247, 146, 52], text: [232, 234, 219] };
  const rgba = (c, a) => `rgba(${INK[c].join(',')},${clamp(a, 0, 1)})`;

  /* ---------- content (from a data file loaded before this script) ---------- */
  const DATA = window.GRAPH_DATA;
  if (!DATA || !Array.isArray(DATA.nodes)) return;
  const NODES = DATA.nodes.map(n => ({ ...n })), EDGES = DATA.edges, NOTE = DATA.note, KIND = DATA.kinds;
  const T = (ko, en) => ({ ko, en: en ?? ko });
  const LINK = DATA.linkLabel || T('페이지 열기', 'Open page');
  const SPACING = DATA.spacing || 1;

  const byId = new Map(NODES.map(n => [n.id, n]));
  const links = EDGES.map(([a, b]) => ({ a: byId.get(a), b: byId.get(b) }));
  NODES.forEach(n => { n.nb = new Set(); });
  links.forEach(({ a, b }) => { a.nb.add(b); b.nb.add(a); });
  // Deterministic start so the graph settles the same way on every visit.
  let seed = 7;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  // Seeded start: projects spread around the root, each concept near the projects it belongs to.
  const projects = NODES.filter(n => n.kind === 'project');
  NODES.forEach(n => { n.r = n.kind === 'root' ? 9 : n.kind === 'project' ? 7.5 + n.nb.size * .25 : 3 + Math.sqrt(n.nb.size) * 1.4; n.vx = 0; n.vy = 0; n.fixed = false; });
  const root = NODES.find(n => n.kind === 'root');
  if (root) { root.x = 0; root.y = 0; }
  projects.forEach((n, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / projects.length; n.x = Math.cos(a) * 170; n.y = Math.sin(a) * 170; });
  NODES.filter(n => n.kind === 'concept').forEach(n => {
    const owners = [...n.nb].filter(m => m.kind === 'project');
    const ax = owners.reduce((s, m) => s + m.x, 0) / (owners.length || 1), ay = owners.reduce((s, m) => s + m.y, 0) / (owners.length || 1);
    const push = owners.length > 1 ? 1 : 1.6, a = rnd() * Math.PI * 2;
    n.x = ax * push + Math.cos(a) * 60; n.y = ay * push + Math.sin(a) * 60;
  });

  let lang = 'ko';
  if (DATA.bilingual === false) document.querySelectorAll('.dialog-lang').forEach(el => { el.hidden = true; });
  try { if (DATA.bilingual !== false && localStorage.getItem('notes-lang') === 'en') lang = 'en'; } catch (_) { /* storage unavailable */ }
  const L = t => t[lang] || t.ko;

  /* ---------- simulation ---------- */
  let alpha = 1, running = true;
  function restLength(l) { return l.a.kind === 'root' || l.b.kind === 'root' ? 150 * SPACING : (l.a.kind === 'project' || l.b.kind === 'project' ? 92 : 70) * SPACING; }
  function tick() {
    const k = alpha;
    for (let i = 0; i < NODES.length; i++) {
      const a = NODES[i];
      for (let j = i + 1; j < NODES.length; j++) {
        const b = NODES[j];
        let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = rnd() - .5; dy = rnd() - .5; d2 = 1; }
        const f = 4200 * SPACING * SPACING / Math.max(d2, 400) * k, d = Math.sqrt(d2);
        a.vx -= dx / d * f; a.vy -= dy / d * f; b.vx += dx / d * f; b.vy += dy / d * f;
      }
    }
    for (const l of links) {
      const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y, d = Math.hypot(dx, dy) || 1;
      const f = (d - restLength(l)) * .045 * k;
      l.a.vx += dx / d * f; l.a.vy += dy / d * f; l.b.vx -= dx / d * f; l.b.vy -= dy / d * f;
    }
    for (const n of NODES) {
      n.vx -= n.x * .004 * k; n.vy -= n.y * .004 * k;
      if (n.fixed) { n.vx = 0; n.vy = 0; continue; }
      n.vx *= .78; n.vy *= .78;
      n.x += clamp(n.vx, -30, 30); n.y += clamp(n.vy, -30, 30);
    }
    alpha = Math.max(0, alpha * .985);
    if (alpha < .004 && !dragNode) running = false;
  }
  function reheat(value = .5) { alpha = Math.max(alpha, value); if (!running) { running = true; requestFrame(); } }

  /* ---------- camera ---------- */
  let W = 0, H = 0, dpr = 1, scale = 1, tx = 0, ty = 0, userMoved = false, camAnim = null;
  const toScreen = n => [n.x * scale + tx, n.y * scale + ty];
  const toWorld = (x, y) => [(x - tx) / scale, (y - ty) / scale];
  function panelWidth() { return dialog.open && W > 700 ? dialog.getBoundingClientRect().width : 0; }
  function fit(animate) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of NODES) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); }
    const availW = W - panelWidth(), top = 70, bottom = W > 700 ? 70 : 190;
    const side = W > 700 ? 140 : 70;
    const s = clamp(Math.min((availW - side) / Math.max(1, x1 - x0), (H - top - bottom - 40) / Math.max(1, y1 - y0)), .35, 1.6);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    moveCamera(s, availW / 2 - cx * s, top + (H - top - bottom) / 2 - cy * s, animate);
  }
  function moveCamera(s, x, y, animate) {
    if (!animate || reduce.matches) { scale = s; tx = x; ty = y; camAnim = null; draw(); return; }
    camAnim = { from: [scale, tx, ty], to: [s, x, y], start: performance.now() };
    requestFrame();
  }
  function focusNode(n) {
    const availW = W - panelWidth();
    const s = Math.max(scale, 1.1);
    moveCamera(s, availW / 2 - n.x * s, H * .45 - n.y * s, true);
  }
  function zoomAt(factor, x, y) {
    const s = clamp(scale * factor, .3, 3.2);
    const [wx, wy] = toWorld(x, y);
    scale = s; tx = x - wx * s; ty = y - wy * s; userMoved = true; camAnim = null; draw();
  }

  /* ---------- drawing ---------- */
  let hover = null, selected = null, frame = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    const oldW = W, oldH = H;
    W = Math.max(1, r.width); H = Math.max(1, r.height); dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    if (!oldW || !userMoved) fit(false); else { tx += (W - oldW) / 2; ty += (H - oldH) / 2; draw(); }
  }
  function focusSet() {
    const f = selected || hover;
    if (!f) return null;
    return new Set([f, ...f.nb]);
  }
  function fontFor(n, size) {
    const korean = /[ㄱ-힝]/.test(L(n.label));
    return `${n.kind === 'concept' ? 400 : 400} ${size}px ${korean || n.kind === 'concept' ? "'NotoSerifKR', serif" : "'SairaStencil', sans-serif"}`;
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#020a06'; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * .46, H * .48, 0, W * .46, H * .48, Math.max(W, H) * .62);
    glow.addColorStop(0, '#0b2015'); glow.addColorStop(.55, '#06150d'); glow.addColorStop(1, '#020906');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    const fs = focusSet(), f = selected || hover;
    // edges
    for (const l of links) {
      const [ax, ay] = toScreen(l.a), [bx, by] = toScreen(l.b);
      const lit = f && (l.a === f || l.b === f);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      ctx.strokeStyle = lit ? rgba('yellow', .85) : rgba('muted', fs ? .12 : .38);
      ctx.lineWidth = lit ? 1.1 : .8; ctx.stroke();
    }
    // nodes
    for (const n of NODES) {
      const [x, y] = toScreen(n), r = n.r * Math.sqrt(scale);
      const dim = fs && !fs.has(n), on = n === f;
      const ink = n.kind === 'root' ? 'amber' : n.kind === 'project' ? 'yellow' : 'ivory';
      const a = dim ? .18 : 1;
      if (n.kind === 'root') {
        // Seed of the map: bright orange core, ivory rim and a soft glow.
        const halo = ctx.createRadialGradient(x, y, r * .6, x, y, r * 4.6);
        halo.addColorStop(0, rgba('orange', .42 * a)); halo.addColorStop(.45, rgba('orange', .12 * a)); halo.addColorStop(1, rgba('orange', 0));
        ctx.beginPath(); ctx.arc(x, y, r * 4.6, 0, Math.PI * 2); ctx.fillStyle = halo; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = rgba('orange', a); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, r + .8, 0, Math.PI * 2); ctx.strokeStyle = rgba('ivory', .95 * a); ctx.lineWidth = 1.6; ctx.stroke();
      } else {
        if (n.kind !== 'concept' || on) { ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, Math.PI * 2); ctx.fillStyle = rgba(ink, (on ? .14 : .06) * a); ctx.fill(); }
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = rgba(ink, (n.kind === 'concept' ? .82 : 1) * a); ctx.fill();
      }
      if (on) { ctx.beginPath(); ctx.arc(x, y, r + (n.kind === 'root' ? 5 : 3.5), 0, Math.PI * 2); ctx.strokeStyle = rgba('yellow', .9); ctx.lineWidth = 1; ctx.stroke(); }
    }
    // labels
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const n of NODES) {
      const [x, y] = toScreen(n), r = n.r * Math.sqrt(scale);
      const near = fs && fs.has(n);
      let a = n.kind === 'concept' ? smooth(.7, 1.05, scale) : 1;
      if (fs) a = near ? 1 : a * .2;
      if (a <= .01) continue;
      const size = n.kind === 'concept' ? 11 : n.kind === 'root' ? 13 : 11.5;
      ctx.font = fontFor(n, size);
      const text = n.kind === 'project' && !/[ㄱ-힝]/.test(L(n.label)) ? L(n.label).toUpperCase() : L(n.label);
      ctx.fillStyle = `rgba(${INK.text.join(',')},${a * (n.kind === 'concept' ? .82 : 1)})`;
      ctx.shadowColor = 'rgba(2,10,6,.9)'; ctx.shadowBlur = 6;
      ctx.fillText(text, x, y + r + 6);
      ctx.shadowBlur = 0;
    }
  }
  function requestFrame() { if (!frame) frame = requestAnimationFrame(loop); }
  function loop(now) {
    frame = 0;
    let more = false;
    if (camAnim) {
      const t = smooth(0, 1, (now - camAnim.start) / 650);
      [scale, tx, ty] = camAnim.from.map((v, i) => v + (camAnim.to[i] - v) * t);
      if (t >= 1) camAnim = null; else more = true;
    }
    if (running) { tick(); more = true; if (!userMoved && !camAnim && !selected) fit(false); }
    draw();
    if (more) requestFrame();
  }

  /* ---------- pointer interaction ---------- */
  const pointers = new Map();
  let dragNode = null, panStart = null, pinch = null, downAt = null, moved = false;
  function hit(x, y) {
    let best = null, bd = Infinity;
    for (const n of NODES) {
      const [sx, sy] = toScreen(n), d = Math.hypot(sx - x, sy - y), r = n.r * Math.sqrt(scale) + (coarse.matches ? 14 : 7);
      if (d < r && d < bd) { best = n; bd = d; }
    }
    return best;
  }
  function local(e) { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  canvas.addEventListener('pointerdown', e => {
    const [x, y] = local(e);
    pointers.set(e.pointerId, [x, y]);
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      const [p, q] = [...pointers.values()];
      pinch = { d: Math.hypot(p[0] - q[0], p[1] - q[1]) || 1, scale };
      if (dragNode) { dragNode.fixed = false; dragNode = null; }
      panStart = null; moved = true; return;
    }
    downAt = [x, y]; moved = false;
    const n = hit(x, y);
    if (n) { dragNode = n; n.fixed = true; reheat(.25); }
    else { panStart = [x, y, tx, ty]; canvas.classList.add('is-panning'); }
  });
  canvas.addEventListener('pointermove', e => {
    const [x, y] = local(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [x, y]);
    if (pinch && pointers.size >= 2) {
      const [p, q] = [...pointers.values()];
      const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      zoomAt(clamp(pinch.scale * d / pinch.d, .3, 3.2) / scale, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      return;
    }
    if (downAt && Math.hypot(x - downAt[0], y - downAt[1]) > 5) moved = true;
    if (dragNode && moved) {
      [dragNode.x, dragNode.y] = toWorld(x, y); reheat(.2); userMoved = true;
    } else if (panStart && moved) {
      tx = panStart[2] + x - panStart[0]; ty = panStart[3] + y - panStart[1]; userMoved = true; camAnim = null; draw();
    } else if (!pointers.size || e.pointerType === 'mouse') {
      const n = hit(x, y);
      if (n !== hover) { hover = n; canvas.classList.toggle('is-over-node', !!n); draw(); }
    }
  });
  function release(e) {
    const wasTap = downAt && !moved && pointers.size <= 1;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (wasTap) {
      const n = dragNode || hit(...local(e));
      if (n) select(n, true); else if (selected) clearSelection();
    }
    if (dragNode) { dragNode.fixed = false; dragNode = null; reheat(.15); }
    panStart = null; downAt = null; canvas.classList.remove('is-panning');
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && hover && !pointers.size) { hover = null; canvas.classList.remove('is-over-node'); draw(); } });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const [x, y] = local(e);
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(Math.exp(-dy * (e.ctrlKey ? .01 : .0015)), x, y);
  }, { passive: false });
  document.querySelectorAll('[data-map-zoom]').forEach(b => b.addEventListener('click', () => {
    const step = Number(b.dataset.mapZoom);
    if (step === 0) { userMoved = false; fit(true); return; }
    const availW = W - panelWidth();
    zoomAt(step > 0 ? 1.3 : 1 / 1.3, availW / 2, H / 2);
  }));

  /* ---------- notes panel ---------- */
  const title = document.querySelector('#info-title'), copy = document.querySelector('#info-copy');
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function render(n) {
    document.querySelector('#node-kind').textContent = KIND[n.kind];
    title.textContent = L(n.title || n.label);
    title.lang = copy.lang = lang;
    const related = [...n.nb].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'concept' ? 1 : -1));
    const open = n.href ? `<a href="${n.href}">${esc(L(LINK))} ↗</a>` : '';
    copy.innerHTML = (n.meta ? `<p class="node-meta">${n.meta}</p>` : '') + `<p>${esc(L(n.copy))}</p>` +
      `<div class="result-label">CONNECTED / ${String(related.length).padStart(2, '0')}</div>` +
      `<div class="node-links">${related.map(r => `<button type="button" data-node="${r.id}">${esc(L(r.title && r.kind !== 'project' ? r.title : r.label))}</button>`).join('')}</div>` + open;
    document.querySelector('#map-note').textContent = L(NOTE);
    document.querySelectorAll('.dialog-lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }
  function select(n, fromCanvas) {
    selected = n; render(n);
    if (!dialog.open) dialog.show();
    focusNode(n);
    syncRows();
    announce.textContent = `${L(n.title || n.label)}, ${n.nb.size}개 연결`;
    if (!fromCanvas) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
    try { history.replaceState(null, '', '#' + n.id); } catch (_) { /* ignore */ }
  }
  function clearSelection() {
    selected = null; if (dialog.open) dialog.close(); syncRows(); draw();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* ignore */ }
  }
  copy.addEventListener('click', e => { const b = e.target.closest('[data-node]'); if (b) select(byId.get(b.dataset.node)); });
  document.querySelector('#info-close').addEventListener('click', clearSelection);
  document.querySelectorAll('.dialog-lang button').forEach(b => b.addEventListener('click', () => {
    lang = b.dataset.lang; try { localStorage.setItem('notes-lang', lang); } catch (_) { /* ignore */ }
    if (selected) render(selected); buildRows(); draw();
  }));

  /* ---------- node list (keyboard + screen readers) ---------- */
  const list = document.querySelector('#map-index-list');
  function buildRows() {
    list.replaceChildren();
    NODES.filter(n => n.kind === 'project').forEach(n => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'map-node-row'; b.dataset.node = n.id; b.setAttribute('aria-pressed', String(selected === n));
      b.innerHTML = `<span class="row-dot" aria-hidden="true"></span><span class="row-name"></span><span class="row-type"></span>`;
      b.querySelector('.row-name').textContent = L(n.title || n.label);
      b.querySelector('.row-type').textContent = (n.meta || '').split(' · ')[0];
      b.addEventListener('click', () => select(n));
      b.addEventListener('pointerenter', () => { hover = n; draw(); });
      b.addEventListener('pointerleave', () => { hover = null; draw(); });
      list.append(b);
    });
  }
  function syncRows() { list.querySelectorAll('[data-node]').forEach(b => b.setAttribute('aria-pressed', String(selected?.id === b.dataset.node))); }
  document.querySelector('#node-count').textContent = String(NODES.length).padStart(2, '0');
  if (coarse.matches) document.querySelector('#map-hint').textContent = 'DRAG TO MOVE · PINCH TO ZOOM · TAP A NODE';

  /* ---------- menu + keys ---------- */
  const menuButton = document.querySelector('#menu-toggle'), menu = document.querySelector('#mobile-menu');
  function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.textContent = 'Menu'; }
  menuButton.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.textContent = open ? 'Close' : 'Menu'; });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!menu.hidden) { closeMenu(); menuButton.focus(); } else if (dialog.open) { clearSelection(); }
  });

  /* ---------- start ---------- */
  buildRows();
  // Settle most of the layout before the first frame; let the rest drift into place.
  for (let i = 0; i < (reduce.matches ? 600 : 140); i++) tick();
  if (reduce.matches) { alpha = 0; running = false; }
  // Portrait screens: turn a wide layout upright so it fills the screen.
  { const r = canvas.getBoundingClientRect(); let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; NODES.forEach(n => { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y); });
    if (r.height > r.width * 1.2 && x1 - x0 > y1 - y0) NODES.forEach(n => { [n.x, n.y] = [-n.y, n.x]; }); }
  new ResizeObserver(resize).observe(canvas);
  resize();
  requestFrame();
  const fontsWanted = [document.fonts?.load("11px 'NotoSerifKR'", '개인의 경험을 집합으로 Knowledge'), document.fonts?.load("12px 'SairaStencil'", 'GRAPHRAG dandelion')];
  Promise.all(fontsWanted.filter(Boolean)).catch(() => {}).finally(draw);
  document.fonts?.ready.then(draw);
  const initial = byId.get(location.hash.slice(1));
  if (initial) setTimeout(() => select(initial, true), reduce.matches ? 0 : 500);
  addEventListener('pageshow', () => draw());
  addEventListener('hashchange', () => { const n = byId.get(location.hash.slice(1)); if (n && n !== selected) select(n, true); });
})();
