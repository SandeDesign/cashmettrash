import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Sparkles, Shield, FileText, Wrench, MessageSquare, Euro } from 'lucide-react';

const HIGHLIGHTS_OPTIONS = [
  'Airconditioning',
  'Navigatie',
  'Cruise control',
  'Bluetooth / handsfree',
  'Parkeersensoren',
  'Achteruitrijcamera',
  'Stoelverwarming',
  'DAB+ Radio',
  'Apple CarPlay / Android Auto',
  'Elektrische ramen',
  'Trekhaak',
  'Panoramadak',
];
import { Car } from '../../types';
import { useCarStore } from '../../store/carStore';
import { useAuth } from '../../hooks/useAuth';

interface CarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  car?: Car | null;
}

const PROXY_URL = 'https://internedata.nl/proxyvlottr.php';

const CarFormModal: React.FC<CarFormModalProps> = ({ isOpen, onClose, car }) => {
  const { user } = useAuth();
  const { addCar, updateCar } = useCarStore();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    weekly_rate: 15,
    status: 'available' as 'available' | 'rented' | 'maintenance',
    images: [] as string[],
    description: '',
    specs: {
      fuel_type: '',
      transmission: '',
      seats: 5,
      doors: 4,
      color: '',
      condition: '',
      mileage: '' as string | number,
      highlights: [] as string[],
    },
    published: false,
    groene_kaart_url: '',
    rdw_verklaring_url: '',
  });

  useEffect(() => {
    if (car) {
      setFormData({
        brand: car.brand,
        model: car.model,
        year: car.year,
        license_plate: car.license_plate,
        weekly_rate: car.weekly_rate,
        status: car.status,
        images: car.images || [],
        description: car.description || '',
        specs: {
          fuel_type: '',
          transmission: '',
          seats: 5,
          doors: 4,
          color: '',
          condition: '',
          mileage: '' as string | number,
          highlights: [] as string[],
          ...(car.specs || {}),
        },
        published: car.published,
        groene_kaart_url: car.groene_kaart_url || '',
        rdw_verklaring_url: car.rdw_verklaring_url || '',
      });
    }
  }, [car]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const kenteken = formData.license_plate || car?.license_plate;

    if (!kenteken || kenteken.trim() === '') {
      setError('Vul eerst het kenteken in!');
      e.target.value = '';
      return;
    }

    setUploadingImages(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        // Validatie
        if (!file.type.startsWith('image/')) {
          throw new Error('Alleen afbeeldingen toegestaan');
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('Bestand te groot (max 10MB)');
        }

        // Sanitize filename (match PHP: preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $filename))
        const cleanFilename = file.name.replace(/[^a-zA-Z0-9_\-\.]/g, '');

        // Folder: vlottr/autos/{kenteken} (PHP strips "vlottr/" prefix)
        const folder = `vlottr/autos/${kenteken}`;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        formData.append('filename', cleanFilename);

        const response = await fetch(PROXY_URL, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();

        if (!data.success || !data.url) {
          throw new Error(data.error || 'No URL returned');
        }

        // Zorg dat URL volledig is
        let finalUrl = data.url;
        if (!finalUrl.startsWith('http')) {
          finalUrl = `https://internedata.nl${finalUrl.startsWith('/') ? finalUrl : '/' + finalUrl}`;
        }

        uploadedUrls.push(finalUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));

      e.target.value = '';
    } catch (err: any) {
      setError(err.message || 'Upload gefaald');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'groene_kaart' | 'rdw_verklaring'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const kenteken = formData.license_plate || car?.license_plate;

    if (!kenteken || kenteken.trim() === '') {
      setError('Vul eerst het kenteken in!');
      e.target.value = '';
      return;
    }

    setUploadingImages(true);
    setError(null);

    try {
      // Validatie
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Alleen JPG, PNG, WebP of PDF toegestaan');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Bestand te groot (max 10MB)');
      }

      // Sanitize filename
      const extension = file.name.split('.').pop() || 'pdf';
      const cleanFilename = `${docType}.${extension}`.replace(/[^a-zA-Z0-9_\-\.]/g, '');

      // Folder: vlottr/autos/{kenteken}
      const folder = `vlottr/autos/${kenteken}`;

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', folder);
      formDataUpload.append('filename', cleanFilename);

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      if (!data.success || !data.url) {
        throw new Error(data.error || 'No URL returned');
      }

      // Zorg dat URL volledig is
      let finalUrl = data.url;
      if (!finalUrl.startsWith('http')) {
        finalUrl = `https://internedata.nl${finalUrl.startsWith('/') ? finalUrl : '/' + finalUrl}`;
      }

      // Update formData
      if (docType === 'groene_kaart') {
        setFormData(prev => ({ ...prev, groene_kaart_url: finalUrl }));
      } else {
        setFormData(prev => ({ ...prev, rdw_verklaring_url: finalUrl }));
      }

      e.target.value = '';
    } catch (err: any) {
      setError(err.message || 'Upload gefaald');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeDocument = (docType: 'groene_kaart' | 'rdw_verklaring') => {
    if (docType === 'groene_kaart') {
      setFormData(prev => ({ ...prev, groene_kaart_url: '' }));
    } else {
      setFormData(prev => ({ ...prev, rdw_verklaring_url: '' }));
    }
  };

  const generateSummary = () => {
    const { brand, model, year } = formData;
    const { fuel_type, transmission, color, seats, doors, condition, mileage, highlights } = formData.specs as any;
    const parts: string[] = [];

    let opening = `De ${brand || '...'} ${model || '...'} uit ${year} is een`;
    if (color) opening += ` ${color.toLowerCase()}`;
    if (transmission) opening += ` ${transmission === 'automaat' ? 'automatische' : 'handgeschakelde'}`;
    opening += ' auto';
    if (fuel_type) opening += ` met ${fuel_type}motor`;
    opening += '.';
    parts.push(opening);

    if (seats || doors) {
      parts.push(`De auto biedt ruimte voor ${seats || 5} personen en heeft ${doors || 4} deuren.`);
    }

    if (mileage && String(mileage).trim() !== '') {
      const km = parseInt(String(mileage)).toLocaleString('nl-NL');
      parts.push(`Kilometerstand: ${km} km.`);
    }

    if (condition) {
      const condMap: Record<string, string> = { uitstekend: 'uitstekende', goed: 'goede', prima: 'prima' };
      parts.push(`De auto verkeert in ${condMap[condition] || condition} staat.`);
    }

    const hl: string[] = Array.isArray(highlights) ? highlights : [];
    if (hl.length > 0) {
      const list = hl.length === 1 ? hl[0] : `${hl.slice(0, -1).join(', ')} en ${hl[hl.length - 1]}`;
      parts.push(`Uitgerust met: ${list}.`);
    }

    setFormData(prev => ({ ...prev, description: parts.join(' ') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      if (car) {
        const updateData: Record<string, any> = { ...formData };
        if (car.submitted_by_partner && !car.partner_approved) {
          updateData.partner_approved = true;
          updateData.partner_approved_at = new Date().toISOString();
        }
        // Preserve partner-submitted fields not in the form so they aren't wiped on save
        const preserve = [
          'apk_expiry_date', 'apk_document_url', 'vehicle_registration_url',
          'last_maintenance_date', 'last_maintenance_notes',
          'submitted_by_partner', 'partner_approved', 'partner_approved_by',
          'partner_approved_at', 'purchase_price',
          'change_request_pending', 'change_request_message', 'change_request_at',
        ];
        preserve.forEach(f => {
          if ((car as any)[f] !== undefined && updateData[f] === undefined) {
            updateData[f] = (car as any)[f];
          }
        });
        await updateCar(car.id, updateData);
      } else {
        await addCar({
          ...formData,
          created_by: user.uid,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fout bij opslaan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
      <div className="vl-card rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ background: 'linear-gradient(135deg, rgb(15,15,15) 0%, rgb(10,10,10) 100%), linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.05) 100%)' }}>
        <div className="sticky top-0 vl-card border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {car ? 'Auto bewerken' : 'Nieuwe auto toevoegen'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900 border border-red-600 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Merk *
              </label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="vl-input"
                placeholder="BMW"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Model *
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="vl-input"
                placeholder="3 Serie"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Bouwjaar *
              </label>
              <input
                type="number"
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="vl-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Kenteken * (vul dit EERST in!)
              </label>
              <input
                type="text"
                required
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                className="vl-input"
                placeholder="AB-123-CD"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Weekprijs (€) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.weekly_rate}
                onChange={(e) => setFormData({ ...formData, weekly_rate: parseFloat(e.target.value) })}
                className="vl-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="vl-input"
              >
                <option value="available">Beschikbaar</option>
                <option value="rented">Verhuurd</option>
                <option value="maintenance">Onderhoud</option>
              </select>
            </div>
          </div>

          {/* Specs */}
          <div>
            <h3 className="font-medium text-white mb-3">Specificaties</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Brandstoftype
                </label>
                <select
                  value={formData.specs.fuel_type}
                  onChange={(e) => setFormData({
                    ...formData,
                    specs: { ...formData.specs, fuel_type: e.target.value }
                  })}
                  className="vl-input"
                >
                  <option value="">Selecteer</option>
                  <option value="benzine">Benzine</option>
                  <option value="diesel">Diesel</option>
                  <option value="elektrisch">Elektrisch</option>
                  <option value="hybride">Hybride</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Transmissie
                </label>
                <select
                  value={formData.specs.transmission}
                  onChange={(e) => setFormData({
                    ...formData,
                    specs: { ...formData.specs, transmission: e.target.value }
                  })}
                  className="vl-input"
                >
                  <option value="">Selecteer</option>
                  <option value="handmatig">Handmatig</option>
                  <option value="automaat">Automaat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Aantal stoelen
                </label>
                <input
                  type="number"
                  min="2"
                  max="9"
                  value={formData.specs.seats}
                  onChange={(e) => setFormData({
                    ...formData,
                    specs: { ...formData.specs, seats: parseInt(e.target.value) }
                  })}
                  className="vl-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Aantal deuren
                </label>
                <input
                  type="number"
                  min="2"
                  max="5"
                  value={formData.specs.doors}
                  onChange={(e) => setFormData({
                    ...formData,
                    specs: { ...formData.specs, doors: parseInt(e.target.value) }
                  })}
                  className="vl-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Kleur
                </label>
                <input
                  type="text"
                  value={formData.specs.color}
                  onChange={(e) => setFormData({
                    ...formData,
                    specs: { ...formData.specs, color: e.target.value }
                  })}
                  className="vl-input"
                  placeholder="Zwart"
                />
              </div>
            </div>
          </div>

          {/* Kenmerken & conditie */}
          <div>
            <h3 className="font-medium text-white mb-3">Kenmerken & conditie</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Staat</label>
                <select
                  value={(formData.specs as any).condition || ''}
                  onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, condition: e.target.value } })}
                  className="vl-input"
                >
                  <option value="">Selecteer staat</option>
                  <option value="uitstekend">Uitstekend</option>
                  <option value="goed">Goed</option>
                  <option value="prima">Prima</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Kilometerstand</label>
                <input
                  type="number"
                  min="0"
                  value={(formData.specs as any).mileage || ''}
                  onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, mileage: e.target.value } })}
                  className="vl-input"
                  placeholder="125000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Uitrusting</label>
              <div className="grid grid-cols-2 gap-2">
                {HIGHLIGHTS_OPTIONS.map((opt) => {
                  const hl: string[] = Array.isArray((formData.specs as any).highlights) ? (formData.specs as any).highlights : [];
                  const checked = hl.includes(opt);
                  return (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked ? hl.filter(h => h !== opt) : [...hl, opt];
                          setFormData({ ...formData, specs: { ...formData.specs, highlights: next } });
                        }}
                        className="w-4 h-4 rounded accent-green-500"
                      />
                      <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-neutral-300">
                Samenvatting (klant-weergave)
              </label>
              <button
                type="button"
                onClick={generateSummary}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600/20 border border-green-500/30 text-green-400 rounded-md hover:bg-green-600/30 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Genereer samenvatting
              </button>
            </div>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="vl-input"
              placeholder="Vul de kenmerken in en klik op 'Genereer samenvatting', of typ zelf een beschrijving..."
            />
            <p className="text-xs text-neutral-500 mt-1">Deze tekst wordt getoond aan klanten onder de foto's.</p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Afbeeldingen
            </label>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Auto ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                        e.currentTarget.className = 'w-full h-24 bg-red-100 rounded-lg flex items-center justify-center';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/[0.12] rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImages || !formData.license_plate}
              />
              {uploadingImages ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>Uploaden...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  <span>Afbeeldingen uploaden</span>
                </>
              )}
            </label>
            {!formData.license_plate && (
              <p className="text-xs text-red-600 mt-1">Vul eerst kenteken in voordat je foto's upload!</p>
            )}
          </div>

          {/* Documenten */}
          <div>
            <h3 className="font-medium text-white mb-3">Documenten (optioneel)</h3>

            {/* Groene Kaart */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Groene Kaart
              </label>
              {formData.groene_kaart_url ? (
                <div className="flex items-center space-x-3 p-3 bg-green-900 border border-green-600 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-green-400 font-medium">✓ Document geüpload</p>
                    <a
                      href={formData.groene_kaart_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-400 hover:underline"
                    >
                      Bekijk document
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument('groene_kaart')}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Verwijderen
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/[0.12] rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleDocumentUpload(e, 'groene_kaart')}
                    className="hidden"
                    disabled={uploadingImages || !formData.license_plate}
                  />
                  <Upload className="w-5 h-5 mr-2" />
                  <span className="text-sm">Upload Groene Kaart (JPG, PNG, PDF)</span>
                </label>
              )}
            </div>

            {/* RDW Verklaring */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                RDW Verklaring
              </label>
              {formData.rdw_verklaring_url ? (
                <div className="flex items-center space-x-3 p-3 bg-green-900 border border-green-600 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-green-400 font-medium">✓ Document geüpload</p>
                    <a
                      href={formData.rdw_verklaring_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-400 hover:underline"
                    >
                      Bekijk document
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument('rdw_verklaring')}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Verwijderen
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/[0.12] rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleDocumentUpload(e, 'rdw_verklaring')}
                    className="hidden"
                    disabled={uploadingImages || !formData.license_plate}
                  />
                  <Upload className="w-5 h-5 mr-2" />
                  <span className="text-sm">Upload RDW Verklaring (JPG, PNG, PDF)</span>
                </label>
              )}
            </div>
          </div>

          {/* Partner-ingediende informatie (read-only) */}
          {car && (car as any).submitted_by_partner && (
            <div className="border border-white/[0.08] rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                Partner-informatie
              </h3>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {(car as any).purchase_price != null && (
                  <div className="flex items-start gap-2">
                    <Euro className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-neutral-500 text-xs">Inkoopprijs</p>
                      <p className="text-white font-medium">€{Number((car as any).purchase_price).toLocaleString('nl-NL')}</p>
                    </div>
                  </div>
                )}
                {(car as any).apk_expiry_date && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-neutral-500 text-xs">APK vervaldatum</p>
                      <p className="text-white font-medium">{new Date((car as any).apk_expiry_date).toLocaleDateString('nl-NL')}</p>
                    </div>
                  </div>
                )}
                {(car as any).last_maintenance_date && (
                  <div className="flex items-start gap-2">
                    <Wrench className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-neutral-500 text-xs">Laatste onderhoud</p>
                      <p className="text-white font-medium">{new Date((car as any).last_maintenance_date).toLocaleDateString('nl-NL')}</p>
                    </div>
                  </div>
                )}
              </div>

              {(car as any).last_maintenance_notes && (
                <div className="text-sm">
                  <p className="text-neutral-500 text-xs mb-1">Onderhoud notities</p>
                  <p className="text-neutral-300">{(car as any).last_maintenance_notes}</p>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                {(car as any).vehicle_registration_url && (
                  <a href={(car as any).vehicle_registration_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-green-400 hover:underline">
                    <Shield className="w-3.5 h-3.5" /> Tenaamstelling bekijken
                  </a>
                )}
                {(car as any).apk_document_url && (
                  <a href={(car as any).apk_document_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-green-400 hover:underline">
                    <FileText className="w-3.5 h-3.5" /> APK document bekijken
                  </a>
                )}
              </div>

              {(car as any).change_request_pending && (
                <div className="rounded-lg p-3 border border-blue-500/20" style={{ background: 'rgba(59,130,246,0.08)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400">Openstaand wijzigingsverzoek</span>
                  </div>
                  <p className="text-xs text-neutral-300">{(car as any).change_request_message}</p>
                </div>
              )}
            </div>
          )}

          {/* Published */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <label htmlFor="published" className="ml-2 text-sm text-neutral-300">
              Publiceren (zichtbaar voor klanten)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/[0.12] rounded-md text-neutral-300 hover:bg-[var(--vl-bg-primary)] transition-colors"
              disabled={loading}
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-400 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bezig...
                </>
              ) : (
                <>{car ? 'Opslaan' : 'Toevoegen'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarFormModal;
