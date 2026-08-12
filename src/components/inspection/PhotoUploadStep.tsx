import React, { useState, useRef, useEffect } from 'react';
import { RentalCarInspectionForm, PhotoUploadTab } from '../../types';
import { uploadInspectionPhoto } from '../../utils/upload';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Camera, X, ChevronLeft, ChevronRight, Plus, Loader2, Check } from 'lucide-react';

interface PhotoUploadStepProps {
  inspection: RentalCarInspectionForm;
  onUpdateTabs: (tabs: PhotoUploadTab[]) => void;
  tabIndex: number; // 0 = hoeken, 1 = wielen, 2 = interieur, 3 = schade
  isReadOnly?: boolean;
  // Cross-category navigation — called when user navigates past first/last photo
  onPrevCategory?: () => void;
  onNextCategory?: () => void;
  onFirstStepPrev?: () => void; // "Vorige" on first photo of first category → go to form step
  onLastStepNext?: () => void;  // "Volgende" on last photo of last category → go to remarks
}

const TAB_LABELS: Record<string, string> = {
  hoeken: 'Hoek',
  wielen: 'Wiel',
  interieur: 'Interieur foto',
  schade: 'Schade foto',
};

export default function PhotoUploadStep({
  inspection,
  onUpdateTabs,
  tabIndex,
  isReadOnly = false,
  onPrevCategory,
  onNextCategory,
  onFirstStepPrev,
  onLastStepNext,
}: PhotoUploadStepProps) {
  const { user } = useAuthStore();
  const { settings, loadSettings } = useSettingsStore();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!settings) loadSettings();
  }, [settings, loadSettings]);

  // Reset to first photo when tab changes
  useEffect(() => {
    setPhotoIndex(0);
  }, [tabIndex]);

  const tab = inspection.photo_tabs[tabIndex];
  if (!tab) return <div>Tab niet gevonden</div>;

  const currentItem = tab.items[photoIndex];
  const uploadedCount = tab.items.filter((item) => item.url).length;
  const totalCount = tab.items.length;
  const tabLabel = TAB_LABELS[tab.id] ?? 'Foto';

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user || !settings?.upload_proxy_url) {
      if (!user) alert('U moet ingelogd zijn om foto\'s te uploaden');
      else if (!settings?.upload_proxy_url) alert('Uploadinstellingen zijn niet geconfigureerd');
      return;
    }

    try {
      setIsUploading(true);
      const file = files[0];

      const result = await uploadInspectionPhoto(
        file,
        user.uid,
        inspection.type,
        settings.upload_proxy_url
      );

      if (result.success && result.url) {
        const updatedTabs = inspection.photo_tabs.map((t) => {
          if (t.id === tab.id) {
            const updatedItems = [...t.items];
            updatedItems[photoIndex] = {
              ...updatedItems[photoIndex],
              url: result.url,
              uploaded_at: new Date().toISOString(),
            };
            return { ...t, items: updatedItems };
          }
          return t;
        });
        onUpdateTabs(updatedTabs);

        // Auto-advance to next photo if not the last
        if (photoIndex < totalCount - 1) {
          setTimeout(() => setPhotoIndex(photoIndex + 1), 600);
        }
      } else {
        alert(`Upload fout: ${result.error}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    const updatedTabs = inspection.photo_tabs.map((t) => {
      if (t.id === tab.id) {
        if (tab.id === 'schade' && t.items.length > 1) {
          return { ...t, items: t.items.filter((_, i) => i !== photoIndex) };
        }
        const updatedItems = [...t.items];
        updatedItems[photoIndex] = {
          ...updatedItems[photoIndex],
          url: undefined,
          uploaded_at: undefined,
        };
        return { ...t, items: updatedItems };
      }
      return t;
    });
    // If we removed a schade item and photoIndex is now out of bounds, go back
    const newCount = tab.id === 'schade' && tab.items.length > 1 ? tab.items.length - 1 : tab.items.length;
    if (photoIndex >= newCount) setPhotoIndex(Math.max(0, newCount - 1));
    onUpdateTabs(updatedTabs);
  };

  const handleAddSchade = () => {
    const newIndex = tab.items.length;
    const updatedTabs = inspection.photo_tabs.map((t) => {
      if (t.id === 'schade') {
        return {
          ...t,
          items: [
            ...t.items,
            { position: `Schade ${t.items.length + 1}`, url: undefined, uploaded_at: undefined },
          ],
        };
      }
      return t;
    });
    onUpdateTabs(updatedTabs);
    setTimeout(() => setPhotoIndex(newIndex), 50);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-lg">{tab.title}</h3>
          <p className="text-sm text-neutral-400">
            {uploadedCount} van {totalCount} geüpload
          </p>
        </div>
        {/* Dot navigation */}
        <div className="flex gap-1.5 flex-wrap justify-end max-w-xs">
          {tab.items.map((item, i) => (
            <button
              key={i}
              onClick={() => setPhotoIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === photoIndex
                  ? 'bg-green-400 scale-125'
                  : item.url
                  ? 'bg-green-600'
                  : 'bg-white/20'
              }`}
              title={item.position}
            />
          ))}
        </div>
      </div>

      {/* Current photo label */}
      <p className="text-center text-sm font-medium text-neutral-300">
        {tabLabel} {photoIndex + 1} van {totalCount} —{' '}
        <span className="text-white">{currentItem?.position}</span>
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={isReadOnly || isUploading}
        className="hidden"
      />

      {/* Main upload area */}
      <div
        onClick={() => {
          if (!isReadOnly && !isUploading && fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
          }
        }}
        className={`relative w-full rounded-xl border-2 border-dashed transition-all overflow-hidden ${
          currentItem?.url
            ? 'border-green-500/40 cursor-pointer'
            : isReadOnly || isUploading
            ? 'border-white/10 cursor-not-allowed opacity-50'
            : 'border-white/20 hover:border-green-500/50 hover:bg-green-500/5 cursor-pointer'
        }`}
        style={{ height: 'clamp(200px, 50vw, 340px)' }}
      >
        {isUploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <Loader2 className="h-10 w-10 animate-spin text-green-400 mb-2" />
            <span className="text-sm text-neutral-400">Uploaden...</span>
          </div>
        ) : currentItem?.url ? (
          <>
            <img
              src={currentItem.url}
              alt={currentItem.position}
              className="w-full h-full object-cover"
            />
            {/* Uploaded badge */}
            <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1.5 shadow-lg">
              <Check className="h-4 w-4 text-white" />
            </div>
            {/* Re-upload overlay */}
            {!isReadOnly && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all flex items-center justify-center group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                  <Camera className="h-8 w-8 text-white mx-auto mb-1" />
                  <span className="text-white text-sm font-medium">Nieuwe foto</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Camera className="h-8 w-8 text-neutral-400" />
            </div>
            <div className="text-center px-4">
              <p className="text-white font-medium">Tik om foto te maken</p>
              <p className="text-neutral-500 text-sm mt-0.5">{currentItem?.position}</p>
            </div>
          </div>
        )}
      </div>

      {/* Remove button */}
      {!isReadOnly && currentItem?.url && (
        <button
          onClick={handleRemovePhoto}
          className="flex items-center justify-center gap-2 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
          Foto verwijderen
        </button>
      )}

      {/* Schade toevoegen button — only visible on schade tab when not read-only */}
      {tab.id === 'schade' && !isReadOnly && (
        <button
          onClick={handleAddSchade}
          className="flex items-center justify-center gap-2 py-2.5 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Schade toevoegen
        </button>
      )}

      {/* Prev / Next navigation — single navigation for the whole form */}
      <div className="flex gap-3">
        {/* Vorige: within category, or cross-category */}
        {photoIndex === 0 ? (
          (onPrevCategory || onFirstStepPrev) ? (
            <button
              onClick={() => { onPrevCategory ? onPrevCategory() : onFirstStepPrev?.(); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/10 rounded-lg text-neutral-300 hover:bg-white/5 transition-colors text-sm font-medium"
            >
              <ChevronLeft className="h-4 w-4" />
              Vorige categorie
            </button>
          ) : (
            <button disabled className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/10 rounded-lg text-neutral-300 opacity-30 cursor-not-allowed text-sm font-medium">
              <ChevronLeft className="h-4 w-4" />
              Vorige
            </button>
          )
        ) : (
          <button
            onClick={() => setPhotoIndex(photoIndex - 1)}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/10 rounded-lg text-neutral-300 hover:bg-white/5 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Vorige foto
          </button>
        )}

        {/* Volgende: within category, or cross-category */}
        {photoIndex < totalCount - 1 ? (
          <button
            onClick={() => setPhotoIndex(photoIndex + 1)}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/10 rounded-lg text-neutral-300 hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Volgende foto
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          // Last photo of category
          <button
            onClick={() => { onNextCategory ? onNextCategory() : onLastStepNext?.(); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            {onNextCategory ? 'Volgende categorie' : 'Naar opmerkingen'}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {totalCount > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tab.items.map((item, i) => (
            <button
              key={i}
              onClick={() => setPhotoIndex(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg border-2 overflow-hidden transition-all ${
                i === photoIndex
                  ? 'border-green-400'
                  : item.url
                  ? 'border-green-700/50'
                  : 'border-white/10'
              }`}
            >
              {item.url ? (
                <img src={item.url} alt={item.position} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <span className="text-xs text-neutral-500">{i + 1}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
