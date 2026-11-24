
import { state, addTask, schedule, clamp, onResize } from './core.js';

export function initSections() {

  const risers = document.querySelectorAll('[data-rise]');
  if (state.reduced) {
    risers.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    risers.forEach((el) => io.observe(el));
  }


  if (!state.reduced) {
    const items = [...document.querySelectorAll('[data-shift]')].map((el) => ({
      el, k: parseFloat(el.dataset.shift), cy: 0, vis: false, last: null,
    }));
    const measure = () => items.forEach((o) => {
      const r = o.el.getBoundingClientRect();
      o.cy = r.top + scrollY + r.height / 2;
    });
    measure();
    onResize(measure);
    addEventListener('load', measure);
    document.fonts?.ready.then(measure);
    const vis = new IntersectionObserver((entries) => {
      entries.forEach((e) => { items.find((o) => o.el === e.target).vis = e.isIntersecting; });
      schedule();
    }, { rootMargin: '10% 0px' });
    items.forEach((o) => vis.observe(o.el));
    const wide = matchMedia('(min-width: 900px)');
    wide.addEventListener('change', () => {
      if (!wide.matches) items.forEach((o) => { o.el.style.transform = ''; o.last = null; });
      schedule();
    });

    addTask(() => {
      if (!wide.matches) return false;
      const mid = state.sy + state.vh / 2;
      const lim = state.vw * 0.22;
      for (const o of items) {
        if (!o.vis) continue;
        const x = clamp((o.cy - mid) * o.k, -lim, lim);
        if (o.last === null || Math.abs(x - o.last) > 0.4) {
          o.el.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
          o.last = x;
        }
      }
      return false;
    });
    schedule();
  }

  const list = document.querySelector('[data-proj-list]');
  const pv = document.querySelector('[data-pv]');
  if (list && pv) {
    const label = pv.querySelector('[data-pv-label]');
    const projs = [...list.querySelectorAll('.proj')];
    const set = (i) => {
      pv.style.setProperty('--i', i);
      label.textContent = projs[i].dataset.label;
    };
    projs.forEach((p, i) => {
      p.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') set(i); });
      p.addEventListener('focusin', () => set(i));
    });
    set(0);
  }

  const links = [...document.querySelectorAll('[data-nav] a')];
  const readout = document.querySelector('[data-section-readout]');
  const marks = [...document.querySelectorAll('[data-section]')];
  const now = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = '#' + e.target.id;
      links.forEach((a) => (a.getAttribute('href') === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
      if (readout) readout.textContent = '/ ' + e.target.dataset.section;
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  marks.forEach((m) => now.observe(m));
  const hero = document.querySelector('[data-hero]');
  if (hero) new IntersectionObserver(([e]) => {
    if (e.isIntersecting && e.intersectionRatio > 0.5) {
      links.forEach((a) => a.removeAttribute('aria-current'));
      if (readout) readout.textContent = '';
    }
  }, { threshold: [0.5] }).observe(hero);
}
