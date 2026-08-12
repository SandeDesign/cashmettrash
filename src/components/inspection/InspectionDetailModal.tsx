import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { RentalCarInspectionForm } from '../../types';

interface InspectionDetailModalProps {
  inspection: RentalCarInspectionForm;
  isOpen: boolean;
  onClose: () => void;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  inspection,
  isOpen,
  onClose,
}) => {
  const [activePhotoTab, setActivePhotoTab] = useState(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!isOpen) return null;

  const currentTab = inspection.photo_tabs[activePhotoTab];
  const currentPhotos = currentTab?.items?.filter(item => item.url) || [];
  const currentPhoto = currentPhotos[activePhotoIndex];

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      voeg_fotos_toe: 'bg-yellow-500/20 text-yellow-400',
      in_behandeling: 'bg-blue-500/20 text-blue-400',
      goedgekeurd: 'bg-green-500/20 text-green-400',
      afgekeurd: 'bg-red-500/20 text-red-400',
    };
    const labels: Record<string, string> = {
      voeg_fotos_toe: 'Foto\'s toevoegen',
      in_behandeling: 'In behandeling',
      goedgekeurd: 'Goedgekeurd',
      afgekeurd: 'Afgekeurd',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--vl-bg-primary)] border border-white/[0.1] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--vl-bg-primary)] border-b border-white/[0.1] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Inspectie Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Type</p>
              <p className="text-white font-medium">
                {inspection.type === 'ophalen' ? '🚗 Ophaal inspectie' : '🔑 Inlever inspectie'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Status</p>
              {getStatusBadge(inspection.status)}
            </div>
          </div>

          {/* Odometer & Fuel */}
          <div className="grid grid-cols-2 gap-4">
            {inspection.odometer_reading_start !== undefined && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Kilometerstand (Start)</p>
                <p className="text-white font-medium">{inspection.odometer_reading_start} km</p>
              </div>
            )}
            {inspection.odometer_reading_end !== undefined && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Kilometerstand (Eind)</p>
                <p className="text-white font-medium">{inspection.odometer_reading_end} km</p>
              </div>
            )}
            {inspection.fuel_level && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Tankstand</p>
                <p className="text-white font-medium">{inspection.fuel_level}</p>
              </div>
            )}
          </div>

          {/* Extras */}
          {inspection.extras_present && (
            <div>
              <p className="text-gray-400 text-sm mb-3">Accessoires aanwezig</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(inspection.extras_present).map(([key, present]) => (
                  <div
                    key={key}
                    className={`px-3 py-2 rounded ${
                      present
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    <span className="text-sm capitalize">
                      {key.replace(/_/g, ' ')}: {present ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical State */}
          {inspection.technical_state && (
            <div>
              <p className="text-gray-400 text-sm mb-3">Technische staat</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(inspection.technical_state).map(([key, working]) => (
                  <div
                    key={key}
                    className={`px-3 py-2 rounded ${
                      working
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    <span className="text-sm capitalize">
                      {key.replace(/_/g, ' ')}: {working ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remarks */}
          {inspection.customer_remarks && (
            <div>
              <p className="text-gray-400 text-sm mb-1">Opmerkingen klant</p>
              <p className="text-white bg-white/[0.05] p-3 rounded">{inspection.customer_remarks}</p>
            </div>
          )}

          {inspection.admin_remarks && (
            <div>
              <p className="text-gray-400 text-sm mb-1">Opmerkingen beheerder</p>
              <p className="text-white bg-white/[0.05] p-3 rounded">{inspection.admin_remarks}</p>
            </div>
          )}

          {inspection.staff_notes && (
            <div>
              <p className="text-gray-400 text-sm mb-1">Reden afkeuring</p>
              <p className="text-red-400 bg-red-500/10 p-3 rounded">{inspection.staff_notes}</p>
            </div>
          )}

          {/* Photos */}
          {inspection.photo_tabs.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-3">Foto's</p>

              {/* Photo Tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {inspection.photo_tabs.map((tab, index) => {
                  const photoCount = tab.items?.filter(item => item.url).length || 0;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setActivePhotoTab(index);
                        setActivePhotoIndex(0);
                      }}
                      className={`px-3 py-2 rounded whitespace-nowrap text-sm transition-colors ${
                        activePhotoTab === index
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.1]'
                      }`}
                    >
                      {tab.title} ({photoCount})
                    </button>
                  );
                })}
              </div>

              {/* Photo Viewer */}
              {currentPhoto?.url ? (
                <div className="bg-black/40 rounded-lg p-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    <img
                      src={currentPhoto.url}
                      alt="Inspectie foto - {currentPhoto.position}"
                      className="w-full h-full object-contain"
                    />
                    {currentPhoto.position && (
                      <div className="absolute top-2 left-2 bg-black/70 px-3 py-1 rounded text-sm text-white">
                        {currentPhoto.position}
                      </div>
                    )}
                  </div>

                  {/* Photo Navigation */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setActivePhotoIndex(Math.max(0, activePhotoIndex - 1))
                      }
                      disabled={activePhotoIndex === 0}
                      className="p-2 bg-white/[0.1] hover:bg-white/[0.2] disabled:opacity-50 rounded transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="text-gray-400 text-sm">
                      {activePhotoIndex + 1} / {currentPhotos.length}
                    </span>

                    <button
                      onClick={() =>
                        setActivePhotoIndex(
                          Math.min(currentPhotos.length - 1, activePhotoIndex + 1)
                        )
                      }
                      disabled={activePhotoIndex === currentPhotos.length - 1}
                      className="p-2 bg-white/[0.1] hover:bg-white/[0.2] disabled:opacity-50 rounded transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/[0.05] rounded p-8 text-center text-gray-400">
                  Geen foto's beschikbaar
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-white/[0.1] pt-4 grid grid-cols-2 gap-4 text-sm">
            {inspection.customer_submitted_at && (
              <div>
                <p className="text-gray-400 mb-1">Ingediend</p>
                <p className="text-white">
                  {new Date(inspection.customer_submitted_at).toLocaleDateString('nl-NL')}
                </p>
              </div>
            )}
            {inspection.reviewed_at && (
              <div>
                <p className="text-gray-400 mb-1">Beoordeeld</p>
                <p className="text-white">
                  {new Date(inspection.reviewed_at).toLocaleDateString('nl-NL')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
