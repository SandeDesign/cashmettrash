import React, { useEffect, useState } from 'react';
import { RentalCarInspectionForm as InspectionFormType, Car, User } from '../../types';
import { useRentalCarInspectionStore } from '../../store/rentalCarInspectionStore';
import { useAuthStore } from '../../store/authStore';
import { useCarStore } from '../../store/carStore';
import PhotoUploadTabs from './PhotoUploadTabs';
import { AlertCircle, Check, X, Clock } from 'lucide-react';

interface RentalCarInspectionFormProps {
  inspection: InspectionFormType;
  car?: Car;
  onSubmit?: () => void;
  onApprove?: (reviewedBy: string) => void;
  onReject?: (rejectionReason: string, reviewedBy: string) => void;
  isReadOnly?: boolean;
  isReviewMode?: boolean; // For admin/manager review
}

export default function RentalCarInspectionFormComponent({
  inspection,
  car,
  onSubmit,
  onApprove,
  onReject,
  isReadOnly = false,
  isReviewMode = false,
}: RentalCarInspectionFormProps) {
  const { user } = useAuthStore();
  const { updateInspectionForm } = useRentalCarInspectionStore();
  const [formData, setFormData] = useState(inspection);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isCustomer = user?.role === 'customer';

  const getStatusBadge = () => {
    const statusMap = {
      voeg_fotos_toe: { label: 'Voeg Foto\'s toe', color: 'bg-yellow-500/20 text-yellow-400' },
      in_behandeling: { label: 'In Behandeling', color: 'bg-blue-500/20 text-blue-400' },
      goedgekeurd: { label: 'Goedgekeurd', color: 'bg-green-500/20 text-green-400' },
      afgekeurd: { label: 'Afgekeurd', color: 'bg-red-500/20 text-red-400' },
    };
    const status = statusMap[inspection.status];
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
        {status.label}
      </span>
    );
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmitForm = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      await updateInspectionForm(inspection.id, {
        ...formData,
        customer_submitted_at: new Date().toISOString(),
        status: 'in_behandeling',
      });
      onSubmit?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      onApprove?.(user.uid);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!user || !rejectionReason.trim()) return;
    try {
      setIsSubmitting(true);
      onReject?.(rejectionReason, user.uid);
      setShowRejectionModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] rounded-lg shadow-md p-6 max-w-4xl">
      {/* Header with status */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            {inspection.type === 'ophalen' ? 'Ophaal Formulier' : 'Inlever Formulier'}
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            {inspection.type === 'ophalen'
              ? 'Formulier voor het ophalen van de auto'
              : 'Formulier voor het inleveren van de auto'}
          </p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Show rejection reason if rejected */}
      {inspection.status === 'afgekeurd' && inspection.rejection_reason && (
        <div className="mb-6 p-4 bg-red-500/20 border-l-4 border-red-400 rounded">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-400">Formulier Afgekeurd</h3>
              <p className="text-red-400 mt-1">{inspection.rejection_reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Car Details Section */}
      {car && (
        <div className="mb-6 p-4 bg-neutral-900 rounded-lg border border-white/[0.1]">
          <h3 className="font-semibold text-lg mb-3">Auto Gegevens</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-neutral-400 text-sm">Merk & Model</p>
              <p className="font-medium">{car.brand} {car.model}</p>
            </div>
            <div>
              <p className="text-neutral-400 text-sm">Kenteken</p>
              <p className="font-medium">{car.license_plate}</p>
            </div>
            <div>
              <p className="text-neutral-400 text-sm">Jaar</p>
              <p className="font-medium">{car.year}</p>
            </div>
            <div>
              <p className="text-neutral-400 text-sm">Weekprijs</p>
              <p className="font-medium">€{car.weekly_rate}/week</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Questions Section */}
      <div className="mb-6 p-4 bg-neutral-900 rounded-lg border border-white/[0.1]">
        <h3 className="font-semibold text-lg mb-4">Formuliervragen</h3>

        {/* Odometer Reading */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Kilometerstand
            {inspection.type === 'inleveren' && ' (begin en einde)'}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Vertrek (km)</label>
              <input
                type="number"
                value={formData.odometer_reading_start || ''}
                onChange={(e) => handleFieldChange('odometer_reading_start', parseFloat(e.target.value))}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-white/[0.1] rounded-md focus:outline-none focus:ring-blue-500"
              />
            </div>
            {inspection.type === 'inleveren' && (
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Aankomst (km)</label>
                <input
                  type="number"
                  value={formData.odometer_reading_end || ''}
                  onChange={(e) => handleFieldChange('odometer_reading_end', parseFloat(e.target.value))}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-white/[0.1] rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Fuel Level */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-300 mb-2">Brandstofniveau</label>
          <select
            value={formData.fuel_level || ''}
            onChange={(e) => handleFieldChange('fuel_level', e.target.value)}
            disabled={isReadOnly}
            className="w-full md:w-64 px-3 py-2 border border-white/[0.1] rounded-md focus:outline-none focus:ring-blue-500"
          >
            <option value="">Selecteer brandstofniveau</option>
            <option value="100%">100% Vol</option>
            <option value="75-100%">Tussen 75%-100%</option>
            <option value="50-75%">Tussen 50%-75%</option>
            <option value="25-50%">Tussen 25%-50%</option>
            <option value="0-25%">Tussen 0%-25%</option>
          </select>
        </div>

        {/* Extras Present */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-300 mb-2">Aanwezige Extra's</label>
          <p className="text-sm text-neutral-400 mb-3">
            Zijn de volgende items aanwezig?
          </p>
          <div className="space-y-2">
            {[
              { key: 'spare_wheel', label: 'Reserveband' },
              { key: 'jack', label: 'Krik' },
              { key: 'first_aid_kit', label: 'EHBO-doos' },
              { key: 'warning_triangle', label: 'Gevarendriehoek' },
              { key: 'safety_vests', label: 'Veiligheidshesjes' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.extras_present?.[key as keyof typeof formData.extras_present] || false}
                  onChange={(e) =>
                    handleFieldChange('extras_present', {
                      ...formData.extras_present,
                      [key]: e.target.checked,
                    })
                  }
                  disabled={isReadOnly}
                  className="mr-2 rounded"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Technical State */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-300 mb-2">Technische Staat</label>
          <p className="text-sm text-neutral-400 mb-3">
            Werken de volgende onderdelen naar behoren?
          </p>
          <div className="space-y-2">
            {[
              { key: 'lights_working', label: 'Lichten' },
              { key: 'wipers_working', label: 'Ruitenwissers' },
              { key: 'ac_working', label: 'Airconditioning' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.technical_state?.[key as keyof typeof formData.technical_state] || false}
                  onChange={(e) =>
                    handleFieldChange('technical_state', {
                      ...formData.technical_state,
                      [key]: e.target.checked,
                    })
                  }
                  disabled={isReadOnly}
                  className="mr-2 rounded"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Admin/Manager Only Fields */}
        {(isAdmin || isManager) && !isReadOnly && (
          <>
            <div className="mb-4 pt-4 border-t border-white/[0.1]">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Medewerker Naam
              </label>
              <input
                type="text"
                value={formData.admin_staff_member_name || ''}
                onChange={(e) => handleFieldChange('admin_staff_member_name', e.target.value)}
                placeholder="Naam van de medewerker"
                className="w-full md:w-96 px-3 py-2 border border-white/[0.1] rounded-md focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Tijdstip
              </label>
              <input
                type="datetime-local"
                value={formData.admin_delivery_time || ''}
                onChange={(e) => handleFieldChange('admin_delivery_time', e.target.value)}
                className="w-full md:w-96 px-3 py-2 border border-white/[0.1] rounded-md focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Locatie
              </label>
              <input
                type="text"
                value={formData.admin_delivery_location || ''}
                onChange={(e) => handleFieldChange('admin_delivery_location', e.target.value)}
                placeholder="Inlever/Ophaal locatie"
                className="w-full px-3 py-2 border border-white/[0.1] rounded-md focus:outline-none focus:ring-blue-500"
              />
            </div>
          </>
        )}
      </div>

      {/* Photo Upload Section */}
      <PhotoUploadTabs
        inspection={formData}
        onUpdateTabs={(tabs) => handleFieldChange('photo_tabs', tabs)}
        isReadOnly={isReadOnly}
      />

      {/* Remarks Section */}
      <div className="mb-6 p-4 bg-neutral-900 rounded-lg border border-white/[0.1]">
        <h3 className="font-semibold text-lg mb-4">Opmerkingen</h3>

        {/* Customer Remarks */}
        {isCustomer && !isReadOnly && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Uw Opmerkingen
            </label>
            <textarea
              value={formData.customer_remarks || ''}
              onChange={(e) => handleFieldChange('customer_remarks', e.target.value)}
              placeholder="Voeg eventuele opmerkingen toe..."
              rows={3}
              className="w-full px-3 py-2 border border-white/[0.1] rounded-md focus:outline-none focus:ring-blue-500"
            />
          </div>
        )}

        {/* Admin Remarks */}
        {(isAdmin || isManager) && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Medewerker Opmerkingen
            </label>
            <textarea
              value={formData.admin_remarks || ''}
              onChange={(e) => handleFieldChange('admin_remarks', e.target.value)}
              placeholder="Opmerkingen voor interne verwerking..."
              rows={3}
              disabled={isReadOnly && inspection.status === 'in_behandeling'}
              className="w-full px-3 py-2 border border-white/[0.1] rounded-md focus:outline-none focus:ring-blue-500 disabled:bg-gray-200"
            />
          </div>
        )}

        {/* Display remarks if in review mode */}
        {isReadOnly && (
          <>
            {formData.customer_remarks && (
              <div className="mb-4 p-3 bg-blue-500/20 rounded-md border-l-4 border-blue-400">
                <p className="text-sm font-medium text-blue-900">Klant Opmerkingen:</p>
                <p className="text-sm text-blue-400 mt-1">{formData.customer_remarks}</p>
              </div>
            )}
            {formData.admin_remarks && (
              <div className="p-3 bg-purple-50 rounded-md border-l-4 border-purple-400">
                <p className="text-sm font-medium text-purple-900">Medewerker Opmerkingen:</p>
                <p className="text-sm text-purple-800 mt-1">{formData.admin_remarks}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        {/* Customer Submit */}
        {isCustomer && inspection.status === 'voeg_fotos_toe' && !isReadOnly && (
          <button
            onClick={handleSubmitForm}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Bezig met verzenden...' : 'Formulier Verzenden'}
          </button>
        )}

        {/* Resubmit after rejection */}
        {isCustomer && inspection.status === 'afgekeurd' && !isReadOnly && (
          <button
            onClick={() => {
              setFormData({ ...formData, status: 'voeg_fotos_toe' });
              handleSubmitForm();
            }}
            disabled={isSubmitting}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Bezig met verzenden...' : 'Opnieuw Verzenden'}
          </button>
        )}

        {/* Admin/Manager Approve & Reject */}
        {(isAdmin || isManager) && isReviewMode && inspection.status === 'in_behandeling' && !isReadOnly && (
          <>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Goedkeuren
            </button>
            <button
              onClick={() => setShowRejectionModal(true)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Afkeuren
            </button>
          </>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Formulier Afkeuren</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Leg uit waarom het formulier wordt afgekeurd..."
              rows={4}
              className="w-full px-3 py-2 border border-white/[0.1] rounded-md focus:outline-none focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-3 py-2 border border-white/[0.1] rounded-md hover:bg-neutral-900"
              >
                Annuleren
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isSubmitting}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                Afkeuren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
