import React, { useEffect } from 'react';
import {
  Car, Users, Calendar, TrendingUp, Plus, BarChart3, Loader2, Activity,
  Key, Banknote, ChevronRight, AlertTriangle, CheckCircle, Clock,
  Wrench, ClipboardList, FileText, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import ActivityFeed from '../../components/activity/ActivityFeed';
import { useAuth } from '../../hooks/useAuth';
import { useCarStore } from '../../store/carStore';
import { useBookingStore } from '../../store/bookingStore';
import { useAdminBadges } from '../../hooks/useAdminBadges';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

function isToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function isWithinDays(dateStr: string | undefined, days: number): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff > 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function daysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cars, loading: carsLoading, subscribeToCars } = useCarStore();
  const { bookings, loading: bookingsLoading, subscribeToBookings } = useBookingStore();
  const badges = useAdminBadges(user?.role);

  useEffect(() => {
    if (user) {
      const unsubscribeCars = subscribeToCars();
      const unsubscribeBookings = subscribeToBookings();
      return () => {
        unsubscribeCars();
        unsubscribeBookings();
      };
    }
  }, [user, subscribeToCars, subscribeToBookings]);

  // KPI calculations
  const activeBookings = bookings.filter(b => b.status === 'active' || b.status === 'confirmed').length;
  const totalCars = cars.length;
  const availableCars = cars.filter(c => c.status === 'available').length;
  const rentedCars = cars.filter(c => c.status === 'rented').length;
  const maintenanceCarsCount = cars.filter(c => c.status === 'maintenance').length;

  const activeCustomerIds = new Set(
    bookings
      .filter(b => b.status === 'active' || b.status === 'confirmed')
      .map(b => b.customer_id)
  );
  const activeCustomers = activeCustomerIds.size;

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthBookings = bookings.filter(b => new Date(b.created_at) >= firstDayOfMonth);
  const monthlyRevenue = bookings
    .filter(b => b.payment_status === 'paid' && new Date(b.created_at) >= firstDayOfMonth)
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  // Today's schedule
  const todayPickups = bookings.filter(b =>
    b.status === 'confirmed' && isToday(b.pickup_scheduled_date)
  );
  const todayReturns = bookings.filter(b =>
    b.status === 'active' && isToday(b.return_scheduled_date)
  );

  // Recent bookings (last 5)
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Fleet health
  const fleetTotal = totalCars || 1;
  const availablePercent = Math.round((availableCars / fleetTotal) * 100);
  const rentedPercent = Math.round((rentedCars / fleetTotal) * 100);
  const maintenancePercent = Math.round((maintenanceCarsCount / fleetTotal) * 100);

  const expiringCars = cars.filter(c =>
    isWithinDays(c.apk_expiry_date, 30) || isWithinDays(c.insurance_expiry_date, 30)
  );

  // Priority tasks
  const priorityTasks = [
    { key: 'borgOpen', count: badges.borgOpen, label: 'Borg bevestigen', route: '/manager/bookings', icon: Banknote, color: 'red' as const },
    { key: 'confirmedBookings', count: badges.confirmedBookings, label: 'Sleuteloverdracht voorbereiden', route: '/manager/bookings', icon: Key, color: 'orange' as const },
    { key: 'maintenanceCars', count: badges.maintenanceCars, label: "Auto's in onderhoud", route: '/manager/cars', icon: Wrench, color: 'yellow' as const },
    { key: 'newWaitlist', count: badges.newWaitlist, label: 'Nieuwe wachtlijst items', route: '/manager/waitlist', icon: ClipboardList, color: 'yellow' as const },
    { key: 'newContracts', count: badges.newContracts, label: 'Contracten tekenen', route: '/manager/contracts', icon: FileText, color: 'blue' as const },
  ].filter(t => t.count > 0);

  const totalOpenTasks = priorityTasks.reduce((sum, t) => sum + t.count, 0);

  const colorMap = {
    red: { bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'bg-orange-500' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', badge: 'bg-yellow-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500' },
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return { text: 'Actief', cls: 'vl-badge-green' };
      case 'confirmed': return { text: 'Bevestigd', cls: 'vl-badge-blue' };
      case 'pending': return { text: 'Wachtend', cls: 'vl-badge-orange' };
      case 'completed': return { text: 'Voltooid', cls: 'vl-badge-neutral' };
      case 'cancelled': return { text: 'Geannuleerd', cls: 'vl-badge-red' };
      default: return { text: status, cls: 'vl-badge-neutral' };
    }
  };

  const loading = carsLoading || bookingsLoading;

  if (loading && bookings.length === 0 && cars.length === 0) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header title="Manager Dashboard" />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-400" />
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Manager Dashboard" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* A. Welcome Header */}
            <div className="vl-animate-in">
              <h1 className="text-2xl lg:text-3xl font-bold text-white" style={{ fontFamily: 'var(--vl-font-display)' }}>
                {getGreeting()}, {user?.name?.split(' ')[0] || 'Manager'}
              </h1>
              <p className="text-neutral-400 mt-1">
                {format(new Date(), "EEEE d MMMM yyyy", { locale: nl })}
                {(todayPickups.length > 0 || todayReturns.length > 0) && (
                  <span className="ml-2 text-green-400">
                    — Vandaag: {todayPickups.length > 0 && `${todayPickups.length} ophaalafspra${todayPickups.length === 1 ? 'ak' : 'ken'}`}
                    {todayPickups.length > 0 && todayReturns.length > 0 && ', '}
                    {todayReturns.length > 0 && `${todayReturns.length} inlevering${todayReturns.length === 1 ? '' : 'en'}`}
                  </span>
                )}
              </p>
            </div>

            {/* B. Today's Schedule */}
            {(todayPickups.length > 0 || todayReturns.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 vl-animate-in vl-delay-1">
                {/* Pickups Today */}
                <div className="vl-card rounded-xl border border-white/[0.1] p-4 lg:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Ophaalafspraken vandaag</h3>
                    <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                      {todayPickups.length}
                    </span>
                  </div>
                  {todayPickups.length === 0 ? (
                    <p className="text-sm text-neutral-500 py-2">Geen ophaalafspraken vandaag</p>
                  ) : (
                    <div className="space-y-2">
                      {todayPickups.map(booking => {
                        const car = cars.find(c => c.id === booking.car_id);
                        return (
                          <div key={booking.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {booking.customer_snapshot?.name || 'Onbekende klant'}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {car ? `${car.brand} ${car.model}` : 'Auto onbekend'}
                              </p>
                            </div>
                            <button
                              onClick={() => navigate('/manager/bookings')}
                              className="text-xs text-green-400 hover:text-green-300 font-medium flex-shrink-0"
                            >
                              Bekijken
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Returns Today */}
                <div className="vl-card rounded-xl border border-white/[0.1] p-4 lg:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <ArrowDownRight className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Inleveringen vandaag</h3>
                    <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      {todayReturns.length}
                    </span>
                  </div>
                  {todayReturns.length === 0 ? (
                    <p className="text-sm text-neutral-500 py-2">Geen inleveringen vandaag</p>
                  ) : (
                    <div className="space-y-2">
                      {todayReturns.map(booking => {
                        const car = cars.find(c => c.id === booking.car_id);
                        return (
                          <div key={booking.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {booking.customer_snapshot?.name || 'Onbekende klant'}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {car ? `${car.brand} ${car.model}` : 'Auto onbekend'}
                              </p>
                            </div>
                            <button
                              onClick={() => navigate('/manager/bookings')}
                              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex-shrink-0"
                            >
                              Bekijken
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* C. Action Center */}
            {priorityTasks.length > 0 && (
              <div className="vl-card rounded-xl border border-white/[0.1] overflow-hidden vl-animate-in vl-delay-1">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    Actiecentrum
                  </h2>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                    {totalOpenTasks}
                  </span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {priorityTasks.map((task) => {
                    const colors = colorMap[task.color];
                    const Icon = task.icon;
                    return (
                      <button
                        key={task.key}
                        onClick={() => navigate(task.route)}
                        className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors text-left"
                      >
                        <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center`}>
                          <Icon className={`w-[18px] h-[18px] ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{task.label}</p>
                        </div>
                        <span className={`flex-shrink-0 min-w-[24px] h-6 px-2 rounded-full ${colors.badge} text-white text-xs font-bold flex items-center justify-center`}>
                          {task.count}
                        </span>
                        <ChevronRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* D. KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 vl-animate-in vl-delay-2">
              {[
                {
                  label: 'Actieve boekingen',
                  value: activeBookings.toString(),
                  sub: `+${thisMonthBookings.length} deze maand`,
                  icon: Calendar,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                },
                {
                  label: 'Beschikbare auto\'s',
                  value: availableCars.toString(),
                  sub: `van ${totalCars} totaal`,
                  icon: Car,
                  color: 'text-green-400',
                  bg: 'bg-green-500/10',
                },
                {
                  label: 'Actieve klanten',
                  value: activeCustomers.toString(),
                  sub: 'met lopende boeking',
                  icon: Users,
                  color: 'text-purple-400',
                  bg: 'bg-purple-500/10',
                },
                {
                  label: 'Maandomzet',
                  value: `\u20AC${monthlyRevenue.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}`,
                  sub: format(new Date(), 'MMMM yyyy', { locale: nl }),
                  icon: TrendingUp,
                  color: 'text-orange-400',
                  bg: 'bg-orange-500/10',
                },
              ].map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.label} className="vl-card rounded-xl border border-white/[0.1] p-4 lg:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{kpi.label}</span>
                      <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${kpi.color}`} />
                      </div>
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-white" style={{ fontFamily: 'var(--vl-font-mono)' }}>
                      {kpi.value}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">{kpi.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* E. Fleet Status + Quick Actions row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 vl-animate-in vl-delay-3">

              {/* Fleet Status (2/3) */}
              <div className="lg:col-span-2 vl-card rounded-xl border border-white/[0.1] p-5 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Car className="w-[18px] h-[18px] text-green-400" />
                    Vlootstatus
                  </h2>
                  <button onClick={() => navigate('/manager/cars')} className="text-xs text-green-400 hover:text-green-300 font-medium">
                    Beheren &rarr;
                  </button>
                </div>

                {/* Status bar */}
                {totalCars > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-4 text-xs text-neutral-400 mb-2">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        Beschikbaar {availablePercent}%
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        Verhuurd {rentedPercent}%
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        Onderhoud {maintenancePercent}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden bg-white/[0.06] flex">
                      {availablePercent > 0 && (
                        <div className="bg-green-500 transition-all" style={{ width: `${availablePercent}%` }} />
                      )}
                      {rentedPercent > 0 && (
                        <div className="bg-blue-500 transition-all" style={{ width: `${rentedPercent}%` }} />
                      )}
                      {maintenancePercent > 0 && (
                        <div className="bg-yellow-500 transition-all" style={{ width: `${maintenancePercent}%` }} />
                      )}
                    </div>
                  </div>
                )}

                {/* Expiring documents */}
                {expiringCars.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Verloopt binnenkort</p>
                    {expiringCars.slice(0, 4).map((car) => {
                      const apkDays = car.apk_expiry_date ? daysUntil(car.apk_expiry_date) : null;
                      const insuranceDays = car.insurance_expiry_date ? daysUntil(car.insurance_expiry_date) : null;
                      const showApk = apkDays !== null && apkDays > 0 && apkDays <= 30;
                      const showInsurance = insuranceDays !== null && insuranceDays > 0 && insuranceDays <= 30;
                      const urgent = (apkDays !== null && apkDays <= 14) || (insuranceDays !== null && insuranceDays <= 14);
                      return (
                        <div
                          key={car.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${urgent ? 'border-red-500/30 bg-red-500/[0.05]' : 'border-orange-500/20 bg-orange-500/[0.03]'}`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{car.brand} {car.model}</p>
                            <p className="text-xs text-neutral-500" style={{ fontFamily: 'var(--vl-font-mono)' }}>{car.license_plate}</p>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-3">
                            {showApk && (
                              <span className={`text-xs font-medium ${apkDays! <= 14 ? 'text-red-400' : 'text-orange-400'}`}>
                                APK: {apkDays}d
                              </span>
                            )}
                            {showInsurance && (
                              <span className={`text-xs font-medium ${insuranceDays! <= 14 ? 'text-red-400' : 'text-orange-400'}`}>
                                Verzekering: {insuranceDays}d
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : totalCars > 0 ? (
                  <div className="text-center py-3">
                    <CheckCircle className="w-7 h-7 text-green-500/50 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">Alle documenten zijn up-to-date</p>
                  </div>
                ) : null}
              </div>

              {/* Quick Actions (1/3) */}
              <div className="vl-card rounded-xl border border-white/[0.1] p-5 lg:p-6">
                <h2 className="text-base font-semibold text-white mb-4">Snelle acties</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Auto toevoegen', route: '/manager/cars', icon: Plus, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'Boekingen', route: '/manager/bookings', icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10', badge: badges.pendingBookings + badges.confirmedBookings },
                    { label: 'Klanten', route: '/manager/customers', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { label: 'Rapporten', route: '/manager/reports', icon: BarChart3, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => navigate(action.route)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors text-left relative"
                      >
                        <div className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-[18px] h-[18px] ${action.color}`} />
                        </div>
                        <span className="text-sm font-medium text-white">{action.label}</span>
                        {'badge' in action && action.badge && action.badge > 0 && (
                          <span className="ml-auto text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white flex items-center justify-center">
                            {action.badge}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-neutral-600 ml-auto flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* G. Recent Bookings */}
            <div className="vl-card rounded-xl border border-white/[0.1] p-5 lg:p-6 vl-animate-in vl-delay-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-[18px] h-[18px] text-blue-400" />
                  Recente boekingen
                </h2>
                <button onClick={() => navigate('/manager/bookings')} className="text-xs text-green-400 hover:text-green-300 font-medium">
                  Alles bekijken &rarr;
                </button>
              </div>

              {recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">Nog geen boekingen</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentBookings.map((booking) => {
                    const car = cars.find(c => c.id === booking.car_id);
                    const status = statusLabel(booking.status);
                    return (
                      <div key={booking.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {booking.customer_snapshot?.name || 'Onbekende klant'}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {car ? `${car.brand} ${car.model}` : 'Auto niet gevonden'}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.cls}`}>
                          {status.text}
                        </span>
                        <div className="text-right flex-shrink-0 ml-1">
                          <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--vl-font-mono)' }}>
                            &euro;{booking.total_price?.toFixed(0) || '0'}
                          </p>
                          <p className="text-[10px] text-neutral-600">
                            {format(new Date(booking.created_at), 'd MMM', { locale: nl })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* H. Activity Feed */}
            <div data-tour="activity-feed" className="vl-card rounded-xl border border-white/[0.1] p-5 lg:p-6 vl-animate-in vl-delay-5">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="w-[18px] h-[18px] text-green-400" />
                <h2 className="text-base font-semibold text-white">Recente activiteit</h2>
              </div>
              <ActivityFeed limit={10} showFilters={false} />
            </div>

          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default ManagerDashboard;
