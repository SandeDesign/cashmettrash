import React, { useState, useEffect } from 'react';
import { Building2, Save, Loader2, Upload, Mail, Phone, MapPin, Hash, User, AlertTriangle, X } from 'lucide-react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { usePartnerStore } from '../../store/partnerStore';

const BusinessProfile: React.FC = () => {
  const { user } = useAuth();
  const { initializeAuth } = useAuthStore();
  const { createServiceChangeRequest } = usePartnerStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    company_kvk: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_description: '',
    company_logo: '',
    partner_type: 'dealer' as 'garage' | 'dealer' | 'both',
    offers_maintenance: false,
  });

  // Track original service data to detect changes
  const [originalServiceData, setOriginalServiceData] = useState({
    partner_type: 'dealer' as 'garage' | 'dealer' | 'both',
    offers_maintenance: false,
  });

  // Service change request state
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [changeReason, setChangeReason] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        company_name: user.company_name || '',
        company_kvk: user.company_kvk || '',
        company_address: user.company_address || '',
        company_phone: user.company_phone || user.phone || '',
        company_email: user.company_email || user.email || '',
        company_description: user.company_description || '',
        company_logo: user.company_logo || '',
        partner_type: user.partner_type || 'dealer',
        offers_maintenance: user.offers_maintenance || false,
      });
      setOriginalServiceData({
        partner_type: user.partner_type || 'dealer',
        offers_maintenance: user.offers_maintenance || false,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
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

  const hasServiceChanges = () => {
    return formData.partner_type !== originalServiceData.partner_type ||
      formData.offers_maintenance !== originalServiceData.offers_maintenance;
  };

  const hasPendingServiceChange = !!user?.pending_service_change;

  const handleSave = async () => {
    if (!user) return;

    // Check if service fields changed (and no pending request already)
    if (hasServiceChanges() && !hasPendingServiceChange) {
      setShowChangeRequest(true);
      return;
    }

    await saveNonServiceFields();
  };

  const saveNonServiceFields = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        company_name: formData.company_name,
        company_kvk: formData.company_kvk,
        company_address: formData.company_address,
        company_phone: formData.company_phone,
        company_email: formData.company_email,
        company_description: formData.company_description,
        company_logo: formData.company_logo,
        updated_at: Timestamp.now(),
      });

      await initializeAuth();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving business profile:', err);
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitChangeRequest = async () => {
    if (!user) return;
    if (!changeReason.trim()) {
      setError('Geef een reden op voor de wijziging.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createServiceChangeRequest({
        partner_id: user.uid,
        partner_name: user.name,
        partner_company: user.company_name || user.name,
        current_partner_type: originalServiceData.partner_type,
        requested_partner_type: formData.partner_type,
        current_offers_maintenance: originalServiceData.offers_maintenance,
        requested_offers_maintenance: formData.offers_maintenance,
        current_garage_services: user.garage_services || [],
        requested_garage_services: user.garage_services || [],
        reason: changeReason,
      });

      // Also save non-service fields
      await saveNonServiceFields();

      setShowChangeRequest(false);
      setChangeReason('');
      // Reset service fields to original since the change is pending
      setFormData(prev => ({
        ...prev,
        partner_type: originalServiceData.partner_type,
        offers_maintenance: originalServiceData.offers_maintenance,
      }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error creating service change request:', err);
      setError(err.message || 'Er is een fout opgetreden bij het indienen van het wijzigingsverzoek');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Profiel"
          subtitle="Beheer je persoonlijke en bedrijfsgegevens"
          icon={User}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-2xl mx-auto">

            {/* Pending service change banner */}
            {hasPendingServiceChange && (
              <div className="rounded-xl px-4 py-3 mb-4 border border-yellow-500/20 flex items-center gap-3" style={{ background: 'rgba(234, 179, 8, 0.08)' }}>
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-yellow-400 text-sm">Er staat een wijzigingsverzoek open. Wacht op goedkeuring van de admin.</span>
              </div>
            )}

            {error && (
              <div className="rounded-xl px-4 py-3 mb-4 border border-red-500/20" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-xl px-4 py-3 mb-4 border border-green-500/20" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                <span className="text-green-400 text-sm">Bedrijfsgegevens opgeslagen!</span>
              </div>
            )}

            {/* Personal Info */}
            <div className="vl-card rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Persoonlijke gegevens</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Naam</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="vl-input !pl-12"
                      placeholder="Jouw naam"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">E-mailadres</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="vl-input !pl-12 opacity-50 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">E-mailadres kan niet gewijzigd worden</p>
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="vl-card rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Bedrijfslogo</h2>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl border border-white/[0.08] overflow-hidden flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {formData.company_logo ? (
                    <img src={formData.company_logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="w-10 h-10 text-neutral-600" />
                  )}
                </div>
                <div>
                  <label className="px-4 py-2 bg-green-500 text-neutral-950 font-semibold rounded-lg hover:bg-green-400 transition-colors cursor-pointer inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Logo uploaden
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                  <p className="text-xs text-neutral-500 mt-2">Max 2MB. PNG of JPG. Wordt opgeslagen als base64.</p>
                  {formData.company_logo && (
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, company_logo: '' }))}
                      className="text-xs text-red-400 hover:text-red-300 mt-1"
                    >
                      Logo verwijderen
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="vl-card rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Bedrijfsgegevens</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Bedrijfsnaam</label>
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
                    className={`vl-input ${hasPendingServiceChange ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={hasPendingServiceChange}
                  >
                    <option value="dealer">Autohandelaar</option>
                    <option value="garage">Autogarage</option>
                    <option value="both">Garage & Handelaar</option>
                  </select>
                  {hasPendingServiceChange && (
                    <p className="text-xs text-yellow-500 mt-1">Wijziging in behandeling — wacht op goedkeuring</p>
                  )}
                </div>

                <div>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border border-white/[0.08] transition-colors ${hasPendingServiceChange ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-500/30'}`} style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <input
                      type="checkbox"
                      checked={formData.offers_maintenance}
                      onChange={e => setFormData(prev => ({ ...prev, offers_maintenance: e.target.checked }))}
                      className="w-5 h-5 rounded border-white/20 bg-transparent accent-green-500"
                      disabled={hasPendingServiceChange}
                    />
                    <div>
                      <span className="text-white font-medium text-sm">Ik bied ook onderhoud/werkplaats diensten aan</span>
                      <p className="text-neutral-500 text-xs mt-0.5">Geef bij Werkplaats aan welke diensten je aanbiedt</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">KVK-nummer</label>
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
                  <label className="block text-sm font-medium text-white mb-1.5">Bedrijfsadres</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">Telefoon</label>
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
                    <label className="block text-sm font-medium text-white mb-1.5">E-mail</label>
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Bedrijfsbeschrijving</label>
                  <textarea
                    name="company_description"
                    value={formData.company_description}
                    onChange={handleChange}
                    className="vl-input"
                    rows={4}
                    placeholder="Beschrijf kort je bedrijf en activiteiten..."
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2.5 bg-green-500 text-neutral-950 font-bold rounded-lg hover:bg-green-400 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Opslaan
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />

      {/* Service Change Request Modal */}
      {showChangeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="vl-card rounded-2xl w-full max-w-md border border-white/[0.12] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold text-white">Wijziging diensten aanvragen</h3>
              </div>
              <button onClick={() => { setShowChangeRequest(false); setChangeReason(''); }} className="text-neutral-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-neutral-400 mb-4">
              Je wilt het type partner of onderhoudsdiensten wijzigen. Deze wijziging moet goedgekeurd worden door een admin. Geef hieronder de reden op.
            </p>

            <div className="space-y-3 mb-4 p-3 rounded-lg border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.03)' }}>
              {formData.partner_type !== originalServiceData.partner_type && (
                <div className="text-sm">
                  <span className="text-neutral-500">Type partner:</span>{' '}
                  <span className="text-red-400 line-through">{originalServiceData.partner_type === 'dealer' ? 'Autohandelaar' : originalServiceData.partner_type === 'garage' ? 'Autogarage' : 'Garage & Handelaar'}</span>
                  {' → '}
                  <span className="text-green-400">{formData.partner_type === 'dealer' ? 'Autohandelaar' : formData.partner_type === 'garage' ? 'Autogarage' : 'Garage & Handelaar'}</span>
                </div>
              )}
              {formData.offers_maintenance !== originalServiceData.offers_maintenance && (
                <div className="text-sm">
                  <span className="text-neutral-500">Onderhoud aanbieden:</span>{' '}
                  <span className="text-red-400 line-through">{originalServiceData.offers_maintenance ? 'Ja' : 'Nee'}</span>
                  {' → '}
                  <span className="text-green-400">{formData.offers_maintenance ? 'Ja' : 'Nee'}</span>
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-neutral-400 mb-2">Reden voor wijziging <span className="text-red-400">*</span></label>
              <textarea
                value={changeReason}
                onChange={e => { setChangeReason(e.target.value); setError(null); }}
                rows={3}
                className="vl-input w-full text-sm"
                placeholder="Leg uit waarom je deze wijziging wilt doorvoeren..."
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmitChangeRequest}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-neutral-950 font-semibold hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Verzoek indienen
              </button>
              <button
                onClick={() => { setShowChangeRequest(false); setChangeReason(''); }}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-neutral-400 hover:text-white transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessProfile;
