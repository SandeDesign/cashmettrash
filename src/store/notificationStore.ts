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
  onSnapshot,
  QueryConstraint,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;

  // CRUD operations
  fetchNotifications: (user_id: string) => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Promise<string>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (user_id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  // Real-time subscription
  subscribeToNotifications: (user_id: string) => () => void;

  // Helper methods
  getUnreadNotifications: () => Notification[];
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  unreadCount: 0,

  fetchNotifications: async (user_id: string) => {
    set({ loading: true, error: null });
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('user_id', '==', user_id),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(q);

      const notifications: Notification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        read_at: doc.data().read_at?.toDate?.()?.toISOString(),
      })) as Notification[];

      const unreadCount = notifications.filter(n => !n.read).length;

      set({ notifications, unreadCount, loading: false });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      set({ error: error.message, loading: false });
    }
  },

  createNotification: async (notification: Omit<Notification, 'id' | 'created_at'>) => {
    try {
      const notificationData = {
        ...notification,
        created_at: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationData);

      // Update local state if it's for the current user
      const currentNotifications = get().notifications;
      if (currentNotifications.length > 0 && currentNotifications[0].user_id === notification.user_id) {
        set(state => ({
          notifications: [
            {
              id: docRef.id,
              ...notification,
              created_at: new Date().toISOString(),
            },
            ...state.notifications,
          ],
          unreadCount: state.unreadCount + (notification.read ? 0 : 1),
        }));
      }

      return docRef.id;
    } catch (error: any) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  markAsRead: async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        read_at: Timestamp.now(),
      });

      // Update local state
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllAsRead: async (user_id: string) => {
    try {
      const unreadNotifications = get().notifications.filter(n => !n.read);

      // Update all unread notifications
      const promises = unreadNotifications.map(n =>
        updateDoc(doc(db, 'notifications', n.id), {
          read: true,
          read_at: Timestamp.now(),
        })
      );

      await Promise.all(promises);

      // Update local state
      set(state => ({
        notifications: state.notifications.map(n => ({
          ...n,
          read: true,
          read_at: n.read_at || new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));

      // Update local state
      set(state => {
        const notification = state.notifications.find(n => n.id === id);
        return {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: notification && !notification.read
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  subscribeToNotifications: (user_id: string) => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('user_id', '==', user_id),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications: Notification[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          read_at: doc.data().read_at?.toDate?.()?.toISOString(),
        })) as Notification[];

        const unreadCount = notifications.filter(n => !n.read).length;

        set({ notifications, unreadCount, loading: false, error: null });
      },
      (error) => {
        console.error('Error in notifications subscription:', error);
        set({ error: error.message, loading: false });
      }
    );

    return unsubscribe;
  },

  getUnreadNotifications: () => {
    return get().notifications.filter(n => !n.read);
  },

  getUnreadCount: () => {
    return get().unreadCount;
  },
}));
