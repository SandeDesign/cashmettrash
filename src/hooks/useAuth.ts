// src/hooks/useAuth.ts
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

/** Startpagina per rol. */
export const DASHBOARD_PAD = {
  klant: '/mijn',
  jayce: '/jayce',
  admin: '/admin',
} as const;

export const useAuth = () => {
  const { user, loading, error, initializeAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isKlant: user?.rol === 'klant',
    isJayce: user?.rol === 'jayce',
    isAdmin: user?.rol === 'admin',
    dashboardPad: user ? DASHBOARD_PAD[user.rol] : '/login',
  };
};
