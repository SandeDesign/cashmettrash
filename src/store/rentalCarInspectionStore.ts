import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RentalCarInspectionForm, PhotoUploadTab } from '../types';

// Helper function to remove undefined values from objects
function cleanFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(cleanFirestoreData);
  }
  const cleaned: any = {};
  for (const key in data) {
    const value = data[key];
    if (value !== undefined) {
      cleaned[key] = cleanFirestoreData(value);
    }
  }
  return cleaned;
}

interface RentalCarInspectionStore {
  inspectionForms: RentalCarInspectionForm[];
  currentForm: RentalCarInspectionForm | null;
  loading: boolean;
  error: string | null;

  // CRUD operations
  createInspectionForm: (
    formData: Omit<RentalCarInspectionForm, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<RentalCarInspectionForm>;
  getInspectionForm: (formId: string) => Promise<RentalCarInspectionForm | null>;
  getInspectionFormByBooking: (bookingId: string, type: 'ophalen' | 'inleveren') => Promise<RentalCarInspectionForm | null>;
  updateInspectionForm: (formId: string, updates: Partial<RentalCarInspectionForm>) => Promise<void>;
  submitInspectionForm: (formId: string) => Promise<void>;
  approveInspectionForm: (formId: string, reviewedBy: string) => Promise<void>;
  rejectInspectionForm: (formId: string, rejectionReason: string, reviewedBy: string) => Promise<void>;

  // Queries
  fetchBookingInspectionForms: (bookingId: string) => Promise<void>;
  fetchCustomerInspectionForms: (customerId: string) => Promise<void>;
  fetchAllInspectionForms: () => Promise<void>;

  // Local state management
  setCurrentForm: (form: RentalCarInspectionForm | null) => void;
  updatePhotoTab: (tabId: string, tab: PhotoUploadTab) => void;
}

export const useRentalCarInspectionStore = create<RentalCarInspectionStore>((set, get) => ({
  inspectionForms: [],
  currentForm: null,
  loading: false,
  error: null,

  createInspectionForm: async (formData) => {
    try {
      set({ loading: true, error: null });

      const formRef = doc(collection(db, 'rental_car_inspections'));
      const inspectionForm: RentalCarInspectionForm = {
        ...formData,
        id: formRef.id,
        status: 'voeg_fotos_toe',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Clean undefined values before saving to Firestore
      const cleanedForm = cleanFirestoreData(inspectionForm);

      await setDoc(formRef, cleanedForm);

      set({ loading: false });
      return inspectionForm;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getInspectionForm: async (formId) => {
    try {
      set({ loading: true, error: null });

      const formRef = doc(db, 'rental_car_inspections', formId);
      const formSnap = await getDoc(formRef);

      set({ loading: false });

      if (formSnap.exists()) {
        const form = formSnap.data() as RentalCarInspectionForm;
        set({ currentForm: form });
        return form;
      }
      return null;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getInspectionFormByBooking: async (bookingId, type) => {
    try {
      set({ loading: true, error: null });

      const q = query(
        collection(db, 'rental_car_inspections'),
        where('booking_id', '==', bookingId),
        where('type', '==', type)
      );

      const querySnapshot = await getDocs(q);

      set({ loading: false });

      if (!querySnapshot.empty) {
        const form = querySnapshot.docs[0].data() as RentalCarInspectionForm;
        set({ currentForm: form });
        return form;
      }
      return null;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateInspectionForm: async (formId, updates) => {
    try {
      set({ loading: true, error: null });

      const formRef = doc(db, 'rental_car_inspections', formId);

      // Clean undefined values before saving to Firestore
      const cleanedUpdates = cleanFirestoreData({
        ...updates,
        updated_at: new Date().toISOString(),
      });

      await updateDoc(formRef, cleanedUpdates);

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  submitInspectionForm: async (formId) => {
    try {
      set({ loading: true, error: null });

      const formRef = doc(db, 'rental_car_inspections', formId);
      await updateDoc(formRef, {
        status: 'in_behandeling',
        customer_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  approveInspectionForm: async (formId, reviewedBy) => {
    try {
      set({ loading: true, error: null });

      const formRef = doc(db, 'rental_car_inspections', formId);
      await updateDoc(formRef, {
        status: 'goedgekeurd',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  rejectInspectionForm: async (formId, rejectionReason, reviewedBy) => {
    try {
      set({ loading: true, error: null });

      const formRef = doc(db, 'rental_car_inspections', formId);
      await updateDoc(formRef, {
        status: 'afgekeurd',
        rejection_reason: rejectionReason,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchBookingInspectionForms: async (bookingId) => {
    try {
      set({ loading: true, error: null });

      const q = query(
        collection(db, 'rental_car_inspections'),
        where('booking_id', '==', bookingId),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const inspectionForms = querySnapshot.docs.map(doc => doc.data() as RentalCarInspectionForm);

      set({ inspectionForms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchCustomerInspectionForms: async (customerId) => {
    try {
      set({ loading: true, error: null });

      const q = query(
        collection(db, 'rental_car_inspections'),
        where('customer_id', '==', customerId),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const inspectionForms = querySnapshot.docs.map(doc => doc.data() as RentalCarInspectionForm);

      set({ inspectionForms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchAllInspectionForms: async () => {
    try {
      set({ loading: true, error: null });

      const q = query(
        collection(db, 'rental_car_inspections'),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const inspectionForms = querySnapshot.docs.map(doc => doc.data() as RentalCarInspectionForm);

      set({ inspectionForms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setCurrentForm: (form) => {
    set({ currentForm: form });
  },

  updatePhotoTab: (tabId, tab) => {
    const currentForm = get().currentForm;
    if (!currentForm) return;

    const updatedTabs = currentForm.photo_tabs.map(t =>
      t.id === tabId ? tab : t
    );

    set({
      currentForm: {
        ...currentForm,
        photo_tabs: updatedTabs,
      },
    });
  },
}));
