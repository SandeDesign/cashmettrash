import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AdminBadges {
  unreadEmails: number;
  pendingBookings: number;
  confirmedBookings: number; // Paid, awaiting physical pickup preparation
  borgOpen: number; // Confirmed/active bookings with unconfirmed borg
  pendingVerifications: number;
  unreadChat: number;
  newWaitlist: number;
  maintenanceCars: number;
  newContracts: number;
  unreadAdminNotifications: number;
  incompleteWizardCustomers: number; // Customers who haven't finished onboarding
  incompleteWizardPartners: number;  // Partners who haven't finished onboarding
  pendingPartnerApplications: number; // New partner registrations awaiting admin approval
  pendingPartnerCars: number;        // Partner car submissions awaiting approval
  pendingChangeRequests: number;     // Partner cars with unresolved change requests
  total: number;
}

/**
 * Real-time badge counts for admin and manager roles.
 * Subscribes to Firestore on mount, unsubscribes on unmount.
 * Returns zero counts for non-admin/manager roles.
 */
export const useAdminBadges = (role?: string, userId?: string): AdminBadges => {
  const [unreadEmails, setUnreadEmails] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [confirmedBookings, setConfirmedBookings] = useState(0);
  const [borgOpen, setBorgOpen] = useState(0);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [unreadChat, setUnreadChat] = useState(0);
  const [newWaitlist, setNewWaitlist] = useState(0);
  const [maintenanceCars, setMaintenanceCars] = useState(0);
  const [newContracts, setNewContracts] = useState(0);
  const [unreadAdminNotifications, setUnreadAdminNotifications] = useState(0);
  const [incompleteWizardCustomers, setIncompleteWizardCustomers] = useState(0);
  const [incompleteWizardPartners, setIncompleteWizardPartners] = useState(0);
  const [pendingPartnerApplications, setPendingPartnerApplications] = useState(0);
  const [pendingPartnerCars, setPendingPartnerCars] = useState(0);
  const [pendingChangeRequests, setPendingChangeRequests] = useState(0);

  useEffect(() => {
    if (role !== 'admin' && role !== 'manager') return;

    const unsubs: (() => void)[] = [];

    // Unread emails (filter archived client-side to avoid composite index)
    unsubs.push(onSnapshot(
      query(collection(db, 'received_emails'), where('isRead', '==', false)),
      snap => setUnreadEmails(snap.docs.filter(d => !d.data().archived).length),
      err => console.error('[AdminBadges] email:', err)
    ));

    // Pending bookings (awaiting payment)
    unsubs.push(onSnapshot(
      query(collection(db, 'bookings'), where('status', '==', 'pending')),
      snap => setPendingBookings(snap.size),
      err => console.error('[AdminBadges] bookings:', err)
    ));

    // Confirmed bookings (payment received, awaiting physical pickup)
    // Also count unconfirmed borgs from same snapshot to save a query
    unsubs.push(onSnapshot(
      query(collection(db, 'bookings'), where('status', '==', 'confirmed')),
      snap => {
        setConfirmedBookings(snap.size);
        setBorgOpen(snap.docs.filter(d => d.data().borg_payment_method && !d.data().borg_confirmed).length);
      },
      err => console.error('[AdminBadges] confirmed bookings:', err)
    ));

    // Unread chat conversations (admin side)
    unsubs.push(onSnapshot(
      query(collection(db, 'chat_conversations'), where('unread_count_admin', '>', 0)),
      snap => setUnreadChat(snap.size),
      err => console.error('[AdminBadges] chat:', err)
    ));

    // New waitlist entries (status = waiting)
    unsubs.push(onSnapshot(
      query(collection(db, 'waitlist'), where('status', '==', 'waiting')),
      snap => setNewWaitlist(snap.size),
      err => console.error('[AdminBadges] waitlist:', err)
    ));

    // Cars in/needing maintenance — exclude unapproved partner submissions
    unsubs.push(onSnapshot(
      query(collection(db, 'cars'), where('status', '==', 'maintenance')),
      snap => setMaintenanceCars(
        snap.docs.filter(d => {
          const data = d.data();
          // Only count as maintenance if NOT a pending/rejected partner submission
          return !data.submitted_by_partner || data.partner_approved === true;
        }).length
      ),
      err => console.error('[AdminBadges] maintenance:', err)
    ));

    // Pending (unsigned) contracts
    unsubs.push(onSnapshot(
      query(collection(db, 'contracts'), where('status', '==', 'pending')),
      snap => setNewContracts(snap.size),
      err => console.error('[AdminBadges] contracts:', err)
    ));

    // Pending verifications — alleen klanten, partners hebben eigen approval flow
    unsubs.push(onSnapshot(
      query(collection(db, 'users'), where('verification_status', '==', 'pending')),
      snap => setPendingVerifications(snap.docs.filter(d => d.data().role !== 'partner').length),
      err => console.error('[AdminBadges] verifications:', err)
    ));

    // Customers who haven't completed onboarding wizard
    unsubs.push(onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'customer'), where('onboarding_completed', '==', false)),
      snap => setIncompleteWizardCustomers(snap.size),
      err => console.error('[AdminBadges] incomplete wizard customers:', err)
    ));

    // Partners who haven't completed onboarding wizard
    unsubs.push(onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'partner'), where('onboarding_completed', '==', false)),
      snap => setIncompleteWizardPartners(snap.size),
      err => console.error('[AdminBadges] incomplete wizard partners:', err)
    ));

    // New partner registrations awaiting admin approval
    unsubs.push(onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'partner'), where('verification_status', '==', 'pending')),
      snap => setPendingPartnerApplications(snap.size),
      err => console.error('[AdminBadges] pending partner applications:', err)
    ));

    // Partner car submissions awaiting approval (only truly pending = field absent/null, not rejected = false)
    unsubs.push(onSnapshot(
      query(collection(db, 'cars'), where('submitted_by_partner', '!=', null)),
      snap => {
        const docs = snap.docs.map(d => d.data());
        setPendingPartnerCars(docs.filter(d => d.partner_approved == null).length);
        setPendingChangeRequests(docs.filter(d => d.change_request_pending === true).length);
      },
      err => console.error('[AdminBadges] partner cars:', err)
    ));

    // Unread individual notifications for this admin/manager (e.g. lock period signed)
    if (userId) {
      unsubs.push(onSnapshot(
        query(collection(db, 'notifications'), where('user_id', '==', userId), where('read', '==', false)),
        snap => setUnreadAdminNotifications(snap.size),
        err => console.error('[AdminBadges] notifications:', err)
      ));
    }

    return () => unsubs.forEach(fn => fn());
  }, [role, userId]);

  const total = unreadEmails + pendingBookings + confirmedBookings + pendingVerifications
    + unreadChat + newWaitlist + maintenanceCars + newContracts + unreadAdminNotifications
    + incompleteWizardCustomers + incompleteWizardPartners + pendingPartnerApplications + pendingPartnerCars
    + pendingChangeRequests;

  return {
    unreadEmails,
    pendingBookings,
    confirmedBookings,
    borgOpen,
    pendingVerifications,
    unreadChat,
    newWaitlist,
    maintenanceCars,
    newContracts,
    unreadAdminNotifications,
    incompleteWizardCustomers,
    incompleteWizardPartners,
    pendingPartnerApplications,
    pendingPartnerCars,
    pendingChangeRequests,
    total,
  };
};
