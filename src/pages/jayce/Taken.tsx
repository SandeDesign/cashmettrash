// src/pages/jayce/Taken.tsx
//
// Jayce ziet glas- en statiegeldtaken strikt gescheiden (groen vs blauw) en
// nooit bedragen — niet bij glas en niet bij statiegeld. Dat voorkomt verwarring
// over wie wat krijgt, en de security rules dwingen hetzelfde af.

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Check, MapPin, PartyPopper, Recycle, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Loading from '../../components/shared/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { mapsLink } from '../../utils/constants';
import type { GlasOrder, StatiegeldItems, StatiegeldLog } from '../../types';

const datum = (iso: string) => format(new Date(iso), 'd MMM', { locale: nl });

const AdresRegel: React.FC<{ adres: string; postcode: string; plaats: string; naam: string }> = ({
  adres,
  postcode,
  plaats,
  naam,
}) => (
  <>
    <p className="font-bold">{naam}</p>
    <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
      {adres}
      <br />
      {postcode} {plaats}
    </p>
    <a
      href={mapsLink(adres, postcode, plaats)}
      target="_blank"
      rel="noopener noreferrer"
      className="cmt-btn-secondary !py-2 !px-3 !text-sm mt-3"
    >
      <MapPin className="w-4 h-4" /> Navigeer
    </a>
  </>
);

const GlasTaak: React.FC<{ order: GlasOrder; onKlaar: () => Promise<void> }> = ({
  order,
  onKlaar,
}) => {
  const [bezig, setBezig] = useState(false);

  return (
    <li className="cmt-card cmt-card-flow cmt-animate-in">
      <div className="flex items-start justify-between gap-3 mb-1">
        <span className="cmt-badge cmt-badge-glas">
          <Wine className="w-3.5 h-3.5" /> Glas
        </span>
        <span className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
          {datum(order.aangemaaktOp)}
        </span>
      </div>

      <AdresRegel
        naam={order.customerNaam}
        adres={order.adres}
        postcode={order.postcode}
        plaats={order.plaats}
      />

      {order.opmerking && (
        <p className="mt-3 text-sm cmt-card cmt-card-tint !p-3">{order.opmerking}</p>
      )}

      <button
        className="cmt-btn-primary cmt-btn-block mt-4"
        disabled={bezig}
        onClick={async () => {
          setBezig(true);
          try {
            await onKlaar();
          } finally {
            setBezig(false);
          }
        }}
      >
        <Check className="w-4 h-4" /> {bezig ? 'Bezig...' : 'Opgehaald'}
      </button>
    </li>
  );
};

const StatiegeldTaak: React.FC<{
  log: StatiegeldLog;
  onKlaar: (items: StatiegeldItems) => Promise<void>;
}> = ({ log, onKlaar }) => {
  const [plastic, setPlastic] = useState(log.items.plastic);
  const [blik, setBlik] = useState(log.items.blik);
  const [bezig, setBezig] = useState(false);

  return (
    <li className="cmt-card cmt-card-flow cmt-animate-in">
      <div className="flex items-start justify-between gap-3 mb-1">
        <span className="cmt-badge cmt-badge-stat">
          <Recycle className="w-3.5 h-3.5" /> Statiegeld
        </span>
        <span className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
          {datum(log.aangemaaktOp)}
        </span>
      </div>

      <AdresRegel
        naam={log.customerNaam}
        adres={log.adres}
        postcode={log.postcode}
        plaats={log.plaats}
      />

      {log.opmerking && <p className="mt-3 text-sm cmt-card cmt-card-tint !p-3">{log.opmerking}</p>}

      <p className="cmt-label mt-4 !mb-2">
        Hoeveel heb je opgehaald? (schatting: {log.items.plastic} flessen, {log.items.blik} blikjes)
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="cmt-label !text-xs" htmlFor={`plastic-${log.id}`}>
            Flessen
          </label>
          <input
            id={`plastic-${log.id}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            className="cmt-input"
            value={plastic}
            onChange={(e) => setPlastic(Math.max(0, Math.min(999, Number(e.target.value) || 0)))}
          />
        </div>
        <div>
          <label className="cmt-label !text-xs" htmlFor={`blik-${log.id}`}>
            Blikjes
          </label>
          <input
            id={`blik-${log.id}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            className="cmt-input"
            value={blik}
            onChange={(e) => setBlik(Math.max(0, Math.min(999, Number(e.target.value) || 0)))}
          />
        </div>
      </div>

      <button
        className="cmt-btn-primary cmt-btn-block mt-4"
        disabled={bezig}
        onClick={async () => {
          setBezig(true);
          try {
            await onKlaar({ plastic, blik });
          } finally {
            setBezig(false);
          }
        }}
      >
        <Check className="w-4 h-4" /> {bezig ? 'Bezig...' : 'Opgehaald'}
      </button>
    </li>
  );
};

const Taken: React.FC = () => {
  const { user } = useAuth();
  const {
    orders,
    loading: glasLaadt,
    error: glasFout,
    loadOpenstaand: loadGlas,
    markeerOpgehaald: glasOpgehaald,
  } = useGlasStore();
  const {
    logs,
    loading: statLaadt,
    error: statFout,
    loadOpenstaand: loadStatiegeld,
    markeerOpgehaald: statiegeldOpgehaald,
  } = useStatiegeldStore();

  useEffect(() => {
    loadGlas();
    loadStatiegeld();
  }, [loadGlas, loadStatiegeld]);

  const openGlas = orders.filter((o) => o.status !== 'opgehaald');
  const openStatiegeld = logs.filter((l) => l.status === 'aangemeld');
  const laadt = glasLaadt || statLaadt;
  const fout = glasFout || statFout;
  const niksTeDoen = !laadt && openGlas.length === 0 && openStatiegeld.length === 0;

  return (
    <AppLayout title="Ophalen">
      {fout && <div className="cmt-alert cmt-alert-error mb-4">{fout}</div>}

      {laadt && orders.length === 0 && logs.length === 0 && <Loading text="Taken laden..." />}

      {niksTeDoen && (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <PartyPopper className="w-6 h-6" />
          </span>
          <p className="font-semibold" style={{ color: 'var(--cmt-ink)' }}>
            Alles opgehaald
          </p>
          <p className="text-sm mt-1">Er staat op dit moment niets klaar.</p>
        </div>
      )}

      {openGlas.length > 0 && (
        <section className="cmt-flow-glas mb-8">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Wine className="w-5 h-5" style={{ color: 'var(--cmt-glas)' }} />
            Glas
            <span className="cmt-badge cmt-badge-glas">{openGlas.length}</span>
          </h2>
          <ul className="space-y-3">
            {openGlas.map((order) => (
              <GlasTaak
                key={order.id}
                order={order}
                onKlaar={() => glasOpgehaald(order.id, user!.uid)}
              />
            ))}
          </ul>
        </section>
      )}

      {openStatiegeld.length > 0 && (
        <section className="cmt-flow-stat">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Recycle className="w-5 h-5" style={{ color: 'var(--cmt-stat)' }} />
            Statiegeld
            <span className="cmt-badge cmt-badge-stat">{openStatiegeld.length}</span>
          </h2>
          <ul className="space-y-3">
            {openStatiegeld.map((log) => (
              <StatiegeldTaak
                key={log.id}
                log={log}
                onKlaar={(items) => statiegeldOpgehaald(log.id, user!.uid, items)}
              />
            ))}
          </ul>
        </section>
      )}
    </AppLayout>
  );
};

export default Taken;
