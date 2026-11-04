# Generates input.html (study notes) from the data below. Run from the repo root: python3 tools/build_input.py .
import sys, os, html, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from input_mc import MC_SECTIONS
from input_math import MATH_SECTIONS
from input_gc1 import GC1_SECTIONS
from input_math1 import MATH1_SECTIONS
from input_figs import FIGS

def inline(s):
    """Escape text, then turn `code` spans into <code> and **bold** into <b>."""
    s = html.escape(s, quote=False)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'\$(\d)', r'<span class="ov">\1</span>', s)
    return s

SUBJECTS = [
 dict(id='matlab', name='MATLAB', ko='MATLAB 프로그래밍', term='2026 FALL', status='notes',
  intro='계산기처럼 쓰는 법에서 시작해 배열, 함수, 반복문까지. 코드를 치면 무엇이 나오는지 바로 말할 수 있게 정리했어요.',
  chips=['교재 1–4장', '배열 · 함수 · 프로그래밍', '2D 그래프'],
  sections=[
   dict(title='1장 · MATLAB 개요', items=[
     '연산 순서는 괄호 → 거듭제곱 → 곱셈·나눗셈 → 덧셈·뺄셈이고, 같은 순위는 왼쪽부터 계산해요. `\\`는 왼쪽 나눗셈이라 `2\\7`은 7/2예요.',
     '지수에 분수를 쓸 땐 괄호가 꼭 필요해요. `27^(1/3)`은 3이지만 `27^1/3`은 9예요.',
     '줄 끝 세미콜론은 출력만 숨기고 계산은 해요. 변수에 담지 않은 결과는 `ans`에 남아요.',
     '변수 이름은 영문자로 시작하고 영문자·숫자·밑줄만 써요. 대소문자를 구분해요.',
     '`Inf`(1/0), `NaN`(0/0), `eps`(1과 그다음 수 사이 간격, `2.2204e-16`). `format`은 보이는 자릿수만 바꾸고 저장된 값은 그대로예요.',
     '`i`, `j`는 허수 단위예요. `7/2i`는 7/(2i)라서 −3.5i가 돼요.',
   ], code='x = 0:0.1:5;\nplot(x, 2*sqrt(x), \'+\'); hold on\nplot(x, 4*sin(3*x), \'o-\')\nlegend(\'y\', \'z\')   % 그린 순서대로 이름이 붙어요'),
   dict(title='2장 · 배열 · 셀 · 구조체', items=[
     '`a:q:b`는 b를 넘지 않을 때까지 만들어요(`0:2:7` → 0 2 4 6). `linspace(a,b,n)`은 양 끝을 포함해 n개를 고르게 나눠요.',
     '배열끼리 곱하기·나누기·거듭제곱은 점을 붙인 원소별 연산 `.*` `./` `.^`이에요. 덧셈·뺄셈은 원래 원소별이라 점이 없어요.',
     '`A(행, 열)`로 꺼내고, 콜론은 "전부"예요. `A(:)`는 열 순서로 쌓은 열 벡터이고, 이 열 순서 번호가 `find`에도 그대로 쓰여요.',
     '행렬 함수는 기본적으로 열마다 계산해요. `max(A)`는 열마다 최댓값, `max(A,[],2)`는 행마다예요. `size`는 (행, 열), `length`는 둘 중 큰 값, `numel`은 전체 개수예요.',
     '`A*B`는 행렬 곱이라 왼쪽 열 수 = 오른쪽 행 수여야 해요. 연립방정식 Ax = b는 `x = A\\b`로 풀어요(b는 열 벡터).',
     '다항식은 최고차항부터 계수를 써요. `roots`(근), `poly`(근 → 계수), `conv`(곱), `deconv`(나눗셈), `polyval`(값).',
     '`norm`은 벡터 길이, `dot`은 내적(0이면 수직), `cross`는 두 벡터에 수직인 벡터예요. 셀 배열은 `{}`, 구조체는 `s.field`로 다뤄요.',
   ], code='A = [6 12 4; 7 -2 3; 2 8 -9];\nb = [70; 5; 64];\nx = A\\b      % 3; 5; -2'),
   dict(title='3장 · 함수', items=[
     '반올림 방향: `round`는 가장 가까운 정수, `ceil`은 +∞ 쪽, `floor`는 −∞ 쪽, `fix`는 0 쪽. 음수에서 `floor`와 `fix`가 갈려요.',
     '`log`는 자연로그, 상용로그는 `log10`이에요. 삼각함수는 라디안이고, 도 단위는 `sind`, `cosd`를 써요.',
     '함수 파일은 첫 줄이 `function [출력] = 이름(입력)`이고, 파일 이름과 함수 이름이 같아야 해요. 함수는 바깥 변수를 보지 못해요.',
     '함수를 다른 함수에 넘길 땐 함수 핸들 `@`를 써요. `fplot(@cos, [0 2*pi])`, `fzero(@cos, 2)`, `fminbnd(@cos, 0, 4)`.',
     '익명 함수 `f = @(x) x.^2`는 파일 없이 만드는 함수예요. 이미 핸들이라 넘길 때 `@`를 다시 붙이지 않아요.',
   ], code='function [A, C] = circle(r)\n  A = pi*r.^2;\n  C = 2*pi*r;\nend\n\npoly1 = @(x) 4*x.^2 - 50*x + 5;\n[x, y] = fminbnd(poly1, -10, 10)   % x = 6.25'),
   dict(title='4장 · 프로그래밍', items=[
     '논리값은 0만 거짓이고 나머지는 모두 참이에요. 같음은 `==`, 같지 않음은 `~=`예요.',
     '우선순위는 괄호 → `^` → `~` → 산술 → 관계 → `&` → `|`. 그래서 `5 > 2 + 7`은 0, `(5 > 2) + 7`은 8이에요.',
     '논리 인덱싱 `A(A > 3)`은 조건에 맞는 값을, `find(A > 3)`는 그 위치(열 순서 번호)를 줘요.',
     '`if`의 조건이 배열이면 모든 원소가 참일 때만 참이에요. 위에서부터 처음 참인 블록 하나만 실행돼요.',
     '`for k = 1:n`이 끝나도 `k`는 마지막 값으로 남아요. 합은 0, 곱은 1에서 시작해요.',
     '`break`는 반복을 끝내고, `continue`는 이번 반복만 건너뛰어요. `while`은 매 반복 시작 전에 조건을 검사해요.',
   ], code='total = 0;\nfor k = 1:15\n    total = 5*k^2 - 2*k + total;\nend\ntotal          % 5960'),
  ]),
 dict(id='python', name='Python', ko='Python', term='', status='soon',
  intro='정리 중이에요. 곧 올라와요.', chips=[], sections=[]),
 dict(id='c', name='C', ko='C 프로그래밍', term='2026 FALL', status='notes',
  intro='코드를 머릿속에서 한 줄씩 실행해 보는 연습이 중심이었어요. 자주 헷갈렸던 규칙을 장별로 모았어요.',
  chips=['Perfect C 2–7장', '자료형 · 입출력 · 연산자', '조건 · 반복'],
  sections=[
   dict(title='2장 · C 프로그래밍 첫걸음', items=[
     'C는 대소문자를 구분해요. 프로그램은 소문자 `main`에서 시작해요.',
     '문자열은 큰따옴표로 감싸고, 문장은 세미콜론으로 끝내요. 세미콜론이 빠지면 오류가 다음 줄에서 보고되기도 해요.',
     '`printf`를 쓰려면 `#include <stdio.h>`가 필요해요.',
   ]),
   dict(title='3장 · 자료형과 변수', items=[
     '0으로 시작하면 8진수, 0x로 시작하면 16진수예요. `010`은 8, `0x1A`는 26이에요.',
     '`int`에 3.9를 넣으면 소수점 아래가 버려져 3이 돼요(반올림 아님).',
     '정수끼리 나누면 몫만 남아요. `7 / 2`는 3이고, 3.5를 얻으려면 `7.0 / 2`처럼 한쪽을 실수로 만들어요.',
     '문자는 사실 정수(아스키 코드)예요. `\'A\'`는 65라서 `\'A\' + 2`는 `\'C\'`예요. `\'A\'`는 문자 하나, `"A"`는 문자열이에요.',
   ]),
   dict(title='4장 · 전처리와 입출력', items=[
     '`%5d`는 5칸 오른쪽 정렬, `%-5d`는 왼쪽 정렬, `%05d`는 빈칸을 0으로 채워요. `%7.3f`는 소수 셋째 자리까지 만든 뒤 전체 7칸에 맞춰요.',
     '`scanf`에는 값이 아니라 주소를 넘겨요: `scanf("%d", &n)`.',
     '`double`을 읽을 땐 `scanf`에서 `%lf`를 써요. `printf`는 `%f`로 충분해요.',
   ]),
   dict(title='5장 · 연산자', items=[
     '`a++`는 지금 값을 넘긴 뒤 증가하고, `++a`는 먼저 증가한 값을 넘겨요.',
     '`/`는 몫, `%`는 나머지예요. `(double)a / b`는 실수 나눗셈이지만 `(double)(a / b)`는 이미 잘린 몫을 바꾼 거예요.',
     '`&&`, `||`는 단락 평가를 해요. 왼쪽만으로 결과가 정해지면 오른쪽(예: `b++`)은 실행되지 않아요.',
     '비트 연산: `&` `|` `^`는 비트마다, `~x`는 항상 −x − 1, `x << n`은 2ⁿ을 곱한 것과 같아요.',
     '`10 <= a <= 19`는 범위 검사가 아니에요. 왼쪽부터 0 또는 1이 되니 `a >= 10 && a <= 19`로 써요.',
   ]),
   dict(title='6장 · 조건', items=[
     '`if (x = 5)`는 비교가 아니라 대입이라 항상 참이에요. 비교는 `==`예요.',
     '`if (조건);`처럼 세미콜론을 붙이면 빈 문장이 되어, 아래 문장은 조건과 상관없이 실행돼요.',
     '`else`는 가장 가까운 `if`와 짝이에요. 들여쓰기는 의미가 없어요.',
     '`switch`는 `break`를 만날 때까지 아래 `case`로 흘러가요(fall-through). `default`는 위치가 자유롭지만 하나만 둘 수 있어요.',
     '`case` 뒤에는 정수·문자 상수만 와요. 실수(`2.5`), 문자열(`"B"`), 변수, 같은 값의 중복은 컴파일 오류예요. `switch` 괄호 안도 정수형이어야 해요.',
   ], code='switch (score / 10) {\ncase 10:\ncase 9: printf("A\\n"); break;   /* 10과 9를 묶음 */\ncase 8: printf("B\\n"); break;\ndefault: printf("F\\n");\n}'),
   dict(title='7장 · 반복', items=[
     '`do { } while (조건);`은 본문을 먼저 실행해서 최소 한 번은 돌아요. 끝의 세미콜론이 필요한 건 do-while뿐이에요.',
     '`for (...);`처럼 세미콜론을 붙이면 빈 문장을 반복하고, 아래 블록은 반복 밖에서 한 번만 실행돼요.',
     '`continue`는 `for`에서는 증감식으로, `while`에서는 조건식으로 가요.',
     '`break`는 가장 안쪽의 반복문이나 `switch` 하나만 빠져나와요. `switch` 안의 `break`로는 바깥 반복이 끝나지 않아요.',
     '누적 변수는 "몇 번 0으로 돌아가야 하나"로 초기화 위치를 정해요. 합은 0, 곱은 1에서 시작해요.',
     '`while (n-- > 2)`는 비교한 뒤 줄이니, 마지막 비교가 거짓이어도 한 번 더 줄어요.',
   ]),
  ]),
 dict(id='chemistry', name='Chemistry', ko='화학', term='2026 FALL', status='notes',
  intro='대학화학, 재료물성개론, 재료화학개론을 한곳에 모았어요. 과목을 넘나드는 개념은 지식 그래프에서 서로 이어 볼 수 있어요.',
  chips=['대학화학 6–14장', '재료물성개론 1–6주차', '재료화학개론'], graph='./input-graph.html',
  groups=[
   dict(id='gen-chem', title='대학화학', sub='일반화학 6–14장 · 1학기 6–9장, 2학기 10–14장', sections=GC1_SECTIONS + [
    dict(id='gc-10', title='10장 · 액체와 고체', items=[
      '분자간 힘은 분산력 < 쌍극자–쌍극자 < 수소결합 순이에요. 단, 분자량이 비슷할 때의 비교예요. 수소결합은 H가 N, O, F에 직접 붙어 있을 때만 생겨요.',
      '분자간 힘이 클수록 끓는점·표면장력·점성은 커지고 증기압은 작아져요. 끓는점은 증기압이 외부 압력과 같아지는 온도예요.',
      'Clausius–Clapeyron 식 `ln(P₁/P₂) = (ΔH_vap/R)(1/T₂ − 1/T₁)`로 두 온도의 증기압을 이어요. T는 K, ΔH는 J/mol로 맞춰요.',
      '물은 얼음이 액체보다 밀도가 작아서 상평형 그림의 고체–액체 선 기울기가 음수예요. CO₂는 양수이고, 1 atm에서 승화해요.',
      '결정성 고체는 금속성·이온성·분자성·그물 공유성 네 가지예요. 단위세포당 원자 수는 SC 1, BCC 2, FCC 4이고, 밀도는 (원자 수 × M / N_A) / a³예요.',
      'Bragg 법칙 `nλ = 2d sin θ`로 X선 회절각에서 원자 층 사이 거리 d를 구해요.',
    ]),
    dict(id='gc-11', title='11장 · 용액의 특성', items=[
      '몰농도(용액 L 기준), 몰랄농도(용매 kg 기준), 질량 백분율, 몰분율. 서로 바꿀 때는 밀도가 열쇠예요.',
      '"비슷한 것끼리 녹는다." 기체 용해도는 압력이 오르면 늘고(Henry 법칙), 온도가 오르면 줄어요.',
      '총괄성은 입자의 종류가 아니라 수에만 의존해요: 증기압 내림 `P = χP°`, 끓는점 오름 `ΔT_b = iK_b m`, 어는점 내림 `ΔT_f = iK_f m`, 삼투압 `π = iMRT`.',
      'van\'t Hoff 계수 i는 녹아서 생기는 입자 수예요(NaCl 2, CaCl₂ 3). 실제로는 이온쌍 때문에 예상보다 조금 작아요.',
    ]),
    dict(id='gc-12', title='12장 · 화학 반응 속도론', items=[
      '속도 법칙 `속도 = k[A]^m[B]^n`의 차수는 실험으로만 정해요. 균형 반응식의 계수와는 상관없어요.',
      '초기 속도법: 한 물질의 농도만 바꾼 두 실험을 나눠 차수를 구해요. 2배 → 2배면 1차, 4배면 2차예요.',
      '적분 속도식에서 직선이 되는 그래프로 차수를 판별해요: 0차 [A], 1차 ln[A], 2차 1/[A] 대 t. 1차 반감기는 0.693/k로 농도와 무관해요.',
      '메커니즘에서는 가장 느린 단계가 속도를 정해요. 중간체가 속도식에 남으면 앞의 빠른 평형으로 바꿔 넣어요.',
      '아레니우스 식 `k = A·e^(−Ea/RT)`. 두 온도의 k로 활성화 에너지를 구해요.',
    ]),
    dict(id='gc-13', title='13장 · 화학 평형', items=[
      '평형은 정반응 속도와 역반응 속도가 같은 동적 상태예요. 농도는 일정하지만 서로 같을 필요는 없어요.',
      '반응식을 뒤집으면 1/K, n배 하면 Kⁿ, 두 반응을 더하면 K₁K₂예요. `Kp = K(RT)^Δn`.',
      '순수한 고체와 액체는 평형식에 쓰지 않아요.',
      'Q < K면 정반응, Q > K면 역반응 쪽으로 가요. ICE 표로 평형 농도를 구하고, 음수가 되는 근은 버려요.',
      '르샤틀리에 원리: 자극을 줄이는 방향으로 이동해요. K를 바꾸는 건 온도뿐이에요.',
    ]),
    dict(id='gc-14', title='14장 · 산과 염기', items=[
      'Arrhenius(H⁺/OH⁻를 냄), Brønsted–Lowry(양성자 주개/받개), Lewis(전자쌍 받개/주개) 순으로 정의가 넓어져요.',
      '`Kw = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴`(25 °C), `Ka × Kb = Kw`. 강산은 HCl, HBr, HI, HNO₃, H₂SO₄, HClO₃, HClO₄ 정도로 적어요.',
      '약산의 [H⁺]는 `x ≈ √(Ka·C)`로 근사하고, x/C가 5% 미만인지 확인해요.',
      '다양성자산은 Ka 차이가 커서 pH를 첫 단계만으로 구해요.',
      '염의 액성: 약산의 짝염기(F⁻)가 있으면 염기성, 약염기의 짝산(NH₄⁺)이 있으면 산성, 강산·강염기에서 온 이온만 있으면 중성이에요.',
      '산소산은 산소가 많을수록, 중심 원자의 전기음성도가 클수록 강해요. HX는 H–X 결합이 약할수록 강해요(HF는 약산).',
    ]),
   ]),
   dict(id='materials-prop', title='재료물성개론', sub='Materials Properties · 1–6주차', sections=[
    dict(id='mp-1', title='1주차 · 결함과 열역학', items=[
      '결함은 차원으로 나눠요: 0D 점결함, 1D 전위, 2D 면결함(결정립계·표면), 3D 체적결함(void·crack).',
      '빈자리를 만들면 결합 에너지가 들지만(ΔH > 0) 배열의 경우의 수가 늘어요(ΔS > 0). `ΔG = ΔH − TΔS` 때문에 T > 0에서는 결함이 조금 있는 결정이 더 안정해요.',
      '다이아몬드 → 흑연은 ΔG < 0으로 자발적이지만 매우 느려요. 열역학은 방향을, 동역학은 속도를 정해요.',
    ]),
    dict(id='mp-2', title='2주차 · 점결함', items=[
      '빈자리, 침입형 원자, 치환형 불순물 세 가지예요.',
      '`ΔG = nΔH_v − kT ln W`를 n으로 미분해 0으로 두면(Stirling 근사) 평형 빈자리 수 `N_v = N·exp(−Q_v/kT)`가 나와요.',
      'ln(N_v/N)을 1/T에 대해 그리면 기울기 −Q_v/k인 직선이라, 두 온도의 데이터로 Q_v를 거꾸로 구할 수 있어요.',
      '이온결정은 전하 중성을 지키는 짝으로 결함이 생겨요: Schottky(양·음이온 빈자리 한 쌍), Frenkel(빈자리 + 침입형 이온). 경우의 수가 제곱이라 지수에 2가 붙어요.',
      '전하가 다른 불순물이 들어가면 합이 0이 되도록 빈자리가 생겨요(예: CaO에 Li₂O → Li⁺ 2개당 O 빈자리 1개).',
    ]),
    dict(id='mp-3', title='3–4주차 · 선결함과 면결함', items=[
      '소성변형은 원자면이 미끄러지는 slip이고, slip을 실제로 해내는 것이 전위예요. 면 전체를 한 번에 밀지 않고 결합을 한 줄씩 바꿔 가요(카펫의 주름).',
      'Burgers 벡터 b는 전위를 둘러싼 회로가 닫히지 않는 틈이에요. b ⊥ 전위선이면 칼날 전위, b ∥ 전위선이면 나사 전위예요.',
      '칼날 전위는 미끄럼면이 하나로 정해지고, 나사 전위는 전위선을 지나는 어느 면으로든 갈아탈 수 있어요(cross-slip).',
      'Glide는 확산 없이 저온에서도 일어나고, climb은 빈자리 확산이 필요해 고온에서 활발해요.',
      'FCC는 조밀면과 방향이 많아 연성이 좋고, HCP는 slip 방법이 적어 연성이 낮아요.',
    ]),
    dict(id='mp-5', title='5주차 · 유리', items=[
      '유리는 단거리 질서는 있지만 장거리 주기성이 없는 비정질 고체예요.',
      '결정화는 Tm에서 부피가 뚝 떨어지지만, 유리는 Tm을 지나 과냉각 액체로 내려오다 Tg에서 기울기가 꺾여요.',
      '내부 시간척도 τ(원자 재배열에 필요한 시간)보다 냉각 시간 Δt가 짧으면 구조가 얼어붙어 유리가 돼요.',
      '빨리 식힐수록 Tg가 높고 덜 조밀해요. 그래서 유리 전이는 상전이가 아니라 동역학적 전이예요.',
    ]),
    dict(id='mp-6', title='6주차 · 확산', items=[
      '고체 확산은 빈자리 확산(치환형 원자)과 침입형 확산(C, N, H처럼 작은 원자)으로 일어나요. 침입형이 보통 더 빨라요.',
      'Fick 1법칙 `J = −D(dC/dx)`: 농도 기울기를 따라 흐르는 양이에요.',
      '확산계수는 `D = D₀·exp(−Q_d/RT)`로 온도에 지수적으로 의존해요. ln D 대 1/T 기울기에서 Q_d를 구해요.',
      'Fick 2법칙 `∂C/∂t = D(∂²C/∂x²)`는 질량 보존에서 나와요. 표면 농도가 일정하면 해가 erf 함수로 주어져요(침탄).',
    ]),
   ]),
   dict(id='materials-chem', title='재료화학개론', sub='Introduction to Solid State Chemistry · 1–5장', sections=MC_SECTIONS),
  ]),
 dict(id='german', name='Deutsch', ko='독일어', term='', status='soon', intro='정리 중이에요. 곧 올라와요.', chips=[], sections=[]),
 dict(id='calculus', name='Calculus', ko='대학수학', term='2026', status='notes',
  intro='1학기에는 지수·로그·역삼각·쌍곡선 함수를 미적분하고, 여러 적분기법과 그 응용을 배웠어요. 2학기에는 행렬로 연립방정식을 풀고, 무한급수가 수렴하는지 판정하고, 극좌표로 곡선과 넓이를 다뤄요. 정리마다 왜 그렇게 되는지와 조건을 같이 적었어요.',
  chips=['1학기 5–7장', '초월함수 · 적분기법 · 적분의 응용', '2학기 9–11장', '행렬 · 무한급수 · 극좌표'], graph='./input-graph-math.html',
  groups=[
   dict(id='calc-1', title='1학기', sub='5장 초월함수 · 6장 적분기법 · 7장 적분의 응용', sections=MATH1_SECTIONS),
   dict(id='calc-2', title='2학기', sub='9장 행렬과 응용 · 10장 무한급수 · 11장 극좌표', sections=MATH_SECTIONS),
  ]),
]

def render_fig(f):
    kind, key, cap = f
    if kind == 'lab':
        return f'<figure class="mathlab" data-lab="{key}"><div class="xtal-stage"></div><figcaption>{inline(cap)}</figcaption></figure>'
    if kind == '3d':
        return f'<figure class="xtal" data-xtal="{key}"><div class="xtal-stage"></div><figcaption>{inline(cap)}</figcaption></figure>'
    return f'<figure class="note-fig">{FIGS[key]()}<figcaption>{inline(cap)}</figcaption></figure>'

def render_table(rows):
    head = ''.join(f'<th scope="col">{inline(c)}</th>' for c in rows[0])
    body = ''.join('<tr>' + ''.join((f'<th scope="row">{inline(c)}</th>' if j == 0 else f'<td>{inline(c)}</td>') for j, c in enumerate(r)) + '</tr>' for r in rows[1:])
    return f'<div class="note-table"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'

def render_block(b, level):
    out = []
    if b.get('h'):
        bid = f' id="{b["id"]}"' if b.get('id') else ''
        out.append(f'<h{level + 1} class="block-title"{bid}>{inline(b["h"])}</h{level + 1}>')
    out += [f'<p class="block-p">{inline(p)}</p>' for p in b.get('p', [])]
    if b.get('items'):
        out.append('<ul>' + ''.join(f'<li>{inline(i)}</li>' for i in b['items']) + '</ul>')
    if b.get('table'):
        out.append(render_table(b['table']))
    figs = b.get('figs', [])
    three = [f for f in figs if f[0] == '3d']
    flat = [f for f in figs if f[0] != '3d']
    out += [render_fig(f) for f in flat]
    if three:
        out.append(f'<div class="xtal-grid{" is-single" if len(three) == 1 else ""}">' + ''.join(render_fig(f) for f in three) + '</div>')
    if b.get('code'):
        out.append(f'<pre><code>{html.escape(b["code"], quote=False)}</code></pre>')
    return ''.join(out)

def render_sections(sections, level=3):
    out = []
    for s in sections:
        sid = f' id="{s["id"]}"' if s.get('id') else ''
        out.append(f'<section class="note-chapter"{sid}><h{level}>{inline(s["title"])}</h{level}>')
        out += [render_block(b, level) for b in (s.get('blocks') or [s])]
        out.append('</section>')
    return ''.join(out)

def render_subject(i, s):
    num = f'{i+1:02d}'
    head = f'<p class="note-eyebrow">{num} / {s["name"].upper()}{" · " + s["term"] if s["term"] else ""}</p><h2 id="{s['id']}-title">{inline(s["ko"])}</h2><p class="note-intro">{inline(s["intro"])}</p>'
    if s['chips']:
        head += '<ul class="note-chips">' + ''.join(f'<li>{inline(c)}</li>' for c in s['chips']) + '</ul>'
    if s.get('graph'):
        head += f'<a class="note-graph" href="{s["graph"]}">지식 그래프로 보기 ↗</a>'
    body = ''
    if s['status'] == 'soon':
        body = '<p class="note-soon">NOT UPDATED YET</p>'
    elif s.get('groups'):
        body += '<nav class="course-jump" aria-label="과목 안 바로가기">' + ''.join(f'<a href="#{g["id"]}">{inline(g["title"])}</a>' for g in s['groups']) + '</nav>'
        for g in s['groups']:
            body += f'<section class="note-course" id="{g["id"]}"><h3 class="course-title">{inline(g["title"])}{" <small>" + inline(g["sub"]) + "</small>" if g["sub"] else ""}</h3>'
            body += '<p class="note-soon">NOT UPDATED YET</p>' if g.get('soon') else render_sections(g['sections'], 4)
            body += '</section>'
    else:
        body = render_sections(s['sections'])
    return f'<article class="note" id="{s["id"]}" aria-labelledby="{s["id"]}-title">{head}{body}</article>'

def render_rows():
    rows = []
    for i, s in enumerate(SUBJECTS):
        state = s['term'] if s['status'] == 'notes' else 'SOON'
        rows.append(f'<a class="subject-row{" is-soon" if s["status"] == "soon" else ""}" href="#{s["id"]}" data-subject="{s["id"]}"><span class="row-num">{i+1:02d}</span><span class="row-name">{s["name"]}</span><span class="row-ko">{"" if s["ko"].startswith(s["name"]) else inline(s["ko"])}</span><span class="row-state">{state}</span></a>')
    return ''.join(rows)

PAGE = '''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="description" content="Input: 학교에서 공부한 것들을 과목별로 정리한 노트."><title>Input · dandellas</title><link rel="icon" href="./assets/seed.svg"><link rel="stylesheet" href="./fonts.css"><link rel="stylesheet" href="./input.css"><script src="./input.js" defer></script><script src="./crystal-viewer.js" defer></script><script src="./math-labs.js" defer></script></head>
<body class="input-page"><a class="skip" href="#notes">Skip to notes</a>
<header class="site-header"><a class="site-name" href="./input.html">Input</a><span class="header-center">Study notes</span><nav class="desktop-nav" aria-label="바로가기"><a href="./index.html">home</a><a href="./dandelion.html">dandelion</a><a href="./untitled.html">untitled</a></nav><button type="button" id="menu-toggle" aria-expanded="false" aria-controls="mobile-menu">Menu</button></header>
<nav id="mobile-menu" aria-label="모바일 바로가기" hidden><a href="./index.html">home</a><a href="./dandelion.html">dandelion</a><a href="./untitled.html">untitled</a></nav>
<div class="input-shell">
<aside class="subject-index" aria-labelledby="subjects-label"><h1 id="subjects-label">SUBJECTS / %(count)02d</h1><nav class="subject-list" aria-label="과목">%(rows)s</nav><p class="index-note">수업을 들으며 정리한 개념 노트예요. 시험 문제와 수업 자료 원문은 싣지 않아요.</p></aside>
<main id="notes" class="notes" tabindex="-1">%(articles)s</main>
</div>
</body></html>
'''

repo = sys.argv[1]
page = PAGE % dict(count=len(SUBJECTS), rows=render_rows(), articles=''.join(render_subject(i, s) for i, s in enumerate(SUBJECTS)))
open(f'{repo}/input.html', 'w', encoding='utf-8').write(page)
print('ok', len(page))
