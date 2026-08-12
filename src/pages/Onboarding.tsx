import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useSettingsStore } from '../store/settingsStore';
import { User, Phone, MapPin, Calendar, CreditCard, CheckCircle, ArrowRight, ArrowLeft, Loader2, FileText, Camera } from 'lucide-react';
import DriverLicenseUpload from '../components/profile/DriverLicenseUpload';
import SalarySlipUpload from '../components/profile/SalarySlipUpload';
import ProfilePhotoCapture from '../components/profile/ProfilePhotoCapture';
import { DriverLicense } from '../types';

type Step = 1 | 2 | 3 | 4 | 5;

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, loadSettings } = useSettingsStore();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [personalData, setPersonalData] = useState({
    name: '',
    phone: '',
    region: '',
    city: '',
    street: '',
    house_number: '',
    postal_code: '',
    date_of_birth: ''
  });

  const [licenseData, setLicenseData] = useState<DriverLicense | null>(null);
  const [salarySlips, setSalarySlips] = useState<string[]>([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePersonalData = () => {
    const errors: Record<string, string> = {};

    if (!personalData.name.trim()) {
      errors.name = 'Naam is verplicht';
    }

    if (!personalData.phone.trim()) {
      errors.phone = 'Telefoonnummer is verplicht';
    }

    if (!personalData.region.trim()) {
      errors.region = 'Regio is verplicht';
    }

    if (!personalData.city.trim()) {
      errors.city = 'Stad is verplicht';
    }

    if (!personalData.street.trim()) {
      errors.street = 'Straatnaam is verplicht';
    }

    if (!personalData.house_number.trim()) {
      errors.house_number = 'Huisnummer is verplicht';
    }

    if (!personalData.postal_code.trim()) {
      errors.postal_code = 'Postcode is verplicht';
    }

    if (!personalData.date_of_birth) {
      errors.date_of_birth = 'Geboortedatum is verplicht';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePersonalDataSubmit = () => {
    if (!validatePersonalData()) {
      return;
    }
    setCurrentStep(2);
  };

  const handleLicenseUpload = (license: DriverLicense) => {
    setLicenseData(license);
    setCurrentStep(3);
  };

  const handleComplete = async () => {
    if (!user || !licenseData) return;

    try {
      setIsSaving(true);

      // Combine address fields for backward compatibility
      const fullAddress = `${personalData.street} ${personalData.house_number}, ${personalData.postal_code} ${personalData.city}`;

      await updateDoc(doc(db, 'users', user.uid), {
        name: personalData.name,
        phone: personalData.phone,
        region: personalData.region,
        city: personalData.city,
        street: personalData.street,
        house_number: personalData.house_number,
        postal_code: personalData.postal_code,
        address: fullAddress,
        date_of_birth: personalData.date_of_birth,
        driver_license: licenseData,
        salary_slips: salarySlips,
        ...(profilePhotoUrl ? { profile_photo: profilePhotoUrl } : {}),
        onboarding_completed: true,
        verification_status: 'pending',
        updated_at: new Date().toISOString()
      });

      console.log('Onboarding completed successfully');
      setIsSaving(false);

      // Navigate to profile so user sees their submitted application
      navigate('/customer/profile');
    } catch (err: any) {
      console.error('Error saving onboarding data:', err);
      alert('Fout bij opslaan gegevens. Probeer het opnieuw.');
      setIsSaving(false);
    }
  };

  const steps = [
    { number: 1, title: 'Persoonlijke gegevens', icon: User },
    { number: 2, title: 'Rijbewijs upload', icon: CreditCard },
    { number: 3, title: 'Loonstroken', icon: FileText },
    { number: 4, title: 'Profielfoto', icon: Camera },
    { number: 5, title: 'Voltooid', icon: CheckCircle }
  ];

  const proxyUrl = settings?.upload_proxy_url || 'https://internedata.nl/uploads/vlottr/upload.php';

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--vl-bg-primary)' }}>
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welkom bij Vlottr!</h1>
          <p className="text-neutral-500">
            Laten we je account compleet maken
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentStep >= step.number
                      ? 'bg-green-500 text-black'
                      : 'bg-neutral-800 text-neutral-500'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <p className={`mt-2 text-xs font-medium text-center max-w-[72px] ${
                  currentStep >= step.number ? 'text-white' : 'text-neutral-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 mx-2 mb-8 transition-all ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-neutral-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="vl-card p-6 lg:p-8">
          {/* Step 1: Personal Data */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Persoonlijke gegevens</h2>
                <p className="text-neutral-500 mb-6">
                  Deze gegevens worden gebruikt voor je huurcontracten
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Volledige naam *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={personalData.name}
                    onChange={handlePersonalChange}
                    className={`vl-input !pl-12 w-full ${formErrors.name ? 'border-red-500' : ''}`}
                    placeholder="Jan Jansen"
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                  Telefoonnummer *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={personalData.phone}
                    onChange={handlePersonalChange}
                    className={`vl-input !pl-12 w-full ${formErrors.phone ? 'border-red-500' : ''}`}
                    placeholder="+31 6 12345678"
                  />
                </div>
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="region" className="block text-sm font-medium text-white mb-2">
                  Regio *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                  <input
                    type="text"
                    id="region"
                    name="region"
                    value={personalData.region}
                    onChange={handlePersonalChange}
                    className={`vl-input !pl-12 w-full ${formErrors.region ? 'border-red-500' : ''}`}
                    placeholder="Bijv. Limburg"
                  />
                </div>
                {formErrors.region && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.region}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-white mb-2">
                  Stad *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={personalData.city}
                    onChange={handlePersonalChange}
                    className={`vl-input !pl-12 w-full ${formErrors.city ? 'border-red-500' : ''}`}
                    placeholder="Bijv. Maastricht"
                  />
                </div>
                {formErrors.city && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.city}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="street" className="block text-sm font-medium text-white mb-2">
                    Straatnaam *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                    <input
                      type="text"
                      id="street"
                      name="street"
                      value={personalData.street}
                      onChange={handlePersonalChange}
                      className={`vl-input !pl-12 w-full ${formErrors.street ? 'border-red-500' : ''}`}
                      placeholder="Marktstraat"
                    />
                  </div>
                  {formErrors.street && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.street}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="house_number" className="block text-sm font-medium text-white mb-2">
                    Huisnummer *
                  </label>
                  <input
                    type="text"
                    id="house_number"
                    name="house_number"
                    value={personalData.house_number}
                    onChange={handlePersonalChange}
                    className={`vl-input w-full ${formErrors.house_number ? 'border-red-500' : ''}`}
                    placeholder="123"
                  />
                  {formErrors.house_number && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.house_number}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-white mb-2">
                  Postcode *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                  <input
                    type="text"
                    id="postal_code"
                    name="postal_code"
                    value={personalData.postal_code}
                    onChange={handlePersonalChange}
                    className={`vl-input !pl-12 w-full ${formErrors.postal_code ? 'border-red-500' : ''}`}
                    placeholder="6211 AB"
                  />
                </div>
                {formErrors.postal_code && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.postal_code}</p>
                )}
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-white mb-2">
                  Geboortedatum *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={personalData.date_of_birth}
                    onChange={handlePersonalChange}
                    className={`vl-input !pl-12 w-full cursor-pointer ${formErrors.date_of_birth ? 'border-red-500' : ''}`}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                {formErrors.date_of_birth && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.date_of_birth}</p>
                )}
              </div>

              <button
                onClick={handlePersonalDataSubmit}
                className="vl-btn-primary w-full"
              >
                Volgende stap
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          )}

          {/* Step 2: License Upload */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Rijbewijs uploaden</h2>
                <p className="text-neutral-500 mb-6">
                  Upload je rijbewijs voor verificatie
                </p>
              </div>

              <DriverLicenseUpload
                onLicenseUploaded={handleLicenseUpload}
                onBack={() => setCurrentStep(1)}
              />
            </div>
          )}

          {/* Step 3: Salary Slips */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Loonstroken uploaden</h2>
                <p className="text-neutral-500 mb-6">
                  Upload je 3 meest recente loonstroken. Dit is vereist voor verificatie van je inkomen. Je kunt PDF, JPG of PNG bestanden uploaden.
                </p>
              </div>

              {user && (
                <SalarySlipUpload
                  userId={user.uid}
                  proxyUrl={proxyUrl}
                  initialSlips={salarySlips}
                  onSlipsChange={setSalarySlips}
                />
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-4 py-2 border border-white/10 text-neutral-300 rounded-md hover:border-white/20 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Terug
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 vl-btn-primary"
                >
                  Volgende stap
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>

              {salarySlips.length < 3 && (
                <p className="text-xs text-neutral-500 text-center">
                  Je kunt ook later loonstroken uploaden via je profiel.
                </p>
              )}
            </div>
          )}

          {/* Step 4: Profile Photo */}
          {currentStep === 4 && user && (
            <ProfilePhotoCapture
              userId={user.uid}
              proxyUrl={proxyUrl}
              onPhotoCaptured={(url) => {
                setProfilePhotoUrl(url);
                setCurrentStep(5);
              }}
              onBack={() => setCurrentStep(3)}
            />
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">
                Alles klaar!
              </h2>
              <p className="text-neutral-500 mb-4 max-w-md mx-auto">
                Je gegevens worden nu ter controle doorgestuurd naar een beheerder. Je ontvangt bericht zodra je aanvraag is goedgekeurd.
              </p>

              <div className="vl-card rounded-lg border border-white/[0.05] p-4 text-left max-w-sm mx-auto mb-8 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Rijbewijs</span>
                  <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Geüpload</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Loonstroken</span>
                  <span className={salarySlips.length >= 3 ? 'text-green-400 flex items-center gap-1' : 'text-yellow-400'}>
                    {salarySlips.length >= 3 ? (
                      <><CheckCircle className="w-3.5 h-3.5" /> Geüpload</>
                    ) : (
                      `${salarySlips.length}/3 geüpload`
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Profielfoto</span>
                  <span className={profilePhotoUrl ? 'text-green-400 flex items-center gap-1' : 'text-yellow-400'}>
                    {profilePhotoUrl ? (
                      <><CheckCircle className="w-3.5 h-3.5" /> Geüpload</>
                    ) : (
                      'Niet geüpload'
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="flex items-center gap-2 px-4 py-2 border border-white/10 text-neutral-300 rounded-md hover:border-white/20 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Terug
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isSaving}
                  className="vl-btn-primary"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gegevens opslaan...
                    </span>
                  ) : (
                    'Aanvraag indienen'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
