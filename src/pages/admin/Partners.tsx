import React, { useEffect, useState } from 'react';
import { Handshake, CheckCircle, XCircle, Clock, Building2, Eye, FileText, Loader2, ChevronDown, AlertTriangle, Send, UserCheck, Mail, Phone, List, RefreshCw } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { usePartnerStore } from '../../store/partnerStore';
import { useSettingsStore } from '../../store/settingsStore';
import { User, PartnerContract, ServiceChangeRequest } from '../../types';
import { sendPartnerWizardReminderEmail } from '../../utils/email';
import { logActivity } from '../../utils/activityLogger';

export const AUTO_INKOOP_CONTRACT_TEMPLATE = `
<div style="font-family: 'Outfit', Arial, sans-serif; width: 800px; background: #000000; color: #ffffff;">
  <!-- PAGE 1 -->
  <div style="min-height: 1050px; background: #000000; position: relative; overflow: hidden;">

    <!-- Dark Green Gradient Header -->
    <div style="background: linear-gradient(135deg, #1a4d2e 0%, #0f2818 100%); padding: 60px 50px; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 20px; left: 50px; display: flex; gap: 6px;">
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #22c55e;"></div>
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #22c55e; opacity: 0.6;"></div>
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #22c55e; opacity: 0.3;"></div>
      </div>
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 100px; height: 100px; margin: 0 auto; background: #22c55e; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.4); overflow: hidden;">
          <span style="font-size: 64px; font-weight: 900; color: #000000; line-height: 1;">V</span>
        </div>
      </div>
      <h1 style="text-align: center; color: #ffffff; font-weight: 900; font-size: 38px; margin: 0 0 10px 0; letter-spacing: -1px;">INKOOPOVEREENKOMST</h1>
      <p style="text-align: center; color: rgba(255,255,255,0.6); margin: 0; font-family: 'Space Mono', monospace; font-size: 13px; letter-spacing: 2px;">
        VOERTUIG AANKOOP
      </p>
    </div>

    <!-- Content -->
    <div style="background: #000000; padding: 50px; position: relative; min-height: 580px;">
      <div style="position: absolute; right: -200px; top: 50%; transform: translateY(-50%); width: 500px; height: 500px; border-radius: 50%; border: 3px solid #22c55e; opacity: 0.15;"></div>

      <div style="position: relative; z-index: 2;">
        <!-- Partijen -->
        <div style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Platform</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">Vlottr</strong><br/>
              Handelend namens: Buddy BV<br/>
              Regio: Zuid-Limburg
            </p>
          </div>
        </div>

        <div style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Verkoper</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">{partner_company}</strong><br/>
              Contactpersoon: {partner_name}<br/>
              Email: {partner_email}
            </p>
          </div>
        </div>

        <!-- Voertuig -->
        <div style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Voertuig</h2>
          </div>
          <div style="background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.15); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">Auto:</strong> {car_info}<br/>
              <strong style="color: #22c55e;">Kenteken:</strong> {license_plate}<br/>
              <strong style="color: #22c55e;">Inkoopprijs:</strong> &euro;{purchase_price}<br/>
              <strong style="color: #22c55e;">Aflossing:</strong> {repayment_percentage}% van verhuurinkomsten
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- PAGE 2 - ARTIKELEN -->
  <div style="min-height: 1050px; background: #000000; padding: 50px; position: relative;">
    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px; margin-bottom: 40px;">
      <p style="color: rgba(255,255,255,0.8); line-height: 1.8; margin: 0; font-size: 14px;">

        <strong style="color: #22c55e; font-size: 15px;">Artikel 1 — Overeenkomst</strong><br/>
        Verkoper verkoopt het beschreven voertuig aan Vlottr (Buddy BV) voor de verhuurvloot. Vlottr koopt het voertuig in tegen de vastgestelde verkoopprijs van &euro;{purchase_price}.<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">Artikel 2 — Betaling in Termijnen</strong><br/>
        De verkoopprijs wordt afgelost via {repayment_percentage}% van de maandelijkse verhuurinkomsten. Bij volledige verhuur is de geschatte aflosperiode 8 tot 9 maanden. Verkoper gaat akkoord met deze termijnbetaling.<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">Artikel 3 — Eigendomsoverdracht</strong><br/>
        Voertuig blijft eigendom van Verkoper tot volledige aflossing. Na aflossing gaat eigendom over naar Vlottr (Buddy BV). Verkoper werkt mee aan formaliteiten.<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">Artikel 4 — Staat Voertuig</strong><br/>
        Verkoper verklaart dat het voertuig geen op voorhand bekende gebreken vertoont. Voertuig is APK-goedgekeurd bij overdracht. Bij verzwegen gebreken kan Vlottr ontbinden en terugvorderen.<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">Artikel 5 — Verzekering &amp; Onderhoud</strong><br/>
        Vlottr zorgt voor verzekering. Onderhoud bij Vlottr-partnergarages conform marktprijzen. Kosten voor Vlottr.<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">Artikel 6 — Looptijd</strong><br/>
        Ingaand op ondertekening. Loopt tot volledige aflossing. Bij vroegtijdige beëindiging wordt restbedrag ineens voldaan.
      </p>
    </div>

    <!-- Handtekeningen -->
    <div style="display: flex; gap: 35px; justify-content: space-between;">
      <div style="flex: 1; max-width: 340px;">
        <div style="background: #000000; border: 2px solid #22c55e; border-radius: 20px; padding: 28px; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.2);">
          <p style="margin: 0 0 18px 0; color: #22c55e; font-weight: 800; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">Handtekening Vlottr</p>
          <div style="border-bottom: 3px solid #22c55e; padding-bottom: 8px; margin-bottom: 14px; min-height: 80px; display: flex; align-items: center; justify-content: center; background: #000000;">{admin_signature}</div>
          <p style="margin: 8px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;"><strong style="color: #22c55e;">Namens:</strong> Vlottr (Buddy BV)</p>
          <p style="margin: 6px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;"><strong style="color: #22c55e;">Datum:</strong> {current_date}</p>
        </div>
      </div>
      <div style="flex: 1; max-width: 340px;">
        <div style="background: #000000; border: 2px solid #22c55e; border-radius: 20px; padding: 28px; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.2);">
          <p style="margin: 0 0 18px 0; color: #22c55e; font-weight: 800; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">Handtekening Verkoper</p>
          <div style="border-bottom: 3px solid #22c55e; padding-bottom: 8px; margin-bottom: 14px; min-height: 80px; display: flex; align-items: center; justify-content: center; background: #000000;">{partner_signature}</div>
          <p style="margin: 8px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;"><strong style="color: #22c55e;">Namens:</strong> {partner_company}</p>
          <p style="margin: 6px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;"><strong style="color: #22c55e;">Datum:</strong> {current_date}</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 50px; padding: 30px 0; text-align: center; border-top: 1px solid rgba(34, 197, 94, 0.1);">
      <p style="margin: 0; color: #22c55e; font-weight: 900; font-size: 24px; letter-spacing: -0.5px;">VLOTTR</p>
      <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.4); font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 2px;">INKOOPOVEREENKOMST • BUDDY BV • ZUID-LIMBURG • {current_date}</p>
    </div>
  </div>
</div>
`;

export interface PartnerContractVars {
  partner_company: string;
  partner_name: string;
  partner_email: string;
  car_info?: string;
  license_plate?: string;
  purchase_price?: string;
  repayment_percentage?: string;
  current_date?: string;
  admin_signature?: string;
  partner_signature?: string;
}

export const generatePartnerContractHtml = (vars: PartnerContractVars): string => {
  const variables: Record<string, string> = {
    partner_company: vars.partner_company,
    partner_name: vars.partner_name,
    partner_email: vars.partner_email,
    car_info: vars.car_info || 'Nader te bepalen',
    license_plate: vars.license_plate || 'Nader te bepalen',
    purchase_price: vars.purchase_price || '1.500',
    repayment_percentage: vars.repayment_percentage || 'Nader te bepalen',
    current_date: vars.current_date || new Date().toLocaleDateString('nl-NL'),
    admin_signature: vars.admin_signature || 'Namens Vlottr (Buddy BV)',
    partner_signature: vars.partner_signature || 'Nog niet ondertekend',
  };
  let html = AUTO_INKOOP_CONTRACT_TEMPLATE;
  Object.entries(variables).forEach(([key, value]) => {
    html = html.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  return html;
};

const AdminPartners: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    pendingPartners,
    allPartners,
    serviceChangeRequests,
    fetchPendingPartners,
    fetchAllPartners,
    approvePartner,
    rejectPartner,
    fetchServiceChangeRequests,
    approveServiceChangeRequest,
    rejectServiceChangeRequest,
    loading: storeLoading,
  } = usePartnerStore();
  const { settings, loadSettings } = useSettingsStore();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'wizard' ? 'wizard' : tabParam === 'pending' ? 'pending' : tabParam === 'changes' ? 'changes' : 'all';
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'wizard' | 'changes'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);
  const [rejectingChangeId, setRejectingChangeId] = useState<string | null>(null);
  const [changeRejectReason, setChangeRejectReason] = useState('');

  useEffect(() => {
    fetchPendingPartners();
    fetchAllPartners();
    fetchServiceChangeRequests();
    loadSettings();
  }, [fetchPendingPartners, fetchAllPartners, fetchServiceChangeRequests, loadSettings]);

  // Partners with incomplete wizard
  const incompleteWizardPartners = allPartners.filter(p => !p.onboarding_completed);

  // Pending service change requests
  const pendingChangeRequests = serviceChangeRequests.filter(r => r.status === 'pending');

  const handleSendPartnerWizardReminder = async (partner: User) => {
    if (!user) return;
    setSendingReminder(partner.uid);
    setError(null);

    try {
      const result = await sendPartnerWizardReminderEmail(
        partner.email,
        partner.name || 'Partner',
        partner.company_name || partner.name,
        user.name || 'Admin'
      );
      if (!result.success) throw new Error(result.error || 'Verzenden mislukt');

      await logActivity({
        user_id: user.uid,
        user_name: user.name,
        user_email: user.email,
        user_role: 'admin',
        action: 'send_wizard_reminder',
        description: `Partner wizard-herinnering verstuurd naar ${partner.company_name || partner.name} (${partner.email})`,
        entity_type: 'user',
        entity_id: partner.uid,
      });

      setReminderSuccess(partner.uid);
      setTimeout(() => setReminderSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Fout bij verzenden herinnering');
    } finally {
      setSendingReminder(null);
    }
  };

  const handleApprove = async (partner: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // Approve the partner — autocontracten worden aangemaakt per auto bij indiening
      await approvePartner(partner.uid, user.uid);

      await logActivity({
        user_id: user.uid,
        user_name: user.name,
        user_email: user.email,
        user_role: 'admin',
        action: 'approve_partner',
        description: `Partner ${partner.company_name || partner.name} goedgekeurd`,
        entity_type: 'user',
        entity_id: partner.uid,
      });

      setSuccess(`Partner ${partner.company_name || partner.name} goedgekeurd!`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (partner: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      await rejectPartner(partner.uid, user.uid);

      await logActivity({
        user_id: user.uid,
        user_name: user.name,
        user_email: user.email,
        user_role: 'admin',
        action: 'reject_partner',
        description: `Partner ${partner.company_name || partner.name} afgewezen`,
        entity_type: 'user',
        entity_id: partner.uid,
      });

      setSuccess(`Partner ${partner.company_name || partner.name} afgewezen.`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const generateContractHtml = (partner: User): string => {
    return generatePartnerContractHtml({
      partner_company: partner.company_name || partner.name,
      partner_name: partner.name,
      partner_email: partner.email,
      admin_signature: settings?.admin_signature_url
        ? `<img src="${settings.admin_signature_url}" alt="Vlottr handtekening" style="max-height: 70px;" />`
        : undefined,
    });
  };

  const getPartnerTypeBadge = (type?: string) => {
    switch (type) {
      case 'garage': return 'Autogarage';
      case 'dealer': return 'Autohandelaar';
      case 'both': return 'Garage & Handelaar';
      default: return 'Onbekend';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400"><CheckCircle className="w-3 h-3" /> Goedgekeurd</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400"><XCircle className="w-3 h-3" /> Afgewezen</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-400"><Clock className="w-3 h-3" /> In behandeling</span>;
    }
  };

  const renderPartnerRow = (partner: User, showActions: boolean) => (
    <div key={partner.uid} className="vl-card rounded-xl overflow-hidden">
      <button
        onClick={() => setExpandedPartner(expandedPartner === partner.uid ? null : partner.uid)}
        className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        {/* Logo / Avatar */}
        <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {partner.company_logo ? (
            <img src={partner.company_logo} alt="" className="w-full h-full object-contain p-1" />
          ) : (
            <Building2 className="w-6 h-6 text-green-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{partner.company_name || partner.name}</h3>
          <p className="text-neutral-500 text-sm truncate">{partner.email} &middot; {getPartnerTypeBadge(partner.partner_type)}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {getStatusBadge(partner.verification_status)}

          {/* Mail knop */}
          <button
            onClick={e => {
              e.stopPropagation();
              const name = encodeURIComponent(partner.company_name || partner.name);
              navigate(`/admin/email-tool?to=${encodeURIComponent(partner.email)}&name=${name}`);
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
            title={`Mail sturen naar ${partner.email}`}
          >
            <Mail className="w-4 h-4" />
          </button>

          {/* Bel knop */}
          {(partner.company_phone || partner.phone) && (
            <a
              href={`tel:${partner.company_phone || partner.phone}`}
              onClick={e => e.stopPropagation()}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
              title={`Bellen: ${partner.company_phone || partner.phone}`}
            >
              <Phone className="w-4 h-4" />
            </a>
          )}

          <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${expandedPartner === partner.uid ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expandedPartner === partner.uid && (
        <div className="px-5 pb-5 border-t border-white/[0.06]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 text-sm">
            <div>
              <span className="text-neutral-500">Contactpersoon</span>
              <p className="text-white">{partner.name}</p>
            </div>
            <div>
              <span className="text-neutral-500">Telefoon</span>
              <p className="text-white">{partner.company_phone || partner.phone || '-'}</p>
            </div>
            <div>
              <span className="text-neutral-500">KVK</span>
              <p className="text-white">{partner.company_kvk || '-'}</p>
            </div>
            <div>
              <span className="text-neutral-500">Adres</span>
              <p className="text-white">{partner.company_address || '-'}</p>
            </div>
            <div>
              <span className="text-neutral-500">Aangemeld op</span>
              <p className="text-white">{new Date(partner.created_at).toLocaleDateString('nl-NL')}</p>
            </div>
          </div>

          {showActions && partner.verification_status === 'pending' && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleApprove(partner)}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-neutral-950 font-bold rounded-lg hover:bg-green-400 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Goedkeuren + Contract
              </button>
              <button
                onClick={() => handleReject(partner)}
                disabled={loading}
                className="px-4 py-2 bg-red-500/10 text-red-400 font-semibold rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Afwijzen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Partnerbeheer"
          subtitle={`${pendingPartners.length} aanvra${pendingPartners.length === 1 ? 'ag' : 'gen'} in behandeling`}
          icon={Handshake}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-4xl mx-auto">

            {error && (
              <div className="rounded-xl px-4 py-3 mb-4 border border-red-500/20" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-xl px-4 py-3 mb-4 border border-green-500/20" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                <span className="text-green-400 text-sm">{success}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {([
                { id: 'all', icon: <List className="w-4 h-4" />, label: 'Alle partners', badge: allPartners.length },
                { id: 'pending', icon: <Clock className="w-4 h-4" />, label: 'In behandeling', badge: pendingPartners.length },
                { id: 'wizard', icon: <AlertTriangle className="w-4 h-4" />, label: 'Wizard niet voltooid', badge: incompleteWizardPartners.length },
                { id: 'changes', icon: <RefreshCw className="w-4 h-4" />, label: 'Wijzigingen', badge: pendingChangeRequests.length },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                    activeTab === tab.id
                      ? 'bg-green-500 text-neutral-950 border-green-500'
                      : 'text-neutral-400 hover:text-white border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                      activeTab === tab.id ? 'bg-neutral-950/20 text-neutral-950' : 'bg-white/10 text-white'
                    }`}>{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="space-y-4">
              {activeTab === 'all' ? (
                allPartners.length === 0 ? (
                  <div className="vl-card rounded-xl p-12 text-center">
                    <Handshake className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Nog geen partners</h3>
                    <p className="text-neutral-500 text-sm">Er zijn nog geen partners geregistreerd.</p>
                  </div>
                ) : (
                  allPartners.map(p => renderPartnerRow(p, p.verification_status === 'pending'))
                )
              ) : activeTab === 'pending' ? (
                pendingPartners.length === 0 ? (
                  <div className="vl-card rounded-xl p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-400/30 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Geen openstaande aanvragen</h3>
                    <p className="text-neutral-500 text-sm">Alle partneraanvragen zijn afgehandeld.</p>
                  </div>
                ) : (
                  pendingPartners.map(p => renderPartnerRow(p, true))
                )
              ) : activeTab === 'wizard' ? (
                incompleteWizardPartners.length === 0 ? (
                  <div className="vl-card rounded-xl p-12 text-center">
                    <UserCheck className="w-12 h-12 text-green-400/30 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Alle partners hebben de wizard voltooid</h3>
                    <p className="text-neutral-500 text-sm">Er zijn geen partners met een onvoltooide registratie.</p>
                  </div>
                ) : (
                  incompleteWizardPartners.map(p => (
                    <div key={p.uid} className="vl-card rounded-xl border border-pink-500/20 overflow-hidden">
                      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {p.company_logo ? (
                            <img src={p.company_logo} alt="" className="w-full h-full object-contain p-1" />
                          ) : (
                            <Building2 className="w-6 h-6 text-pink-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate">{p.company_name || p.name}</h3>
                          <p className="text-neutral-500 text-sm truncate">{p.email} &middot; {p.name}</p>
                          <p className="text-neutral-600 text-xs mt-0.5">
                            Aangemeld: {new Date(p.created_at).toLocaleDateString('nl-NL')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Mail knop */}
                          <button
                            onClick={() => {
                              const name = encodeURIComponent(p.company_name || p.name);
                              navigate(`/admin/email-tool?to=${encodeURIComponent(p.email)}&name=${name}`);
                            }}
                            className="p-2 rounded-lg text-neutral-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                            title={`Mail sturen naar ${p.email}`}
                          >
                            <Mail className="w-4 h-4" />
                          </button>

                          {/* Bel knop */}
                          {(p.company_phone || p.phone) && (
                            <a
                              href={`tel:${p.company_phone || p.phone}`}
                              className="p-2 rounded-lg text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title={`Bellen: ${p.company_phone || p.phone}`}
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            onClick={() => handleSendPartnerWizardReminder(p)}
                            disabled={sendingReminder === p.uid || reminderSuccess === p.uid}
                            className={`px-3 py-2 text-sm rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                              reminderSuccess === p.uid
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-pink-500 text-white hover:bg-pink-400'
                            } disabled:opacity-60`}
                          >
                            {sendingReminder === p.uid ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Verzenden...</>
                            ) : reminderSuccess === p.uid ? (
                              <><UserCheck className="w-4 h-4" /> Verstuurd!</>
                            ) : (
                              <><Send className="w-4 h-4" /> Stuur herinnering</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : activeTab === 'changes' ? (
                pendingChangeRequests.length === 0 ? (
                  <div className="vl-card rounded-xl p-12 text-center">
                    <RefreshCw className="w-12 h-12 text-green-400/30 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Geen openstaande wijzigingen</h3>
                    <p className="text-neutral-500 text-sm">Er zijn geen wijzigingsverzoeken in behandeling.</p>
                  </div>
                ) : (
                  pendingChangeRequests.map(req => (
                    <div key={req.id} className="vl-card rounded-xl border border-blue-500/20 overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <RefreshCw className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold">{req.partner_name}</h3>
                            <p className="text-neutral-500 text-sm">{req.partner_company}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-400">
                            <Clock className="w-3 h-3" /> In behandeling
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-neutral-500 text-xs block mb-1">Type wijziging</span>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="px-2 py-0.5 rounded-md bg-white/5 text-neutral-300 border border-white/[0.08]">
                                {getPartnerTypeBadge(req.current_partner_type)}
                              </span>
                              <span className="text-neutral-500">&rarr;</span>
                              <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
                                {getPartnerTypeBadge(req.requested_partner_type)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-neutral-500 text-xs block mb-1">Onderhoud aanbieden</span>
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`px-2 py-0.5 rounded-md border ${req.current_offers_maintenance ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-neutral-300 border-white/[0.08]'}`}>
                                {req.current_offers_maintenance ? 'Ja' : 'Nee'}
                              </span>
                              <span className="text-neutral-500">&rarr;</span>
                              <span className={`px-2 py-0.5 rounded-md border ${req.requested_offers_maintenance ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-neutral-300 border-white/[0.08]'}`}>
                                {req.requested_offers_maintenance ? 'Ja' : 'Nee'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {req.reason && (
                          <div className="mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                            <span className="text-neutral-500 text-xs block mb-1">Reden</span>
                            <p className="text-neutral-300 text-sm">{req.reason}</p>
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={async () => {
                              if (!user) return;
                              setLoading(true);
                              try {
                                await approveServiceChangeRequest(req.id, user.uid);
                                setSuccess('Wijzigingsverzoek goedgekeurd!');
                                setTimeout(() => setSuccess(null), 5000);
                              } catch (err: any) {
                                setError(err.message || 'Fout bij goedkeuren');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                            className="px-4 py-2 bg-green-500 text-neutral-950 font-bold rounded-lg hover:bg-green-400 transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Goedkeuren
                          </button>

                          {rejectingChangeId === req.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={changeRejectReason}
                                onChange={e => setChangeRejectReason(e.target.value)}
                                placeholder="Reden van afwijzing..."
                                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-red-500/50"
                              />
                              <button
                                onClick={async () => {
                                  if (!user || !changeRejectReason.trim()) return;
                                  setLoading(true);
                                  try {
                                    await rejectServiceChangeRequest(req.id, user.uid, changeRejectReason.trim());
                                    setSuccess('Wijzigingsverzoek afgewezen.');
                                    setRejectingChangeId(null);
                                    setChangeRejectReason('');
                                    setTimeout(() => setSuccess(null), 5000);
                                  } catch (err: any) {
                                    setError(err.message || 'Fout bij afwijzen');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                disabled={loading || !changeRejectReason.trim()}
                                className="px-3 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-400 transition-all disabled:opacity-50 text-sm"
                              >
                                Bevestig
                              </button>
                              <button
                                onClick={() => { setRejectingChangeId(null); setChangeRejectReason(''); }}
                                className="px-3 py-2 text-neutral-400 hover:text-white transition-colors text-sm"
                              >
                                Annuleer
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRejectingChangeId(req.id)}
                              disabled={loading}
                              className="px-4 py-2 bg-red-500/10 text-red-400 font-semibold rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Afwijzen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : null}
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminPartners;
