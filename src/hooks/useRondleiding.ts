// src/hooks/useRondleiding.ts
//
// Regelt of de rondleiding open staat. De eerste keer dat iemand inlogt gaat hij
// vanzelf open; daarna alleen nog met het vraagteken in de header. Dat we hem al
// hebben laten zien onthouden we per rol op het apparaat zelf, want het is geen
// gegeven dat in Firestore thuishoort.

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { RONDLEIDINGEN, RONDLEIDING_TITEL } from '../components/uitleg/rondleidingStappen';
import type { RondleidingStap } from '../components/uitleg/rondleidingStappen';

// Het versienummer hoort bij de inhoud van de rondleiding. Komen er stappen bij
// die iemand echt moet weten, dan verhoog je dit en gaat de uitleg bij iedereen
// nog één keer vanzelf open. Zonder dat zou wie hem al had weggeklikt de nieuwe
// stappen nooit te zien krijgen.
const VERSIE = 2;
const SLEUTEL = `cmt_rondleiding_gezien_v${VERSIE}`;

function alGezien(rol: string): boolean {
  try {
    return localStorage.getItem(`${SLEUTEL}_${rol}`) === 'ja';
  } catch {
    // Privémodus of geblokkeerde opslag: dan maar elke keer opnieuw aanbieden.
    return false;
  }
}

function onthoudGezien(rol: string): void {
  try {
    localStorage.setItem(`${SLEUTEL}_${rol}`, 'ja');
  } catch {
    /* niets aan te doen, en niet erg */
  }
}

interface Rondleiding {
  /** Null als deze rol geen rondleiding heeft. */
  stappen: RondleidingStap[] | null;
  titel: string;
  open: boolean;
  openen: () => void;
  sluiten: () => void;
}

export function useRondleiding(): Rondleiding {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const rol = user?.rol;
  const stappen = rol ? (RONDLEIDINGEN[rol] ?? null) : null;
  const titel = (rol && RONDLEIDING_TITEL[rol]) || 'Hoe werkt het?';

  useEffect(() => {
    if (!rol || !RONDLEIDINGEN[rol] || alGezien(rol)) return;
    setOpen(true);
  }, [rol]);

  const sluiten = useCallback(() => {
    setOpen(false);
    if (rol) onthoudGezien(rol);
  }, [rol]);

  return { stappen, titel, open, openen: () => setOpen(true), sluiten };
}
