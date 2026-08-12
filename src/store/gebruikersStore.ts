// src/store/gebruikersStore.ts
//
// Alle accounts met hun rol. Alleen de beheerder komt hier bij; de security
// rules laten niemand anders de collectie users uitlezen, en al helemaal niet
// een rol wijzigen.

import { create } from 'zustand';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Rol, User } from '../types';

interface GebruikersStore {
  gebruikers: User[];
  loading: boolean;
  error: string | null;
  loadAlleGebruikers: () => Promise<void>;
  zetRol: (uid: string, rol: Rol) => Promise<void>;
}

export const useGebruikersStore = create<GebruikersStore>((set, get) => ({
  gebruikers: [],
  loading: false,
  error: null,

  loadAlleGebruikers: async () => {
    try {
      set({ loading: true, error: null });
      const snapshot = await getDocs(query(collection(db, 'users'), orderBy('naam')));
      set({
        gebruikers: snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }) as User),
        loading: false,
      });
    } catch (error: unknown) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Kon de accounts niet laden',
      });
    }
  },

  zetRol: async (uid, rol) => {
    await updateDoc(doc(db, 'users', uid), { rol, updatedAt: new Date().toISOString() });
    set({ gebruikers: get().gebruikers.map((g) => (g.uid === uid ? { ...g, rol } : g)) });
  },
}));
