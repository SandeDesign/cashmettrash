// src/pages/admin/Dagoverzicht.tsx
//
// Wat Jayce vandaag heeft opgehaald, met het totaal dat mee moet naar het
// Viatim-punt. Afrekenen per klant blijft op de statiegeldpagina; dit is het
// blad dat je meeneemt.

import React, { useEffect, useMemo, useState } from 'react';
import { format, isSameDay, subDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Package, Recycle, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';

const Dagoverzicht: React.FC = () => {
  const { orders, loading: glasLaadt, loadAlle: loadGlas } = useGlasStore();
  const { logs, loading: statLaadt, loadAlle: loadStatiegeld } = useStatiegeldStore();
  const [dagenTerug, setDagenTerug] = useState(0);

  useEffect(() => {
    loadGlas();
    loadStatiegeld();
  }, [loadGlas, loadStatiegeld]);

  const dag = subDays(new Date(), dagenTerug);

  const vandaag = useMemo(() => {
    const statiegeld = logs.filter((l) => l.opgehaaldOp && isSameDay(new Date(l.opgehaaldOp), dag));
    const glas = orders.filter((o) => o.opgehaaldOp && isSameDay(new Date(o.opgehaaldOp), dag));

    return {
      statiegeld,
      glas,
      flesjes: statiegeld.reduce((s, l) => s + (l.itemsWerkelijk?.plastic ?? 0), 0),
      blikjes: statiegeld.reduce((s, l) => s + (l.itemsWerkelijk?.blik ?? 0), 0),
      geschonken: statiegeld.filter((l) => l.geschonken).length,
    };
  }, [logs, orders, dag]);

  const totaalStuks = vandaag.flesjes + vandaag.blikjes;

  if ((glasLaadt || statLaadt) && orders.length === 0 && logs.length === 0) {
    return (
      <AppLayout nav={ADMIN_NAV} title="Dagoverzicht">
        <Loading />
      </AppLayout>
    );
  }

  return (
    <AppLayout nav={ADMIN_NAV} title="Dagoverzicht">
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button
          className="cmt-btn-ghost !py-2 !text-sm"
          onClick={() => setDagenTerug((d) => d + 1)}
        >
          Vorige dag
        </button>
        <span className="font-semibold">
          {dagenTerug === 0 ? 'Vandaag' : format(dag, 'EEEE d MMMM', { locale: nl })}
        </span>
        <button
          className="cmt-btn-ghost !py-2 !text-sm"
          onClick={() => setDagenTerug((d) => Math.max(0, d - 1))}
          disabled={dagenTerug === 0}
        >
          Volgende dag
        </button>
      </div>

      <div className="cmt-flow-stat cmt-card cmt-card-flow mb-5">
        <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--cmt-stat)' }}>
          <Package className="w-5 h-5" />
          <span className="text-sm font-semibold">Mee naar het Viatim-punt</span>
        </div>
        <p className="text-3xl font-bold">{totaalStuks} stuks</p>
        <p className="text-sm mt-1" style={{ color: 'var(--cmt-ink-muted)' }}>
          {vandaag.flesjes} flessen en {vandaag.blikjes} blikjes, van{' '}
          {vandaag.statiegeld.length}{' '}
          {vandaag.statiegeld.length === 1 ? 'adres' : 'adressen'}.
          {vandaag.geschonken > 0 &&
            ` Daarvan ${vandaag.geschonken === 1 ? 'is er één' : `zijn er ${vandaag.geschonken}`} aan Jayce geschonken.`}
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Recycle className="w-5 h-5" style={{ color: 'var(--cmt-stat)' }} />
          Statiegeld
        </h2>
        {vandaag.statiegeld.length === 0 ? (
          <div className="cmt-card cmt-empty-state !py-6">
            <p>Deze dag is er geen statiegeld opgehaald.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {vandaag.statiegeld.map((log) => {
              const geteld = log.itemsWerkelijk ?? log.items;
              return (
                <li key={log.id} className="cmt-card flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{log.customerNaam}</p>
                    <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                      {geteld.plastic} flessen · {geteld.blik} blikjes
                    </p>
                  </div>
                  {log.geschonken && <span className="cmt-badge cmt-badge-stat">Geschonken</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Wine className="w-5 h-5" style={{ color: 'var(--cmt-glas)' }} />
          Glas
        </h2>
        {vandaag.glas.length === 0 ? (
          <div className="cmt-card cmt-empty-state !py-6">
            <p>Deze dag is er geen glas opgehaald.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {vandaag.glas.map((order) => (
              <li key={order.id} className="cmt-card">
                <p className="font-semibold text-sm">{order.customerNaam}</p>
                <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                  {order.adres}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  );
};

export default Dagoverzicht;
