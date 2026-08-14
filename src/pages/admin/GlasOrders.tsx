// src/pages/admin/GlasOrders.tsx
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Download } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { GlasStatusBadge } from '../../components/common/StatusBadge';
import { useGlasStore } from '../../store/glasStore';
import { formatCenten, GLAS_STATUS_LABEL } from '../../utils/constants';
import { centenVoorCsv, downloadCsv, naarCsv } from '../../utils/csv';
import type { GlasStatus } from '../../types';

const STATUSSEN = Object.keys(GLAS_STATUS_LABEL) as GlasStatus[];

const datumTijd = (iso?: string) =>
  iso ? format(new Date(iso), 'd MMM yyyy HH:mm', { locale: nl }) : '';

const GlasOrders: React.FC = () => {
  const { orders, loading, error, loadAlle, setStatus } = useGlasStore();
  const [filter, setFilter] = useState<GlasStatus | 'alle'>('alle');

  useEffect(() => {
    loadAlle();
  }, [loadAlle]);

  const zichtbaar = filter === 'alle' ? orders : orders.filter((o) => o.status === filter);

  const exporteer = () => {
    const csv = naarCsv(
      ['Order', 'Klant', 'Adres', 'Postcode', 'Plaats', 'Status', 'Bedrag', 'Aangemeld', 'Betaald', 'Opgehaald', 'Stripe sessie', 'Contant', 'Contant bevestigd'],
      zichtbaar.map((o) => [
        o.id,
        o.customerNaam,
        o.adres,
        o.postcode,
        o.plaats,
        GLAS_STATUS_LABEL[o.status],
        centenVoorCsv(o.bedrag),
        datumTijd(o.aangemaaktOp),
        datumTijd(o.betaaldOp),
        datumTijd(o.opgehaaldOp),
        o.stripeSessionId ?? '',
        o.contant ? 'ja' : 'nee',
        datumTijd(o.contantBevestigdOp),
      ])
    );
    downloadCsv(`glas-orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <AppLayout nav={ADMIN_NAV} title="Glas-orders">
      <div className="cmt-flow-glas">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select
            className="cmt-select !w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value as GlasStatus | 'alle')}
            aria-label="Filter op status"
          >
            <option value="alle">Alle statussen</option>
            {STATUSSEN.map((s) => (
              <option key={s} value={s}>
                {GLAS_STATUS_LABEL[s]}
              </option>
            ))}
          </select>

          <span className="text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
            {zichtbaar.length} van {orders.length}
          </span>

          <button
            className="cmt-btn-secondary ml-auto"
            onClick={exporteer}
            disabled={zichtbaar.length === 0}
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>

        {error && <div className="cmt-alert cmt-alert-error mb-4">{error}</div>}

        {loading && orders.length === 0 ? (
          <Loading />
        ) : zichtbaar.length === 0 ? (
          <div className="cmt-card cmt-empty-state">Geen orders gevonden.</div>
        ) : (
          <div className="cmt-card !p-0 overflow-x-auto">
            <table className="cmt-table">
              <thead>
                <tr>
                  <th>Klant</th>
                  <th>Adres</th>
                  <th>Aangemeld</th>
                  <th>Bedrag</th>
                  <th>Betaling</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {zichtbaar.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">{order.customerNaam}</td>
                    <td>
                      {order.adres}
                      <br />
                      <span style={{ color: 'var(--cmt-ink-muted)' }}>
                        {order.postcode} {order.plaats}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">{datumTijd(order.aangemaaktOp)}</td>
                    <td className="whitespace-nowrap">{formatCenten(order.bedrag)}</td>
                    <td>
                      {order.contant ? (
                        <span
                          className={`cmt-badge ${order.contantBevestigdOp ? 'cmt-badge-done' : 'cmt-badge-warning'}`}
                        >
                          {order.contantBevestigdOp ? 'Contant voldaan' : 'Contant, wacht op mama'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--cmt-ink-muted)' }}>
                          {order.stripeStatus ?? 'geen'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <GlasStatusBadge status={order.status} />
                        <select
                          className="cmt-select !w-auto !py-1 !text-xs"
                          value={order.status}
                          onChange={(e) => setStatus(order.id, e.target.value as GlasStatus)}
                          aria-label={`Status wijzigen voor ${order.customerNaam}`}
                        >
                          {STATUSSEN.map((s) => (
                            <option key={s} value={s}>
                              {GLAS_STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default GlasOrders;
