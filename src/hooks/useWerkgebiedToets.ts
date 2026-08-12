// src/hooks/useWerkgebiedToets.ts
//
// Kijkt of deze klant iets mag aanvragen. Kennen we de coordinaten van het adres
// nog niet, dan zoeken we ze hier eenmalig op en bewaren we ze meteen, zodat de
// straalcontrole ook werkt voor accounts van voor de routeplanner.

import { useEffect, useState } from 'react';
import { useInstellingenStore } from '../store/instellingenStore';
import { ververCoordinaten } from '../store/customerStore';
import { zoekCoordinaten } from '../utils/geo';
import { toetsWerkgebied, type WerkgebiedOordeel } from '../utils/werkgebied';
import type { Customer } from '../types';

interface Toets {
  /** Zolang dit waar is weten we het nog niet en tonen we geen blokkade. */
  bezig: boolean;
  oordeel: WerkgebiedOordeel | null;
}

export function useWerkgebiedToets(customer: Customer | null): Toets {
  const { werkgebied, loadWerkgebied } = useInstellingenStore();
  const [gezocht, setGezocht] = useState<{ lat: number; lon: number } | null>(null);
  const [zoekt, setZoekt] = useState(false);

  useEffect(() => {
    loadWerkgebied();
  }, [loadWerkgebied]);

  useEffect(() => {
    if (!customer || customer.lat != null || customer.isBekende) return;

    let afgebroken = false;
    setZoekt(true);

    void (async () => {
      const punt = await zoekCoordinaten(customer.adres, customer.postcode, customer.plaats);
      if (afgebroken) return;

      setGezocht(punt);
      setZoekt(false);
      // Meteen bewaren, dan hoeft de volgende pagina niet opnieuw te zoeken.
      if (punt) void ververCoordinaten(customer.id, customer.adres, customer.postcode, customer.plaats);
    })();

    return () => {
      afgebroken = true;
    };
  }, [customer]);

  if (!customer) return { bezig: true, oordeel: null };

  const compleet = gezocht ? { ...customer, lat: gezocht.lat, lon: gezocht.lon } : customer;
  return { bezig: zoekt, oordeel: toetsWerkgebied(compleet, werkgebied) };
}
