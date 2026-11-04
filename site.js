(() => {
  const video = document.querySelector('#intro-video');
  const videoButton = document.querySelector('.video-toggle');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateVideoButton = (playing) => {
    if (!videoButton) return;
    videoButton.innerHTML = playing ? '배경 영상 일시정지 <span aria-hidden="true">Ⅱ</span>' : '배경 영상 재생 <span aria-hidden="true">▷</span>';
    video?.closest('.video-frame').classList.toggle('is-playing', playing);
  };
  if (video && videoButton) {
    videoButton.addEventListener('click', async () => {
      if (!video.paused) { video.pause(); return; }
      try {
        await video.play();
        document.querySelector('.video-status').textContent = '';
      } catch {
        document.querySelector('.video-status').textContent = '영상을 재생하지 못했어요. 다른 메뉴는 계속 이용할 수 있어요.';
        updateVideoButton(false);
      }
    });
    video.addEventListener('play', () => updateVideoButton(true));
    video.addEventListener('pause', () => updateVideoButton(false));
    motion.addEventListener('change', () => { if (motion.matches) video.pause(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  }

  const map = document.querySelector('#research-map');
  if (!map) return;
  const list = document.querySelector('#research-list');
  const detail = document.querySelector('#project-detail');
  const announce = document.querySelector('#map-announcement');
  const viewButtons = [...document.querySelectorAll('[data-view]')];
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const selectButtons = [...document.querySelectorAll('[data-select]')];
  let view = 'map';
  let filter = 'all';
  let selection = null;

  const details = {
    research: { eyebrow: '01 / RESEARCH', title: '연구', copy: '두 프로젝트를 이 갈래에 임시로 놓았어요. 이 배치는 확정된 분류나 프로젝트 사이의 검증된 관계를 뜻하지 않아요.', extra: '2개 프로젝트 · 임시 분류', branch: 'research' },
    projects: { eyebrow: '02 / PROJECTS', title: '프로젝트', copy: 'Financial GraphRAG를 이 갈래에 임시로 놓았어요. 이 배치는 확정된 분류를 뜻하지 않아요.', extra: '1개 프로젝트 · 임시 분류', branch: 'projects' },
    graphrag: { eyebrow: 'PROJECT / 001', title: 'mechanism aware graphRAG', copy: '확인된 프로젝트 이름으로 페이지를 연결했어요. 아래 링크에서 프로젝트를 살펴볼 수 있어요.', extra: '연구에 임시 배치 · 분류 미확정', branch: 'research', href: './project-graphrag.html' },
    lattice: { eyebrow: 'PROJECT / 002', title: '개인의 경험을 집합으로 구조화하고 그 관계를 활용해 생성하면, 그 사람에게 의미 있으면서도 예상 밖인 아이디어를 얻을 수 있는가?', copy: '확인된 질문을 제목으로 프로젝트 페이지를 연결했어요. 이 질문의 답이나 결과를 지도에서 단정하지 않아요.', extra: '연구에 임시 배치 · 분류 미확정', branch: 'research', href: './project-lattice.html' },
    financial: { eyebrow: 'PROJECT / 003', title: 'Financial GraphRAG', copy: '확인된 프로젝트 이름으로 페이지를 연결했어요. 아래 링크에서 프로젝트를 살펴볼 수 있어요.', extra: '프로젝트에 임시 배치 · 분류 미확정', branch: 'projects', href: './project-financial.html' },
    initial: { eyebrow: 'EXPLORE THE MAP', title: '세 프로젝트를 살펴보는 지도.', copy: '확인된 이름과 제목으로 세 프로젝트 페이지를 연결했어요. 분류와 배치는 아직 초안이에요.', extra: '3개 프로젝트 · 임시 분류' }
  };

  function showDetail(key, moveFocus = false) {
    selection = key === 'initial' ? null : key;
    const item = details[key];
    detail.dataset.selection = key;
    document.querySelector('#detail-eyebrow').textContent = item.eyebrow;
    document.querySelector('#detail-title').textContent = item.title;
    document.querySelector('#detail-copy').textContent = item.copy;
    document.querySelector('#detail-extra .draft-chip').textContent = item.extra;
    const link = document.querySelector('#detail-link');
    link.hidden = !item.href;
    if (item.href) link.href = item.href;
    selectButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.select === selection)));
    if (moveFocus) detail.focus({ preventScroll: true });
    if (moveFocus && window.matchMedia('(max-width: 1000px)').matches) detail.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
    announce.textContent = item.title + '. ' + item.copy;
  }

  function updateVisibility() {
    map.dataset.filter = filter;
    map.hidden = view !== 'map';
    list.hidden = view !== 'list';
    viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    document.querySelectorAll('[data-branch]').forEach(element => {
      const hide = filter !== 'all' && element.dataset.branch !== filter;
      element.classList.toggle('is-filtered', hide);
      if (element instanceof HTMLElement) element.hidden = hide;
      else element.style.display = hide ? 'none' : '';
    });
    const label = filter === 'all' ? '전체' : filter === 'research' ? '연구' : '프로젝트';
    const count = Object.values(details).filter(item => item.href && (filter === 'all' || item.branch === filter)).length;
    announce.textContent = label + ' 분류, ' + (view === 'map' ? '지도' : '목록') + ' 보기. 프로젝트 ' + count + '개가 있습니다. 분류와 연결선은 임시 제안입니다.';
  }

  viewButtons.forEach(button => button.addEventListener('click', () => { view = button.dataset.view; updateVisibility(); }));
  filterButtons.forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    if (filter !== 'all' && (!selection || details[selection].branch !== filter)) showDetail(filter);
    else if (filter === 'all' && (selection === 'research' || selection === 'projects')) showDetail('initial');
    updateVisibility();
  }));
  selectButtons.forEach(button => button.addEventListener('click', () => showDetail(button.dataset.select, true)));
})();
