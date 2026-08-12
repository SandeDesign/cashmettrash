// src/hooks/useOngelezen.ts
//
// Hoeveel ongelezen berichten er zijn, voor het bolletje op het menu-icoon. Voor
// de klant is dat zijn eigen gesprek, voor de beheerder alle gesprekken bij
// elkaar. Jayce en mama hebben geen chat en krijgen dus altijd nul.

import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export function useOngelezen(): number {
  const { user } = useAuth();
  const [aantal, setAantal] = useState(0);

  useEffect(() => {
    if (!user) {
      setAantal(0);
      return;
    }

    if (user.rol === 'klant') {
      return onSnapshot(
        doc(db, 'chatGesprekken', user.uid),
        (snapshot) => setAantal(snapshot.data()?.ongelezenKlant ?? 0),
        () => setAantal(0)
      );
    }

    if (user.rol === 'admin') {
      return onSnapshot(
        query(collection(db, 'chatGesprekken')),
        (snapshot) =>
          setAantal(snapshot.docs.reduce((som, d) => som + (d.data().ongelezenAdmin ?? 0), 0)),
        () => setAantal(0)
      );
    }

    setAantal(0);
  }, [user]);

  return aantal;
}
