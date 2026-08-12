import React, { useState, useRef, useEffect } from 'react';
import { RentalCarInspectionForm, PhotoUploadTab, PhotoUploadItem } from '../../types';
import { uploadInspectionPhoto } from '../../utils/upload';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ChevronDown, Upload, X, Plus } from 'lucide-react';

interface PhotoUploadTabsProps {
  inspection: RentalCarInspectionForm;
  onUpdateTabs: (tabs: PhotoUploadTab[]) => void;
  isReadOnly?: boolean;
}

export default function PhotoUploadTabs({
  inspection,
  onUpdateTabs,
  isReadOnly = false,
}: PhotoUploadTabsProps) {
  const { user } = useAuthStore();
  const { settings, loadSettings } = useSettingsStore();
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>({});
  const [uploadingTabId, setUploadingTabId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load settings on mount
  useEffect(() => {
    if (!settings) {
      loadSettings();
    }
  }, [settings, loadSettings]);

  const toggleTab = (tabId: string) => {
    setExpandedTabs((prev) => ({
      ...prev,
      [tabId]: !prev[tabId],
    }));
  };

  const handleFileSelect = async (
    tabId: string,
    positionIndex: number,
    files: FileList | null
  ) => {
    if (!files || files.length === 0 || !user || !settings?.upload_proxy_url) {
      if (!user) {
        alert('U moet ingelogd zijn om foto\'s te uploaden');
      } else if (!settings?.upload_proxy_url) {
        alert('Uploadinstellingen zijn niet geconfigureerd');
      }
      return;
    }

    try {
      setUploadingTabId(tabId);
      const file = files[0];

      // Upload the photo
      const result = await uploadInspectionPhoto(
        file,
        user.uid,
        inspection.type,
        settings.upload_proxy_url
      );

      if (result.success && result.url) {
        // Update the photo tab with the uploaded URL
        const updatedTabs = inspection.photo_tabs.map((tab) => {
          if (tab.id === tabId) {
            const updatedItems = [...tab.items];
            updatedItems[positionIndex] = {
              ...updatedItems[positionIndex],
              url: result.url,
              uploaded_at: new Date().toISOString(),
            };
            return { ...tab, items: updatedItems };
          }
          return tab;
        });

        onUpdateTabs(updatedTabs);
      } else {
        alert(`Upload fehler: ${result.error}`);
      }
    } finally {
      setUploadingTabId(null);
    }
  };

  const handleAddMoreSchade = () => {
    const updatedTabs = inspection.photo_tabs.map((tab) => {
      if (tab.id === 'schade') {
        return {
          ...tab,
          items: [
            ...tab.items,
            {
              position: `Schade ${tab.items.length}`,
              url: undefined,
              uploaded_at: undefined,
            },
          ],
        };
      }
      return tab;
    });

    onUpdateTabs(updatedTabs);
  };

  const handleRemoveSchadePhoto = (index: number) => {
    const updatedTabs = inspection.photo_tabs.map((tab) => {
      if (tab.id === 'schade') {
        return {
          ...tab,
          items: tab.items.filter((_, i) => i !== index),
        };
      }
      return tab;
    });

    onUpdateTabs(updatedTabs);
  };

  return (
    <div className="mb-6 p-4 bg-neutral-900 rounded-lg border border-white/[0.1]">
      <h3 className="font-semibold text-lg mb-4">Fotoupload</h3>
      <p className="text-sm text-neutral-400 mb-4">
        Klik op de uploadvakken om foto's toe te voegen. De tabs zijn standaard dicht voor overzicht.
      </p>

      <div className="space-y-3">
        {inspection.photo_tabs.map((tab) => (
          <div key={tab.id} className="border border-white/[0.1] rounded-lg bg-[#0a0a0a]">
            {/* Tab Header - Collapsible */}
            <button
              onClick={() => toggleTab(tab.id)}
              disabled={isReadOnly}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-900 transition disabled:opacity-75"
            >
              <div className="text-left">
                <p className="font-medium text-white">{tab.title}</p>
                <p className="text-sm text-neutral-400">{tab.description}</p>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-neutral-400 transition-transform ${
                  expandedTabs[tab.id] ? 'transform rotate-180' : ''
                }`}
              />
            </button>

            {/* Tab Content - Collapsible */}
            {expandedTabs[tab.id] && (
              <div className="px-4 py-4 border-t border-white/[0.1] bg-neutral-900">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tab.items.map((item, index) => (
                    <div
                      key={`${tab.id}-${index}`}
                      className="flex flex-col items-center"
                    >
                      <input
                        ref={(el) => {
                          if (el) fileInputRefs.current[`${tab.id}-${index}`] = el;
                        }}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(tab.id, index, e.target.files)}
                        disabled={isReadOnly || uploadingTabId === tab.id}
                        className="hidden"
                      />

                      <button
                        onClick={() => {
                          const ref = fileInputRefs.current[`${tab.id}-${index}`];
                          if (ref) ref.click();
                        }}
                        disabled={isReadOnly || uploadingTabId === tab.id}
                        className="relative w-24 h-24 md:w-32 md:h-32 border-2 border-dashed border-neutral-700 rounded-lg hover:border-gray-600 hover:bg-neutral-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-[#0a0a0a]"
                      >
                        {item.url ? (
                          <img
                            src={item.url}
                            alt={item.position}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : uploadingTabId === tab.id ? (
                          <div className="text-center">
                            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-1"></div>
                            <span className="text-xs text-neutral-400">Uploading...</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                            <span className="text-xs text-neutral-400">Foto</span>
                          </div>
                        )}
                      </button>

                      <div className="mt-2 text-center">
                        <p className="text-sm font-medium text-neutral-300">{item.position}</p>
                        {item.uploaded_at && (
                          <p className="text-xs text-green-600">✓ Geupload</p>
                        )}
                      </div>

                      {/* Remove button for damage photos */}
                      {tab.id === 'schade' && item.url && !isReadOnly && (
                        <button
                          onClick={() => handleRemoveSchadePhoto(index)}
                          className="mt-2 p-1 text-red-600 hover:bg-red-500/20 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add more button for damage photos */}
                {tab.id === 'schade' && !isReadOnly && (
                  <div className="mt-4 pt-4 border-t border-white/[0.1]">
                    <button
                      onClick={handleAddMoreSchade}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-500/20 rounded-md"
                    >
                      <Plus className="h-4 w-4" />
                      Nog een schade foto toevoegen
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Summary when collapsed */}
            {!expandedTabs[tab.id] && (
              <div className="px-4 py-2 bg-neutral-900 text-sm text-neutral-400 border-t border-white/[0.1]">
                <span className="font-medium">
                  {tab.items.filter((item) => item.url).length} / {tab.items.length}
                </span>
                {' '}foto's geupload
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload Progress Summary */}
      <div className="mt-4 p-3 bg-blue-500/20 rounded-md">
        <p className="text-sm text-blue-900 font-medium">
          Uploadstatus: {inspection.photo_tabs.reduce((acc, tab) => acc + tab.items.filter((i) => i.url).length, 0)} / {inspection.photo_tabs.reduce((acc, tab) => acc + tab.items.length, 0)} foto's geupload
        </p>
      </div>
    </div>
  );
}
