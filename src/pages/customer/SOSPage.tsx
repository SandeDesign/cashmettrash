import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarStore } from '../../store/carStore';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import { AlertCircle, ArrowLeft, MessageCircle, Phone, MapPin, AlertTriangle, Send } from 'lucide-react';

const SOS_PHONE = '0612345678'; // TODO: Configureerbaar maken

type SOSStep = 'problem' | 'location' | 'confirm';

interface ProblemOption {
  id: string;
  label: string;
  icon: string;
  urgent: boolean;
}

const PROBLEM_OPTIONS: ProblemOption[] = [
  { id: 'breakdown', label: 'Pech/Storing', icon: '🔧', urgent: true },
  { id: 'accident', label: 'Ongeluk', icon: '🚗💥', urgent: true },
  { id: 'flat_tire', label: 'Lekke Band', icon: '🛞', urgent: true },
  { id: 'no_fuel', label: 'Geen Brandstof', icon: '⛽', urgent: false },
  { id: 'locked_out', label: 'Sleutel Binnen', icon: '🔑', urgent: false },
  { id: 'other', label: 'Anders...', icon: '❓', urgent: false },
];

export function SOSPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { bookings, fetchBookings } = useBookingStore();
  const { cars, fetchCars } = useCarStore();

  // LOAD BOOKINGS AND CARS ON MOUNT
  useEffect(() => {
    if (user?.uid) {
      console.log('[SOS] Loading bookings and cars for user:', user.uid);
      fetchBookings({ customer_id: user.uid });
      fetchCars();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only re-fetch when user ID changes

  const [step, setStep] = useState<SOSStep>('problem');
  const [selectedProblem, setSelectedProblem] = useState<ProblemOption | null>(null);
  const [problemDetails, setProblemDetails] = useState('');
  const [location, setLocation] = useState('');
  const [autoLocation, setAutoLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Get active booking - EXTENSIVE CHECK
  const activeBooking = bookings.find(
    b => b.customer_id === user?.uid && (b.status === 'active' || b.status === 'confirmed')
  );

  const car = activeBooking ? cars.find(c => c.id === activeBooking.car_id) : null;

  // Auto-detect location
  useEffect(() => {
    if (step === 'location' && !location && !loadingLocation) {
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAutoLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          // Reverse geocode to get address
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
          )
            .then((res) => res.json())
            .then((data) => {
              setLocation(data.display_name || '');
            })
            .catch(() => {
              setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
            })
            .finally(() => setLoadingLocation(false));
        },
        () => {
          setLoadingLocation(false);
        }
      );
    }
  }, [step, location, loadingLocation]);

  const handleSendSOS = () => {
    if (!car || !selectedProblem) return;

    const message = encodeURIComponent(
      `🆘 NOODMELDING\n\n` +
      `❗ Probleem: ${selectedProblem.label}\n` +
      (problemDetails ? `📝 Details: ${problemDetails}\n` : '') +
      `📍 Locatie: ${location || 'Niet bekend'}\n\n` +
      `🚗 Auto: ${car.brand} ${car.model}\n` +
      `🔢 Kenteken: ${car.license_plate}\n\n` +
      `👤 Naam: ${user?.name}\n` +
      `📧 Email: ${user?.email}\n` +
      `📱 Telefoon: ${user?.phone}\n\n` +
      `⏰ Tijd: ${new Date().toLocaleString('nl-NL')}`
    );

    window.open(`https://wa.me/${SOS_PHONE}?text=${message}`, '_blank');
  };

  const handlePhoneCall = () => {
    window.location.href = `tel:${SOS_PHONE}`;
  };

  if (!car) {
    return (
      <div className="min-h-screen bg-neutral-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug
          </button>

          <div className="bg-white rounded-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Geen Actieve Boeking
            </h2>
            <p className="text-neutral-600">
              SOS is alleen beschikbaar bij een actieve huurperiode.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-neutral-50 pb-20">
      {/* Header - URGENT STYLE */}
      <div className="bg-red-600 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <AlertCircle className="w-8 h-8 animate-pulse" />
            Noodservice
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Car Info */}
        <div className="bg-white rounded-xl p-4 border-l-4 border-red-500">
          <p className="text-xs text-neutral-500 mb-1">Jouw huurauto</p>
          <p className="font-semibold text-neutral-900">
            {car.brand} {car.model} ({car.license_plate})
          </p>
        </div>

        {/* STEP 1: Problem Selection */}
        {step === 'problem' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Wat is het probleem?
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {PROBLEM_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedProblem(option)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedProblem?.id === option.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.icon}</div>
                  <div className="font-semibold text-neutral-900 text-sm">{option.label}</div>
                  {option.urgent && (
                    <div className="text-xs text-red-600 font-medium mt-1">⚡ Urgent</div>
                  )}
                </button>
              ))}
            </div>

            {selectedProblem && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-700">
                  Extra details (optioneel)
                </label>
                <textarea
                  value={problemDetails}
                  onChange={(e) => setProblemDetails(e.target.value)}
                  placeholder="Vertel meer over de situatie..."
                  className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />

                <button
                  onClick={() => setStep('location')}
                  className="w-full bg-red-600 text-white rounded-xl py-4 px-6 font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  Volgende: Locatie
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Location */}
        {step === 'location' && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('problem')}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug
            </button>

            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              Waar bent u nu?
            </h2>

            {loadingLocation && (
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-blue-700">Locatie ophalen...</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">
                Uw locatie
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Straat, plaats of postcode..."
                className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {autoLocation && (
                <p className="text-xs text-neutral-500">
                  📍 Auto-detectie: {autoLocation.lat.toFixed(6)}, {autoLocation.lon.toFixed(6)}
                </p>
              )}
            </div>

            <button
              onClick={() => setStep('confirm')}
              disabled={!location.trim()}
              className="w-full bg-red-600 text-white rounded-xl py-4 px-6 font-semibold hover:bg-red-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Volgende: Bevestigen
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>
        )}

        {/* STEP 3: Confirm & Send */}
        {step === 'confirm' && selectedProblem && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('location')}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug
            </button>

            <h2 className="text-lg font-semibold text-neutral-900">
              Noodmelding Controleren
            </h2>

            <div className="bg-white rounded-xl p-6 border-2 border-red-200 space-y-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Probleem</p>
                <p className="font-semibold text-neutral-900">
                  {selectedProblem.icon} {selectedProblem.label}
                </p>
                {problemDetails && (
                  <p className="text-sm text-neutral-600 mt-1">{problemDetails}</p>
                )}
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <p className="text-xs text-neutral-500 mb-1">Locatie</p>
                <p className="font-semibold text-neutral-900">{location}</p>
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <p className="text-xs text-neutral-500 mb-1">Auto</p>
                <p className="font-semibold text-neutral-900">
                  {car.brand} {car.model} ({car.license_plate})
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* WhatsApp SOS - PRIMARY */}
              <button
                onClick={handleSendSOS}
                className="w-full bg-[#25D366] text-white rounded-xl py-4 px-6 flex items-center justify-center gap-3 hover:bg-[#20BA5A] transition-all shadow-lg active:scale-[0.98]"
              >
                <MessageCircle className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold text-lg">Verstuur via WhatsApp</div>
                  <div className="text-xs opacity-90">Noodmelding met alle details</div>
                </div>
              </button>

              {/* Emergency Call - URGENT */}
              <button
                onClick={handlePhoneCall}
                className="w-full bg-red-600 text-white rounded-xl py-4 px-6 flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-lg active:scale-[0.98] animate-pulse"
              >
                <Phone className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold text-lg">Direct Bellen</div>
                  <div className="text-xs opacity-90">⚡ Spoedgeval: {SOS_PHONE}</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Always Available: Emergency Call */}
        {step !== 'confirm' && (
          <div className="bg-red-100 rounded-xl p-4 border border-red-200">
            <p className="text-xs text-red-700 mb-3 text-center font-medium">
              ⚡ Bij levensgevaar direct bellen:
            </p>
            <button
              onClick={handlePhoneCall}
              className="w-full bg-red-600 text-white rounded-lg py-3 px-4 font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              {SOS_PHONE}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
