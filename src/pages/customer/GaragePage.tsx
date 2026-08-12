import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarStore } from '../../store/carStore';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import { Phone, MessageCircle, ArrowLeft, Calendar, Car as CarIcon, Wrench } from 'lucide-react';

const GARAGE_PHONE = '0612345678'; // TODO: Configureerbaar maken

export function GaragePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { bookings, fetchBookings } = useBookingStore();
  const { cars, fetchCars } = useCarStore();

  // LOAD BOOKINGS AND CARS ON MOUNT
  useEffect(() => {
    if (user?.uid) {
      console.log('[Garage] Loading bookings and cars for user:', user.uid);
      fetchBookings({ customer_id: user.uid });
      fetchCars();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only re-fetch when user ID changes

  // Get active booking - EXTENSIVE CHECK
  const activeBooking = bookings.find(
    b => b.customer_id === user?.uid && (b.status === 'active' || b.status === 'confirmed')
  );

  const car = activeBooking ? cars.find(c => c.id === activeBooking.car_id) : null;

  const handleWhatsAppContact = () => {
    if (!car) return;

    const message = encodeURIComponent(
      `Hallo, ik wil graag een onderhoud afspraak maken voor mijn huurauto:\n\n` +
      `🚗 Merk: ${car.brand}\n` +
      `📋 Model: ${car.model}\n` +
      `🔢 Kenteken: ${car.license_plate}\n` +
      `📅 Geplande onderhoudsdatum: ${car.next_maintenance_date ? new Date(car.next_maintenance_date).toLocaleDateString('nl-NL') : 'Niet bekend'}\n\n` +
      `👤 Naam: ${user?.name}\n` +
      `📧 Email: ${user?.email}\n` +
      `📱 Telefoon: ${user?.phone}\n\n` +
      `Wanneer kan ik terecht?`
    );

    window.open(`https://wa.me/${GARAGE_PHONE}?text=${message}`, '_blank');
  };

  const handlePhoneCall = () => {
    window.location.href = `tel:${GARAGE_PHONE}`;
  };

  if (!car) {
    return (
      <div className="min-h-screen p-4" style={{ background: 'var(--vl-bg-primary)' }}>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug
          </button>

          <div className="vl-card rounded-xl p-8 text-center border border-white/[0.1]">
            <CarIcon className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Geen Actieve Boeking
            </h2>
            <p className="text-neutral-400">
              Je hebt momenteel geen actieve huurauto om onderhoud voor in te plannen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const maintenanceDate = car.next_maintenance_date ? new Date(car.next_maintenance_date) : null;
  const daysUntil = maintenanceDate
    ? Math.ceil((maintenanceDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--vl-bg-primary)' }}>
      {/* Header */}
      <div className="vl-card border-b border-white/[0.1] sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-neutral-400 hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Wrench className="w-7 h-7 text-green-400" />
            Garage Contact
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Car Info Card */}
        <div className="vl-card rounded-xl p-6 border border-white/[0.1]">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CarIcon className="w-5 h-5 text-green-400" />
            Jouw Huurauto
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-white/[0.08]">
              <span className="text-neutral-400">Merk & Model</span>
              <span className="font-semibold text-white">{car.brand} {car.model}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.08]">
              <span className="text-neutral-400">Kenteken</span>
              <span className="font-mono font-semibold text-white">{car.license_plate}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.08]">
              <span className="text-neutral-400">Bouwjaar</span>
              <span className="font-semibold text-white">{car.year}</span>
            </div>
          </div>
        </div>

        {/* Maintenance Warning */}
        {daysUntil !== null && (
          <div className={`rounded-xl p-6 border ${
            daysUntil <= 7
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-start gap-3">
              <Calendar className={`w-6 h-6 mt-0.5 ${
                daysUntil <= 7 ? 'text-red-400' : 'text-amber-400'
              }`} />
              <div>
                <h3 className="font-semibold text-white mb-1">
                  {daysUntil <= 7 ? '⚠️ Dringend Onderhoud Nodig' : 'Onderhoud Gepland'}
                </h3>
                <p className="text-sm text-neutral-300 mb-2">
                  Onderhoudsdatum: <span className="font-semibold">
                    {maintenanceDate?.toLocaleDateString('nl-NL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </p>
                <p className={`text-xs font-medium ${
                  daysUntil <= 7 ? 'text-red-300' : 'text-amber-300'
                }`}>
                  Nog {daysUntil} dagen
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Instructions */}
        <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/30">
          <h3 className="font-semibold text-white mb-3">
            📞 Maak een Afspraak
          </h3>
          <p className="text-sm text-neutral-300 mb-4">
            Neem direct contact op met onze garage partner om een afspraak in te plannen.
            De autogegevens worden automatisch meegestuurd.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* WhatsApp Button - PRIMARY */}
          <button
            onClick={handleWhatsAppContact}
            className="w-full bg-[#25D366] text-white rounded-xl py-4 px-6 flex items-center justify-center gap-3 hover:bg-[#20BA5A] transition-all shadow-lg active:scale-[0.98]"
          >
            <MessageCircle className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold text-lg">WhatsApp Garage</div>
              <div className="text-xs opacity-90">Voorbereide bericht met autogegevens</div>
            </div>
          </button>

          {/* Phone Button - SECONDARY */}
          <button
            onClick={handlePhoneCall}
            className="w-full bg-white/[0.08] text-white border border-white/[0.12] rounded-xl py-4 px-6 flex items-center justify-center gap-3 hover:bg-white/[0.12] transition-all active:scale-[0.98]"
          >
            <Phone className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold text-lg">Direct Bellen</div>
              <div className="text-xs opacity-70">{GARAGE_PHONE}</div>
            </div>
          </button>
        </div>

        {/* Info Footer */}
        <div className="vl-card rounded-xl p-4 border border-white/[0.1]">
          <p className="text-xs text-neutral-400 text-center">
            💡 <span className="font-medium text-white">Tip:</span> Gebruik WhatsApp voor snelste reactie.
            Je krijgt automatisch een bevestiging van je afspraak.
          </p>
        </div>
      </div>
    </div>
  );
}
