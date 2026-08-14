// src/store/glasStore.ts
import { create } from 'zustand';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Customer, GlasOrder, GlasStatus } from '../types';
import { GLAS_PRIJS_CENTEN } from '../utils/constants';

const COLLECTIE = 'glasOrders';

interface GlasStore {
  orders: GlasOrder[];
  loading: boolean;
  error: string | null;
  /** Orders van één klant (klant-overzicht). */
  loadVoorKlant: (customerId: string) => Promise<void>;
  /** Openstaande, betaalde orders voor Jayce. */
  loadOpenstaand: () => Promise<void>;
  /** Alle orders (admin). */
  loadAlle: () => Promise<void>;
  /** Maakt een order aan met status 'aangemeld' en geeft het nieuwe id terug. */
  maakOrder: (
    customer: Customer,
    opmerking?: string,
    /** De wens van de klant over wanneer het uitkomt. Geen afspraak. */
    voorkeur?: { voorkeurTijdslotId: string; voorkeurVan: string; voorkeurTot: string } | null,
    /** De klant geeft de ophaalbeurt contant mee aan Jayce. */
    contant?: boolean
  ) => Promise<string>;
  setStatus: (orderId: string, status: GlasStatus) => Promise<void>;
  markeerBetaald: (orderId: string, stripeSessionId: string, stripeStatus: string) => Promise<void>;
  markeerOpgehaald: (orderId: string, jayceId: string) => Promise<void>;
  /**
   * Mama of de beheerder: Jayce heeft de ophaalbeurt contant gekregen. Dit is de
   * enige weg waarop contant geld als betaald telt.
   */
  bevestigContant: (orderId: string, doorUid: string) => Promise<void>;
  /** Alleen de beheerder. Handig tijdens het testen, en om een misser op te ruimen. */
  verwijderOrder: (orderId: string) => Promise<void>;
  /** Jayce bevestigt en kiest een tijdslot waarop hij langskomt. */
  markeerIngepland: (
    orderId: string,
    jayceId: string,
    tijdslotId: string,
    geplandVan: string,
    geplandTot: string
  ) => Promise<void>;
}

function mapOrders(docs: { id: string; data: () => Record<string, unknown> }[]): GlasOrder[] {
  return docs.map((d) => ({ ...d.data(), id: d.id }) as GlasOrder);
}

export const useGlasStore = create<GlasStore>((set, get) => ({
  orders: [],
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
      set({ orders: mapOrders(snapshot.docs), loading: false });
    } catch (error: unknown) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Kon glas-aanvragen niet laden',
      });
    }
  },

  loadOpenstaand: async () => {
    try {
      set({ loading: true, error: null });
      // Een order staat op de lijst van Jayce zodra hij betaald is. Wie contant
      // betaalt heeft nog geen betaling gedaan, maar hoort er wel meteen op:
      // hij krijgt het geld immers pas aan de deur. Daarom halen we ook de
      // aangemelde orders op en zeven we ze hier.
      const snapshot = await getDocs(
        query(
          collection(db, COLLECTIE),
          where('status', 'in', ['aangemeld', 'betaald', 'ingepland']),
          orderBy('aangemaaktOp', 'asc')
        )
      );
      const orders = mapOrders(snapshot.docs).filter(
        (o) => o.status !== 'aangemeld' || o.contant
      );
      set({ orders, loading: false });
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
      set({ orders: mapOrders(snapshot.docs), loading: false });
    } catch (error: unknown) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Kon glas-orders niet laden',
      });
    }
  },

  maakOrder: async (customer, opmerking, voorkeur, contant) => {
    const order: Omit<GlasOrder, 'id'> = {
      customerId: customer.id,
      customerNaam: customer.naam,
      adres: customer.adres,
      postcode: customer.postcode,
      plaats: customer.plaats,
      status: 'aangemeld',
      bedrag: GLAS_PRIJS_CENTEN,
      contant: !!contant,
      aangemaaktOp: new Date().toISOString(),
      ...(opmerking ? { opmerking } : {}),
      ...(voorkeur ?? {}),
    };

    const ref = await addDoc(collection(db, COLLECTIE), order);
    set({ orders: [{ ...order, id: ref.id }, ...get().orders] });
    return ref.id;
  },

  setStatus: async (orderId, status) => {
    await updateDoc(doc(db, COLLECTIE, orderId), { status });
    set({
      orders: get().orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    });
  },

  markeerBetaald: async (orderId, stripeSessionId, stripeStatus) => {
    const updates = {
      status: 'betaald' as GlasStatus,
      stripeSessionId,
      stripeStatus,
      betaaldOp: new Date().toISOString(),
    };
    await updateDoc(doc(db, COLLECTIE, orderId), updates);
    set({
      orders: get().orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o)),
    });
  },

  verwijderOrder: async (orderId) => {
    await deleteDoc(doc(db, COLLECTIE, orderId));
    set({ orders: get().orders.filter((o) => o.id !== orderId) });
  },

  markeerIngepland: async (orderId, jayceId, tijdslotId, geplandVan, geplandTot) => {
    const updates = {
      status: 'ingepland' as GlasStatus,
      tijdslotId,
      geplandVan,
      geplandTot,
      jayceId,
    };
    await updateDoc(doc(db, COLLECTIE, orderId), updates);
    set({ orders: get().orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o)) });
  },

  bevestigContant: async (orderId, doorUid) => {
    const nu = new Date().toISOString();
    const updates = {
      contantBevestigdOp: nu,
      contantBevestigdDoor: doorUid,
      // Nu pas is er echt betaald; de cijfers rekenen met dit moment.
      betaaldOp: nu,
    };
    await updateDoc(doc(db, COLLECTIE, orderId), updates);
    set({ orders: get().orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o)) });
  },

  markeerOpgehaald: async (orderId, jayceId) => {
    const updates = {
      status: 'opgehaald' as GlasStatus,
      opgehaaldOp: new Date().toISOString(),
      jayceId,
    };
    await updateDoc(doc(db, COLLECTIE, orderId), updates);
    set({
      orders: get().orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o)),
    });
  },
}));
