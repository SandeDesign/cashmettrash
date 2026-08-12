import React from 'react';
import { X, Check, Calendar, Euro } from 'lucide-react';

interface ExtensionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  weeklyRate: number;
  currentEndDate: string;
  newEndDate: Date;
}

const ExtensionConfirmModal: React.FC<ExtensionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  weeklyRate,
  currentEndDate,
  newEndDate
}) => {
  if (!isOpen) return null;

  const extensionCost = weeklyRate * 22; // 5 months (22 weeks) worth of payment
  const discountAmount = weeklyRate * 4; // 1 month (4 weeks) discount

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
      <div className="vl-card rounded-lg shadow-xl border border-neutral-700 max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-white/[0.1] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Boeking Verlengen</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.08] rounded-full transition-colors text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-400 font-semibold mb-2">6 Maanden Vooruitboeken</p>
                <p className="text-sm text-neutral-300">
                  Boek nu vooruit voor 6 maanden en ontvang 1 maand gratis! Je huidige contract eindigt naadloos op zondag, en je nieuwe periode start direct op maandag.
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <Calendar className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-neutral-400">Nieuwe periode</p>
                <p className="text-white font-medium">6 maanden (26 weken)</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex-1">
                <p className="text-blue-400 font-semibold mb-2">Naadloze overgang</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Huidig contract eindigt:</span>
                    <span className="text-white font-medium">
                      {new Date(currentEndDate).toLocaleDateString('nl-NL', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} (zondag)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Nieuwe periode start:</span>
                    <span className="text-green-400 font-medium">
                      {(() => {
                        const monday = new Date(currentEndDate);
                        monday.setDate(monday.getDate() + 1);
                        return monday.toLocaleDateString('nl-NL', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        });
                      })()} (maandag)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Nieuwe periode eindigt:</span>
                    <span className="text-white font-medium">
                      {newEndDate.toLocaleDateString('nl-NL', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} (zondag)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing - Focus on weekly rate */}
            <div className="border-t border-white/[0.1] pt-4">
              {/* Big Weekly Rate Display */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 mb-3 text-center">
                <p className="text-black text-4xl font-black mb-1">
                  €{weeklyRate}
                </p>
                <p className="text-black/70 text-sm font-semibold uppercase tracking-wide">
                  per week • automatische incasso
                </p>
              </div>

              {/* Deal Breakdown */}
              <div className="space-y-2 text-sm bg-neutral-900/50 rounded-lg p-4 border border-white/[0.05]">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Commitment periode:</span>
                  <span className="text-white font-medium">6 maanden (26 weken)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">U betaalt:</span>
                  <span className="text-white font-medium">22 weken × €{weeklyRate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">U ontvangt:</span>
                  <span className="text-white font-medium">26 weken verhuur</span>
                </div>
                <div className="border-t border-white/[0.05] pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-green-400 font-semibold">Uw voordeel:</span>
                    <span className="text-green-400 font-bold">4 weken GRATIS! 🎉</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              <strong>Let op:</strong> U moet een nieuw contract ondertekenen om deze 6-maands periode te activeren.
              Uw huidige contract blijft actief tot de overgangsdatum.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.1] px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-white/[0.1] text-neutral-300 rounded-md hover:bg-white/[0.05] transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-400 transition-colors font-medium"
          >
            Bevestigen & Doorgaan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtensionConfirmModal;
