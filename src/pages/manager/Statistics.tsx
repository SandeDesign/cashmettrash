import React, { useEffect, useState } from 'react';
import { Users, Car, Calendar, TrendingUp, DollarSign, Activity, Loader2, BarChart3 } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { User as UserType, Booking, Car as CarType } from '../../types';

const ManagerStatistics: React.FC = () => {
  const [customers, setCustomers] = useState<UserType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [usersSnap, bookingsSnap, carsSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'customer'))),
          getDocs(collection(db, 'bookings')),
          getDocs(collection(db, 'cars'))
        ]);

        setCustomers(usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserType)));
        setBookings(bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
        setCars(carsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CarType)));
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.verification_status === 'approved').length;
  const newThisMonth = customers.filter(c => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return new Date(c.created_at) > monthAgo;
  }).length;

  const totalCars = cars.length;
  const availableCars = cars.filter(c => c.status === 'available').length;
  const rentedCars = cars.filter(c => c.status === 'rented').length;

  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const activeBookings = bookings.filter(b => b.status === 'active' || b.status === 'confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  const totalRevenue = bookings
    .filter(b => b.status === 'completed' || b.status === 'active')
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Statistieken"
          subtitle="Overzicht van klanten, auto's, boekingen en omzet"
          icon={BarChart3}
        />

        <main data-tour="statistics-page" className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-green-400 mr-3" />
                <span className="text-neutral-500">Statistieken laden...</span>
              </div>
            ) : (
              <>
                {/* Klanten Stats */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-400" />
                    Klanten
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="vl-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                          <Users className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mb-1">{totalCustomers}</p>
                      <p className="text-sm text-neutral-500">Totaal klanten</p>
                    </div>

                    <div className="vl-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500/10 rounded-xl">
                          <Users className="w-6 h-6 text-green-400" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mb-1">{activeCustomers}</p>
                      <p className="text-sm text-neutral-500">Actieve klanten</p>
                    </div>

                    <div className="vl-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-500/10 rounded-xl">
                          <Users className="w-6 h-6 text-yellow-400" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mb-1">{newThisMonth}</p>
                      <p className="text-sm text-neutral-500">Nieuwe deze maand</p>
                    </div>
                  </div>
                </div>

                {/* Auto's Stats */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5 text-green-400" />
                    Auto's
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="vl-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                          <Car className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mb-1">{totalCars}</p>
                      <p className="text-sm text-neutral-500">Totaal auto's</p>
                    </div>

                    <div className="vl-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500/10 rounded-xl">
                          <Car className="w-6 h-6 text-green-400" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mb-1">{availableCars}</p>
                      <p className="text-sm text-neutral-500">Beschikbaar</p>
                    </div>

                    <div className="vl-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-500/10 rounded-xl">
                          <Car className="w-6 h-6 text-orange-400" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mb-1">{rentedCars}</p>
                      <p className="text-sm text-neutral-500">Verhuurd</p>
                    </div>
                  </div>
                </div>

                {/* Boekingen Stats */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-400" />
                    Boekingen
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="vl-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-500/10 rounded-xl">
                          <Calendar className="w-6 h-6 text-yellow-400" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mb-1">{pendingBookings}</p>
                      <p className="text-sm text-neutral-500">In behandeling</p>
                    </div>

                    <div className="vl-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500/10 rounded-xl">
                          <Activity className="w-6 h-6 text-green-400" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mb-1">{confirmedBookings}</p>
                      <p className="text-sm text-neutral-500">Bevestigd</p>
                    </div>

                    <div className="vl-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                          <Calendar className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mb-1">{activeBookings}</p>
                      <p className="text-sm text-neutral-500">Actief</p>
                    </div>

                    <div className="vl-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gray-500/10 rounded-xl">
                          <Activity className="w-6 h-6 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mb-1">{completedBookings}</p>
                      <p className="text-sm text-neutral-500">Voltooid</p>
                    </div>
                  </div>
                </div>

                {/* Revenue Stats */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Omzet
                  </h2>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="vl-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500/10 rounded-xl">
                          <TrendingUp className="w-6 h-6 text-green-400" />
                        </div>
                      </div>
                      <p className="text-4xl font-black text-green-400 mb-1">€{totalRevenue.toLocaleString('nl-NL')}</p>
                      <p className="text-sm text-neutral-500">Totale omzet</p>
                    </div>
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

export default ManagerStatistics;
