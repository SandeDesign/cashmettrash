import React, { useState } from 'react';
import { RentalCarInspectionForm as InspectionFormType, Car } from '../../types';
import { useRentalCarInspectionStore } from '../../store/rentalCarInspectionStore';
import { useAuthStore } from '../../store/authStore';
import { AlertCircle, Check, X, ChevronLeft, ChevronRight, Camera, MessageSquare, ClipboardList, Save } from 'lucide-react';
import PhotoUploadStep from './PhotoUploadStep';

interface RentalCarInspectionWizardProps {
  inspection: InspectionFormType;
  car?: Car;
  onSubmit?: () => void;
  onApprove?: (reviewedBy: string) => void;
  onReject?: (rejectionReason: string, reviewedBy: string) => void;
  onCancel?: () => void;
  isReadOnly?: boolean;
  isReviewMode?: boolean;
}

const STEPS = [
  { id: 'form', label: 'Gegevens', icon: ClipboardList },
  { id: 'hoeken', label: 'Hoeken', icon: Camera },
  { id: 'wielen', label: 'Wielen', icon: Camera },
  { id: 'interieur', label: 'Interieur', icon: Camera },
  { id: 'schade', label: 'Schade', icon: Camera },
  { id: 'opmerkingen', label: 'Klaar', icon: MessageSquare },
];

const isPhotoStep = (step: number) => step >= 1 && step <= 4;

export default function RentalCarInspectionWizard({
  inspection,
  car,
  onSubmit,
  onApprove,
  onReject,
  onCancel,
  isReadOnly = false,
  isReviewMode = false,
}: RentalCarInspectionWizardProps) {
  const { user } = useAuthStore();
  const { updateInspectionForm } = useRentalCarInspectionStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(inspection);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canEdit =
    (inspection.status === 'voeg_fotos_toe' || inspection.status === 'afgekeurd') &&
    !isReadOnly;

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // Photo tab updates are saved directly to Firestore so uploaded photos are never lost
  const handlePhotoTabsUpdate = async (tabs: any) => {
    const updated = { ...formData, photo_tabs: tabs };
    setFormData(updated);
    if (updated.id && !isReadOnly) {
      try {
        await updateInspectionForm(updated.id, { photo_tabs: tabs, updated_at: new Date().toISOString() });
      } catch (error) {
        console.error('Foto-opslag fout:', error);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.id || !canEdit || isSaving) return;
    try {
      setIsSaving(true);
      await updateInspectionForm(formData.id, { ...formData, updated_at: new Date().toISOString() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error) {
      console.error('Opslaan fout:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForm = async () => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      await updateInspectionForm(formData.id, {
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

  const goToStep = (idx: number) => {
    if (!isSubmitting) setCurrentStep(Math.max(0, Math.min(STEPS.length - 1, idx)));
  };

  const canSubmit = canEdit;

  const statusBadge = {
    voeg_fotos_toe: { label: "Voeg foto's toe", cls: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' },
    in_behandeling: { label: 'In behandeling', cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/30' },
    goedgekeurd:    { label: 'Goedgekeurd',    cls: 'bg-green-500/10 text-green-400 border border-green-500/30' },
    afgekeurd:      { label: 'Afgekeurd',       cls: 'bg-red-500/10 text-red-400 border border-red-500/30' },
  }[inspection.status];

  return (
    <div className="flex flex-col gap-0">
      {/* ── Step indicator ─────────────────────────────── */}
      <div className="pb-4 mb-2">
        {/* Status + step label row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-neutral-400">
            Stap {currentStep + 1} van {STEPS.length} — <span className="text-white">{STEPS[currentStep].label}</span>
          </span>
          {statusBadge && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/[0.08] rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step dots — tap to jump */}
        <div className="flex justify-between mt-2.5 px-0.5">
          {STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => goToStep(idx)}
              disabled={isSubmitting}
              title={s.label}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                idx === currentStep
                  ? 'bg-green-400 scale-125'
                  : idx < currentStep
                  ? 'bg-green-700'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Rejection banner ───────────────────────────── */}
      {inspection.status === 'afgekeurd' && inspection.rejection_reason && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">Afgekeurd</p>
            <p className="text-sm text-red-400 mt-0.5">{inspection.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* ── Step content ───────────────────────────────── */}
      <div className="min-h-[56vh]">
        {/* Step 0: Form Questions */}
        {currentStep === 0 && (
          <div className="space-y-5">
            {car && (
              <div className="p-3 bg-white/[0.04] rounded-lg border border-white/[0.08] flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="text-neutral-400">{car.brand} {car.model}</span>
                <span className="text-neutral-500">{car.license_plate}</span>
                <span className="text-neutral-500">{car.year}</span>
              </div>
            )}
            <RenderFormQuestions
              formData={formData}
              onFieldChange={handleFieldChange}
              inspectionType={inspection.type}
              isReadOnly={isReadOnly}
              isAdmin={isAdmin}
              isManager={isManager}
            />
          </div>
        )}

        {/* Steps 1–4: Photo Upload — handles own navigation */}
        {isPhotoStep(currentStep) && (
          <PhotoUploadStep
            inspection={formData}
            onUpdateTabs={handlePhotoTabsUpdate}
            tabIndex={currentStep - 1}
            isReadOnly={isReadOnly}
            onNextCategory={currentStep < 4 ? () => goToStep(currentStep + 1) : undefined}
            onPrevCategory={currentStep > 1 ? () => goToStep(currentStep - 1) : undefined}
            onFirstStepPrev={() => goToStep(0)}
            onLastStepNext={() => goToStep(5)}
          />
        )}

        {/* Step 5: Remarks + Submit */}
        {currentStep === 5 && (
          <RenderRemarks
            formData={formData}
            onFieldChange={handleFieldChange}
            isReadOnly={isReadOnly}
            isAdmin={isAdmin}
            isManager={isManager}
            isReviewMode={isReviewMode}
          />
        )}
      </div>

      {/* ── Footer navigation (only on non-photo steps) ── */}
      {!isPhotoStep(currentStep) && (
        <div className="border-t border-white/[0.1] pt-4 mt-4 flex gap-2 justify-between">
          {/* Left: Prev */}
          <button
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 0 || isSubmitting || isSaving}
            className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.15] text-neutral-200 rounded-lg hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Vorige
          </button>

          {/* Right: Save + Close + Next/Submit */}
          <div className="flex gap-2">
            {/* Opslaan — only when form is editable */}
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={isSaving || isSubmitting}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  saveSuccess
                    ? 'bg-green-600/20 border border-green-500/40 text-green-400'
                    : 'border border-white/[0.15] text-neutral-300 hover:bg-white/[0.06]'
                }`}
              >
                {saveSuccess ? (
                  <><Check className="h-4 w-4" /> Opgeslagen</>
                ) : isSaving ? (
                  <><Save className="h-4 w-4 animate-pulse" /> Opslaan...</>
                ) : (
                  <><Save className="h-4 w-4" /> Opslaan</>
                )}
              </button>
            )}

            <button
              onClick={onCancel}
              className="px-3 py-2.5 border border-white/[0.1] text-neutral-400 rounded-lg hover:bg-white/[0.05] text-sm"
            >
              Sluiten
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => goToStep(currentStep + 1)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.08] text-white rounded-lg hover:bg-white/[0.12] disabled:opacity-30 text-sm font-medium"
              >
                Volgende
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : canSubmit ? (
              <button
                onClick={handleSubmitForm}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${
                  inspection.status === 'afgekeurd'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <Check className="h-4 w-4" />
                {isSubmitting ? 'Bezig...' : inspection.status === 'afgekeurd' ? 'Opnieuw verzenden' : 'Formulier verzenden'}
              </button>
            ) : (isAdmin || isManager) && isReviewMode && inspection.status === 'in_behandeling' ? (
              <>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Goedkeuren
                </button>
                <button
                  onClick={() => setShowRejectionModal(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Afkeuren
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Rejection Modal ───────────────────────────── */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-[var(--vl-bg-primary)] border border-white/[0.1] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Formulier afkeuren</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Leg uit waarom het formulier afgekeurd wordt..."
              rows={4}
              className="vl-textarea w-full mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectionModal(false); setRejectionReason(''); }}
                className="flex-1 px-3 py-2 border border-white/[0.15] text-neutral-300 rounded-md hover:bg-white/[0.08]"
              >
                Annuleren
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isSubmitting}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
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

// ── Form Questions ─────────────────────────────────────────────────────────
function RenderFormQuestions({ formData, onFieldChange, inspectionType, isReadOnly, isAdmin, isManager }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-200 mb-2">
          Kilometerstand{inspectionType === 'inleveren' ? ' (begin & einde)' : ''}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Vertrek (km)</label>
            <input
              type="number"
              value={formData.odometer_reading_start ?? ''}
              onChange={(e) => onFieldChange('odometer_reading_start', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={isReadOnly}
              className="vl-input w-full"
            />
          </div>
          {inspectionType === 'inleveren' && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Aankomst (km)</label>
              <input
                type="number"
                value={formData.odometer_reading_end ?? ''}
                onChange={(e) => onFieldChange('odometer_reading_end', e.target.value ? parseFloat(e.target.value) : null)}
                disabled={isReadOnly}
                className="vl-input w-full"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-200 mb-2">Brandstofniveau</label>
        <select
          value={formData.fuel_level ?? ''}
          onChange={(e) => onFieldChange('fuel_level', e.target.value || null)}
          disabled={isReadOnly}
          className="vl-select w-full"
        >
          <option value="">Selecteer brandstofniveau</option>
          <option value="100%">100% — Vol</option>
          <option value="75-100%">75–100%</option>
          <option value="50-75%">50–75%</option>
          <option value="25-50%">25–50%</option>
          <option value="0-25%">0–25%</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-200 mb-3">Extra's aanwezig?</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { key: 'spare_wheel', label: 'Reserveband' },
            { key: 'jack', label: 'Krik' },
            { key: 'first_aid_kit', label: 'EHBO-doos' },
            { key: 'warning_triangle', label: 'Gevarendriehoek' },
            { key: 'safety_vests', label: 'Veiligheidshesjes' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.extras_present?.[key] ?? false}
                onChange={(e) => onFieldChange('extras_present', { ...formData.extras_present, [key]: e.target.checked })}
                disabled={isReadOnly}
                className="w-4 h-4 rounded accent-green-500"
              />
              <span className="text-sm text-neutral-200">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-200 mb-3">Technische staat</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { key: 'lights_working', label: 'Lichten' },
            { key: 'wipers_working', label: 'Ruitenwissers' },
            { key: 'ac_working', label: 'Airconditioning' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.technical_state?.[key] ?? false}
                onChange={(e) => onFieldChange('technical_state', { ...formData.technical_state, [key]: e.target.checked })}
                disabled={isReadOnly}
                className="w-4 h-4 rounded accent-green-500"
              />
              <span className="text-sm text-neutral-200">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {(isAdmin || isManager) && (
        <div className="pt-2 border-t border-white/[0.1]">
          <label className="block text-sm font-medium text-neutral-200 mb-2">Tijdstip overdracht</label>
          <input
            type="datetime-local"
            value={formData.admin_delivery_time ?? ''}
            onChange={(e) => onFieldChange('admin_delivery_time', e.target.value || null)}
            disabled={isReadOnly}
            className="vl-input w-full"
          />
        </div>
      )}
    </div>
  );
}

// ── Remarks ────────────────────────────────────────────────────────────────
function RenderRemarks({ formData, onFieldChange, isReadOnly, isAdmin, isManager, isReviewMode }: any) {
  return (
    <div className="space-y-5">
      {(!isAdmin && !isManager) && (
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">Uw opmerkingen</label>
          <textarea
            value={formData.customer_remarks ?? ''}
            onChange={(e) => onFieldChange('customer_remarks', e.target.value || null)}
            placeholder="Optionele opmerkingen..."
            rows={4}
            disabled={isReadOnly}
            className="vl-textarea w-full"
          />
        </div>
      )}

      {(isAdmin || isManager) && (
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">Interne opmerkingen</label>
          <textarea
            value={formData.admin_remarks ?? ''}
            onChange={(e) => onFieldChange('admin_remarks', e.target.value || null)}
            placeholder="Opmerkingen voor intern gebruik..."
            rows={4}
            disabled={isReadOnly && !isReviewMode}
            className="vl-textarea w-full"
          />
        </div>
      )}

      {isReadOnly && formData.customer_remarks && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs font-medium text-blue-400 mb-1">Klant opmerkingen</p>
          <p className="text-sm text-neutral-300">{formData.customer_remarks}</p>
        </div>
      )}
      {isReadOnly && formData.admin_remarks && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <p className="text-xs font-medium text-purple-400 mb-1">Interne opmerkingen</p>
          <p className="text-sm text-neutral-300">{formData.admin_remarks}</p>
        </div>
      )}
    </div>
  );
}
