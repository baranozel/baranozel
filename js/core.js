

export const state = {
  mx: -9999, my: -9999,        // pointer, px
  nx: 0, ny: 0,                // pointer, -1..1
  sy: 0,                       // scrollY
  vw: innerWidth, vh: innerHeight,
  fine: matchMedia('(hover: hover) and (pointer: fine)').matches,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
};

const tasks = [];
const resizeHooks = [];
let raf = 0;

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const addTask = (fn) => tasks.push(fn);
export const onResize = (fn) => resizeHooks.push(fn);

export function schedule() {
  if (!raf) raf = requestAnimationFrame(tick);
}
function tick() {
  raf = 0;
  let again = false;
  for (const fn of tasks) if (fn()) again = true;
  if (again) schedule();
}

addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  state.mx = e.clientX; state.my = e.clientY;
  state.nx = (e.clientX / state.vw) * 2 - 1;
  state.ny = (e.clientY / state.vh) * 2 - 1;
  schedule();
}, { passive: true });

document.documentElement.addEventListener('pointerleave', () => {
  state.mx = state.my = -9999; state.nx = state.ny = 0; schedule();
});

addEventListener('scroll', () => { state.sy = scrollY; schedule(); }, { passive: true });

let resizeQueued = false;
addEventListener('resize', () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
    resizeQueued = false;
    state.vw = innerWidth; state.vh = innerHeight;
    resizeHooks.forEach((fn) => fn());
    schedule();
  });
});

state.sy = scrollY;
