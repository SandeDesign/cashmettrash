// src/pages/jayce/Taken.tsx
//
// De pagina van Jayce. Twee dingen zijn hier leidend:
//
// 1. De taal is voor een tienjarige. Korte zinnen, "je" en "jij", geen woorden
//    als melding, verwerken of status. Foutmeldingen uit Firebase worden nooit
//    rauw getoond, want die zijn onleesbaar.
// 2. Nergens een bedrag, niet bij glas en niet bij statiegeld. Dat voorkomt
//    verwarring over wie wat krijgt, en de security rules dwingen hetzelfde af.

import React, { useEffect, useState } from 'react';
import { format, isToday } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Check, MapPin, PartyPopper, Recycle, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { JAYCE_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import MeldingenKaart from '../../components/common/MeldingenKaart';
import { useAuth } from '../../hooks/useAuth';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { mapsLink } from '../../utils/constants';
import { stuurPushNaarRol } from '../../utils/push';
import type { GlasOrder, StatiegeldItems, StatiegeldLog } from '../../types';

const wanneer = (iso: string) =>
  isToday(new Date(iso)) ? 'vandaag' : format(new Date(iso), 'd MMM', { locale: nl });

const AdresKaartje: React.FC<{
  naam: string;
  adres: string;
  postcode: string;
  plaats: string;
}> = ({ naam, adres, postcode, plaats }) => (
  <>
    <p className="text-lg font-bold">{naam}</p>
    <p className="text-base" style={{ color: 'var(--cmt-ink-soft)' }}>
      {adres}
      <br />
      {postcode} {plaats}
    </p>
    <a
      href={mapsLink(adres, postcode, plaats)}
      target="_blank"
      rel="noopener noreferrer"
      className="cmt-btn-secondary mt-3"
    >
      <MapPin className="w-5 h-5" /> Laat me de weg zien
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
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="cmt-badge cmt-badge-glas">
          <Wine className="w-3.5 h-3.5" /> Flessen van glas
        </span>
        <span className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
          {wanneer(order.aangemaaktOp)}
        </span>
      </div>

      <AdresKaartje
        naam={order.customerNaam}
        adres={order.adres}
        postcode={order.postcode}
        plaats={order.plaats}
      />

      {order.opmerking && (
        <p className="mt-3 text-base cmt-card cmt-card-tint !p-3">
          <span className="font-semibold">Berichtje: </span>
          {order.opmerking}
        </p>
      )}

      <button
        className="cmt-btn-primary cmt-btn-block cmt-btn-lg mt-4"
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
        <Check className="w-5 h-5" /> {bezig ? 'Momentje...' : 'Ik heb het opgehaald'}
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
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="cmt-badge cmt-badge-stat">
          <Recycle className="w-3.5 h-3.5" /> Flesjes en blikjes
        </span>
        <span className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
          {wanneer(log.aangemaaktOp)}
        </span>
      </div>

      <AdresKaartje
        naam={log.customerNaam}
        adres={log.adres}
        postcode={log.postcode}
        plaats={log.plaats}
      />

      {log.opmerking && (
        <p className="mt-3 text-base cmt-card cmt-card-tint !p-3">
          <span className="font-semibold">Berichtje: </span>
          {log.opmerking}
        </p>
      )}

      <p className="mt-4 mb-1 text-base font-semibold">Hoeveel heb je meegenomen?</p>
      <p className="text-sm mb-3" style={{ color: 'var(--cmt-ink-muted)' }}>
        Ze dachten zelf {log.items.plastic} flesjes en {log.items.blik} blikjes. Tel maar na en
        pas het aan als het anders is.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="cmt-label" htmlFor={`plastic-${log.id}`}>
            Flesjes
          </label>
          <input
            id={`plastic-${log.id}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            className="cmt-input !text-lg"
            value={plastic}
            onChange={(e) => setPlastic(Math.max(0, Math.min(999, Number(e.target.value) || 0)))}
          />
        </div>
        <div>
          <label className="cmt-label" htmlFor={`blik-${log.id}`}>
            Blikjes
          </label>
          <input
            id={`blik-${log.id}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            className="cmt-input !text-lg"
            value={blik}
            onChange={(e) => setBlik(Math.max(0, Math.min(999, Number(e.target.value) || 0)))}
          />
        </div>
      </div>

      <button
        className="cmt-btn-primary cmt-btn-block cmt-btn-lg mt-4"
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
        <Check className="w-5 h-5" /> {bezig ? 'Momentje...' : 'Ik heb het opgehaald'}
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

  const [gevierd, setGevierd] = useState(false);

  useEffect(() => {
    loadGlas();
    loadStatiegeld();
  }, [loadGlas, loadStatiegeld]);

  const openGlas = orders.filter((o) => o.status !== 'opgehaald');
  const openStatiegeld = logs.filter((l) => l.status === 'aangemeld');
  const totaal = openGlas.length + openStatiegeld.length;
  const laadt = glasLaadt || statLaadt;
  const nietsMeer = !laadt && totaal === 0;

  /** Vertelt de beheerder dat er iets is opgehaald, en viert het even. */
  const meldOpgehaald = (wat: string) => {
    void stuurPushNaarRol('admin', {
      titel: 'Jayce is langs geweest',
      tekst: wat,
      url: '/admin',
    });
    setGevierd(true);
    window.setTimeout(() => setGevierd(false), 2500);
  };

  return (
    <AppLayout nav={JAYCE_NAV} title="Wat moet ik ophalen?">
      {/* Firebase-fouten zijn onleesbaar voor een kind, dus altijd onze eigen tekst. */}
      {(glasFout || statFout) && (
        <div className="cmt-alert cmt-alert-error mb-4">
          Het laden lukte even niet. Probeer de pagina te vernieuwen.
        </div>
      )}

      {gevierd && (
        <div className="cmt-alert cmt-alert-success mb-4 cmt-animate-in">
          <PartyPopper className="w-5 h-5 flex-shrink-0" />
          <span>Top, afgevinkt!</span>
        </div>
      )}

      {laadt && orders.length === 0 && logs.length === 0 && <Loading text="Momentje..." />}

      {totaal > 0 && (
        <p className="text-base mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
          Je hebt nog <strong>{totaal}</strong> {totaal === 1 ? 'adres' : 'adressen'} te gaan.
          Veel plezier op je ronde!
        </p>
      )}

      {nietsMeer && (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <PartyPopper className="w-6 h-6" />
          </span>
          <p className="font-bold text-lg" style={{ color: 'var(--cmt-ink)' }}>
            Je bent helemaal klaar!
          </p>
          <p className="text-base mt-1">Er staat nu niets voor je klaar. Kijk straks nog eens.</p>
        </div>
      )}

      {openGlas.length > 0 && (
        <section className="cmt-flow-glas mb-8">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Wine className="w-5 h-5" style={{ color: 'var(--cmt-glas)' }} />
            Flessen van glas
            <span className="cmt-badge cmt-badge-glas">{openGlas.length}</span>
          </h2>
          <ul className="space-y-3">
            {openGlas.map((order) => (
              <GlasTaak
                key={order.id}
                order={order}
                onKlaar={async () => {
                  await glasOpgehaald(order.id, user!.uid);
                  meldOpgehaald(`Glas opgehaald bij ${order.customerNaam}.`);
                }}
              />
            ))}
          </ul>
        </section>
      )}

      {openStatiegeld.length > 0 && (
        <section className="cmt-flow-stat mb-8">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Recycle className="w-5 h-5" style={{ color: 'var(--cmt-stat)' }} />
            Flesjes en blikjes
            <span className="cmt-badge cmt-badge-stat">{openStatiegeld.length}</span>
          </h2>
          <ul className="space-y-3">
            {openStatiegeld.map((log) => (
              <StatiegeldTaak
                key={log.id}
                log={log}
                onKlaar={async (items) => {
                  await statiegeldOpgehaald(log.id, user!.uid, items);
                  meldOpgehaald(
                    `Bij ${log.customerNaam} opgehaald: ${items.plastic} flesjes, ${items.blik} blikjes.`
                  );
                }}
              />
            ))}
          </ul>
        </section>
      )}

      <MeldingenKaart
        uid={user?.uid}
        rol={user?.rol}
        titel="Wil je een seintje krijgen?"
        uitleg="Dan piept je telefoon zodra er ergens iets voor je klaarstaat."
        knopTekst="Ja, geef me een seintje"
      />
    </AppLayout>
  );
};

export default Taken;
