// src/hooks/useMenuTellers.ts
//
// De bolletjes op de menu-items. Per rol luisteren we alleen naar wat die rol
// ook echt mag zien, zodat er geen verzoeken langs de security rules stuiten.
//
//   chat       ongelezen berichten            klant, beheerder
//   nieuw      aanvragen die nog niets zijn   Jayce, beheerder
//   ronde      adressen die nog open staan    Jayce
//   meerijden  ritten waar mama mee moet      mama
//   afrekenen  statiegeld dat wacht op Marc   beheerder
//   ideeen     ideeën die nog nieuw zijn      beheerder
//   scannen    opgehaald, nog niet ingescand  mama
//   contant    contant geld nog niet gezien   mama
//
// Een teller op nul laat `NavTeller` gewoon weg, dus rollen zonder een bepaalde
// teller hoeven niets bijzonders te doen.

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { useOngelezen } from './useOngelezen';
import { STANDAARD_WERKGEBIED } from '../store/instellingenStore';
import { afstandMeters, type Punt } from '../utils/geo';
import type { Werkgebied } from '../types';

export type TellerSleutel =
  | 'chat'
  | 'nieuw'
  | 'ronde'
  | 'meerijden'
  | 'afrekenen'
  | 'ideeen'
  | 'scannen'
  | 'contant';

export type MenuTellers = Partial<Record<TellerSleutel, number>>;

// Wanneer staat iets op de lijst van Jayce? Bij glas pas nadat de ophaalbeurt
// betaald is; statiegeld is gratis en staat er meteen op. "Nieuw" is dus de
// status waarin nog geen tijdslot is gekozen, en die verschilt per stroom.
const GLAS_OPEN = ['betaald', 'ingepland'];
const GLAS_NIEUW = 'betaald';
const STATIEGELD_OPEN = ['aangemeld', 'ingepland'];
const STATIEGELD_NIEUW = 'aangemeld';

export function useMenuTellers(): MenuTellers {
  const { user } = useAuth();
  const chat = useOngelezen();

  const [glas, setGlas] = useState({ open: 0, nieuw: 0 });
  const [statiegeld, setStatiegeld] = useState({ open: 0, nieuw: 0 });
  /** De openstaande statiegeldritten, om te bepalen waar mama mee moet. */
  const [openRitten, setOpenRitten] = useState<{ customerId: string; aantal: number }[]>([]);
  const [werkgebied, setWerkgebied] = useState<Werkgebied>(STANDAARD_WERKGEBIED);
  const [coordinaten, setCoordinaten] = useState<Record<string, Punt>>({});
  const [afrekenen, setAfrekenen] = useState(0);
  const [ideeen, setIdeeen] = useState(0);
  const [scannen, setScannen] = useState(0);
  const [contant, setContant] = useState(0);

  const rol = user?.rol;

  // De ronde zelf: glas en statiegeld dat nog opgehaald moet worden.
  useEffect(() => {
    const leeg = { open: 0, nieuw: 0 };

    if (rol !== 'jayce' && rol !== 'moeder' && rol !== 'admin') {
      setGlas(leeg);
      setStatiegeld(leeg);
      setOpenRitten([]);
      return;
    }

    const tel = (docs: { data: () => Record<string, unknown> }[], nieuweStatus: string) => ({
      open: docs.length,
      nieuw: docs.filter((d) => d.data().status === nieuweStatus).length,
    });

    const stopGlas = onSnapshot(
      query(collection(db, 'glasOrders'), where('status', 'in', GLAS_OPEN)),
      (snapshot) => setGlas(tel(snapshot.docs, GLAS_NIEUW)),
      () => setGlas(leeg)
    );

    const stopStatiegeld = onSnapshot(
      query(collection(db, 'statiegeldLogs'), where('status', 'in', STATIEGELD_OPEN)),
      (snapshot) => {
        setStatiegeld(tel(snapshot.docs, STATIEGELD_NIEUW));
        setOpenRitten(
          snapshot.docs.map((d) => {
            const rij = d.data();
            const items = (rij.items ?? {}) as { plastic?: number; blik?: number };
            return {
              customerId: rij.customerId as string,
              aantal: (items.plastic ?? 0) + (items.blik ?? 0),
            };
          })
        );
      },
      () => {
        setStatiegeld(leeg);
        setOpenRitten([]);
      }
    );

    return () => {
      stopGlas();
      stopStatiegeld();
    };
  }, [rol]);

  // Alleen de beheerder rekent af en leest de ideeën.
  useEffect(() => {
    if (rol !== 'admin') {
      setAfrekenen(0);
      setIdeeen(0);
      return;
    }

    const stopAfrekenen = onSnapshot(
      query(
        collection(db, 'statiegeldLogs'),
        where('status', 'in', ['opgehaald', 'verwerktBijViatim'])
      ),
      (snapshot) => setAfrekenen(snapshot.size),
      () => setAfrekenen(0)
    );

    const stopIdeeen = onSnapshot(
      query(collection(db, 'suggesties'), where('status', '==', 'nieuw')),
      (snapshot) => setIdeeen(snapshot.size),
      () => setIdeeen(0)
    );

    return () => {
      stopAfrekenen();
      stopIdeeen();
    };
  }, [rol]);

  // Alleen mama scant in en telt het contante geld na.
  useEffect(() => {
    if (rol !== 'moeder') {
      setScannen(0);
      setContant(0);
      return;
    }

    const stopScannen = onSnapshot(
      query(collection(db, 'statiegeldLogs'), where('status', '==', 'opgehaald')),
      (snapshot) => setScannen(snapshot.size),
      () => setScannen(0)
    );

    // Alleen wat Jayce al heeft opgehaald, want daarvoor hoort het geld in huis
    // te zijn. Dat laatste filteren we hier, want een tweede voorwaarde in de
    // query zou een samengestelde index vragen.
    const stopContant = onSnapshot(
      query(collection(db, 'statiegeldLogs'), where('servicekostenContant', '==', true)),
      (snapshot) =>
        setContant(
          snapshot.docs.filter((d) => d.data().opgehaaldOp && !d.data().contantBevestigdOp).length
        ),
      () => setContant(0)
    );

    return () => {
      stopScannen();
      stopContant();
    };
  }, [rol]);

  // Voor het bolletje op haar overzicht: bij welke ritten moet zij mee? Daarvoor
  // hebben we de coordinaten van de klanten en de instellingen van het
  // werkgebied nodig, en die halen we dus alleen voor haar op.
  useEffect(() => {
    if (rol !== 'moeder') {
      setWerkgebied(STANDAARD_WERKGEBIED);
      setCoordinaten({});
      return;
    }

    const stopWerkgebied = onSnapshot(
      doc(db, 'instellingen', 'werkgebied'),
      (snapshot) =>
        setWerkgebied({ ...STANDAARD_WERKGEBIED, ...(snapshot.data() as Partial<Werkgebied>) }),
      () => setWerkgebied(STANDAARD_WERKGEBIED)
    );

    const stopKlanten = onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        const punten: Record<string, Punt> = {};
        for (const d of snapshot.docs) {
          const rij = d.data();
          if (typeof rij.lat === 'number' && typeof rij.lon === 'number') {
            punten[d.id] = { lat: rij.lat, lon: rij.lon };
          }
        }
        setCoordinaten(punten);
      },
      () => setCoordinaten({})
    );

    return () => {
      stopWerkgebied();
      stopKlanten();
    };
  }, [rol]);

  // Mama hoeft alleen mee als het allebei geldt: het adres ligt buiten de straal
  // waar Jayce alleen mag, én er staat veel klaar. Dat is dezelfde regel als op
  // haar overzicht, zodat het bolletje en de lijst hetzelfde zeggen.
  const meerijden = useMemo(() => {
    if (rol !== 'moeder') return 0;
    const thuis: Punt = { lat: werkgebied.middelpuntLat, lon: werkgebied.middelpuntLon };

    return openRitten.filter((rit) => {
      const punt = coordinaten[rit.customerId];
      if (!punt) return false;
      return (
        afstandMeters(thuis, punt) > werkgebied.straalAlleenMeters &&
        rit.aantal >= werkgebied.maxItemsAlleen
      );
    }).length;
  }, [rol, openRitten, coordinaten, werkgebied]);

  return {
    meerijden,
    chat,
    scannen,
    contant,
    nieuw: glas.nieuw + statiegeld.nieuw,
    ronde: glas.open + statiegeld.open,
    afrekenen,
    ideeen,
  };
}
