import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TourStep {
  id: string;
  target: string; // CSS selector or element ID
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showOn?: 'mobile' | 'desktop' | 'both';
  page?: string; // Which page this step belongs to
  action?: () => void; // Optional action to perform before showing step
  highlightPadding?: number; // Padding around highlighted element
  centerTooltip?: boolean; // Center tooltip on screen instead of positioning near target
}

export interface OnboardingTour {
  id: string;
  name: string;
  role: 'customer' | 'manager' | 'admin';
  steps: TourStep[];
}

interface OnboardingContextType {
  isActive: boolean;
  currentTour: OnboardingTour | null;
  currentStepIndex: number;
  totalSteps: number;
  isMobile: boolean;

  // Actions
  startTour: (tour: OnboardingTour) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  restartTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

const TOUR_STORAGE_KEY = 'vlottr_active_tour';

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentTour, setCurrentTour] = useState<OnboardingTour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Restore tour from sessionStorage on mount
  useEffect(() => {
    const restoreTour = () => {
      const savedTour = sessionStorage.getItem(TOUR_STORAGE_KEY);
      if (savedTour) {
        try {
          const { tourId, stepIndex } = JSON.parse(savedTour);

          // Import tours dynamically to restore
          import('../data/customerTour').then(({ customerTour }) => {
            import('../data/managerTour').then(({ managerTour }) => {
              const tour = tourId === 'customer-onboarding' ? customerTour : managerTour;
              if (tour) {
                setCurrentTour(tour);
                setCurrentStepIndex(stepIndex);
                setIsActive(true);
              }
            });
          });
        } catch (error) {
          console.error('Error restoring tour:', error);
          sessionStorage.removeItem(TOUR_STORAGE_KEY);
        }
      }
    };

    restoreTour();
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter steps based on device
  const getFilteredSteps = (steps: TourStep[]): TourStep[] => {
    return steps.filter(step => {
      if (!step.showOn) return true;
      if (step.showOn === 'both') return true;
      if (step.showOn === 'mobile' && isMobile) return true;
      if (step.showOn === 'desktop' && !isMobile) return true;
      return false;
    });
  };

  const startTour = (tour: OnboardingTour) => {
    setCurrentTour(tour);
    setCurrentStepIndex(0);
    setIsActive(true);

    // Save to sessionStorage for persistence across page navigation
    sessionStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({
      tourId: tour.id,
      stepIndex: 0
    }));
  };

  const nextStep = () => {
    if (!currentTour) return;

    const filteredSteps = getFilteredSteps(currentTour.steps);

    if (currentStepIndex < filteredSteps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);

      // Update sessionStorage
      sessionStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({
        tourId: currentTour.id,
        stepIndex: newIndex
      }));
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);

      // Update sessionStorage
      if (currentTour) {
        sessionStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({
          tourId: currentTour.id,
          stepIndex: newIndex
        }));
      }
    }
  };

  const skipTour = async () => {
    const tourId = currentTour?.id;

    setIsActive(false);
    setCurrentTour(null);
    setCurrentStepIndex(0);

    // Clear sessionStorage
    sessionStorage.removeItem(TOUR_STORAGE_KEY);

    // Mark as skipped in tutorial_wizard collection
    if (user?.uid) {
      try {
        await setDoc(doc(db, 'tutorial_wizard', user.uid), {
          user_id: user.uid,
          user_role: user.role,
          status: 'skipped',
          skipped_at: serverTimestamp(),
          tour_id: tourId || null
        }, { merge: true });
      } catch (error) {
        console.error('Error marking tour as skipped:', error);
      }
    }
  };

  const completeTour = async () => {
    const tourId = currentTour?.id;

    setIsActive(false);
    setCurrentTour(null);
    setCurrentStepIndex(0);

    // Clear sessionStorage
    sessionStorage.removeItem(TOUR_STORAGE_KEY);

    // Mark as completed in tutorial_wizard collection
    if (user?.uid) {
      try {
        await setDoc(doc(db, 'tutorial_wizard', user.uid), {
          user_id: user.uid,
          user_role: user.role,
          status: 'completed',
          completed_at: serverTimestamp(),
          tour_id: tourId || null
        }, { merge: true });
      } catch (error) {
        console.error('Error marking tour as completed:', error);
      }
    }
  };

  const restartTour = () => {
    if (currentTour) {
      setCurrentStepIndex(0);
      setIsActive(true);
    }
  };

  const filteredSteps = currentTour ? getFilteredSteps(currentTour.steps) : [];
  const totalSteps = filteredSteps.length;

  const value: OnboardingContextType = {
    isActive,
    currentTour,
    currentStepIndex,
    totalSteps,
    isMobile,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    restartTour
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
