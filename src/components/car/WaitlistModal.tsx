import React, { useState } from 'react';
import { Bell, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Car } from '../../types';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useAuth } from '../../hooks/useAuth';

interface WaitlistModalProps {
  car: Car;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({
  car,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { addToWaitlist } = useWaitlistStore();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleJoinWaitlist = async () => {
    if (!user) {
      alert('Log in om op de wachtlijst te komen');
      return;
    }

    try {
      setSubmitting(true);

      await addToWaitlist(car.id, user.uid, {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      });

      setSuccess(true);

      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error joining waitlist:', error);
      alert(error.message || 'Fout bij toevoegen aan wachtlijst');
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
      <div className="vl-card max-w-md w-full p-6 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Wachtlijst</h2>
              <p className="text-sm text-neutral-500">
                {car.brand} {car.model}
              </p>
            </div>
          </div>
          {!success && (
            <button
              onClick={handleClose}
              className="text-neutral-500 hover:text-neutral-300"
              disabled={submitting}
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {success ? (
          /* Success State */
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Toegevoegd aan Wachtlijst!
            </h3>
            <p className="text-neutral-400">
              We sturen u een melding zodra deze auto beschikbaar is.
            </p>
          </div>
        ) : (
          <>
            {/* Car Info */}
            <div className="mb-6 p-4 bg-neutral-800 border border-neutral-600 rounded-lg">
              <div className="flex items-center gap-4">
                {car.images[0] && (
                  <img
                    src={car.images[0]}
                    alt={`${car.brand} ${car.model}`}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="text-white font-bold">
                    {car.brand} {car.model}
                  </h3>
                  <p className="text-neutral-400 text-sm">{car.year}</p>
                  <p className="text-green-400 font-bold mt-1">
                    €{car.weekly_rate}/week
                  </p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-900 border border-blue-600 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-300 font-bold text-sm mb-1">
                    Hoe werkt het?
                  </p>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• U wordt toegevoegd aan de wachtlijst</li>
                    <li>• U ontvangt een melding wanneer de auto beschikbaar is</li>
                    <li>• Boek snel, want de auto kan opnieuw verhuurd worden</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleJoinWaitlist}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  <>
                    <Bell className="w-5 h-5" />
                    Plaats Mij Op Wachtlijst
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WaitlistModal;
