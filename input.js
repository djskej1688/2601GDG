/* Input: show one subject at a time (by URL hash) and run the mobile menu. Without JS every subject stays visible. */
(() => {
  'use strict';
  const notes = [...document.querySelectorAll('.note')];
  const rows = [...document.querySelectorAll('[data-subject]')];
  if (!notes.length) return;
  document.documentElement.classList.add('js-ready');
  const first = notes.find(n => !n.querySelector('.note-soon') || n.querySelector('.note-chapter')) || notes[0];
  function show(id, focus) {
    const inner = id && !notes.some(n => n.id === id) ? document.getElementById(id) : null;
    const target = notes.find(n => n.id === id) || inner?.closest('.note') || first;
    notes.forEach(n => { n.hidden = n !== target; });
    rows.forEach(r => { if (r.dataset.subject === target.id) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current'); });
    document.title = `${target.querySelector('h2').textContent} · Input · dandellas`;
    if (inner && target.contains(inner)) { requestAnimationFrame(() => inner.scrollIntoView({ block: 'start' })); return; }
    if (focus) {
      const main = document.querySelector('#notes');
      main.focus({ preventScroll: true });
      if (matchMedia('(max-width: 760px)').matches) main.scrollIntoView({ block: 'start' });
      else window.scrollTo({ top: 0 });
    }
  }
  addEventListener('hashchange', () => show(location.hash.slice(1), true));
  show(location.hash.slice(1), false);

  const menuButton = document.querySelector('#menu-toggle'), menu = document.querySelector('#mobile-menu');
  const close = () => { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.textContent = 'Menu'; };
  menuButton.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.textContent = open ? 'Close' : 'Menu'; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { close(); menuButton.focus(); } });
})();
