/* Home menu effects: seeding dodges the pointer and never opens.
 * dandelion (seeds on the wind) and untitled (melting) come from nav-effects.js.
 * Plain DOM + canvas, no dependencies. Reduced motion skips the effects. */
(() => {
  'use strict';
  const menu = document.querySelector('#home-menu');
  if (!menu) return;
  const seeding = menu.querySelector('[data-effect="dodge"]');
  const toast = document.querySelector('#not-ready');
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const menuOpen = () => !menu.inert && menu.closest('.open');

  /* ---------- seeding: never clickable ---------- */
  let ox = 0, oy = 0, near = false, attempts = 0, lastAttempt = 0, toastTimer = 0, homeTimer = 0, lastTouch = -1e9;

  function place() { seeding.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px)`; }
  function geometry() {
    const r = seeding.getBoundingClientRect();
    const m = new DOMMatrixReadOnly(getComputedStyle(seeding).transform);
    const bx = r.left + r.width / 2 - m.m41, by = r.top + r.height / 2 - m.m42;
    return { bx, by, w: r.width, h: r.height };
  }
  function clampOffset(g, x, y) {
    const mx = g.w / 2 + 14, my = g.h / 2 + 14;
    return [clamp(g.bx + x, mx, innerWidth - mx) - g.bx, clamp(g.by + y, my, innerHeight - my) - g.by];
  }
  function showToast() {
    if (!toast) return;
    const g = geometry();
    toast.hidden = true;
    toast.textContent = 'not updated yet!';
    toast.style.left = `${clamp(g.bx + ox, 90, innerWidth - 90)}px`;
    toast.style.top = `${clamp(g.by + oy - 26, 50, innerHeight - 20)}px`;
    void toast.offsetWidth;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
  }
  function attempt(force, needed = 4) {
    const now = performance.now();
    if (!force && now - lastAttempt < 260) return;
    lastAttempt = now;
    attempts += 1;
    if (force || attempts >= needed) { attempts = 0; showToast(); }
  }
  function goHomeLater() {
    clearTimeout(homeTimer);
    homeTimer = setTimeout(() => { ox = 0; oy = 0; place(); }, 2600);
  }
  function flee(px, py, radius) {
    const g = geometry();
    const cx = g.bx + ox, cy = g.by + oy;
    let dx = cx - px, dy = cy - py;
    const d = Math.hypot(dx, dy);
    if (d >= radius) { if (d > radius * 2.2) near = false; return; }
    if (!near) { near = true; attempt(false); }
    if (d < 0.01) { const a = rand(0, Math.PI * 2); dx = Math.cos(a); dy = Math.sin(a); } else { dx /= d; dy /= d; }
    const push = radius - d + 56;
    let [nx, ny] = clampOffset(g, ox + dx * push, oy + dy * push);
    const tooFar = Math.hypot(nx, ny) > Math.min(260, Math.max(innerWidth, innerHeight) * .32);
    const stillNear = Math.hypot(g.bx + nx - px, g.by + ny - py) < radius * .9;
    if (tooFar || stillNear) {
      // Cornered: hop to the other side of the pointer, near the original spot.
      const ax = g.bx - px, ay = g.by - py, al = Math.hypot(ax, ay) || 1;
      [nx, ny] = clampOffset(g, ax / al * rand(110, 170) + rand(-30, 30), ay / al * rand(70, 120) + rand(-20, 20));
      if (Math.hypot(g.bx + nx - px, g.by + ny - py) < radius) [nx, ny] = clampOffset(g, -nx, -ny - 90);
    }
    ox = nx; oy = ny; place(); goHomeLater();
  }

  if (seeding) {
    document.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' || !menuOpen()) return;
      flee(e.clientX, e.clientY, 74);
    }, { passive: true });
    seeding.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      e.preventDefault();
      const touch = e.pointerType === 'touch';
      if (touch) lastTouch = performance.now();
      flee(e.clientX, e.clientY, 120);
      attempt(!touch, 3);
    });
    seeding.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      if (performance.now() - lastTouch > 700) attempt(true); // a tap was already counted on pointerdown
    });
    seeding.addEventListener('contextmenu', e => e.preventDefault());
    seeding.addEventListener('dragstart', e => e.preventDefault());
    addEventListener('resize', () => { ox = 0; oy = 0; place(); });
  }

  /* ---------- dandelion and untitled: shared effects from nav-effects.js ---------- */
  const shared = window.dandellasEffects;
  if (shared) {
    shared.bind(menu.querySelector('[data-effect="seeds"]'), 'seeds');
    shared.bind(menu.querySelector('[data-effect="melt"]'), 'melt');
  }

  // Coming back through the browser history restores a clean menu.
  addEventListener('pageshow', () => {
    if (seeding) { ox = 0; oy = 0; place(); }
    if (toast) toast.hidden = true;
  });
})();
