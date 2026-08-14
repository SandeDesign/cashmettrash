// src/components/kaart/AdresKaart.tsx
//
// Een kaartje van één adres, binnen de app zelf. Bedoeld voor telefoons waarop
// de kaart-app niet gebruikt mag worden: dan kun je de weg nog steeds zien
// zonder de app te verlaten.
//
// De kaart zelf wordt pas geladen zodra je hem opent. Leaflet is een flink stuk
// code, en op de takenlijst staat hij standaard dicht.

import React, { lazy, Suspense, useState } from 'react';
import { ChevronUp, ExternalLink, MapPin } from 'lucide-react';
import { mapsLink } from '../../utils/constants';
import type { Punt } from '../../utils/geo';

const Kaart = lazy(() => import('./Kaart'));

interface AdresKaartProps {
  adres: string;
  postcode: string;
  plaats: string;
  /** Coordinaten van het adres. Zonder deze kunnen we niets tekenen. */
  punt?: Punt | null;
  /** Startpunt van de ronde, zodat je ziet welke kant je op moet. */
  thuis?: Punt | null;
  /** Tekst op de knop. Voor Jayce iets anders dan voor de beheerder. */
  knopTekst?: string;
}

const AdresKaart: React.FC<AdresKaartProps> = ({
  adres,
  postcode,
  plaats,
  punt,
  thuis,
  knopTekst = 'Laat me de weg zien',
}) => {
  const [open, setOpen] = useState(false);

  // Zonder coordinaten valt er niets te tekenen. Dan blijft alleen de kaart-app
  // over, en die werkt niet op elk toestel; daarom zeggen we het er eerlijk bij.
  if (!punt) {
    return (
      <a
        href={mapsLink(adres, postcode, plaats)}
        target="_blank"
        rel="noopener noreferrer"
        className="cmt-btn-secondary mt-3"
      >
        <MapPin className="w-5 h-5" /> {knopTekst}
      </a>
    );
  }

  const punten = thuis ? [thuis, punt] : [punt];

  return (
    <div className="mt-3">
      <button
        type="button"
        className={open ? 'cmt-btn-ghost' : 'cmt-btn-secondary'}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? (
          <>
            <ChevronUp className="w-5 h-5" /> Kaart dichtdoen
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" /> {knopTekst}
          </>
        )}
      </button>

      {open && (
        <div className="mt-3 cmt-animate-in">
          <Suspense
            fallback={
              <div className="cmt-skeleton" style={{ height: '16rem', borderRadius: '18px' }} />
            }
          >
            <Kaart
              midden={punt}
              pasOp={punten}
              hoogte="16rem"
              markeringen={[
                ...(thuis ? [{ punt: thuis, label: 'T', kleur: '#14181F' }] : []),
                { punt, label: '1', kleur: '#0E8F6C' },
              ]}
            />
          </Suspense>

          <p className="text-sm mt-2" style={{ color: 'var(--cmt-ink-muted)' }}>
            {thuis ? 'De zwarte stip is thuis, de groene is waar je heen moet.' : 'Hier moet je zijn.'}
          </p>

          <a
            href={mapsLink(adres, postcode, plaats)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm mt-1"
            style={{ color: 'var(--cmt-ink-muted)' }}
          >
            <ExternalLink className="w-4 h-4" /> Openen in je kaart-app
          </a>
        </div>
      )}
    </div>
  );
};

export default AdresKaart;
