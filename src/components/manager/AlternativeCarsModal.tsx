import React, { useState, useEffect } from 'react';
import { Calendar, X, Send, Car as CarIcon, Check } from 'lucide-react';
import { Car } from '../../types';
import { useCarStore } from '../../store/carStore';
import { useBookingStore } from '../../store/bookingStore';

interface AlternativeCarsModalProps {
  waitlistCustomerName: string;
  originalCarId: string;
  originalCarName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (carIds: string[], availableFrom: string) => void;
}

const AlternativeCarsModal: React.FC<AlternativeCarsModalProps> = ({
  waitlistCustomerName,
  originalCarId,
  originalCarName,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { cars } = useCarStore();
  const { bookings } = useBookingStore();
  const [selectedCarIds, setSelectedCarIds] = useState<string[]>([originalCarId]);
  const [availableFrom, setAvailableFrom] = useState('');

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
      // Default to original car + next Monday
      setSelectedCarIds([originalCarId]);
      const nextMon = getNextMonday();
      setAvailableFrom(nextMon.toISOString().split('T')[0]);
    }
  }, [isOpen, originalCarId]);

  // Filter available cars (status = available)
  const availableCars = cars.filter(c => c.status === 'available');

  const toggleCar = (carId: string) => {
    if (selectedCarIds.includes(carId)) {
      // Don't allow deselecting if it's the only one
      if (selectedCarIds.length === 1) return;
      setSelectedCarIds(selectedCarIds.filter(id => id !== carId));
    } else {
      setSelectedCarIds([...selectedCarIds, carId]);
    }
  };

  const handleConfirm = () => {
    if (selectedCarIds.length > 0 && availableFrom && isMonday(availableFrom)) {
      onConfirm(selectedCarIds, availableFrom);
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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="vl-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.1] flex items-center justify-between bg-purple-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-700 rounded-full flex items-center justify-center">
              <CarIcon className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bied Alternatieve Auto's Aan</h3>
              <p className="text-sm text-purple-300">{waitlistCustomerName}</p>
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
          {/* Customer Info */}
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 mb-6">
            <p className="text-sm text-neutral-300">
              <span className="font-semibold text-white">Klant:</span> {waitlistCustomerName}
              <br />
              <span className="font-semibold text-white">Originele keuze:</span> {originalCarName}
            </p>
          </div>

          {/* Car Selection */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-white mb-3">
              Selecteer beschikbare auto's om aan te bieden:
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {availableCars.map((car) => {
                const isSelected = selectedCarIds.includes(car.id);
                const isOriginal = car.id === originalCarId;
                return (
                  <button
                    key={car.id}
                    onClick={() => toggleCar(car.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-900'
                        : 'border-neutral-600 bg-neutral-800 hover:border-purple-700'
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
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
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
          </div>

          {/* Date Picker */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-2">
              📅 Beschikbaar vanaf welke maandag?
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 pointer-events-none z-10" />
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                min={minDate}
                className="w-full pl-12 pr-4 py-3 border-2 border-purple-500 bg-purple-900 text-white rounded-lg focus:ring-2 focus:ring-purple-400 cursor-pointer font-medium"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            {availableFrom && (
              <div className="mt-2 p-3 bg-purple-900 border border-purple-600 rounded-md">
                <p className="text-sm text-purple-300 font-medium">
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
              notificatie met alle geselecteerde auto's en kan kiezen welke ze wil huren.
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
              disabled={selectedCarIds.length === 0 || !availableFrom || !isMonday(availableFrom)}
              className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Verstuur Aanbod ({selectedCarIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlternativeCarsModal;
