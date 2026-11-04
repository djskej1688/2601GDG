/* Rotatable 3D figures for the Input notes: unit cells, stacking, ionic structures, molecules,
 * Miller planes and directions. Canvas 2D with a simple orthographic projection; no dependencies.
 * Markup: <figure class="xtal" data-xtal="fcc"><div class="xtal-stage"></div><figcaption>…</figcaption></figure> */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const INK = { ivory: [221, 225, 199], yellow: [224, 214, 123], amber: [181, 146, 85], orange: [247, 146, 52], muted: [120, 146, 120], sky: [140, 190, 205], rose: [214, 140, 150], text: [232, 234, 219] };
  const rgba = (c, a) => `rgba(${INK[c].join(',')},${a})`;

  /* ---------- geometry helpers ---------- */
  const corners = []; for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) corners.push([x, y, z]);
  const faces = [[.5, .5, 0], [.5, .5, 1], [.5, 0, .5], [.5, 1, .5], [0, .5, .5], [1, .5, .5]];
  const body = [[.5, .5, .5]];
  const edges12 = [[.5, 0, 0], [.5, 1, 0], [.5, 0, 1], [.5, 1, 1], [0, .5, 0], [1, .5, 0], [0, .5, 1], [1, .5, 1], [0, 0, .5], [1, 0, .5], [0, 1, .5], [1, 1, .5]];
  const tetra = []; for (const x of [.25, .75]) for (const y of [.25, .75]) for (const z of [.25, .75]) tetra.push([x, y, z]);
  const tetraHalf = [[.25, .25, .25], [.75, .75, .25], [.75, .25, .75], [.25, .75, .75]];
  const fcc = [...corners, ...faces];
  const at = (list, kind) => list.map(p => [...p, kind]);
  const bondsBy = (atoms, d, kinds) => {
    const out = [];
    for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
      const a = atoms[i], b = atoms[j];
      if (kinds && !(kinds.includes(a[3]) && kinds.includes(b[3]) && a[3] !== b[3])) continue;
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      if (Math.abs(dist - d) < 1e-3) out.push([i, j]);
    }
    return out;
  };
  const quad = (pts, color, label) => ({ pts, color, label });
  const arrow = (from, to, color, label) => ({ from, to, color, label });

  // Close-packed layers (sphere radius 0.5, so a = 1); A, B and C sit over different hollows.
  function layer(shift, z, kind, reach) {
    const out = [];
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
      const x = i + j * .5 + shift[0], y = j * Math.sqrt(3) / 2 + shift[1];
      if (Math.hypot(x, y) <= reach) out.push([x, y, z, kind]);
    }
    return out;
  }
  const S = { A: [0, 0], B: [.5, Math.sqrt(3) / 6], C: [0, Math.sqrt(3) / 3] };
  const dz = Math.sqrt(2 / 3);
  const stack = order => order.split('').flatMap((L, k) => layer(S[L], k * dz, L, 1.05));

  function hcpCell() {
    const c = Math.sqrt(8 / 3), hex = [];
    for (let k = 0; k < 6; k++) hex.push([Math.cos(k * Math.PI / 3), Math.sin(k * Math.PI / 3)]);
    const atoms = [];
    for (const z of [0, c]) { hex.forEach(([x, y]) => atoms.push([x, y, z, 'hA'])); atoms.push([0, 0, z, 'hA']); }
    for (let k = 0; k < 3; k++) { const ang = Math.PI / 6 + k * 2 * Math.PI / 3; atoms.push([Math.cos(ang) / Math.sqrt(3), Math.sin(ang) / Math.sqrt(3), c / 2, 'hB']); }
    const lines = [];
    for (let k = 0; k < 6; k++) {
      const [x1, y1] = hex[k], [x2, y2] = hex[(k + 1) % 6];
      lines.push([[x1, y1, 0], [x2, y2, 0]], [[x1, y1, c], [x2, y2, c]], [[x1, y1, 0], [x1, y1, c]]);
    }
    return { atoms, lines, noBox: true };
  }

  const KINDS = {
    lat: { color: 'ivory', r: .085 }, ctr: { color: 'yellow', r: .085 },
    A: { color: 'ivory', r: .36, label: 'A 층' }, B: { color: 'yellow', r: .36, label: 'B 층' }, C: { color: 'orange', r: .36, label: 'C 층' },
    hA: { color: 'ivory', r: .2, label: 'A 층' }, hB: { color: 'yellow', r: .2, label: 'B 층' },
    Cl: { color: 'ivory', r: .17, label: 'Cl⁻' }, Na: { color: 'amber', r: .1, label: 'Na⁺' },
    Ca: { color: 'ivory', r: .15, label: 'Ca²⁺' }, F: { color: 'yellow', r: .1, label: 'F⁻' },
    S: { color: 'ivory', r: .15, label: 'S²⁻' }, Zn: { color: 'amber', r: .09, label: 'Zn²⁺' },
    Cs: { color: 'ivory', r: .16, label: 'Cs⁺' }, Cl2: { color: 'yellow', r: .17, label: 'Cl⁻' },
    Cd: { color: 'ivory', r: .1, label: 'C (Si, Ge)' },
    Ap: { color: 'ivory', r: .15, label: 'A (Ca, Sr…)' }, Bp: { color: 'orange', r: .09, label: 'B (Ti…)' }, Xp: { color: 'rose', r: .11, label: 'X (O)' },
    Cm: { color: 'amber', r: .26, label: 'C' }, H: { color: 'ivory', r: .16, label: 'H' }, Bm: { color: 'amber', r: .24, label: 'B' }, Fm: { color: 'yellow', r: .2, label: 'F' }, Be: { color: 'amber', r: .22, label: 'Be' },
    pt: { color: 'muted', r: .05 }
  };

  function molecule(center, kind, dirs, len) {
    const atoms = [[0, 0, 0, center], ...dirs.map(d => { const n = Math.hypot(...d); return [d[0] / n * len, d[1] / n * len, d[2] / n * len, kind]; })];
    return { atoms, bonds: dirs.map((_, i) => [0, i + 1]), noBox: true, spin: true };
  }

  const STRUCTS = {
    sc: () => ({ atoms: at(corners, 'lat'), packR: .5, contact: [[0, 0, 0], [1, 0, 0], 'a = 2r'] }),
    bcc: () => ({ atoms: [...at(corners, 'lat'), ...at(body, 'ctr')], packR: Math.sqrt(3) / 4, contact: [[0, 0, 0], [1, 1, 1], '√3·a = 4r'] }),
    fcc: () => ({ atoms: [...at(corners, 'lat'), ...at(faces, 'ctr')], packR: Math.sqrt(2) / 4, contact: [[0, 0, 0], [1, 1, 0], '√2·a = 4r'] }),
    hcp: hcpCell,
    abab: () => ({ atoms: stack('ABAB'), noBox: true, view: [.35, -.12] }),
    abca: () => ({ atoms: stack('ABCA'), noBox: true, view: [.35, -.12] }),
    nacl: () => {
      const atoms = [];
      for (const x of [0, .5, 1]) for (const y of [0, .5, 1]) for (const z of [0, .5, 1]) atoms.push([x, y, z, Math.round((x + y + z) * 2) % 2 ? 'Na' : 'Cl']);
      return { atoms, bonds: bondsBy(atoms, .5, ['Na', 'Cl']) };
    },
    caf2: () => { const atoms = [...at(fcc, 'Ca'), ...at(tetra, 'F')]; return { atoms, bonds: bondsBy(atoms, Math.sqrt(3) / 4, ['Ca', 'F']) }; },
    zns: () => { const atoms = [...at(fcc, 'S'), ...at(tetraHalf, 'Zn')]; return { atoms, bonds: bondsBy(atoms, Math.sqrt(3) / 4, ['S', 'Zn']) }; },
    cscl: () => { const atoms = [...at(corners, 'Cs'), ...at(body, 'Cl2')]; return { atoms, bonds: corners.map((_, i) => [i, 8]) }; },
    diamond: () => {
      const atoms = [...at(fcc, 'Cd'), ...at(tetraHalf, 'Cd')];
      return { atoms, bonds: bondsBy(atoms, Math.sqrt(3) / 4) };
    },
    perovskite: () => { const atoms = [...at(corners, 'Ap'), ...at(body, 'Bp'), ...at(faces, 'Xp')]; return { atoms, bonds: faces.map((_, i) => [8, 9 + i]) }; },
    ch4: () => molecule('Cm', 'H', [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]], .75),
    bf3: () => { const m = molecule('Bm', 'Fm', [[1, 0, 0], [-.5, Math.sqrt(3) / 2, 0], [-.5, -Math.sqrt(3) / 2, 0]], .8); m.view = [0, -.9]; return m; },
    beh2: () => molecule('Be', 'H', [[1, 0, 0], [-1, 0, 0]], .8),
    p100: () => ({ planes: [quad([[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], 'yellow', '(100)')], axes: true }),
    p110: () => ({ planes: [quad([[1, 0, 0], [0, 1, 0], [0, 1, 1], [1, 0, 1]], 'yellow', '(110)')], axes: true }),
    p111: () => ({ planes: [quad([[1, 0, 0], [0, 1, 0], [0, 0, 1]], 'yellow', '(111)')], axes: true }),
    p210: () => ({ planes: [quad([[.5, 0, 0], [0, 1, 0], [0, 1, 1], [.5, 0, 1]], 'yellow', '(210)')], axes: true, marks: [[[.5, 0, 0], 'x = ½'], [[0, 1, 0], 'y = 1']] }),
    p221: () => ({ planes: [quad([[.5, 0, 0], [0, .5, 0], [0, 0, 1]], 'yellow', '(221)')], axes: true, marks: [[[.5, 0, 0], 'x = ½'], [[0, .5, 0], 'y = ½'], [[0, 0, 1], 'z = 1']] }),
    p020: () => ({ planes: [quad([[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], 'yellow', '(010)'), quad([[0, .5, 0], [1, .5, 0], [1, .5, 1], [0, .5, 1]], 'orange', '(020)')], axes: true }),
    pneg: () => ({ planes: [quad([[0, 0, 0], [1, 0, 0], [1, 1, .5], [0, 1, .5]], 'yellow', '(0 1̄ 2)')], axes: true, origin: [0, 1, 0], view: [-.55, -.45], marks: [[[0, 1, 0], '새 원점'], [[0, 1, .5], 'z = ½']] }),
    fam100: () => ({ planes: [
      quad([[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], 'yellow', '(100)'), quad([[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], 'yellow', '(1̄00)'),
      quad([[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], 'orange', '(010)'), quad([[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], 'orange', '(01̄0)'),
      quad([[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], 'sky', '(001)'), quad([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], 'sky', '(001̄)')], axes: true, faint: true }),
    fam110: () => ({ planes: [
      quad([[1, 0, 0], [0, 1, 0], [0, 1, 1], [1, 0, 1]], 'yellow', '(110)'), quad([[0, 0, 0], [1, 1, 0], [1, 1, 1], [0, 0, 1]], 'yellow', '(1̄10)'),
      quad([[0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 0]], 'orange', '(011)'), quad([[0, 0, 0], [0, 1, 1], [1, 1, 1], [1, 0, 0]], 'orange', '(01̄1)'),
      quad([[1, 0, 0], [0, 0, 1], [0, 1, 1], [1, 1, 0]], 'sky', '(101)'), quad([[0, 0, 0], [1, 0, 1], [1, 1, 1], [0, 1, 0]], 'sky', '(1̄01)')], axes: true, faint: true, noLabels: true }),
    fam111: () => ({ planes: [
      quad([[1, 0, 0], [0, 1, 0], [0, 0, 1]], 'yellow', '(111)'), quad([[1, 0, 0], [0, 1, 0], [1, 1, 1]], 'orange', '(111̄)'),
      quad([[1, 0, 0], [0, 0, 1], [1, 1, 1]], 'sky', '(11̄1)'), quad([[0, 1, 0], [0, 0, 1], [1, 1, 1]], 'rose', '(1̄11)')], axes: true }),
    dirs: () => ({ arrows: [arrow([0, 0, 0], [1, 0, 0], 'yellow', '[100]'), arrow([0, 0, 0], [1, 1, 0], 'orange', '[110]'), arrow([0, 0, 0], [1, 1, 1], 'sky', '[111]'), arrow([0, 0, 0], [.5, .5, 1], 'rose', '[112]'), arrow([1, 0, 0], [0, 1, 0], 'ivory', '[1̄10]')], axes: true }),
    perp: () => ({ planes: [quad([[1, 0, 0], [0, 1, 0], [0, 0, 1]], 'yellow', '(111)')], arrows: [arrow([0, 0, 0], [1, 1, 1], 'orange', '[111]')], axes: true }),
    fcc111: () => ({ atoms: [...at(corners, 'pt'), ...at(faces, 'pt'), ...at([[1, 0, 0], [0, 1, 0], [0, 0, 1], [.5, .5, 0], [.5, 0, .5], [0, .5, .5]], 'ctr')], planes: [quad([[1, 0, 0], [0, 1, 0], [0, 0, 1]], 'yellow', '(111)')], axes: true })
  };

  /* ---------- rendering ---------- */
  function build(key) {
    const s = STRUCTS[key]?.();
    if (!s) return null;
    s.atoms = s.atoms || []; s.planes = s.planes || []; s.arrows = s.arrows || []; s.lines = s.lines || []; s.bonds = s.bonds || [];
    const pts = [...s.atoms.map(a => a.slice(0, 3)), ...s.planes.flatMap(p => p.pts), ...s.arrows.flatMap(a => [a.from, a.to]), ...s.lines.flat()];
    if (!s.noBox) pts.push([0, 0, 0], [1, 1, 1]);
    if (s.axes) { const o = s.origin || [0, 0, 0]; pts.push([o[0] + 1.3, o[1], o[2]], [o[0], o[1] + 1.3, o[2]], [o[0], o[1], o[2] + 1.3]); }
    const lo = [0, 1, 2].map(i => Math.min(...pts.map(p => p[i]))), hi = [0, 1, 2].map(i => Math.max(...pts.map(p => p[i])));
    s.center = lo.map((v, i) => (v + hi[i]) / 2);
    s.extent = Math.max(...hi.map((v, i) => v - lo[i]), 1) + (s.atoms.length && s.noBox ? .9 : .2);
    return s;
  }

  function mount(fig) {
    const key = fig.dataset.xtal, s = build(key);
    if (!s) return;
    const stage = fig.querySelector('.xtal-stage') || fig;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', (fig.querySelector('figcaption')?.textContent || key) + ' (드래그해서 돌려 볼 수 있는 3D 그림)');
    stage.append(canvas);
    const ctx = canvas.getContext('2d');
    let yaw = s.view ? s.view[0] : .62, pitch = s.view ? s.view[1] : -.42, packed = false, auto = !reduce.matches, last = 0, visible = false, raf = 0, W = 0, H = 0, dpr = 1;
    const tools = document.createElement('div'); tools.className = 'xtal-tools';
    const hint = document.createElement('span'); hint.textContent = '드래그해서 돌려 보기'; tools.append(hint);
    if (s.packR) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = '원자 크기: 점'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { packed = !packed; b.textContent = packed ? '원자 크기: 맞닿게' : '원자 크기: 점'; b.setAttribute('aria-pressed', String(packed)); draw(); });
      tools.append(b);
    }
    const legendKinds = [...new Set(s.atoms.map(a => a[3]))].filter(k => KINDS[k]?.label);
    if (legendKinds.length) {
      const lg = document.createElement('span'); lg.className = 'xtal-legend';
      legendKinds.forEach(k => { const i = document.createElement('i'); i.style.setProperty('--c', rgba(KINDS[k].color, 1)); i.textContent = KINDS[k].label; lg.append(i); });
      tools.append(lg);
    }
    stage.after(tools);

    function project(p) {
      const x = p[0] - s.center[0], y = p[1] - s.center[1], z = p[2] - s.center[2];
      // z is "up"; rotate around the vertical axis (yaw), then tilt (pitch).
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const x1 = x * cy - y * sy, y1 = x * sy + y * cy;
      const depth = y1 * cp - z * sp, up = y1 * sp + z * cp;
      const k = Math.min(W, H) * .64 / s.extent, persp = 1 / (1 + depth * .08);
      return [W / 2 + x1 * k * persp, H / 2 - up * k * persp, depth, k * persp];
    }
    function line(a, b, color, alpha, width, dash) {
      const p = project(a), q = project(b);
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]);
      ctx.setLineDash(dash || []); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = width; ctx.stroke(); ctx.setLineDash([]);
    }
    function label(p, text, color) {
      const q = project(p);
      ctx.font = "11px 'SairaStencil', 'NotoSerifKR', sans-serif"; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(color || 'text', .95); ctx.shadowColor = 'rgba(2,10,6,.95)'; ctx.shadowBlur = 5;
      ctx.fillText(text, q[0] + 6, q[1] - 6); ctx.shadowBlur = 0;
    }
    function draw() {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // unit cell box
      if (!s.noBox) {
        for (const a of corners) for (const b of corners) {
          const d = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
          if (d === 1 && a < b) line(a, b, 'muted', s.faint ? .35 : .6, 1);
        }
      }
      s.lines.forEach(([a, b]) => line(a, b, 'muted', .6, 1));
      if (s.axes) {
        const o = s.origin || [0, 0, 0];
        [[1, 0, 0, 'x'], [0, 1, 0, 'y'], [0, 0, 1, 'z']].forEach(([dx, dy, dz2, n]) => {
          const end = [o[0] + dx * 1.3, o[1] + dy * 1.3, o[2] + dz2 * 1.3];
          line(o, end, 'muted', .9, 1, [3, 3]); label(end, n, 'muted');
        });
      }
      if (s.contact) line(s.contact[0], s.contact[1], 'orange', .9, 1.4, [5, 4]);
      s.bonds.forEach(([i, j]) => line(s.atoms[i], s.atoms[j], 'muted', .75, 1.6));
      const items = [];
      s.atoms.forEach(a => items.push({ d: project(a)[2], f: () => {
        const [x, y, , k] = project(a), kind = KINDS[a[3]] || KINDS.lat;
        const r = Math.max(2, (packed && s.packR ? s.packR : kind.r) * k);
        const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
        g.addColorStop(0, rgba(kind.color, packed ? .75 : 1)); g.addColorStop(.7, rgba(kind.color, packed ? .5 : .85)); g.addColorStop(1, rgba('muted', packed ? .35 : .7));
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = 'rgba(2,10,6,.55)'; ctx.lineWidth = .8; ctx.stroke();
      } }));
      s.planes.forEach(pl => {
        const pr = pl.pts.map(project), d = pr.reduce((t, p) => t + p[2], 0) / pr.length;
        items.push({ d, f: () => {
          ctx.beginPath(); pr.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
          ctx.fillStyle = rgba(pl.color, s.faint ? .14 : .26); ctx.fill(); ctx.strokeStyle = rgba(pl.color, .9); ctx.lineWidth = 1.2; ctx.stroke();
        } });
      });
      s.arrows.forEach(ar => items.push({ d: (project(ar.from)[2] + project(ar.to)[2]) / 2 - .5, f: () => {
        const p = project(ar.from), q = project(ar.to), ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.strokeStyle = rgba(ar.color, .95); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0] - 9 * Math.cos(ang - .4), q[1] - 9 * Math.sin(ang - .4)); ctx.lineTo(q[0] - 9 * Math.cos(ang + .4), q[1] - 9 * Math.sin(ang + .4)); ctx.closePath(); ctx.fillStyle = rgba(ar.color, .95); ctx.fill();
      } }));
      items.sort((a, b) => b.d - a.d).forEach(it => it.f());
      // labels on top
      s.planes.forEach(pl => { if (!s.noLabels) { const c = pl.pts.reduce((t, p) => t.map((v, i) => v + p[i] / pl.pts.length), [0, 0, 0]); label(c, pl.label, pl.color); } });
      s.arrows.forEach(ar => label(ar.to, ar.label, ar.color));
      (s.marks || []).forEach(([p, t]) => { const q = project(p); ctx.beginPath(); ctx.arc(q[0], q[1], 2.5, 0, Math.PI * 2); ctx.fillStyle = rgba('orange', 1); ctx.fill(); label(p, t, 'orange'); });
      if (s.contact) { const m = s.contact[0].map((v, i) => (v + s.contact[1][i]) / 2); label(m, s.contact[2], 'orange'); }
    }
    function resize() {
      const r = stage.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      draw();
    }
    function tick(now) {
      raf = 0;
      if (auto && visible) { yaw += Math.min(.05, (now - (last || now)) / 1000 * .35); last = now; draw(); raf = requestAnimationFrame(tick); }
    }
    const kick = () => { if (!raf && auto && visible) { last = 0; raf = requestAnimationFrame(tick); } };
    let drag = null;
    canvas.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, yaw, pitch]; auto = false; canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-dragging'); });
    canvas.addEventListener('pointermove', e => {
      if (!drag) return;
      yaw = drag[2] + (e.clientX - drag[0]) * .01;
      pitch = Math.max(-1.45, Math.min(1.45, drag[3] + (e.clientY - drag[1]) * .01));
      draw();
    });
    const end = () => { drag = null; canvas.classList.remove('is-dragging'); };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { resize(); kick(); } }).observe(stage);
    document.fonts?.ready.then(draw);
  }

  const init = () => document.querySelectorAll('figure.xtal[data-xtal]').forEach(f => { if (!f.dataset.ready) { f.dataset.ready = '1'; mount(f); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
