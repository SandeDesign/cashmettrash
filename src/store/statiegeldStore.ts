// src/store/statiegeldStore.ts
import { create } from 'zustand';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  Customer,
  ServicekostenStatus,
  StatiegeldItems,
  StatiegeldLog,
  StatiegeldStatus,
} from '../types';
import { STATIEGELD_SERVICE_CENTEN } from '../utils/constants';

const COLLECTIE = 'statiegeldLogs';

interface StatiegeldStore {
  logs: StatiegeldLog[];
  loading: boolean;
  error: string | null;
  loadVoorKlant: (customerId: string) => Promise<void>;
  /** Openstaande meldingen voor Jayce. */
  loadOpenstaand: () => Promise<void>;
  loadAlle: () => Promise<void>;
  maakMelding: (customer: Customer, items: StatiegeldItems, opmerking?: string) => Promise<string>;
  /** Jayce: telling corrigeren en afvinken. */
  markeerOpgehaald: (logId: string, jayceId: string, itemsWerkelijk: StatiegeldItems) => Promise<void>;
  /** Admin: ingescand bij Viatim. Losse stap, voor als je nog geen Tikkie hebt. */
  markeerVerwerkt: (logId: string) => Promise<void>;
  /**
   * Admin: in één handeling afronden. Zet verwerkt bij Viatim, registreert de
   * Tikkie en zet de ophaalkosten open. Dit is de normale weg; de twee losse
   * stappen blijven bestaan voor uitzonderingen.
   */
  rekenAf: (logId: string, tikkieBedrag: number, tikkieLink: string) => Promise<void>;
  /**
   * Admin: Tikkie uit Viatim gedeeld. Zet tegelijk de ophaalkosten op
   * openstaand, want die worden pas na het ophalen in rekening gebracht.
   */
  markeerTikkieVerstuurd: (logId: string, tikkieBedrag: number, tikkieLink: string) => Promise<void>;
  /** Klant: ophaalkosten betaald via Stripe. */
  markeerServicekostenBetaald: (
    logId: string,
    stripeSessionId: string,
    stripeStatus: string
  ) => Promise<void>;
}

function mapLogs(docs: { id: string; data: () => Record<string, unknown> }[]): StatiegeldLog[] {
  return docs.map((d) => ({ ...d.data(), id: d.id }) as StatiegeldLog);
}

export const useStatiegeldStore = create<StatiegeldStore>((set, get) => ({
  logs: [],
  loading: false,
  error: null,

  loadVoorKlant: async (customerId) => {
    try {
      set({ loading: true, error: null });
      const snapshot = await getDocs(
        query(
          collection(db, COLLECTIE),
          where('customerId', '==', customerId),
          orderBy('aangemaaktOp', 'desc')
        )
      );
      set({ logs: mapLogs(snapshot.docs), loading: false });
    } catch (error: unknown) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Kon statiegeld-meldingen niet laden',
      });
    }
  },

  loadOpenstaand: async () => {
    try {
      set({ loading: true, error: null });
      const snapshot = await getDocs(
        query(
          collection(db, COLLECTIE),
          where('status', '==', 'aangemeld'),
          orderBy('aangemaaktOp', 'asc')
        )
      );
      set({ logs: mapLogs(snapshot.docs), loading: false });
    } catch (error: unknown) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Kon ophaaltaken niet laden',
      });
    }
  },

  loadAlle: async () => {
    try {
      set({ loading: true, error: null });
      const snapshot = await getDocs(
        query(collection(db, COLLECTIE), orderBy('aangemaaktOp', 'desc'))
      );
      set({ logs: mapLogs(snapshot.docs), loading: false });
    } catch (error: unknown) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Kon statiegeld-log niet laden',
      });
    }
  },

  maakMelding: async (customer, items, opmerking) => {
    const log: Omit<StatiegeldLog, 'id'> = {
      customerId: customer.id,
      customerNaam: customer.naam,
      adres: customer.adres,
      postcode: customer.postcode,
      plaats: customer.plaats,
      items,
      status: 'aangemeld',
      servicekosten: STATIEGELD_SERVICE_CENTEN,
      servicekostenStatus: 'nietVerschuldigd',
      aangemaaktOp: new Date().toISOString(),
      ...(opmerking ? { opmerking } : {}),
    };

    const ref = await addDoc(collection(db, COLLECTIE), log);
    set({ logs: [{ ...log, id: ref.id }, ...get().logs] });
    return ref.id;
  },

  markeerOpgehaald: async (logId, jayceId, itemsWerkelijk) => {
    const updates = {
      status: 'opgehaald' as StatiegeldStatus,
      itemsWerkelijk,
      opgehaaldOp: new Date().toISOString(),
      jayceId,
    };
    await updateDoc(doc(db, COLLECTIE, logId), updates);
    set({ logs: get().logs.map((l) => (l.id === logId ? { ...l, ...updates } : l)) });
  },

  markeerVerwerkt: async (logId) => {
    const updates = {
      status: 'verwerktBijViatim' as StatiegeldStatus,
      verwerktOp: new Date().toISOString(),
    };
    await updateDoc(doc(db, COLLECTIE, logId), updates);
    set({ logs: get().logs.map((l) => (l.id === logId ? { ...l, ...updates } : l)) });
  },

  rekenAf: async (logId, tikkieBedrag, tikkieLink) => {
    const nu = new Date().toISOString();
    const updates = {
      status: 'tikkieVerstuurd' as StatiegeldStatus,
      verwerktOp: nu,
      tikkieBedrag,
      tikkieLink,
      tikkieVerstuurdOp: nu,
      servicekostenStatus: 'openstaand' as ServicekostenStatus,
    };
    await updateDoc(doc(db, COLLECTIE, logId), updates);
    set({ logs: get().logs.map((l) => (l.id === logId ? { ...l, ...updates } : l)) });
  },

  markeerTikkieVerstuurd: async (logId, tikkieBedrag, tikkieLink) => {
    const updates = {
      status: 'tikkieVerstuurd' as StatiegeldStatus,
      tikkieBedrag,
      tikkieLink,
      tikkieVerstuurdOp: new Date().toISOString(),
      servicekostenStatus: 'openstaand' as ServicekostenStatus,
    };
    await updateDoc(doc(db, COLLECTIE, logId), updates);
    set({ logs: get().logs.map((l) => (l.id === logId ? { ...l, ...updates } : l)) });
  },

  markeerServicekostenBetaald: async (logId, stripeSessionId, stripeStatus) => {
    const updates = {
      servicekostenStatus: 'betaald' as ServicekostenStatus,
      servicekostenBetaaldOp: new Date().toISOString(),
      serviceStripeSessionId: stripeSessionId,
      serviceStripeStatus: stripeStatus,
    };
    await updateDoc(doc(db, COLLECTIE, logId), updates);
    set({ logs: get().logs.map((l) => (l.id === logId ? { ...l, ...updates } : l)) });
  },
}));
