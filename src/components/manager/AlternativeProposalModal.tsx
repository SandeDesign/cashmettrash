import React, { useState, useEffect } from 'react';
import { Calendar, X, Send, Car as CarIcon, Check, User } from 'lucide-react';
import { Car, Booking } from '../../types';
import { useCarStore } from '../../store/carStore';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface AlternativeProposalModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AlternativeProposalModal: React.FC<AlternativeProposalModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { cars } = useCarStore();
  const [selectedCarIds, setSelectedCarIds] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState('');
  const [sending, setSending] = useState(false);

  // Get next Monday
  const getNextMonday = (afterDate?: Date) => {
    const baseDate = afterDate || new Date();
    const dayOfWeek = baseDate.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
    const nextMonday = new Date(baseDate);
    nextMonday.setDate(baseDate.getDate() + daysUntilMonday);
    return nextMonday;
  };

  const isMonday = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDay() === 1;
  };

  useEffect(() => {
    if (isOpen) {
      // Reset selections
      setSelectedCarIds([]);
      const nextMon = getNextMonday();
      setAvailableFrom(nextMon.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // Filter available cars (status = available)
  const availableCars = cars.filter(c => c.status === 'available');

  const toggleCar = (carId: string) => {
    if (selectedCarIds.includes(carId)) {
      setSelectedCarIds(selectedCarIds.filter(id => id !== carId));
    } else {
      setSelectedCarIds([...selectedCarIds, carId]);
    }
  };

  const getCarDetails = (carId: string) => {
    return cars.find(c => c.id === carId);
  };

  const handleConfirm = async () => {
    if (selectedCarIds.length === 0 || !availableFrom || !isMonday(availableFrom)) {
      return;
    }

    setSending(true);
    try {
      // Create notification for customer with alternative car proposals
      const carNames = selectedCarIds
        .map(id => {
          const car = getCarDetails(id);
          return car ? `${car.brand} ${car.model}` : '';
        })
        .filter(Boolean)
        .join(', ');

      // Create the quick-book-multiple link with car IDs and date
      const quickBookLink = `/book-multiple?cars=${selectedCarIds.join(',')}&from=${availableFrom}`;

      await addDoc(collection(db, 'notifications'), {
        user_id: booking.customer_id,
        type: 'car_available',
        title: 'Alternatieve Auto Beschikbaar!',
        message: `Helaas is uw eerdere boeking verlopen. We hebben ${selectedCarIds.length} alternatieve auto${selectedCarIds.length > 1 ? "'s" : ''} voor u beschikbaar: ${carNames}. Beschikbaar vanaf ${formatDate(availableFrom)}. Klik hier om te kiezen!`,
        link: quickBookLink,
        data: {
          alternative_car_ids: selectedCarIds,
          available_from: availableFrom,
          original_booking_id: booking.id,
        },
        read: false,
        created_at: Timestamp.now(),
      });

      alert(`Voorstel verzonden naar ${booking.customer_snapshot?.name || 'Onbekende klant'}!`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending proposal:', error);
      alert('Er is een fout opgetreden bij het versturen van het voorstel.');
    } finally {
      setSending(false);
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

  const minDate = getNextMonday().toISOString().split('T')[0];
  const originalCar = getCarDetails(booking.car_id);

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
      <div className="vl-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-green-500">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.1] flex items-center justify-between bg-green-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center">
              <CarIcon className="w-5 h-5 text-green-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bied Alternatieve Auto's Aan</h3>
              <p className="text-sm text-green-300">{booking.customer_snapshot?.name || 'Onbekende klant'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            disabled={sending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Customer & Booking Info */}
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-neutral-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-300">
                  <span className="font-semibold text-white">Klant:</span> {booking.customer_snapshot?.name || 'Onbekende klant'}
                  <br />
                  <span className="font-semibold text-white">Email:</span> {booking.customer_snapshot?.email || 'Geen email'}
                  <br />
                  <span className="font-semibold text-white">Telefoon:</span> {booking.customer_snapshot?.phone || 'Geen telefoon'}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-neutral-600">
              <p className="text-sm text-neutral-300">
                <span className="font-semibold text-white">Verwijderde boeking:</span> {originalCar ? `${originalCar.brand} ${originalCar.model}` : 'Onbekend'}
                <br />
                <span className="font-semibold text-white">Status:</span>{' '}
                <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs font-bold rounded">
                  CONCEPT (NIET GETEKEND)
                </span>
              </p>
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-blue-900 border border-blue-600 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-200">
              💡 <span className="font-semibold">Let op:</span> De klant heeft de boeking niet afgerond.
              Bied alternatieve auto's aan om de klant een nieuwe kans te geven.
            </p>
          </div>

          {/* Car Selection */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-white mb-3">
              Selecteer beschikbare auto's om aan te bieden:
            </h4>
            {availableCars.length === 0 ? (
              <div className="text-center py-8 bg-neutral-800 rounded-lg border border-neutral-600">
                <CarIcon className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-400">Geen beschikbare auto's op dit moment</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availableCars.map((car) => {
                    const isSelected = selectedCarIds.includes(car.id);
                    const isOriginal = car.id === booking.car_id;
                    return (
                      <button
                        key={car.id}
                        onClick={() => toggleCar(car.id)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-green-500 bg-green-900'
                            : 'border-neutral-600 bg-neutral-800 hover:border-green-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {car.images && car.images.length > 0 && (
                              <img
                                src={car.images[0]}
                                alt={`${car.brand} ${car.model}`}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-white font-semibold">
                                  {car.brand} {car.model}
                                </h5>
                                {isOriginal && (
                                  <span className="px-2 py-0.5 bg-blue-700 text-blue-200 text-xs font-bold rounded">
                                    ORIGINEEL
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-400">
                                {car.year} • {car.license_plate}
                              </p>
                              <p className="text-sm font-semibold text-green-400 mt-1">
                                €{car.weekly_rate}/week
                              </p>
                            </div>
                          </div>
                          <div>
                            {isSelected ? (
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-neutral-600 rounded-full" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  {selectedCarIds.length} {selectedCarIds.length === 1 ? 'auto' : "auto's"} geselecteerd
                </p>
              </>
            )}
          </div>

          {/* Date Picker */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-2">
              📅 Beschikbaar vanaf welke maandag?
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400 pointer-events-none z-10" />
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                min={minDate}
                className="w-full pl-12 pr-4 py-3 border-2 border-green-500 bg-green-900 text-white rounded-lg focus:ring-2 focus:ring-green-400 cursor-pointer font-medium"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            {availableFrom && (
              <div className="mt-2 p-3 bg-green-900 border border-green-600 rounded-md">
                <p className="text-sm text-green-300 font-medium">
                  {isMonday(availableFrom) ? '✅' : '❌'}{' '}
                  {formatDate(availableFrom)}
                </p>
                {!isMonday(availableFrom) && (
                  <p className="text-xs text-red-400 mt-1">⚠️ Kies een maandag!</p>
                )}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 mb-6">
            <p className="text-sm text-neutral-300">
              <span className="font-semibold text-white">Let op:</span> De klant ontvangt een
              notificatie met alle geselecteerde auto's en kan een nieuwe boeking maken.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="flex-1 px-4 py-3 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCarIds.length === 0 || !availableFrom || !isMonday(availableFrom) || sending}
              className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Versturen...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Verstuur Aanbod ({selectedCarIds.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlternativeProposalModal;
