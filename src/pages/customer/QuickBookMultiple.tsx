import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Car as CarIcon, Loader2, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import { useCarStore } from '../../store/carStore';
import { useAuth } from '../../hooks/useAuth';
import BookingModal from '../../components/booking/BookingModal';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { Car } from '../../types';

const QuickBookMultiple: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cars, fetchCars } = useCarStore();
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  // Get car IDs and available_from from URL params
  const carIdsParam = searchParams.get('cars');
  const availableFrom = searchParams.get('from');

  const carIds = carIdsParam ? carIdsParam.split(',') : [];

  useEffect(() => {
    const loadCars = async () => {
      if (cars.length === 0) {
        await fetchCars();
      }
      setLoading(false);
    };
    loadCars();
  }, [cars.length, fetchCars]);

  const availableCars = cars.filter(c => carIds.includes(c.id));

  const handleSelectCar = (car: Car) => {
    setSelectedCar(car);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    navigate('/customer/bookings');
  };

  const formatAvailableDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  };

  if (!user || user.role !== 'customer') {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header title="Auto's Kiezen" />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
                <p className="text-neutral-400">Auto's laden...</p>
              </div>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (availableCars.length === 0) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header title="Auto's Kiezen" />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
            <div className="max-w-2xl mx-auto">
              <div className="vl-card p-8 rounded-lg text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Geen auto's gevonden</h2>
                <p className="text-neutral-400 mb-6">
                  De aangeboden auto's zijn niet meer beschikbaar.
                </p>
                <button
                  onClick={() => navigate('/customer/dashboard')}
                  className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-400 transition-colors"
                >
                  Terug naar Dashboard
                </button>
              </div>
            </div>
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
        <Header title="Auto's Kiezen" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Header Card */}
            <div className="vl-card p-8 rounded-lg border border-purple-500 shadow-xl mb-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CarIcon className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Alternatieve Auto's Beschikbaar! 🎉
                </h2>
                {availableFrom && formatAvailableDate(availableFrom) ? (
                  <div className="mt-3">
                    <p className="text-purple-400 font-semibold text-lg">
                      📅 Beschikbaar vanaf:
                    </p>
                    <p className="text-purple-300 text-xl mt-1">
                      {formatAvailableDate(availableFrom)}
                    </p>
                  </div>
                ) : (
                  <p className="text-neutral-400">
                    We hebben enkele auto's voor u beschikbaar!
                  </p>
                )}
              </div>

              <div className="bg-purple-900 border border-purple-600 rounded-lg p-4 mt-6">
                <p className="text-purple-300 text-sm font-medium text-center">
                  ⭐ Kies hieronder de auto die u wilt huren
                </p>
              </div>
            </div>

            {/* Car Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {availableCars.map((car) => (
                <div
                  key={car.id}
                  className="vl-card p-6 rounded-lg border-2 border-neutral-600 hover:border-purple-500 transition-all cursor-pointer"
                  onClick={() => handleSelectCar(car)}
                >
                  {/* Car Image */}
                  {car.images && car.images.length > 0 && (
                    <img
                      src={car.images[0]}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}

                  {/* Car Details */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {car.brand} {car.model}
                      </h3>
                      <p className="text-neutral-400 mb-2">
                        {car.year} • {car.license_plate}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-400">
                          €{car.weekly_rate}
                        </span>
                        <span className="text-neutral-500">per week (incl. BTW)</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectCar(car);
                    }}
                    className="w-full px-6 py-4 bg-purple-500 text-white rounded-lg hover:bg-purple-400 transition-colors font-bold text-lg flex items-center justify-center gap-2"
                  >
                    Kies deze auto
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-6">
              <p className="text-neutral-300 text-center">
                <span className="font-semibold text-white">Let op:</span> Na het kiezen van een auto kunt u direct de boeking afronden.
                De auto is beschikbaar vanaf de aangegeven datum.
              </p>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />

      {/* Booking Modal */}
      {showBookingModal && selectedCar && (
        <BookingModal
          car={selectedCar}
          initialStartDate={availableFrom || undefined}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedCar(null);
          }}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default QuickBookMultiple;
