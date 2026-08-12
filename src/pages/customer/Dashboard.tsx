import React, { useEffect, useState } from 'react';
import { Car, Calendar, TrendingUp, Search, ArrowUpRight, FileText, Download, CheckCircle, AlertCircle, Activity, Banknote, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import ActivityFeed from '../../components/activity/ActivityFeed';
import BottomNav from '../../components/layout/BottomNav';
import { MaintenanceAlert } from '../../components/customer/MaintenanceAlert';
import { useAuth } from '../../hooks/useAuth';
import { useBookingStore } from '../../store/bookingStore';
import { useCarStore } from '../../store/carStore';
import type { Booking, Car as CarType } from '../../types';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookings, fetchBookings } = useBookingStore();
  const { cars, fetchCars } = useCarStore();
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [rentedCar, setRentedCar] = useState<CarType | null>(null);

  // Fetch bookings and cars on mount
  useEffect(() => {
    if (user) {
      fetchBookings({ customer_id: user.uid });
      fetchCars();
    }
  }, [user, fetchBookings, fetchCars]);

  // Find active booking and corresponding car
  useEffect(() => {
    if (user && bookings.length > 0 && cars.length > 0) {
      const active = bookings.find(
        b => b.customer_id === user.uid && (b.status === 'active' || b.status === 'confirmed')
      );
      if (active) {
        setActiveBooking(active);
        const car = cars.find(c => c.id === active.car_id);
        setRentedCar(car || null);
      } else {
        setActiveBooking(null);
        setRentedCar(null);
      }
    }
  }, [user, bookings, cars]);

  // Calculate LIFETIME metrics from ALL bookings
  const calculateTotalDaysRented = () => {
    return bookings
      .filter(b => b.status === 'active' || b.status === 'completed')
      .reduce((total, booking) => {
        const start = new Date(booking.start_date);
        const end = booking.actual_end_date ? new Date(booking.actual_end_date) : new Date();
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return total + diffDays;
      }, 0);
  };

  // Total actually paid to Vlottr across all active/completed bookings
  const calculateTotalPaid = () => {
    return bookings
      .filter(b => b.status === 'active' || b.status === 'completed')
      .reduce((total, booking) => {
        const start = new Date(booking.start_date);
        const end = booking.actual_end_date ? new Date(booking.actual_end_date) : new Date();
        const diffTime = Math.max(0, end.getTime() - start.getTime());
        const weeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        return total + (booking.weekly_rate * weeks);
      }, 0);
  };

  // Savings: Vlottr subscription vs traditional Dutch flexible rental (no commitment)
  // €65/day is a conservative estimate for monthlyflexible rental (Sixt Flex, Europcar Flex etc.)
  const TRADITIONAL_DAILY_RATE = 65;
  const calculateSavings = () => {
    const totalDays = calculateTotalDaysRented();
    const traditionalCost = totalDays * TRADITIONAL_DAILY_RATE;
    const vlottrCost = calculateTotalPaid();
    return Math.max(0, traditionalCost - vlottrCost);
  };

  const totalBookings = bookings.filter(b => b.status !== 'draft' && b.status !== 'cancelled').length;

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Dashboard" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Maintenance Alert - Shows 3 weeks before maintenance */}
            <MaintenanceAlert />

            {/* METRICS - LIFETIME Statistics - ALWAYS VISIBLE */}
            <div data-tour="metrics" className="vl-card p-6 mb-6 vl-animate-in vl-delay-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  Jouw Statistieken
                </h2>
                <div className="text-sm text-neutral-400">
                  {totalBookings} {totalBookings === 1 ? 'boeking' : 'boekingen'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Totaal Dagen Gehuurd */}
                <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-600/30 rounded-xl p-5 hover:border-blue-500/50 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <Calendar className="w-8 h-8 text-blue-400" />
                    <span className="text-xs text-blue-400 font-semibold bg-blue-900/30 px-2 py-1 rounded-full">
                      TOTAAL
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {calculateTotalDaysRented()}
                  </p>
                  <p className="text-sm text-neutral-400">Dagen gehuurd</p>
                  <p className="text-xs text-neutral-600 mt-2">
                    {activeBooking ? `Actief sinds ${new Date(activeBooking.start_date).toLocaleDateString('nl-NL')}` : 'Alle boekingen'}
                  </p>
                </div>

                {/* Totaal Betaald */}
                <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-600/30 rounded-xl p-5 hover:border-purple-500/50 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <Banknote className="w-8 h-8 text-purple-400" />
                    <span className="text-xs text-purple-400 font-semibold bg-purple-900/30 px-2 py-1 rounded-full">
                      BETAALD
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    €{calculateTotalPaid().toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-neutral-400">Totaal betaald aan Vlottr</p>
                  <p className="text-xs text-neutral-600 mt-2">
                    Op basis van weekhuur × weken
                  </p>
                </div>

                {/* Bespaard */}
                <div className="bg-gradient-to-br from-green-900/20 to-green-900/5 border border-green-600/30 rounded-xl p-5 hover:border-green-500/50 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp className="w-8 h-8 text-green-400" />
                    <span className="text-xs text-green-400 font-semibold bg-green-900/30 px-2 py-1 rounded-full">
                      BESPAARD
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    €{calculateSavings().toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-neutral-400">Bespaard t.o.v. losse verhuur</p>
                  <p className="text-xs text-neutral-600 mt-2">
                    vs. €{TRADITIONAL_DAILY_RATE}/dag flex-verhuur
                  </p>
                </div>
              </div>
            </div>

            {/* MY CAR DOCUMENTS - Prominent Section - ALWAYS VISIBLE */}
            <div data-tour="car-documents" className="vl-card p-6 mb-6 border-2 border-green-500 shadow-xl vl-animate-in vl-delay-2">
              {activeBooking && rentedCar ? (
                <>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Mijn Auto Documenten</h2>
                      <p className="text-sm text-neutral-400">
                        {rentedCar.brand} {rentedCar.model} ({rentedCar.license_plate})
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-900 border border-green-600 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-semibold">Actieve Boeking</span>
                  </div>
                </div>

                {/* Mijn Abonnement Info */}
                <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/[0.03] space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-300 mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-green-400" />
                    Mijn Abonnement
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-neutral-500 text-xs">Status</p>
                      <p className={`font-semibold mt-0.5 ${activeBooking.status === 'active' ? 'text-green-400' : 'text-orange-400'}`}>
                        {activeBooking.status === 'active' ? 'Actief' : 'Betaald — wacht op overdracht'}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500 text-xs">Wekelijks tarief</p>
                      <p className="font-semibold text-white mt-0.5">€{activeBooking.weekly_rate?.toFixed(2) ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 text-xs">Startdatum</p>
                      <p className="font-semibold text-white mt-0.5">{new Date(activeBooking.start_date).toLocaleDateString('nl-NL')}</p>
                    </div>
                    {activeBooking.lock_period && activeBooking.lock_period_end_date && (
                      <div>
                        <p className="text-neutral-500 text-xs">Vastgezet t/m</p>
                        <p className="font-semibold text-blue-300 mt-0.5">{new Date(activeBooking.lock_period_end_date).toLocaleDateString('nl-NL')}</p>
                      </div>
                    )}
                  </div>
                  {activeBooking.borg_payment_method && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-neutral-400">
                        <Banknote className="w-4 h-4" />
                        Borgsom
                      </span>
                      <span className={activeBooking.borg_confirmed ? 'text-green-400 font-medium' : 'text-orange-400 font-medium'}>
                        {activeBooking.borg_confirmed
                          ? '✓ Bevestigd'
                          : activeBooking.borg_payment_method === 'stripe'
                            ? 'Betaallink onderweg'
                            : 'Nog niet bevestigd'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Documents Grid - Only APK/RDW and Groene Kaart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* APK/RDW Bewijs */}
                  {rentedCar.apk_document_url ? (
                    <a
                      href={rentedCar.apk_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-neutral-800 hover:bg-neutral-700 border border-green-600 rounded-lg transition-colors group"
                    >
                      <Download className="w-5 h-5 text-green-400 group-hover:text-green-300" />
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">APK/RDW Bewijs</p>
                        <p className="text-xs text-neutral-500">
                          Geldig tot {rentedCar.apk_expiry_date ? new Date(rentedCar.apk_expiry_date).toLocaleDateString('nl-NL') : 'N/A'}
                        </p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-green-400" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-neutral-900 border border-neutral-700 rounded-lg opacity-50">
                      <AlertCircle className="w-5 h-5 text-neutral-600" />
                      <div className="flex-1">
                        <p className="text-neutral-500 font-semibold text-sm">APK/RDW Bewijs</p>
                        <p className="text-xs text-neutral-600">Niet beschikbaar</p>
                      </div>
                    </div>
                  )}

                  {/* Groene Kaart */}
                  {rentedCar.groene_kaart_url ? (
                    <a
                      href={rentedCar.groene_kaart_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-neutral-800 hover:bg-neutral-700 border border-green-600 rounded-lg transition-colors group"
                    >
                      <Download className="w-5 h-5 text-green-400 group-hover:text-green-300" />
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">Groene Kaart</p>
                        <p className="text-xs text-neutral-500">Internationaal verzekeringsbewijs</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-green-400" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-neutral-900 border border-neutral-700 rounded-lg opacity-50">
                      <AlertCircle className="w-5 h-5 text-neutral-600" />
                      <div className="flex-1">
                        <p className="text-neutral-500 font-semibold text-sm">Groene Kaart</p>
                        <p className="text-xs text-neutral-600">Niet beschikbaar</p>
                      </div>
                    </div>
                  )}

                </div>

                {/* Info Footer */}
                <div className="mt-4 p-3 bg-green-900 border border-green-600 rounded-lg">
                  <p className="text-xs text-green-300 text-center">
                    💡 <strong>Tip:</strong> Download deze documenten en bewaar ze op je telefoon voor onderweg!
                  </p>
                </div>
              </>
              ) : (
                /* Empty State - Geen actieve boeking */
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-neutral-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Auto Documenten</h2>
                      <p className="text-sm text-neutral-500">Documenten van je gehuurde auto</p>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <Car className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400 mb-2">Geen actieve verhuur</p>
                    <p className="text-sm text-neutral-600 mb-4">
                      Als je een auto huurt, vind je hier alle belangrijke documenten zoals de Groene Kaart en het APK/RDW Bewijs.
                    </p>
                    <button
                      onClick={() => navigate('/cars')}
                      className="vl-btn-primary"
                    >
                      <Search className="w-4 h-4" />
                      Auto's bekijken
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions - Mobile only */}
            <div className="grid grid-cols-2 gap-3 mb-6 lg:hidden">
              <button
                onClick={() => navigate('/cars')}
                className="vl-btn-primary vl-animate-in vl-delay-1"
              >
                <Search className="w-5 h-5" />
                <span className="text-sm">Zoek auto's</span>
              </button>
              <button
                onClick={() => navigate('/bookings')}
                className="vl-btn-secondary vl-animate-in vl-delay-2"
              >
                <Calendar className="w-5 h-5" />
                <span className="text-sm">Boekingen</span>
              </button>
            </div>

            {/* Recent Activity */}
            <div data-tour="activity-feed" className="vl-card p-6 vl-animate-in vl-delay-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-6 h-6 text-green-400" />
                  Mijn Activiteit
                </h2>
              </div>
              <ActivityFeed userId={user?.uid} limit={10} showFilters={false} />
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default CustomerDashboard;
