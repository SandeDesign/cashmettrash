import React, { useState } from 'react';
import { Car, Calendar, FileText, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { Booking } from '../../types';
import PhotoUploadModal from './PhotoUploadModal';

interface PickupModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pickupData: {
    scheduledDate: string;
    notes: string;
    photos: string[];
  }) => Promise<void>;
}

const PickupModal: React.FC<PickupModalProps> = ({
  booking,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [step, setStep] = useState<'schedule' | 'photos'>('schedule');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleScheduleNext = () => {
    if (!scheduledDate) {
      alert('Selecteer een ophaal datum en tijd');
      return;
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
      alert('Selecteer een ophaal datum en tijd');
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
        photos
      });
      onClose();
      resetState();
    } catch (error) {
      console.error('Error confirming pickup:', error);
      alert('Fout bij bevestigen ophalen');
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setStep('schedule');
    setScheduledDate('');
    setNotes('');
    setPhotos([]);
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
        <div className="vl-card max-w-2xl w-full p-6 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-900 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Auto Ophalen</h2>
                <p className="text-sm text-neutral-500">#{booking.id.substring(0, 8)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-neutral-500">Stap {step === 'schedule' ? '1' : '2'} van 2</div>
              <div className="text-sm text-neutral-400">{step === 'schedule' ? 'Planning' : 'Foto\'s'}</div>
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
                <p className="text-neutral-500 text-xs">Start datum</p>
                <p className="text-white font-medium">
                  {new Date(booking.start_date).toLocaleDateString('nl-NL')}
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
                      Plan Ophaalmoment
                    </p>
                    <p className="text-blue-200 text-sm">
                      Selecteer wanneer de klant de auto komt ophalen. Na het maken van foto's wordt de huurperiode gestart.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Ophaal Datum & Tijd <span className="text-red-500">*</span>
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
                  placeholder="Bijv. extra schoonmaak gedaan, brandstof niveau, etc."
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
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
                >
                  Volgende: Foto's
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Photos Summary */}
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
                      Ophaalmoment: {new Date(scheduledDate).toLocaleString('nl-NL')}
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
                      className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Bezig...
                        </>
                      ) : (
                        <>
                          <Car className="w-5 h-5" />
                          Ophalen Bevestigen
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
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-400 transition-colors"
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
        title="Ophaal Foto's"
        description="Upload 5 foto's van de staat van de auto bij ophalen"
      />
    </>
  );
};

export default PickupModal;
