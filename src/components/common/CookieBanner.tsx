// src/components/common/CookieBanner.tsx
//
// Bewust vrolijk en in gewone taal: de app wordt ook door kinderen gebruikt.
// Inhoudelijk is het een mededeling en geen keuzemenu, want de app slaat alleen
// noodzakelijke dingen op. Daarvoor is wettelijk geen toestemming nodig, en een
// nepkeuze voorspiegelen zou misleidend zijn.

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LOGO_SRC } from '../shared/Logo';

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
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 safe-area-bottom pointer-events-none"
      role="region"
      aria-label="Uitleg over wat de app opslaat"
    >
      <div
        className="cmt-koekje-kaart cmt-animate-in max-w-lg mx-auto pointer-events-auto"
      >
        <div className="flex items-start gap-3">
          <img
            src={LOGO_SRC}
            alt=""
            aria-hidden="true"
            className="cmt-koekje-mascotte w-14 h-14 flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <p className="font-bold text-base mb-1" style={{ color: 'var(--cmt-ink)' }}>
              Hoi! Even iets kleins
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--cmt-ink-soft)' }}>
              Ik onthoud alleen dat jij het bent, zodat je niet steeds opnieuw hoeft in te
              loggen. Verder kijk ik nergens mee en krijg je hier nooit reclame.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 mt-4">
          <Link
            to="/cookies"
            className="cmt-btn-ghost !py-2 !text-sm sm:mr-auto"
            onClick={sluiten}
          >
            Vertel me meer
          </Link>
          <button className="cmt-btn-primary" onClick={sluiten}>
            Oké, snap ik
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
