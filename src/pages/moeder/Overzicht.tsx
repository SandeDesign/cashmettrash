// src/pages/moeder/Overzicht.tsx
//
// De pagina van mama: waar moet ze mee, wat rijdt Jayce vandaag, en hoe gaat het.
// Ze ziet dezelfde adressen als Jayce, maar geen bedragen en geen chat.

import React, { useEffect, useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { CheckCircle, Coins, Recycle, ScanLine, ShieldAlert, Sparkles, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { MOEDER_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import MeldingenKaart from '../../components/common/MeldingenKaart';
import { useAuth } from '../../hooks/useAuth';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { useCustomerStore } from '../../store/customerStore';
import { useInstellingenStore } from '../../store/instellingenStore';
import AdresKaart from '../../components/kaart/AdresKaart';
import { afstandMeters, type Punt } from '../../utils/geo';

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
          punt,
          items: 0,
          teVer: punt ? afstandMeters(thuis, punt) > werkgebied.straalAlleenMeters : false,
          hulpNodig: false,
        };
      });

    const statiegeld = logs
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
          aangemaaktOp: l.aangemaaktOp,
          punt,
          items,
          teVer,
          hulpNodig: teVer && items >= werkgebied.maxItemsAlleen,
        };
      });

    return [...glas, ...statiegeld];
  }, [orders, logs, customers, werkgebied, thuis]);

  const hulp = ronde.filter((r) => r.hulpNodig);
  const alleen = ronde.filter((r) => !r.hulpNodig);

  // Wat er buiten de ronde om op haar ligt te wachten. Dit staat bovenaan, want
  // dit dashboard hoort de vraag "wat moet ik nu doen" te beantwoorden.
  const teScannen = logs.filter((l) => l.status === 'opgehaald').length;
  const teBevestigen = logs.filter(
    (l) => l.servicekostenContant && l.opgehaaldOp && !l.contantBevestigdOp
  ).length;

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

      {(teScannen > 0 || teBevestigen > 0) && (
        <section className="cmt-flow-stat mb-8">
          <h2 className="text-lg font-bold mb-3">Wat ligt er voor jou klaar?</h2>
          <div className="space-y-3">
            {teScannen > 0 && (
              <div className="cmt-card cmt-card-flow">
                <p className="font-semibold flex items-center gap-2">
                  <ScanLine className="w-5 h-5" style={{ color: 'var(--cmt-stat)' }} />
                  {teScannen === 1
                    ? 'Er staat één zak klaar om in te scannen'
                    : `Er staan ${teScannen} zakken klaar om in te scannen`}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--cmt-ink-soft)' }}>
                  Scan ze in bij Viatim en zet het bedrag en de Tikkie klaar. Daarna kan de
                  beheerder het naar de klant sturen.
                </p>
                <Link to="/mama/scannen" className="cmt-btn-primary mt-3">
                  Naar het inscannen
                </Link>
              </div>
            )}

            {teBevestigen > 0 && (
              <div className="cmt-card cmt-card-flow">
                <p className="font-semibold flex items-center gap-2">
                  <Coins className="w-5 h-5" style={{ color: 'var(--cmt-stat)' }} />
                  {teBevestigen === 1
                    ? 'Eén klant heeft geld meegegeven aan Jayce'
                    : `${teBevestigen} klanten hebben geld meegegeven aan Jayce`}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--cmt-ink-soft)' }}>
                  Vink af zodra je het van hem hebt gekregen. Tot die tijd kan die klant zijn
                  Tikkie niet openen.
                </p>
                <Link to="/mama/contant" className="cmt-btn-primary mt-3">
                  Naar het contante geld
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

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
                <AdresKaart
                  adres={rit.adres}
                  postcode={rit.postcode}
                  plaats={rit.plaats}
                  punt={rit.punt}
                  thuis={thuis}
                  knopTekst="Waar is dit?"
                  metKaartApp
                />
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
