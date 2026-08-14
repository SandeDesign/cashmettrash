// src/pages/jayce/Route.tsx
//
// De ronde op de kaart, per dag. Er staat bewust alleen op wat Jayce zelf heeft
// ingepland: een adres waar hij nog geen tijd voor heeft gekozen hoort op zijn
// takenlijst, niet op de kaart. Zo weet hij bij het opstappen precies waar hij
// vandaag heen moet.
//
// De route wordt met het fietsprofiel berekend en mijdt de plekken die mama
// heeft aangewezen. Taal en knoppen zijn voor een tienjarige.

import React, { useEffect, useMemo, useState } from 'react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AlertTriangle, Bike, Coins, RefreshCw, ShieldAlert, UserCheck } from 'lucide-react';
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
  /** Wanneer Jayce heeft gezegd dat hij komt. */
  van: string;
  tot: string;
  /** Hij krijgt hier de ophaalkosten contant mee. */
  contant: boolean;
}

/** De dagsleutel waarop we groeperen: gewoon de datum, zonder tijd. */
const dagVan = (iso: string) => iso.slice(0, 10);

/** "Vandaag", "Morgen" of "Zaterdag 16 augustus". */
function dagInWoorden(iso: string): string {
  const datum = new Date(iso);
  if (isToday(datum)) return 'Vandaag';
  if (isTomorrow(datum)) return 'Morgen';
  return format(datum, 'EEEE d MMMM', { locale: nl });
}

/** Kort label voor de knopjes bovenaan. */
function dagKort(iso: string): string {
  const datum = new Date(iso);
  if (isToday(datum)) return 'Vandaag';
  if (isTomorrow(datum)) return 'Morgen';
  return format(datum, 'EEE d MMM', { locale: nl });
}

const Route: React.FC = () => {
  const { orders, loadOpenstaand: loadGlas } = useGlasStore();
  const { logs, loadOpenstaand: loadStatiegeld } = useStatiegeldStore();
  const { customers, loadAlleCustomers } = useCustomerStore();
  const { werkgebied, plekken, loadWerkgebied, loadPlekken } = useInstellingenStore();

  const [route, setRoute] = useState<RouteResultaat | null>(null);
  const [bezig, setBezig] = useState(false);
  const [gekozenDag, setGekozenDag] = useState<string | null>(null);

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

  // Alleen wat is ingepland. De rest staat op de takenlijst en heeft nog geen dag.
  const stops = useMemo<Stop[]>(() => {
    const coordVan = (customerId: string): Punt | null => {
      const klant = customers.find((c) => c.id === customerId);
      return klant?.lat != null && klant?.lon != null ? { lat: klant.lat, lon: klant.lon } : null;
    };

    const uitGlas: Stop[] = orders
      .filter((o) => o.status === 'ingepland' && o.geplandVan && o.geplandTot)
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
          hulpNodig: punt ? afstandMeters(thuis, punt) > werkgebied.straalAlleenMeters : false,
          van: o.geplandVan as string,
          tot: o.geplandTot as string,
          contant: !!o.contant && !o.contantBevestigdOp,
        };
      });

    const uitStatiegeld: Stop[] = logs
      .filter((l) => l.status === 'ingepland' && l.geplandVan && l.geplandTot)
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
          van: l.geplandVan as string,
          tot: l.geplandTot as string,
          contant: !!l.servicekostenContant && !l.contantBevestigdOp,
        };
      });

    return [...uitGlas, ...uitStatiegeld];
  }, [orders, logs, customers, werkgebied, thuis]);

  /** Per dag één groepje, op volgorde van de kalender. */
  const dagen = useMemo(() => {
    const inhoud = new Map<string, Stop[]>();
    for (const stop of stops) {
      const dag = dagVan(stop.van);
      if (!inhoud.has(dag)) inhoud.set(dag, []);
      inhoud.get(dag)!.push(stop);
    }
    return [...inhoud.entries()]
      .map(([dag, items]) => ({
        dag,
        items: items.sort((a, b) => a.van.localeCompare(b.van)),
      }))
      .sort((a, b) => a.dag.localeCompare(b.dag));
  }, [stops]);

  // Standaard staat vandaag open, en anders de eerstvolgende dag die er is.
  const actieveDag =
    gekozenDag && dagen.some((d) => d.dag === gekozenDag)
      ? gekozenDag
      : (dagen.find((d) => isToday(new Date(d.dag))) ?? dagen[0])?.dag;

  const vandaagStops = useMemo(
    () => dagen.find((d) => d.dag === actieveDag)?.items ?? [],
    [dagen, actieveDag]
  );

  // Binnen een dag rijdt hij op tijd. Staan er meerdere adressen in hetzelfde
  // tijdslot, dan pakken we steeds het dichtstbijzijnde dat nog over is.
  const opVolgorde = useMemo(() => {
    const volgorde: Stop[] = [];
    let vanaf = thuis;

    const perTijd = new Map<string, Stop[]>();
    for (const stop of vandaagStops) {
      if (!perTijd.has(stop.van)) perTijd.set(stop.van, []);
      perTijd.get(stop.van)!.push(stop);
    }

    for (const tijd of [...perTijd.keys()].sort()) {
      const over = perTijd.get(tijd)!.slice();
      while (over.length > 0) {
        let dichtstbij = 0;
        for (let i = 1; i < over.length; i += 1) {
          const hier = over[i].punt;
          const beste = over[dichtstbij].punt;
          if (!hier) continue;
          if (!beste || afstandMeters(vanaf, hier) < afstandMeters(vanaf, beste)) dichtstbij = i;
        }
        const gekozen = over.splice(dichtstbij, 1)[0];
        volgorde.push(gekozen);
        if (gekozen.punt) vanaf = gekozen.punt;
      }
    }

    return volgorde;
  }, [vandaagStops, thuis]);

  const metCoordinaten = opVolgorde.filter((s) => s.punt !== null);
  const zonderCoordinaten = opVolgorde.filter((s) => s.punt === null);
  const hulpStops = opVolgorde.filter((s) => s.hulpNodig);
  const contantStops = opVolgorde.filter((s) => s.contant);

  // Wissel je van dag, dan klopt de getekende lijn niet meer.
  useEffect(() => setRoute(null), [actieveDag]);

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
      {dagen.length === 0 ? (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <Bike className="w-6 h-6" />
          </span>
          <p className="font-bold" style={{ color: 'var(--cmt-ink)' }}>
            Nog geen ronde
          </p>
          <p className="text-base mt-1">
            Hier staat pas iets als je hebt gezegd wanneer je langskomt. Dat doe je bij{' '}
            <strong>Ophalen</strong>.
          </p>
        </div>
      ) : (
        <>
          {/* Eén knopje per dag. Zo zie je meteen hoeveel adressen er per dag zijn. */}
          <div className="flex gap-2 overflow-x-auto cmt-nav-schuif pb-1 mb-4">
            {dagen.map((dag) => {
              const isActief = dag.dag === actieveDag;
              return (
                <button
                  key={dag.dag}
                  type="button"
                  onClick={() => setGekozenDag(dag.dag)}
                  className={isActief ? 'cmt-btn-primary flex-shrink-0' : 'cmt-btn-secondary flex-shrink-0'}
                >
                  {dagKort(dag.dag)}
                  <span className="cmt-badge cmt-badge-neutral">{dag.items.length}</span>
                </button>
              );
            })}
          </div>

          <h2 className="text-lg font-bold mb-1">{actieveDag && dagInWoorden(actieveDag)}</h2>
          <p className="text-base mb-4" style={{ color: 'var(--cmt-ink-soft)' }}>
            Je moet naar <strong>{opVolgorde.length}</strong>{' '}
            {opVolgorde.length === 1 ? 'adres' : 'adressen'}. De zwarte stip is thuis. Ga langs de
            nummers op volgorde en dan weer naar huis.
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

          {contantStops.length > 0 && (
            <div className="cmt-alert cmt-alert-info mt-3">
              <Coins className="w-5 h-5 flex-shrink-0" />
              <span>
                Bij {contantStops.length === 1 ? 'één adres' : `${contantStops.length} adressen`}{' '}
                krijg je geld mee. Geef dat thuis aan mama.
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
            {opVolgorde.map((stop, i) => (
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
                    <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--cmt-accent)' }}>
                      Tussen {format(new Date(stop.van), 'HH:mm')} en{' '}
                      {format(new Date(stop.tot), 'HH:mm')}
                      {isPast(new Date(stop.tot)) && ' (dat is al geweest)'}
                    </p>
                    {stop.hulpNodig && (
                      <p
                        className="text-xs mt-0.5 flex items-center gap-1"
                        style={{ color: 'var(--cmt-warning)' }}
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Samen met mama
                      </p>
                    )}
                    {stop.contant && (
                      <p
                        className="text-xs mt-0.5 flex items-center gap-1"
                        style={{ color: 'var(--cmt-stat)' }}
                      >
                        <Coins className="w-3.5 h-3.5" /> Hier krijg je geld mee voor mama
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
