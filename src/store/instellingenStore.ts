// src/store/instellingenStore.ts
//
// Het werkgebied, de gevaarlijke plekken en de ideeën van mama. Alles wat bepaalt
// waar Jayce mag rijden en hoe ver hij alleen mag.

import { create } from 'zustand';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { GevaarlijkePlek, Suggestie, SuggestieStatus, Werkgebied } from '../types';

/** Waarden waarmee de app werkt zolang er nog niets is ingesteld. */
export const STANDAARD_WERKGEBIED: Werkgebied = {
  postcodes: [],
  // Ongeveer de Magriethof in Tilburg.
  middelpuntLat: 51.5606,
  middelpuntLon: 5.0919,
  straalAlleenMeters: 1200,
  maxItemsAlleen: 30,
  bijgewerktOp: '',
};

interface InstellingenStore {
  werkgebied: Werkgebied;
  plekken: GevaarlijkePlek[];
  suggesties: Suggestie[];
  loading: boolean;
  error: string | null;

  loadWerkgebied: () => Promise<void>;
  bewaarWerkgebied: (waarden: Partial<Werkgebied>) => Promise<void>;

  loadPlekken: () => Promise<void>;
  voegPlekToe: (plek: Omit<GevaarlijkePlek, 'id' | 'aangemaaktOp'>) => Promise<void>;
  verwijderPlek: (id: string) => Promise<void>;

  loadSuggesties: () => Promise<void>;
  voegSuggestieToe: (tekst: string, vanUid: string, vanNaam: string) => Promise<void>;
  setSuggestieStatus: (id: string, status: SuggestieStatus) => Promise<void>;
}

const WERKGEBIED_DOC = doc(db, 'instellingen', 'werkgebied');

export const useInstellingenStore = create<InstellingenStore>((set, get) => ({
  werkgebied: STANDAARD_WERKGEBIED,
  plekken: [],
  suggesties: [],
  loading: false,
  error: null,

  loadWerkgebied: async () => {
    try {
      set({ loading: true, error: null });
      const snapshot = await getDoc(WERKGEBIED_DOC);
      set({
        werkgebied: snapshot.exists()
          ? ({ ...STANDAARD_WERKGEBIED, ...snapshot.data() } as Werkgebied)
          : STANDAARD_WERKGEBIED,
        loading: false,
      });
    } catch (error: unknown) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Kon het werkgebied niet laden',
      });
    }
  },

  bewaarWerkgebied: async (waarden) => {
    const nieuw = { ...get().werkgebied, ...waarden, bijgewerktOp: new Date().toISOString() };
    await setDoc(WERKGEBIED_DOC, nieuw, { merge: true });
    set({ werkgebied: nieuw });
  },

  loadPlekken: async () => {
    try {
      set({ loading: true, error: null });
      const snapshot = await getDocs(
        query(collection(db, 'gevaarlijkePlekken'), orderBy('aangemaaktOp', 'desc'))
      );
      set({
        plekken: snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as GevaarlijkePlek),
        loading: false,
      });
    } catch (error: unknown) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Kon de plekken niet laden',
      });
    }
  },

  voegPlekToe: async (plek) => {
    const nieuw = { ...plek, aangemaaktOp: new Date().toISOString() };
    const ref = await addDoc(collection(db, 'gevaarlijkePlekken'), nieuw);
    set({ plekken: [{ ...nieuw, id: ref.id }, ...get().plekken] });
  },

  verwijderPlek: async (id) => {
    await deleteDoc(doc(db, 'gevaarlijkePlekken', id));
    set({ plekken: get().plekken.filter((p) => p.id !== id) });
  },

  loadSuggesties: async () => {
    try {
      set({ loading: true, error: null });
      const snapshot = await getDocs(
        query(collection(db, 'suggesties'), orderBy('aangemaaktOp', 'desc'))
      );
      set({
        suggesties: snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Suggestie),
        loading: false,
      });
    } catch (error: unknown) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Kon de ideeën niet laden',
      });
    }
  },

  voegSuggestieToe: async (tekst, vanUid, vanNaam) => {
    const nieuw = {
      tekst,
      vanUid,
      vanNaam,
      status: 'nieuw' as SuggestieStatus,
      aangemaaktOp: new Date().toISOString(),
    };
    const ref = await addDoc(collection(db, 'suggesties'), nieuw);
    set({ suggesties: [{ ...nieuw, id: ref.id }, ...get().suggesties] });
  },

  setSuggestieStatus: async (id, status) => {
    await updateDoc(doc(db, 'suggesties', id), { status });
    set({ suggesties: get().suggesties.map((s) => (s.id === id ? { ...s, status } : s)) });
  },
}));

/** Valt deze postcode binnen het werkgebied? Lege lijst betekent overal. */
export function postcodeInGebied(postcode: string, werkgebied: Werkgebied): boolean {
  if (werkgebied.postcodes.length === 0) return true;
  const schoon = postcode.replace(/\s/g, '').toUpperCase();
  return werkgebied.postcodes.some((p) => schoon.startsWith(p.replace(/\s/g, '').toUpperCase()));
}
