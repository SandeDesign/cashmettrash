// src/components/guards/RoleGuard.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../shared/Loading';
import type { Rol } from '../../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Rol[];
  redirectTo?: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles, redirectTo = '/login' }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Even geduld..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowedRoles.includes(user.rol)) {
    return <Navigate to="/geen-toegang" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
