// src/components/kaart/AdresKaart.tsx
//
// De routeplanner naar één adres, volledig in de app. Voor Jayce staat de link
// naar de kaart-app uit: op zijn toestel mag die niet open, dus alles wat hij
// nodig heeft om er te komen staat hier. Mama rijdt met de auto en kan met
// `metKaartApp` wel haar eigen navigatie starten.
//
// Je krijgt de kaart met de getekende route, hoe ver het is, hoe lang het duurt
// en de aanwijzingen stap voor stap in het Nederlands. De kaart zelf wordt pas
// geladen zodra je hem opent, want Leaflet is een flink stuk code.

import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bike, ChevronUp, ExternalLink, MapPin, Navigation } from 'lucide-react';
import { mapsLink } from '../../utils/constants';
import { useInstellingenStore } from '../../store/instellingenStore';
import {
  berekenRit,
  routeplannerBeschikbaar,
  type Punt,
  type RouteResultaat,
} from '../../utils/geo';

const Kaart = lazy(() => import('./Kaart'));

interface AdresKaartProps {
  adres: string;
  postcode: string;
  plaats: string;
  /** Coordinaten van het adres. Zonder deze kunnen we niets tekenen. */
  punt?: Punt | null;
  /** Startpunt van de ronde. */
  thuis?: Punt | null;
  /** Tekst op de knop. Voor Jayce iets anders dan voor mama. */
  knopTekst?: string;
  /**
   * Toon ook een link naar de kaart-app van de telefoon. Staat uit voor Jayce,
   * want op zijn toestel mag die niet open. Mama rijdt met de auto mee en wil
   * juist wel haar eigen navigatie kunnen starten.
   */
  metKaartApp?: boolean;
}

const AdresKaart: React.FC<AdresKaartProps> = ({
  adres,
  postcode,
  plaats,
  punt,
  thuis,
  knopTekst = 'Laat me de weg zien',
  metKaartApp = false,
}) => {
  const { plekken, loadPlekken } = useInstellingenStore();

  const [open, setOpen] = useState(false);
  const [route, setRoute] = useState<RouteResultaat | null>(null);
  const [bezig, setBezig] = useState(false);
  /** Voor welk traject we de weg hebben opgevraagd. */
  const gevraagdVoor = useRef<string | null>(null);

  useEffect(() => {
    if (open) loadPlekken();
  }, [open, loadPlekken]);

  // Zodra de kaart opengaat de route ophalen. Eén keer per adres is genoeg.
  //
  // Let op de vorm hiervan. Een eerdere versie zette `bezig` in de dependencies
  // en brak het verzoek af in de cleanup: door setBezig(true) liep het effect
  // meteen opnieuw, werd het eerste verzoek afgebroken en kwam het antwoord dus
  // nooit binnen. Het bleef eeuwig op "Ik zoek de weg" staan. Daarom onthouden we
  // in een ref waar we de weg voor vroegen, en breken we niets meer af.
  useEffect(() => {
    if (!open || !punt || !thuis || !routeplannerBeschikbaar) return;

    const sleutel = `${thuis.lat},${thuis.lon}>${punt.lat},${punt.lon}|${plekken.length}`;
    if (gevraagdVoor.current === sleutel) return;
    gevraagdVoor.current = sleutel;

    setBezig(true);

    void (async () => {
      const gevonden = await berekenRit(thuis, punt, plekken);
      // Is er intussen een nieuwe vraag gesteld, dan telt dit antwoord niet meer.
      if (gevraagdVoor.current !== sleutel) return;
      setRoute(gevonden);
      setBezig(false);
    })();
  }, [open, punt, thuis, plekken]);

  const kaartAppLink = metKaartApp ? (
    <a
      href={mapsLink(adres, postcode, plaats)}
      target="_blank"
      rel="noopener noreferrer"
      className="cmt-btn-ghost !py-2 !text-sm mt-2"
    >
      <ExternalLink className="w-4 h-4" /> Openen in je navigatie-app
    </a>
  ) : null;

  // Zonder coordinaten valt er niets te tekenen. Dat zeggen we dan gewoon.
  if (!punt) {
    return (
      <div className="mt-3">
        <p className="text-sm flex items-start gap-2" style={{ color: 'var(--cmt-ink-muted)' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          Dit adres staat nog niet op de kaart. Vraag papa om het op te zoeken.
        </p>
        {kaartAppLink}
      </div>
    );
  }

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
              <div className="cmt-skeleton" style={{ height: '18rem', borderRadius: '18px' }} />
            }
          >
            <Kaart
              midden={punt}
              pasOp={thuis ? [thuis, punt] : [punt]}
              hoogte="18rem"
              lijn={route?.lijn}
              cirkels={plekken.map((p) => ({
                punt: { lat: p.lat, lon: p.lon },
                straalMeters: p.straalMeters,
              }))}
              markeringen={[
                ...(thuis ? [{ punt: thuis, label: 'T', kleur: '#14181F' }] : []),
                { punt, label: '1', kleur: '#0E8F6C' },
              ]}
            />
          </Suspense>

          {bezig && (
            <p className="text-base mt-3" style={{ color: 'var(--cmt-ink-soft)' }}>
              Ik zoek de weg...
            </p>
          )}

          {route && !route.fout && route.afstandMeters > 0 && (
            <div className="cmt-card cmt-card-tint mt-3">
              <p className="text-base font-semibold flex items-center gap-2">
                <Bike className="w-5 h-5" />
                {(route.afstandMeters / 1000).toFixed(1)} km, ongeveer{' '}
                {Math.max(1, Math.round(route.duurSeconden / 60))} minuten
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--cmt-ink-soft)' }}>
                De groene lijn is de weg die je neemt. Hij gaat om drukke wegen heen en om de
                plekken die mama heeft aangewezen.
              </p>
            </div>
          )}

          {route?.stappen && route.stappen.length > 0 && (
            <div className="mt-3">
              <p className="text-base font-semibold mb-2 flex items-center gap-2">
                <Navigation className="w-5 h-5" /> Zo kom je er
              </p>
              <ol className="cmt-route-stappen">
                {route.stappen.map((stap, i) => (
                  <li key={i}>
                    <span className="cmt-route-nummer">{i + 1}</span>
                    <span className="flex-1">
                      {stap.tekst}
                      {stap.afstandMeters >= 10 && (
                        <span className="block text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
                          {Math.round(stap.afstandMeters)} meter
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {route?.fout && (
            <p className="text-base mt-3" style={{ color: 'var(--cmt-ink-soft)' }}>
              De weg zoeken lukte even niet, maar op de kaart zie je wel waar het is. De zwarte
              stip is thuis, de groene is waar je heen moet.
            </p>
          )}

          {!routeplannerBeschikbaar && (
            <p className="text-base mt-3" style={{ color: 'var(--cmt-ink-soft)' }}>
              De zwarte stip is thuis, de groene is waar je heen moet.
            </p>
          )}

          <p className="text-xs mt-2" style={{ color: 'var(--cmt-ink-muted)' }}>
            {adres}, {postcode} {plaats}
          </p>

          {kaartAppLink}
        </div>
      )}
    </div>
  );
};

export default AdresKaart;
