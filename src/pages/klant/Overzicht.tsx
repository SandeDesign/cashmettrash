// src/pages/klant/Overzicht.tsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Package, Recycle, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { KLANT_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { GlasStatusBadge, StatiegeldStatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerStore } from '../../store/customerStore';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { formatCenten, GLAS_PRIJS_CENTEN } from '../../utils/constants';

const datum = (iso: string) => format(new Date(iso), 'd MMM yyyy', { locale: nl });

const Overzicht: React.FC = () => {
  const { user } = useAuth();
  const { customer, loadCustomer } = useCustomerStore();
  const { orders, loading: glasLaadt, loadVoorKlant: loadGlas } = useGlasStore();
  const { logs, loading: statLaadt, loadVoorKlant: loadStatiegeld } = useStatiegeldStore();

  useEffect(() => {
    if (!user) return;
    loadCustomer(user.uid);
    loadGlas(user.uid);
    loadStatiegeld(user.uid);
  }, [user, loadCustomer, loadGlas, loadStatiegeld]);

  return (
    <AppLayout nav={KLANT_NAV} title={`Hoi ${user?.naam.split(' ')[0] ?? ''}`}>
      {customer && (
        <p className="-mt-3 mb-6 text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
          We komen langs op {customer.adres}, {customer.postcode} {customer.plaats}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
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
            Plastic flessen en blikjes. Je krijgt het statiegeld later via Tikkie terug.
          </p>
          <span className="cmt-btn-primary">Aanmelden</span>
        </Link>
      </div>

      <section className="cmt-flow-glas mb-8">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Wine className="w-5 h-5" style={{ color: 'var(--cmt-glas)' }} />
          Glas
        </h2>

        {glasLaadt ? (
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

        {statLaadt ? (
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
                  </div>
                  <StatiegeldStatusBadge status={log.status} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppLayout>
  );
};

export default Overzicht;
