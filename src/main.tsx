// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/cmt-theme.css';
import { ontbrekendeConfig, toonConfigFout } from './lib/configCheck';

const root = document.getElementById('root')!;
const ontbrekend = ontbrekendeConfig();

if (ontbrekend.length > 0) {
  // App.tsx bewust niet importeren: dat trekt lib/firebase.ts mee, dat zonder
  // geldige config al bij het importeren gooit en zo een wit scherm oplevert.
  toonConfigFout(ontbrekend, root);
} else {
  import('./App.tsx').then(({ default: App }) => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
}
