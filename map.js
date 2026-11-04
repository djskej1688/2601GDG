/* Research map: a force-directed graph of dandelion's projects and the concepts they share.
 * Canvas 2D, no dependencies. Positions come from a small physics simulation; edges mean
 * "this project works with this concept", not a measured relationship. */
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

  /* ---------- content ---------- */
  const T = (ko, en) => ({ ko, en: en ?? ko });
  const NODES = [
    { id: 'dandelion', kind: 'root', label: T('dandelion'),
      copy: T('연구와 프로젝트를 모아 둔 곳입니다. 선은 각 프로젝트가 다루는 개념을 잇습니다.', 'Where the research and projects gather. Lines connect each project to the concepts it works with.') },
    { id: 'mechanism', kind: 'project', label: T('Mechanism aware GraphRAG'), meta: 'RESEARCH · 2026 OCT', href: './project-graphrag.html',
      copy: T('단백질 포켓 예측 결과와 생의학 지식 그래프를 한곳에 모은 뒤, GraphRAG와 VectorRAG가 언어 모델에 필요한 기록을 찾아 빠짐없이 전달하는지 확인하는 연구입니다.',
        'A study that brings protein pocket predictions and a biomedical knowledge graph together, then checks whether GraphRAG and VectorRAG find the records a language model needs and pass them on intact.') },
    { id: 'financial', kind: 'project', label: T('Financial GraphRAG'), meta: 'PROJECT · 2026 MAY', href: './project-financial.html',
      copy: T('사업보고서(10-K)를 바탕으로 지식 그래프 검색이 언제 벡터 검색보다 나은지 비교한 프로젝트입니다. 여러 회사를 비교하는 질문에서 크게 앞섰고, 채점 기준의 오류를 바로잡은 과정도 함께 기록했습니다.',
        'A project comparing when knowledge-graph retrieval beats vector retrieval on annual reports (10-K). It was far ahead on questions comparing several companies, and the correction of a flawed answer key is documented as well.') },
    { id: 'lattice', kind: 'project', label: T('개인의 경험을 집합으로…?', 'Experiences as sets…?'), meta: 'QUESTION · 2026 OCT', href: './project-lattice.html',
      title: T('개인의 경험을 집합으로 구조화하고 그 관계를 활용해 생성하면, 그 사람에게 의미 있으면서도 예상 밖인 아이디어를 얻을 수 있는가?',
        'If personal experiences are structured as sets and the relations between them are used for generation, can that produce ideas that are both meaningful and unexpected to that person?'),
      copy: T('개인의 경험을 집합으로 구조화하고, 집합 사이의 관계를 생성에 활용하는 격자 연구입니다. 현재 탐구 중인 연구 질문이며, 검증된 결과를 뜻하지 않습니다.',
        'A lattice study that structures personal experiences as sets and uses the relations between those sets for generation. It is a research question being explored, not a validated result.') },
    { id: 'graphrag', kind: 'concept', label: T('GraphRAG'), copy: T('지식 그래프에서 관련 사실을 찾아 언어 모델 답변의 근거로 쓰는 검색 증강 생성(RAG) 방식.', 'Retrieval-augmented generation (RAG) that retrieves facts from a knowledge graph as evidence for a language model’s answer.') },
    { id: 'vectorrag', kind: 'concept', label: T('VectorRAG'), copy: T('문서를 임베딩 벡터로 바꾸고, 질문과 비슷한 문단을 찾아 근거로 쓰는 RAG 방식.', 'RAG that embeds documents as vectors and retrieves the passages most similar to the question.') },
    { id: 'kg', kind: 'concept', label: T('Knowledge graph'), copy: T('개체를 노드로, 개체 사이의 관계를 엣지로 표현한 데이터 구조.', 'A data structure that represents entities as nodes and the relationships between them as edges.') },
    { id: 'judge', kind: 'concept', label: T('LLM-as-a-judge'), copy: T('언어 모델이 답변을 채점하는 평가 방식. 두 GraphRAG 프로젝트 모두 답변 평가에 사용했습니다.', 'An evaluation method in which a language model grades answers. Both GraphRAG projects used it to assess answers.') },
    { id: 'provenance', kind: 'concept', label: T('Provenance'), copy: T('답변에 쓰인 근거가 어디에서 왔는지 기록하고 추적하는 일.', 'Recording and tracing where the evidence behind an answer came from.') },
    { id: 'hetionet', kind: 'concept', label: T('Hetionet'), copy: T('약물·유전자·질병 등의 관계를 통합한 공개 생의학 지식 그래프.', 'A public biomedical knowledge graph that integrates relationships among drugs, genes, diseases and more.') },
    { id: 'allosteric', kind: 'concept', label: T('Allosteric site'), copy: T('단백질의 주 결합 부위와 떨어져 있지만, 분자가 결합하면 단백질의 기능을 바꿀 수 있는 부위.', 'A site away from a protein’s primary binding site where a binding molecule can still change the protein’s function.') },
    { id: 'pocket', kind: 'concept', label: T('Pocket prediction'), copy: T('단백질 구조에서 분자가 들어갈 만한 홈(포켓)을 계산으로 찾는 방법. 이 연구에서는 fpocket과 PASSer를 사용했습니다.', 'Computationally finding grooves (pockets) in a protein structure where a molecule could fit. This study used fpocket and PASSer.') },
    { id: 'afdb', kind: 'concept', label: T('AlphaFold DB'), copy: T('AlphaFold로 예측한 단백질 구조를 모은 공개 데이터베이스.', 'A public database of protein structures predicted by AlphaFold.') },
    { id: 'tenk', kind: 'concept', label: T('10-K filings'), copy: T('미국 상장사가 매년 제출하는 연간 사업보고서.', 'The annual reports that U.S. public companies file each year.') },
    { id: 'neo4j', kind: 'concept', label: T('Neo4j'), copy: T('노드와 관계를 저장하고 질의하는 그래프 데이터베이스.', 'A graph database for storing and querying nodes and relationships.') },
    { id: 'finqa', kind: 'concept', label: T('Financial QA'), copy: T('FinDER, FinQA, TAT-QA 등 금융 문서 질의응답 데이터셋.', 'Question-answering datasets over financial documents, such as FinDER, FinQA and TAT-QA.') },
    { id: 'sets', kind: 'concept', label: T('Sets'), copy: T('원소들의 모임. 이 연구에서는 개인의 경험을 집합으로 나타냅니다.', 'Collections of elements. This study represents personal experiences as sets.') },
    { id: 'latticec', kind: 'concept', label: T('Lattice'), copy: T('두 원소마다 최소 상계와 최대 하계가 있는 부분순서 구조. 포함 관계로 정렬한 부분집합들이 대표적인 예입니다.', 'A partially ordered structure in which every pair of elements has a least upper bound and a greatest lower bound; subsets ordered by inclusion are a classic example.') },
    { id: 'experience', kind: 'concept', label: T('Personal experience'), copy: T('한 사람이 겪고 기록한 일들. 이 연구가 구조화하려는 대상입니다.', 'What a person has lived through and recorded: the material this study sets out to structure.') },
    { id: 'ideation', kind: 'concept', label: T('Idea generation'), copy: T('요소 사이의 관계를 활용해 새로운 아이디어를 만들어 내는 과정.', 'Producing new ideas by drawing on relations between existing elements.') }
  ];
  const EDGES = [
    ['dandelion', 'mechanism'], ['dandelion', 'financial'], ['dandelion', 'lattice'],
    ['mechanism', 'graphrag'], ['mechanism', 'vectorrag'], ['mechanism', 'kg'], ['mechanism', 'hetionet'], ['mechanism', 'allosteric'],
    ['mechanism', 'pocket'], ['mechanism', 'afdb'], ['mechanism', 'judge'], ['mechanism', 'provenance'],
    ['financial', 'graphrag'], ['financial', 'vectorrag'], ['financial', 'kg'], ['financial', 'neo4j'], ['financial', 'tenk'],
    ['financial', 'finqa'], ['financial', 'judge'], ['financial', 'provenance'],
    ['lattice', 'sets'], ['lattice', 'latticec'], ['lattice', 'experience'], ['lattice', 'ideation'],
    ['graphrag', 'kg'], ['graphrag', 'vectorrag'], ['kg', 'hetionet'], ['kg', 'neo4j'], ['pocket', 'allosteric'], ['sets', 'latticec'], ['experience', 'sets']
  ];
  const NOTE = T('배치는 물리 시뮬레이션으로 정해지며, 선은 프로젝트가 다루는 개념을 뜻합니다. 관계의 강도나 중요도를 나타내지 않습니다.',
    'The layout comes from a physics simulation; a line means a project works with that concept. It does not show the strength or importance of a relationship.');
  const KIND = { root: 'MAP NOTES', project: 'PROJECT NOTES', concept: 'CONCEPT NOTES' };

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
  byId.get('dandelion').x = 0; byId.get('dandelion').y = 0;
  projects.forEach((n, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / projects.length; n.x = Math.cos(a) * 170; n.y = Math.sin(a) * 170; });
  NODES.filter(n => n.kind === 'concept').forEach(n => {
    const owners = [...n.nb].filter(m => m.kind === 'project');
    const ax = owners.reduce((s, m) => s + m.x, 0) / (owners.length || 1), ay = owners.reduce((s, m) => s + m.y, 0) / (owners.length || 1);
    const push = owners.length > 1 ? 1 : 1.6, a = rnd() * Math.PI * 2;
    n.x = ax * push + Math.cos(a) * 60; n.y = ay * push + Math.sin(a) * 60;
  });

  let lang = 'ko';
  try { if (localStorage.getItem('notes-lang') === 'en') lang = 'en'; } catch (_) { /* storage unavailable */ }
  const L = t => t[lang] || t.ko;

  /* ---------- simulation ---------- */
  let alpha = 1, running = true;
  function restLength(l) { return l.a.kind === 'root' || l.b.kind === 'root' ? 150 : l.a.kind === 'project' || l.b.kind === 'project' ? 92 : 70; }
  function tick() {
    const k = alpha;
    for (let i = 0; i < NODES.length; i++) {
      const a = NODES[i];
      for (let j = i + 1; j < NODES.length; j++) {
        const b = NODES[j];
        let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = rnd() - .5; dy = rnd() - .5; d2 = 1; }
        const f = 4200 / Math.max(d2, 400) * k, d = Math.sqrt(d2);
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
    const open = n.href ? `<a href="${n.href}">${lang === 'en' ? 'Open project page' : '프로젝트 페이지 열기'} ↗</a>` : '';
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
      b.querySelector('.row-type').textContent = n.meta.split(' · ')[0];
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
  const initial = byId.get(location.hash.slice(1));
  if (initial) setTimeout(() => select(initial, true), reduce.matches ? 0 : 500);
  addEventListener('pageshow', () => draw());
})();
