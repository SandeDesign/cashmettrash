// src/pages/jayce/Route.tsx
//
// De ronde op de kaart. De route wordt met het fietsprofiel berekend en mijdt de
// plekken die mama heeft aangewezen. Taal en knoppen zijn voor een tienjarige.

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bike, RefreshCw, ShieldAlert, UserCheck } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { JAYCE_NAV } from '../../components/layout/navItems';
import Kaart, { type KaartMarkering } from '../../components/kaart/Kaart';
import AdresKaart from '../../components/kaart/AdresKaart';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { useCustomerStore } from '../../store/customerStore';
import { useInstellingenStore } from '../../store/instellingenStore';
import {
  afstandMeters,
  berekenRoute,
  routeplannerBeschikbaar,
  type Punt,
  type RouteResultaat,
} from '../../utils/geo';

interface Stop {
  id: string;
  soort: 'glas' | 'statiegeld';
  naam: string;
  adres: string;
  postcode: string;
  plaats: string;
  punt: Punt | null;
  items: number;
  hulpNodig: boolean;
}

const Route: React.FC = () => {
  const { orders, loadOpenstaand: loadGlas } = useGlasStore();
  const { logs, loadOpenstaand: loadStatiegeld } = useStatiegeldStore();
  const { customers, loadAlleCustomers } = useCustomerStore();
  const { werkgebied, plekken, loadWerkgebied, loadPlekken } = useInstellingenStore();

  const [route, setRoute] = useState<RouteResultaat | null>(null);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    loadGlas();
    loadStatiegeld();
    loadAlleCustomers();
    loadWerkgebied();
    loadPlekken();
  }, [loadGlas, loadStatiegeld, loadAlleCustomers, loadWerkgebied, loadPlekken]);

  const thuis = useMemo<Punt>(
    () => ({ lat: werkgebied.middelpuntLat, lon: werkgebied.middelpuntLon }),
    [werkgebied.middelpuntLat, werkgebied.middelpuntLon]
  );

  const stops = useMemo<Stop[]>(() => {
    const coordVan = (customerId: string): Punt | null => {
      const klant = customers.find((c) => c.id === customerId);
      return klant?.lat != null && klant?.lon != null ? { lat: klant.lat, lon: klant.lon } : null;
    };

    const uitGlas: Stop[] = orders
      .filter((o) => o.status !== 'opgehaald')
      .map((o) => {
        const punt = coordVan(o.customerId);
        return {
          id: o.id,
          soort: 'glas' as const,
          naam: o.customerNaam,
          adres: o.adres,
          postcode: o.postcode,
          plaats: o.plaats,
          punt,
          items: 0,
          hulpNodig: punt
            ? afstandMeters(thuis, punt) > werkgebied.straalAlleenMeters
            : false,
        };
      });

    const uitStatiegeld: Stop[] = logs
      .filter((l) => l.status === 'aangemeld' || l.status === 'ingepland')
      .map((l) => {
        const punt = coordVan(l.customerId);
        const items = l.items.plastic + l.items.blik;
        const teVer = punt ? afstandMeters(thuis, punt) > werkgebied.straalAlleenMeters : false;
        return {
          id: l.id,
          soort: 'statiegeld' as const,
          naam: l.customerNaam,
          adres: l.adres,
          postcode: l.postcode,
          plaats: l.plaats,
          punt,
          items,
          // Alleen samen als het allebei geldt: veel spullen én ver weg.
          hulpNodig: teVer && items >= werkgebied.maxItemsAlleen,
        };
      });

    return [...uitGlas, ...uitStatiegeld];
  }, [orders, logs, customers, werkgebied, thuis]);

  // De routedienst zet de stops niet meer zelf op volgorde, dus doen we het hier:
  // steeds het dichtstbijzijnde adres dat nog over is. Dat is niet gegarandeerd
  // de allerkortste ronde, maar wel een logische volgorde om te rijden.
  const metCoordinaten = useMemo(() => {
    const over = stops.filter((s) => s.punt !== null);
    const volgorde: Stop[] = [];
    let vanaf = thuis;

    while (over.length > 0) {
      let dichtstbij = 0;
      for (let i = 1; i < over.length; i += 1) {
        if (
          afstandMeters(vanaf, over[i].punt as Punt) <
          afstandMeters(vanaf, over[dichtstbij].punt as Punt)
        ) {
          dichtstbij = i;
        }
      }
      const gekozen = over.splice(dichtstbij, 1)[0];
      volgorde.push(gekozen);
      vanaf = gekozen.punt as Punt;
    }

    return volgorde;
  }, [stops, thuis]);
  const zonderCoordinaten = stops.filter((s) => s.punt === null);
  const hulpStops = stops.filter((s) => s.hulpNodig);

  const planRoute = async () => {
    if (metCoordinaten.length === 0) return;
    setBezig(true);
    try {
      setRoute(
        await berekenRoute(
          thuis,
          metCoordinaten.map((s) => s.punt as Punt),
          plekken
        )
      );
    } finally {
      setBezig(false);
    }
  };

  const markeringen: KaartMarkering[] = [
    { punt: thuis, label: 'T', kleur: '#14181F' },
    ...metCoordinaten.map((s, i) => ({
      punt: s.punt as Punt,
      label: i + 1,
      kleur: s.soort === 'glas' ? '#0E8F6C' : '#0B4A9E',
    })),
  ];

  return (
    <AppLayout nav={JAYCE_NAV} title="Mijn route">
      {stops.length === 0 ? (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <Bike className="w-6 h-6" />
          </span>
          <p className="font-bold" style={{ color: 'var(--cmt-ink)' }}>
            Nog geen ronde
          </p>
          <p className="text-base mt-1">Er staat niets klaar, dus je hoeft nergens heen.</p>
        </div>
      ) : (
        <>
          <p className="text-base mb-4" style={{ color: 'var(--cmt-ink-soft)' }}>
            De zwarte stip is thuis. Je moet langs alle nummers en dan weer terug naar huis.
            Tik op een nummer in de lijst hieronder om te zien wie dat is.
          </p>

          <Kaart
            midden={thuis}
            markeringen={markeringen}
            lijn={route?.lijn}
            cirkels={plekken.map((p) => ({
              punt: { lat: p.lat, lon: p.lon },
              straalMeters: p.straalMeters,
            }))}
          />

          {routeplannerBeschikbaar ? (
            <button
              className="cmt-btn-primary cmt-btn-block cmt-btn-lg mt-4"
              onClick={planRoute}
              disabled={bezig || metCoordinaten.length === 0}
            >
              <RefreshCw className="w-5 h-5" />
              {bezig ? 'Ik zoek de route...' : 'Laat de route zien'}
            </button>
          ) : (
            <div className="cmt-alert cmt-alert-info mt-4">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>
                De kaart werkt, maar de lijn met de route erin is nog niet aangezet. Vraag dat
                even aan papa. De nummers hierboven kloppen wel.
              </span>
            </div>
          )}

          {route?.fout && <div className="cmt-alert cmt-alert-error mt-3">{route.fout}</div>}

          {route && !route.fout && route.afstandMeters > 0 && (
            <div className="cmt-card cmt-card-tint mt-3">
              <p className="text-base">
                <strong>{(route.afstandMeters / 1000).toFixed(1)} km</strong> fietsen, ongeveer{' '}
                <strong>{Math.round(route.duurSeconden / 60)} minuten</strong>.
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--cmt-ink-muted)' }}>
                De route gaat om drukke wegen heen en om de plekken die mama heeft aangewezen.
              </p>
            </div>
          )}

          {hulpStops.length > 0 && (
            <div className="cmt-alert cmt-alert-warning mt-4">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>
                Bij {hulpStops.length === 1 ? 'één adres' : `${hulpStops.length} adressen`} moet
                mama mee. Het is ver weg en er is veel om mee te nemen.
              </span>
            </div>
          )}

          {zonderCoordinaten.length > 0 && (
            <div className="cmt-alert cmt-alert-info mt-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>
                {zonderCoordinaten.length === 1 ? 'Eén adres staat' : 'Sommige adressen staan'} nog
                niet op de kaart. Die staan wel gewoon op je lijst.
              </span>
            </div>
          )}

          <h2 className="text-lg font-bold mt-6 mb-3">De adressen op volgorde</h2>
          <ol className="space-y-2">
            {metCoordinaten.map((stop, i) => (
              <li
                key={stop.id}
                className={`cmt-flow-${stop.soort === 'glas' ? 'glas' : 'stat'} cmt-card cmt-card-flow`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 font-bold text-sm"
                    style={{ background: 'var(--cmt-accent)', color: '#fff' }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">{stop.naam}</p>
                    <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
                      {stop.adres}
                    </p>
                    {stop.hulpNodig && (
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--cmt-warning)' }}>
                        <UserCheck className="w-3.5 h-3.5" /> Samen met mama
                      </p>
                    )}
                  </div>
                </div>

                <AdresKaart
                  adres={stop.adres}
                  postcode={stop.postcode}
                  plaats={stop.plaats}
                  punt={stop.punt}
                  thuis={thuis}
                  knopTekst="Hoe kom ik hier?"
                />
              </li>
            ))}
          </ol>
        </>
      )}
    </AppLayout>
  );
};

export default Route;
