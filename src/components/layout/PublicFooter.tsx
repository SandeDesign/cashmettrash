// src/components/layout/PublicFooter.tsx
//
// Gedeelde footer voor de landingspagina en de juridische pagina's.

import React from 'react';
import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';
import Logo from '../shared/Logo';
import { BEDRIJF } from '../../utils/bedrijf';

const JURIDISCH = [
  { to: '/voorwaarden', label: 'Algemene voorwaarden' },
  { to: '/privacy', label: 'Privacyverklaring' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/herroeping', label: 'Herroepingsrecht' },
  { to: '/disclaimer', label: 'Disclaimer' },
];

const PublicFooter: React.FC = () => (
  <footer className="cmt-footer safe-area-bottom">
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid sm:grid-cols-3 gap-8">
        <div>
          <Logo size="sm" showText={false} className="mb-3" />
          <p className="font-bold">{BEDRIJF.handelsnaam}</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Glas en statiegeld ophalen in {BEDRIJF.plaats}.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm" aria-label="Snelkoppelingen">
          <p className="font-semibold mb-1">De app</p>
          <Link to="/login">Inloggen</Link>
          <Link to="/registreren">Aanmelden</Link>
          <Link to="/installeren">App installeren</Link>
        </nav>

        <nav className="flex flex-col gap-2 text-sm" aria-label="Juridisch">
          <p className="font-semibold mb-1">Juridisch</p>
          {JURIDISCH.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div
        className="mt-8 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
        style={{ borderTop: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' }}
      >
        <p className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5" />
          Statiegeld is en blijft van jou.
        </p>
        <p>
          {BEDRIJF.rechtspersoon}
          {BEDRIJF.kvk && ` · KvK ${BEDRIJF.kvk}`}
          {BEDRIJF.email && ` · ${BEDRIJF.email}`}
        </p>
      </div>
    </div>
  </footer>
);

export default PublicFooter;
