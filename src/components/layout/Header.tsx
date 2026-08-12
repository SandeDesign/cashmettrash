import React, { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBookingStore } from '../../store/bookingStore';
import { useCarStore } from '../../store/carStore';
import { useChatStore } from '../../store/chatStore';
import SupportMenu from './SupportMenu';
import NotificationBell from './NotificationBell';
import AdminNotificationBell from './AdminNotificationBell';
import { useChatModal } from '../../contexts/ChatModalContext';

interface HeaderProps {
  title?: string;
}

/** Root paths per role — back button is hidden when already at these paths */
const ROOT_PATHS: Record<string, string> = {
  customer: '/dashboard',
  admin: '/admin',
  manager: '/manager',
};

const Header: React.FC<HeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { openChat } = useChatModal();
  const { fetchBookings, bookings } = useBookingStore();
  const { fetchCars, cars } = useCarStore();
  const { subscribeToConversations } = useChatStore();

  // AUTO-LOAD BOOKINGS & CARS FOR CUSTOMERS
  useEffect(() => {
    if (user?.role === 'customer' && user.uid) {
      fetchBookings({ customer_id: user.uid });
      fetchCars();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, user?.role]);

  // AUTO-LOAD CONVERSATIONS FOR ALL USERS (for notification badge)
  useEffect(() => {
    if (user?.uid) {
      const isCustomer = user.role === 'customer';
      const unsubscribe = subscribeToConversations(user.uid, isCustomer);
      return () => unsubscribe();
    }
  }, [user?.uid, user?.role, subscribeToConversations]);

  // Back button logic — only on mobile, only when not at dashboard root
  const rootPath = user?.role ? ROOT_PATHS[user.role] : null;
  const isAtRoot = rootPath ? location.pathname === rootPath : true;
  const showBackButton = !isAtRoot;

  const handleBack = () => {
    if (!rootPath) return;
    // Navigate back but stop at the dashboard root
    navigate(-1);
  };

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // Find an active pickup-ready booking for customer role
  const pickupReadyBooking = user?.role === 'customer'
    ? bookings.find((b) => b.status === 'confirmed' && !!(b as any).pickup_ready_email_sent_at)
    : null;

  const pickupReadyCar = pickupReadyBooking
    ? cars.find((c) => c.id === pickupReadyBooking.car_id)
    : null;

  const pickupReadyDate = pickupReadyBooking?.start_date
    ? new Date(pickupReadyBooking.start_date).toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '';

  const pickupReadyLocation =
    (pickupReadyBooking as any)?.pickup_location_name ||
    pickupReadyBooking?.delivery_address ||
    '';

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'rgba(10,10,10,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        {/* Left: back button (mobile) or spacer */}
        <div className="flex items-center gap-3">
          {/* Mobile: back button when not at root */}
          {showBackButton && (
            <button
              onClick={handleBack}
              className="lg:hidden flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Terug</span>
            </button>
          )}

          {/* Desktop: page title */}
          {title && (
            <h1 className="hidden lg:block text-xl font-bold text-white">
              {title}
            </h1>
          )}
        </div>

        {/* Right: notification bells + support (customers only) */}
        {user && (
          <div className="flex items-center gap-2">
            {/* Customer notification bell */}
            <NotificationBell />
            {/* Admin / Manager notification bell */}
            <AdminNotificationBell />
            {/* Support menu only for customers */}
            {!isAdminOrManager && <SupportMenu onChatOpen={openChat} />}
          </div>
        )}
      </div>

      {/* Pickup-ready banner — shown on every page for customers with a confirmed pickup */}
      {pickupReadyBooking && (
        <div className="bg-green-600/15 border-t border-green-500/20 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-green-400 text-base flex-shrink-0">🚗</span>
            <span className="text-white font-semibold text-sm flex-shrink-0">
              {pickupReadyCar ? `${pickupReadyCar.brand} ${pickupReadyCar.model}` : 'Uw auto'} staat klaar!
            </span>
            {pickupReadyDate && (
              <span className="text-neutral-400 text-sm truncate hidden sm:block">
                Ophalen {pickupReadyDate}
                {pickupReadyLocation ? ` · ${pickupReadyLocation}` : ''}
              </span>
            )}
          </div>
          <Link
            to="/bookings"
            className="flex-shrink-0 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-full font-medium transition-colors"
          >
            Bekijk →
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
