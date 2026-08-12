import React, { useState } from 'react';
import { Camera, X, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (photoUrls: string[]) => void;
  title: string;
  description: string;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  title,
  description
}) => {
  const [photos, setPhotos] = useState<Array<File | null>>([null, null, null, null, null]);
  const [photoUrls, setPhotoUrls] = useState<Array<string | null>>([null, null, null, null, null]);
  const [uploading, setUploading] = useState<boolean[]>([false, false, false, false, false]);
  const [uploadComplete, setUploadComplete] = useState<boolean[]>([false, false, false, false, false]);
  const [errors, setErrors] = useState<Array<string | null>>([null, null, null, null, null]);

  if (!isOpen) return null;

  const PROXY_URL = 'https://internedata.nl/proxyvlottr.php';

  const handlePhotoSelect = async (index: number, file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      const newErrors = [...errors];
      newErrors[index] = 'Selecteer een geldige afbeelding';
      setErrors(newErrors);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const newErrors = [...errors];
      newErrors[index] = 'Afbeelding moet kleiner zijn dan 10MB';
      setErrors(newErrors);
      return;
    }

    // Clear error
    const newErrors = [...errors];
    newErrors[index] = null;
    setErrors(newErrors);

    // Set photo
    const newPhotos = [...photos];
    newPhotos[index] = file;
    setPhotos(newPhotos);

    // Start upload
    const newUploading = [...uploading];
    newUploading[index] = true;
    setUploading(newUploading);

    try {
      // Upload to proxy
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload gefaald');
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error('Geen URL ontvangen');
      }

      // Set URL
      const newUrls = [...photoUrls];
      newUrls[index] = data.url;
      setPhotoUrls(newUrls);

      // Mark as complete
      const newComplete = [...uploadComplete];
      newComplete[index] = true;
      setUploadComplete(newComplete);
    } catch (error: any) {
      console.error('Upload error:', error);
      const newErrors = [...errors];
      newErrors[index] = error.message || 'Upload gefaald';
      setErrors(newErrors);
    } finally {
      const newUploading = [...uploading];
      newUploading[index] = false;
      setUploading(newUploading);
    }
  };

  const handleFileInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePhotoSelect(index, file);
    }
  };

  const handleComplete = () => {
    const allUrls = photoUrls.filter((url): url is string => url !== null);

    if (allUrls.length !== 5) {
      alert('Upload eerst alle 5 foto\'s');
      return;
    }

    onComplete(allUrls);
  };

  const allPhotosUploaded = uploadComplete.every(c => c);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="vl-card max-w-4xl w-full p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-neutral-400 text-sm mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-900 border border-blue-600 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-300 font-bold text-sm mb-1">
                5 Foto's Vereist
              </p>
              <p className="text-blue-200 text-sm">
                Upload 5 duidelijke foto's van de auto (voor, achter, links, rechts, interieur).
                Maximaal 10MB per foto.
              </p>
            </div>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="relative">
              <div className="aspect-video bg-neutral-800 border border-neutral-600 rounded-lg overflow-hidden relative group">
                {photoUrls[index] ? (
                  <>
                    <img
                      src={photoUrls[index]!}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {uploadComplete[index] && (
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {uploading[index] ? (
                      <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
                    ) : (
                      <Camera className="w-8 h-8 text-neutral-600" />
                    )}
                  </div>
                )}

                {!uploading[index] && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-white mx-auto mb-2" />
                      <p className="text-white text-sm font-medium">
                        {photoUrls[index] ? 'Vervangen' : 'Upload'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileInputChange(index, e)}
                      className="hidden"
                      disabled={uploading[index]}
                    />
                  </label>
                )}
              </div>

              {/* Label */}
              <p className="text-neutral-400 text-xs mt-2 text-center">
                Foto {index + 1}
                {index === 0 && ' (Voor)'}
                {index === 1 && ' (Achter)'}
                {index === 2 && ' (Links)'}
                {index === 3 && ' (Rechts)'}
                {index === 4 && ' (Interieur)'}
              </p>

              {/* Error */}
              {errors[index] && (
                <div className="mt-2 flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {errors[index]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleComplete}
            disabled={!allPhotosUploaded}
            className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Voltooien
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadModal;
