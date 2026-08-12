import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { RentalCarInspectionForm as InspectionFormType, Booking, Car } from '../../types';
import { useRentalCarInspectionStore } from '../../store/rentalCarInspectionStore';
import { useCarStore } from '../../store/carStore';
import { useAuthStore } from '../../store/authStore';
import { useBookingStore } from '../../store/bookingStore';
import RentalCarInspectionWizard from './RentalCarInspectionWizard';
import { createNewInspectionForm } from '../../utils/inspectionFormTemplates';

// Module-level guard: persists across React Strict Mode remounts.
// Key = `${bookingId}-${type}`, prevents concurrent duplicate Firestore creates.
const _creatingForms = new Set<string>();

interface InspectionFormModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  inspectionType: 'ophalen' | 'inleveren';
  isReviewMode?: boolean;
}

export default function InspectionFormModal({
  booking,
  isOpen,
  onClose,
  inspectionType,
  isReviewMode = false,
}: InspectionFormModalProps) {
  const { user } = useAuthStore();
  const { cars } = useCarStore();
  const { updateBooking } = useBookingStore();
  const {
    getInspectionFormByBooking,
    createInspectionForm,
    submitInspectionForm,
    approveInspectionForm,
    rejectInspectionForm,
  } = useRentalCarInspectionStore();

  const [inspectionForm, setInspectionForm] = useState<InspectionFormType | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const car = cars.find((c) => c.id === booking.car_id);

  useEffect(() => {
    if (!isOpen || !user) {
      setIsInitialLoading(false);
      return;
    }

    const guardKey = `${booking.id}-${inspectionType}`;

    const loadInspectionForm = async () => {
      try {
        setIsInitialLoading(true);
        setError(null);

        const existingForm = await getInspectionFormByBooking(booking.id, inspectionType);

        if (existingForm) {
          setInspectionForm(existingForm);
        } else {
          // Module-level guard survives React Strict Mode component remounts
          if (_creatingForms.has(guardKey)) {
            // Another concurrent call is already creating this form — wait briefly and retry
            await new Promise((r) => setTimeout(r, 800));
            const retried = await getInspectionFormByBooking(booking.id, inspectionType);
            if (retried) {
              setInspectionForm(retried);
            }
            return;
          }
          _creatingForms.add(guardKey);
          try {
            const newFormData = createNewInspectionForm(
              booking.id,
              booking.customer_id,
              booking.car_id,
              inspectionType
            );
            const newForm = await createInspectionForm(newFormData);
            setInspectionForm(newForm);
          } finally {
            _creatingForms.delete(guardKey);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Er is een fout opgetreden bij het laden van het formulier');
        console.error('Error loading inspection form:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInspectionForm();
  }, [isOpen, booking.id, inspectionType, user, getInspectionFormByBooking, createInspectionForm]);

  const handleSubmit = async () => {
    if (!inspectionForm || !user) return;
    try {
      setIsSubmitting(true);
      await submitInspectionForm(inspectionForm.id);
      // Admin/manager auto-approve their own inspection — no separate review step needed
      if (user.role === 'admin' || user.role === 'manager') {
        await approveInspectionForm(inspectionForm.id, user.uid);
        setInspectionForm((prev) => prev ? { ...prev, status: 'goedgekeurd' } : null);
        // Pickup inspection = handover confirmed → set booking to active
        if (inspectionType === 'ophalen') {
          await updateBooking(booking.id, {
            pickup_inspection_form_id: inspectionForm.id,
            status: 'active',
            pickup_completed_date: new Date().toISOString(),
          } as any);
        } else {
          await updateBooking(booking.id, {
            return_inspection_form_id: inspectionForm.id,
          } as any);
        }
      } else {
        setInspectionForm((prev) => prev ? { ...prev, status: 'in_behandeling' } : null);
      }
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het verzenden van het formulier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (reviewedBy: string) => {
    if (!inspectionForm) return;
    try {
      setIsSubmitting(true);
      await approveInspectionForm(inspectionForm.id, reviewedBy);
      setInspectionForm((prev) => prev ? { ...prev, status: 'goedgekeurd' } : null);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het goedkeuren van het formulier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (rejectionReason: string, reviewedBy: string) => {
    if (!inspectionForm) return;
    try {
      setIsSubmitting(true);
      await rejectInspectionForm(inspectionForm.id, rejectionReason, reviewedBy);
      setInspectionForm((prev) =>
        prev ? { ...prev, status: 'afgekeurd', rejection_reason: rejectionReason } : null
      );
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het afkeuren van het formulier');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[var(--vl-bg-primary)] border border-white/[0.1] rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--vl-bg-primary)] border-b border-white/[0.1] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {inspectionType === 'ophalen' ? 'Ophaal Formulier' : 'Inlever Formulier'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-white/[0.08] rounded-full transition-colors disabled:opacity-50 text-neutral-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isInitialLoading && !inspectionForm ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-400 mr-3" />
              <span className="text-neutral-400">Formulier laden...</span>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 mb-4">
              <h3 className="font-semibold text-white">Fout</h3>
              <p className="text-red-400">{error}</p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Sluiten
              </button>
            </div>
          ) : inspectionForm ? (
            <RentalCarInspectionWizard
              inspection={inspectionForm}
              car={car}
              onSubmit={handleSubmit}
              onApprove={handleApprove}
              onReject={handleReject}
              onCancel={onClose}
              isReadOnly={isSubmitting}
              isReviewMode={isReviewMode}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-400">Formulier kon niet worden geladen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
