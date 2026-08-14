// src/pages/admin/Ophalen.tsx
//
// Alles wat op de lijst van Jayce staat, glas en statiegeld door elkaar, want zo
// rijdt hij zijn ronde ook. De pagina's Glas en Statiegeld gaan over de
// administratie eromheen; deze gaat puur over het ophalen zelf.

import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, isTomorrow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarClock, CheckCircle, Clock, MapPin, Recycle, Trash2, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { mapsLink } from '../../utils/constants';

interface Rit {
  id: string;
  soort: 'glas' | 'statiegeld';
  naam: string;
  adres: string;
  postcode: string;
  plaats: string;
  aangemaaktOp: string;
  /** Wat er klaarstaat, alleen bij statiegeld. */
  omschrijving: string;
  geplandVan?: string;
  geplandTot?: string;
  voorkeurVan?: string;
  /** Waar de administratie van deze rit staat. */
  naar: string;
}

const datum = (iso: string) => format(new Date(iso), 'd MMM', { locale: nl });

function moment(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return 'vandaag';
  if (isTomorrow(d)) return 'morgen';
  return format(d, 'EEEE d MMM', { locale: nl });
}

const RitKaart: React.FC<{ rit: Rit; onVerwijder: (rit: Rit) => void }> = ({
  rit,
  onVerwijder,
}) => (
  <li
    className={`cmt-flow-${rit.soort === 'glas' ? 'glas' : 'stat'} cmt-card cmt-card-flow`}
  >
    <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
      <span className={`cmt-badge cmt-badge-${rit.soort === 'glas' ? 'glas' : 'stat'}`}>
        {rit.soort === 'glas' ? (
          <Wine className="w-3.5 h-3.5" />
        ) : (
          <Recycle className="w-3.5 h-3.5" />
        )}
        {rit.omschrijving}
      </span>
      <span className="text-xs ml-auto" style={{ color: 'var(--cmt-ink-muted)' }}>
        aangemeld {datum(rit.aangemaaktOp)}
      </span>
    </div>

    <p className="font-semibold mt-2">{rit.naam}</p>
    <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
      {rit.adres}, {rit.postcode} {rit.plaats}
    </p>

    {rit.geplandVan && rit.geplandTot ? (
      <p className="text-sm mt-2 flex items-center gap-1.5 font-medium">
        <CalendarClock className="w-4 h-4" />
        Jayce komt {moment(rit.geplandVan)} tussen {format(new Date(rit.geplandVan), 'HH:mm')} en{' '}
        {format(new Date(rit.geplandTot), 'HH:mm')}
      </p>
    ) : rit.voorkeurVan ? (
      <p className="text-sm mt-2" style={{ color: 'var(--cmt-ink-muted)' }}>
        De klant vroeg om {moment(rit.voorkeurVan)}
      </p>
    ) : null}

    <div className="flex flex-wrap gap-2 mt-3">
      <a
        href={mapsLink(rit.adres, rit.postcode, rit.plaats)}
        target="_blank"
        rel="noopener noreferrer"
        className="cmt-btn-ghost !py-2 !text-sm"
      >
        <MapPin className="w-4 h-4" /> Op de kaart
      </a>
      <Link to={rit.naar} className="cmt-btn-ghost !py-2 !text-sm">
        Naar de administratie
      </Link>
      {/* Tijdens het testen schieten er aanvragen in die je zo weer kwijt wilt.
          Verwijderen kan alleen de beheerder, en alleen na bevestigen. */}
      <button
        className="cmt-btn-ghost !py-2 !text-sm ml-auto"
        style={{ color: 'var(--cmt-error)' }}
        onClick={() => onVerwijder(rit)}
      >
        <Trash2 className="w-4 h-4" /> Verwijderen
      </button>
    </div>
  </li>
);

const Ophalen: React.FC = () => {
  const { orders, loading: glasLaadt, loadAlle: loadGlas, verwijderOrder } = useGlasStore();
  const {
    logs,
    loading: statLaadt,
    loadAlle: loadStatiegeld,
    verwijderLog,
  } = useStatiegeldStore();

  const verwijder = async (rit: Rit) => {
    const bevestigd = window.confirm(
      `Aanvraag van ${rit.naam} verwijderen? Dit kan niet ongedaan gemaakt worden.`
    );
    if (!bevestigd) return;

    if (rit.soort === 'glas') await verwijderOrder(rit.id);
    else await verwijderLog(rit.id);
  };

  useEffect(() => {
    loadGlas();
    loadStatiegeld();
  }, [loadGlas, loadStatiegeld]);

  const { teBevestigen, ingepland } = useMemo(() => {
    const uitGlas: Rit[] = orders
      .filter((o) => o.status === 'betaald' || o.status === 'ingepland')
      .map((o) => ({
        id: o.id,
        soort: 'glas' as const,
        naam: o.customerNaam,
        adres: o.adres,
        postcode: o.postcode,
        plaats: o.plaats,
        aangemaaktOp: o.aangemaaktOp,
        omschrijving: 'Glas',
        geplandVan: o.geplandVan,
        geplandTot: o.geplandTot,
        voorkeurVan: o.voorkeurVan,
        naar: '/admin/glas',
      }));

    const uitStatiegeld: Rit[] = logs
      .filter((l) => l.status === 'aangemeld' || l.status === 'ingepland')
      .map((l) => ({
        id: l.id,
        soort: 'statiegeld' as const,
        naam: l.customerNaam,
        adres: l.adres,
        postcode: l.postcode,
        plaats: l.plaats,
        aangemaaktOp: l.aangemaaktOp,
        omschrijving: `${l.items.plastic} flessen · ${l.items.blik} blikjes`,
        geplandVan: l.geplandVan,
        geplandTot: l.geplandTot,
        voorkeurVan: l.voorkeurVan,
        naar: '/admin/statiegeld',
      }));

    const alles = [...uitGlas, ...uitStatiegeld].sort((a, b) =>
      a.aangemaaktOp.localeCompare(b.aangemaaktOp)
    );

    return {
      teBevestigen: alles.filter((r) => !r.geplandVan),
      ingepland: alles
        .filter((r) => r.geplandVan)
        .sort((a, b) => a.geplandVan!.localeCompare(b.geplandVan!)),
    };
  }, [orders, logs]);

  if ((glasLaadt || statLaadt) && orders.length === 0 && logs.length === 0) {
    return (
      <AppLayout nav={ADMIN_NAV} title="Ophaalronde">
        <Loading />
      </AppLayout>
    );
  }

  return (
    <AppLayout nav={ADMIN_NAV} title="Ophaalronde">
      <p className="cmt-lead mb-6">
        Wat er op de lijst van Jayce staat. Hier hoef jij niets te doen: hij bevestigt zelf
        wanneer hij langskomt en vinkt af zodra hij het heeft opgehaald.
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: 'var(--cmt-warning)' }} />
          Wacht op Jayce
          {teBevestigen.length > 0 && (
            <span className="cmt-badge cmt-badge-warning">{teBevestigen.length}</span>
          )}
        </h2>
        <p className="text-sm mb-3" style={{ color: 'var(--cmt-ink-muted)' }}>
          Hij heeft nog niet gezegd wanneer hij komt.
        </p>

        {teBevestigen.length === 0 ? (
          <div className="cmt-card cmt-empty-state !py-6">
            <span className="cmt-empty-state-icon">
              <CheckCircle className="w-6 h-6" />
            </span>
            <p>Alles is bevestigd.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {teBevestigen.map((rit) => (
              <RitKaart key={rit.id} rit={rit} onVerwijder={verwijder} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <CalendarClock className="w-5 h-5" style={{ color: 'var(--cmt-glas)' }} />
          Ingepland
          {ingepland.length > 0 && (
            <span className="cmt-badge cmt-badge-glas">{ingepland.length}</span>
          )}
        </h2>
        <p className="text-sm mb-3" style={{ color: 'var(--cmt-ink-muted)' }}>
          De klant weet hiervan; die heeft er een melding over gehad.
        </p>

        {ingepland.length === 0 ? (
          <div className="cmt-card cmt-empty-state !py-6">
            <p>Er staat nog niets ingepland.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {ingepland.map((rit) => (
              <RitKaart key={rit.id} rit={rit} onVerwijder={verwijder} />
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  );
};

export default Ophalen;
