import { create } from 'zustand';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ActivityLog } from '../types';

interface ActivityLogStore {
  logs: ActivityLog[];
  loading: boolean;
  error: string | null;
  fetchRecentLogs: (limitCount?: number) => Promise<void>;
  fetchLogsByUser: (userId: string, limitCount?: number) => Promise<void>;
  fetchLogsByRole: (role: 'customer' | 'manager' | 'admin', limitCount?: number) => Promise<void>;
}

export const useActivityLogStore = create<ActivityLogStore>((set) => ({
  logs: [],
  loading: false,
  error: null,

  fetchRecentLogs: async (limitCount = 50) => {
    try {
      set({ loading: true, error: null });

      const q = query(
        collection(db, 'activity_logs'),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];

      set({ logs, loading: false });
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchLogsByUser: async (userId: string, limitCount = 50) => {
    try {
      set({ loading: true, error: null });

      const q = query(
        collection(db, 'activity_logs'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];

      set({ logs, loading: false });
    } catch (error: any) {
      console.error('Error fetching user activity logs:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchLogsByRole: async (role: 'customer' | 'manager' | 'admin', limitCount = 50) => {
    try {
      set({ loading: true, error: null });

      const q = query(
        collection(db, 'activity_logs'),
        where('user_role', '==', role),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];

      set({ logs, loading: false });
    } catch (error: any) {
      console.error('Error fetching role activity logs:', error);
      set({ error: error.message, loading: false });
    }
  }
}));
