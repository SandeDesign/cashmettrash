// src/pages/moeder/Overzicht.tsx
//
// De pagina van mama: waar moet ze mee, wat rijdt Jayce vandaag, en hoe gaat het.
// Ze ziet dezelfde adressen als Jayce, maar geen bedragen en geen chat.

import React, { useEffect, useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CheckCircle, MapPin, Recycle, ShieldAlert, Sparkles, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { MOEDER_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import MeldingenKaart from '../../components/common/MeldingenKaart';
import { useAuth } from '../../hooks/useAuth';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { useCustomerStore } from '../../store/customerStore';
import { useInstellingenStore } from '../../store/instellingenStore';
import { afstandMeters, type Punt } from '../../utils/geo';
import { mapsLink } from '../../utils/constants';

const datum = (iso: string) =>
  isToday(new Date(iso)) ? 'vandaag' : format(new Date(iso), 'd MMM', { locale: nl });

const Overzicht: React.FC = () => {
  const { user } = useAuth();
  const { orders, loading: glasLaadt, loadOpenstaand: loadGlas } = useGlasStore();
  const { logs, loadAlle: loadAlleStatiegeld } = useStatiegeldStore();
  const { customers, loadAlleCustomers } = useCustomerStore();
  const { werkgebied, loadWerkgebied } = useInstellingenStore();

  useEffect(() => {
    loadGlas();
    loadAlleStatiegeld();
    loadAlleCustomers();
    loadWerkgebied();
  }, [loadGlas, loadAlleStatiegeld, loadAlleCustomers, loadWerkgebied]);

  const thuis = useMemo<Punt>(
    () => ({ lat: werkgebied.middelpuntLat, lon: werkgebied.middelpuntLon }),
    [werkgebied.middelpuntLat, werkgebied.middelpuntLon]
  );

  const ronde = useMemo(() => {
    const coordVan = (customerId: string): Punt | null => {
      const klant = customers.find((c) => c.id === customerId);
      return klant?.lat != null && klant?.lon != null ? { lat: klant.lat, lon: klant.lon } : null;
    };

    const glas = orders
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
          aangemaaktOp: o.aangemaaktOp,
          items: 0,
          teVer: punt ? afstandMeters(thuis, punt) > werkgebied.straalAlleenMeters : false,
          hulpNodig: false,
        };
      });

    const statiegeld = logs
      .filter((l) => l.status === 'aangemeld')
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
          aangemaaktOp: l.aangemaaktOp,
          items,
          teVer,
          hulpNodig: teVer && items >= werkgebied.maxItemsAlleen,
        };
      });

    return [...glas, ...statiegeld];
  }, [orders, logs, customers, werkgebied, thuis]);

  const hulp = ronde.filter((r) => r.hulpNodig);
  const alleen = ronde.filter((r) => !r.hulpNodig);

  const cijfers = useMemo(() => {
    const opgehaald = logs.filter((l) => l.opgehaaldOp);
    return {
      rondes: orders.filter((o) => o.opgehaaldOp).length + opgehaald.length,
      flesjes: opgehaald.reduce((s, l) => s + (l.itemsWerkelijk?.plastic ?? 0), 0),
      blikjes: opgehaald.reduce((s, l) => s + (l.itemsWerkelijk?.blik ?? 0), 0),
      geschonken: logs.filter((l) => l.geschonken).length,
    };
  }, [orders, logs]);

  return (
    <AppLayout nav={MOEDER_NAV} title="De ronde van Jayce">
      {glasLaadt && ronde.length === 0 && <Loading />}

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" style={{ color: 'var(--cmt-warning)' }} />
          Hier moet je mee
        </h2>

        {hulp.length === 0 ? (
          <div className="cmt-card cmt-empty-state !py-6">
            <span className="cmt-empty-state-icon">
              <CheckCircle className="w-6 h-6" />
            </span>
            <p>Op dit moment kan Jayce alles zelf. Niets waarvoor je mee hoeft.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {hulp.map((rit) => (
              <li key={rit.id} className="cmt-card" style={{ borderLeft: '4px solid var(--cmt-warning)' }}>
                <p className="font-bold">{rit.naam}</p>
                <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
                  {rit.adres}, {rit.postcode} {rit.plaats}
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--cmt-warning)' }}>
                  {rit.items} stuks en buiten de straal van{' '}
                  {(werkgebied.straalAlleenMeters / 1000).toFixed(1)} km.
                </p>
                <a
                  href={mapsLink(rit.adres, rit.postcode, rit.plaats)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cmt-btn-secondary !py-2 !text-sm mt-3"
                >
                  <MapPin className="w-4 h-4" /> Route
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">Wat Jayce zelf doet</h2>
        {alleen.length === 0 ? (
          <div className="cmt-card cmt-empty-state !py-6">
            <p>Er staat verder niets klaar.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {alleen.map((rit) => (
              <li
                key={rit.id}
                className={`cmt-flow-${rit.soort === 'glas' ? 'glas' : 'stat'} cmt-card cmt-card-flow flex items-center gap-3`}
              >
                {rit.soort === 'glas' ? (
                  <Wine className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--cmt-accent)' }} />
                ) : (
                  <Recycle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--cmt-accent)' }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{rit.naam}</p>
                  <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                    {rit.adres} · aangemeld {datum(rit.aangemaaktOp)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Hoe het gaat</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="cmt-flow-glas cmt-card cmt-card-tint text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--cmt-glas)' }}>
              {cijfers.rondes}
            </p>
            <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
              keer opgehaald
            </p>
          </div>
          <div className="cmt-flow-stat cmt-card cmt-card-tint text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--cmt-stat)' }}>
              {cijfers.flesjes + cijfers.blikjes}
            </p>
            <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
              flesjes en blikjes
            </p>
          </div>
          <div className="cmt-flow-stat cmt-card cmt-card-tint text-center col-span-2">
            <Sparkles className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--cmt-stat)' }} />
            <p className="text-2xl font-bold" style={{ color: 'var(--cmt-stat)' }}>
              {cijfers.geschonken}
            </p>
            <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
              keer statiegeld aan Jayce geschonken
            </p>
          </div>
        </div>
      </section>

      <MeldingenKaart
        uid={user?.uid}
        rol={user?.rol}
        uitleg="Dan krijg je een bericht zodra er een rit is waar je mee moet."
      />
    </AppLayout>
  );
};

export default Overzicht;
