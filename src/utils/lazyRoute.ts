// src/utils/lazyRoute.ts
//
// Lazy geladen routes die tegen een nieuwe versie kunnen.
//
// Bij elke deploy krijgen de bestanden een nieuwe naam met een hash erin. Heeft
// iemand de app dan nog openstaan, dan wijst zijn pagina naar bestanden die er
// niet meer zijn. Het ophalen van zo'n stuk code mislukt met een 404, React.lazy
// gooit die fout door en de hele pagina eindigt bij de foutmelding met "Pagina
// vernieuwen". Dat is precies het moment waarop de app dat zelf kan oplossen.
//
// Daarom: eerst nog een keer proberen (een hik in het netwerk is zo voorbij), en
// lukt het dan nog niet, dan eenmalig de pagina herladen zodat de nieuwe versie
// wordt opgehaald. Die "eenmalig" staat in sessionStorage, want anders zou een
// echt kapot bestand een eindeloze reeks herladingen geven.

import { lazy, type ComponentType } from 'react';
import { logError } from './errorLogger';

const SLEUTEL = 'cmt_nieuwe_versie_herladen';

function alHerladen(): boolean {
  try {
    return sessionStorage.getItem(SLEUTEL) === 'ja';
  } catch {
    // Geen sessionStorage: dan liever niet herladen dan in een lus komen.
    return true;
  }
}

function onthoudHerladen(): void {
  try {
    sessionStorage.setItem(SLEUTEL, 'ja');
  } catch {
    /* niets aan te doen */
  }
}

function vergeetHerladen(): void {
  try {
    sessionStorage.removeItem(SLEUTEL);
  } catch {
    /* niets aan te doen */
  }
}

/**
 * Zoals React.lazy, maar met een tweede poging en een eenmalige herlading.
 *
 * De `any` in de constraint is dezelfde als die React zelf in `lazy` gebruikt.
 * Zonder die vorm gaan de props van het geladen component verloren.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyRoute<T extends ComponentType<any>>(laad: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const module = await laad();
      // Gelukt, dus een volgende keer mag er weer herladen worden.
      vergeetHerladen();
      return module;
    } catch {
      try {
        const module = await laad();
        vergeetHerladen();
        return module;
      } catch (tweede) {
        logError(tweede instanceof Error ? tweede : String(tweede), 'lazyRoute');

        if (!alHerladen()) {
          onthoudHerladen();
          window.location.reload();
          // De pagina gaat weg; dit blijft hangen tot dat zover is.
          return new Promise<{ default: T }>(() => {});
        }

        throw tweede;
      }
    }
  });
}
