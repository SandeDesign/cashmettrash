// src/pages/jayce/Taken.tsx
//
// De pagina van Jayce. Drie dingen zijn hier leidend:
//
// 1. De taal is voor een tienjarige. Korte zinnen, "je" en "jij", geen woorden
//    als melding, verwerken of status. Foutmeldingen uit Firebase worden nooit
//    rauw getoond, want die zijn onleesbaar.
// 2. Nergens een bedrag, niet bij glas en niet bij statiegeld. Dat voorkomt
//    verwarring over wie wat krijgt, en de security rules dwingen hetzelfde af.
// 3. Elke taak gaat in twee stappen: eerst zeggen wanneer je komt, daarna
//    afvinken dat je het hebt opgehaald. Zo weet de klant waar hij aan toe is.

import React, { useEffect, useState } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarClock, Check, PartyPopper, Recycle, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { JAYCE_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import MeldingenKaart from '../../components/common/MeldingenKaart';
import AantalVeld from '../../components/common/AantalVeld';
import TijdslotKiezer from '../../components/jayce/TijdslotKiezer';
import AdresKaart from '../../components/kaart/AdresKaart';
import { useAuth } from '../../hooks/useAuth';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { useCustomerStore } from '../../store/customerStore';
import { useInstellingenStore } from '../../store/instellingenStore';
import type { Punt } from '../../utils/geo';
import { stuurPushNaarKlant, stuurPushNaarRol } from '../../utils/push';
import type { GlasOrder, StatiegeldItems, StatiegeldLog, Tijdslot } from '../../types';

const wanneer = (iso: string) =>
  isToday(new Date(iso)) ? 'vandaag' : format(new Date(iso), 'd MMM', { locale: nl });

/** "vandaag", "morgen" of "woensdag 20 augustus". */
function dagInWoorden(iso: string): string {
  const datum = new Date(iso);
  if (isToday(datum)) return 'vandaag';
  if (isTomorrow(datum)) return 'morgen';
  return format(datum, 'EEEE d MMMM', { locale: nl });
}

const AdresKaartje: React.FC<{
  naam: string;
  adres: string;
  postcode: string;
  plaats: string;
  punt?: Punt | null;
  thuis?: Punt | null;
}> = ({ naam, adres, postcode, plaats, punt, thuis }) => (
  <>
    <p className="text-lg font-bold">{naam}</p>
    <p className="text-base" style={{ color: 'var(--cmt-ink-soft)' }}>
      {adres}
      <br />
      {postcode} {plaats}
    </p>
    <AdresKaart
      adres={adres}
      postcode={postcode}
      plaats={plaats}
      punt={punt}
      thuis={thuis}
    />
  </>
);

/** Het balkje dat laat zien wanneer je hebt gezegd dat je komt. */
const AfspraakBalk: React.FC<{ van: string; tot: string }> = ({ van, tot }) => (
  <p className="mt-3 cmt-card cmt-card-tint !p-3 flex items-start gap-2 text-base">
    <CalendarClock className="w-5 h-5 flex-shrink-0 mt-0.5" />
    <span>
      Je gaat <strong className="capitalize">{dagInWoorden(van)}</strong> tussen{' '}
      {format(new Date(van), 'HH:mm')} en {format(new Date(tot), 'HH:mm')}.
    </span>
  </p>
);

/** Wat de klant zelf het handigst vond. Jayce mag er van afwijken. */
const VoorkeurBalk: React.FC<{ van: string }> = ({ van }) => (
  <p className="mt-3 text-base" style={{ color: 'var(--cmt-ink-soft)' }}>
    Ze zouden het fijn vinden als je <strong className="capitalize">{dagInWoorden(van)}</strong>{' '}
    komt. Kan dat niet? Kies dan gewoon iets anders.
  </p>
);

/**
 * De twee knoppen onder een taak. Staat de taak nog op aangemeld, dan kies je
 * eerst een tijd; daarna verschijnt de knop om af te vinken.
 */
const TaakKnoppen: React.FC<{
  ingepland: boolean;
  sloten: Tijdslot[];
  voorkeurId?: string;
  onInplannen: (slot: Tijdslot, van: Date, tot: Date) => Promise<void>;
  onKlaar: () => Promise<void>;
}> = ({ ingepland, sloten, voorkeurId, onInplannen, onKlaar }) => {
  const [kiezen, setKiezen] = useState(false);
  const [bezig, setBezig] = useState(false);

  if (kiezen) {
    return (
      <TijdslotKiezer
        sloten={sloten}
        voorkeurId={voorkeurId}
        onKiezen={async (slot, van, tot) => {
          await onInplannen(slot, van, tot);
          setKiezen(false);
        }}
        onAnnuleren={() => setKiezen(false)}
      />
    );
  }

  if (!ingepland) {
    return (
      <button
        className="cmt-btn-primary cmt-btn-block cmt-btn-lg mt-4"
        onClick={() => setKiezen(true)}
      >
        <CalendarClock className="w-5 h-5" /> Ik ga het halen
      </button>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <button
        className="cmt-btn-primary cmt-btn-block cmt-btn-lg"
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
      <button className="cmt-btn-ghost" onClick={() => setKiezen(true)} disabled={bezig}>
        Toch een andere tijd
      </button>
    </div>
  );
};

const GlasTaak: React.FC<{
  order: GlasOrder;
  sloten: Tijdslot[];
  punt?: Punt | null;
  thuis?: Punt | null;
  onInplannen: (slot: Tijdslot, van: Date, tot: Date) => Promise<void>;
  onKlaar: () => Promise<void>;
}> = ({ order, sloten, punt, thuis, onInplannen, onKlaar }) => (
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
      punt={punt}
      thuis={thuis}
    />

    {order.opmerking && (
      <p className="mt-3 text-base cmt-card cmt-card-tint !p-3">
        <span className="font-semibold">Berichtje: </span>
        {order.opmerking}
      </p>
    )}

    <p className="mt-3 text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
      Zit er een statiegeldlogo op een flesje? Laat die dan staan, die horen hier niet bij.
    </p>

    {order.geplandVan && order.geplandTot ? (
      <AfspraakBalk van={order.geplandVan} tot={order.geplandTot} />
    ) : (
      order.voorkeurVan && <VoorkeurBalk van={order.voorkeurVan} />
    )}

    <TaakKnoppen
      ingepland={order.status === 'ingepland'}
      sloten={sloten}
      voorkeurId={order.voorkeurTijdslotId}
      onInplannen={onInplannen}
      onKlaar={onKlaar}
    />
  </li>
);

const StatiegeldTaak: React.FC<{
  log: StatiegeldLog;
  sloten: Tijdslot[];
  punt?: Punt | null;
  thuis?: Punt | null;
  onInplannen: (slot: Tijdslot, van: Date, tot: Date) => Promise<void>;
  onKlaar: (items: StatiegeldItems) => Promise<void>;
}> = ({ log, sloten, punt, thuis, onInplannen, onKlaar }) => {
  const [plastic, setPlastic] = useState(log.items.plastic);
  const [blik, setBlik] = useState(log.items.blik);
  const ingepland = log.status === 'ingepland';

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
        punt={punt}
        thuis={thuis}
      />

      {log.opmerking && (
        <p className="mt-3 text-base cmt-card cmt-card-tint !p-3">
          <span className="font-semibold">Berichtje: </span>
          {log.opmerking}
        </p>
      )}

      {log.geplandVan && log.geplandTot ? (
        <AfspraakBalk van={log.geplandVan} tot={log.geplandTot} />
      ) : (
        log.voorkeurVan && <VoorkeurBalk van={log.voorkeurVan} />
      )}

      {!ingepland ? (
        <p className="mt-3 text-base" style={{ color: 'var(--cmt-ink-soft)' }}>
          Ze hebben ongeveer {log.items.plastic} flesjes en {log.items.blik} blikjes klaarstaan.
        </p>
      ) : (
        <>
          <p className="mt-4 mb-1 text-base font-semibold">Hoeveel heb je meegenomen?</p>
          <p className="text-sm mb-3" style={{ color: 'var(--cmt-ink-muted)' }}>
            Ze dachten zelf {log.items.plastic} flesjes en {log.items.blik} blikjes. Tel maar na
            en pas het aan als het anders is.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <AantalVeld
              id={`plastic-${log.id}`}
              label="Flesjes"
              waarde={plastic}
              onChange={setPlastic}
              groot
            />
            <AantalVeld
              id={`blik-${log.id}`}
              label="Blikjes"
              waarde={blik}
              onChange={setBlik}
              groot
            />
          </div>
        </>
      )}

      <TaakKnoppen
        ingepland={ingepland}
        sloten={sloten}
        voorkeurId={log.voorkeurTijdslotId}
        onInplannen={onInplannen}
        onKlaar={() => onKlaar({ plastic, blik })}
      />
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
    markeerIngepland: glasIngepland,
  } = useGlasStore();
  const {
    logs,
    loading: statLaadt,
    error: statFout,
    loadOpenstaand: loadStatiegeld,
    markeerOpgehaald: statiegeldOpgehaald,
    markeerIngepland: statiegeldIngepland,
  } = useStatiegeldStore();
  const { tijdsloten, werkgebied, loadTijdsloten, loadWerkgebied } = useInstellingenStore();
  const { customers, loadAlleCustomers } = useCustomerStore();

  const [gevierd, setGevierd] = useState<string | null>(null);

  useEffect(() => {
    loadGlas();
    loadStatiegeld();
    loadTijdsloten();
    loadWerkgebied();
    // De adressen op de kaart komen uit de klantgegevens; die staan niet in de
    // aanvraag zelf, want daar horen geen coordinaten in.
    loadAlleCustomers();
  }, [loadGlas, loadStatiegeld, loadTijdsloten, loadWerkgebied, loadAlleCustomers]);

  const thuis: Punt = { lat: werkgebied.middelpuntLat, lon: werkgebied.middelpuntLon };

  /** Coordinaten van een klant, als we die kennen. */
  const puntVan = (customerId: string): Punt | null => {
    const klant = customers.find((c) => c.id === customerId);
    return klant?.lat != null && klant?.lon != null ? { lat: klant.lat, lon: klant.lon } : null;
  };

  const openGlas = orders.filter((o) => o.status !== 'opgehaald');
  const openStatiegeld = logs.filter(
    (l) => l.status === 'aangemeld' || l.status === 'ingepland'
  );
  const totaal = openGlas.length + openStatiegeld.length;
  const teBevestigen =
    openGlas.filter((o) => o.status !== 'ingepland').length +
    openStatiegeld.filter((l) => l.status !== 'ingepland').length;
  const laadt = glasLaadt || statLaadt;
  const nietsMeer = !laadt && totaal === 0;

  const vier = (tekst: string) => {
    setGevierd(tekst);
    window.setTimeout(() => setGevierd(null), 2500);
  };

  /** Vertelt de beheerder dat er iets is opgehaald, en viert het even. */
  const meldOpgehaald = (wat: string) => {
    void stuurPushNaarRol('admin', {
      titel: 'Jayce is langs geweest',
      tekst: wat,
      url: '/admin',
    });
    vier('Top, afgevinkt!');
  };

  /** Laat de klant weten wanneer Jayce komt. */
  const meldAfspraak = (customerId: string, naam: string, van: Date) => {
    const moment = `${dagInWoorden(van.toISOString())} rond ${format(van, 'HH:mm')}`;
    void stuurPushNaarKlant(customerId, {
      titel: 'Jayce komt langs',
      tekst: `Hij komt ${moment} bij je langs.`,
      url: '/mijn',
    });
    void stuurPushNaarRol('admin', {
      titel: 'Jayce heeft een tijd gekozen',
      tekst: `${naam}: ${moment}.`,
      url: '/admin',
    });
    vier('Gelukt, ze weten nu wanneer je komt!');
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
          <span>{gevierd}</span>
        </div>
      )}

      {laadt && orders.length === 0 && logs.length === 0 && <Loading text="Momentje..." />}

      {totaal > 0 && (
        <p className="text-base mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
          Je hebt nog <strong>{totaal}</strong> {totaal === 1 ? 'adres' : 'adressen'} te gaan.
          {teBevestigen > 0 && (
            <>
              {' '}
              Bij <strong>{teBevestigen}</strong> {teBevestigen === 1 ? 'ervan' : 'ervan'} moet je
              nog zeggen wanneer je komt.
            </>
          )}
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
                sloten={tijdsloten}
                punt={puntVan(order.customerId)}
                thuis={thuis}
                onInplannen={async (slot, van, tot) => {
                  await glasIngepland(
                    order.id,
                    user!.uid,
                    slot.id,
                    van.toISOString(),
                    tot.toISOString()
                  );
                  meldAfspraak(order.customerId, order.customerNaam, van);
                }}
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
                sloten={tijdsloten}
                punt={puntVan(log.customerId)}
                thuis={thuis}
                onInplannen={async (slot, van, tot) => {
                  await statiegeldIngepland(
                    log.id,
                    user!.uid,
                    slot.id,
                    van.toISOString(),
                    tot.toISOString()
                  );
                  meldAfspraak(log.customerId, log.customerNaam, van);
                }}
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
