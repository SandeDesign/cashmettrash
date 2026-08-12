import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Car,
  Calendar,
  User,
  AlertCircle,
  Mail,
  MoreHorizontal,
  Building2,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import { useBookingStore } from '../../store/bookingStore';
import { useAdminBadges } from '../../hooks/useAdminBadges';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isEmergency?: boolean;
  badge?: number;
}

const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const { setSidebarOpen } = useAppStore();
  const { bookings } = useBookingStore();
  const {
    unreadEmails,
    pendingBookings,
    pendingVerifications,
    unreadChat,
    newWaitlist,
    maintenanceCars,
    newContracts,
    total,
  } = useAdminBadges(user?.role);

  const hasActiveBooking =
    user?.role === 'customer' &&
    bookings.some(
      b =>
        b.customer_id === user.uid &&
        (b.status === 'active' || b.status === 'confirmed')
    );

  // ── Customer: Home · Auto's · Boekingen · (SOS) · Meer ─────────────────
  const customerMain: NavItem[] = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/cars', icon: Car, label: "Auto's" },
    { to: '/bookings', icon: Calendar, label: 'Boekingen' },
    ...(hasActiveBooking ? [{ to: '/sos', icon: AlertCircle, label: 'SOS', isEmergency: true }] : []),
  ];

  // ── Admin: Home · Boekingen · Email · Meer ───────────────────────────────
  const adminMain: NavItem[] = [
    { to: '/admin', icon: Home, label: 'Home' },
    { to: '/admin/bookings', icon: Calendar, label: 'Boekingen', badge: pendingBookings || undefined },
    { to: '/admin/email-tool', icon: Mail, label: 'Email', badge: unreadEmails || undefined },
  ];

  // Meer badge = everything not visible in the 3 admin items
  const adminMeerBadge =
    pendingVerifications + unreadChat + newWaitlist + maintenanceCars + newContracts;

  // ── Manager: Home · Boekingen · Email · Meer ─────────────────────────────
  const managerMain: NavItem[] = [
    { to: '/manager', icon: Home, label: 'Home' },
    { to: '/manager/bookings', icon: Calendar, label: 'Boekingen', badge: pendingBookings || undefined },
    { to: '/admin/email-tool', icon: Mail, label: 'Email', badge: unreadEmails || undefined },
  ];

  const managerMeerBadge =
    unreadChat + newWaitlist + maintenanceCars + newContracts;

  // ── Partner: Home · Auto's · (Werkplaats) · Bedrijf ────────────────────
  const showWerkplaats = user?.offers_maintenance || user?.partner_type === 'garage' || user?.partner_type === 'both';
  const partnerMain: NavItem[] = [
    { to: '/partner', icon: Home, label: 'Home' },
    { to: '/partner/cars', icon: Car, label: "Auto's" },
    ...(showWerkplaats ? [{ to: '/partner/werkplaats', icon: Wrench, label: 'Werkplaats' }] : []),
    { to: '/partner/business', icon: Building2, label: 'Profiel' },
  ];

  // ── Derive what to render ────────────────────────────────────────────────
  let mainItems: NavItem[] = [];
  let meerBadge = 0;

  if (user?.role === 'customer') {
    mainItems = customerMain;
  } else if (user?.role === 'admin') {
    mainItems = adminMain;
    meerBadge = adminMeerBadge;
  } else if (user?.role === 'manager') {
    mainItems = managerMain;
    meerBadge = managerMeerBadge;
  } else if (user?.role === 'partner') {
    mainItems = partnerMain;
  }

  if (!user || mainItems.length === 0) return null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <nav
      data-tour="bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around pt-2 pb-1">
        {/* Main nav items */}
        {mainItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard' || item.to === '/admin' || item.to === '/manager' || item.to === '/partner'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-3 py-1.5 transition-colors relative min-w-0 ${
                item.isEmergency
                  ? isActive
                    ? 'text-red-400'
                    : 'text-red-500 hover:text-red-400 animate-pulse'
                  : isActive
                  ? 'text-green-400'
                  : 'text-neutral-500 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon className={`w-6 h-6 ${item.isEmergency ? 'stroke-[2.5]' : ''}`} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold truncate max-w-full ${item.isEmergency ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${item.isEmergency ? 'bg-red-400' : 'bg-green-400'}`} />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Meer button — always visible */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 text-neutral-500 hover:text-white transition-colors relative min-w-0"
        >
          <div className="relative">
            <MoreHorizontal className="w-6 h-6" />
            {meerBadge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {meerBadge > 9 ? '9+' : meerBadge}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">Meer</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
