// src/hooks/useAuth.ts
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import type { Rol } from '../types';

/** Startpagina per rol. */
export const DASHBOARD_PAD: Record<Rol, string> = {
  klant: '/mijn',
  jayce: '/jayce',
  moeder: '/mama',
  admin: '/admin',
};

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
    isMoeder: user?.rol === 'moeder',
    isAdmin: user?.rol === 'admin',
    dashboardPad: user ? DASHBOARD_PAD[user.rol] : '/login',
  };
};
