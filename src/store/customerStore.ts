// src/store/customerStore.ts
import { create } from 'zustand';
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Customer } from '../types';
import { formatPostcode } from '../utils/validation';
import { zoekCoordinaten } from '../utils/geo';

/**
 * Zoekt de coordinaten bij een adres en zet ze op de klant. De routeplanner
 * heeft ze nodig. Mislukt het opzoeken, dan gebeurt er niets: zonder coordinaten
 * werkt de rest van de app gewoon door.
 */
export async function ververCoordinaten(
  customerId: string,
  adres: string,
  postcode: string,
  plaats: string
): Promise<void> {
  const punt = await zoekCoordinaten(adres, postcode, plaats);
  if (!punt) return;

  try {
    await setDoc(doc(db, 'customers', customerId), { lat: punt.lat, lon: punt.lon }, { merge: true });
  } catch (error: unknown) {
    console.warn('[Klant] coordinaten opslaan mislukt:', error);
  }
}

interface CustomerStore {
  customer: Customer | null;
  customers: Customer[];
  loading: boolean;
  error: string | null;
  loadCustomer: (customerId: string) => Promise<Customer | null>;
  /** Alle klanten. Gebruikt door de routeplanner en het klantenscherm. */
  loadAlleCustomers: () => Promise<void>;
  /** Alleen de beheerder: iemand aan- of afvinken als bekende van Jayce. */
  zetBekende: (customerId: string, isBekende: boolean) => Promise<void>;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<void>;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customer: null,
  customers: [],
  loading: false,
  error: null,

  loadCustomer: async (customerId) => {
    try {
      set({ loading: true, error: null });
      const snapshot = await getDoc(doc(db, 'customers', customerId));
      const customer = snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as Customer) : null;
      set({ customer, loading: false });
      return customer;
    } catch (error: unknown) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Kon klantgegevens niet laden',
      });
      return null;
    }
  },

  loadAlleCustomers: async () => {
    try {
      set({ loading: true, error: null });
      const snapshot = await getDocs(query(collection(db, 'customers'), orderBy('naam')));
      set({
        customers: snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Customer),
        loading: false,
      });
    } catch (error: unknown) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Kon de klanten niet laden',
      });
    }
  },

  zetBekende: async (customerId, isBekende) => {
    await setDoc(
      doc(db, 'customers', customerId),
      { isBekende, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    set({
      customers: get().customers.map((c) => (c.id === customerId ? { ...c, isBekende } : c)),
    });
  },

  updateCustomer: async (customerId, updates) => {
    const huidig = get().customer;
    const nieuw = {
      ...updates,
      ...(updates.postcode ? { postcode: formatPostcode(updates.postcode) } : {}),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'customers', customerId), nieuw, { merge: true });

    const bijgewerkt = huidig?.id === customerId ? ({ ...huidig, ...nieuw } as Customer) : null;
    if (bijgewerkt) set({ customer: bijgewerkt });

    // Is het adres gewijzigd, dan kloppen de oude coordinaten niet meer.
    const adresGewijzigd = 'adres' in updates || 'postcode' in updates || 'plaats' in updates;
    if (adresGewijzigd) {
      const bron = bijgewerkt ?? huidig;
      void ververCoordinaten(
        customerId,
        updates.adres ?? bron?.adres ?? '',
        updates.postcode ?? bron?.postcode ?? '',
        updates.plaats ?? bron?.plaats ?? ''
      );
    }
  },
}));
