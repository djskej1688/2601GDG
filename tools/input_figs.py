# 2D explanatory figures (inline SVG) for the Input notes, drawn in the site palette.
import math

IV, YE, MU, AM, OR, TX, SKY = '#dde1c7', '#e0d67b', '#789278', '#b59255', '#f79234', '#e8eadb', '#8cbecd'
FONT = 'font-family="SairaStencil, NotoSerifKR, sans-serif"'


def T(x, y, s, fill=TX, size=11, anchor='start', op=1.0):
    return f'<text x="{x:.1f}" y="{y:.1f}" {FONT} font-size="{size}" fill="{fill}" fill-opacity="{op}" text-anchor="{anchor}">{s}</text>'


def L(x1, y1, x2, y2, c=MU, w=1, op=1.0, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="{w}" stroke-opacity="{op}"{d}/>'


def C(x, y, r, fill=IV, op=1.0, stroke=None):
    s = f' stroke="{stroke}" stroke-width=".9"' if stroke else ''
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{fill}" fill-opacity="{op}"{s}/>'


def P(pts, c=YE, w=1.6, op=1.0, fill='none', dash=None):
    d = ' '.join(('M' if i == 0 else 'L') + f'{x:.1f} {y:.1f}' for i, (x, y) in enumerate(pts))
    ds = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<path d="{d}" fill="{fill}" stroke="{c}" stroke-width="{w}" stroke-opacity="{op}"{ds}/>'


def arrow(x1, y1, x2, y2, c=YE, w=1.4):
    a = math.atan2(y2 - y1, x2 - x1)
    h = [(x2, y2), (x2 - 7 * math.cos(a - .45), y2 - 7 * math.sin(a - .45)), (x2 - 7 * math.cos(a + .45), y2 - 7 * math.sin(a + .45))]
    return L(x1, y1, x2, y2, c, w) + f'<path d="M{h[0][0]:.1f} {h[0][1]:.1f}L{h[1][0]:.1f} {h[1][1]:.1f}L{h[2][0]:.1f} {h[2][1]:.1f}Z" fill="{c}"/>'


def svg(w, h, body, title):
    return (f'<svg viewBox="0 0 {w} {h}" width="100%" display="block" role="img" aria-label="{title}">'
            f'<title>{title}</title>{"".join(body)}</svg>')


def bohr():
    b, levels = [], [(1, -13.6), (2, -3.4), (3, -1.51), (4, -.85), (5, -.54)]
    y = lambda e: 30 + (e / -13.6) * 200
    for n, e in levels:
        b += [L(70, y(e), 600, y(e), IV, 1, .7), T(64, y(e) + 4, f'n = {n}', MU, 10, 'end'), T(606, y(e) + 4, f'{e} eV', MU, 10)]
    b += [L(70, 22, 600, 22, IV, 1, .4, '3 3'), T(64, 26, 'n = ∞', MU, 10, 'end'), T(606, 26, '0 eV', MU, 10)]
    for k, (n, nf, c) in enumerate([(i, 1, OR) for i in (2, 3, 4, 5)] + [(i, 2, YE) for i in (3, 4, 5)] + [(i, 3, SKY) for i in (4, 5)]):
        x = 110 + k * 46 + (40 if nf > 1 else 0) + (40 if nf > 2 else 0)
        b.append(arrow(x, y(levels[n - 1][1]), x, y(levels[nf - 1][1]) - 2, c, 1.3))
    b += [T(185, 250, 'Lyman (→ n = 1, 자외선)', OR, 10, 'middle'), T(370, 250, 'Balmer (→ n = 2, 가시광선)', YE, 10, 'middle'), T(520, 250, 'Paschen (→ n = 3)', SKY, 10, 'middle')]
    return svg(660, 262, b, '수소 원자의 에너지 준위와 스펙트럼 계열')


def bondcurve():
    b = [L(60, 20, 60, 230), L(60, 130, 610, 130), T(615, 134, 'r', MU, 11), T(56, 18, 'E', MU, 11, 'end')]
    X = lambda r: 60 + (r - .6) / 2.4 * 540
    Y = lambda e: 130 - e * 70
    rep = lambda r: .9 / r ** 9
    att = lambda r: -1.0 / r
    rs = [0.62 + i * 0.01 for i in range(240)]
    b.append(P([(X(r), Y(min(1.4, rep(r)))) for r in rs], SKY, 1.3, .9))
    b.append(P([(X(r), Y(max(-1.4, att(r)))) for r in rs], OR, 1.3, .9))
    tot = [(r, rep(r) + att(r)) for r in rs]
    b.append(P([(X(r), Y(max(-1.4, min(1.4, e)))) for r, e in tot], YE, 2))
    r0, e0 = min(tot, key=lambda t: t[1])
    b += [L(X(r0), Y(e0), X(r0), 130, IV, 1, .7, '3 3'), T(X(r0), 146, 'r₀', IV, 11, 'middle'), C(X(r0), Y(e0), 3.5, YE),
          L(X(r0) + 6, Y(e0), X(r0) + 70, Y(e0), IV, .8, .6, '2 3'), T(X(r0) + 74, Y(e0) + 4, 'E₀ (결합 에너지)', IV, 10),
          T(X(.75), 40, '반발 +b/rⁿ', SKY, 10), T(X(1.6), 196, '인력 −e²/(4πε₀r)', OR, 10), T(X(1.9), 116, '합 (최저점 = 평형)', YE, 10)]
    return svg(660, 240, b, '이온 사이 거리에 따른 인력, 반발, 합 에너지 곡선')


def waves():
    b = []
    for row, (title, loc) in enumerate([('국소화된 파동 (원자에 묶인 전자)', True), ('비국소화된 파동 (결정 전체에 퍼진 전자)', False)]):
        y0 = 40 + row * 110
        b.append(T(20, y0 - 18, title, YE if loc else OR, 11))
        pts = []
        for i in range(400):
            x = 30 + i * 1.5
            v = math.exp(-((x - 225) / 18) ** 2) if loc else .55 + .45 * math.cos((x - 30) / 60 * 2 * math.pi)
            pts.append((x, y0 + 50 - v * 42))
        b.append(P(pts, YE if loc else OR, 1.8))
        for k in range(9):
            b.append(C(45 + k * 60, y0 + 62, 5, IV, .9))
        b.append(L(30, y0 + 62, 630, y0 + 62, MU, .8, .6))
        b.append(T(632, y0 + 30, '|ψ|²', MU, 10))
    return svg(660, 250, b, '원자 하나에 모인 국소화된 파동과 결정 전체에 퍼진 비국소화된 파동')


def bandsplit():
    b = [L(40, 20, 40, 230), T(36, 18, 'E', MU, 11, 'end')]
    cols = [(1, 90), (2, 180), (3, 270), (4, 360), (8, 450)]
    for n, x in cols:
        filled = n / 2
        for k in range(n):
            e = 0 if n == 1 else (k / (n - 1) - .5) * 2 * (.35 + .5 * (1 - 1 / n))
            y = 125 - e * 70
            occ = k < math.floor(filled) or (n == 1)
            half = (n % 2 == 1) and k == n // 2
            c = YE if occ or half else IV
            b.append(L(x - 30, y, x + 30, y, c, 2 if occ else 1.2, 1 if occ else .55))
            if half and n > 1:
                b.append(T(x + 34, y + 4, 'nonbonding', IV, 9, 'start', .8))
        b.append(T(x, 238, f'N = {n}', MU, 11, 'middle'))
    b += [f'<rect x="510" y="45" width="70" height="80" fill="{YE}" fill-opacity=".5"/>', f'<rect x="510" y="125" width="70" height="80" fill="{IV}" fill-opacity=".12" stroke="{IV}" stroke-opacity=".4"/>',
          T(545, 238, 'N ≈ 10²³', MU, 11, 'middle'), T(586, 90, '채워진 상태', YE, 10), T(586, 170, '빈 상태', IV, 10),
          T(90, 30, '원자 하나의 2s 준위', IV, 10, 'middle', .8)]
    return svg(660, 250, b, '원자 수 N이 늘수록 하나의 준위가 N개로 갈라져 띠가 되는 모습. 원자마다 전자 하나면 아래 절반이 채워진다')


def bandtypes():
    b = []
    specs = [('금속', 'Li, Cu', 'half'), ('반도체', 'Si, Eg ≈ 1.1 eV', 1.1), ('절연체', '다이아몬드, Eg > 4 eV', 5.0)]
    for i, (name, ex, gap) in enumerate(specs):
        x = 40 + i * 210
        b.append(T(x + 70, 22, name, YE, 12, 'middle'))
        if gap == 'half':
            b += [f'<rect x="{x}" y="50" width="140" height="160" fill="{IV}" fill-opacity=".1" stroke="{IV}" stroke-opacity=".5"/>',
                  f'<rect x="{x}" y="130" width="140" height="80" fill="{YE}" fill-opacity=".55"/>',
                  L(x - 6, 130, x + 146, 130, OR, 1.2, 1, '4 3'), T(x + 70, 124, '반만 찬 띠', OR, 10, 'middle')]
        else:
            g = 18 + gap * 14
            top = 130 - g
            b += [f'<rect x="{x}" y="40" width="140" height="{top - 40:.0f}" fill="{IV}" fill-opacity=".1" stroke="{IV}" stroke-opacity=".5"/>',
                  f'<rect x="{x}" y="130" width="140" height="80" fill="{YE}" fill-opacity=".55"/>',
                  T(x + 70, top - 8 - (top - 40) / 2 + 12, '전도띠 (CB)', IV, 10, 'middle'),
                  arrow(x + 150, 130, x + 150, top + 2, OR, 1.1), T(x + 156, (130 + top) / 2 + 4, 'Eg', OR, 10)]
        b += [T(x + 70, 175, '원자가띠 (VB)', '#1a2414', 10, 'middle'), T(x + 70, 230, ex, MU, 10, 'middle')]
    return svg(660, 240, b, '금속, 반도체, 절연체의 띠 구조 비교')


def packing2d():
    b = []
    for i in range(4):
        for j in range(4):
            b.append(C(40 + i * 40, 40 + j * 40, 20, IV, .85, MU))
    for j in range(4):
        for i in range(4 if j % 2 == 0 else 3):
            b.append(C(380 + i * 40 + (20 if j % 2 else 0), 40 + j * 34.64, 20, YE, .85, MU))
    b += [T(100, 205, '정사각 배열', IV, 11, 'middle'), T(100, 222, 'π/4 ≈ 0.785, 배위수 4', MU, 10, 'middle'),
          T(450, 180, '육방 (삼각) 배열', YE, 11, 'middle'), T(450, 197, 'π/(2√3) ≈ 0.907, 배위수 6', MU, 10, 'middle')]
    return svg(660, 232, b, '2차원에서 정사각 배열과 육방 배열의 충진율 비교')


def bravais2d():
    b = []
    panels = [('사각 (oblique)', (1, 0), (.35, .8), False), ('직사각 (rectangular)', (1.15, 0), (0, .75), False),
              ('면심 직사각', (1.2, 0), (0, .9), True), ('육방 (hexagonal)', (.9, 0), (.45, .78), False), ('정사각 (square)', (.85, 0), (0, .85), False)]
    for k, (name, a, bv, centered) in enumerate(panels):
        ox, oy, s = 20 + k * 128, 30, 34
        for i in range(-1, 4):
            for j in range(-1, 4):
                x, y = ox + 20 + (i * a[0] + j * bv[0]) * s, oy + 20 + (i * a[1] + j * bv[1]) * s
                if ox + 4 < x < ox + 120 and oy + 4 < y < oy + 116:
                    b.append(C(x, y, 3.2, IV, .9))
                if centered:
                    cx, cy = x + (a[0] + bv[0]) * s / 2, y + (a[1] + bv[1]) * s / 2
                    if ox + 4 < cx < ox + 120 and oy + 4 < cy < oy + 116:
                        b.append(C(cx, cy, 3.2, YE, .9))
        x0, y0 = ox + 20 + s, oy + 20 + s
        cell = [(x0, y0), (x0 + a[0] * s, y0 + a[1] * s), (x0 + (a[0] + bv[0]) * s, y0 + (a[1] + bv[1]) * s), (x0 + bv[0] * s, y0 + bv[1] * s), (x0, y0)]
        b.append(P(cell, OR, 1.3))
        b.append(T(ox + 60, 150, name, MU, 10, 'middle'))
    return svg(660, 160, b, '2차원 Bravais 격자 다섯 가지')


def latlines():
    b = []
    for k, (h, kk, name) in enumerate([(1, 0, '(100)'), (1, 1, '(110)'), (2, 1, '(210)'), (3, 1, '(310)')]):
        ox = 15 + k * 160
        for i in range(6):
            for j in range(6):
                b.append(C(ox + 15 + i * 22, 20 + j * 22, 2.6, IV, .9))
        # traces of planes h x + k y = n on the square lattice (unit = 22 px)
        for n in range(-8, 14):
            pts = []
            for t in [0, 5]:
                if kk == 0:
                    x, y = n / h, t
                else:
                    x, y = t, (n - h * t) / kk
                pts.append((ox + 15 + x * 22, 20 + y * 22))
            b.append(f'<g clip-path="url(#ll{k})">' + P(pts, YE, 1, .8) + '</g>')
        b.append(f'<clipPath id="ll{k}"><rect x="{ox + 8}" y="13" width="124" height="124"/></clipPath>')
        b.append(T(ox + 70, 158, name, YE, 11, 'middle'))
    return svg(660, 168, b, '정사각 격자에서 (100), (110), (210), (310) 면의 흔적. 지수가 클수록 면 간격이 좁고 면 위 원자가 드물다')


def xspectrum():
    b = [L(60, 20, 60, 200), L(60, 200, 620, 200), T(620, 216, 'λ', MU, 11, 'end'), T(56, 18, 'I', MU, 11, 'end')]
    X = lambda lam: 60 + lam * 330
    for V, c, amp in [(25, YE, 1.0), (20, IV, .68), (15, MU, .42)]:
        lmin = 12.398 / V
        pts = []
        for i in range(260):
            lam = lmin + i * .006
            v = amp * (1 - math.exp(-(lam - lmin) * 9)) * math.exp(-(lam - lmin) * 1.6)
            if V == 25:
                v += 1.25 * math.exp(-((lam - .7101) / .007) ** 2) + .45 * math.exp(-((lam - .6323) / .007) ** 2)
            pts.append((X(lam), 200 - v * 110))
        b.append(P(pts, c, 1.6))
        b.append(T(X(lmin), 214, f'{V} kV', c, 9, 'middle'))
    b += [T(X(.7101) + 6, 52, 'Kα', OR, 11), T(X(.6323) - 4, 140, 'Kβ', OR, 11, 'end'),
          T(250, 230, 'λ_SWL = 12.398 / V(kV) Å (전압이 높을수록 왼쪽으로)', MU, 10, 'middle'), T(470, 120, '연속 스펙트럼 (제동 복사)', IV, 10)]
    return svg(660, 240, b, 'Mo 타깃의 X선 스펙트럼 개략도: 전압에 따른 연속 스펙트럼과 Kα, Kβ 특성선')


def xlevels():
    b = []
    shells = [('K (n = 1)', 200), ('L (n = 2)', 120), ('M (n = 3)', 75), ('N (n = 4)', 50)]
    for name, y in shells:
        b += [L(150, y, 560, y, IV, 1, .7), T(144, y + 4, name, MU, 10, 'end')]
    b += [arrow(240, 120, 240, 198, OR), T(248, 165, 'Kα', OR, 11), arrow(320, 75, 320, 198, YE), T(328, 150, 'Kβ', YE, 11),
          arrow(420, 75, 420, 118, SKY), T(428, 100, 'Lα', SKY, 11), arrow(490, 50, 490, 118, IV), T(498, 88, 'Lβ', IV, 11),
          C(240, 200, 5, '#020906', 1, OR), T(200, 222, '먼저 K 껍질에 빈자리', OR, 10, 'middle')]
    return svg(660, 232, b, 'K, L, M, N 껍질 사이 전이와 Kα, Kβ, Lα, Lβ 특성 X선')


def nasoft():
    b = []
    for k, (name, band) in enumerate([('Na 기체', False), ('Na 고체', True)]):
        x = 110 + k * 260
        b += [L(x, 40, x + 160, 40, IV, 1, .4, '3 3'), T(x - 6, 44, '0', MU, 10, 'end'), L(x, 190, x + 160, 190, IV, 1.6), T(x + 166, 194, '2p (−38.7 eV)', MU, 10)]
        if band:
            b.append(f'<rect x="{x}" y="58" width="160" height="20" fill="{YE}" fill-opacity=".45" stroke="{YE}" stroke-opacity=".8"/>')
            b += [T(x + 166, 72, '3s 띠', YE, 10), arrow(x + 50, 62, x + 50, 188, OR), arrow(x + 110, 76, x + 110, 188, OR), T(x + 80, 140, 'λ가 퍼짐', OR, 10, 'middle')]
        else:
            b += [L(x, 68, x + 160, 68, YE, 1.6), T(x + 166, 72, '3s (−5.01 eV)', YE, 10), arrow(x + 80, 70, x + 80, 188, OR), T(x + 88, 140, 'λ 하나', OR, 10)]
        b.append(T(x + 80, 218, name, IV, 11, 'middle'))
    return svg(660, 228, b, 'Na 기체와 고체에서 3s에서 2p로의 연 X선 전이 비교')


def bragg():
    b = []
    for j, y in enumerate([70, 140, 210]):
        b.append(L(40, y, 620, y, MU, .8, .6))
        for i in range(9):
            b.append(C(70 + i * 65, y, 6, IV, .9))
    th = math.radians(28)
    def ray(x0, y0):
        dx, dy = math.cos(th), math.sin(th)
        return (x0 - 230 * dx, y0 - 230 * dy, x0, y0, x0 + 230 * dx, y0 - 230 * dy)
    for (x0, y0), c in [((330, 70), YE), ((330, 140), OR)]:
        a, bb, c0, d0, e, f = ray(x0, y0)
        b += [arrow(a, bb, c0 - 6 * math.cos(th), d0 - 6 * math.sin(th), c, 1.5), arrow(c0, d0, e, f, c, 1.5)]
    # path difference segments
    d = 70
    px, py = 330 - d * math.sin(th) * math.cos(th), 70 + d * math.sin(th) * math.sin(th)
    qx, qy = 330 + d * math.sin(th) * math.cos(th), 70 + d * math.sin(th) * math.sin(th)
    b += [L(330, 70, px, py, IV, .8, .8, '3 3'), L(330, 70, qx, qy, IV, .8, .8, '3 3'),
          P([(px, py), (330, 140)], SKY, 2.4), P([(330, 140), (qx, qy)], SKY, 2.4),
          T(250, 128, 'd sin θ', SKY, 10, 'end'), T(410, 128, 'd sin θ', SKY, 10),
          L(600, 70, 600, 140, IV, 1), T(606, 110, 'd', IV, 11), T(150, 60, 'θ', YE, 11), T(500, 60, 'θ', YE, 11),
          T(330, 240, '경로차 2d·sin θ = nλ 이면 보강 간섭', YE, 11, 'middle')]
    return svg(660, 250, b, 'Bragg 법칙: 두 원자면에서 반사된 X선의 경로차')


def sticks():
    b = []
    allowed = {
        'SC': lambda h, k, l: True,
        'BCC': lambda h, k, l: (h + k + l) % 2 == 0,
        'FCC': lambda h, k, l: len({h % 2, k % 2, l % 2}) == 1,
    }
    hkls = {}
    for h in range(4):
        for k in range(h + 1):
            for l in range(k + 1):
                if h + k + l:
                    N = h * h + k * k + l * l
                    hkls.setdefault(N, f'{h}{k}{l}')
    X = lambda N: 80 + N * 37
    for r, (name, ok) in enumerate(allowed.items()):
        y = 50 + r * 62
        b += [L(70, y, 630, y, MU, .8, .6), T(60, y + 4, name, YE, 11, 'end')]
        for N in range(1, 16):
            if N in hkls:
                h, k, l = map(int, hkls[N])
                if ok(h, k, l):
                    b += [L(X(N), y, X(N), y - 30, OR, 2.2), T(X(N), y + 14, f'({hkls[N]})', IV, 8, 'middle', .85)]
    for N in range(1, 16):
        b.append(T(X(N), 238, str(N), MU, 9, 'middle'))
    b.append(T(345, 252, 'N = h² + k² + l² (sin²θ에 비례, 7과 15는 만들 수 없음)', MU, 10, 'middle'))
    return svg(660, 260, b, 'SC, BCC, FCC에서 나타나는 회절 봉우리의 위치와 지수')


FIGS = {f.__name__: f for f in [bohr, bondcurve, waves, bandsplit, bandtypes, packing2d, bravais2d, latlines, xspectrum, xlevels, nasoft, bragg, sticks]}


# ---------- calculus figures ----------
def _polar_path(fn, cx, cy, s, t0=0.0, t1=2 * math.pi, steps=320, angle=None):
    segs, cur = [], []
    for i in range(steps + 1):
        t = t0 + (t1 - t0) * i / steps
        v = fn(t)
        if angle is not None:
            v, t = t, angle
        if v is None:
            if cur: segs.append(cur); cur = []
            continue
        cur.append((cx + v * math.cos(t) * s, cy - v * math.sin(t) * s))
    if cur: segs.append(cur)
    return segs


def _panel(x0, y0, w, label, curves, rmax, note=None, fill=None):
    cx, cy, s = x0 + w / 2, y0 + w / 2, (w / 2 - 10) / rmax
    b = [L(x0 + 6, cy, x0 + w - 6, cy, MU, .7, .6), L(cx, y0 + 6, cx, y0 + w - 6, MU, .7, .6)]
    if fill:
        for seg in _polar_path(*fill[0], cx=cx, cy=cy, s=s, **fill[1]):
            b.append(f'<path d="M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in seg) + f'Z" fill="{OR}" fill-opacity=".28" stroke="none"/>')
    for fn, c, kw in curves:
        for seg in _polar_path(fn, cx, cy, s, **kw):
            b.append(P(seg, c, 1.6))
    b.append(T(cx, y0 + w + 14, label, YE, 11, 'middle'))
    if note: b.append(T(cx, y0 + w + 28, note, MU, 9.5, 'middle'))
    return b


def _gallery(items, title, cols=4, w=140):
    b = []
    for k, it in enumerate(items):
        x0, y0 = 10 + (k % cols) * (w + 22), 6 + (k // cols) * (w + 46)
        b += _panel(x0, y0, w, *it)
    rows = (len(items) + cols - 1) // cols
    return svg(10 + cols * (w + 22), rows * (w + 46) + 4, b, title)


def polarcircles():
    cos, sin = math.cos, math.sin
    return _gallery([('r = 2', [(lambda t: 2, YE, {})], 4.5), ('θ = π/4', [(lambda t: t, YE, dict(t0=-4, t1=4, steps=2, angle=math.pi / 4))], 4.5, '원점을 지나는 직선'),
                     ('r = 6 sin θ', [(lambda t: 6 * sin(t), YE, dict(t1=math.pi))], 6.5, '중심 (0, 3), 반지름 3'),
                     ('r = 4 cos θ', [(lambda t: 4 * cos(t), YE, dict(t1=math.pi))], 4.5, '중심 (2, 0), 반지름 2')], '극좌표의 원과 직선')



def roses():
    sin, cos = math.sin, math.cos
    return _gallery([('r = sin 3θ', [(lambda t: sin(3 * t), YE, {})], 1.1, 'n = 3 홀수 → 3잎'),
                     ('r = cos 3θ', [(lambda t: cos(3 * t), YE, {})], 1.1, 'n = 3 홀수 → 3잎'),
                     ('r = sin 2θ', [(lambda t: sin(2 * t), YE, {})], 1.1, 'n = 2 짝수 → 4잎'),
                     ('r = cos 2θ', [(lambda t: cos(2 * t), YE, {})], 1.1, 'n = 2 짝수 → 4잎')], '장미 곡선: n이 홀수면 n잎, 짝수면 2n잎')


def limacons():
    cos = math.cos
    items = []
    for a, name in [(.5, '안쪽 고리 (a/b < 1)'), (1, '심장형 (a/b = 1)'), (1.5, '오목 (1 < a/b < 2)'), (2, '볼록 (a/b ≥ 2)')]:
        items.append((f'r = {a:g} + cos θ', [(lambda t, a=a: a + cos(t), YE, {})], 3.2, name))
    return _gallery(items, 'r = a + b cos θ에서 a/b에 따라 바뀌는 리마송 모양 (b = 1)')


def lemniscates():
    def sq(f):
        return lambda t: math.sqrt(f(t)) if f(t) >= 0 else None
    def sqn(f):
        return lambda t: -math.sqrt(f(t)) if f(t) >= 0 else None
    c2 = lambda t: math.cos(2 * t)
    s2 = lambda t: math.sin(2 * t)
    c1 = lambda t: math.cos(t)
    return _gallery([('r² = cos 2θ', [(sq(c2), YE, {}), (sqn(c2), YE, {})], 1.1, '∞ 모양, x축 방향'),
                     ('r² = sin 2θ', [(sq(s2), YE, {}), (sqn(s2), YE, {})], 1.1, 'y = x 방향'),
                     ('r² = cos θ', [(sq(c1), YE, {}), (sqn(c1), YE, {})], 1.1, '두 고리'),
                     ('r = 2θ (θ ≥ 0)', [(lambda t: 2 * t, YE, dict(t1=4 * math.pi, steps=500))], 26, '나선')], '리본형(r² 꼴)과 나선. 우변이 음수인 구간에는 점이 없다')


def polararea():
    cos, pi = math.cos, math.pi
    items = [
        ('r = 2(1 + cos θ)', [(lambda t: 2 * (1 + cos(t)), YE, {})], 4.4, '전체 넓이 6π', ((lambda t: 2 * (1 + cos(t)),), {})),
        ('r = 1 + 2cos θ', [(lambda t: 1 + 2 * cos(t), YE, {})], 3.2, '작은 고리 π − 3√3/2', ((lambda t: 1 + 2 * cos(t),), dict(t0=2 * pi / 3, t1=4 * pi / 3))),
        ('r = 1 밖 / r = 1 − cos θ', [(lambda t: 1, YE, {}), (lambda t: 1 - cos(t), SKY, {})], 2.2, '원 안 ∩ 심장형 밖 = 2 − π/4', None),
    ]
    b = []
    w = 180
    for k, (label, curves, rmax, note, fill) in enumerate(items):
        x0, y0 = 10 + k * (w + 30), 6
        cx, cy, s = x0 + w / 2, y0 + w / 2, (w / 2 - 10) / rmax
        if k == 2:
            pts = []
            for i in range(181):
                t = -pi / 2 + pi * i / 180
                pts.append((cx + cos(t) * s, cy - math.sin(t) * s))
            for i in range(181):
                t = pi / 2 - pi * i / 180
                r = 1 - cos(t)
                pts.append((cx + r * cos(t) * s, cy - r * math.sin(t) * s))
            b.append('<path d="M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + f'Z" fill="{OR}" fill-opacity=".3"/>')
            b += _panel(x0, y0, w, label, curves, rmax, note)
        else:
            b += _panel(x0, y0, w, label, curves, rmax, note, fill=(fill[0], fill[1]))
    return svg(10 + 3 * (w + 30), w + 50, b, '극좌표 넓이 예제 세 개 (주황이 구하는 넓이)')


def detarea():
    b = [L(60, 200, 400, 200, MU, .8), L(80, 220, 80, 20, MU, .8)]
    o, u, v = (80, 200), (240, 160), (130, 70)
    q = (u[0] + v[0] - o[0], u[1] + v[1] - o[1])
    b.append(f'<path d="M{o[0]} {o[1]}L{u[0]} {u[1]}L{q[0]} {q[1]}L{v[0]} {v[1]}Z" fill="{YE}" fill-opacity=".25" stroke="{YE}" stroke-width="1.2"/>')
    b += [arrow(*o, *u, OR, 1.8), arrow(*o, *v, SKY, 1.8), T(u[0] + 6, u[1] + 14, '(a, b) = 1행', OR, 10), T(v[0] - 4, v[1] - 6, '(c, d) = 2행', SKY, 10, 'end'),
          T(205, 120, '넓이 = |ad − bc|', YE, 11, 'middle'),
          T(430, 60, '한 행을 k배 → 넓이 k배', IV, 10), T(430, 82, '두 행 교환 → 방향(부호) 반대', IV, 10), T(430, 104, '두 행이 비례 → 납작, det = 0', IV, 10), T(430, 126, '한 행에 다른 행 배수 더하기', IV, 10), T(440, 144, '→ 밑변·높이 그대로, det 불변', MU, 10)]
    return svg(660, 230, b, '2×2 행렬식은 두 행벡터가 만드는 평행사변형의 부호 있는 넓이')


def epsband():
    b = [L(60, 200, 620, 200, MU, .8), L(60, 210, 60, 20, MU, .8)]
    L0, eps = 110, 28
    b += [L(60, L0 - eps, 620, L0 - eps, IV, 1, .6), L(60, L0 + eps, 620, L0 + eps, IV, 1, .6), L(60, L0, 620, L0, YE, 1, .8, '4 3'),
          f'<rect x="300" y="{L0 - eps}" width="320" height="{2 * eps}" fill="{YE}" fill-opacity=".08"/>',
          T(626, L0 + 4, 'L', YE, 11), T(626, L0 - eps + 4, 'L + ε', IV, 10), T(626, L0 + eps + 4, 'L − ε', IV, 10),
          L(300, 30, 300, 205, OR, 1, .8, '3 3'), T(300, 220, 'N', OR, 11, 'middle')]
    for n in range(1, 25):
        y = L0 + 85 * (-1) ** n / (n ** 0.9) * (1 if n < 3 else .9)
        b.append(C(60 + n * 23, y, 3.4, OR if 60 + n * 23 > 300 else IV, .95))
    b.append(T(180, 222, 'n > N이면 모든 aₙ이 띠 안에 들어간다', MU, 10, 'middle'))
    return svg(660, 232, b, '수열의 수렴: n이 N보다 크면 모든 항이 L ± ε 띠 안에 있다')


def integraltest():
    b = [L(60, 200, 620, 200, MU, .8), L(60, 210, 60, 15, MU, .8)]
    X = lambda x: 60 + (x - .5) * 70
    Y = lambda y: 200 - y * 150
    f = lambda x: 1 / x ** 1.5
    for n in range(2, 9):
        b.append(f'<rect x="{X(n - 1):.1f}" y="{Y(f(n)):.1f}" width="70" height="{200 - Y(f(n)):.1f}" fill="{OR}" fill-opacity=".3" stroke="{OR}" stroke-opacity=".8"/>')
        b.append(T(X(n - 1) + 35, Y(f(n)) - 4, f'a{chr(0x2080 + n)}', OR, 9, 'middle'))
    b.append(P([(X(x), Y(f(x))) for x in [1 + i * .02 for i in range(400)]], YE, 2))
    for n in range(1, 9):
        b.append(T(X(n), 214, str(n), MU, 9, 'middle'))
    b += [T(X(1.3), Y(1) + 4, 'y = f(x)', YE, 11), T(400, 70, 'a₂ + a₃ + … ≤ ∫₁^∞ f(x) dx', IV, 11, 'middle'), T(400, 90, '적분이 유한하면 부분합에 천장이 생겨 수렴', MU, 10, 'middle')]
    return svg(660, 226, b, '적분판정법: 각 항을 폭 1인 직사각형으로 보면 곡선 아래에 들어간다')


FIGS.update({f.__name__: f for f in [polarcircles, roses, limacons, lemniscates, polararea, detarea, epsband, integraltest]})
