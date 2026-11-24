
import { projects } from './projects.js';
import { state, schedule } from './core.js';

const SLOW_MS = 12000;
const CLOSE_MS = 750;
const pad = (n) => String(n).padStart(2, '0');
const validUrl = (u) => {
  try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:'; }
  catch { return false; }
};

export function initViewer() {
  const v = document.querySelector('[data-viewer]');
  if (!v) return;

  const q = (s) => v.querySelector(s);
  const els = {
    idx: q('[data-v-idx]'), title: q('[data-v-title]'), cat: q('[data-v-cat]'),
    host: q('[data-v-host]'), ext: q('[data-v-ext]'), stage: q('[data-v-stage]'),
    state: q('[data-v-state]'), stateT: q('[data-v-state-t]'), stateP: q('[data-v-state-p]'),
    wait: q('[data-v-wait]'), hint: q('[data-v-hint]'), close: q('.vw-close'),
  };
  const root = document.documentElement;
  const background = [...document.querySelectorAll('.site-header, [data-nav], #main, .foot')];

  let frame = null, slowTimer = 0, closeTimer = 0, opener = null, isOpen = false;

  const MESSAGES = {
    loading: ['Site açılıyor…', 'Bağlantı kuruluyor. Birkaç saniye sürebilir.'],
    slow: ['Site henüz açılmadı.', 'Yavaş yükleniyor olabilir ya da başka bir sayfanın içinde gösterilmeye izin vermiyor. Ayrı sekmede açmayı dene.'],
    blank: ['Site burada gösterilemiyor.', 'Çoğu site güvenlik nedeniyle başka bir sayfanın içinde açılmaz. Bu bir hata değil; siteyi ayrı sekmede aç.'],
    manual: ['Site burada açılmıyor mu?', 'Bazı siteler güvenlik nedeniyle başka bir sayfanın içinde gösterilmeyi engeller. Bu bir hata değil. Sağ alttaki düğmeyle siteyi ayrı sekmede açabilirsin.'],
    placeholder: ['Bu projenin adresi henüz eklenmedi.', 'js/projects.js dosyasındaki url alanına canlı adresi yaz.'],
  };
  const setState = (kind) => {
    if (kind === 'loaded' || kind === 'dismissed') { els.state.hidden = true; return; }
    const [t, p] = MESSAGES[kind];
    els.stateT.textContent = t;
    els.stateP.textContent = p;
    els.wait.hidden = kind !== 'slow' && kind !== 'manual';
    els.wait.textContent = kind === 'manual' ? '[ÇERÇEVEYE DÖN]' : '[YİNE DE BEKLE]';
    els.state.dataset.kind = kind;
    els.state.hidden = false;
  };

  const destroyFrame = () => {
    clearTimeout(slowTimer);
    if (frame) { frame.src = 'about:blank'; frame.remove(); frame = null; }
  };
  const createFrame = (p) => {
    frame = document.createElement('iframe');
    frame.className = 'vw-frame';
    frame.title = `${p.title} — canlı site`;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.addEventListener('pointerenter', () => { state.mx = state.my = -9999; schedule(); });
    frame.addEventListener('load', () => {
      clearTimeout(slowTimer);
      try {
        const d = frame.contentDocument;           // only readable for same-origin / empty frames
        if (d && d.URL === 'about:blank' && !(d.body && d.body.children.length)) { setState('blank'); return; }
      } catch { /* cross-origin page loaded: cannot (and need not) inspect */ }
      setState('loaded');
    });
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads');
    frame.src = p.url;
    els.stage.appendChild(frame);
    slowTimer = setTimeout(() => setState('slow'), SLOW_MS);
  };

  const open = (id, from) => {
    const i = projects.findIndex((p) => p.id === id);
    if (i < 0) return;
    const p = projects[i];
    clearTimeout(closeTimer);
    destroyFrame();
    opener = from || null;

    els.idx.textContent = `${pad(i + 1)} / ${pad(projects.length)}`;
    els.title.textContent = p.title;
    els.cat.textContent = p.category;
    const ok = validUrl(p.url);
    if (ok) {
      els.ext.href = p.url;
      els.ext.removeAttribute('aria-disabled');
      els.host.textContent = new URL(p.url).host.toUpperCase();
    } else {
      els.ext.removeAttribute('href');
      els.ext.setAttribute('aria-disabled', 'true');
      els.host.textContent = '[ADRES YOK]';
    }
    els.hint.hidden = !ok;          // nothing to explain when there is no site to embed
    if (ok) { setState('loading'); createFrame(p); } else setState('placeholder');

    root.classList.add('viewer-open');
    background.forEach((e) => { e.inert = true; });
    v.classList.add('is-open');
    v.setAttribute('aria-hidden', 'false');
    isOpen = true;
    els.close.focus({ preventScroll: true });
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    v.classList.remove('is-open');
    v.setAttribute('aria-hidden', 'true');
    root.classList.remove('viewer-open');
    background.forEach((e) => { e.inert = false; });
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    closeTimer = setTimeout(destroyFrame, CLOSE_MS);   // after the close animation
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('[data-project]');
    if (btn) { open(btn.dataset.project, btn); return; }
    if (e.target.closest?.('[data-viewer-close]')) close();
  });
  els.wait.addEventListener('click', () => setState('dismissed'));
  els.hint.addEventListener('click', () => setState('manual'));
  els.ext.addEventListener('click', (e) => { if (els.ext.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) close(); });
}
