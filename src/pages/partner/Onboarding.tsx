import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail, Hash, Upload, ChevronRight, ChevronLeft, CheckCircle, Loader2, FileSignature } from 'lucide-react';
import { doc, updateDoc, Timestamp, collection, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import Logo from '../../components/shared/Logo';
import SignaturePad from '../../components/contract/SignaturePad';
import { generateContractHTML, PARTNER_AGREEMENT_TEMPLATE, DEALER_AGREEMENT_TEMPLATE, GARAGE_AGREEMENT_TEMPLATE } from '../../utils/pdf';

const STEPS = [
  { id: 'bedrijf', title: 'Bedrijfsgegevens', description: 'Vul je bedrijfsinformatie in' },
  { id: 'contact', title: 'Contact & Adres', description: 'Contactgegevens en locatie' },
  { id: 'logo', title: 'Logo uploaden', description: 'Upload je bedrijfslogo (optioneel)' },
  { id: 'contract', title: 'Overeenkomst tekenen', description: 'Lees en onderteken de partnerovereenkomst' },
];

const PartnerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setUser } = useAuthStore();
  const { settings, loadSettings } = useSettingsStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [dealerSignatureUrl, setDealerSignatureUrl] = useState<string | null>(null);
  const [garageSignatureUrl, setGarageSignatureUrl] = useState<string | null>(null);
  const [signingAgreementType, setSigningAgreementType] = useState<'dealer' | 'garage' | null>(null);

  const [formData, setFormData] = useState({
    company_name: user?.company_name || '',
    partner_type: user?.partner_type || 'dealer' as 'garage' | 'dealer' | 'both',
    offers_maintenance: user?.offers_maintenance || false,
    company_kvk: user?.company_kvk || '',
    company_description: '',
    company_address: '',
    company_phone: user?.company_phone || user?.phone || '',
    company_email: user?.company_email || user?.email || '',
    company_logo: '',
  });

  // Load settings for admin signature
  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo mag maximaal 2MB zijn');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, company_logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 0:
        if (!formData.company_name) {
          setError('Bedrijfsnaam is verplicht');
          return false;
        }
        return true;
      case 1:
        if (!formData.company_phone) {
          setError('Telefoonnummer is verplicht');
          return false;
        }
        return true;
      case 2:
        return true; // Logo is optional
      case 3:
        if (!allAgreementsSigned()) {
          setError('Je moet alle overeenkomsten ondertekenen om verder te gaan');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setError(null);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSignatureSave = (dataUrl: string) => {
    if (signingAgreementType === 'dealer') {
      setDealerSignatureUrl(dataUrl);
    } else if (signingAgreementType === 'garage') {
      setGarageSignatureUrl(dataUrl);
    } else {
      setSignatureUrl(dataUrl);
    }
    setShowSignaturePad(false);
    setSigningAgreementType(null);
    setError(null);
  };

  // Determine which agreements need to be signed based on partner_type
  const needsDealerAgreement = formData.partner_type === 'dealer' || formData.partner_type === 'both';
  const needsGarageAgreement = formData.partner_type === 'garage' || formData.partner_type === 'both';

  const allAgreementsSigned = () => {
    if (needsDealerAgreement && !dealerSignatureUrl) return false;
    if (needsGarageAgreement && !garageSignatureUrl) return false;
    return needsDealerAgreement || needsGarageAgreement;
  };

  const generateAgreementHtml = (type: 'dealer' | 'garage') => {
    const now = new Date();
    const adminSignatureUrl = settings?.admin_signature_url || '';
    const template = type === 'dealer' ? DEALER_AGREEMENT_TEMPLATE : GARAGE_AGREEMENT_TEMPLATE;
    const sig = type === 'dealer' ? dealerSignatureUrl : garageSignatureUrl;

    return generateContractHTML(template, {
      contract_id: user?.uid?.substring(0, 8) || 'DRAFT',
      company_name: formData.company_name || '',
      partner_name: user?.name || '',
      partner_email: formData.company_email || user?.email || '',
      partner_phone: formData.company_phone || '',
      partner_kvk: formData.company_kvk || 'Niet opgegeven',
      current_date: now.toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' }),
      customer_signature: sig || '',
      admin_signature: adminSignatureUrl,
      logo_img: '<span style="font-size: 64px; font-weight: 900; color: #000000; line-height: 1;">V</span>',
      logo_img_small: '<span style="font-size: 32px; font-weight: 900; color: #000000; line-height: 1;">V</span>',
    });
  };

  // Keep backward compat
  const generateContractHtml = () => {
    const now = new Date();
    const adminSignatureUrl = settings?.admin_signature_url || '';

    return generateContractHTML(PARTNER_AGREEMENT_TEMPLATE, {
      contract_id: user?.uid?.substring(0, 8) || 'DRAFT',
      company_name: formData.company_name || '',
      partner_name: user?.name || '',
      partner_email: formData.company_email || user?.email || '',
      partner_phone: formData.company_phone || '',
      partner_kvk: formData.company_kvk || 'Niet opgegeven',
      current_date: now.toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' }),
      customer_signature: signatureUrl || '',
      admin_signature: adminSignatureUrl,
      logo_img: '<span style="font-size: 64px; font-weight: 900; color: #000000; line-height: 1;">V</span>',
      logo_img_small: '<span style="font-size: 32px; font-weight: 900; color: #000000; line-height: 1;">V</span>',
    });
  };

  const handleSubmit = async () => {
    if (!user || !allAgreementsSigned()) return;

    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const adminSigUrl = settings?.admin_signature_url || '';
      const userUpdateData: Record<string, any> = {
        company_name: formData.company_name,
        partner_type: formData.partner_type,
        offers_maintenance: formData.offers_maintenance,
        company_kvk: formData.company_kvk,
        company_description: formData.company_description,
        company_address: formData.company_address,
        company_phone: formData.company_phone,
        company_email: formData.company_email,
        company_logo: formData.company_logo,
        partner_agreement_signed: true,
        onboarding_completed: true,
        onboarding_completed_at: now,
        updated_at: Timestamp.now(),
      };

      const storeUserData: Record<string, any> = {
        company_name: formData.company_name,
        partner_type: formData.partner_type,
        offers_maintenance: formData.offers_maintenance,
        company_kvk: formData.company_kvk,
        company_phone: formData.company_phone,
        company_email: formData.company_email,
        company_logo: formData.company_logo,
        partner_agreement_signed: true,
        onboarding_completed: true,
      };

      // Create dealer agreement if needed
      if (needsDealerAgreement && dealerSignatureUrl) {
        const dealerHtml = generateAgreementHtml('dealer');
        const dealerRef = doc(collection(db, 'contracts'));
        await setDoc(dealerRef, {
          id: dealerRef.id,
          booking_id: '',
          customer_id: user.uid,
          customer_name: user.name || formData.company_name,
          customer_email: formData.company_email || user.email,
          customer_phone: formData.company_phone,
          car_id: '',
          car_info: formData.company_name,
          start_date: now,
          weeks_rented: 0,
          weekly_rate: 0,
          total_price: 0,
          contract_html: dealerHtml,
          customer_signature_url: dealerSignatureUrl,
          admin_signature_url: adminSigUrl,
          signed: true,
          signed_at: now,
          status: 'signed',
          contract_type: 'dealer_agreement',
          created_at: now,
          updated_at: now,
        });
        userUpdateData.dealer_agreement_signed = true;
        userUpdateData.dealer_agreement_id = dealerRef.id;
        userUpdateData.dealer_agreement_signed_at = now;
        userUpdateData.partner_agreement_id = dealerRef.id;
        userUpdateData.partner_agreement_signed_at = now;
        storeUserData.dealer_agreement_signed = true;
        storeUserData.dealer_agreement_id = dealerRef.id;
        storeUserData.dealer_agreement_signed_at = now;
      }

      // Create garage agreement if needed
      if (needsGarageAgreement && garageSignatureUrl) {
        const garageHtml = generateAgreementHtml('garage');
        const garageRef = doc(collection(db, 'contracts'));
        await setDoc(garageRef, {
          id: garageRef.id,
          booking_id: '',
          customer_id: user.uid,
          customer_name: user.name || formData.company_name,
          customer_email: formData.company_email || user.email,
          customer_phone: formData.company_phone,
          car_id: '',
          car_info: formData.company_name,
          start_date: now,
          weeks_rented: 0,
          weekly_rate: 0,
          total_price: 0,
          contract_html: garageHtml,
          customer_signature_url: garageSignatureUrl,
          admin_signature_url: adminSigUrl,
          signed: true,
          signed_at: now,
          status: 'signed',
          contract_type: 'garage_agreement',
          created_at: now,
          updated_at: now,
        });
        userUpdateData.garage_agreement_signed = true;
        userUpdateData.garage_agreement_id = garageRef.id;
        userUpdateData.garage_agreement_signed_at = now;
        storeUserData.garage_agreement_signed = true;
        storeUserData.garage_agreement_id = garageRef.id;
        storeUserData.garage_agreement_signed_at = now;
      }

      // Update user profile
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, userUpdateData);

      // Update store
      setUser({ ...user, ...storeUserData } as any);

      navigate('/partner');
    } catch (err: any) {
      console.error('Error saving onboarding:', err);
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--vl-bg-primary)' }}>
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Logo variant="glow" size="sm" />
        <span className="text-sm text-neutral-500">
          Stap {currentStep + 1} van {STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{
                background: i <= currentStep ? '#22c55e' : 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className={`w-full ${currentStep === 3 ? 'max-w-2xl' : 'max-w-md'}`}>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">{STEPS[currentStep].title}</h1>
            <p className="text-neutral-500">{STEPS[currentStep].description}</p>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 mb-6 border border-red-500/20" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Step 1: Company Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Bedrijfsnaam *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="vl-input !pl-12"
                    placeholder="Jouw bedrijfsnaam"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Type partner</label>
                <select
                  name="partner_type"
                  value={formData.partner_type}
                  onChange={handleChange}
                  className="vl-input"
                >
                  <option value="dealer">Autohandelaar</option>
                  <option value="garage">Autogarage</option>
                  <option value="both">Garage & Handelaar</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.08] cursor-pointer hover:border-green-500/30 transition-colors" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <input
                    type="checkbox"
                    checked={formData.offers_maintenance}
                    onChange={e => setFormData(prev => ({ ...prev, offers_maintenance: e.target.checked }))}
                    className="w-5 h-5 rounded border-white/20 bg-transparent accent-green-500"
                  />
                  <div>
                    <span className="text-white font-medium text-sm">Ik bied ook onderhoud/werkplaats diensten aan</span>
                    <p className="text-neutral-500 text-xs mt-0.5">Je kunt later aangeven welke werkzaamheden je aanbiedt</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  KVK-nummer <span className="text-neutral-500">(optioneel)</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    type="text"
                    name="company_kvk"
                    value={formData.company_kvk}
                    onChange={handleChange}
                    className="vl-input !pl-12"
                    placeholder="12345678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Beschrijving <span className="text-neutral-500">(optioneel)</span>
                </label>
                <textarea
                  name="company_description"
                  value={formData.company_description}
                  onChange={handleChange}
                  className="vl-input"
                  rows={3}
                  placeholder="Kort over je bedrijf..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact & Address */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Telefoonnummer *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    type="tel"
                    name="company_phone"
                    value={formData.company_phone}
                    onChange={handleChange}
                    className="vl-input !pl-12"
                    placeholder="06-12345678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">E-mailadres</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    type="email"
                    name="company_email"
                    value={formData.company_email}
                    onChange={handleChange}
                    className="vl-input !pl-12"
                    placeholder="info@bedrijf.nl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Bedrijfsadres <span className="text-neutral-500">(optioneel)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    type="text"
                    name="company_address"
                    value={formData.company_address}
                    onChange={handleChange}
                    className="vl-input !pl-12"
                    placeholder="Straat 1, 1234 AB Plaats"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Logo */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-white/[0.15] flex items-center justify-center mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {formData.company_logo ? (
                    <img src={formData.company_logo} alt="Logo" className="w-full h-full object-contain p-3" />
                  ) : (
                    <Building2 className="w-12 h-12 text-neutral-600" />
                  )}
                </div>

                <label className="px-6 py-2.5 bg-green-500 text-neutral-950 font-bold rounded-lg hover:bg-green-400 transition-colors cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {formData.company_logo ? 'Logo wijzigen' : 'Logo uploaden'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>

                <p className="text-xs text-neutral-500 mt-3 text-center">
                  Max 2MB. PNG of JPG. Je kunt dit later altijd wijzigen.
                </p>

                {formData.company_logo && (
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, company_logo: '' }))}
                    className="text-xs text-red-400 hover:text-red-300 mt-2"
                  >
                    Logo verwijderen
                  </button>
                )}
              </div>

              {/* Summary */}
              <div className="vl-card rounded-xl p-5 mt-8">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Samenvatting
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Bedrijf</span>
                    <span className="text-white">{formData.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Type</span>
                    <span className="text-white">
                      {formData.partner_type === 'garage' ? 'Autogarage' : formData.partner_type === 'dealer' ? 'Autohandelaar' : 'Garage & Handelaar'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Telefoon</span>
                    <span className="text-white">{formData.company_phone}</span>
                  </div>
                  {formData.company_kvk && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">KVK</span>
                      <span className="text-white">{formData.company_kvk}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Contract signing — separate agreements per type */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {formData.partner_type === 'both' && (
                <div className="rounded-xl px-4 py-3 border border-blue-500/20" style={{ background: 'rgba(59, 130, 246, 0.08)' }}>
                  <span className="text-blue-400 text-sm">Je hebt twee overeenkomsten nodig: een als handelaar en een als garage.</span>
                </div>
              )}

              {/* Dealer Agreement */}
              {needsDealerAgreement && (
                <div className="rounded-xl border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="p-5 border-b border-white/[0.06]" style={{ background: 'linear-gradient(135deg, #1a4d2e 0%, #0f2818 100%)' }}>
                    <p className="text-green-400 text-xs font-bold tracking-widest uppercase mb-1">Vlottr &bull; Buddy BV</p>
                    <h3 className="text-white font-bold text-lg">Dealer Overeenkomst</h3>
                    <p className="text-neutral-400 text-xs mt-1">Samenwerking autohandel &amp; inkoop</p>
                  </div>

                  <div className="p-5 space-y-3 max-h-[300px] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg p-3 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <p className="text-green-400 text-xs font-bold uppercase mb-1">Platform</p>
                        <p className="text-white text-sm font-semibold">Vlottr (Buddy BV)</p>
                      </div>
                      <div className="rounded-lg p-3 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <p className="text-green-400 text-xs font-bold uppercase mb-1">Partner</p>
                        <p className="text-white text-sm font-semibold">{formData.company_name || '—'}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs text-neutral-400">
                      <p><strong className="text-white">1. Samenwerking:</strong> Partner meldt auto's aan bij Vlottr. Vlottr beoordeelt geschiktheid.</p>
                      <p><strong className="text-white">2. Inkoop:</strong> Vlottr stelt per voertuig een verkoopprijs vast. Aflossing via % verhuurinkomsten.</p>
                      <p><strong className="text-white">3. Termijnen:</strong> Geschatte aflosperiode 8-9 maanden. Na aflossing gaat eigendom over.</p>
                      <p><strong className="text-white">4. Voorwaarden:</strong> Auto mag geen bekende gebreken vertonen. APK-goedgekeurd.</p>
                      <p><strong className="text-white">5. Beëindiging:</strong> 2 weken opzegtermijn. Lopende aflossingen worden afgemaakt.</p>
                    </div>
                    <p className="text-neutral-500 text-[11px] pt-2 border-t border-white/[0.06]">
                      Door ondertekening gaat de partner akkoord met de dealer-voorwaarden.
                    </p>
                  </div>

                  <div className="p-5 border-t border-white/[0.06]">
                    {dealerSignatureUrl ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-semibold text-sm">Getekend</span>
                        </div>
                        <button onClick={() => { setDealerSignatureUrl(null); setSigningAgreementType('dealer'); setShowSignaturePad(true); }} className="text-xs text-neutral-400 hover:text-white">
                          Opnieuw tekenen
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setSigningAgreementType('dealer'); setShowSignaturePad(true); }}
                        className="w-full px-4 py-2.5 bg-green-500 text-neutral-950 font-bold rounded-lg hover:bg-green-400 transition-colors inline-flex items-center justify-center gap-2 text-sm"
                      >
                        <FileSignature className="w-4 h-4" />
                        Dealer overeenkomst ondertekenen
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Garage Agreement */}
              {needsGarageAgreement && (
                <div className="rounded-xl border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="p-5 border-b border-white/[0.06]" style={{ background: 'linear-gradient(135deg, #1a4d2e 0%, #0f2818 100%)' }}>
                    <p className="text-green-400 text-xs font-bold tracking-widest uppercase mb-1">Vlottr &bull; Buddy BV</p>
                    <h3 className="text-white font-bold text-lg">Garage Overeenkomst</h3>
                    <p className="text-neutral-400 text-xs mt-1">Samenwerking onderhoud &amp; reparatie</p>
                  </div>

                  <div className="p-5 space-y-3 max-h-[300px] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg p-3 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <p className="text-green-400 text-xs font-bold uppercase mb-1">Platform</p>
                        <p className="text-white text-sm font-semibold">Vlottr (Buddy BV)</p>
                      </div>
                      <div className="rounded-lg p-3 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <p className="text-green-400 text-xs font-bold uppercase mb-1">Partner</p>
                        <p className="text-white text-sm font-semibold">{formData.company_name || '—'}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs text-neutral-400">
                      <p><strong className="text-white">1. Samenwerking:</strong> Vlottr maakt gebruik van onderhoudsdiensten van Partner. Vlottr controleert geschiktheid.</p>
                      <p><strong className="text-white">2. Diensten:</strong> Onderhoud, reparatie en APK-keuringen voor Vlottr-voertuigen.</p>
                      <p><strong className="text-white">3. Tarieven:</strong> Marktconforme tarieven. Facturatie via het platform.</p>
                      <p><strong className="text-white">4. Kwaliteit:</strong> Vakkundig werk volgens geldende normen. Vlottr doet kwaliteitscontroles.</p>
                      <p><strong className="text-white">5. Beëindiging:</strong> 2 weken opzegtermijn. Lopende werkzaamheden worden afgerond.</p>
                    </div>
                    <p className="text-neutral-500 text-[11px] pt-2 border-t border-white/[0.06]">
                      Door ondertekening gaat de partner akkoord met de garage-voorwaarden.
                    </p>
                  </div>

                  <div className="p-5 border-t border-white/[0.06]">
                    {garageSignatureUrl ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-semibold text-sm">Getekend</span>
                        </div>
                        <button onClick={() => { setGarageSignatureUrl(null); setSigningAgreementType('garage'); setShowSignaturePad(true); }} className="text-xs text-neutral-400 hover:text-white">
                          Opnieuw tekenen
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setSigningAgreementType('garage'); setShowSignaturePad(true); }}
                        className="w-full px-4 py-2.5 bg-green-500 text-neutral-950 font-bold rounded-lg hover:bg-green-400 transition-colors inline-flex items-center justify-center gap-2 text-sm"
                      >
                        <FileSignature className="w-4 h-4" />
                        Garage overeenkomst ondertekenen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                className="px-4 py-2.5 text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Vorige
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={loading || (currentStep === 3 && !allAgreementsSigned())}
              className="px-6 py-2.5 bg-green-500 text-neutral-950 font-bold rounded-lg hover:bg-green-400 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Bezig...
                </>
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Afronden
                </>
              ) : (
                <>
                  Volgende
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleSignatureSave}
          onCancel={() => setShowSignaturePad(false)}
          title={signingAgreementType === 'dealer' ? 'Dealer overeenkomst ondertekenen' : signingAgreementType === 'garage' ? 'Garage overeenkomst ondertekenen' : 'Overeenkomst ondertekenen'}
        />
      )}
    </div>
  );
};

export default PartnerOnboarding;
