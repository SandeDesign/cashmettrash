// src/utils/werkgebied.ts
//
// Mag deze klant iets aanvragen? Twee horden, los van elkaar:
//
//   1. de postcode moet in de lijst staan (lege lijst betekent: iedereen mag)
//   2. het adres moet binnen `maxAfstandMeters` van het middelpunt liggen
//
// Een bekende springt over allebei heen. Kennen we de coordinaten van het adres
// niet, dan kunnen we de afstand niet nakijken en laten we het door: liever een
// ritje te veel dan een klant die zonder uitleg vastloopt.

import type { Customer, Werkgebied } from '../types';
import { afstandMeters } from './geo';

export type WerkgebiedOordeel =
  | { mag: true; reden: 'binnen' | 'bekende' | 'geenCoordinaten' }
  | { mag: false; reden: 'postcode' | 'teVer'; afstandMeters?: number };

/** Valt deze postcode binnen het werkgebied? Lege lijst betekent overal. */
export function postcodeInGebied(postcode: string, werkgebied: Werkgebied): boolean {
  if (werkgebied.postcodes.length === 0) return true;
  const schoon = postcode.replace(/\s/g, '').toUpperCase();
  return werkgebied.postcodes.some((p) => schoon.startsWith(p.replace(/\s/g, '').toUpperCase()));
}

/** Hemelsbrede afstand van dit adres tot het middelpunt, of null zonder coordinaten. */
export function afstandTotMiddelpunt(customer: Customer, werkgebied: Werkgebied): number | null {
  if (customer.lat == null || customer.lon == null) return null;
  return afstandMeters(
    { lat: werkgebied.middelpuntLat, lon: werkgebied.middelpuntLon },
    { lat: customer.lat, lon: customer.lon }
  );
}

export function toetsWerkgebied(customer: Customer, werkgebied: Werkgebied): WerkgebiedOordeel {
  if (customer.isBekende) return { mag: true, reden: 'bekende' };

  if (!postcodeInGebied(customer.postcode, werkgebied)) {
    return { mag: false, reden: 'postcode' };
  }

  const afstand = afstandTotMiddelpunt(customer, werkgebied);
  if (afstand === null) return { mag: true, reden: 'geenCoordinaten' };

  if (afstand > werkgebied.maxAfstandMeters) {
    return { mag: false, reden: 'teVer', afstandMeters: afstand };
  }

  return { mag: true, reden: 'binnen' };
}

/** Netjes afgeronde afstand voor in een zin: "3,4 km" of "800 meter". */
export function formatAfstand(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} meter`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}
