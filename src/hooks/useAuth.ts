import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';

export const useAuth = () => {
  const { user, loading, error, initializeAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only initialize once on mount

  // Navigate to appropriate dashboard when user logs in
  useEffect(() => {
    if (user && !loading) {
      const currentPath = window.location.pathname;

      // Check if onboarding is completed
      const onboardingCompleted = user.onboarding_completed === true;
      const isPending = user.verification_status === 'pending';
      const isApproved = user.verification_status === 'approved';

      // Paths that should never trigger navigation
      const protectedPaths = ['/unauthorized', '/faq', '/terms', '/privacy', '/cookies'];
      if (protectedPaths.some(path => currentPath.startsWith(path))) {
        return;
      }

      // Force onboarding if not completed
      if (!onboardingCompleted) {
        if (user.role === 'partner') {
          // Partners have their own onboarding wizard
          if (currentPath !== '/partner-onboarding') {
            navigate('/partner-onboarding', { replace: true });
            return;
          }
        } else if (user.role === 'customer') {
          // Customers go to customer onboarding
          if (currentPath !== '/onboarding') {
            navigate('/onboarding', { replace: true });
            return;
          }
        }
        // Admin/manager don't need onboarding, skip
        if (user.role === 'customer' || user.role === 'partner') {
          return;
        }
      }

      // If onboarding completed but pending approval
      if (onboardingCompleted && isPending) {
        if (user.role === 'customer') {
          const allowedPaths = ['/pending-approval', '/cars', '/profile'];
          if (!allowedPaths.includes(currentPath) && !currentPath.startsWith('/book')) {
            navigate('/pending-approval', { replace: true });
            return;
          }
        } else if (user.role === 'partner') {
          const allowedPaths = ['/pending-approval', '/partner/business', '/partner', '/partner/documents', '/partner/werkplaats', '/partner/cars', '/profile'];
          if (!allowedPaths.some(p => currentPath.startsWith(p)) && currentPath !== '/pending-approval') {
            navigate('/partner', { replace: true });
            return;
          }
        }
      }

      // Only redirect if user is on login/register/landing pages and is approved
      const publicPages = ['/login', '/registreren', '/partner-registreren', '/', '/pending-approval'];
      if (onboardingCompleted && isApproved && publicPages.includes(currentPath)) {
        switch (user.role) {
          case 'customer':
            navigate('/dashboard', { replace: true });
            break;
          case 'manager':
            navigate('/manager', { replace: true });
            break;
          case 'admin':
            navigate('/admin', { replace: true });
            break;
          case 'partner':
            navigate('/partner', { replace: true });
            break;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, loading, user?.onboarding_completed, user?.verification_status]); // Track user ID and verification status

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isCustomer: user?.role === 'customer',
    isManager: user?.role === 'manager',
    isAdmin: user?.role === 'admin',
    isVerified: user?.verification_status === 'approved'
  };
};