import { useState, useEffect } from 'react';
import { useCarStore } from '../../store/carStore';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import { Wrench, X, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MaintenanceAlert() {
  const { user } = useAuthStore();
  const { bookings } = useBookingStore();
  const { cars } = useCarStore();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Get active booking for customer
  const activeBooking = bookings.find(
    b => b.customer_id === user?.uid && (b.status === 'active' || b.status === 'confirmed')
  );

  if (!activeBooking) return null;

  const car = cars.find(c => c.id === activeBooking.car_id);
  if (!car || !car.next_maintenance_date) return null;

  // Check if maintenance is within 3 weeks (21 days)
  const maintenanceDate = new Date(car.next_maintenance_date);
  const today = new Date();
  const daysUntil = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Only show if within 21 days and not dismissed
  if (daysUntil > 21 || daysUntil < 0 || dismissed.includes(car.id)) return null;

  const isUrgent = daysUntil <= 7;
  const urgencyBorderClass = isUrgent ? 'border-red-500' : 'border-yellow-500';
  const iconClass = isUrgent ? 'text-red-500' : 'text-yellow-500';
  const titleClass = isUrgent ? 'text-red-500' : 'text-yellow-500';
  const textClass = isUrgent ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className={`vl-card border-2 ${urgencyBorderClass} rounded-lg p-4 sm:p-6 mb-6 relative shadow-lg`}>
      <button
        onClick={() => setDismissed([...dismissed, car.id])}
        className="absolute top-2 right-2 p-1 hover:bg-white/[0.1] rounded transition-colors"
      >
        <X className="w-4 h-4 text-neutral-400 hover:text-white" />
      </button>

      <div className="flex items-start gap-3">
        <div className={`${iconClass} mt-1`}>
          <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <div className="flex-1">
          <h3 className={`font-bold ${titleClass} mb-2 text-base sm:text-lg`}>
            {isUrgent ? '⚠️ DRINGEND: Onderhoud Benodigd!' : '⚠️ Onderhoud Binnenkort Nodig'}
          </h3>
          <p className={`text-sm sm:text-base ${textClass} mb-3 font-medium`}>
            Je {car.brand} {car.model} ({car.license_plate}) moet binnen{' '}
            <span className="font-bold underline">{daysUntil} dagen</span> onderhouden worden.
          </p>
          <p className="text-xs sm:text-sm text-neutral-500 mb-4">
            Geplande onderhoudsdatum: {new Date(car.next_maintenance_date).toLocaleDateString('nl-NL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>

          <button
            onClick={() => navigate('/garage')}
            className="flex items-center gap-2 bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-400 transition-colors text-sm sm:text-base font-semibold"
          >
            <Phone className="w-4 h-4" />
            Afspraak Maken bij Garage
          </button>
        </div>
      </div>
    </div>
  );
}
