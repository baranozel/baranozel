/* main.js — entry point. Each module owns one concern. */
import { initChrome } from './chrome.js';
import { initHero } from './hero.js';
import { initCursor } from './cursor.js';
import { initSections } from './sections.js';
import { initViewer } from './viewer.js';

const safe = (fn) => { try { fn(); } catch (err) { console.error(err); } };

safe(initChrome);
safe(initCursor);
safe(initSections);
safe(initViewer);
// if the hero fails, reveal everything instead of leaving it hidden
try { initHero(); } catch (err) { console.error(err); document.documentElement.classList.add('is-ready'); }
