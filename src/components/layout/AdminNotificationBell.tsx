import React, { useState, useRef, useEffect } from 'react';
import { Bell, Mail, Calendar, Shield, MessageCircle, Clock, Car, FileText, Pen, X, UserX, Building2, Handshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdminBadges } from '../../hooks/useAdminBadges';

const AdminNotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const badges = useAdminBadges(user?.role, user?.uid);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('vlottr_dismissed_notifs') || '{}'); }
    catch { return {}; }
  });

  const handleDismiss = (e: React.MouseEvent, key: string, count: number) => {
    e.stopPropagation();
    const updated = { ...dismissed, [key]: count };
    setDismissed(updated);
    localStorage.setItem('vlottr_dismissed_notifs', JSON.stringify(updated));
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  const isAdmin = user.role === 'admin';
  const bookingsPath = isAdmin ? '/admin/bookings' : '/manager/bookings';
  const contractsPath = isAdmin ? '/admin/contracts' : '/manager/contracts';

  const allItems = [
    {
      key: 'emails',
      label: 'Ongelezen emails',
      count: badges.unreadEmails,
      icon: Mail,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/10',
      path: '/admin/email-tool',
    },
    {
      key: 'bookings',
      label: 'Openstaande boekingen',
      count: badges.pendingBookings,
      icon: Calendar,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      path: bookingsPath,
    },
    {
      key: 'chat',
      label: 'Ongelezen chat',
      count: badges.unreadChat,
      icon: MessageCircle,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      path: '/admin/chat-management',
    },
    {
      key: 'waitlist',
      label: 'Wachtlijst aanvragen',
      count: badges.newWaitlist,
      icon: Clock,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10',
      path: '/manager/waitlist',
    },
    {
      key: 'maintenance',
      label: 'Auto\'s in onderhoud',
      count: badges.maintenanceCars,
      icon: Car,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/10',
      path: '/manager/cars',
    },
    {
      key: 'contracts',
      label: 'Nieuwe contracten',
      count: badges.newContracts,
      icon: FileText,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      path: contractsPath,
    },
    {
      key: 'verifications',
      label: 'Openstaande verificaties',
      count: badges.pendingVerifications,
      icon: Shield,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/10',
      path: '/admin/users',
    },
    {
      key: 'admin_notifications',
      label: 'Nieuwe meldingen (contracten/vastzetperiode)',
      count: badges.unreadAdminNotifications,
      icon: Pen,
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10',
      path: isAdmin ? '/admin/contracts' : '/manager/contracts',
    },
    {
      key: 'incomplete_wizard_customers',
      label: 'Klanten: wizard niet voltooid',
      count: badges.incompleteWizardCustomers,
      icon: UserX,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      path: '/admin/users?tab=wizard',
    },
    {
      key: 'incomplete_wizard_partners',
      label: 'Partners: wizard niet voltooid',
      count: badges.incompleteWizardPartners,
      icon: Building2,
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/10',
      path: '/admin/partners?tab=wizard',
    },
    {
      key: 'pending_partner_applications',
      label: 'Nieuwe partner aanvragen',
      count: badges.pendingPartnerApplications,
      icon: Handshake,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/10',
      path: '/admin/partners',
    },
  ].filter(item => item.count > 0);

  // Verberg items waarvan de gebruiker de huidige telling al heeft weggedrukt
  const visibleItems = allItems.filter(item => item.count > (dismissed[item.key] ?? 0));
  const visibleTotal = visibleItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 transition-colors ${isOpen ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
        title="Meldingen"
      >
        <Bell className="w-5 h-5" />
        {visibleTotal > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {visibleTotal > 99 ? '99+' : visibleTotal}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-neutral-400" />
              <h3 className="text-white font-semibold text-sm">Meldingen</h3>
            </div>
            {visibleTotal > 0 && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                {visibleTotal}
              </span>
            )}
          </div>

          <div className="py-1 max-h-96 overflow-y-auto">
            {visibleItems.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">Geen openstaande meldingen</p>
                <p className="text-neutral-600 text-xs mt-1">Alles is bijgewerkt</p>
              </div>
            ) : (
              visibleItems.map(item => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
                >
                  <button
                    onClick={() => { navigate(item.path); setIsOpen(false); }}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${item.iconBg}`}>
                      <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{item.label}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                      {item.count}
                    </span>
                  </button>
                  <button
                    onClick={(e) => handleDismiss(e, item.key, item.count)}
                    className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                    title="Melding verbergen"
                  >
                    <X className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300" />
                  </button>
                </div>
              ))
            )}
          </div>

          {visibleItems.length === 0 && (
            <div className="px-3 pb-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Email', icon: Mail, path: '/admin/email-tool' },
                  { label: 'Boekingen', icon: Calendar, path: bookingsPath },
                  { label: 'Chat', icon: MessageCircle, path: '/admin/chat-management' },
                ].map(q => (
                  <button
                    key={q.label}
                    onClick={() => { navigate(q.path); setIsOpen(false); }}
                    className="flex flex-col items-center gap-1 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    <q.icon className="w-4 h-4" />
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;
