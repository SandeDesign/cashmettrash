import React, { useState, useEffect } from 'react';
import { Calendar, X, Send, Info, AlertCircle } from 'lucide-react';
import { useBookingStore } from '../../store/bookingStore';

interface NotifyDateModalProps {
  carId: string;
  carName: string;
  waitlistCount: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (availableFrom: string) => void;
}

const NotifyDateModal: React.FC<NotifyDateModalProps> = ({
  carId,
  carName,
  waitlistCount,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { bookings } = useBookingStore();
  const [selectedDate, setSelectedDate] = useState('');
  const [currentBookingEndDate, setCurrentBookingEndDate] = useState<string | null>(null);

  // Get next Monday after a given date
  const getNextMonday = (afterDate?: Date) => {
    const baseDate = afterDate || new Date();
    const dayOfWeek = baseDate.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
    const nextMonday = new Date(baseDate);
    nextMonday.setDate(baseDate.getDate() + daysUntilMonday);
    return nextMonday;
  };

  // Check if date is Monday
  const isMonday = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDay() === 1;
  };

  useEffect(() => {
    if (isOpen && carId) {
      // Find active/confirmed bookings for this car
      const activeBookings = bookings.filter(
        b => b.car_id === carId && (b.status === 'active' || b.status === 'confirmed')
      );

      if (activeBookings.length > 0) {
        // Get the latest end_date
        const latestBooking = activeBookings.reduce((latest, current) => {
          const latestEnd = new Date(latest.end_date || latest.start_date);
          const currentEnd = new Date(current.end_date || current.start_date);
          return currentEnd > latestEnd ? current : latest;
        });

        const endDate = latestBooking.end_date || latestBooking.start_date;
        setCurrentBookingEndDate(endDate);

        // Calculate next Monday after end date
        const afterEndDate = new Date(endDate);
        afterEndDate.setDate(afterEndDate.getDate() + 1); // Day after end
        const nextMon = getNextMonday(afterEndDate);
        setSelectedDate(nextMon.toISOString().split('T')[0]);
      } else {
        // No active bookings, use next Monday from today
        const nextMon = getNextMonday();
        setSelectedDate(nextMon.toISOString().split('T')[0]);
        setCurrentBookingEndDate(null);
      }
    }
  }, [isOpen, carId, bookings]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (isMonday(date)) {
      setSelectedDate(date);
    }
  };

  const handleConfirm = () => {
    if (selectedDate && isMonday(selectedDate)) {
      onConfirm(selectedDate);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  };

  if (!isOpen) return null;

  const minDate = currentBookingEndDate
    ? getNextMonday(new Date(currentBookingEndDate)).toISOString().split('T')[0]
    : getNextMonday().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="vl-card rounded-lg shadow-2xl max-w-lg w-full border border-blue-500">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.1] flex items-center justify-between bg-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Notificeer Wachtlijst</h3>
              <p className="text-sm text-blue-300">{carName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Waitlist Info */}
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Wachtlijst</span>
            </div>
            <p className="text-sm text-neutral-300">
              {waitlistCount} {waitlistCount === 1 ? 'persoon' : 'personen'} op de wachtlijst voor deze auto
            </p>
          </div>

          {/* Current Booking Info */}
          {currentBookingEndDate && (
            <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-300 mb-1">
                    Huidige huur eindigt op:
                  </p>
                  <p className="text-sm text-yellow-200">
                    {formatDate(currentBookingEndDate)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-2">
              📅 Beschikbaar vanaf welke maandag?
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none z-10" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                min={minDate}
                className="w-full pl-12 pr-4 py-3 border-2 border-blue-500 bg-blue-900 text-white rounded-lg focus:ring-2 focus:ring-blue-400 cursor-pointer font-medium"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            {selectedDate && (
              <div className="mt-2 p-3 bg-blue-900 border border-blue-600 rounded-md">
                <p className="text-sm text-blue-300 font-medium">
                  {isMonday(selectedDate) ? '✅' : '❌'}{' '}
                  {formatDate(selectedDate)}
                </p>
                {!isMonday(selectedDate) && (
                  <p className="text-xs text-red-400 mt-1">⚠️ Kies een maandag!</p>
                )}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 mb-6">
            <p className="text-sm text-neutral-300">
              <span className="font-semibold text-white">Let op:</span> Alle personen op de
              wachtlijst ontvangen een notificatie met deze datum. Ze kunnen boeken vanaf deze
              datum of een latere maandag kiezen.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium"
            >
              Annuleren
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedDate || !isMonday(selectedDate)}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Verstuur Notificaties
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotifyDateModal;
