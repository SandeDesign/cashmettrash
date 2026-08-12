import React from 'react';
import { CheckCircle, Download, X, Calendar } from 'lucide-react';

interface ContractSignedModalProps {
  onClose: () => void;
  onDownloadPDF: () => void;
  contractId: string;
  isExtension?: boolean;
}

const ContractSignedModal: React.FC<ContractSignedModalProps> = ({
  onClose,
  onDownloadPDF,
  contractId,
  isExtension = false
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="vl-card rounded-lg shadow-xl border border-green-500/30 max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {isExtension ? 'Verlenging Bevestigd!' : 'Contract Getekend!'}
        </h2>

        {/* Contract ID */}
        <p className="text-sm text-neutral-400 text-center mb-6">
          {isExtension ? 'Verlengingscontract' : 'Contract'} #{contractId}
        </p>

        {/* Info message */}
        <div className="vl-card bg-neutral-800 rounded-lg p-4 mb-6 border border-white/[0.05]">
          <div className="flex items-start gap-3 mb-3">
            <Calendar className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              {isExtension ? (
                <>
                  <p className="text-sm text-neutral-300 font-medium mb-1">
                    Boeking Verlengd met 6 Maanden
                  </p>
                  <p className="text-xs text-neutral-400">
                    Uw verhuur is succesvol verlengd met 6 maanden (26 weken) waarvan 1 maand GRATIS!
                    De wekelijkse automatische incasso blijft doorlopen.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-neutral-300 font-medium mb-1">
                    Ophaling binnen 24 uur
                  </p>
                  <p className="text-xs text-neutral-400">
                    U wordt bevestigd voor het ophaalmoment via een WhatsApp berichtje of belletje vanuit ons.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={onDownloadPDF}
          className="w-full px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-400 transition-colors flex items-center justify-center gap-2 font-medium mb-3"
        >
          <Download className="w-5 h-5" />
          Download Contract als PDF
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full px-6 py-3 vl-card border border-white/[0.1] text-neutral-300 rounded-md hover:bg-white/[0.05] transition-colors"
        >
          Sluiten
        </button>
      </div>
    </div>
  );
};

export default ContractSignedModal;
