// src/pages/admin/StatiegeldLog.tsx
//
// Statiegeld-administratie, gegroepeerd per klant.
//
// Per melding is er één duidelijke vervolgstap in plaats van een rij knoppen
// naast elkaar. Het afrekenen zelf gebeurt in een apart scherm, zodat je rustig
// het bedrag en de link uit Viatim kunt overnemen.

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Check, Download, ExternalLink, Recycle, Wallet } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import AfrekenSheet from '../../components/admin/AfrekenSheet';
import { StatiegeldStatusBadge } from '../../components/common/StatusBadge';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { useChatStore } from '../../store/chatStore';
import { stuurPushNaarKlant } from '../../utils/push';
import {
  formatCenten,
  SERVICEKOSTEN_STATUS_LABEL,
  STATIEGELD_STATUS_LABEL,
} from '../../utils/constants';
import { centenVoorCsv, downloadCsv, naarCsv } from '../../utils/csv';
import type { StatiegeldLog as StatiegeldLogType } from '../../types';

const datumTijd = (iso?: string) =>
  iso ? format(new Date(iso), 'd MMM yyyy HH:mm', { locale: nl }) : '';

const datum = (iso: string) => format(new Date(iso), 'd MMM', { locale: nl });

/** Wat er voor deze melding als eerstvolgende moet gebeuren. */
function volgendeStap(log: StatiegeldLogType): string | null {
  if (log.status === 'aangemeld') return 'Wacht op Jayce';
  if (log.status === 'opgehaald') return 'Afrekenen';
  if (log.status === 'verwerktBijViatim') return 'Afrekenen';
  if (log.servicekostenStatus === 'openstaand') return 'Wacht op betaling';
  return null;
}

const StatiegeldLogPagina: React.FC = () => {
  const { logs, loading, error, loadAlle, markeerVerwerkt, rekenAf } = useStatiegeldStore();
  const stuurBericht = useChatStore((s) => s.stuurBericht);

  const [alleenOpenstaand, setAlleenOpenstaand] = useState(true);
  const [afrekenen, setAfrekenen] = useState<StatiegeldLogType | null>(null);

  useEffect(() => {
    loadAlle();
  }, [loadAlle]);

  // Openstaand is alles waar nog iets voor moet gebeuren: nog niet afgerekend,
  // of afgerekend maar de ophaalkosten staan nog open.
  const zichtbaar = alleenOpenstaand
    ? logs.filter((l) => l.status !== 'tikkieVerstuurd' || l.servicekostenStatus === 'openstaand')
    : logs;

  /** Gegroepeerd per klant, zodat je alles van één persoon bij elkaar ziet. */
  const perKlant = useMemo(() => {
    const groepen = new Map<string, { naam: string; items: StatiegeldLogType[] }>();
    for (const log of zichtbaar) {
      const groep = groepen.get(log.customerId) ?? { naam: log.customerNaam, items: [] };
      groep.items.push(log);
      groepen.set(log.customerId, groep);
    }
    return [...groepen.entries()].sort((a, b) => a[1].naam.localeCompare(b[1].naam, 'nl'));
  }, [zichtbaar]);

  const teAfrekenen = zichtbaar.filter(
    (l) => l.status === 'opgehaald' || l.status === 'verwerktBijViatim'
  ).length;

  /**
   * Rondt af en stuurt de Tikkie meteen naar de klant. Is het statiegeld
   * geschonken, dan gaat het bedrag naar het potje van Jayce en krijgt de klant
   * alleen een bedankje, geen Tikkie en geen ophaalkosten.
   */
  const handelAf = async (log: StatiegeldLogType, centen: number, link: string) => {
    await rekenAf(log.id, centen, link);

    if (log.geschonken) {
      await stuurBericht({
        customerId: log.customerId,
        customerNaam: log.customerNaam,
        afzender: 'admin',
        tekst:
          `Je statiegeld is ingeleverd en heeft ${formatCenten(centen)} opgebracht. ` +
          'Dat bedrag gaat naar het potje van Jayce. Bedankt namens hem!',
        statiegeldLogId: log.id,
      });
      void stuurPushNaarKlant(log.customerId, {
        titel: 'Bedankt voor je gift',
        tekst: `Je statiegeld heeft ${formatCenten(centen)} opgebracht voor Jayce.`,
        url: '/chat',
      });
      setAfrekenen(null);
      return;
    }

    await stuurBericht({
      customerId: log.customerId,
      customerNaam: log.customerNaam,
      afzender: 'admin',
      tekst:
        `Je statiegeld is ingeleverd. Je krijgt ${formatCenten(centen)} terug via de Tikkie hieronder. ` +
        `Voor het ophalen rekenen we ${formatCenten(log.servicekosten)}, die kun je hier meteen voldoen.`,
      tikkieLink: link,
      statiegeldLogId: log.id,
    });
    void stuurPushNaarKlant(log.customerId, {
      titel: 'Je Tikkie staat klaar',
      tekst: `Je krijgt ${formatCenten(centen)} terug voor je statiegeld.`,
      url: '/chat',
    });
    setAfrekenen(null);
  };

  const exporteer = () => {
    const csv = naarCsv(
      [
        'Melding', 'Klant', 'Adres', 'Postcode', 'Plaats', 'Status',
        'Schatting flessen', 'Schatting blik', 'Geteld flessen', 'Geteld blik',
        'Aangemeld', 'Opgehaald', 'Verwerkt', 'Tikkie verstuurd', 'Tikkie bedrag',
        'Ophaalkosten', 'Ophaalkosten status', 'Ophaalkosten betaald',
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
        centenVoorCsv(l.servicekosten),
        SERVICEKOSTEN_STATUS_LABEL[l.servicekostenStatus],
        datumTijd(l.servicekostenBetaaldOp),
      ])
    );
    downloadCsv(`statiegeld-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <AppLayout nav={ADMIN_NAV} title="Statiegeld">
      <div className="cmt-flow-stat">
        {teAfrekenen > 0 && (
          <div className="cmt-card cmt-card-tint cmt-card-flow mb-5">
            <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--cmt-stat)' }}>
              <Wallet className="w-5 h-5" />
              <span className="font-bold">
                {teAfrekenen} {teAfrekenen === 1 ? 'melding' : 'meldingen'} klaar om af te rekenen
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
              Scan ze in bij Viatim en neem het bedrag en de Tikkie-link hier over.
            </p>
          </div>
        )}

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
          <div className="cmt-card cmt-empty-state">
            <span className="cmt-empty-state-icon">
              <Check className="w-6 h-6" />
            </span>
            <p>Niets openstaand. Alles is afgerekend.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {perKlant.map(([customerId, groep]) => (
              <section key={customerId} className="cmt-card cmt-card-flow !p-0 overflow-hidden">
                <header className="px-5 pt-4 pb-3">
                  <h2 className="font-bold">{groep.naam}</h2>
                  <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                    {groep.items[0].adres}, {groep.items[0].postcode} {groep.items[0].plaats}
                  </p>
                </header>

                <ul>
                  {groep.items.map((log) => {
                    const geteld = log.itemsWerkelijk ?? log.items;
                    const stap = volgendeStap(log);
                    const kanAfrekenen =
                      log.status === 'opgehaald' || log.status === 'verwerktBijViatim';

                    return (
                      <li
                        key={log.id}
                        className="px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-3"
                        style={{ borderTop: '1px solid var(--cmt-border)' }}
                      >
                        <div className="flex-1 min-w-[12rem]">
                          <p className="font-semibold text-sm flex items-center gap-1.5">
                            <Recycle className="w-4 h-4" style={{ color: 'var(--cmt-stat)' }} />
                            {geteld.plastic} flessen · {geteld.blik} blikjes
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--cmt-ink-muted)' }}>
                            Aangemeld {datum(log.aangemaaktOp)}
                            {log.tikkieBedrag != null && ` · Tikkie ${formatCenten(log.tikkieBedrag)}`}
                            {log.servicekostenStatus === 'betaald' && ' · ophaalkosten betaald'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <StatiegeldStatusBadge status={log.status} />
                          {log.servicekostenStatus === 'openstaand' && (
                            <span className="cmt-badge cmt-badge-warning">
                              {formatCenten(log.servicekosten)} open
                            </span>
                          )}
                        </div>

                        {/* Eén duidelijke vervolgstap per regel. */}
                        <div className="w-full sm:w-auto sm:ml-auto">
                          {kanAfrekenen ? (
                            <button
                              className="cmt-btn-primary cmt-btn-block sm:!w-auto"
                              onClick={() => setAfrekenen(log)}
                            >
                              <ExternalLink className="w-4 h-4" /> Afrekenen
                            </button>
                          ) : (
                            stap && (
                              <span className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                                {stap}
                              </span>
                            )
                          )}
                        </div>

                        {/* Losse tussenstap, voor als de Tikkie er nog niet is. */}
                        {log.status === 'opgehaald' && (
                          <button
                            className="cmt-btn-ghost !py-1.5 !px-2 !text-xs w-full sm:w-auto"
                            onClick={() => markeerVerwerkt(log.id)}
                          >
                            Alleen ingescand bij Viatim
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {afrekenen && (
        <AfrekenSheet
          log={afrekenen}
          onSluiten={() => setAfrekenen(null)}
          onAfrekenen={(centen, link) => handelAf(afrekenen, centen, link)}
        />
      )}
    </AppLayout>
  );
};

export default StatiegeldLogPagina;
