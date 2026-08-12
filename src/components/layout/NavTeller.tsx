// src/components/layout/NavTeller.tsx
//
// Het rode bolletje met een aantal, zoals je het op een app-icoon verwacht.
// Boven de negen tonen we "9+", anders wordt het bolletje breder dan het icoon.

import React from 'react';

interface NavTellerProps {
  aantal: number;
  /** Zweeft rechtsboven op het icoon in plaats van in de tekstregel te staan. */
  zwevend?: boolean;
}

const NavTeller: React.FC<NavTellerProps> = ({ aantal, zwevend = false }) => {
  if (aantal <= 0) return null;

  return (
    <span
      className={zwevend ? 'cmt-teller cmt-teller-zwevend' : 'cmt-teller'}
      aria-label={`${aantal} ongelezen ${aantal === 1 ? 'bericht' : 'berichten'}`}
    >
      {aantal > 9 ? '9+' : aantal}
    </span>
  );
};

export default NavTeller;
