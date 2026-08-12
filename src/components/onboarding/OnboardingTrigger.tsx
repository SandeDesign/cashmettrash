import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { customerTour } from '../../data/customerTour';
import { managerTour } from '../../data/managerTour';
import { useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

/**
 * Automatically triggers tutorial wizard for newly verified users
 * Runs only once per user (tracked in tutorial_wizard collection)
 */
const OnboardingTrigger: React.FC = () => {
  const { user } = useAuth();
  const { startTour, isActive } = useOnboarding();
  const location = useLocation();
  const [hasTriggered, setHasTriggered] = useState(false);
  const [tutorialStatus, setTutorialStatus] = useState<'pending' | 'completed' | 'skipped' | null>(null);

  // Check tutorial wizard status from Firestore
  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (!user?.uid) return;

      try {
        const tutorialDoc = await getDoc(doc(db, 'tutorial_wizard', user.uid));
        if (tutorialDoc.exists()) {
          setTutorialStatus(tutorialDoc.data().status || null);
        } else {
          setTutorialStatus('pending');
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
        setTutorialStatus('pending');
      }
    };

    checkTutorialStatus();
  }, [user?.uid]);

  useEffect(() => {
    // Don't trigger if already active or already triggered this session
    if (isActive || hasTriggered) return;

    // Don't trigger if no user
    if (!user) return;

    // IMPORTANT: Only trigger AFTER old onboarding (verification/account setup) is completed!
    if (!user.onboarding_completed) return;

    // Tutorial wizard is ONLY for customer and manager (NOT admin!)
    if (user.role === 'admin') return;

    // Don't trigger if tutorial already completed or skipped
    if (tutorialStatus === 'completed' || tutorialStatus === 'skipped') return;

    // Only trigger for approved users
    if (user.verification_status !== 'approved') return;

    // Only trigger on dashboard pages
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/manager';
    if (!isDashboard) return;

    // Trigger appropriate tour based on role
    const triggerTour = () => {
      setHasTriggered(true);

      // Wait a bit for page to fully load
      setTimeout(() => {
        if (user.role === 'customer') {
          startTour(customerTour);
        } else if (user.role === 'manager') {
          startTour(managerTour);
        }
      }, 1000); // 1 second delay for smooth start
    };

    triggerTour();
  }, [user, isActive, hasTriggered, tutorialStatus, location.pathname, startTour]);

  // This component doesn't render anything
  return null;
};

export default OnboardingTrigger;
