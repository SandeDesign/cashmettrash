import React, { useState } from 'react';
import { AlertTriangle, XCircle, Loader2, Ban } from 'lucide-react';
import { Booking } from '../../types';

interface SuspendBookingModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, hasPenalty: boolean, penaltyAmount?: number) => Promise<void>;
}

const SuspendBookingModal: React.FC<SuspendBookingModalProps> = ({
  booking,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [step, setStep] = useState<'check' | 'confirm'>('check');
  const [hasPenalty, setHasPenalty] = useState<boolean | null>(null);
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePenaltySelection = (penalty: boolean) => {
    setHasPenalty(penalty);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert('Geef een reden op voor opschorting');
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(
        reason,
        hasPenalty || false,
        hasPenalty && penaltyAmount ? parseFloat(penaltyAmount) : undefined
      );
      onClose();
    } catch (error) {
      console.error('Error suspending booking:', error);
      alert('Fout bij opschorten boeking');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep('check');
    setHasPenalty(null);
    setPenaltyAmount('');
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
      <div className="vl-card max-w-lg w-full p-6 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-900 rounded-full flex items-center justify-center">
              <Ban className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Boeking Opschorten</h2>
              <p className="text-sm text-neutral-500">#{booking.id.substring(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="text-neutral-500 hover:text-neutral-300"
            disabled={submitting}
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Booking Info */}
        <div className="mb-6 p-4 bg-neutral-800 border border-neutral-600 rounded-lg">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-neutral-500 text-xs">Klant</p>
              <p className="text-white font-medium">{booking.customer_snapshot?.name || booking.customer_name || 'Onbekende klant'}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-xs">Totaal bedrag</p>
              <p className="text-white font-medium">€{booking.total_price.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Step 1: Penalty Check */}
        {step === 'check' && (
          <div className="space-y-4">
            <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-300 font-bold text-sm mb-2">
                    Boete Bedingen Controle
                  </p>
                  <p className="text-yellow-200 text-sm">
                    Zijn er boete bedingen van toepassing op deze boeking?
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handlePenaltySelection(false)}
                className="w-full p-4 text-left border-2 border-green-600 hover:border-green-500 bg-green-900 hover:bg-green-800 rounded-lg transition-all"
              >
                <p className="text-white font-bold text-sm mb-1">
                  ✓ Geen boete bedingen
                </p>
                <p className="text-green-300 text-xs">
                  Boeking wordt direct opgeschort zonder escalatie
                </p>
              </button>

              <button
                onClick={() => handlePenaltySelection(true)}
                className="w-full p-4 text-left border-2 border-red-600 hover:border-red-500 bg-red-900 hover:bg-red-800 rounded-lg transition-all"
              >
                <p className="text-white font-bold text-sm mb-1">
                  ⚠️ Wel boete bedingen
                </p>
                <p className="text-red-300 text-xs">
                  Escalatie proces wordt gestart (later in te vullen)
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-4">
            {hasPenalty && (
              <div className="bg-red-900 border border-red-600 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-red-300 font-bold text-sm mb-2">
                      ESCALATIE VEREIST
                    </p>
                    <p className="text-red-200 text-sm mb-3">
                      Deze boeking heeft boete bedingen. Het escalatie proces zal automatisch worden gestart.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Boete bedrag (optioneel)
                      </label>
                      <input
                        type="number"
                        value={penaltyAmount}
                        onChange={(e) => setPenaltyAmount(e.target.value)}
                        placeholder="€ 0.00"
                        className="vl-input w-full"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Reden voor opschorting <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Beschrijf waarom deze boeking wordt opgeschort..."
                className="vl-textarea"
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('check')}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50"
              >
                Terug
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting || !reason.trim()}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                  hasPenalty
                    ? 'bg-red-500 hover:bg-red-400 text-white'
                    : 'bg-orange-500 hover:bg-orange-400 text-white'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  <>
                    <Ban className="w-5 h-5" />
                    {hasPenalty ? 'Opschorten + Escalatie' : 'Opschorten'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuspendBookingModal;
