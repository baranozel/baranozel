
import { state, addTask, schedule, clamp, lerp, onResize } from './core.js';

const rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function initHero() {
  const hero = document.querySelector('[data-hero]');
  const headline = hero?.querySelector('[data-headline]');
  if (!hero || !headline) return;

  const root = document.documentElement;
  const heroBody = hero.querySelector('[data-hero-body]');

  /* ---- 1. split headline into characters ------------------------------ */
  const lines = [...headline.querySelectorAll('[data-line]')].map((el) => ({
    el, k: parseFloat(el.dataset.line), sx: 0,
  }));
  const chars = [];
  let n = 0;
  lines.forEach((line) => {
    line.el.querySelectorAll('[data-split]').forEach((w) => {
      const text = w.textContent.trim();
      w.textContent = '';
      w.setAttribute('aria-hidden', 'true');
      for (const ch of text) {
        const s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch === ' ' ? ' ' : ch;
        if (!state.reduced) {
          // chaos: each letter starts scattered, then snaps onto the grid
          s.style.setProperty('--ix', ((rand(n) - .5) * 36).toFixed(1) + 'vw');
          s.style.setProperty('--iy', ((rand(n + 50) - .5) * 60).toFixed(1) + 'vh');
          s.style.setProperty('--ir', ((rand(n + 99) - .5) * 140).toFixed(0) + 'deg');
          s.style.setProperty('--d', (n * 0.03 + rand(n + 7) * 0.15).toFixed(2) + 's');
        }
        w.appendChild(s);
        chars.push({ el: s, line, cx: 0, cy: 0, x: 0, y: 0, k: 0, t: '' });
        n++;
      }
    });
  });

  // reveal on the next frame so the scattered state is painted first
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));

  /* ---- 2. visibility: do no work when the hero is off-screen ------------ */
  let heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; if (heroVisible) schedule(); })
    .observe(hero);

  /* ---- 3. measure (layout reads happen here only, never per frame) ------ */
  let hx = 0, hy = 0, R = 200;
  const measure = () => {
    const r = headline.getBoundingClientRect();
    hx = r.left; hy = r.top + scrollY;
    R = Math.max(170, state.vw * 0.14);
    chars.forEach((c) => {
      c.cx = c.el.offsetLeft + c.el.offsetWidth / 2;   // offset* ignores transforms
      c.cy = c.el.offsetTop + c.el.offsetHeight / 2;
    });
  };
  measure();
  onResize(measure);
  document.fonts?.ready.then(measure);

  /* ---- 4. letters lean away from the cursor ---------------------------- */
  const reactChars = () => {
    if (!state.fine || state.reduced || !heroVisible) return false;
    const px = state.mx - hx;
    const py = state.my - (hy - state.sy);
    let moving = false;
    for (const c of chars) {
      let tx = 0, ty = 0, tk = 0;
      const dx = c.cx + c.line.sx - px;
      const dy = c.cy - py;
      const d = Math.hypot(dx, dy);
      if (d < R && d > 0.01) {
        const f = (1 - d / R) ** 2;
        tx = (dx / d) * f * 30;
        ty = (dy / d) * f * 30;
        tk = -(dx / d) * f * 9;
      }
      c.x = lerp(c.x, tx, .14); c.y = lerp(c.y, ty, .14); c.k = lerp(c.k, tk, .14);
      if (Math.abs(c.x - tx) > .05 || Math.abs(c.y - ty) > .05 || Math.abs(c.k - tk) > .05) moving = true;
      const t = `translate3d(${c.x.toFixed(2)}px,${c.y.toFixed(2)}px,0) skewX(${c.k.toFixed(2)}deg)`;
      if (t !== c.t) { c.el.style.transform = t; c.t = t; }
    }
    return moving;
  };

  /* ---- 5. pointer parallax on decorative elements ----------------------- */
  const deco = [...hero.querySelectorAll('[data-depth]')].map((el) => ({
    el, d: parseFloat(el.dataset.depth), x: 0, y: 0,
  }));
  const parallax = () => {
    if (!state.fine || state.reduced || !heroVisible) return false;
    let moving = false;
    for (const o of deco) {
      const tx = state.nx * o.d, ty = state.ny * o.d;
      o.x = lerp(o.x, tx, .08); o.y = lerp(o.y, ty, .08);
      if (Math.abs(o.x - tx) > .03 || Math.abs(o.y - ty) > .03) moving = true;
      o.el.style.setProperty('--mx', o.x.toFixed(2));
      o.el.style.setProperty('--my', o.y.toFixed(2));
    }
    return moving;
  };

  /* ---- 6. scroll: different elements move at different speeds ---------- */
  const speeds = [...hero.querySelectorAll('[data-speed]')].map((el) => ({ el, s: parseFloat(el.dataset.speed) }));
  let lastY = -1;
  const onScroll = () => {
    if (state.reduced) return false;
    const y = Math.min(state.sy, state.vh * 1.3);       // stop working once the hero is gone
    if (y === lastY) return false;
    lastY = y;
    lines.forEach((l) => { l.sx = l.k * y; l.el.style.setProperty('--sx', l.sx.toFixed(1) + 'px'); });
    speeds.forEach(({ el, s }) => el.style.setProperty('--sy', (y * s).toFixed(1) + 'px'));
    heroBody.style.opacity = (1 - clamp(y / state.vh, 0, 1) * 0.75).toFixed(3);
    return false;
  };

  addTask(reactChars);
  addTask(parallax);
  addTask(onScroll);
  schedule();

  /* ---- 7. marquee in the next section, driven by scroll ----------------- */
  const work = document.querySelector('[data-work]');
  const track = work?.querySelector('[data-marquee]');
  if (work && track && !state.reduced) {
    let top = 0, visible = false;
    const m = () => { top = work.getBoundingClientRect().top + scrollY; };
    m(); onResize(m);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) schedule(); }).observe(work);
    let last = null;
    addTask(() => {
      if (!visible) return false;
      const x = -Math.max(0, state.sy + state.vh - top) * 0.7;
      if (x !== last) { track.style.setProperty('--mx', x.toFixed(1)); last = x; }
      return false;
    });
  }
}
