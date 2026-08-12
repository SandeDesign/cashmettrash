import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Car,
  Calendar,
  Users,
  Settings,
  BarChart3,
  FileText,
  X,
  User,
  LogOut,
  ChevronDown,
  MessageCircle,
  Bug,
  Mail,
  Clock,
  Zap,
  MoreHorizontal,
  Camera,
  Shield,
  Building2,
  Handshake,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { useAdminBadges } from '../../hooks/useAdminBadges';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

interface NavGroup {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen: boolean;
}

const SIDEBAR_STORAGE_KEY = 'vlottr_sidebar_groups';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const { logout } = useAuthStore();
  const {
    unreadEmails,
    pendingBookings,
    pendingVerifications,
    unreadChat,
    newWaitlist,
    maintenanceCars,
    newContracts,
    incompleteWizardCustomers,
    incompleteWizardPartners,
    pendingPartnerApplications,
    pendingPartnerCars,
    pendingChangeRequests,
  } = useAdminBadges(user?.role);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const openGroupsRef = useRef(openGroups);
  openGroupsRef.current = openGroups;

  // ── Customer nav (flat list, unchanged) ──────────────────────────────────
  const customerNavItems: NavItem[] = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/cars', icon: Car, label: "Auto's" },
    { to: '/bookings', icon: Calendar, label: 'Mijn Boekingen' },
    { to: '/contracts', icon: FileText, label: 'Contracten' },
    { to: '/profile', icon: User, label: 'Profiel' },
  ];

  // ── Partner nav (flat list) ────────────────────────────────────────────
  const showWerkplaats = user?.offers_maintenance || user?.partner_type === 'garage' || user?.partner_type === 'both';
  const partnerNavItems: NavItem[] = [
    { to: '/partner', icon: Home, label: 'Dashboard' },
    { to: '/partner/cars', icon: Car, label: "Mijn Auto's" },
    ...(showWerkplaats ? [{ to: '/partner/werkplaats', icon: Wrench, label: 'Werkplaats' }] : []),
    { to: '/partner/business', icon: Building2, label: 'Profiel' },
    { to: '/partner/documents', icon: FileText, label: 'Documenten' },
  ];

  // ── Admin groups ─────────────────────────────────────────────────────────
  const adminGroups: NavGroup[] = [
    {
      key: 'klanten',
      label: 'Klanten',
      icon: Users,
      defaultOpen: false,
      items: [
        { to: '/admin/users', icon: Users, label: 'Gebruikers', badge: (pendingVerifications + incompleteWizardCustomers) || undefined },
        { to: '/admin/bookings', icon: Calendar, label: 'Boekingen', badge: pendingBookings || undefined },
        { to: '/admin/contracts', icon: FileText, label: 'Contracten', badge: newContracts || undefined },
        { to: '/manager/waitlist', icon: Clock, label: 'Wachtlijst', badge: newWaitlist || undefined },
        { to: '/admin/chat-management', icon: MessageCircle, label: 'Chat', badge: unreadChat || undefined },
      ],
    },
    {
      key: 'partners',
      label: 'Partners',
      icon: Handshake,
      defaultOpen: false,
      items: [
        { to: '/admin/partners', icon: Handshake, label: 'Partners', badge: (pendingPartnerApplications + incompleteWizardPartners) || undefined },
        { to: '/admin/partner-agreements', icon: FileText, label: 'Overeenkomsten' },
        { to: '/admin/partner-cars', icon: Car, label: 'Auto Indieningen', badge: ((pendingPartnerCars || 0) + (pendingChangeRequests || 0)) || undefined },
      ],
    },
    {
      key: 'beheer',
      label: 'Beheer',
      icon: Settings,
      defaultOpen: false,
      items: [
        { to: '/admin/statistics', icon: BarChart3, label: 'Statistieken' },
        { to: '/manager/cars', icon: Car, label: 'Auto Beheer', badge: maintenanceCars || undefined },
        { to: '/admin/inspections', icon: Camera, label: 'Inspectie' },
        { to: '/admin/email-tool', icon: Mail, label: 'Email', badge: unreadEmails || undefined },
        { to: '/admin/settings', icon: Settings, label: 'Systeeminstellingen' },
      ],
    },
  ];

  // ── Manager groups ───────────────────────────────────────────────────────
  const managerGroups: NavGroup[] = [
    {
      key: 'operaties',
      label: 'Operaties',
      icon: Zap,
      defaultOpen: false,
      items: [
        { to: '/manager/bookings', icon: Calendar, label: 'Boekingen', badge: pendingBookings || undefined },
        { to: '/manager/waitlist', icon: Clock, label: 'Wachtlijst', badge: newWaitlist || undefined },
        { to: '/manager/contracts', icon: FileText, label: 'Contracten', badge: newContracts || undefined },
      ],
    },
    {
      key: 'klanten',
      label: 'Klanten & Communicatie',
      icon: Users,
      defaultOpen: false,
      items: [
        { to: '/manager/customers', icon: Users, label: 'Klanten' },
        { to: '/admin/users', icon: Shield, label: 'Verificaties', badge: pendingVerifications || undefined },
        { to: '/admin/chat-management', icon: MessageCircle, label: 'Chat', badge: unreadChat || undefined },
        { to: '/admin/email-tool', icon: Mail, label: 'Email', badge: unreadEmails || undefined },
      ],
    },
    {
      key: 'vloot',
      label: 'Vloot',
      icon: Car,
      defaultOpen: false,
      items: [
        { to: '/manager/cars', icon: Car, label: 'Auto Beheer', badge: maintenanceCars || undefined },
        { to: '/manager/inspections', icon: Camera, label: 'Inspectie' },
      ],
    },
    {
      key: 'rapportage',
      label: 'Rapportage',
      icon: BarChart3,
      defaultOpen: false,
      items: [
        { to: '/manager/statistics', icon: BarChart3, label: 'Statistieken' },
        { to: '/manager/reports', icon: BarChart3, label: 'Rapporten' },
      ],
    },
    {
      key: 'overig',
      label: 'Overig',
      icon: MoreHorizontal,
      defaultOpen: false,
      items: [
        { to: '/admin/debug', icon: Bug, label: '🧪 Debug' },
      ],
    },
  ];

  const currentGroups =
    user?.role === 'admin' ? adminGroups :
    user?.role === 'manager' ? managerGroups : [];

  const flatNavItems =
    user?.role === 'customer' ? customerNavItems :
    user?.role === 'partner' ? partnerNavItems : null;

  // ── Load persisted state from localStorage on mount / role change ────────
  useEffect(() => {
    if (!user?.role || user.role === 'customer' || user.role === 'partner') return;

    const stored = localStorage.getItem(`${SIDEBAR_STORAGE_KEY}_${user.role}`);
    const parsed: Record<string, boolean> = stored ? JSON.parse(stored) : {};

    const groups = user.role === 'admin' ? adminGroups : managerGroups;
    const initial: Record<string, boolean> = {};
    groups.forEach(g => {
      // Use stored value if it exists, otherwise fall back to default
      initial[g.key] = g.key in parsed ? parsed[g.key] : g.defaultOpen;
    });
    setOpenGroups(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  // ── Auto-open collapsed groups when badges arrive ────────────────────────
  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'manager') return;

    // Bereken welke groepen badges hebben
    const badgeTotals: Record<string, number> =
      user.role === 'admin'
        ? {
            klanten: (pendingVerifications || 0) + (incompleteWizardCustomers || 0)
              + (pendingBookings || 0) + (newContracts || 0) + (newWaitlist || 0) + (unreadChat || 0),
            partners: (pendingPartnerApplications || 0) + (incompleteWizardPartners || 0) + (pendingPartnerCars || 0),
            beheer: (maintenanceCars || 0) + (unreadEmails || 0),
          }
        : {
            operaties: (pendingBookings || 0) + (newWaitlist || 0) + (newContracts || 0),
            klanten: (pendingVerifications || 0) + (unreadChat || 0) + (unreadEmails || 0),
            vloot: (maintenanceCars || 0),
          };

    const current = openGroupsRef.current;
    const updates: Record<string, boolean> = { ...current };
    let hasChanges = false;

    Object.entries(badgeTotals).forEach(([key, total]) => {
      if (total > 0 && !current[key]) {
        updates[key] = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setOpenGroups(updates);
      localStorage.setItem(`${SIDEBAR_STORAGE_KEY}_${user.role}`, JSON.stringify(updates));
    }
  }, [unreadChat, unreadEmails, pendingBookings, newContracts, newWaitlist,
      pendingVerifications, maintenanceCars, pendingPartnerApplications,
      incompleteWizardPartners, pendingPartnerCars, incompleteWizardCustomers,
      user?.role]);

  // ── Toggle a group and persist immediately ───────────────────────────────
  const toggleGroup = (key: string) => {
    const next = { ...openGroupsRef.current, [key]: !openGroupsRef.current[key] };
    setOpenGroups(next);
    if (user?.role) {
      localStorage.setItem(`${SIDEBAR_STORAGE_KEY}_${user.role}`, JSON.stringify(next));
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        data-tour="sidebar"
        className={`fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: '#0d0d0d',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          <NavLink
            to={user?.role === 'customer' ? '/dashboard' : `/${user?.role}`}
            className="flex items-center gap-2.5 group"
          >
            <img src="/512x512x2.png" alt="Vlottr Logo" className="w-9 h-9 rounded-lg" />
            <span className="text-base font-bold tracking-tight text-white">Vlottr</span>
          </NavLink>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {flatNavItems ? (
            // ── Customer / Partner: flat list ─────────────────────────────
            <div className="space-y-0.5">
              {flatNavItems.map((item, index) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={index === 0}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-green-400 bg-green-500/[0.08]'
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-green-400' : 'text-neutral-500'}`}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ) : (
            // ── Admin / Manager: Dashboard + accordion groups ─────────────
            <>
              {/* Dashboard — always visible, not in a group */}
              <NavLink
                to={`/${user?.role}`}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-3 ${
                    isActive
                      ? 'text-green-400 bg-green-500/[0.08]'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <Home className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-green-400' : 'text-neutral-500'}`} />
                    <span className="flex-1">Dashboard</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    )}
                  </>
                )}
              </NavLink>

              {/* Accordion groups */}
              <div className="space-y-1">
                {currentGroups.map(group => {
                  const isOpen = openGroups[group.key] ?? group.defaultOpen;
                  const groupBadgeTotal = group.items.reduce(
                    (sum, item) => sum + (item.badge || 0),
                    0
                  );

                  return (
                    <div key={group.key}>
                      {/* Group header button */}
                      <button
                        onClick={() => toggleGroup(group.key)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03] transition-all duration-150"
                      >
                        <group.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="flex-1 text-left truncate">{group.label}</span>
                        {/* Badge total shown on header only when group is collapsed */}
                        {!isOpen && groupBadgeTotal > 0 && (
                          <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                            {groupBadgeTotal > 99 ? '99+' : groupBadgeTotal}
                          </span>
                        )}
                        <ChevronDown
                          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-0' : '-rotate-90'
                          }`}
                        />
                      </button>

                      {/* Group items */}
                      {isOpen && (
                        <div className="mt-0.5 mb-1 space-y-0.5 ml-3 pl-2.5 border-l border-white/[0.05]">
                          {group.items.map(item => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                                  isActive
                                    ? 'text-green-400 bg-green-500/[0.08]'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'
                                }`
                              }
                              onClick={() => setSidebarOpen(false)}
                            >
                              {({ isActive }) => (
                                <>
                                  <item.icon
                                    className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-green-400' : 'text-neutral-500'}`}
                                  />
                                  <span className="flex-1 truncate">{item.label}</span>
                                  {item.badge && item.badge > 0 ? (
                                    <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                      {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                  ) : isActive ? (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                                  ) : null}
                                </>
                              )}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* User profile */}
        {user && (
          <div
            className="px-3 pb-24 lg:pb-4"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '16px' }}
          >
            <NavLink
              to={user.role === 'partner' ? '/partner/business' : '/profile'}
              data-tour="profile-menu"
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-green-500/[0.08] transition-all duration-200 cursor-pointer"
              style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}
              onClick={() => setSidebarOpen(false)}
            >
              {(() => {
                const avatarUrl = user.role === 'partner'
                  ? user.company_logo
                  : user.profile_photo;
                return avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-green-900 flex items-center justify-center text-green-400 text-xs font-bold vl-font-mono flex-shrink-0">
                    {user.name?.substring(0, 2).toUpperCase() || 'VL'}
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{user.name}</div>
                <div className="text-xs text-neutral-500 capitalize">
                  {user.role === 'partner' ? (user.company_name || 'Partner') : user.role}
                </div>
              </div>
              <User className="w-4 h-4 text-neutral-500" />
            </NavLink>
            <button
              onClick={async () => {
                if (window.confirm('Weet u zeker dat u wilt uitloggen?')) {
                  setSidebarOpen(false);
                  await logout();
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Uitloggen</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
