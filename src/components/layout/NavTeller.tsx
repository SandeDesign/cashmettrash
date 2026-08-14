// src/components/layout/NavTeller.tsx
//
// Het rode bolletje met een aantal, zoals je het op een app-icoon verwacht.
// Boven de negen tonen we "9+", anders wordt het bolletje breder dan het icoon.

import React from 'react';
import type { TellerSleutel } from '../../hooks/useMenuTellers';

interface NavTellerProps {
  aantal: number;
  /** Zweeft rechtsboven op het icoon in plaats van in de tekstregel te staan. */
  zwevend?: boolean;
  /** Waar dit bolletje over gaat, alleen voor de voorleeshulp. */
  soort?: TellerSleutel;
}

/** Wat een schermlezer voorleest. Enkelvoud en meervoud, want dat hoor je. */
function omschrijf(aantal: number, soort: TellerSleutel): string {
  const een = aantal === 1;
  switch (soort) {
    case 'chat':
      return `${aantal} ongelezen ${een ? 'bericht' : 'berichten'}`;
    case 'nieuw':
      return `${aantal} nieuwe ${een ? 'aanvraag' : 'aanvragen'}`;
    case 'ronde':
      return `${aantal} ${een ? 'adres' : 'adressen'} op de ronde`;
    case 'meerijden':
      return `${aantal} ${een ? 'rit' : 'ritten'} waar je mee moet`;
    case 'afrekenen':
      return `${aantal} ${een ? 'melding' : 'meldingen'} om af te rekenen`;
    case 'ideeen':
      return `${aantal} nieuwe ${een ? 'idee' : 'ideeën'}`;
    case 'scannen':
      return `${aantal} ${een ? 'zak' : 'zakken'} om in te scannen`;
    case 'contant':
      return `${aantal} keer contant geld om af te vinken`;
  }
}

const NavTeller: React.FC<NavTellerProps> = ({ aantal, zwevend = false, soort = 'chat' }) => {
  if (aantal <= 0) return null;

  return (
    <span
      className={zwevend ? 'cmt-teller cmt-teller-zwevend' : 'cmt-teller'}
      aria-label={omschrijf(aantal, soort)}
    >
      {aantal > 9 ? '9+' : aantal}
    </span>
  );
};

export default NavTeller;
