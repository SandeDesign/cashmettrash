// src/store/customerStore.ts
import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Customer } from '../types';
import { formatPostcode } from '../utils/validation';

interface CustomerStore {
  customer: Customer | null;
  loading: boolean;
  error: string | null;
  loadCustomer: (customerId: string) => Promise<Customer | null>;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<void>;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customer: null,
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

  updateCustomer: async (customerId, updates) => {
    const huidig = get().customer;
    const nieuw = {
      ...updates,
      ...(updates.postcode ? { postcode: formatPostcode(updates.postcode) } : {}),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'customers', customerId), nieuw, { merge: true });

    if (huidig?.id === customerId) {
      set({ customer: { ...huidig, ...nieuw } as Customer });
    }
  },
}));
