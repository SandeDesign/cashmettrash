// src/components/chat/BerichtTekst.tsx
//
// Toont de tekst van een bericht en maakt adressen erin aanklikbaar. Zonder dit
// bleef een geplakte link gewoon platte tekst, wat vooral bij een Tikkie
// vervelend is.

import React from 'react';
import { LINK_PATROON, normaliseerLink } from '../../utils/links';

interface BerichtTekstProps {
  tekst: string;
}

const BerichtTekst: React.FC<BerichtTekstProps> = ({ tekst }) => {
  // split() met een groep in het patroon geeft afwisselend tekst en treffer.
  const stukken = tekst.split(LINK_PATROON);

  return (
    <>
      {stukken.map((stuk, i) => {
        const href = i % 2 === 1 ? normaliseerLink(stuk) : null;
        if (!href) return <React.Fragment key={i}>{stuk}</React.Fragment>;

        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all"
            style={{ color: 'inherit' }}
          >
            {stuk}
          </a>
        );
      })}
    </>
  );
};

export default BerichtTekst;
