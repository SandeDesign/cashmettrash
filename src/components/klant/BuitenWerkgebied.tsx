// src/components/klant/BuitenWerkgebied.tsx
//
// Jayce rijdt op zijn skelter, dus zijn ronde blijft in de buurt. Woon je
// daarbuiten, dan kun je niets aanvragen. Bekenden vormen de uitzondering; die
// zet de beheerder handmatig aan.

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { formatAfstand } from '../../utils/werkgebied';

interface BuitenWerkgebiedProps {
  postcode: string;
  plaats: string;
  /** Hoe ver het adres van de ronde ligt, als we dat konden uitrekenen. */
  afstand?: number;
}

const BuitenWerkgebied: React.FC<BuitenWerkgebiedProps> = ({ postcode, plaats, afstand }) => (
  <div className="cmt-card cmt-animate-in text-center">
    <span className="cmt-empty-state-icon">
      <MapPin className="w-6 h-6" />
    </span>
    <h1 className="text-xl font-bold mb-2">Dit adres ligt buiten de ronde</h1>
    <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
      Jayce haalt op met de skelter en blijft daarom in de eigen buurt. {postcode} {plaats}
      &nbsp;ligt daar
      {afstand ? ` ongeveer ${formatAfstand(afstand)} vandaan` : ' net buiten'}, dus we kunnen
      hier voorlopig niet komen. Klopt je adres niet? Pas het dan aan bij je gegevens.
    </p>
    <div className="flex flex-col sm:flex-row sm:justify-center gap-2">
      <Link to="/profiel" className="cmt-btn-secondary">
        Mijn gegevens
      </Link>
      <Link to="/chat" className="cmt-btn-ghost">
        Stuur een bericht
      </Link>
    </div>
  </div>
);

export default BuitenWerkgebied;
