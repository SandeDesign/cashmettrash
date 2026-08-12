import React, { useState, useEffect } from 'react';
import { Settings, Save, Globe, Mail, Shield, Database, Bell, Palette, CreditCard, Upload, MapPin, Plus, Pencil, Trash2, Check, X, FileText, Eye } from 'lucide-react';
import SignaturePad from '../../components/contract/SignaturePad';
import { DEFAULT_CONTRACT_TEMPLATE } from '../../utils/pdf';
import { useEmailTemplatesStore } from '../../store/emailTemplatesStore';
import { EmailTemplateId } from '../../types';
import { RentalLocation } from '../../types';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuth } from '../../hooks/useAuth';

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const { settings, loadSettings, updateSettings, loading } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    stripe_publishable_key: '',
    stripe_price_id_basic: '',
    stripe_price_id_half_year: '',
    stripe_price_id_year: '',
    stripe_price_id_borg: '',
    stripe_price_id_bezorgkosten: '',
    stripe_proxy_url: '',
    stripe_checkout_proxy_url: '',
    upload_proxy_url: '',
    weekly_rental_rate: 70,
    minimum_rental_weeks: 4,
    borg_amount: 500,
  });
  const [locations, setLocations] = useState<RentalLocation[]>([]);
  const [locationForm, setLocationForm] = useState<{ name: string; address: string }>({ name: '', address: '' });
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Contract instellingen state
  const [contractTemplate, setContractTemplate] = useState('');
  const [adminSignatureUrl, setAdminSignatureUrl] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSavingContract, setIsSavingContract] = useState(false);
  const [contractSaveMsg, setContractSaveMsg] = useState('');

  // Email templates
  const { templates: emailTemplates, loadTemplates, saveTemplate } = useEmailTemplatesStore();
  const [activeTemplateId, setActiveTemplateId] = useState<EmailTemplateId>('ophalen');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateSaveMsg, setTemplateSaveMsg] = useState('');

  useEffect(() => {
    loadSettings();
    loadTemplates();
  }, [loadSettings, loadTemplates]);

  useEffect(() => {
    if (settings) {
      setContractTemplate(settings.contract_template || DEFAULT_CONTRACT_TEMPLATE);
      setAdminSignatureUrl(settings.admin_signature_url || '');
      setFormData({
        stripe_publishable_key: settings.stripe_publishable_key,
        stripe_price_id_basic: settings.stripe_price_id_basic || '',
        stripe_price_id_half_year: settings.stripe_price_id_half_year || '',
        stripe_price_id_year: settings.stripe_price_id_year || '',
        stripe_price_id_borg: settings.stripe_price_id_borg || '',
        stripe_price_id_bezorgkosten: settings.stripe_price_id_bezorgkosten || '',
        stripe_proxy_url: settings.stripe_proxy_url || '',
        stripe_checkout_proxy_url: settings.stripe_checkout_proxy_url || '',
        upload_proxy_url: settings.upload_proxy_url,
        weekly_rental_rate: settings.weekly_rental_rate,
        minimum_rental_weeks: settings.minimum_rental_weeks,
        borg_amount: settings.borg_amount ?? 500,
      });
      setLocations(settings.locations ?? []);
    }
  }, [settings]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveMessage('');
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      await updateSettings({ ...formData, locations }, user.uid);
      setSaveMessage('Instellingen succesvol opgeslagen!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Fout bij opslaan instellingen');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLocation = () => {
    if (!locationForm.name.trim()) return;
    const newLocation: RentalLocation = {
      id: `loc_${Date.now()}`,
      name: locationForm.name.trim(),
      address: locationForm.address.trim() || undefined,
      active: true,
    };
    const updated = [...locations, newLocation];
    setLocations(updated);
    setLocationForm({ name: '', address: '' });
    if (user) updateSettings({ locations: updated }, user.uid);
  };

  const handleUpdateLocation = (id: string) => {
    if (!locationForm.name.trim()) return;
    const updated = locations.map(l =>
      l.id === id ? { ...l, name: locationForm.name.trim(), address: locationForm.address.trim() || undefined } : l
    );
    setLocations(updated);
    setEditingLocationId(null);
    setLocationForm({ name: '', address: '' });
    if (user) updateSettings({ locations: updated }, user.uid);
  };

  const handleToggleLocation = (id: string) => {
    const updated = locations.map(l => l.id === id ? { ...l, active: !l.active } : l);
    setLocations(updated);
    if (user) updateSettings({ locations: updated }, user.uid);
  };

  const handleDeleteLocation = (id: string) => {
    const updated = locations.filter(l => l.id !== id);
    setLocations(updated);
    if (user) updateSettings({ locations: updated }, user.uid);
  };

  const startEditLocation = (loc: RentalLocation) => {
    setEditingLocationId(loc.id);
    setLocationForm({ name: loc.name, address: loc.address || '' });
  };

  // Sync editor when switching template or when templates load
  useEffect(() => {
    const t = emailTemplates?.[activeTemplateId];
    if (t) {
      setTemplateSubject(t.subject);
      setTemplateBody(t.body_html);
    }
  }, [activeTemplateId, emailTemplates]);

  const handleSaveTemplate = async () => {
    if (!user) return;
    setIsSavingTemplate(true);
    setTemplateSaveMsg('');
    try {
      await saveTemplate(activeTemplateId, templateSubject, templateBody, user.uid);
      setTemplateSaveMsg('Sjabloon opgeslagen!');
      setTimeout(() => setTemplateSaveMsg(''), 3000);
    } catch {
      setTemplateSaveMsg('Fout bij opslaan.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleSaveContractSettings = async () => {
    if (!user) return;
    setIsSavingContract(true);
    setContractSaveMsg('');
    try {
      await updateSettings({ contract_template: contractTemplate, admin_signature_url: adminSignatureUrl }, user.uid);
      setContractSaveMsg('Instellingen opgeslagen!');
      setTimeout(() => setContractSaveMsg(''), 3000);
    } catch {
      setContractSaveMsg('Fout bij opslaan.');
    } finally {
      setIsSavingContract(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Algemeen', icon: Settings },
    { id: 'locations', label: 'Locaties', icon: MapPin },
    { id: 'payment', label: 'Betaling', icon: CreditCard },
    { id: 'upload', label: 'Uploads', icon: Upload },
    { id: 'email', label: 'E-mail', icon: Mail },
    { id: 'sjablonen', label: 'Sjablonen', icon: FileText },
    { id: 'security', label: 'Beveiliging', icon: Shield },
    { id: 'contracten', label: 'Contracten', icon: FileText },
  ];

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Instellingen" />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar Tabs */}
              <div className="lg:w-64">
                <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-4">
                  <nav className="space-y-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-500/10 text-green-400 border-r-2 border-blue-500'
                            : 'text-neutral-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <tab.icon className="w-4 h-4 mr-3" />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1">
                <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6">
                  {activeTab === 'general' && (
                    <div>
                      <h2 className="text-lg font-medium text-white mb-4">Verhuurinstellingen</h2>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Minimale verhuurperiode (weken)
                          </label>
                          <input
                            type="number"
                            value={formData.minimum_rental_weeks}
                            onChange={(e) => handleChange('minimum_rental_weeks', parseInt(e.target.value))}
                            min="1"
                            className="vl-input"
                          />
                          <p className="mt-1 text-sm text-neutral-500">
                            Het minimum aantal weken dat een auto gehuurd moet worden
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Week tarief (€)
                          </label>
                          <input
                            type="number"
                            value={formData.weekly_rental_rate}
                            onChange={(e) => handleChange('weekly_rental_rate', parseInt(e.target.value))}
                            min="1"
                            step="1"
                            className="vl-input"
                          />
                          <p className="mt-1 text-sm text-neutral-500">
                            Het standaard tarief per week voor autoverhuur
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Waarborgsom / Borg (€)
                          </label>
                          <input
                            type="number"
                            value={formData.borg_amount}
                            onChange={(e) => handleChange('borg_amount', parseInt(e.target.value))}
                            min="0"
                            step="50"
                            className="vl-input"
                          />
                          <p className="mt-1 text-sm text-neutral-500">
                            Klant kiest bij de boeking hoe de borg betaald wordt (contant, pin of Stripe). Bij contant/pin ziet de manager/admin een melding.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'locations' && (
                    <div>
                      <h2 className="text-lg font-medium text-white mb-1">Ophaal- en bezorglocaties</h2>
                      <p className="text-sm text-neutral-500 mb-6">Klanten kiezen bij de boeking of ze de auto ophalen op een van deze locaties, of dat de auto bezorgd wordt.</p>

                      {/* Add / edit form */}
                      <div className="vl-card bg-black/20 rounded-lg border border-white/[0.08] p-4 mb-6">
                        <p className="text-sm font-medium text-neutral-300 mb-3">
                          {editingLocationId ? 'Locatie bewerken' : 'Nieuwe locatie toevoegen'}
                        </p>
                        <div className="flex flex-col gap-3">
                          <input
                            type="text"
                            placeholder="Naam (bijv. Amsterdam Centrum)"
                            value={locationForm.name}
                            onChange={e => setLocationForm(prev => ({ ...prev, name: e.target.value }))}
                            className="vl-input"
                          />
                          <input
                            type="text"
                            placeholder="Adres (optioneel)"
                            value={locationForm.address}
                            onChange={e => setLocationForm(prev => ({ ...prev, address: e.target.value }))}
                            className="vl-input"
                          />
                          <div className="flex gap-2">
                            {editingLocationId ? (
                              <>
                                <button
                                  onClick={() => handleUpdateLocation(editingLocationId)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                                >
                                  <Check className="w-4 h-4" /> Opslaan
                                </button>
                                <button
                                  onClick={() => { setEditingLocationId(null); setLocationForm({ name: '', address: '' }); }}
                                  className="px-4 py-2 border border-white/10 text-neutral-400 text-sm rounded-md hover:text-white transition-colors"
                                >
                                  Annuleren
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={handleAddLocation}
                                disabled={!locationForm.name.trim()}
                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors disabled:opacity-40"
                              >
                                <Plus className="w-4 h-4" /> Toevoegen
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Location list */}
                      {locations.length === 0 ? (
                        <div className="text-center py-10 text-neutral-500">
                          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
                          <p>Nog geen locaties toegevoegd</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {locations.map(loc => (
                            <div key={loc.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${loc.active ? 'border-white/[0.1] bg-black/10' : 'border-white/[0.05] bg-black/5 opacity-50'}`}>
                              <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{loc.name}</p>
                                {loc.address && <p className="text-xs text-neutral-500 truncate">{loc.address}</p>}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleToggleLocation(loc.id)}
                                  title={loc.active ? 'Deactiveren' : 'Activeren'}
                                  className={`px-2 py-1 text-xs rounded border transition-colors ${loc.active ? 'border-green-500/30 text-green-400 hover:bg-green-900/20' : 'border-white/10 text-neutral-500 hover:text-white'}`}
                                >
                                  {loc.active ? 'Actief' : 'Inactief'}
                                </button>
                                <button
                                  onClick={() => startEditLocation(loc)}
                                  className="p-1.5 text-neutral-500 hover:text-white transition-colors"
                                  title="Bewerken"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLocation(loc.id)}
                                  className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                                  title="Verwijderen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'payment' && (
                    <div>
                      <h2 className="text-lg font-medium text-white mb-4">Stripe betaalinstellingen</h2>
                      <div className="space-y-6">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 mb-4">
                          <p className="text-sm text-blue-400">
                            <strong>Let op:</strong> De Stripe integratie werkt via proxy servers.
                            Zorg dat de proxy URL's correct zijn ingesteld.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Stripe Publishable Key
                          </label>
                          <input
                            type="text"
                            value={formData.stripe_publishable_key}
                            onChange={(e) => handleChange('stripe_publishable_key', e.target.value)}
                            placeholder="pk_test_..."
                            className="vl-input font-mono text-sm"
                          />
                          <p className="mt-1 text-sm text-neutral-500">
                            Haal deze op via{' '}
                            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                              Stripe Dashboard
                            </a>
                          </p>
                        </div>

                        <div className="border border-white/10 rounded-lg p-4 space-y-4">
                          <h3 className="text-sm font-semibold text-neutral-200">Stripe Price IDs — Abonnementen</h3>
                          <p className="text-xs text-neutral-500">
                            Recurring weekly price IDs uit{' '}
                            <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                              Stripe Dashboard &rsaquo; Products
                            </a>
                            . Maak voor elk plan een apart product met wekelijkse terugkerende prijs.
                          </p>

                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">
                              Basis — €140/week
                            </label>
                            <input
                              type="text"
                              value={formData.stripe_price_id_basic}
                              onChange={(e) => handleChange('stripe_price_id_basic', e.target.value)}
                              placeholder="price_1abc..."
                              className="vl-input font-mono text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">
                              Half jaar — €105/week
                            </label>
                            <input
                              type="text"
                              value={formData.stripe_price_id_half_year}
                              onChange={(e) => handleChange('stripe_price_id_half_year', e.target.value)}
                              placeholder="price_2def..."
                              className="vl-input font-mono text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">
                              Jaar — €85/week
                            </label>
                            <input
                              type="text"
                              value={formData.stripe_price_id_year}
                              onChange={(e) => handleChange('stripe_price_id_year', e.target.value)}
                              placeholder="price_3ghi..."
                              className="vl-input font-mono text-sm"
                            />
                          </div>
                        </div>

                        <div className="border border-white/10 rounded-lg p-4 space-y-4">
                          <h3 className="text-sm font-semibold text-neutral-200">Stripe Price IDs — Eenmalige betalingen</h3>
                          <p className="text-xs text-neutral-500">
                            Optionele Stripe price IDs voor borg en bezorgkosten.
                            Als ingevuld, wordt de Stripe product-ID meegestuurd.
                            Laat leeg om een dynamisch bedrag te gebruiken.
                          </p>

                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">
                              Waarborgsom (eenmalig)
                            </label>
                            <input
                              type="text"
                              value={formData.stripe_price_id_borg}
                              onChange={(e) => handleChange('stripe_price_id_borg', e.target.value)}
                              placeholder="price_borg..."
                              className="vl-input font-mono text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">
                              Bezorgkosten (eenmalig)
                            </label>
                            <input
                              type="text"
                              value={formData.stripe_price_id_bezorgkosten}
                              onChange={(e) => handleChange('stripe_price_id_bezorgkosten', e.target.value)}
                              placeholder="price_bezorg..."
                              className="vl-input font-mono text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Stripe Proxy URL (SEPA)
                          </label>
                          <input
                            type="url"
                            value={formData.stripe_proxy_url}
                            onChange={(e) => handleChange('stripe_proxy_url', e.target.value)}
                            placeholder="https://example.com/stripe-proxy.php"
                            className="vl-input font-mono text-sm"
                          />
                          <p className="mt-1 text-sm text-neutral-500">
                            URL voor de SEPA Direct Debit proxy
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Stripe Checkout Proxy URL
                          </label>
                          <input
                            type="url"
                            value={formData.stripe_checkout_proxy_url}
                            onChange={(e) => handleChange('stripe_checkout_proxy_url', e.target.value)}
                            placeholder="https://example.com/checkout.php"
                            className="vl-input font-mono text-sm"
                          />
                          <p className="mt-1 text-sm text-neutral-500">
                            URL voor de Stripe Checkout proxy
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'upload' && (
                    <div>
                      <h2 className="text-lg font-medium text-white mb-4">Upload instellingen</h2>
                      <div className="space-y-6">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 mb-4">
                          <p className="text-sm text-blue-400">
                            <strong>Let op:</strong> Uploads voor rijbewijzen en andere bestanden
                            worden via een externe proxy server afgehandeld voor veiligheid.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Upload Proxy URL
                          </label>
                          <input
                            type="url"
                            value={formData.upload_proxy_url}
                            onChange={(e) => handleChange('upload_proxy_url', e.target.value)}
                            placeholder="https://example.com/proxyvlottr.php"
                            className="vl-input font-mono text-sm"
                          />
                          <p className="mt-1 text-sm text-neutral-500">
                            URL voor de upload proxy (rijbewijs uploads)
                          </p>
                        </div>

                        <div className="bg-[var(--vl-bg-primary)] border border-white/[0.1] rounded-md p-4">
                          <h4 className="font-medium text-white mb-2">Upload beperkingen</h4>
                          <ul className="text-sm text-neutral-500 space-y-1">
                            <li>• Maximale bestandsgrootte: 10MB</li>
                            <li>• Toegestane formaten: JPG, PNG, WebP, HEIC</li>
                            <li>• OCR verwerking: Client-side via Tesseract.js</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'email' && (
                    <div>
                      <h2 className="text-lg font-medium text-white mb-4">E-mail instellingen</h2>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            SMTP Server
                          </label>
                          <input
                            type="text"
                            placeholder="smtp.gmail.com"
                            className="vl-input"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                              Poort
                            </label>
                            <input
                              type="number"
                              placeholder="587"
                              className="vl-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                              Beveiliging
                            </label>
                            <select className="vl-input">
                              <option>TLS</option>
                              <option>SSL</option>
                              <option>Geen</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Gebruikersnaam
                          </label>
                          <input
                            type="text"
                            className="vl-input"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Wachtwoord
                          </label>
                          <input
                            type="password"
                            className="vl-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div>
                      <h2 className="text-lg font-medium text-white mb-4">Beveiligingsinstellingen</h2>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 border border-white/[0.1] rounded-lg">
                          <div>
                            <h3 className="font-medium text-white">Twee-factor authenticatie</h3>
                            <p className="text-sm text-neutral-500">Verplicht 2FA voor alle admin accounts</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:vl-card after:border-white/[0.1] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-white/[0.1] rounded-lg">
                          <div>
                            <h3 className="font-medium text-white">Automatische account verificatie</h3>
                            <p className="text-sm text-neutral-500">Nieuwe accounts automatisch goedkeuren</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:vl-card after:border-white/[0.1] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Sessie timeout (minuten)
                          </label>
                          <input
                            type="number"
                            defaultValue="60"
                            className="vl-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sjablonen tab */}
                  {activeTab === 'sjablonen' && (
                    <div>
                      <h2 className="text-lg font-medium text-white mb-1">E-mail Sjablonen</h2>
                      <p className="text-sm text-neutral-400 mb-6">
                        Beheer de HTML-sjablonen die gebruikt worden voor automatische e-mails.
                        Gebruik <code className="text-green-400 bg-white/5 px-1 rounded">{'{{variabele}}'}</code> voor dynamische waarden.
                      </p>
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Template selector */}
                        <div className="lg:w-48 flex lg:flex-col gap-2">
                          {(['ophalen', 'ontvangen', 'borg', 'bezorgkosten', 'vastzetperiode_6_maanden', 'vastzetperiode_12_maanden'] as EmailTemplateId[]).map((id) => {
                            const labels: Record<EmailTemplateId, string> = {
                              ophalen: 'Ophalen',
                              ontvangen: 'Ontvangen',
                              borg: 'Waarborgsom',
                              bezorgkosten: 'Bezorgkosten',
                              vastzetperiode_6_maanden: 'Vastzetperiode 6 mnd',
                              vastzetperiode_12_maanden: 'Vastzetperiode 12 mnd',
                            };
                            return (
                              <button
                                key={id}
                                onClick={() => { setActiveTemplateId(id); setShowTemplatePreview(false); }}
                                className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                  activeTemplateId === id
                                    ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                                    : 'text-neutral-300 hover:bg-white/5'
                                }`}
                              >
                                {labels[id]}
                              </button>
                            );
                          })}
                        </div>

                        {/* Editor */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Onderwerp</label>
                            <input
                              type="text"
                              value={templateSubject}
                              onChange={(e) => setTemplateSubject(e.target.value)}
                              className="vl-input w-full"
                              placeholder="E-mail onderwerpregel"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-sm font-medium text-neutral-300">HTML inhoud</label>
                              <button
                                onClick={() => setShowTemplatePreview(!showTemplatePreview)}
                                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {showTemplatePreview ? 'Editor' : 'Preview'}
                              </button>
                            </div>
                            {showTemplatePreview ? (
                              <iframe
                                srcDoc={templateBody}
                                className="w-full rounded-lg border border-white/10 bg-white"
                                style={{ height: '380px' }}
                                title="Preview"
                              />
                            ) : (
                              <textarea
                                value={templateBody}
                                onChange={(e) => setTemplateBody(e.target.value)}
                                rows={16}
                                className="vl-textarea w-full font-mono text-xs"
                                placeholder="Voer hier uw HTML sjabloon in..."
                                spellCheck={false}
                              />
                            )}
                          </div>

                          {/* Variables reference */}
                          <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-md">
                            <p className="text-xs text-neutral-400 mb-2 font-medium">Beschikbare variabelen:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {['{{customer_name}}', '{{car_name}}', '{{pickup_location}}', '{{pickup_date}}', '{{return_date}}', '{{amount}}', '{{payment_url}}'].map((v) => (
                                <code
                                  key={v}
                                  onClick={() => setTemplateBody((b) => b + v)}
                                  className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded cursor-pointer hover:bg-green-500/20 transition-colors"
                                  title="Klik om in te voegen"
                                >
                                  {v}
                                </code>
                              ))}
                            </div>
                          </div>

                          {templateSaveMsg && (
                            <p className={`text-sm ${templateSaveMsg.includes('Fout') ? 'text-red-400' : 'text-green-400'}`}>
                              {templateSaveMsg}
                            </p>
                          )}

                          <button
                            onClick={handleSaveTemplate}
                            disabled={isSavingTemplate}
                            className="flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded-md hover:bg-green-400 transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            {isSavingTemplate ? 'Opslaan...' : 'Sjabloon opslaan'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contract instellingen tab */}
                  {activeTab === 'contracten' && (
                    <div>
                      <h2 className="text-lg font-medium text-white mb-1">Contract Instellingen</h2>
                      <p className="text-sm text-neutral-500 mb-6">Beheer de admin-handtekening en het contract-template.</p>

                      {/* Admin handtekening */}
                      <div className="vl-card vl-card-accent rounded-xl p-6 mb-6">
                        <h3 className="text-base font-semibold text-white mb-4">Admin Handtekening (Vlottr)</h3>
                        {adminSignatureUrl ? (
                          <div>
                            <div className="rounded-xl p-4 mb-4 max-w-md border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                              <img src={adminSignatureUrl} alt="Admin handtekening" className="max-h-32 mx-auto" />
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
                            className="px-4 py-2 bg-green-500 text-neutral-950 font-semibold rounded-lg hover:bg-green-400 transition-colors flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Handtekening toevoegen
                          </button>
                        )}
                      </div>

                      {/* Contract template */}
                      <div className="vl-card vl-card-accent rounded-xl p-6 mb-6">
                        <h3 className="text-base font-semibold text-white mb-4">Contract Template</h3>
                        <div className="mb-4">
                          <p className="text-sm text-neutral-500 mb-3">Beschikbare variabelen:</p>
                          <div className="flex flex-wrap gap-2">
                            {['{contract_id}','{customer_name}','{customer_email}','{customer_phone}','{car_info}','{license_plate}','{start_date}','{end_date}','{weeks_rented}','{weekly_rate}','{total_price}','{current_date}'].map(v => (
                              <code key={v} className="px-2.5 py-1 rounded-md text-xs font-mono text-green-400 border border-green-500/20" style={{ background: 'rgba(34,197,94,0.08)' }}>
                                {v}
                              </code>
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={contractTemplate}
                          onChange={e => setContractTemplate(e.target.value)}
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

                      {contractSaveMsg && (
                        <p className={`text-sm mb-4 ${contractSaveMsg.includes('Fout') ? 'text-red-400' : 'text-green-400'}`}>
                          {contractSaveMsg}
                        </p>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveContractSettings}
                          disabled={isSavingContract}
                          className="px-6 py-2.5 bg-green-500 text-neutral-950 font-bold rounded-lg hover:bg-green-400 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {isSavingContract ? (
                            <><span className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />Bezig...</>
                          ) : (
                            <><Save className="w-4 h-4" />Instellingen opslaan</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Other tabs content would go here */}
                  {activeTab !== 'general' && activeTab !== 'payment' && activeTab !== 'upload' && activeTab !== 'email' && activeTab !== 'security' && activeTab !== 'sjablonen' && activeTab !== 'contracten' && (
                    <div className="text-center py-12">
                      <Settings className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">
                        {tabs.find(tab => tab.id === activeTab)?.label} instellingen
                      </h3>
                      <p className="text-neutral-500">
                        Deze sectie wordt binnenkort beschikbaar.
                      </p>
                    </div>
                  )}

                  {/* Save Button */}
                  {(activeTab === 'general' || activeTab === 'payment' || activeTab === 'upload') && !editingLocationId && (
                    <div className="mt-8 pt-6 border-t border-white/[0.1]">
                      {saveMessage && (
                        <div className={`mb-4 p-3 rounded-md ${
                          saveMessage.includes('succes')
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}>
                          {saveMessage}
                        </div>
                      )}
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-400 transition-colors flex items-center disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Bezig met opslaan...' : 'Instellingen opslaan'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />

      {/* Signature Pad Modal (voor Contract Instellingen tab) */}
      {showSignaturePad && (
        <SignaturePad
          onSave={signatureDataUrl => {
            setAdminSignatureUrl(signatureDataUrl);
            setShowSignaturePad(false);
          }}
          onCancel={() => setShowSignaturePad(false)}
          loading={isSavingContract}
          backgroundColor="#000000"
          penColor="#22c55e"
          title="Admin Handtekening (Vlottr)"
        />
      )}
    </div>
  );
};

export default AdminSettings;