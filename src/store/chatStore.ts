// src/store/chatStore.ts
//
// Chat tussen klant en admin. Jayce heeft hier geen toegang toe, zodat vragen
// over geld niet bij hem terechtkomen.
//
// Berichten staan als subcollectie onder het gesprek, zodat de security rules
// per klant kunnen werken zonder dat een query dat hoeft af te dwingen.

import { create } from 'zustand';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ChatBericht, ChatGesprek } from '../types';
import { stuurPushNaarKlant, stuurPushNaarRol } from '../utils/push';

const GESPREKKEN = 'chatGesprekken';

interface NieuwBericht {
  customerId: string;
  customerNaam: string;
  afzender: 'klant' | 'admin';
  tekst: string;
  tikkieLink?: string;
  statiegeldLogId?: string;
}

interface ChatStore {
  gesprekken: ChatGesprek[];
  berichten: ChatBericht[];
  loading: boolean;
  error: string | null;
  /** Luistert realtime mee op alle gesprekken (admin). Geeft de unsubscribe terug. */
  volgGesprekken: () => () => void;
  /** Luistert realtime mee op één gesprek. Geeft de unsubscribe terug. */
  volgBerichten: (customerId: string) => () => void;
  stuurBericht: (bericht: NieuwBericht) => Promise<void>;
  markeerGelezen: (customerId: string, rol: 'klant' | 'admin') => Promise<void>;
  wisBerichten: () => void;
}

/** Voorvertoning van een bericht in de gesprekkenlijst. */
function samenvatting(tekst: string): string {
  const schoon = tekst.replace(/\s+/g, ' ').trim();
  return schoon.length > 80 ? `${schoon.slice(0, 79)}…` : schoon;
}

export const useChatStore = create<ChatStore>((set) => ({
  gesprekken: [],
  berichten: [],
  loading: false,
  error: null,

  volgGesprekken: () => {
    set({ loading: true, error: null });

    return onSnapshot(
      query(collection(db, GESPREKKEN), orderBy('laatsteBerichtOp', 'desc')),
      (snapshot) => {
        set({
          gesprekken: snapshot.docs.map((d) => ({ ...d.data(), customerId: d.id }) as ChatGesprek),
          loading: false,
        });
      },
      (fout) => set({ error: fout.message, loading: false })
    );
  },

  volgBerichten: (customerId) => {
    set({ loading: true, error: null, berichten: [] });

    return onSnapshot(
      query(collection(db, GESPREKKEN, customerId, 'berichten'), orderBy('aangemaaktOp', 'asc')),
      (snapshot) => {
        set({
          berichten: snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as ChatBericht),
          loading: false,
        });
      },
      (fout) => set({ error: fout.message, loading: false })
    );
  },

  stuurBericht: async ({ customerId, customerNaam, afzender, tekst, tikkieLink, statiegeldLogId }) => {
    const nu = new Date().toISOString();
    const gesprekRef = doc(db, GESPREKKEN, customerId);

    await addDoc(collection(gesprekRef, 'berichten'), {
      afzender,
      tekst,
      aangemaaktOp: nu,
      ...(tikkieLink ? { tikkieLink } : {}),
      ...(statiegeldLogId ? { statiegeldLogId } : {}),
    });

    const bestaat = (await getDoc(gesprekRef)).exists();
    const kop = {
      customerId,
      customerNaam,
      laatsteBericht: samenvatting(tekst),
      laatsteBerichtOp: nu,
    };

    if (bestaat) {
      await updateDoc(gesprekRef, {
        ...kop,
        // De ontvanger krijgt er een ongelezen bericht bij.
        [afzender === 'klant' ? 'ongelezenAdmin' : 'ongelezenKlant']: increment(1),
      });
    } else {
      await setDoc(gesprekRef, {
        ...kop,
        ongelezenKlant: afzender === 'admin' ? 1 : 0,
        ongelezenAdmin: afzender === 'klant' ? 1 : 0,
      });
    }

    // De ontvanger een seintje geven. Een Tikkie-bericht kondigt zichzelf al aan
    // vanuit de afrekenpagina, dus dat slaan we hier over om dubbele meldingen
    // te voorkomen.
    if (!tikkieLink) {
      if (afzender === 'klant') {
        void stuurPushNaarRol('admin', {
          titel: `Bericht van ${customerNaam}`,
          tekst: samenvatting(tekst),
          url: `/admin/berichten/${customerId}`,
        });
      } else {
        void stuurPushNaarKlant(customerId, {
          titel: 'Nieuw bericht',
          tekst: samenvatting(tekst),
          url: '/chat',
        });
      }
    }
  },

  markeerGelezen: async (customerId, rol) => {
    const gesprekRef = doc(db, GESPREKKEN, customerId);
    if (!(await getDoc(gesprekRef)).exists()) return;
    await updateDoc(gesprekRef, {
      [rol === 'klant' ? 'ongelezenKlant' : 'ongelezenAdmin']: 0,
    });
  },

  wisBerichten: () => set({ berichten: [] }),
}));
