// src/pages/admin/StatiegeldLog.tsx
//
// Statiegeld-administratie: gegroepeerd per klant. Toont de schatting van de klant
// naast de telling van Jayce. De Tikkie wordt buiten de app verstuurd; hier wordt
// alleen handmatig gemarkeerd dat het gebeurd is.

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Check, Download, Send } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { StatiegeldStatusBadge } from '../../components/common/StatusBadge';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { formatCenten, STATIEGELD_STATUS_LABEL } from '../../utils/constants';
import { centenVoorCsv, downloadCsv, naarCsv } from '../../utils/csv';
import type { StatiegeldLog as StatiegeldLogType } from '../../types';

const datumTijd = (iso?: string) =>
  iso ? format(new Date(iso), 'd MMM yyyy HH:mm', { locale: nl }) : '';

const TikkieKnop: React.FC<{ log: StatiegeldLogType; onVerstuur: (centen: number) => Promise<void> }> = ({
  log,
  onVerstuur,
}) => {
  const [open, setOpen] = useState(false);
  const [euro, setEuro] = useState('');
  const [bezig, setBezig] = useState(false);

  if (!open) {
    return (
      <button className="cmt-btn-primary !py-1.5 !px-3 !text-xs" onClick={() => setOpen(true)}>
        <Send className="w-3.5 h-3.5" /> Tikkie verstuurd
      </button>
    );
  }

  const centen = Math.round(parseFloat(euro.replace(',', '.')) * 100);
  const geldig = Number.isFinite(centen) && centen > 0;

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!geldig) return;
        setBezig(true);
        try {
          await onVerstuur(centen);
        } finally {
          setBezig(false);
        }
      }}
    >
      <input
        className="cmt-input !w-24 !py-1.5 !text-sm"
        inputMode="decimal"
        placeholder="2,85"
        value={euro}
        onChange={(e) => setEuro(e.target.value)}
        aria-label={`Tikkie-bedrag voor ${log.customerNaam}`}
        autoFocus
      />
      <button type="submit" className="cmt-btn-primary !py-1.5 !px-3 !text-xs" disabled={!geldig || bezig}>
        {bezig ? '...' : 'Opslaan'}
      </button>
      <button type="button" className="cmt-btn-ghost !py-1.5 !px-2 !text-xs" onClick={() => setOpen(false)}>
        Annuleren
      </button>
    </form>
  );
};

const StatiegeldLogPagina: React.FC = () => {
  const { logs, loading, error, loadAlle, markeerVerwerkt, markeerTikkieVerstuurd } =
    useStatiegeldStore();
  const [alleenOpenstaand, setAlleenOpenstaand] = useState(true);

  useEffect(() => {
    loadAlle();
  }, [loadAlle]);

  const zichtbaar = alleenOpenstaand
    ? logs.filter((l) => l.status !== 'tikkieVerstuurd')
    : logs;

  /** Gegroepeerd per klant, nieuwste melding eerst binnen elke groep. */
  const perKlant = useMemo(() => {
    const groepen = new Map<string, { naam: string; items: StatiegeldLogType[] }>();
    for (const log of zichtbaar) {
      const groep = groepen.get(log.customerId) ?? { naam: log.customerNaam, items: [] };
      groep.items.push(log);
      groepen.set(log.customerId, groep);
    }
    return [...groepen.entries()].sort((a, b) => a[1].naam.localeCompare(b[1].naam, 'nl'));
  }, [zichtbaar]);

  const exporteer = () => {
    const csv = naarCsv(
      [
        'Melding', 'Klant', 'Adres', 'Postcode', 'Plaats', 'Status',
        'Schatting flessen', 'Schatting blik', 'Geteld flessen', 'Geteld blik',
        'Aangemeld', 'Opgehaald', 'Verwerkt', 'Tikkie verstuurd', 'Tikkie bedrag',
      ],
      zichtbaar.map((l) => [
        l.id,
        l.customerNaam,
        l.adres,
        l.postcode,
        l.plaats,
        STATIEGELD_STATUS_LABEL[l.status],
        l.items.plastic,
        l.items.blik,
        l.itemsWerkelijk?.plastic ?? '',
        l.itemsWerkelijk?.blik ?? '',
        datumTijd(l.aangemaaktOp),
        datumTijd(l.opgehaaldOp),
        datumTijd(l.verwerktOp),
        datumTijd(l.tikkieVerstuurdOp),
        centenVoorCsv(l.tikkieBedrag),
      ])
    );
    downloadCsv(`statiegeld-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <AppLayout nav={ADMIN_NAV} title="Statiegeld-log">
      <div className="cmt-flow-stat">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={alleenOpenstaand}
              onChange={(e) => setAlleenOpenstaand(e.target.checked)}
            />
            Alleen openstaand
          </label>

          <span className="text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
            {zichtbaar.length} van {logs.length}
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

        {loading && logs.length === 0 ? (
          <Loading />
        ) : perKlant.length === 0 ? (
          <div className="cmt-card cmt-empty-state">Niets openstaand.</div>
        ) : (
          <div className="space-y-5">
            {perKlant.map(([customerId, groep]) => (
              <section key={customerId} className="cmt-card cmt-card-flow">
                <header className="mb-3">
                  <h2 className="font-bold">{groep.naam}</h2>
                  <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                    {groep.items[0].adres}, {groep.items[0].postcode} {groep.items[0].plaats}
                  </p>
                </header>

                <ul className="space-y-3">
                  {groep.items.map((log) => (
                    <li
                      key={log.id}
                      className="pt-3 flex flex-wrap items-center gap-3"
                      style={{ borderTop: '1px solid var(--cmt-border)' }}
                    >
                      <div className="flex-1 min-w-[14rem]">
                        <p className="text-sm">
                          <span style={{ color: 'var(--cmt-ink-muted)' }}>Schatting klant:</span>{' '}
                          {log.items.plastic} flessen, {log.items.blik} blikjes
                        </p>
                        <p className="text-sm font-semibold">
                          <span className="font-normal" style={{ color: 'var(--cmt-ink-muted)' }}>
                            Geteld door Jayce:
                          </span>{' '}
                          {log.itemsWerkelijk
                            ? `${log.itemsWerkelijk.plastic} flessen, ${log.itemsWerkelijk.blik} blikjes`
                            : 'nog niet opgehaald'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--cmt-ink-muted)' }}>
                          Aangemeld {datumTijd(log.aangemaaktOp)}
                          {log.tikkieBedrag != null && ` · Tikkie ${formatCenten(log.tikkieBedrag)}`}
                        </p>
                      </div>

                      <StatiegeldStatusBadge status={log.status} />

                      {log.status === 'opgehaald' && (
                        <button
                          className="cmt-btn-secondary !py-1.5 !px-3 !text-xs"
                          onClick={() => markeerVerwerkt(log.id)}
                        >
                          <Check className="w-3.5 h-3.5" /> Verwerkt bij Viatim
                        </button>
                      )}

                      {log.status === 'verwerktBijViatim' && (
                        <TikkieKnop
                          log={log}
                          onVerstuur={(centen) => markeerTikkieVerstuurd(log.id, centen)}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StatiegeldLogPagina;
