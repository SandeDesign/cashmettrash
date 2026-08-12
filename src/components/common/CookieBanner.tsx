// src/components/common/CookieBanner.tsx
//
// Informatief, geen keuzemenu: de app slaat uitsluitend noodzakelijke dingen op
// en daarvoor is wettelijk geen toestemming nodig. Er valt dus niets te weigeren,
// en een nepkeuze voorspiegelen zou misleidend zijn.

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cookie } from 'lucide-react';

const SLEUTEL = 'cmt_cookie_gezien';

/** Op deze pagina's staat het verhaal al, daar is de melding overbodig. */
const VERBERGEN_OP = ['/cookies', '/privacy'];

const CookieBanner: React.FC = () => {
  const { pathname } = useLocation();
  const [tonen, setTonen] = useState(false);

  useEffect(() => {
    try {
      setTonen(localStorage.getItem(SLEUTEL) !== 'ja');
    } catch {
      // Blokkeert de browser localStorage, dan tonen we de melding niet: we
      // zouden hem toch niet kunnen onthouden en hij zou blijven terugkomen.
      setTonen(false);
    }
  }, []);

  const sluiten = () => {
    try {
      localStorage.setItem(SLEUTEL, 'ja');
    } catch {
      // Niets aan te doen; de melding verdwijnt in elk geval voor deze sessie.
    }
    setTonen(false);
  };

  if (!tonen || VERBERGEN_OP.includes(pathname)) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 safe-area-bottom"
      role="region"
      aria-label="Mededeling over cookies"
    >
      <div
        className="cmt-card cmt-animate-in max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ boxShadow: 'var(--cmt-shadow-lift)' }}
      >
        <Cookie className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--cmt-glas)' }} />

        <p className="flex-1 text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
          Wij bewaren alleen wat nodig is om de app te laten werken, zoals dat je ingelogd
          blijft. Geen reclame, geen meekijken.{' '}
          <Link to="/cookies" className="font-semibold" style={{ color: 'var(--cmt-glas-dark)' }}>
            Lees hoe het zit
          </Link>
          .
        </p>

        <button className="cmt-btn-primary flex-shrink-0" onClick={sluiten}>
          Begrepen
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
