import { create } from 'zustand';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Car } from '../types';

interface CarState {
  cars: Car[];
  loading: boolean;
  error: string | null;

  // CRUD operations
  fetchCars: (filters?: CarFilters) => Promise<void>;
  fetchCarById: (id: string) => Promise<Car | null>;
  addCar: (carData: Omit<Car, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateCar: (id: string, carData: Partial<Car>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;

  // Real-time subscription
  subscribeToCars: (filters?: CarFilters) => () => void;

  // Helper methods
  getAvailableCars: () => Car[];
  getCarsByManager: (managerId: string) => Car[];

  // Partner car approval
  approvePartnerCar: (carId: string, adminUid: string, purchasePrice?: number, repaymentPercentage?: number) => Promise<void>;
  rejectPartnerCar: (carId: string, reason?: string) => Promise<void>;
  resolveChangeRequest: (carId: string, approved: boolean, response: string) => Promise<void>;
}

export interface CarFilters {
  status?: 'available' | 'rented' | 'maintenance';
  published?: boolean;
  created_by?: string;
}

export const useCarStore = create<CarState>((set, get) => ({
  cars: [],
  loading: false,
  error: null,

  fetchCars: async (filters?: CarFilters) => {
    set({ loading: true, error: null });
    try {
      const carsRef = collection(db, 'cars');
      const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];

      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.published !== undefined) {
        constraints.push(where('published', '==', filters.published));
      }
      if (filters?.created_by) {
        constraints.push(where('created_by', '==', filters.created_by));
      }

      const q = query(carsRef, ...constraints);
      const snapshot = await getDocs(q);

      const cars: Car[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Car[];

      set({ cars, loading: false });
    } catch (error: any) {
      console.error('Error fetching cars:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchCarById: async (id: string) => {
    try {
      const carDoc = await getDoc(doc(db, 'cars', id));
      if (carDoc.exists()) {
        return {
          id: carDoc.id,
          ...carDoc.data(),
          created_at: carDoc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: carDoc.data().updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Car;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching car:', error);
      set({ error: error.message });
      return null;
    }
  },

  addCar: async (carData) => {
    set({ loading: true, error: null });
    try {
      const carsRef = collection(db, 'cars');
      const docRef = await addDoc(carsRef, {
        ...carData,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      // Refresh cars list
      await get().fetchCars();

      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      console.error('Error adding car:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCar: async (id: string, carData: Partial<Car>) => {
    set({ loading: true, error: null });
    try {
      const carRef = doc(db, 'cars', id);
      await updateDoc(carRef, {
        ...carData,
        updated_at: Timestamp.now(),
      });

      // Update local state
      set(state => ({
        cars: state.cars.map(car =>
          car.id === id
            ? { ...car, ...carData, updated_at: new Date().toISOString() }
            : car
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error updating car:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteCar: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'cars', id));

      // Update local state
      set(state => ({
        cars: state.cars.filter(car => car.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error deleting car:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  subscribeToCars: (filters?: CarFilters) => {
    const carsRef = collection(db, 'cars');
    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.published !== undefined) {
      constraints.push(where('published', '==', filters.published));
    }
    if (filters?.created_by) {
      constraints.push(where('created_by', '==', filters.created_by));
    }

    const q = query(carsRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cars: Car[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        })) as Car[];

        set({ cars, loading: false, error: null });
      },
      (error) => {
        console.error('Error in cars subscription:', error);
        set({ error: error.message, loading: false });
      }
    );

    return unsubscribe;
  },

  getAvailableCars: () => {
    return get().cars.filter(car => car.published && car.status === 'available');
  },

  getCarsByManager: (managerId: string) => {
    return get().cars.filter(car => car.created_by === managerId);
  },

  approvePartnerCar: async (carId: string, adminUid: string, purchasePrice?: number, repaymentPercentage?: number) => {
    const updateData: Record<string, any> = {
      partner_approved: true,
      partner_approved_by: adminUid,
      partner_approved_at: new Date().toISOString(),
      status: 'available',
      published: true,
      updated_at: Timestamp.now(),
    };
    if (purchasePrice != null && purchasePrice > 0) {
      updateData.purchase_price = purchasePrice;
    }
    if (repaymentPercentage != null && repaymentPercentage > 0) {
      updateData.repayment_percentage = repaymentPercentage;
    }
    await updateDoc(doc(db, 'cars', carId), updateData);
  },

  rejectPartnerCar: async (carId: string, reason?: string) => {
    await updateDoc(doc(db, 'cars', carId), {
      partner_approved: false,
      partner_rejection_reason: reason || '',
      partner_approved_at: new Date().toISOString(),
      updated_at: Timestamp.now(),
    });
  },

  resolveChangeRequest: async (carId: string, approved: boolean, response: string) => {
    await updateDoc(doc(db, 'cars', carId), {
      change_request_pending: false,
      change_request_resolved: true,
      change_request_approved: approved,
      change_request_response: response,
      change_request_resolved_at: new Date().toISOString(),
      updated_at: Timestamp.now(),
    });
  },
}));
