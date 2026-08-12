import { create } from 'zustand';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
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
import { Booking } from '../types';
import { logActivity, ACTIVITY_ACTIONS } from '../utils/activityLogger';
import { useContractStore } from './contractStore';
import { useNotificationStore } from './notificationStore';
import { sendLockPeriodEmail } from '../utils/email';

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;

  // CRUD operations
  fetchBookings: (filters?: BookingFilters) => Promise<void>;
  fetchBookingById: (id: string) => Promise<Booking | null>;
  createBooking: (bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateBooking: (id: string, bookingData: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  cancelBooking: (id: string, reason: string) => Promise<void>;
  confirmCancellation: (bookingId: string, userId: string) => Promise<void>;
  requestCancellation: (bookingId: string, reason: string) => Promise<void>;
  denyCancellation: (bookingId: string, userId: string, reason: string) => Promise<void>;
  suspendBooking: (id: string, reason: string, userId: string, hasPenalty: boolean, penaltyAmount?: number) => Promise<void>;
  extendBooking: (id: string) => Promise<void>;

  // Extension request operations
  requestExtension: (bookingId: string, extensionType: '6_months' | '12_months') => Promise<void>;
  approveExtension: (bookingId: string, extensionType: '6_months' | '12_months', userId: string) => Promise<void>;
  denyExtension: (bookingId: string, extensionType: '6_months' | '12_months', userId: string, reason: string) => Promise<void>;
  signAndSetLockPeriod: (
    bookingId: string,
    extensionType: '6_months' | '12_months',
    signatureDataUrl: string,
    userId: string,
    customerEmail: string,
    customerName: string,
    carName: string,
    weeklyRate: number,
    templateSubject: string,
    templateBody: string
  ) => Promise<void>;

  // Borg (deposit) confirmation
  confirmBorg: (bookingId: string, userId: string) => Promise<void>;

  // Delivery cost confirmation
  confirmDeliveryCost: (bookingId: string, userId: string) => Promise<void>;

  // Pickup/Return operations
  processPickup: (bookingId: string, userId: string, pickupData: {
    scheduledDate: string;
    notes: string;
    photos: string[];
  }) => Promise<void>;
  processReturn: (bookingId: string, userId: string, returnData: {
    scheduledDate: string;
    notes: string;
    photos: string[];
    hasDamage: boolean;
    damageNotes?: string;
  }) => Promise<void>;

  // Real-time subscription
  subscribeToBookings: (filters?: BookingFilters) => () => void;

  // Helper methods
  getCustomerBookings: (customerId: string) => Booking[];
  getActiveBookings: () => Booking[];
  getBookingsByStatus: (status: Booking['status']) => Booking[];
}

export interface BookingFilters {
  customer_id?: string;
  car_id?: string;
  status?: Booking['status'];
  payment_status?: Booking['payment_status'];
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  loading: false,
  error: null,

  fetchBookings: async (filters?: BookingFilters) => {
    set({ loading: true, error: null });
    try {
      const bookingsRef = collection(db, 'bookings');
      const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];

      if (filters?.customer_id) {
        constraints.push(where('customer_id', '==', filters.customer_id));
      }
      if (filters?.car_id) {
        constraints.push(where('car_id', '==', filters.car_id));
      }
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.payment_status) {
        constraints.push(where('payment_status', '==', filters.payment_status));
      }

      const q = query(bookingsRef, ...constraints);
      const snapshot = await getDocs(q);

      const bookings: Booking[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        cancelled_at: doc.data().cancelled_at?.toDate?.()?.toISOString(),
      })) as Booking[];

      set({ bookings, loading: false });
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchBookingById: async (id: string) => {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', id));
      if (bookingDoc.exists()) {
        return {
          id: bookingDoc.id,
          ...bookingDoc.data(),
          created_at: bookingDoc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: bookingDoc.data().updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          cancelled_at: bookingDoc.data().cancelled_at?.toDate?.()?.toISOString(),
        } as Booking;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      set({ error: error.message });
      return null;
    }
  },

  createBooking: async (bookingData) => {
    set({ loading: true, error: null });
    try {
      const bookingsRef = collection(db, 'bookings');
      const docRef = await addDoc(bookingsRef, {
        ...bookingData,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      // Log activity
      await logActivity({
        user_id: bookingData.customer_id,
        user_name: bookingData.customer_name,
        user_email: bookingData.customer_email,
        user_role: 'customer',
        action: ACTIVITY_ACTIONS.CREATE_BOOKING,
        description: `Nieuwe boeking aangemaakt voor ${bookingData.car_info}`,
        entity_type: 'booking',
        entity_id: docRef.id,
        metadata: {
          car_id: bookingData.car_id,
          weeks_rented: bookingData.weeks_rented,
          total_price: bookingData.total_price
        }
      });

      // Refresh bookings list
      await get().fetchBookings();

      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating booking:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateBooking: async (id: string, bookingData: Partial<Booking>) => {
    set({ loading: true, error: null });
    try {
      const bookingRef = doc(db, 'bookings', id);
      await updateDoc(bookingRef, {
        ...bookingData,
        updated_at: Timestamp.now(),
      });

      // Update local state
      set(state => ({
        bookings: state.bookings.map(booking =>
          booking.id === id
            ? { ...booking, ...bookingData, updated_at: new Date().toISOString() }
            : booking
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error updating booking:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteBooking: async (id: string) => {
    set({ loading: true, error: null });
    try {
      // Delete associated contracts first
      const contractsSnapshot = await getDocs(
        query(collection(db, 'contracts'), where('booking_id', '==', id))
      );

      const deletePromises = contractsSnapshot.docs.map(contractDoc =>
        deleteDoc(doc(db, 'contracts', contractDoc.id))
      );
      await Promise.all(deletePromises);

      // Delete the booking
      const bookingRef = doc(db, 'bookings', id);
      await deleteDoc(bookingRef);

      // Update local state
      set(state => ({
        bookings: state.bookings.filter(booking => booking.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  cancelBooking: async (id: string, reason: string = '') => {
    set({ loading: true, error: null });
    try {
      // Get booking data for logging
      const booking = get().bookings.find(b => b.id === id);

      const bookingRef = doc(db, 'bookings', id);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        ...(reason ? { cancellation_reason: reason } : {}),
        cancelled_at: Timestamp.now(),
        cancellation_confirmed: false, // Admin must confirm before car becomes available
        updated_at: Timestamp.now(),
      });

      // Log activity
      if (booking) {
        await logActivity({
          user_id: booking.customer_id,
          user_name: booking.customer_name,
          user_email: booking.customer_email,
          user_role: 'customer',
          action: ACTIVITY_ACTIONS.CANCEL_BOOKING,
          description: `Boeking geannuleerd voor ${booking.car_info}`,
          entity_type: 'booking',
          entity_id: id,
          metadata: {
            reason,
            car_id: booking.car_id
          }
        });
      }

      // Update local state
      set(state => ({
        bookings: state.bookings.map(booking =>
          booking.id === id
            ? {
                ...booking,
                status: 'cancelled' as const,
                ...(reason ? { cancellation_reason: reason } : {}),
                cancelled_at: new Date().toISOString(),
                cancellation_confirmed: false,
                updated_at: new Date().toISOString(),
              }
            : booking
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  confirmCancellation: async (bookingId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      // Get the booking to access car_id
      const booking = get().bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      // Update booking to mark cancellation as confirmed
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        cancellation_confirmed: true,
        cancellation_confirmed_at: Timestamp.now(),
        cancellation_confirmed_by: userId,
        updated_at: Timestamp.now(),
      });

      // Set car back to available
      const carRef = doc(db, 'cars', booking.car_id);
      await updateDoc(carRef, {
        status: 'available',
        updated_at: Timestamp.now(),
      });

      // Update local state
      set(state => ({
        bookings: state.bookings.map(b =>
          b.id === bookingId
            ? {
                ...b,
                cancellation_confirmed: true,
                cancellation_confirmed_at: new Date().toISOString(),
                cancellation_confirmed_by: userId,
                updated_at: new Date().toISOString(),
              }
            : b
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error confirming cancellation:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  requestCancellation: async (bookingId: string, reason: string) => {
    set({ loading: true, error: null });
    try {
      const booking = get().bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Boeking niet gevonden');

      // Validate 4-week rule
      const startDate = new Date(booking.start_date);
      const now = new Date();
      const weeksDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
      if (weeksDiff < 4) {
        throw new Error('U kunt pas opzeggen na 4 weken huur.');
      }

      // Validate no active lock period
      if (booking.lock_period && booking.lock_period_end_date) {
        const lockEnd = new Date(booking.lock_period_end_date);
        if (lockEnd > now) {
          const months = booking.lock_period === '6_months' ? 6 : 12;
          throw new Error(`U heeft een actieve vastzetperiode van ${months} maanden. Opzeggen is pas mogelijk na ${lockEnd.toLocaleDateString('nl-NL')}.`);
        }
      }

      await updateDoc(doc(db, 'bookings', bookingId), {
        cancellation_requested: true,
        cancellation_requested_at: Timestamp.now(),
        cancellation_request_reason: reason,
        cancellation_denial_reason: null,
        updated_at: Timestamp.now(),
      });

      await logActivity({
        user_id: booking.customer_id,
        user_name: booking.customer_snapshot?.name || '',
        user_email: booking.customer_snapshot?.email || '',
        user_role: 'customer',
        action: ACTIVITY_ACTIONS.CANCEL_BOOKING,
        description: `Opzeggingsaanvraag ingediend`,
        entity_type: 'booking',
        entity_id: bookingId,
        metadata: { reason }
      });

      set(state => ({
        bookings: state.bookings.map(b =>
          b.id === bookingId
            ? {
                ...b,
                cancellation_requested: true,
                cancellation_requested_at: new Date().toISOString(),
                cancellation_request_reason: reason,
                cancellation_denial_reason: undefined,
                updated_at: new Date().toISOString(),
              }
            : b
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error requesting cancellation:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  denyCancellation: async (bookingId: string, userId: string, reason: string) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        cancellation_requested: false,
        cancellation_denied_at: Timestamp.now(),
        cancellation_denied_by: userId,
        cancellation_denial_reason: reason,
        updated_at: Timestamp.now(),
      });

      set(state => ({
        bookings: state.bookings.map(b =>
          b.id === bookingId
            ? {
                ...b,
                cancellation_requested: false,
                cancellation_denied_at: new Date().toISOString(),
                cancellation_denied_by: userId,
                cancellation_denial_reason: reason,
                updated_at: new Date().toISOString(),
              }
            : b
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error denying cancellation:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  confirmBorg: async (bookingId: string, userId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        borg_confirmed: true,
        borg_confirmed_by: userId,
        borg_confirmed_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      set(state => ({
        bookings: state.bookings.map(b =>
          b.id === bookingId
            ? {
                ...b,
                borg_confirmed: true,
                borg_confirmed_by: userId,
                borg_confirmed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : b
        ),
      }));
    } catch (error: any) {
      console.error('Error confirming borg:', error);
      throw error;
    }
  },

  confirmDeliveryCost: async (bookingId: string, userId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        delivery_cost_confirmed: true,
        delivery_cost_confirmed_by: userId,
        delivery_cost_confirmed_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      set(state => ({
        bookings: state.bookings.map(b =>
          b.id === bookingId
            ? {
                ...b,
                delivery_cost_confirmed: true,
                delivery_cost_confirmed_by: userId,
                delivery_cost_confirmed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : b
        ),
      }));
    } catch (error: any) {
      console.error('Error confirming delivery cost:', error);
      throw error;
    }
  },

  suspendBooking: async (id: string, reason: string, userId: string, hasPenalty: boolean, penaltyAmount?: number) => {
    set({ loading: true, error: null });
    try {
      const bookingRef = doc(db, 'bookings', id);
      await updateDoc(bookingRef, {
        status: 'suspended',
        suspension_reason: reason,
        suspended_at: Timestamp.now(),
        suspended_by: userId,
        has_penalty: hasPenalty,
        penalty_amount: penaltyAmount || null,
        escalation_required: hasPenalty,
        updated_at: Timestamp.now(),
      });

      // Update local state
      set(state => ({
        bookings: state.bookings.map(booking =>
          booking.id === id
            ? {
                ...booking,
                status: 'suspended' as const,
                suspension_reason: reason,
                suspended_at: new Date().toISOString(),
                suspended_by: userId,
                has_penalty: hasPenalty,
                penalty_amount: penaltyAmount,
                escalation_required: hasPenalty,
                updated_at: new Date().toISOString(),
              }
            : booking
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error suspending booking:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  subscribeToBookings: (filters?: BookingFilters) => {
    const bookingsRef = collection(db, 'bookings');
    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];

    if (filters?.customer_id) {
      constraints.push(where('customer_id', '==', filters.customer_id));
    }
    if (filters?.car_id) {
      constraints.push(where('car_id', '==', filters.car_id));
    }
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.payment_status) {
      constraints.push(where('payment_status', '==', filters.payment_status));
    }

    const q = query(bookingsRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookings: Booking[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          cancelled_at: doc.data().cancelled_at?.toDate?.()?.toISOString(),
        })) as Booking[];

        set({ bookings, loading: false, error: null });
      },
      (error) => {
        console.error('Error in bookings subscription:', error);
        set({ error: error.message, loading: false });
      }
    );

    return unsubscribe;
  },

  getCustomerBookings: (customerId: string) => {
    return get().bookings.filter(booking => booking.customer_id === customerId);
  },

  getActiveBookings: () => {
    return get().bookings.filter(booking =>
      booking.status === 'active' || booking.status === 'confirmed'
    );
  },

  getBookingsByStatus: (status: Booking['status']) => {
    return get().bookings.filter(booking => booking.status === status);
  },

  extendBooking: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const booking = get().bookings.find(b => b.id === id);
      if (!booking) throw new Error('Boeking niet gevonden');

      // Calculate extension: 6 months (26 weeks) with 1 month (4 weeks) discount
      // Customer pays for 5 months (22 weeks) but gets 6 months (26 weeks)
      const extensionWeeks = 26;
      const paidWeeks = 22; // 5 months worth of payment

      // Calculate new end date (add 26 weeks)
      const currentEndDate = new Date(booking.end_date!);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + (extensionWeeks * 7));

      // Calculate additional cost (22 weeks at current weekly rate)
      const extensionCost = booking.weekly_rate * paidWeeks;
      const newTotalPrice = booking.total_price + extensionCost;
      const newWeeksRented = booking.weeks_rented + extensionWeeks;

      // Update booking
      const bookingRef = doc(db, 'bookings', id);
      await updateDoc(bookingRef, {
        end_date: newEndDate.toISOString(),
        weeks_rented: newWeeksRented,
        total_price: newTotalPrice,
        extended: true,
        extension_date: new Date().toISOString(),
        extension_weeks: extensionWeeks,
        extension_paid_weeks: paidWeeks,
        extension_discount_weeks: extensionWeeks - paidWeeks, // 4 weeks discount
        updated_at: Timestamp.now(),
      });

      // Update local state
      set(state => ({
        bookings: state.bookings.map(booking =>
          booking.id === id
            ? {
                ...booking,
                end_date: newEndDate.toISOString(),
                weeks_rented: newWeeksRented,
                total_price: newTotalPrice,
                updated_at: new Date().toISOString(),
              }
            : booking
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error extending booking:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Request extension (Klant vraagt verlengingN)
  signAndSetLockPeriod: async (
    bookingId,
    extensionType,
    signatureDataUrl,
    userId,
    customerEmail,
    customerName,
    carName,
    weeklyRate,
    templateSubject,
    templateBody
  ) => {
    set({ loading: true, error: null });
    try {
      const booking = get().bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Boeking niet gevonden');

      // Calculate lock period start/end dates (same Monday logic as approveExtension)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const lockPeriodStartDate = new Date(now);
      lockPeriodStartDate.setHours(0, 0, 0, 0);
      const daysToNextMonday = (1 - dayOfWeek + 7) % 7 || 7;
      if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        lockPeriodStartDate.setDate(lockPeriodStartDate.getDate() + daysToNextMonday);
      } else {
        lockPeriodStartDate.setDate(lockPeriodStartDate.getDate() + daysToNextMonday + 7);
      }
      const lockPeriodEndDate = new Date(lockPeriodStartDate);
      if (extensionType === '6_months') {
        lockPeriodEndDate.setMonth(lockPeriodEndDate.getMonth() + 6);
      } else {
        lockPeriodEndDate.setMonth(lockPeriodEndDate.getMonth() + 12);
      }

      const months = extensionType === '6_months' ? 6 : 12;
      const startStr = lockPeriodStartDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
      const endStr = lockPeriodEndDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

      // Create signed extension contract in Firestore
      const extensionContractData = {
        booking_id: bookingId,
        customer_id: booking.customer_id,
        type: 'extension' as const,
        extension_type: extensionType,
        contract_number: `EXT-${Date.now()}`,
        signed: true,
        signed_at: new Date().toISOString(),
        customer_signature_url: signatureDataUrl,
        status: 'signed' as const,
        lock_period_start_date: lockPeriodStartDate.toISOString(),
        lock_period_end_date: lockPeriodEndDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const contractRef = doc(collection(db, 'contracts'));
      await setDoc(contractRef, { ...extensionContractData, id: contractRef.id });

      // Update booking with lock period + contract reference
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        lock_period: extensionType,
        lock_period_start_date: lockPeriodStartDate.toISOString(),
        lock_period_end_date: lockPeriodEndDate.toISOString(),
        lock_period_contract_id: contractRef.id,
        updated_at: Timestamp.now(),
      });

      // Update local state
      set(state => ({
        bookings: state.bookings.map(b =>
          b.id === bookingId
            ? {
                ...b,
                lock_period: extensionType,
                lock_period_start_date: lockPeriodStartDate.toISOString(),
                lock_period_end_date: lockPeriodEndDate.toISOString(),
                updated_at: new Date().toISOString(),
              }
            : b
        ),
        loading: false,
      }));

      // Send email to customer
      try {
        await sendLockPeriodEmail(
          customerEmail,
          customerName,
          carName,
          months,
          startStr,
          endStr,
          weeklyRate,
          templateSubject,
          templateBody
        );
      } catch (emailErr) {
        console.error('[signAndSetLockPeriod] Email error:', emailErr);
      }

      // In-app notification for customer
      const notifStore = useNotificationStore.getState();
      await notifStore.createNotification({
        user_id: booking.customer_id,
        type: 'lock_period_signed',
        title: `Vastzetperiode ${months} maanden geactiveerd`,
        message: `Uw contract voor ${carName} is ondertekend. Vastzetperiode loopt van ${startStr} t/m ${endStr}.`,
        link: '/bookings',
        read: false,
        data: { booking_id: bookingId, car_name: carName, lock_period: extensionType },
      });

      // In-app notifications for all admins and managers
      try {
        const usersSnap = await getDocs(
          query(collection(db, 'users'), where('role', 'in', ['admin', 'manager']))
        );
        const adminNotifPromises = usersSnap.docs.map(d =>
          notifStore.createNotification({
            user_id: d.id,
            type: 'lock_period_signed',
            title: `Klant heeft contract getekend (${months} mnd)`,
            message: `${customerName} heeft de vastzetperiode van ${months} maanden ondertekend voor ${carName}.`,
            link: '/admin/bookings',
            read: false,
            data: { booking_id: bookingId, car_name: carName, customer_name: customerName, lock_period: extensionType },
          })
        );
        await Promise.all(adminNotifPromises);
      } catch (notifErr) {
        console.error('[signAndSetLockPeriod] Admin notification error:', notifErr);
      }

      await logActivity('lock_period_signed', `Lock period signed: ${extensionType}`, bookingId);
    } catch (error: any) {
      console.error('Error signing lock period:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  requestExtension: async (bookingId: string, extensionType: '6_months' | '12_months') => {
    set({ loading: true, error: null });
    try {
      const booking = get().bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Boeking niet gevonden');

      // Add extension request to existing array
      const newExtensionRequest = {
        type: extensionType,
        requested_at: new Date().toISOString(),
        status: 'pending' as const,
      };

      const existingRequests = booking.extension_requests || [];
      const updatedRequests = [...existingRequests, newExtensionRequest];

      // Update booking
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        extension_requests: updatedRequests,
        updated_at: Timestamp.now(),
      });

      // Update local state
      set(state => ({
        bookings: state.bookings.map(b =>
          b.id === bookingId
            ? { ...b, extension_requests: updatedRequests, updated_at: new Date().toISOString() }
            : b
        ),
        loading: false,
      }));

      await logActivity('extension_requested', `Extension requested: ${extensionType}`, bookingId);
    } catch (error: any) {
      console.error('Error requesting extension:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Approve extension (Admin/Manager accepteert)
  approveExtension: async (bookingId: string, extensionType: '6_months' | '12_months', userId: string) => {
    set({ loading: true, error: null });
    try {
      const booking = get().bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Boeking niet gevonden');

      // Calculate lock period dates - CORRECT FRIDAY LOGIC
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

      const lockPeriodStartDate = new Date(now);
      lockPeriodStartDate.setHours(0, 0, 0, 0);

      // Calculate days to next Monday
      const daysToNextMonday = (1 - dayOfWeek + 7) % 7 || 7;

      if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        // Monday-Thursday: Start from next Monday
        lockPeriodStartDate.setDate(lockPeriodStartDate.getDate() + daysToNextMonday);
      } else {
        // Friday-Sunday: Start from Monday of week AFTER NEXT
        lockPeriodStartDate.setDate(lockPeriodStartDate.getDate() + daysToNextMonday + 7);
      }

      // Calculate end date (add 6 or 12 months from start date)
      const lockPeriodEndDate = new Date(lockPeriodStartDate);
      if (extensionType === '6_months') {
        lockPeriodEndDate.setMonth(lockPeriodEndDate.getMonth() + 6);
      } else {
        lockPeriodEndDate.setMonth(lockPeriodEndDate.getMonth() + 12);
      }

      // Update extension request status
      const updatedRequests = booking.extension_requests?.map(req =>
        req.type === extensionType && req.status === 'pending'
          ? {
              ...req,
              status: 'approved' as const,
              reviewed_by: userId,
              reviewed_at: new Date().toISOString(),
            }
          : req
      ) || [];

      // Update booking with lock period
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        lock_period: extensionType === '6_months' ? '6_months' : '12_months',
        lock_period_start_date: lockPeriodStartDate,
        lock_period_end_date: lockPeriodEndDate.toISOString(),
        extension_requests: updatedRequests,
        updated_at: Timestamp.now(),
      });

      // Update local state
      set(state => ({
        bookings: state.bookings.map(b =>
          b.id === bookingId
            ? {
                ...b,
                lock_period: extensionType === '6_months' ? '6_months' : '12_months',
                lock_period_start_date: lockPeriodStartDate,
                lock_period_end_date: lockPeriodEndDate.toISOString(),
                extension_requests: updatedRequests,
                updated_at: new Date().toISOString(),
              }
            : b
        ),
        loading: false,
      }));

      // Create extension contract automatically
      try {
        const contractStore = useContractStore.getState();
        await contractStore.createExtensionContract(bookingId, booking.customer_id, extensionType);
      } catch (contractError) {
        console.error('Error creating extension contract:', contractError);
        // Don't throw - contract creation failure shouldn't block extension approval
      }

      await logActivity('extension_approved', `Extension approved: ${extensionType}`, bookingId);
    } catch (error: any) {
      console.error('Error approving extension:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Deny extension
  denyExtension: async (bookingId: string, extensionType: '6_months' | '12_months', userId: string, reason: string) => {
    set({ loading: true, error: null });
    try {
      const booking = get().bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Boeking niet gevonden');

      // Update extension request status
      const updatedRequests = booking.extension_requests?.map(req =>
        req.type === extensionType && req.status === 'pending'
          ? {
              ...req,
              status: 'denied' as const,
              reviewed_by: userId,
              reviewed_at: new Date().toISOString(),
              denial_reason: reason,
            }
          : req
      ) || [];

      // Update booking
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        extension_requests: updatedRequests,
        updated_at: Timestamp.now(),
      });

      // Update local state
      set(state => ({
        bookings: state.bookings.map(b =>
          b.id === bookingId
            ? { ...b, extension_requests: updatedRequests, updated_at: new Date().toISOString() }
            : b
        ),
        loading: false,
      }));

      await logActivity('extension_denied', `Extension denied: ${extensionType}`, bookingId);
    } catch (error: any) {
      console.error('Error denying extension:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  processPickup: async (bookingId: string, userId: string, pickupData: {
    scheduledDate: string;
    notes: string;
    photos: string[];
  }) => {
    set({ loading: true, error: null });
    try {
      // Get the booking
      const booking = get().bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking niet gevonden');

      // Update booking with pickup data
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        pickup_status: 'completed',
        pickup_photos: pickupData.photos,
        pickup_scheduled_date: pickupData.scheduledDate,
        pickup_completed_date: new Date().toISOString(),
        pickup_by: userId,
        pickup_notes: pickupData.notes,
        status: 'active', // Booking is now active
        updated_at: Timestamp.now(),
      });

      // Update car status to rented
      const carRef = doc(db, 'cars', booking.car_id);
      await updateDoc(carRef, {
        status: 'rented',
        updated_at: Timestamp.now(),
      });

      // Update contract status to active if exists
      const contractsSnapshot = await getDocs(
        query(collection(db, 'contracts'), where('booking_id', '==', bookingId))
      );

      if (!contractsSnapshot.empty) {
        const contractDoc = contractsSnapshot.docs[0];
        await updateDoc(doc(db, 'contracts', contractDoc.id), {
          status: 'active',
          updated_at: Timestamp.now(),
        });
      }

      // Refresh bookings
      await get().fetchBookings();

      set({ loading: false });
    } catch (error: any) {
      console.error('Error processing pickup:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  processReturn: async (bookingId: string, userId: string, returnData: {
    scheduledDate: string;
    notes: string;
    photos: string[];
    hasDamage: boolean;
    damageNotes?: string;
  }) => {
    set({ loading: true, error: null });
    try {
      // Get the booking
      const booking = get().bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking niet gevonden');

      // Prepare return update data
      const returnNotes = `${returnData.notes}${returnData.hasDamage ? `\n\nSCHADE: ${returnData.damageNotes}` : ''}`;

      // Update booking with return data
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        return_status: 'completed',
        return_photos: returnData.photos,
        return_scheduled_date: returnData.scheduledDate,
        return_completed_date: new Date().toISOString(),
        return_by: userId,
        return_notes: returnNotes,
        status: 'completed', // Booking is now completed
        updated_at: Timestamp.now(),
      });

      // Update car status back to available, clear contract fields
      const carRef = doc(db, 'cars', booking.car_id);
      await updateDoc(carRef, {
        status: 'available',
        contract_signed: false,
        active_contract_id: null,
        updated_at: Timestamp.now(),
      });

      // Get the contract
      const contractsSnapshot = await getDocs(
        query(collection(db, 'contracts'), where('booking_id', '==', bookingId))
      );

      if (!contractsSnapshot.empty) {
        const contractDoc = contractsSnapshot.docs[0];
        const contractId = contractDoc.id;

        // Terminate the contract
        await updateDoc(doc(db, 'contracts', contractId), {
          status: 'terminated',
          terminated_at: Timestamp.now(),
          termination_reason: 'Contract beëindigd na afleveren auto',
          updated_at: Timestamp.now(),
        });

        // Create termination agreement document
        // This would generate a PDF similar to the main contract
        // For now, we'll just create a reference
        const terminationContractId = `termination_${contractId}_${Date.now()}`;

        // Update booking with termination contract info
        await updateDoc(bookingRef, {
          termination_contract_id: terminationContractId,
          termination_contract_created_at: new Date().toISOString(),
          termination_contract_signed: true, // Auto-signed by return process
        });
      }

      // Notify waitlist automatically when car becomes available
      try {
        // Get all waiting entries for this car
        const waitlistRef = collection(db, 'waitlist');
        const waitlistQuery = query(
          waitlistRef,
          where('car_id', '==', booking.car_id),
          where('status', '==', 'waiting')
        );
        const waitlistSnapshot = await getDocs(waitlistQuery);

        // Notify each person on waitlist
        const notificationPromises = waitlistSnapshot.docs.map(async (waitlistDoc) => {
          const waitlistEntry = waitlistDoc.data();

          // Update waitlist entry status
          await updateDoc(doc(db, 'waitlist', waitlistDoc.id), {
            status: 'notified',
            notified: true,
            notification_sent_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          });

          // Create notification
          await addDoc(collection(db, 'notifications'), {
            user_id: waitlistEntry.customer_id,
            type: 'car_available',
            title: 'Auto Beschikbaar!',
            message: `De auto waar u op wacht is nu beschikbaar. Boek nu voordat iemand anders u voor is!`,
            link: `/cars`,
            data: {
              car_id: booking.car_id,
              waitlist_id: waitlistDoc.id,
            },
            read: false,
            created_at: Timestamp.now(),
          });
        });

        await Promise.all(notificationPromises);

        if (waitlistSnapshot.docs.length > 0) {
          console.log(`Notified ${waitlistSnapshot.docs.length} customers on waitlist for car ${booking.car_id}`);
        }
      } catch (waitlistError) {
        console.error('Error notifying waitlist:', waitlistError);
        // Don't throw - continue with return process even if waitlist notification fails
      }

      // Refresh bookings
      await get().fetchBookings();

      set({ loading: false });
    } catch (error: any) {
      console.error('Error processing return:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
