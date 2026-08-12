import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Car as CarIcon, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { useCarStore } from '../../store/carStore';
import { useAuth } from '../../hooks/useAuth';
import BookingModal from '../../components/booking/BookingModal';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';

const QuickBook: React.FC = () => {
  const { carId } = useParams<{ carId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cars, fetchCars } = useCarStore();
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Get available_from date from URL params
  const availableFrom = searchParams.get('from');

  useEffect(() => {
    const loadCar = async () => {
      if (cars.length === 0) {
        await fetchCars();
      }
      setLoading(false);
    };
    loadCar();
  }, [cars.length, fetchCars]);

  const car = cars.find(c => c.id === carId);

  useEffect(() => {
    // Auto-show confirmation modal when car is loaded
    if (!loading && car && !confirmed) {
      // Small delay for better UX
      setTimeout(() => {
        setConfirmed(true);
      }, 300);
    }
  }, [loading, car, confirmed]);

  const handleConfirm = () => {
    setShowBookingModal(true);
  };

  const handleCancel = () => {
    navigate('/customer/dashboard');
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
          <Header title="Auto Boeken" />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
                <p className="text-neutral-400">Auto laden...</p>
              </div>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header title="Auto Boeken" />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
            <div className="max-w-2xl mx-auto">
              <div className="vl-card p-8 rounded-lg text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Auto niet gevonden</h2>
                <p className="text-neutral-400 mb-6">
                  Deze auto bestaat niet of is niet meer beschikbaar.
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
        <Header title="Auto Boeken" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-2xl mx-auto">
            {/* Confirmation Card */}
            {confirmed && !showBookingModal && (
              <div className="vl-card p-8 rounded-lg border border-green-500 shadow-xl">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Auto Beschikbaar! 🎉
                  </h2>
                  {availableFrom && formatAvailableDate(availableFrom) ? (
                    <div className="mt-3">
                      <p className="text-blue-400 font-semibold text-lg">
                        📅 Beschikbaar vanaf:
                      </p>
                      <p className="text-blue-300 text-xl mt-1">
                        {formatAvailableDate(availableFrom)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-neutral-400">
                      De auto waar u op wachtte is nu vrij!
                    </p>
                  )}
                </div>

                {/* Car Info */}
                <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-4">
                    {car.images && car.images.length > 0 && (
                      <img
                        src={car.images[0]}
                        alt={`${car.brand} ${car.model}`}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CarIcon className="w-5 h-5 text-green-400" />
                        <h3 className="text-2xl font-bold text-white">
                          {car.brand} {car.model}
                        </h3>
                      </div>
                      <p className="text-neutral-400 mb-2">{car.year} • {car.license_plate}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-400">€{car.weekly_rate}</span>
                        <span className="text-neutral-500">per week (incl. BTW)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6">
                  <p className="text-yellow-300 text-sm font-medium text-center">
                    ⚡ Wees er snel bij! Andere klanten kunnen deze auto ook zien.
                  </p>
                </div>

                {/* Question */}
                <div className="text-center mb-6">
                  <p className="text-xl font-semibold text-white">
                    Wilt u deze auto nu huren?
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-6 py-4 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium"
                  >
                    Nee, later
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-400 transition-colors font-bold text-lg"
                  >
                    JA, BOEK NU! 🚗
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          car={car}
          initialStartDate={availableFrom || undefined}
          onClose={() => {
            setShowBookingModal(false);
            navigate('/customer/dashboard');
          }}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default QuickBook;
