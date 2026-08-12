import React, { useRef, useState, useMemo } from 'react';
import { X, RotateCcw, FileText, Loader2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { Booking, Car } from '../../types';
import { useBookingStore } from '../../store/bookingStore';
import { useEmailTemplatesStore } from '../../store/emailTemplatesStore';
import { useAuth } from '../../hooks/useAuth';

interface LockPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  car: Car | undefined;
  extensionType: '6_months' | '12_months';
  customerEmail: string;
  customerName: string;
}

/** Calculate next applicable Monday (Mon–Thu = next Mon; Fri–Sun = Mon after next) */
function calcLockPeriodDates(extensionType: '6_months' | '12_months'): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const daysToNextMonday = (1 - dayOfWeek + 7) % 7 || 7;
  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    start.setDate(start.getDate() + daysToNextMonday);
  } else {
    start.setDate(start.getDate() + daysToNextMonday + 7);
  }
  const end = new Date(start);
  end.setMonth(end.getMonth() + (extensionType === '6_months' ? 6 : 12));
  return { start, end };
}

const LockPeriodModal: React.FC<LockPeriodModalProps> = ({
  isOpen,
  onClose,
  booking,
  car,
  extensionType,
  customerEmail,
  customerName,
}) => {
  const { user } = useAuth();
  const { signAndSetLockPeriod } = useBookingStore();
  const { getTemplate } = useEmailTemplatesStore();

  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isSigEmpty, setIsSigEmpty] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const months = extensionType === '6_months' ? 6 : 12;
  const carName = car ? `${car.brand} ${car.model}` : 'uw auto';
  const weeklyRate = car?.weekly_rate ?? (booking as any).weekly_rate ?? 0;

  const { start, end } = useMemo(() => calcLockPeriodDates(extensionType), [extensionType]);
  const startStr = start.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const endStr = end.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleClearSig = () => {
    sigCanvas.current?.clear();
    setIsSigEmpty(true);
  };

  const handleSign = async () => {
    if (!user || isSigEmpty || !sigCanvas.current) return;
    setError(null);
    setIsSigning(true);
    try {
      const dataUrl = sigCanvas.current.toDataURL('image/png');
      const templateId = extensionType === '6_months' ? 'vastzetperiode_6_maanden' : 'vastzetperiode_12_maanden';
      const template = getTemplate(templateId);
      await signAndSetLockPeriod(
        booking.id,
        extensionType,
        dataUrl,
        user.uid,
        customerEmail,
        customerName,
        carName,
        weeklyRate,
        template?.subject ?? `Vlottr — Uw contract vastzetperiode ${months} maanden`,
        template?.body_html ?? ''
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het ondertekenen.');
    } finally {
      setIsSigning(false);
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-[var(--vl-bg-primary)] border border-white/[0.1] rounded-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Contract ondertekend!</h2>
          <p className="text-neutral-400 text-sm mb-1">
            Uw vastzetperiode van <strong className="text-white">{months} maanden</strong> is geactiveerd.
          </p>
          <p className="text-neutral-400 text-sm mb-6">
            Ingaand <strong className="text-white">{startStr}</strong> t/m <strong className="text-white">{endStr}</strong>.
          </p>
          <p className="text-neutral-500 text-xs mb-6">U ontvangt een bevestigingsmail op {customerEmail}.</p>
          <button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[var(--vl-bg-primary)] border border-white/[0.1] rounded-xl max-w-2xl w-full my-4">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--vl-bg-primary)] border-b border-white/[0.1] px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Vastzetperiode {months} maanden</h2>
              <p className="text-xs text-neutral-400">Nieuw contract — ter ondertekening</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSigning}
            className="p-2 hover:bg-white/[0.08] rounded-full transition-colors text-neutral-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contract details */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide mb-3">Contractdetails</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Huurder</p>
                <p className="text-sm font-medium text-white">{customerName}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Auto</p>
                <p className="text-sm font-medium text-white">{carName}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Vastzetperiode ingaand</p>
                <p className="text-sm font-medium text-white">{startStr}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Einddatum vastzetperiode</p>
                <p className="text-sm font-medium text-white">{endStr}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Duur</p>
                <p className="text-sm font-medium text-white">{months} maanden</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Wekelijks tarief</p>
                <p className="text-sm font-medium text-white">€{weeklyRate} per week</p>
              </div>
            </div>
          </div>

          {/* Contract text */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-5 text-sm text-neutral-300 leading-relaxed space-y-3 max-h-48 overflow-y-auto">
            <p className="font-semibold text-white">Vastzetperiode overeenkomst</p>
            <p>
              Ondergetekende, hierna te noemen <strong className="text-white">"Huurder"</strong>, en Vlottr
              Autoverhuur Zuid-Limburg, hierna te noemen <strong className="text-white">"Verhuurder"</strong>,
              komen overeen dat de huurovereenkomst voor het voertuig{' '}
              <strong className="text-white">{carName}</strong> wordt vastgezet voor een periode van{' '}
              <strong className="text-white">{months} maanden</strong>, ingaand op{' '}
              <strong className="text-white">{startStr}</strong> en eindigend op{' '}
              <strong className="text-white">{endStr}</strong>.
            </p>
            <p>
              Gedurende de vastzetperiode is opzegging door de Huurder niet mogelijk. De betalingsverplichtingen
              lopen ongewijzigd door conform de geldende huurovereenkomst (€{weeklyRate} per week). Na afloop van
              de vastzetperiode wordt de huurovereenkomst maandelijks opzegbaar met een opzegtermijn van 4 weken.
            </p>
            <p>
              Door ondertekening van dit addendum bevestigt de Huurder kennis te hebben genomen van de
              voorwaarden en hiermee akkoord te gaan. Dit addendum vervangt eventuele eerdere afspraken
              betreffende de vastzetperiode.
            </p>
          </div>

          {/* Signature area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-white">Handtekening huurder</p>
              {!isSigEmpty && (
                <button
                  onClick={handleClearSig}
                  disabled={isSigning}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  Wissen
                </button>
              )}
            </div>
            <div
              className="border-2 border-dashed border-green-500/40 rounded-lg overflow-hidden"
              style={{ backgroundColor: '#000000' }}
            >
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{ className: 'w-full h-40 cursor-crosshair' }}
                onBegin={() => setIsSigEmpty(false)}
                backgroundColor="#000000"
                penColor="#22c55e"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              Teken uw handtekening hierboven in het zwarte vak
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={isSigning}
              className="flex-1 py-3 border border-white/[0.12] text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Annuleer
            </button>
            <button
              onClick={handleSign}
              disabled={isSigEmpty || isSigning}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-900 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSigning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verwerken...
                </>
              ) : (
                'Ondertekenen & Bevestigen'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LockPeriodModal;
