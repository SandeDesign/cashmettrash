import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, ArrowLeft, X, Camera, Calendar } from 'lucide-react';
import { validateImageFile } from '../../utils/upload';
import { DriverLicense } from '../../types';

interface DriverLicenseUploadProps {
  onLicenseUploaded: (license: DriverLicense) => void;
  onBack?: () => void;
}

const DriverLicenseUpload: React.FC<DriverLicenseUploadProps> = ({
  onLicenseUploaded,
  onBack
}) => {
  const [step, setStep] = useState<'upload' | 'form'>('upload');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [frontImageUrl, setFrontImageUrl] = useState<string>('');
  const [backImage, setBackImage] = useState<File | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string>('');
  const [uploadedFrontUrl, setUploadedFrontUrl] = useState<string>('');
  const [uploadedBackUrl, setUploadedBackUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    number: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    issue_date: '',
    expiry_date: ''
  });
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCameraGuide, setShowCameraGuide] = useState(false);
  const [captureType, setCaptureType] = useState<'front' | 'back'>('front');
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const PROXY_URL = 'https://internedata.nl/proxyvlottr.php';

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async (type: 'front' | 'back') => {
    setCaptureType(type);
    setShowCameraGuide(true);
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1920, height: 1080 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Kan camera niet openen. Gebruik de upload functie.');
      setShowCameraGuide(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraGuide(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `rijbewijs_${captureType}_${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (captureType === 'front') {
        setFrontImage(file);
        setFrontImageUrl(URL.createObjectURL(file));
      } else {
        setBackImage(file);
        setBackImageUrl(URL.createObjectURL(file));
      }
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleFrontFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { setError(validation.error || 'Ongeldig bestand'); return; }
    setFrontImage(file);
    setFrontImageUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleBackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { setError(validation.error || 'Ongeldig bestand'); return; }
    setBackImage(file);
    setBackImageUrl(URL.createObjectURL(file));
    setError('');
  };

  const uploadImage = async (file: File, filename: string): Promise<string> => {
    const folder = 'vlottr/rijbewijzen';
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    const data = new FormData();
    data.append('file', file);
    data.append('folder', folder);
    data.append('filename', cleanFilename);

    const response = await fetch(PROXY_URL, { method: 'POST', body: data });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Upload mislukt');
    }
    const result = await response.json();
    if (!result.success || !result.url) throw new Error(result.error || 'Geen URL ontvangen');

    let finalUrl = result.url;
    if (!finalUrl.startsWith('http')) {
      finalUrl = `https://internedata.nl${finalUrl.startsWith('/') ? finalUrl : '/' + finalUrl}`;
    }
    return finalUrl;
  };

  const handleUploadImages = async () => {
    if (!frontImage || !backImage) {
      setError('Upload beide kanten van het rijbewijs');
      return;
    }
    setIsUploading(true);
    setError('');
    try {
      const timestamp = Date.now();
      const frontUrl = await uploadImage(frontImage, `rijbewijs_voorkant_${timestamp}.jpg`);
      const backUrl = await uploadImage(backImage, `rijbewijs_achterkant_${timestamp}.jpg`);
      setUploadedFrontUrl(frontUrl);
      setUploadedBackUrl(backUrl);
      setStep('form');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Fout bij uploaden rijbewijs');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = () => {
    if (!formData.number || !formData.first_name || !formData.last_name) {
      setError('Vul alle verplichte velden in');
      return;
    }
    const license: DriverLicense = {
      number: formData.number,
      first_name: formData.first_name,
      last_name: formData.last_name,
      date_of_birth: formData.date_of_birth,
      issue_date: formData.issue_date,
      expiry_date: formData.expiry_date,
      front_image_url: uploadedFrontUrl,
      back_image_url: uploadedBackUrl,
      verified: false
    };
    onLicenseUploaded(license);
  };

  // Camera overlay
  if (showCameraGuide) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="relative flex-1">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative" style={{ width: '90%', maxWidth: '500px' }}>
              <div className="relative bg-transparent" style={{ paddingBottom: '63%' }}>
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-black/60" />
                  <div className="absolute inset-4 border-2 border-green-500 rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-8 left-0 right-0 text-center">
            <div className="inline-block bg-black/80 px-6 py-3 rounded-lg">
              <p className="text-white font-medium text-lg">
                Plaats {captureType === 'front' ? 'voorkant' : 'achterkant'} rijbewijs binnen het kader
              </p>
              <p className="text-neutral-300 text-sm mt-1">Zorg dat alle tekst goed leesbaar is</p>
            </div>
          </div>
        </div>
        <div className="bg-neutral-900 p-4">
          <div className="flex justify-between items-center mb-2">
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

  if (step === 'upload') {
    return (
      <div className="space-y-6">
        {onBack && (
          <button onClick={onBack} className="flex items-center text-neutral-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Terug
          </button>
        )}

        <div className="p-4 rounded-xl border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-neutral-400">
              <p className="font-medium text-neutral-200 mb-1">Foto's van je rijbewijs</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Maak een foto of upload de <strong className="text-white">voorkant</strong> en <strong className="text-white">achterkant</strong></li>
                <li>Zorg dat alle tekst goed leesbaar is</li>
                <li>Na het uploaden vul je zelf de gegevens in ter verificatie</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Voorkant */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Voorkant rijbewijs *</label>
          {frontImageUrl ? (
            <div className="relative">
              <img src={frontImageUrl} alt="Voorkant rijbewijs" className="w-full h-48 object-contain rounded-xl border border-white/[0.08] bg-neutral-900" />
              <button
                onClick={() => { setFrontImage(null); setFrontImageUrl(''); }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input ref={frontInputRef} type="file" accept="image/*" onChange={handleFrontFileSelect} className="hidden" />
              <button
                onClick={() => startCamera('front')}
                className="w-full flex items-center justify-center px-4 py-4 border-2 border-dashed border-white/[0.10] rounded-xl hover:border-green-500/50 hover:bg-green-500/5 transition-colors"
              >
                <Camera className="w-5 h-5 mr-2 text-neutral-500" />
                <span className="text-neutral-300">Maak foto van voorkant</span>
              </button>
              <button
                onClick={() => frontInputRef.current?.click()}
                className="w-full flex items-center justify-center px-4 py-3 border border-white/[0.08] rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <Upload className="w-4 h-4 mr-2 text-neutral-500" />
                <span className="text-neutral-400 text-sm">Of upload bestand</span>
              </button>
            </div>
          )}
        </div>

        {/* Achterkant */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Achterkant rijbewijs *</label>
          {backImageUrl ? (
            <div className="relative">
              <img src={backImageUrl} alt="Achterkant rijbewijs" className="w-full h-48 object-contain rounded-xl border border-white/[0.08] bg-neutral-900" />
              <button
                onClick={() => { setBackImage(null); setBackImageUrl(''); }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input ref={backInputRef} type="file" accept="image/*" onChange={handleBackFileSelect} className="hidden" />
              <button
                onClick={() => startCamera('back')}
                className="w-full flex items-center justify-center px-4 py-4 border-2 border-dashed border-white/[0.10] rounded-xl hover:border-green-500/50 hover:bg-green-500/5 transition-colors"
              >
                <Camera className="w-5 h-5 mr-2 text-neutral-500" />
                <span className="text-neutral-300">Maak foto van achterkant</span>
              </button>
              <button
                onClick={() => backInputRef.current?.click()}
                className="w-full flex items-center justify-center px-4 py-3 border border-white/[0.08] rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <Upload className="w-4 h-4 mr-2 text-neutral-500" />
                <span className="text-neutral-400 text-sm">Of upload bestand</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleUploadImages}
          disabled={!frontImage || !backImage || isUploading}
          className="vl-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Bezig met uploaden...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Uploaden en doorgaan
            </>
          )}
        </button>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <h3 className="text-lg font-bold text-white">Vul je rijbewijsgegevens in</h3>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-sm text-neutral-400">
            Voer de gegevens in zoals ze op je rijbewijs staan. Deze worden door ons gecontroleerd aan de hand van de foto's.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white mb-2">Rijbewijsnummer *</label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => handleFormChange('number', e.target.value)}
              className="vl-input"
              placeholder="1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Voornaam *</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleFormChange('first_name', e.target.value)}
              className="vl-input"
              placeholder="Jan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Achternaam *</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleFormChange('last_name', e.target.value)}
              className="vl-input"
              placeholder="Jansen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Geboortedatum</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleFormChange('date_of_birth', e.target.value)}
                className="vl-input !pl-12 w-full cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Afgiftedatum</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => handleFormChange('issue_date', e.target.value)}
                className="vl-input !pl-12 w-full cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white mb-2">Vervaldatum</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleFormChange('expiry_date', e.target.value)}
                className="vl-input !pl-12 w-full cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSubmit} className="flex-1 vl-btn-primary">
            Gegevens bevestigen
          </button>
          <button
            onClick={() => setStep('upload')}
            className="px-4 py-2 border border-white/[0.12] rounded-lg hover:bg-white/[0.04] transition-colors text-white"
          >
            Terug
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default DriverLicenseUpload;
