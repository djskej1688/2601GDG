/* Chemistry knowledge graph for map.js (input-graph.html).
 * Courses are hubs; a concept links to every course that covers it and to closely related concepts.
 * Copy is written for the site from the study notes; no exam questions or course materials are reproduced. */
(() => {
  'use strict';
  const T = ko => ({ ko, en: ko });
  const COURSES = {
    gc: { anchor: 'gen-chem', label: '대학화학2', meta: 'COURSE · 2026 FALL', copy: '일반화학 10–14장. 액체와 고체, 용액, 반응 속도론, 화학 평형, 산과 염기.' },
    mp: { anchor: 'materials-prop', label: '재료물성개론', meta: 'COURSE · 2026 FALL', copy: '결함과 열역학, 점결함, 전위와 면결함, 유리, 확산. 결함이 재료의 성질을 어떻게 바꾸는지를 다뤄요.' },
    mc: { anchor: 'materials-chem', label: '재료화학개론', meta: 'COURSE · 2026', copy: '원자 구조와 결합, 에너지 띠에서 시작해 결정 구조와 X선 회절까지. 원자 수준에서 고체를 이해하는 과목이에요.' }
  };
  // [id, label, courses, copy, related concept ids]
  const C = [
    ['bohr', 'Bohr 모형', 'mc', '수소 원자의 에너지 준위 `E_n = −13.6/n² eV`. 전자가 준위 사이를 옮겨 갈 때 그 차이만큼의 빛을 흡수하거나 내놓아요.', ['photon', 'hspec'], 'mc-bohr'],
    ['photon', '광자 에너지', 'mc', '`E = hc/λ = 1240/λ(nm) eV`. 파장이 짧을수록 에너지가 커요.', ['bandgap', 'xtube'], 'mc-bohr'],
    ['hspec', '수소 스펙트럼', 'mc', '아래 준위가 n = 1이면 Lyman, 2면 Balmer, 3이면 Paschen 계열이에요. Lyman 계열의 가장 짧은 파장은 1/R이에요.', ['moseley'], 'mc-bohr'],
    ['debroglie', '물질파', 'mc', '움직이는 입자도 파동성을 가져요. 전자의 파장은 `λ = h/√(2mK)`예요.', ['uncertainty'], 'mc-atom'],
    ['uncertainty', '불확정성 원리', 'mc', '입자의 위치와 운동량을 동시에 정확히 알 수 없어요.', [], 'mc-atom'],
    ['qnum', '양자수와 오비탈', 'mc', '전자 하나의 상태는 n, l, m_l, m_s 네 양자수로 정해져요. s, p, d, f 오비탈은 각각 1, 3, 5, 7개이고 전자는 2, 6, 10, 14개까지 들어가요.', ['pauli', 'econfig', 'hybrid', 'bohr'], 'mc-qnum'],
    ['pauli', '파울리 배타 원리', 'mc', '한 원자 안의 두 전자는 네 양자수가 모두 같을 수 없어요. 그래서 오비탈 하나에는 스핀이 반대인 전자 두 개까지 들어가요.', ['econfig', 'bondcurve'], 'mc-filling'],
    ['econfig', '전자 배치', 'mc', '껍질 하나에는 전자가 2n²개까지 들어가요. 4s가 3d보다 먼저 채워져요.', ['ieea'], 'mc-filling'],
    ['ieea', '이온화 에너지 · 전자 친화도', 'mc', '전자를 떼어 내는 데 드는 에너지와 전자를 받을 때 나오는 에너지예요. 닫힌 껍질의 비활성 기체는 이온화 에너지가 크고, 할로젠은 전자 친화도가 커요.', ['electroneg'], 'mc-ie'],
    ['electroneg', '전기음성도', 'mc gc', '결합 전자를 끌어당기는 상대적인 정도로 단위가 없어요. 차이가 클수록 결합의 이온성이 커지고, 산소산에서는 중심 원자의 전기음성도가 클수록 강한 산이에요.', ['ionic', 'pauling', 'acidbase', 'polarity'], 'mc-pauling'],
    ['ionic', '이온 결합', 'mc', '전자가 옮겨 가서 생긴 양이온과 음이온의 정전기적 인력이에요. 방향성이 없어요.', ['latticeE', 'solids', 'nacl'], 'mc-ionic-bond'],
    ['covalent', '공유 결합', 'mc', '전자를 공유하는 결합으로 방향성이 강해요. 오비탈이 정면으로 겹치면 σ 결합, 옆으로 겹치면 π 결합이에요.', ['hybrid', 'solids', 'pauling'], 'mc-covalent'],
    ['metallic', '금속 결합', 'mc', '원자에서 떨어져 나와 퍼져 있는 원자가 전자가 양이온들을 묶어요. 금속의 전기 전도는 이 전자들 덕분이에요.', ['band', 'solids'], 'mc-secondary'],
    ['imf', '분자간 힘 (2차 결합)', 'mc gc', '분산력, 쌍극자–쌍극자 힘, 수소결합. 1차 결합(이온·공유·금속)보다 훨씬 약하지만 끓는점, 증기압, 점성을 정해요.', ['hbond', 'polarity', 'vapor'], 'mc-secondary'],
    ['hbond', '수소결합', 'gc mc', 'H가 N, O, F에 직접 붙은 분자 사이의 강한 쌍극자 인력이에요. 물의 끓는점이 높고 얼음이 물에 뜨는 이유예요.', ['vapor', 'phase'], 'gc-10'],
    ['pauling', 'Pauling 결합 에너지', 'mc', '`E_AB = √(E_AA·E_BB) + 96.3(Δχ)²` kJ/mol. 순수 공유 결합 에너지에 이온성 기여가 더해진다고 봐요.', [], 'mc-pauling'],
    ['latticeE', '격자 에너지', 'mc', '기체 이온이 모여 이온 결정이 될 때 나오는 에너지예요. Born–Haber 순환으로 구하거나 Born–Landé 식으로 계산해요.', ['bondcurve'], 'mc-ionic-bond'],
    ['bondcurve', '결합 에너지 곡선', 'mc', '인력과 반발력의 합이 가장 낮은 거리 r₀가 평형 결합 거리예요. 더 가까워지면 전자구름이 겹쳐 반발이 급격히 커져요.', [], 'mc-ionic-bond'],
    ['hybrid', '혼성 오비탈', 'mc', 'sp는 직선형 180°(BeH₂, CO₂), sp²는 평면 삼각형 120°(BF₃), sp³는 사면체 109.5°(CH₄)예요.', ['polarity', 'diamond'], 'mc-hybrid'],
    ['polarity', '분자 극성', 'mc gc', '결합에 극성이 있어도 구조가 대칭이면 쌍극자가 상쇄돼요. CH₄, CO₂는 비극성, H₂O, CH₃Cl은 극성이에요.', [], 'mc-hybrid'],
    ['band', '에너지 띠', 'mc', '원자 N개가 모이면 준위가 N개로 갈라져 띠를 이뤄요. 띠가 일부만 차 있거나 겹치면 금속, 꽉 찬 띠와 빈 띠 사이에 간격이 있으면 반도체나 절연체예요.', ['bandgap', 'softx', 'doping'], 'mc-lcao'],
    ['bandgap', '띠간격과 빛 흡수', 'mc', '띠간격보다 에너지가 큰 빛만 흡수돼요. 흡수가 시작되는 파장은 `λ = 1240/E_g(eV)` nm예요. ZnO(3.2 eV)는 가시광선을 흡수하지 않아 투명해요.', ['doping'], 'mc-bandtypes'],
    ['doping', '반도체 도핑', 'mc mp', 'Si에 B를 넣으면 전자를 받는 받개가 되어 p형, P를 넣으면 주개가 되어 n형이에요. 도핑하지 않은 Si는 전자와 정공 농도가 같아요.', ['pointdef'], 'mc-doping'],
    ['solids', '결정성 고체 분류', 'gc mc', '이온성, 공유성(그물), 금속성, 분자성 고체. 결합의 종류가 녹는점, 경도, 전도성을 정해요.', ['lattice'], 'mc-crystal'],
    ['lattice', '공간 격자와 단위세포', 'mc', '공간 격자의 모든 점은 주변 환경이 같아요. 단위세포를 반복해 결정을 채우고, 격자점이 하나뿐인 셀이 기본 셀(primitive cell)이에요.', ['bravais', 'grains'], 'mc-lattice'],
    ['bravais', '7 결정계 · 14 Bravais 격자', 'mc', '격자 형태는 7개 결정계와 14개 Bravais 격자로 정리돼요. P, C, I, F 셀의 격자점 수는 각각 1, 2, 2, 4예요.', ['symmetry', 'cubic'], 'mc-bravais'],
    ['symmetry', '회전 대칭', 'mc', '결정에서 허용되는 회전은 1, 2, 3, 4, 6회 대칭뿐이에요(α = 360°/n). 5회 대칭으로는 공간을 빈틈없이 채울 수 없어요.', [], 'mc-symmetry'],
    ['cubic', 'SC · BCC · FCC', 'gc mc mp', '셀당 원자 수 1, 2, 4. 배위수 6, 8, 12. 반지름 관계 a = 2r, √3a = 4r, √2a = 4r.', ['density', 'closepack', 'selection', 'slip'], 'mc-cubic'],
    ['closepack', '조밀 쌓임 (FCC · HCP)', 'mc mp', 'FCC는 ABCABC, HCP는 ABAB로 쌓여요. 둘 다 충진율 0.74이고 이상적인 HCP의 c/a는 1.633이에요. 2D에서는 육방 배열(0.907)이 정사각 배열(0.785)보다 조밀해요.', ['slip'], 'mc-packing'],
    ['density', '결정 밀도', 'gc mc', '`ρ = Z·M / (N_A·a³)`. 셀당 원자 수 Z와 격자상수 a로 밀도를, 거꾸로 원자량이나 반지름을 구해요.', [], 'mc-cubic'],
    ['nacl', 'NaCl · CaF₂ · ZnS · CsCl', 'mc gc', 'NaCl은 두 FCC 격자가 겹친 구조로 셀당 Na 4개, Cl 4개예요. CaF₂는 Ca가 FCC 자리, F가 사면체 자리에 있어 셀당 Ca 4개, F 8개예요.', ['pointdef'], 'mc-structures'],
    ['diamond', '다이아몬드 구조', 'mc mp', '각 원자가 이웃 4개와 sp³ 결합해요(C, Si, Ge). 다이아몬드 → 흑연은 자발적이지만 매우 느린 대표적인 예이기도 해요.', ['gibbs'], 'mc-structures'],
    ['miller', '면 지수 (hkl)', 'mc', '면이 축과 만나는 절편 → 역수 → 가장 작은 정수비 → (hkl). 축과 평행하면 0, 음의 절편은 지수 위에 줄. (hkl)은 서로 평행한 면 전체의 집합이에요.', ['dspacing', 'family', 'direction'], 'mc-plane'],
    ['direction', '방향 지수 [uvw]', 'mc', '방향 위 한 점의 좌표(끝점 − 시작점)를 가장 작은 정수비로 만든 것. 역수를 쓰지 않아요. 입방정에서는 [hkl] ⊥ (hkl)이에요.', ['family'], 'mc-direction'],
    ['family', 'family {hkl} · ⟨uvw⟩', 'mc', '대칭으로 겹쳐지는 면이나 방향의 모임. 입방정 {100}은 6개, {110}은 12개, {111}은 8개. 사방정에서는 축 길이가 달라 family가 작아져요.', ['bravais', 'closepack'], 'mc-family'],
    ['basis', '격자 + 기저', 'mc', '결정 구조 = 공간 격자 + 기저. 기저는 각 격자점에 놓이는 원자 묶음이에요. HCP, NaCl, CsCl, 다이아몬드는 모두 격자에 원자 둘 이상의 기저를 놓은 구조예요.', ['lattice', 'nacl', 'diamond'], 'mc-lattice'],
    ['voids', '사면체 · 팔면체 빈자리', 'mc', '조밀하게 쌓인 공 사이의 틈. 공 4개로 둘러싸인 사면체 자리와 6개로 둘러싸인 팔면체 자리가 있고, 이온 결정에서 작은 이온이 들어가요(NaCl의 Na는 팔면체, CaF₂의 F와 ZnS의 Zn은 사면체).', ['closepack', 'nacl'], 'mc-packing'],
    ['lcao', 'LCAO · 결합/반결합', 'mc', '원자 오비탈 두 개가 섞이면 낮은 결합 상태와 높은 반결합 상태로 갈라져요. 원자 N개면 상태도 N개이고, N이 홀수면 비결합 상태가 하나 생겨요.', ['band', 'covalent'], 'mc-lcao'],
    ['deloc', '비국소화된 파동', 'mc', '결정 속 원자가 전자의 파동함수는 모든 원자에 걸쳐 퍼져 있어요. 그래서 전자가 한 원자에 묶이지 않고 결정 전체를 움직일 수 있어요.', ['band', 'metallic', 'debroglie'], 'mc-waves'],
    ['apf', '배위수 · 충진율', 'mc mp', '가장 가까운 이웃 수(SC 6, BCC 8, FCC·HCP 12)와 원자가 차지하는 부피 비율(0.52, 0.68, 0.74). 다이아몬드 구조는 배위수 4예요.', ['cubic', 'closepack'], 'mc-cubic'],
    ['dspacing', '면간 거리', 'mc', '입방정에서 `d = a / √(h² + k² + l²)`. 지수가 클수록 면 사이가 좁아요.', ['bragg'], 'mc-plane'],
    ['xtube', 'X선관 · 제동 복사', 'mc', '필라멘트에서 나온 전자를 가속해 타깃에 부딪히면 제동 복사로 연속 스펙트럼이 나와요. 가장 짧은 파장은 `λ_SWL = hc/eV = 12.398/V(kV)` Å예요.', ['xchar'], 'mc-xtube'],
    ['xchar', '특성 X선 Kα · Kβ', 'mc', '먼저 K 껍질에 빈자리가 생겨야 해요. L → K 전이가 Kα, M → K 전이가 Kβ이고, Kβ가 에너지가 더 커서 파장이 짧아요.', ['moseley', 'bohr'], 'mc-xchar'],
    ['moseley', 'Moseley 법칙', 'mc', '`1/λ = R(Z − σ)²(1/n₁² − 1/n₂²)`. 원자번호가 클수록 특성 X선 파장이 짧아져요. σ는 안쪽 전자가 핵 전하를 가리는 정도(가림 효과)예요.', [], 'mc-moseley'],
    ['softx', '연 X선과 Na의 띠', 'mc', '3s → 2p 같은 작은 에너지 차이의 전이에서 나오는 낮은 에너지 X선이에요. 고체 Na는 3s가 띠를 이뤄 파장이 퍼지고, 기체 Na는 파장이 하나로 정해져요.', [], 'mc-softx'],
    ['bragg', 'Bragg 법칙', 'gc mc', '`nλ = 2d·sin θ`. 회절 각도에서 면간 거리와 격자상수를 알 수 있어요. 셀 안 원자의 위치는 각도가 아니라 봉우리 세기에 영향을 줘요.', ['selection', 'powder'], 'mc-bragg'],
    ['selection', '회절 소멸 규칙', 'mc', 'SC는 모든 면, BCC는 h + k + l이 짝수, FCC는 h, k, l이 모두 홀수이거나 모두 짝수일 때만 봉우리가 나와요. sin²θ의 비로 격자를 판별해요.', [], 'mc-selection'],
    ['powder', '분말 회절 (Debye–Scherrer)', 'mc', '분말 시료에 단색 X선을 쪼이면 링이 생기고, 이를 2θ–세기 그래프로 바꿔 각 봉우리에 (hkl)을 붙여요(indexing).', [], 'mc-powder'],
    ['vapor', '증기압 · Clausius–Clapeyron', 'gc', '`ln(P₁/P₂) = (ΔH_vap/R)(1/T₂ − 1/T₁)`. 분자간 힘이 약할수록 증기압이 크고 끓는점이 낮아요.', ['arrhenius', 'phase'], 'gc-10'],
    ['phase', '상평형 그림', 'gc', '삼중점에서는 세 상이 공존하고, 액체–기체 선은 임계점에서 끝나요. 물은 얼음 밀도가 작아 고체–액체 선이 음의 기울기예요.', ['glass'], 'gc-10'],
    ['colligative', '총괄성', 'gc', '증기압 내림, 끓는점 오름, 어는점 내림, 삼투압은 용질의 종류가 아니라 입자 수에 의존해요. van’t Hoff 계수 i로 해리를 반영해요.', ['vapor'], 'gc-11'],
    ['rate', '속도 법칙 · 적분 속도식', 'gc', '차수는 실험으로만 정해요. [A], ln[A], 1/[A] 중 시간에 대해 직선이 되는 것이 0, 1, 2차예요. 가장 느린 단계가 메커니즘의 속도를 정해요.', ['arrhenius'], 'gc-12'],
    ['arrhenius', '아레니우스 식 · 활성화 에너지', 'gc mp', '`k = A·e^(−Ea/RT)`. ln k를 1/T에 대해 그리면 기울기 −Ea/R인 직선이에요. 빈자리 농도와 확산계수도 같은 꼴이에요.', ['boltzmann', 'diffusion', 'pointdef'], 'gc-12'],
    ['boltzmann', '볼츠만 인자', 'mp gc', '`exp(−E/kT)`는 에너지 E가 필요한 상태가 열에너지로 채워질 확률이에요. 반응 속도, 빈자리 농도, 확산이 모두 이 꼴로 온도에 지수적으로 의존해요.', ['pointdef', 'diffusion'], 'mp-2'],
    ['equilibrium', '화학 평형', 'gc', '정반응과 역반응 속도가 같은 동적 상태예요. Q < K면 정반응, Q > K면 역반응 쪽으로 가고, K를 바꾸는 것은 온도뿐이에요.', ['gibbs', 'acidbase'], 'gc-13'],
    ['acidbase', '산 · 염기와 pH', 'gc', 'Arrhenius, Brønsted–Lowry, Lewis 정의. 약산은 `[H⁺] ≈ √(Ka·C)`로 근사하고, `Ka·Kb = Kw`로 짝산·짝염기를 이어요.', [], 'gc-14'],
    ['gibbs', 'Gibbs 에너지 · 엔트로피', 'mp gc', '`ΔG = ΔH − TΔS`가 음수면 자발적이에요. 결정에 결함이 항상 있는 것도, 흡열인데도 녹는 용해가 있는 것도 엔트로피 때문이에요.', ['pointdef', 'glass'], 'mp-1'],
    ['pointdef', '점결함 · 빈자리 농도', 'mp', '빈자리, 침입형 원자, 치환형 불순물. 평형 빈자리 수는 `N_v = N·exp(−Q_v/kT)`이고, 이온결정은 Schottky·Frenkel처럼 전하 중성을 지키는 짝으로 생겨요.', ['diffusion'], 'mp-2'],
    ['slip', '전위와 slip', 'mp', '소성변형은 전위가 움직이며 원자면을 미끄러뜨리는 slip이에요. b ⊥ 전위선이면 칼날, b ∥ 전위선이면 나사 전위예요. 조밀면이 많은 FCC가 연성이 좋아요.', ['diffusion'], 'mp-3'],
    ['grains', '결정립 · 면결함', 'mp mc', '단결정은 하나의 결정, 다결정은 방향이 다른 결정립의 모임이에요. 결정립계, 표면, 상 계면이 면결함이에요.', [], 'mp-3'],
    ['glass', '유리와 유리 전이', 'mp', '단거리 질서만 있는 비정질 고체예요. 원자가 재배열할 시간보다 빨리 식히면 결정 대신 유리가 되고, Tg는 냉각 속도에 따라 달라져요.', ['rate'], 'mp-5'],
    ['diffusion', '확산 · Fick 법칙', 'mp', '`J = −D·dC/dx`(1법칙), `∂C/∂t = D·∂²C/∂x²`(2법칙). 확산계수는 `D = D₀·exp(−Q_d/RT)`로 온도에 지수적으로 의존해요.', [], 'mp-6']
  ];
  const nodes = [{ id: 'chemistry', kind: 'root', label: T('화학'), copy: T('세 과목에서 배운 화학 개념을 한 그래프로 이었어요. 두 과목 이상에 걸친 개념은 여러 과목에 함께 연결돼 있어요.') }];
  const edges = [];
  const seen = new Set();
  const link = (a, b) => { const k = a < b ? a + '|' + b : b + '|' + a; if (!seen.has(k) && a !== b) { seen.add(k); edges.push([a, b]); } };
  Object.entries(COURSES).forEach(([id, c]) => {
    nodes.push({ id, kind: 'project', label: T(c.label), meta: c.meta, href: './input.html#' + c.anchor, copy: T(c.copy) });
    link('chemistry', id);
  });
  const ids = new Set(C.map(c => c[0]));
  C.forEach(([id, label, courses, copy, rel, anchor]) => {
    nodes.push({ id, kind: 'concept', label: T(label), copy: T(copy.replace(/`/g, '')), href: anchor ? './input.html#' + anchor : undefined });
    courses.split(' ').forEach(c => link(c, id));
    rel.forEach(r => { if (ids.has(r)) link(id, r); });
  });
  window.GRAPH_DATA = {
    nodes, edges, bilingual: false, spacing: 1.3,
    note: T('개념 사이의 선은 함께 공부하면 이해가 이어지는 관계를 뜻해요. 과목과 개념을 잇는 선은 그 과목에서 다룬 개념이라는 뜻이에요.'),
    kinds: { root: 'GRAPH NOTES', project: 'COURSE NOTES', concept: 'CONCEPT NOTES' },
    linkLabel: T('노트 열기')
  };
})();
