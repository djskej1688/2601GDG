/* Original abstract project films. Invented geometry only: no company data,
 * evidence, predictions, financial results or private research. No dependencies. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => { const q = clamp((t - a) / (b - a)); return q * q * (3 - 2 * q); };
  const point = (a, b, t) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) });
  const seeded = seed => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const INK = { ivory: [221, 225, 199], yellow: [224, 214, 123], muted: [120, 146, 120], amber: [181, 146, 85] };
  const color = (name, alpha) => `rgba(${INK[name].join(',')},${clamp(alpha)})`;
  const phase = (id, label, name, index, start, end) => Object.freeze({ id, label, name, index, start, end });
  const PHASES = Object.freeze({
    lattice: Object.freeze([
      phase('field', '01 / EXPERIENCES', 'A field of distinct points', 0, 0, 5),
      phase('sets', '02 / SETS', 'Intersecting sets', 1, 5, 10),
      phase('relations', '03 / RELATIONS', 'Relationships emerge', 2, 10, 15),
      phase('lattice', '04 / LATTICE', 'A lattice takes form', 3, 15, 20),
      phase('connection', '05 / CONNECTION', 'A new connection', 4, 20, 24)
    ]),
    financial: Object.freeze([
      phase('documents', '01 / DOCUMENTS', 'An abstract document field', 0, 0, 5),
      phase('gather', '02 / GATHER', 'Documents gather into three groups', 1, 5, 10),
      phase('relations', '03 / RELATIONS', 'A graph emerges', 2, 10, 15),
      phase('compare', '04 / COMPARE', 'Relationships are compared', 3, 15, 20),
      phase('whole', '05 / WHOLE', 'The connected whole', 4, 20, 24)
    ]),
    mch: Object.freeze([
      phase('field', '01 / FIELD', 'A field of candidate points', 0, 0, 5),
      phase('condition', '02 / CONDITION', 'A boundary is drawn', 1, 5, 10),
      phase('hunt', '03 / HUNT', 'A scan sorts the points', 2, 10, 15),
      phase('narrow', '04 / NARROW', 'The region tightens', 3, 15, 20),
      phase('found', '05 / FOUND', 'One point remains', 4, 20, 24)
    ])
  });

  class ProjectFilm {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.kind = ['financial', 'mch'].includes(options.kind) ? options.kind : 'lattice';
      this._duration = Number.isFinite(options.duration) && options.duration > 0 ? options.duration : 24;
      this._time = 0; this._playing = false; this._destroyed = false; this._raf = 0;
      this._anchor = 0; this._lastDraw = -Infinity; this._lastPhase = ''; this._ended = false;
      this._reduced = !!options.reducedMotion;
      this._callbacks = { onTime: options.onTime, onPhase: options.onPhase, onEnd: options.onEnd, onError: options.onError };
      this.available = false; this.error = null;
      this.artStatus = ProjectFilm.ART_STATUS;
      try { this.ctx = canvas?.getContext?.('2d', { alpha: false }); } catch (_) { this.ctx = null; }
      if (!this.ctx) { this._fail('Canvas 2D is unavailable for this project film.'); return; }
      this._doc = canvas.ownerDocument || document;
      this._tick = this._tick.bind(this);
      this._handleVisibility = () => { if (this._doc.hidden && this._playing) this.pause(); };
      this._doc.addEventListener('visibilitychange', this._handleVisibility);
      this._buildGeometry();
      this.available = true;
      this.resize();
      if (typeof ResizeObserver !== 'undefined') { this._observer = new ResizeObserver(() => this.resize()); this._observer.observe(canvas); }
      this.canvas.dataset.filmState = 'paused';
      this._notify();
    }
    get duration() { return this._duration; }
    get currentTime() { return this._time; }
    get playing() { return this._playing; }
    get reducedMotion() { return this._reduced; }
    get phase() {
      const t = this._time / this._duration * 24;
      const p = PHASES[this.kind].find(v => t < v.end) || PHASES[this.kind][4];
      return { ...p, start: p.start * this._duration / 24, end: p.end * this._duration / 24, reducedMotion: this._reduced, artistic: true, kind: this.kind };
    }
    _call(name, ...args) { if (typeof this._callbacks[name] === 'function') try { this._callbacks[name](...args); } catch (error) { console.warn(`ProjectFilm ${name} callback:`, error); } }
    _fail(message) { this.available = false; this.error = message; if (this.canvas?.dataset) this.canvas.dataset.filmState = 'unavailable'; this._call('onError', message); }
    _notify() {
      if (this._destroyed) return;
      const p = this.phase, key = p.id + (this._reduced ? ':reduced' : '');
      if (key !== this._lastPhase) { this._lastPhase = key; this._call('onPhase', p); }
      this._call('onTime', this._time, this._duration, p);
    }
    play() {
      if (!this.available || this._destroyed || this._playing) return false;
      if (this._time >= this._duration) this._time = 0;
      this._ended = false; this._playing = true; this._anchor = performance.now() - this._time * 1000;
      this._lastDraw = -Infinity; this.canvas.dataset.filmState = 'playing'; this._notify();
      this._raf = requestAnimationFrame(this._tick); return true;
    }
    pause() {
      if (this._destroyed) return;
      if (this._playing) this._time = clamp((performance.now() - this._anchor) / 1000, 0, this._duration);
      this._playing = false; cancelAnimationFrame(this._raf); this._raf = 0;
      if (this.available) { this.canvas.dataset.filmState = this._time >= this._duration ? 'ended' : 'paused'; this._draw(); }
      this._notify();
    }
    seek(seconds) {
      if (this._destroyed) return;
      const n = Number(seconds); this._time = clamp(Number.isFinite(n) ? n : 0, 0, this._duration); this._ended = false;
      if (this._playing) this._anchor = performance.now() - this._time * 1000;
      if (this._time >= this._duration && this._playing) { this._playing = false; cancelAnimationFrame(this._raf); this._raf = 0; }
      if (this.available) { this.canvas.dataset.filmState = this._playing ? 'playing' : this._time >= this._duration ? 'ended' : 'paused'; this._draw(); }
      this._notify();
    }
    setReducedMotion(value) {
      this._reduced = !!value;
      if (this._reduced) this.pause();
      else if (this.available && !this._destroyed) { this._draw(); this._notify(); }
      return this._reduced;
    }
    resize() {
      if (!this.available || this._destroyed) return;
      const r = this.canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width || this._w || 640));
      const h = Math.max(1, Math.round(r.height || this._h || 480));
      // Bound the backing store on large screens without changing CSS geometry.
      const dpr = Math.max(.5, Math.min(2, globalThis.devicePixelRatio || 1, 2400 / Math.max(w, h)));
      if (w === this._w && h === this._h && dpr === this._dpr) return;
      this._w = w; this._h = h; this._dpr = dpr; this._fps = w < 700 ? 24 : 30;
      this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
      this._draw();
    }
    destroy() {
      if (this._destroyed) return;
      this._playing = false; cancelAnimationFrame(this._raf); this._raf = 0;
      this._observer?.disconnect(); this._doc?.removeEventListener('visibilitychange', this._handleVisibility);
      if (this.canvas?.dataset) this.canvas.dataset.filmState = 'destroyed';
      this._destroyed = true; this._callbacks = {};
    }
    _tick(now) {
      if (!this._playing || this._destroyed) return;
      this._time = clamp((now - this._anchor) / 1000, 0, this._duration);
      const interval = 1000 / this._fps, elapsed = now - this._lastDraw;
      if (elapsed >= interval || this._time >= this._duration) {
        this._draw(); this._lastDraw = Number.isFinite(this._lastDraw) ? now - elapsed % interval : now;
      }
      const ended = this._time >= this._duration;
      if (ended) { this._playing = false; this._raf = 0; this.canvas.dataset.filmState = 'ended'; }
      this._notify();
      if (ended) { if (!this._ended) { this._ended = true; this._call('onEnd'); } return; }
      if (this._playing) this._raf = requestAnimationFrame(this._tick);
    }
    _buildGeometry() {
      const rand = seeded(4619);
      this._sets = [{ x: -.34, y: -.08, angle: -.48 }, { x: .34, y: -.08, angle: .48 }, { x: 0, y: .36, angle: Math.PI / 2 }];
      this._lattice = [
        { x: 0, y: .96 }, { x: -.78, y: .33 }, { x: 0, y: .33 }, { x: -.78, y: -.33 },
        { x: .78, y: .33 }, { x: 0, y: -.33 }, { x: .78, y: -.33 }, { x: 0, y: -.96 }
      ];
      this._latticeEdges = [];
      for (let a = 0; a < 8; a++) for (let bit = 1; bit <= 4; bit *= 2) if (!(a & bit)) this._latticeEdges.push([a, a | bit]);
      this._experiences = Array.from({ length: 48 }, (_, i) => {
        const angle = i * 2.39996323, radius = Math.sqrt((i + .8) / 48);
        const group = i % 3, set = this._sets[group], local = (i % 16) / 16 * TAU;
        return { field: { x: Math.cos(angle) * radius * 1.11, y: Math.sin(angle) * radius * .94 },
          set: { x: set.x + Math.cos(local) * (.26 + rand() * .25), y: set.y + Math.sin(local) * (.25 + rand() * .28) },
          node: i % 8, group, seed: rand(), radius: .7 + rand() * 1.3 };
      });
      this._clusters = [{ x: -.66, y: -.10 }, { x: .42, y: -.53 }, { x: .43, y: .57 }];
      this._documents = Array.from({ length: 54 }, (_, i) => {
        const group = Math.floor(i / 18), local = i % 18, angle = local * 2.39996323 + group * .6;
        const radius = Math.sqrt((local + 1) / 18) * .31, center = this._clusters[group];
        return { field: { x: (i % 9 - 4) * .238, y: (Math.floor(i / 9) - 2.5) * .277 },
          graph: { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius },
          group, local, seed: rand(), size: .84 + rand() * .28 };
      });
      const mrand = seeded(9127);
      this._candidates = Array.from({ length: 77 }, (_, i) => ({
        x: ((i % 11) - 5) * .19 + (mrand() - .5) * .07, y: (Math.floor(i / 11) - 3) * .2 + (mrand() - .5) * .07, seed: mrand()
      }));
      this._target = this._candidates.reduce((best, p) => (this._region(p, .32) < this._region(best, .32) ? p : best));
      this.geometryInfo = Object.freeze({ kind: this.kind, source: 'Original abstract invented geometry. No datasets.', points: this.kind === 'lattice' ? 48 : this.kind === 'mch' ? 77 : 54 });
    }
    _line(a, b, alpha, ink = 'muted', width = .7, portion = 1) {
      if (alpha <= 0 || portion <= 0) return;
      const c = this.ctx, end = point(a, b, clamp(portion));
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(end.x, end.y);
      c.strokeStyle = color(ink, alpha); c.lineWidth = width / this._scale; c.stroke();
    }
    _dot(p, radius, alpha, ink = 'ivory', halo = false) {
      if (alpha <= 0) return;
      const c = this.ctx, r = radius / this._scale;
      if (halo) { c.beginPath(); c.arc(p.x, p.y, r * 3.6, 0, TAU); c.fillStyle = color(ink, alpha * .065); c.fill(); }
      c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fillStyle = color(ink, alpha); c.fill();
    }
    _ellipse(p, rx, ry, angle, alpha, ink = 'muted', portion = 1) {
      if (alpha <= 0) return;
      const c = this.ctx; c.beginPath(); c.ellipse(p.x, p.y, rx, ry, angle, -.5 * Math.PI, -.5 * Math.PI + TAU * portion);
      c.strokeStyle = color(ink, alpha); c.lineWidth = .7 / this._scale; c.stroke();
    }
    _curve(a, b, bend, alpha, ink = 'yellow', portion = 1, width = .9) {
      if (alpha <= 0 || portion <= 0) return;
      const c = this.ctx, control = { x: (a.x + b.x) / 2 + bend, y: (a.y + b.y) / 2 - Math.abs(bend) * .5 };
      c.beginPath(); c.moveTo(a.x, a.y);
      for (let i = 1; i <= 40; i++) {
        const t = i / 40 * clamp(portion), s = 1 - t;
        c.lineTo(s * s * a.x + 2 * s * t * control.x + t * t * b.x, s * s * a.y + 2 * s * t * control.y + t * t * b.y);
      }
      c.strokeStyle = color(ink, alpha); c.lineWidth = width / this._scale; c.stroke();
    }
    _draw() {
      if (!this.available || this._destroyed) return;
      const c = this.ctx, w = this._w, h = this._h, time = this._time / this._duration * 24;
      c.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
      c.fillStyle = '#020a06'; c.fillRect(0, 0, w, h);
      const glow = c.createRadialGradient(w * .48, h * .51, 0, w * .48, h * .51, Math.max(w, h) * .62);
      glow.addColorStop(0, '#0b2015'); glow.addColorStop(.55, '#06150d'); glow.addColorStop(1, '#020906');
      c.fillStyle = glow; c.fillRect(0, 0, w, h);
      const t = this._reduced ? 22 : time;
      const close = this._reduced ? 0 : smooth(11, 14, t) * (1 - smooth(19, 23, t));
      const slide = this._reduced ? 0 : (smooth(15, 18, t) - smooth(20, 24, t));
      const zoom = 1 + close * .22;
      this._scale = Math.min(w * .40, h * .35) * zoom;
      c.save(); c.translate(w * .5 - slide * w * .035, h * .52 + close * h * .016);
      c.scale(this._scale, this._scale);
      c.rotate(this._reduced ? Math.sin(time * .08) * .018 : Math.sin(t * .09) * .025);
      if (this.kind === 'financial') this._drawFinancial(t, this._reduced ? time * .12 : time);
      else if (this.kind === 'mch') this._drawMch(t, this._reduced ? time * .12 : time);
      else this._drawLattice(t, this._reduced ? time * .12 : time);
      c.restore();
    }
    _drawLattice(t, motion) {
      const gather = smooth(3, 8, t), lattice = smooth(9.5, 15, t);
      const fieldAlpha = mix(.78, .20, lattice), setAlpha = smooth(4.1, 7, t) * (1 - smooth(11, 15, t));
      const coords = this._experiences.map((e, i) => {
        const drift = this._reduced ? 0 : (1 - lattice) * .014;
        const start = { x: e.field.x + Math.sin(motion * .20 + i) * drift, y: e.field.y + Math.cos(motion * .17 + i * .7) * drift };
        const target = this._lattice[e.node], orbit = e.seed * TAU;
        return point(point(start, e.set, gather), { x: target.x + Math.cos(orbit) * .037, y: target.y + Math.sin(orbit) * .037 }, lattice);
      });
      for (let i = 0; i < 3; i++) {
        const s = this._sets[i]; this._ellipse(s, .70, .49, s.angle, setAlpha * .62, i === 1 ? 'yellow' : 'muted', smooth(4.1 + i * .35, 7.6 + i * .35, t));
      }
      for (let i = 0; i < coords.length; i++) {
        const e = this._experiences[i], entrance = .45 + .55 * smooth(e.seed * 1.7, 2 + e.seed * 1.7, t);
        if (i % 3 === 0) this._line(coords[i], coords[(i + 9) % coords.length], smooth(7, 10, t) * (1 - smooth(13, 16, t)) * .22);
        this._dot(coords[i], e.radius * (1 - lattice * .48), fieldAlpha * entrance, e.group === 1 ? 'yellow' : 'ivory');
      }
      const relation = smooth(10.7, 15.5, t);
      this._latticeEdges.forEach(([a, b], i) => this._line(this._lattice[a], this._lattice[b], relation * .48, 'muted', .85, smooth(11 + i * .13, 14.1 + i * .13, t)));
      this._lattice.forEach((p, i) => {
        this._dot(p, i === 0 || i === 7 ? 3 : 2.4, relation * .94, i === 7 ? 'yellow' : 'ivory', true);
        if (i === 0 || i === 7) this._ellipse(p, .049, .049, 0, relation * .35, 'yellow');
      });
      const connect = smooth(19.6, 22.6, t), a = this._lattice[1], b = this._lattice[6];
      this._curve(a, b, -.30, connect * .84, 'yellow', connect, 1.2);
      if (connect > 0) {
        const q = clamp((t - 20) / 2.3), s = 1 - q, control = { x: (a.x + b.x) / 2 - .30, y: (a.y + b.y) / 2 - .15 };
        const p = { x: s * s * a.x + 2 * s * q * control.x + q * q * b.x, y: s * s * a.y + 2 * s * q * control.y + q * q * b.y };
        this._dot(p, 3.2, .95 * connect, 'yellow', true);
        this._dot(a, 3, connect * .9, 'yellow', true); this._dot(b, 3, connect * .9, 'yellow', true);
      }
    }
    _drawFinancial(t, motion) {
      const gather = smooth(3.8, 9.2, t), resolve = smooth(7.8, 11.6, t);
      const coords = this._documents.map(e => point(e.field, e.graph, gather));
      const graph = smooth(8.8, 13.5, t), comparison = smooth(14, 17, t);
      for (let group = 0; group < 3; group++) {
        const start = group * 18;
        for (let j = 1; j < 18; j++) {
          const parent = Math.floor((j - 1) / 2);
          this._line(coords[start + parent], coords[start + j], graph * .30, 'muted', .65, smooth(9 + j * .11, 11 + j * .11, t));
        }
        this._ellipse(this._clusters[group], .39, .34, group * .3, graph * .14, 'muted');
      }
      this._documents.forEach((e, i) => {
        const p = coords[i], paper = (1 - resolve) * (.42 + .28 * smooth(e.seed, 2.5 + e.seed, t));
        if (paper > .002) {
          const c = this.ctx, width = .058 * e.size, height = .086 * e.size, fold = width * .24;
          c.save(); c.translate(p.x, p.y); c.rotate((e.seed - .5) * gather * .38);
          c.beginPath(); c.moveTo(-width / 2, -height / 2); c.lineTo(width / 2 - fold, -height / 2);
          c.lineTo(width / 2, -height / 2 + fold); c.lineTo(width / 2, height / 2); c.lineTo(-width / 2, height / 2); c.closePath();
          c.strokeStyle = color(e.group === 1 ? 'yellow' : 'ivory', paper); c.lineWidth = .7 / this._scale; c.stroke();
          for (let line = 0; line < 3; line++) this._line({ x: -width * .29, y: height * (-.14 + line * .18) }, { x: width * (line === 2 ? .06 : .27), y: height * (-.14 + line * .18) }, paper * .45, 'muted', .5);
          c.restore();
        }
        this._dot(p, e.local === 0 ? 3 : 1.1 + e.seed * .65, resolve * (e.local === 0 ? .95 : .7), e.group === 1 ? 'yellow' : 'ivory', e.local === 0);
      });
      const pairs = [[0, 1, -.12], [1, 2, .18], [0, 2, -.10]];
      pairs.forEach(([a, b, bend], i) => {
        const start = coords[a * 18], end = coords[b * 18], reveal = smooth(12 + i * .8, 15 + i * .8, t);
        this._curve(start, end, bend, reveal * .27, 'ivory', reveal, .8);
        const pulse = .5 + .5 * Math.sin(motion * .55 - i * 1.7), strength = comparison * (.18 + pulse * .50);
        this._curve(start, end, bend, strength, 'yellow', 1, 1.1);
        const along = this._reduced ? .45 : ((motion - 14) * .14 + i * .31) % 1;
        if (comparison > 0 && along >= 0) {
          const q = clamp(along), s = 1 - q, mid = { x: (start.x + end.x) / 2 + bend, y: (start.y + end.y) / 2 - Math.abs(bend) * .5 };
          this._dot({ x: s * s * start.x + 2 * s * q * mid.x + q * q * end.x, y: s * s * start.y + 2 * s * q * mid.y + q * q * end.y }, 2.3, comparison * .85, 'yellow', true);
        }
      });
    }
    // Implicit region: < 1 means the point satisfies the (invented) condition. `k` shrinks it.
    _region(p, k = 1) {
      const y = p.y - .22 * Math.sin(p.x * 2.6);
      return (p.x * p.x) / (.95 * .95 * k * k) + (y * y) / (.5 * .5 * k * k);
    }
    _drawMch(t, motion) {
      const k = mix(1, .32, smooth(15, 20, t)), boundary = smooth(5, 9.5, t), scanAt = mix(-1.25, 1.25, smooth(10, 14.6, t));
      const found = smooth(20, 22.5, t);
      const c = this.ctx;
      if (boundary > 0) {
        c.beginPath();
        for (let i = 0; i <= 160 * boundary; i++) {
          const a = i / 160 * TAU, r = .95 * k, x = Math.sin(a) * r, y = -Math.cos(a) * .5 * k + .22 * Math.sin(x * 2.6);
          i ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.strokeStyle = color('yellow', .55 * boundary * (1 - found * .5)); c.lineWidth = 1 / this._scale;
        c.setLineDash([5 / this._scale, 4 / this._scale]); c.stroke(); c.setLineDash([]);
      }
      const scanning = smooth(10, 10.6, t) * (1 - smooth(14.4, 15, t));
      if (scanning > 0) {
        this._line({ x: scanAt, y: -.82 }, { x: scanAt, y: .82 }, scanning * .7, 'ivory', 1.1);
        c.fillStyle = color('ivory', scanning * .04); c.fillRect(scanAt - .18, -.82, .18, 1.64);
      }
      this._candidates.forEach((p, i) => {
        const drift = this._reduced ? 0 : (1 - smooth(9, 12, t)) * .012;
        const q = { x: p.x + Math.sin(motion * .22 + i) * drift, y: p.y + Math.cos(motion * .19 + i * .6) * drift };
        const entrance = .4 + .6 * smooth(p.seed * 2, 2.4 + p.seed * 2, t);
        const scanned = t >= 15 || p.x < scanAt, inside = this._region(p, k) < 1;
        const sorted = scanned ? smooth(10, 11, t) : 0;
        if (p === this._target && found > 0) return;
        const alpha = entrance * mix(.62, inside ? .92 : .16, sorted) * (1 - found * .55);
        this._dot(q, inside ? mix(1.5, 2.1, sorted) : 1.4, alpha, inside && sorted > 0 ? 'yellow' : 'ivory', inside && sorted > .5 && k < .5);
      });
      if (found > 0) {
        const p = this._target, pulse = this._reduced ? .5 : .5 + .5 * Math.sin(motion * 1.4);
        this._dot(p, 3.4, .95 * found, 'yellow', true);
        this._ellipse(p, .06 + pulse * .02, .06 + pulse * .02, 0, found * .5, 'yellow');
        this._line({ x: p.x - .16, y: p.y }, { x: p.x - .08, y: p.y }, found * .6, 'yellow', 1);
        this._line({ x: p.x + .08, y: p.y }, { x: p.x + .16, y: p.y }, found * .6, 'yellow', 1);
        this._line({ x: p.x, y: p.y - .16 }, { x: p.x, y: p.y - .08 }, found * .6, 'yellow', 1);
        this._line({ x: p.x, y: p.y + .08 }, { x: p.x, y: p.y + .16 }, found * .6, 'yellow', 1);
      }
    }
  }
  ProjectFilm.PHASES = PHASES;
  ProjectFilm.ART_STATUS = 'Original abstract project film. Invented geometry, not research evidence or financial data.';
  (typeof window !== 'undefined' ? window : globalThis).ProjectFilm = ProjectFilm;
})();
