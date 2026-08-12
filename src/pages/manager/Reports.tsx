import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Calendar, DollarSign, Car, Users, Loader2 } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useBookingStore } from '../../store/bookingStore';
import { useCarStore } from '../../store/carStore';
import { useAuth } from '../../hooks/useAuth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const ManagerReports: React.FC = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerCount, setCustomerCount] = useState(0);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const { bookings, subscribeToBookings, loading: bookingsLoading } = useBookingStore();
  const { cars, subscribeToCars, loading: carsLoading } = useCarStore();

  useEffect(() => {
    if (user) {
      const unsubBookings = subscribeToBookings();
      const unsubCars = subscribeToCars();
      return () => {
        unsubBookings();
        unsubCars();
      };
    }
  }, [user]);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const snap = await getDocs(collection(db, 'users'));
        const customers = snap.docs.filter(d => d.data().role === 'customer');
        setCustomerCount(customers.length);
      } catch { /* ignore */ }
      setLoadingCustomers(false);
    };
    loadCustomers();
  }, []);

  // Determine date range bounds
  const { rangeStart, rangeEnd, prevStart, prevEnd } = useMemo(() => {
    const now = new Date();
    let rs: Date, re: Date, ps: Date, pe: Date;
    if (dateRange === 'week') {
      const day = now.getDay();
      rs = new Date(now); rs.setDate(now.getDate() - day); rs.setHours(0,0,0,0);
      re = new Date(now); re.setHours(23,59,59,999);
      ps = new Date(rs); ps.setDate(rs.getDate() - 7);
      pe = new Date(rs); pe.setMilliseconds(-1);
    } else if (dateRange === 'month') {
      rs = new Date(now.getFullYear(), now.getMonth(), 1);
      re = new Date(now); re.setHours(23,59,59,999);
      ps = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      pe = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (dateRange === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      rs = new Date(now.getFullYear(), q * 3, 1);
      re = new Date(now); re.setHours(23,59,59,999);
      ps = new Date(now.getFullYear(), (q - 1) * 3, 1);
      pe = new Date(now.getFullYear(), q * 3, 0, 23, 59, 59);
    } else if (dateRange === 'year') {
      rs = new Date(now.getFullYear(), 0, 1);
      re = new Date(now); re.setHours(23,59,59,999);
      ps = new Date(now.getFullYear() - 1, 0, 1);
      pe = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    } else if (dateRange === 'custom' && startDate && endDate) {
      rs = new Date(startDate);
      re = new Date(endDate); re.setHours(23,59,59,999);
      const diff = re.getTime() - rs.getTime();
      ps = new Date(rs.getTime() - diff);
      pe = new Date(rs.getTime() - 1);
    } else {
      rs = new Date(now.getFullYear(), now.getMonth(), 1);
      re = new Date(now); re.setHours(23,59,59,999);
      ps = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      pe = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }
    return { rangeStart: rs, rangeEnd: re, prevStart: ps, prevEnd: pe };
  }, [dateRange, startDate, endDate]);

  const inRange = (dateStr: string, start: Date, end: Date) => {
    const d = new Date(dateStr);
    return d >= start && d <= end;
  };

  const currentBookings = bookings.filter(b => inRange(b.created_at, rangeStart, rangeEnd));
  const prevBookings = bookings.filter(b => inRange(b.created_at, prevStart, prevEnd));

  const totalRevenue = currentBookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + b.total_price, 0);
  const prevRevenue = prevBookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + b.total_price, 0);

  const totalBookingsCount = currentBookings.length;
  const prevBookingsCount = prevBookings.length;

  const activeBookings = bookings.filter(b => b.status === 'active' || b.status === 'confirmed');
  const occupancyRate = cars.length > 0 ? Math.round((activeBookings.length / cars.length) * 100) : 0;

  // New customers = unique customers with first booking in range
  const newCustomerIds = new Set(currentBookings.map(b => b.customer_id));

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? '+100%' : '0%';
    const pct = Math.round(((curr - prev) / prev) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  };

  // Most popular cars
  const carBookingCount: Record<string, number> = {};
  bookings.forEach(b => {
    carBookingCount[b.car_id] = (carBookingCount[b.car_id] || 0) + 1;
  });
  const topCars = Object.entries(carBookingCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([carId, count]) => ({ car: cars.find(c => c.id === carId), count }))
    .filter(x => x.car);

  // Recent bookings for trend
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const loading = bookingsLoading || carsLoading;

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Rapporten & Analytics" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">

            {/* Filters */}
            <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1] mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="bg-black/20 border border-white/[0.1] rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="overview">Overzicht</option>
                  <option value="revenue">Omzet</option>
                  <option value="bookings">Boekingen</option>
                  <option value="fleet">Vloot prestaties</option>
                  <option value="customers">Klant analytics</option>
                </select>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-black/20 border border-white/[0.1] rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="week">Deze week</option>
                  <option value="month">Deze maand</option>
                  <option value="quarter">Dit kwartaal</option>
                  <option value="year">Dit jaar</option>
                  <option value="custom">Aangepaste periode</option>
                </select>
                {dateRange === 'custom' && (
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-black/20 border border-white/[0.1] rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white"
                      style={{ colorScheme: 'dark' }}
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-black/20 border border-white/[0.1] rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                <span className="ml-3 text-neutral-400">Gegevens laden...</span>
              </div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1]">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-neutral-500">Totale omzet</p>
                        <p className="text-2xl font-bold text-white">€{totalRevenue.toFixed(0)}</p>
                        <p className={`text-sm ${totalRevenue >= prevRevenue ? 'text-green-400' : 'text-red-400'}`}>
                          {pctChange(totalRevenue, prevRevenue)} vs vorige periode
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1]">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Calendar className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-neutral-500">Totale boekingen</p>
                        <p className="text-2xl font-bold text-white">{totalBookingsCount}</p>
                        <p className={`text-sm ${totalBookingsCount >= prevBookingsCount ? 'text-green-400' : 'text-red-400'}`}>
                          {pctChange(totalBookingsCount, prevBookingsCount)} vs vorige periode
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1]">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Car className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-neutral-500">Bezettingsgraad</p>
                        <p className="text-2xl font-bold text-white">{occupancyRate}%</p>
                        <p className="text-sm text-neutral-500">{activeBookings.length} van {cars.length} auto's actief</p>
                      </div>
                    </div>
                  </div>

                  <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1]">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <Users className="w-6 h-6 text-orange-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-neutral-500">Klanten (totaal)</p>
                        <p className="text-2xl font-bold text-white">
                          {loadingCustomers ? '...' : customerCount}
                        </p>
                        <p className="text-sm text-neutral-500">{newCustomerIds.size} actief deze periode</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent bookings */}
                  <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Recente boekingen</h3>
                    {recentBookings.length === 0 ? (
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                        <p className="text-neutral-500">Nog geen boekingen</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentBookings.map(b => {
                          const car = cars.find(c => c.id === b.car_id);
                          return (
                            <div key={b.id} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                              <div>
                                <p className="text-sm text-white font-medium">{b.customer_snapshot?.name || b.customer_name || 'Onbekend'}</p>
                                <p className="text-xs text-neutral-500">{car ? `${car.brand} ${car.model}` : 'Auto onbekend'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-white">€{b.total_price.toFixed(0)}</p>
                                <p className="text-xs text-neutral-500">{new Date(b.created_at).toLocaleDateString('nl-NL')}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Top cars */}
                  <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Populairste auto's</h3>
                    {topCars.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                        <p className="text-neutral-500">Geen verhuurdata beschikbaar</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {topCars.map(({ car, count }, i) => (
                          <div key={car!.id} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{car!.brand} {car!.model}</p>
                              <div className="mt-1 bg-white/[0.05] rounded-full h-1.5">
                                <div
                                  className="bg-green-500 h-1.5 rounded-full"
                                  style={{ width: `${Math.min((count / (topCars[0]?.count || 1)) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm text-neutral-400 flex-shrink-0">{count}x</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default ManagerReports;
