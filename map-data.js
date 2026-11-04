/* Research map content for map.js (dandelion-map.html). */
(() => {
  'use strict';
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

  window.GRAPH_DATA = {
    nodes: NODES, edges: EDGES, note: NOTE, kinds: KIND, bilingual: true,
    linkLabel: T('프로젝트 페이지 열기', 'Open project page')
  };
})();
