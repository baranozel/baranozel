import { state, addTask, schedule, onResize } from './core.js';

const pad = (n, l = 4) => String(Math.max(0, Math.round(n))).padStart(l, '0');

export function initChrome() {
  const root = document.documentElement;

  const btn = document.querySelector('[data-menu-btn]');
  const nav = document.querySelector('[data-nav]');
  const lbl = document.querySelector('[data-menu-label]');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    lbl.textContent = open ? 'Kapat' : 'Menü';
  };
  btn?.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  nav?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* grid overlay: button + G key */
  const gridBtn = document.querySelector('[data-grid-btn]');
  const setGrid = (on) => {
    root.classList.toggle('show-grid', on);
    if (gridBtn) { gridBtn.textContent = `IZGARA: ${on ? 'AÇIK' : 'KAPALI'} [G]`; gridBtn.setAttribute('aria-pressed', String(on)); }
  };
  gridBtn?.addEventListener('click', () => setGrid(!root.classList.contains('show-grid')));
  addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey && !/input|textarea/i.test(e.target.tagName)) {
      setGrid(!root.classList.contains('show-grid'));
    }
  });

  /* clock (textContent only, once a second, paused in background tabs) */
  const clock = document.querySelector('[data-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const tick = () => { if (!document.hidden) clock.textContent = fmt.format(new Date()); };
    tick(); setInterval(tick, 1000);
  }

  /* scroll % + cursor coordinates, written only when the value changes */
  const scrollEl = document.querySelector('[data-scroll-readout]');
  const xEl = document.querySelector('[data-x]');
  const yEl = document.querySelector('[data-y]');
  let maxScroll = 1, lastS = '', lastX = '', lastY = '';
  const measure = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - state.vh); };
  measure(); onResize(measure); addEventListener('load', measure);

  addTask(() => {
    if (scrollEl) {
      const s = pad((state.sy / maxScroll) * 100, 3) + '%';
      if (s !== lastS) { scrollEl.textContent = s; lastS = s; }
    }
    if (state.fine && xEl && state.mx > -999) {
      const x = pad(state.mx), y = pad(state.my);
      if (x !== lastX) { xEl.textContent = x; lastX = x; }
      if (y !== lastY) { yEl.textContent = y; lastY = y; }
    }
    return false;
  });
  schedule();
}
