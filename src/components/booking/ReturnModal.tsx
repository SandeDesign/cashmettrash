import React, { useState } from 'react';
import { Car, Calendar, FileText, Loader2, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { Booking } from '../../types';
import PhotoUploadModal from './PhotoUploadModal';

interface ReturnModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (returnData: {
    scheduledDate: string;
    notes: string;
    photos: string[];
    hasDamage: boolean;
    damageNotes?: string;
  }) => Promise<void>;
}

const ReturnModal: React.FC<ReturnModalProps> = ({
  booking,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [step, setStep] = useState<'schedule' | 'damage' | 'photos'>('schedule');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [hasDamage, setHasDamage] = useState<boolean | null>(null);
  const [damageNotes, setDamageNotes] = useState('');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleScheduleNext = () => {
    if (!scheduledDate) {
      alert('Selecteer een aflever datum en tijd');
      return;
    }
    setStep('damage');
  };

  const handleDamageSelection = (damage: boolean) => {
    setHasDamage(damage);
    if (!damage) {
      setDamageNotes('');
    }
    setStep('photos');
    setPhotoModalOpen(true);
  };

  const handlePhotosComplete = (photoUrls: string[]) => {
    setPhotos(photoUrls);
    setPhotoModalOpen(false);
  };

  const handleConfirm = async () => {
    if (!scheduledDate) {
      alert('Selecteer een aflever datum en tijd');
      return;
    }

    if (hasDamage === null) {
      alert('Geef aan of er schade is');
      return;
    }

    if (hasDamage && !damageNotes.trim()) {
      alert('Beschrijf de schade');
      return;
    }

    if (photos.length !== 5) {
      alert('Upload eerst alle 5 foto\'s');
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm({
        scheduledDate,
        notes,
        photos,
        hasDamage,
        damageNotes: hasDamage ? damageNotes : undefined
      });
      onClose();
      resetState();
    } catch (error) {
      console.error('Error confirming return:', error);
      alert('Fout bij bevestigen afleveren');
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setStep('schedule');
    setScheduledDate('');
    setNotes('');
    setHasDamage(null);
    setDamageNotes('');
    setPhotos([]);
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
        <div className="vl-card max-w-2xl w-full p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Auto Afleveren</h2>
                <p className="text-sm text-neutral-500">#{booking.id.substring(0, 8)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-neutral-500">
                Stap {step === 'schedule' ? '1' : step === 'damage' ? '2' : '3'} van 3
              </div>
              <div className="text-sm text-neutral-400">
                {step === 'schedule' ? 'Planning' : step === 'damage' ? 'Schade' : 'Foto\'s'}
              </div>
            </div>
          </div>

          {/* Booking Info */}
          <div className="mb-6 p-4 bg-neutral-800 border border-neutral-600 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-neutral-500 text-xs">Klant</p>
                <p className="text-white font-medium">{booking.customer_snapshot?.name || booking.customer_name || 'Onbekende klant'}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Eind datum</p>
                <p className="text-white font-medium">
                  {booking.end_date ? new Date(booking.end_date).toLocaleDateString('nl-NL') : 'Lopend'}
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="mb-6 bg-yellow-900 border border-yellow-600 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-300 font-bold text-sm mb-1">
                  Belangrijk
                </p>
                <p className="text-yellow-200 text-sm">
                  Na het afleveren wordt automatisch een beëindigingsovereenkomst aangemaakt en het contract beëindigd.
                </p>
              </div>
            </div>
          </div>

          {/* Step 1: Schedule */}
          {step === 'schedule' && (
            <div className="space-y-4">
              <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-300 font-bold text-sm mb-1">
                      Plan Aflevermoment
                    </p>
                    <p className="text-blue-200 text-sm">
                      Selecteer wanneer de klant de auto komt afleveren. Het contract wordt beëindigd na het maken van foto's.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Aflever Datum & Tijd <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="vl-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Opmerkingen (optioneel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bijv. kilometerstand, brandstof niveau, schoonmaak status, etc."
                  className="vl-textarea"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleScheduleNext}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  Volgende: Schade Controle
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Damage Check */}
          {step === 'damage' && (
            <div className="space-y-4">
              <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-bold text-sm mb-2">
                      Schade Controle
                    </p>
                    <p className="text-yellow-200 text-sm">
                      Is er schade aan de auto geconstateerd?
                    </p>
                  </div>
                </div>
              </div>

              {hasDamage === true && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Beschrijving Schade <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={damageNotes}
                    onChange={(e) => setDamageNotes(e.target.value)}
                    placeholder="Beschrijf de schade in detail..."
                    className="vl-textarea"
                    rows={4}
                    required
                  />
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => handleDamageSelection(false)}
                  className="w-full p-4 text-left border-2 border-green-600 hover:border-green-500 bg-green-900 hover:bg-green-800 rounded-lg transition-all"
                >
                  <p className="text-white font-bold text-sm mb-1">
                    ✓ Geen schade
                  </p>
                  <p className="text-green-300 text-xs">
                    Auto is in goede staat, geen schade geconstateerd
                  </p>
                </button>

                <button
                  onClick={() => {
                    if (!hasDamage) {
                      setHasDamage(true);
                    } else if (damageNotes.trim()) {
                      handleDamageSelection(true);
                    } else {
                      alert('Beschrijf eerst de schade');
                    }
                  }}
                  className="w-full p-4 text-left border-2 border-red-600 hover:border-red-500 bg-red-900 hover:bg-red-800 rounded-lg transition-all"
                >
                  <p className="text-white font-bold text-sm mb-1">
                    ⚠️ Wel schade
                  </p>
                  <p className="text-red-300 text-xs">
                    Er is schade aan de auto (zal worden gedocumenteerd)
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Photos Summary */}
          {step === 'photos' && (
            <div className="space-y-4">
              <div className="bg-green-900 border border-green-600 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-300 font-bold text-sm mb-1">
                      Planning Vastgelegd
                    </p>
                    <p className="text-green-200 text-sm">
                      Aflevermoment: {new Date(scheduledDate).toLocaleString('nl-NL')}
                    </p>
                    <p className="text-green-200 text-sm mt-1">
                      Schade: {hasDamage ? 'Ja - ' + damageNotes : 'Geen schade'}
                    </p>
                  </div>
                </div>
              </div>

              {photos.length === 5 ? (
                <>
                  <div className="bg-green-900 border border-green-600 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <p className="text-green-300 font-bold text-sm">
                        Alle 5 foto's geüpload
                      </p>
                    </div>
                  </div>

                  {/* Photo Grid Preview */}
                  <div className="grid grid-cols-5 gap-2">
                    {photos.map((url, index) => (
                      <div key={index} className="aspect-square">
                        <img
                          src={url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover rounded border border-green-600"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setPhotos([]);
                        setPhotoModalOpen(true);
                      }}
                      className="flex-1 px-4 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                    >
                      Foto's Opnieuw
                    </button>
                    <button
                      onClick={handleConfirm}
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
                          <CheckCircle className="w-5 h-5" />
                          Afleveren Bevestigen
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400 mb-4">Nog geen foto's geüpload</p>
                  <button
                    onClick={() => setPhotoModalOpen(true)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors"
                  >
                    Foto's Uploaden
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onComplete={handlePhotosComplete}
        title="Aflever Foto's"
        description="Upload 5 foto's van de staat van de auto bij afleveren"
      />
    </>
  );
};

export default ReturnModal;
