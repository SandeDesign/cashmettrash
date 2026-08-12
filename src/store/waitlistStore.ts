import { create } from 'zustand';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Waitlist } from '../types';

interface WaitlistState {
  waitlists: Waitlist[];
  loading: boolean;
  error: string | null;

  // CRUD operations
  fetchWaitlists: (car_id?: string) => Promise<void>;
  addToWaitlist: (car_id: string, customer_id: string, customerSnapshot: {
    name: string;
    email: string;
    phone: string;
  }) => Promise<string>;
  removeFromWaitlist: (id: string) => Promise<void>;
  notifyWaitlist: (car_id: string, available_from: string) => Promise<void>;
  notifyWithAlternatives: (customer_id: string, original_car_id: string, alternative_car_ids: string[], available_from: string) => Promise<void>;
  resetToWaiting: (id: string) => Promise<void>;
  markAsConverted: (id: string, booking_id: string) => Promise<void>;

  // Helper methods
  getWaitlistByCarId: (car_id: string) => Waitlist[];
  getCustomerWaitlists: (customer_id: string) => Waitlist[];
  isCustomerOnWaitlist: (car_id: string, customer_id: string) => boolean;
}

export const useWaitlistStore = create<WaitlistState>((set, get) => ({
  waitlists: [],
  loading: false,
  error: null,

  fetchWaitlists: async (car_id?: string) => {
    set({ loading: true, error: null });
    try {
      const waitlistRef = collection(db, 'waitlist');
      let q = query(waitlistRef, orderBy('created_at', 'asc'));

      if (car_id) {
        q = query(waitlistRef, where('car_id', '==', car_id), orderBy('created_at', 'asc'));
      }

      const snapshot = await getDocs(q);

      const waitlists: Waitlist[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        notification_sent_at: doc.data().notification_sent_at?.toDate?.()?.toISOString(),
        cancelled_at: doc.data().cancelled_at?.toDate?.()?.toISOString(),
      })) as Waitlist[];

      set({ waitlists, loading: false });
    } catch (error: any) {
      console.error('Error fetching waitlists:', error);
      set({ error: error.message, loading: false });
    }
  },

  addToWaitlist: async (car_id: string, customer_id: string, customerSnapshot: {
    name: string;
    email: string;
    phone: string;
  }) => {
    set({ loading: true, error: null });
    try {
      // Check if already on waitlist
      const existing = get().waitlists.find(
        w => w.car_id === car_id && w.customer_id === customer_id && w.status === 'waiting'
      );

      if (existing) {
        throw new Error('U staat al op de wachtlijst voor deze auto');
      }

      const waitlistData = {
        car_id,
        customer_id,
        customer_snapshot: customerSnapshot,
        status: 'waiting' as const,
        notified: false,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'waitlist'), waitlistData);

      // Update local state
      set(state => ({
        waitlists: [
          ...state.waitlists,
          {
            id: docRef.id,
            ...waitlistData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ],
        loading: false,
      }));

      return docRef.id;
    } catch (error: any) {
      console.error('Error adding to waitlist:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  removeFromWaitlist: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'waitlist', id));

      // Update local state
      set(state => ({
        waitlists: state.waitlists.filter(w => w.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error removing from waitlist:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  notifyWaitlist: async (car_id: string, available_from: string) => {
    set({ loading: true, error: null });
    try {
      // Get all waiting entries for this car
      const waitingList = get().waitlists.filter(
        w => w.car_id === car_id && w.status === 'waiting'
      );

      // Format the date for the message
      const availableDate = new Date(available_from).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // Create notifications for each customer
      for (const waitlistEntry of waitingList) {
        // Update waitlist entry
        await updateDoc(doc(db, 'waitlist', waitlistEntry.id), {
          status: 'notified',
          notified: true,
          notification_sent_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });

        // Create notification with available_from date
        await addDoc(collection(db, 'notifications'), {
          user_id: waitlistEntry.customer_id,
          type: 'car_available',
          title: 'Auto Beschikbaar! 🚗',
          message: `Beschikbaar vanaf ${availableDate}. Klik om direct te boeken!`,
          link: `/book/${car_id}?from=${available_from}`, // Link with date param
          data: {
            car_id,
            waitlist_id: waitlistEntry.id,
            available_from, // Store the date in data
          },
          read: false,
          created_at: Timestamp.now(),
        });
      }

      // Refresh waitlists
      await get().fetchWaitlists();

      set({ loading: false });
    } catch (error: any) {
      console.error('Error notifying waitlist:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  notifyWithAlternatives: async (customer_id: string, original_car_id: string, alternative_car_ids: string[], available_from: string) => {
    set({ loading: true, error: null });
    try {
      // Find the waitlist entry for this customer and original car
      const waitlistEntry = get().waitlists.find(
        w => w.customer_id === customer_id && w.car_id === original_car_id && w.status === 'waiting'
      );

      if (!waitlistEntry) {
        throw new Error('Wachtlijst entry niet gevonden');
      }

      // Format the date for the message
      const availableDate = new Date(available_from).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // Update waitlist entry
      await updateDoc(doc(db, 'waitlist', waitlistEntry.id), {
        status: 'notified',
        notified: true,
        notification_sent_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      // Create notification with multiple car options
      await addDoc(collection(db, 'notifications'), {
        user_id: customer_id,
        type: 'alternative_cars',
        title: 'Alternatieve Auto\'s Beschikbaar! 🚗',
        message: `We hebben ${alternative_car_ids.length} ${alternative_car_ids.length === 1 ? 'auto' : 'auto\'s'} voor u beschikbaar vanaf ${availableDate}. Klik om te kiezen!`,
        link: `/book-multiple?cars=${alternative_car_ids.join(',')}&from=${available_from}`,
        data: {
          original_car_id,
          alternative_car_ids,
          waitlist_id: waitlistEntry.id,
          available_from,
        },
        read: false,
        created_at: Timestamp.now(),
      });

      // Refresh waitlists
      await get().fetchWaitlists();

      set({ loading: false });
    } catch (error: any) {
      console.error('Error notifying with alternatives:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  resetToWaiting: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'waitlist', id), {
        status: 'waiting',
        notified: false,
        notification_sent_at: null,
        updated_at: Timestamp.now(),
      });

      // Update local state
      set(state => ({
        waitlists: state.waitlists.map(w =>
          w.id === id
            ? {
                ...w,
                status: 'waiting' as const,
                notified: false,
                notification_sent_at: undefined,
                updated_at: new Date().toISOString(),
              }
            : w
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error resetting to waiting:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  markAsConverted: async (id: string, booking_id: string) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'waitlist', id), {
        status: 'converted',
        converted_to_booking_id: booking_id,
        updated_at: Timestamp.now(),
      });

      // Update local state
      set(state => ({
        waitlists: state.waitlists.map(w =>
          w.id === id
            ? {
                ...w,
                status: 'converted' as const,
                converted_to_booking_id: booking_id,
                updated_at: new Date().toISOString(),
              }
            : w
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error marking as converted:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getWaitlistByCarId: (car_id: string) => {
    return get().waitlists.filter(w => w.car_id === car_id && w.status === 'waiting');
  },

  getCustomerWaitlists: (customer_id: string) => {
    return get().waitlists.filter(w => w.customer_id === customer_id);
  },

  isCustomerOnWaitlist: (car_id: string, customer_id: string) => {
    return get().waitlists.some(
      w => w.car_id === car_id && w.customer_id === customer_id && w.status === 'waiting'
    );
  },
}));
