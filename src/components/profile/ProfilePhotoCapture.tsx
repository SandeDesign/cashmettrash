import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, ArrowLeft, X, RefreshCw } from 'lucide-react';
import { uploadProfilePhoto, validateImageFile } from '../../utils/upload';

interface ProfilePhotoCaptureProps {
  userId: string;
  proxyUrl: string;
  onPhotoCaptured: (photoUrl: string) => void;
  onBack: () => void;
}

const ProfilePhotoCapture: React.FC<ProfilePhotoCaptureProps> = ({
  userId,
  proxyUrl,
  onPhotoCaptured,
  onBack
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>('');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setShowCamera(true);
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 960 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Kan camera niet openen. Gebruik de upload functie.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror the image for selfie (front camera is mirrored in video)
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `profiel_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setCapturedFile(file);
      setCapturedPhotoUrl(URL.createObjectURL(file));
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Ongeldig bestand');
      return;
    }
    setCapturedFile(file);
    setCapturedPhotoUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleRetake = () => {
    setCapturedFile(null);
    setCapturedPhotoUrl('');
    setError('');
  };

  const handleUpload = async () => {
    if (!capturedFile) return;
    setIsUploading(true);
    setError('');

    try {
      const result = await uploadProfilePhoto(capturedFile, userId, proxyUrl);
      if (result.success && result.url) {
        onPhotoCaptured(result.url);
      } else {
        setError(result.error || 'Upload mislukt. Probeer het opnieuw.');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Fout bij uploaden profielfoto');
    } finally {
      setIsUploading(false);
    }
  };

  // Camera overlay
  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="relative flex-1">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {/* Circular guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-green-500/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
          </div>
          <div className="absolute top-8 left-0 right-0 text-center">
            <div className="inline-block bg-black/80 px-6 py-3 rounded-lg">
              <p className="text-white font-medium text-lg">Maak een selfie</p>
              <p className="text-neutral-300 text-sm mt-1">Zorg dat je gezicht goed zichtbaar is</p>
            </div>
          </div>
        </div>
        <div className="bg-neutral-900 p-4">
          <div className="flex justify-between items-center">
            <button onClick={stopCamera} className="px-4 py-2 text-white hover:text-neutral-300 transition-colors">
              Annuleren
            </button>
            <div className="flex flex-col items-center">
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-green-500 hover:bg-neutral-200 transition-colors flex items-center justify-center mb-2"
              >
                <Camera className="w-8 h-8 text-green-500" />
              </button>
              <p className="text-white text-sm font-medium">Maak foto</p>
            </div>
            <div className="w-20" />
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // Preview after capture
  if (capturedPhotoUrl) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Profielfoto</h2>
          <p className="text-neutral-500">Controleer je foto en bevestig</p>
        </div>

        <div className="flex justify-center">
          <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-green-500/30">
            <img src={capturedPhotoUrl} alt="Profielfoto preview" className="w-full h-full object-cover" />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleRetake}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 border border-white/10 text-neutral-300 rounded-md hover:border-white/20 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Opnieuw
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-1 vl-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Bezig met uploaden...
              </>
            ) : (
              'Foto gebruiken'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Initial state - choose camera or upload
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Profielfoto maken</h2>
        <p className="text-neutral-500 mb-6">
          Maak een foto van jezelf. Deze foto wordt gebruikt als je profielfoto en is zichtbaar voor beheerders.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <div className="w-48 h-48 rounded-full bg-white/[0.03] border-2 border-dashed border-white/[0.10] flex items-center justify-center">
          <Camera className="w-16 h-16 text-neutral-600" />
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={startCamera}
          className="w-full flex items-center justify-center px-4 py-4 border-2 border-dashed border-white/[0.10] rounded-xl hover:border-green-500/50 hover:bg-green-500/5 transition-colors"
        >
          <Camera className="w-5 h-5 mr-2 text-neutral-500" />
          <span className="text-neutral-300">Maak een selfie</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center px-4 py-3 border border-white/[0.08] rounded-xl hover:bg-white/[0.03] transition-colors"
        >
          <Upload className="w-4 h-4 mr-2 text-neutral-500" />
          <span className="text-neutral-400 text-sm">Of upload een bestaande foto</span>
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 text-neutral-300 rounded-md hover:border-white/20 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug
        </button>
      </div>
    </div>
  );
};

export default ProfilePhotoCapture;
