import React, { useState, useEffect } from 'react';
import { FileText, Upload, Save, Loader2 } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import SignaturePad from '../../components/contract/SignaturePad';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuth } from '../../hooks/useAuth';
import { DEFAULT_CONTRACT_TEMPLATE } from '../../utils/pdf';

const PROXY_URL = 'https://internedata.nl/proxyvlottr.php';

const AdminContractSettings: React.FC = () => {
  const { user } = useAuth();
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const [contractTemplate, setContractTemplate] = useState('');
  const [adminSignatureUrl, setAdminSignatureUrl] = useState('');

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setContractTemplate(settings.contract_template || DEFAULT_CONTRACT_TEMPLATE);
      setAdminSignatureUrl(settings.admin_signature_url || '');
    }
  }, [settings]);

  const handleSignatureSave = async (signatureDataUrl: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[Admin Signature] Saving as base64 directly');
      console.log('[Admin Signature] Data URL length:', signatureDataUrl.length);

      setAdminSignatureUrl(signatureDataUrl);
      setShowSignaturePad(false);
      setSuccess('Handtekening opgeslagen als base64! Vergeet niet op "Instellingen opslaan" te klikken.');
    } catch (err: any) {
      setError(err.message || 'Opslaan gefaald');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateSettings({
        contract_template: contractTemplate,
        admin_signature_url: adminSignatureUrl,
      }, user.uid);

      setSuccess('Instellingen opgeslagen!');
    } catch (err: any) {
      setError(err.message || 'Opslaan gefaald');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Contract Instellingen"
          subtitle="Beheer handtekening en contract template"
          icon={FileText}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-4xl mx-auto">

            {/* Error Message */}
            {error && (
              <div className="rounded-xl px-4 py-3 mb-4 border border-red-500/20" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-xl px-4 py-3 mb-4 border border-green-500/20" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                <span className="text-green-400 text-sm">{success}</span>
              </div>
            )}

            {/* Admin Signature */}
            <div className="vl-card vl-card-accent rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Admin Handtekening (Vlottr)
              </h2>

              {adminSignatureUrl ? (
                <div>
                  <div className="rounded-xl p-4 mb-4 max-w-md border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <img
                      src={adminSignatureUrl}
                      alt="Admin handtekening"
                      className="max-h-32 mx-auto"
                    />
                  </div>
                  <button
                    onClick={() => setShowSignaturePad(true)}
                    className="px-4 py-2 bg-green-500 text-neutral-950 font-semibold rounded-lg hover:bg-green-400 transition-colors"
                  >
                    Handtekening wijzigen
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSignaturePad(true)}
                  className="px-4 py-2 bg-green-500 text-neutral-950 font-semibold rounded-lg hover:bg-green-400 transition-colors flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Handtekening toevoegen
                </button>
              )}
            </div>

            {/* Contract Template */}
            <div className="vl-card vl-card-accent rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Contract Template
              </h2>

              <div className="mb-4">
                <p className="text-sm text-neutral-500 mb-3">
                  Beschikbare variabelen:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    '{contract_id}',
                    '{customer_name}',
                    '{customer_email}',
                    '{customer_phone}',
                    '{car_info}',
                    '{license_plate}',
                    '{start_date}',
                    '{end_date}',
                    '{weeks_rented}',
                    '{weekly_rate}',
                    '{total_price}',
                    '{current_date}',
                    '{customer_license_number}',
                    '{customer_license_category}',
                    '{customer_license_expiry}',
                    '{customer_license_issue_date}',
                  ].map(variable => (
                    <code
                      key={variable}
                      className="px-2.5 py-1 rounded-md text-xs font-mono text-green-400 border border-green-500/20"
                      style={{ background: 'rgba(34, 197, 94, 0.08)' }}
                    >
                      {variable}
                    </code>
                  ))}
                </div>
              </div>

              <textarea
                value={contractTemplate}
                onChange={(e) => setContractTemplate(e.target.value)}
                rows={20}
                className="w-full px-4 py-3 rounded-xl font-mono text-sm text-neutral-300 placeholder-neutral-600 border border-white/[0.08] focus:border-green-500/30 focus:ring-2 focus:ring-green-500/10 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.03)' }}
                placeholder="HTML contract template..."
              />

              <button
                onClick={() => setContractTemplate(DEFAULT_CONTRACT_TEMPLATE)}
                className="mt-3 text-sm text-green-400 hover:text-green-300 hover:underline transition-colors"
              >
                Herstel standaard template
              </button>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
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
                    Instellingen opslaan
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleSignatureSave}
          onCancel={() => setShowSignaturePad(false)}
          loading={loading}
          backgroundColor="#000000"
          penColor="#22c55e"
          title="Admin Handtekening (Vlottr)"
        />
      )}
    </div>
  );
};

export default AdminContractSettings;