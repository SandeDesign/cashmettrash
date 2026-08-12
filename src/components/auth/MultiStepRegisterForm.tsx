import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { validateEmail, validatePassword } from '../../utils/validation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import DriverLicenseUpload from '../profile/DriverLicenseUpload';
import { DriverLicense } from '../../types';

type Step = 'account' | 'personal' | 'license' | 'complete';

const MultiStepRegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, user, loading, error } = useAuthStore();
  const { settings, loadSettings } = useSettingsStore();
  const [currentStep, setCurrentStep] = useState<Step>('account');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [personalData, setPersonalData] = useState({
    name: '',
    phone: '',
    address: '',
    date_of_birth: ''
  });

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateAccountStep = () => {
    const errors: Record<string, string> = {};

    if (!accountData.email) {
      errors.email = 'E-mailadres is verplicht';
    } else if (!validateEmail(accountData.email)) {
      errors.email = 'Ongeldig e-mailadres';
    }

    if (!accountData.password) {
      errors.password = 'Wachtwoord is verplicht';
    } else if (!validatePassword(accountData.password)) {
      errors.password = 'Wachtwoord moet minimaal 8 karakters zijn';
    }

    if (!accountData.confirmPassword) {
      errors.confirmPassword = 'Bevestig uw wachtwoord';
    } else if (accountData.password !== accountData.confirmPassword) {
      errors.confirmPassword = 'Wachtwoorden komen niet overeen';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePersonalStep = () => {
    const errors: Record<string, string> = {};

    if (!personalData.name) {
      errors.name = 'Naam is verplicht';
    }

    if (!personalData.phone) {
      errors.phone = 'Telefoonnummer is verplicht';
    }

    if (!personalData.address) {
      errors.address = 'Adres is verplicht';
    }

    if (!personalData.date_of_birth) {
      errors.date_of_birth = 'Geboortedatum is verplicht';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAccountStep()) return;

    try {
      await register({
        email: accountData.email,
        password: accountData.password
      });
      setCurrentStep('personal');
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePersonalStep() || !user) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...personalData,
        updated_at: new Date().toISOString()
      });

      setCurrentStep('license');
    } catch (error: any) {
      setFormErrors({ general: error.message || 'Fout bij opslaan gegevens' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLicenseComplete = async (license: DriverLicense) => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        driver_license: license,
        verification_status: 'pending',
        updated_at: new Date().toISOString()
      });

      setCurrentStep('complete');
    } catch (error: any) {
      setFormErrors({ general: error.message || 'Fout bij opslaan rijbewijs' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderProgressBar = () => {
    const steps = [
      { key: 'account', label: 'Account' },
      { key: 'personal', label: 'Gegevens' },
      { key: 'license', label: 'Rijbewijs' },
      { key: 'complete', label: 'Klaar' }
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index <= currentIndex
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-neutral-500'
                  }`}
                >
                  {index < currentIndex ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs mt-2 text-neutral-500">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-2 mb-6">
                  <div
                    className={`h-full ${
                      index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  if (currentStep === 'account') {
    return (
      <div className="min-h-screen bg-[var(--vl-bg-primary)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Registreren</h2>
            <p className="mt-2 text-neutral-500">Stap 1: Maak uw account aan</p>
          </div>

          {renderProgressBar()}

          <form onSubmit={handleAccountSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="bg-red-900 border border-red-600 text-red-400 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
                  E-mailadres
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={accountData.email}
                    onChange={handleAccountChange}
                    className={`block w-full !pl-12 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-blue-500 ${
                      formErrors.email ? 'border-red-300' : 'border-white/[0.12]'
                    }`}
                    placeholder="jan@example.com"
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
                  Wachtwoord
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={accountData.password}
                    onChange={handleAccountChange}
                    className={`block w-full !pl-12 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-blue-500 ${
                      formErrors.password ? 'border-red-300' : 'border-white/[0.12]'
                    }`}
                    placeholder="Minimaal 8 karakters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-neutral-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-neutral-600" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300">
                  Wachtwoord bevestigen
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={accountData.confirmPassword}
                    onChange={handleAccountChange}
                    className={`block w-full !pl-12 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-blue-500 ${
                      formErrors.confirmPassword ? 'border-red-300' : 'border-white/[0.12]'
                    }`}
                    placeholder="Bevestig uw wachtwoord"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-neutral-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-neutral-600" />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Bezig...' : 'Volgende stap'}
            </button>

            <div className="text-center">
              <p className="text-sm text-neutral-500">
                Al een account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Log hier in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (currentStep === 'personal') {
    return (
      <div className="min-h-screen bg-[var(--vl-bg-primary)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Persoonlijke gegevens</h2>
            <p className="mt-2 text-neutral-500">Stap 2: Vul uw gegevens in</p>
          </div>

          {renderProgressBar()}

          <form onSubmit={handlePersonalSubmit} className="mt-8 space-y-6">
            {formErrors.general && (
              <div className="bg-red-900 border border-red-600 text-red-400 px-4 py-3 rounded-md text-sm">
                {formErrors.general}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-300">
                  Volledige naam *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={personalData.name}
                    onChange={handlePersonalChange}
                    className={`block w-full !pl-12 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-blue-500 ${
                      formErrors.name ? 'border-red-300' : 'border-white/[0.12]'
                    }`}
                    placeholder="Jan Jansen"
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-300">
                  Telefoonnummer *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={personalData.phone}
                    onChange={handlePersonalChange}
                    className={`block w-full !pl-12 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-blue-500 ${
                      formErrors.phone ? 'border-red-300' : 'border-white/[0.12]'
                    }`}
                    placeholder="+31 6 12345678"
                  />
                </div>
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-neutral-300">
                  Adres *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={personalData.address}
                    onChange={handlePersonalChange}
                    className={`block w-full !pl-12 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-blue-500 ${
                      formErrors.address ? 'border-red-300' : 'border-white/[0.12]'
                    }`}
                    placeholder="Straat 123, 1234 AB Stad"
                  />
                </div>
                {formErrors.address && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
                )}
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-neutral-300">
                  Geboortedatum *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-neutral-600" />
                  </div>
                  <input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={personalData.date_of_birth}
                    onChange={handlePersonalChange}
                    className={`block w-full !pl-12 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-blue-500 ${
                      formErrors.date_of_birth ? 'border-red-300' : 'border-white/[0.12]'
                    }`}
                  />
                </div>
                {formErrors.date_of_birth && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.date_of_birth}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Bezig met opslaan...' : 'Volgende stap'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (currentStep === 'license') {
    return (
      <div className="min-h-screen bg-[var(--vl-bg-primary)] py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">Rijbewijs uploaden</h2>
            <p className="mt-2 text-neutral-500">Stap 3: Upload uw rijbewijs</p>
          </div>

          {renderProgressBar()}

          {formErrors.general && (
            <div className="mb-4 bg-red-900 border border-red-600 text-red-400 px-4 py-3 rounded-md text-sm">
              {formErrors.general}
            </div>
          )}

          <DriverLicenseUpload
            onLicenseUploaded={handleLicenseComplete}
          />
        </div>
      </div>
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-[var(--vl-bg-primary)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Registratie voltooid!</h2>
          </div>

          {renderProgressBar()}

          <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6 mt-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Uw account is aangemaakt!
              </h3>
              <p className="text-neutral-500">
                Uw registratie is succesvol afgerond en wacht nu op goedkeuring.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Let op:</strong> Een administrator of manager moet uw account eerst
                goedkeuren voordat u auto's kunt boeken. Dit gebeurt meestal binnen 24 uur.
                U ontvangt een e-mail zodra uw account is goedgekeurd.
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-400 transition-colors"
            >
              Naar dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MultiStepRegisterForm;
