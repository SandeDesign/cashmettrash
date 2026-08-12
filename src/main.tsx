// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/cmt-theme.css';
import { ontbrekendeConfig, toonConfigFout } from './lib/configCheck';

const root = document.getElementById('root')!;
const ontbrekend = ontbrekendeConfig();

/**
 * Haalt het opstartscherm uit index.html weg. Het blijft minimaal even staan:
 * op een snelle verbinding zou het anders zichtbaar aan- en uitflitsen, wat
 * rommeliger oogt dan helemaal geen opstartscherm.
 */
const MINIMALE_DUUR_MS = 600;
const gestart = performance.now();

function verbergSplash() {
  const splash = document.getElementById('cmt-splash');
  if (!splash) return;

  const wachten = Math.max(0, MINIMALE_DUUR_MS - (performance.now() - gestart));

  window.setTimeout(() => {
    splash.classList.add('cmt-splash-weg');
    splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    // Terugval voor het geval de transitie niet vuurt, bijvoorbeeld bij
    // uitgeschakelde animaties.
    window.setTimeout(() => splash.remove(), 600);
  }, wachten);
}

if (ontbrekend.length > 0) {
  // App.tsx bewust niet importeren: dat trekt lib/firebase.ts mee, dat zonder
  // geldige config al bij het importeren gooit en zo een wit scherm oplevert.
  toonConfigFout(ontbrekend, root);
  verbergSplash();
} else {
  import('./App.tsx').then(({ default: App }) => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    verbergSplash();
  });
}
