// src/pages/klant/Overzicht.tsx
//
// Ook hier staan acties voorop. Wat de klant moet dóen staat bovenaan, daaronder
// pas wat er loopt.

import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AlertCircle, ArrowRight, MapPin, Package, Recycle, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { KLANT_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import MeldingenKaart from '../../components/common/MeldingenKaart';
import { GlasStatusBadge, StatiegeldStatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerStore } from '../../store/customerStore';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { useInstellingenStore, postcodeInGebied } from '../../store/instellingenStore';
import { formatCenten, GLAS_PRIJS_CENTEN } from '../../utils/constants';

const datum = (iso: string) => format(new Date(iso), 'd MMM yyyy', { locale: nl });

interface Actie {
  id: string;
  tekst: string;
  knop: string;
  naar: string;
}

const Overzicht: React.FC = () => {
  const { user } = useAuth();
  const { customer, loadCustomer } = useCustomerStore();
  const { orders, loading: glasLaadt, loadVoorKlant: loadGlas } = useGlasStore();
  const { logs, loading: statLaadt, loadVoorKlant: loadStatiegeld } = useStatiegeldStore();
  const { werkgebied, loadWerkgebied } = useInstellingenStore();

  useEffect(() => {
    if (!user) return;
    loadCustomer(user.uid);
    loadGlas(user.uid);
    loadStatiegeld(user.uid);
    loadWerkgebied();
  }, [user, loadCustomer, loadGlas, loadStatiegeld, loadWerkgebied]);

  // Buiten de ronde van Jayce kan alleen een bekende nog aanvragen.
  const magAanvragen =
    !customer || !!customer.isBekende || postcodeInGebied(customer.postcode, werkgebied);

  /** Wat er van de klant wordt verwacht. Dit staat bovenaan de pagina. */
  const acties = useMemo<Actie[]>(() => {
    const lijst: Actie[] = [];

    const openKosten = logs.filter((l) => l.servicekostenStatus === 'openstaand');
    if (openKosten.length > 0) {
      const bedrag = openKosten.reduce((som, l) => som + l.servicekosten, 0);
      lijst.push({
        id: 'ophaalkosten',
        tekst: `Je Tikkie staat klaar in je berichten. Daar betaal je ook de ${formatCenten(bedrag)} ophaalkosten.`,
        knop: 'Naar mijn berichten',
        naar: '/chat',
      });
    }

    const nietBetaald = orders.filter((o) => o.status === 'aangemeld');
    if (nietBetaald.length > 0) {
      lijst.push({
        id: 'onbetaald',
        tekst:
          nietBetaald.length === 1
            ? 'Je hebt een glas-aanvraag die nog niet betaald is. Jayce komt pas langs als dat rond is.'
            : `Je hebt ${nietBetaald.length} glas-aanvragen die nog niet betaald zijn.`,
        knop: 'Alsnog betalen',
        naar: '/glas',
      });
    }

    return lijst;
  }, [orders, logs]);

  return (
    <AppLayout nav={KLANT_NAV} title={`Hoi ${user?.naam.split(' ')[0] ?? ''}`}>
      {customer && (
        <p className="-mt-3 mb-6 text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
          We komen langs op {customer.adres}, {customer.postcode} {customer.plaats}
        </p>
      )}

      {acties.length > 0 && (
        <section className="mb-8 space-y-3">
          {acties.map((actie) => (
            <div key={actie.id} className="cmt-card cmt-card-tint cmt-flow-stat cmt-animate-in">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: 'var(--cmt-stat)' }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-3">{actie.tekst}</p>
                  <Link to={actie.naar} className="cmt-btn-primary !py-2 !text-sm">
                    {actie.knop} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {!magAanvragen && (
        <div className="cmt-alert cmt-alert-warning mb-8">
          <MapPin className="w-5 h-5 flex-shrink-0" />
          <span>
            Jayce rijdt op zijn skelter en blijft in de eigen buurt. Jouw adres ligt daar net
            buiten, dus we kunnen hier voorlopig niet ophalen. Klopt je adres niet? Pas het aan
            bij <Link to="/profiel">je gegevens</Link>.
          </span>
        </div>
      )}

      <div className={`grid sm:grid-cols-2 gap-4 mb-8 ${magAanvragen ? '' : 'opacity-50 pointer-events-none'}`}>
        <Link to="/glas" className="cmt-flow-glas cmt-card cmt-card-tint cmt-animate-in block">
          <Wine className="w-7 h-7 mb-2" style={{ color: 'var(--cmt-glas)' }} />
          <h2 className="font-bold mb-1">Glas laten ophalen</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--cmt-ink-soft)' }}>
            Jayce haalt je glazen flessen op. {formatCenten(GLAS_PRIJS_CENTEN)} per keer.
          </p>
          <span className="cmt-btn-primary">Aanvragen</span>
        </Link>

        <Link
          to="/statiegeld"
          className="cmt-flow-stat cmt-card cmt-card-tint cmt-animate-in cmt-delay-1 block"
        >
          <Recycle className="w-7 h-7 mb-2" style={{ color: 'var(--cmt-stat)' }} />
          <h2 className="font-bold mb-1">Statiegeld aanmelden</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--cmt-ink-soft)' }}>
            Plastic flessen en blikjes. Je krijgt het statiegeld via Tikkie terug.
          </p>
          <span className="cmt-btn-primary">Aanmelden</span>
        </Link>
      </div>

      <section className="cmt-flow-glas mb-8">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Wine className="w-5 h-5" style={{ color: 'var(--cmt-glas)' }} />
          Glas
        </h2>

        {glasLaadt && orders.length === 0 ? (
          <Loading />
        ) : orders.length === 0 ? (
          <div className="cmt-card cmt-empty-state">
            <span className="cmt-empty-state-icon">
              <Package className="w-6 h-6" />
            </span>
            <p>Je hebt nog geen glas-aanvragen.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.id} className="cmt-card cmt-card-flow flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Ophaalbeurt glas</p>
                  <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                    Aangemeld op {datum(order.aangemaaktOp)} · {formatCenten(order.bedrag)}
                  </p>
                </div>
                <GlasStatusBadge status={order.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cmt-flow-stat">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Recycle className="w-5 h-5" style={{ color: 'var(--cmt-stat)' }} />
          Statiegeld
        </h2>

        {statLaadt && logs.length === 0 ? (
          <Loading />
        ) : logs.length === 0 ? (
          <div className="cmt-card cmt-empty-state">
            <span className="cmt-empty-state-icon">
              <Package className="w-6 h-6" />
            </span>
            <p>Je hebt nog geen statiegeld aangemeld.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => {
              const geteld = log.itemsWerkelijk ?? log.items;
              return (
                <li key={log.id} className="cmt-card cmt-card-flow flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {geteld.plastic} flessen · {geteld.blik} blikjes
                    </p>
                    <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                      Aangemeld op {datum(log.aangemaaktOp)}
                      {log.tikkieBedrag != null && ` · Tikkie ${formatCenten(log.tikkieBedrag)}`}
                    </p>
                    {log.servicekostenStatus === 'openstaand' && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--cmt-warning)' }}>
                        {formatCenten(log.servicekosten)} ophaalkosten open
                      </p>
                    )}
                  </div>
                  <StatiegeldStatusBadge status={log.status} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <MeldingenKaart
        uid={user?.uid}
        rol={user?.rol}
        uitleg="Dan hoor je het meteen als je Tikkie klaarstaat of als we je een bericht sturen."
      />
    </AppLayout>
  );
};

export default Overzicht;
