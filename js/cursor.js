
import { state, addTask, schedule, lerp } from './core.js';

export function initCursor() {
  if (!state.fine) return;                      // touch

  const root = document.documentElement;
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<div class="c-dot"></div><div class="c-ring"><div class="c-box"></div><div class="c-label"></div></div>';
  const preview = document.createElement('div');
  preview.className = 'preview';
  preview.setAttribute('aria-hidden', 'true');
  preview.innerHTML = '<div class="pv-art"></div><div class="pv-cap"><span data-pv-label></span><span>↗</span></div>';
  document.body.append(cursor, preview);
  root.classList.add('has-cursor');

  const dot = cursor.querySelector('.c-dot');
  const ring = cursor.querySelector('.c-ring');
  const label = cursor.querySelector('.c-label');
  const pvLabel = preview.querySelector('[data-pv-label]');

  let rx = 0, ry = 0, px = 0, py = 0, seen = false;
  const k = state.reduced ? 1 : .2;

  addTask(() => {
    if (state.mx < -999) { cursor.classList.remove('is-on'); preview.classList.remove('is-on'); return false; }
    if (!seen) { rx = px = state.mx; ry = py = state.my; seen = true; }
    cursor.classList.add('is-on');
    rx = lerp(rx, state.mx, k); ry = lerp(ry, state.my, k);
    dot.style.transform = `translate3d(${state.mx}px,${state.my}px,0)`;
    ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;

    // preview panel sits beside the cursor and flips at screen edges
    const pw = 202, ph = 270, off = 28;
    const tx = state.mx + off + pw > state.vw ? state.mx - off - pw : state.mx + off;
    const ty = state.my + off + ph > state.vh ? state.my - off - ph : state.my + off;
    px = lerp(px, tx, state.reduced ? 1 : .13); py = lerp(py, ty, state.reduced ? 1 : .13);
    preview.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0)`;

    return Math.abs(rx - state.mx) > .1 || Math.abs(ry - state.my) > .1 ||
           Math.abs(px - tx) > .1 || Math.abs(py - ty) > .1;
  });

  // one delegated listener instead of one per element
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
    const t = e.target.closest?.('[data-cursor]');
    if (!t) { cursor.removeAttribute('data-mode'); preview.classList.remove('is-on'); return; }
    const mode = t.dataset.cursor;
    cursor.dataset.mode = mode;
    label.textContent = mode === 'cta' ? (t.dataset.label || '') : '';
    if (mode === 'preview') {
      preview.dataset.pattern = t.dataset.pattern || 'grid';
      pvLabel.textContent = t.dataset.label || '';
      preview.classList.add('is-on');
    } else preview.classList.remove('is-on');
    schedule();
  });

  document.addEventListener('pointerdown', () => cursor.setAttribute('data-down', ''));
  document.addEventListener('pointerup', () => cursor.removeAttribute('data-down'));
}
