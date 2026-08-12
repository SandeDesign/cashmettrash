import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../shared/Loading';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('customer' | 'manager' | 'admin' | 'partner')[];
  redirectTo?: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login'
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vl-bg-primary)' }}>
        <Loading text="Autorisatie controleren..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Lock features for pending customers - only /cars and /profile are allowed
  if (user.role === 'customer' && user.verification_status === 'pending') {
    const currentPath = location.pathname;
    // Allow /cars, /pending-approval, /profile, and /book routes for pending users
    const allowedPaths = ['/cars', '/pending-approval', '/profile'];
    const isAllowed = allowedPaths.includes(currentPath) || currentPath.startsWith('/book');

    if (!isAllowed) {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  // Lock features for pending partners - redirect to pending-approval (same as customers)
  if (user.role === 'partner' && user.verification_status === 'pending') {
    const currentPath = location.pathname;
    const allowedPaths = ['/pending-approval', '/partner/business', '/profile'];
    const isAllowed = allowedPaths.includes(currentPath);

    if (!isAllowed) {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  return <>{children}</>;
};

export default RoleGuard;