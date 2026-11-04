/* 대학수학 knowledge graph for map.js (input-graph-math.html). Chapters are hubs; every concept links to its note. */
(() => {
  'use strict';
  const T = ko => ({ ko, en: ko });
  const CH = {
    c5: { anchor: 'm-5', label: '5장 초월함수', meta: 'CHAPTER · 2026 SPRING', copy: '지수·로그·역삼각·쌍곡선 함수의 미분과 적분, 로피탈의 법칙, 함수의 증가 속도.' },
    c6: { anchor: 'm-6', label: '6장 적분기법', meta: 'CHAPTER · 2026 SPRING', copy: '치환, 부분적분, 부분분수, 삼각치환으로 기본 공식 꼴을 만들고, 무한으로 가는 이상적분을 판정해요.' },
    c7: { anchor: 'm-7', label: '7장 적분의 응용', meta: 'CHAPTER · 2026 SPRING', copy: '쪼개고 더하고 극한을 보내는 틀 하나로 넓이, 부피, 곡선 길이, 회전면 넓이, 일을 구해요.' },
    c9: { anchor: 'm-9', label: '9장 행렬과 응용', meta: 'CHAPTER · 2026 FALL', copy: '연립일차방정식을 행렬로 쓰고, 행렬식·가우스 소거·역행렬·크라머 공식으로 풀어요.' },
    c10: { anchor: 'm-10', label: '10장 무한급수', meta: 'CHAPTER · 2026 FALL', copy: '수열과 급수의 수렴, 여러 판정법, 그리고 함수를 다항식의 무한합으로 쓰는 Taylor 급수.' },
    c11: { anchor: 'm-11', label: '11장 극좌표', meta: 'CHAPTER · 2026 FALL', copy: '거리 r과 각 θ로 점을 나타내고, 장미·리마송·리본형 같은 곡선과 그 넓이를 다뤄요.' }
  };
  // [id, label, chapters, copy, related ids, note anchor]
  const C = [
    ['expe', '지수함수와 e', 'c5', '(aˣ)′ = C(a)·aˣ에서 C(e) = 1이 되는 밑이 e예요. (eˣ)′ = eˣ.', ['ln', 'maclaurin'], 'm-exp'],
    ['invfn', '역함수의 미분', 'c5', '(f⁻¹)′(b) = 1/f′(a), b = f(a). 그래프가 y = x에 대칭이라 기울기가 역수가 돼요.', ['ln', 'arctrig'], 'm-inv'],
    ['ln', '자연로그 · 로그 미분법', 'c5', '(ln x)′ = 1/x, (aˣ)′ = aˣ ln a. 밑과 지수에 x가 다 있으면 ln을 씌워 미분해요.', ['explogint'], 'm-log'],
    ['explogint', '지수·로그 적분', 'c5', '∫dx/x = ln|x|, ∫aˣdx = aˣ/ln a, ∫tan x dx = ln|sec x|.', ['subst'], 'm-explogint'],
    ['lhopital', '로피탈의 법칙', 'c5', '0/0, ∞/∞ 꼴에서 lim f/g = lim f′/g′. 0·∞, 1^∞ 같은 꼴은 몫이나 ln으로 바꿔서 써요.', ['growth', 'limits', 'improper'], 'm-lhopital'],
    ['growth', '증가 속도 · o, O', 'c5', '로그 ≪ 거듭제곱 ≪ 지수. f/g → 0이면 f = o(g). 극한비교판정법의 바탕이에요.', ['comparison'], 'm-growth'],
    ['arctrig', '역삼각함수', 'c5', '정의역을 [−π/2, π/2], [0, π], (−π/2, π/2)로 잘라 뒤집어요. sin⁻¹x ≠ 1/sin x.', ['arctrigcalc'], 'm-arctrig'],
    ['arctrigcalc', '역삼각함수의 미적분', 'c5', '(sin⁻¹x)′ = 1/√(1 − x²), (tan⁻¹x)′ = 1/(1 + x²). 거꾸로 읽으면 적분 공식이에요.', ['trigsub', 'partial'], 'm-arctrig-calc'],
    ['hyper', '쌍곡선함수', 'c5', 'cosh²x − sinh²x = 1, (cosh x)′ = sinh x. 역함수는 ln(x + √(x² ± 1)) 꼴이에요.', ['trigsub', 'expe'], 'm-hyper'],
    ['subst', '치환적분', 'c6', '안쪽 함수를 t로 두고 그 도함수가 곁에 있는지 봐요. sin·cos 홀수 거듭제곱은 하나를 떼어 두고 바꿔요.', ['parts'], 'm-intbasic'],
    ['parts', '부분적분', 'c6', '∫f′g = fg − ∫fg′. 로그 → 역삼각 → 다항 → 삼각 → 지수 순으로 g를 골라요.', ['ln'], 'm-parts'],
    ['partial', '부분분수', 'c6', '나눗셈으로 진유리함수를 만든 뒤 일차식·기약 이차식 조각으로 쪼개요. 이차식은 완전제곱 → tan⁻¹.', ['series'], 'm-partial'],
    ['trigsub', '삼각치환', 'c6', '√(a² − x²) → a sin θ, √(a² + x²) → a tan θ, √(x² − a²) → a sec θ. 직각삼각형으로 되돌려요.', ['halfangle'], 'm-trigsub'],
    ['improper', '이상적분', 'c6', '무한 구간이나 불연속점은 극한으로 정의해요. ∫₁^∞ dx/xᵖ는 p > 1이면 수렴. 비교판정으로도 판정해요.', ['integral', 'pseries', 'comparison'], 'm-improper'],
    ['area2', '곡선 사이의 넓이', 'c7', 'A = ∫(위 − 아래)dx. 교점에서 구간을 나누고, 필요하면 y로 적분해요.', ['polararea'], 'm-area'],
    ['volume', '단면 · 원판 · 와셔법', 'c7', 'V = ∫A(x)dx, 회전체는 π∫f²dx, 구멍이 있으면 π∫(R² − r²)dx.', ['area2'], 'm-volume'],
    ['arclen', '곡선의 길이 · 회전면 넓이', 'c7', 'L = ∫√(1 + f′²)dx, S = 2π∫f√(1 + f′²)dx. 작은 빗변과 원뿔대 띠를 더한 거예요.', ['volume'], 'm-arclength'],
    ['work', '일 · 변위와 거리', 'c7', 'W = ∫F dx, 용수철은 ½kd². ∫v dt는 변위, ∫|v| dt는 이동 거리.', [], 'm-work'],
    ['matrix', '행렬과 곱셈', 'c9', '(AB)ᵢⱼ = Σ aᵢₖbₖⱼ. 연립방정식을 AX = B 한 줄로 쓰려고 이렇게 정의했어요. AB ≠ BA예요.', ['linsys'], 'm-matrix'],
    ['transpose', '전치 · 특수 행렬', 'c9', '단위행렬, 삼각행렬, 대칭행렬 등. (AB)ᵀ = BᵀAᵀ처럼 순서가 뒤집혀요.', ['matrix', 'inverse'], 'm-matrix'],
    ['det', '행렬식', 'c9', '정사각행렬에서 짜낸 수. 0이면 해가 유일하지 않고 역행렬이 없어요. 2×2는 평행사변형의 넓이예요.', ['linsys', 'inverse', 'cramer'], 'm-det'],
    ['cofactor', '여인수 전개', 'c9', 'Cᵢⱼ = (−1)^(i+j)Mᵢⱼ. 어느 행이나 열로 전개해도 같아서 0이 많은 줄을 골라요.', ['det', 'adj'], 'm-det'],
    ['detprops', '행렬식의 성질', 'c9', '행 교환은 부호 반대, 상수배 더하기는 불변, 삼각행렬은 대각곱, det(AB) = det A·det B.', ['det', 'rowops'], 'm-det'],
    ['linsys', '선형계 AX = B', 'c9', '계수행렬 A, 미지수 X, 우변 B. B = O이면 제차 선형계라 자명해를 항상 가져요.', ['gauss', 'rank'], 'm-gauss'],
    ['rowops', '기본 행연산', 'c9', '행 교환, 행에 상수 곱하기, 다른 행의 배수 더하기. 해를 구할 때와 행렬식을 구할 때 주의점이 달라요.', ['gauss'], 'm-gauss'],
    ['gauss', '가우스 소거법', 'c9', '첨가행렬을 사다리꼴로 만든 뒤 역대입해요.', ['rank', 'gaussjordan'], 'm-gauss'],
    ['rank', '해의 종류와 계수', 'c9', '사다리꼴에서 r = n이면 유일해, 모순 행이 있으면 해 없음, 아니면 자유변수가 있는 무수한 해.', ['det'], 'm-gauss'],
    ['inverse', '역행렬', 'c9', 'AB = BA = I. (AB)⁻¹ = B⁻¹A⁻¹, det A⁻¹ = 1/det A. 있으면 X = A⁻¹B로 해가 하나예요.', ['gaussjordan', 'adj'], 'm-inverse'],
    ['gaussjordan', '가우스–요르단법', 'c9', '[A | I]의 왼쪽을 I로 만들면 오른쪽에 A⁻¹이 남아요.', [], 'm-inverse'],
    ['adj', '딸림행렬', 'c9', 'adj A = [Cᵢⱼ]ᵀ, A⁻¹ = adj A / det A. 2×2는 대각선 교환, 나머지 부호 반전.', ['cramer'], 'm-inverse'],
    ['cramer', '크라머 공식', 'c9', 'xₖ = det Aₖ / det A. Aₖ는 k열을 B로 바꾼 행렬이에요.', [], 'm-cramer'],
    ['sequence', '수열의 수렴 (ε–N)', 'c10', 'n > N이면 |aₙ − L| < ε가 되는 N이 있을 때 L로 수렴해요.', ['limits', 'series'], 'm-seq'],
    ['limits', '자주 쓰는 극한', 'c10', '(ln n)/n → 0, ⁿ√n → 1, (1 + x/n)ⁿ → eˣ, xⁿ/n! → 0.', ['taylor'], 'm-seq'],
    ['series', '급수와 부분합', 'c10', '부분합 수열이 수렴하면 급수가 수렴해요. 등비급수와 망원급수는 합을 구할 수 있어요.', ['divergence', 'geometric'], 'm-series'],
    ['geometric', '등비급수', 'c10', '|r| < 1이면 a/(1 − r)로 수렴, 아니면 발산. 비교판정법의 단골 비교 대상이에요.', ['comparison', 'ratio'], 'm-series'],
    ['divergence', '발산판정법', 'c10', 'lim aₙ ≠ 0이면 발산. 역은 거짓이라 조화급수처럼 aₙ → 0이어도 발산할 수 있어요.', ['harmonic'], 'm-series'],
    ['harmonic', '조화급수', 'c10', 'Σ 1/n은 발산해요. p = 1인 p급수예요.', ['pseries'], 'm-series'],
    ['integral', '적분판정법', 'c10', 'f가 연속·양·감소이면 급수와 이상적분의 수렴이 같아요.', ['pseries'], 'm-integral'],
    ['pseries', 'p급수', 'c10', 'Σ 1/nᵖ는 p > 1이면 수렴, p ≤ 1이면 발산. 비교판정법의 기준이에요.', ['comparison'], 'm-integral'],
    ['comparison', '비교 · 극한비교판정법', 'c10', '더 큰 급수가 수렴하면 작은 것도, 작은 급수가 발산하면 큰 것도. 극한비가 양의 유한값이면 운명을 같이해요.', [], 'm-compare'],
    ['alternating', '교대급수판정법', 'c10', '양수, 감소, 0으로 수렴하면 Σ(−1)ⁿ⁺¹aₙ는 수렴해요.', ['absolute'], 'm-alt'],
    ['absolute', '절대수렴 · 조건수렴', 'c10', '절대수렴하면 수렴(역은 거짓). 교대조화급수는 조건수렴이에요.', ['ratio'], 'm-alt'],
    ['ratio', '비 · 근판정법', 'c10', 'L < 1 절대수렴, L > 1 발산, L = 1 판정 불가. n!이나 ( )ⁿ이 보이면 써요.', [], 'm-ratio'],
    ['taylor', 'Taylor 공식과 나머지항', 'c10', 'f = Pₙ + Rₙ, Rₙ = f⁽ⁿ⁺¹⁾(ξ)(x − c)ⁿ⁺¹/(n + 1)!. Rₙ → 0이어야 급수가 f로 수렴해요.', ['maclaurin'], 'm-taylor'],
    ['maclaurin', 'Maclaurin 급수', 'c10', 'eˣ, sin x, cos x, ln(1 + x), arctan x, 1/(1 − x). 아는 급수에 대입·미분·적분해서 새 급수를 만들어요.', ['geometric'], 'm-maclaurin'],
    ['polar', '극좌표와 변환', 'c11', 'x = r cos θ, y = r sin θ, r² = x² + y². 한 점에 좌표가 무수히 많고, θ는 사분면을 보고 골라요.', ['polargraph'], 'm-polar'],
    ['symmetry', '대칭성 판정', 'c11', 'x축, y축, 원점 대칭을 각각 두 가지 대입으로 확인하고, 하나만 맞아도 대칭이에요.', ['polargraph'], 'm-polargraph'],
    ['polargraph', '극방정식 그래프 그리기', 'c11', '대칭 → 특수각 표 → 점 찍기. r < 0이면 반대쪽에 찍어요.', ['rose', 'limacon', 'lemniscate'], 'm-polargraph'],
    ['rose', '장미 곡선', 'c11', 'r = sin nθ, cos nθ. n이 홀수면 n잎, 짝수면 2n잎이에요.', ['polararea'], 'm-polargraph'],
    ['limacon', '리마송 · 심장형', 'c11', 'r = a ± b cos θ. a/b < 1 고리, = 1 심장형, 1–2 오목, ≥ 2 볼록.', ['polararea'], 'm-polargraph'],
    ['lemniscate', '리본형 · 나선', 'c11', 'r² = a cos 2θ는 우변이 음수인 곳에 점이 없어요. r = aθ는 나선이에요.', [], 'm-polargraph'],
    ['polararea', '극좌표 넓이', 'c11', 'A = ∫ ½r² dθ. 어려운 건 구간: 잎 하나는 r = 0인 이웃한 두 θ 사이.', ['halfangle'], 'm-polararea'],
    ['halfangle', '반각공식', 'c11', 'cos²θ = (1 + cos 2θ)/2, sin²θ = (1 − cos 2θ)/2. r²을 적분할 때 거의 항상 필요해요.', [], 'm-polararea']
  ];
  const nodes = [{ id: 'calculus', kind: 'root', label: T('대학수학'), copy: T('1학기 5–7장과 2학기 9–11장의 개념을 장과 함께 이었어요. 점을 눌러 노트로 바로 갈 수 있어요.') }];
  const edges = [], seen = new Set();
  const link = (a, b) => { const k = a < b ? a + '|' + b : b + '|' + a; if (!seen.has(k) && a !== b) { seen.add(k); edges.push([a, b]); } };
  Object.entries(CH).forEach(([id, c]) => { nodes.push({ id, kind: 'project', label: T(c.label), meta: c.meta, href: './input.html#' + c.anchor, copy: T(c.copy) }); link('calculus', id); });
  const ids = new Set(C.map(c => c[0]));
  C.forEach(([id, label, chs, copy, rel, anchor]) => {
    nodes.push({ id, kind: 'concept', label: T(label), copy: T(copy), href: './input.html#' + anchor });
    chs.split(' ').forEach(c => link(c, id));
    rel.forEach(r => { if (ids.has(r)) link(id, r); });
  });
  window.GRAPH_DATA = {
    nodes, edges, bilingual: false, spacing: 1.2,
    note: T('개념 사이의 선은 함께 공부하면 이해가 이어지는 관계를 뜻해요. 장과 개념을 잇는 선은 그 장에서 다룬 개념이라는 뜻이에요.'),
    kinds: { root: 'GRAPH NOTES', project: 'CHAPTER NOTES', concept: 'CONCEPT NOTES' },
    linkLabel: T('노트 열기')
  };
})();
